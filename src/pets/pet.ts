import { heartAsset } from "../catalog/assets";
import { Floor } from "../floor";

const ANIMATION_NAMES = [
	"idle",
	"idle2",
	"jump",
	"jump2",
	"run",
	"sit",
	"sleep",
	"die",
	"liking",
	"fly",
] as const;

export type AnimationName = (typeof ANIMATION_NAMES)[number];

const MOVE_TIMEOUT_MARGIN = 200;

function isAnimationName(key: string): key is AnimationName {
	return (ANIMATION_NAMES as readonly string[]).includes(key);
}

function getRandDelay(min: number, max: number, multiple: number): number {
	const random = Math.random() * (max - min) + min;
	return Math.round(random / multiple) * multiple;
}

// Defines shape for parameters needed to pass in an animation
export interface AnimationConfig {
	spriteUrl: string; // Link to the spritesheet
	frameCount: number; // Number of frames in spritesheet
	frameWidth: number;
	duration: number; // Of animation (ms)
}

export type PetAnimations = { idle: AnimationConfig } & Partial<
	Record<AnimationName, AnimationConfig>
>;

// Make size changeable

export class Pet {
	protected container: HTMLElement;
	petEl!: HTMLElement;
	protected currentX!: number;
	protected direction = 1; // 1 right, -1 left
	private currentAnimation: AnimationName | "none" = "none";
	protected animations: PetAnimations;
	protected isDestroyed = false; // Check if pet instance has been destroyed
	protected moveDist: number; // For different pet movements
	private floor: Floor;
	scale: number;
	protected petName: string;
	protected tooltipEl!: HTMLElement;
	protected actionLoopPaused = false;
	private pauseWaiters: (() => void)[] = [];
	private interruptMove: (() => void) | null = null;

	constructor(
		container: HTMLElement,
		animations: PetAnimations,
		moveDist: number,
		floor: Floor,
		scale: number,
		petName: string,
	) {
		this.container = container;
		this.animations = animations;
		this.moveDist = moveDist;
		this.floor = floor;
		this.scale = scale;
		this.petName = petName;

		window.requestAnimationFrame(() => {
			if (this.isDestroyed) return;
			// Randomized spawn within middle 80% of container
			const containerWidth = this.container.offsetWidth;
			const bounds = this.getHorizontalBounds();
			const minX = Math.max(containerWidth * 0.1, bounds.minLeft);
			const maxX = Math.min(containerWidth * 0.9, bounds.maxLeft);
			this.currentX = Math.random() * (maxX - minX) + minX;

			// Create pet HTML element to be shown in view
			this.petEl = this.createPetElement();

			// Setup the listeners for if the mouse is hovering
			this.setupHoverListeners();

			// Start the behavior
			void (async () => {
				await this.performAction("idle");
				await this.startActionLoop();
			})();
		});
	}

	private getGroundTopValue(): string {
		if (this.floor.kind === "bottom") {
			return "calc(100% - 14px * var(--scale, 1))";
		}
		return `${this.floor.value}%`;
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
			this.pauseActionLoop();
			this.freezeAtCurrentPosition();
			this.setAnimation(this.animations["sit"] ? "sit" : "idle");
		});

		this.petEl.addEventListener("mouseleave", () => {
			this.resumeActionLoop();
		});

		this.petEl.addEventListener("click", () => {
			this.showHeart();
			this.playSound();
		});
	}

	protected playSound(): void {}

	protected showHeart() {
		const heart = this.petEl.createDiv({ cls: "pet-heart" });

		const randomX = 25 + Math.random() * 50;
		heart.setCssProps({
			"--heart-random-x": `${randomX}%`,
		});

		window.setTimeout(() => {
			heart.remove();
		}, 1000);
	}

	protected performAction(_name: AnimationName, _repeats = 1): Promise<void> {
		return Promise.resolve();
	}

	protected getAnimationNames(): AnimationName[] {
		return Object.keys(this.animations).filter(isAnimationName);
	}

	protected requireAnimation(name: AnimationName): AnimationConfig {
		const animation = this.animations[name];
		if (!animation) {
			throw new Error(`Animation "${name}" not found`);
		}
		return animation;
	}

	protected getHorizontalBounds(): { minLeft: number; maxLeft: number } {
		const halfWidth = (this.animations["idle"].frameWidth * this.scale) / 2;
		return { minLeft: halfWidth, maxLeft: this.container.offsetWidth - halfWidth };
	}

	// Clamp current position within the container (if container resizes)
	async clampToContainer() {
		if (!this.petEl || this.isDestroyed || this.container.offsetWidth === 0) return;

		const wasAlreadyPaused = this.actionLoopPaused;
		if (!wasAlreadyPaused) {
			this.pauseActionLoop();
			this.freezeAtCurrentPosition();
		}

		const { minLeft, maxLeft } = this.getHorizontalBounds();
		const clampedX = Math.max(minLeft, Math.min(maxLeft, this.currentX));
		if (clampedX !== this.currentX) {
			this.currentX = clampedX;
			this.petEl.setCssProps({ "--left": `${this.currentX}px` });
		}

		if (!wasAlreadyPaused) {
			this.resumeActionLoop();
		}
	}

	updateVerticalPosition(newFloor: Floor) {
		this.floor = newFloor;
		const newTop = this.getGroundTopValue();
		this.petEl?.setCssProps({ "--top": newTop });
	}

	// Add an animation for the pet
	protected setAnimation(animationName: AnimationName) {
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
		void this.petEl.offsetHeight; // Reflow

		// No keyframe animation
		this.petEl.setCssStyles({
			animation: `pet-sprite ${animation.duration}ms steps(${animation.frameCount}) infinite`,
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
		this.petEl.setCssStyles({ transition: "none" });
		this.petEl.setCssProps({ "--left": computedLeft });
		void this.petEl.offsetHeight;
		this.petEl.setCssStyles({ transition: "" });
		this.currentX = parseFloat(computedLeft);
		this.interruptMove?.(); // directly stop on hover
	}

	// Moves the pet in x direction
	protected move(duration: number, action?: AnimationName): Promise<void> {
		if (this.actionLoopPaused) return Promise.resolve();
		const { minLeft, maxLeft } = this.getHorizontalBounds();

		// Get a random change in x direction (biased towards the side that was already being visited)
		const magnitude = action?.includes("jump")
			? this.moveDist * (Math.random() * 0.3 + 1.5)
			: this.moveDist; // Diff distance based on jumping vs running
		const bias = 0.9;
		const direction = Math.random() < bias ? this.direction : -this.direction;
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
			let settled = false;

			const settle = () => {
				// settle stops movement
				if (settled) return;
				settled = true;
				window.clearTimeout(timeout);
				this.petEl.removeEventListener("transitionend", done);
				this.interruptMove = null;
				res();
			};

			const done = (e?: TransitionEvent) => {
				if (e && (e.target !== this.petEl || e.propertyName !== "left")) return; // only explicitly stop for when style sets left of this specific pet
				this.petEl.setCssStyles({ transition: "" });
				this.currentX = targetX;
				settle();
			};
			this.petEl.addEventListener("transitionend", done);
			const timeout = window.setTimeout(() => done(), duration + MOVE_TIMEOUT_MARGIN);

			this.interruptMove = settle;

			void this.petEl.offsetWidth; // Reflow for new animation reset
			// Show moving animation
			this.petEl.setCssProps({
				"--left": `${targetX}px`,
				"--scale-x": `${this.direction}`,
				"--move-duration": `${duration}ms`,
			});
			this.tooltipEl?.setCssProps({ "--scale-x": `${this.direction}` });
		});
	}

	protected pauseActionLoop() {
		this.actionLoopPaused = true;
	}

	protected resumeActionLoop() {
		this.actionLoopPaused = false;
		this.releasePauseWaiters();
	}

	protected async waitWhilePaused(): Promise<void> {
		while (this.actionLoopPaused && !this.isDestroyed) {
			await new Promise<void>((resolve) => {
				this.pauseWaiters.push(resolve);
			});
		}
	}

	private releasePauseWaiters() {
		const waiters = this.pauseWaiters;
		this.pauseWaiters = [];
		for (const resolve of waiters) {
			resolve();
		}
	}

	protected async startActionLoop() {
		while (!this.isDestroyed) {
			const tookOver = await this.runPriorityBehaviour();
			if (!tookOver) {
				await this.runRoutine();
			}
		}
	}

	protected runPriorityBehaviour(): Promise<boolean> {
		return Promise.resolve(false);
	}

	protected async runRoutine(): Promise<void> {
		await this.waitWhilePaused();
		if (this.isDestroyed) return;

		const actions = this.routineActions();
		await this.performAction(actions[Math.floor(Math.random() * actions.length)]);

		await this.waitWhilePaused();
		if (this.isDestroyed) return;

		const movingAnimation = this.movingAnimation();
		const moving = this.requireAnimation(movingAnimation);
		const delay = getRandDelay(3000, 8000, moving.duration);
		await this.performAction(movingAnimation, Math.floor(delay / moving.duration));
	}

	protected routineActions(): AnimationName[] {
		return this.getAnimationNames().filter((name) => name !== "die" && name !== "run");
	}

	protected movingAnimation(): AnimationName {
		return "run";
	}

	// Destroys pet instance
	async destroy() {
		if (this.isDestroyed) return;
		this.isDestroyed = true;
		this.releasePauseWaiters();
		if (!this.petEl) return;
		await this.playDeathAnimation();
		this.petEl.remove();
	}

	protected async playDeathAnimation() {
		this.setAnimation("die");
		await new Promise((resolve) =>
			window.setTimeout(resolve, this.requireAnimation("die").duration),
		);
	}

	destroyImmediate() {
		this.isDestroyed = true;
		this.releasePauseWaiters();
		this.petEl?.remove();
	}
}
