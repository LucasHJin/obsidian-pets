// Splits long text into smaller chunks (with overlap - preserves context)
export function chunkText(
	text: string,
	chunkSize = 700,
	overlap = 100
): string[] {
	const chunks: string[] = [];
	for (let i = 0; i < text.length; i += chunkSize - overlap) { // Only move forward by chunkSize - overlap for overlap
		chunks.push(text.slice(i, i + chunkSize));
	}
	return chunks;
}

// Measures how similar 2 vectors are (-1: opposites to 1: identical)
export function cosineSim(a: number[], b: number[]): number {
	let dot = 0; // Dot product
	let na = 0; // Magnitude of a 
	let nb = 0; // Magnitude of b
	for (let i = 0; i < a.length; i++) {
		dot += a[i] * b[i];
		na += a[i] ** 2;
		nb += b[i] ** 2;
	}
  // cosine similarity = (A · B) / (|A| × |B|)
	return dot / (Math.sqrt(na) * Math.sqrt(nb));
}