import { Plugin, Notice, WorkspaceLeaf } from "obsidian";
import { PetView, VIEW_TYPE_PET } from "./petview";
import { OverlayPetView } from "./overlay";
import { CatToyOverlay } from "./pet-utils/cat-toy";
import { setSoundEnabled, playPetSound, startToySound } from "./pet-utils/sounds";
import { PetSettingTab } from "./settings";
import { SelectorModal, SelectorOption } from "./modals";

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
	animatedBackground: boolean; // Whether background animations are on or off
	petSize: number; // Overall size of pets (1 = normal size)
	overlayMode: boolean; // Whether pets render in overlay mode vs panel mode
	soundEnabled: boolean; // Whether pet click sounds play
}

const DEFAULT_DATA: PetPluginData = {
	selectedBackground: "none",
	pets: [],
	nextPetIdCounters: {},
	animatedBackground: false,
	petSize: 1,
	overlayMode: false,
	soundEnabled: false,
};

const REMOVED_CHAT_DATA_KEYS = ["geminiApiKey", "openAiApiKey", "selectedModel", "indexedFiles"];
const REMOVED_CHAT_DATABASE = "obsidian-rag-db";

export default class PetPlugin extends Plugin {
	instanceData!: PetPluginData;
	private overlayView: OverlayPetView | null = null;
	private catToyActive = false;
	private catToyOverlay: CatToyOverlay | null = null;
	private currentMouseX = 0;
	protected BALLS: string[] = [
		"toys/blue-ball",
		"toys/cyan-ball",
		"toys/green-ball",
		"toys/orange-ball",
		"toys/pink-ball",
		"toys/purple-ball",
		"toys/red-ball",
		"toys/yellow-ball",
	];
	protected PETS: SelectorOption[] = [
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
			value: "pets/xmas-v2-cat",
			label: "Christmas cat v2",
			requiresName: true,
		},
		{
			value: "pets/xmas-v3-cat",
			label: "Christmas cat v3",
			requiresName: true,
		},
		{
			value: "pets/classic-cat",
			label: "Classic cat",
			requiresName: true,
		},
		{
			value: "pets/deer-cat",
			label: "Deer cat",
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
		{ value: "pets/ghost", label: "Ghost", requiresName: true },
		{
			value: "pets/grey-bunny",
			label: "Grey bunny",
			requiresName: true,
		},
		{
			value: "pets/pirate-cat",
			label: "Pirate cat",
			requiresName: true,
		},
		{
			value: "pets/pirate-v2-cat",
			label: "Pirate cat v2",
			requiresName: true,
		},
		{
			value: "pets/pirate-v3-cat",
			label: "Pirate cat v3",
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
		{
			value: "pets/vampire-cat",
			label: "Vampire cat",
			requiresName: true,
		},
		{ value: "pets/white-cat", label: "White cat", requiresName: true },
		{ value: "pets/witch-cat", label: "Witch cat", requiresName: true },
	];

	protected BACKGROUNDS: SelectorOption[] = [
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

	async onload(): Promise<void> {
		// Loads saved data and merges with current data
		try {
			await this.loadSettings();
		} catch (err) {
			console.error("Failed to load pet plugin data:", err);
		}

		setSoundEnabled(this.instanceData.soundEnabled);

		// Add instance of the view
		this.registerView(VIEW_TYPE_PET, (leaf) => new PetView(leaf, this));

		// Open again if open last session (wait until obsidian is ready first)
		this.app.workspace.onLayoutReady(async () => {
			if (this.instanceData.overlayMode) {
				// Close any leafs if they appear from a restored layout
				await this.closeView();
				this.overlayView = new OverlayPetView(this);
				for (const pet of this.instanceData.pets) {
					this.overlayView.addPet(pet);
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
			callback: () => this.showChooseBackgroundCommand(),
		});

		// Command to add a pet
		this.addCommand({
			id: "add-pet-dropdown",
			name: "Add a pet",
			callback: () => this.showAddPetCommand(),
		});

		// Command to add a ball
		this.addCommand({
			id: "add-ball-dropdown",
			name: "Add a ball",
			callback: async () => this.throwBallCommand(),
		});

		// Command to change mouse to a cat toy
		this.addCommand({
			id: "add-cat-toy-dropdown",
			name: "Cat toy mouse toggle",
			callback: async () => this.changeMouseCommand(),
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
				const options = this.instanceData.pets.map((pet) => {
					const typeLabel = this.PETS.find((option) => option.value === pet.type)?.label;
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
			// Small delay to let initial file loading finish (so that not all files are processed in refresh)
			window.setTimeout(() => {
				this.registerEvent(
					this.app.vault.on("create", (file) => {
						const randomMessage =
							NEW_NOTE_MESSAGES[Math.floor(Math.random() * NEW_NOTE_MESSAGES.length)];
						new Notice(randomMessage);
					}),
				);
			}, 1000); // Wait 1 second after layout is ready
		});
	}

	public showAddPetCommand() {
		new SelectorModal(this.app, this.PETS, async (value: string, name: string) => {
			await this.addPet(value, name);
		}).open();
	}

	public changeMouseCommand(): void {
		this.catToyActive = !this.catToyActive;
		if (this.catToyActive) {
			this.catToyOverlay = new CatToyOverlay(this.instanceData.petSize, (x) => {
				this.currentMouseX = x;
			});
			this.startCursorFollowMode();
		} else {
			this.catToyOverlay?.destroy();
			this.catToyOverlay = null;
			this.stopCursorFollowMode();
		}
	}

	private startCursorFollowMode() {
		if (this.instanceData.overlayMode) {
			const getCursorX = () => this.currentMouseX;
			this.overlayView?.startCursorFollow(getCursorX);
		} else {
			for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_PET)) {
				if (leaf.view instanceof PetView) {
					const containerEl = leaf.view.getWrapper() as HTMLElement;
					const getCursorX = () => {
						const rect = containerEl.getBoundingClientRect();
						return this.currentMouseX - rect.left;
					};
					leaf.view.startCursorFollow(getCursorX);
				}
			}
		}
	}

	private stopCursorFollowMode() {
		if (this.instanceData.overlayMode) {
			this.overlayView?.stopCursorFollow();
		} else {
			for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_PET)) {
				if (leaf.view instanceof PetView) {
					leaf.view.stopCursorFollow();
				}
			}
		}
	}

	public throwBallCommand() {
		const randomBall = this.BALLS[Math.floor(Math.random() * this.BALLS.length)];
		void this.addBall(randomBall);
	}

	public showChooseBackgroundCommand() {
		new SelectorModal(this.app, this.BACKGROUNDS, async (value: string, _name: string) => {
			await this.chooseBackground(value); // Pass chooseBackground() function to modal
		}).open();
	}

	onunload() {
		if (this.catToyOverlay) {
			this.catToyOverlay.destroy();
			this.catToyOverlay = null;
		}
		if (this.overlayView) {
			this.overlayView.destroy();
			this.overlayView = null;
		}
		// Don't detach leaves: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines#Don't+detach+leaves+in+%60onunload%60
	}

	// Merges current data with default data
	async loadSettings() {
		const savedData = ((await this.loadData()) ?? {}) as Record<string, unknown>;
		const chatKeys = REMOVED_CHAT_DATA_KEYS.filter((key) => key in savedData);
		for (const key of chatKeys) {
			delete savedData[key];
		}
		this.instanceData = Object.assign({}, structuredClone(DEFAULT_DATA), savedData);

		if (chatKeys.length > 0) {
			await this.saveData(this.instanceData);
			this.deleteChatDatabase();
		}
	}

	private deleteChatDatabase() {
		const request = window.indexedDB.deleteDatabase(REMOVED_CHAT_DATABASE);
		request.onerror = () => console.warn("Failed to delete the old chat index:", request.error);
	}

	public async chooseBackground(backgroundFile: string): Promise<void> {
		if (this.instanceData.overlayMode) return;

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

	public toggleBackgroundAnimation(value: boolean): void {
		this.instanceData.animatedBackground = value;
		void this.saveData(this.instanceData);

		// Update all open PetViews
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PET);
		for (const leaf of leaves) {
			const view = leaf.view;
			// if is a PetView
			if (view instanceof PetView) {
				view.updateView();
			}
		}
	}

	public toggleSound(value: boolean): void {
		this.instanceData.soundEnabled = value;
		void this.saveData(this.instanceData);
		setSoundEnabled(value);
		if (value && this.catToyActive) startToySound();
	}

	public updatePetSize(value: number): void {
		this.instanceData.petSize = value;
		void this.saveData(this.instanceData);

		this.catToyOverlay?.updateSize(value);

		// Update pet size in overlay mode as well
		if (this.instanceData.overlayMode) {
			this.overlayView?.updatePetSize();
			return;
		}

		// Update all open PetViews
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PET);
		for (const leaf of leaves) {
			const view = leaf.view;
			// if is a PetView
			if (view instanceof PetView) {
				view.updatePetSize();
			}
		}
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

		playPetSound("spawn");

		if (this.instanceData.overlayMode) {
			this.overlayView?.addPet({ id, type, name });
			return;
		}

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

	public async addBall(type: string): Promise<void> {
		if (this.instanceData.overlayMode) {
			this.overlayView?.spawnBall(type);
			return;
		}

		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PET);
		if (leaves.length === 0) {
			await this.openView();
		}

		for (const leaf of leaves) {
			const view = leaf.view;
			if (view instanceof PetView) {
				view.addBallToView(view.getWrapper(), type);
			}
		}
	}

	// Getter function to get pet list in petview.ts
	public getPetList(): PetInstance[] {
		return this.instanceData.pets;
	}

	public async removePetById(id: string): Promise<void> {
		// Filters out the one with the same id
		this.instanceData.pets = this.instanceData.pets.filter((p) => p.id !== id);
		await this.saveData(this.instanceData);

		if (this.instanceData.overlayMode) {
			this.overlayView?.removePet(id);
			return;
		}

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

		if (this.instanceData.overlayMode) {
			this.overlayView?.removeAllPets();
			return;
		}

		// Update view
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PET);
		for (const leaf of leaves) {
			const view = leaf.view;
			if (view instanceof PetView) {
				view.removeAllPets();
			}
		}
	}

	// Switch between panel mode and overlay mode
	public async setOverlayMode(enabled: boolean): Promise<void> {
		if (this.instanceData.overlayMode === enabled) return;

		this.instanceData.overlayMode = enabled;
		await this.saveData(this.instanceData);

		if (enabled) {
			await this.closeView();
			this.overlayView = new OverlayPetView(this);
			for (const pet of this.instanceData.pets) {
				this.overlayView.addPet(pet);
			}
		} else {
			if (this.overlayView) {
				this.overlayView.destroy();
				this.overlayView = null;
			}
			await this.openView();
		}
	}

	// Open the leaf view
	async openView() {
		if (this.instanceData.overlayMode) return;

		const { workspace } = this.app;

		const leaves = workspace.getLeavesOfType(VIEW_TYPE_PET);
		if (leaves.length > 0) {
			await workspace.revealLeaf(leaves[0]);
			return;
		}

		const leaf = workspace.getLeftLeaf(true);
		if (leaf) {
			await leaf.setViewState({ type: VIEW_TYPE_PET, active: true });
			await workspace.revealLeaf(leaf);
		}
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

	// Don't detach individual leafs
	private petLeafHasSiblings(leaf: WorkspaceLeaf): boolean {
		const parent = (leaf as unknown as { parent?: unknown }).parent;
		if (!parent) return false;
		const iterate = (
			this.app.workspace as unknown as {
				iterateLeaves?: (cb: (l: WorkspaceLeaf) => unknown, item: unknown) => unknown;
			}
		).iterateLeaves;
		if (typeof iterate !== "function") return false;

		let hasSibling = false;
		iterate.call(
			this.app.workspace,
			(l: WorkspaceLeaf) => {
				if (l !== leaf) hasSibling = true;
			},
			parent,
		);
		return hasSibling;
	}

	private handleActiveLeafChange(active: WorkspaceLeaf | null): void {
		if (this.instanceData.overlayMode) return;
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
