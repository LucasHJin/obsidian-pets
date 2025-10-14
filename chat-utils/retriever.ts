import { VectorDB } from "./vector-db";
import { fetchEmbedding } from "./generator";

export async function answerQuery(
	query: string,
	apiKey: string,
	db: VectorDB,
	topK = 8, // Number of chunks to retrieve (to be refined)
	minScore = 0.7 // Minimum similarity score
): Promise<string> {
	// Embed query
	const queryVector = await fetchEmbedding(apiKey, query);
	const topChunks = await db.search(queryVector, topK); // Returns array of {text, score}
	const relevantChunks = topChunks.filter(chunk => chunk.score >= minScore);
	const context = relevantChunks.length > 0 ? relevantChunks.map((c) => c.text).join("\n---\n") : "";
	return context;
}
