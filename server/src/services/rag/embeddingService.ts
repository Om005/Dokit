import env from "@config/env";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

export async function generateEmbedding(text: string): Promise<number[]> {
    const ollamaUrl = env.OLLAMA_URL || "http://127.0.0.1:11434";

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(`${ollamaUrl}/api/embed`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "nomic-embed-text",
                    input: text,
                }),
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.embeddings[0];
        } catch (err) {
            lastError = err as Error;
            if (attempt < MAX_RETRIES - 1) {
                await new Promise((r) => setTimeout(r, BASE_DELAY_MS * (attempt + 1)));
            }
        }
    }

    throw lastError ?? new Error("generateEmbedding failed after retries");
}