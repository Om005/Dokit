import crypto from "crypto";
import argon2 from "argon2";
import jwt, { SignOptions } from "jsonwebtoken";
import env from "@config/env";

const authUtils = {
    ACCESS_TOKEN_EXPIRY_MINUTES: 15,
    generateOtp: (): string => {
        const otp = crypto.randomInt(100000, 999999).toString();
        return otp;
    },

    signAccess: (userId: string, email: string, sessionId: string): string => {
        const payload = {
            userId,
            email,
            sessionId,
        };
        const options: SignOptions = {
            expiresIn: `${authUtils.ACCESS_TOKEN_EXPIRY_MINUTES}m`,
        };
        return jwt.sign(payload, env.JWT_SECRET, options);
    },
};

export default authUtils;
