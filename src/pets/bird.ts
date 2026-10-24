import { Pet, AnimationName } from "./pet";
import { FlightPath, getFlightFacing, planFlight } from "./flight";
import { PET_FEET_OFFSET } from "../floor";

const FLIGHT_SPEED = 130;
const FLIGHT_RAMP_MS = 650;
const TURN_RADIUS = 22;
const MIN_LEGS = 2;
const MAX_LEGS = 4;
const REFERENCE_WIDTH = 252;
const MAX_SPEED_BOOST = 2.4;
const MIN_FLIGHT_SECONDS = 4;
const MAX_FLIGHT_SECONDS = 8;
const LEG_WIDTH_SHARE = 0.4;
const LEG_HEIGHT_SHARE = 0.3;
const LOW_FLIGHT = 4;
const MAX_FRAME_MS = 50;
const ANIMATION_GUARD_MS = 30;
const PERCHED_LABEL_DROP = 8;
const AIRBORNE_LABEL_DROP = -4;
const FALL_GRAVITY = 2400;

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function nextFrame(): Promise<number> {
	return new Promise((resolve) => window.requestAnimationFrame(resolve));
}

export class Bird extends Pet {
	private airborne = false;
	private altitude = 0;
	private readonly flightSpeed = FLIGHT_SPEED * (0.9 + Math.random() * 0.25);

	protected override createPetElement(): HTMLElement {
		const el = super.createPetElement();
		el.setCssProps({ "--pixel-pets-label-drop": `${PERCHED_LABEL_DROP}px` });
		return el;
	}

	protected override getHoverAnimation(): AnimationName {
		return this.airborne ? "fly" : "idle";
	}

	protected override applyRestPosition() {
		if (!this.airborne) super.applyRestPosition();
	}

	override async clampToContainer() {
		await super.clampToContainer();
		if (this.airborne && this.container.offsetWidth > 0) {
			this.place(this.currentX, this.altitude);
		}
	}

	protected override async performAction(name: AnimationName, repeats = 1): Promise<void> {
		const animation = this.animations[name];
		if (!animation) return;
		this.setAnimation(name);

		switch (name) {
			case "run":
				for (let i = 0; i < repeats; i++) {
					await this.waitWhilePaused();
					if (this.isDestroyed) break;
					await this.move(animation.duration, name);
				}
				break;
			case "jump":
				await this.move(animation.duration, name);
				break;
			default:
				for (let i = 0; i < repeats; i++) {
					await this.sleep(animation.duration);
				}
		}
	}

	protected override async runRoutine(): Promise<void> {
		await this.perch();
		await this.waitWhilePaused();
		if (this.isDestroyed) return;
		await this.flyAround();
	}

	private async perch(): Promise<void> {
		const rounds = 1 + Math.floor(Math.random() * 3);
		for (let i = 0; i < rounds; i++) {
			await this.waitWhilePaused();
			if (this.isDestroyed) return;
			const roll = Math.random();
			if (roll < 0.5) {
				await this.performAction("idle", 2 + Math.floor(Math.random() * 3));
			} else if (roll < 0.8) {
				await this.performAction("run", 2 + Math.floor(Math.random() * 3));
			} else {
				await this.performAction("jump");
			}
		}
	}

	private async flyAround(): Promise<void> {
		const { minLeft, maxLeft } = this.getHorizontalBounds();
		const width = maxLeft - minLeft;
		const ceiling = this.getCeilingAltitude();
		const speed =
			this.flightSpeed * clamp(Math.sqrt(width / REFERENCE_WIDTH), 1, MAX_SPEED_BOOST);
		const seconds =
			MIN_FLIGHT_SECONDS + Math.random() * (MAX_FLIGHT_SECONDS - MIN_FLIGHT_SECONDS);
		const legLength = LEG_WIDTH_SHARE * width + LEG_HEIGHT_SHARE * ceiling;
		const path = planFlight({
			start: { x: this.currentX, y: 0 },
			end: { x: minLeft + Math.random() * width, y: 0 },
			bounds: {
				minX: minLeft,
				maxX: maxLeft,
				minY: LOW_FLIGHT * this.scale,
				maxY: Math.max(LOW_FLIGHT * this.scale, ceiling),
			},
			legs: clamp(Math.round((speed * seconds) / legLength), MIN_LEGS, MAX_LEGS),
			speed,
			rampMs: FLIGHT_RAMP_MS,
			turnRadius: TURN_RADIUS * this.scale,
		});

		this.face(path.waypoints[1].x < this.currentX ? -1 : 1);
		await this.playOnce("takeoff");
		await this.waitWhilePaused();
		if (this.isDestroyed) return;

		const landed = await this.followPath(path);
		if (!landed) return;

		this.airborne = false;
		this.setTop(null);
		this.setLabelDrop(PERCHED_LABEL_DROP);
		await this.playOnce("land");
		this.setAnimation("idle");
	}

	private async playOnce(name: AnimationName): Promise<void> {
		this.setAnimation(name);
		await this.sleep(this.requireAnimation(name).duration - ANIMATION_GUARD_MS);
	}

	private async followPath(path: FlightPath): Promise<boolean> {
		const el = this.requirePetEl();
		this.airborne = true;
		this.setLabelDrop(AIRBORNE_LABEL_DROP);
		el.setCssProps({ "--pixel-pets-move-duration": "0ms" });

		let elapsed = 0;
		let lastFrame: number | null = null;
		while (!this.isDestroyed) {
			if (this.actionLoopPaused) {
				await this.waitWhilePaused();
				lastFrame = null;
				continue;
			}
			const now = await nextFrame();
			if (this.isDestroyed) return false;
			if (this.actionLoopPaused) continue;
			elapsed += lastFrame === null ? 0 : Math.min(now - lastFrame, MAX_FRAME_MS);
			lastFrame = now;

			this.setAnimation("fly");
			const point = path.positionAt(elapsed);
			const { minLeft, maxLeft } = this.getHorizontalBounds();
			const x = clamp(point.x, minLeft, maxLeft);
			this.face(getFlightFacing(x - this.currentX, this.direction));
			this.place(x, point.y);
			if (elapsed >= path.duration) return true;
		}
		return false;
	}

	private face(direction: 1 | -1) {
		if (this.direction === direction) return;
		this.direction = direction;
		this.requirePetEl().setCssProps({ "--pixel-pets-scale-x": `${direction}` });
		this.tooltipEl?.setCssProps({ "--pixel-pets-scale-x": `${direction}` });
	}

	private getCeilingAltitude(): number {
		return Math.max(0, this.getRestY() - PET_FEET_OFFSET * this.scale);
	}

	private place(x: number, altitude: number) {
		const { minLeft, maxLeft } = this.getHorizontalBounds();
		this.currentX = clamp(x, minLeft, maxLeft);
		this.altitude = clamp(altitude, 0, this.getCeilingAltitude());
		this.requirePetEl().setCssProps({
			"--pixel-pets-left": `${this.currentX}px`,
			"--pixel-pets-top": `${this.getRestY() - this.altitude}px`,
		});
	}

	protected override async playDeathAnimation() {
		let fallMs = 0;
		if (this.airborne) {
			fallMs = Math.sqrt((2 * this.altitude) / FALL_GRAVITY) * 1000;
			this.requirePetEl().setCssProps({ "--pixel-pets-fall-duration": `${fallMs}ms` });
			this.setTop(null);
		}
		const dieMs = this.requireAnimation("die").duration;
		await super.playDeathAnimation();
		if (fallMs > dieMs) {
			await new Promise((resolve) => window.setTimeout(resolve, fallMs - dieMs));
		}
	}
}
