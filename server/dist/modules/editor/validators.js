"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tools_1 = require("../../constants/tools");
const zod_1 = require("zod");
const validators = {
    getFolderContent: zod_1.z.object({
        projectId: zod_1.z.string().uuid("Invalid projectId format").min(1, "projectId is required"),
        folderPath: zod_1.z.string().min(1, "folderPath is required"),
    }),
    getFileContent: zod_1.z.object({
        projectId: zod_1.z.string().uuid("Invalid projectId format").min(1, "projectId is required"),
        filePath: zod_1.z.string().min(1, "filePath is required"),
    }),
    createNode: zod_1.z.object({
        projectId: zod_1.z.string().uuid("Invalid projectId format").min(1, "projectId is required"),
        nodePath: zod_1.z.string().min(1, "nodePath is required"),
        isDir: zod_1.z.boolean(),
    }),
    deleteNode: zod_1.z.object({
        projectId: zod_1.z.string().uuid("Invalid projectId format").min(1, "projectId is required"),
        nodePath: zod_1.z.string().min(1, "nodePath is required"),
    }),
    renameNode: zod_1.z.object({
        projectId: zod_1.z.string().uuid("Invalid projectId format").min(1, "projectId is required"),
        oldPath: zod_1.z.string().min(1, "oldPath is required"),
        newPath: zod_1.z.string().min(1, "newPath is required"),
    }),
    installEnvironmentTool: zod_1.z.object({
        projectId: zod_1.z.string().uuid("Invalid projectId format").min(1, "projectId is required"),
        toolName: zod_1.z
            .string()
            .min(1, "toolName is required")
            .refine((value) => value in tools_1.ALLOWED_TOOLS, {
            message: "Invalid toolName",
        }),
    }),
    uninstallEnvironmentTool: zod_1.z.object({
        projectId: zod_1.z.string().uuid("Invalid projectId format").min(1, "projectId is required"),
        toolName: zod_1.z
            .string()
            .min(1, "toolName is required")
            .refine((value) => value in tools_1.ALLOWED_TOOLS, {
            message: "Invalid toolName",
        }),
    }),
};
exports.default = validators;
