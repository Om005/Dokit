import r2Client from "@config/r2";
import env from "@config/env";
import { ProjectStack } from "@generated/prisma";
import {
    CopyObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    ListObjectsV2Command,
    PutObjectCommand,
} from "@aws-sdk/client-s3";
import logger from "@utils/logger";
import { DeleteObjectsCommand } from "@aws-sdk/client-s3";
import ignore from "ignore";
import sendResponse from "@utils/sendResponse";
import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ZipArchive } from "archiver";
import { Readable } from "stream";

const BUCKET_NAME = env.R2_BUCKET_NAME!;
const STACK_BASE_PREFIX: Record<ProjectStack, string> = {
    NODE: "base/node",
    REACT_VITE: "base/react_vite",
    EXPRESS: "base/express",
    BLANK: "base/blank",
    GITHUB: "base/github",
    FASTAPI: "base/fastapi",
    GO: "base/go",
};

interface FileSystemItem {
    content: string;
    path: string;
    name: string;
    type: "file" | "directory";
    children: string[];
    isExpanded: boolean;
    isLoaded: boolean;
}

const PROFILE_README_KEY = (userId: string) => `profile/${userId}/readme.md`;

const streamToString = async (stream: NodeJS.ReadableStream) => {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString("utf-8");
};

async function copyBaseToProject(projectId: string, stack: ProjectStack) {
    try {
        const listCommand = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: STACK_BASE_PREFIX[stack],
        });
        const listedObjects = await r2Client.send(listCommand);
        if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
            logger.error(`No base template found for stack ${stack}`);
            return;
        }

        const sourcePrefix = STACK_BASE_PREFIX[stack];
        const destPrefix = `code/${projectId}`;
        let filesCopied = 0;
        let continuationToken: string | undefined;

        do {
            const listResp = await r2Client.send(
                new ListObjectsV2Command({
                    Bucket: env.R2_BUCKET_NAME,
                    Prefix: sourcePrefix + "/",
                    ContinuationToken: continuationToken,
                })
            );

            const objects = listResp.Contents ?? [];

            await Promise.all(
                objects.map((obj) => {
                    const sourceKey = obj.Key!;
                    const relativePath = sourceKey.slice(sourcePrefix.length + 1);
                    const destKey = `${destPrefix}/${relativePath}`;

                    return r2Client.send(
                        new CopyObjectCommand({
                            Bucket: env.R2_BUCKET_NAME,
                            CopySource: `${env.R2_BUCKET_NAME}/${sourceKey}`,
                            Key: destKey,
                        })
                    );
                })
            );

            filesCopied += objects.length;
            continuationToken = listResp.IsTruncated ? listResp.NextContinuationToken : undefined;
        } while (continuationToken);

        return filesCopied;
    } catch (error) {
        logger.error("Error copying base template:");
        logger.error(error);
        return -1;
    }
}

async function deleteProject(projectId: string) {
    try {
        const prefix = `code/${projectId}/`;
        let filesDeleted = 0;
        let continuationToken: string | undefined;

        do {
            const listResp = await r2Client.send(
                new ListObjectsV2Command({
                    Bucket: BUCKET_NAME,
                    Prefix: prefix,
                    ContinuationToken: continuationToken,
                })
            );

            const objects = listResp.Contents ?? [];

            if (objects.length === 0) {
                if (filesDeleted === 0) {
                    logger.error(`No objects found for project ${projectId} to delete.`);
                }
                break;
            }

            const objectsToDelete = objects.map((obj) => ({ Key: obj.Key! }));

            await r2Client.send(
                new DeleteObjectsCommand({
                    Bucket: BUCKET_NAME,
                    Delete: {
                        Objects: objectsToDelete,
                        Quiet: true,
                    },
                })
            );

            filesDeleted += objects.length;
            continuationToken = listResp.IsTruncated ? listResp.NextContinuationToken : undefined;
        } while (continuationToken);

        return filesDeleted;
    } catch (error) {
        logger.error(`Error deleting project files for ${projectId}:`);
        logger.error(error);
        return -1;
    }
}

async function getProfileReadme(userId: string) {
    try {
        const getCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: PROFILE_README_KEY(userId),
        });
        const response = await r2Client.send(getCommand);
        if (!response.Body) {
            return null;
        }
        return await streamToString(response.Body as NodeJS.ReadableStream);
    } catch (error) {
        const errorName = (error as { name?: string }).name || "";
        if (errorName === "NoSuchKey" || errorName === "NotFound") {
            return null;
        }
        logger.error("Error getting profile readme:");
        logger.error(error);
        return null;
    }
}

async function putProfileReadme(userId: string, content: string) {
    try {
        const putCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: PROFILE_README_KEY(userId),
            Body: content,
            ContentType: "text/markdown; charset=utf-8",
        });
        await r2Client.send(putCommand);
        return true;
    } catch (error) {
        logger.error("Error uploading profile readme:");
        logger.error(error);
        return false;
    }
}

async function deleteProfileReadme(userId: string) {
    try {
        const deleteCommand = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: PROFILE_README_KEY(userId),
        });
        await r2Client.send(deleteCommand);
        return true;
    } catch (error) {
        logger.error("Error deleting profile readme:");
        logger.error(error);
        return false;
    }
}

async function getFolderContent(
    projectId: string,
    folderPath: string
): Promise<Record<string, FileSystemItem>> {
    try {
        const normalizedPath = folderPath.replace(/^\/+/, "").replace(/\/+$/, "");

        const prefix = normalizedPath
            ? `code/${projectId}/${normalizedPath}/`
            : `code/${projectId}/`;

        const ig = ignore();

        try {
            const ignoreCommand = new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: `code/${projectId}/.dokitignore`,
            });
            const ignoreResponse = await r2Client.send(ignoreCommand);
            const ignoreContent = (await ignoreResponse.Body?.transformToString()) || "";

            ig.add(ignoreContent);
        } catch {
            logger.error(`Failed to fetch .dokitignore for ${projectId}:`);
            ig.add([".env", "*.env"]);
        }

        const listCommand = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: prefix,
            Delimiter: "/",
        });

        const response = await r2Client.send(listCommand);

        const items: Record<string, FileSystemItem> = {};

        for (const cp of response.CommonPrefixes ?? []) {
            const fullPath = cp.Prefix!;

            const relativePath = fullPath.slice(`code/${projectId}/`.length).replace(/\/$/, "");

            const name = relativePath.split("/").pop()!;

            items[relativePath] = {
                content: "",
                path: relativePath,
                name,
                type: "directory",
                children: [],
                isExpanded: false,
                isLoaded: false,
            };
        }

        for (const obj of response.Contents ?? []) {
            const key = obj.Key!;

            if (key === prefix) continue;

            const relativePath = key.slice(`code/${projectId}/`.length);

            const name = relativePath.split("/").pop()!;

            items[relativePath] = {
                content: "",
                path: relativePath,
                name,
                type: "file",
                children: [],
                isExpanded: false,
                isLoaded: false,
            };
        }

        const filteredItems: Record<string, FileSystemItem> = {};
        for (const [path, item] of Object.entries(items)) {
            const pathForIgnore = item.type === "directory" ? `${path}/` : path;
            if (!ig.ignores(pathForIgnore)) {
                filteredItems[path] = item;
            }
        }

        return filteredItems;
    } catch (error) {
        logger.error(
            `Error listing folder content for project ${projectId} at path ${folderPath}:`
        );
        logger.error(error);
        return {};
    }
}

async function getFileContent(projectId: string, filePath: string) {
    try {
        const key = `code/${projectId}/${filePath.replace(/^\//, "")}`;
        const getCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });
        const response = await r2Client.send(getCommand);
        if (!response.Body) {
            return null;
        }
        return await streamToString(response.Body as NodeJS.ReadableStream);
    } catch (error) {
        const errorName = (error as { name?: string }).name || "";
        if (errorName === "NoSuchKey" || errorName === "NotFound") {
            return null;
        }
        logger.error(`Error getting file content for project ${projectId} at path ${filePath}:`);
        logger.error(error);
        return "";
    }
}

async function downloadProjectAsZip(projectId: string, name: string, res: Response) {
    try {
        const ig = ignore();
        const prefix = `code/${projectId}/`;
        try {
            const ignoreCommand = new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: `code/${projectId}/.dokitignore`,
            });
            const ignoreResponse = await r2Client.send(ignoreCommand);
            const ignoreContent = (await ignoreResponse.Body?.transformToString()) || "";
            ig.add(ignoreContent);
        } catch {
            logger.error(`Failed to fetch .dokitignore for ${projectId}:`);
            ig.add([".env", "*.env"]);
        }

        const listCommand = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: prefix,
        });

        const listResponse = await r2Client.send(listCommand);

        if (!listResponse.Contents || listResponse.Contents.length === 0) {
            return sendResponse(res, {
                message: "Project not found or empty",
                success: false,
                statusCode: StatusCodes.NOT_FOUND,
            });
        }
        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", `attachment; filename="project-${name}.zip"`);

        const archive = new ZipArchive({
            zlib: { level: 5 },
        });

        archive.on("error", (err) => {
            logger.error("Archiver error:");
            logger.error(err);
            if (!res.headersSent) {
                return sendResponse(res, {
                    success: false,
                    message: "Error creating zip archive",
                    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                });
            }
            res.end();
        });

        archive.pipe(res);

        for (const file of listResponse.Contents) {
            const relativePath = file.Key!.replace(prefix, "");

            if (relativePath === "") continue;

            if (ig.ignores(relativePath)) {
                continue;
            }

            if (file.Key!.endsWith("/")) {
                archive.append("", { name: relativePath });
                continue;
            }

            const getObjectCommand = new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: file.Key,
            });

            const fileResponse = await r2Client.send(getObjectCommand);
            const fileStream = fileResponse.Body as Readable;

            archive.append(fileStream, { name: relativePath });
        }
        await archive.finalize();
    } catch (error) {
        logger.error(`Error downloading project ${projectId} as zip:`);
        logger.error(error);
        if (!res.headersSent) {
            return sendResponse(res, {
                success: false,
                message: "Internal server error during download",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        } else {
            res.end();
        }
    }
}

const R2Manager = {
    copyBaseToProject,
    deleteProject,
    getProfileReadme,
    putProfileReadme,
    deleteProfileReadme,
    getFolderContent,
    getFileContent,
    downloadProjectAsZip,
};

export default R2Manager;
