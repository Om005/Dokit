"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const r2_1 = __importDefault(require("../config/r2"));
const env_1 = __importDefault(require("../config/env"));
const client_s3_1 = require("@aws-sdk/client-s3");
const logger_1 = __importDefault(require("../utils/logger"));
const client_s3_2 = require("@aws-sdk/client-s3");
const BUCKET_NAME = env_1.default.R2_BUCKET_NAME;
const STACK_BASE_PREFIX = {
    NODE: "base/node",
    REACT_VITE: "base/react_vite",
    EXPRESS: "base/express",
    BLANK: "base/blank",
};
const PROFILE_README_KEY = (userId) => `profile/${userId}/readme.md`;
const streamToString = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString("utf-8");
};
async function copyBaseToProject(projectId, stack) {
    try {
        const listCommand = new client_s3_1.ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: STACK_BASE_PREFIX[stack],
        });
        const listedObjects = await r2_1.default.send(listCommand);
        if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
            logger_1.default.error(`No base template found for stack ${stack}`);
            return;
        }
        const sourcePrefix = STACK_BASE_PREFIX[stack];
        const destPrefix = `code/${projectId}`;
        let filesCopied = 0;
        let continuationToken;
        do {
            const listResp = await r2_1.default.send(new client_s3_1.ListObjectsV2Command({
                Bucket: env_1.default.R2_BUCKET_NAME,
                Prefix: sourcePrefix + "/",
                ContinuationToken: continuationToken,
            }));
            const objects = listResp.Contents ?? [];
            await Promise.all(objects.map((obj) => {
                const sourceKey = obj.Key;
                const relativePath = sourceKey.slice(sourcePrefix.length + 1);
                const destKey = `${destPrefix}/${relativePath}`;
                return r2_1.default.send(new client_s3_1.CopyObjectCommand({
                    Bucket: env_1.default.R2_BUCKET_NAME,
                    CopySource: `${env_1.default.R2_BUCKET_NAME}/${sourceKey}`,
                    Key: destKey,
                }));
            }));
            filesCopied += objects.length;
            continuationToken = listResp.IsTruncated ? listResp.NextContinuationToken : undefined;
        } while (continuationToken);
        return filesCopied;
    }
    catch (error) {
        logger_1.default.error("Error copying base template:");
        logger_1.default.error(error);
        return -1;
    }
}
async function deleteProject(projectId) {
    try {
        const prefix = `code/${projectId}/`;
        let filesDeleted = 0;
        let continuationToken;
        do {
            const listResp = await r2_1.default.send(new client_s3_1.ListObjectsV2Command({
                Bucket: BUCKET_NAME,
                Prefix: prefix,
                ContinuationToken: continuationToken,
            }));
            const objects = listResp.Contents ?? [];
            if (objects.length === 0) {
                if (filesDeleted === 0) {
                    logger_1.default.error(`No objects found for project ${projectId} to delete.`);
                }
                break;
            }
            const objectsToDelete = objects.map((obj) => ({ Key: obj.Key }));
            await r2_1.default.send(new client_s3_2.DeleteObjectsCommand({
                Bucket: BUCKET_NAME,
                Delete: {
                    Objects: objectsToDelete,
                    Quiet: true,
                },
            }));
            filesDeleted += objects.length;
            continuationToken = listResp.IsTruncated ? listResp.NextContinuationToken : undefined;
        } while (continuationToken);
        return filesDeleted;
    }
    catch (error) {
        logger_1.default.error(`Error deleting project files for ${projectId}:`);
        logger_1.default.error(error);
        return -1;
    }
}
async function getProfileReadme(userId) {
    try {
        const getCommand = new client_s3_1.GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: PROFILE_README_KEY(userId),
        });
        const response = await r2_1.default.send(getCommand);
        if (!response.Body) {
            return null;
        }
        return await streamToString(response.Body);
    }
    catch (error) {
        const errorName = error.name || "";
        if (errorName === "NoSuchKey" || errorName === "NotFound") {
            return null;
        }
        logger_1.default.error("Error getting profile readme:");
        logger_1.default.error(error);
        return null;
    }
}
async function putProfileReadme(userId, content) {
    try {
        const putCommand = new client_s3_1.PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: PROFILE_README_KEY(userId),
            Body: content,
            ContentType: "text/markdown; charset=utf-8",
        });
        await r2_1.default.send(putCommand);
        return true;
    }
    catch (error) {
        logger_1.default.error("Error uploading profile readme:");
        logger_1.default.error(error);
        return false;
    }
}
async function deleteProfileReadme(userId) {
    try {
        const deleteCommand = new client_s3_1.DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: PROFILE_README_KEY(userId),
        });
        await r2_1.default.send(deleteCommand);
        return true;
    }
    catch (error) {
        logger_1.default.error("Error deleting profile readme:");
        logger_1.default.error(error);
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
exports.default = R2Manager;
