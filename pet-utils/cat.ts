import { Pet, AnimationConfig } from "./pet";
import { Ball } from "./ball";

export class Cat extends Pet {
    private canFly: boolean;
    private chasingBall: Ball | null = null;
    private interruptAction = false;
    private currentActionCancel?: () => void;

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

				// Create a cancelled flag and a function to cancel it
                let cancelled = false;
                const cancel = () => { cancelled = true; };
                this.currentActionCancel = cancel;
                const checkInterrupt = () => cancelled || this.interruptAction; // True if cancelled or interrupted -> check the interrupt for each action

                if (key === "run" || key === "fly") {
					// Call the moving multiple times
                    for (let i = 0; i < multiples; i++) {
                        if (checkInterrupt()) break;
                        await this.move(this.animations[key].duration, key);
                    }
                } else if (key === "jump" || key === "jump2") {
                    if (!checkInterrupt()) {
                        await this.move(this.animations[key].duration, key);
                    }
                } else if (key === "sit" || key === "sleep") {
                    const extensionAmount = Math.floor(Math.random() * 8) + 5;
                    for (let i = 0; i < extensionAmount; i++) {
                        if (checkInterrupt()) break;
                        await new Promise((resolve) =>
                            setTimeout(resolve, this.animations[key].duration)
                        );
                    }
                } else {
                    const extensionAmount = Math.floor(Math.random() * 2) + 2;
                    for (let i = 0; i < extensionAmount; i++) {
                        if (checkInterrupt()) break;
                        await new Promise((resolve) =>
                            setTimeout(resolve, this.animations[key].duration)
                        );
                    }
                }

                this.currentActionCancel = undefined;
            };
        }
    }

	// Function to start chasing the ball
    public startChasingBall(ball: Ball) {
        this.chasingBall = ball;
        this.interruptAction = true;
        if (this.currentActionCancel) {
            this.currentActionCancel(); // Immediately cancel current action
        }
    }
	// Function to stop chasing the ball
    public stopChasingBall() {
        this.chasingBall = null;
        this.interruptAction = false;
    }

	// Overwrite action loop function to add flying for witch cat + chasing ball logic
    protected async startActionLoop() {
        function getRandDelay(
            min: number,
            max: number,
            multiple: number
        ): number {
            const random = Math.random() * (max - min) + min;
            return Math.round(random / multiple) * multiple;
        }

        const ACTIONS = Object.keys(this.animations).filter(
            (a) => a !== "die" && a !== "run" && a !== "fly"
        );

        while (!this.isDestroyed) {
			// Check if the cat should be chasing a ball
			if (this.chasingBall) {
				// Reset interrupt immediately so it doesn't stop the loop ahead of time
				this.interruptAction = false;
				// Chase the ball until it's destroyed
				while (this.chasingBall && !this.isDestroyed) {
					await this.chaseBall();
					await new Promise(res => setTimeout(res, 100)); // Small delay to avoid tight loop
				}
				// Go back to normal behavior
				this.setAnimation("idle");
			} else {
				// Normal behavior
				const randomAction =
					ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
				await this.animations[randomAction].action?.();

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

	// Function to chase the ball
    private async chaseBall() {
		if (!this.chasingBall) {
			return;
		}
		// Container boundaries (stay within the leaf)
		const petWidth = this.animations["idle"].frameWidth;
		const containerWidth = (this.container as HTMLElement).offsetWidth;
		const minLeft = petWidth / 2;
		const maxLeft = containerWidth - petWidth / 2;

		// Move towards the ball in small steps (less steps = more smooth)
		const steps = 3;
		for (let i = 0; i < steps; i++) {
			if (!this.chasingBall) {
				break;
			}

			// Calculate direction and how much to move
			const ballPos = this.chasingBall.getPosition();
			const dx = ballPos.x - (this.currentX ?? 0);
			this.direction = dx < 0 ? -1 : 1;
			const moveAmount = Math.sign(dx) * Math.min(Math.abs(dx), this.moveDist);

			// Clamp the new position to within the boundaries 
			let newX = this.currentX + moveAmount;
			if (newX < minLeft) newX = minLeft;
			if (newX > maxLeft) newX = maxLeft;
			this.currentX = newX;

			// Apply the running animation and movement
			this.petEl.setCssProps({
				"--left": `${this.currentX}px`,
				"--scale-x": `${this.direction}`,
			});
			this.setAnimation("run");

			// Wait a second to make it more smooth (not teleporting)
			await new Promise(res => setTimeout(res, 200));
			if (this.interruptAction) {
				break;
			}
		}
		this.setAnimation("idle");
	}
}