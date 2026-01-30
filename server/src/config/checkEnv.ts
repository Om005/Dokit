import { z } from "zod";
import env from "@config/env";

export const EnvSchema = z
    .object({
        NODE_ENV: z.enum(["development", "production"]),
        PORT: z.int().min(1000).max(9999),
        FRONTEND_URL: z.url(),
        DATABASE_URL: z.string().min(1),
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
