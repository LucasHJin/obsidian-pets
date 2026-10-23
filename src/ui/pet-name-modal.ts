import { App, ButtonComponent, Modal } from "obsidian";
import { AnimationConfig } from "../pets/pet";
import { createSprite, getCenteringOffset, getSpriteBounds } from "./sprite-preview";

const PREVIEW_SCALE = 3;

export class PetNameModal extends Modal {
	private inputEl: HTMLInputElement | null = null;

	constructor(
		app: App,
		private readonly animation: AnimationConfig | undefined,
		private readonly onSubmit: (name: string) => void,
	) {
		super(app);
	}

	override onOpen(): void {
		this.setTitle("Name your pet");

		const preview = this.contentEl.createDiv({ cls: "pixel-pets-name-preview" });
		if (this.animation) {
			this.renderPet(preview, this.animation);
		}
		const tooltip = preview.createDiv({ cls: "pixel-pets-name-preview__tooltip" });
		const input = tooltip.createEl("input", {
			cls: "pixel-pets-name-preview__input",
			attr: { type: "text", "aria-label": "Pet name", spellcheck: "false" },
		});
		input.addEventListener("keydown", (evt) => {
			if (evt.key === "Enter" && !evt.isComposing) {
				evt.preventDefault();
				this.submit();
			}
		});
		preview.addEventListener("pointerdown", (evt) => {
			if (evt.target !== input) {
				evt.preventDefault();
				input.focus();
			}
		});
		this.inputEl = input;

		new ButtonComponent(this.contentEl.createDiv({ cls: "modal-button-container" }))
			.setButtonText("Add pet")
			.setCta()
			.onClick(() => this.submit());

		input.focus();
	}

	override onClose(): void {
		this.inputEl = null;
		this.contentEl.empty();
	}

	private renderPet(preview: HTMLElement, animation: AnimationConfig): void {
		createSprite(preview, "pixel-pets-name-preview__sprite", animation, PREVIEW_SCALE);
		void getSpriteBounds(animation).then((bounds) => {
			if (!bounds) {
				return;
			}
			preview.setCssProps({
				"--pixel-pets-sprite-offset-x": `${getCenteringOffset(bounds).x * PREVIEW_SCALE}px`,
				"--pixel-pets-sprite-head": `${(bounds.height - bounds.top) * PREVIEW_SCALE}px`,
			});
		});
	}

	private submit(): void {
		const name = this.inputEl?.value.trim();
		if (!name) {
			this.inputEl?.focus();
			return;
		}

		this.close();
		this.onSubmit(name);
	}
}
