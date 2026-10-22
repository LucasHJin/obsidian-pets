import { Pet, AnimationName, PetAnimations } from "./pet";
import { Ball } from "../toys/ball";
import { Floor } from "../floor";
import { SoundPlayer } from "../audio/sounds";

const PASS_GUARD_DELAY = 100;
const CHASE_SPEED = 4.5;
const TOY_SPEED = 3.5;
const ARRIVED_DISTANCE = 0.5;
const ESCAPE_DISTANCE = 16;
const MAX_FRAME_MS = 50;

export class Cat extends Pet {
	private canFly: boolean;
	private chasingBall: Ball | null = null;
	private chasingCursor = false;
	private getCursorX: (() => number) | null = null;
	private readonly chaseSpeed: number;
	private readonly toySpeed: number;
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
		this.chaseSpeed = moveDist * CHASE_SPEED;
		this.toySpeed = moveDist * TOY_SPEED * (0.85 + Math.random() * 0.3);
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
			await this.pursue(
				() => (this.chasingCursor && this.getCursorX ? this.getCursorX() : null),
				this.toySpeed,
				false,
			);
			this.setAnimation("idle");
			return true;
		}
		if (this.chasingBall) {
			this.interruptAction = false;
			await this.pursue(
				() => this.chasingBall?.getPosition().x ?? null,
				this.chaseSpeed,
				true,
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
		pounces: boolean,
	): Promise<void> {
		const el = this.requirePetEl();
		let holding = false;
		let settled = false;
		let jumpLeft = 0;
		let lastFrame: number | null = null;
		const arrive = () => {
			settled = pounces ? this.startPounce() : true;
			jumpLeft = settled && pounces ? this.pounceDuration() : 0;
			if (jumpLeft === 0) this.setAnimation("idle");
		};
		while (!this.isDestroyed) {
			if (this.actionLoopPaused) {
				await this.waitWhilePaused();
				lastFrame = null;
				continue;
			}
			const now = await this.nextFrame();
			if (this.isDestroyed) return;
			if (this.actionLoopPaused) continue;
			const elapsed = lastFrame === null ? 0 : Math.min(now - lastFrame, MAX_FRAME_MS);
			lastFrame = now;
			jumpLeft = Math.max(0, jumpLeft - elapsed);
			const jumping = jumpLeft > 0;

			const targetX = getTargetX();
			if (targetX === null) {
				if (jumping) continue;
				return;
			}

			const { minLeft, maxLeft } = this.getHorizontalBounds();
			const goalX = Math.max(minLeft, Math.min(maxLeft, targetX));
			const distance = Math.abs(goalX - this.currentX);
			if (!jumping && holding && distance <= ESCAPE_DISTANCE) {
				if (settled) this.setAnimation("idle");
				else arrive();
				continue;
			}
			if (!jumping && distance > ESCAPE_DISTANCE) {
				holding = false;
				settled = false;
			}

			if (distance >= ARRIVED_DISTANCE) {
				this.direction = goalX < this.currentX ? -1 : 1;
			}
			this.currentX += this.direction * Math.min(distance, (speed * elapsed) / 1000);
			this.setAnimation(jumping ? "jump2" : "run");
			el.setCssProps({
				"--pixel-pets-left": `${this.currentX}px`,
				"--pixel-pets-scale-x": `${this.direction}`,
				"--pixel-pets-move-duration": "0ms",
			});
			this.tooltipEl?.setCssProps({ "--pixel-pets-scale-x": `${this.direction}` });

			if (!holding && Math.abs(goalX - this.currentX) < ARRIVED_DISTANCE) {
				holding = true;
				arrive();
			}
		}
	}

	private pounceDuration(): number {
		return this.animations.jump2?.duration ?? 0;
	}

	private startPounce(): boolean {
		const ball = this.chasingBall;
		const reach = this.animations.idle.frameWidth * this.scale;
		if (!ball || ball.getHeightAboveGround() > reach) return false;
		if (this.animations.jump2) this.setAnimation("jump2");
		return true;
	}
}
