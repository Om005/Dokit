"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_status_codes_1 = require("http-status-codes");
const env_1 = __importDefault(require("../config/env"));
const prisma_1 = require("../db/prisma");
const redisClient_1 = require("../config/redisClient");
const authenticate = async (req, res, next) => {
    try {
        let token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
        if (!token) {
            token = req.query.token;
        }
        if (!token) {
            token = req.cookies?.preview_token;
        }
        if (!token && req.headers["x-original-uri"]) {
            const originalUri = req.headers["x-original-uri"];
            const url = new URL(originalUri, `http://localhost`);
            token = url.searchParams.get("token") || undefined;
        }
        if (!token) {
            const rawCookie = req.headers["cookie"] ?? "";
            const match = rawCookie.match(/(?:^|;\s*)preview_token=([^;]+)/);
            if (match)
                token = match[1];
        }
        if (!token && req.headers["x-preview-token"]) {
            token = req.headers["x-preview-token"];
        }
        if (!token) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "Authentication required",
                statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_1.default.JWT_SECRET);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
            },
        });
        if (!user) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "User not found",
                statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            });
        }
        req.meta.user = {
            id: decoded.userId,
            email: user.email,
            sessionId: decoded.sessionId,
        };
        const sessionKey = `session:${decoded.sessionId}`;
        const sessionData = await redisClient_1.redisClient.get(sessionKey);
        if (!sessionData) {
            const session = await prisma_1.prisma.session.findUnique({
                where: { id: decoded.sessionId },
            });
            if (!session || session.expiresAt < new Date()) {
                return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                    success: false,
                    message: "Session has expired. Please log in again.",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            await redisClient_1.redisClient.set(sessionKey, JSON.stringify({ userId: decoded.userId }), {
                EX: 15 * 60,
            });
        }
        next();
    }
    catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "Session has expired. Please log in again.",
                statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            });
        }
        return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: "Invalid session. Please log in again.",
            statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
        });
    }
};
exports.authenticate = authenticate;
