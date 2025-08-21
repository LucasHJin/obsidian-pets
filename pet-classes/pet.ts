// Defines shape for parameters needed to pass in an animation
export type AnimationConfig = {
	name: string;
	spriteUrl: string; // Link to the spritesheet
	frameCount: number; // Number of frames in spritesheet
	frameWidth: number;
	frameHeight: number;
	duration: number; // Of animation (ms)
	action?: (multiples?: number) => void; // Function that gets added in
};

export class Pet {
	private container: Element;
	private petEl: HTMLElement;
	private currentX: number;
	private direction = 1; // 1 right, -1 left
	private currentAnimation = "none";
	protected animations: Record<string, AnimationConfig>;
	private isDestroyed = false; // Check if pet instance has been destroyed
	private moveDist: number; // For different pet movements
	private backgroundName = "default";
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
	private petId: string; // For unique keyframes

	constructor(
		container: Element,
		animations: Record<string, AnimationConfig>,
		moveDist: number,
		backgroundName: string,
		petId: string
	) {
		this.container = container;
		this.animations = animations;
		this.moveDist = moveDist;
		this.backgroundName = backgroundName;
		this.petId = petId;

		this.setupActions();

		requestAnimationFrame(() => {
			// Randomized spawn within middle 80% of container
			const containerWidth = (this.container as HTMLElement).offsetWidth;
			const minX = containerWidth * 0.1;
			const maxX = containerWidth * 0.9;
			this.currentX = Math.random() * (maxX - minX) + minX;

			// Create pet HTML element to be shown in view
			this.petEl = this.createPetElement();

			// Start the behavior
			(async () => {
				await this.animations["idle"].action?.();
				this.startActionLoop();
			})();
		});
	}

	// Creates the div representing the pet and styles
	protected createPetElement(): HTMLElement {
		const el = this.container.createDiv({ cls: "pet" });
		const topPercent =
			this.backgroundHeights[this.backgroundName] ??
			this.backgroundHeights["default"];

		// Set initial CSS custom properties (to be used as variables in styles.css)
		el.setCssProps({
			"--left": `${this.currentX}px`,
			"--top": topPercent,
			"--pet-size": `${this.animations["run"].frameWidth}px`,
			"--scale-x": `${this.direction}`,
		});
		return el;
	}

	// Leave empty to override in subclasses
	protected setupActions() {}

	// Update height when background change
	public updateVerticalPosition(newBackground: string) {
		this.backgroundName = newBackground;
		const newTop =
			this.backgroundHeights[newBackground] ??
			this.backgroundHeights["default"];
		// Pass a prop for the new height -> CSS instantly reacts to this change
		this.petEl.setCssProps({ "--top": newTop });
	}

	// Add an animation for the pet
	protected setAnimation(animationName: string) {
		// If the animation is already selected
		if (this.currentAnimation === animationName) {
			return;
		}

		// If the animation does not exist
		const animation = this.animations[animationName];
		if (!animation) {
			return;
		}

		// Need to use css styles and not props for animation because it needs a hardcoded value, not variable
		this.petEl.setCssStyles({ animation: "none" });
		this.petEl.offsetHeight; // Reflow

		// Create the animation for above ^^
		this.keyFrameAnimation(animation);
		const keyframeName = `${animation.name}-${this.petId}`;

		// Set animation directly 
		this.petEl.setCssStyles({
			animation: `${keyframeName} ${animation.duration}ms steps(${animation.frameCount}) infinite`
		});

		// Set background & sizing using props
		this.petEl.setCssProps({
			"--sprite-url": `url(${animation.spriteUrl})`,
			"--sprite-size": `${
				animation.frameCount * animation.frameWidth
			}px auto`,
		});

		// Update tracking for which animation it is
		this.currentAnimation = animationName;
	}

	protected keyFrameAnimation(animation: AnimationConfig) {
		const keyframeName = `${animation.name}-${this.petId}`;

		// Avoid duplipete animations
		if (document.getElementById(`kf-${keyframeName}`)) {
			return;
		}

		// Create the <style> tag
		const style = document.createElement("style");
		style.id = `kf-${keyframeName}`;

		// Append the style to the document head first to ensure style.sheet is available
		document.head.appendChild(style);

		// Keyframe rule for animating the sprite sheet
		const keyframeRule = `
		@keyframes ${keyframeName} {
			from { background-position: 0 0; }
			to { background-position: -${animation.frameCount * animation.frameWidth}px 0; }
		}`;

		// Insert the rule using the stylesheet API
		const sheet = style.sheet as CSSStyleSheet;
		if (sheet) {
			sheet.insertRule(keyframeRule, sheet.cssRules.length);
		}
	}

	// Moves the pet in x direction
	protected move(duration: number, action?: string): Promise<void> {
		const PET_WIDTH = 32;
		const containerWidth = (this.container as HTMLElement).offsetWidth;

		// Boundaries for the view
		const maxLeft = containerWidth - PET_WIDTH / 2;
		const minLeft = PET_WIDTH / 2;

		// Get a random change in x direction (biased towards the side that was already being visited)
		const magnitude =
			action === "jump"
				? this.moveDist * (Math.random() * 0.3 + 1.5)
				: this.moveDist; // Diff distance based on jumping vs running
		const bias = 0.9;
		const direction =
			Math.random() < bias ? this.direction : -this.direction;
		let dx = magnitude * direction;
		const possibleX = this.currentX + dx;

		// Clamp it within bounds (reverse the direction if too close to edge)
		if (possibleX < minLeft || possibleX > maxLeft) {
			dx = -dx;
		}
		const targetX = this.currentX + dx;

		// If no movement, resolve immediately (petching any overlapping of actions)
		if (targetX === this.currentX) {
			return Promise.resolve();
		}

		// Update direction based on movement
		this.direction = dx < 0 ? -1 : 1;

		// Return a promise that is being awaited (to prevent moving on until this is finished)
		return new Promise((res) => {
			// Cleanup function for after transition
			const done = () => {
				this.petEl.removeEventListener("transitionend", done);
				this.petEl.setCssStyles({ transition: "" }); // Remove the transition property
				this.currentX = targetX;
				res(); // Resolve the promise
			};
			this.petEl.addEventListener("transitionend", done, { once: true }); // Listen for transitionend event one time after the left transition finishes

			this.petEl.offsetWidth; // Reflow for new animation reset
			// Show moving animation
			this.petEl.setCssProps({
				"--left": `${targetX}px`,
				"--scale-x": `${this.direction}`,
				"--move-duration": `${duration}ms`,
			});
		});
	}

	// Main loop -> picks random actions
	protected async startActionLoop() {
		// Gets random delay that is a multiple of the run animation time
		function getRandDelay(
			min: number,
			max: number,
			multiple: number
		): number {
			const random = Math.random() * (max - min) + min;
			return Math.round(random / multiple) * multiple;
		}

		// Possible actions excluding dieing and running
		const ACTIONS = Object.keys(this.animations).filter(
			(a) => a !== "die" && a !== "run"
		);

		while (!this.isDestroyed) {
			// Pick and run a random action
			const randomAction =
				ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
			await this.animations[randomAction].action?.();

			// Go back to the running action
			const delay = getRandDelay(
				3000,
				8000,
				this.animations["run"].duration
			);
			await this.animations["run"].action?.(
				Math.floor(delay / this.animations["run"].duration)
			);
		}
	}

	// Destroys pet instance
	public async destroy() {
		this.isDestroyed = true;
		// Death animation (wait for the animation to finish)
		this.setAnimation("die");
		await new Promise((resolve) =>
			setTimeout(resolve, this.animations["die"].duration)
		);
		// Removes instance from DOM
		this.petEl.remove();
	}
}
