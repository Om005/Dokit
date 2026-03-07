import { z } from "zod";

const validators = {
    getFolderContent: z.object({
        projectId: z.string().uuid("Invalid projectId format").min(1, "projectId is required"),
        folderPath: z.string().min(1, "folderPath is required"),
    }),
    getFileContent: z.object({
        projectId: z.string().uuid("Invalid projectId format").min(1, "projectId is required"),
        filePath: z.string().min(1, "filePath is required"),
    }),
    createNode: z.object({
        projectId: z.string().uuid("Invalid projectId format").min(1, "projectId is required"),
        nodePath: z.string().min(1, "nodePath is required"),
        isDir: z.boolean(),
    }),
    deleteNode: z.object({
        projectId: z.string().uuid("Invalid projectId format").min(1, "projectId is required"),
        nodePath: z.string().min(1, "nodePath is required"),
    }),
    renameNode: z.object({
        projectId: z.string().uuid("Invalid projectId format").min(1, "projectId is required"),
        oldPath: z.string().min(1, "oldPath is required"),
        newPath: z.string().min(1, "newPath is required"),
    }),
};

export default validators;
