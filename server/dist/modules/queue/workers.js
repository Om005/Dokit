"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const redisQueue_1 = __importDefault(require("../../config/redisQueue"));
const queueNames_1 = __importDefault(require("./queueNames"));
const workerActions_1 = __importDefault(require("./workerActions"));
const initiatWorkers = () => {
    const emailWorker = new bullmq_1.Worker(queueNames_1.default.EMAIL_QUEUE, workerActions_1.default.sendEmail, {
        connection: redisQueue_1.default,
        concurrency: 10,
    });
    const cleanContainersWorker = new bullmq_1.Worker(queueNames_1.default.CLEAN_CONTAINERS_QUEUE, workerActions_1.default.cleanupContainer, {
        connection: redisQueue_1.default,
        concurrency: 5,
    });
    const deleteProjectWorker = new bullmq_1.Worker(queueNames_1.default.DELETE_PROJECT_QUEUE, workerActions_1.default.deleteProject, {
        connection: redisQueue_1.default,
        concurrency: 5,
    });
    const updateProjectLastAccessedWorker = new bullmq_1.Worker(queueNames_1.default.UPDATE_PROJECT_LAST_ACCESSED_QUEUE, workerActions_1.default.updateProjectLastAccessed, {
        connection: redisQueue_1.default,
        concurrency: 5,
    });
    const syncToR2Worker = new bullmq_1.Worker(queueNames_1.default.SYNC_TO_R2_QUEUE, workerActions_1.default.syncToR2, {
        connection: redisQueue_1.default,
        concurrency: 5,
    });
    const removeRequestWorker = new bullmq_1.Worker(queueNames_1.default.REMOVE_REQUEST_QUEUE, workerActions_1.default.removeRequest, {
        connection: redisQueue_1.default,
        concurrency: 5,
    });
};
exports.default = initiatWorkers;
