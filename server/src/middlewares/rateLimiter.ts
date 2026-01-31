import { Request, Response, NextFunction } from "express";
import { redisClient } from "@config/redisClient";
import env from "@config/env";
import logger from "@utils/logger";
import sendResponse from "@utils/sendResponse";
import { StatusCodes } from "http-status-codes";

const isProd = env.IS_PRODUCTION;

interface RateLimitOptions {
    limit: number;
    windowMs: number;
    prefix?: string;
}

const rateLimit = ({ limit, windowMs, prefix = "common" }: RateLimitOptions) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!isProd) {
            return next();
        }

        const ip = req.meta.clientIp || "unknown";
        const key = `rl:${prefix}:${ip}`;

        const now = Date.now();
        const windowStart = now - windowMs;

        try {
            const multi = redisClient.multi();

            // Remove timestamps outside the window
            multi.zRemRangeByScore(key, 0, windowStart);
            // Get the current count
            multi.zCard(key);
            // Add the current timestamp
            multi.zAdd(key, { score: now, value: now.toString() });
            // Set expiration for the key
            multi.expire(key, Math.ceil(windowMs / 1000) + 60);

            const results = await multi.exec();
            const requestCount = results?.[1] as unknown as number;
            const remaining = Math.max(0, limit - requestCount - 1);

            res.set("X-RateLimit-Limit", limit.toString());
            res.set("X-RateLimit-Remaining", remaining.toString());
            res.set("X-RateLimit-Reset", (now + windowMs).toString());

            if (requestCount >= limit) {
                const retryAfterSeconds = Math.ceil(windowMs / 1000);
                res.set("Retry-After", retryAfterSeconds.toString());
                logger.warn(`Rate Limit Hit: ${ip} on [${prefix}]`);
                return sendResponse(res, {
                    success: false,
                    statusCode: StatusCodes.TOO_MANY_REQUESTS,
                    message: "Too many requests, please try again later.",
                });
            }
            next();
        } catch (error) {
            logger.error("Rate Limiter Redis Error:");
            logger.error(error);
            next();
        }
    };
};

export default rateLimit;
