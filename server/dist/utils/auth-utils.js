"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../config/env"));
const ENCRYPTION_KEY = env_1.default.TWO_FACTOR_ENCRYPTION_KEY;
const ALGORITHM = "aes-256-gcm";
const ACCESS_TOKEN_EXPIRY_MINUTES = 15;
const authUtils = {
    generateOtp: () => {
        const otp = crypto_1.default.randomInt(100000, 999999).toString();
        return otp;
    },
    signAccess: (userId, sessionId) => {
        const payload = {
            userId,
            sessionId,
        };
        const options = {
            expiresIn: `${ACCESS_TOKEN_EXPIRY_MINUTES}m`,
        };
        return jsonwebtoken_1.default.sign(payload, env_1.default.JWT_SECRET, options);
    },
    encryptSecret: (plainTextSecret) => {
        const iv = crypto_1.default.randomBytes(16);
        console.log(ENCRYPTION_KEY);
        const cipher = crypto_1.default.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, "hex"), iv);
        let encrypted = cipher.update(plainTextSecret, "utf8", "hex");
        encrypted += cipher.final("hex");
        const authTag = cipher.getAuthTag().toString("hex");
        return `${iv.toString("hex")}:${encrypted}:${authTag}`;
    },
    decryptSecret: (encryptedString) => {
        const [iv, encrypted, authTag] = encryptedString.split(":");
        const decipher = crypto_1.default.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, "hex"), Buffer.from(iv, "hex"));
        decipher.setAuthTag(Buffer.from(authTag, "hex"));
        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    },
};
exports.default = authUtils;
