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

const BUCKET_NAME = env.R2_BUCKET_NAME!;
const STACK_BASE_PREFIX: Record<ProjectStack, string> = {
    NODE: "base/node",
    REACT_VITE: "base/react_vite",
    EXPRESS: "base/express",
};

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

const R2Manager = {
    copyBaseToProject,
    deleteProject,
    getProfileReadme,
    putProfileReadme,
    deleteProfileReadme,
};

export default R2Manager;
