import { ItemView, WorkspaceLeaf } from "obsidian";
import PetPlugin from "main";
import { PetInstance } from "main";
import { Pet } from "pet-utils/pet";
import { Cat } from "pet-utils/cat";
import { Bunny } from "pet-utils/bunny";
import { normalizePath } from "obsidian";
import {
	getCatAnimations,
	getBunnyAnimations,
	PetAnimations,
} from "pet-utils/pet-animations";

// Unique ID for the view
export const VIEW_TYPE_PET = "pet-view";

export class PetView extends ItemView {
	plugin: PetPlugin;
	pets: { id: string; pet: Pet }[] = []; // Property for list of existing pets (their id and the instance of the class)

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
		this.updateView();
	}

	updateView() {
		// Get main container (DOM) of the view
		const container = this.containerEl.children[1];

		// Find/Create wrapper div for the view specifically
		let wrapper = container.querySelector(
			".pet-view-wrapper"
		) as HTMLDivElement;
		if (!wrapper) {
			wrapper = container.createDiv({ cls: "pet-view-wrapper" });
		}

		// Update the background
		this.updateBackground(wrapper);

		// Create a set of pet-ids in the view (unique ids, faster lookup)
		const currentPetList = this.plugin.getPetList();
		const existingPetIds = new Set(this.pets.map((c) => c.id));

		// Add all needed pets to the view
		for (const pet of currentPetList) {
			if (!existingPetIds.has(pet.id)) {
				this.addPetToView(wrapper, pet);
			}
		}
	}

	updateBackground(wrapper: HTMLElement) {
		// Get selected background
		const background = this.plugin.getSelectedBackground();
		const existingBg = wrapper.querySelector(".pet-view-background");

		// Remove existing background
		if (existingBg) {
			existingBg.remove();
		}

		// Remove existing snow gif
		const existingSnow = wrapper.querySelector(
			".pet-view-background-animation"
		);
		if (existingSnow) {
			existingSnow.remove();
		}

		// Add the new backgrounds
		if (background !== "none") {
			wrapper.createEl("img", {
				attr: {
					src: this.app.vault.adapter.getResourcePath(
						normalizePath(
							`${this.plugin.manifest.dir}/assets/${background}`
						)
					),
					alt: "Background",
				},
				cls: "pet-view-background",
			});
		}
		if (background.includes("snow")) {
			wrapper.createEl("img", {
				attr: {
					src: this.app.vault.adapter.getResourcePath(
						normalizePath(
							`${this.plugin.manifest.dir}/assets/backgrounds/snow.gif`
						)
					),
					alt: "Snow falling animation",
				},
				cls: "pet-view-background-animation",
			});
		}

		this.updateAllCatVerticalPositions(background);
	}

	addPetToView(wrapper: Element, singlePet: PetInstance) {
		// Get background for height adjustment of pet
		const background = this.plugin.getSelectedBackground();
		const cleanPetId = singlePet.id
			.replace(/^pets\//, "")
			.replace(/-\d+$/, "");

		let animations: PetAnimations;
		let moveDist: number;

		// Create cat instance and add it to the list of pets
		if (singlePet.type.includes("cat")) {
			animations = getCatAnimations(
				this.app,
				this.plugin,
				singlePet.type
			);
			moveDist = Math.floor(Math.random() * 20) + 25;

			const cat = new Cat(
				wrapper,
				animations,
				moveDist,
				background,
				cleanPetId
			);
			this.pets.push({ id: singlePet.id, pet: cat });
		} else if (singlePet.type.includes("bunny")) {
			animations = getBunnyAnimations(
				this.app,
				this.plugin,
				singlePet.type
			);
			moveDist = Math.floor(Math.random() * 25) + 35;

			const bunny = new Bunny(
				wrapper,
				animations,
				moveDist,
				background,
				cleanPetId
			);
			this.pets.push({ id: singlePet.id, pet: bunny });
		}
	}

	removePet(id: string) {
		// Find the index of the unique id
		const index = this.pets.findIndex((c) => c.id === id);
		// Clean up the instance's assets and remove it from the list
		if (index !== -1) {
			this.pets[index].pet.destroy();
			this.pets.splice(index, 1);
		}
	}

	removeAllPets() {
		// Clean up resources used by all instances
		for (const { pet } of this.pets) {
			pet.destroy();
		}
		// Empty list
		this.pets = [];
	}

	updateAllCatVerticalPositions(newBackground: string) {
		// Update the position for all of them
		for (const { pet } of this.pets) {
			pet.updateVerticalPosition(newBackground);
		}
	}

	// Getter function to get wrapper of entire pet view
	getWrapper() {
		let wrapper = this.containerEl.querySelector(".pet-view-wrapper");
		if (!wrapper) {
			wrapper = this.containerEl.createDiv({ cls: "pet-view-wrapper" });
		}
		return wrapper;
	}

	// Used to clean up content after view is closed
	async onClose() {
		for (const { pet } of this.pets) {
			pet.destroy();
		}
		// console.log("Pet view closed");
	}
}
