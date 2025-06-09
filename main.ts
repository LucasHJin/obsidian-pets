import { Plugin, WorkspaceLeaf } from "obsidian";
import { PetView, VIEW_TYPE_PET } from "petview";
import { PetSettingTab } from "settings";

// Define shape of saved plugin data
interface PetPluginData {
	isViewOpen: boolean; // Boolean for toggling the view open/close
	selectedBackground: string;
}

const DEFAULT_DATA: Partial<PetPluginData> = {
	isViewOpen: false,
	selectedBackground: "none",
};

export default class PetPlugin extends Plugin {
	instanceData: PetPluginData;

	async onload(): Promise<void> {
		// Loads saved data and merges with current data
		try {
			await this.loadSettings();
		} catch (err) {
			console.error("Failed to load pet plugin data:", err);
		}

		// Add instance of the view
		this.registerView(VIEW_TYPE_PET, (leaf) => new PetView(leaf, this));

		// Open again if open last session (wait until obsidian is ready first)
		this.app.workspace.onLayoutReady(async () => {
			if (this.instanceData.isViewOpen) {
				await this.createView();
			}
		});

		// Adds icon on the ribbon (side panel) to open view
		const sideIcon = this.addRibbonIcon("cat", "Open pet view", () => {
			if (this.instanceData.isViewOpen) {
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

		this.addSettingTab(new PetSettingTab(this.app, this));
	}

	async onunload(): Promise<void> {
		// Close the view when unloading
		await this.closeView();
	}

	// Merges current data with default data
	async loadSettings() {
		this.instanceData = Object.assign(
			{},
			DEFAULT_DATA,
			await this.loadData()
		);
	}

	createBackgroundCommand(id: string, name: string, backgroundFile: string) {
		this.addCommand({
			id: id,
			name: name,
			callback: async () => {
				await this.chooseBackground(backgroundFile);
			},
		});
	}

	public async chooseBackground(backgroundFile: string): Promise<void> {
		// Persist background data across sessions
		this.instanceData.selectedBackground = backgroundFile;
		await this.saveData(this.instanceData);

		// Update all open PetViews
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PET);
		for (const leaf of leaves) {
			const view = leaf.view;
			// if is a PetView
			if (view instanceof PetView) {
				view.updateBackground();
			}
		}
	}

	// Getter function to get background in petview.ts
	public getSelectedBackground(): string {
		return this.instanceData.selectedBackground;
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

		// Persist if view is open accross sessions
		this.instanceData.isViewOpen = true;
		await this.saveData(this.instanceData);
	}

	// Remove the leaf (view) based on its ID
	async closeView() {
		const { workspace } = this.app;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_PET);

		for (const leaf of leaves) {
			await leaf.detach();
		}

		// Persist if view is open accross sessions
		this.instanceData.isViewOpen = false;
		await this.saveData(this.instanceData);
	}
}
