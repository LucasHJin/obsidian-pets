import PetPlugin, { PetInstance } from "main";
import { Pet } from "pet-utils/pet";
import { Cat } from "pet-utils/cat";
import { Bunny } from "pet-utils/bunny";
import { Ghost } from "pet-utils/ghost";
import { Ball } from "pet-utils/ball";
import {
	getCatAnimations,
	getBunnyAnimations,
	getGhostAnimations,
	getBallAnimations,
} from "pet-utils/pet-animations";

export class OverlayPetView {
	private overlayEl: HTMLElement;
	private plugin: PetPlugin;
	pets: { id: string; pet: Pet }[] = [];
	balls: { id: string; ball: Ball }[] = [];
	private resizeHandler: () => void;
	private resizeTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(plugin: PetPlugin) {
		this.plugin = plugin;
		this.overlayEl = document.body.createDiv({ cls: "pet-overlay-container" });

		this.resizeHandler = () => {
			if (this.resizeTimer !== null) clearTimeout(this.resizeTimer);
			this.resizeTimer = setTimeout(() => {
				this.resizeTimer = null;
				for (const { pet } of this.pets) {
					pet.clampToContainer();
				}
			}, 100);
		};
		window.addEventListener("resize", this.resizeHandler);
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
					singlePet.type.includes("witch")
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
					singlePet.name
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
					singlePet.name
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
			this.pets[index].pet.destroy();
			this.pets.splice(index, 1);
		}
	}

	removeAllPets() {
		for (const { pet } of this.pets) {
			pet.destroy();
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
			clearTimeout(this.resizeTimer);
			this.resizeTimer = null;
		}
		for (const { pet } of this.pets) {
			pet.destroy();
		}
		for (const { ball } of this.balls) {
			ball.destroy();
		}
		this.overlayEl.remove();
	}
}
