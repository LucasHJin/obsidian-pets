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
		const container = this.containerEl.children[1];
		container.empty();
		
        // Div container for the entire pet view
        const wrapper = container.createDiv({ cls: "pet-view-wrapper" });

        // Background for the view
        const bg = wrapper.createEl("img", {
            attr: {
                src: this.app.vault.adapter.getResourcePath(`${this.plugin.manifest.dir}/assets/thanks.gif`),
                alt: "Background"
            },
            cls: "pet-view-background"
        });
        
	}

	// Used to clean up content after view is closed
	async onClose() {
		// Nothing to clean up.
	}
}
