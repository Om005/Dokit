import type { Request, Response } from "express";
import { transporter, MailerOptions } from "@config/mailer";
import env from "@config/env";
import validators from "./validators";
import prisma from "@db/prisma";
import sendResponse from "@utils/sendResponse";
import generateOtp from "@utils/generateOtp";
import queueActions from "@modules/queue/queue-actions";
import { redisClient } from "@config/redisClient";
import { StatusCodes } from "http-status-codes";
import logger from "@utils/logger";

const controllers = {
    sendOtpForAccountCreation: async (req: Request, res: Response) => {
        try {
            console.time("Total Request");
            const { email } = req.body;

            console.time("DB Check");
            const userCount = await prisma.user.count({
                where: { email },
            });
            console.timeEnd("DB Check");

            if (userCount > 0) {
                return sendResponse(res, {
                    success: false,
                    message: "An account with this email already exists.",
                    statusCode: StatusCodes.CONFLICT,
                });
            }

            const otp = generateOtp();

            console.time("Redis & Queue");
            await Promise.all([
                redisClient.set(`otp:create-account:${email}`, otp, { EX: 10 * 60 }),

                queueActions.addEmailToQueue({
                    from: env.SENDER_EMAIL,
                    to: email,
                    subject: "Your OTP for Account Creation",
                    htmlContent: `<p>Your OTP for account creation is: <strong>${otp}</strong></p><p>This OTP is valid for 10 minutes.</p>`,
                })
            ]);
            console.timeEnd("Redis & Queue");

            console.timeEnd("Total Request");


            return sendResponse(res, {
                success: true,
                message: "OTP sent to your email for account creation.",
                statusCode: StatusCodes.OK
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
};

export default controllers;
