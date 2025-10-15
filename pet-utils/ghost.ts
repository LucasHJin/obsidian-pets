import { Pet } from "./pet";
import { AnimationConfig } from "./pet";

export class Ghost extends Pet {
	constructor(
		container: Element,
		animations: Record<string, AnimationConfig>,
		moveDist: number,
		backgroundName: string,
		petId: string,
		scale: number
	) {
		super(
			container,
			animations,
			moveDist,
			backgroundName,
			petId,
			scale
		);
	}

	// Only need to setup idle action
	protected setupActions() {
		this.animations["idle"].action = async () => {
			this.setAnimation("idle");
			// Delay for one cycle so it doesn't instantly switch again
			await new Promise((res) =>
				setTimeout(res, this.animations["idle"].duration)
			);
		};
	}

	// Only idle + occasionally move
	protected async startActionLoop() {
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
			await this.animations["idle"].action?.();
			const delay2 = 2000 + Math.random() * 3000;
			await new Promise((res) => setTimeout(res, delay2));
		}
	}

	public async destroy() {
		if (this.isDestroyed) return;
		this.isDestroyed = true;

		// Fade out and then remove (to replace death animation)
		this.petEl.setCssProps({
			transition: "opacity 1s ease",
			opacity: "0"
		});
		setTimeout(() => {
			this.petEl.remove();
		}, 1000);
	}
}