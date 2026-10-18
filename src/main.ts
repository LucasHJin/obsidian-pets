import { Plugin, Notice, TFile, WorkspaceLeaf } from "obsidian";
import { PetView, VIEW_TYPE_PET } from "./views/pet-view";
import { OverlayPetView } from "./views/overlay-view";
import { Stage } from "./stage";
import { CatToyOverlay } from "./toys/cat-toy";
import { setSoundEnabled, playPetSound, startToySound } from "./audio/sounds";
import { PetSettingTab } from "./ui/settings-tab";
import { SelectorModal } from "./ui/selector-modal";
import { BACKGROUNDS } from "./catalog/backgrounds";
import { PETS, getPetType } from "./catalog/pets";
import { BALLS } from "./catalog/balls";
import { PetInstance, PetPluginData, deleteChatDatabase, resolveSavedData } from "./data";

export default class PetPlugin extends Plugin {
	data!: PetPluginData;
	private overlayView: OverlayPetView | null = null;
	private catToy: CatToyOverlay | null = null;

	private get mainDocument(): Document {
		return this.app.workspace.containerEl.doc;
	}

	override async onload(): Promise<void> {
		await this.loadSettings();

		setSoundEnabled(this.data.soundEnabled);

		// Add instance of the view
		this.registerView(VIEW_TYPE_PET, (leaf) => new PetView(leaf, this));

		// Open again if open last session (wait until obsidian is ready first)
		this.app.workspace.onLayoutReady(async () => {
			if (this.data.overlayMode) {
				// Close any leafs if they appear from a restored layout
				await this.closeView();
				this.overlayView = new OverlayPetView(this, this.mainDocument);
				for (const pet of this.data.pets) {
					this.overlayView.stage.addPet(pet);
				}
			} else {
				const isOpen = this.app.workspace.getLeavesOfType(VIEW_TYPE_PET).length > 0;
				if (!isOpen) {
					await this.openView();
				}
			}

			// Detach leaf when sibling sharing petview's tab group is opened
			this.registerEvent(
				this.app.workspace.on("active-leaf-change", (leaf) =>
					this.handleActiveLeafChange(leaf),
				),
			);
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
		this.addCommand({
			id: "choose-background-dropdown",
			name: "Choose pet view background",
			callback: () => this.openBackgroundPicker(),
		});

		// Command to add a pet
		this.addCommand({
			id: "add-pet-dropdown",
			name: "Add a pet",
			callback: () => this.openAddPetPicker(),
		});

		// Command to add a ball
		this.addCommand({
			id: "add-ball-dropdown",
			name: "Add a ball",
			callback: async () => this.throwRandomBall(),
		});

		// Command to change mouse to a cat toy
		this.addCommand({
			id: "add-cat-toy-dropdown",
			name: "Cat toy mouse toggle",
			callback: async () => this.toggleCatToy(),
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
				const options = this.data.pets.map((pet) => {
					const typeLabel = getPetType(pet.type)?.label;
					return { value: pet.id, label: `${pet.name} (${typeLabel ?? pet.type})` };
				});
				new SelectorModal(this.app, options, async (value: string, _name: string) => {
					await this.removePetById(value);
				}).open();
			},
		});

		// Add settings
		this.addSettingTab(new PetSettingTab(this.app, this));

		const NEW_NOTE_MESSAGES = [
			"Meow! A new note! 😸",
			"Purr-fect time to write! 🐱",
			"I'm feline creative! 😻",
			"Note-hing can stop you now!",
			"Paws and write! 🐾",
			"Cat-ch those ideas!",
			"Whisker up some brilliance! 🐈",
			"You've cat to be kitten - another note?",
			"Fur real, you're productive!",
			"Meow-velous note-taking!",
			"Meow meow! 😺",
			"*purrs contentedly* 🐱",
			"Mew mew!",

			"Woof! New note detected! 🐕",
			"Bark bark! Time to write! 🐶",
			"Paws-itively productive!",
			"Fetching new ideas! 🎾",
			"Note-worthy work!",
			"Ruff draft started!",
			"Pup-tastic productivity!",
			"Tail-wagging good writing!",
			"Who's a good writer? You are!",
			"Bone-us note unlocked! 🦴",
			"Arf arf! 🐕",
			"Woof woof! 🐶",
			"*excited bork*",
			"*tail wagging intensifies*",

			"Hop into a new note! 🐰",
			"Some-bunny's productive!",
			"Lettuce write! 🥬",
			"Hare-brained ideas welcome!",
			"Note-hopping along nicely!",
			"Carrot-ch all your thoughts! 🥕",
			"Hop-timistic about this note!",
			"Bunny-lievable productivity!",

			"Write on, hooman! ✍️",
		];

		this.app.workspace.onLayoutReady(() => {
			this.registerEvent(
				this.app.vault.on("create", (file) => {
					if (!(file instanceof TFile) || file.extension !== "md") return;
					const randomMessage =
						NEW_NOTE_MESSAGES[Math.floor(Math.random() * NEW_NOTE_MESSAGES.length)];
					new Notice(randomMessage);
				}),
			);
		});
	}

	openAddPetPicker() {
		const options = PETS.map(({ id, label }) => ({ value: id, label, requiresName: true }));
		new SelectorModal(this.app, options, async (value: string, name: string) => {
			await this.addPet(value, name);
		}).open();
	}

	toggleCatToy(): void {
		if (this.catToy) {
			this.catToy.destroy();
			this.catToy = null;
			this.stopCursorFollowMode();
		} else {
			this.catToy = new CatToyOverlay(this.mainDocument, this.data.petSize);
			this.startCursorFollowMode(this.catToy);
		}
	}

	getCatToyClientX(): (() => number) | null {
		const toy = this.catToy;
		return toy ? () => toy.getClientX() : null;
	}

	private startCursorFollowMode(toy: CatToyOverlay) {
		for (const stage of this.getStages()) {
			stage.startCursorFollow(() => toy.getClientX());
		}
	}

	private stopCursorFollowMode() {
		for (const stage of this.getStages()) {
			stage.stopCursorFollow();
		}
	}

	throwRandomBall() {
		const randomBall = BALLS[Math.floor(Math.random() * BALLS.length)];
		void this.addBall(randomBall.id);
	}

	openBackgroundPicker() {
		const options = BACKGROUNDS.map(({ id, label }) => ({ value: id, label }));
		new SelectorModal(this.app, options, async (value: string, _name: string) => {
			await this.setBackground(value);
		}).open();
	}

	override onunload() {
		if (this.catToy) {
			this.catToy.destroy();
			this.catToy = null;
		}
		if (this.overlayView) {
			this.overlayView.destroy();
			this.overlayView = null;
		}
		// Don't detach leaves: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines#Don't+detach+leaves+in+%60onunload%60
	}

	async loadSettings() {
		const { data, migrated } = resolveSavedData(await this.loadData());
		this.data = data;

		if (migrated) {
			await this.saveSettings();
			deleteChatDatabase();
		}
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.data);
	}

	async setBackground(backgroundFile: string): Promise<void> {
		if (this.data.overlayMode) return;

		// Make sure not already selected background
		if (this.data.selectedBackground === backgroundFile) {
			// console.log("Same picked");
			return;
		}

		this.data.selectedBackground = backgroundFile;
		await this.saveSettings();

		const views = this.getPetViews();
		await this.openViewIfClosed();
		for (const view of views) {
			view.updateView();
		}
	}

	// Getter function to get background in petview.ts
	getSelectedBackground(): string {
		return this.data.selectedBackground;
	}

	setBackgroundAnimation(enabled: boolean): void {
		this.data.animatedBackground = enabled;
		void this.saveSettings();

		for (const view of this.getPetViews()) {
			view.updateView();
		}
	}

	setSound(enabled: boolean): void {
		this.data.soundEnabled = enabled;
		void this.saveSettings();
		setSoundEnabled(enabled);
		if (enabled && this.catToy) startToySound();
	}

	setPetSize(size: number): void {
		this.data.petSize = size;
		void this.saveSettings();

		this.catToy?.updateSize(size);

		for (const stage of this.getStages()) {
			stage.updatePetSize();
		}
	}

	async addPet(type: string, name: string): Promise<void> {
		if (!(type in this.data.nextPetIdCounters)) {
			this.data.nextPetIdCounters[type] = 1;
		}

		// Create id (type format -> pets/petType)
		const id = `${type}-${this.data.nextPetIdCounters[type]}`;
		this.data.nextPetIdCounters[type]++;

		// Add to list of pets
		this.data.pets.push({ id, type, name });
		await this.saveSettings();

		playPetSound("spawn");

		const existingStages = this.getStages();
		await this.openViewIfClosed();
		for (const stage of existingStages) {
			stage.addPet({ id, type, name });
		}
	}

	async addBall(id: string): Promise<void> {
		await this.openViewIfClosed();
		for (const stage of this.getStages()) {
			stage.throwBall(id);
		}
	}

	// Getter function to get pet list in petview.ts
	getPetList(): PetInstance[] {
		return this.data.pets;
	}

	async removePetById(id: string): Promise<void> {
		// Filters out the one with the same id
		this.data.pets = this.data.pets.filter((p) => p.id !== id);
		await this.saveSettings();

		for (const stage of this.getStages()) {
			stage.removePet(id);
		}
	}

	async clearAllPets(): Promise<void> {
		// Empties out the entire pet list
		this.data.pets = [];
		// Reset all counters back to 1
		for (const type in this.data.nextPetIdCounters) {
			this.data.nextPetIdCounters[type] = 1;
		}
		await this.saveSettings();

		for (const stage of this.getStages()) {
			stage.removeAllPets();
		}
	}

	// Switch between panel mode and overlay mode
	async setOverlayMode(enabled: boolean): Promise<void> {
		if (this.data.overlayMode === enabled) return;

		this.data.overlayMode = enabled;
		await this.saveSettings();

		if (enabled) {
			await this.closeView();
			this.overlayView = new OverlayPetView(this, this.mainDocument);
			for (const pet of this.data.pets) {
				this.overlayView.stage.addPet(pet);
			}
		} else {
			if (this.overlayView) {
				this.overlayView.destroy();
				this.overlayView = null;
			}
			await this.openView();
		}
	}

	private getPetViews(): PetView[] {
		const views: PetView[] = [];
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_PET)) {
			if (leaf.view instanceof PetView) {
				views.push(leaf.view);
			}
		}
		return views;
	}

	private getStages(): Stage[] {
		if (this.data.overlayMode) {
			return this.overlayView ? [this.overlayView.stage] : [];
		}
		const stages: Stage[] = [];
		for (const view of this.getPetViews()) {
			if (view.stage) {
				stages.push(view.stage);
			}
		}
		return stages;
	}

	private async openViewIfClosed(): Promise<void> {
		if (this.app.workspace.getLeavesOfType(VIEW_TYPE_PET).length === 0) {
			await this.openView();
		}
	}

	// Open the leaf view
	async openView() {
		if (this.data.overlayMode) return;

		await this.app.workspace.ensureSideLeaf(VIEW_TYPE_PET, "left", {
			active: true,
			split: true,
			reveal: true,
		});
	}

	// Remove the leaf (view) based on its ID
	async closeView() {
		const { workspace } = this.app;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_PET);
		for (const leaf of leaves) {
			leaf.detach();
		}
	}

	private getPetLeaf(): WorkspaceLeaf | null {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PET);
		return leaves[0] ?? null;
	}

	private sidebarOf(leaf: WorkspaceLeaf): "left" | "right" | null {
		const root = leaf.getRoot();
		if (root === this.app.workspace.leftSplit) return "left";
		if (root === this.app.workspace.rightSplit) return "right";
		return null;
	}

	private petLeafHasSiblings(leaf: WorkspaceLeaf): boolean {
		let hasSibling = false;
		this.app.workspace.iterateAllLeaves((other) => {
			if (other !== leaf && other.parent === leaf.parent) {
				hasSibling = true;
			}
		});
		return hasSibling;
	}

	private handleActiveLeafChange(active: WorkspaceLeaf | null): void {
		if (this.data.overlayMode) return;
		if (!active) return;
		if (active.view.getViewType() === VIEW_TYPE_PET) return;

		const activeSide = this.sidebarOf(active);
		if (!activeSide) return;

		const petLeaf = this.getPetLeaf();
		if (!petLeaf) return;
		if (this.sidebarOf(petLeaf) !== activeSide) return;

		// Only yield space when the pet leaf is actually sharing a tab group
		if (!this.petLeafHasSiblings(petLeaf)) return;

		petLeaf.detach();
	}
}
