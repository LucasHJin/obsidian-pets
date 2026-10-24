import { Pet, AnimationName, PetAnimations } from "./pet";
import { Ball } from "../toys/ball";
import { Countdown } from "../food/countdown";
import { Fish, FishSource } from "../food/fish";
import { Floor } from "../floor";
import { SoundPlayer } from "../audio/sounds";
import {
	CatMouth,
	DEFAULT_HEAD_TOP,
	DEFAULT_MOUTH,
	MOUTH_POSES,
	MouthPose,
	PICKUP_POSE,
	getCatXForFish,
	getHeldFishOrigin,
	getHeldFishOverhang,
	getHeldFishReach,
	getMouthPose,
} from "./mouth";
import { getHeartX, pickHeartRhythm } from "./snack-heart";

const PASS_GUARD_DELAY = 100;
const CHASE_SPEED = 2;
const TOY_SPEED = 3.5;
const REACH_DISTANCE = 4;
const ESCAPE_DISTANCE = 16;
const POUNCE_LEAD = 0.75;
const ACCEL_SECONDS = 0.35;
const SLIDE_SECONDS = 0.5;
const RUN_START = 0.15;
const RUN_STOP = 0.05;
const SNAP_SPEED = 0.25;
const MAX_FRAME_MS = 50;
const HOLD_MIN_MS = 4000;
const HOLD_MAX_MS = 8000;
const REACHED_FISH = 1;

function mouthPoseClass(pose: MouthPose): string {
	return `pixel-pets-pet--mouth-${pose}`;
}

export interface CatOptions {
	flying?: boolean;
	mouth?: CatMouth;
	headTop?: number;
	fish?: FishSource;
}

export class Cat extends Pet {
	private canFly: boolean;
	private readonly mouth: CatMouth;
	private readonly headTop: number;
	private readonly heartRhythm = pickHeartRhythm();
	private readonly fishSource: FishSource | null;
	private claimedFish: Fish | null = null;
	private heldFish: Fish | null = null;
	private snack: Countdown | null = null;
	private snackHeart: HTMLElement | null = null;
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
		options: CatOptions = {},
	) {
		super(container, animations, moveDist, floor, scale, petName, sounds);
		this.canFly = options.flying ?? false;
		this.mouth = options.mouth ?? DEFAULT_MOUTH;
		this.headTop = options.headTop ?? DEFAULT_HEAD_TOP;
		this.fishSource = options.fish ?? null;
		this.chaseSpeed =
			(moveDist / ((animations.run ?? animations.idle).duration / 1000)) * CHASE_SPEED;
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
					if (this.claimedFish) break;
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
		this.abortSnack();
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
		this.abortSnack();
		if (this.chasingBall !== ball) this.chasingBall?.release();
		this.chasingBall = ball;
		this.interruptAction = true;
		ball.chase();
	}
	stopChasingBall(ball: Ball) {
		if (this.chasingBall !== ball) return;
		this.chasingBall = null;
		this.interruptAction = false;
		ball.release();
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
		if (this.claimedFish) {
			await this.collectFish(this.claimedFish);
			return true;
		}
		return false;
	}

	protected override setAnimation(name: AnimationName) {
		if (this.heldFish && this.animations[name] && name !== this.currentAnimation) {
			this.poseHeldFish(name);
		}
		super.setAnimation(name);
	}

	protected override getHorizontalBounds(): { minLeft: number; maxLeft: number } {
		const bounds = super.getHorizontalBounds();
		if (!this.heldFish && !this.claimedFish) return bounds;
		const inset = getHeldFishOverhang(this.mouth) * this.scale;
		if (bounds.maxLeft - bounds.minLeft < inset * 2) return bounds;
		return { minLeft: bounds.minLeft + inset, maxLeft: bounds.maxLeft - inset };
	}

	protected override redirectMove(move: {
		targetX: number;
		action?: AnimationName;
	}): number | null {
		const source = this.fishSource;
		if (!source || move.action !== "run" || this.claimedFish || this.heldFish) {
			return null;
		}
		const direction = move.targetX < this.currentX ? -1 : 1;
		const reach = getHeldFishReach(this.mouth) * this.scale * direction;
		const fish = source.findFishOnPath(this.currentX + reach, move.targetX + reach);
		if (!fish || !source.claimFish(fish)) return null;
		this.claimedFish = fish;
		return this.clampToBounds(getCatXForFish(fish.getX(), direction, this.scale, this.mouth));
	}

	private clampToBounds(x: number): number {
		const { minLeft, maxLeft } = this.getHorizontalBounds();
		return Math.max(minLeft, Math.min(maxLeft, x));
	}

	private async collectFish(fish: Fish): Promise<void> {
		await this.approachFish(fish);
		if (this.isDestroyed || this.claimedFish !== fish) return;
		this.pickUpFish(fish);
	}

	private async approachFish(fish: Fish): Promise<void> {
		await this.waitWhilePaused();
		if (this.isDestroyed || this.claimedFish !== fish) return;
		const goalX = this.clampToBounds(
			getCatXForFish(fish.getX(), this.direction, this.scale, this.mouth),
		);
		const distance = Math.abs(goalX - this.currentX);
		if (distance > REACHED_FISH) {
			const run = this.requireAnimation("run");
			this.setAnimation("run");
			await this.slideTo(goalX, (distance / this.moveDist) * run.duration);
		}
		while (this.isStagePaused() && !this.isDestroyed) {
			await this.waitWhilePaused();
		}
	}

	private pickUpFish(fish: Fish) {
		const el = this.requirePetEl();
		const origin = getHeldFishOrigin(this.mouth, PICKUP_POSE);
		this.claimedFish = null;
		this.heldFish = fish;
		fish.hold(el, origin.x, origin.y);
		this.poseHeldFish(PICKUP_POSE);
		this.setAnimation(PICKUP_POSE);
		this.restartAnimation();
		this.showSnackHeart();
		this.startHold(fish);
	}

	private poseHeldFish(animation: AnimationName) {
		const pose = getMouthPose(animation);
		const el = this.petEl;
		if (!pose || !el || !this.heldFish) return;
		const origin = getHeldFishOrigin(this.mouth, pose);
		this.heldFish.setHeldOrigin(origin.x, origin.y);
		for (const other of MOUTH_POSES) {
			el.toggleClass(mouthPoseClass(other), other === pose);
		}
	}

	private showSnackHeart() {
		const { duration, phase } = this.heartRhythm;
		const heart = this.requirePetEl().createDiv({ cls: "pixel-pets-pet__snack-heart" });
		heart.setCssProps({
			"--pixel-pets-snack-heart-x": `${getHeartX(this.mouth)}px`,
			"--pixel-pets-head-top": `${this.headTop}px`,
			"--pixel-pets-snack-heart-duration": `${duration}ms`,
			"--pixel-pets-snack-heart-delay": `${-Math.round(phase * duration)}ms`,
		});
		this.snackHeart = heart;
	}

	private startHold(fish: Fish) {
		const duration = HOLD_MIN_MS + Math.random() * (HOLD_MAX_MS - HOLD_MIN_MS);
		const countdown = new Countdown(duration, () => void this.finishHold(fish));
		this.snack = countdown;
		if (!this.isStagePaused()) countdown.start();
	}

	private async finishHold(fish: Fish) {
		if (this.heldFish !== fish) return;
		this.snack = null;
		this.snackHeart?.addClass("pixel-pets-pet__snack-heart--fading");
		await fish.fadeOut();
		if (this.heldFish === fish) this.clearHeldLook();
	}

	private clearHeldLook() {
		this.heldFish = null;
		this.snackHeart?.remove();
		this.snackHeart = null;
		for (const pose of MOUTH_POSES) {
			this.petEl?.removeClass(mouthPoseClass(pose));
		}
	}

	private abortSnack() {
		this.snack?.stop();
		this.snack = null;
		const held = this.heldFish;
		const claimed = this.claimedFish;
		this.claimedFish = null;
		held?.destroy();
		claimed?.release();
		this.clearHeldLook();
	}

	override pause() {
		super.pause();
		this.snack?.pause();
	}

	override resume() {
		super.resume();
		this.snack?.start();
	}

	override async destroy() {
		this.abortSnack();
		await super.destroy();
	}

	override destroyImmediate() {
		this.abortSnack();
		super.destroyImmediate();
	}

	protected override async runRoutine(): Promise<void> {
		await super.runRoutine();
		if (this.isDestroyed) return;
		await this.sleep(PASS_GUARD_DELAY);
	}

	protected override routineActions(): AnimationName[] {
		if (this.heldFish) return ["idle"];
		return super.routineActions().filter((name) => name !== "fly");
	}

	protected override movingAnimation(): AnimationName {
		if (this.heldFish) return "run";
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
		const accel = speed / ACCEL_SECONDS;
		const brake = speed / SLIDE_SECONDS;
		const lead = pounces
			? this.animations.idle.frameWidth * this.scale * POUNCE_LEAD
			: REACH_DISTANCE;
		let velocity = 0;
		let running = false;
		let holding = false;
		let settled = false;
		let jumpLeft = 0;
		let lastFrame: number | null = null;
		while (!this.isDestroyed) {
			if (this.actionLoopPaused) {
				await this.waitWhilePaused();
				lastFrame = null;
				velocity = 0;
				continue;
			}
			const now = await this.nextFrame();
			if (this.isDestroyed) return;
			if (this.actionLoopPaused) continue;
			const elapsed = lastFrame === null ? 0 : Math.min(now - lastFrame, MAX_FRAME_MS);
			lastFrame = now;
			const dt = elapsed / 1000;
			const wasJumping = jumpLeft > 0;
			jumpLeft = Math.max(0, jumpLeft - elapsed);
			if (wasJumping && jumpLeft === 0) this.chasingBall?.release();
			const jumping = jumpLeft > 0;

			const targetX = getTargetX();
			if (targetX === null) {
				if (jumping) continue;
				return;
			}

			const { minLeft, maxLeft } = this.getHorizontalBounds();
			const goalX = Math.max(minLeft, Math.min(maxLeft, targetX));
			const offset = goalX - this.currentX;
			if (!jumping && Math.abs(offset) > lead + ESCAPE_DISTANCE) {
				holding = false;
				settled = false;
			}

			const resting = holding && settled && !jumping;
			const wanted = resting
				? 0
				: Math.sign(offset) * Math.min(speed, Math.sqrt(2 * brake * Math.abs(offset)));
			const change = wanted - velocity;
			const slowing = velocity !== 0 && Math.sign(change) !== Math.sign(velocity);
			const limit = (slowing ? brake : accel) * dt;
			velocity += Math.max(-limit, Math.min(limit, change));

			let nextX = this.currentX + velocity * dt;
			const passedGoal = Math.sign(goalX - nextX) !== Math.sign(offset);
			if (!resting && passedGoal && Math.abs(velocity) <= speed * SNAP_SPEED) {
				nextX = goalX;
				velocity = 0;
			}
			if (nextX <= minLeft || nextX >= maxLeft) {
				nextX = Math.max(minLeft, Math.min(maxLeft, nextX));
				velocity = 0;
			}
			this.currentX = nextX;

			const pace = Math.abs(velocity) / speed;
			const skidding =
				velocity !== 0 && (resting || Math.sign(offset) !== Math.sign(velocity));
			running = !skidding && (running ? pace > RUN_STOP : pace > RUN_START);
			if (velocity !== 0) {
				this.direction = velocity < 0 ? -1 : 1;
			}
			el.setCssProps({
				"--pixel-pets-left": `${this.currentX}px`,
				"--pixel-pets-scale-x": `${this.direction}`,
				"--pixel-pets-move-duration": "0ms",
			});
			this.tooltipEl?.setCssProps({ "--pixel-pets-scale-x": `${this.direction}` });

			const distance = Math.abs(goalX - this.currentX);
			if (!holding && distance < REACH_DISTANCE) {
				holding = true;
			}
			if (!settled && !jumping && distance < lead) {
				settled = !pounces || this.startPounce();
				jumpLeft = settled && pounces ? this.pounceDuration() : 0;
			}
			if (jumpLeft > 0) this.setAnimation("jump2");
			else this.setAnimation(running ? "run" : "idle");
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
