"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = __importDefault(require("../../config/env"));
const redisClient_1 = require("../../config/redisClient");
const prisma_1 = require("../../db/prisma");
const queueActions_1 = __importDefault(require("../queue/queueActions"));
const emailTemplates_1 = __importDefault(require("../../utils/emailTemplates"));
const logger_1 = __importDefault(require("../../utils/logger"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const index_1 = require("../../index");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const controllers = {
    requestAccess: async (req, res) => {
        const { projectId } = req.body;
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
                where: { id: projectId },
                select: {
                    id: true,
                    name: true,
                    ownerId: true,
                    owner: { select: { email: true } },
                    collaborators: {
                        where: { userId: userId },
                        select: { id: true },
                    },
                    accessRequests: {
                        where: { userId: userId },
                        select: { id: true, status: true },
                    },
                },
            });
            if (!project) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Project not found",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            if (project.ownerId === userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "You are already the owner of this project",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            if (project.collaborators.length > 0) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "You are already a member of this project.",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            if (project.accessRequests.length > 0) {
                const existingRequest = project.accessRequests[0];
                if (existingRequest.status === "PENDING") {
                    return (0, sendResponse_1.default)(res, {
                        success: false,
                        message: "You already have a pending access request for this project.",
                        statusCode: http_status_codes_1.StatusCodes.CONFLICT,
                    });
                }
                if (existingRequest.status === "REJECTED") {
                    return (0, sendResponse_1.default)(res, {
                        success: false,
                        message: "Your previous request was declined. Please wait 24 hours before requesting access again.",
                        statusCode: http_status_codes_1.StatusCodes.FORBIDDEN,
                    });
                }
            }
            const newRequest = await prisma_1.prisma.accessRequest.create({
                data: {
                    projectId,
                    userId,
                    status: "PENDING",
                },
            });
            const mailOptions = {
                from: env_1.default.SENDER_EMAIL,
                to: project.owner.email,
                subject: `New Access Request for Your Project "${project.name}"`,
                htmlContent: emailTemplates_1.default.gotAccessRequestEmail(req.meta.user?.email || "Someone", project.name, project.id.replaceAll("-", "")),
            };
            queueActions_1.default.addEmailToQueue(mailOptions).catch((err) => {
                logger_1.default.error(`Failed to queue access request email for project owner ${project.owner.email}:`, err);
            });
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Access request sent successfully",
                statusCode: http_status_codes_1.StatusCodes.OK,
                data: {
                    requestId: newRequest.id,
                },
            });
        }
        catch (error) {
            logger_1.default.error("Error in requestAccess controller:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "An error occurred while processing your request",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    reviewAccessRequest: async (req, res) => {
        const { requestId, status } = req.body;
        try {
            const userId = req.meta.user?.id;
            if (!userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const accessRequest = await prisma_1.prisma.accessRequest.findUnique({
                where: { id: requestId },
                select: {
                    id: true,
                    projectId: true,
                    userId: true,
                    status: true,
                    project: { select: { ownerId: true, name: true } },
                    user: { select: { email: true, username: true } },
                },
            });
            if (!accessRequest) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Access request not found",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            if (userId !== accessRequest.project.ownerId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "You don't have permission to review this request",
                    statusCode: http_status_codes_1.StatusCodes.FORBIDDEN,
                });
            }
            if (accessRequest.status !== "PENDING") {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: `This request has already been ${accessRequest.status.toLowerCase()}.`,
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            if (status === "APPROVED") {
                await prisma_1.prisma.$transaction([
                    prisma_1.prisma.projectCollaborator.create({
                        data: {
                            projectId: accessRequest.projectId,
                            userId: accessRequest.userId,
                            access: "WRITE",
                        },
                    }),
                    prisma_1.prisma.accessRequest.delete({
                        where: { id: requestId },
                    }),
                ]);
            }
            else {
                await prisma_1.prisma.accessRequest.update({
                    where: { id: requestId },
                    data: { status: "REJECTED" },
                });
                queueActions_1.default.addRemoveRequestJob(requestId).catch((err) => {
                    logger_1.default.error(`Failed to schedule access request cleanup for request ID ${requestId}:`, err);
                });
            }
            const mailOptions = {
                from: env_1.default.SENDER_EMAIL,
                to: accessRequest.user.email,
                subject: `Your Access Request for Project "${accessRequest.project.name}" has been ${status}`,
                htmlContent: emailTemplates_1.default.reviewedAccessRequestEmail(accessRequest.user.username, accessRequest.project.name, status, accessRequest.projectId),
            };
            queueActions_1.default.addEmailToQueue(mailOptions);
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Access request reviewed successfully",
                data: {
                    user: status === "APPROVED"
                        ? {
                            userId: accessRequest.userId,
                            username: accessRequest.user.username,
                            accessLevel: "WRITE",
                        }
                        : undefined,
                },
                statusCode: http_status_codes_1.StatusCodes.OK,
            });
        }
        catch (error) {
            logger_1.default.error("Error in reviewAccessRequest controller:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "An error occurred while processing your request",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    getPendingAccessRequests: async (req, res) => {
        const { projectId } = req.body;
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
                where: { id: projectId },
                select: {
                    ownerId: true,
                    accessRequests: {
                        where: { status: "PENDING" },
                        select: {
                            id: true,
                            userId: true,
                            user: {
                                select: { username: true },
                            },
                        },
                    },
                },
            });
            if (!project) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Project not found",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            if (project.ownerId !== userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Permission Denied. Only the project owner can view access requests.",
                    statusCode: http_status_codes_1.StatusCodes.FORBIDDEN,
                });
            }
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Pending access requests retrieved successfully",
                statusCode: http_status_codes_1.StatusCodes.OK,
                data: {
                    requests: project.accessRequests.map((req) => ({
                        id: req.id,
                        userId: req.userId,
                        username: req.user.username,
                    })),
                },
            });
        }
        catch (error) {
            logger_1.default.error("Error in getPendingAccessRequests controller:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "An error occurred while fetching pending access requests",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    inviteMember: async (req, res) => {
        const { projectId, email, accessLevel } = req.body;
        try {
            const ownerId = req.meta.user?.id;
            if (!ownerId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            const project = await prisma_1.prisma.project.findUnique({
                where: { id: projectId },
                select: { ownerId: true, name: true },
            });
            if (!project) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Project not found.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            if (project.ownerId !== ownerId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Permission Denied. Only the project owner can invite members.",
                    statusCode: http_status_codes_1.StatusCodes.FORBIDDEN,
                });
            }
            const invitedUser = await prisma_1.prisma.user.findUnique({
                where: { email: email },
                select: { id: true, username: true },
            });
            if (!invitedUser) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "No user found with that email address.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            if (invitedUser.id === ownerId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "You cannot invite yourself to your own project.",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            const existingMember = await prisma_1.prisma.projectCollaborator.findUnique({
                where: {
                    projectId_userId: {
                        projectId: projectId,
                        userId: invitedUser.id,
                    },
                },
            });
            if (existingMember) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "This user is already a member of the project.",
                    statusCode: http_status_codes_1.StatusCodes.CONFLICT,
                });
            }
            await prisma_1.prisma.$transaction([
                prisma_1.prisma.projectCollaborator.create({
                    data: {
                        projectId: projectId,
                        userId: invitedUser.id,
                        access: accessLevel,
                    },
                }),
                prisma_1.prisma.accessRequest.deleteMany({
                    where: {
                        projectId: projectId,
                        userId: invitedUser.id,
                    },
                }),
            ]);
            const mailOptions = {
                from: env_1.default.SENDER_EMAIL,
                to: email,
                subject: `You've been invited to collaborate on "${project.name}"`,
                htmlContent: emailTemplates_1.default.projectInvitationEmail(req.meta.user?.email || "Someone", project.name, projectId.replaceAll("-", "")),
            };
            queueActions_1.default.addEmailToQueue(mailOptions).catch((err) => {
                logger_1.default.error(`Failed to queue invitation email for ${email}:`, err);
            });
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Member invited successfully.",
                statusCode: http_status_codes_1.StatusCodes.OK,
                data: {
                    user: {
                        userId: invitedUser.id,
                        username: invitedUser.username,
                        accessLevel: accessLevel,
                    },
                },
            });
        }
        catch (error) {
            logger_1.default.error("Error in inviteMember controller:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "An error occurred while inviting the member.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    changeMemberAccess: async (req, res) => {
        const { projectId, userId, newAccessLevel } = req.body;
        try {
            const reqUserId = req.meta.user?.id;
            if (!reqUserId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            if (reqUserId === userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "You cannot modify your own access level.",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            const project = await prisma_1.prisma.project.findUnique({
                where: { id: projectId },
                select: { ownerId: true },
            });
            if (!project) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Project not found.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            if (project.ownerId !== reqUserId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Permission Denied. Only the project owner can change access levels.",
                    statusCode: http_status_codes_1.StatusCodes.FORBIDDEN,
                });
            }
            const existingMember = await prisma_1.prisma.projectCollaborator.findUnique({
                where: {
                    projectId_userId: { projectId, userId },
                },
            });
            if (!existingMember) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "This user is not a member of the project.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            if (existingMember.access === newAccessLevel) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: `User already has ${newAccessLevel} access.`,
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            await prisma_1.prisma.projectCollaborator.update({
                where: {
                    projectId_userId: { projectId, userId },
                },
                data: { access: newAccessLevel },
            });
            index_1.io.to(projectId).emit("MEMBER_ACCESS_CHANGED", {
                userId,
                newAccessLevel,
            });
            if (newAccessLevel === "READ") {
                await redisClient_1.redisClient.del(`terminal_access_${userId}_${projectId}`);
            }
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: `Member access updated to ${newAccessLevel} successfully.`,
                statusCode: http_status_codes_1.StatusCodes.OK,
            });
        }
        catch (error) {
            logger_1.default.error("Error in changeMemberAccess controller:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "An error occurred while changing member access.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    removeMember: async (req, res) => {
        const { projectId, userId } = req.body;
        try {
            const reqUserId = req.meta.user?.id;
            if (!reqUserId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
                });
            }
            if (reqUserId === userId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "You cannot remove yourself from your own project.",
                    statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
                });
            }
            const project = await prisma_1.prisma.project.findUnique({
                where: { id: projectId },
                select: { ownerId: true },
            });
            if (!project) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Project not found.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            if (project.ownerId !== reqUserId) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "Permission Denied. Only the project owner can remove members.",
                    statusCode: http_status_codes_1.StatusCodes.FORBIDDEN,
                });
            }
            const existingMember = await prisma_1.prisma.projectCollaborator.findUnique({
                where: {
                    projectId_userId: { projectId, userId },
                },
            });
            if (!existingMember) {
                return (0, sendResponse_1.default)(res, {
                    success: false,
                    message: "This user is not a member of the project.",
                    statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
                });
            }
            await prisma_1.prisma.projectCollaborator.delete({
                where: {
                    projectId_userId: { projectId, userId },
                },
            });
            index_1.io.to(projectId).emit("MEMBER_REMOVED", { userId });
            Promise.all([
                redisClient_1.redisClient.del(`terminal_access_${userId}_${projectId}`),
                redisClient_1.redisClient.del(`preview_access_${userId}_${projectId}`),
            ]);
            return (0, sendResponse_1.default)(res, {
                success: true,
                message: "Member removed from the project successfully.",
                statusCode: http_status_codes_1.StatusCodes.OK,
            });
        }
        catch (error) {
            logger_1.default.error("Error in removeMember controller:");
            logger_1.default.error(error);
            return (0, sendResponse_1.default)(res, {
                success: false,
                message: "An error occurred while removing the member.",
                statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
    verifyTeminalAccess: async (req, res) => {
        try {
            const originalUri = req.headers["x-original-uri"];
            if (!originalUri)
                return res.sendStatus(http_status_codes_1.StatusCodes.BAD_REQUEST);
            const url = new URL(originalUri, `http://${req.headers.host}`);
            const pathParts = url.pathname.split("/");
            const projectId = pathParts[2];
            const userId = req.meta.user?.id;
            if (!userId)
                return res.sendStatus(http_status_codes_1.StatusCodes.UNAUTHORIZED);
            const correctProjectId = projectId.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
            const status = await redisClient_1.redisClient.get(`terminal_access_${userId}_${correctProjectId}`);
            if (status === "true") {
                return res.sendStatus(http_status_codes_1.StatusCodes.OK);
            }
            const project = await prisma_1.prisma.project.findUnique({
                where: { id: correctProjectId },
                include: { collaborators: { where: { userId } } },
            });
            if (!project)
                return res.sendStatus(http_status_codes_1.StatusCodes.NOT_FOUND);
            const isOwner = project.ownerId === userId;
            const isCollaborator = project.collaborators.length > 0;
            if (!isOwner && !isCollaborator) {
                return res.sendStatus(http_status_codes_1.StatusCodes.FORBIDDEN);
            }
            if (!isOwner && project.collaborators[0].access !== "WRITE") {
                return res.sendStatus(http_status_codes_1.StatusCodes.FORBIDDEN);
            }
            await redisClient_1.redisClient.set(`terminal_access_${userId}_${correctProjectId}`, "true", {
                EX: 60 * 60,
            });
            return res.sendStatus(http_status_codes_1.StatusCodes.OK);
        }
        catch (error) {
            logger_1.default.error("Error in verifyTerminalAccess controller:");
            logger_1.default.error(error);
            return res.sendStatus(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
        }
    },
    previewAuth: async (req, res) => {
        try {
            const token = req.query.token;
            if (!token)
                return res.sendStatus(http_status_codes_1.StatusCodes.UNAUTHORIZED);
            const originalHost = req.headers["x-original-host"];
            if (!originalHost)
                return res.sendStatus(http_status_codes_1.StatusCodes.BAD_REQUEST);
            const match = originalHost.match(/^\d+-([a-zA-Z0-9-]+)\./);
            if (!match)
                return res.sendStatus(http_status_codes_1.StatusCodes.BAD_REQUEST);
            const decoded = jsonwebtoken_1.default.verify(token, env_1.default.JWT_SECRET);
            const userId = decoded.userId;
            const projectId = match[1].replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
            const cacheKey = `preview_access_${userId}_${projectId}`;
            const cached = await redisClient_1.redisClient.get(cacheKey);
            if (cached !== "true") {
                const project = await prisma_1.prisma.project.findUnique({
                    where: { id: projectId },
                    include: { collaborators: { where: { userId } } },
                });
                if (!project)
                    return res.sendStatus(http_status_codes_1.StatusCodes.NOT_FOUND);
                const hasAccess = project.ownerId === userId || project.collaborators.length > 0;
                if (!hasAccess)
                    return res.sendStatus(http_status_codes_1.StatusCodes.FORBIDDEN);
                await redisClient_1.redisClient.set(cacheKey, "true", { EX: 60 * 60 });
            }
            const forwardedProto = (req.headers["x-forwarded-proto"] ?? "").toString();
            const isSecure = req.secure || forwardedProto.includes("https");
            const sameSite = env_1.default.IS_PRODUCTION === 1 || isSecure ? "None" : "Lax";
            const cookieParts = [
                `preview_token=${token}`,
                "Path=/",
                "Max-Age=3600",
                "HttpOnly",
                `SameSite=${sameSite}`,
            ];
            if (sameSite === "None") {
                cookieParts.push("Secure");
            }
            res.setHeader("Set-Cookie", cookieParts.join("; "));
            return res.redirect("/");
        }
        catch (error) {
            logger_1.default.error("previewAuth error:");
            logger_1.default.error(error);
            return res.sendStatus(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
        }
    },
    verifyPreviewAccess: async (req, res) => {
        try {
            const rawCookie = req.headers["cookie"] ?? "";
            const token = rawCookie.match(/(?:^|;\s*)preview_token=([^;]+)/)?.[1];
            if (!token)
                return res.sendStatus(http_status_codes_1.StatusCodes.UNAUTHORIZED);
            const decoded = jsonwebtoken_1.default.verify(token, env_1.default.JWT_SECRET);
            const userId = decoded.userId;
            if (!userId)
                return res.sendStatus(http_status_codes_1.StatusCodes.UNAUTHORIZED);
            const originalHost = req.headers["x-original-host"];
            if (!originalHost)
                return res.sendStatus(http_status_codes_1.StatusCodes.BAD_REQUEST);
            const match = originalHost.match(/^\d+-([a-zA-Z0-9-]+)\./);
            if (!match)
                return res.sendStatus(http_status_codes_1.StatusCodes.BAD_REQUEST);
            const projectId = match[1].replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
            const cacheKey = `preview_access_${userId}_${projectId}`;
            const cached = await redisClient_1.redisClient.get(cacheKey);
            if (cached !== "true") {
                const project = await prisma_1.prisma.project.findUnique({
                    where: { id: projectId },
                    include: { collaborators: { where: { userId } } },
                });
                if (!project)
                    return res.sendStatus(http_status_codes_1.StatusCodes.NOT_FOUND);
                const hasAccess = project.ownerId === userId || project.collaborators.length > 0;
                if (!hasAccess)
                    return res.sendStatus(http_status_codes_1.StatusCodes.FORBIDDEN);
                await redisClient_1.redisClient.set(cacheKey, "true", { EX: 60 * 60 });
            }
            return res.sendStatus(http_status_codes_1.StatusCodes.OK);
        }
        catch (error) {
            logger_1.default.error("verifyPreviewAccess error:");
            logger_1.default.error(error);
            return res.sendStatus(http_status_codes_1.StatusCodes.UNAUTHORIZED);
        }
    },
};
exports.default = controllers;
