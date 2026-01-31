import { ConnectionOptions } from "bullmq";
import env from "./env";

const isRedisLocal = env.REDIS_LOCAL;

let redisConfig: ConnectionOptions;

if (!isRedisLocal) {
    redisConfig = {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
        username: env.REDIS_USERNAME,
        tls: {},
        maxRetriesPerRequest: null,
    };
} else {
    redisConfig = {
        host: "localhost",
        port: 6379,
        maxRetriesPerRequest: null,
    };
}

export default redisConfig;
