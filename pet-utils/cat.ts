import { Pet, AnimationConfig } from "./pet";

export class Cat extends Pet {
	constructor(
		container: Element,
		animations: Record<string, AnimationConfig>,
		moveDist: number,
		backgroundName: string,
		petId: string
	) {
		super(container, animations, moveDist, backgroundName, petId);
	}
	protected setupActions() {
		// Add the animations with async action functions (allow waiting for the action to finish before proceeding)
		for (const key in this.animations) {
			this.animations[key].action = async (multiples = 1) => {
				this.setAnimation(key);
				if (key === "run") {
					// Call the moving multiple times
					for (let i = 0; i < multiples; i++) {
						await this.move(this.animations[key].duration, key);
					}
				} else if (key === "jump" || key === "jump2") {
					// Move once
					await this.move(this.animations[key].duration, key);
				} else if (key === "sit" || key === "sleep") {
					const extensionAmount = Math.floor(Math.random() * 8) + 5;
					// Wait to make sure action has time to occur
					await new Promise((resolve) =>
						setTimeout(
							resolve,
							this.animations[key].duration * extensionAmount
						)
					);
				} else {
					// Idleing animation
					const extensionAmount = Math.floor(Math.random() * 2) + 2;
					await new Promise((resolve) =>
						setTimeout(
							resolve,
							this.animations[key].duration * extensionAmount
						)
					);
				}
			};
		}
	}
}
