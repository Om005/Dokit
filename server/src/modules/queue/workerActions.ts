import { transporter } from "@config/mailer";
import { MailerOptions } from "@config/mailer";
import { prisma } from "@db/prisma";
import logger from "@utils/logger";
import type { Job } from "bullmq";
import DockerManager from "services/dockerManager";
import R2Manager from "services/r2Manager";

const workers = {
    sendEmail: async (job: Job) => {
        const emailOptions: MailerOptions = job.data;
        try {
            await transporter.sendMail(emailOptions);
            logger.info(`Email sent successfully by job id: ${job.id}`);
        } catch (error) {
            logger.error(`Failed to send email by job id: ${job.id}`);
            logger.error(error);
            throw error;
        }
    },
    cleanupContainer: async (job: Job) => {
        const { projectId } = job.data;
        try {
            await DockerManager.syncWorkspaceToR2(projectId);
            await DockerManager.deleteDokitContainer(projectId);
            logger.info(
                `Container cleanup completed for project ${projectId} by job id: ${job.id}`
            );
        } catch (error) {
            logger.error(
                `Failed to cleanup containers for project ${projectId} by job id: ${job.id}`
            );
            logger.error(error);
            throw error;
        }
    },
    deleteProject: async (job: Job) => {
        const { projectId } = job.data;
        try {
            await R2Manager.deleteProject(projectId);
            await DockerManager.deleteDokitContainer(projectId);
            logger.info(`Project deletion completed for project ${projectId} by job id: ${job.id}`);
        } catch (error) {
            logger.error(`Failed to delete project ${projectId} by job id: ${job.id}`);
            logger.error(error);
            throw error;
        }
    },
    updateProjectLastAccessed: async (job: Job) => {
        const { projectId } = job.data;
        try {
            await prisma.project.update({
                where: { id: projectId },
                data: { lastAccessedAt: new Date() },
            });
            logger.info(
                `Project last accessed updated for project ${projectId} by job id: ${job.id}`
            );
        } catch (error) {
            logger.error(
                `Failed to update project last accessed for project ${projectId} by job id: ${job.id}`
            );
            logger.error(error);
            throw error;
        }
    },
    syncToR2: async (job: Job) => {
        try {
            const { projectId } = job.data;
            await DockerManager.syncWorkspaceToR2(projectId);
            logger.info(`Sync to R2 completed for project ${projectId} by job id: ${job.id}`);
        } catch (error) {
            logger.error(
                `Failed to sync to R2 for project ${job.data.projectId} by job id: ${job.id}`
            );
            logger.error(error);
            throw error;
        }
    },
    removeRequest: async (job: Job) => {
        const { requestId } = job.data;
        try {
            await prisma.accessRequest.delete({
                where: { id: requestId },
            });
            logger.info(`Request ${requestId} removed successfully by job id: ${job.id}`);
        } catch (error) {
            logger.error(`Failed to remove request ${requestId} by job id: ${job.id}`);
            logger.error(error);
            throw error;
        }
    },
};

export default workers;
