"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../../db/prisma");
const logger_1 = __importDefault(require("../../utils/logger"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const dockerManager_1 = __importDefault(require("../../services/dockerManager"));
const controllers = {
    getFolderContent: async (req, res) => {
        try {
            const { projectId, folderPath } = req.body;
            const userId = req.meta.user?.id;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const project = await prisma_1.prisma.project.findFirst({
                where: {
                    id: projectId,
                    OR: [{ ownerId: userId }, { collaborators: { some: { userId: userId } } }],
                },
                select: { id: true },
            });
            if (!project) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Project not found or you don't have permission to view it.",
                    statusCode: http_status_codes_1.StatusCodes.FORBIDDEN,
                });
            }
            const content = await dockerManager_1.default.getFolderContent(projectId, folderPath);
            if (content === null) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Folder not found",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Folder content retrieved successfully",
                data: { content },
                statusCode: http_status_codes_1.StatusCodes.OK,
            });
        }
        catch (error) {
            logger_1.default.error("Error in getFolderContent controller:");
            logger_1.default.error(error);
            (0, sendResponse_1.default)(res, {
                success: false,
                message: "Error getting folder content",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    getFileContent: async (req, res) => {
        try {
            const { projectId, filePath } = req.body;
            const userId = req.meta.user?.id;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const project = await prisma_1.prisma.project.findFirst({
                where: {
                    id: projectId,
                    OR: [{ ownerId: userId }, { collaborators: { some: { userId: userId } } }],
                },
                select: { id: true },
            });
            if (!project) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Project not found or you don't have permission to view it.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            const content = await dockerManager_1.default.getFileContent(projectId, filePath);
            if (content === null) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "File not found",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "File content retrieved successfully",
                data: { content },
                statusCode: http_status_codes_1.StatusCodes.OK,
            });
        }
        catch (error) {
            logger_1.default.error("Error in getFileContent controller:");
            logger_1.default.error(error);
            (0, sendResponse_1.default)(res, {
                success: false,
                message: "Error getting file content",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    createNode: async (req, res) => {
        try {
            const { projectId, nodePath, isDir } = req.body;
            const userId = req.meta.user?.id;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const project = await prisma_1.prisma.project.findFirst({
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
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Project not found or you don't have permission to modify it.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            await dockerManager_1.default.createNode(projectId, nodePath, isDir).catch((error) => {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: `Error creating node: ${errorMessage}`,
                    statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                });
            });
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Node created successfully",
                statusCode: http_status_codes_1.StatusCodes.OK,
            });
        }
        catch (error) {
            logger_1.default.error("Error in createNode controller:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Error creating node",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    deleteNode: async (req, res) => {
        try {
            const { projectId, nodePath } = req.body;
            const userId = req.meta.user?.id;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const project = await prisma_1.prisma.project.findFirst({
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
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Project not found or you don't have permission to modify it.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            await dockerManager_1.default.deleteNode(projectId, nodePath).catch((error) => {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: `Error deleting node: ${errorMessage}`,
                    statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                });
            });
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Node deleted successfully",
                statusCode: http_status_codes_1.StatusCodes.OK,
            });
        }
        catch (error) {
            logger_1.default.error("Error in deleteNode controller:");
            logger_1.default.error(error);
            (0, sendResponse_1.default)(res, {
                success: false,
                message: "Error deleting node",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    renameNode: async (req, res) => {
        try {
            const { projectId, oldPath, newPath } = req.body;
            const userId = req.meta.user?.id;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const project = await prisma_1.prisma.project.findFirst({
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
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "You don't have permission to modify it.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            await dockerManager_1.default.renameNode(projectId, oldPath, newPath).catch((error) => {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: `Error renaming node: ${errorMessage}`,
                    statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                });
            });
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Node renamed successfully",
                statusCode: http_status_codes_1.StatusCodes.OK,
            });
        }
        catch (error) {
            logger_1.default.error("Error in renameNode controller:");
            logger_1.default.error(error);
            (0, sendResponse_1.default)(res, {
                success: false,
                message: "Error renaming node",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    installEnvironmentTool: async (req, res) => {
        try {
            const userId = req.meta.user?.id;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const { projectId, toolName } = req.body;
            const project = await prisma_1.prisma.project.findFirst({
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
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Project not found or you don't have permission to modify it.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            await dockerManager_1.default.installTool(projectId, toolName).catch((error) => {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: `Error installing tool: ${errorMessage}`,
                    statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                });
            });
            await prisma_1.prisma.project.update({
                where: { id: projectId },
                data: {
                    tools: {
                        push: toolName,
                    },
                },
            });
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Tool installed successfully",
                statusCode: http_status_codes_1.StatusCodes.OK,
            });
        }
        catch (error) {
            logger_1.default.error("Error in installEnvironmentTool controller:");
            logger_1.default.error(error);
            (0, sendResponse_1.default)(res, {
                success: false,
                message: "Error installing tool",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    uninstallEnvironmentTool: async (req, res) => {
        try {
            const userId = req.meta.user?.id;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const { projectId, toolName } = req.body;
            const project = await prisma_1.prisma.project.findFirst({
                where: {
                    id: projectId,
                    OR: [
                        { ownerId: userId },
                        { collaborators: { some: { userId: userId, access: "WRITE" } } },
                    ],
                },
                select: { id: true, tools: true },
            });
            if (!project) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Project not found or you don't have permission to modify it.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            await dockerManager_1.default.uninstallTool(projectId, toolName).catch((error) => {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: `Error uninstalling tool: ${errorMessage}`,
                    statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                });
            });
            await prisma_1.prisma.project.update({
                where: { id: projectId },
                data: {
                    tools: {
                        set: project.tools.filter((tool) => tool !== toolName),
                    },
                },
            });
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Tool uninstalled successfully",
                statusCode: http_status_codes_1.StatusCodes.OK,
            });
        }
        catch (error) {
            logger_1.default.error("Error in uninstallEnvironmentTool controller:");
            logger_1.default.error(error);
            (0, sendResponse_1.default)(res, {
                success: false,
                message: "Error uninstalling tool",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
};
exports.default = controllers;
