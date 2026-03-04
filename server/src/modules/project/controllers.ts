import type { Request, Response } from "express";
import { S3Client, ListObjectsV2Command, CopyObjectCommand } from "@aws-sdk/client-s3";
import r2Client from "@config/r2";
import env from "@config/env";
import { ProjectStack, Visibility } from "@generated/prisma";
import logger from "@utils/logger";
import sendResponse from "@utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { prisma } from "@db/prisma";
import R2Manager from "services/r2Manager";
import DockerManager from "services/dockerManager";
import validators from "./validators";
import queueActions from "@modules/queue/queueActions";
import argon2 from "argon2";
import { FileNode } from "types/express";

const controllers = {
    createProject: async (req: Request, res: Response) => {
        try {
            const { name, description, stack, password, visibility } = req.body;
            let isPasswordProtected = false;
            let passwordHash: string | null = null;
            if (password !== undefined && typeof password === "string") {
                isPasswordProtected = true;

                passwordHash = await argon2.hash(password);
            }
            const userId = req.meta.user?.id;
            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }

            const existingProject = await prisma.project.findFirst({
                where: {
                    name,
                    ownerId: userId,
                },
            });
            if (existingProject) {
                return sendResponse(res, {
                    success: false,
                    message: "A project with this name already exists.",
                    statusCode: StatusCodes.CONFLICT,
                });
            }

            const projectId = crypto.randomUUID();

            try {
                const filesCopied = await R2Manager.copyBaseToProject(
                    projectId,
                    stack as ProjectStack
                );
                if (filesCopied === -1) {
                    logger.error("Failed to copy base files to project.");
                    return sendResponse(res, {
                        success: false,
                        message: "Failed to create project. Please try again later.",
                        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                    });
                }
                const containerInfo = await DockerManager.createDokitContainer(
                    projectId,
                    stack as ProjectStack
                );
                if (!containerInfo.containerId) {
                    logger.error("Failed to create dokit container for project.");
                    return sendResponse(res, {
                        success: false,
                        message: "Failed to create project. Please try again later.",
                        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                    });
                }
                const FileTree: Record<string, FileNode> | null =
                    await DockerManager.getFolderContent(projectId, "/");
                const project = await prisma.project.create({
                    data: {
                        id: projectId,
                        name,
                        description,
                        stack: stack as ProjectStack,
                        visibility: visibility as Visibility,
                        ownerId: userId,
                        isPasswordProtected,
                        passwordHash: isPasswordProtected ? passwordHash : null,
                    },
                });

                return sendResponse(res, {
                    success: true,
                    message: "Project created successfully.",
                    data: {
                        project: { ...project, passwordHash: undefined, ownerId: undefined },
                        containerInfo,
                        FileTree,
                    },
                });
            } catch (error) {
                logger.error("Error creating project:");
                logger.error(error);

                await R2Manager.deleteProject(projectId).catch((err) => {
                    logger.error("R2 Rollback failed:");
                    logger.error(err);
                });
                await DockerManager.deleteDokitContainer(projectId).catch((err) => {
                    logger.error("Docker Rollback failed:");
                    logger.error(err);
                });

                return sendResponse(res, {
                    success: false,
                    message: "Failed to create project. Please try again later.",
                    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                });
            }
        } catch (error) {
            logger.error("Error in createProject controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to create project. Please try again later.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    deleteProject: async (req: Request, res: Response) => {
        try {
            const { projectId, accountPassword } = req.body;

            const userId = req.meta.user?.id;
            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }
            const project = await prisma.project.findUnique({
                where: {
                    id: projectId,
                },
            });
            if (!project) {
                return sendResponse(res, {
                    success: false,
                    message: "Project not found.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                return sendResponse(res, {
                    success: false,
                    message: "User not found for corresponding project.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            const isPasswordValid = await argon2.verify(user.passwordHash, accountPassword);
            if (!isPasswordValid) {
                return sendResponse(res, {
                    success: false,
                    message: "Incorrect account password.",
                    statusCode: StatusCodes.BAD_REQUEST,
                });
            }

            if (project.ownerId !== userId) {
                return sendResponse(res, {
                    success: false,
                    message: "You do not have permission to delete this project.",
                    statusCode: StatusCodes.FORBIDDEN,
                });
            }
            await Promise.all([
                queueActions.addDeleteProjectJob(projectId),
                queueActions.addContainerCleanupJob(projectId),
            ]);

            await prisma.project.delete({
                where: { id: projectId },
            });

            return sendResponse(res, {
                success: true,
                message: "Project deleted successfully.",
                data: { projectId },
            });
        } catch (error) {
            logger.error("Error in deleteProject controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to delete project. Please try again later.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    listProjects: async (req: Request, res: Response) => {
        try {
            const userId = req.meta.user?.id;

            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }

            const projects = await prisma.project.findMany({
                where: {
                    ownerId: userId,
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    stack: true,
                    isPasswordProtected: true,
                    isArchived: true,
                    createdAt: true,
                    updatedAt: true,
                    lastAccessedAt: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

            return sendResponse(res, {
                success: true,
                message: "Projects retrieved successfully.",
                data: { projects },
            });
        } catch (error) {
            logger.error("Error in listProjects controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to retrieve projects. Please try again later.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    getProjectDetails: async (req: Request, res: Response) => {
        try {
            const { projectId } = req.query;
            const result = validators.getProjectDetailsSchema.safeParse({ projectId });
            if (!result.success) {
                return sendResponse(res, {
                    success: false,
                    message: "Invalid project ID format.",
                    statusCode: StatusCodes.BAD_REQUEST,
                });
            }
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
                    id: projectId as string,
                    ownerId: userId,
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    stack: true,
                    visibility: true,
                    isPasswordProtected: true,
                    isArchived: true,
                    createdAt: true,
                    updatedAt: true,
                    lastAccessedAt: true,
                },
            });

            if (!project) {
                return sendResponse(res, {
                    success: false,
                    message: "Project not found.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            return sendResponse(res, {
                success: true,
                message: "Project retrieved successfully.",
                data: { project },
            });
        } catch (error) {
            logger.error("Error in getProjectDetails controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to retrieve project details. Please try again later.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    startProject: async (req: Request, res: Response) => {
        try {
            const { name, password } = req.body;

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
                    name: name,
                    ownerId: userId,
                },
            });

            if (!project) {
                return sendResponse(res, {
                    success: false,
                    message: "Project not found.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            if (project.isPasswordProtected) {
                if (!password) {
                    return sendResponse(res, {
                        success: false,
                        message: "Password is required to start this project.",
                        statusCode: StatusCodes.BAD_REQUEST,
                    });
                }

                const passwordValid = await argon2.verify(project.passwordHash!, password);
                if (!passwordValid) {
                    return sendResponse(res, {
                        success: false,
                        message: "Incorrect password.",
                        statusCode: StatusCodes.BAD_REQUEST,
                    });
                }
            }

            try {
                const containerInfo = await DockerManager.createDokitContainer(
                    project.id,
                    project.stack
                );
                if (!containerInfo.containerId) {
                    logger.error("Failed to create dokit container for project.");
                    return sendResponse(res, {
                        success: false,
                        message: "Failed to start project. Please try again later.",
                        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                    });
                }

                const FileTree: Record<string, FileNode> | null =
                    await DockerManager.getFolderContent(project.id, "/");

                queueActions.addUpdateProjectLastAccessedJob(project.id).catch((error) => {
                    logger.error(
                        `Failed to add update last accessed job for project ${project.id}:`
                    );
                    logger.error(error);
                });

                return sendResponse(res, {
                    success: true,
                    message: "Project started successfully.",
                    data: {
                        project: { ...project, passwordHash: undefined, ownerId: undefined },
                        containerInfo,
                        FileTree,
                    },
                });
            } catch (error) {
                logger.error("Error starting project:");
                logger.error(error);
                return sendResponse(res, {
                    success: false,
                    message: "Failed to start project. Please try again later.",
                    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                });
            }
        } catch (error) {
            logger.error("Error in startProject controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to create project. Please try again later.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    changeProjectSettings: async (req: Request, res: Response) => {
        try {
            const {
                name,
                newName,
                description,
                visibility,
                isArchived,
                isPasswordProtected,
                newPassword,
                accountPassword,
            } = req.body;

            const userId = req.meta.user?.id;
            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }

            const user = await prisma.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                return sendResponse(res, {
                    success: false,
                    message: "User not found.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            const isPasswordValid = await argon2.verify(user.passwordHash, accountPassword);
            if (!isPasswordValid) {
                return sendResponse(res, {
                    success: false,
                    message: "Incorrect account password.",
                    statusCode: StatusCodes.BAD_REQUEST,
                });
            }

            const project = await prisma.project.findFirst({
                where: {
                    name: name,
                    ownerId: userId,
                },
            });

            if (!project) {
                return sendResponse(res, {
                    success: false,
                    message: "Project not found.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            if (project.name !== newName) {
                const existingProject = await prisma.project.findFirst({
                    where: {
                        name: newName,
                        ownerId: userId,
                    },
                });
                if (existingProject) {
                    return sendResponse(res, {
                        success: false,
                        message: "A project with this name already exists.",
                        statusCode: StatusCodes.CONFLICT,
                    });
                }
            }
            const updatedProject = await prisma.project.update({
                where: { id: project.id },
                data: {
                    name: newName,
                    description: description,
                    visibility: visibility as Visibility,
                    passwordHash:
                        newPassword !== undefined
                            ? await argon2.hash(newPassword)
                            : project.passwordHash,
                    isPasswordProtected: isPasswordProtected,
                    isArchived: isArchived,
                },
            });

            return sendResponse(res, {
                success: true,
                message: "Project settings updated successfully.",
                data: {
                    project: { ...updatedProject, passwordHash: undefined, ownerId: undefined },
                },
            });
        } catch (error) {
            logger.error("Error in changeProjectSettings controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to update project settings.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
};

export default controllers;
