import { App, FuzzyMatch, FuzzySuggestModal } from "obsidian";
import { AnimationConfig } from "../pets/pet";
import { createSprite, getCenteringOffset, getSpriteBounds } from "./sprite-preview";

export type SelectorPreview =
	| { kind: "sprite"; animation: AnimationConfig }
	| { kind: "thumbnail"; url?: string }
	| { kind: "image"; url: string };

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
		} else if (preview.kind === "image") {
			this.renderImage(el, preview.url);
		} else {
			this.renderThumbnail(el, preview.url);
		}
		super.renderSuggestion(match, el.createDiv({ cls: "pixel-pets-suggestion__label" }));
	}

	override onChooseItem(option: SelectorOption): void {
		this.onChoose(option.value);
	}

	private renderSprite(el: HTMLElement, animation: AnimationConfig) {
		const sprite = createSprite(el, "pixel-pets-suggestion__sprite", animation);
		void getSpriteBounds(animation).then((bounds) => {
			if (!bounds) {
				return;
			}
			const offset = getCenteringOffset(bounds);
			sprite.setCssProps({
				"--pixel-pets-sprite-offset-x": `${offset.x}px`,
				"--pixel-pets-sprite-offset-y": `${offset.y}px`,
			});
		});
	}

	private renderImage(el: HTMLElement, url: string) {
		el.createEl("img", {
			cls: "pixel-pets-suggestion__image",
			attr: { src: url, alt: "" },
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
