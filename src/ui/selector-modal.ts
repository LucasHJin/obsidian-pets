import { Modal, App } from "obsidian";

export interface SelectorOption {
	value: string;
	label: string;
	requiresName?: boolean;
}

export class SelectorModal extends Modal {
	options: SelectorOption[];
	onSubmit: (value: string, name: string) => Promise<void>;

	constructor(
		app: App,
		options: SelectorOption[],
		onSubmit: (value: string, name: string) => Promise<void>,
	) {
		super(app);
		this.options = options;
		this.onSubmit = onSubmit;
	}

	override onOpen() {
		const { contentEl } = this;

		for (const option of this.options) {
			const button = contentEl.createEl("button", {
				text: option.label,
				cls: "pixel-pets-selector__button",
			});

			button.addEventListener("click", () => {
				void this.chooseOption(option);
			});
		}
	}

	private async chooseOption(option: SelectorOption) {
		if (option.requiresName) {
			this.showNameForm(option.value);
		} else {
			await this.onSubmit(option.value, "");
			this.close();
		}
	}

	private showNameForm(selectedValue: string) {
		const { contentEl } = this;
		contentEl.empty();

		const container = contentEl.createDiv({
			cls: "pixel-pets-name-form__container",
		});

		container.createDiv({
			text: "Enter a name:",
			cls: "pixel-pets-name-form__title setting-item-heading",
		});

		const form = container.createEl("form", {
			cls: "pixel-pets-name-form",
		});
		const input = form.createEl("input", {
			type: "text",
			placeholder: "Pet name...",
			cls: "pixel-pets-name-form__input",
		});
		input.focus();

		form.createEl("button", {
			type: "submit",
			text: "Submit",
			cls: "pixel-pets-name-form__button",
		});

		form.addEventListener("submit", (e) => {
			e.preventDefault();
			const name = input.value.trim();
			if (!name) {
				return;
			}

			void (async () => {
				await this.onSubmit(selectedValue, name);
				this.close();
			})();
		});
	}

	override onClose() {
		this.contentEl.empty();
	}
}
