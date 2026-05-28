import { PluginSettingTab, App, Setting } from "obsidian";
import PetPlugin from "./main";

// https://docs.obsidian.md/Plugins/User+interface/Settings

function addLabeledSlider(
	setting: Setting,
	value: number,
	min: number,
	max: number,
	step: number | "any",
	formatValue: (value: number) => string,
	onChange: (value: number) => void
) {
	setting.addSlider((slider) => {
		slider.setLimits(min, max, step).setValue(value).setDynamicTooltip();

		const valueEl = slider.sliderEl.parentElement?.createEl("span", {
			text: formatValue(slider.getValue()),
			cls: "pet-setting-slider-value",
		});

		slider.onChange((nextValue) => {
			valueEl?.setText(formatValue(nextValue));
			onChange(nextValue);
		});
	});
}

export class PetSettingTab extends PluginSettingTab {
	plugin: PetPlugin;

	constructor(app: App, plugin: PetPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Overlay mode toggle
		new Setting(containerEl)
			.setName("Overlay mode")
			.setDesc(
				"When enabled, pets treat the entire Obsidian window as their playground (using a transparent overlay)."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.instanceData.overlayMode ?? false)
					.onChange(async (value) => {
						await this.plugin.setOverlayMode(value);
						this.display(); // Refresh to show/hide background options
					});
			});

		if (!this.plugin.instanceData.overlayMode) {
			// Only show background options if overlay mode is off
			new Setting(containerEl)
				.setName("Background")
				.setDesc("Select a background for the pet view.")
				.addDropdown((dropdown) => {
					dropdown
						.addOption("none", "None")
						.addOption("dirt", "Dirt")
						.addOption("grass", "Grass")
						.addOption("grass_fall", "Grass (Fall)")
						.addOption("sand", "Sand")
						.addOption("snow", "Snow")
						.addOption("wood_broken", "Wood (Broken)")
						.addOption("wood_dark", "Wood (Dark)")
						.addOption("wood_light", "Wood (Light)")
						.addOption("wood_orange", "Wood (Orange)")
						.setValue(this.plugin.instanceData.selectedBackground)
						.onChange(async (value) => {
							await this.plugin.chooseBackground(value);
						});
				});
		}

		new Setting(containerEl)
			.setName("Pet size")
			.setDesc("Adjust the size of the pet.")
			.then((setting) =>
				addLabeledSlider(
					setting,
					this.plugin.instanceData.petSize ?? 1,
					0.5,
					3,
					0.1,
					(value) => value.toFixed(1),
					(value) => {
						this.plugin.updatePetSize(value);
					}
				)
			);

		new Setting(containerEl)
			.setName("Movement speed")
			.setDesc("Adjust how fast pets move around.")
			.then((setting) =>
				addLabeledSlider(
					setting,
					this.plugin.instanceData.petSpeed ?? 1,
					0.5,
					3,
					0.1,
					(value) => `${value.toFixed(1)}x`,
					(value) => {
						this.plugin.updatePetSpeed(value);
					}
				)
			);

		new Setting(containerEl)
			.setName("Chatbot API keys")
			.setHeading()

		new Setting(containerEl)
			.setName("OpenAI API key")
			.setDesc("Enter your API key for the OpenAI-compatible endpoint.")
			.addText((text) => {
				text.setValue(this.plugin.instanceData.openAiApiKey || "")
					.onChange(async (value) => {
						this.plugin.updateOpenAiApiKey(value);
						this.display();
					});
			});

		new Setting(containerEl)
			.setName("API endpoint")
			.setDesc("Enter the full OpenAI-compatible base URL, for example https://api.openai.com/v1 or your provider's compatible full URL.")
			.addText((text) => {
				text.setValue(this.plugin.instanceData.openAiBaseUrl || "https://api.openai.com/v1")
					.onChange(async (value) => {
						this.plugin.updateOpenAiBaseUrl(value.trim() || "https://api.openai.com/v1");
						this.display();
					});
			})
			.addButton((button) => {
				button.setButtonText("Use Gemini URL").onClick(() => {
					this.plugin.updateOpenAiBaseUrl("https://generativelanguage.googleapis.com/v1beta/openai/");
					this.display();
				});
			});

		new Setting(containerEl)
			.setName("Chat model")
			.setDesc("Model name sent to the selected OpenAI-compatible endpoint.")
			.addText((text) => {
				text.setValue(this.plugin.instanceData.selectedModel || "gpt-5-mini")
					.onChange(async (value) => {
						this.plugin.updateChosenModel(value);
					});
			});

		new Setting(containerEl)
			.setName("Chinese prompt")
			.setDesc("Use Chinese instructions and Chinese query reformulation for AI features.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.instanceData.useChinesePrompt ?? false)
					.onChange((value) => {
						this.plugin.updateChinesePrompt(value);
					});
			});

		new Setting(containerEl)
			.setName("Pet speech bubbles")
			.setDesc("When enabled, regular pets (cats, dogs, etc.) can show speech bubbles on right-click and via automatic rant timers.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.instanceData.petSpeechEnabled ?? true)
					.onChange((value) => {
						this.plugin.updatePetSpeechEnabled(value);
					});
			});

		new Setting(containerEl)
			.setName("NPC speech bubbles")
			.setDesc("When enabled, NPCs can show speech bubbles on right-click and via automatic rant timers.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.instanceData.npcSpeechEnabled ?? true)
					.onChange((value) => {
						this.plugin.updateNpcSpeechEnabled(value);
					});
			});

		new Setting(containerEl)
			.setName("Random page rant bubbles")
			.setDesc("When enabled, pets will occasionally complain about the current page and react on right click.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.instanceData.pageRantEnabled ?? false)
					.onChange((value) => {
						this.plugin.updatePageRantEnabled(value);
					});
			});

		new Setting(containerEl)
			.setName("Only rant when window focused")
			.setDesc("When enabled, random rant bubbles are suppressed while Obsidian is unfocused/backgrounded.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.instanceData.pageRantOnlyWhenFocused ?? true)
					.onChange((value) => {
						this.plugin.updatePageRantOnlyWhenFocused(value);
					});
			});

		new Setting(containerEl)
			.setName("Rant interval minimum")
			.setDesc("Minimum random delay in minutes before a rant bubble appears.")
			.then((setting) =>
				addLabeledSlider(
					setting,
					this.plugin.instanceData.pageRantMinMinutes ?? 5,
					1,
					180,
					1,
					(value) => `${value}`,
					(value) => {
						this.plugin.updatePageRantMinMinutes(value);
					}
				)
			);

		new Setting(containerEl)
			.setName("Rant interval maximum")
			.setDesc("Maximum random delay in minutes before a rant bubble appears.")
			.then((setting) =>
				addLabeledSlider(
					setting,
					this.plugin.instanceData.pageRantMaxMinutes ?? 20,
					1,
					180,
					1,
					(value) => `${value}`,
					(value) => {
						this.plugin.updatePageRantMaxMinutes(value);
					}
				)
			);

		new Setting(containerEl)
			.setName("Page context length")
			.setDesc("How many characters from the current note are sent to the rant LLM.")
			.then((setting) =>
				addLabeledSlider(
					setting,
					this.plugin.instanceData.pageRantContextChars ?? 1200,
					100,
					10000,
					100,
					(value) => `${value}`,
					(value) => {
						this.plugin.updatePageRantContextChars(value);
					}
				)
			);

	}
}
