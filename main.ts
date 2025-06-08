import { Plugin, WorkspaceLeaf } from "obsidian";
import { PetView, VIEW_TYPE_PET } from "petview";

export default class PetPlugin extends Plugin {
	private isViewOpen = false; // Boolean for toggling the view open/close

	async onload(): Promise<void> {
    // Add instance of the view
		this.registerView(VIEW_TYPE_PET, (leaf) => new PetView(leaf));

    // Adds icon on the ribbon (side panel) to open view
		this.addRibbonIcon("cat", "Create pet", () => {
			this.isViewOpen ? this.closeView() : this.createView();
		});
	}

	async onunload(): Promise<void> {
    // Close the view when unloading
		await this.closeView();
	}

	// Create the pet leaf
	async createView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_PET);
		// Check if leaf already exists (if not -> create it)
		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getLeftLeaf(true);
			if (leaf) {
				await leaf.setViewState({ type: VIEW_TYPE_PET, active: true });
			}
		}

		// Show the leaf (view) to the user
		if (leaf) {
			workspace.revealLeaf(leaf);
		}

		this.isViewOpen = true;
	}

	// Remove the leaf (view) based on its ID
	async closeView() {
		const { workspace } = this.app;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_PET);

		for (const leaf of leaves) {
			await leaf.detach();
		}

		this.isViewOpen = false;
	}
}
