import PetPlugin, { PetInstance } from "./main";
import { Pet } from "./pet-utils/pet";
import { Cat } from "./pet-utils/cat";
import { Bunny } from "./pet-utils/bunny";
import { Ghost } from "./pet-utils/ghost";
import { Ball } from "./pet-utils/ball";
import {
	getCatAnimations,
	getBunnyAnimations,
	getGhostAnimations,
	getBallAnimations,
} from "./pet-utils/pet-animations";

export class OverlayPetView {
	private overlayEl: HTMLElement;
	private plugin: PetPlugin;
	pets: { id: string; pet: Pet }[] = [];
	balls: { id: string; ball: Ball }[] = [];
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

			if (singlePet.type.includes("cat")) {
				const catAnimations = getCatAnimations(singlePet.type);
				const moveDist = Math.floor(Math.random() * 20) + 25;
				const cat = new Cat(
					this.overlayEl,
					catAnimations,
					moveDist,
					"overlay",
					cleanPetId,
					this.plugin.instanceData.petSize,
					singlePet.name,
					singlePet.type.includes("witch"),
					() => this.plugin.getPageRantText("rightclick")
				);
				this.pets.push({ id: singlePet.id, pet: cat });
			} else if (singlePet.type.includes("bunny")) {
				const bunnyAnimations = getBunnyAnimations(singlePet.type);
				const moveDist = Math.floor(Math.random() * 30) + 45;
				const bunny = new Bunny(
					this.overlayEl,
					bunnyAnimations,
					moveDist,
					"overlay",
					cleanPetId,
					this.plugin.instanceData.petSize,
						singlePet.name,
					() => this.plugin.getPageRantText("rightclick")
				);
				this.pets.push({ id: singlePet.id, pet: bunny });
			} else if (singlePet.type.includes("ghost")) {
				const ghostAnimations = getGhostAnimations(singlePet.type);
				const moveDist = Math.floor(Math.random() * 20) + 20;
				const ghost = new Ghost(
					this.overlayEl,
					ghostAnimations,
					moveDist,
					"overlay",
					cleanPetId,
					this.plugin.instanceData.petSize,
					singlePet.name,
					() => this.plugin.getPageRantText("rightclick")
				);
				this.pets.push({ id: singlePet.id, pet: ghost });
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

	spawnBall(type: string) {
		try {
			const cleanBallId = type.replace(/^toys\//, "");
			const ballAnimation = getBallAnimations(cleanBallId);
			const ball = new Ball(
				this.overlayEl,
				ballAnimation,
				cleanBallId,
				"overlay",
				this.plugin.instanceData.petSize
			);
			this.balls.push({ id: cleanBallId, ball });

			const cats = this.pets.filter((p) => p.pet instanceof Cat);
			if (cats.length > 0) {
				const randomCat = cats[
					Math.floor(Math.random() * cats.length)
				].pet as Cat;
				randomCat.startChasingBall(ball);
				ball.onDestroy = () => {
					randomCat.stopChasingBall();
					const index = this.balls.findIndex((b) => b.id === cleanBallId);
					if (index !== -1) {
						this.balls.splice(index, 1);
					}
				};
			}
		} catch (error) {
			console.error("Failed to add ball to overlay:", error);
		}
	}

	startCursorFollow(getCursorX: () => number) {
		for (const { pet } of this.pets) {
			if (pet instanceof Cat) {
				pet.startFollowingCursor(getCursorX);
			}
		}
	}

	stopCursorFollow() {
		for (const { pet } of this.pets) {
			if (pet instanceof Cat) {
				pet.stopFollowingCursor();
			}
		}
	}

	updatePetSize() {
		for (const { pet } of this.pets) {
			pet.scale = this.plugin.instanceData.petSize;
			pet.petEl?.setCssProps({
				"--scale": `${this.plugin.instanceData.petSize}`,
			});
		}
		for (const { ball } of this.balls) {
			if (ball.ballEl) {
				ball.scale = this.plugin.instanceData.petSize;
				ball.ballEl.setCssProps({
					"--scale": `${this.plugin.instanceData.petSize}`,
				});
			}
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
		for (const { ball } of this.balls) {
			ball.destroy();
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
				if (this.plugin.instanceData.pageRantEnabled) {
					// If configured, suppress rants when Obsidian window is not focused/backgrounded
					if (this.plugin.instanceData.pageRantOnlyWhenFocused && !activeDocument.hasFocus()) {
						scheduleNext();
						return;
					}
					const cats = this.pets.filter(({ pet }) => pet instanceof Cat);
					const targets = cats.length > 0 ? cats : this.pets;
					const target = targets[Math.floor(Math.random() * targets.length)]?.pet;
					if (target) {
						void this.plugin.getPageRantText("timer").then((text) => {
							if (text) {
								target.showSpeechBubble(text);
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
