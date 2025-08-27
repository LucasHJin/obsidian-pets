export class Ball {
	private container: Element;
	private ballEl: HTMLElement;
	private ballId: string;
	private backgroundName: string;
	private backgroundHeights: Record<string, string> = {
		default: "80%", // Just in case no others
		none: "80%",
		"backgrounds/snowbg-1.png": "85%",
		"backgrounds/snowbg-2.png": "86%",
		"backgrounds/summerbg-1.png": "78%",
		"backgrounds/summerbg-2.png": "88%",
		"backgrounds/summerbg-3.png": "75%",
		"backgrounds/templebg-1.png": "85.5%",
		"backgrounds/templebg-2.png": "78.3%",
		"backgrounds/castlebg-1.png": "82.1%",
		"backgrounds/castlebg-2.png": "74%",
	};

	// Physics states
	private x: number;
	private y: number;
	private vx: number;
	private vy: number;
	private radius: number;
	private gravity = 0.42; // Acceleration from gravity (0 = no gravity)
	private damping = 0.99; // Bounce energy retention (1 = all)
	private airRes = 0.99; // Air resistance (1 = none)
	private frameId: number | null = null;

	public onDestroy?: () => void; // Callback to tie cat to ball being deleted

	constructor(container: Element, spriteUrl: string, ballId: string, backgroundImage: string) {
		this.container = container;
		this.ballId = ballId;
		this.backgroundName = backgroundImage;

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
		this.update = this.update.bind(this);
		this.frameId = requestAnimationFrame(this.update);

		// Auto-destroy after 3.5 seconds
		setTimeout(() => this.destroy(), 3500);
	}

	// Creates the HTML for ball element
	private createBallElement(spriteUrl: string): HTMLElement {
		const el = this.container.createDiv({ cls: "ball" });
		const img = document.createElement("img");

		const BALL_SIZE = 10;
		this.radius = BALL_SIZE / 2;
		img.src = spriteUrl;
		el.setCssProps({
			"--ballwidth": `${Math.round(BALL_SIZE)}px`,
			"--ballheight": `${Math.round(BALL_SIZE)}px`,
		});
		el.appendChild(img);

		return el;
	}

	// Gets 'ground' height (not just bottom of container)
	private getGroundHeight(): number {
		const rect = this.container.getBoundingClientRect();
		const bgHeightPercent = this.backgroundHeights[this.backgroundName] || this.backgroundHeights["default"];
		const fraction = parseFloat(bgHeightPercent) / 100;
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
			this.vx *= -this.damping;
		} else if (this.x + this.radius > rect.width) {
			this.x = rect.width - this.radius;
			this.vx *= -this.damping;
		}
		// Bouncing off bottom
		const ground = this.getGroundHeight();
		if (this.y - this.radius < 0) {
			this.y = this.radius;
			this.vy *= -this.damping;
		} else if (this.y + this.radius > ground) {
			this.y = ground - this.radius;
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

	// For tracking for pets
	public getPosition(): { x: number; y: number } {
		return { x: this.x, y: this.y };
	}

	public destroy() {
		if (this.frameId) {
			cancelAnimationFrame(this.frameId);
		}
		this.ballEl.remove();
		// Run the onDestroy callback to cleanup the pet action and ball array
		if (this.onDestroy) {
			this.onDestroy();
		}
	}
}
