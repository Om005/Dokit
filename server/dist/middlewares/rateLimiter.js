"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redisClient_1 = require("../config/redisClient");
const env_1 = __importDefault(require("../config/env"));
const logger_1 = __importDefault(require("../utils/logger"));
const sendResponse_1 = __importDefault(require("../utils/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const isProd = env_1.default.IS_PRODUCTION;
const rateLimit = ({ limit, windowMs, prefix = "common" }) => {
    return async (req, res, next) => {
        if (!isProd) {
            return next();
        }
        const ip = req.meta.clientIp || "unknown";
        const key = `rl:${prefix}:${ip}`;
        const now = Date.now();
        const windowStart = now - windowMs;
        try {
            const multi = redisClient_1.redisClient.multi();
            // Remove timestamps outside the window
            multi.zRemRangeByScore(key, 0, windowStart);
            // Get the current count
            multi.zCard(key);
            // Add the current timestamp
            multi.zAdd(key, { score: now, value: now.toString() });
            // Set expiration for the key
            multi.expire(key, Math.ceil(windowMs / 1000) + 60);
            const results = await multi.exec();
            const requestCount = results?.[1];
            const remaining = Math.max(0, limit - requestCount - 1);
            res.set("X-RateLimit-Limit", limit.toString());
            res.set("X-RateLimit-Remaining", remaining.toString());
            res.set("X-RateLimit-Reset", (now + windowMs).toString());
            if (requestCount >= limit) {
                const retryAfterSeconds = Math.ceil(windowMs / 1000);
                res.set("Retry-After", retryAfterSeconds.toString());
                logger_1.default.warn(`Rate Limit Hit: ${ip} on [${prefix}]`);
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    statusCode: http_status_codes_1.StatusCodes.TOO_MANY_REQUESTS,
                    message: "Too many requests, please try again later.",
                });
            }
            next();
        }
        catch (error) {
            logger_1.default.error("Rate Limiter Redis Error:");
            logger_1.default.error(error);
            next();
        }
    };
};
exports.default = rateLimit;
