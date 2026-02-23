import type { Request, Response } from "express";
import { S3Client, ListObjectsV2Command, CopyObjectCommand } from "@aws-sdk/client-s3";
import r2Client from "@config/r2";
import env from "@config/env";
import { ProjectStack } from "@generated/prisma";
import logger from "@utils/logger";
import sendResponse from "@utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import { prisma } from "@db/prisma";

const STACK_BASE_PREFIX: Record<ProjectStack, string> = {
    NODE: "base/node",
    REACT_VITE: "base/react_vite",
    EXPRESS: "base/express",
};

async function copyBaseToProject(stack: ProjectStack, projectId: string): Promise<number> {
    try {
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
        logger.error("Error copying base template to project:");
        logger.error(error);
        return -1;
    }
}

const controllers = {
    createProject: async (req: Request, res: Response) => {
        try {
            const { name, description, stack } = req.body;
            const user = req.meta.user;
            if (!user) {
                return sendResponse(res, {
                    success: false,
                    message: "Unauthorized",
                    statusCode: StatusCodes.UNAUTHORIZED,
                });
            }
            const userId = user.id;
            const existingProject = await prisma.project.findFirst({
                where: { ownerId: userId, name },
                select: { id: true },
            });
            if (existingProject) {
                return sendResponse(res, {
                    success: false,
                    message: "Project with the same name already exists",
                    statusCode: StatusCodes.CONFLICT,
                });
            }

            const projectId = crypto.randomUUID();
            const newProject = await prisma.project.create({
                data: {
                    id: projectId,
                    name,
                    description,
                    stack,
                    ownerId: userId,
                },
            });

            try {
                const filesCopied = await copyBaseToProject(stack, projectId);
                if (filesCopied === -1) {
                    prisma.project.delete({ where: { id: projectId } });
                    return sendResponse(res, {
                        success: false,
                        message: "Failed to set up project",
                        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                    });
                }
            } catch (error) {
                prisma.project.delete({ where: { id: projectId } });
                logger.error("Error copying base template to project:");
                logger.error(error);
                return sendResponse(res, {
                    success: false,
                    message: "Failed to set up project",
                    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                });
            }

            return sendResponse(res, {
                success: true,
                message: "Project created successfully",
                data: { newProject },
                statusCode: StatusCodes.CREATED,
            });
        } catch (error) {
            logger.error("Error creating project:");
            logger.error(error);
            return sendResponse(res, {
                success: false,
                message: "Failed to create project",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            });
        }
    },
};

export default controllers;
