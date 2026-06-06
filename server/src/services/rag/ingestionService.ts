import { prisma } from "@db/prisma";
import { extractCodeChunks } from "./astParser";
import { generateEmbedding } from "./embeddingService";
import logger from "@utils/logger";

export interface FileInput {
    filePath: string;
    content: string;
}

export async function ingestProjectFiles(projectId: string, files: FileInput[]): Promise<void> {
    for (const file of files) {
        try {
            const chunks = extractCodeChunks(file.content, file.filePath, projectId);

            if (chunks.length === 0) continue;

            await prisma.$executeRaw`
                DELETE FROM "CodeChunk"
                WHERE "projectId" = ${projectId}
                AND "filePath" = ${file.filePath}
            `;

            
            for (const chunk of chunks) {
                const embedding = await generateEmbedding(chunk.content);

                await prisma.$executeRaw`
                    INSERT INTO "CodeChunk" (
                        "id", 
                        "projectId", 
                        "filePath", 
                        "language", 
                        "entityType", 
                        "content", 
                        "metadata", 
                        "embedding"
                    )
                    VALUES (
                        gen_random_uuid(), 
                        ${chunk.projectId}, 
                        ${chunk.filePath}, 
                        ${chunk.language}, 
                        ${chunk.entityType}, 
                        ${chunk.content}, 
                        ${chunk.metadata}::jsonb, 
                        ${embedding}::vector
                    )
                `;
            }
            logger.info(`[Vector DB] Successfully ingested file: ${file.filePath}`);
        } catch (error) {
            logger.error(
                `[Vector DB] Failed to ingest ${file.filePath}: ${error instanceof Error ? error.message : error}`
            );
        }
    }
}
