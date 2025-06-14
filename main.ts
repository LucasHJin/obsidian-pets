import { Plugin, WorkspaceLeaf } from "obsidian";
import { PetView, VIEW_TYPE_PET } from "petView";
import { PetSettingTab } from "settings";
import { SelectorModal, SelectorOption } from "selectorModal";

export interface PetInstance {
	id: string; // Unique id
	type: string; // Directory to their type
}

// Define shape of saved plugin data
interface PetPluginData {
	isViewOpen: boolean; // Boolean for toggling the view open/close
	selectedBackground: string;
	pets: PetInstance[]; // To keep track of all pet instances
	nextPetIdCounters: Record<string, number>; // Object to make sure no duplicate ids for pets of the same class
}

const DEFAULT_DATA: Partial<PetPluginData> = {
	isViewOpen: false,
	selectedBackground: "none",
	pets: [],
	nextPetIdCounters: {},
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

		// Command to add a pet
			// Batman has no idle 2
		const PETS: SelectorOption[] = [
			{ value: "pets/batman-black-cat", label: "Black Batman Cat" },
			{ value: "pets/batman-blue-cat", label: "Blue Batman Cat" },
			{ value: "pets/black-cat", label: "Black Cat" },
			{ value: "pets/brown-cat", label: "Brown Cat" },
			{ value: "pets/xmas-cat", label: "Christmas Cat" },
			{ value: "pets/classic-cat", label: "Classic Cat" },
			{ value: "pets/demon-cat", label: "Demonic Cat" },
			{ value: "pets/egypt-cat", label: "Egyptian Cat" },
			{ value: "pets/siamese-cat", label: "Siamese Cat" },
			{ value: "pets/three-cat", label: "Tri-colored Cat" },
			{ value: "pets/tiger-cat", label: "Tiger Cat" },
			{ value: "pets/white-cat", label: "White Cat" },
			{ value: "pets/grey-bunny", label: "Grey Bunny" },
		];
		this.addCommand({
			id: "add-pet-dropdown",
			name: "Add a Pet",
			callback: () => {
				new SelectorModal(this.app, PETS, async (value: string) => {
					await this.addPet(value);
				}).open();
			},
		});

		// Command to remove all pets
		this.addCommand({
			id: "clear-all-pets",
			name: "Remove All Pets",
			callback: () => {
				this.clearAllPets();
			},
		});

		// Command to remove a specific pet
		this.addCommand({
			id: "remove-pet-by-id",
			name: "Remove a Specific Pet",
			callback: () => {
				this.instanceData.pets.map((pet) => console.log(pet.id));

				const options = this.instanceData.pets.map((pet) => ({
					value: pet.id,
					// Make the lable more legible
					label: (() => {
						// Don't want the general /pets
						const desired = pet.id.split("/").pop() ?? "";

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
							.map(
								(word) =>
									word.charAt(0).toUpperCase() + word.slice(1)
							)
							.join(" ");

						return `${name} #${num}`;
					})(),
				}));

				new SelectorModal(this.app, options, async (value: string) => {
					await this.removePetById(value);
				}).open();
			},
		});

		// Add settings for changing background
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

		// Make sure id counter exists
		if (!this.instanceData.nextPetIdCounters) {
			this.instanceData.nextPetIdCounters = {};
		}
	}

	public async chooseBackground(backgroundFile: string): Promise<void> {
		// Make sure not already selected background
		if (this.instanceData.selectedBackground === backgroundFile) {
			console.log("Same picked");
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

	public async addPet(petFolder: string): Promise<void> {
		if (!(petFolder in this.instanceData.nextPetIdCounters)) {
			this.instanceData.nextPetIdCounters[petFolder] = 1;
		}

		// Create id (petFolder -> pets/petType)
		const id = `${petFolder}-${this.instanceData.nextPetIdCounters[petFolder]}`;
		this.instanceData.nextPetIdCounters[petFolder]++;

		// Add to list of pets
		this.instanceData.pets.push({ id, type: petFolder });
		await this.saveData(this.instanceData);

		// Update view
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PET);
		for (const leaf of leaves) {
			const view = leaf.view;
			if (view instanceof PetView) {
				view.addPetToView(view.getWrapper(), { id, type: petFolder });
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
