import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import env from "@config/env";
import { prisma } from "@db/prisma";
import { redisClient } from "@config/redisClient";

interface AccessTokenPayload extends jwt.JwtPayload {
    userId: string;
    sessionId: string;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

        if (!token) {
            token = req.query.token as string;
        }
        if (!token) {
            token = req.cookies?.preview_token;
        }
        if (!token && req.headers["x-original-uri"]) {
            const originalUri = req.headers["x-original-uri"] as string;
            const url = new URL(originalUri, `http://localhost`);
            token = url.searchParams.get("token") || undefined;
        }
        if (!token) {
            const rawCookie = req.headers["cookie"] ?? "";
            const match = rawCookie.match(/(?:^|;\s*)preview_token=([^;]+)/);
            if (match) token = match[1];
        }
        if (!token && req.headers["x-preview-token"]) {
            token = req.headers["x-preview-token"] as string;
        }
        if (!token) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "Authentication required",
                statusCode: StatusCodes.UNAUTHORIZED,
            });
        }

        const decoded = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
            },
        });
        if (!user) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "User not found",
                statusCode: StatusCodes.UNAUTHORIZED,
            });
        }
        req.meta.user = {
            id: decoded.userId,
            email: user.email,
            sessionId: decoded.sessionId,
        };
        const sessionKey = `session:${decoded.sessionId}`;
        const sessionData = await redisClient.get(sessionKey);
        if (!sessionData) {
            const session = await prisma.session.findUnique({
                where: { id: decoded.sessionId },
            });
            if (!session || session.expiresAt < new Date()) {
                return res.status(StatusCodes.UNAUTHORIZED).json({
                    success: false,
                    message: "Session has expired. Please log in again.",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }
            await redisClient.set(sessionKey, JSON.stringify({ userId: decoded.userId }), {
                EX: 15 * 60,
            });
        }

        next();
    } catch (error: any) {
        if (error.name === "TokenExpiredError") {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "Session has expired. Please log in again.",
                statusCode: StatusCodes.UNAUTHORIZED,
            });
        }
        return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: "Invalid session. Please log in again.",
            statusCode: StatusCodes.UNAUTHORIZED,
        });
    }
};
