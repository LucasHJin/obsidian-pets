import { Pet, AnimationName, PetAnimations } from "./pet";
import { Ball } from "../toys/ball";
import { Floor } from "../floor";
import { SoundPlayer } from "../audio/sounds";

const PASS_GUARD_DELAY = 100;
const STEP_PAUSE = 100;
const CHASE_SPEED = 4.5;
const CATCH_DISTANCE = 4;
const ESCAPE_DISTANCE = 16;
const MAX_FRAME_MS = 50;

export class Cat extends Pet {
	private canFly: boolean;
	private chasingBall: Ball | null = null;
	private chasingCursor = false;
	private getCursorX: (() => number) | null = null;
	private cursorMoveDist: number;
	private readonly chaseSpeed: number;
	private interruptAction = false;

	constructor(
		container: HTMLElement,
		animations: PetAnimations,
		moveDist: number,
		floor: Floor,
		scale: number,
		petName: string,
		sounds: SoundPlayer,
		canFly = false,
	) {
		super(container, animations, moveDist, floor, scale, petName, sounds);
		this.canFly = canFly;
		this.cursorMoveDist = moveDist * (0.7 + Math.random() * 0.6);
		this.chaseSpeed = moveDist * CHASE_SPEED;
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
					await this.sleep(animation.duration);
				}
				break;
			}
			default: {
				const extensionAmount = Math.floor(Math.random() * 2) + 2;
				for (let i = 0; i < extensionAmount; i++) {
					if (this.interruptAction) break;
					await this.sleep(animation.duration);
				}
			}
		}
	}

	protected override playSound(): void {
		this.sounds.playPet("cat");
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
				await this.sleep(STEP_PAUSE);
			}
			this.freezeAtCurrentPosition();
			this.setAnimation("idle");
			return true;
		}
		if (this.chasingBall) {
			this.interruptAction = false;
			await this.pursue(
				() => this.chasingBall?.getPosition().x ?? null,
				this.chaseSpeed,
				() => this.pounce(),
			);
			this.setAnimation("idle");
			return true;
		}
		return false;
	}

	protected override async runRoutine(): Promise<void> {
		await super.runRoutine();
		if (this.isDestroyed) return;
		await this.sleep(PASS_GUARD_DELAY);
	}

	protected override routineActions(): AnimationName[] {
		return super.routineActions().filter((name) => name !== "fly");
	}

	protected override movingAnimation(): AnimationName {
		return this.canFly && Math.random() < 0.3 ? "fly" : "run";
	}

	private nextFrame(): Promise<number> {
		return new Promise((resolve) => window.requestAnimationFrame(resolve));
	}

	private async pursue(
		getTargetX: () => number | null,
		speed: number,
		onCatch: () => Promise<boolean>,
	): Promise<void> {
		const el = this.requirePetEl();
		let caught = false;
		let lastFrame: number | null = null;
		while (!this.isDestroyed) {
			if (this.actionLoopPaused) {
				await this.waitWhilePaused();
				lastFrame = null;
				continue;
			}
			const now = await this.nextFrame();
			const targetX = getTargetX();
			if (targetX === null || this.isDestroyed) return;
			if (this.actionLoopPaused) continue;
			const elapsed = lastFrame === null ? 0 : Math.min(now - lastFrame, MAX_FRAME_MS);
			lastFrame = now;

			const { minLeft, maxLeft } = this.getHorizontalBounds();
			const dx = Math.max(minLeft, Math.min(maxLeft, targetX)) - this.currentX;
			const distance = Math.abs(dx);
			if (distance <= (caught ? ESCAPE_DISTANCE : CATCH_DISTANCE)) {
				if (!caught) {
					caught = await onCatch();
					lastFrame = null;
				}
				continue;
			}
			caught = false;

			this.direction = dx < 0 ? -1 : 1;
			this.currentX += this.direction * Math.min(distance, (speed * elapsed) / 1000);
			this.setAnimation("run");
			el.setCssProps({
				"--pixel-pets-left": `${this.currentX}px`,
				"--pixel-pets-scale-x": `${this.direction}`,
				"--pixel-pets-move-duration": "0ms",
			});
			this.tooltipEl?.setCssProps({ "--pixel-pets-scale-x": `${this.direction}` });
		}
	}

	private async pounce(): Promise<boolean> {
		const ball = this.chasingBall;
		const reach = this.animations.idle.frameWidth * this.scale;
		if (!ball || ball.getHeightAboveGround() > reach) {
			this.setAnimation("idle");
			return false;
		}
		const jump = this.animations.jump2;
		if (jump) {
			this.setAnimation("jump2");
			await this.sleep(jump.duration);
		}
		if (!this.actionLoopPaused) {
			this.setAnimation("idle");
		}
		return true;
	}

	private async followCursorStep(): Promise<void> {
		if (!this.getCursorX || this.isDestroyed) return;
		const el = this.requirePetEl();
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
		el.setCssProps({
			"--pixel-pets-left": `${this.currentX}px`,
			"--pixel-pets-scale-x": `${this.direction}`,
			"--pixel-pets-move-duration": `${STEP_PAUSE}ms`,
		});
		this.tooltipEl?.setCssProps({ "--pixel-pets-scale-x": `${this.direction}` });
	}
}
