import OpenAI from "openai";
import { StardewPersona } from "./pet-utils/stardew-species";

function buildPageRantPrompt(
	pageLabel: string,
	trigger: "timer" | "rightclick",
	selectedText: string,
	pageContext: string,
	contextCharLimit: number,
	activitySummary: string,
	petPersona: StardewPersona | undefined,
	useChinesePrompt: boolean
): string {
	const contextSection = pageContext
		? `\n页面内容摘录（最多约 ${contextCharLimit} 字）：\n${pageContext}`
		: "\n页面内容摘录：无可用内容";

	const activitySection = activitySummary
		? `\n最近活动摘要（最近约 10 分钟）：\n${activitySummary}`
		: "\n最近活动摘要：无可用活动";

	const selectionSection = selectedText
		? `\n选中内容（已截断，供参考）：\n${selectedText}`
		: "\n选中内容：无";
	const personaSection = petPersona
		? `\n宠物身份：${petPersona.identity}\n宠物性格：${petPersona.temperament}\n吐槽风格：${petPersona.rantStyle}`
		: "";

	if (useChinesePrompt) {
		return `你是一只从星露谷农场溜出来的小动物，正在当前页面附近闲逛，偶尔会对看到的内容吐槽两句。
页面标题：${pageLabel}
触发方式：${trigger === "timer" ? "路过瞧了一眼" : "被你右键戳了一下"}
${contextSection}
${selectionSection}
${activitySection}
${personaSection}

提示：如果有选中内容，请把吐槽的焦点放在选中内容上，而不是仅针对页面整体进行笼统点评。

请生成一句自然、鲜活、像星露谷日常对话一样的吐槽。
要求：
- 只输出 1 句
- 10 到 28 个汉字左右
- 像星露谷 NPC 那样说话，温暖、有点 quirky，偶尔提到农场、季节、天气或社区中心
- 明确围绕选中内容（如果有），否则针对页面进行吐槽
- 不要刻薄、冒犯或说教
- 不要解释，不要加前缀，不要加引号`;
	}

	return `You are a little creature that wandered out from Stardew Valley, strolling around the current page and occasionally commenting on what you see.
Page title: ${pageLabel}
Trigger: ${trigger === "timer" ? "wandered by for a look" : "poked by right-click"}
${contextSection}
${selectionSection}
${activitySection}
${personaSection}

Note: If there is selected text, focus the roast on that selected content rather than a generic page-level comment.

Write one natural, vivid line that sounds like a Stardew Valley NPC talking.
Requirements:
- Output exactly 1 sentence
- Keep it around 8 to 18 words
- Warm, a little quirky, like a villager from Pelican Town — mention the farm, seasons, or the valley if it feels right
- Be playful and vivid, but not mean or preachy
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
	selectedText: string,
	pageContext: string,
	contextCharLimit: number,
	activitySummary: string,
	petPersona: StardewPersona | undefined,
	model: OpenAI | null,
	selectedModel: string,
	useChinesePrompt: boolean
): Promise<string> {
	if (!model) {
		return "";
	}

	const prompt = buildPageRantPrompt(pageLabel, trigger, selectedText, pageContext, contextCharLimit, activitySummary, petPersona, useChinesePrompt);

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
