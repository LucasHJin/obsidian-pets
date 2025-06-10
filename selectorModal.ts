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
				cls: "selector-button",
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
