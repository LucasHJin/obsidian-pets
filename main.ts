import { Plugin, WorkspaceLeaf } from "obsidian";
import { PetView, VIEW_TYPE_PET } from "petview";

// MAKE IT SAVE STATE OF TOGGLE OPEN CLOSE
// Also make ability to select background just in the saved settings

export default class PetPlugin extends Plugin {
	private isViewOpen = false; // Boolean for toggling the view open/close
	public selectedBackground = "none";

	async onload(): Promise<void> {
		// Add instance of the view
		this.registerView(VIEW_TYPE_PET, (leaf) => new PetView(leaf, this));

		// Adds icon on the ribbon (side panel) to open view
		const sideIcon = this.addRibbonIcon("cat", "Open pet view", () => {
			if (this.isViewOpen) {
				this.closeView();
				sideIcon.setAttr("aria-label", "Open pet view");
			} else {
				this.createView();
				sideIcon.setAttr("aria-label", "Close pet view");
			}
		});

		// Create background commands
		const BACKGROUNDS = [
			{
				id: "no-background",
				name: "Set background to none.",
				file: "none",
			},
			{
				id: "snow-background-1",
				name: "Set background to snowy background #1.",
				file: "snowbg-1.png",
			},
			{
				id: "snow-background-2",
				name: "Set background to snowy background #2.",
				file: "snowbg-2.png",
			},
			{
				id: "summer-background-1",
				name: "Set background to summer background #1.",
				file: "summerbg-1.png",
			},
			{
				id: "summer-background-2",
				name: "Set background to summer background #2.",
				file: "summerbg-2.png",
			},
			{
				id: "summer-background-3",
				name: "Set background to summer background #3.",
				file: "summerbg-3.png",
			},
			{
				id: "temple-background-1",
				name: "Set background to temple background #1.",
				file: "templebg-1.png",
			},
			{
				id: "temple-background-2",
				name: "Set background to temple background #2.",
				file: "templebg-2.png",
			},
			{
				id: "castle-background-1",
				name: "Set background to castle background #1.",
				file: "castlebg-1.png",
			},
			{
				id: "castle-background-2",
				name: "Set background to castle background #2.",
				file: "castlebg-2.png",
			},
		];

		for (const bg of BACKGROUNDS) {
			this.createBackgroundCommand(bg.id, bg.name, bg.file);
		}
	}

	createBackgroundCommand(id: string, name: string, backgroundFile: string) {
		this.addCommand({
			id: id,
			name: name,
			callback: () => {
				this.selectedBackground = backgroundFile;

				const leaves =
					this.app.workspace.getLeavesOfType(VIEW_TYPE_PET);
				for (const leaf of leaves) {
					const view = leaf.view;
					if (view instanceof PetView) {
						view.updateBackground();
					}
				}
			},
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
