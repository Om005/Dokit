"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const NODE_ENV = process.env.NODE_ENV;
const envFile = NODE_ENV === "production" ? ".env.production" : ".env.development";
const PATH = path_1.default.resolve(process.cwd(), envFile);
if (fs_1.default.existsSync(PATH)) {
    dotenv_1.default.config({
        path: PATH,
    });
}
else {
    console.error(`Environment file ${envFile} not found`);
    process.exit(1);
}
const env = {
    NODE_ENV: NODE_ENV,
    PORT: parseInt(process.env.PORT, 10),
    FRONTEND_URL: process.env.FRONTEND_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_USERNAME: process.env.REDIS_USERNAME,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: parseInt(process.env.REDIS_PORT, 10),
    REDIS_LOCAL: parseInt(process.env.REDIS_LOCAL, 10),
    IS_PRODUCTION: parseInt(process.env.IS_PRODUCTION, 10),
    BREVO_API_KEY: process.env.BREVO_API_KEY,
    SENDER_EMAIL: process.env.SENDER_EMAIL,
    MAXMIND_LICENSE_KEY: process.env.MAXMIND_LICENSE_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    R2_ENDPOINT: process.env.R2_ENDPOINT,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    NGINX_HOST: process.env.NGINX_HOST,
    TWO_FACTOR_ENCRYPTION_KEY: process.env.TWO_FACTOR_ENCRYPTION_KEY,
};
exports.default = env;
