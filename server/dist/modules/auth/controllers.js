"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = __importDefault(require("../../config/env"));
const prisma_1 = require("../../db/prisma");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const auth_utils_1 = __importDefault(require("../../utils/auth-utils"));
const queueActions_1 = __importDefault(require("../queue/queueActions"));
const redisClient_1 = require("../../config/redisClient");
const http_status_codes_1 = require("http-status-codes");
const logger_1 = __importDefault(require("../../utils/logger"));
const emailTemplates_1 = __importDefault(require("../../utils/emailTemplates"));
const argon2_1 = __importDefault(require("argon2"));
const crypto_1 = __importDefault(require("crypto"));
const bloomFilter_1 = require("../../config/bloomFilter");
const otplib_1 = require("otplib");
const qrcode_1 = __importDefault(require("qrcode"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const REFRESH_TOKEN_EXPIRY_MS = 15 * 24 * 60 * 60 * 1000;
const ACCESS_COOKIE_EXPIRY_MS = 15 * 60 * 1000;
const cookieOptions = {
    httpOnly: true,
    secure: env_1.default.IS_PRODUCTION === 1,
    sameSite: env_1.default.IS_PRODUCTION === 1 ? "none" : "lax",
};
const controllers = {
    sendOtpForAccountCreation: async (req, res) => {
        try {
            const { email } = req.body;
            const existingUserCount = await prisma_1.prisma.user.count({
                where: { email },
            });
            if (existingUserCount > 0) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "An account with this email already exists.",
                    statusCode: http_status_codes_1.StatusCodes.CONFLICT,
                });
            }
            const isVerified = await redisClient_1.redisClient.get(`verified:upcoming-emails:${email}`);
            if (isVerified) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "This email has already been verified for account creation.",
                    statusCode: http_status_codes_1.StatusCodes.CONFLICT,
                });
            }
            const otp = auth_utils_1.default.generateOtp();
            const redisPayload = JSON.stringify({ otp, failedAttempts: 0 });
            await redisClient_1.redisClient.set(`otp:upcoming-emails:${email}`, redisPayload, { EX: 10 * 60 });
            queueActions_1.default.addEmailToQueue({
                from: env_1.default.SENDER_EMAIL,
                to: email,
                subject: "Your OTP for Account Creation",
                htmlContent: emailTemplates_1.default.getAccountCreationEmail(otp),
            });
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "OTP sent to your email for account creation.",
                statusCode: http_status_codes_1.StatusCodes.OK,
            });
        }
        catch (error) {
            logger_1.default.error("Error in sendOtpForAccountCreation:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to send OTP. Please try again later.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    verifyAccountCreationOtp: async (req, res) => {
        const { email, otp } = req.body;
        const redisKey = `otp:upcoming-emails:${email}`;
        const verifiedKey = `verified:upcoming-emails:${email}`;
        try {
            const [savedInfo, verifiedStatus] = await Promise.all([
                redisClient_1.redisClient.get(redisKey),
                redisClient_1.redisClient.get(verifiedKey),
            ]);
            if (verifiedStatus) {
                return (0, sendResponse_1.default)(res, {
                    success: true,
                    message: "Email already verified for account creation.",
                    statusCode: http_status_codes_1.StatusCodes.OK,
                });
            }
            const parsedInfo = savedInfo ? JSON.parse(savedInfo) : null;
            if (!parsedInfo || Object.keys(parsedInfo).length === 0 || !parsedInfo.otp) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "OTP has expired or does not exist. Please request a new one.",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            if (parsedInfo.otp !== otp) {
                const newAttempts = parsedInfo.failedAttempts + 1;
                if (newAttempts >= 5) {
                    redisClient_1.redisClient.del(redisKey).catch((error) => {
                        logger_1.default.error("Error deleting OTP after max attempts:");
                        logger_1.default.error(error);
                    });
                    return (0, sendResponse_1.default)(res, {
                        success: false,
                        message: "Maximum OTP verification attempts exceeded. Please request a new OTP.",
                        statusCode: http_status_codes_1.StatusCodes.TOO_MANY_REQUESTS,
                    });
                }
                else {
                    const updatedPayload = JSON.stringify({
                        otp: parsedInfo.otp,
                        failedAttempts: newAttempts,
                    });
                    await redisClient_1.redisClient.set(redisKey, updatedPayload, { KEEPTTL: true });
                    return (0, sendResponse_1.default)(res, {
                        success: false,
                        message: "Invalid OTP. Please try again.",
                        statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                    });
                }
            }
            else {
                const pipeline = redisClient_1.redisClient.multi();
                pipeline.del(redisKey);
                pipeline.set(verifiedKey, "1", { EX: 20 * 60 });
                await pipeline.exec();
                return (0, sendResponse_1.default)(res, {
                    success: true,
                    message: "OTP verified successfully.",
                    statusCode: http_status_codes_1.StatusCodes.OK,
                });
            }
        }
        catch (error) {
            logger_1.default.error("Error in verifyAccountCreationOtp:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to verify OTP. Please try again later.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    createAccount: async (req, res) => {
        const { email, password, firstName, lastName, username } = req.body;
        try {
            const ua = req.meta?.uaInfo;
            const geo = req.meta?.geoInfo;
            const ip = req.meta?.clientIp || "unknown";
            const newSessionId = crypto_1.default.randomUUID();
            const randomHex = crypto_1.default.randomBytes(48).toString("hex");
            const plainToken = `${newSessionId}.${randomHex}`;
            const [isVerified, existingUser, passwordHash, refreshTokenHash] = await Promise.all([
                redisClient_1.redisClient.get(`verified:upcoming-emails:${email}`),
                prisma_1.prisma.user.findFirst({
                    where: { OR: [{ email }, { username }] },
                    select: { id: true },
                }),
                argon2_1.default.hash(password),
                argon2_1.default.hash(plainToken),
            ]);
            if (!isVerified) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Email not verified for account creation.",
                    statusCode: http_status_codes_1.StatusCodes.FORBIDDEN,
                });
            }
            if (existingUser) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "An account with this email or username already exists.",
                    statusCode: http_status_codes_1.StatusCodes.CONFLICT,
                });
            }
            const newUser = await prisma_1.prisma.user.create({
                data: { email, passwordHash, firstName, lastName, username },
                select: { id: true, email: true, firstName: true, lastName: true, username: true },
            });
            await prisma_1.prisma.session.create({
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
            const accessToken = auth_utils_1.default.signAccess(newUser.id, newSessionId);
            Promise.all([
                redisClient_1.redisClient.del(`verified:upcoming-emails:${email}`),
                queueActions_1.default.addEmailToQueue({
                    from: env_1.default.SENDER_EMAIL,
                    to: email,
                    subject: "Welcome to Dokit!",
                    htmlContent: emailTemplates_1.default.getWelcomeEmail(firstName, lastName),
                }),
                bloomFilter_1.userNameBloomFilter.addUsername(username),
            ]).catch((err) => logger_1.default.error("Background task error", err));
            res.cookie("refreshToken", plainToken, {
                ...cookieOptions,
                maxAge: REFRESH_TOKEN_EXPIRY_MS,
            });
            res.cookie("accessToken", accessToken, {
                ...cookieOptions,
                maxAge: ACCESS_COOKIE_EXPIRY_MS,
            });
            await redisClient_1.redisClient.set(`session:${newSessionId}`, "true", {
                EX: 15 * 60,
            });
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Account created successfully.",
                statusCode: http_status_codes_1.StatusCodes.CREATED,
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
        }
        catch (error) {
            logger_1.default.error("Error in signUp:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to create account.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    signIn: async (req, res) => {
        const { email, password } = req.body;
        try {
            const ua = req.meta?.uaInfo;
            const geo = req.meta?.geoInfo;
            const ip = req.meta?.clientIp || "unknown";
            const user = await prisma_1.prisma.user.findFirst({
                where: { email },
                select: {
                    id: true,
                    email: true,
                    passwordHash: true,
                    twoFactorEnabled: true,
                    signInEmailEnabled: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                },
            });
            if (!user) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Invalid email or password.",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            const newSessionId = crypto_1.default.randomUUID();
            const randomHex = crypto_1.default.randomBytes(48).toString("hex");
            const plainToken = `${newSessionId}.${randomHex}`;
            const [isPasswordValid, refreshTokenHash] = await Promise.all([
                argon2_1.default.verify(user.passwordHash, password),
                argon2_1.default.hash(plainToken),
            ]);
            if (!isPasswordValid) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Invalid email or password.",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            if (user.twoFactorEnabled) {
                const preAuthToken = jsonwebtoken_1.default.sign({ id: user.id, isPreAuth: true }, env_1.default.JWT_SECRET, { expiresIn: "5m" });
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "2FA required. Please verify the OTP from your authenticator app.",
                    statusCode: http_status_codes_1.StatusCodes.OK,
                    data: {
                        requires2FA: true,
                        preAuthToken,
                    },
                });
            }
            const newSession = await prisma_1.prisma.session.create({
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
            const accessToken = auth_utils_1.default.signAccess(user.id, newSessionId);
            res.cookie("refreshToken", plainToken, {
                ...cookieOptions,
                maxAge: REFRESH_TOKEN_EXPIRY_MS,
            });
            res.cookie("accessToken", accessToken, {
                ...cookieOptions,
                maxAge: ACCESS_COOKIE_EXPIRY_MS,
            });
            await redisClient_1.redisClient.set(`session:${newSessionId}`, "true", {
                EX: 15 * 60,
            });
            if (user.signInEmailEnabled) {
                const revokePayload = {
                    sessionId: newSessionId,
                    purpose: "revoke-session",
                };
                const revokeToken = jsonwebtoken_1.default.sign(revokePayload, env_1.default.JWT_SECRET, {
                    expiresIn: "24h",
                });
                const frontEndUrl = `${env_1.default.FRONTEND_URL}/secure-revoke?token=${revokeToken}`;
                const session = {
                    ...newSession,
                    device: newSession.device,
                    browser: newSession.browser,
                    os: newSession.os,
                };
                queueActions_1.default.addEmailToQueue({
                    from: env_1.default.SENDER_EMAIL,
                    to: user.email,
                    subject: "New Sign-In Detected",
                    htmlContent: emailTemplates_1.default.signinEmail(session, frontEndUrl),
                });
            }
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Signed in successfully.",
                statusCode: http_status_codes_1.StatusCodes.OK,
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
        }
        catch (error) {
            logger_1.default.error("Error in signIn:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to sign in.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    signOut: async (req, res) => {
        const sessionId = req.meta.user?.sessionId;
        try {
            if (sessionId) {
                await Promise.all([
                    prisma_1.prisma.session.deleteMany({
                        where: { id: sessionId },
                    }),
                    redisClient_1.redisClient.del(`session:${sessionId}`),
                ]);
            }
            res.clearCookie("accessToken", cookieOptions);
            res.clearCookie("refreshToken", cookieOptions);
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Logged out successfully.",
                statusCode: http_status_codes_1.StatusCodes.OK,
            });
        }
        catch (error) {
            logger_1.default.error("Error in logOut:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to log out.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    refreshSession: async (req, res) => {
        const oldRefreshToken = req.cookies?.refreshToken;
        try {
            const ua = req.meta?.uaInfo;
            const geo = req.meta?.geoInfo;
            const ip = req.meta?.clientIp || "unknown";
            if (!oldRefreshToken) {
                res.clearCookie("accessToken", cookieOptions);
                res.clearCookie("refreshToken", cookieOptions);
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Session does not exist. Please sign in again.",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const parts = oldRefreshToken.split(".");
            if (parts.length !== 2) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Invalid token format.",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const sessionId = parts[0];
            const session = await prisma_1.prisma.session.findFirst({
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
                res.clearCookie("accessToken", cookieOptions);
                res.clearCookie("refreshToken", cookieOptions);
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Invalid session. Please sign in again.",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            if (session.expiresAt < new Date(Date.now())) {
                res.clearCookie("accessToken", cookieOptions);
                res.clearCookie("refreshToken", cookieOptions);
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Session has expired. Please sign in again.",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const randomHex = crypto_1.default.randomBytes(48).toString("hex");
            const newPlainToken = `${session.id}.${randomHex}`;
            const [isTokenValid, newRefreshTokenHash] = await Promise.all([
                argon2_1.default.verify(session.refreshTokenHash, oldRefreshToken),
                argon2_1.default.hash(newPlainToken),
            ]);
            if (!isTokenValid) {
                res.clearCookie("accessToken", cookieOptions);
                res.clearCookie("refreshToken", cookieOptions);
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Invalid session. Please sign in again.",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            await prisma_1.prisma.session.update({
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
                    lastSeen: new Date(),
                },
            });
            const newAccessToken = auth_utils_1.default.signAccess(session.userId, session.id);
            res.cookie("refreshToken", newPlainToken, {
                ...cookieOptions,
                maxAge: REFRESH_TOKEN_EXPIRY_MS,
            });
            res.cookie("accessToken", newAccessToken, {
                ...cookieOptions,
                maxAge: ACCESS_COOKIE_EXPIRY_MS,
            });
            await redisClient_1.redisClient.set(`session:${sessionId}`, "true", {
                EX: 15 * 60,
            });
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Session refreshed successfully.",
                statusCode: http_status_codes_1.StatusCodes.OK,
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
        }
        catch (error) {
            logger_1.default.error("Error in refresh session:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to refresh session.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    sendOtpForPasswordReset: async (req, res) => {
        const { email } = req.body;
        try {
            const user = await prisma_1.prisma.user.findFirst({
                where: { email },
                select: { id: true },
            });
            if (!user) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "If an account with that email exists, an OTP has been sent.",
                    statusCode: http_status_codes_1.StatusCodes.OK,
                });
            }
            const otp = auth_utils_1.default.generateOtp();
            const redisPayload = JSON.stringify({ otp, failedAttempts: 0 });
            await redisClient_1.redisClient.set(`otp:password-reset:${email}`, redisPayload, { EX: 10 * 60 });
            queueActions_1.default.addEmailToQueue({
                from: env_1.default.SENDER_EMAIL,
                to: email,
                subject: "Your OTP for Password Reset",
                htmlContent: emailTemplates_1.default.getPasswordResetEmail(otp),
            });
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "If an account with that email exists, an OTP has been sent.",
                statusCode: http_status_codes_1.StatusCodes.OK,
            });
        }
        catch (error) {
            logger_1.default.error("Error in sendOtpForPasswordReset:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to send OTP. Please try again later.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    verifyPasswordResetOtp: async (req, res) => {
        const { email, otp } = req.body;
        const redisKey = `otp:password-reset:${email}`;
        const verifiedKey = `verified:password-reset:${email}`;
        try {
            const [savedInfo, verifiedStatus] = await Promise.all([
                redisClient_1.redisClient.get(redisKey),
                redisClient_1.redisClient.get(verifiedKey),
            ]);
            if (verifiedStatus) {
                return (0, sendResponse_1.default)(res, {
                    success: true,
                    message: "Email already verified for password reset.",
                    statusCode: http_status_codes_1.StatusCodes.OK,
                });
            }
            const parsedInfo = savedInfo ? JSON.parse(savedInfo) : null;
            if (!parsedInfo || Object.keys(parsedInfo).length === 0 || !parsedInfo.otp) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "OTP has expired or does not exist. Please request a new one.",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            if (parsedInfo.otp !== otp) {
                const newAttempts = parsedInfo.failedAttempts + 1;
                if (newAttempts >= 5) {
                    redisClient_1.redisClient.del(redisKey).catch((error) => {
                        logger_1.default.error("Error deleting OTP after max attempts:");
                        logger_1.default.error(error);
                    });
                    return (0, sendResponse_1.default)(res, {
                        success: false,
                        message: "Maximum OTP verification attempts exceeded. Please request a new OTP.",
                        statusCode: http_status_codes_1.StatusCodes.TOO_MANY_REQUESTS,
                    });
                }
                else {
                    const updatedPayload = JSON.stringify({
                        otp: parsedInfo.otp,
                        failedAttempts: newAttempts,
                    });
                    await redisClient_1.redisClient.set(redisKey, updatedPayload, { KEEPTTL: true });
                    return (0, sendResponse_1.default)(res, {
                        success: false,
                        message: "Invalid OTP. Please try again.",
                        statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                    });
                }
            }
            else {
                const pipeline = redisClient_1.redisClient.multi();
                pipeline.del(redisKey);
                pipeline.set(verifiedKey, "1", { EX: 20 * 60 });
                await pipeline.exec();
                return (0, sendResponse_1.default)(res, {
                    success: true,
                    message: "OTP verified successfully.",
                    statusCode: http_status_codes_1.StatusCodes.OK,
                });
            }
        }
        catch (error) {
            logger_1.default.error("Error in verifyAccountCreationOtp:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to verify OTP. Please try again later.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    resetPassword: async (req, res) => {
        const { email, newPassword } = req.body;
        try {
            const isVerified = await redisClient_1.redisClient.get(`verified:password-reset:${email}`);
            if (!isVerified) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Email not verified for password reset.",
                    statusCode: http_status_codes_1.StatusCodes.FORBIDDEN,
                });
            }
            const newPasswordHash = await argon2_1.default.hash(newPassword);
            await prisma_1.prisma.user.updateMany({
                where: { email },
                data: { passwordHash: newPasswordHash },
            });
            redisClient_1.redisClient.del(`verified:password-reset:${email}`).catch((error) => {
                logger_1.default.error("Error deleting password reset verification key:");
                logger_1.default.error(error);
            });
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Password reset successfully.",
                statusCode: http_status_codes_1.StatusCodes.OK,
            });
        }
        catch (error) {
            logger_1.default.error("Error in resetPassword:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to reset password.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    isAuthenticated: async (req, res) => {
        const userId = req.meta.user?.id;
        try {
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "User is not authenticated.",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const user = await prisma_1.prisma.user.findFirst({
                where: { id: userId },
                select: { id: true, email: true, firstName: true, lastName: true, username: true },
            });
            if (!user) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "User is not authenticated.",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "User is authenticated.",
                statusCode: http_status_codes_1.StatusCodes.OK,
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
        }
        catch (error) {
            logger_1.default.error("Error in isAuthenticated:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to verify authentication.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    isUsernameAvailable: async (req, res) => {
        try {
            const { username } = req.body;
            const normalizedUsername = username.trim();
            if (normalizedUsername.length === 0) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Username cannot be empty.",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                    data: { available: false },
                });
            }
            const mightExist = await bloomFilter_1.userNameBloomFilter.mightExist(normalizedUsername);
            if (!mightExist) {
                return (0, sendResponse_1.default)(res, {
                    success: true,
                    message: "Username is available.",
                    statusCode: http_status_codes_1.StatusCodes.OK,
                    data: { available: true },
                });
            }
            const existingUser = await prisma_1.prisma.user.findFirst({
                where: { username: normalizedUsername },
                select: { id: true },
            });
            if (existingUser) {
                return (0, sendResponse_1.default)(res, {
                    success: true,
                    message: "Username is already taken.",
                    statusCode: http_status_codes_1.StatusCodes.OK,
                    data: { available: false },
                });
            }
            else {
                return (0, sendResponse_1.default)(res, {
                    success: true,
                    message: "Username is available.",
                    statusCode: http_status_codes_1.StatusCodes.OK,
                    data: { available: true },
                });
            }
        }
        catch (error) {
            logger_1.default.error("Error in isUsernameAvailable:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to check username availability.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    toggle2FA: async (req, res) => {
        try {
            const { password } = req.body;
            const userId = req.meta.user?.id;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "User is not authenticated.",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const user = await prisma_1.prisma.user.findFirst({
                where: { id: userId },
                select: {
                    id: true,
                    username: true,
                    twoFactorEnabled: true,
                    passwordHash: true,
                    twoFactorSecret: true,
                },
            });
            if (!user) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "User not found.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            const isPasswordValid = await argon2_1.default.verify(user.passwordHash, password);
            if (!isPasswordValid) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Invalid password.",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            if (user.twoFactorEnabled) {
                await prisma_1.prisma.user.update({
                    where: { id: userId },
                    data: { twoFactorEnabled: false, twoFactorSecret: null, backupCodes: [] },
                });
                return (0, sendResponse_1.default)(res, {
                    success: true,
                    message: `Two-factor authentication disabled successfully.`,
                    statusCode: http_status_codes_1.StatusCodes.OK,
                });
            }
            const secret = (0, otplib_1.generateSecret)();
            const encryptedSecret = auth_utils_1.default.encryptSecret(secret);
            const otpauthUrl = (0, otplib_1.generateURI)({
                secret: secret,
                issuer: "Dokit",
                label: `${user.username} (${new Date().toLocaleDateString()}`,
            });
            await prisma_1.prisma.user.update({
                where: { id: userId },
                data: { twoFactorSecret: encryptedSecret },
            });
            const qrCodeImage = await qrcode_1.default.toDataURL(otpauthUrl);
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "2FA setup generated. Please verify the code to complete enablement.",
                statusCode: http_status_codes_1.StatusCodes.OK,
                data: {
                    qrCode: qrCodeImage,
                    manualSecret: secret,
                },
            });
        }
        catch (error) {
            logger_1.default.error("Error in enable2FA:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to enable two-factor authentication.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    verify2FAsetup: async (req, res) => {
        try {
            const userId = req.meta.user?.id;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "User is not authenticated.",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const { token } = req.body;
            const user = await prisma_1.prisma.user.findFirst({
                where: { id: userId },
                select: { id: true, twoFactorEnabled: true, twoFactorSecret: true },
            });
            if (!user || !user.twoFactorSecret) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "2FA setup not initialized.",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            const cleanToken = String(token).trim();
            const plainTextSecret = auth_utils_1.default.decryptSecret(user.twoFactorSecret);
            const isValid = await (0, otplib_1.verifySync)({
                token: cleanToken,
                secret: plainTextSecret,
                epochTolerance: 500,
            });
            if (!isValid.valid) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Invalid 2FA OTP.",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            const backupCodes = Array.from({ length: 10 }).map(() => crypto_1.default.randomBytes(4).toString("hex").toUpperCase());
            const hashedBackupCodes = await Promise.all(backupCodes.map((code) => argon2_1.default.hash(code)));
            await prisma_1.prisma.user.update({
                where: { id: userId },
                data: {
                    twoFactorEnabled: true,
                    backupCodes: hashedBackupCodes,
                },
            });
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Two-factor authentication setup verified successfully.",
                data: {
                    backupCodes: backupCodes,
                },
                statusCode: http_status_codes_1.StatusCodes.OK,
            });
        }
        catch (error) {
            logger_1.default.error("Error in verify2FAsetup:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to verify two-factor authentication setup.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    regenerateBackupCodes: async (req, res) => {
        try {
            const userId = req.meta.user?.id;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "User is not authenticated.",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const { password } = req.body;
            const user = await prisma_1.prisma.user.findFirst({
                where: { id: userId },
                select: { id: true, twoFactorEnabled: true, passwordHash: true },
            });
            if (!user) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "User not found.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            if (!user.twoFactorEnabled) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Two-factor authentication is not enabled.",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            const isPasswordValid = await argon2_1.default.verify(user.passwordHash, password);
            if (!isPasswordValid) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Invalid password.",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            const newBackupCodes = Array.from({ length: 10 }).map(() => crypto_1.default.randomBytes(4).toString("hex").toUpperCase());
            const hashednewBackupCodes = await Promise.all(newBackupCodes.map((code) => argon2_1.default.hash(code)));
            await prisma_1.prisma.user.update({
                where: { id: userId },
                data: {
                    backupCodes: hashednewBackupCodes,
                },
            });
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Backup codes regenerated successfully.",
                data: {
                    backupCodes: newBackupCodes,
                },
                statusCode: http_status_codes_1.StatusCodes.OK,
            });
        }
        catch (error) {
            logger_1.default.error("Error in regenerateBackupCodes:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to regenerate backup codes.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    verify2FAForSignIn: async (req, res) => {
        try {
            const { preAuthToken, token, code } = req.body;
            const ua = req.meta?.uaInfo;
            const geo = req.meta?.geoInfo;
            const ip = req.meta?.clientIp || "unknown";
            if (!preAuthToken) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Pre-auth token is required.",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            let decoded;
            try {
                decoded = jsonwebtoken_1.default.verify(preAuthToken, env_1.default.JWT_SECRET);
            }
            catch (error) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Your login session has expired or Invalid session. Please enter your email and password again.",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            if (!decoded || !decoded.isPreAuth || !decoded.id) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Invalid pre-auth token.",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            const user = await prisma_1.prisma.user.findFirst({
                where: { id: decoded.id },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    twoFactorEnabled: true,
                    backupCodes: true,
                    twoFactorSecret: true,
                },
            });
            if (!user) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "User not found.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            if (!user.twoFactorEnabled || !user.twoFactorSecret) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "2FA is not properly set up for this account.",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            let isAuthenticated = false;
            let isRunningLowOnBackupCodes = false;
            if (token) {
                const plainTextSecret = auth_utils_1.default.decryptSecret(user.twoFactorSecret);
                const res = await (0, otplib_1.verify)({
                    token: token,
                    secret: plainTextSecret,
                });
                isAuthenticated = res.valid;
            }
            else if (code) {
                let matchedIndex = -1;
                const totalLen = user.backupCodes.length;
                for (let i = 0; i < totalLen; i++) {
                    const isValid = await argon2_1.default.verify(user.backupCodes[i], code);
                    if (isValid) {
                        matchedIndex = i;
                        break;
                    }
                }
                if (matchedIndex !== -1) {
                    isAuthenticated = true;
                    const updatedBackupCodes = [...user.backupCodes];
                    updatedBackupCodes.splice(matchedIndex, 1);
                    isRunningLowOnBackupCodes = updatedBackupCodes.length <= 2;
                    await prisma_1.prisma.user.update({
                        where: { id: user.id },
                        data: {
                            backupCodes: updatedBackupCodes,
                        },
                    });
                }
            }
            if (!isAuthenticated) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: `Invalid 2FA ${token ? "OTP" : "backup code"}`,
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            const newSessionId = crypto_1.default.randomUUID();
            const randomHex = crypto_1.default.randomBytes(48).toString("hex");
            const plainToken = `${newSessionId}.${randomHex}`;
            const refreshTokenHash = await argon2_1.default.hash(plainToken);
            await prisma_1.prisma.session.create({
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
            const accessToken = auth_utils_1.default.signAccess(user.id, newSessionId);
            res.cookie("refreshToken", plainToken, {
                ...cookieOptions,
                maxAge: REFRESH_TOKEN_EXPIRY_MS,
            });
            res.cookie("accessToken", accessToken, {
                ...cookieOptions,
                maxAge: ACCESS_COOKIE_EXPIRY_MS,
            });
            await redisClient_1.redisClient.set(`session:${newSessionId}`, "true", {
                EX: 15 * 60,
            });
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Signed in successfully.",
                statusCode: http_status_codes_1.StatusCodes.OK,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        username: user.username,
                    },
                    warning: isRunningLowOnBackupCodes
                        ? "You are running low on backup codes. Please regenerate them from your account settings."
                        : undefined,
                },
            });
        }
        catch (error) {
            logger_1.default.error("Error in verify2FAForSignIn:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to verify 2FA for sign-in.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    emergencyRevokeSession: async (req, res) => {
        try {
            const { token } = req.body;
            let decoded;
            try {
                decoded = jsonwebtoken_1.default.verify(token, env_1.default.JWT_SECRET);
            }
            catch (error) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "This link is invalid or has expired.",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            if (!decoded || decoded.purpose !== "revoke-session" || !decoded.sessionId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "This link is invalid.",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            try {
                await Promise.all([
                    prisma_1.prisma.session.delete({ where: { id: decoded.sessionId } }),
                    redisClient_1.redisClient.del(`session:${decoded.sessionId}`),
                ]);
            }
            catch (error) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Session already revoked or does not exist.",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Session revoked successfully.",
                statusCode: http_status_codes_1.StatusCodes.OK,
            });
        }
        catch (error) {
            logger_1.default.error("Error in emergencyRevokeSession:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to revoke session.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
};
exports.default = controllers;
