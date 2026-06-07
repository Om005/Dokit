import { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ChatRole } from "@generated/prisma";
import { prisma } from "@db/prisma";
import { retrieveContext } from "services/rag/retrievalService";
import logger from "@utils/logger";
import env from "@config/env";
import sendResponse from "@utils/sendResponse";
import { StatusCodes } from "http-status-codes";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const DEFAULT_CHAT_LIMIT = 50;
const MAX_CHAT_LIMIT = 200;
const CHAT_TITLE_MAX = 80;

const normalizeProjectId = (value: string) => {
    const trimmed = value.trim();
    if (/^[0-9a-fA-F]{32}$/.test(trimmed)) {
        return trimmed.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
    }
    return trimmed;
};

const clampLimit = (value: number, min: number, max: number) => {
    return Math.max(min, Math.min(value, max));
};

const buildChatTitle = (message: string) => {
    const trimmed = message.trim().replace(/\s+/g, " ");
    if (!trimmed) return null;
    if (trimmed.length <= CHAT_TITLE_MAX) return trimmed;
    return `${trimmed.slice(0, CHAT_TITLE_MAX - 3)}...`;
};

const sanitizeChatTitle = (value: string) => {
    const singleLine = value.replace(/\r?\n/g, " ").trim();
    const withoutQuotes = singleLine.replace(/^["'`]+|["'`]+$/g, "");
    return withoutQuotes.replace(/\s+/g, " ").trim();
};

const generateChatTitle = async (message: string) => {
    const prompt = `Create a short chat title (3-7 words, max ${CHAT_TITLE_MAX} characters). Return only the title.`;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(`${prompt}\n\nMessage: ${message}`);
        const rawTitle = sanitizeChatTitle(result.response.text());
        return buildChatTitle(rawTitle) ?? buildChatTitle(message);
    } catch (error) {
        logger.warn(
            `Failed to generate chat title: ${error instanceof Error ? error.message : String(error)}`
        );
        return buildChatTitle(message);
    }
};

const ensureProjectAccess = async (projectId: string, userId: string) => {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
            id: true,
            ownerId: true,
            collaborators: {
                where: { userId },
                select: { userId: true },
            },
        },
    });

    if (!project) {
        return {
            ok: false,
            statusCode: StatusCodes.NOT_FOUND,
            message: "Project not found.",
        };
    }

    const isOwner = project.ownerId === userId;
    const isMember = project.collaborators.length > 0;

    if (!isOwner && !isMember) {
        return {
            ok: false,
            statusCode: StatusCodes.FORBIDDEN,
            message: "Permission Denied. You do not have access to this project.",
        };
    }

    return { ok: true, project };
};

const controllers = {
    createChat: async (req: Request, res: Response) => {
        try {
            const { projectId, title } = req.body;
            const userId = req.meta.user?.id;

            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }

            const normalizedProjectId = normalizeProjectId(projectId);
            const access = await ensureProjectAccess(normalizedProjectId, userId);
            if (!access.ok) {
                return sendResponse(res, {
                    success: false,
                    message: access.message!,
                    statusCode: access.statusCode,
                });
            }

            const chat = await prisma.chatThread.create({
                data: {
                    projectId: normalizedProjectId,
                    createdById: userId,
                    title: title?.trim() || null,
                },
            });

            return sendResponse(res, {
                success: true,
                message: "Chat created successfully.",
                data: { chat },
            });
        } catch (error) {
            logger.error("Error in createChat controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to create chat.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    getChats: async (req: Request, res: Response) => {
        try {
            const { projectId, limit } = req.body;
            const userId = req.meta.user?.id;

            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }

            const normalizedProjectId = normalizeProjectId(projectId);
            const access = await ensureProjectAccess(normalizedProjectId, userId);
            if (!access.ok) {
                return sendResponse(res, {
                    success: false,
                    message: access.message!,
                    statusCode: access.statusCode,
                });
            }

            const take = clampLimit(Number(limit ?? DEFAULT_CHAT_LIMIT), 1, MAX_CHAT_LIMIT);
            const chats = await prisma.chatThread.findMany({
                where: { projectId: normalizedProjectId },
                orderBy: { lastMessageAt: "desc" },
                take,
                select: {
                    id: true,
                    title: true,
                    createdAt: true,
                    updatedAt: true,
                    lastMessageAt: true,
                    createdById: true,
                    _count: {
                        select: { messages: true },
                    },
                },
            });

            const formattedChats = chats.map((chat) => ({
                ...chat,
                messageCount: chat._count.messages,
            }));

            return sendResponse(res, {
                success: true,
                message: "Chats retrieved successfully.",
                data: { chats: formattedChats },
            });
        } catch (error) {
            logger.error("Error in getChats controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to retrieve chats.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    getChat: async (req: Request, res: Response) => {
        try {
            const { chatId, limit, cursor } = req.body;
            const userId = req.meta.user?.id;

            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }

            const chat = await prisma.chatThread.findUnique({
                where: { id: chatId },
                select: {
                    id: true,
                    title: true,
                    projectId: true,
                    createdById: true,
                    createdAt: true,
                    updatedAt: true,
                    lastMessageAt: true,
                },
            });

            if (!chat) {
                return sendResponse(res, {
                    success: false,
                    message: "Chat not found.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            const access = await ensureProjectAccess(chat.projectId, userId);
            if (!access.ok) {
                return sendResponse(res, {
                    success: false,
                    message: access.message!,
                    statusCode: access.statusCode,
                });
            }

            const take = clampLimit(Number(limit ?? DEFAULT_CHAT_LIMIT), 1, MAX_CHAT_LIMIT);
            const messages = await prisma.chatMessage.findMany({
                where: { chatId: chat.id },
                orderBy: { createdAt: "asc" },
                take,
                ...(cursor
                    ? {
                          cursor: { id: cursor },
                          skip: 1,
                      }
                    : {}),
            });

            return sendResponse(res, {
                success: true,
                message: "Chat retrieved successfully.",
                data: {
                    chat: {
                        ...chat,
                        messages,
                    },
                },
            });
        } catch (error) {
            logger.error("Error in getChat controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to retrieve chat.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    addMessage: async (req: Request, res: Response) => {
        try {
            const { chatId, content } = req.body;
            const userId = req.meta.user?.id;

            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }

            const chat = await prisma.chatThread.findUnique({
                where: { id: chatId },
                select: { id: true, projectId: true },
            });

            if (!chat) {
                return sendResponse(res, {
                    success: false,
                    message: "Chat not found.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            const access = await ensureProjectAccess(chat.projectId, userId);
            if (!access.ok) {
                return sendResponse(res, {
                    success: false,
                    message: access.message!,
                    statusCode: access.statusCode,
                });
            }

            const message = await prisma.chatMessage.create({
                data: {
                    chatId: chat.id,
                    role: ChatRole.USER,
                    content: content.trim(),
                    userId,
                },
            });

            await prisma.chatThread.update({
                where: { id: chat.id },
                data: { lastMessageAt: new Date() },
            });

            return sendResponse(res, {
                success: true,
                message: "Message added successfully.",
                data: { message },
            });
        } catch (error) {
            logger.error("Error in addMessage controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to add message.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    deleteChat: async (req: Request, res: Response) => {
        try {
            const { chatId } = req.body;
            const userId = req.meta.user?.id;

            if (!userId) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }

            const chat = await prisma.chatThread.findUnique({
                where: { id: chatId },
                select: { id: true, projectId: true },
            });

            if (!chat) {
                return sendResponse(res, {
                    success: false,
                    message: "Chat not found.",
                    statusCode: StatusCodes.NOT_FOUND,
                });
            }

            const access = await ensureProjectAccess(chat.projectId, userId);
            if (!access.ok) {
                return sendResponse(res, {
                    success: false,
                    message: access.message!,
                    statusCode: access.statusCode,
                });
            }

            await prisma.chatThread.delete({ where: { id: chat.id } });

            return sendResponse(res, {
                success: true,
                message: "Chat deleted successfully.",
                data: { chatId: chat.id },
            });
        } catch (error) {
            logger.error("Error in deleteChat controller:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to delete chat.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },

    handleProjectChat: async (req: Request, res: Response) => {
        const { projectId, message, chatId } = req.body;
        const userId = req.meta.user?.id;

        const trimmedMessage = typeof message === "string" ? message.trim() : "";

        if (!trimmedMessage) {
            return sendResponse(res, {
                success: false,
                message: "Message is required.",
                statusCode: StatusCodes.BAD_REQUEST,
            });
        }

        if (!userId) {
            return sendResponse(res, {
                success: false,
                message: "Unauthorized",
                statusCode: StatusCodes.UNAUTHORIZED,
            });
        }

        const normalizedProjectId = normalizeProjectId(projectId);
        let aborted = false;

        try {
            const access = await ensureProjectAccess(normalizedProjectId, userId);
            if (!access.ok) {
                return sendResponse(res, {
                    success: false,
                    message: access.message!,
                    statusCode: access.statusCode,
                });
            }

            let activeChatId = typeof chatId === "string" ? chatId.trim() : "";
            let activeChatTitle: string | null = null;

            if (activeChatId) {
                const existingChat = await prisma.chatThread.findUnique({
                    where: { id: activeChatId },
                    select: { id: true, projectId: true },
                });
                if (!existingChat) {
                    return sendResponse(res, {
                        success: false,
                        message: "Chat not found.",
                        statusCode: StatusCodes.NOT_FOUND,
                    });
                }
                if (existingChat.projectId !== normalizedProjectId) {
                    return sendResponse(res, {
                        success: false,
                        message: "Chat does not belong to this project.",
                        statusCode: StatusCodes.BAD_REQUEST,
                    });
                }
            } else {
                const generatedTitle = await generateChatTitle(trimmedMessage);
                const newChat = await prisma.chatThread.create({
                    data: {
                        projectId: normalizedProjectId,
                        createdById: userId,
                        title: generatedTitle,
                    },
                    select: { id: true, title: true },
                });
                activeChatId = newChat.id;
                activeChatTitle = newChat.title;
            }

            await prisma.chatMessage.create({
                data: {
                    chatId: activeChatId,
                    role: ChatRole.USER,
                    content: trimmedMessage,
                    userId,
                },
            });

            await prisma.chatThread.update({
                where: { id: activeChatId },
                data: { lastMessageAt: new Date() },
            });

            const contextChunks = await retrieveContext(trimmedMessage, normalizedProjectId);
            const sources = contextChunks.map((chunk) => ({
                filePath: chunk.filePath,
                entityType: chunk.entityType,
                language: chunk.language,
                similarity: chunk.similarity,
            }));

            let contextString = "Codebase Context:\n\n";
            contextChunks.forEach((chunk) => {
                contextString += `--- File: ${chunk.filePath} (${chunk.entityType}) ---\n`;
                contextString += `${chunk.content}\n\n`;
            });

            const prompt = `You are ASTra, an elite AI pair programmer native to the Dokit cloud IDE brought to life by om chavda. You have deeply internalized this entire codebase. You know the architecture, the design patterns, and the specific implementations as if you wrote them yourself.

Your memory of the codebase is provided below. Treat this as your organic knowledge.

### CRITICAL RULES:
1. **Total Immersion:** NEVER break character. You are strictly forbidden from using phrases like "based on the context provided", "according to the snippets", "the code shows", or "from what I can see". Speak directly to the code.
2. **Tone & Style:** Be direct, authoritative, and highly technical. Speak engineer-to-engineer.
3. **Precision Formatting:** Always use Markdown code blocks with the correct language tag. Keep explanations concise.
4. **Handling Unknowns:** If a request requires knowledge outside your current memory, do not apologize or claim ignorance. Instead, assert your senior engineering judgment to recommend the optimal architectural pattern (e.g., "We should handle that by implementing...").

--- INTERNALIZED MEMORY ---
${contextString}
--- END MEMORY ---

${trimmedMessage}
`;

            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
            res.setHeader("Cache-Control", "no-cache, no-transform");
            res.setHeader("Connection", "keep-alive");
            res.setHeader("X-Accel-Buffering", "no");

            if (typeof res.flushHeaders === "function") {
                res.flushHeaders();
            }

            const chatStartPayload: {
                text: string;
                chatId: string;
                type: string;
                chatTitle?: string;
            } = {
                text: "",
                chatId: activeChatId,
                type: "chat-start",
            };
            if (activeChatTitle) {
                chatStartPayload.chatTitle = activeChatTitle;
            }

            res.write(`data: ${JSON.stringify(chatStartPayload)}\n\n`);

            req.on("close", () => {
                aborted = true;
                logger.info(
                    `Client disconnected from chat stream for project: ${normalizedProjectId}`
                );
            });

            const result = await model.generateContentStream(prompt);
            let assistantText = "";

            for await (const chunk of result.stream) {
                if (aborted) break;

                const chunkText = chunk.text();

                if (chunkText) {
                    assistantText += chunkText;
                    res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
                }
            }

            if (!aborted) {
                const trimmedAssistant = assistantText.trim();
                if (trimmedAssistant) {
                    await prisma.chatMessage.create({
                        data: {
                            chatId: activeChatId,
                            role: ChatRole.ASSISTANT,
                            content: assistantText,
                            metadata: {
                                model: "gemini-2.5-flash",
                                sources,
                            },
                        },
                    });

                    await prisma.chatThread.update({
                        where: { id: activeChatId },
                        data: { lastMessageAt: new Date() },
                    });
                }

                res.write("data: [DONE]\n\n");
                res.end();
            }
        } catch (error) {
            logger.error(
                `Chat generation failed: ${error instanceof Error ? error.message : String(error)}`
            );

            if (!res.headersSent) {
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                    error: "Internal server error during chat generation",
                });
            }

            if (!aborted) {
                res.write(
                    `data: ${JSON.stringify({ error: "Stream interrupted due to server error" })}\n\n`
                );
                res.end();
            }
        }
    },
};

export default controllers;
