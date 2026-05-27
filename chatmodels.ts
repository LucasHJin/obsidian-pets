import OpenAI from "openai";
import { ConversationMessage } from "./main";

// Note -> File links cannot be clicked
// ADD CONTEXT OF PREVIOUS MESSAGES -> need to do this before searching for context?

function buildResponseInstructions(useChinesePrompt: boolean): string {
	if (useChinesePrompt) {
		return `1. 使用上面的上下文回答问题
2. 引用来源时请使用 *斜体*，不要使用 wikilink（例如 *笔记标题* 或 *文件夹/笔记标题*）
3. 格式：
   - 使用 Markdown
   - 数学公式使用 LaTeX（例如 $x^2$ 或 $$\\int x dx$$）
   - 适当使用标题来组织结构
   - 普通段落之间不要额外空行
4. 语气：友好、清晰，带一点可爱的猫咪感
   - 适当时可以使用双关语和软萌表达
   - 轻松但要准确
5. 如果上下文不足：你可以补充自己的知识，但要
   - 明确区分知识库内容和你自己的常识
   - 优先使用知识库里的信息（不要重复已经给出的内容）

**记住**：用户想要学习，所以请像教一位聪明的初学者一样清晰解释概念！`;
}

	return `1. Answer the question using the context provided above
2. Reference sources using *italics* instead of wikilinks (e.g., *Note Title* or *Folder/Note Title*)
3. Formatting:
   - Use Markdown formatting
   - Use LaTeX for math (e.g., $x^2$ or $$\\int x dx$$)
   - Keep responses well-structured with headers where appropriate
   - No extra blank lines between regular paragraphs
4. Tone: Be helpful and clear, with a playful catlike personality
   - Use puns and cute expressions where fitting
   - Keep it fun but informative!
5. If context is insufficient: You can supplement with your own knowledge, but:
   - Clearly distinguish between vault content and your general knowledge
   - Prioritize information from the vault when available (without repeating already provided context/information)

**Remember**: The user wants to learn, so explain concepts clearly as if teaching a smart beginner!`;
}

function buildReformulationPrompt(
	question: string,
	recentContext: string,
	useChinesePrompt: boolean
): string {
	if (useChinesePrompt) {
		return `你是一个帮助整理问题的 AI 助手，正在和用户进行对话。
给定下面这段最近的对话：
${recentContext}

用户现在问："${question}"

判断这个问题是独立问题还是前一个问题的追问。
- 如果是独立问题，原样返回。
- 如果是追问，请结合上下文改写成完整、独立、能表达完整意图的问题。

示例：
- 如果先问了“化学”，随后说“解释一下” -> 输出“解释化学”
- 如果先问了“爱因斯坦”，随后说“多讲一点” -> 输出“多讲一点爱因斯坦”
- 如果先问了“光合作用”，随后说“有哪些例子” -> 输出“光合作用的例子”
- 如果问的是“法国的首都是哪里” -> 原样输出“法国的首都是哪里”

改写后的问题：`;
}

	return `You are a helpful AI assistant with access to the user's Obsidian vault in the middle of a conversation with the user.
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
}

function buildPageRantPrompt(
	pageLabel: string,
	trigger: "timer" | "rightclick",
	pageContext: string,
	contextCharLimit: number,
	useChinesePrompt: boolean
): string {
	const contextSection = pageContext
		? `\n页面内容摘录（最多约 ${contextCharLimit} 字）：\n${pageContext}`
		: "\n页面内容摘录：无可用内容";

	if (useChinesePrompt) {
		return `你是一只很有灵气、会观察页面的小猫，正在对当前打开的页面吐槽。
页面标题：${pageLabel}
触发方式：${trigger === "timer" ? "随机路过" : "右键互动"}
${contextSection}

请生成一句自然、鲜活、带画面感的吐槽，像真的在现场观察。
要求：
- 只输出 1 句
- 10 到 28 个汉字左右
- 口语化，有一点情绪和俏皮感
- 可以轻微阴阳怪气，但不要刻薄、冒犯或说教
- 不要解释，不要加前缀，不要加引号`;
	}

	return `You are a lively, observant cat teasing the currently open page.
Page title: ${pageLabel}
Trigger: ${trigger === "timer" ? "random pass-by" : "right click interaction"}
${contextSection}

Write one natural, vivid roast line that feels like a real-time observation.
Requirements:
- Output exactly 1 sentence
- Keep it around 8 to 18 words
- Sound playful, vivid, and a little mischievous
- Be lightly sarcastic if you want, but not mean or preachy
- Do not explain, do not add a prefix, do not use quotation marks`;
}

function cleanSingleLine(text: string): string {
	return text
		.replace(/^[\s>*`"'【\[]+/, "")
		.replace(/[\s>*`"'】\]]+$/, "")
		.split(/\r?\n/)
		.map((line) => line.trim())
		.find((line) => line.length > 0) || "";
}

export async function generatePageRantText(
	pageLabel: string,
	trigger: "timer" | "rightclick",
	pageContext: string,
	contextCharLimit: number,
	model: OpenAI | null,
	selectedModel: string,
	useChinesePrompt: boolean
): Promise<string> {
	if (!model) {
		return "";
	}

	const prompt = buildPageRantPrompt(pageLabel, trigger, pageContext, contextCharLimit, useChinesePrompt);

	try {
		const response = await model.chat.completions.create({
			model: selectedModel,
			messages: [{ role: "user", content: prompt }],
		});
		return cleanSingleLine(response.choices[0].message.content || "");
	} catch (e) {
		console.error("Page rant generation failed:", e);
	}

	return "";
}

export function initModel(
	openAiKey: string,
	openAiBaseUrl: string,
	selectedModel: string
) {
	return new OpenAI({
		apiKey: openAiKey,
		baseURL: openAiBaseUrl,
		dangerouslyAllowBrowser: true,
	});
}

export async function askModel(
	context: string,
	question: string,
	model: OpenAI,
	selectedModel: string,
	conversationHistory: ConversationMessage[],
	useChinesePrompt: boolean
) {
	const prompt = `${useChinesePrompt ? "你是一个友好且有帮助的 AI 助手，能够访问用户的 Obsidian 知识库。" : "You are a helpful AI assistant with access to the user's Obsidian vault."}
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
${buildResponseInstructions(useChinesePrompt)}`;

	// console.log("Prompt to model:", prompt);

	const response = await model.chat.completions.create({
		model: selectedModel,
		messages: [{ role: "user", content: prompt }],
	});
	return response.choices[0].message.content || "No response generated.";
}

// Helper function to reformulate follow-up questions into standalone queries (for better semantic searching)
export async function reformulateQuery(
	question: string,
	recentContext: string,
	model: OpenAI | null,
	selectedModel: string,
	useChinesePrompt: boolean
): Promise<string> {
	if (!model) {
		return question;
	}

	try {
		const prompt = buildReformulationPrompt(question, recentContext, useChinesePrompt);

		const response = await model.chat.completions.create({
			model: selectedModel,
			messages: [{ role: "user", content: prompt }],
		});
		return response.choices[0].message.content?.trim() || question;
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
