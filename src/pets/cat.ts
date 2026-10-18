import { Pet, AnimationName, PetAnimations } from "./pet";
import { Ball } from "../toys/ball";
import { Floor } from "../floor";
import { playPetSound } from "../audio/sounds";

export class Cat extends Pet {
	private canFly: boolean;
	private chasingBall: Ball | null = null;
	private interruptAction = false;

	constructor(
		container: HTMLElement,
		animations: PetAnimations,
		moveDist: number,
		floor: Floor,
		scale: number,
		petName: string,
		canFly = false,
	) {
		super(container, animations, moveDist, floor, scale, petName);
		this.canFly = canFly;
	}

	protected override async performAction(name: AnimationName, repeats = 1): Promise<void> {
		const animation = this.animations[name];
		if (!animation) return;
		this.setAnimation(name);

		switch (name) {
			case "run":
			case "fly":
				for (let i = 0; i < repeats; i++) {
					if (this.interruptAction) break;
					await this.move(animation.duration, name);
				}
				break;
			case "jump":
			case "jump2":
				if (!this.interruptAction) {
					await this.move(animation.duration, name);
				}
				break;
			case "sit":
			case "sleep": {
				const extensionAmount = Math.floor(Math.random() * 8) + 5;
				for (let i = 0; i < extensionAmount; i++) {
					if (this.interruptAction) break;
					await new Promise((resolve) => window.setTimeout(resolve, animation.duration));
				}
				break;
			}
			default: {
				const extensionAmount = Math.floor(Math.random() * 2) + 2;
				for (let i = 0; i < extensionAmount; i++) {
					if (this.interruptAction) break;
					await new Promise((resolve) => window.setTimeout(resolve, animation.duration));
				}
			}
		}
	}

	// Play a meow whenever the cat is clicked
	protected override playSound(): void {
		playPetSound("cat");
	}

	override startFollowingCursor(getCursorX: () => number): void {
		super.startFollowingCursor(getCursorX);
		this.interruptAction = true;
	}

	override stopFollowingCursor(): void {
		super.stopFollowingCursor();
		this.interruptAction = false;
	}

	// Function to start chasing the ball
	startChasingBall(ball: Ball) {
		this.chasingBall = ball;
		this.interruptAction = true;
	}
	stopChasingBall(ball: Ball) {
		if (this.chasingBall !== ball) return;
		this.chasingBall = null;
		this.interruptAction = false;
	}

	// Overwrite action loop function to add flying for witch cat + chasing ball logic
	protected override async startActionLoop() {
		function getRandDelay(min: number, max: number, multiple: number): number {
			const random = Math.random() * (max - min) + min;
			return Math.round(random / multiple) * multiple;
		}

		const ACTIONS = this.getAnimationNames().filter(
			(a) => a !== "die" && a !== "run" && a !== "fly",
		);

		while (!this.isDestroyed) {
			// Check if cat should be following the cursor (more important than chasing a ball)
			if (this.chasingCursor) {
				this.interruptAction = false;
				while (this.chasingCursor && !this.isDestroyed) {
					await this.followCursorStep();
					await new Promise((res) => window.setTimeout(res, 100));
				}
				this.freezeAtCurrentPosition();
				this.setAnimation("idle");
			} else if (this.chasingBall) {
				// Check if the cat should be chasing a ball
				// Reset interrupt immediately so it doesn't stop the loop ahead of time
				this.interruptAction = false;
				// Chase the ball until it's destroyed
				while (this.chasingBall && !this.isDestroyed) {
					await this.chaseBall();
					await new Promise((res) => window.setTimeout(res, 100)); // Small delay to avoid tight loop
				}
				// Stop at current position to avoid gliding animation
				this.freezeAtCurrentPosition();
				this.setAnimation("idle");
			} else {
				// Check hover before and after
				while (this.actionLoopPaused && !this.isDestroyed) {
					await new Promise((resolve) => window.setTimeout(resolve, 100));
				}
				if (this.isDestroyed) break;

				// Normal behavior
				const randomAction = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
				await this.performAction(randomAction);

				while (this.actionLoopPaused && !this.isDestroyed) {
					await new Promise((resolve) => window.setTimeout(resolve, 100));
				}
				if (this.isDestroyed) break;

				const movingAnimation = this.canFly ? (Math.random() < 0.3 ? "fly" : "run") : "run";

				const moving = this.requireAnimation(movingAnimation);
				const delay = getRandDelay(3000, 8000, moving.duration);
				await this.performAction(movingAnimation, Math.floor(delay / moving.duration));
				await new Promise((resolve) => window.setTimeout(resolve, 100));
			}
		}
	}

	// Function to chase the ball
	private async chaseBall() {
		if (!this.chasingBall || this.isDestroyed) {
			return;
		}
		const { minLeft, maxLeft } = this.getHorizontalBounds();

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
			this.tooltipEl?.setCssProps({ "--scale-x": `${this.direction}` });
			this.setAnimation("run");

			// Wait a second to make it more smooth (not teleporting)
			await new Promise((res) => window.setTimeout(res, 200));
			if (this.interruptAction) {
				break;
			}
		}
		this.setAnimation("idle");
	}
}
