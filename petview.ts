import { ItemView, WorkspaceLeaf } from "obsidian";
import PetPlugin from "main";
import { PetInstance } from "main";
import { Pet } from "pet-classes/pet";
import { AnimationConfig } from "pet-classes/pet";
import { normalizePath } from "obsidian";

// Allow for optional pet animations
type PetAnimations = {
	idle: AnimationConfig;
	idle2?: AnimationConfig;
	jump: AnimationConfig;
	run: AnimationConfig;
	sit: AnimationConfig;
	sleep: AnimationConfig;
	die: AnimationConfig;
};

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
		const CAT_ANIMATIONS: PetAnimations = {
			idle: {
				name: "idle",
				spriteUrl: this.app.vault.adapter.getResourcePath(
					normalizePath(
						`${this.plugin.manifest.dir}/assets/${singlePet.type}/idle-cat.png`
					)
				),
				frameCount: 7,
				frameWidth: 32,
				frameHeight: 32,
				duration: 700,
			},
			idle2: {
				name: "idle2",
				spriteUrl: this.app.vault.adapter.getResourcePath(
					normalizePath(
						`${this.plugin.manifest.dir}/assets/${singlePet.type}/idle2-cat.png`
					)
				),
				frameCount: 14,
				frameWidth: 32,
				frameHeight: 32,
				duration: 1400,
			},
			jump: {
				name: "jump",
				spriteUrl: this.app.vault.adapter.getResourcePath(
					normalizePath(
						`${this.plugin.manifest.dir}/assets/${singlePet.type}/jump-cat.png`
					)
				),
				frameCount: 13,
				frameWidth: 32,
				frameHeight: 32,
				duration: 1300,
			},
			run: {
				name: "run",
				spriteUrl: this.app.vault.adapter.getResourcePath(
					normalizePath(
						`${this.plugin.manifest.dir}/assets/${singlePet.type}/run-cat.png`
					)
				),
				frameCount: 7,
				frameWidth: 32,
				frameHeight: 32,
				duration: 700,
			},
			sit: {
				name: "sit",
				spriteUrl: this.app.vault.adapter.getResourcePath(
					normalizePath(
						`${this.plugin.manifest.dir}/assets/${singlePet.type}/sitting-cat.png`
					)
				),
				frameCount: 3,
				frameWidth: 32,
				frameHeight: 32,
				duration: 750,
			},
			sleep: {
				name: "sleep",
				spriteUrl: this.app.vault.adapter.getResourcePath(
					normalizePath(
						`${this.plugin.manifest.dir}/assets/${singlePet.type}/sleep-cat.png`
					)
				),
				frameCount: 3,
				frameWidth: 32,
				frameHeight: 32,
				duration: 750,
			},
			die: {
				name: "die",
				spriteUrl: this.app.vault.adapter.getResourcePath(
					normalizePath(
						`${this.plugin.manifest.dir}/assets/${singlePet.type}/die-cat.png`
					)
				),
				frameCount: 15,
				frameWidth: 32,
				frameHeight: 32,
				duration: 1500,
			},
		};

		const BUNNY_ANIMATIONS: PetAnimations = {
            idle: {
                name: "idle",
                spriteUrl: this.app.vault.adapter.getResourcePath(
                    normalizePath(
                        `${this.plugin.manifest.dir}/assets/${singlePet.type}/idle-bunny.png`
                    )
                ),
                frameCount: 12,
                frameWidth: 32,
                frameHeight: 32,
                duration: 1200,
            },
            idle2: {
                name: "idle2",
                spriteUrl: this.app.vault.adapter.getResourcePath(
                    normalizePath(
                        `${this.plugin.manifest.dir}/assets/${singlePet.type}/liedown-bunny.png`
                    )
                ),
                frameCount: 6,
                frameWidth: 32,
                frameHeight: 32,
                duration: 600,
            },
            jump: {
                name: "jump",
                spriteUrl: this.app.vault.adapter.getResourcePath(
                    normalizePath(
                        `${this.plugin.manifest.dir}/assets/${singlePet.type}/jump-bunny.png`
                    )
                ),
                frameCount: 11,
                frameWidth: 32,
                frameHeight: 32,
                duration: 1100,
            },
            run: {
                name: "run",
                spriteUrl: this.app.vault.adapter.getResourcePath(
                    normalizePath(
                        `${this.plugin.manifest.dir}/assets/${singlePet.type}/run-bunny.png`
                    )
                ),
                frameCount: 8,
                frameWidth: 32,
                frameHeight: 32,
                duration: 800,
            },
            sit: {
                name: "sit",
                spriteUrl: this.app.vault.adapter.getResourcePath(
                    normalizePath(
                        `${this.plugin.manifest.dir}/assets/${singlePet.type}/liking-bunny.png`
                    )
                ),
                frameCount: 5,
                frameWidth: 32,
                frameHeight: 32,
                duration: 500,
            },
            sleep: {
                name: "sleep",
                spriteUrl: this.app.vault.adapter.getResourcePath(
                    normalizePath(
                        `${this.plugin.manifest.dir}/assets/${singlePet.type}/sleep-bunny.png`
                    )
                ),
                frameCount: 6,
                frameWidth: 32,
                frameHeight: 32,
                duration: 600,
            },
            die: {
                name: "die",
                spriteUrl: this.app.vault.adapter.getResourcePath(
                    normalizePath(
                        `${this.plugin.manifest.dir}/assets/${singlePet.type}/die-bunny.png`
                    )
                ),
                frameCount: 12,
                frameWidth: 32,
                frameHeight: 32,
                duration: 1200,
            },
        };

		if (
			singlePet.type === "pets/batman-black-cat" ||
			singlePet.type === "pets/batman-blue-cat"
		) {
			delete CAT_ANIMATIONS["idle2"];
		}

		const moveDist = Math.floor(Math.random() * 20) + 25;
		const background = this.plugin.getSelectedBackground();

		const cleanPetId = singlePet.id
			.replace(/^pets\//, "")
			.replace(/-\d+$/, "");

		// Create cat instance and add it to the list of pets
		if (singlePet.type.includes("cat")) {
			const cat = new Pet(wrapper, CAT_ANIMATIONS, moveDist, background, cleanPetId);
			this.pets.push({ id: singlePet.id, pet: cat });
		} else if (singlePet.type.includes("bunny")) {
			const bunny = new Pet(wrapper, BUNNY_ANIMATIONS, moveDist, background, cleanPetId);
			this.pets.push({ id: singlePet.id, pet: bunny });
		}

		console.log(this.pets);
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
