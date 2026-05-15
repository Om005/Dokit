"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectRedis = exports.redisClient = void 0;
const redis_1 = require("redis");
const env_1 = __importDefault(require("./env"));
const logger_1 = __importDefault(require("../utils/logger"));
const isRedisLocal = env_1.default.REDIS_LOCAL;
let redisClient;
if (isRedisLocal) {
    exports.redisClient = redisClient = (0, redis_1.createClient)();
}
else {
    exports.redisClient = redisClient = (0, redis_1.createClient)({
        username: env_1.default.REDIS_USERNAME,
        password: env_1.default.REDIS_PASSWORD,
        socket: {
            host: env_1.default.REDIS_HOST,
            port: env_1.default.REDIS_PORT,
        },
    });
}
redisClient.on("connect", () => {
    logger_1.default.info("Redis client successfully connected");
});
redisClient.on("error", (err) => {
    logger_1.default.error("Redis Client Error");
    logger_1.default.error(err);
    process.exit(1);
});
const connectRedis = async () => {
    try {
        await redisClient.connect();
    }
    catch (error) {
        logger_1.default.error("Error connecting to Redis");
        logger_1.default.error(error);
        process.exit(1);
    }
};
exports.connectRedis = connectRedis;
