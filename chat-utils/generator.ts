import { requestUrl } from "obsidian";

interface EmbeddingResponse {
	data: { embedding: number[] }[];
}

function isEmbeddingResponse(value: unknown): value is EmbeddingResponse {
	if (typeof value !== "object" || value === null || !("data" in value)) {
		return false;
	}
	if (!Array.isArray(value.data)) {
		return false;
	}
	const first: unknown = value.data[0];
	return (
		typeof first === "object" &&
		first !== null &&
		"embedding" in first &&
		Array.isArray(first.embedding)
	);
}

export async function fetchEmbedding(apiKey: string, input: string): Promise<number[]> {
	try {
		const res = await requestUrl({
			url: "https://api.openai.com/v1/embeddings",
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "text-embedding-3-small",
				input,
			}),
		});

		// requestUrl throws on non-2xx, so res.json is the parsed body
		const json: unknown = res.json;
		if (!isEmbeddingResponse(json)) {
			throw new Error("Invalid response from OpenAI API");
		}
		return json.data[0].embedding;
	} catch (error) {
		console.error("Failed to fetch embedding:", error);
		throw error;
	}
}
