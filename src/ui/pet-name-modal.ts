import { App, Modal, Setting } from "obsidian";

export class PetNameModal extends Modal {
	private name = "";

	constructor(
		app: App,
		private readonly onSubmit: (name: string) => void,
	) {
		super(app);
	}

	override onOpen(): void {
		this.setTitle("Name your pet");

		new Setting(this.contentEl).setName("Name").addText((text) => {
			text.setPlaceholder("Pet name").onChange((value) => {
				this.name = value;
			});
			text.inputEl.addEventListener("keydown", (evt) => {
				if (evt.key === "Enter" && !evt.isComposing) {
					evt.preventDefault();
					this.submit();
				}
			});
			text.inputEl.focus();
		});

		new Setting(this.contentEl).addButton((button) =>
			button
				.setButtonText("Add pet")
				.setCta()
				.onClick(() => this.submit()),
		);
	}

	override onClose(): void {
		this.contentEl.empty();
	}

	private submit(): void {
		const name = this.name.trim();
		if (!name) {
			return;
		}

		this.close();
		this.onSubmit(name);
	}
}
