import { heartAsset } from "./pet-assets";

// Defines shape for parameters needed to pass in an animation
export type AnimationConfig = {
	name: string;
	spriteUrl: string; // Link to the spritesheet
	frameCount: number; // Number of frames in spritesheet
	frameWidth: number;
	frameHeight: number;
	duration: number; // Of animation (ms)
	action?: (multiples?: number) => Promise<void> | void;
};

// Make size changeable

export class Pet {
	protected container: Element;
	public petEl!: HTMLElement;
	protected currentX!: number;
	protected direction = 1; // 1 right, -1 left
	private currentAnimation = "none";
	protected animations: Record<string, AnimationConfig>;
	protected isDestroyed = false; // Check if pet instance has been destroyed
	protected moveDist: number; // For different pet movements
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
	protected petId: string; // For unique keyframes
	public scale: number; // For different pet sizes
	protected petName: string;
	protected chasingCursor = false;
	private getCursorX: (() => number) | null = null;
	protected cursorMoveDist: number; // Per-pet speed variation when following cursor
	protected tooltipEl!: HTMLElement;
	protected isHovered = false;
	protected actionLoopPaused = false;
	private speechBubbleEl: HTMLElement | null = null;
	private speechBubbleTimeout: ReturnType<typeof activeWindow.setTimeout> | null = null;
	private rightClickTextProvider: (() => string | Promise<string>) | null = null;

	constructor(
		container: Element,
		animations: Record<string, AnimationConfig>,
		moveDist: number,
		backgroundName: string,
		petId: string,
		scale: number,
		petName: string,
		rightClickTextProvider: (() => string | Promise<string>) | null = null,
	) {
		this.container = container;
		this.animations = animations;
		this.moveDist = moveDist;
		// Randomize cursor follow speed per pet (±30%) so cats spread out instead of clumping
		this.cursorMoveDist = moveDist * (0.7 + Math.random() * 0.6);
		this.backgroundName = backgroundName;
		this.petId = petId;
		this.scale = scale;
		this.petName = petName;
		this.rightClickTextProvider = rightClickTextProvider;

		this.setupActions();

		requestAnimationFrame(() => {
			// Randomized spawn within middle 80% of container
			const containerWidth = (this.container as HTMLElement).offsetWidth;
			const minX = containerWidth * 0.1;
			const maxX = containerWidth * 0.9;
			this.currentX = Math.random() * (maxX - minX) + minX;

			// Create pet HTML element to be shown in view
			this.petEl = this.createPetElement();

			// Setup the listeners for if the mouse is hovering
			this.setupHoverListeners();

			// Start the behavior
			void (async () => {
				await this.animations["idle"].action?.();
				this.startActionLoop();
			})();
		});
	}

	// Different calcs for overlay vs normal
	private getGroundTopValue(): string {
		if (this.backgroundName === "overlay") {
			return "calc(100% - 14px * var(--scale, 1))";
		}
		return this.backgroundHeights[this.backgroundName] ?? this.backgroundHeights["default"];
	}

	// Creates the div representing the pet and styles
	protected createPetElement(): HTMLElement {
		const el = this.container.createDiv({ cls: "pet" });
		const topPercent = this.getGroundTopValue();

		// Set initial CSS custom properties (to be used as variables in styles.css)
		el.setCssProps({
			"--left": `${this.currentX}px`,
			"--top": topPercent,
			"--pet-size": `${this.animations["idle"].frameWidth}px`,
			"--scale-x": `${this.direction}`,
			"--bubble-scale-x": `${1 / this.direction}`,
			"--scale": `${this.scale}`,
			"--heart-url": `url(${heartAsset})`,
		});

		this.tooltipEl = el.createDiv({ cls: "pet-name-tooltip" });
		this.tooltipEl.textContent = this.petName;
		this.tooltipEl.setCssProps({ "--scale-x": `${this.direction}` });

		return el;
	}

	// Sets up the listeners on the pets
	protected setupHoverListeners() {
		this.petEl.addEventListener("mouseenter", () => {
			this.isHovered = true;
			this.actionLoopPaused = true;
			this.freezeAtCurrentPosition();
			this.setAnimation(this.animations["sit"] ? "sit" : "idle");
		});

		this.petEl.addEventListener("mouseleave", () => {
			this.isHovered = false;
			this.actionLoopPaused = false;
		});

		this.petEl.addEventListener("click", () => {
			this.showHeart();
		})

		this.petEl.addEventListener("contextmenu", (event) => {
			event.preventDefault();
			const text = this.rightClickTextProvider?.();
			if (!text) {
				this.showHeart();
				return;
			}

			void Promise.resolve(text)
				.then((resolvedText) => {
					const finalText = resolvedText.trim();
					if (finalText) {
						this.showSpeechBubble(finalText);
						return;
					}
					this.showHeart();
				})
				.catch(() => {
					this.showHeart();
				});
		});
	}

	protected showHeart() {
		const heart = this.petEl.createDiv({ cls: "pet-heart" });

		const randomX = 25 + Math.random() * 50;
		heart.setCssProps({
			"--heart-random-x": `${randomX}%`
		});
	
		activeWindow.setTimeout(() => {
			heart.remove();
		}, 1000);
	}

	public showSpeechBubble(text: string, duration = 4500) {
		if (this.isDestroyed || !this.petEl) return;

		this.clearSpeechBubble();

		const bubble = this.petEl.createDiv({ cls: "pet-speech-bubble" });
		bubble.setCssProps({ "--bubble-scale-x": `${1 / this.direction}` });
		bubble.setText(text);
		this.speechBubbleEl = bubble;

		this.speechBubbleTimeout = activeWindow.setTimeout(() => {
			bubble.remove();
			if (this.speechBubbleEl === bubble) {
				this.speechBubbleEl = null;
			}
			this.speechBubbleTimeout = null;
		}, duration);
	}

	public clearSpeechBubble() {
		if (this.speechBubbleEl) {
			this.speechBubbleEl.remove();
			this.speechBubbleEl = null;
		}
		if (this.speechBubbleTimeout !== null) {
			activeWindow.clearTimeout(this.speechBubbleTimeout);
			this.speechBubbleTimeout = null;
		}
	}

	// Leave empty to override in subclasses
	protected setupActions() {}

	// Clamp current position within the container (if container resizes)
	public async clampToContainer() {
		if (!this.petEl || this.isDestroyed) return;

		const wasAlreadyPaused = this.actionLoopPaused;
		if (!wasAlreadyPaused) {
			this.actionLoopPaused = true;
			await new Promise(resolve => activeWindow.setTimeout(resolve, 60));
			if (this.isDestroyed) return;
		}

		// currentX is now the actual visual position (accurate post-freeze)
		const petWidth = this.animations["idle"].frameWidth;
		const containerWidth = (this.container as HTMLElement).offsetWidth;
		const minX = petWidth / 2;
		const maxX = containerWidth - petWidth / 2;
		const clampedX = Math.max(minX, Math.min(maxX, this.currentX));
		if (clampedX !== this.currentX) {
			this.currentX = clampedX;
			this.petEl.setCssProps({ "--left": `${this.currentX}px` });
		}

		if (!wasAlreadyPaused) {
			this.actionLoopPaused = false;
		}
	}

	// Update height when background change
	public updateVerticalPosition(newBackground: string) {
		this.backgroundName = newBackground;
		const newTop = this.getGroundTopValue();
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

		this.petEl.setCssStyles({ animation: "none" });
		this.petEl.offsetHeight; // Reflow

		// No keyframe animation
		this.petEl.setCssStyles({
			animation: `pet-sprite ${animation.duration}ms steps(${animation.frameCount}) infinite`
		});

		this.petEl.setCssProps({
			"--sprite-url": `url(${animation.spriteUrl})`,
			"--sprite-size": `${animation.frameCount * animation.frameWidth}px auto`,
			"--sprite-total-width": `-${animation.frameCount * animation.frameWidth}px`,
		});

		// Update tracking for which animation it is
		this.currentAnimation = animationName;
	}

	protected freezeAtCurrentPosition() {
		const computedLeft = window.getComputedStyle(this.petEl).left;
		this.petEl.setCssStyles({ transition: "" });
		this.petEl.setCssProps({ "--left": computedLeft });
		this.currentX = parseFloat(computedLeft);
	}

	// Moves the pet in x direction
	protected move(duration: number, action?: string): Promise<void> {
		if (this.actionLoopPaused) return Promise.resolve();
		const petWidth = this.animations["idle"].frameWidth;
		const containerWidth = (this.container as HTMLElement).offsetWidth;

		// Boundaries for the view
		const maxLeft = containerWidth - petWidth / 2;
		const minLeft = petWidth / 2;

		// Get a random change in x direction (biased towards the side that was already being visited)
		const magnitude =
			action?.includes("jump")
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
			// Interval to constantly check if hovered (if so stop transition)
			const hoverCheck = activeWindow.setInterval(() => {
				if (this.actionLoopPaused) {
					const computedLeft = window.getComputedStyle(this.petEl).left;
					this.petEl.setCssStyles({ transition: "" });
					this.petEl.setCssProps({ "--left": computedLeft });
					
					// Update current position to where it stopped
					this.currentX = parseFloat(computedLeft);
					
					// Clean up
					activeWindow.clearInterval(hoverCheck);
					this.petEl.removeEventListener("transitionend", done);
					
					res();
				}
			}, 50);
			
			// Cleanup function for after transition
			const done = () => {
				activeWindow.clearInterval(hoverCheck); // Need to clear interval to prevent memory leak
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
			this.tooltipEl?.setCssProps({ "--scale-x": `${this.direction}` });
			this.speechBubbleEl?.setCssProps({ "--bubble-scale-x": `${1 / this.direction}` });
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
			// Check if is hovered
			while (this.actionLoopPaused && !this.isDestroyed) {
				await new Promise(resolve => activeWindow.setTimeout(resolve, 100));
			}

			if (this.isDestroyed) {
				break;
			}

			// Pick and run a random action
			const randomAction =
				ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
			await this.animations[randomAction].action?.();

			while (this.actionLoopPaused && !this.isDestroyed) {
				await new Promise(resolve => activeWindow.setTimeout(resolve, 100));
			}

			if (this.isDestroyed) {
				break;
			}

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

	public startFollowingCursor(getCursorX: () => number): void {
		this.getCursorX = getCursorX;
		this.chasingCursor = true;
	}

	public stopFollowingCursor(): void {
		this.chasingCursor = false;
		this.getCursorX = null;
	}

	protected async followCursorStep(): Promise<void> {
		if (!this.getCursorX || this.isDestroyed) return;
		const petWidth = this.animations["idle"].frameWidth;
		const containerWidth = (this.container as HTMLElement).offsetWidth;
		const minLeft = petWidth / 2;
		const maxLeft = containerWidth - petWidth / 2;

		const targetX = Math.max(minLeft, Math.min(maxLeft, this.getCursorX()));
		const dx = targetX - this.currentX;
		if (Math.abs(dx) < 2) {
			this.setAnimation("idle");
			return;
		}

		this.direction = dx < 0 ? -1 : 1;
		const step = Math.sign(dx) * Math.min(Math.abs(dx), this.cursorMoveDist);
		this.currentX = Math.max(minLeft, Math.min(maxLeft, this.currentX + step));

		this.setAnimation("run");
		this.petEl.setCssProps({
			"--left": `${this.currentX}px`,
			"--scale-x": `${this.direction}`,
		});
		this.tooltipEl?.setCssProps({ "--scale-x": `${this.direction}` });
		this.speechBubbleEl?.setCssProps({ "--bubble-scale-x": `${1 / this.direction}` });
	}

	// Destroys pet instance
	public async destroy() {
		this.isDestroyed = true;
		if (this.speechBubbleTimeout !== null) {
			activeWindow.clearTimeout(this.speechBubbleTimeout);
			this.speechBubbleTimeout = null;
		}
		// Death animation (wait for the animation to finish)
		this.setAnimation("die");
		await new Promise((resolve) =>
			activeWindow.setTimeout(resolve, this.animations["die"].duration)
		);
		// Removes instance from DOM
		this.petEl.remove();
	}

	public destroyImmediate() {
		this.isDestroyed = true;
		if (this.speechBubbleTimeout !== null) {
			activeWindow.clearTimeout(this.speechBubbleTimeout);
			this.speechBubbleTimeout = null;
		}
		this.speechBubbleEl?.remove();
		this.speechBubbleEl = null;
		this.petEl?.remove();
	}
}
