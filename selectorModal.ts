import { Modal, App } from "obsidian";

// Type for selectable option
export interface SelectorOption {
	value: string;
	label: string;
}

export class SelectorModal extends Modal {
	options: SelectorOption[]; // Array of options
	onSelect: (value: string) => Promise<void>; // Expects a function that takes a string and returns a promise (callback to chooser function)

	constructor(
		app: App,
		options: SelectorOption[],
		onSelect: (value: string) => Promise<void>
	) {
		super(app);
		this.options = options;
		this.onSelect = onSelect;
	}

	// Show modal options on open
	onOpen() {
		const { contentEl } = this;

		for (const option of this.options) {
			// Make the button
			const button = contentEl.createEl("button", {
				text: option.label,
			});

			// Styling
			button.style.all = "unset";
			button.style.cursor = "pointer";
			button.style.display = "block";
			button.style.width = "100%";
			button.style.padding = "1vh 0";
			button.style.margin = "0.5vh 0";
			button.style.borderRadius = "8px";
			button.style.transition = "background-color 0.4s ease";
			button.style.textAlign = "center";
			button.style.lineHeight = "normal";
			button.style.fontSize = "1.1em";
			button.addEventListener("mouseenter", () => {
				button.style.backgroundColor =
					"var(--background-secondary-alt)";
			});
			button.addEventListener("mouseleave", () => {
				button.style.backgroundColor = "var(--background-primary)";
			});

			// Call the chooser function when it is clicked
			button.addEventListener("click", async () => {
				await this.onSelect(option.value);
				this.close();
			});
		}
	}

	// Clean up DOM on modal close
	onClose() {
		this.contentEl.empty();
	}
}
