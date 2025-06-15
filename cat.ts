// Defines shape for parameters needed to pass in an animation
type AnimationConfig = {
	name: string;
	spriteUrl: string; // Link to the spritesheet
	frameCount: number; // Number of frames in spritesheet
	frameWidth: number;
	frameHeight: number;
	duration: number; // Of animation (ms)
};

// UPDATE CAT CLASS FOR MORE RANDOM MOVEMENT

// Cat class to make code more modular (each one spawns a new instance of cat)
export class Cat {
	private container: Element;
	private catEl: HTMLElement;
	private currentX = 200;
	private direction = 1; // 1 right, -1 left
	private currentAnimation = "none";
	private animations: Record<string, AnimationConfig>;
	private actionInterval: ReturnType<typeof setInterval> | undefined;

	constructor(
		container: Element,
		animations: Record<string, AnimationConfig>
	) {
		this.container = container;
		this.animations = animations;

		// Create cat
		this.catEl = this.createCatElement();
		// Start animation
		this.setAnimation("idle");
		// Start other behaviours
		this.startBehaviorLoop();
	}

	private createCatElement(): HTMLElement {
		// Create the cat's div and add styling
		const el = this.container.createDiv({ cls: "cat" });
		el.style.left = `${this.currentX}px`;
		el.style.top = "80%";
		el.style.width = `${this.animations["idle"].frameWidth}px`
		el.style.height = `${this.animations["idle"].frameWidth}px`
		return el;
	}

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

		// Add new animation
		this.catEl.offsetHeight; // Trigger reflow (make new animation play)
		this.catEl.style.backgroundImage = `url(${animation.spriteUrl})`;
		this.catEl.style.backgroundSize = `${
			animation.frameCount * animation.frameWidth
		}px auto`;
		// Play the animation with that name for X long and Y steps
		this.catEl.style.animation = `${animation.name} ${animation.duration}ms steps(${animation.frameCount}) infinite`;
		// Create the animation for above ^^
		this.keyFrameAnimation(animation);

		// Set it to the new animation
		this.currentAnimation = animationName;
	}

	private keyFrameAnimation(animation: AnimationConfig) {
		// Avoid duplicate animations
		if (document.getElementById(`kf-${animation.name}`)) {
			return;
		}

		// Define style info for the doc w/ tag
		const style = document.createElement("style");
		style.id = `kf-${animation.name}`;

		// Add the animation for the spritesheet
		style.innerHTML = `
		@keyframes ${animation.name} {
			from { background-position: 0 0; }
			to { background-position: -${animation.frameCount * animation.frameWidth}px 0; }
		}`;

		// Add animation to the html
		document.head.appendChild(style);
	}

	// Moves the cat in x direction
	private move(dx: number, duration: number) {
		// End location and direction
		const targetX = this.currentX + dx;
		this.direction = dx < 0 ? -1 : 1;

		// Movement to that position
		this.catEl.style.transition = `left ${duration}ms linear`;
		this.catEl.style.left = `${targetX}px`;
		this.catEl.style.transform = `translate(-50%, -50%) scaleX(${this.direction})`; // Translate + scaleX to ensure its smooth (not unordinary flipping)

		// Update currentX after movement
		this.currentX = targetX;

		// Clean up transition after done
		setTimeout(() => {
			this.catEl.style.transition = "";
		}, duration);
	}

	// Main actions of the cat
	private startBehaviorLoop() {
		// CHANGE TO MAKE IT RANDOMIZE THE ACTION
		this.actionInterval = setInterval(() => {
			const jumpAnim = this.animations["jump"];
			const CAT_WIDTH = 32;
			const containerWidth = (this.container as HTMLElement).offsetWidth;

			// Boundaries for the view
			const maxLeft = containerWidth - CAT_WIDTH / 2;
			const minLeft = CAT_WIDTH / 2;

			// Get a random change in x direction
			const magnitude = Math.floor(Math.random() * 20) + 40;
			const direction = Math.random() < 0.5 ? -1 : 1;
			let dx = magnitude * direction;
			const proposedX = this.currentX + dx;

			// Clamp it within bounds (reverse the direction if too close to edge)
			if (proposedX < minLeft || proposedX > maxLeft) {
				dx = -dx;
			}

			// Change the animation to jumping
			this.setAnimation("jump");
			this.move(dx, jumpAnim.duration);

			// Change animation back to idle
			setTimeout(() => {
				this.setAnimation("idle");
			}, this.animations["jump"].duration);
		}, 3000);
	}

	// Function to clean up the cat instance when unloaded/onClose
	public destroy() {
		clearInterval(this.actionInterval);
		this.setAnimation("die");
		setTimeout(() => {
			this.catEl.remove();
		}, this.animations["die"].duration);
	}
}
