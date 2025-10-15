import { Pet, AnimationConfig } from "./pet";

export class Bunny extends Pet {
    constructor(
        container: Element,
        animations: Record<string, AnimationConfig>,
        moveDist: number,
        backgroundName: string,
        petId: string,
		scale: number
    ) {
        super(container, animations, moveDist, backgroundName, petId, scale);
    }
    protected setupActions() {
		for (const key in this.animations) {
			this.animations[key].action = async (multiples = 1) => {
				this.setAnimation(key);
				if (key === "run") {
					for (let i = 0; i < multiples; i++) {
						await this.move(this.animations[key].duration, key);
					}
				} else if (key === "jump") {
					await this.move(this.animations[key].duration, key);
				} else if (key === "like" || key === "sleep" || key == "liedown") {
					const extensionAmount = Math.floor(Math.random() * 7) + 6;
					await new Promise((resolve) =>
						setTimeout(
							resolve,
							this.animations[key].duration * extensionAmount
						)
					);
				} else {
                    // Idle
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
