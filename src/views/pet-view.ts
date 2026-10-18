import { ItemView, WorkspaceLeaf } from "obsidian";
import PetPlugin from "../main";
import { Stage } from "../stage";
import { Floor } from "../floor";
import { SNOW_ANIMATION, getBackground } from "../catalog/backgrounds";

// Unique ID for the view
export const VIEW_TYPE_PET = "pet-view";

export class PetView extends ItemView {
	plugin: PetPlugin;
	stage: Stage | null = null;
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
		if (!this.stage) {
			this.stage = new Stage(wrapper, this.plugin, {
				getFloor: () => this.getFloor(),
				ballLifetime: 5000,
			});
		}

		// Update the background
		this.updateBackground(wrapper);
		this.stage.updateFloor();

		// Create a set of pet-ids in the view (unique ids, faster lookup)
		const currentPetList = this.plugin.getPetList();
		const existingPetIds = new Set(this.stage.pets.map((p) => p.id));

		// Add all needed pets to the view
		for (const pet of currentPetList) {
			if (!existingPetIds.has(pet.id)) {
				this.stage.addPet(pet);
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
	}

	private getFloor(): Floor {
		return {
			kind: "percent",
			value: getBackground(this.plugin.getSelectedBackground()).floor,
		};
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
		this.stage?.clearImmediately();
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
		await this.stage?.destroyPets();
		this.stage?.destroyBalls();
	}
}
