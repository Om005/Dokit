import { Request, Response } from "express";
import { ChatRole } from "@generated/prisma";
import validators from "./validators";
import { prisma } from "@db/prisma";
import { retrieveContext } from "services/rag/retrievalService";
import logger from "@utils/logger";
import env from "@config/env";
import sendResponse from "@utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openRouter = createOpenRouter({
    apiKey: env.OPENROUTER_API_KEY,
});
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
    const prompt = `Create a short chat title (3-7 words, max ${CHAT_TITLE_MAX} characters). Return only the title, nothing else.\n\nMessage: ${message}`;

    try {
        const { text } = await generateText({
            model: openRouter(env.OPENROUTER_TITLE_MODEL),
            prompt,
        });
        const rawTitle = sanitizeChatTitle(text);
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
            const result = validators.createChat.safeParse(req.body);
            if (!result.success) {
                const message = result.error.issues[0]?.message;
                return sendResponse(res, {
                    success: false,
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: message || "Invalid request",
                });
            }
            const { projectId, title } = result.data;
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
            const result = validators.listChats.safeParse(req.query);
            if (!result.success) {
                const message = result.error.issues[0]?.message;
                return sendResponse(res, {
                    success: false,
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: message || "Invalid request",
                });
            }
            const { projectId, limit } = result.data;
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
                where: { projectId: normalizedProjectId, createdById: userId },
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
            const result = validators.getChat.safeParse(req.query);
            if (!result.success) {
                const message = result.error.issues[0]?.message;
                return sendResponse(res, {
                    success: false,
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: message || "Invalid request",
                });
            }
            const { chatId, limit, cursor } = result.data;
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
            const result = validators.addMessage.safeParse(req.body);
            if (!result.success) {
                const message = result.error.issues[0]?.message;
                return sendResponse(res, {
                    success: false,
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: message || "Invalid request",
                });
            }
            const { chatId, content } = result.data;
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
            const result = validators.deleteChat.safeParse(req.query);
            if (!result.success) {
                const message = result.error.issues[0]?.message;
                return sendResponse(res, {
                    success: false,
                    statusCode: StatusCodes.BAD_REQUEST,
                    message: message || "Invalid request",
                });
            }
            const { chatId } = result.data;
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
        const result = validators.handleProjectChat.safeParse(req.body);
        if (!result.success) {
            const message = result.error.issues[0]?.message;
            return sendResponse(res, {
                success: false,
                statusCode: StatusCodes.BAD_REQUEST,
                message: message || "Invalid request",
            });
        }
        const { projectId, message, chatId } = result.data;
        const userId = req.meta.user?.id;

        const trimmedMessage = typeof message === "string" ? message.trim() : "";

        if (!userId) {
            return sendResponse(res, {
                success: false,
                message: "Unauthorized",
                statusCode: StatusCodes.UNAUTHORIZED,
            });
        }

        const normalizedProjectId = normalizeProjectId(projectId);

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
            let existingSummary: string | null = null;

            if (activeChatId) {
                const existingChat = await prisma.chatThread.findUnique({
                    where: { id: activeChatId },
                    select: { id: true, projectId: true, summary: true },
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

                existingSummary = existingChat.summary;
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

            const contextChunks = await retrieveContext(trimmedMessage, normalizedProjectId);
            const sources = contextChunks.map((chunk) => ({
                filePath: chunk.filePath,
                entityType: chunk.entityType,
                language: chunk.language,
                similarity: chunk.similarity,
            }));

            let contextString = "";
            contextChunks.forEach((chunk) => {
                const name = chunk.metadata?.entityName ? ` '${chunk.metadata.entityName}'` : "";
                const lines = chunk.metadata
                    ? ` (Lines ${chunk.metadata.startRow}-${chunk.metadata.endRow})`
                    : "";
                contextString += `--- File: ${chunk.filePath} | Type: ${chunk.entityType}${name}${lines} ---\n`;
                contextString += `${chunk.content}\n\n`;
            });

            const memorySection = existingSummary
                ? `### Conversation Memory (what has been discussed so far)\n${existingSummary}\n`
                : "";

            const prompt = `You are ASTra, an AI pair programmer living inside the Dokit cloud IDE, built by om chavda. You have read every file in this codebase and internalized it completely — the architecture, the patterns, the quirks, all of it.

You are a brilliant friend. You explain things clearly, push back when something is a bad idea, and aren't afraid to say "honestly, I'd do it differently." You care about the code quality and the person asking.

### RULES:
1. **Be human:** Never say "based on the context", "according to the snippets", "the code shows". You know this code - just talk about it naturally.
2. **Be direct but warm:** Technical and precise, but not cold. You're a colleague, not a documentation page.
3. **Format well:** Use Markdown code blocks with correct language tags.
4. **No fake humility:** If you don't know something, give your best engineering judgment confidently - the way a senior dev says "I'd probably approach it like this" rather than "I don't have that information".

${memorySection}
### Codebase Context (relevant to this query)
${contextString || "No specific code chunks retrieved for this query."}

### User Message
${trimmedMessage}

---

### RESPONSE FORMAT
Respond with ONLY a valid JSON object. No text before or after. No markdown fences wrapping it.

{
  "reply": "<your response here — be helpful, clear, and a little human>",
  "summary": "<updated summary: take the existing summary above and append 1-2 sentences about what was discussed or decided in THIS exchange. If no existing summary, write 1-2 sentences for this exchange only. Focus on technical decisions, patterns, and solutions.>"
}`;

            const modelName = env.OPENROUTER_CHAT_MODEL ?? "qwen/qwen3-coder:free";
            const { text: rawText } = await generateText({
                model: openRouter(modelName),
                prompt,
            });
            let replyText = "";
            let updatedSummary: string | null = null;

            try {
                const cleaned = rawText
                    .trim()
                    .replace(/^```json\s*/i, "")
                    .replace(/^```\s*/i, "")
                    .replace(/```\s*$/i, "")
                    .trim();

                const parsed = JSON.parse(cleaned);
                replyText = typeof parsed.reply === "string" ? parsed.reply : rawText;
                updatedSummary = typeof parsed.summary === "string" ? parsed.summary : null;
            } catch {
                logger.warn(`[Chat] Failed to parse structured JSON for chat ${activeChatId}`);
                replyText = rawText;
            }

            const trimmedReply = replyText.trim();

            if (trimmedReply) {
                await prisma.chatMessage.create({
                    data: {
                        chatId: activeChatId,
                        role: ChatRole.ASSISTANT,
                        content: trimmedReply,
                        metadata: { model: modelName, sources },
                    },
                });

                await prisma.chatThread.update({
                    where: { id: activeChatId },
                    data: {
                        lastMessageAt: new Date(),
                        ...(updatedSummary && { summary: updatedSummary }),
                    },
                });
            }

            return sendResponse(res, {
                success: true,
                message: "Chat response generated.",
                statusCode: StatusCodes.OK,
                data: {
                    chatId: activeChatId,
                    ...(activeChatTitle && { chatTitle: activeChatTitle }),
                    reply: trimmedReply,
                },
            });
        } catch (error) {
            logger.error(
                `Chat generation failed: ${error instanceof Error ? error.message : String(error)}`
            );
            return sendResponse(res, {
                success: false,
                message: "Internal server error during chat generation.",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
};

export default controllers;
