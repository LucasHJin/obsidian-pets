import { Pet } from "./pet";

export class Cat extends Pet {
	protected configureAnimations() {
		for (const key in this.animations) {
			this.animations[key].action = async (multiples = 1) => {
				this.setAnimation(key);
				if (key === "run") {
					// Call the moving multiple times
					for (let i = 0; i < multiples; i++) {
						await this.move(this.animations[key].duration, key);
					}
				} else if (key === "jump") {
					// Move once
					await this.move(this.animations[key].duration, key);
				} else if (key === "sit" || key === "sleep") {
					const extensionAmount = Math.floor(Math.random() * 10) + 5;
					// Wait to make sure action has time to occur
					await new Promise((resolve) =>
						setTimeout(
							resolve,
							this.animations[key].duration * extensionAmount
						)
					);
				} else if (key !== "die") {
					// Idleing animation (not death)
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
