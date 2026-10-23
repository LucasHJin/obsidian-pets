import { Pet, AnimationName, PetAnimations } from "./pet";
import { Ball } from "../toys/ball";
import { Floor } from "../floor";
import { SoundPlayer } from "../audio/sounds";
import { Bed, BedLookup, getBedLift } from "../furniture/bed";
import { getBedSeatX } from "../furniture/placement";
import { getSpriteBounds } from "../ui/sprite-preview";

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
const BED_CHANCE = 0.4;
const BED_SLEEP_MIN_MS = 8000;
const BED_SLEEP_MAX_MS = 20000;
const BED_COOLDOWN_MS = 10000;
const BED_LIFT_MS = 250;
const BED_MIN_WALK_MS = 150;
const BED_MAX_WALKS = 3;
const BED_SEAT_TOLERANCE = 1;

export class Cat extends Pet {
	private canFly: boolean;
	private chasingBall: Ball | null = null;
	private chasingCursor = false;
	private getCursorX: (() => number) | null = null;
	private readonly chaseSpeed: number;
	private readonly toySpeed: number;
	private interruptAction = false;
	bedChance = BED_CHANCE;
	bedSleepMs = { min: BED_SLEEP_MIN_MS, max: BED_SLEEP_MAX_MS };
	private bed: Bed | null = null;
	private bedSeated = false;
	private bedWoken = false;
	private bedArtOffset = 0;
	private bedFreeAt = 0;

	constructor(
		container: HTMLElement,
		animations: PetAnimations,
		moveDist: number,
		floor: Floor,
		scale: number,
		petName: string,
		sounds: SoundPlayer,
		canFly = false,
		private readonly beds: BedLookup | null = null,
	) {
		super(container, animations, moveDist, floor, scale, petName, sounds);
		this.canFly = canFly;
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
					await this.travel(animation.duration, name);
				}
				break;
			case "jump":
			case "jump2":
				if (!this.interruptAction) {
					await this.travel(animation.duration, name);
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
		this.wakeFromBed();
	}

	stopFollowingCursor(): void {
		this.chasingCursor = false;
		this.getCursorX = null;
		this.interruptAction = false;
	}

	startChasingBall(ball: Ball) {
		if (this.chasingBall !== ball) this.chasingBall?.release();
		this.chasingBall = ball;
		this.interruptAction = true;
		this.wakeFromBed();
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
		return false;
	}

	protected override async runRoutine(): Promise<void> {
		await super.runRoutine();
		if (this.isDestroyed) return;
		await this.sleep(PASS_GUARD_DELAY);
	}

	override async clampToContainer() {
		await super.clampToContainer();
		this.alignWithBed();
	}

	override async destroy() {
		this.leaveBedNow();
		await super.destroy();
	}

	override destroyImmediate() {
		this.leaveBedNow();
		super.destroyImmediate();
	}

	private async travel(duration: number, action: AnimationName): Promise<void> {
		if (this.actionLoopPaused || this.isDestroyed) return;
		const targetX = this.planMove(action);
		const bed = this.chooseBed(targetX);
		if (!bed) {
			await this.slideTo(targetX, duration);
			return;
		}
		await this.sleepInBed(bed, targetX, duration, action);
		if (!this.isDestroyed) this.setAnimation(action);
	}

	private chooseBed(targetX: number): Bed | null {
		if (!this.beds || !this.animations.sleep || this.bedChance <= 0) return null;
		if (window.performance.now() < this.bedFreeAt) return null;
		for (const bed of this.beds.findBedsOnPath(this.currentX, targetX)) {
			if (Math.random() >= this.bedChance) continue;
			if (bed.claim(() => this.wakeFromBed())) {
				this.bed = bed;
				this.bedWoken = false;
				return bed;
			}
		}
		return null;
	}

	private canStay(bed: Bed): boolean {
		return !this.isDestroyed && !this.bedWoken && this.bed === bed;
	}

	private async sleepInBed(
		bed: Bed,
		plannedX: number,
		duration: number,
		action: AnimationName,
	): Promise<void> {
		try {
			const sleeping = this.requireAnimation("sleep");
			const bounds = await getSpriteBounds(sleeping);
			if (!this.canStay(bed)) return;
			const spriteHeight = bounds?.height ?? sleeping.frameWidth;
			const lift = getBedLift(spriteHeight, bounds?.bottom ?? spriteHeight);
			this.bedArtOffset = bounds ? (bounds.left + bounds.right) / 2 - bounds.width / 2 : 0;

			const paceMs = duration / Math.max(1, Math.abs(plannedX - this.currentX));
			if (action.includes("jump") && this.animations.run) this.setAnimation("run");
			if (!(await this.walkToBed(bed, paceMs))) return;

			this.bedSeated = true;
			this.alignWithBed();
			this.setAnimation("sleep");
			this.setLift(lift, BED_LIFT_MS);
			await this.sleep(BED_LIFT_MS);

			let remaining =
				this.bedSleepMs.min + Math.random() * (this.bedSleepMs.max - this.bedSleepMs.min);
			while (remaining > 0 && this.canStay(bed)) {
				await this.waitWhilePaused();
				if (!this.canStay(bed)) break;
				this.setAnimation("sleep");
				const chunk = Math.min(remaining, sleeping.duration);
				await this.sleep(chunk);
				remaining -= chunk;
			}

			await this.waitWhilePaused();
			if (this.isDestroyed) return;
			this.setLift(0, BED_LIFT_MS);
			this.bedSeated = false;
			await this.sleep(BED_LIFT_MS);
		} finally {
			if (this.bed === bed) {
				this.leaveBedNow();
				this.bedFreeAt = window.performance.now() + BED_COOLDOWN_MS;
			}
		}
	}

	private async walkToBed(bed: Bed, paceMs: number): Promise<boolean> {
		for (let walks = 0; walks < BED_MAX_WALKS; walks++) {
			const side = Math.sign(bed.getCentre() - this.currentX) || this.direction;
			const seatX = this.getSeatX(bed, side);
			const distance = Math.abs(seatX - this.currentX);
			if (distance <= BED_SEAT_TOLERANCE) break;
			await this.slideTo(seatX, Math.max(BED_MIN_WALK_MS, paceMs * distance));
			await this.waitWhilePaused();
			if (!this.canStay(bed)) return false;
		}
		return this.canStay(bed);
	}

	private getSeatX(bed: Bed, direction: number): number {
		const { minLeft, maxLeft } = this.getHorizontalBounds();
		const x = getBedSeatX(bed.getCentre(), direction, this.bedArtOffset, this.scale);
		return Math.max(minLeft, Math.min(maxLeft, x));
	}

	private alignWithBed() {
		const el = this.petEl;
		if (!el || !this.bed || !this.bedSeated || this.container.offsetWidth === 0) return;
		const x = this.getSeatX(this.bed, this.direction);
		if (Math.abs(x - this.currentX) < 0.5) return;
		this.currentX = x;
		this.snapTo(el, x);
	}

	private wakeFromBed() {
		if (!this.bed) return;
		this.bedWoken = true;
		this.cancelSleep();
	}

	private leaveBedNow() {
		this.bed?.release();
		this.bed = null;
		this.bedSeated = false;
		this.bedWoken = true;
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
