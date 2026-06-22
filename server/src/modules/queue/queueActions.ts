import { MailerOptions } from "@config/mailer";
import logger from "@utils/logger";
import {
    cleanContainersQueue,
    deleteProjectQueue,
    emailQueue,
    removeRequestQueue,
    syncToR2Queue,
    updateProjectLastAccessedQueue,
    updateEmbeddingsQueue,
    createProjectQueue,
    importGithubRepoQueue,
} from "./queues";
import { ProjectStack } from "@generated/prisma";

const queueActions = {
    addEmailToQueue: async ({ from, to, subject, htmlContent }: MailerOptions) => {
        try {
            await emailQueue.add(
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
            await cleanContainersQueue.add(
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
            await deleteProjectQueue.add(
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
            await updateProjectLastAccessedQueue.add(
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

    addSyncToR2Job: async (projectId: string) => {
        try {
            await syncToR2Queue.add(
                "sync-to-r2",
                { projectId },
                {
                    removeOnComplete: true,
                    removeOnFail: { count: 5 },
                }
            );
            logger.info(`Sync to R2 job added to the queue for project ${projectId}`);
        } catch (error) {
            logger.error("Error adding sync to R2 job to queue:");
            logger.error(error);
            throw error;
        }
    },

    addRemoveRequestJob: async (requestId: string) => {
        try {
            const ONE_DAY_MS = 24 * 60 * 60 * 1000;
            await removeRequestQueue.add(
                "remove-request",
                { requestId },
                {
                    delay: ONE_DAY_MS,
                    removeOnComplete: true,
                    removeOnFail: { count: 5 },
                }
            );
            logger.info(`Remove request job added to the queue for request ${requestId}`);
        } catch (error) {
            logger.error("Error adding remove request job to queue:");
            logger.error(error);
            throw error;
        }
    },

    addCreateProjectJob: async (projectId: string, stack: ProjectStack, userId: string) => {
        try {
            await createProjectQueue.add(
                "create-project",
                { projectId, stack, userId },
                {
                    removeOnComplete: true,
                    removeOnFail: { count: 5 },
                }
            );
            logger.info(`Create project job added to the queue for project ${projectId}`);
        } catch (error) {
            logger.error("Error adding create project job to queue:");
            logger.error(error);
            throw error;
        }
    },

    addUpdateEmbeddingsJob: async (projectId: string, filePath: string, content: string) => {
        try {
            await updateEmbeddingsQueue.add(
                "update-embeddings",
                { projectId, filePath, content },
                {
                    removeOnComplete: true,
                    removeOnFail: { count: 5 },
                }
            );
            logger.info(`Update embeddings job added to the queue for project ${projectId}`);
        } catch (error) {
            logger.error("Error adding update embeddings job to queue:");
            logger.error(error);
            throw error;
        }
    },

    addImportGithubRepoJob: async (projectId: string, repoUrl: string, userId: string) => {
        try {
            await importGithubRepoQueue.add(
                "import-github-repo",
                { projectId, repoUrl, userId },
                {
                    removeOnComplete: true,
                    removeOnFail: { count: 5 },
                }
            );
            logger.info(`Import GitHub repo job added to the queue for project ${projectId}`);
        } catch (error) {
            logger.error("Error adding import GitHub repo job to queue:");
            logger.error(error);
            throw error;
        }
    },
};
export default queueActions;
