import { Pet } from "./pet";

export class Bunny extends Pet {
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
				} else if (key === "sit" || key === "sleep" || key === "idle2") {
					const extensionAmount = Math.floor(Math.random() * 9) + 6;
					// Wait to make sure action has time to occur
					await new Promise((resolve) =>
						setTimeout(
							resolve,
							this.animations[key].duration * extensionAmount
						)
					);
				} else if (key !== "die") {
					// Idleing animation
					const extensionAmount = Math.floor(Math.random() * 3) + 3;
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
