"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const argon2_1 = __importDefault(require("argon2"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const logger_1 = __importDefault(require("../../utils/logger"));
const prisma_1 = require("../../db/prisma");
const r2Manager_1 = __importDefault(require("../../services/r2Manager"));
const env_1 = __importDefault(require("../../config/env"));
const queueActions_1 = __importDefault(require("../queue/queueActions"));
const redisClient_1 = require("../../config/redisClient");
const cookieOptions = {
    httpOnly: true,
    secure: env_1.default.IS_PRODUCTION === 1,
    sameSite: env_1.default.IS_PRODUCTION === 1 ? "none" : "lax",
};
const normalizeSessionPayload = (session) => {
    return {
        id: session.id,
        ip: session.ip,
        userAgent: session.userAgent,
        device: session.device,
        browser: session.browser,
        os: session.os,
        city: session.city,
        region: session.region,
        country: session.country,
        lastSeen: session.lastSeen,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
    };
};
const controllers = {
    getPublicProfile: async (req, res) => {
        try {
            const { username } = req.body;
            const user = await prisma_1.prisma.user.findFirst({
                where: { username },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                },
            });
            if (!user) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "User not found.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            const [profileReadme, pinnedProjects, publicProjects] = await Promise.all([
                r2Manager_1.default.getProfileReadme(user.id),
                prisma_1.prisma.project.findMany({
                    where: { ownerId: user.id, visibility: "PUBLIC", pinned: true },
                    orderBy: { updatedAt: "desc" },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        stack: true,
                        createdAt: true,
                        pinned: true,
                    },
                }),
                prisma_1.prisma.project.findMany({
                    where: { ownerId: user.id, visibility: "PUBLIC" },
                    orderBy: { updatedAt: "desc" },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        stack: true,
                        createdAt: true,
                        pinned: true,
                    },
                }),
            ]);
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Profile retrieved successfully.",
                statusCode: http_status_codes_1.StatusCodes.OK,
                data: {
                    user,
                    profileReadme,
                    pinnedProjects,
                    projects: publicProjects,
                },
            });
        }
        catch (error) {
            logger_1.default.error("Error in getPublicProfile controller:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to load profile.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    getMyProfile: async (req, res) => {
        try {
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
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    twoFactorEnabled: true,
                    signInEmailEnabled: true,
                },
            });
            if (!user) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "User not found.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            const [profileReadme, pinnedProjects, projects] = await Promise.all([
                r2Manager_1.default.getProfileReadme(userId),
                prisma_1.prisma.project.findMany({
                    where: { ownerId: userId, visibility: "PUBLIC", pinned: true },
                    orderBy: { updatedAt: "desc" },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        stack: true,
                        isPasswordProtected: true,
                        createdAt: true,
                        pinned: true,
                    },
                }),
                prisma_1.prisma.project.findMany({
                    where: { ownerId: userId },
                    orderBy: { updatedAt: "desc" },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        stack: true,
                        isPasswordProtected: true,
                        visibility: true,
                        createdAt: true,
                        pinned: true,
                    },
                }),
            ]);
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Profile loaded successfully.",
                statusCode: http_status_codes_1.StatusCodes.OK,
                data: {
                    user,
                    profileReadme,
                    pinnedProjects,
                    projects,
                },
            });
        }
        catch (error) {
            logger_1.default.error("Error in getMyProfile controller:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to load profile.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    updateSettings: async (req, res) => {
        try {
            const userId = req.meta.user?.id;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const { signInEmailEnabled } = req.body;
            const updatedUser = await prisma_1.prisma.user.update({
                where: { id: userId },
                data: {
                    ...(signInEmailEnabled !== undefined ? { signInEmailEnabled } : {}),
                },
                select: {
                    signInEmailEnabled: true,
                },
            });
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Settings updated successfully.",
                statusCode: http_status_codes_1.StatusCodes.OK,
                data: { settings: updatedUser },
            });
        }
        catch (error) {
            logger_1.default.error("Error in updateSettings controller:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to update settings.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    changePassword: async (req, res) => {
        try {
            const userId = req.meta.user?.id;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const { oldPassword, newPassword } = req.body;
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: userId },
                select: { passwordHash: true },
            });
            if (!user) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "User not found.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            const isValid = await argon2_1.default.verify(user.passwordHash, oldPassword);
            if (!isValid) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Old password is incorrect.",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            const newHash = await argon2_1.default.hash(newPassword);
            await prisma_1.prisma.user.update({
                where: { id: userId },
                data: { passwordHash: newHash },
            });
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Password updated successfully.",
                statusCode: http_status_codes_1.StatusCodes.OK,
            });
        }
        catch (error) {
            logger_1.default.error("Error in changePassword controller:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to change password.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    deleteAccount: async (req, res) => {
        try {
            const userId = req.meta.user?.id;
            const sessionId = req.meta.user?.sessionId;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const { password } = req.body;
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: userId },
                select: { passwordHash: true },
            });
            if (!user) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "User not found.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            const isValid = await argon2_1.default.verify(user.passwordHash, password);
            if (!isValid) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Incorrect password.",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            const userProjects = await prisma_1.prisma.project.findMany({
                where: { ownerId: userId },
                select: { id: true },
            });
            await Promise.all(userProjects.flatMap((project) => [
                queueActions_1.default.addDeleteProjectJob(project.id),
                queueActions_1.default.addContainerCleanupJob(project.id),
            ]));
            await Promise.all([
                prisma_1.prisma.session.deleteMany({ where: { userId } }),
                prisma_1.prisma.user.delete({ where: { id: userId } }),
                r2Manager_1.default.deleteProfileReadme(userId),
            ]);
            if (sessionId) {
                res.clearCookie("accessToken", cookieOptions);
                res.clearCookie("refreshToken", cookieOptions);
            }
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Account deleted successfully.",
                statusCode: http_status_codes_1.StatusCodes.OK,
            });
        }
        catch (error) {
            logger_1.default.error("Error in deleteAccount controller:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to delete account.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    listSessions: async (req, res) => {
        try {
            const userId = req.meta.user?.id;
            const currentSessionId = req.meta.user?.sessionId;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const sessions = await prisma_1.prisma.session.findMany({
                where: { userId },
                orderBy: { lastSeen: "desc" },
                select: {
                    id: true,
                    ip: true,
                    userAgent: true,
                    device: true,
                    browser: true,
                    os: true,
                    city: true,
                    region: true,
                    country: true,
                    lastSeen: true,
                    createdAt: true,
                    expiresAt: true,
                },
            });
            const normalized = sessions.map((session) => ({
                ...normalizeSessionPayload(session),
                isCurrent: session.id === currentSessionId,
            }));
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Sessions loaded successfully.",
                statusCode: http_status_codes_1.StatusCodes.OK,
                data: { sessions: normalized },
            });
        }
        catch (error) {
            logger_1.default.error("Error in listSessions controller:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to load sessions.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    logoutSession: async (req, res) => {
        try {
            const userId = req.meta.user?.id;
            const currentSessionId = req.meta.user?.sessionId;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const { sessionId } = req.body;
            const session = await prisma_1.prisma.session.findFirst({
                where: { id: sessionId, userId },
                select: { id: true },
            });
            if (!session) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Session not found.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            await Promise.all([
                await prisma_1.prisma.session.delete({ where: { id: sessionId } }),
                await redisClient_1.redisClient.del(`session:${sessionId}`),
            ]);
            if (sessionId === currentSessionId) {
                res.clearCookie("accessToken", cookieOptions);
                res.clearCookie("refreshToken", cookieOptions);
            }
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Session logged out successfully.",
                statusCode: http_status_codes_1.StatusCodes.OK,
                data: { sessionId },
            });
        }
        catch (error) {
            logger_1.default.error("Error in logoutSession controller:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to log out session.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    logoutOtherSessions: async (req, res) => {
        try {
            const userId = req.meta.user?.id;
            const currentSessionId = req.meta.user?.sessionId;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const sessionsToDelete = await prisma_1.prisma.session.findMany({
                where: {
                    userId,
                    ...(currentSessionId ? { id: { not: currentSessionId } } : {}),
                },
                select: {
                    id: true,
                },
            });
            const sessionIdsToDelete = sessionsToDelete.map((session) => session.id);
            if (sessionIdsToDelete.length > 0) {
                await Promise.all([
                    prisma_1.prisma.session.deleteMany({
                        where: {
                            id: { in: sessionIdsToDelete },
                        },
                    }),
                    redisClient_1.redisClient.del(sessionIdsToDelete.map((id) => `session:${id}`)),
                ]);
            }
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Logged out from other sessions.",
                statusCode: http_status_codes_1.StatusCodes.OK,
            });
        }
        catch (error) {
            logger_1.default.error("Error in logoutOtherSessions controller:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to log out other sessions.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    updateProfileReadme: async (req, res) => {
        try {
            const userId = req.meta.user?.id;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const content = (req.body.content || "").trim();
            if (!content) {
                await r2Manager_1.default.deleteProfileReadme(userId);
                return (0, sendResponse_1.default)(res, {
                    success: true,
                    message: "Profile readme removed successfully.",
                    statusCode: http_status_codes_1.StatusCodes.OK,
                    data: { profileReadme: null },
                });
            }
            const success = await r2Manager_1.default.putProfileReadme(userId, content);
            if (!success) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Failed to update profile readme.",
                    statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
                });
            }
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Profile readme updated successfully.",
                statusCode: http_status_codes_1.StatusCodes.OK,
                data: { profileReadme: content },
            });
        }
        catch (error) {
            logger_1.default.error("Error in updateProfileReadme controller:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to update profile readme.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    pinProject: async (req, res) => {
        try {
            const userId = req.meta.user?.id;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const { projectId, pinned } = req.body;
            const project = await prisma_1.prisma.project.findFirst({
                where: { id: projectId, ownerId: userId },
                select: { id: true, visibility: true },
            });
            if (!project) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Project not found.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            if (project.visibility !== "PUBLIC") {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Only public projects can be pinned.",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            const updatedProject = await prisma_1.prisma.project.update({
                where: { id: projectId },
                data: { pinned },
                select: {
                    id: true,
                    pinned: true,
                },
            });
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: pinned ? "Project pinned successfully." : "Project unpinned successfully.",
                statusCode: http_status_codes_1.StatusCodes.OK,
                data: { project: updatedProject },
            });
        }
        catch (error) {
            logger_1.default.error("Error in pinProject controller:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "Failed to update pin status.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
};
exports.default = controllers;
