"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = __importDefault(require("./env"));
const isRedisLocal = env_1.default.REDIS_LOCAL;
let redisConfig;
if (!isRedisLocal) {
    redisConfig = {
        host: env_1.default.REDIS_HOST,
        port: env_1.default.REDIS_PORT,
        password: env_1.default.REDIS_PASSWORD,
        username: env_1.default.REDIS_USERNAME,
        tls: {},
        maxRetriesPerRequest: null,
    };
}
else {
    redisConfig = {
        host: "localhost",
        port: 6379,
        maxRetriesPerRequest: null,
    };
}
exports.default = redisConfig;
