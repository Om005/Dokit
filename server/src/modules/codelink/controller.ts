import { Request, Response } from "express";
import { brotliCompressSync, brotliDecompressSync, constants } from "node:zlib";
import sendResponse from "@utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import logger from "@utils/logger";
import { prisma } from "@db/prisma";
import argon2 from "argon2";
import validators from "./validators";

const MAX_CODE_LENGTH = 50_000;

const supportedLanguages = [
    "javascript",
    "typescript",
    "python",
    "java",
    "c",
    "cpp",
    "csharp",
    "go",
    "ruby",
    "php",
    "swift",
    "kotlin",
    "rust",
    "scala",
    "perl",
    "haskell",
    "lua",
    "r",
];

const controllers = {
    createCodeLink: async (req: Request, res: Response) => {
        try {
            const {
                title,
                description,
                language,
                code,
                visibility,
                password,
                allowedUserEmails,
                expiresAt,
                isPasswordProtected,
            } = req.body;
            const result = validators.createCodeLink.safeParse({
                title,
                description,
                language,
                code,
                visibility,
                password,
                allowedUserEmails,
                expiresAt,
                isPasswordProtected,
            });
            if (!result.success) {
                const message = result.error.issues[0]?.message;
                return sendResponse(res, {
                    success: false,
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: message || "Invalid request",
                });
            }
            const userId = req.meta.user?.id;
            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    statusCode: StatusCodes.UNAUTHORIZED,
                    message: "Unauthorized access, login to continue.",
                });
            }
            if (code.length > MAX_CODE_LENGTH) {
                return sendResponse(res, {
                    success: false,
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: `Code length exceeds the maximum limit of ${MAX_CODE_LENGTH} characters.`,
                });
            }

            if (!supportedLanguages.includes(language)) {
                return sendResponse(res, {
                    success: false,
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: `Unsupported language. Supported languages are: ${supportedLanguages.join(", ")}.`,
                });
            }

            if (expiresAt && new Date(expiresAt) < new Date()) {
                return sendResponse(res, {
                    success: false,
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: "Expiration date cannot be in the past.",
                });
            }
            const existingLink = await prisma.codeLink.findFirst({
                where: {
                    userId,
                    title,
                },
            });
            if (existingLink) {
                return sendResponse(res, {
                    success: false,
                    statusCode: StatusCodes.CONFLICT,
                    message: "A code link with the same title already exists.",
                });
            }
            const compressedCode = brotliCompressSync(Buffer.from(code, "utf-8"), {
                params: {
                    [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
                    [constants.BROTLI_PARAM_SIZE_HINT]: Buffer.byteLength(code, "utf-8"),
                },
            });
            const allowedUsers = allowedUserEmails
                ? await prisma.user.findMany({
                      where: {
                          email: {
                              in: allowedUserEmails,
                          },
                      },
                      select: {
                          id: true,
                      },
                  })
                : [];
            const newCodeLink = await prisma.codeLink.create({
                data: {
                    userId,
                    title,
                    description,
                    language,
                    compressedCode,
                    visibility,
                    isPasswordProtected: isPasswordProtected || !!password,
                    passwordHash: password ? await argon2.hash(password) : null,
                    expiresAt: expiresAt ? new Date(expiresAt) : null,
                    viewCount: 0,
                    allowedUsers:
                        allowedUsers.length > 0
                            ? {
                                  create: allowedUsers.map((user) => ({ userId: user.id })),
                              }
                            : undefined,
                },
            });

            return sendResponse(res, {
                success: true,
                statusCode: StatusCodes.CREATED,
                message: "Code link created successfully.",
                data: { linkId: newCodeLink.id },
            });
        } catch (error) {
            logger.error("Error in createCodeLink controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                message: "An error occurred while creating the code link.",
            });
        }
    },

    getCodeLinks: async (req: Request, res: Response) => {
        try {
            const userId = req.meta.user?.id;
            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    statusCode: StatusCodes.UNAUTHORIZED,
                    message: "Unauthorized access, login to continue.",
                });
            }

            const codeLinks = await prisma.codeLink.findMany({
                where: {
                    userId,
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    language: true,
                    visibility: true,
                    isPasswordProtected: true,
                    expiresAt: true,
                    viewCount: true,
                    createdAt: true,
                },
            });

            return sendResponse(res, {
                success: true,
                statusCode: StatusCodes.OK,
                message: "Code links retrieved successfully.",
                data: { links: codeLinks },
            });
        } catch (error) {
            logger.error("Error in getCodeLinks controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                message: "An error occurred while retrieving the code links.",
            });
        }
    },

    getCodeLink: async (req: Request, res: Response) => {
        try {
            const result = validators.getCodeLink.safeParse(req.query);
            if (!result.success) {
                const message = result.error.issues[0]?.message;
                return sendResponse(res, {
                    success: false,
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: message || "Invalid request",
                });
            }
            const { linkId, password } = result.data;
            const userId = req.meta.user?.id;

            const codeLink = await prisma.codeLink.findUnique({
                where: { id: linkId },
                select: {
                    id: true,
                    title: true,
                    userId: true,
                    description: true,
                    language: true,
                    compressedCode: true,
                    visibility: true,
                    isPasswordProtected: true,
                    passwordHash: true,
                    expiresAt: true,
                    viewCount: true,
                    createdAt: true,
                    allowedUsers: {
                        select: {
                            user: {
                                select: {
                                    email: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!codeLink || (codeLink.expiresAt && codeLink.expiresAt < new Date())) {
                return sendResponse(res, {
                    success: false,
                    statusCode: StatusCodes.NOT_FOUND,
                    message: "Code link not found or expired.",
                });
            }
            if (codeLink.visibility === "RESTRICTED" && userId && userId !== codeLink.userId) {
                const allowedUser = await prisma.codeLinkAccess.findFirst({
                    where: {
                        codeLinkId: linkId,
                        userId: userId || "",
                    },
                });
                if (!allowedUser) {
                    return sendResponse(res, {
                        success: false,
                        statusCode: StatusCodes.FORBIDDEN,
                        message: "You do not have access to this code link.",
                    });
                }
            }
            if (codeLink.isPasswordProtected || codeLink.passwordHash) {
                if (!password) {
                    return sendResponse(res, {
                        success: false,
                        statusCode: StatusCodes.UNAUTHORIZED,
                        message: "Password is required to access this code link.",
                    });
                }
                if (!codeLink.passwordHash) {
                    return sendResponse(res, {
                        success: false,
                        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                        message: "Password is required but not configured properly.",
                    });
                }
                const isPasswordValid = await argon2.verify(codeLink.passwordHash, password);
                if (!isPasswordValid) {
                    return sendResponse(res, {
                        success: false,
                        statusCode: StatusCodes.UNAUTHORIZED,
                        message: "Invalid password.",
                    });
                }
            }

            const decompressedCode = brotliDecompressSync(codeLink.compressedCode).toString(
                "utf-8"
            );

            await prisma.codeLink.update({
                where: { id: linkId },
                data: { viewCount: { increment: 1 } },
            });

            const isOwner = userId === codeLink.userId;
            const allowedUserEmails = isOwner
                ? codeLink.allowedUsers.map((au) => au.user.email)
                : undefined;

            return sendResponse(res, {
                success: true,
                statusCode: StatusCodes.OK,
                message: "Code link retrieved successfully.",
                data: {
                    id: codeLink.id,
                    isOwner,
                    title: codeLink.title,
                    description: codeLink.description,
                    language: codeLink.language,
                    code: decompressedCode,
                    visibility: codeLink.visibility,
                    isPasswordProtected: codeLink.isPasswordProtected,
                    allowedUserEmails,
                    expiresAt: codeLink.expiresAt,
                    viewCount: codeLink.viewCount + 1,
                    createdAt: codeLink.createdAt,
                },
            });
        } catch (error) {
            logger.error("Error in getCodeLink controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                message: "An error occurred while retrieving the code link.",
            });
        }
    },

    deleteCodeLink: async (req: Request, res: Response) => {
        try {
            const result = validators.deleteCodeLink.safeParse(req.query);
            if (!result.success) {
                const message = result.error.issues[0]?.message;
                return sendResponse(res, {
                    success: false,
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: message || "Invalid request",
                });
            }
            const { linkId } = result.data;
            const userId = req.meta.user?.id;
            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    statusCode: StatusCodes.UNAUTHORIZED,
                    message: "Unauthorized access, login to continue.",
                });
            }

            const codeLink = await prisma.codeLink.findUnique({
                where: { id: linkId },
                select: { userId: true },
            });

            if (!codeLink) {
                return sendResponse(res, {
                    success: false,
                    statusCode: StatusCodes.NOT_FOUND,
                    message: "Code link not found.",
                });
            }

            if (codeLink.userId !== userId) {
                return sendResponse(res, {
                    success: false,
                    statusCode: StatusCodes.FORBIDDEN,
                    message: "You do not have permission to delete this code link.",
                });
            }

            await prisma.codeLink.delete({
                where: { id: linkId },
            });

            return sendResponse(res, {
                success: true,
                statusCode: StatusCodes.OK,
                message: "Code link deleted successfully.",
            });
        } catch (error) {
            logger.error("Error in deleteCodeLink controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                message: "An error occurred while deleting the code link.",
            });
        }
    },

    updateCodeLink: async (req: Request, res: Response) => {
        try {
            const result = validators.updateCodeLink.safeParse(req.body);
            if (!result.success) {
                const message = result.error.issues[0]?.message;
                return sendResponse(res, {
                    success: false,
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: message || "Invalid request",
                });
            }

            const {
                linkId,
                title,
                description,
                language,
                code,
                visibility,
                isPasswordProtected,
                password,
                allowedUserEmails,
                expiresAt,
            } = result.data;
            const userId = req.meta.user?.id;
            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    statusCode: StatusCodes.UNAUTHORIZED,
                    message: "Unauthorized access, login to continue.",
                });
            }

            const codeLink = await prisma.codeLink.findUnique({
                where: { id: linkId },
                select: { userId: true },
            });

            if (!codeLink) {
                return sendResponse(res, {
                    success: false,
                    statusCode: StatusCodes.NOT_FOUND,
                    message: "Code link not found.",
                });
            }

            if (codeLink.userId !== userId) {
                return sendResponse(res, {
                    success: false,
                    statusCode: StatusCodes.FORBIDDEN,
                    message: "You do not have permission to update this code link.",
                });
            }

            const updateData: { [key: string]: unknown } = {};
            if (title !== undefined) updateData.title = title;
            if (description !== undefined) updateData.description = description;

            if (language !== undefined) {
                if (!supportedLanguages.includes(language)) {
                    return sendResponse(res, {
                        success: false,
                        statusCode: StatusCodes.BAD_REQUEST,
                        message: `Unsupported language. Supported languages are: ${supportedLanguages.join(", ")}.`,
                    });
                }
                updateData.language = language;
            }

            if (code !== undefined) {
                if (code.length > MAX_CODE_LENGTH) {
                    return sendResponse(res, {
                        success: false,
                        statusCode: StatusCodes.BAD_REQUEST,
                        message: `Code length exceeds the maximum limit of ${MAX_CODE_LENGTH} characters.`,
                    });
                }
                const compressedCode = brotliCompressSync(Buffer.from(code, "utf-8"), {
                    params: {
                        [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
                        [constants.BROTLI_PARAM_SIZE_HINT]: Buffer.byteLength(code, "utf-8"),
                    },
                });
                updateData.compressedCode = compressedCode;
            }

            if (visibility !== undefined) {
                updateData.visibility = visibility;
            }

            if (isPasswordProtected !== undefined) {
                updateData.isPasswordProtected = isPasswordProtected;
                if (!isPasswordProtected) {
                    updateData.passwordHash = null;
                }
            }

            if (password !== undefined) {
                updateData.passwordHash = password ? await argon2.hash(password) : null;
                updateData.isPasswordProtected = !!password;
            }

            if (expiresAt !== undefined) {
                updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
            }

            if (allowedUserEmails !== undefined) {
                await prisma.codeLinkAccess.deleteMany({
                    where: { codeLinkId: linkId },
                });
                const allowedUsers = await prisma.user.findMany({
                    where: {
                        email: {
                            in: allowedUserEmails,
                        },
                    },
                    select: {
                        id: true,
                    },
                });
                if (allowedUsers.length > 0) {
                    updateData.allowedUsers = {
                        create: allowedUsers.map((user) => ({ userId: user.id })),
                    };
                }
            }

            await prisma.codeLink.update({
                where: { id: linkId },
                data: updateData,
            });

            return sendResponse(res, {
                success: true,
                statusCode: StatusCodes.OK,
                message: "Code link updated successfully.",
            });
        } catch (error) {
            logger.error("Error in updateCodeLink controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                message: "An error occurred while updating the code link.",
            });
        }
    },
};

export default controllers;
