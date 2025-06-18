import { Modal, App } from "obsidian";

// Type for selectable option
export interface SelectorOption {
	value: string;
	label: string;
	requiresName?: boolean;
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
