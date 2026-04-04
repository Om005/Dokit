import crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import env from "@config/env";

const ENCRYPTION_KEY = env.TWO_FACTOR_ENCRYPTION_KEY;
const ALGORITHM = "aes-256-gcm";
const ACCESS_TOKEN_EXPIRY_MINUTES = 15;

const authUtils = {
    generateOtp: (): string => {
        const otp = crypto.randomInt(100000, 999999).toString();
        return otp;
    },

    signAccess: (userId: string, sessionId: string): string => {
        const payload = {
            userId,
            sessionId,
        };
        const options: SignOptions = {
            expiresIn: `${ACCESS_TOKEN_EXPIRY_MINUTES}m`,
        };
        return jwt.sign(payload, env.JWT_SECRET, options);
    },

    encryptSecret: (plainTextSecret: string): string => {
        const iv = crypto.randomBytes(16);
        console.log(ENCRYPTION_KEY);
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, "hex"), iv);

        let encrypted = cipher.update(plainTextSecret, "utf8", "hex");
        encrypted += cipher.final("hex");

        const authTag = cipher.getAuthTag().toString("hex");

        return `${iv.toString("hex")}:${encrypted}:${authTag}`;
    },

    decryptSecret: (encryptedString: string) => {
        const [iv, encrypted, authTag] = encryptedString.split(":");

        const decipher = crypto.createDecipheriv(
            ALGORITHM,
            Buffer.from(ENCRYPTION_KEY, "hex"),
            Buffer.from(iv, "hex")
        );

        decipher.setAuthTag(Buffer.from(authTag, "hex"));

        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    },
};

export default authUtils;
