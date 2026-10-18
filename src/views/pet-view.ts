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
	private backgroundEl: HTMLImageElement | null = null;
	private snowEl: HTMLImageElement | null = null;
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

		const wrapper = this.contentEl.createDiv({ cls: "pixel-pets-view" });
		this.stage = new Stage(wrapper, this.plugin, {
			getFloor: () => this.getFloor(),
			ballLifetime: 5000,
		});
		this.updateView();
		this.setupResizeObserver();
	}

	updateView() {
		if (!this.stage) return;

		// Update the background
		this.updateBackground(this.stage.container);
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

		this.backgroundEl?.remove();
		this.backgroundEl = null;
		this.snowEl?.remove();
		this.snowEl = null;

		// Add the new backgrounds
		if (image) {
			try {
				this.backgroundEl = wrapper.createEl("img", {
					attr: {
						src: image,
						alt: "Background",
					},
					cls: "pixel-pets-view__background",
				});
			} catch (error) {
				console.error(`Failed to load background: ${background}`, error);
			}
		}

		if (snow && this.plugin.data.animatedBackground) {
			try {
				this.snowEl = wrapper.createEl("img", {
					attr: {
						src: SNOW_ANIMATION,
						alt: "Snow falling animation",
					},
					cls: "pixel-pets-view__background-animation",
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

	private setupResizeObserver() {
		if (typeof ResizeObserver === "undefined") return;

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

			if (this.resizeTimeout !== undefined) {
				window.clearTimeout(this.resizeTimeout);
			}
			this.resizeTimeout = window.setTimeout(() => {
				this.resizeTimeout = undefined;
				void this.stage?.clampPets();
			}, 250);
		});
		this.resizeObserver.observe(this.contentEl);
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
		this.stage?.clearImmediately();
	}
}
