import { PrismaClient } from "@generated/prisma/client";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { PrismaPg } from "@prisma/adapter-pg";

const NODE_ENV = process.env.NODE_ENV || "development";
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

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set in environment variables");
    process.exit(1);
}

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
    adapter,
    log: NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
});

export default prisma;
