import { z } from "zod";

const validators = {
    getPublicProfile: z.object({
        username: z
            .string()
            .min(3, "Username must be at least 3 characters")
            .max(20, "Username must be at most 20 characters")
            .regex(
                /^[a-zA-Z0-9_]+$/,
                "Username can only contain letters, numbers, and underscores"
            ),
    }),

    getMyProfile: z.object({}).optional(),

    updateSettings: z.object({
        signInEmailEnabled: z.boolean().optional(),
    }),

    changePassword: z.object({
        oldPassword: z.string().min(1, "Old password is required"),
        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(
                /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[\W_]).+$/,
                "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
            ),
    }),

    deleteAccount: z.object({
        password: z.string().min(1, "Password is required"),
    }),

    listSessions: z.object({}).optional(),

    logoutSession: z.object({
        sessionId: z.string().uuid("Invalid session ID format"),
    }),

    logoutOtherSessions: z.object({}).optional(),

    updateProfileReadme: z.object({
        content: z.string().max(20000, "Profile readme is too long").optional(),
    }),

    pinProject: z.object({
        projectId: z.string().uuid("Invalid project ID format"),
        pinned: z.boolean(),
    }),
};

export default validators;
