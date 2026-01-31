import { z } from "zod";
import env from "@config/env";

export const EnvSchema = z
    .object({
        NODE_ENV: z.enum(["development", "production"]),
        PORT: z.int().min(1000).max(9999),
        FRONTEND_URL: z.url(),
        DATABASE_URL: z.string().min(1),
        REDIS_USERNAME: z.string().min(1),
        REDIS_PASSWORD: z.string().min(1),
        REDIS_HOST: z.string().min(1),
        REDIS_PORT: z.int().min(1).max(65535),
        REDIS_LOCAL: z.union([z.literal(0), z.literal(1)]),
        IS_PRODUCTION: z.union([z.literal(0), z.literal(1)]),
        BREVO_API_KEY: z.string().min(1),
        SENDER_EMAIL: z.string().email(),
    })
    .strict();

export const checkEnv = () => {
    try {
        const validatedEnv = EnvSchema.parse(env);
    } catch (err) {
        console.error("Invalid environment configuration");
        if (err instanceof z.ZodError) {
            console.error(err.format());
        }
        process.exit(1);
    }
};
