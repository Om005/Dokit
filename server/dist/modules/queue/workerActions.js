"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mailer_1 = require("../../config/mailer");
const prisma_1 = require("../../db/prisma");
const logger_1 = __importDefault(require("../../utils/logger"));
const dockerManager_1 = __importDefault(require("../../services/dockerManager"));
const r2Manager_1 = __importDefault(require("../../services/r2Manager"));
const workers = {
    sendEmail: async (job) => {
        const emailOptions = job.data;
        try {
            await mailer_1.transporter.sendMail(emailOptions);
            logger_1.default.info(`Email sent successfully by job id: ${job.id}`);
        }
        catch (error) {
            logger_1.default.error(`Failed to send email by job id: ${job.id}`);
            logger_1.default.error(error);
            throw error;
        }
    },
    cleanupContainer: async (job) => {
        const { projectId } = job.data;
        try {
            await dockerManager_1.default.syncWorkspaceToR2(projectId);
            await dockerManager_1.default.deleteDokitContainer(projectId);
            logger_1.default.info(`Container cleanup completed for project ${projectId} by job id: ${job.id}`);
        }
        catch (error) {
            logger_1.default.error(`Failed to cleanup containers for project ${projectId} by job id: ${job.id}`);
            logger_1.default.error(error);
            throw error;
        }
    },
    deleteProject: async (job) => {
        const { projectId } = job.data;
        try {
            await r2Manager_1.default.deleteProject(projectId);
            await dockerManager_1.default.deleteDokitContainer(projectId);
            logger_1.default.info(`Project deletion completed for project ${projectId} by job id: ${job.id}`);
        }
        catch (error) {
            logger_1.default.error(`Failed to delete project ${projectId} by job id: ${job.id}`);
            logger_1.default.error(error);
            throw error;
        }
    },
    updateProjectLastAccessed: async (job) => {
        const { projectId } = job.data;
        try {
            await prisma_1.prisma.project.update({
                where: { id: projectId },
                data: { lastAccessedAt: new Date() },
            });
            logger_1.default.info(`Project last accessed updated for project ${projectId} by job id: ${job.id}`);
        }
        catch (error) {
            logger_1.default.error(`Failed to update project last accessed for project ${projectId} by job id: ${job.id}`);
            logger_1.default.error(error);
            throw error;
        }
    },
    syncToR2: async (job) => {
        try {
            const { projectId } = job.data;
            await dockerManager_1.default.syncWorkspaceToR2(projectId);
            logger_1.default.info(`Sync to R2 completed for project ${projectId} by job id: ${job.id}`);
        }
        catch (error) {
            logger_1.default.error(`Failed to sync to R2 for project ${job.data.projectId} by job id: ${job.id}`);
            logger_1.default.error(error);
            throw error;
        }
    },
    removeRequest: async (job) => {
        const { requestId } = job.data;
        try {
            await prisma_1.prisma.accessRequest.delete({
                where: { id: requestId },
            });
            logger_1.default.info(`Request ${requestId} removed successfully by job id: ${job.id}`);
        }
        catch (error) {
            logger_1.default.error(`Failed to remove request ${requestId} by job id: ${job.id}`);
            logger_1.default.error(error);
            throw error;
        }
    },
};
exports.default = workers;
