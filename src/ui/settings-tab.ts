import { PluginSettingTab, App, SettingDefinitionItem } from "obsidian";
import PetPlugin from "../main";
import { DEFAULT_DATA } from "../data";

// https://docs.obsidian.md/Plugins/User+interface/Settings

const SETTING_KEYS = [
	"overlayMode",
	"selectedBackground",
	"animatedBackground",
	"petSize",
	"soundEnabled",
] as const;

type SettingKey = (typeof SETTING_KEYS)[number];

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

	override getSettingDefinitions(): SettingDefinitionItem<SettingKey>[] {
		return [
			{
				name: "Overlay mode",
				desc: "When enabled, pets treat the entire Obsidian window as their playground (using a transparent overlay).",
				control: {
					type: "toggle",
					key: "overlayMode",
					defaultValue: DEFAULT_DATA.overlayMode,
				},
			},
			{
				name: "Background",
				desc: "Select a background for the pet view.",
				visible: () => !this.plugin.instanceData.overlayMode,
				control: {
					type: "dropdown",
					key: "selectedBackground",
					defaultValue: DEFAULT_DATA.selectedBackground,
					options: BACKGROUND_OPTIONS,
				},
			},
			{
				name: "Animations",
				desc: "Toggle the background's animation on or off.",
				visible: () => !this.plugin.instanceData.overlayMode,
				control: {
					type: "toggle",
					key: "animatedBackground",
					defaultValue: DEFAULT_DATA.animatedBackground,
				},
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
					defaultValue: DEFAULT_DATA.petSize,
				},
			},
			{
				name: "Sound",
				desc: "Enable sounds for your pets and actions.",
				control: {
					type: "toggle",
					key: "soundEnabled",
					defaultValue: DEFAULT_DATA.soundEnabled,
				},
			},
		];
	}

	override getControlValue(key: string): unknown {
		return isSettingKey(key) ? this.plugin.instanceData[key] : undefined;
	}

	override async setControlValue(key: string, value: unknown): Promise<void> {
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
		}
	}
}
