import { App, Modal, Setting } from "obsidian";
import { AnimationConfig } from "../pets/pet";
import { createSprite, getCenteringOffset, getSpriteBounds } from "./sprite-preview";

const PREVIEW_SCALE = 3;

export class PetNameModal extends Modal {
	private name = "";
	private tooltipEl: HTMLElement | null = null;

	constructor(
		app: App,
		private readonly animation: AnimationConfig | undefined,
		private readonly onSubmit: (name: string) => void,
	) {
		super(app);
	}

	override onOpen(): void {
		this.setTitle("Name your pet");

		if (this.animation) {
			this.renderPreview(this.animation);
		}

		new Setting(this.contentEl).setName("Name").addText((text) => {
			text.setPlaceholder("Pet name").onChange((value) => {
				this.name = value;
				this.updateTooltip();
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
		this.tooltipEl = null;
		this.contentEl.empty();
	}

	private renderPreview(animation: AnimationConfig): void {
		const preview = this.contentEl.createDiv({ cls: "pixel-pets-name-preview" });
		createSprite(preview, "pixel-pets-name-preview__sprite", animation, PREVIEW_SCALE);
		this.tooltipEl = preview.createDiv({ cls: "pixel-pets-name-preview__tooltip" });
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

	private updateTooltip(): void {
		if (!this.tooltipEl) {
			return;
		}
		const name = this.name.trim();
		this.tooltipEl.setText(name);
		this.tooltipEl.toggleClass("pixel-pets-name-preview__tooltip--visible", name.length > 0);
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
