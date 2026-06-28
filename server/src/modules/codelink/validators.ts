import { z } from "zod";

const validators = {
    createCodeLink: z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().optional(),
        language: z.string().min(1, "Language is required"),
        code: z.string().min(1, "Code is required"),
        isPasswordProtected: z.boolean().optional(),
        visibility: z.enum(["ANYONE_WITH_LINK", "RESTRICTED"]),
        password: z.string().optional(),
        allowedUserEmails: z.array(z.string().email()).optional(),
        expiresAt: z.string().optional(),
    }),
    getCodeLink: z.object({
        linkId: z.string().cuid("Invalid link ID format"),
        password: z.string().optional(),
    }),
    deleteCodeLink: z.object({
        linkId: z.string().cuid("Invalid link ID format"),
    }),
    updateCodeLink: z.object({
        linkId: z.string().cuid("Invalid link ID format"),
        title: z.string().min(1, "Title is required").optional(),
        description: z.string().optional(),
        language: z.string().min(1, "Language is required").optional(),
        code: z.string().min(1, "Code is required").optional(),
        isPasswordProtected: z.boolean().optional(),
        visibility: z.enum(["ANYONE_WITH_LINK", "RESTRICTED"]).optional(),
        password: z.string().optional(),
        allowedUserEmails: z.array(z.string().email()).optional(),
        expiresAt: z.string().nullable().optional(),
    }),
};

export default validators;
