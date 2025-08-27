export class Ball {
	private container: HTMLElement;
	private ballEl: HTMLElement;
	private ballId: string;

	// Physics states
	private x: number;
	private y: number;
	private vx: number;
	private vy: number;
	private radius: number;
	private gravity = 0.4; // Acceleration from gravity (0 = no gravity)
	private damping = 0.99; // Bounce energy retention (1 = all)
	private airRes = 0.99; // Air resistance (1 = none)
	private frameId: number | null = null;

	constructor(container: HTMLElement, spriteUrl: string, ballId: string) {
		this.container = container;
		this.ballId = ballId;

		// Create ball element
		this.ballEl = this.createBallElement(spriteUrl);

		// Spawn ball in random position (top 15%) of the container
		const rect = this.container.getBoundingClientRect();
		this.x = Math.random() * (rect.width - this.radius * 2) + this.radius;
		this.y = Math.random() * (rect.height * 0.15 - this.radius * 2) + this.radius;
		// Random initial velocity
		this.vx = (Math.random() - 0.5) * 13;
		this.vy = (Math.random() - 0.5) * 10;

		// Start physics loop
		this.update = this.update.bind(this);
		this.frameId = requestAnimationFrame(this.update);

		// Auto-destroy after 5 seconds
		setTimeout(() => this.destroy(), 5000);
	}

	// Creates the HTML for ball element
	private createBallElement(spriteUrl: string): HTMLElement {
		const el = this.container.createDiv({ cls: "ball" });
		const img = document.createElement("img");

		const ballSize = 9 * 1.3;
		this.radius = ballSize / 2;
		img.src = spriteUrl;
		el.setCssProps({
			"--ballwidth": `${Math.round(ballSize)}px`,
			"--ballheight": `${Math.round(ballSize)}px`,
		});
		el.appendChild(img);

		return el;
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
			this.vx *= -this.damping;
		} else if (this.x + this.radius > rect.width) {
			this.x = rect.width - this.radius;
			this.vx *= -this.damping;
		}
		// Bouncing off bottom
		if (this.y - this.radius < 0) {
			this.y = this.radius;
			this.vy *= -this.damping;
		} else if (this.y + this.radius > rect.height) {
			this.y = rect.height - this.radius;
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
		this.frameId = requestAnimationFrame(this.update);
	}

	public destroy() {
		if (this.frameId) {
			cancelAnimationFrame(this.frameId);
		}
		this.ballEl.remove();
	}
}
