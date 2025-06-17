// Defines shape for parameters needed to pass in an animation
type AnimationConfig = {
	name: string;
	spriteUrl: string; // Link to the spritesheet
	frameCount: number; // Number of frames in spritesheet
	frameWidth: number;
	frameHeight: number;
	duration: number; // Of animation (ms)
	action?: (multiples?: number) => void; // Function that gets added in
};

// MAKE THEM BE ABLE TO SPAWN IN DIFFERENT PLACES AND LONGER ANIMATIONS FOR SLEEP SIT

export class Cat {
	private container: Element;
	private catEl: HTMLElement;
	private currentX = 200;
	private direction = 1; // 1 right, -1 left
	private currentAnimation = "none";
	private animations: Record<string, AnimationConfig>;
	private isDestroyed = false; // Check if cat instance has been destroyed

	constructor(
		container: Element,
		animations: Record<string, AnimationConfig>
	) {
		this.container = container;
		this.animations = animations;

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
				} else {
					// Wait to make sure action has time to occur
					await new Promise(resolve => setTimeout(resolve, this.animations[key].duration));
				}
			};
		}

		// Create cat HTML element to be shown in view
		this.catEl = this.createCatElement();

		// Start the behavior
		(async () => {
			await this.animations["idle"].action?.();
			this.startActionLoop();
		})();
	}

	// Creates the div representing the cat and styles
	private createCatElement(): HTMLElement {
		const el = this.container.createDiv({ cls: "cat" });
		el.style.left = `${this.currentX}px`;
		el.style.top = "80%";
		el.style.width = `${this.animations["run"].frameWidth}px`;
		el.style.height = `${this.animations["run"].frameWidth}px`;
		return el;
	}

	// 
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

		// Reset animation
		this.catEl.style.animation = "none"; 
		this.catEl.offsetHeight; // Trigger reflow (make new animation play)

		// Add new animation
		this.catEl.style.backgroundImage = `url(${animation.spriteUrl})`;
		this.catEl.style.backgroundSize = `${animation.frameCount * animation.frameWidth}px auto`;
		this.catEl.style.animation = `${animation.name} ${animation.duration}ms steps(${animation.frameCount}) infinite`;

		// Create the animation for above ^^
		this.keyFrameAnimation(animation);
		// Update tracking for which animation it is
		this.currentAnimation = animationName;
	}

	private keyFrameAnimation(animation: AnimationConfig) {
		// Avoid duplicate animations
		if (document.getElementById(`kf-${animation.name}`)) {
			return;
		}

		// Define style info for the doc with tag
		const style = document.createElement("style");
		style.id = `kf-${animation.name}`;

		// Add the animation for the spritesheet
		style.innerHTML = `
		@keyframes ${animation.name} {
			from { background-position: 0 0; }
			to { background-position: -${animation.frameCount * animation.frameWidth}px 0; }
		}`;

		// Add animation to the html of the view
		document.head.appendChild(style);
	}

	// Moves the cat in x direction
	private move(duration: number, action?: string): Promise<void> {
		const CAT_WIDTH = 32;
		const containerWidth = (this.container as HTMLElement).offsetWidth;

		// Boundaries for the view
		const maxLeft = containerWidth - CAT_WIDTH / 2;
		const minLeft = CAT_WIDTH / 2;

		// Get a random change in x direction (biased towards the side that was already being visited)
		const magnitude = action === "jump" ? 45 : 30; // Diff distance based on jumping vs running
		const bias = 0.8; 
		const direction = Math.random() < bias ? this.direction : -this.direction;
		let dx = magnitude * direction;
		const possibleX = this.currentX + dx;

		// Clamp it within bounds (reverse the direction if too close to edge)
		if (possibleX < minLeft || possibleX > maxLeft) {
			dx = -dx;
		}
		const targetX = this.currentX + dx;

		// If no movement, resolve immediately (catching any overlapping of actions)
		if (targetX === this.currentX) {
			return Promise.resolve();
		}

		// Update direction based on movement
		this.direction = dx < 0 ? -1 : 1;

		// Return a promise that is being awaited (to prevent moving on until this is finished)
		return new Promise(res => {
			// Cleanup function for after transition
			const done = () => {
				this.catEl.removeEventListener("transitionend", done);
				this.catEl.style.transition = "";
				this.currentX = targetX;
				res(); // Resolve the promise
			};
			this.catEl.addEventListener("transitionend", done, { once: true }); // Listen for transitionend event one time after the left transition finishes

			// Show the moving animation
			this.catEl.offsetWidth;
			this.catEl.style.transition = `left ${duration}ms linear`;
			this.catEl.style.left = `${targetX}px`;
			this.catEl.style.transform = `translate(-50%, -50%) scaleX(${this.direction})`; // Use transform so no problems with scale overlap
		});
	}

	// Main loop -> picks random actions
	private async startActionLoop() {
		// Gets random delay that is a multiple of the run animation time
		function getRandDelay(min: number, max: number, multiple: number): number {
			const random = Math.random() * (max - min) + min;
			return Math.round(random / multiple) * multiple;
		}

		// Possible actions excluding dieing and running
		const ACTIONS = Object.keys(this.animations).filter(a => a !== "die" && a !== "run");

		while (!this.isDestroyed) {
			// Pick and run a random action
			const randomAction = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
			await this.animations[randomAction].action?.();

			// Go back to the running action
			const delay = getRandDelay(3000, 5600, this.animations["run"].duration);
			await this.animations["run"].action?.(Math.floor(delay / this.animations["run"].duration));
		}
	}

	// Destroys cat instance
	public async destroy() {
		this.isDestroyed = true;
		// Death animation (wait for the animation to finish)
		this.setAnimation("die"); 
		await new Promise(resolve => setTimeout(resolve, this.animations["die"].duration));
		// Removes instance from DOM
		this.catEl.remove();	
	}
}
