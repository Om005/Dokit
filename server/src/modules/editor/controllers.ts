import { prisma } from "@db/prisma";
import logger from "@utils/logger";
import sendResponse from "@utils/sendResponse";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import DockerManager from "services/dockerManager";
import { FileNode } from "types/express";

const controllers = {
    getFolderContent: async (req: Request, res: Response) => {
        try {
            const { projectId, folderPath } = req.body;
            const userId = req.meta.user?.id;
            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }
            const project = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    OR: [{ ownerId: userId }, { collaborators: { some: { userId: userId } } }],
                },
                select: { id: true },
            });
            if (!project) {
                return sendResponse(res, {
                    success: false,
                    message: "Project not found or you don't have permission to view it.",
                    statusCode: StatusCodes.FORBIDDEN,
                });
            }

            const content: Record<string, FileNode> | null = await DockerManager.getFolderContent(
                projectId,
                folderPath
            );

            if (content === null) {
                return sendResponse(res, {
                    success: false,
                    message: "Folder not found",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            return sendResponse(res, {
                success: true,
                message: "Folder content retrieved successfully",
                data: { content },
                statusCode: StatusCodes.OK,
            });
        } catch (error) {
            logger.error("Error in getFolderContent controller:");
            logger.error(error);
            sendResponse(res, {
                success: false,
                message: "Error getting folder content",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    getFileContent: async (req: Request, res: Response) => {
        try {
            const { projectId, filePath } = req.body;
            const userId = req.meta.user?.id;
            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }
            const project = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    OR: [{ ownerId: userId }, { collaborators: { some: { userId: userId } } }],
                },
                select: { id: true },
            });
            if (!project) {
                return sendResponse(res, {
                    success: false,
                    message: "Project not found or you don't have permission to view it.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            const content = await DockerManager.getFileContent(projectId, filePath);

            if (content === null) {
                return sendResponse(res, {
                    success: false,
                    message: "File not found",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            return sendResponse(res, {
                success: true,
                message: "File content retrieved successfully",
                data: { content },
                statusCode: StatusCodes.OK,
            });
        } catch (error) {
            logger.error("Error in getFileContent controller:");
            logger.error(error);
            sendResponse(res, {
                success: false,
                message: "Error getting file content",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    createNode: async (req: Request, res: Response) => {
        try {
            const { projectId, nodePath, isDir } = req.body;
            const userId = req.meta.user?.id;
            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }
            const project = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    OR: [
                        { ownerId: userId },
                        { collaborators: { some: { userId: userId, access: "WRITE" } } },
                    ],
                },
                select: { id: true },
            });
            if (!project) {
                return sendResponse(res, {
                    success: false,
                    message: "Project not found or you don't have permission to modify it.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }
            await DockerManager.createNode(projectId, nodePath, isDir).catch((error) => {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                return sendResponse(res, {
                    success: false,
                    message: `Error creating node: ${errorMessage}`,
                    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                });
            });

            return sendResponse(res, {
                success: true,
                message: "Node created successfully",
                statusCode: StatusCodes.OK,
            });
        } catch (error) {
            logger.error("Error in createNode controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Error creating node",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    deleteNode: async (req: Request, res: Response) => {
        try {
            const { projectId, nodePath } = req.body;
            const userId = req.meta.user?.id;
            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }
            const project = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    OR: [
                        { ownerId: userId },
                        { collaborators: { some: { userId: userId, access: "WRITE" } } },
                    ],
                },
                select: { id: true },
            });
            if (!project) {
                return sendResponse(res, {
                    success: false,
                    message: "Project not found or you don't have permission to modify it.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            await DockerManager.deleteNode(projectId, nodePath).catch((error) => {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                return sendResponse(res, {
                    success: false,
                    message: `Error deleting node: ${errorMessage}`,
                    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                });
            });

            return sendResponse(res, {
                success: true,
                message: "Node deleted successfully",
                statusCode: StatusCodes.OK,
            });
        } catch (error) {
            logger.error("Error in deleteNode controller:");
            logger.error(error);
            sendResponse(res, {
                success: false,
                message: "Error deleting node",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    renameNode: async (req: Request, res: Response) => {
        try {
            const { projectId, oldPath, newPath } = req.body;
            const userId = req.meta.user?.id;
            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }
            const project = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    OR: [
                        { ownerId: userId },
                        { collaborators: { some: { userId: userId, access: "WRITE" } } },
                    ],
                },
                select: { id: true },
            });
            if (!project) {
                return sendResponse(res, {
                    success: false,
                    message: "Project not found or you don't have permission to modify it.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            await DockerManager.renameNode(projectId, oldPath, newPath).catch((error) => {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                return sendResponse(res, {
                    success: false,
                    message: `Error renaming node: ${errorMessage}`,
                    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                });
            });

            return sendResponse(res, {
                success: true,
                message: "Node renamed successfully",
                statusCode: StatusCodes.OK,
            });
        } catch (error) {
            logger.error("Error in renameNode controller:");
            logger.error(error);
            sendResponse(res, {
                success: false,
                message: "Error renaming node",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
};

export default controllers;
