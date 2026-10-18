import { Pet, AnimationName, PetAnimations } from "./pet";
import { Ball } from "../toys/ball";
import { Floor } from "../floor";
import { playPetSound } from "../audio/sounds";

const PASS_GUARD_DELAY = 100;

export class Cat extends Pet {
	private canFly: boolean;
	private chasingBall: Ball | null = null;
	private chasingCursor = false;
	private getCursorX: (() => number) | null = null;
	private cursorMoveDist: number;
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
		this.cursorMoveDist = moveDist * (0.7 + Math.random() * 0.6);
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

	startFollowingCursor(getCursorX: () => number): void {
		this.getCursorX = getCursorX;
		this.chasingCursor = true;
		this.interruptAction = true;
	}

	stopFollowingCursor(): void {
		this.chasingCursor = false;
		this.getCursorX = null;
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

	protected override async runPriorityBehaviour(): Promise<boolean> {
		if (this.chasingCursor) {
			this.interruptAction = false;
			while (this.chasingCursor && !this.isDestroyed) {
				await this.followCursorStep();
				await new Promise((res) => window.setTimeout(res, 100));
			}
			this.freezeAtCurrentPosition();
			this.setAnimation("idle");
			return true;
		}
		if (this.chasingBall) {
			this.interruptAction = false;
			while (this.chasingBall && !this.isDestroyed) {
				await this.chaseBall();
				await new Promise((res) => window.setTimeout(res, 100));
			}
			this.freezeAtCurrentPosition();
			this.setAnimation("idle");
			return true;
		}
		return false;
	}

	protected override async runRoutine(): Promise<void> {
		await super.runRoutine();
		if (this.isDestroyed) return;
		await new Promise((resolve) => window.setTimeout(resolve, PASS_GUARD_DELAY));
	}

	protected override routineActions(): AnimationName[] {
		return super.routineActions().filter((name) => name !== "fly");
	}

	protected override movingAnimation(): AnimationName {
		return this.canFly && Math.random() < 0.3 ? "fly" : "run";
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

	private async followCursorStep(): Promise<void> {
		if (!this.getCursorX || this.isDestroyed) return;
		const { minLeft, maxLeft } = this.getHorizontalBounds();

		const targetX = Math.max(minLeft, Math.min(maxLeft, this.getCursorX()));
		const dx = targetX - this.currentX;
		if (Math.abs(dx) < 2) {
			this.setAnimation("idle");
			return;
		}

		this.direction = dx < 0 ? -1 : 1;
		const step = Math.sign(dx) * Math.min(Math.abs(dx), this.cursorMoveDist);
		this.currentX = Math.max(minLeft, Math.min(maxLeft, this.currentX + step));

		this.setAnimation("run");
		this.petEl.setCssProps({
			"--left": `${this.currentX}px`,
			"--scale-x": `${this.direction}`,
		});
		this.tooltipEl?.setCssProps({ "--scale-x": `${this.direction}` });
	}
}
