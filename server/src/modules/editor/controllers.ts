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
                    ownerId: userId,
                },
            });
            if (!project) {
                return sendResponse(res, {
                    success: false,
                    message: "Project not found",
                    statusCode: StatusCodes.NOT_FOUND,
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
                    ownerId: userId,
                },
            });
            if (!project) {
                return sendResponse(res, {
                    success: false,
                    message: "Project not found",
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
};

export default controllers;
