import { ItemView, WorkspaceLeaf } from "obsidian";
import PetPlugin, { PetInstance } from "./main";
import { getBackgroundAsset } from "./pet-utils/pet-assets";
import { RenderablePet, createRenderablePet } from "./pet-utils/pet-factory";
import { SelectorModal } from "./modals";

// Unique ID for the view
export const VIEW_TYPE_PET = "pet-view";

export class PetView extends ItemView {
	plugin: PetPlugin;
	pets: { id: string; type: string; pet: RenderablePet }[] = []; // Property for list of existing pets (their id and the instance of the class)
	private resizeObserver?: ResizeObserver;
	private resizeTimeout?: number;
	private rantLoopTimeout: ReturnType<typeof activeWindow.setTimeout> | null = null;

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
	getIcon() {
		return "leaf";
	}

	// Builds content of view when it is opened
	async onOpen() {
		// Detach if leaf was rendered while overlay is on
		if (this.plugin.instanceData.overlayMode) {
			activeWindow.setTimeout(() => this.leaf.detach(), 0);
			return;
		}

		this.addAction("image", "Choose a background", () => {
			this.plugin.showChooseBackgroundCommand();
		})

		this.addAction("minus", "Remove all pets", async () => {
			await this.plugin.clearAllPets();
		});

		this.addAction("x", "Remove a specific pet", () => {
			if (this.plugin.instanceData.pets.length === 0) {
				return;
			}
			const options = this.plugin.instanceData.pets.map((pet) => ({
				value: pet.id,
				label: `${pet.name} (${this.plugin.getCleanLabel(pet.id)})`,
			}));
			new SelectorModal(
				this.app,
				options,
				async (value: string, _name: string) => {
					await this.plugin.removePetById(value);
				}
			).open();
		});

		this.addAction("plus", "Add a pet", () => {
			this.plugin.showAddPetCommand();
		});
		this.updateView();
		this.setupResizeObserver();
		this.startRantLoop();
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
				const isWoodTile = ["wood_dark", "wood_light", "wood_orange"].includes(background);

				if (isWoodTile) {
					wrapper.createEl("div", {
						cls: "pet-view-background pet-view-background-tiled",
					}).style.backgroundImage = `url('${backgroundUrl}')`;
				} else {
					wrapper.createEl("img", {
						attr: {
							src: backgroundUrl,
							alt: "Background",
						},
						cls: "pet-view-background",
					});
				}
			} catch (error) {
				console.error(`Failed to load background: ${background}`, error);
			}
		}

		this.updateAllPetVerticalPositions(background);
	}

	updatePetSize() {
		for (const { pet } of this.pets) {
			pet.scale = this.plugin.instanceData.petSize;
			pet.petEl?.setCssProps({
				"--scale": `${this.plugin.instanceData.petSize}`,
			});
		}
	}

	updatePetSpeed() {
		for (const { pet } of this.pets) {
			pet.speedMultiplier = this.plugin.instanceData.petSpeed;
		}
	}

	addPetToView(wrapper: Element, singlePet: PetInstance) {
		try {	
			const background = this.plugin.getSelectedBackground();
			const cleanPetId = singlePet.id.replace(/^pets\//, "");
			const pet = createRenderablePet(
				wrapper,
				singlePet.type,
				background,
				cleanPetId,
				this.plugin.instanceData.petSize,
				singlePet.name,
				() => this.plugin.getPageRantText("rightclick", singlePet.type),
				this.plugin.instanceData.petSpeed,
			);
			if (pet) {
				this.pets.push({ id: singlePet.id, type: singlePet.type, pet });
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

	updateAllPetVerticalPositions(newBackground: string) {
		// Update the position for all of them
		for (const { pet } of this.pets) {
			pet.updateVerticalPosition(newBackground);
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

	// Recreates pets from scratch (avoids pet animations getting stuck)
	resetPets() {
		for (const { pet } of this.pets) {
			pet.destroyImmediate(); // Destroy immediately to avoid death animation + id overlaps
		}
		this.pets = [];
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
				activeWindow.clearTimeout(this.resizeTimeout);
			}
			this.resizeTimeout = activeWindow.setTimeout(() => {
				this.resizeTimeout = undefined;
				this.resetPets();
			}, 250);
		});
		this.resizeObserver.observe(container);
	}

	// Used to clean up content after view is closed
	async onClose() {
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
			this.resizeObserver = undefined;
		}
		if (this.resizeTimeout !== undefined) {
			activeWindow.clearTimeout(this.resizeTimeout);
			this.resizeTimeout = undefined;
		}
		if (this.rantLoopTimeout !== null) {
			activeWindow.clearTimeout(this.rantLoopTimeout);
			this.rantLoopTimeout = null;
		}
		await Promise.all(this.pets.map(({ pet }) => pet.destroy()));
	}

	private startRantLoop() {
		const scheduleNext = () => {
			const minMinutes = Math.min(
				this.plugin.instanceData.pageRantMinMinutes || 5,
				this.plugin.instanceData.pageRantMaxMinutes || 20
			);
			const maxMinutes = Math.max(
				this.plugin.instanceData.pageRantMinMinutes || 5,
				this.plugin.instanceData.pageRantMaxMinutes || 20
			);
			const minMs = minMinutes * 60 * 1000;
			const maxMs = maxMinutes * 60 * 1000;
			const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;

			this.rantLoopTimeout = activeWindow.setTimeout(() => {
				if (this.plugin.instanceData.pageRantEnabled) {
					// If configured, suppress rants when Obsidian window is not focused/backgrounded
					if (this.plugin.instanceData.pageRantOnlyWhenFocused && !activeDocument.hasFocus()) {
						scheduleNext();
						return;
					}
					const target = this.pets[Math.floor(Math.random() * this.pets.length)];
					if (target) {
						void this.plugin.getPageRantText("timer", target.type).then((text) => {
							if (text) {
								target.pet.showSpeechBubble(text);
							}
						});
					}
				}
				scheduleNext();
			}, delay);
		};

		scheduleNext();
	}
}
