"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../../utils/logger"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const prisma_1 = require("../../db/prisma");
const r2Manager_1 = __importDefault(require("../../services/r2Manager"));
const dockerManager_1 = __importDefault(require("../../services/dockerManager"));
const validators_1 = __importDefault(require("./validators"));
const queueActions_1 = __importDefault(require("../queue/queueActions"));
const argon2_1 = __importDefault(require("argon2"));
const controllers = {
    createProject: async (req, res) => {
        try {
            const { name, description, stack, password, visibility } = req.body;
            const userId = req.meta.user?.id;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            let isPasswordProtected = false;
            let passwordHash = null;
            if (password !== undefined && typeof password === "string") {
                isPasswordProtected = true;
                passwordHash = await argon2_1.default.hash(password);
            }
            const existingProject = await prisma_1.prisma.project.findFirst({
                where: {
                    name,
                    ownerId: userId,
                },
            });
            if (existingProject) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "A project with this name already exists.",
                    statusCode: http_status_codes_1.StatusCodes.CONFLICT,
                });
            }
            const projectId = crypto.randomUUID();
            try {
                const user = await prisma_1.prisma.user.findUnique({
                    where: { id: userId },
                    select: { username: true },
                });
                if (!user) {
                    return (0, sendResponse_1.default)(res, {
                        success: false,
                        message: "User not found.",
                        statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                    });
                }
                const filesCopied = await r2Manager_1.default.copyBaseToProject(projectId, stack);
                if (filesCopied === -1) {
                    logger_1.default.error("Failed to copy base files to project.");
                    return (0, sendResponse_1.default)(res, {
                        success: false,
                        message: "Failed to create project. Please try again later.",
                        statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                    });
                }
                const project = await prisma_1.prisma.project.create({
                    data: {
                        id: projectId,
                        name,
                        description,
                        stack: stack,
                        visibility: visibility,
                        ownerId: userId,
                        isPasswordProtected,
                        passwordHash: isPasswordProtected ? passwordHash : null,
                    },
                });
                return (0, sendResponse_1.default)(res, {
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
                            tools: project.tools ?? [],
                        },
                    },
                });
            }
            catch (error) {
                logger_1.default.error("Error creating project:");
                logger_1.default.error(error);
                await Promise.all([
                    queueActions_1.default.addDeleteProjectJob(projectId),
                    queueActions_1.default.addContainerCleanupJob(projectId),
                ]);
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Failed to create project. Please try again later.",
                    statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                });
            }
        }
        catch (error) {
            logger_1.default.error("Error in createProject controller:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to create project. Please try again later.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    deleteProject: async (req, res) => {
        try {
            const { projectId, accountPassword } = req.body;
            const userId = req.meta.user?.id;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const project = await prisma_1.prisma.project.findUnique({
                where: {
                    id: projectId,
                },
            });
            if (!project) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Project not found.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            if (project.ownerId !== userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "You do not have permission to delete this project.",
                    statusCode: http_status_codes_1.StatusCodes.FORBIDDEN,
                });
            }
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "User not found for corresponding project.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            const isPasswordValid = await argon2_1.default.verify(user.passwordHash, accountPassword);
            if (!isPasswordValid) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Incorrect account password.",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            await Promise.all([queueActions_1.default.addDeleteProjectJob(projectId)]);
            await prisma_1.prisma.project.delete({
                where: { id: projectId },
            });
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Project deleted successfully.",
                data: { projectId },
            });
        }
        catch (error) {
            logger_1.default.error("Error in deleteProject controller:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to delete project. Please try again later.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    listProjects: async (req, res) => {
        try {
            const userId = req.meta.user?.id;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const projects = await prisma_1.prisma.project.findMany({
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
                    tools: true,
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
                    tools: project.tools ?? [],
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
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Projects retrieved successfully.",
                data: { projects: formattedProjects },
            });
        }
        catch (error) {
            logger_1.default.error("Error in listProjects controller:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to retrieve projects. Please try again later.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    getProjectDetails: async (req, res) => {
        try {
            const { projectId } = req.query;
            const result = validators_1.default.getProjectDetailsSchema.safeParse({ projectId });
            if (!result.success) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Invalid project ID format.",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            const userId = req.meta.user?.id;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const project = await prisma_1.prisma.project.findUnique({
                where: {
                    id: projectId,
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
                    tools: true,
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
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Project not found.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            const isOwner = project.ownerId === userId;
            const collaboratorRecord = project.collaborators.find((c) => c.user.id === userId);
            const isMember = !!collaboratorRecord;
            if (!isOwner && !isMember) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Permission Denied. This project is private",
                    statusCode: http_status_codes_1.StatusCodes.FORBIDDEN,
                });
            }
            let currentUserAccess = "NONE";
            if (isOwner) {
                currentUserAccess = "OWNER";
            }
            else if (isMember) {
                currentUserAccess = collaboratorRecord.access;
            }
            else if (project.visibility === "PUBLIC") {
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
                tools: project.tools ?? [],
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
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Project retrieved successfully.",
                data: { project: formattedProject },
            });
        }
        catch (error) {
            logger_1.default.error("Error in getProjectDetails controller:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to retrieve project details. Please try again later.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    startProject: async (req, res) => {
        const { projectId, password } = req.body;
        try {
            const userId = req.meta.user?.id;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const project = await prisma_1.prisma.project.findUnique({
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
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Project not found.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            const isOwner = project.ownerId === userId;
            const currentMemberRecord = project.collaborators.find((c) => c.userId === userId);
            const isMember = !!currentMemberRecord;
            if (!isOwner && !isMember) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Permission Denied. You do not have access to start this project.",
                    statusCode: http_status_codes_1.StatusCodes.FORBIDDEN,
                });
            }
            const currentUserAccess = isOwner ? "OWNER" : currentMemberRecord?.access;
            if (project.isPasswordProtected) {
                if (!password) {
                    return (0, sendResponse_1.default)(res, {
                        success: false,
                        message: "Password is required to start this project.",
                        statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                    });
                }
                const passwordValid = await argon2_1.default.verify(project.passwordHash, password);
                if (!passwordValid) {
                    return (0, sendResponse_1.default)(res, {
                        success: false,
                        message: "Incorrect password.",
                        statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                    });
                }
            }
            try {
                const containerInfo = await dockerManager_1.default.createDokitContainer(project.id, project.stack);
                if (!containerInfo.containerId) {
                    logger_1.default.error("Failed to create dokit container for project.");
                    return (0, sendResponse_1.default)(res, {
                        success: false,
                        message: "Failed to start project. Please try again later.",
                        statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                    });
                }
                const FileTree = await dockerManager_1.default.getFolderContent(project.id, "/");
                queueActions_1.default.addUpdateProjectLastAccessedJob(project.id).catch((error) => {
                    logger_1.default.error(`Failed to add update last accessed job for project ${project.id}:`);
                    logger_1.default.error(error);
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
                    tools: project.tools ?? [],
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
                return (0, sendResponse_1.default)(res, {
                    success: true,
                    message: "Project started successfully.",
                    data: {
                        project: formattedProjectInfo,
                        containerInfo,
                        FileTree,
                    },
                });
            }
            catch (error) {
                logger_1.default.error("Error starting project:");
                logger_1.default.error(error);
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Failed to start project. Please try again later.",
                    statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                });
            }
        }
        catch (error) {
            logger_1.default.error("Error in startProject controller:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to create project. Please try again later.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    changeProjectSettings: async (req, res) => {
        try {
            const { projectId, newName, description, visibility, isPasswordProtected, password, accountPassword, } = req.body;
            const userId = req.meta.user?.id;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "User not found.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            const isPasswordValid = await argon2_1.default.verify(user.passwordHash, accountPassword);
            if (!isPasswordValid) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Incorrect account password.",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            const project = await prisma_1.prisma.project.findUnique({
                where: { id: projectId },
            });
            if (!project) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Project not found.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            if (project.ownerId !== userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Permission Denied. Only the project owner can change settings.",
                    statusCode: http_status_codes_1.StatusCodes.FORBIDDEN,
                });
            }
            if (project.name !== newName) {
                const existingProject = await prisma_1.prisma.project.findFirst({
                    where: {
                        name: newName,
                        ownerId: userId,
                    },
                });
                if (existingProject) {
                    return (0, sendResponse_1.default)(res, {
                        success: false,
                        message: "A project with this name already exists.",
                        statusCode: http_status_codes_1.StatusCodes.CONFLICT,
                    });
                }
            }
            const updatedProject = await prisma_1.prisma.project.update({
                where: { id: project.id },
                data: {
                    name: newName,
                    description: description,
                    visibility: visibility,
                    passwordHash: password !== undefined
                        ? await argon2_1.default.hash(password)
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
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Project settings updated successfully.",
                data: {
                    project: formattedProject,
                },
            });
        }
        catch (error) {
            logger_1.default.error("Error in changeProjectSettings controller:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to update project settings.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    closeProject: async (req, res) => {
        try {
            const { projectId } = req.body;
            const userId = req.meta.user?.id;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const project = await prisma_1.prisma.project.findUnique({
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
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Project not found.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            const isOwner = project.ownerId === userId;
            const isMember = project.collaborators.length > 0;
            if (!isOwner && !isMember) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Permission Denied. Only the project owner or members can close this project.",
                    statusCode: http_status_codes_1.StatusCodes.FORBIDDEN,
                });
            }
            try {
                await queueActions_1.default.addContainerCleanupJob(projectId);
            }
            catch (error) {
                logger_1.default.error("Error stopping container in closeProject controller:");
                logger_1.default.error(error);
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Failed to close project. Please try again later.",
                    statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                });
            }
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Project closed successfully.",
                statusCode: http_status_codes_1.StatusCodes.OK,
            });
        }
        catch (error) {
            logger_1.default.error("Error in closeProject controller:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to close project.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    createProjectFromGitHub: async (req, res) => {
        try {
            const userId = req.meta.user?.id;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const { name, description, visibility, githubRepoUrl, password } = req.body;
            let isPasswordProtected = false;
            let passwordHash = null;
            if (password !== undefined && typeof password === "string") {
                isPasswordProtected = true;
                passwordHash = await argon2_1.default.hash(password);
            }
            const existingProject = await prisma_1.prisma.project.findFirst({
                where: {
                    name,
                    ownerId: userId,
                },
            });
            if (existingProject) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "A project with this name already exists.",
                    statusCode: http_status_codes_1.StatusCodes.CONFLICT,
                });
            }
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: userId },
                select: { username: true },
            });
            if (!user) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "User not found.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            const projectId = crypto.randomUUID();
            const project = await prisma_1.prisma.project.create({
                data: {
                    id: projectId,
                    name,
                    description,
                    stack: "BLANK",
                    visibility: visibility,
                    ownerId: userId,
                    isPasswordProtected,
                    passwordHash: isPasswordProtected ? passwordHash : null,
                },
            });
            try {
                const containerInfo = await dockerManager_1.default.createDokitContainerFromGithub(projectId, githubRepoUrl);
            }
            catch (error) {
                await prisma_1.prisma.project.delete({
                    where: { id: projectId },
                });
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Failed to create project from GitHub repository. Please check the repository URL, make sure it's a public repository.",
                    statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                });
            }
            queueActions_1.default.addSyncToR2Job(projectId).catch((error) => {
                logger_1.default.error(`Failed to add sync to R2 job for project ${projectId}:`);
                logger_1.default.error(error);
            });
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Project created successfully from GitHub repository.",
                data: {
                    project: {
                        ...project,
                        passwordHash: undefined,
                        isOwner: true,
                        ownerUsername: user.username,
                        currentUserAccess: "OWNER",
                        ownerId: userId,
                        members: [],
                        tools: [],
                    },
                },
            });
        }
        catch (error) {
            logger_1.default.error("Error in createProjectFromGitHub controller:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to create project from GitHub repository.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
};
exports.default = controllers;
