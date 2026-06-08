import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import createApiHandler from "@/utils/apiHandler";
import { ApiResponse } from "@/types/types";
import { persistReducer } from "redux-persist";
import storageSession from "redux-persist/lib/storage/session";
import api from "@/utils/api";

export type ChatRole = "USER" | "ASSISTANT" | "SYSTEM";

export interface ChatMessage {
    id: string;
    chatId: string;
    role: ChatRole;
    content: string;
    userId?: string | null;
    createdAt: string;
    metadata?: Record<string, unknown> | null;
}

export interface ChatThread {
    id: string;
    title: string | null;
    createdAt: string;
    updatedAt: string;
    lastMessageAt: string;
    createdById: string;
    messageCount: number;
}

interface ChatState {
    chats: ChatThread[];
    messagesByChat: Record<string, ChatMessage[]>;
    activeChatId: string | null;
    loadingChats: boolean;
    creatingChat: boolean;
    gettingChat: boolean;
    addingMessage: boolean;
    deletingChat: boolean;
    streamingChat: boolean;
    streamingError: string | null;
}

interface ProjectChatResult {
    chatId: string;
    assistantMessage: string;
    chatTitle?: string | null;
}

const createClientId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizeChatThread = (chat: {
    id: string;
    title?: string | null;
    createdAt: string;
    updatedAt?: string;
    lastMessageAt?: string;
    createdById: string;
    messageCount?: number;
}): ChatThread => {
    return {
        id: chat.id,
        title: chat.title ?? null,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt ?? chat.createdAt,
        lastMessageAt: chat.lastMessageAt ?? chat.updatedAt ?? chat.createdAt,
        createdById: chat.createdById,
        messageCount: chat.messageCount ?? 0,
    };
};

const upsertChat = (state: ChatState, chat: ChatThread) => {
    const index = state.chats.findIndex((item) => item.id === chat.id);
    if (index >= 0) {
        state.chats[index] = { ...state.chats[index], ...chat };
    } else {
        state.chats.unshift(chat);
    }
};

const appendMessage = (state: ChatState, message: ChatMessage) => {
    if (!state.messagesByChat[message.chatId]) {
        state.messagesByChat[message.chatId] = [];
    }
    state.messagesByChat[message.chatId].push(message);
};

const chatActions = {
    createChat: createAsyncThunk<
        ApiResponse,
        { projectId: string; title?: string },
        { rejectValue: ApiResponse }
    >(
        "chat/createChat",
        createApiHandler<{ projectId: string; title?: string }>("/api/chat/create-chat", "post")
    ),

    listChats: createAsyncThunk<
        ApiResponse,
        { projectId: string; limit?: number },
        { rejectValue: ApiResponse }
    >(
        "chat/listChats",
        createApiHandler<{ projectId: string; limit?: number }>("/api/chat/list-chats", "post")
    ),

    getChat: createAsyncThunk<
        ApiResponse,
        { chatId: string; limit?: number; cursor?: string },
        { rejectValue: ApiResponse }
    >(
        "chat/getChat",
        createApiHandler<{ chatId: string; limit?: number; cursor?: string }>(
            "/api/chat/get-chat",
            "post"
        )
    ),

    addMessage: createAsyncThunk<
        ApiResponse,
        { chatId: string; content: string },
        { rejectValue: ApiResponse }
    >(
        "chat/addMessage",
        createApiHandler<{ chatId: string; content: string }>("/api/chat/add-message", "post")
    ),

    deleteChat: createAsyncThunk<ApiResponse, { chatId: string }, { rejectValue: ApiResponse }>(
        "chat/deleteChat",
        createApiHandler<{ chatId: string }>("/api/chat/delete-chat", "post")
    ),

    projectChat: createAsyncThunk<
        ProjectChatResult,
        { projectId: string; message: string; chatId?: string },
        { rejectValue: ApiResponse }
    >("chat/projectChat", async (inputData, { rejectWithValue }) => {
        try {
            const response = await api.request<ApiResponse>({
                url: "/api/chat/project-chat",
                method: "post",
                data: inputData,
            });

            const { chatId, chatTitle, reply } = response.data.data as {
                chatId: string;
                chatTitle?: string | null;
                reply: string;
            };

            return {
                chatId,
                assistantMessage: reply,
                chatTitle: chatTitle ?? null,
            };
        } catch (error) {
            const err = error as AxiosError<ApiResponse>;
            if (err.response?.data) {
                return rejectWithValue(err.response.data);
            }
            return rejectWithValue({
                success: false,
                statusCode: 500,
                message: "Failed to get chat response.",
            });
        }
    }),
};

const initialState: ChatState = {
    chats: [],
    messagesByChat: {},
    activeChatId: null,
    loadingChats: false,
    creatingChat: false,
    gettingChat: false,
    addingMessage: false,
    deletingChat: false,
    streamingChat: false,
    streamingError: null,
};

const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        setActiveChatId(state, action) {
            state.activeChatId = action.payload;
        },
        clearChatState(state) {
            state.chats = [];
            state.messagesByChat = {};
            state.activeChatId = null;
            state.streamingError = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(chatActions.createChat.pending, (state) => {
                state.creatingChat = true;
            })
            .addCase(chatActions.createChat.fulfilled, (state, action) => {
                state.creatingChat = false;
                const payload = action.payload as ApiResponse & {
                    data?: { chat?: ChatThread };
                };
                if (payload.success && payload.data?.chat) {
                    const chat = normalizeChatThread(payload.data.chat);
                    upsertChat(state, chat);
                    state.activeChatId = chat.id;
                }
            })
            .addCase(chatActions.createChat.rejected, (state) => {
                state.creatingChat = false;
            })
            .addCase(chatActions.listChats.pending, (state) => {
                state.loadingChats = true;
            })
            .addCase(chatActions.listChats.fulfilled, (state, action) => {
                state.loadingChats = false;
                const payload = action.payload as ApiResponse & {
                    data?: { chats?: ChatThread[] };
                };
                if (payload.success && payload.data?.chats) {
                    state.chats = payload.data.chats.map((chat) => normalizeChatThread(chat));
                }
            })
            .addCase(chatActions.listChats.rejected, (state) => {
                state.loadingChats = false;
            })
            .addCase(chatActions.getChat.pending, (state) => {
                state.gettingChat = true;
            })
            .addCase(chatActions.getChat.fulfilled, (state, action) => {
                state.gettingChat = false;
                const payload = action.payload as ApiResponse & {
                    data?: { chat?: { messages?: ChatMessage[] } & ChatThread };
                };
                if (payload.success && payload.data?.chat) {
                    const chat = normalizeChatThread(payload.data.chat);
                    upsertChat(state, chat);
                    state.activeChatId = chat.id;
                    if (payload.data.chat.messages) {
                        state.messagesByChat[chat.id] = payload.data.chat.messages;
                    }
                }
            })
            .addCase(chatActions.getChat.rejected, (state) => {
                state.gettingChat = false;
            })
            .addCase(chatActions.addMessage.pending, (state) => {
                state.addingMessage = true;
            })
            .addCase(chatActions.addMessage.fulfilled, (state, action) => {
                state.addingMessage = false;
                const payload = action.payload as ApiResponse & {
                    data?: { message?: ChatMessage };
                };
                if (payload.success && payload.data?.message) {
                    const message = payload.data.message;
                    appendMessage(state, message);
                    const chatIndex = state.chats.findIndex((chat) => chat.id === message.chatId);
                    if (chatIndex >= 0) {
                        state.chats[chatIndex].lastMessageAt = new Date().toISOString();
                        state.chats[chatIndex].messageCount += 1;
                    }
                }
            })
            .addCase(chatActions.addMessage.rejected, (state) => {
                state.addingMessage = false;
            })
            .addCase(chatActions.deleteChat.pending, (state) => {
                state.deletingChat = true;
            })
            .addCase(chatActions.deleteChat.fulfilled, (state, action) => {
                state.deletingChat = false;
                const payload = action.payload as ApiResponse & { data?: { chatId?: string } };
                const chatId = payload.data?.chatId;
                if (payload.success && chatId) {
                    state.chats = state.chats.filter((chat) => chat.id !== chatId);
                    delete state.messagesByChat[chatId];
                    if (state.activeChatId === chatId) {
                        state.activeChatId = null;
                    }
                }
            })
            .addCase(chatActions.deleteChat.rejected, (state) => {
                state.deletingChat = false;
            })
            .addCase(chatActions.projectChat.pending, (state, action) => {
                state.streamingChat = true;
                state.streamingError = null;

                const existingChatId = action.meta.arg.chatId;
                if (existingChatId) {
                    state.activeChatId = existingChatId;
                }
            })
            .addCase(chatActions.projectChat.fulfilled, (state, action) => {
                state.streamingChat = false;
                const { chatId, assistantMessage, chatTitle } = action.payload;
                const userMessageId = createClientId();
                const assistantMessageId = createClientId();
                const timestamp = new Date().toISOString();
                const hasAssistantMessage = assistantMessage.trim().length > 0;
                const messageIncrement = hasAssistantMessage ? 2 : 1;

                if (!chatId) {
                    return;
                }

                state.activeChatId = chatId;

                appendMessage(state, {
                    id: userMessageId,
                    chatId,
                    role: "USER",
                    content: action.meta.arg.message,
                    createdAt: timestamp,
                });

                if (hasAssistantMessage) {
                    appendMessage(state, {
                        id: assistantMessageId,
                        chatId,
                        role: "ASSISTANT",
                        content: assistantMessage,
                        createdAt: timestamp,
                    });
                }

                const existingChat = state.chats.find((chat) => chat.id === chatId);
                const updatedAt = new Date().toISOString();

                if (existingChat) {
                    if (chatTitle) {
                        existingChat.title = chatTitle;
                    }
                    existingChat.lastMessageAt = updatedAt;
                    existingChat.messageCount += messageIncrement;
                    existingChat.updatedAt = updatedAt;
                } else {
                    upsertChat(state, {
                        id: chatId,
                        title: (chatTitle ?? action.meta.arg.message.slice(0, 80)).trim(),
                        createdAt: updatedAt,
                        updatedAt: updatedAt,
                        lastMessageAt: updatedAt,
                        createdById: "",
                        messageCount: messageIncrement,
                    });
                }
            })
            .addCase(chatActions.projectChat.rejected, (state, action) => {
                state.streamingChat = false;
                const payload = action.payload as ApiResponse | undefined;
                state.streamingError = payload?.message ?? "Failed to stream chat response.";
            });
    },
});

const chatPersistConfig = {
    key: "chat",
    storage: storageSession,
    whitelist: ["activeChatId"],
};

const persistedChatReducer = persistReducer(chatPersistConfig, chatSlice.reducer);

export const { setActiveChatId, clearChatState } = chatSlice.actions;
export { chatActions };
export default persistedChatReducer;
