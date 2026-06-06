import { prisma } from "@db/prisma";
import { generateEmbedding } from "./embeddingService";
import logger from "@utils/logger";

export interface RetrievedChunk {
    filePath: string;
    content: string;
    entityType: string;
    language: string;
    similarity: number;
}

interface RetrieveOptions {
    topK?: number;
    minSimilarity?: number;
    mmr?: boolean;
    mmrLambda?: number;
}

function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function mmrRerank(
    queryEmbedding: number[],
    candidates: Array<RetrievedChunk & { embedding: number[] }>,
    topK: number,
    lambda: number
): RetrievedChunk[] {
    const selected: Array<RetrievedChunk & { embedding: number[] }> = [];
    const remaining = [...candidates];

    while (selected.length < topK && remaining.length > 0) {
        let bestIdx = 0;
        let bestScore = -Infinity;

        for (let i = 0; i < remaining.length; i++) {
            const relevance = cosineSimilarity(queryEmbedding, remaining[i].embedding);

            const redundancy =
                selected.length === 0
                    ? 0
                    : Math.max(...selected.map((s) => cosineSimilarity(remaining[i].embedding, s.embedding)));

            const mmrScore = lambda * relevance - (1 - lambda) * redundancy;

            if (mmrScore > bestScore) {
                bestScore = mmrScore;
                bestIdx = i;
            }
        }

        selected.push(remaining[bestIdx]);
        remaining.splice(bestIdx, 1);
    }

    return selected.map(({ embedding: _embedding, ...chunk }) => chunk);
}

export async function retrieveContext(
    query: string,
    projectId: string,
    options: RetrieveOptions = {}
): Promise<RetrievedChunk[]> {
    const {
        topK = 5,
        minSimilarity = 0.3,
        mmr = true,
        mmrLambda = 0.6,
    } = options;

    const queryEmbedding = await generateEmbedding(query);

    const candidateLimit = mmr ? topK * 4 : topK;
    const vectorLiteral = `[${queryEmbedding.join(",")}]`;

    const rows = await prisma.$queryRaw<
        Array<RetrievedChunk & { embedding: string }>
    >`
        SELECT
            "filePath",
            "content",
            "entityType",
            "language",
            embedding::text AS embedding,
            1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
        FROM "CodeChunk"
        WHERE "projectId" = ${projectId}
          AND 1 - (embedding <=> ${vectorLiteral}::vector) > ${minSimilarity}
        ORDER BY embedding <=> ${vectorLiteral}::vector
        LIMIT ${candidateLimit};
    `;

    if (rows.length === 0) {
        logger.info(`[RAG] No relevant chunks found for query in project ${projectId}`);
        return [];
    }

    if (!mmr) {
        const results = rows.slice(0, topK).map(({ embedding: _e, ...chunk }) => chunk);
        logger.info(`[RAG] Retrieved ${results.length} chunks (no MMR) for project ${projectId}`);
        return results;
    }

    const candidates = rows.map((row) => ({
        ...row,
        embedding: row.embedding
            .replace(/^\[|\]$/g, "")
            .split(",")
            .map(Number),
    }));

    const results = mmrRerank(queryEmbedding, candidates, topK, mmrLambda);
    logger.info(`[RAG] Retrieved ${results.length} chunks (MMR=${mmrLambda}) for project ${projectId}`);

    return results;
}