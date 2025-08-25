import { Pet, AnimationConfig } from "./pet";

export class Cat extends Pet {
	private canFly: boolean;

	constructor(
		container: Element,
		animations: Record<string, AnimationConfig>,
		moveDist: number,
		backgroundName: string,
		petId: string,
		canFly = false,
	) {
		super(container, animations, moveDist, backgroundName, petId);
		this.canFly = canFly;
	}
	protected setupActions() {
		// Add the animations with async action functions (allow waiting for the action to finish before proceeding)
		for (const key in this.animations) {
			this.animations[key].action = async (multiples = 1) => {
				this.setAnimation(key);
				if (key === "run" || key === "fly") {
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
					// Idleing + liking animation
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

	// Overwrite action loop function to add flying for witch cat
	protected async startActionLoop() {
		// Gets random delay that is a multiple of the run animation time
		function getRandDelay(
			min: number,
			max: number,
			multiple: number
		): number {
			const random = Math.random() * (max - min) + min;
			return Math.round(random / multiple) * multiple;
		}

		// Possible actions excluding dieing and running
		const ACTIONS = Object.keys(this.animations).filter(
			(a) => a !== "die" && a !== "run" && a !== "fly"
		);

		while (!this.isDestroyed) {
			// Pick and run a random action
			const randomAction =
				ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
			await this.animations[randomAction].action?.();

			// Go back to the movement action (30% is flying -> IF APPLICABLE)

			const movingAnimation = this.canFly
				? Math.random() < 0.3
					? "fly"
					: "run"
				: "run";

			const delay = getRandDelay(
				3000,
				8000,
				this.animations[movingAnimation].duration
			);
			await this.animations[movingAnimation].action?.(
				Math.floor(delay / this.animations[movingAnimation].duration)
			);
		}
	}
}
