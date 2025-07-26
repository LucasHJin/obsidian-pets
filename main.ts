import { Plugin } from "obsidian";
import { PetView, VIEW_TYPE_PET } from "petview";
import { PetSettingTab } from "settings";
import { SelectorModal, SelectorOption } from "selectorModal";

export interface PetInstance {
	id: string; // Unique id
	type: string; // Directory to their type
	name: string;
}

// Define shape of saved plugin data
interface PetPluginData {
	selectedBackground: string;
	pets: PetInstance[]; // To keep track of all pet instances
	nextPetIdCounters: Record<string, number>; // Object to make sure no duplicate ids for pets of the same class
}

const DEFAULT_DATA: Partial<PetPluginData> = {
	selectedBackground: "none",
	pets: [],
	nextPetIdCounters: {},
};

// MAKE SPAWN AT DIFF HEIGHTS DEPENDING ON THE BACKGROUND

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
			const isOpen = this.app.workspace.getLeavesOfType(VIEW_TYPE_PET).length > 0;
			if (!isOpen) {
				await this.openView();
			}
		});

		// Adds icon on the ribbon (side panel) to open view
		this.addRibbonIcon("cat", "Toggle pet view", async () => {
			const isOpen = this.app.workspace.getLeavesOfType(VIEW_TYPE_PET).length > 0;
			if (isOpen) {
				await this.closeView();
			} else {
				await this.openView();
			}
		});

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
			name: "Choose pet view background",
			callback: () => {
				new SelectorModal(
					this.app,
					BACKGROUNDS,
					async (value: string, name: string) => {
						await this.chooseBackground(value); // Pass chooseBackground() function to modal
					}
				).open();
			},
		});

		// Command to add a pet
		// Batman has no idle 2
		const PETS: SelectorOption[] = [
			{
				value: "pets/batman-black-cat",
				label: "Black batman cat",
				requiresName: true,
			},
			{
				value: "pets/batman-blue-cat",
				label: "Blue batman cat",
				requiresName: true,
			},
			{ value: "pets/black-cat", label: "Black cat", requiresName: true },
			{ value: "pets/brown-cat", label: "Brown cat", requiresName: true },
			{
				value: "pets/xmas-cat",
				label: "Christmas cat",
				requiresName: true,
			},
			{
				value: "pets/classic-cat",
				label: "Classic cat",
				requiresName: true,
			},
			{
				value: "pets/demon-cat",
				label: "Demonic cat",
				requiresName: true,
			},
			{
				value: "pets/egypt-cat",
				label: "Egyptian cat",
				requiresName: true,
			},
			{
				value: "pets/siamese-cat",
				label: "Siamese cat",
				requiresName: true,
			},
			{
				value: "pets/three-cat",
				label: "Tri-colored cat",
				requiresName: true,
			},
			{ value: "pets/tiger-cat", label: "Tiger cat", requiresName: true },
			{ value: "pets/white-cat", label: "White cat", requiresName: true },
			// { value: "pets/grey-bunny", label: "Grey bunny", requiresName: true },
		];
		this.addCommand({
			id: "add-pet-dropdown",
			name: "Add a pet",
			callback: () => {
				new SelectorModal(
					this.app,
					PETS,
					async (value: string, name: string) => {
						await this.addPet(value, name);
					}
				).open();
			},
		});

		// Command to remove all pets
		this.addCommand({
			id: "clear-all-pets",
			name: "Remove all pets",
			callback: async () => {
				await this.clearAllPets();
			},
		});

		// Command to remove a specific pet
		this.addCommand({
			id: "remove-pet-by-id",
			name: "Remove a specific pet",
			callback: () => {
				//this.instanceData.pets.map((pet) => console.log(pet.id, pet.name));

				const options = this.instanceData.pets.map((pet) => ({
					value: pet.id,
					// Label of name and type
					label: `${pet.name} (${this.getCleanLabel(pet.id)})`,
				}));
				new SelectorModal(
					this.app,
					options,
					async (value: string, name: string) => {
						await this.removePetById(value);
					}
				).open();
			},
		});

		// Add settings for changing background
		this.addSettingTab(new PetSettingTab(this.app, this));
	}

	// Function to get a clean id label
	getCleanLabel(id: string): string {
		// Don't want the general /pets
		const desired = id.split("/").pop() ?? "";

		// Match everything before last dash before digit (ind 1), match a dash followed by 1+ digits (ind 2)
		// Parentheses captures groups
		const match = desired.match(/^(.*)-(\d+)$/);
		if (!match) {
			return desired;
		}
		// Don't need the full match
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const [_, base, num] = match;
		// Capitalize each word
		const name = base
			.split("-")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");

		return name;
	}

	async onunload(): Promise<void> {
		// Close the view when unloading
		// await this.closeView(); -> don't detach leafs (https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines#Don't+detach+leaves+in+%60onunload%60)
	}

	// Merges current data with default data
	async loadSettings() {
		this.instanceData = Object.assign(
			{},
			DEFAULT_DATA,
			await this.loadData()
		);

		// Make sure id counter exists
		if (!this.instanceData.nextPetIdCounters) {
			this.instanceData.nextPetIdCounters = {};
		}
	}

	public async chooseBackground(backgroundFile: string): Promise<void> {
		// Make sure not already selected background
		if (this.instanceData.selectedBackground === backgroundFile) {
			// console.log("Same picked");
			return;
		}

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
				view.updateView();
			}
		}
	}

	// Getter function to get background in petview.ts
	public getSelectedBackground(): string {
		return this.instanceData.selectedBackground;
	}

	public async addPet(type: string, name: string): Promise<void> {
		if (!(type in this.instanceData.nextPetIdCounters)) {
			this.instanceData.nextPetIdCounters[type] = 1;
		}

		// Create id (type format -> pets/petType)
		const id = `${type}-${this.instanceData.nextPetIdCounters[type]}`;
		this.instanceData.nextPetIdCounters[type]++;

		// Add to list of pets
		this.instanceData.pets.push({ id, type, name });
		await this.saveData(this.instanceData);

		// Open view on adding pets
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PET);
		if (leaves.length === 0) {
			await this.openView();
		}

		// Update view
		for (const leaf of leaves) {
			const view = leaf.view;
			if (view instanceof PetView) {
				view.addPetToView(view.getWrapper(), { id, type, name });
			}
		}
	}

	// Getter function to get pet list in petview.ts
	public getPetList(): PetInstance[] {
		return this.instanceData.pets || [];
	}

	public async removePetById(id: string): Promise<void> {
		// Filters out the one with the same id
		this.instanceData.pets = this.instanceData.pets.filter(
			(p) => p.id !== id
		);
		await this.saveData(this.instanceData);

		// Update view
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PET);
		for (const leaf of leaves) {
			const view = leaf.view;
			if (view instanceof PetView) {
				view.removePet(id);
			}
		}
	}

	public async clearAllPets(): Promise<void> {
		// Empties out the entire pet list
		this.instanceData.pets = [];
		// Reset all counters back to 1
		for (const type in this.instanceData.nextPetIdCounters) {
			this.instanceData.nextPetIdCounters[type] = 1;
		}
		await this.saveData(this.instanceData);

		// Update view
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PET);
		for (const leaf of leaves) {
			const view = leaf.view;
			if (view instanceof PetView) {
				view.removeAllPets();
			}
		}
	}

	// Open the leaf view
	async openView() {
		const { workspace } = this.app;

		const leaves = workspace.getLeavesOfType(VIEW_TYPE_PET);
		if (leaves.length > 0) {
			workspace.revealLeaf(leaves[0]);
			return;
		}

		const leaf = workspace.getLeftLeaf(true);
		if (leaf) {
			await leaf.setViewState({ type: VIEW_TYPE_PET, active: true });
			workspace.revealLeaf(leaf);
		}
	}

	// Remove the leaf (view) based on its ID
	async closeView() {
		const { workspace } = this.app;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_PET);
		for (const leaf of leaves) {
			await leaf.detach();
		}
	}
}
