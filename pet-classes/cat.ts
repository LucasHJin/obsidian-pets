// Cat.ts
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
		for (const key in this.animations) {
			this.animations[key].action = async (multiples = 1) => {
				this.setAnimation(key);
				if (key === "run") {
					for (let i = 0; i < multiples; i++) {
						await this.move(
							this.animations[key].duration / 1.5,
							key
						);
					}
				} else if (key === "jump") {
					await this.move(this.animations[key].duration, key);
					console.log("The cat did a big jump!");
				} else if (key === "sit" || key === "sleep") {
					const extensionAmount = Math.floor(Math.random() * 12) + 10;
					await new Promise((resolve) =>
						setTimeout(
							resolve,
							this.animations[key].duration * extensionAmount
						)
					);
				} else {
					const extensionAmount = Math.floor(Math.random() * 1) + 1;
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
