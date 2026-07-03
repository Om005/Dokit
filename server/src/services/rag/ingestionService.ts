import { prisma } from "@db/prisma";
import { extractCodeChunks } from "./astParser";
import { generateEmbedding } from "./embeddingService";
import logger from "@utils/logger";
import { chunk as lodashChunk } from "lodash";

export interface FileInput {
    filePath: string;
    content: string;
}

export async function ingestProjectFiles(projectId: string, files: FileInput[]): Promise<void> {
    for (const file of files) {
        try {
            const codeChunks = extractCodeChunks(file.content, file.filePath, projectId);
            if (codeChunks.length === 0) continue;

            // Generate embeddings in parallel batches (e.g. 5 at a time) to avoid overloading Ollama
            const embeddings: number[][] = [];
            const batches = lodashChunk(codeChunks, 5);

            for (const batch of batches) {
                const batchEmbeddings = await Promise.all(
                    batch.map((chunk) => generateEmbedding(chunk.content))
                );
                embeddings.push(...batchEmbeddings);
            }

            // Wrap delete and insert in a single transaction to maintain integrity
            await prisma.$transaction(async (tx) => {
                await tx.$executeRaw`
                    DELETE FROM "CodeChunk"
                    WHERE "projectId" = ${projectId}
                    AND "filePath" = ${file.filePath}
                `;

                // Optionally batch inserts if needed, but for typical file size 1-100 chunks,
                // a loop of inserts inside a transaction is acceptable.
                for (let i = 0; i < codeChunks.length; i++) {
                    const chunk = codeChunks[i];
                    const embedding = embeddings[i];

                    const vectorLiteral = `[${embedding.join(",")}]`;

                    await tx.$executeRaw`
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
                            ${vectorLiteral}::vector
                        )
                    `;
                }
            });

            logger.info(`[Vector DB] Successfully ingested file: ${file.filePath}`);
        } catch (error) {
            logger.error(
                `[Vector DB] Failed to ingest ${file.filePath}: ${error instanceof Error ? error.message : error}`
            );
        }
    }
}
