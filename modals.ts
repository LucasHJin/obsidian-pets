import { Modal, App } from "obsidian";
import { MarkdownRenderer } from "obsidian"; // For rendering markdown in chat messages
import { ConversationMessage } from "main";

// Type for selectable option
export interface SelectorOption {
	value: string;
	label: string;
	requiresName?: boolean;
}

export interface ChatMessage {
	sender: "user" | "bot";
	text: string;
}

export class SelectorModal extends Modal {
	options: SelectorOption[]; // Array of options
	onSubmit: (value: string, name: string) => Promise<void>; // Expects a function that takes a value and name and returns a promise (callback to chooser function)

	constructor(
		app: App,
		options: SelectorOption[],
		onSubmit: (value: string, name: string) => Promise<void>
	) {
		super(app);
		this.options = options;
		this.onSubmit = onSubmit;
	}

	// Show modal options on open
	onOpen() {
		const { contentEl } = this;

		for (const option of this.options) {
			// Make the button
			const button = contentEl.createEl("button", {
				text: option.label,
				cls: "selector-button",
			});

			// Call the chooser function when it is clicked
			button.addEventListener("click", () => {
				if (option.requiresName) {
					this.showNameForm(option.value);
				} else {
					// No name needed (background)
					this.onSubmit(option.value, "");
					this.close();
				}
			});
		}
	}

	// Form to enter the pet's name
	private showNameForm(selectedValue: string) {
		const { contentEl } = this;
		contentEl.empty();

		const container = contentEl.createDiv({
			cls: "pet-name-form-container",
		});

		// Title
		container.createEl("div", {
			text: "Enter a name:",
			cls: "pet-name-title setting-item-heading",
		});

		// Input form
		const form = container.createEl("form", {
			cls: "pet-name-form",
		});
		const input = form.createEl("input", {
			type: "text",
			placeholder: "Pet name...",
			cls: "pet-name-input",
		});
		input.focus();

		// Button to submit
		form.createEl("button", {
			type: "submit",
			text: "Submit",
			cls: "pet-name-button",
		});

		form.addEventListener("submit", async (e) => {
			e.preventDefault();
			// Prevent submitting blank name
			const name = input.value.trim();
			if (!name) {
				return;
			}

			// Call function to use the selected type and pet name
			await this.onSubmit(selectedValue, name);
			this.close();
		});
	}

	// Clean up DOM on modal close
	onClose() {
		this.contentEl.empty();
	}
}

export class ChatModal extends Modal {
	messages: ChatMessage[] = [];
	plugin: any;
	private conversationHistory: ConversationMessage[] = []; 
	private activeTypingInterval: ReturnType<typeof setInterval> | null = null;
	onMessage: (message: string, history: ConversationMessage[]) => Promise<string>

	constructor(app: App, plugin: any, onMessage: (message: string, history: ConversationMessage[]) => Promise<string>) {
		super(app);
		this.plugin = plugin;
		this.onMessage = onMessage;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
        this.conversationHistory = [];

		contentEl.addClass("pp-chat-modal-content");

		const chatContainer = contentEl.createDiv({ cls: "chat-messages" });
		
		this.addMessage("bot", 
			`/\\_/\\ ♥
>^.^<   ~meow~
/   \\
(___)_/
-------

you're my meeeooooowwwwner~
Cat (chat) with me anything about~
(except about rats, I hate them)~`,
			chatContainer);

		const form = contentEl.createEl("form", { cls: "chat-form" });

		const textarea = form.createEl("textarea", {
			placeholder: "Type your message...",
			cls: "chat-input",
		});
		textarea.rows = 1;
		textarea.focus();

		form.createEl("button", {
			type: "submit",
			text: "Send",
			cls: "chat-send-button",
		});

		// Handle message being sent
		form.addEventListener("submit", async (e) => {
			e.preventDefault();
			const text = textarea.value.trim();
			if (!text) {
				return;
			}

			await this.addMessage("user", text, chatContainer);

			textarea.value = "";

			// Typing 
			const typingAnimation = this.showTypingIndicator(chatContainer);
			const response = await this.onMessage(text, this.conversationHistory);
			this.removeTypingIndicator(typingAnimation);

			// Context of the conversation
			this.conversationHistory.push({
				role: "user",
				content: text,
				timestamp: Date.now()
			});
			this.conversationHistory.push({
				role: "assistant",
				content: response,
				timestamp: Date.now()
			});

			// Keep recent 8 messages max (avoid overflow context window)
			if (this.conversationHistory.length > 8) {
				this.conversationHistory = this.conversationHistory.slice(-8);
			}

			await this.addMessage("bot", response, chatContainer); // Wait for response from the bot

			// Scroll to bottom
			setTimeout(() => {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}, 0);
		});
	}

	private async addMessage(sender: "user" | "bot", text: string, container: HTMLElement) {
		this.messages.push({ sender, text });

		const messageBox = container.createDiv({
			cls: `chat-message ${sender}`,
		});

		// Different font styling for bot
		if (sender === "bot" && text.includes(">^.^<")) {
			const pre = messageBox.createEl("pre"); // So that line width isn't affected afterwards
			pre.setText(text);
		} else if (sender === "bot" && !text.includes(">^.^<")){
			await MarkdownRenderer.render(
				this.app,
				text,
				messageBox,
				"", 
				this.plugin 
			);
		} else {
			messageBox.setText(text);
		}

		messageBox.scrollIntoView({ behavior: "smooth" });
	}

	// Function to show typing indicator while waiting for bot response
	private showTypingIndicator(container: HTMLElement): HTMLElement {
		const typingBox = container.createDiv({
			cls: "chat-message bot",
		});

		const span = typingBox.createSpan();
		let dots = 0;
		const interval = setInterval(() => {
			dots = (dots + 1) % 3;
			span.setText("meow." + ".".repeat(dots));
		}, 400);

		// Attach interval reference so we can stop it later (use any to avoid TS error)
		(typingBox as any)._typingInterval = interval;
		this.activeTypingInterval = interval;
		return typingBox;
	}

	private removeTypingIndicator(typingBox: HTMLElement) {
		const interval = (typingBox as any)._typingInterval;
		if (interval) {
			clearInterval(interval); // Clean up the interval animation
		}
		this.activeTypingInterval = null;
		typingBox.remove();
	}

	onClose() {
		if (this.activeTypingInterval) {
			clearInterval(this.activeTypingInterval);
			this.activeTypingInterval = null;
		}

		this.contentEl.empty();
	}
}
