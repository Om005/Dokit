import r2Client from "@config/r2";
import env from "@config/env";
import { ProjectStack } from "@generated/prisma";
import { CopyObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import logger from "@utils/logger";
import { DeleteObjectsCommand } from "@aws-sdk/client-s3";

const BUCKET_NAME = env.R2_BUCKET_NAME!;
const STACK_BASE_PREFIX: Record<ProjectStack, string> = {
    NODE: "base/node",
    REACT_VITE: "base/react_vite",
    EXPRESS: "base/express",
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

const r2Manager = {
    copyBaseToProject,
    deleteProject,
};

export default r2Manager;
