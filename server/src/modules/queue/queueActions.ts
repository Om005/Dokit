import { MailerOptions } from "@config/mailer";
import logger from "@utils/logger";
import {
    cleanContainersQueue,
    deleteProjectQueue,
    emailQueue,
    updateProjectLastAccessedQueue,
} from "./queues";

const queueActions = {
    addEmailToQueue: async ({ from, to, subject, htmlContent }: MailerOptions) => {
        try {
            emailQueue.add(
                "send-email",
                {
                    from,
                    to,
                    subject,
                    htmlContent,
                },
                {
                    removeOnComplete: true,
                    removeOnFail: { count: 10 },
                }
            );
            logger.info(`Email job added to the queue for ${to}`);
        } catch (error) {
            logger.error("Error adding email to queue:");
            logger.error(error);
            throw error;
        }
    },

    addContainerCleanupJob: async (projectId: string) => {
        try {
            cleanContainersQueue.add(
                "cleanup-containers",
                { projectId },
                {
                    removeOnComplete: true,
                    removeOnFail: { count: 10 },
                }
            );
            logger.info(`Container cleanup job added to the queue for project ${projectId}`);
        } catch (error) {
            logger.error("Error adding container cleanup job to queue:");
            logger.error(error);
            throw error;
        }
    },

    addDeleteProjectJob: async (projectId: string) => {
        try {
            deleteProjectQueue.add(
                "delete-project",
                { projectId },
                {
                    removeOnComplete: true,
                    removeOnFail: { count: 5 },
                }
            );
            logger.info(`Delete project job added to the queue for project ${projectId}`);
        } catch (error) {
            logger.error("Error adding delete project job to queue:");
            logger.error(error);
            throw error;
        }
    },

    addUpdateProjectLastAccessedJob: async (projectId: string) => {
        try {
            updateProjectLastAccessedQueue.add(
                "update-project-last-accessed",
                { projectId },
                {
                    removeOnComplete: true,
                    removeOnFail: { count: 5 },
                }
            );
            logger.info(
                `Update project last accessed job added to the queue for project ${projectId}`
            );
        } catch (error) {
            logger.error("Error adding update project last accessed job to queue:");
            logger.error(error);
            throw error;
        }
    },
};
export default queueActions;
