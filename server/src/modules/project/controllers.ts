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
            const userId = req.meta.user?.id;
            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }
            let isPasswordProtected = false;
            let passwordHash: string | null = null;
            if (password !== undefined && typeof password === "string") {
                isPasswordProtected = true;

                passwordHash = await argon2.hash(password);
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
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { username: true },
                });
                if (!user) {
                    return sendResponse(res, {
                        success: false,
                        message: "User not found.",
                        statusCode: StatusCodes.NOT_FOUND,
                    });
                }

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
                        project: {
                            ...project,
                            passwordHash: undefined,
                            isOwner: true,
                            ownerUsername: user.username,
                            currentUserAccess: "OWNER",
                            ownerId: userId,
                            members: [],
                        },
                    },
                });
            } catch (error) {
                logger.error("Error creating project:");
                logger.error(error);

                await Promise.all([
                    queueActions.addDeleteProjectJob(projectId),
                    queueActions.addContainerCleanupJob(projectId),
                ]);

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

            if (project.ownerId !== userId) {
                return sendResponse(res, {
                    success: false,
                    message: "You do not have permission to delete this project.",
                    statusCode: StatusCodes.FORBIDDEN,
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
                    OR: [
                        { ownerId: userId },
                        {
                            collaborators: {
                                some: { userId: userId },
                            },
                        },
                    ],
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    stack: true,
                    isPasswordProtected: true,
                    visibility: true,
                    createdAt: true,
                    updatedAt: true,
                    lastAccessedAt: true,
                    ownerId: true,
                    owner: {
                        select: {
                            username: true,
                        },
                    },
                    collaborators: {
                        select: {
                            access: true,
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

            const formattedProjects = projects.map((project) => {
                const isOwner = project.ownerId === userId;

                const memberRecord = project.collaborators.find((c) => c.user.id === userId);
                const currentUserAccess = isOwner ? "OWNER" : memberRecord?.access || "READ";

                return {
                    id: project.id,
                    name: project.name,
                    description: project.description,
                    stack: project.stack,
                    isPasswordProtected: project.isPasswordProtected,
                    visibility: project.visibility,
                    createdAt: project.createdAt,
                    updatedAt: project.updatedAt,
                    lastAccessedAt: project.lastAccessedAt,

                    isOwner: isOwner,
                    ownerId: project.ownerId,
                    ownerUsername: project.owner.username,
                    members: project.collaborators.map((c) => ({
                        userId: c.user.id,
                        username: c.user.username,
                        accessLevel: c.access,
                    })),

                    currentUserAccess: currentUserAccess,
                };
            });

            return sendResponse(res, {
                success: true,
                message: "Projects retrieved successfully.",
                data: { projects: formattedProjects },
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

            const project = await prisma.project.findUnique({
                where: {
                    id: projectId as string,
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    stack: true,
                    visibility: true,
                    isPasswordProtected: true,
                    createdAt: true,
                    updatedAt: true,
                    lastAccessedAt: true,
                    ownerId: true,
                    owner: {
                        select: {
                            username: true,
                        },
                    },
                    collaborators: {
                        select: {
                            access: true,
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!project) {
                return sendResponse(res, {
                    success: false,
                    message: "Project not found.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            const isOwner = project.ownerId === userId;
            const collaboratorRecord = project.collaborators.find((c) => c.user.id === userId);
            const isMember = !!collaboratorRecord;

            if (!isOwner && !isMember) {
                return sendResponse(res, {
                    success: false,
                    message: "Permission Denied. This project is private",
                    statusCode: StatusCodes.FORBIDDEN,
                });
            }

            let currentUserAccess = "NONE";
            if (isOwner) {
                currentUserAccess = "OWNER";
            } else if (isMember) {
                currentUserAccess = collaboratorRecord.access;
            } else if (project.visibility === "PUBLIC") {
                currentUserAccess = "READ";
            }

            const formattedProject = {
                id: project.id,
                name: project.name,
                description: project.description,
                stack: project.stack,
                visibility: project.visibility,
                isPasswordProtected: project.isPasswordProtected,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
                lastAccessedAt: project.lastAccessedAt,

                isOwner: isOwner,
                ownerId: project.ownerId,
                ownerUsername: project.owner.username,

                members: project.collaborators.map((c) => ({
                    userId: c.user.id,
                    username: c.user.username,
                    accessLevel: c.access,
                })),

                currentUserAccess: currentUserAccess,
            };

            return sendResponse(res, {
                success: true,
                message: "Project retrieved successfully.",
                data: { project: formattedProject },
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
        const { projectId, password } = req.body;

        try {
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
                include: {
                    owner: {
                        select: { username: true },
                    },
                    collaborators: {
                        include: {
                            user: { select: { id: true, username: true } },
                        },
                    },
                },
            });

            if (!project) {
                return sendResponse(res, {
                    success: false,
                    message: "Project not found.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            const isOwner = project.ownerId === userId;
            const currentMemberRecord = project.collaborators.find((c) => c.userId === userId);
            const isMember = !!currentMemberRecord;

            if (!isOwner && !isMember) {
                return sendResponse(res, {
                    success: false,
                    message: "Permission Denied. You do not have access to start this project.",
                    statusCode: StatusCodes.FORBIDDEN,
                });
            }

            const currentUserAccess = isOwner ? "OWNER" : currentMemberRecord?.access;

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

                const formattedProjectInfo = {
                    id: project.id,
                    name: project.name,
                    description: project.description,
                    stack: project.stack,
                    isPasswordProtected: project.isPasswordProtected,
                    visibility: project.visibility,
                    createdAt: project.createdAt,
                    updatedAt: project.updatedAt,
                    lastAccessedAt: project.lastAccessedAt,

                    isOwner: isOwner,
                    ownerId: project.ownerId,
                    ownerUsername: project.owner.username,
                    members: project.collaborators.map((c) => ({
                        userId: c.user.id,
                        username: c.user.username,
                        accessLevel: c.access,
                    })),

                    currentUserAccess: currentUserAccess,
                };

                return sendResponse(res, {
                    success: true,
                    message: "Project started successfully.",
                    data: {
                        project: formattedProjectInfo,
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
                projectId,
                newName,
                description,
                visibility,
                isPasswordProtected,
                password,
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

            const project = await prisma.project.findUnique({
                where: { id: projectId },
            });

            if (!project) {
                return sendResponse(res, {
                    success: false,
                    message: "Project not found.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            if (project.ownerId !== userId) {
                return sendResponse(res, {
                    success: false,
                    message: "Permission Denied. Only the project owner can change settings.",
                    statusCode: StatusCodes.FORBIDDEN,
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
                        password !== undefined
                            ? await argon2.hash(password)
                            : isPasswordProtected
                              ? project.passwordHash
                              : null,
                    isPasswordProtected: isPasswordProtected,
                },
                include: {
                    owner: {
                        select: { username: true },
                    },
                    collaborators: {
                        select: {
                            access: true,
                            user: {
                                select: { id: true, username: true },
                            },
                        },
                    },
                },
            });

            const formattedProject = {
                id: updatedProject.id,
                name: updatedProject.name,
                description: updatedProject.description,
                stack: updatedProject.stack,
                visibility: updatedProject.visibility,
                isPasswordProtected: updatedProject.isPasswordProtected,
                createdAt: updatedProject.createdAt,
                updatedAt: updatedProject.updatedAt,
                lastAccessedAt: updatedProject.lastAccessedAt,

                isOwner: true,
                ownerId: updatedProject.ownerId,
                ownerUsername: updatedProject.owner.username,

                members: updatedProject.collaborators.map((c) => ({
                    userId: c.user.id,
                    username: c.user.username,
                    accessLevel: c.access,
                })),

                currentUserAccess: "OWNER",
            };

            return sendResponse(res, {
                success: true,
                message: "Project settings updated successfully.",
                data: {
                    project: formattedProject,
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

    closeProject: async (req: Request, res: Response) => {
        try {
            const { projectId } = req.body;

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
                include: {
                    collaborators: {
                        where: { userId: userId },
                        select: { userId: true },
                    },
                },
            });

            if (!project) {
                return sendResponse(res, {
                    success: false,
                    message: "Project not found.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            const isOwner = project.ownerId === userId;
            const isMember = project.collaborators.length > 0;

            if (!isOwner && !isMember) {
                return sendResponse(res, {
                    success: false,
                    message:
                        "Permission Denied. Only the project owner or members can close this project.",
                    statusCode: StatusCodes.FORBIDDEN,
                });
            }

            try {
                await queueActions.addContainerCleanupJob(projectId);
            } catch (error) {
                logger.error("Error stopping container in closeProject controller:");
                logger.error(error);
                return sendResponse(res, {
                    success: false,
                    message: "Failed to close project. Please try again later.",
                    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                });
            }

            return sendResponse(res, {
                success: true,
                message: "Project closed successfully.",
                statusCode: StatusCodes.OK,
            });
        } catch (error) {
            logger.error("Error in closeProject controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to close project.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
};

export default controllers;
