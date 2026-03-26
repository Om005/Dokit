import env from "@config/env";
import { MailerOptions } from "@config/mailer";
import { redisClient } from "@config/redisClient";
import { prisma } from "@db/prisma";
import queueActions from "@modules/queue/queueActions";
import emailTemplates from "@utils/emailTemplates";
import logger from "@utils/logger";
import sendResponse from "@utils/sendResponse";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { io } from "index";
import jwt from "jsonwebtoken";
const controllers = {
    requestAccess: async (req: Request, res: Response) => {
        const { projectId } = req.body;
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
                return sendResponse(res, {
                    success: false,
                    message: "Project not found",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            if (project.ownerId === userId) {
                return sendResponse(res, {
                    success: false,
                    message: "You are already the owner of this project",
                    statusCode: StatusCodes.BAD_REQUEST,
                });
            }
            if (project.collaborators.length > 0) {
                return sendResponse(res, {
                    success: false,
                    message: "You are already a member of this project.",
                    statusCode: StatusCodes.BAD_REQUEST,
                });
            }
            if (project.accessRequests.length > 0) {
                const existingRequest = project.accessRequests[0];

                if (existingRequest.status === "PENDING") {
                    return sendResponse(res, {
                        success: false,
                        message: "You already have a pending access request for this project.",
                        statusCode: StatusCodes.CONFLICT,
                    });
                }

                if (existingRequest.status === "REJECTED") {
                    return sendResponse(res, {
                        success: false,
                        message:
                            "Your previous request was declined. Please wait 24 hours before requesting access again.",
                        statusCode: StatusCodes.FORBIDDEN,
                    });
                }
            }
            const newRequest = await prisma.accessRequest.create({
                data: {
                    projectId,
                    userId,
                    status: "PENDING",
                },
            });
            const mailOptions: MailerOptions = {
                from: env.SENDER_EMAIL,
                to: project.owner.email,
                subject: `New Access Request for Your Project "${project.name}"`,
                htmlContent: emailTemplates.gotAccessRequestEmail(
                    req.meta.user?.email || "Someone",
                    project.name,
                    project.id.replaceAll("-", "")
                ),
            };
            queueActions.addEmailToQueue(mailOptions).catch((err) => {
                logger.error(
                    `Failed to queue access request email for project owner ${project.owner.email}:`,
                    err
                );
            });
            return sendResponse(res, {
                success: true,
                message: "Access request sent successfully",
                statusCode: StatusCodes.OK,
                data: {
                    requestId: newRequest.id,
                },
            });
        } catch (error) {
            logger.error("Error in requestAccess controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "An error occurred while processing your request",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    reviewAccessRequest: async (req: Request, res: Response) => {
        const { requestId, status } = req.body;
        try {
            const userId = req.meta.user?.id;
            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }
            const accessRequest = await prisma.accessRequest.findUnique({
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
                return sendResponse(res, {
                    success: false,
                    message: "Access request not found",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }
            if (userId !== accessRequest.project.ownerId) {
                return sendResponse(res, {
                    success: false,
                    message: "You don't have permission to review this request",
                    statusCode: StatusCodes.FORBIDDEN,
                });
            }

            if (accessRequest.status !== "PENDING") {
                return sendResponse(res, {
                    success: false,
                    message: `This request has already been ${accessRequest.status.toLowerCase()}.`,
                    statusCode: StatusCodes.BAD_REQUEST,
                });
            }

            if (status === "APPROVED") {
                await prisma.$transaction([
                    prisma.projectCollaborator.create({
                        data: {
                            projectId: accessRequest.projectId,
                            userId: accessRequest.userId,
                            access: "WRITE",
                        },
                    }),

                    prisma.accessRequest.delete({
                        where: { id: requestId },
                    }),
                ]);
            } else {
                await prisma.accessRequest.update({
                    where: { id: requestId },
                    data: { status: "REJECTED" },
                });

                queueActions.addRemoveRequestJob(requestId).catch((err) => {
                    logger.error(
                        `Failed to schedule access request cleanup for request ID ${requestId}:`,
                        err
                    );
                });
            }

            const mailOptions: MailerOptions = {
                from: env.SENDER_EMAIL,
                to: accessRequest.user.email,
                subject: `Your Access Request for Project "${accessRequest.project.name}" has been ${status}`,
                htmlContent: emailTemplates.reviewedAccessRequestEmail(
                    accessRequest.user.username,
                    accessRequest.project.name,
                    status,
                    accessRequest.projectId
                ),
            };
            queueActions.addEmailToQueue(mailOptions);
            return sendResponse(res, {
                success: true,
                message: "Access request reviewed successfully",
                data: {
                    user:
                        status === "APPROVED"
                            ? {
                                  userId: accessRequest.userId,
                                  username: accessRequest.user.username,
                                  accessLevel: "WRITE",
                              }
                            : undefined,
                },
                statusCode: StatusCodes.OK,
            });
        } catch (error) {
            logger.error("Error in reviewAccessRequest controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "An error occurred while processing your request",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    getPendingAccessRequests: async (req: Request, res: Response) => {
        const { projectId } = req.body;
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
                where: { id: projectId as string },
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
                return sendResponse(res, {
                    success: false,
                    message: "Project not found",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            if (project.ownerId !== userId) {
                return sendResponse(res, {
                    success: false,
                    message: "Permission Denied. Only the project owner can view access requests.",
                    statusCode: StatusCodes.FORBIDDEN,
                });
            }

            return sendResponse(res, {
                success: true,
                message: "Pending access requests retrieved successfully",
                statusCode: StatusCodes.OK,
                data: {
                    requests: project.accessRequests.map((req) => ({
                        id: req.id,
                        userId: req.userId,
                        username: req.user.username,
                    })),
                },
            });
        } catch (error) {
            logger.error("Error in getPendingAccessRequests controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "An error occurred while fetching pending access requests",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    inviteMember: async (req: Request, res: Response) => {
        const { projectId, email, accessLevel } = req.body;

        try {
            const ownerId = req.meta.user?.id;

            if (!ownerId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }

            const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: { ownerId: true, name: true },
            });

            if (!project) {
                return sendResponse(res, {
                    success: false,
                    message: "Project not found.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            if (project.ownerId !== ownerId) {
                return sendResponse(res, {
                    success: false,
                    message: "Permission Denied. Only the project owner can invite members.",
                    statusCode: StatusCodes.FORBIDDEN,
                });
            }

            const invitedUser = await prisma.user.findUnique({
                where: { email: email },
                select: { id: true, username: true },
            });

            if (!invitedUser) {
                return sendResponse(res, {
                    success: false,
                    message: "No user found with that email address.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            if (invitedUser.id === ownerId) {
                return sendResponse(res, {
                    success: false,
                    message: "You cannot invite yourself to your own project.",
                    statusCode: StatusCodes.BAD_REQUEST,
                });
            }

            const existingMember = await prisma.projectCollaborator.findUnique({
                where: {
                    projectId_userId: {
                        projectId: projectId,
                        userId: invitedUser.id,
                    },
                },
            });

            if (existingMember) {
                return sendResponse(res, {
                    success: false,
                    message: "This user is already a member of the project.",
                    statusCode: StatusCodes.CONFLICT,
                });
            }

            await prisma.$transaction([
                prisma.projectCollaborator.create({
                    data: {
                        projectId: projectId,
                        userId: invitedUser.id,
                        access: accessLevel,
                    },
                }),
                prisma.accessRequest.deleteMany({
                    where: {
                        projectId: projectId,
                        userId: invitedUser.id,
                    },
                }),
            ]);

            const mailOptions: MailerOptions = {
                from: env.SENDER_EMAIL,
                to: email,
                subject: `You've been invited to collaborate on "${project.name}"`,
                htmlContent: emailTemplates.projectInvitationEmail(
                    req.meta.user?.email || "Someone",
                    project.name,
                    projectId.replaceAll("-", "")
                ),
            };

            queueActions.addEmailToQueue(mailOptions).catch((err) => {
                logger.error(`Failed to queue invitation email for ${email}:`, err);
            });

            return sendResponse(res, {
                success: true,
                message: "Member invited successfully.",
                statusCode: StatusCodes.OK,
                data: {
                    user: {
                        userId: invitedUser.id,
                        username: invitedUser.username,
                        accessLevel: accessLevel,
                    },
                },
            });
        } catch (error) {
            logger.error("Error in inviteMember controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "An error occurred while inviting the member.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    changeMemberAccess: async (req: Request, res: Response) => {
        const { projectId, userId, newAccessLevel } = req.body;

        try {
            const reqUserId = req.meta.user?.id;

            if (!reqUserId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }

            if (reqUserId === userId) {
                return sendResponse(res, {
                    success: false,
                    message: "You cannot modify your own access level.",
                    statusCode: StatusCodes.BAD_REQUEST,
                });
            }

            const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: { ownerId: true },
            });

            if (!project) {
                return sendResponse(res, {
                    success: false,
                    message: "Project not found.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            if (project.ownerId !== reqUserId) {
                return sendResponse(res, {
                    success: false,
                    message: "Permission Denied. Only the project owner can change access levels.",
                    statusCode: StatusCodes.FORBIDDEN,
                });
            }

            const existingMember = await prisma.projectCollaborator.findUnique({
                where: {
                    projectId_userId: { projectId, userId },
                },
            });

            if (!existingMember) {
                return sendResponse(res, {
                    success: false,
                    message: "This user is not a member of the project.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            if (existingMember.access === newAccessLevel) {
                return sendResponse(res, {
                    success: false,
                    message: `User already has ${newAccessLevel} access.`,
                    statusCode: StatusCodes.BAD_REQUEST,
                });
            }

            await prisma.projectCollaborator.update({
                where: {
                    projectId_userId: { projectId, userId },
                },
                data: { access: newAccessLevel },
            });

            io.to(projectId).emit("MEMBER_ACCESS_CHANGED", {
                userId,
                newAccessLevel,
            });
            if (newAccessLevel === "READ") {
                await redisClient.del(`terminal_access_${userId}_${projectId}`);
            }
            return sendResponse(res, {
                success: true,
                message: `Member access updated to ${newAccessLevel} successfully.`,
                statusCode: StatusCodes.OK,
            });
        } catch (error) {
            logger.error("Error in changeMemberAccess controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "An error occurred while changing member access.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    removeMember: async (req: Request, res: Response) => {
        const { projectId, userId } = req.body;

        try {
            const reqUserId = req.meta.user?.id;

            if (!reqUserId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }

            if (reqUserId === userId) {
                return sendResponse(res, {
                    success: false,
                    message: "You cannot remove yourself from your own project.",
                    statusCode: StatusCodes.BAD_REQUEST,
                });
            }

            const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: { ownerId: true },
            });

            if (!project) {
                return sendResponse(res, {
                    success: false,
                    message: "Project not found.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            if (project.ownerId !== reqUserId) {
                return sendResponse(res, {
                    success: false,
                    message: "Permission Denied. Only the project owner can remove members.",
                    statusCode: StatusCodes.FORBIDDEN,
                });
            }

            const existingMember = await prisma.projectCollaborator.findUnique({
                where: {
                    projectId_userId: { projectId, userId },
                },
            });

            if (!existingMember) {
                return sendResponse(res, {
                    success: false,
                    message: "This user is not a member of the project.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            await prisma.projectCollaborator.delete({
                where: {
                    projectId_userId: { projectId, userId },
                },
            });

            io.to(projectId).emit("MEMBER_REMOVED", { userId });

            Promise.all([
                redisClient.del(`terminal_access_${userId}_${projectId}`),
                redisClient.del(`preview_access_${userId}_${projectId}`),
            ]);
            return sendResponse(res, {
                success: true,
                message: "Member removed from the project successfully.",
                statusCode: StatusCodes.OK,
            });
        } catch (error) {
            logger.error("Error in removeMember controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "An error occurred while removing the member.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    verifyTeminalAccess: async (req: Request, res: Response) => {
        try {
            const originalUri = req.headers["x-original-uri"] as string;
            if (!originalUri) return res.sendStatus(StatusCodes.BAD_REQUEST);
            const url = new URL(originalUri, `http://${req.headers.host}`);
            const pathParts = url.pathname.split("/");
            const projectId = pathParts[2];
            const userId = req.meta.user?.id;
            if (!userId) return res.sendStatus(StatusCodes.UNAUTHORIZED);

            const correctProjectId = projectId.replace(
                /(.{8})(.{4})(.{4})(.{4})(.{12})/,
                "$1-$2-$3-$4-$5"
            );
            const status = await redisClient.get(`terminal_access_${userId}_${correctProjectId}`);
            if (status === "true") {
                return res.sendStatus(StatusCodes.OK);
            }

            const project = await prisma.project.findUnique({
                where: { id: correctProjectId },
                include: { collaborators: { where: { userId } } },
            });
            if (!project) return res.sendStatus(StatusCodes.NOT_FOUND);

            const isOwner = project.ownerId === userId;
            const isCollaborator = project.collaborators.length > 0;

            if (!isOwner && !isCollaborator) {
                return res.sendStatus(StatusCodes.FORBIDDEN);
            }
            if (!isOwner && project.collaborators[0].access !== "WRITE") {
                return res.sendStatus(StatusCodes.FORBIDDEN);
            }
            await redisClient.set(`terminal_access_${userId}_${correctProjectId}`, "true", {
                EX: 60 * 60,
            });
            return res.sendStatus(StatusCodes.OK);
        } catch (error) {
            logger.error("Error in verifyTerminalAccess controller:");
            logger.error(error);
            return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
        }
        // return res.sendStatus(StatusCodes.OK);
    },

    previewAuth: async (req: Request, res: Response) => {
        try {
            const token = req.query.token as string;
            if (!token) return res.sendStatus(StatusCodes.UNAUTHORIZED);

            const originalHost = req.headers["x-original-host"] as string;
            if (!originalHost) return res.sendStatus(StatusCodes.BAD_REQUEST);

            const match = originalHost.match(/^\d+-([a-zA-Z0-9-]+)\./);
            if (!match) return res.sendStatus(StatusCodes.BAD_REQUEST);

            const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
            const userId = decoded.userId;

            const projectId = match[1].replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");

            const cacheKey = `preview_access_${userId}_${projectId}`;
            const cached = await redisClient.get(cacheKey);

            if (cached !== "true") {
                const project = await prisma.project.findUnique({
                    where: { id: projectId },
                    include: { collaborators: { where: { userId } } },
                });
                if (!project) return res.sendStatus(StatusCodes.NOT_FOUND);

                const hasAccess = project.ownerId === userId || project.collaborators.length > 0;
                if (!hasAccess) return res.sendStatus(StatusCodes.FORBIDDEN);

                await redisClient.set(cacheKey, "true", { EX: 60 * 60 });
            }

            const forwardedProto = (req.headers["x-forwarded-proto"] ?? "").toString();
            const isSecure = req.secure || forwardedProto.includes("https");
            const sameSite = env.IS_PRODUCTION === 1 || isSecure ? "None" : "Lax";
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
        } catch (error) {
            logger.error("previewAuth error:");
            logger.error(error);
            return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
        }
    },

    verifyPreviewAccess: async (req: Request, res: Response) => {
        try {
            const rawCookie = req.headers["cookie"] ?? "";
            const token = rawCookie.match(/(?:^|;\s*)preview_token=([^;]+)/)?.[1];

            if (!token) return res.sendStatus(StatusCodes.UNAUTHORIZED);

            const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
            const userId = decoded.userId;
            if (!userId) return res.sendStatus(StatusCodes.UNAUTHORIZED);

            const originalHost = req.headers["x-original-host"] as string;
            if (!originalHost) return res.sendStatus(StatusCodes.BAD_REQUEST);

            const match = originalHost.match(/^\d+-([a-zA-Z0-9-]+)\./);
            if (!match) return res.sendStatus(StatusCodes.BAD_REQUEST);

            const projectId = match[1].replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");

            const cacheKey = `preview_access_${userId}_${projectId}`;
            const cached = await redisClient.get(cacheKey);

            if (cached !== "true") {
                const project = await prisma.project.findUnique({
                    where: { id: projectId },
                    include: { collaborators: { where: { userId } } },
                });
                if (!project) return res.sendStatus(StatusCodes.NOT_FOUND);

                const hasAccess = project.ownerId === userId || project.collaborators.length > 0;
                if (!hasAccess) return res.sendStatus(StatusCodes.FORBIDDEN);

                await redisClient.set(cacheKey, "true", { EX: 60 * 60 });
            }

            return res.sendStatus(StatusCodes.OK);
        } catch (error) {
            logger.error("verifyPreviewAccess error:");
            logger.error(error);
            return res.sendStatus(StatusCodes.UNAUTHORIZED);
        }
    },
};

export default controllers;
