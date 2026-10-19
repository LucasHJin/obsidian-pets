import { App, FuzzySuggestModal } from "obsidian";

export interface SelectorOption {
	value: string;
	label: string;
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

	override onChooseItem(option: SelectorOption): void {
		this.onChoose(option.value);
	}
}
