import { SoundPlayer } from "../audio/sounds";
import { Floor } from "../floor";

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
		const rect = this.container.getBoundingClientRect();
		if (this.floor.kind === "bottom") {
			return rect.height - this.radius - 1;
		}
		const fraction = this.floor.value / 100;
		return rect.height * fraction + 15;
	}

	private update() {
		const rect = this.container.getBoundingClientRect();
		if (rect.width === 0 || rect.height === 0) {
			this.frameId = window.requestAnimationFrame(() => this.update());
			return;
		}

		this.vy += this.gravity;
		this.x += this.vx;
		this.y += this.vy;
		if (this.x - this.radius < 0) {
			this.x = this.radius;
			this.sounds.playBounce(Math.abs(this.vx));
			this.vx *= -this.damping;
		} else if (this.x + this.radius > rect.width) {
			this.x = rect.width - this.radius;
			this.sounds.playBounce(Math.abs(this.vx));
			this.vx *= -this.damping;
		}
		const ground = this.getGroundHeight();
		if (this.y - this.radius < 0) {
			this.y = this.radius;
			this.vy *= -this.damping;
		} else if (this.y + this.radius > ground) {
			this.y = ground - this.radius;
			this.sounds.playBounce(Math.abs(this.vy));
			this.vy *= -this.damping;
		}
		this.vx *= this.airRes;
		this.vy *= this.airRes;

		this.renderPosition();

		this.frameId = window.requestAnimationFrame(() => this.update());
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
		this.frameId = window.requestAnimationFrame(() => this.update());
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
