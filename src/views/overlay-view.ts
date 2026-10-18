import PetPlugin from "../main";
import { Stage } from "../stage";

export class OverlayPetView {
	private overlayEl: HTMLElement;
	private doc: Document;
	private win: Window;
	readonly stage: Stage;
	private resizeHandler: () => void;
	private resizeTimer: number | null = null;

	constructor(plugin: PetPlugin, doc: Document) {
		this.doc = doc;
		this.win = doc.win;
		this.overlayEl = doc.body.createDiv({ cls: "pet-overlay-container" });
		this.stage = new Stage(this.overlayEl, plugin, () => "overlay");
		this.updateOverlayBounds();

		this.resizeHandler = () => {
			if (this.resizeTimer !== null) window.clearTimeout(this.resizeTimer);
			this.resizeTimer = window.setTimeout(() => {
				this.resizeTimer = null;
				this.updateOverlayBounds();
				void Promise.all(this.stage.pets.map(({ pet }) => pet.clampToContainer()));
			}, 100);
		};
		this.win.addEventListener("resize", this.resizeHandler);
	}

	// Lowers the overlay bound to not cover Obsidian top drag region (Electron's drag region ignores pointer events)
	private updateOverlayBounds() {
		const selectors = [".titlebar", ".workspace-tab-header-container"]; // Need second selector for mac
		const candidates: HTMLElement[] = [];
		for (const sel of selectors) {
			candidates.push(...Array.from(this.doc.body.querySelectorAll<HTMLElement>(sel)));
		}

		let topOffset = 0;
		for (const el of candidates) {
			const style = this.win.getComputedStyle(el);
			const region =
				style.getPropertyValue("-webkit-app-region") ||
				(style as unknown as Record<string, string>)["webkitAppRegion"] ||
				"";
			if (region !== "drag") continue;
			const rect = el.getBoundingClientRect();
			if (rect.top > 5) continue; // Only elements pinned to the window top
			if (rect.bottom > topOffset) topOffset = rect.bottom;
		}

		this.overlayEl.setCssProps({ "--overlay-top": `${topOffset}px` });
	}

	destroy() {
		this.win.removeEventListener("resize", this.resizeHandler);
		if (this.resizeTimer !== null) {
			window.clearTimeout(this.resizeTimer);
			this.resizeTimer = null;
		}
		void this.stage.destroyPets();
		this.stage.destroyBalls();
		this.overlayEl.remove();
	}
}
