import { ItemView, WorkspaceLeaf } from "obsidian";
import PetPlugin from "../main";
import { PetInstance } from "../data";
import { Pet } from "../pets/pet";
import { Cat } from "../pets/cat";
import { Bunny } from "../pets/bunny";
import { Ghost } from "../pets/ghost";
import { Ball } from "../toys/ball";
import { SNOW_ANIMATION, getBackground } from "../catalog/backgrounds";
import { getPetType } from "../catalog/pets";
import { getBallImage } from "../catalog/balls";
import { getCatAnimations, getBunnyAnimations, getGhostAnimations } from "../pets/pet-animations";

// Unique ID for the view
export const VIEW_TYPE_PET = "pet-view";

export class PetView extends ItemView {
	plugin: PetPlugin;
	pets: { id: string; pet: Pet }[] = []; // Property for list of existing pets (their id and the instance of the class)
	balls: { id: string; ball: Ball }[] = []; // Property for list of existing balls (their id and the instance of the class)
	private resizeObserver?: ResizeObserver;
	private resizeTimeout?: number;

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
		const displayName = this.app.vault.getName();
		return `${displayName} Pets`;
	}

	// Decides icon for view
	override getIcon() {
		return "cat";
	}

	// Builds content of view when it is opened
	override async onOpen() {
		// Detach if leaf was rendered while overlay is on
		if (this.plugin.data.overlayMode) {
			window.setTimeout(() => this.leaf.detach(), 0);
			return;
		}

		this.addAction("paw-print", "Cat toy toggle", () => {
			this.plugin.toggleCatToy();
		});

		this.addAction("image", "Choose a background", () => {
			this.plugin.openBackgroundPicker();
		});

		this.addAction("minus", "Remove all pets", async () => {
			await this.plugin.clearAllPets();
		});

		this.addAction("circle-dashed", "Throw a ball", () => {
			this.plugin.throwRandomBall();
		});

		this.addAction("plus", "Add a pet", () => {
			this.plugin.openAddPetPicker();
		});
		this.updateView();
		this.setupResizeObserver();
	}

	updateView() {
		// Get main container (DOM) of the view
		const container = this.containerEl.children[1];

		// Find/Create wrapper div for the view specifically
		let wrapper = container.querySelector(".pet-view-wrapper") as HTMLDivElement;
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
		const { image, snow } = getBackground(background);
		const existingBg = wrapper.querySelector(".pet-view-background");

		// Remove existing background
		if (existingBg) {
			existingBg.remove();
		}

		// Remove existing snow gif
		const existingSnow = wrapper.querySelector(".pet-view-background-animation");
		if (existingSnow) {
			existingSnow.remove();
		}

		// Add the new backgrounds
		if (image) {
			try {
				wrapper.createEl("img", {
					attr: {
						src: image,
						alt: "Background",
					},
					cls: "pet-view-background",
				});
			} catch (error) {
				console.error(`Failed to load background: ${background}`, error);
			}
		}

		if (snow && this.plugin.data.animatedBackground) {
			try {
				wrapper.createEl("img", {
					attr: {
						src: SNOW_ANIMATION,
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

	updatePetSize() {
		for (const { pet } of this.pets) {
			// Update the internal scale property
			pet.scale = this.plugin.data.petSize;

			// Immediately reflect change in CSS
			pet.petEl?.setCssProps({
				"--scale": `${this.plugin.data.petSize}`,
			});
		}

		// Also update balls if you want them scaled too (optional)
		for (const { ball } of this.balls) {
			if (ball.ballEl) {
				ball.scale = this.plugin.data.petSize;
				ball.ballEl.setCssProps({
					"--scale": `${this.plugin.data.petSize}`,
				});
			}
		}
	}

	addPetToView(wrapper: HTMLElement, singlePet: PetInstance) {
		try {
			const background = this.plugin.getSelectedBackground();
			const petType = getPetType(singlePet.type);

			if (petType?.species === "cat") {
				const catAnimations = getCatAnimations(singlePet.type);
				const moveDist = Math.floor(Math.random() * 20) + 25;
				const cat = new Cat(
					wrapper,
					catAnimations,
					moveDist,
					background,
					this.plugin.data.petSize,
					singlePet.name,
					petType.flying,
				);
				this.pets.push({ id: singlePet.id, pet: cat });
			} else if (petType?.species === "bunny") {
				const bunnyAnimations = getBunnyAnimations(singlePet.type);
				const moveDist = Math.floor(Math.random() * 30) + 45;
				const bunny = new Bunny(
					wrapper,
					bunnyAnimations,
					moveDist,
					background,
					this.plugin.data.petSize,
					singlePet.name,
				);
				this.pets.push({ id: singlePet.id, pet: bunny });
			} else if (petType?.species === "ghost") {
				const ghostAnimations = getGhostAnimations(singlePet.type);
				const moveDist = Math.floor(Math.random() * 20) + 20;
				const ghost = new Ghost(
					wrapper,
					ghostAnimations,
					moveDist,
					background,
					this.plugin.data.petSize,
					singlePet.name,
				);
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
			void this.pets[index].pet.destroy();
			this.pets.splice(index, 1);
		}
	}

	removeAllPets() {
		// Clean up resources used by all instances
		for (const { pet } of this.pets) {
			void pet.destroy();
		}
		// Empty list
		this.pets = [];
	}

	startCursorFollow(getCursorX: () => number) {
		for (const { pet } of this.pets) {
			if (pet instanceof Cat) {
				pet.startFollowingCursor(getCursorX);
			}
		}
	}

	stopCursorFollow() {
		for (const { pet } of this.pets) {
			if (pet instanceof Cat) {
				pet.stopFollowingCursor();
			}
		}
	}

	updateAllCatVerticalPositions(newBackground: string) {
		// Update the position for all of them
		for (const { pet } of this.pets) {
			pet.updateVerticalPosition(newBackground);
		}
	}

	addBallToView(wrapper: HTMLElement, id: string) {
		try {
			const background = this.plugin.getSelectedBackground();
			const ball = new Ball(wrapper, getBallImage(id), background, this.plugin.data.petSize);
			this.balls.push({ id, ball });

			// Choose a random cat to chase after the ball
			const cats = this.pets.filter((p) => p.pet instanceof Cat);
			if (cats.length > 0) {
				const randomCat = cats[Math.floor(Math.random() * cats.length)].pet as Cat;
				randomCat.startChasingBall(ball);
				// Sets the callback function for on destroy (DOES NOT RUN IT YET)
				ball.onDestroy = () => {
					// Stop chasing + remove ball from array
					randomCat.stopChasingBall();
					const index = this.balls.findIndex((b) => b.id === id);
					if (index !== -1) {
						this.balls.splice(index, 1);
					}
				};
			}
		} catch (error) {
			console.error("Failed to add ball to view:", error);
		}
	}

	// Getter function to get wrapper of entire pet view
	getWrapper(): HTMLElement {
		const wrapper = this.containerEl.querySelector<HTMLElement>(".pet-view-wrapper");
		if (!wrapper) {
			throw new Error("pet-view-wrapper not found");
		}
		return wrapper;
	}

	// Recreates pets from scratch (avoids pet animations getting stuck)
	resetPets() {
		for (const { pet } of this.pets) {
			pet.destroyImmediate(); // Destroy immediately to avoid death animation + id overlaps
		}
		this.pets = [];
		for (const { ball } of this.balls) {
			ball.destroy();
		}
		this.balls = [];
		this.updateView();
	}

	private setupResizeObserver() {
		const container = this.containerEl.children[1] as HTMLElement | undefined;
		if (!container || typeof ResizeObserver === "undefined") return;

		let initialized = false;
		let lastWidth = 0;
		let lastHeight = 0;

		this.resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) return;
			const { width, height } = entry.contentRect;

			// Skip the initial fire that reports the starting size
			if (!initialized) {
				initialized = true;
				lastWidth = width;
				lastHeight = height;
				return;
			}

			if (width === lastWidth && height === lastHeight) return;
			lastWidth = width;
			lastHeight = height;

			// Debounce -> only reset when user stops dragging
			if (this.resizeTimeout !== undefined) {
				window.clearTimeout(this.resizeTimeout);
			}
			this.resizeTimeout = window.setTimeout(() => {
				this.resizeTimeout = undefined;
				this.resetPets();
			}, 250);
		});
		this.resizeObserver.observe(container);
	}

	// Used to clean up content after view is closed
	override async onClose() {
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
			this.resizeObserver = undefined;
		}
		if (this.resizeTimeout !== undefined) {
			window.clearTimeout(this.resizeTimeout);
			this.resizeTimeout = undefined;
		}
		await Promise.all(this.pets.map(({ pet }) => pet.destroy()));
		for (const { ball } of this.balls) {
			ball.destroy();
		}
	}
}
