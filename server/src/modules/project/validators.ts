import { z } from "zod";

const validators = {
    CreateProjectSchema: z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        stack: z.enum(["NODE", "REACT_VITE", "EXPRESS"]),
        password: z.string().min(6).max(100).optional(),
    }),

    DeleteProjectSchema: z.object({
        projectId: z.string().uuid(),
    }),
};

export default validators;
