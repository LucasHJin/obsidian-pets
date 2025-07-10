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

// CHANGE TO NOT JUST BE CATS

export class Pet {
	private container: Element;
	private petEl: HTMLElement;
	private currentX: number;
	private direction = 1; // 1 right, -1 left
	private currentAnimation = "none";
	private animations: Record<string, AnimationConfig>;
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
	private petType: string; // For unique keyframes

	constructor(
		container: Element,
		animations: Record<string, AnimationConfig>,
		moveDist: number,
		backgroundName: string,
		petType: string
	) {
		this.container = container;
		this.animations = animations;
		this.moveDist = moveDist;
		this.backgroundName = backgroundName;
		this.petType = petType;

		// Add the animations with async action functions (allow waiting for the action to finish before proceeding)
		for (const key in this.animations) {
			this.animations[key].action = async (multiples = 1) => {
				this.setAnimation(key);
				if (key === "run") {
					// Call the moving multiple times
					for (let i = 0; i < multiples; i++) {
						await this.move(this.animations[key].duration, key);
					}
				} else if (key === "jump") {
					// Move once
					await this.move(this.animations[key].duration, key);
				} else if (key === "sit" || key === "sleep") {
					const extensionAmount = Math.floor(Math.random() * 8) + 5;
					// Wait to make sure action has time to occur
					await new Promise((resolve) =>
						setTimeout(
							resolve,
							this.animations[key].duration * extensionAmount
						)
					);
				} else {
					// Idleing animation
					const extensionAmount = Math.floor(Math.random() * 2) + 2;
					await new Promise((resolve) =>
						setTimeout(
							resolve,
							this.animations[key].duration * extensionAmount
						)
					);
				}
			};
		}
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
	private createPetElement(): HTMLElement {
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
	private setAnimation(animationName: string) {
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
		const keyframeName = `${animation.name}-${this.petType}`;

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

	private keyFrameAnimation(animation: AnimationConfig) {
		const keyframeName = `${animation.name}-${this.petType}`;

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
	private move(duration: number, action?: string): Promise<void> {
		const CAT_WIDTH = 32;
		const containerWidth = (this.container as HTMLElement).offsetWidth;

		// Boundaries for the view
		const maxLeft = containerWidth - CAT_WIDTH / 2;
		const minLeft = CAT_WIDTH / 2;

		// Get a random change in x direction (biased towards the side that was already being visited)
		const magnitude =
			action === "jump"
				? this.moveDist * (Math.random() * 0.3 + 1.5)
				: this.moveDist; // Diff distance based on jumping vs running
		const bias = 0.95;
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
	private async startActionLoop() {
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
