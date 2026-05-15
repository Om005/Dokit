"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeRequestQueue = exports.syncToR2Queue = exports.updateProjectLastAccessedQueue = exports.deleteProjectQueue = exports.cleanContainersQueue = exports.emailQueue = void 0;
const bullmq_1 = require("bullmq");
const redisQueue_1 = __importDefault(require("../../config/redisQueue"));
const queueNames_1 = __importDefault(require("./queueNames"));
const emailQueue = new bullmq_1.Queue(queueNames_1.default.EMAIL_QUEUE, {
    connection: redisQueue_1.default,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: "exponential",
            delay: 3000,
        },
    },
});
exports.emailQueue = emailQueue;
const cleanContainersQueue = new bullmq_1.Queue(queueNames_1.default.CLEAN_CONTAINERS_QUEUE, {
    connection: redisQueue_1.default,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 3000,
        },
    },
});
exports.cleanContainersQueue = cleanContainersQueue;
const deleteProjectQueue = new bullmq_1.Queue(queueNames_1.default.DELETE_PROJECT_QUEUE, {
    connection: redisQueue_1.default,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 3000,
        },
    },
});
exports.deleteProjectQueue = deleteProjectQueue;
const updateProjectLastAccessedQueue = new bullmq_1.Queue(queueNames_1.default.UPDATE_PROJECT_LAST_ACCESSED_QUEUE, {
    connection: redisQueue_1.default,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 3000,
        },
    },
});
exports.updateProjectLastAccessedQueue = updateProjectLastAccessedQueue;
const syncToR2Queue = new bullmq_1.Queue(queueNames_1.default.SYNC_TO_R2_QUEUE, {
    connection: redisQueue_1.default,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 3000,
        },
    },
});
exports.syncToR2Queue = syncToR2Queue;
const removeRequestQueue = new bullmq_1.Queue(queueNames_1.default.REMOVE_REQUEST_QUEUE, {
    connection: redisQueue_1.default,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 3000,
        },
    },
});
exports.removeRequestQueue = removeRequestQueue;
