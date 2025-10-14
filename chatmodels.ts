import { GoogleGenAI } from "@google/genai";

// IMPLEMENT LATEX + MARKDOWN + FILE LINKS
// ALSO SET UP OPEN AI

export async function askModel(
	context: string,
	question: string,
	model: GoogleGenAI
) {
	const response = await model.models.generateContent({
		model: "gemini-2.0-flash-exp", // or "gemini-1.5-flash"
		contents: [
			{
				role: "user",
				parts: [
					{
						text: `Here are details from an Obsidian vault regarding a user's notes:
${context}

Analyze them and, without using any more external information, provide a concise answer to the following question (while also mentioning which files you got the primary information from): 
${question}`,
					},
				],
			},
		],
	});
	return response.text || "Sorry, I couldn't currently generate a response.";
}

export async function testModel(value: string, model: GoogleGenAI) {
	const response = await model.models.generateContent({
		model: "gemini-2.5-flash",
		contents: `Write a random response to the following value: ${value}`,
	});
	return response.text;
}