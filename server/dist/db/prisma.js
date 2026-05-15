"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = exports.prisma = void 0;
const client_1 = require("../generated/prisma/client");
const logger_1 = __importDefault(require("../utils/logger"));
const prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});
exports.prisma = prisma;
const connectToDatabase = async () => {
    try {
        await prisma.$connect();
        logger_1.default.info("Connected to the database successfully.");
    }
    catch (error) {
        logger_1.default.error("Error connecting to the database:");
        logger_1.default.error(error);
        process.exit(1);
    }
};
exports.connectToDatabase = connectToDatabase;
