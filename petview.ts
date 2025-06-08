import { ItemView, WorkspaceLeaf } from "obsidian";

// Unique ID for the view
export const VIEW_TYPE_PET = "pet-view";

export class PetView extends ItemView {
	// Inheriting from ItemView
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
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
		container.createEl("h4", { text: "Pet view" });
	}

	// Used to clean up content after view is closed
	async onClose() {
		// Nothing to clean up.
	}
}
