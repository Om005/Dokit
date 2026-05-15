"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const validators = {
    getPublicProfile: zod_1.z.object({
        username: zod_1.z
            .string()
            .min(3, "Username must be at least 3 characters")
            .max(20, "Username must be at most 20 characters")
            .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    }),
    getMyProfile: zod_1.z.object({}).optional(),
    updateSettings: zod_1.z.object({
        signInEmailEnabled: zod_1.z.boolean().optional(),
    }),
    changePassword: zod_1.z.object({
        oldPassword: zod_1.z.string().min(1, "Old password is required"),
        newPassword: zod_1.z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[\W_]).+$/, "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
    }),
    deleteAccount: zod_1.z.object({
        password: zod_1.z.string().min(1, "Password is required"),
    }),
    listSessions: zod_1.z.object({}).optional(),
    logoutSession: zod_1.z.object({
        sessionId: zod_1.z.string().uuid("Invalid session ID format"),
    }),
    logoutOtherSessions: zod_1.z.object({}).optional(),
    updateProfileReadme: zod_1.z.object({
        content: zod_1.z.string().max(20000, "Profile readme is too long").optional(),
    }),
    pinProject: zod_1.z.object({
        projectId: zod_1.z.string().uuid("Invalid project ID format"),
        pinned: zod_1.z.boolean(),
    }),
};
exports.default = validators;
