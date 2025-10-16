import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

// IMPLEMENT LATEX + MARKDOWN + FILE LINKS
// TUNE PROMPT
// ADD CONTEXT OF PREVIOUS MESSAGES

export function initModel(selectedModel: string, geminiKey: string, openAiKey: string) {
	if (selectedModel === "gemini") {
		return new GoogleGenAI({ apiKey: geminiKey });
	} else if (selectedModel === "openai") {
		return new OpenAI({ apiKey: openAiKey, baseURL: "https://api.openai.com/v1", dangerouslyAllowBrowser: true }); // Can allow because lowkey
	} else {
		return null;
	}
}

export async function askModel(
	context: string,
	question: string,
	model: GoogleGenAI | OpenAI,
	selectedModel: string
) {
	const prompt = `Here are details from an Obsidian vault regarding a user's notes:
${context}

Analyze them and provide an answer to the user's question below:
${question}

Keep these guidelines in mind while answering:
- Respond using Markdown and LaTeX where appropriate.
- Include file references in [[wikilink]] format if you reference a note.
- Keep the answer structured.
- Put text on separate lines, but do not add extra spacing or blank lines between lines.
- IF AND ONLY IF the context doesn't provide enough information, you can use your own knowledge to fill in the gaps.
`;

	if (selectedModel === "gemini") {
		const response = await (model as GoogleGenAI).models.generateContent({
			model: "gemini-2.5-flash",
			contents: [{ role: "user", parts: [{ text: prompt }] }],
		});
		return response.text || "Sorry, I couldn't generate a response.";
	}

	if (selectedModel === "openai") {
		const response = await (model as OpenAI).chat.completions.create({
			model: "gpt-5-mini", 
			messages: [{ role: "user", content: prompt }],
		});
		return response.choices[0].message.content || "No response generated.";
	}

	return "No valid model selected.";
}
