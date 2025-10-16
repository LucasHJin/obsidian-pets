import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

// Note -> File links cannot be clicked
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
	selectedModel: string,
) {
	const prompt = `You are a helpful AI assistant with access to the user's Obsidian vault.
**Context from vault** (relevant notes retrieved via semantic search):
${context}

**User's question**: ${question}
---

**Instructions**:
1. **Answer the question** using the context provided above
2. **Reference sources** using *italics* instead of wikilinks (e.g., *Note Title* or *Folder/Note Title*)
3. **Formatting**:
   - Use Markdown formatting
   - Use LaTeX for math (e.g., $x^2$ or $$\\int x dx$$)
   - Keep responses well-structured with headers where appropriate
   - No extra blank lines between regular paragraphs
4. **Tone**: Be helpful and clear, with a playful catlike personality
   - Use puns and cute expressions where fitting
   - Keep it fun but informative!
5. **If context is insufficient**: You can supplement with your own knowledge, but:
   - Clearly distinguish between vault content and your general knowledge
   - Prioritize information from the vault when available

**Remember**: The user wants to learn, so explain concepts clearly as if teaching a smart beginner!`;

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
