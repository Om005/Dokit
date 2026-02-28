import { z } from "zod";

const validators = {
    CreateProjectSchema: z.object({
        name: z
            .string()
            .min(1, "Project name is required")
            .max(100, "Project name must be at most 100 characters"),
        description: z.string().max(500, "Description must be at most 500 characters").optional(),
        stack: z.enum(["NODE", "REACT_VITE", "EXPRESS"]),
        password: z
            .string()
            .min(6, "Password must be at least 6 characters")
            .max(50, "Password must be at most 50 characters")
            .optional(),
    }),

    DeleteProjectSchema: z.object({
        projectId: z.string().uuid("Invalid project ID format"),
    }),

    startProjectSchema: z.object({
        name: z
            .string()
            .min(1, "Project name is required")
            .max(100, "Project name must be at most 100 characters"),
        password: z.string().min(1, "Password is required for protected projects").optional(),
    }),
};

export default validators;
