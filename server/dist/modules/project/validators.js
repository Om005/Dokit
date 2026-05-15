"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const validators = {
    CreateProjectSchema: zod_1.z.object({
        name: zod_1.z
            .string()
            .min(1, "Project name is required")
            .max(100, "Project name must be at most 100 characters"),
        description: zod_1.z.string().max(500, "Description must be at most 500 characters").optional(),
        stack: zod_1.z.enum(["NODE", "REACT_VITE", "EXPRESS"]),
        visibility: zod_1.z.enum(["PUBLIC", "PRIVATE"]),
        password: zod_1.z
            .string()
            .min(6, "Password must be at least 6 characters")
            .max(50, "Password must be at most 50 characters")
            .optional(),
    }),
    DeleteProjectSchema: zod_1.z.object({
        projectId: zod_1.z.string().uuid("Invalid project ID format"),
        accountPassword: zod_1.z.string().min(1, "Account password is required to delete project"),
    }),
    startProjectSchema: zod_1.z.object({
        projectId: zod_1.z.string().uuid("Invalid project ID format"),
        password: zod_1.z.string().min(1, "Password is required for protected projects").optional(),
    }),
    getProjectDetailsSchema: zod_1.z.object({
        projectId: zod_1.z.string().uuid("Invalid project ID format"),
    }),
    changeSettings: zod_1.z.object({
        projectId: zod_1.z.string().uuid("Invalid project ID format"),
        newName: zod_1.z
            .string()
            .min(1, "New project name is required")
            .max(100, "New project name must be at most 100 characters"),
        description: zod_1.z.string().max(500, "Description must be at most 500 characters"),
        visibility: zod_1.z.enum(["PUBLIC", "PRIVATE"]),
        password: zod_1.z
            .string()
            .min(6, "Password must be at least 6 characters")
            .max(50, "Password must be at most 50 characters")
            .optional(),
        accountPassword: zod_1.z.string().min(1, "Account password is required to change settings"),
        isPasswordProtected: zod_1.z.boolean(),
    }),
    closeProjectSchema: zod_1.z.object({
        projectId: zod_1.z.string().uuid("Invalid project ID format"),
    }),
    requestAccessSchema: zod_1.z.object({
        projectId: zod_1.z.string().uuid("Invalid project ID format"),
    }),
    reviewAccessRequestSchema: zod_1.z.object({
        requestId: zod_1.z.string().uuid("Invalid access request ID format"),
        status: zod_1.z.enum(["APPROVED", "REJECTED"]),
    }),
    getPendingAccessRequestsSchema: zod_1.z.object({
        projectId: zod_1.z.string().uuid("Invalid project ID format"),
    }),
    inviteMemberSchema: zod_1.z.object({
        projectId: zod_1.z.string().uuid("Invalid project ID format"),
        email: zod_1.z.string().email("Invalid email address"),
        accessLevel: zod_1.z.enum(["READ", "WRITE"]),
    }),
    changeMemberAccessLevelSchema: zod_1.z.object({
        projectId: zod_1.z.string().uuid("Invalid project ID format"),
        userId: zod_1.z.string().uuid("Invalid user ID format"),
        newAccessLevel: zod_1.z.enum(["READ", "WRITE"]),
    }),
    removeMemberSchema: zod_1.z.object({
        projectId: zod_1.z.string().uuid("Invalid project ID format"),
        userId: zod_1.z.string().uuid("Invalid user ID format"),
    }),
    CreateProjectFromGithubSchema: zod_1.z.object({
        githubRepoUrl: zod_1.z.string().url("Invalid GitHub repository URL"),
        name: zod_1.z
            .string()
            .min(1, "Project name is required")
            .max(100, "Project name must be at most 100 characters"),
        description: zod_1.z.string().max(500, "Description must be at most 500 characters").optional(),
        visibility: zod_1.z.enum(["PUBLIC", "PRIVATE"]),
        password: zod_1.z
            .string()
            .min(6, "Password must be at least 6 characters")
            .max(50, "Password must be at most 50 characters")
            .optional(),
    }),
};
exports.default = validators;
