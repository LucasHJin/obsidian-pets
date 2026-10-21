import { SoundPlayer } from "../audio/sounds";
import { Floor, getGroundY } from "../floor";

const MIN_SOUND_SPEED = 3;
const REST_SPEED = 1.5;
const ROLL_FRICTION = 0.95;
const VANISH_SPEED = 0.3;
const VANISH_MS = 250;

export class Ball {
	private container: HTMLElement;
	ballEl: HTMLElement;
	private readonly floor: Floor;

	private x = 0;
	private y = 0;
	private vx = 0;
	private vy = 0;
	private radius!: number;
	private gravity = 0.42;
	private damping = 0.99;
	private airRes = 0.99;
	private frameId: number | null = null;
	private lifetimeTimer: number | undefined;
	private lifetimeLeft: number;
	private lifetimeStartedAt = 0;
	private isPaused = false;
	private isDestroyed = false;
	private isVanishing = false;
	private startedUnsized = false;
	scale: number;

	onDestroy?: () => void;

	constructor(
		container: HTMLElement,
		spriteUrl: string,
		floor: Floor,
		scale: number,
		lifetime: number,
		private readonly sounds: SoundPlayer,
	) {
		this.container = container;
		this.floor = floor;
		this.scale = scale;
		this.lifetimeLeft = lifetime;

		this.ballEl = this.createBallElement(spriteUrl);
		this.placeAtStart();

		this.frameId = window.requestAnimationFrame(() => this.update());

		this.startLifetimeTimer();
	}

	private startLifetimeTimer() {
		this.lifetimeStartedAt = window.performance.now();
		this.lifetimeTimer = window.setTimeout(() => this.destroy(), this.lifetimeLeft);
	}

	private createBallElement(spriteUrl: string): HTMLElement {
		const el = this.container.createDiv({ cls: "pixel-pets-ball" });

		const BALL_SIZE = 10;
		this.radius = BALL_SIZE / 2;
		el.createEl("img", { attr: { src: spriteUrl } });
		el.setCssProps({
			"--pixel-pets-ball-width": `${Math.round(BALL_SIZE)}px`,
			"--pixel-pets-ball-height": `${Math.round(BALL_SIZE)}px`,
			"--pixel-pets-scale": `${this.scale}`,
		});

		return el;
	}

	private placeAtStart() {
		const rect = this.container.getBoundingClientRect();
		this.startedUnsized = rect.width === 0 || rect.height === 0;
		this.x = Math.random() * (rect.width - this.radius * 2) + this.radius;
		this.y = Math.random() * (rect.height * 0.15 - this.radius * 2) + this.radius;
		this.vx = (Math.random() - 0.5) * 15;
		this.vy = (Math.random() - 0.5) * 8;
	}

	private getGroundHeight(): number {
		return getGroundY(this.floor, this.container.getBoundingClientRect().height, this.scale);
	}

	private getDrawnRadius(): number {
		return this.radius * this.scale;
	}

	private update() {
		const rect = this.container.getBoundingClientRect();
		if (rect.width === 0 || rect.height === 0) {
			this.frameId = window.requestAnimationFrame(() => this.update());
			return;
		}

		const radius = this.getDrawnRadius();
		this.vy += this.gravity;
		this.x += this.vx;
		this.y += this.vy;
		if (this.x - radius < 0) {
			this.x = radius;
			this.playBounce(Math.abs(this.vx));
			this.vx *= -this.damping;
		} else if (this.x + radius > rect.width) {
			this.x = rect.width - radius;
			this.playBounce(Math.abs(this.vx));
			this.vx *= -this.damping;
		}
		const ground = this.getGroundHeight();
		let resting = false;
		if (this.y - radius < 0) {
			this.y = radius;
			this.vy *= -this.damping;
		} else if (this.y + radius > ground) {
			this.y = ground - radius;
			const impact = Math.abs(this.vy);
			if (impact < REST_SPEED) {
				this.vy = 0;
				this.vx *= ROLL_FRICTION;
				resting = true;
			} else {
				this.playBounce(impact);
				this.vy *= -this.damping;
			}
		}
		this.vx *= this.airRes;
		this.vy *= this.airRes;

		this.renderPosition();

		if (resting && Math.abs(this.vx) < VANISH_SPEED) {
			this.vx = 0;
			this.frameId = null;
			this.vanish();
			return;
		}
		this.frameId = window.requestAnimationFrame(() => this.update());
	}

	private vanish() {
		this.isVanishing = true;
		this.ballEl.addClass("pixel-pets-ball--vanishing");
		window.clearTimeout(this.lifetimeTimer);
		this.lifetimeLeft = VANISH_MS;
		this.startLifetimeTimer();
	}

	private playBounce(speed: number) {
		if (speed >= MIN_SOUND_SPEED) {
			this.sounds.playBounce(speed);
		}
	}

	private renderPosition() {
		this.ballEl.setCssProps({
			"--pixel-pets-ball-x": `${this.x - this.radius}px`,
			"--pixel-pets-ball-y": `${this.y - this.radius}px`,
		});
	}

	getPosition(): { x: number; y: number } {
		return { x: this.x, y: this.y };
	}

	getHeightAboveGround(): number {
		return this.getGroundHeight() - (this.y + this.getDrawnRadius());
	}

	wake() {
		if (this.isPaused || this.isDestroyed || this.isVanishing || this.frameId !== null) return;
		this.frameId = window.requestAnimationFrame(() => this.update());
	}

	pause() {
		if (this.isPaused || this.isDestroyed) return;
		this.isPaused = true;
		window.clearTimeout(this.lifetimeTimer);
		this.lifetimeLeft = Math.max(
			0,
			this.lifetimeLeft - (window.performance.now() - this.lifetimeStartedAt),
		);
		if (this.frameId !== null) {
			window.cancelAnimationFrame(this.frameId);
			this.frameId = null;
		}
	}

	resume() {
		if (!this.isPaused || this.isDestroyed) return;
		this.isPaused = false;
		if (this.startedUnsized) {
			this.placeAtStart();
			this.renderPosition();
		}
		if (!this.isVanishing) {
			this.frameId = window.requestAnimationFrame(() => this.update());
		}
		this.startLifetimeTimer();
	}

	destroy() {
		if (this.isDestroyed) return;
		this.isDestroyed = true;
		window.clearTimeout(this.lifetimeTimer);
		if (this.frameId) {
			window.cancelAnimationFrame(this.frameId);
		}
		this.ballEl.remove();
		if (this.onDestroy) {
			this.onDestroy();
		}
	}
}
