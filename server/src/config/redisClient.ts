import { createClient, RedisClientType } from "redis";
import env from "./env";
import logger from "@utils/logger";

const isRedisLocal = env.REDIS_LOCAL;
let redisClient: RedisClientType;

if (isRedisLocal) {
    redisClient = createClient();
} else {
    redisClient = createClient({
        username: env.REDIS_USERNAME,
        password: env.REDIS_PASSWORD,
        socket: {
            host: env.REDIS_HOST,
            port: env.REDIS_PORT,
        },
    });
}

redisClient.on("connect", () => {
    logger.info("Redis client successfully connected");
});

redisClient.on("error", (err) => {
    logger.error("Redis Client Error");
    logger.error(err);
    process.exit(1);
});

const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        logger.error("Error connecting to Redis");
        logger.error(error);
        process.exit(1);
    }
};

export { redisClient, connectRedis };
