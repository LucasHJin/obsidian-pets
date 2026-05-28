import { PluginSettingTab, App, Setting, Notice } from "obsidian";
import PetPlugin from "./main";
import { initModel } from "./chatmodels";

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

		// ── Display ──────────────────────────────────────────────
		containerEl.createEl("h2", { text: "Display" });

		new Setting(containerEl)
			.setName("Overlay mode")
			.setDesc(
				"When enabled, pets roam freely across the entire Obsidian window on a transparent overlay. When disabled, pets live in a dockable side panel — you can choose a background scene below."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.instanceData.overlayMode ?? false)
					.onChange(async (value) => {
						await this.plugin.setOverlayMode(value);
						this.display();
					});
			});

		if (!this.plugin.instanceData.overlayMode) {
			new Setting(containerEl)
				.setName("Background")
				.setDesc("Select a background scene for the pet panel. Not available in overlay mode.")
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
		} else {
			new Setting(containerEl)
				.setName("Background")
				.setDesc("Background selection is not available in overlay mode — pets use the full window as their playground. Disable overlay mode above to choose a background.")
				.addDropdown((dropdown) => {
					dropdown.addOption("", "—").setDisabled(true);
				});
		}

		new Setting(containerEl)
			.setName("Pet size")
			.setDesc("Scale all pets from half size to triple size.")
			.then((setting) =>
				addLabeledSlider(
					setting,
					this.plugin.instanceData.petSize ?? 1,
					0.5,
					3,
					0.1,
					(value) => `${value.toFixed(1)}x`,
					(value) => {
						this.plugin.updatePetSize(value);
					}
				)
			);

		new Setting(containerEl)
			.setName("Movement speed")
			.setDesc("How quickly pets wander around. Higher values mean faster movement.")
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

		// ── AI Chat Configuration ────────────────────────────────
		containerEl.createEl("h2", { text: "AI Chat Configuration" });

		new Setting(containerEl)
			.setName("OpenAI API key")
			.setDesc("Your API key for OpenAI, Gemini, DeepSeek, or another OpenAI-compatible provider.")
			.addText((text) => {
				text.setValue(this.plugin.instanceData.openAiApiKey || "")
					.onChange(async (value) => {
						this.plugin.updateOpenAiApiKey(value);
					});
				text.inputEl.type = "password";
				text.inputEl.setAttribute("autocomplete", "off");
			})
			.addExtraButton((btn) => {
				btn.setIcon("eye")
					.setTooltip("Show/hide API key")
					.onClick(() => {
						const input = btn.extraSettingsEl.parentElement?.querySelector("input") as HTMLInputElement;
						if (input) {
							input.type = input.type === "password" ? "text" : "password";
						}
					});
			});

		new Setting(containerEl)
			.setName("API endpoint")
			.setDesc("OpenAI-compatible base URL. Defaults to OpenAI. Use the button to switch to Google Gemini.")
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
			.setDesc("Model name for your provider (e.g. gpt-4o-mini, gemini-2.5-flash, deepseek-chat).")
			.addText((text) => {
				text.setValue(this.plugin.instanceData.selectedModel || "gpt-5-mini")
					.onChange(async (value) => {
						this.plugin.updateChosenModel(value);
					});
			});

		new Setting(containerEl)
			.setName("Chinese prompt")
			.setDesc("Use Chinese-language instructions for AI-generated speech. Disable for English prompts.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.instanceData.useChinesePrompt ?? false)
					.onChange((value) => {
						this.plugin.updateChinesePrompt(value);
					});
			});

		new Setting(containerEl)
			.setName("Test connection")
			.setDesc("Send a minimal request to verify your API key, endpoint, and model are configured correctly.")
			.addButton((button) => {
				button.setButtonText("Test").onClick(async () => {
					const key = this.plugin.instanceData.openAiApiKey?.trim();
					const baseUrl = this.plugin.instanceData.openAiBaseUrl?.trim();
					const model = this.plugin.instanceData.selectedModel?.trim();

					if (!key) {
						new Notice("Please enter an API key first.", 5000);
						return;
					}
					if (!baseUrl) {
						new Notice("Please enter an API endpoint.", 5000);
						return;
					}
					if (!model) {
						new Notice("Please enter a chat model name.", 5000);
						return;
					}

					button.setButtonText("Testing...");
					button.setDisabled(true);

					try {
						const client = initModel(key, baseUrl, model);
						const response = await client.chat.completions.create({
							model: model,
							messages: [{ role: "user", content: "Say 'ok'" }],
							max_tokens: 20,
						});
						const reply = response.choices[0]?.message?.content?.trim() || "";
						if (reply) {
							new Notice(`Connection successful! Response: "${reply}"`, 6000);
						} else {
							new Notice("Connection successful! API key, endpoint, and model are configured correctly.", 6000);
						}
					} catch (e: any) {
						const errMsg = e?.message || String(e);
						console.error("API connection test failed:", e);
						new Notice(`Connection failed: ${errMsg}`, 8000);
					} finally {
						button.setButtonText("Test");
						button.setDisabled(false);
					}
				});
			});

		// ── Speech Bubbles ───────────────────────────────────────
		containerEl.createEl("h2", { text: "Speech Bubbles" });

		new Setting(containerEl)
			.setName("Pet speech bubbles")
			.setDesc("Allow regular pets (cats, dogs, etc.) to show speech bubbles on right-click and via automatic rants.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.instanceData.petSpeechEnabled ?? true)
					.onChange((value) => {
						this.plugin.updatePetSpeechEnabled(value);
					});
			});

		new Setting(containerEl)
			.setName("NPC speech bubbles")
			.setDesc("Allow Stardew Valley NPCs to show speech bubbles on right-click and via automatic rants.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.instanceData.npcSpeechEnabled ?? true)
					.onChange((value) => {
						this.plugin.updateNpcSpeechEnabled(value);
					});
			});

		// ── Random Page Rant ─────────────────────────────────────
		containerEl.createEl("h2", { text: "Random Page Rant" });
		containerEl.createEl("p", {
			text: "Pets and NPCs can periodically comment on your notes using AI. Configure how often and how much page content they see.",
			cls: "setting-item-description",
		});

		new Setting(containerEl)
			.setName("Random page rant bubbles")
			.setDesc("When enabled, pets and NPCs will occasionally speak up on their own based on the rant timer.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.instanceData.pageRantEnabled ?? false)
					.onChange((value) => {
						this.plugin.updatePageRantEnabled(value);
					});
			});

		new Setting(containerEl)
			.setName("Only rant when window focused")
			.setDesc("Suppress automatic rants while Obsidian is in the background. Right-click rants are unaffected.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.instanceData.pageRantOnlyWhenFocused ?? true)
					.onChange((value) => {
						this.plugin.updatePageRantOnlyWhenFocused(value);
					});
			});

		new Setting(containerEl)
			.setName("Rant interval minimum")
			.setDesc("Minimum time between automatic speech bubbles.")
			.then((setting) =>
				addLabeledSlider(
					setting,
					this.plugin.instanceData.pageRantMinMinutes ?? 5,
					1,
					180,
					1,
					(value) => `${value} min`,
					(value) => {
						this.plugin.updatePageRantMinMinutes(value);
					}
				)
			);

		new Setting(containerEl)
			.setName("Rant interval maximum")
			.setDesc("Maximum time between automatic speech bubbles. The actual delay is randomly chosen between the minimum and maximum.")
			.then((setting) =>
				addLabeledSlider(
					setting,
					this.plugin.instanceData.pageRantMaxMinutes ?? 20,
					1,
					180,
					1,
					(value) => `${value} min`,
					(value) => {
						this.plugin.updatePageRantMaxMinutes(value);
					}
				)
			);

		new Setting(containerEl)
			.setName("Page context length")
			.setDesc("How many characters from your current note are sent to the AI for context. More characters give better awareness but cost more tokens.")
			.then((setting) =>
				addLabeledSlider(
					setting,
					this.plugin.instanceData.pageRantContextChars ?? 1200,
					100,
					10000,
					100,
					(value) => `${value} chars`,
					(value) => {
						this.plugin.updatePageRantContextChars(value);
					}
				)
			);

		// ── Reset ────────────────────────────────────────────────
		containerEl.createEl("h2", { text: "Reset" });

		new Setting(containerEl)
			.setName("Reset all settings to defaults")
			.setDesc("Restores every setting to its original value. This does not affect your pets — they will stay right where they are.")
			.addButton((button) => {
				button.setButtonText("Reset to defaults")
					.setWarning()
					.onClick(async () => {
						this.plugin.instanceData.selectedBackground = "none";
						this.plugin.instanceData.petSize = 1;
						this.plugin.instanceData.petSpeed = 1;
						this.plugin.instanceData.overlayMode = false;
						this.plugin.instanceData.openAiApiKey = "";
						this.plugin.instanceData.openAiBaseUrl = "https://api.openai.com/v1";
						this.plugin.instanceData.selectedModel = "gpt-5-mini";
						this.plugin.instanceData.useChinesePrompt = false;
						this.plugin.instanceData.pageRantEnabled = false;
						this.plugin.instanceData.pageRantMinMinutes = 5;
						this.plugin.instanceData.pageRantMaxMinutes = 20;
						this.plugin.instanceData.pageRantContextChars = 1200;
						this.plugin.instanceData.pageRantOnlyWhenFocused = true;
						this.plugin.instanceData.petSpeechEnabled = true;
						this.plugin.instanceData.npcSpeechEnabled = true;
						await this.plugin.saveData(this.plugin.instanceData);
						this.display();
						new Notice("Settings have been reset to defaults.");
					});
			});
	}
}
