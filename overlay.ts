import PetPlugin, { PetInstance } from "./main";
import { RenderablePet, createRenderablePet } from "./pet-utils/pet-factory";

export class OverlayPetView {
	private overlayEl: HTMLElement;
	private plugin: PetPlugin;
	pets: { id: string; type: string; pet: RenderablePet }[] = [];
	private resizeHandler: () => void;
	private resizeTimer: ReturnType<typeof setTimeout> | null = null;
	private rantLoopTimeout: ReturnType<typeof activeWindow.setTimeout> | null = null;

	constructor(plugin: PetPlugin) {
		this.plugin = plugin;
		this.overlayEl = activeDocument.body.createDiv({ cls: "pet-overlay-container" });
		this.updateOverlayBounds();

		this.resizeHandler = () => {
			if (this.resizeTimer !== null) activeWindow.clearTimeout(this.resizeTimer);
			this.resizeTimer = activeWindow.setTimeout(async () => {
				this.resizeTimer = null;
				this.updateOverlayBounds();
				await Promise.all(this.pets.map(({ pet }) => pet.clampToContainer()));
			}, 100);
		};
		window.addEventListener("resize", this.resizeHandler);
	}

	// Lowers the overlay bound to not cover Obsidian top drag region (Electron's drag region ignores pointer events)
	private updateOverlayBounds() {
		const selectors = [".titlebar", ".workspace-tab-header-container"]; // Need second selector for mac
		const candidates: HTMLElement[] = [];
		for (const sel of selectors) {
			candidates.push(...Array.from(activeDocument.body.querySelectorAll<HTMLElement>(sel)));
		}

		let topOffset = 0;
		for (const el of candidates) {
			const style = getComputedStyle(el);
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

	addPet(singlePet: PetInstance) {
		try {
			const cleanPetId = singlePet.id.replace(/^pets\//, "");
			const pet = createRenderablePet(
				this.overlayEl,
				singlePet.type,
				"overlay",
				cleanPetId,
				this.plugin.instanceData.petSize,
				singlePet.name,
				() => this.plugin.getPageRantText("rightclick", singlePet.type),
				this.plugin.instanceData.petSpeed,
				() => this.plugin.instanceData.petSpeechEnabled ?? true,
			);
			if (pet) {
				this.pets.push({ id: singlePet.id, type: singlePet.type, pet });
			}
		} catch (error) {
			console.error(`Failed to create overlay pet ${singlePet.id}:`, error);
		}
	}

	removePet(id: string) {
		const index = this.pets.findIndex((p) => p.id === id);
		if (index !== -1) {
			void this.pets[index].pet.destroy();
			this.pets.splice(index, 1);
		}
	}

	removeAllPets() {
		for (const { pet } of this.pets) {
			void pet.destroy();
		}
		this.pets = [];
	}

	updatePetSize() {
		for (const { pet } of this.pets) {
			pet.scale = this.plugin.instanceData.petSize;
			pet.petEl?.setCssProps({
				"--scale": `${this.plugin.instanceData.petSize}`,
			});
		}
	}

	updatePetSpeed() {
		for (const { pet } of this.pets) {
			pet.speedMultiplier = this.plugin.instanceData.petSpeed;
		}
	}

	destroy() {
		window.removeEventListener("resize", this.resizeHandler);
		if (this.resizeTimer !== null) {
			activeWindow.clearTimeout(this.resizeTimer);
			this.resizeTimer = null;
		}
		if (this.rantLoopTimeout !== null) {
			activeWindow.clearTimeout(this.rantLoopTimeout);
			this.rantLoopTimeout = null;
		}
		for (const { pet } of this.pets) {
			void pet.destroy();
		}
		this.overlayEl.remove();
	}

	startRantLoop() {
		const scheduleNext = () => {
			const minMinutes = Math.min(
				this.plugin.instanceData.pageRantMinMinutes || 5,
				this.plugin.instanceData.pageRantMaxMinutes || 20
			);
			const maxMinutes = Math.max(
				this.plugin.instanceData.pageRantMinMinutes || 5,
				this.plugin.instanceData.pageRantMaxMinutes || 20
			);
			const minMs = minMinutes * 60 * 1000;
			const maxMs = maxMinutes * 60 * 1000;
			const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;

			this.rantLoopTimeout = activeWindow.setTimeout(() => {
				if (this.plugin.instanceData.pageRantEnabled && (this.plugin.instanceData.petSpeechEnabled ?? true)) {
					// If configured, suppress rants when Obsidian window is not focused/backgrounded
					if (this.plugin.instanceData.pageRantOnlyWhenFocused && !activeDocument.hasFocus()) {
						scheduleNext();
						return;
					}
					const target = this.pets[Math.floor(Math.random() * this.pets.length)];
					if (target) {
						void this.plugin.getPageRantText("timer", target.type).then((text) => {
							if (text) {
								target.pet.showSpeechBubble(text);
							}
						});
					}
				}
				scheduleNext();
			}, delay);
		};

		scheduleNext();
	}
}
