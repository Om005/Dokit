import type { Request, Response } from "express";
import { transporter, MailerOptions } from "@config/mailer";
import env from "@config/env";
import { prisma } from "@db/prisma";
import sendResponse from "@utils/sendResponse";
import authUtils from "@utils/auth-utils";
import queueActions from "@modules/queue/queue-actions";
import { redisClient } from "@config/redisClient";
import { StatusCodes } from "http-status-codes";
import logger from "@utils/logger";
import emailTemplates from "@utils/emailTemplates";
import argon2 from "argon2";
import types from "./types";
import crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import { userNameBloomFilter } from "@config/bloomFilter";

const REFRESH_TOKEN_EXPIRY_MS = 15 * 24 * 60 * 60 * 1000;
const ACCESS_COOKIE_EXPIRY_MS = 15 * 60 * 1000;

const cookieOptions: types.cookieOptions = {
    httpOnly: true,
    secure: env.IS_PRODUCTION === 1,
    sameSite: env.IS_PRODUCTION === 1 ? "none" : "lax",
};

const controllers = {
    sendOtpForAccountCreation: async (req: Request, res: Response) => {
        try {
            const { email } = req.body;

            const existingUserCount = await prisma.user.count({
                where: { email },
            });

            if (existingUserCount > 0) {
                return sendResponse(res, {
                    success: false,
                    message: "An account with this email already exists.",
                    statusCode: StatusCodes.CONFLICT,
                });
            }

            const isVerified = await redisClient.get(`verified:upcoming-emails:${email}`);
            if (isVerified) {
                return sendResponse(res, {
                    success: false,
                    message: "This email has already been verified for account creation.",
                    statusCode: StatusCodes.CONFLICT,
                });
            }

            const otp = authUtils.generateOtp();

            const redisPayload = JSON.stringify({ otp, failedAttempts: 0 });
            await redisClient.set(`otp:upcoming-emails:${email}`, redisPayload, { EX: 10 * 60 });

            queueActions.addEmailToQueue({
                from: env.SENDER_EMAIL,
                to: email,
                subject: "Your OTP for Account Creation",
                htmlContent: emailTemplates.getAccountCreationEmail(otp),
            } as MailerOptions);

            return sendResponse(res, {
                success: true,
                message: "OTP sent to your email for account creation.",
                statusCode: StatusCodes.OK,
            });
        } catch (error) {
            logger.error("Error in sendOtpForAccountCreation:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to send OTP. Please try again later.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    verifyAccountCreationOtp: async (req: Request, res: Response) => {
        const { email, otp } = req.body;
        const redisKey = `otp:upcoming-emails:${email}`;
        const verifiedKey = `verified:upcoming-emails:${email}`;
        try {
            const [savedInfo, verifiedStatus] = await Promise.all([
                redisClient.get(redisKey),
                redisClient.get(verifiedKey),
            ]);
            if (verifiedStatus) {
                return sendResponse(res, {
                    success: true,
                    message: "Email already verified for account creation.",
                    statusCode: StatusCodes.OK,
                });
            }
            const parsedInfo = savedInfo ? JSON.parse(savedInfo) : null;

            if (!parsedInfo || Object.keys(parsedInfo).length === 0 || !parsedInfo.otp) {
                return sendResponse(res, {
                    success: false,
                    message: "OTP has expired or does not exist. Please request a new one.",
                    statusCode: StatusCodes.BAD_REQUEST,
                });
            }

            if (parsedInfo.otp !== otp) {
                const newAttempts = parsedInfo.failedAttempts + 1;
                if (newAttempts >= 5) {
                    redisClient.del(redisKey).catch((error) => {
                        logger.error("Error deleting OTP after max attempts:");
                        logger.error(error);
                    });
                    return sendResponse(res, {
                        success: false,
                        message:
                            "Maximum OTP verification attempts exceeded. Please request a new OTP.",
                        statusCode: StatusCodes.TOO_MANY_REQUESTS,
                    });
                } else {
                    const updatedPayload = JSON.stringify({
                        otp: parsedInfo.otp,
                        failedAttempts: newAttempts,
                    });
                    await redisClient.set(redisKey, updatedPayload, { KEEPTTL: true });
                    return sendResponse(res, {
                        success: false,
                        message: "Invalid OTP. Please try again.",
                        statusCode: StatusCodes.BAD_REQUEST,
                    });
                }
            } else {
                const pipeline = redisClient.multi();
                pipeline.del(redisKey);
                pipeline.set(verifiedKey, "1", { EX: 20 * 60 });
                await pipeline.exec();
                return sendResponse(res, {
                    success: true,
                    message: "OTP verified successfully.",
                    statusCode: StatusCodes.OK,
                });
            }
        } catch (error) {
            logger.error("Error in verifyAccountCreationOtp:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to verify OTP. Please try again later.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    createAccount: async (req: Request, res: Response) => {
        const { email, password, firstName, lastName, username } = req.body;

        try {
            const ua = req.meta?.uaInfo;
            const geo = req.meta?.geoInfo;
            const ip = req.meta?.clientIp || "unknown";

            const newSessionId = crypto.randomUUID();
            const randomHex = crypto.randomBytes(48).toString("hex");
            const plainToken = `${newSessionId}.${randomHex}`;

            const [isVerified, existingUser, passwordHash, refreshTokenHash] = await Promise.all([
                redisClient.get(`verified:upcoming-emails:${email}`),
                prisma.user.findFirst({
                    where: { OR: [{ email }, { username }] },
                    select: { id: true },
                }),
                argon2.hash(password),
                argon2.hash(plainToken),
            ]);

            if (!isVerified) {
                return sendResponse(res, {
                    success: false,
                    message: "Email not verified for account creation.",
                    statusCode: StatusCodes.FORBIDDEN,
                });
            }

            if (existingUser) {
                return sendResponse(res, {
                    success: false,
                    message: "An account with this email or username already exists.",
                    statusCode: StatusCodes.CONFLICT,
                });
            }

            const newUser = await prisma.user.create({
                data: { email, passwordHash, firstName, lastName, username },
                select: { id: true, email: true, firstName: true, lastName: true, username: true },
            });

            await prisma.session.create({
                data: {
                    id: newSessionId,
                    userId: newUser.id,
                    refreshTokenHash: refreshTokenHash,
                    userAgent: req.headers["user-agent"] || "unknown",
                    ip: ip,
                    device: {
                        type: ua?.device?.type || "unknown",
                        model: ua?.device?.model || "unknown",
                    },
                    browser: {
                        name: ua?.browser?.name || "unknown",
                        version: ua?.browser?.version || "unknown",
                    },
                    os: {
                        name: ua?.os?.name || "unknown",
                        version: ua?.os?.version || "unknown",
                    },
                    city: geo?.city || "unknown",
                    region: geo?.region || "unknown",
                    country: geo?.country || "unknown",
                    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
                },
            });

            const accessToken = authUtils.signAccess(newUser.id, email, newSessionId);

            Promise.all([
                redisClient.del(`verified:upcoming-emails:${email}`),
                queueActions.addEmailToQueue({
                    from: env.SENDER_EMAIL,
                    to: email,
                    subject: "Welcome to Dokit!",
                    htmlContent: emailTemplates.getWelcomeEmail(firstName, lastName),
                } as MailerOptions),
                userNameBloomFilter.addUsername(username),
            ]).catch((err) => logger.error("Background task error", err));

            res.cookie("refreshToken", plainToken, {
                ...cookieOptions,
                maxAge: REFRESH_TOKEN_EXPIRY_MS,
            });

            res.cookie("accessToken", accessToken, {
                ...cookieOptions,
                maxAge: ACCESS_COOKIE_EXPIRY_MS,
            });

            return sendResponse(res, {
                success: true,
                message: "Account created successfully.",
                statusCode: StatusCodes.CREATED,
                data: {
                    user: {
                        id: newUser.id,
                        email: newUser.email,
                        firstName: newUser.firstName,
                        lastName: newUser.lastName,
                        username: newUser.username,
                    },
                },
            });
        } catch (error) {
            logger.error("Error in signUp:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to create account.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    signIn: async (req: Request, res: Response) => {
        const { email, password } = req.body;
        try {
            const ua = req.meta?.uaInfo;
            const geo = req.meta?.geoInfo;
            const ip = req.meta?.clientIp || "unknown";

            const user = await prisma.user.findFirst({
                where: { email },
                select: {
                    id: true,
                    email: true,
                    passwordHash: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                },
            });

            if (!user) {
                return sendResponse(res, {
                    success: false,
                    message: "Invalid email or password.",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }
            const newSessionId = crypto.randomUUID();
            const randomHex = crypto.randomBytes(48).toString("hex");
            const plainToken = `${newSessionId}.${randomHex}`;

            const [isPasswordValid, refreshTokenHash] = await Promise.all([
                argon2.verify(user.passwordHash, password),
                argon2.hash(plainToken),
            ]);
            if (!isPasswordValid) {
                return sendResponse(res, {
                    success: false,
                    message: "Invalid email or password.",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }

            await prisma.session.create({
                data: {
                    id: newSessionId,
                    userId: user.id,
                    refreshTokenHash: refreshTokenHash,
                    userAgent: req.headers["user-agent"] || "unknown",
                    ip: ip,
                    device: {
                        type: ua?.device?.type || "unknown",
                        model: ua?.device?.model || "unknown",
                    },
                    browser: {
                        name: ua?.browser?.name || "unknown",
                        version: ua?.browser?.version || "unknown",
                    },
                    os: {
                        name: ua?.os?.name || "unknown",
                        version: ua?.os?.version || "unknown",
                    },
                    city: geo?.city || "unknown",
                    region: geo?.region || "unknown",
                    country: geo?.country || "unknown",
                    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
                },
            });

            const accessToken = authUtils.signAccess(user.id, user.email, newSessionId);

            res.cookie("refreshToken", plainToken, {
                ...cookieOptions,
                maxAge: REFRESH_TOKEN_EXPIRY_MS,
            });

            res.cookie("accessToken", accessToken, {
                ...cookieOptions,
                maxAge: ACCESS_COOKIE_EXPIRY_MS,
            });

            return sendResponse(res, {
                success: true,
                message: "Signed in successfully.",
                statusCode: StatusCodes.OK,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        username: user.username,
                    },
                },
            });
        } catch (error) {
            logger.error("Error in signIn:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to sign in.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    signOut: async (req: Request, res: Response) => {
        const sessionId = req.meta.user?.sessionId;

        try {
            if (sessionId) {
                await prisma.session.deleteMany({
                    where: { id: sessionId },
                });
            }

            res.clearCookie("accessToken", cookieOptions);
            res.clearCookie("refreshToken", cookieOptions);

            return sendResponse(res, {
                success: true,
                message: "Logged out successfully.",
                statusCode: StatusCodes.OK,
            });
        } catch (error) {
            logger.error("Error in logOut:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to log out.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    refreshSession: async (req: Request, res: Response) => {
        const oldRefreshToken = req.cookies?.refreshToken;

        try {
            const ua = req.meta?.uaInfo;
            const geo = req.meta?.geoInfo;
            const ip = req.meta?.clientIp || "unknown";

            if (!oldRefreshToken) {
                return sendResponse(res, {
                    success: false,
                    message: "Session does not exist. Please sign in again.",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }

            const parts = oldRefreshToken.split(".");
            if (parts.length !== 2) {
                return sendResponse(res, {
                    success: false,
                    message: "Invalid token format.",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }
            const sessionId = parts[0];

            const session = await prisma.session.findFirst({
                where: { id: sessionId },
                select: {
                    id: true,
                    userId: true,
                    refreshTokenHash: true,
                    user: {
                        select: {
                            email: true,
                            id: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    expiresAt: true,
                },
            });

            if (!session) {
                return sendResponse(res, {
                    success: false,
                    message: "Invalid session. Please sign in again.",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }

            if (session.expiresAt < new Date(Date.now())) {
                return sendResponse(res, {
                    success: false,
                    message: "Session has expired. Please sign in again.",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }

            const randomHex = crypto.randomBytes(48).toString("hex");
            const newPlainToken = `${session.id}.${randomHex}`;

            const [isTokenValid, newRefreshTokenHash] = await Promise.all([
                argon2.verify(session.refreshTokenHash as string, oldRefreshToken),
                argon2.hash(newPlainToken),
            ]);
            if (!isTokenValid) {
                return sendResponse(res, {
                    success: false,
                    message: "Invalid session. Please sign in again.",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }

            await prisma.session.update({
                where: { id: sessionId },
                data: {
                    refreshTokenHash: newRefreshTokenHash,
                    ip,
                    device: {
                        type: ua?.device?.type || "unknown",
                        model: ua?.device?.model || "unknown",
                    },
                    browser: {
                        name: ua?.browser?.name || "unknown",
                        version: ua?.browser?.version || "unknown",
                    },
                    os: {
                        name: ua?.os?.name || "unknown",
                        version: ua?.os?.version || "unknown",
                    },
                    city: geo?.city || "unknown",
                    region: geo?.region || "unknown",
                    country: geo?.country || "unknown",
                },
            });

            const newAccessToken = authUtils.signAccess(
                session.userId,
                session.user.email,
                session.id
            );

            res.cookie("refreshToken", newPlainToken, {
                ...cookieOptions,
                maxAge: REFRESH_TOKEN_EXPIRY_MS,
            });

            res.cookie("accessToken", newAccessToken, {
                ...cookieOptions,
                maxAge: ACCESS_COOKIE_EXPIRY_MS,
            });

            return sendResponse(res, {
                success: true,
                message: "Session refreshed successfully.",
                statusCode: StatusCodes.OK,
                data: {
                    user: {
                        id: session.userId,
                        email: session.user.email,
                        firstName: session.user.firstName,
                        lastName: session.user.lastName,
                        username: session.user.username,
                    },
                },
            });
        } catch (error) {
            logger.error("Error in refresh session:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to refresh session.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    sendOtpForPasswordReset: async (req: Request, res: Response) => {
        const { email } = req.body;

        try {
            const user = await prisma.user.findFirst({
                where: { email },
                select: { id: true },
            });

            if (!user) {
                return sendResponse(res, {
                    success: false,
                    message: "If an account with that email exists, an OTP has been sent.",
                    statusCode: StatusCodes.OK,
                });
            }

            const otp = authUtils.generateOtp();

            const redisPayload = JSON.stringify({ otp, failedAttempts: 0 });
            await redisClient.set(`otp:password-reset:${email}`, redisPayload, { EX: 10 * 60 });

            queueActions.addEmailToQueue({
                from: env.SENDER_EMAIL,
                to: email,
                subject: "Your OTP for Password Reset",
                htmlContent: emailTemplates.getPasswordResetEmail(otp),
            } as MailerOptions);

            return sendResponse(res, {
                success: true,
                message: "If an account with that email exists, an OTP has been sent.",
                statusCode: StatusCodes.OK,
            });
        } catch (error) {
            logger.error("Error in sendOtpForPasswordReset:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to send OTP. Please try again later.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    verifyPasswordResetOtp: async (req: Request, res: Response) => {
        const { email, otp } = req.body;
        const redisKey = `otp:password-reset:${email}`;
        const verifiedKey = `verified:password-reset:${email}`;
        try {
            const [savedInfo, verifiedStatus] = await Promise.all([
                redisClient.get(redisKey),
                redisClient.get(verifiedKey),
            ]);
            if (verifiedStatus) {
                return sendResponse(res, {
                    success: true,
                    message: "Email already verified for password reset.",
                    statusCode: StatusCodes.OK,
                });
            }
            const parsedInfo = savedInfo ? JSON.parse(savedInfo) : null;

            if (!parsedInfo || Object.keys(parsedInfo).length === 0 || !parsedInfo.otp) {
                return sendResponse(res, {
                    success: false,
                    message: "OTP has expired or does not exist. Please request a new one.",
                    statusCode: StatusCodes.BAD_REQUEST,
                });
            }

            if (parsedInfo.otp !== otp) {
                const newAttempts = parsedInfo.failedAttempts + 1;
                if (newAttempts >= 5) {
                    redisClient.del(redisKey).catch((error) => {
                        logger.error("Error deleting OTP after max attempts:");
                        logger.error(error);
                    });
                    return sendResponse(res, {
                        success: false,
                        message:
                            "Maximum OTP verification attempts exceeded. Please request a new OTP.",
                        statusCode: StatusCodes.TOO_MANY_REQUESTS,
                    });
                } else {
                    const updatedPayload = JSON.stringify({
                        otp: parsedInfo.otp,
                        failedAttempts: newAttempts,
                    });
                    await redisClient.set(redisKey, updatedPayload, { KEEPTTL: true });
                    return sendResponse(res, {
                        success: false,
                        message: "Invalid OTP. Please try again.",
                        statusCode: StatusCodes.BAD_REQUEST,
                    });
                }
            } else {
                const pipeline = redisClient.multi();
                pipeline.del(redisKey);
                pipeline.set(verifiedKey, "1", { EX: 20 * 60 });
                await pipeline.exec();
                return sendResponse(res, {
                    success: true,
                    message: "OTP verified successfully.",
                    statusCode: StatusCodes.OK,
                });
            }
        } catch (error) {
            logger.error("Error in verifyAccountCreationOtp:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to verify OTP. Please try again later.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    resetPassword: async (req: Request, res: Response) => {
        const { email, newPassword } = req.body;

        try {
            const isVerified = await redisClient.get(`verified:password-reset:${email}`);
            if (!isVerified) {
                return sendResponse(res, {
                    success: false,
                    message: "Email not verified for password reset.",
                    statusCode: StatusCodes.FORBIDDEN,
                });
            }

            const newPasswordHash = await argon2.hash(newPassword);

            await prisma.user.updateMany({
                where: { email },
                data: { passwordHash: newPasswordHash },
            });

            redisClient.del(`verified:password-reset:${email}`).catch((error) => {
                logger.error("Error deleting password reset verification key:");
                logger.error(error);
            });

            return sendResponse(res, {
                success: true,
                message: "Password reset successfully.",
                statusCode: StatusCodes.OK,
            });
        } catch (error) {
            logger.error("Error in resetPassword:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to reset password.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    isAuthenticated: async (req: Request, res: Response) => {
        const userId = req.meta.user?.id;

        try {
            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    message: "User is not authenticated.",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }
            const user = await prisma.user.findFirst({
                where: { id: userId },
                select: { id: true, email: true, firstName: true, lastName: true, username: true },
            });
            if (!user) {
                return sendResponse(res, {
                    success: false,
                    message: "User is not authenticated.",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }
            return sendResponse(res, {
                success: true,
                message: "User is authenticated.",
                statusCode: StatusCodes.OK,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        username: user.username,
                    },
                },
            });
        } catch (error) {
            logger.error("Error in isAuthenticated:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to verify authentication.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    isUsernameAvailable: async (req: Request, res: Response) => {
        try {
            const { username } = req.body;
            const normalizedUsername = username.trim();

            if (normalizedUsername.length === 0) {
                return sendResponse(res, {
                    success: false,
                    message: "Username cannot be empty.",
                    statusCode: StatusCodes.BAD_REQUEST,
                });
            }

            const mightExist = await userNameBloomFilter.mightExist(normalizedUsername);

            if (!mightExist) {
                return sendResponse(res, {
                    success: true,
                    message: "Username is available.",
                    statusCode: StatusCodes.OK,
                    data: { available: true },
                });
            }

            const existingUser = await prisma.user.findFirst({
                where: { username: normalizedUsername },
                select: { id: true },
            });

            if (existingUser) {
                return sendResponse(res, {
                    success: true,
                    message: "Username is already taken.",
                    statusCode: StatusCodes.OK,
                    data: { available: false },
                });
            } else {
                return sendResponse(res, {
                    success: true,
                    message: "Username is available.",
                    statusCode: StatusCodes.OK,
                    data: { available: true },
                });
            }
        } catch (error) {
            logger.error("Error in isUsernameAvailable:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to check username availability.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
};

export default controllers;
