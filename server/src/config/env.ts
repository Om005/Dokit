import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const NODE_ENV = process.env.NODE_ENV;
const envFile = NODE_ENV === "production" ? ".env.production" : ".env.development";
const PATH = path.resolve(process.cwd(), envFile);

if (fs.existsSync(PATH)) {
    dotenv.config({
        path: PATH,
    });
} else {
    console.error(`Environment file ${envFile} not found`);
    process.exit(1);
}

interface EnvConfig {
    NODE_ENV: "development" | "production";
    PORT: number;
    FRONTEND_URL: string;
    DATABASE_URL: string;
    REDIS_USERNAME: string;
    REDIS_PASSWORD: string;
    REDIS_HOST: string;
    REDIS_PORT: number;
    REDIS_LOCAL: 1 | 0;
    IS_PRODUCTION: 1 | 0;
    BREVO_API_KEY: string;
    SENDER_EMAIL: string;
    MAXMIND_LICENSE_KEY: string;
    JWT_SECRET: string;
}

const env: EnvConfig = {
    NODE_ENV: NODE_ENV as "development" | "production",
    PORT: parseInt(process.env.PORT as string, 10),
    FRONTEND_URL: process.env.FRONTEND_URL as string,
    DATABASE_URL: process.env.DATABASE_URL as string,
    REDIS_USERNAME: process.env.REDIS_USERNAME as string,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD as string,
    REDIS_HOST: process.env.REDIS_HOST as string,
    REDIS_PORT: parseInt(process.env.REDIS_PORT as string, 10),
    REDIS_LOCAL: parseInt(process.env.REDIS_LOCAL as string, 10) as 1 | 0,
    IS_PRODUCTION: parseInt(process.env.IS_PRODUCTION as string, 10) as 1 | 0,
    BREVO_API_KEY: process.env.BREVO_API_KEY as string,
    SENDER_EMAIL: process.env.SENDER_EMAIL as string,
    MAXMIND_LICENSE_KEY: process.env.MAXMIND_LICENSE_KEY as string,
    JWT_SECRET: process.env.JWT_SECRET as string,
};

export default env;
