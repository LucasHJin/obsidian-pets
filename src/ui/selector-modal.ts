import { App, FuzzyMatch, FuzzySuggestModal } from "obsidian";
import { AnimationConfig } from "../pets/pet";

export type SelectorPreview =
	{ kind: "sprite"; animation: AnimationConfig } | { kind: "thumbnail"; url?: string };

export interface SelectorOption {
	value: string;
	label: string;
	preview?: SelectorPreview;
}

export class SelectorModal extends FuzzySuggestModal<SelectorOption> {
	constructor(
		app: App,
		private readonly options: SelectorOption[],
		placeholder: string,
		private readonly onChoose: (value: string) => void,
	) {
		super(app);
		this.setPlaceholder(placeholder);
	}

	override getItems(): SelectorOption[] {
		return this.options;
	}

	override getItemText(option: SelectorOption): string {
		return option.label;
	}

	override renderSuggestion(match: FuzzyMatch<SelectorOption>, el: HTMLElement): void {
		const preview = match.item.preview;
		if (!preview) {
			super.renderSuggestion(match, el);
			return;
		}
		el.addClass("pixel-pets-suggestion");
		if (preview.kind === "sprite") {
			this.renderSprite(el, preview.animation);
		} else {
			this.renderThumbnail(el, preview.url);
		}
		super.renderSuggestion(match, el.createDiv({ cls: "pixel-pets-suggestion__label" }));
	}

	override onChooseItem(option: SelectorOption): void {
		this.onChoose(option.value);
	}

	private renderSprite(el: HTMLElement, animation: AnimationConfig) {
		const sprite = el.createDiv({ cls: "pixel-pets-suggestion__sprite" });
		sprite.setCssProps({
			"--pixel-pets-sprite-url": `url(${animation.spriteUrl})`,
			"--pixel-pets-sprite-size": `${animation.frameCount * animation.frameWidth}px auto`,
			"--pixel-pets-sprite-total-width": `-${animation.frameCount * animation.frameWidth}px`,
			"--pixel-pets-sprite-duration": `${animation.duration}ms`,
			"--pixel-pets-frame-count": `${animation.frameCount}`,
		});
	}

	private renderThumbnail(el: HTMLElement, url: string | undefined) {
		const thumbnail = el.createDiv({ cls: "pixel-pets-suggestion__thumbnail" });
		if (url) {
			thumbnail.createEl("img", { attr: { src: url, alt: "", loading: "lazy" } });
		} else {
			thumbnail.addClass("pixel-pets-suggestion__thumbnail--empty");
		}
	}
}
