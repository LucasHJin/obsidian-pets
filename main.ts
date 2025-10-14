import { Plugin, Notice } from "obsidian";
import { PetView, VIEW_TYPE_PET } from "petview";
import { PetSettingTab } from "settings";
import { SelectorModal, SelectorOption, ChatModal } from "modals";
import { askModel } from "chatmodels";
import { GoogleGenAI } from "@google/genai";
import { VectorDB } from "chat-utils/vector-db";
import { indexVault } from "chat-utils/indexer";
import { answerQuery } from "chat-utils/retriever";
import { initModel } from "chatmodels";
import OpenAI from "openai";

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
	geminiApiKey: string; // Gemini API key for chat feature
	openAiApiKey: string; // OpenAI API key for RAG
	indexedFiles?: Record<string, number>; // To track already indexed files in vault
	selectedModel?: string; // Selected model for chat
}

const DEFAULT_DATA: Partial<PetPluginData> = {
	selectedBackground: "none",
	pets: [],
	nextPetIdCounters: {},
};

export default class PetPlugin extends Plugin {
	instanceData: PetPluginData;
	ragDb: VectorDB;
	private chatmodel: GoogleGenAI | OpenAI | null = null;

	async onload(): Promise<void> {
		// Loads saved data and merges with current data
		try {
			await this.loadSettings();
			// NEED TO HANDLE ERROR BETTER IF NO API KEY
			if (
				this.instanceData.selectedModel &&
				this.instanceData.selectedModel !== "none"
			) {
				try {
					this.chatmodel = initModel(
						this.instanceData.selectedModel,
						this.instanceData.geminiApiKey,
						this.instanceData.openAiApiKey
					);
				} catch (e) {
					console.warn("Failed to initialize chat model:", e);
					new Notice(
						"Could not initialize AI model. Check API keys and model selection in settings."
					);
				}
			}
		} catch (err) {
			console.error("Failed to load pet plugin data:", err);
		}

		// Initialize the vector database
		this.ragDb = new VectorDB();

		// Add instance of the view
		this.registerView(VIEW_TYPE_PET, (leaf) => new PetView(leaf, this));

		// Open again if open last session (wait until obsidian is ready first)
		this.app.workspace.onLayoutReady(async () => {
			const isOpen =
				this.app.workspace.getLeavesOfType(VIEW_TYPE_PET).length > 0;
			if (!isOpen) {
				await this.openView();
			}
		});

		// Adds icon on the ribbon (side panel) to open view
		this.addRibbonIcon("cat", "Toggle pet view", async () => {
			const isOpen =
				this.app.workspace.getLeavesOfType(VIEW_TYPE_PET).length > 0;
			if (isOpen) {
				await this.closeView();
			} else {
				await this.openView();
			}
		});

		// Command to choose the background
		const BACKGROUNDS: SelectorOption[] = [
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
		this.addCommand({
			id: "choose-background-dropdown",
			name: "Choose pet view background",
			callback: () => {
				new SelectorModal(
					this.app,
					BACKGROUNDS,
					async (value: string, name: string) => {
						await this.chooseBackground(value); // Pass chooseBackground() function to modal
					}
				).open();
			},
		});

		// Command to add a pet
		const PETS: SelectorOption[] = [
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
		this.addCommand({
			id: "add-pet-dropdown",
			name: "Add a pet",
			callback: () => {
				new SelectorModal(
					this.app,
					PETS,
					async (value: string, name: string) => {
						await this.addPet(value, name);
					}
				).open();
			},
		});

		// Command to add a ball
		const BALLS: string[] = [
			"toys/blue-ball",
			"toys/cyan-ball",
			"toys/green-ball",
			"toys/orange-ball",
			"toys/pink-ball",
			"toys/purple-ball",
			"toys/red-ball",
			"toys/yellow-ball",
		];
		this.addCommand({
			id: "add-ball-dropdown",
			name: "Add a ball",
			callback: async () => {
				// Random ball color
				const randomBall =
					BALLS[Math.floor(Math.random() * BALLS.length)];
				await this.addBall(randomBall);
			},
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
				//this.instanceData.pets.map((pet) => console.log(pet.id, pet.name));

				const options = this.instanceData.pets.map((pet) => ({
					value: pet.id,
					// Label of name and type
					label: `${pet.name} (${this.getCleanLabel(pet.id)})`,
				}));
				new SelectorModal(
					this.app,
					options,
					async (value: string, name: string) => {
						await this.removePetById(value);
					}
				).open();
			},
		});

		this.addCommand({
			id: "chat-with-pets",
			name: "Chat with your pets",
			callback: () => {
				new ChatModal(this.app, (msg) => this.chatWithPet(msg)).open();
			},
		});

		// Add command to manually index vault (also do this onload if not indexed yet)
		this.addCommand({
			id: "manual-index-vault",
			name: "Index Vault for RAG",
			callback: async () => {
				if (!this.instanceData.openAiApiKey) {
					new Notice("Set your OpenAI API key first.");
					return;
				}

				await indexVault(
					this.app,
					this.ragDb,
					this.instanceData.openAiApiKey,
					this.instanceData.indexedFiles
				);
				await this.saveData(this.instanceData);
				new Notice("Vault indexed successfully.");
			},
		});

		// Add settings
		this.addSettingTab(new PetSettingTab(this.app, this));

		// Add initial indexing if vault not indexed yet
		if (this.instanceData.openAiApiKey && this.ragDb) {
			if (
				!this.instanceData.indexedFiles ||
				Object.keys(this.instanceData.indexedFiles).length === 0
			) {
				// console.log("Indexing all vault files for the first time...");
				await indexVault(
					this.app,
					this.ragDb,
					this.instanceData.openAiApiKey,
					this.instanceData.indexedFiles
				);
				await this.saveData(this.instanceData);
			}
		}
	}

	// Function to handle chat messages
	async chatWithPet(question: string): Promise<string> {
		// Need a chat model to exist
		if (!this.chatmodel) {
			return "Please set your API key(s) in settings first.";
		}

		// If OpenAI key exists -> fetch context (retrieval)
		let context = "";
		if (this.instanceData.openAiApiKey && this.ragDb) {
			try {
				context = await answerQuery(
					question,
					this.instanceData.openAiApiKey,
					this.ragDb
				);
			} catch (e) {
				console.error("RAG error:", e);
				new Notice("Failed to retrieve context from vault");
				// Continue without context
			}
		}

		// Try to get response from Model
		try {
			return await askModel(
				context || "No context available.",
				question,
				this.chatmodel,
				this.instanceData.selectedModel || "none"
			);
		} catch (e) {
			console.error("Chat model error:", e);
			return "Sorry, I couldn't process your request. Please check your selected model and API key.";
		}
	}

	public updateGeminiApiKey(geminiApiKey: string): void {
		this.instanceData.geminiApiKey = geminiApiKey;
		this.saveData(this.instanceData);
	}

	public updateOpenAiApiKey(openAiApiKey: string): void {
		this.instanceData.openAiApiKey = openAiApiKey;
		this.saveData(this.instanceData);
	}

	public updateChosenModel(selectedModel: string): void {
		this.instanceData.selectedModel = selectedModel;
		this.saveData(this.instanceData);

		try {
			if (selectedModel === "gemini" && !this.instanceData.geminiApiKey) {
				new Notice("Set your Gemini API key first.");
				this.chatmodel = null;
				return;
			}
			if (selectedModel === "openai" && !this.instanceData.openAiApiKey) {
				new Notice("Set your OpenAI API key first.");
				this.chatmodel = null;
				return;
			}

			this.chatmodel = initModel(
				selectedModel,
				this.instanceData.geminiApiKey,
				this.instanceData.openAiApiKey
			);

			if (selectedModel === "gemini") {
				new Notice(`Model set to Gemini.`);
			} else if (selectedModel === "openai") {
				new Notice(`Model set to OpenAI.`);
			} else {
				new Notice("No model selected.");
			}
		} catch (e) {
			console.error("Failed to initialize model after selection:", e);
			new Notice("Could not initialize model. Check API keys.");
			this.chatmodel = null;
		}
	}

	// Function to get a clean id label
	getCleanLabel(id: string): string {
		// Don't want the general /pets
		const desired = id.split("/").pop() ?? "";

		// Match everything before last dash before digit (ind 1), match a dash followed by 1+ digits (ind 2)
		// Parentheses captures groups
		const match = desired.match(/^(.*)-(\d+)$/);
		if (!match) {
			return desired;
		}
		// Don't need the full match
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const [_, base, num] = match;
		// Capitalize each word
		const name = base
			.split("-")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");

		return name;
	}

	async onunload(): Promise<void> {
		// Close the view when unloading
		// await this.closeView(); -> don't detach leafs (https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines#Don't+detach+leaves+in+%60onunload%60)
	}

	// Merges current data with default data
	async loadSettings() {
		this.instanceData = Object.assign(
			{},
			DEFAULT_DATA,
			await this.loadData()
		);

		// Make sure id counter exists
		if (!this.instanceData.nextPetIdCounters) {
			this.instanceData.nextPetIdCounters = {};
		}

		// Make sure indexedFiles exists
		if (!this.instanceData.indexedFiles) {
			this.instanceData.indexedFiles = {};
		}
	}

	public async chooseBackground(backgroundFile: string): Promise<void> {
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
		this.saveData(this.instanceData);

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
		return this.instanceData.pets || [];
	}

	public async removePetById(id: string): Promise<void> {
		// Filters out the one with the same id
		this.instanceData.pets = this.instanceData.pets.filter(
			(p) => p.id !== id
		);
		await this.saveData(this.instanceData);

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

		// Update view
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_PET);
		for (const leaf of leaves) {
			const view = leaf.view;
			if (view instanceof PetView) {
				view.removeAllPets();
			}
		}
	}

	// Open the leaf view
	async openView() {
		const { workspace } = this.app;

		const leaves = workspace.getLeavesOfType(VIEW_TYPE_PET);
		if (leaves.length > 0) {
			workspace.revealLeaf(leaves[0]);
			return;
		}

		const leaf = workspace.getLeftLeaf(true);
		if (leaf) {
			await leaf.setViewState({ type: VIEW_TYPE_PET, active: true });
			workspace.revealLeaf(leaf);
		}
	}

	// Remove the leaf (view) based on its ID
	async closeView() {
		const { workspace } = this.app;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_PET);
		for (const leaf of leaves) {
			await leaf.detach();
		}
	}
}
