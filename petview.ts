import { ItemView, WorkspaceLeaf } from "obsidian";
import PetPlugin from "main";
import { PetInstance } from "main";
import { Pet } from "pet-utils/pet";
import { Cat } from "pet-utils/cat";
import { Bunny } from "pet-utils/bunny";
import { Ghost } from "pet-utils/ghost";
import { Ball } from "pet-utils/ball";
import { getBackgroundAsset } from "./pet-utils/pet-assets";
import { getCatAnimations, getBunnyAnimations, getGhostAnimations, getBallAnimations } from "pet-utils/pet-animations";

// NOTE -> GHOST REMOVAL DOESN'T WORK RIGHT NOW -> FIX

// Unique ID for the view
export const VIEW_TYPE_PET = "pet-view";

export class PetView extends ItemView {
	plugin: PetPlugin;
	pets: { id: string; pet: Pet }[] = []; // Property for list of existing pets (their id and the instance of the class)
	balls: { id: string; ball: Ball }[] = []; // Property for list of existing balls (their id and the instance of the class)

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
		return "Pet view";
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
		const existingPetIds = new Set(this.pets.map((p) => p.id));

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
			try {
				const backgroundUrl = getBackgroundAsset(background);
				wrapper.createEl("img", {
					attr: {
						src: backgroundUrl,
						alt: "Background",
					},
					cls: "pet-view-background",
				});
			} catch (error) {
				console.error(`Failed to load background: ${background}`, error);
			}
		}
		if (background.includes("snow")) {
			try {
				const snowUrl = getBackgroundAsset("snow.gif");
				wrapper.createEl("img", {
					attr: {
						src: snowUrl,
						alt: "Snow falling animation",
					},
					cls: "pet-view-background-animation",
				});
			} catch (error) {
				console.error("Failed to load snow animation", error);
			}
		}

		this.updateAllCatVerticalPositions(background);
	}

	addPetToView(wrapper: Element, singlePet: PetInstance) {
		try {	
			const background = this.plugin.getSelectedBackground();
			const cleanPetId = singlePet.id.replace(/^pets\//, "");

			if (singlePet.type.includes("cat")) {
				const catAnimations = getCatAnimations(singlePet.type);
				const moveDist = Math.floor(Math.random() * 20) + 25;
				const cat = new Cat(wrapper, catAnimations, moveDist, background, cleanPetId, singlePet.type.includes("witch"), () => this.balls.map(b => b.ball));
				this.pets.push({ id: singlePet.id, pet: cat });
			} else if (singlePet.type.includes("bunny")) {
				const bunnyAnimations = getBunnyAnimations(singlePet.type);
				const moveDist = Math.floor(Math.random() * 30) + 45;
				const bunny = new Bunny(wrapper, bunnyAnimations, moveDist, background, cleanPetId);
				this.pets.push({ id: singlePet.id, pet: bunny });
			} else if (singlePet.type.includes("ghost")) {
				const ghostAnimations = getGhostAnimations(singlePet.type);
				const moveDist = Math.floor(Math.random() * 20) + 20;
				const ghost = new Ghost(wrapper, ghostAnimations, moveDist, background, cleanPetId);
				this.pets.push({ id: singlePet.id, pet: ghost });
			}
		} catch (error) {
			console.error(`Failed to create pet ${singlePet.id}:`, error);
		}
	}

	removePet(id: string) {
		// Find the index of the unique id
		const index = this.pets.findIndex((p) => p.id === id);
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

	addBallToView(wrapper: HTMLElement, type: string) {
		try {
			const background = this.plugin.getSelectedBackground();
			const cleanBallId = type.replace(/^toys\//, "");

			// Add the ball to the view
			const ballAnimation = getBallAnimations(cleanBallId);
			const ball = new Ball(wrapper, ballAnimation, cleanBallId, background);
			this.balls.push({ id: cleanBallId, ball });
		} catch (error) {
			console.error("Failed to add ball to view:", error);
		}
	}

	// Getter function to get wrapper of entire pet view
	getWrapper() {
		const wrapper = this.containerEl.querySelector(".pet-view-wrapper");
		if (!wrapper) {
			throw new Error("pet-view-wrapper not found");
		}
		return wrapper;
	}

	// Used to clean up content after view is closed
	async onClose() {
		for (const { pet } of this.pets) {
			pet.destroy();
		}
		for (const { ball } of this.balls) {
			ball.destroy();
		}
	}
}
