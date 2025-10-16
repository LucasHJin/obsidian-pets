// Note -> using fetch because no dependencies/bundle size + it's a local obsidian 'browser' (don't need to worry about leaking API keys)
// Converts the inputted text into an embedding vector using OpenAI's API
export async function fetchEmbedding(
	apiKey: string,
	input: string
): Promise<number[]> {
  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
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

    // Error handling for response
    if (!res.ok) {
			const error = await res.json().catch(() => ({ error: { message: res.statusText } }));
			throw new Error(`OpenAI API error (${res.status}): ${error.error?.message || 'Unknown error'}`);
		}
		const json = await res.json();
    // Error handling for structure
		if (!json.data?.[0]?.embedding) {
			throw new Error("Invalid response from OpenAI API");
		}
		return json.data[0].embedding; // Return the embedding vector
	} catch (error) {
		console.error("Failed to fetch embedding:", error);
		throw error;
	}
}