import { Pet, AnimationName, PetAnimations } from "./pet";
import { playPetSound } from "../audio/sounds";

export class Bunny extends Pet {
	constructor(
		container: HTMLElement,
		animations: PetAnimations,
		moveDist: number,
		backgroundName: string,
		scale: number,
		petName: string,
	) {
		super(container, animations, moveDist, backgroundName, scale, petName);
	}

	protected override playSound(): void {
		playPetSound("bunny");
	}

	protected override async performAction(name: AnimationName, repeats = 1): Promise<void> {
		const animation = this.animations[name];
		if (!animation) return;
		this.setAnimation(name);

		switch (name) {
			case "run":
				for (let i = 0; i < repeats; i++) {
					await this.move(animation.duration, name);
				}
				break;
			case "jump":
				await this.move(animation.duration, name);
				break;
			case "sit":
			case "sleep":
			case "idle2": {
				const extensionAmount = Math.floor(Math.random() * 7) + 6;
				await new Promise((resolve) =>
					window.setTimeout(resolve, animation.duration * extensionAmount),
				);
				break;
			}
			default: {
				const extensionAmount = Math.floor(Math.random() * 2) + 2;
				await new Promise((resolve) =>
					window.setTimeout(resolve, animation.duration * extensionAmount),
				);
			}
		}
	}
}
