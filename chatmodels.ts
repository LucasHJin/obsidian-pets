import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { ConversationMessage } from "main";

// Note -> File links cannot be clicked
// ADD CONTEXT OF PREVIOUS MESSAGES -> need to do this before searching for context?

export function initModel(
	selectedModel: string,
	geminiKey: string,
	openAiKey: string
) {
	if (selectedModel === "gemini") {
		return new GoogleGenAI({ apiKey: geminiKey });
	} else if (selectedModel === "openai") {
		return new OpenAI({
			apiKey: openAiKey,
			baseURL: "https://api.openai.com/v1",
			dangerouslyAllowBrowser: true,
		}); // Can allow because lowkey
	} else {
		return null;
	}
}

export async function askModel(
	context: string,
	question: string,
	model: GoogleGenAI | OpenAI,
	selectedModel: string,
	conversationHistory: ConversationMessage[]
) {
	const prompt = `You are a helpful AI assistant with access to the user's Obsidian vault.
**Context from vault** (relevant notes retrieved via semantic search):
${context}
---

**Conversation History**: 
${conversationHistory
	.map((msg) => `\n- ${msg.role}: \n  - ${msg.content}`)
	.join("")}
---

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
   - Prioritize information from the vault when available (without repeating already provided context/information)

**Remember**: The user wants to learn, so explain concepts clearly as if teaching a smart beginner!`;

	// console.log("Prompt to model:", prompt);

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

// Helper function to reformulate follow-up questions into standalone queries (for better semantic searching)
export async function reformulateQuery(
	question: string,
	recentContext: string,
	model: GoogleGenAI | OpenAI | null,
	selectedModel: string
): Promise<string> {
	if (!model) {
		return question;
	}

	try {
		const prompt = `You are a helpful AI assistant with access to the user's Obsidian vault in the middle of a conversation with the user.
Given this recent conversation:
${recentContext}

The user now asks: "${question}"

Determine whether the question is standalone or a follow-up to a previous question.
- If the question is standalone, return it as is. 
- If it's a follow up question, rewrite it based on the recent conversation to be a complete, standalone question that captures the full intent of the question.

Examples:
- If they asked about "chemistry" then said "explain it" -> output "explain chemistry"
- If they asked about "Einstein" then said "tell me more" -> output "tell me more about Einstein"
- If they asked about "photosynthesis" then said "what are examples" -> output "examples of photosynthesis"
- If they asked "what is the capital of France" -> output "what is the capital of France"

Reformulated query:`;

		if (selectedModel === "gemini") {
			const response = await (
				model as GoogleGenAI
			).models.generateContent({
				model: "gemini-2.5-flash",
				contents: [{ role: "user", parts: [{ text: prompt }] }],
			});
			return response.text?.trim() || question;
		}

		if (selectedModel === "openai") {
			const response = await (
				model as OpenAI
			).chat.completions.create({
				model: "gpt-5-mini",
				messages: [{ role: "user", content: prompt }],
			});
			return response.choices[0].message.content?.trim() || question;
		}
	} catch (e) {
		console.error("Query reformulation failed:", e);
		// Fallback: simple concatenation
		const lastUserMsg = recentContext
			.split("\n")
			.find((line) => line.startsWith("user:"));
		if (lastUserMsg) {
			return `${lastUserMsg.replace("user:", "").trim()} ${question}`;
		}
	}

	return question; // Fallback to original
}
