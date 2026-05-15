"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkEnv = exports.EnvSchema = void 0;
const zod_1 = require("zod");
const env_1 = __importDefault(require("./env"));
exports.EnvSchema = zod_1.z
    .object({
    NODE_ENV: zod_1.z.enum(["development", "production"]),
    PORT: zod_1.z.int().min(1000).max(9999),
    FRONTEND_URL: zod_1.z.url(),
    DATABASE_URL: zod_1.z.string().min(1),
    REDIS_USERNAME: zod_1.z.string().min(1),
    REDIS_PASSWORD: zod_1.z.string().min(1),
    REDIS_HOST: zod_1.z.string().min(1),
    REDIS_PORT: zod_1.z.int().min(1).max(65535),
    REDIS_LOCAL: zod_1.z.union([zod_1.z.literal(0), zod_1.z.literal(1)]),
    IS_PRODUCTION: zod_1.z.union([zod_1.z.literal(0), zod_1.z.literal(1)]),
    BREVO_API_KEY: zod_1.z.string().min(1),
    SENDER_EMAIL: zod_1.z.string().email(),
    MAXMIND_LICENSE_KEY: zod_1.z.string().min(1),
    JWT_SECRET: zod_1.z.string().min(1),
    R2_ENDPOINT: zod_1.z.string().min(1),
    R2_ACCOUNT_ID: zod_1.z.string().min(1),
    R2_ACCESS_KEY_ID: zod_1.z.string().min(1),
    R2_SECRET_ACCESS_KEY: zod_1.z.string().min(1),
    R2_BUCKET_NAME: zod_1.z.string().min(1),
    NGINX_HOST: zod_1.z.string().min(1),
    TWO_FACTOR_ENCRYPTION_KEY: zod_1.z.string().min(1),
})
    .strict();
const checkEnv = () => {
    try {
        const validatedEnv = exports.EnvSchema.parse(env_1.default);
    }
    catch (err) {
        console.error("Invalid environment configuration");
        if (err instanceof zod_1.z.ZodError) {
            console.error(err.format());
        }
        process.exit(1);
    }
};
exports.checkEnv = checkEnv;
