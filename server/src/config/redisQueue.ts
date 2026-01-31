import { ConnectionOptions } from "bullmq";
import env from "./env";

const isProd = env.IS_PRODUCTION;

let redisConfig: ConnectionOptions;

if (isProd) {
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
