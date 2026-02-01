import type { Request, Response } from "express";
import { transporter, MailerOptions } from "@config/mailer";
import env from "@config/env";
import validators from "./validators";
import { prisma } from "@db/prisma";
import sendResponse from "@utils/sendResponse";
import generateOtp from "@utils/generateOtp";
import queueActions from "@modules/queue/queue-actions";
import { redisClient } from "@config/redisClient";
import { StatusCodes } from "http-status-codes";
import logger from "@utils/logger";
import emailTemplates from "@utils/emailTemplates";
import argon2 from "argon2";

const controllers = {
    sendOtpForAccountCreation: async (req: Request, res: Response) => {
        try {
            const { email } = req.body;

            const userCount = await prisma.user.count({
                where: { email },
            });

            if (userCount > 0) {
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

            const otp = generateOtp();

            await Promise.all([
                redisClient.hSet(`otp:upcoming-emails:${email}`, {
                    otp: otp,
                    failedAttempts: "0",
                }),
                redisClient.expire(`otp:upcoming-emails:${email}`, 10 * 60),

                queueActions.addEmailToQueue({
                    from: env.SENDER_EMAIL,
                    to: email,
                    subject: "Your OTP for Account Creation",
                    htmlContent: emailTemplates.getAccountCreationEmail(otp),
                }),
            ]);

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
            const savedInfo = await redisClient.hGetAll(redisKey);

            if (!savedInfo || Object.keys(savedInfo).length === 0 || !savedInfo.otp) {
                return sendResponse(res, {
                    success: false,
                    message: "OTP has expired or does not exist. Please request a new one.",
                    statusCode: StatusCodes.BAD_REQUEST,
                });
            }

            if (savedInfo.otp !== otp) {
                savedInfo.failedAttempts += 1;

                const newAttempts = await redisClient.hIncrBy(redisKey, "failedAttempts", 1);
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

    signUp: async (req: Request, res: Response) => {
        const { email, password, firstName, lastName, username } = req.body;

        try {
        } catch (error) {
            logger.error("Error in signUp:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to create account. Please try again later.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
};

export default controllers;
