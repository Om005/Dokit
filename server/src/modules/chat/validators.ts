import { z } from "zod";

const validators = {
    handleProjectChat: z.object({
        projectId: z
            .string()
            .min(1, "Project ID is required")
            .refine((value) => value.trim().length > 0, "Project ID is required"),
        message: z
            .string()
            .min(1, "Message is required")
            .refine((value) => value.trim().length > 0, "Message is required"),
        chatId: z.string().uuid("Invalid chat ID format").optional(),
    }),

    createChat: z.object({
        projectId: z
            .string()
            .min(1, "Project ID is required")
            .refine((value) => value.trim().length > 0, "Project ID is required"),
        title: z.string().max(200, "Title must be at most 200 characters").optional(),
    }),

    listChats: z.object({
        projectId: z
            .string()
            .min(1, "Project ID is required")
            .refine((value) => value.trim().length > 0, "Project ID is required"),
        limit: z.coerce.number().int().min(1).max(200).optional(),
    }),

    getChat: z.object({
        chatId: z.string().uuid("Invalid chat ID format"),
        limit: z.coerce.number().int().min(1).max(200).optional(),
        cursor: z.string().uuid("Invalid cursor format").optional(),
    }),

    addMessage: z.object({
        chatId: z.string().uuid("Invalid chat ID format"),
        content: z
            .string()
            .min(1, "Message content is required")
            .refine((value) => value.trim().length > 0, "Message content is required"),
    }),

    deleteChat: z.object({
        chatId: z.string().uuid("Invalid chat ID format"),
    }),
};

export default validators;
