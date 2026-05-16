import { requestUrl } from "obsidian";

export async function fetchEmbedding(
	apiKey: string,
	input: string
): Promise<number[]> {
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
		const json = res.json;
		if (!json.data?.[0]?.embedding) {
			throw new Error("Invalid response from OpenAI API");
		}
		return json.data[0].embedding;
	} catch (error) {
		console.error("Failed to fetch embedding:", error);
		throw error;
	}
}