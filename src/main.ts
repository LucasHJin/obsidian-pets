import { Notice, Plugin, WorkspaceLeaf } from "obsidian";
import { PetView, VIEW_TYPE_PET } from "./views/pet-view";
import { OverlayPetView } from "./views/overlay-view";
import { Stage } from "./stage";
import { CatToyOverlay } from "./toys/cat-toy";
import { SoundPlayer } from "./audio/sounds";
import { PetSettingTab } from "./ui/settings-tab";
import { SelectorModal, SelectorPreview } from "./ui/selector-modal";
import { PetNameModal } from "./ui/pet-name-modal";
import { BACKGROUNDS } from "./catalog/backgrounds";
import { PETS, getPetType } from "./catalog/pets";
import { getIdleAnimation } from "./pets/pet-animations";
import { BALLS } from "./catalog/balls";
import { pickCatToyImage } from "./catalog/cat-toy-colors";
import { PetInstance, PetPluginData, deleteChatDatabase, resolveSavedData } from "./data";
import { registerNewNoteNotices } from "./notices";

export default class PetPlugin extends Plugin {
	data!: PetPluginData;
	readonly sounds = new SoundPlayer();
	private overlayView: OverlayPetView | null = null;
	private catToy: CatToyOverlay | null = null;
	private lastCatToyClientX = 0;

	private get mainDocument(): Document {
		return this.app.workspace.containerEl.doc;
	}

	override async onload(): Promise<void> {
		await this.loadSettings();

		this.sounds.setEnabled(this.data.soundEnabled);

		const hadPetLeaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_PET).length > 0;

		this.registerView(VIEW_TYPE_PET, (leaf) => new PetView(leaf, this));

		this.app.workspace.onLayoutReady(async () => {
			if (this.data.overlayMode) {
				await this.closeView();
				this.overlayView = new OverlayPetView(this, this.mainDocument);
				for (const pet of this.data.pets) {
					this.overlayView.stage.addPet(pet);
				}
			} else {
				const isOpen =
					hadPetLeaf || this.app.workspace.getLeavesOfType(VIEW_TYPE_PET).length > 0;
				if (!isOpen) {
					await this.openView();
				}
			}

			this.registerEvent(
				this.app.workspace.on("active-leaf-change", (leaf) =>
					this.handleActiveLeafChange(leaf),
				),
			);
		});

		this.addRibbonIcon("cat", "Toggle pet view", async () => {
			const isOpen = this.app.workspace.getLeavesOfType(VIEW_TYPE_PET).length > 0;
			if (isOpen) {
				await this.closeView();
			} else {
				await this.openView();
			}
		});

		this.addCommand({
			id: "choose-background-dropdown",
			name: "Choose pet view background",
			callback: () => this.openBackgroundPicker(),
		});

		this.addCommand({
			id: "add-pet-dropdown",
			name: "Add a pet",
			callback: () => this.openAddPetPicker(),
		});

		this.addCommand({
			id: "add-ball-dropdown",
			name: "Add a ball",
			callback: async () => this.throwRandomBall(),
		});

		this.addCommand({
			id: "add-cat-toy-dropdown",
			name: "Cat toy mouse toggle",
			callback: async () => this.toggleCatToy(),
		});

		this.addCommand({
			id: "clear-all-pets",
			name: "Remove all pets",
			callback: async () => {
				await this.removeAllPetsWithNotice();
			},
		});

		this.addCommand({
			id: "remove-pet-by-id",
			name: "Remove a specific pet",
			callback: () => {
				if (this.data.pets.length === 0) {
					new Notice("You have no pets to remove.");
					return;
				}
				const options = this.data.pets.map((pet) => {
					const typeLabel = getPetType(pet.type)?.label;
					return {
						value: pet.id,
						label: `${pet.name} (${typeLabel ?? pet.type})`,
						preview: spritePreview(pet.type),
					};
				});
				new SelectorModal(this.app, options, "Search pets to remove", (id) => {
					void this.removePetById(id);
				}).open();
			},
		});

		this.addSettingTab(new PetSettingTab(this.app, this));

		registerNewNoteNotices(this);
	}

	openAddPetPicker() {
		const options = PETS.map(({ id, label }) => ({
			value: id,
			label,
			preview: spritePreview(id),
		}));
		new SelectorModal(this.app, options, "Search pets", (type) => {
			new PetNameModal(this.app, getIdleAnimation(type), (name) => {
				void this.addPet(type, name);
			}).open();
		}).open();
	}

	toggleCatToy(): void {
		if (this.catToy) {
			this.lastCatToyClientX = this.catToy.getClientX();
			this.catToy.destroy();
			this.catToy = null;
			this.stopCursorFollowMode();
		} else {
			this.catToy = new CatToyOverlay(
				this.mainDocument,
				this.data.petSize,
				pickCatToyImage(),
				this.sounds,
				this.lastCatToyClientX,
			);
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
		if (this.data.pets.length === 0) {
			new Notice("Add a pet to play with the ball.");
			return;
		}
		const randomBall = BALLS[Math.floor(Math.random() * BALLS.length)];
		void this.addBall(randomBall.id);
	}

	openBackgroundPicker() {
		const options = BACKGROUNDS.map(({ id, label, image }) => ({
			value: id,
			label,
			preview: { kind: "thumbnail", url: image } satisfies SelectorPreview,
		}));
		new SelectorModal(this.app, options, "Search backgrounds", (id) => {
			void this.setBackground(id);
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

		if (this.data.selectedBackground === backgroundFile) {
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
		this.sounds.setEnabled(enabled);
		if (enabled && this.catToy) this.sounds.startToy();
	}

	setNewNoteNotices(enabled: boolean): void {
		this.data.newNoteNotices = enabled;
		void this.saveSettings();
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

		const id = `${type}-${this.data.nextPetIdCounters[type]}`;
		this.data.nextPetIdCounters[type]++;

		this.data.pets.push({ id, type, name });
		await this.saveSettings();

		this.sounds.playPet("spawn");

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

	getPetList(): PetInstance[] {
		return this.data.pets;
	}

	async removePetById(id: string): Promise<void> {
		this.data.pets = this.data.pets.filter((p) => p.id !== id);
		await this.saveSettings();

		for (const stage of this.getStages()) {
			stage.removePet(id);
		}
	}

	async clearAllPets(): Promise<void> {
		this.data.pets = [];
		for (const type in this.data.nextPetIdCounters) {
			this.data.nextPetIdCounters[type] = 1;
		}
		await this.saveSettings();

		for (const stage of this.getStages()) {
			stage.removeAllPets();
		}
	}

	async removeAllPetsWithNotice(): Promise<void> {
		if (this.data.pets.length === 0) {
			new Notice("You have no pets to remove.");
			return;
		}
		await this.clearAllPets();
	}

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

	async openView() {
		if (this.data.overlayMode) return;

		await this.app.workspace.ensureSideLeaf(VIEW_TYPE_PET, "left", {
			active: true,
			split: true,
			reveal: true,
		});
	}

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

		if (!this.petLeafHasSiblings(petLeaf)) return;

		petLeaf.detach();
	}
}

function spritePreview(type: string): SelectorPreview | undefined {
	const animation = getIdleAnimation(type);
	return animation ? { kind: "sprite", animation } : undefined;
}
