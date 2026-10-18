import { Pet, AnimationName, PetAnimations } from "./pet";
import { playPetSound } from "../audio/sounds";
import { Floor } from "../floor";

export class Ghost extends Pet {
	constructor(
		container: HTMLElement,
		animations: PetAnimations,
		moveDist: number,
		floor: Floor,
		scale: number,
		petName: string,
	) {
		super(container, animations, moveDist, floor, scale, petName);
	}

	protected override playSound(): void {
		playPetSound("ghost");
	}

	protected override async performAction(name: AnimationName): Promise<void> {
		if (name !== "idle") return;
		this.setAnimation("idle");
		await new Promise((res) => window.setTimeout(res, this.animations["idle"].duration));
	}

	// Only idle + occasionally move
	protected override async startActionLoop() {
		while (!this.isDestroyed) {
			// Random chance: either stay idle or move then idle again
			const shouldMove = Math.random() < 0.9;

			if (shouldMove) {
				const repeats = 3 + Math.floor(Math.random() * 6);
				for (let i = 0; i < repeats; i++) {
					await this.move(this.animations["idle"].duration, "idle");
				}
			}

			// Always idle afterwards (small amount of time)
			await this.performAction("idle");
			const delay2 = 2000 + Math.random() * 3000;
			await new Promise((res) => window.setTimeout(res, delay2));
		}
	}

	override async destroy() {
		if (this.isDestroyed) return;
		this.isDestroyed = true;

		// Fade out and then remove (to replace death animation)
		this.petEl.setCssProps({
			transition: "opacity 1s ease",
			opacity: "0",
		});
		window.setTimeout(() => {
			this.petEl.remove();
		}, 1000);
	}

	override destroyImmediate() {
		if (this.isDestroyed) return;
		this.isDestroyed = true;
		this.petEl?.remove();
	}
}
