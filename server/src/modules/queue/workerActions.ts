import { transporter } from "@config/mailer";
import { MailerOptions } from "@config/mailer";
import { prisma } from "@db/prisma";
import { ProjectStack } from "@generated/prisma";
import logger from "@utils/logger";
import type { Job } from "bullmq";
import DockerManager from "services/dockerManager";
import R2Manager from "services/r2Manager";
import { FileInput, ingestProjectFiles } from "services/rag/ingestionService";
import { FileNode } from "types/express";
import { io } from "index";
import queueActions from "./queueActions";

export const IGNORED_DIRECTORIES = new Set([
    "node_modules",
    ".git",
    ".tmp",
    "dist",
    "build",
    "out",
    ".next",
    "coverage",
    "venv",
    ".venv",
    "__pycache__",
    ".vscode",
]);

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
            prisma.codeChunk.deleteMany({ where: { projectId } }).catch((error) => {
                logger.error(`Error deleting code chunks for project ${projectId}:`, error);
            });
            prisma.chatThread.deleteMany({ where: { projectId } }).catch((error) => {
                logger.error(`Error deleting chat threads for project ${projectId}:`, error);
            });
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
    createProject: async (job: Job) => {
        const { projectId, stack, userId } = job.data;
        const filesCopied = await R2Manager.copyBaseToProject(projectId, stack as ProjectStack);
        if (filesCopied === -1) {
            await prisma.project.update({
                where: { id: projectId },
                data: { status: "FAILED" },
            });
            return;
        }
        const containerInfo = await DockerManager.createDokitContainer(
            projectId,
            stack == "GITHUB" ? "BLANK" : stack
        );
        if (!containerInfo.containerId) {
            logger.error("Failed to create dokit container for project.");
            await prisma.project.update({
                where: { id: projectId },
                data: { status: "FAILED" },
            });
            return;
        }
        await prisma.project.update({
            where: { id: projectId },
            data: { status: "RUNNING" },
        });

        io.to(`user-${userId}`).emit("project-status-updated", { projectId, status: "RUNNING" });

        try {
            const FileTree: Record<string, FileNode> | null = await DockerManager.getFolderContent(
                projectId,
                "/"
            );

            const filesToIngest: FileInput[] = [];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const traverseTree = async (tree: Record<string, any>) => {
                for (const [key, node] of Object.entries(tree)) {
                    const parts = key.split("/");
                    if (parts.some((part) => IGNORED_DIRECTORIES.has(part))) {
                        continue;
                    }
                    const fullPath = `${key}`;
                    if (node.type == "directory") {
                        const subTree = await DockerManager.getFolderContent(
                            projectId,
                            fullPath + "/"
                        );
                        if (subTree) await traverseTree(subTree);
                    } else {
                        if (
                            /\.(js|ts|jsx|tsx|py|go|rs|c|cpp|md|txt|json|css|html|svg)$/i.test(key)
                        ) {
                            try {
                                const content = await DockerManager.getFileContent(
                                    projectId,
                                    fullPath
                                );
                                if (content) {
                                    filesToIngest.push({ filePath: fullPath, content });
                                }
                            } catch {
                                logger.warn(`Could not read file ${fullPath} for ingestion.`);
                            }
                        }
                    }
                }
            };

            await traverseTree(FileTree!);

            if (filesToIngest.length > 0) {
                await ingestProjectFiles(projectId, filesToIngest);
                logger.info(`[Vector DB] Background ingestion complete for project ${projectId}.`);
            } else {
                logger.info(
                    `[Vector DB] No valid source files found to index for project ${projectId}.`
                );
            }
        } catch (error) {
            logger.error(`Failed to create project for project ${projectId} by job id: ${job.id}`);
            logger.error(error);
        }
    },
    updateEmbeddings: async (job: Job) => {
        const { projectId, filePath, content } = job.data;
        try {
            await ingestProjectFiles(projectId, [{ filePath, content }]);
            logger.info(
                `[Vector DB] Background update of embeddings complete for ${filePath} in project ${projectId}.`
            );
        } catch (error) {
            logger.error(
                `Failed to update embeddings for ${filePath} in project ${projectId} by job id: ${job.id}`
            );
            logger.error(error);
            throw error;
        }
    },

    importGithubRepo: async (job: Job) => {
        const { projectId, repoUrl, userId } = job.data;
        try {
            const containerId = await DockerManager.createDokitContainerFromGithub(
                projectId,
                repoUrl
            );
            if (!containerId) {
                logger.error("Failed to create dokit container from GitHub repo for project.");
                await prisma.project.update({
                    where: { id: projectId },
                    data: { status: "FAILED" },
                });
                return;
            }
            await prisma.project.update({
                where: { id: projectId },
                data: { status: "RUNNING" },
            });

            io.to(`user-${userId}`).emit("project-status-updated", {
                projectId,
                status: "RUNNING",
            });
            queueActions.addSyncToR2Job(projectId);

            try {
                const FileTree: Record<string, FileNode> | null =
                    await DockerManager.getFolderContent(projectId, "/");

                const filesToIngest: FileInput[] = [];

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const traverseTree = async (tree: Record<string, any>) => {
                    for (const [key, node] of Object.entries(tree)) {
                        const parts = key.split("/");
                        if (parts.some((part) => IGNORED_DIRECTORIES.has(part))) {
                            continue;
                        }
                        const fullPath = `${key}`;
                        if (node.type == "directory") {
                            const subTree = await DockerManager.getFolderContent(
                                projectId,
                                fullPath + "/"
                            );
                            if (subTree) await traverseTree(subTree);
                        } else {
                            if (
                                /\.(js|ts|jsx|tsx|py|go|rs|c|cpp|md|txt|json|css|html|svg)$/i.test(
                                    key
                                )
                            ) {
                                try {
                                    const content = await DockerManager.getFileContent(
                                        projectId,
                                        fullPath
                                    );
                                    if (content) {
                                        filesToIngest.push({ filePath: fullPath, content });
                                    }
                                } catch {
                                    logger.warn(`Could not read file ${fullPath} for ingestion.`);
                                }
                            }
                        }
                    }
                };

                await traverseTree(FileTree!);

                if (filesToIngest.length > 0) {
                    await ingestProjectFiles(projectId, filesToIngest);
                    logger.info(
                        `[Vector DB] Background ingestion complete for project ${projectId}.`
                    );
                } else {
                    logger.info(
                        `[Vector DB] No valid source files found to index for project ${projectId}.`
                    );
                }
            } catch (error) {
                logger.error(
                    `Failed to create project for project ${projectId} by job id: ${job.id}`
                );
                logger.error(error);
            }
        } catch (error) {
            logger.error(
                `Failed to import GitHub repo for project ${projectId} by job id: ${job.id}`
            );
            logger.error(error);
        }
    },
};

export default workers;
