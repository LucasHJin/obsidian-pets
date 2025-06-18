import { PluginSettingTab, App, Setting } from "obsidian";
import PetPlugin from "main";

// https://docs.obsidian.md/Plugins/User+interface/Settings

export class PetSettingTab extends PluginSettingTab {
	plugin: PetPlugin;

	constructor(app: App, plugin: PetPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Dropdown for background
		new Setting(containerEl)
			.setName("Background")
			.setDesc("Select a background for the pet view.")
			.addDropdown((dropdown) => {
				dropdown
					.addOption("none", "None")
					.addOption("backgrounds/snowbg-1.png", "Snow #1")
					.addOption("backgrounds/snowbg-2.png", "Snow #2")
					.addOption("backgrounds/summerbg-1.png", "Summer #1")
					.addOption("backgrounds/summerbg-2.png", "Summer #2")
					.addOption("backgrounds/summerbg-3.png", "Summer #3")
					.addOption("backgrounds/templebg-1.png", "Temple #1")
					.addOption("backgrounds/templebg-2.png", "Temple #2")
					.addOption("backgrounds/castlebg-1.png", "Castle #1")
					.addOption("backgrounds/castlebg-2.png", "Castle #2")
					.setValue(this.plugin.instanceData.selectedBackground)
					.onChange(async (value) => {
						await this.plugin.chooseBackground(value);
					});
			});
	}
}
