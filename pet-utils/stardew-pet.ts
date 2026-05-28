import { heartAsset } from "./pet-assets";
import { getStardewSpeciesSprite, StardewAnimation, StardewSpeciesDefinition } from "./stardew-species";

type AnimationState = StardewAnimation | StardewAnimation[];

function toAnimation(animation: AnimationState | undefined): StardewAnimation | undefined {
	if (!animation) return undefined;
	return Array.isArray(animation) ? animation[0] : animation;
}

function wait(ms: number): Promise<void> {
	return new Promise((resolve) => activeWindow.setTimeout(resolve, ms));
}

export class StardewPet {
	public petEl!: HTMLElement;
	public scale: number;
	private spriteFrameWidth = 16;
	private spriteFrameHeight = 16;
	private currentX!: number;
	private currentY!: number;
	private direction = 1;
	private isDestroyed = false;
	private animationTimer: ReturnType<typeof activeWindow.setInterval> | null = null;
	private speechBubbleEl: HTMLElement | null = null;
	private speechBubbleTimeout: ReturnType<typeof activeWindow.setTimeout> | null = null;
	private actionLoopPaused = false;
	private readonly spritesheetUrl: string;
	private readonly definition: StardewSpeciesDefinition;
	private readonly petName: string;
	private readonly rightClickTextProvider: (() => string | Promise<string>) | null;
	private isDragging = false;
	private dragThreshold = 3;

	constructor(
		private container: Element,
		definition: StardewSpeciesDefinition,
		backgroundName: string,
		petId: string,
		scale: number,
		petName: string,
		rightClickTextProvider: (() => string | Promise<string>) | null = null,
	) {
		this.definition = definition;
		this.scale = scale;
		this.petName = petName;
		this.rightClickTextProvider = rightClickTextProvider;
		this.spritesheetUrl = getStardewSpeciesSprite(definition.id);

		requestAnimationFrame(() => {
			const containerWidth = (this.container as HTMLElement).offsetWidth || 400;
			const containerHeight = (this.container as HTMLElement).offsetHeight || 300;
			const minX = containerWidth * 0.1;
			const maxX = containerWidth * 0.9;
			const minY = containerHeight * 0.1;
			const maxY = containerHeight * 0.9;
			this.currentX = Math.random() * (maxX - minX) + minX;
			this.currentY = Math.random() * (maxY - minY) + minY;
			this.petEl = this.createPetElement(petId);
			this.setupHoverListeners();
			void this.initializeSprite().then(() => {
				void this.playAnimation("idle");
				void this.startActionLoop();
			});
		});
	}

	private createPetElement(petId: string): HTMLElement {
		const el = this.container.createDiv({ cls: "pet stardew-pet", attr: { "data-pet-id": petId } });
		const fw = (this.definition.frameWidth || this.definition.frameSize || 16) * this.definition.scale;
		const fh = (this.definition.frameHeight || this.definition.frameSize || 16) * this.definition.scale;
		el.setCssProps({
			"--left": `${this.currentX}px`,
			"--top": `${this.currentY}px`,
			"--pet-size": `${fh}px`,
			"--pet-width": `${fw}px`,
			"--pet-height": `${fh}px`,
			"--scale-x": `${this.direction}`,
			"--bubble-scale-x": `${1 / this.direction}`,
			"--scale": `${this.scale}`,
			"--heart-url": `url(${heartAsset})`,
		});
		el.createDiv({ cls: "pet-name-tooltip" }).setText(this.petName);
		return el;
	}

	private async initializeSprite() {
		const img = new Image();
		img.src = this.spritesheetUrl;
		await new Promise<void>((resolve, reject) => {
			img.onload = () => resolve();
			img.onerror = () => reject(new Error(`Failed to load Stardew pet sprite: ${this.definition.sprite}`));
		});

		const maxRow = this.getMaxRow();
		const inferredFrame = maxRow >= 0 ? Math.floor(img.naturalHeight / (maxRow + 1)) : 16;
		this.spriteFrameWidth = this.definition.frameWidth || this.definition.frameSize || inferredFrame;
		this.spriteFrameHeight = this.definition.frameHeight || this.definition.frameSize || inferredFrame;

		this.petEl.setCssStyles({
			backgroundImage: `url('${this.spritesheetUrl}')`,
			backgroundRepeat: "no-repeat",
			backgroundSize: `${img.naturalWidth * this.definition.scale}px ${img.naturalHeight * this.definition.scale}px`,
			imageRendering: "pixelated",
		});
		this.petEl.setCssProps({
			"--pet-size": `${this.spriteFrameHeight * this.definition.scale}px`,
			"--pet-width": `${this.spriteFrameWidth * this.definition.scale}px`,
			"--pet-height": `${this.spriteFrameHeight * this.definition.scale}px`,
		});
		this.applyFrame([0, 0]);
	}

	private getMaxRow(): number {
		let maxY = 0;
		for (const key of Object.keys(this.definition.animations)) {
			const anim = this.definition.animations[key];
			const list = Array.isArray(anim) ? anim : [anim];
			for (const animation of list) {
				for (const frame of animation.frames) {
					if (frame[1] > maxY) {
						maxY = frame[1];
					}
				}
			}
		}
		return maxY;
	}

	private applyFrame(frame: [number, number]) {
		const [ox, oy] = this.definition.variantOffset ?? [0, 0];
		const x = -((frame[0] + ox) * this.spriteFrameWidth) * this.definition.scale;
		const y = -((frame[1] + oy) * this.spriteFrameHeight) * this.definition.scale;
		this.petEl.setCssStyles({ backgroundPosition: `${x}px ${y}px` });
	}

	private async playAnimation(name: string) {
		if (this.isDestroyed) return;
		const animation = toAnimation(this.definition.animations[name]);
		if (!animation) return;

		if (this.animationTimer !== null) {
			activeWindow.clearInterval(this.animationTimer);
			this.animationTimer = null;
		}

		this.setFlip(Boolean(animation.flip));
		this.applyFrame(animation.frames[0] ?? [0, 0]);

		let frameIndex = 0;
		const interval = Math.max(16, Math.floor(1000 / animation.fps));
		this.animationTimer = activeWindow.setInterval(() => {
			if (this.isDestroyed) {
				if (this.animationTimer !== null) {
					activeWindow.clearInterval(this.animationTimer);
					this.animationTimer = null;
				}
				return;
			}

			frameIndex += 1;
			if (frameIndex >= animation.frames.length) {
				if (animation.loop === false) {
					if (this.animationTimer !== null) {
						activeWindow.clearInterval(this.animationTimer);
						this.animationTimer = null;
					}
					return;
				}
				frameIndex = 0;
			}

			const frame = animation.frames[frameIndex];
			if (frame) {
				this.applyFrame(frame);
			}
		}, interval);
	}

	private setFlip(flip: boolean) {
		const nextDirection = flip ? -1 : 1;
		if (this.direction === nextDirection) return;
		this.direction = nextDirection;
		this.petEl.setCssProps({
			"--scale-x": `${this.direction}`,
			"--bubble-scale-x": `${1 / this.direction}`,
		});
		this.speechBubbleEl?.setCssProps({ "--bubble-scale-x": `${1 / this.direction}` });
	}

	private setupHoverListeners() {
		this.petEl.addEventListener("mouseenter", () => {
			this.actionLoopPaused = true;
			this.freezeAtCurrentPosition();
			void this.playAnimation(this.definition.animations.sleep ? "sleep" : "idle");
		});

		this.petEl.addEventListener("mouseleave", () => {
			this.actionLoopPaused = false;
		});

		this.petEl.addEventListener("mousedown", (event) => {
			this.handleMouseDown(event);
		});

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
				.catch(() => this.showHeart());
		});
	}

	private handleMouseDown(event: MouseEvent) {
		if (event.button !== 0) return;
		event.preventDefault();

		let hasDragged = false;
		const startX = event.clientX;
		const startY = event.clientY;
		const startPetX = this.currentX;
		const startPetY = this.currentY;

		const onMouseMove = (ev: MouseEvent) => {
			const dx = ev.clientX - startX;
			const dy = ev.clientY - startY;

			if (!hasDragged && (Math.abs(dx) > this.dragThreshold || Math.abs(dy) > this.dragThreshold)) {
				hasDragged = true;
				this.actionLoopPaused = true;
				this.petEl.setCssStyles({ transition: "none" });
			}

			if (hasDragged) {
				this.currentX = startPetX + dx;
				this.currentY = startPetY + dy;
				this.petEl.setCssProps({
					"--left": `${this.currentX}px`,
					"--top": `${this.currentY}px`,
				});
			}
		};

		const onMouseUp = () => {
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);

			if (hasDragged) {
				this.actionLoopPaused = false;
				this.petEl.setCssStyles({ transition: "" });
			} else {
				this.showHeart();
			}
		};

		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
	}

	private showHeart() {
		const heart = this.petEl.createDiv({ cls: "pet-heart" });
		const randomX = 25 + Math.random() * 50;
		heart.setCssProps({ "--heart-random-x": `${randomX}%` });
		activeWindow.setTimeout(() => heart.remove(), 1000);
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

	private getGroundTopValue(backgroundName: string): string {
		void backgroundName;
		return `${this.currentY}px`;
	}

	public updateVerticalPosition(newBackground: string) {
		this.petEl.setCssProps({ "--top": this.getGroundTopValue(newBackground) });
	}

	public async clampToContainer() {
		if (!this.petEl || this.isDestroyed) return;
		const petWidth = this.spriteFrameWidth * this.definition.scale;
		const petHeight = this.spriteFrameHeight * this.definition.scale;
		const containerWidth = (this.container as HTMLElement).offsetWidth;
		const containerHeight = (this.container as HTMLElement).offsetHeight;
		const minX = petWidth / 2;
		const maxX = containerWidth - petWidth / 2;
		const minY = petHeight / 2;
		const maxY = containerHeight - petHeight / 2;
		const clampedX = Math.max(minX, Math.min(maxX, this.currentX));
		const clampedY = Math.max(minY, Math.min(maxY, this.currentY));
		if (clampedX !== this.currentX) {
			this.currentX = clampedX;
		}
		if (clampedY !== this.currentY) {
			this.currentY = clampedY;
		}
		this.petEl.setCssProps({
			"--left": `${this.currentX}px`,
			"--top": `${this.currentY}px`,
		});
	}

	private freezeAtCurrentPosition() {
		const computedLeft = window.getComputedStyle(this.petEl).left;
		const computedTop = window.getComputedStyle(this.petEl).top;
		this.petEl.setCssStyles({ transition: "" });
		this.petEl.setCssProps({ "--left": computedLeft });
		this.petEl.setCssProps({ "--top": computedTop });
		this.currentX = parseFloat(computedLeft);
		this.currentY = parseFloat(computedTop);
	}

	private async move(duration: number, directionName: "left" | "right" | "up" | "down") {
		if (this.actionLoopPaused || this.isDestroyed) return;
		const petWidth = this.spriteFrameWidth * this.definition.scale;
		const petHeight = this.spriteFrameHeight * this.definition.scale;
		const containerWidth = (this.container as HTMLElement).offsetWidth;
		const containerHeight = (this.container as HTMLElement).offsetHeight;
		const maxLeft = containerWidth - petWidth / 2;
		const minLeft = petWidth / 2;
		const maxTop = containerHeight - petHeight / 2;
		const minTop = petHeight / 2;
		let targetX = this.currentX;
		let targetY = this.currentY;
		if (directionName === "left") {
			targetX = this.currentX - this.definition.moveDist;
			this.direction = -1;
		} else if (directionName === "right") {
			targetX = this.currentX + this.definition.moveDist;
			this.direction = 1;
		} else if (directionName === "up") {
			targetY = this.currentY - this.definition.moveDist;
		} else {
			targetY = this.currentY + this.definition.moveDist;
		}
		targetX = Math.max(minLeft, Math.min(maxLeft, targetX));
		targetY = Math.max(minTop, Math.min(maxTop, targetY));
		if (targetX === this.currentX && targetY === this.currentY) return;
		const animationName = directionName === "left"
			? "moveLeft"
			: directionName === "right"
				? "moveRight"
				: directionName === "up"
					? "moveUp"
					: "moveDown";
		void this.playAnimation(animationName);
		this.petEl.setCssProps({
			"--left": `${targetX}px`,
			"--top": `${targetY}px`,
			"--scale-x": `${this.direction}`,
			"--move-duration": `${duration}ms`,
		});
		this.speechBubbleEl?.setCssProps({ "--bubble-scale-x": `${1 / this.direction}` });
		this.currentX = targetX;
		this.currentY = targetY;
		await wait(duration);
	}

	private async startActionLoop() {
		const actionNames = ["idle", "sleep", "special"].filter((name) => Boolean(this.definition.animations[name]));
		const moveDirections: Array<"left" | "right" | "up" | "down"> = ["left", "right", "up", "down"];
		while (!this.isDestroyed) {
			while (this.actionLoopPaused && !this.isDestroyed) {
				await wait(100);
			}
			if (this.isDestroyed) break;

			const randomAction = actionNames[Math.floor(Math.random() * actionNames.length)] ?? "idle";
			void this.playAnimation(randomAction);
			const animation = toAnimation(this.definition.animations[randomAction]);
			const duration = animation ? Math.max(200, Math.ceil((animation.frames.length / animation.fps) * 1000)) : 1000;
			await wait(randomAction === "sleep" ? duration * 2 : duration);

			while (this.actionLoopPaused && !this.isDestroyed) {
				await wait(100);
			}
			if (this.isDestroyed) break;

			const directionName = moveDirections[Math.floor(Math.random() * moveDirections.length)] ?? "right";
			await this.move(Math.max(800, duration), directionName);
			void this.playAnimation("idle");
		}
	}

	public startFollowingCursor(_getCursorX: () => number): void {
		return;
	}

	public stopFollowingCursor(): void {
		return;
	}

	public async destroy() {
		if (this.isDestroyed) return;
		this.isDestroyed = true;
		this.clearSpeechBubble();
		if (this.animationTimer !== null) {
			activeWindow.clearInterval(this.animationTimer);
			this.animationTimer = null;
		}
		this.petEl.setCssStyles({ transition: "opacity 250ms ease", opacity: "0" });
		await wait(250);
		this.petEl.remove();
	}

	public destroyImmediate() {
		if (this.isDestroyed) return;
		this.isDestroyed = true;
		this.clearSpeechBubble();
		if (this.animationTimer !== null) {
			activeWindow.clearInterval(this.animationTimer);
			this.animationTimer = null;
		}
		this.petEl?.remove();
	}
}