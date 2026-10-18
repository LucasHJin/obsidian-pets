import { Pet, AnimationName, PetAnimations } from "./pet";
import { SoundPlayer } from "../audio/sounds";
import { Floor } from "../floor";

export class Bunny extends Pet {
	constructor(
		container: HTMLElement,
		animations: PetAnimations,
		moveDist: number,
		floor: Floor,
		scale: number,
		petName: string,
		sounds: SoundPlayer,
	) {
		super(container, animations, moveDist, floor, scale, petName, sounds);
	}

	protected override playSound(): void {
		this.sounds.playPet("bunny");
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
