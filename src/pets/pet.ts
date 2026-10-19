import { heartAsset } from "../catalog/assets";
import { Floor } from "../floor";
import { SoundPlayer } from "../audio/sounds";

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

export interface AnimationConfig {
	spriteUrl: string;
	frameCount: number;
	frameWidth: number;
	duration: number;
}

export type PetAnimations = { idle: AnimationConfig } & Partial<
	Record<AnimationName, AnimationConfig>
>;

interface Sleeper {
	timer: number | undefined;
	finish: () => void;
}

export abstract class Pet {
	protected container: HTMLElement;
	petEl: HTMLElement | null = null;
	protected currentX = 0;
	protected direction = 1;
	private currentAnimation: AnimationName | "none" = "none";
	protected animations: PetAnimations;
	protected isDestroyed = false;
	protected moveDist: number;
	private floor: Floor;
	scale: number;
	protected petName: string;
	protected tooltipEl: HTMLElement | null = null;
	protected actionLoopPaused = false;
	private hovered = false;
	private stagePaused = false;
	private sleeper: Sleeper | null = null;
	private pauseWaiters: (() => void)[] = [];
	private interruptMove: (() => void) | null = null;

	constructor(
		container: HTMLElement,
		animations: PetAnimations,
		moveDist: number,
		floor: Floor,
		scale: number,
		petName: string,
		protected readonly sounds: SoundPlayer,
	) {
		this.container = container;
		this.animations = animations;
		this.moveDist = moveDist;
		this.floor = floor;
		this.scale = scale;
		this.petName = petName;
	}

	start(): void {
		window.requestAnimationFrame(() => {
			if (this.isDestroyed) return;
			const containerWidth = this.container.offsetWidth;
			const bounds = this.getHorizontalBounds();
			const minX = Math.max(containerWidth * 0.1, bounds.minLeft);
			const maxX = Math.min(containerWidth * 0.9, bounds.maxLeft);
			this.currentX = Math.random() * (maxX - minX) + minX;

			this.petEl = this.createPetElement();
			this.setupHoverListeners();

			void (async () => {
				await this.performAction("idle");
				await this.startActionLoop();
			})();
		});
	}

	protected requirePetEl(): HTMLElement {
		if (!this.petEl) {
			throw new Error("Pet has not started");
		}
		return this.petEl;
	}

	private getGroundTopValue(): string {
		if (this.floor.kind === "bottom") {
			return "calc(100% - 14px * var(--pixel-pets-scale, 1))";
		}
		return `${this.floor.value}%`;
	}

	protected createPetElement(): HTMLElement {
		const el = this.container.createDiv({ cls: "pixel-pets-pet" });
		const topPercent = this.getGroundTopValue();

		el.setCssProps({
			"--pixel-pets-left": `${this.currentX}px`,
			"--pixel-pets-top": topPercent,
			"--pixel-pets-pet-size": `${this.animations["idle"].frameWidth}px`,
			"--pixel-pets-scale-x": `${this.direction}`,
			"--pixel-pets-scale": `${this.scale}`,
			"--pixel-pets-heart-url": `url(${heartAsset})`,
		});

		this.tooltipEl = el.createDiv({ cls: "pixel-pets-pet__tooltip" });
		this.tooltipEl.textContent = this.petName;
		this.tooltipEl.setCssProps({ "--pixel-pets-scale-x": `${this.direction}` });

		return el;
	}

	protected setupHoverListeners() {
		const el = this.requirePetEl();
		el.addEventListener("mouseenter", () => {
			this.hovered = true;
			this.pauseActionLoop();
			this.freezeAtCurrentPosition();
			this.setAnimation(this.animations["sit"] ? "sit" : "idle");
		});

		el.addEventListener("mouseleave", () => {
			this.hovered = false;
			if (!this.stagePaused) {
				this.resumeActionLoop();
			}
		});

		el.addEventListener("click", () => {
			this.showHeart();
			this.playSound();
		});
	}

	protected playSound(): void {}

	protected showHeart() {
		const heart = this.requirePetEl().createDiv({ cls: "pixel-pets-pet__heart" });

		const randomX = 25 + Math.random() * 50;
		heart.setCssProps({
			"--pixel-pets-heart-random-x": `${randomX}%`,
		});

		window.setTimeout(() => {
			heart.remove();
		}, 1000);
	}

	protected abstract performAction(name: AnimationName, repeats?: number): Promise<void>;

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

	async clampToContainer() {
		const el = this.petEl;
		if (!el || this.isDestroyed || this.container.offsetWidth === 0) return;

		const wasAlreadyPaused = this.actionLoopPaused;
		if (!wasAlreadyPaused) {
			this.pauseActionLoop();
			this.freezeAtCurrentPosition();
		}

		const { minLeft, maxLeft } = this.getHorizontalBounds();
		const clampedX = Math.max(minLeft, Math.min(maxLeft, this.currentX));
		if (clampedX !== this.currentX) {
			this.currentX = clampedX;
			el.setCssProps({ "--pixel-pets-left": `${this.currentX}px` });
		}

		if (!wasAlreadyPaused) {
			this.resumeActionLoop();
		}
	}

	updateVerticalPosition(newFloor: Floor) {
		this.floor = newFloor;
		const newTop = this.getGroundTopValue();
		this.petEl?.setCssProps({ "--pixel-pets-top": newTop });
	}

	protected setAnimation(animationName: AnimationName) {
		if (this.currentAnimation === animationName) {
			return;
		}

		const animation = this.animations[animationName];
		if (!animation) {
			return;
		}

		const el = this.requirePetEl();
		el.addClass("pixel-pets-pet--restart");
		void el.offsetHeight;
		el.removeClass("pixel-pets-pet--restart");

		el.setCssProps({
			"--pixel-pets-sprite-duration": `${animation.duration}ms`,
			"--pixel-pets-frame-count": `${animation.frameCount}`,
			"--pixel-pets-sprite-url": `url(${animation.spriteUrl})`,
			"--pixel-pets-sprite-size": `${animation.frameCount * animation.frameWidth}px auto`,
			"--pixel-pets-sprite-total-width": `-${animation.frameCount * animation.frameWidth}px`,
		});

		this.currentAnimation = animationName;
	}

	protected freezeAtCurrentPosition() {
		const el = this.requirePetEl();
		const computedLeft = window.getComputedStyle(el).left;
		el.addClass("pixel-pets-pet--frozen");
		el.setCssProps({ "--pixel-pets-left": computedLeft });
		void el.offsetHeight;
		el.removeClass("pixel-pets-pet--frozen");
		this.currentX = parseFloat(computedLeft);
		this.interruptMove?.();
	}

	protected move(duration: number, action?: AnimationName): Promise<void> {
		if (this.actionLoopPaused) return Promise.resolve();
		const el = this.requirePetEl();
		const { minLeft, maxLeft } = this.getHorizontalBounds();

		const magnitude = action?.includes("jump")
			? this.moveDist * (Math.random() * 0.3 + 1.5)
			: this.moveDist;
		const bias = 0.9;
		const direction = Math.random() < bias ? this.direction : -this.direction;
		let dx = magnitude * direction;
		const possibleX = this.currentX + dx;

		if (possibleX < minLeft || possibleX > maxLeft) {
			dx = -dx;
		}
		const targetX = Math.max(minLeft, Math.min(maxLeft, this.currentX + dx));

		if (targetX === this.currentX) {
			return Promise.resolve();
		}

		this.direction = targetX < this.currentX ? -1 : 1;

		return new Promise((res) => {
			let settled = false;

			const settle = () => {
				if (settled) return;
				settled = true;
				window.clearTimeout(timeout);
				el.removeEventListener("transitionend", done);
				this.interruptMove = null;
				res();
			};

			const done = (e?: TransitionEvent) => {
				if (e && (e.target !== el || e.propertyName !== "left")) return;
				this.currentX = targetX;
				settle();
			};
			el.addEventListener("transitionend", done);
			const timeout = window.setTimeout(() => done(), duration + MOVE_TIMEOUT_MARGIN);

			this.interruptMove = settle;

			void el.offsetWidth;
			el.setCssProps({
				"--pixel-pets-left": `${targetX}px`,
				"--pixel-pets-scale-x": `${this.direction}`,
				"--pixel-pets-move-duration": `${duration}ms`,
			});
			this.tooltipEl?.setCssProps({ "--pixel-pets-scale-x": `${this.direction}` });
		});
	}

	protected pauseActionLoop() {
		this.actionLoopPaused = true;
	}

	protected resumeActionLoop() {
		this.actionLoopPaused = false;
		this.releasePauseWaiters();
	}

	pause() {
		if (this.stagePaused) return;
		this.stagePaused = true;
		this.pauseActionLoop();
		if (this.sleeper) {
			window.clearTimeout(this.sleeper.timer);
			this.sleeper.timer = undefined;
		}
	}

	resume() {
		if (!this.stagePaused) return;
		this.stagePaused = false;
		this.hovered = this.petEl?.matches(":hover") ?? false;
		if (!this.hovered) {
			this.resumeActionLoop();
		}
		this.sleeper?.finish();
	}

	protected sleep(ms: number): Promise<void> {
		return new Promise((resolve) => {
			if (this.isDestroyed) {
				resolve();
				return;
			}
			const sleeper: Sleeper = {
				timer: undefined,
				finish: () => {
					window.clearTimeout(sleeper.timer);
					if (this.sleeper === sleeper) {
						this.sleeper = null;
					}
					resolve();
				},
			};
			this.sleeper = sleeper;
			if (!this.stagePaused) {
				sleeper.timer = window.setTimeout(sleeper.finish, ms);
			}
		});
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

	async destroy() {
		if (this.isDestroyed) return;
		this.isDestroyed = true;
		this.releasePauseWaiters();
		this.sleeper?.finish();
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
		this.sleeper?.finish();
		this.petEl?.remove();
	}
}
