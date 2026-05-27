import { Plugin, Notice, WorkspaceLeaf } from "obsidian";
import { PetView, VIEW_TYPE_PET } from "./petview";
import { OverlayPetView } from "./overlay";
import { CatToyOverlay } from "./pet-utils/cat-toy";
import { PetSettingTab } from "./settings";
import { SelectorModal, SelectorOption, ChatModal } from "./modals";
import { askModel, reformulateQuery, generatePageRantText } from "./chatmodels";
import { VectorDB } from "./chat-utils/vector-db";
import { indexVault } from "./chat-utils/indexer";
import { answerQuery } from "./chat-utils/retriever";
import { initModel } from "./chatmodels";
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
	petSize: number; // Overall size of pets (1 = normal size)
	overlayMode: boolean; // Whether pets render in overlay mode vs panel mode
	openAiApiKey: string; // OpenAI API key for RAG
	openAiBaseUrl: string; // OpenAI-compatible base URL
	pageRantEnabled: boolean;
	pageRantMinMinutes: number;
	pageRantMaxMinutes: number;
	pageRantContextChars: number;
	pageRantOnlyWhenFocused?: boolean;
	indexedFiles?: Record<string, number>; // To track already indexed files in vault
	selectedModel?: string; // Selected model for chat
	useChinesePrompt?: boolean; // Use Chinese prompt wording for AI features
}

const DEFAULT_DATA: Partial<PetPluginData> = {
	selectedBackground: "none",
	pets: [],
	nextPetIdCounters: {},
	overlayMode: false,
	useChinesePrompt: false,
	openAiBaseUrl: "https://api.openai.com/v1",
	pageRantEnabled: false,
	pageRantMinMinutes: 5,
	pageRantMaxMinutes: 20,
	pageRantContextChars: 1200,
	pageRantOnlyWhenFocused: true,
};

export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export default class PetPlugin extends Plugin {
	instanceData!: PetPluginData;
	ragDb!: VectorDB;
	// Recent activity log (in-memory). Each entry: {ts, type, file}
	recentActivity: { ts: number; type: "modify" | "create" | "open"; path: string }[] = [];
	private chatmodel: OpenAI | null = null;
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
			// NEED TO HANDLE ERROR BETTER IF NO API KEY
			if (
				this.instanceData.selectedModel &&
				this.instanceData.selectedModel !== "none"
			) {
				try {
					this.chatmodel = initModel(
						this.instanceData.openAiApiKey,
						this.instanceData.openAiBaseUrl,
						this.instanceData.selectedModel || "gpt-5-mini"
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

		// Track recent activity for page rants (kept in-memory, pruned periodically)
		this.registerEvent(
			this.app.vault.on("modify", (file) => {
				this.recordActivity("modify", file.path);
			})
		);
		this.registerEvent(
			this.app.vault.on("create", (file) => {
				this.recordActivity("create", file.path);
			})
		);
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					this.recordActivity("open", activeFile.path);
				}
			})
		);

		// Open again if open last session (wait until obsidian is ready first)
		this.app.workspace.onLayoutReady(async () => {
			if (this.instanceData.overlayMode) {
				// Close any leafs if they appear from a restored layout
				await this.closeView();
				this.overlayView = new OverlayPetView(this);
				for (const pet of this.instanceData.pets) {
					this.overlayView.addPet(pet);
				}
				this.overlayView.startRantLoop();
			} else {
				const isOpen =
					this.app.workspace.getLeavesOfType(VIEW_TYPE_PET).length > 0;
				if (!isOpen) {
					await this.openView();
				}
			}

			// Detach leaf when sibling sharing petview's tab group is opened
			this.registerEvent(
				this.app.workspace.on("active-leaf-change", (leaf) =>
					this.handleActiveLeafChange(leaf)
				)
			);
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
				const options = this.instanceData.pets.map((pet) => ({
					value: pet.id,
					// Label of name and type
					label: `${pet.name} (${this.getCleanLabel(pet.id)})`,
				}));
				new SelectorModal(
					this.app,
					options,
					async (value: string, _name: string) => {
						await this.removePetById(value);
					}
				).open();
			},
		});

		this.addCommand({
			id: "chat-with-pets",
			name: "Chat with your pets",
			callback: () => {
				if (!this.instanceData.selectedModel?.trim()) {
					new Notice("Please set a chat model in settings first.");
					return;
				}
				if (!this.chatmodel) {
					new Notice("Please set your API key and endpoint in settings first.");
					return;
				}

				new ChatModal(this.app, this, (msg, history) => this.chatWithPet(msg, history)).open(); // Pass reference to this plugin to use the markdown
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
					this.instanceData.openAiBaseUrl,
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
					this.instanceData.openAiBaseUrl,
					this.instanceData.indexedFiles
				);
				await this.saveData(this.instanceData);
			}
		}

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
			activeWindow.setTimeout(() => {
				this.registerEvent(
					this.app.vault.on("create", (file) => {
						const randomMessage = NEW_NOTE_MESSAGES[Math.floor(Math.random() * NEW_NOTE_MESSAGES.length)];
						new Notice(randomMessage);
					})
				);
			}, 1000); // Wait 1 second after layout is ready
		});
	}

	public showAddPetCommand() {
		new SelectorModal(
			this.app,
			this.PETS,
			async (value: string, name: string) => {
				await this.addPet(value, name);
			}
		).open();
	}

	public changeMouseCommand(): void {
		this.catToyActive = !this.catToyActive;
		if (this.catToyActive) {
			this.catToyOverlay = new CatToyOverlay(this.instanceData.petSize ?? 1, (x) => { this.currentMouseX = x; });
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
		new SelectorModal(
			this.app,
			this.BACKGROUNDS,
			async (value: string, _name: string) => {
				await this.chooseBackground(value); // Pass chooseBackground() function to modal
			}
		).open();
	}

	// Function to handle chat messages
	async chatWithPet(question: string, conversationHistory: ConversationMessage[] = []): Promise<string> {
		// Need a chat model to exist
		if (!this.chatmodel) {
			return "Please set your API key(s) in settings first.";
		}

		let searchQuery = question;

		// Reformulate follow up questions with context from previous questions (so that semantic searching works better)
		if (conversationHistory.length > 0) {
			const recentContext = conversationHistory
				.slice(-6)
				.map(msg => `${msg.role}: ${msg.content}`)
				.join("\n");
			
				searchQuery = await reformulateQuery(
					question,
					recentContext,
					this.chatmodel,
					this.instanceData.selectedModel || "gpt-5-mini",
					this.instanceData.useChinesePrompt ?? false
				);
		}

		// If OpenAI key exists -> fetch context (retrieval)
		let context = "";
		if (this.instanceData.openAiApiKey && this.ragDb) {
			try {
				context = await answerQuery(
					searchQuery,
					this.instanceData.openAiApiKey,
					this.instanceData.openAiBaseUrl,
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
				this.instanceData.selectedModel || "gpt-5-mini",
				conversationHistory,
				this.instanceData.useChinesePrompt ?? false
			);
		} catch (e) {
			console.error("Chat model error:", e);
			return "Sorry, I couldn't process your request. Please check your model, endpoint, and API key.";
		}
	}

	public updateOpenAiApiKey(openAiApiKey: string): void {
		this.instanceData.openAiApiKey = openAiApiKey;
		void this.saveData(this.instanceData);
	}

	public updateOpenAiBaseUrl(openAiBaseUrl: string): void {
		this.instanceData.openAiBaseUrl = openAiBaseUrl;
		void this.saveData(this.instanceData);
	}

	public updateChinesePrompt(useChinesePrompt: boolean): void {
		this.instanceData.useChinesePrompt = useChinesePrompt;
		void this.saveData(this.instanceData);
	}

	public updatePageRantEnabled(pageRantEnabled: boolean): void {
		this.instanceData.pageRantEnabled = pageRantEnabled;
		void this.saveData(this.instanceData);
	}

	public updatePageRantMinMinutes(pageRantMinMinutes: number): void {
		this.instanceData.pageRantMinMinutes = pageRantMinMinutes;
		void this.saveData(this.instanceData);
	}

	public updatePageRantMaxMinutes(pageRantMaxMinutes: number): void {
		this.instanceData.pageRantMaxMinutes = pageRantMaxMinutes;
		void this.saveData(this.instanceData);
	}

	public updatePageRantContextChars(pageRantContextChars: number): void {
		this.instanceData.pageRantContextChars = pageRantContextChars;
		void this.saveData(this.instanceData);
	}

	public updatePageRantOnlyWhenFocused(pageRantOnlyWhenFocused: boolean): void {
		this.instanceData.pageRantOnlyWhenFocused = pageRantOnlyWhenFocused;
		void this.saveData(this.instanceData);
	}

	private recordActivity(type: "modify" | "create" | "open", path: string) {
		const ts = Date.now();
		this.recentActivity.push({ ts, type, path });
		// prune entries older than 15 minutes to keep memory small
		const cutoff = Date.now() - 15 * 60 * 1000;
		this.recentActivity = this.recentActivity.filter((e) => e.ts >= cutoff);
	}

	/**
	 * Returns a concise human-readable summary of activity in the last `minutes` minutes.
	 */
	public getRecentActivitySummary(minutes = 10): string {
		const cutoff = Date.now() - minutes * 60 * 1000;
		const recent = this.recentActivity.filter((e) => e.ts >= cutoff);
		if (recent.length === 0) {
			return this.instanceData.useChinesePrompt
				? `过去 ${minutes} 分钟内没有可见的编辑或打开记录。`
				: `No edits or file opens detected in the last ${minutes} minutes.`;
		}

		// Group by type and file (basename)
		const map = new Map<string, Set<string>>();
		for (const ev of recent) {
			const name = ev.path.split("/").pop() || ev.path;
			const key = ev.type;
			if (!map.has(key)) map.set(key, new Set());
			map.get(key)!.add(name);
		}

		const parts: string[] = [];
		if (map.has("modify")) {
			const files = Array.from(map.get("modify")!).slice(0, 6).join(", ");
			parts.push(this.instanceData.useChinesePrompt ? `修改了：${files}` : `modified: ${files}`);
		}
		if (map.has("create")) {
			const files = Array.from(map.get("create")!).slice(0, 6).join(", ");
			parts.push(this.instanceData.useChinesePrompt ? `新建：${files}` : `created: ${files}`);
		}
		if (map.has("open")) {
			const files = Array.from(map.get("open")!).slice(0, 6).join(", ");
			parts.push(this.instanceData.useChinesePrompt ? `打开了：${files}` : `opened: ${files}`);
		}

		// If there are more events than listed, append a short note
		if (recent.length > 6) {
			parts.push(this.instanceData.useChinesePrompt ? `以及其他活动` : `and other activity`);
		}

		return parts.join(this.instanceData.useChinesePrompt ? "；" : "; ");
	}

	public getCurrentPageLabel(): string {
		const activeFile = this.app.workspace.getActiveFile();
		if (activeFile) {
			return activeFile.basename;
		}

		const activeLeaf = this.app.workspace.getMostRecentLeaf();
		return activeLeaf?.view?.getDisplayText?.() ?? "当前页面";
	}

	private getFallbackPageRantText(trigger: "timer" | "rightclick"): string {
		const pageLabel = this.getCurrentPageLabel();
		const timerTemplates = this.instanceData.useChinesePrompt
			? [
				`这个页面《${pageLabel}》看起来很忙，但我怀疑它其实在偷偷摸鱼。`,
				`《${pageLabel}》正在努力工作，我看得出来，只是效率像在打盹。`,
				`我盯着《${pageLabel}》半天了，它的进度条好像一直在原地散步。`,
				`《${pageLabel}》今天也在认真营业，不过节奏有点像慢动作回放。`,
			]
			: [
				`This page, ${pageLabel}, looks busy, but I suspect it's secretly taking snack breaks.`,
				`${pageLabel} is working hard. The pace just feels a little like a cat on a windowsill.`,
				`I've been watching ${pageLabel} for a while now, and its progress bar seems to be power-napping.`,
				`${pageLabel} is clearly on the job, but the workflow has strong slow-cooked energy.`,
			];

		const rightClickTemplates = this.instanceData.useChinesePrompt
			? [
				`你点我干嘛？我刚想吐槽《${pageLabel}》呢。`,
				`右键我也没用，${pageLabel} 这页的工作量还是很可疑。`,
				`《${pageLabel}》看起来很忙，我正准备帮你吐槽它。`,
			]
			: [
				`Hey, why the right click? I was just about to roast ${pageLabel}.`,
				`Right-click noted. ${pageLabel} still looks suspiciously overworked.`,
				`I can explain this page's job, but first: ${pageLabel} is giving me busy-but-not-that-busy vibes.`,
			];

		const templates = trigger === "timer" ? timerTemplates : rightClickTemplates;
		return templates[Math.floor(Math.random() * templates.length)];
	}

	private async getCurrentPageContextSnippet(maxChars: number): Promise<string> {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			return "";
		}

		try {
			const rawContent = await this.app.vault.cachedRead(activeFile);
			const normalized = rawContent.replace(/\r\n/g, "\n").trim();
			if (!normalized) {
				return "";
			}

			if (normalized.length <= maxChars) {
				return normalized;
			}

			return `${normalized.slice(0, maxChars)}\n...[内容已截断]`;
		} catch (error) {
			console.error("Failed to read current page content:", error);
			return "";
		}
	}

	public async getPageRantText(trigger: "timer" | "rightclick"): Promise<string> {
		const pageLabel = this.getCurrentPageLabel();
		const pageContext = await this.getCurrentPageContextSnippet(this.instanceData.pageRantContextChars || 1200);
		const activitySummary = this.getRecentActivitySummary(10);
		const generated = await generatePageRantText(
			pageLabel,
			trigger,
			pageContext,
			this.instanceData.pageRantContextChars || 1200,
			activitySummary,
			this.chatmodel,
			this.instanceData.selectedModel || "gpt-5-mini",
			this.instanceData.useChinesePrompt ?? false
		);

		return generated || this.getFallbackPageRantText(trigger);
	}

	public updateChosenModel(selectedModel: string): void {
		this.instanceData.selectedModel = selectedModel.trim() || "gpt-5-mini";
		void this.saveData(this.instanceData);

		try {
			if (!this.instanceData.openAiApiKey) {
				new Notice("Set your OpenAI API key first.");
				this.chatmodel = null;
				return;
			}

			this.chatmodel = initModel(
				this.instanceData.openAiApiKey,
				this.instanceData.openAiBaseUrl,
				this.instanceData.selectedModel || "gpt-5-mini"
			);

			new Notice(`Model set to ${this.instanceData.selectedModel}.`);
		} catch (e) {
			console.error("Failed to initialize model after selection:", e);
			new Notice("Could not initialize model. Check API key, endpoint, and model.");
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
		// eslint-disable-next-line @typescript-eslint/no-unused-vars -- _ is the full regex match, not needed
		const [_, base, num] = match;
		// Capitalize each word
		const name = base
			.split("-")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");

		return name;
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
		if (this.instanceData.openAiApiKey === undefined) {
			this.instanceData.openAiApiKey = "";
		}
		if (this.instanceData.openAiBaseUrl === undefined) {
			this.instanceData.openAiBaseUrl = "https://api.openai.com/v1";
		}
		if (!this.instanceData.selectedModel) {
			this.instanceData.selectedModel = "gpt-5-mini";
		}
		if (this.instanceData.useChinesePrompt === undefined) {
			this.instanceData.useChinesePrompt = false;
		}
		if (this.instanceData.pageRantEnabled === undefined) {
			this.instanceData.pageRantEnabled = false;
		}
		if (this.instanceData.pageRantMinMinutes === undefined) {
			this.instanceData.pageRantMinMinutes = 5;
		}
		if (this.instanceData.pageRantMaxMinutes === undefined) {
			this.instanceData.pageRantMaxMinutes = 20;
		}
		if (this.instanceData.pageRantContextChars === undefined) {
			this.instanceData.pageRantContextChars = 1200;
		}
		if (this.instanceData.pageRantOnlyWhenFocused === undefined) {
			this.instanceData.pageRantOnlyWhenFocused = true;
		}
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
		return this.instanceData.pets || [];
	}

	public async removePetById(id: string): Promise<void> {
		// Filters out the one with the same id
		this.instanceData.pets = this.instanceData.pets.filter(
			(p) => p.id !== id
		);
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
				this.overlayView.startRantLoop();
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
				iterateLeaves?: (
					cb: (l: WorkspaceLeaf) => unknown,
					item: unknown
				) => unknown;
			}
		).iterateLeaves;
		if (typeof iterate !== "function") return false;

		let hasSibling = false;
		iterate.call(
			this.app.workspace,
			(l: WorkspaceLeaf) => {
				if (l !== leaf) hasSibling = true;
			},
			parent
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
