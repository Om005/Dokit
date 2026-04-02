import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import argon2 from "argon2";
import sendResponse from "@utils/sendResponse";
import logger from "@utils/logger";
import { prisma } from "@db/prisma";
import R2Manager from "services/r2Manager";
import env from "@config/env";
import queueActions from "@modules/queue/queueActions";
import { redisClient } from "@config/redisClient";

interface cookieOptions {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax" | "strict" | "none";
}

const cookieOptions: cookieOptions = {
    httpOnly: true,
    secure: env.IS_PRODUCTION === 1,
    sameSite: env.IS_PRODUCTION === 1 ? "none" : "lax",
};

const normalizeSessionPayload = (session: {
    id: string;
    ip: string;
    userAgent: string | null;
    device: unknown;
    browser: unknown;
    os: unknown;
    city: string | null;
    region: string | null;
    country: string | null;
    lastSeen: Date;
    createdAt: Date;
    expiresAt: Date;
}) => {
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
    getPublicProfile: async (req: Request, res: Response) => {
        try {
            const { username } = req.body;

            const user = await prisma.user.findFirst({
                where: { username },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                },
            });

            if (!user) {
                return sendResponse(res, {
                    success: false,
                    message: "User not found.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            const [profileReadme, pinnedProjects, publicProjects] = await Promise.all([
                R2Manager.getProfileReadme(user.id),
                prisma.project.findMany({
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
                prisma.project.findMany({
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

            return sendResponse(res, {
                success: true,
                message: "Profile retrieved successfully.",
                statusCode: StatusCodes.OK,
                data: {
                    user,
                    profileReadme,
                    pinnedProjects,
                    projects: publicProjects,
                },
            });
        } catch (error) {
            logger.error("Error in getPublicProfile controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to load profile.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    getMyProfile: async (req: Request, res: Response) => {
        try {
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
                return sendResponse(res, {
                    success: false,
                    message: "User not found.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            const [profileReadme, pinnedProjects, projects] = await Promise.all([
                R2Manager.getProfileReadme(userId),
                prisma.project.findMany({
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
                prisma.project.findMany({
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

            return sendResponse(res, {
                success: true,
                message: "Profile loaded successfully.",
                statusCode: StatusCodes.OK,
                data: {
                    user,
                    profileReadme,
                    pinnedProjects,
                    projects,
                },
            });
        } catch (error) {
            logger.error("Error in getMyProfile controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to load profile.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    updateSettings: async (req: Request, res: Response) => {
        try {
            const userId = req.meta.user?.id;
            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }

            const { twoFactorEnabled, signInEmailEnabled } = req.body;

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    ...(twoFactorEnabled !== undefined ? { twoFactorEnabled } : {}),
                    ...(signInEmailEnabled !== undefined ? { signInEmailEnabled } : {}),
                },
                select: {
                    twoFactorEnabled: true,
                    signInEmailEnabled: true,
                },
            });

            return sendResponse(res, {
                success: true,
                message: "Settings updated successfully.",
                statusCode: StatusCodes.OK,
                data: { settings: updatedUser },
            });
        } catch (error) {
            logger.error("Error in updateSettings controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to update settings.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    changePassword: async (req: Request, res: Response) => {
        try {
            const userId = req.meta.user?.id;
            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }

            const { oldPassword, newPassword } = req.body;

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { passwordHash: true },
            });

            if (!user) {
                return sendResponse(res, {
                    success: false,
                    message: "User not found.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            const isValid = await argon2.verify(user.passwordHash, oldPassword);
            if (!isValid) {
                return sendResponse(res, {
                    success: false,
                    message: "Old password is incorrect.",
                    statusCode: StatusCodes.BAD_REQUEST,
                });
            }

            const newHash = await argon2.hash(newPassword);
            await prisma.user.update({
                where: { id: userId },
                data: { passwordHash: newHash },
            });

            return sendResponse(res, {
                success: true,
                message: "Password updated successfully.",
                statusCode: StatusCodes.OK,
            });
        } catch (error) {
            logger.error("Error in changePassword controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to change password.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    deleteAccount: async (req: Request, res: Response) => {
        try {
            const userId = req.meta.user?.id;
            const sessionId = req.meta.user?.sessionId;
            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }

            const { password } = req.body;

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { passwordHash: true },
            });

            if (!user) {
                return sendResponse(res, {
                    success: false,
                    message: "User not found.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            const isValid = await argon2.verify(user.passwordHash, password);
            if (!isValid) {
                return sendResponse(res, {
                    success: false,
                    message: "Incorrect password.",
                    statusCode: StatusCodes.BAD_REQUEST,
                });
            }

            const userProjects = await prisma.project.findMany({
                where: { ownerId: userId },
                select: { id: true },
            });

            await Promise.all(
                userProjects.flatMap((project) => [
                    queueActions.addDeleteProjectJob(project.id),
                    queueActions.addContainerCleanupJob(project.id),
                ])
            );

            await Promise.all([
                prisma.session.deleteMany({ where: { userId } }),
                prisma.user.delete({ where: { id: userId } }),
                R2Manager.deleteProfileReadme(userId),
            ]);

            if (sessionId) {
                res.clearCookie("accessToken", cookieOptions);
                res.clearCookie("refreshToken", cookieOptions);
            }

            return sendResponse(res, {
                success: true,
                message: "Account deleted successfully.",
                statusCode: StatusCodes.OK,
            });
        } catch (error) {
            logger.error("Error in deleteAccount controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to delete account.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    listSessions: async (req: Request, res: Response) => {
        try {
            const userId = req.meta.user?.id;
            const currentSessionId = req.meta.user?.sessionId;
            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }

            const sessions = await prisma.session.findMany({
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

            return sendResponse(res, {
                success: true,
                message: "Sessions loaded successfully.",
                statusCode: StatusCodes.OK,
                data: { sessions: normalized },
            });
        } catch (error) {
            logger.error("Error in listSessions controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to load sessions.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    logoutSession: async (req: Request, res: Response) => {
        try {
            const userId = req.meta.user?.id;
            const currentSessionId = req.meta.user?.sessionId;
            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }

            const { sessionId } = req.body;

            const session = await prisma.session.findFirst({
                where: { id: sessionId, userId },
                select: { id: true },
            });

            if (!session) {
                return sendResponse(res, {
                    success: false,
                    message: "Session not found.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            await Promise.all([
                await prisma.session.delete({ where: { id: sessionId } }),
                await redisClient.del(`session:${sessionId}`),
            ]);

            if (sessionId === currentSessionId) {
                res.clearCookie("accessToken", cookieOptions);
                res.clearCookie("refreshToken", cookieOptions);
            }

            return sendResponse(res, {
                success: true,
                message: "Session logged out successfully.",
                statusCode: StatusCodes.OK,
                data: { sessionId },
            });
        } catch (error) {
            logger.error("Error in logoutSession controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to log out session.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    logoutOtherSessions: async (req: Request, res: Response) => {
        try {
            const userId = req.meta.user?.id;
            const currentSessionId = req.meta.user?.sessionId;
            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }

            const sessionsToDelete = await prisma.session.findMany({
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
                    prisma.session.deleteMany({
                        where: {
                            id: { in: sessionIdsToDelete },
                        },
                    }),
                    redisClient.del(sessionIdsToDelete.map((id) => `session:${id}`)),
                ]);
            }

            return sendResponse(res, {
                success: true,
                message: "Logged out from other sessions.",
                statusCode: StatusCodes.OK,
            });
        } catch (error) {
            logger.error("Error in logoutOtherSessions controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to log out other sessions.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    updateProfileReadme: async (req: Request, res: Response) => {
        try {
            const userId = req.meta.user?.id;
            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }

            const content = (req.body.content || "").trim();

            if (!content) {
                await R2Manager.deleteProfileReadme(userId);
                return sendResponse(res, {
                    success: true,
                    message: "Profile readme removed successfully.",
                    statusCode: StatusCodes.OK,
                    data: { profileReadme: null },
                });
            }

            const success = await R2Manager.putProfileReadme(userId, content);
            if (!success) {
                return sendResponse(res, {
                    success: false,
                    message: "Failed to update profile readme.",
                    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                });
            }

            return sendResponse(res, {
                success: true,
                message: "Profile readme updated successfully.",
                statusCode: StatusCodes.OK,
                data: { profileReadme: content },
            });
        } catch (error) {
            logger.error("Error in updateProfileReadme controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to update profile readme.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    pinProject: async (req: Request, res: Response) => {
        try {
            const userId = req.meta.user?.id;
            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }

            const { projectId, pinned } = req.body;

            const project = await prisma.project.findFirst({
                where: { id: projectId, ownerId: userId },
                select: { id: true, visibility: true },
            });

            if (!project) {
                return sendResponse(res, {
                    success: false,
                    message: "Project not found.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            if (project.visibility !== "PUBLIC") {
                return sendResponse(res, {
                    success: false,
                    message: "Only public projects can be pinned.",
                    statusCode: StatusCodes.BAD_REQUEST,
                });
            }

            const updatedProject = await prisma.project.update({
                where: { id: projectId },
                data: { pinned },
                select: {
                    id: true,
                    pinned: true,
                },
            });

            return sendResponse(res, {
                success: true,
                message: pinned ? "Project pinned successfully." : "Project unpinned successfully.",
                statusCode: StatusCodes.OK,
                data: { project: updatedProject },
            });
        } catch (error) {
            logger.error("Error in pinProject controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to update pin status.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
};

export default controllers;
