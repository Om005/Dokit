import { PrismaClient } from "@generated/prisma/client";
import logger from "@utils/logger";

const prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

const connectToDatabase = async () => {
    try {
        await prisma.$connect();
        logger.info("Connected to the database successfully.");
    } catch (error) {
        logger.error("Error connecting to the database:");
        logger.error(error);
        process.exit(1);
    }
};

export { prisma, connectToDatabase };
