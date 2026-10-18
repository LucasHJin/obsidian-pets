import PetPlugin from "../main";
import { PetInstance } from "../data";
import { Pet } from "../pets/pet";
import { Cat } from "../pets/cat";
import { Bunny } from "../pets/bunny";
import { Ghost } from "../pets/ghost";
import { Ball } from "../toys/ball";
import {
	getCatAnimations,
	getBunnyAnimations,
	getGhostAnimations,
	getBallAnimations,
} from "../pets/pet-animations";

export class OverlayPetView {
	private overlayEl: HTMLElement;
	private plugin: PetPlugin;
	private doc: Document;
	private win: Window;
	pets: { id: string; pet: Pet }[] = [];
	balls: { id: string; ball: Ball }[] = [];
	private resizeHandler: () => void;
	private resizeTimer: number | null = null;

	constructor(plugin: PetPlugin, doc: Document) {
		this.plugin = plugin;
		this.doc = doc;
		this.win = doc.win;
		this.overlayEl = doc.body.createDiv({ cls: "pet-overlay-container" });
		this.updateOverlayBounds();

		this.resizeHandler = () => {
			if (this.resizeTimer !== null) window.clearTimeout(this.resizeTimer);
			this.resizeTimer = window.setTimeout(() => {
				this.resizeTimer = null;
				this.updateOverlayBounds();
				void Promise.all(this.pets.map(({ pet }) => pet.clampToContainer()));
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

	addPet(singlePet: PetInstance) {
		try {
			if (singlePet.type.includes("cat")) {
				const catAnimations = getCatAnimations(singlePet.type);
				const moveDist = Math.floor(Math.random() * 20) + 25;
				const cat = new Cat(
					this.overlayEl,
					catAnimations,
					moveDist,
					"overlay",
					this.plugin.instanceData.petSize,
					singlePet.name,
					singlePet.type.includes("witch"),
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
					this.plugin.instanceData.petSize,
					singlePet.name,
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
					this.plugin.instanceData.petSize,
					singlePet.name,
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
				"overlay",
				this.plugin.instanceData.petSize,
			);
			this.balls.push({ id: cleanBallId, ball });

			const cats = this.pets.filter((p) => p.pet instanceof Cat);
			if (cats.length > 0) {
				const randomCat = cats[Math.floor(Math.random() * cats.length)].pet as Cat;
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
		this.win.removeEventListener("resize", this.resizeHandler);
		if (this.resizeTimer !== null) {
			window.clearTimeout(this.resizeTimer);
			this.resizeTimer = null;
		}
		for (const { pet } of this.pets) {
			void pet.destroy();
		}
		for (const { ball } of this.balls) {
			ball.destroy();
		}
		this.overlayEl.remove();
	}
}
