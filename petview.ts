import { ItemView, WorkspaceLeaf } from "obsidian";
import PetPlugin from "main";

// Unique ID for the view
export const VIEW_TYPE_PET = "pet-view";

export class PetView extends ItemView {
	plugin: PetPlugin;

	// Inheriting from ItemView
	constructor(leaf: WorkspaceLeaf, plugin: PetPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	// Returns view's ID
	getViewType() {
		return VIEW_TYPE_PET;
	}

	// Returns human friendly name for view (shown when hovered)
	getDisplayText() {
		return "Pet View";
	}

	// Decides icon for view
	getIcon() {
		return "cat";
	}

	// Builds content of view when it is opened
	async onOpen() {
		this.updateBackground();
	}

	updateBackground() {
		const container = this.containerEl.children[1];
		container.empty();

		// Div container for the entire pet view
		const wrapper = container.createDiv({ cls: "pet-view-wrapper" });

		// Background for the view
		if (this.plugin.getSelectedBackground() !== "none") {
			wrapper.createEl("img", {
				attr: {
					src: this.app.vault.adapter.getResourcePath(
						`${
							this.plugin.manifest.dir
						}/assets/${this.plugin.getSelectedBackground()}`
					),
					alt: "Background",
				},
				cls: "pet-view-background",
			});
		}
		// Add snow falling gif for snow backgrounds
		if (this.plugin.getSelectedBackground().includes("snow")) {
			wrapper.createEl("img", {
				attr: {
					src: this.app.vault.adapter.getResourcePath(
						`${this.plugin.manifest.dir}/assets/backgrounds/snow.gif`
					),
					alt: "Snow falling animation",
				},
				cls: "pet-view-background-animation",
			});
		}

		// Cat animation
		const idleCat = wrapper.createEl("div", {
			cls: "idlecat",
		});
		const catIdlePath = this.app.vault.adapter.getResourcePath(
			`${this.plugin.manifest.dir}/assets/pets/white_cat/idle-cat.png`
		);
		idleCat.style.backgroundImage = `url(${catIdlePath})`;

		const jumpCat = wrapper.createEl("div", {
			cls: "jumpcat",
		});
		const catJumpPath = this.app.vault.adapter.getResourcePath(
			`${this.plugin.manifest.dir}/assets/pets/white_cat/jump-cat.png`
		);
		jumpCat.style.backgroundImage = `url(${catJumpPath})`;
	}

	// Used to clean up content after view is closed
	async onClose() {
		// Nothing to clean up.
		console.log("Pet view is closing");
	}
}
