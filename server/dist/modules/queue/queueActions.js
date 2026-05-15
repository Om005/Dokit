"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../../utils/logger"));
const queues_1 = require("./queues");
const queueActions = {
    addEmailToQueue: async ({ from, to, subject, htmlContent }) => {
        try {
            await queues_1.emailQueue.add("send-email", {
                from,
                to,
                subject,
                htmlContent,
            }, {
                removeOnComplete: true,
                removeOnFail: { count: 10 },
            });
            logger_1.default.info(`Email job added to the queue for ${to}`);
        }
        catch (error) {
            logger_1.default.error("Error adding email to queue:");
            logger_1.default.error(error);
            throw error;
        }
    },
    addContainerCleanupJob: async (projectId) => {
        try {
            await queues_1.cleanContainersQueue.add("cleanup-containers", { projectId }, {
                removeOnComplete: true,
                removeOnFail: { count: 10 },
            });
            logger_1.default.info(`Container cleanup job added to the queue for project ${projectId}`);
        }
        catch (error) {
            logger_1.default.error("Error adding container cleanup job to queue:");
            logger_1.default.error(error);
            throw error;
        }
    },
    addDeleteProjectJob: async (projectId) => {
        try {
            await queues_1.deleteProjectQueue.add("delete-project", { projectId }, {
                removeOnComplete: true,
                removeOnFail: { count: 5 },
            });
            logger_1.default.info(`Delete project job added to the queue for project ${projectId}`);
        }
        catch (error) {
            logger_1.default.error("Error adding delete project job to queue:");
            logger_1.default.error(error);
            throw error;
        }
    },
    addUpdateProjectLastAccessedJob: async (projectId) => {
        try {
            await queues_1.updateProjectLastAccessedQueue.add("update-project-last-accessed", { projectId }, {
                removeOnComplete: true,
                removeOnFail: { count: 5 },
            });
            logger_1.default.info(`Update project last accessed job added to the queue for project ${projectId}`);
        }
        catch (error) {
            logger_1.default.error("Error adding update project last accessed job to queue:");
            logger_1.default.error(error);
            throw error;
        }
    },
    addSyncToR2Job: async (projectId) => {
        try {
            await queues_1.syncToR2Queue.add("sync-to-r2", { projectId }, {
                removeOnComplete: true,
                removeOnFail: { count: 5 },
            });
            logger_1.default.info(`Sync to R2 job added to the queue for project ${projectId}`);
        }
        catch (error) {
            logger_1.default.error("Error adding sync to R2 job to queue:");
            logger_1.default.error(error);
            throw error;
        }
    },
    addRemoveRequestJob: async (requestId) => {
        try {
            const ONE_DAY_MS = 24 * 60 * 60 * 1000;
            await queues_1.removeRequestQueue.add("remove-request", { requestId }, {
                delay: ONE_DAY_MS,
                removeOnComplete: true,
                removeOnFail: { count: 5 },
            });
            logger_1.default.info(`Remove request job added to the queue for request ${requestId}`);
        }
        catch (error) {
            logger_1.default.error("Error adding remove request job to queue:");
            logger_1.default.error(error);
            throw error;
        }
    },
};
exports.default = queueActions;
