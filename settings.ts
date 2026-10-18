import { PluginSettingTab, App, SettingDefinitionItem } from "obsidian";
import PetPlugin from "./main";

// https://docs.obsidian.md/Plugins/User+interface/Settings

const SETTING_KEYS = [
	"overlayMode",
	"selectedBackground",
	"animatedBackground",
	"petSize",
	"soundEnabled",
	"geminiApiKey",
	"openAiApiKey",
	"selectedModel",
] as const;

type SettingKey = (typeof SETTING_KEYS)[number];

type ChatModel = "gemini" | "openai";

const BACKGROUND_OPTIONS: Record<string, string> = {
	none: "None",
	"backgrounds/snowbg-1.png": "Snow #1",
	"backgrounds/snowbg-2.png": "Snow #2",
	"backgrounds/summerbg-1.png": "Summer #1",
	"backgrounds/summerbg-2.png": "Summer #2",
	"backgrounds/summerbg-3.png": "Summer #3",
	"backgrounds/templebg-1.png": "Temple #1",
	"backgrounds/templebg-2.png": "Temple #2",
	"backgrounds/castlebg-1.png": "Castle #1",
	"backgrounds/castlebg-2.png": "Castle #2",
};

function isSettingKey(key: string): key is SettingKey {
	return (SETTING_KEYS as readonly string[]).includes(key);
}

export class PetSettingTab extends PluginSettingTab {
	plugin: PetPlugin;

	constructor(app: App, plugin: PetPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions(): SettingDefinitionItem<SettingKey>[] {
		const modelOptions: Record<string, string> = { none: "" };
		if (this.hasApiKey("gemini")) {
			modelOptions.gemini = "Gemini";
		}
		if (this.hasApiKey("openai")) {
			modelOptions.openai = "OpenAI";
		}

		return [
			{
				name: "Overlay mode",
				desc: "When enabled, pets treat the entire Obsidian window as their playground (using a transparent overlay).",
				control: { type: "toggle", key: "overlayMode", defaultValue: false },
			},
			{
				name: "Background",
				desc: "Select a background for the pet view.",
				visible: () => !this.plugin.instanceData.overlayMode,
				control: {
					type: "dropdown",
					key: "selectedBackground",
					defaultValue: "none",
					options: BACKGROUND_OPTIONS,
				},
			},
			{
				name: "Animations",
				desc: "Toggle the background's animation on or off.",
				visible: () => !this.plugin.instanceData.overlayMode,
				control: { type: "toggle", key: "animatedBackground", defaultValue: false },
			},
			{
				name: "Pet size",
				desc: "Adjust the size of the pet.",
				control: {
					type: "slider",
					key: "petSize",
					min: 1,
					max: 2,
					step: 0.1,
					defaultValue: 1,
				},
			},
			{
				name: "Sound",
				desc: "Enable sounds for your pets and actions.",
				control: { type: "toggle", key: "soundEnabled", defaultValue: false },
			},
			{
				type: "group",
				heading: "Chatbot API keys",
				items: [
					{
						name: "Gemini API key",
						desc: "Enter your Gemini API key to use the plugin's chat feature (this is optional given the OpenAI key).",
						control: { type: "text", key: "geminiApiKey", defaultValue: "" },
					},
					{
						name: "OpenAI API key",
						desc: "Enter your OpenAI API key to use the plugin's chat feature (this is mandatory).",
						control: { type: "text", key: "openAiApiKey", defaultValue: "" },
					},
					{
						name: "Active AI model",
						desc: "Choose which model to use for chat interactions.",
						control: {
							type: "dropdown",
							key: "selectedModel",
							defaultValue: "none",
							options: modelOptions,
						},
					},
				],
			},
		];
	}

	getControlValue(key: string): unknown {
		return isSettingKey(key) ? this.plugin.instanceData[key] : undefined;
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		switch (key) {
			case "overlayMode":
				if (typeof value === "boolean") {
					await this.plugin.setOverlayMode(value);
				}
				break;
			case "selectedBackground":
				if (typeof value === "string") {
					await this.plugin.chooseBackground(value);
				}
				break;
			case "animatedBackground":
				if (typeof value === "boolean") {
					this.plugin.toggleBackgroundAnimation(value);
				}
				break;
			case "petSize":
				if (typeof value === "number") {
					this.plugin.updatePetSize(value);
				}
				break;
			case "soundEnabled":
				if (typeof value === "boolean") {
					this.plugin.toggleSound(value);
				}
				break;
			case "geminiApiKey":
				if (typeof value === "string") {
					this.setApiKey("gemini", value);
				}
				break;
			case "openAiApiKey":
				if (typeof value === "string") {
					this.setApiKey("openai", value);
				}
				break;
			case "selectedModel":
				if (typeof value === "string") {
					this.plugin.updateChosenModel(value);
				}
				break;
		}
	}

	private setApiKey(model: ChatModel, value: string) {
		const hadKey = this.hasApiKey(model);
		if (model === "gemini") {
			this.plugin.updateGeminiApiKey(value);
		} else {
			this.plugin.updateOpenAiApiKey(value);
		}
		if (!value.trim() && this.plugin.instanceData.selectedModel === model) {
			this.plugin.updateChosenModel("none");
		}
		if (hadKey !== this.hasApiKey(model)) {
			this.update();
		}
	}

	private hasApiKey(model: ChatModel): boolean {
		const { geminiApiKey, openAiApiKey } = this.plugin.instanceData;
		const apiKey = model === "gemini" ? geminiApiKey : openAiApiKey;
		return !!apiKey?.trim();
	}
}
