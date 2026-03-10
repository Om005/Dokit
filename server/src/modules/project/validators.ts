import { z } from "zod";

const validators = {
    CreateProjectSchema: z.object({
        name: z
            .string()
            .min(1, "Project name is required")
            .max(100, "Project name must be at most 100 characters"),
        description: z.string().max(500, "Description must be at most 500 characters").optional(),
        stack: z.enum(["NODE", "REACT_VITE", "EXPRESS"]),
        visibility: z.enum(["PUBLIC", "PRIVATE"]),
        password: z
            .string()
            .min(6, "Password must be at least 6 characters")
            .max(50, "Password must be at most 50 characters")
            .optional(),
    }),

    DeleteProjectSchema: z.object({
        projectId: z.string().uuid("Invalid project ID format"),
        accountPassword: z.string().min(1, "Account password is required to delete project"),
    }),

    startProjectSchema: z.object({
        projectId: z.string().uuid("Invalid project ID format"),

        password: z.string().min(1, "Password is required for protected projects").optional(),
    }),

    getProjectDetailsSchema: z.object({
        projectId: z.string().uuid("Invalid project ID format"),
    }),

    changeSettings: z.object({
        projectId: z.string().uuid("Invalid project ID format"),

        newName: z
            .string()
            .min(1, "New project name is required")
            .max(100, "New project name must be at most 100 characters"),
        description: z.string().max(500, "Description must be at most 500 characters"),
        visibility: z.enum(["PUBLIC", "PRIVATE"]),
        password: z
            .string()
            .min(6, "Password must be at least 6 characters")
            .max(50, "Password must be at most 50 characters")
            .optional(),
        accountPassword: z.string().min(1, "Account password is required to change settings"),
        isPasswordProtected: z.boolean(),
    }),

    closeProjectSchema: z.object({
        projectId: z.string().uuid("Invalid project ID format"),
    }),
};

export default validators;
