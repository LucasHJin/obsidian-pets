import { Plugin, WorkspaceLeaf } from "obsidian";
import { PetView, VIEW_TYPE_PET } from "petView";
import { PetSettingTab } from "settings";
import { SelectorModal, SelectorOption } from "selectorModal";

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
				await this.openView();
			}
		});

		// Adds icon on the ribbon (side panel) to open view
		this.addRibbonIcon("cat", "Toggle pet view", async () => {
			if (this.instanceData.isViewOpen) {
				await this.closeView();
			} else {
				await this.openView();
			}
		});

		// Listen for if the view is closed manually and chnage the isViewOpen
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf) => {
				const leaves =
					this.app.workspace.getLeavesOfType(VIEW_TYPE_PET);
				if (leaves.length === 0 && this.instanceData.isViewOpen) {
					this.instanceData.isViewOpen = false;
					this.saveData(this.instanceData);
				}
			})
		);

		// Command to choose the background
		const BACKGROUNDS: SelectorOption[] = [
			{ value: "none", label: "None" },
			{ value: "backgrounds/snowbg-1.png", label: "Snow #1" },
			{ value: "backgrounds/snowbg-2.png", label: "Snow #2" },
			{ value: "backgrounds/summerbg-1.png", label: "Summer #1" },
			{ value: "backgrounds/summerbg-2.png", label: "Summer #2" },
			{ value: "backgrounds/summerbg-3.png", label: "Summer #3" },
			{ value: "backgrounds/templebg-1.png", label: "Temple #1" },
			{ value: "backgrounds/templebg-2.png", label: "Temple #2" },
			{ value: "backgrounds/castlebg-1.png", label: "Castle #1" },
			{ value: "backgrounds/castlebg-2.png", label: "Castle #2" },
		];
		this.addCommand({
			id: "choose-background-dropdown",
			name: "Choose Pet View Background",
			callback: () => {
				new SelectorModal(
					this.app,
					BACKGROUNDS,
					async (value: string) => {
						await this.chooseBackground(value); // Pass chooseBackground() function to modal
					}
				).open();
			},
		});

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

	public async chooseBackground(backgroundFile: string): Promise<void> {
		// Persist background data across sessions
		this.instanceData.selectedBackground = backgroundFile;
		await this.saveData(this.instanceData);

		// If the view is not open yet -> open it
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PET);
		if (leaves.length === 0) {
			await this.openView();
		}

		// Update all open PetViews
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

	// Open the leaf view
	async openView() {
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
