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
};

export default validators;
