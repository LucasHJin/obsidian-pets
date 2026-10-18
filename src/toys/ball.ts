import { playBallSound } from "../audio/sounds";
import { Floor } from "../floor";

export class Ball {
	private container: HTMLElement;
	ballEl: HTMLElement;
	private readonly floor: Floor;

	// Physics states
	private x: number;
	private y: number;
	private vx: number;
	private vy: number;
	private radius!: number;
	private gravity = 0.42; // Acceleration from gravity (0 = no gravity)
	private damping = 0.99; // Bounce energy retention (1 = all)
	private airRes = 0.99; // Air resistance (1 = none)
	private frameId: number | null = null;
	private readonly lifetimeTimer: number;
	private isDestroyed = false;
	scale: number;

	onDestroy?: () => void;

	constructor(
		container: HTMLElement,
		spriteUrl: string,
		floor: Floor,
		scale: number,
		lifetime: number,
	) {
		this.container = container;
		this.floor = floor;
		this.scale = scale;

		// Create ball element
		this.ballEl = this.createBallElement(spriteUrl);

		// Spawn ball in random position (top 15%) of the container
		const rect = this.container.getBoundingClientRect();
		this.x = Math.random() * (rect.width - this.radius * 2) + this.radius;
		this.y = Math.random() * (rect.height * 0.15 - this.radius * 2) + this.radius;
		// Random initial velocity
		this.vx = (Math.random() - 0.5) * 15;
		this.vy = (Math.random() - 0.5) * 8;

		// Start physics loop
		this.frameId = window.requestAnimationFrame(() => this.update());

		this.lifetimeTimer = window.setTimeout(() => this.destroy(), lifetime);
	}

	// Creates the HTML for ball element
	private createBallElement(spriteUrl: string): HTMLElement {
		const el = this.container.createDiv({ cls: "ball" });

		const BALL_SIZE = 10;
		this.radius = BALL_SIZE / 2;
		el.createEl("img", { attr: { src: spriteUrl } });
		el.setCssProps({
			"--ballwidth": `${Math.round(BALL_SIZE)}px`,
			"--ballheight": `${Math.round(BALL_SIZE)}px`,
			"--scale": `${this.scale}`,
		});

		return el;
	}

	// Gets 'ground' height (not just bottom of container)
	private getGroundHeight(): number {
		const rect = this.container.getBoundingClientRect();
		if (this.floor.kind === "bottom") {
			return rect.height - this.radius - 1; // ball bottom edge exactly at screen bottom (found by testing)
		}
		const fraction = this.floor.value / 100;
		return rect.height * fraction + 15; // 10.7 is half of sprite size of ball and pet
	}

	// Updates states for ball physics
	private update() {
		const rect = this.container.getBoundingClientRect();

		// Updating physics
		this.vy += this.gravity;
		this.x += this.vx;
		this.y += this.vy;
		// Bouncing off walls
		if (this.x - this.radius < 0) {
			this.x = this.radius;
			playBallSound(Math.abs(this.vx));
			this.vx *= -this.damping;
		} else if (this.x + this.radius > rect.width) {
			this.x = rect.width - this.radius;
			playBallSound(Math.abs(this.vx));
			this.vx *= -this.damping;
		}
		// Bouncing off bottom
		const ground = this.getGroundHeight();
		if (this.y - this.radius < 0) {
			this.y = this.radius;
			this.vy *= -this.damping;
		} else if (this.y + this.radius > ground) {
			this.y = ground - this.radius;
			playBallSound(Math.abs(this.vy));
			this.vy *= -this.damping;
		}
		// Apply air resistance
		this.vx *= this.airRes;
		this.vy *= this.airRes;

		this.ballEl.setCssProps({
			"--x": `${this.x - this.radius}px`,
			"--y": `${this.y - this.radius}px`,
		});

		// Loop (schedule itself to run on next frame)
		this.frameId = window.requestAnimationFrame(() => this.update());
	}

	// For tracking for pets
	getPosition(): { x: number; y: number } {
		return { x: this.x, y: this.y };
	}

	destroy() {
		if (this.isDestroyed) return;
		this.isDestroyed = true;
		window.clearTimeout(this.lifetimeTimer);
		if (this.frameId) {
			window.cancelAnimationFrame(this.frameId);
		}
		this.ballEl.remove();
		// Run the onDestroy callback to cleanup the pet action and ball array
		if (this.onDestroy) {
			this.onDestroy();
		}
	}
}
