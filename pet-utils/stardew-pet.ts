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
	public speedMultiplier: number;
	private spriteFrameWidth = 16;
	private spriteFrameHeight = 16;
	private currentX!: number;
	private currentY!: number;
	private direction = 1;
	private isDestroyed = false;
	private animationTimer: ReturnType<typeof activeWindow.setInterval> | null = null;
	private currentAnimName: string | null = null;
	private speechBubbleEl: HTMLElement | null = null;
	private speechBubbleTimeout: ReturnType<typeof activeWindow.setTimeout> | null = null;
	private actionLoopPaused = false;
	private readonly spritesheetUrl: string;
	private readonly definition: StardewSpeciesDefinition;
	private readonly petName: string;
	private readonly rightClickTextProvider: (() => string | Promise<string>) | null;
	private readonly speechEnabledProvider: ((isNPC: boolean) => boolean) | null;
	private isDragging = false;
	private dragThreshold = 3;
	private readonly isNPC: boolean;

	constructor(
		private container: Element,
		definition: StardewSpeciesDefinition,
		backgroundName: string,
		petId: string,
		scale: number,
		petName: string,
		rightClickTextProvider: (() => string | Promise<string>) | null = null,
		speedMultiplier = 1,
		speechEnabledProvider: ((isNPC: boolean) => boolean) | null = null,
	) {
		this.definition = definition;
		this.scale = scale;
		this.speedMultiplier = speedMultiplier;
		this.petName = petName;
		this.rightClickTextProvider = rightClickTextProvider;
		this.speechEnabledProvider = speechEnabledProvider;
		this.spritesheetUrl = getStardewSpeciesSprite(definition.id);
		this.isNPC = definition.id.startsWith("stardew/npc/");

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
				if (this.isNPC) {
					void this.startNPCWanderLoop();
				} else {
					void this.startPetBehaviorLoop();
				}
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
		const y = -((frame[1] + oy) * this.spriteFrameHeight) * this.definition.scale - 0.5;
		this.petEl.setCssStyles({ backgroundPosition: `${x}px ${y}px` });
	}

	private async playAnimation(name: string) {
		if (this.isDestroyed) return;
		const animation = toAnimation(this.definition.animations[name]);
		if (!animation) return;

		this.setFlip(Boolean(animation.flip));

		if (name === this.currentAnimName) return;

		if (this.animationTimer !== null) {
			activeWindow.clearInterval(this.animationTimer);
			this.animationTimer = null;
		}

		this.currentAnimName = name;
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
					this.currentAnimName = null;
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
			if (this.speechEnabledProvider && !this.speechEnabledProvider(this.isNPC)) {
				this.showHeart();
				return;
			}
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

	// ===== Redesigned Wander Strategy (modeled after Stardew Valley) =====
	//
	// Pets: Behavior state machine with persistent direction walking.
	//   Walk continuously in one direction until hitting a boundary,
	//   then pick a new direction. Occasionally pause to sit/sleep.
	//   Modeled after Pet.RunState / Cat.RunState / Dog.RunState.
	//
	// NPCs: Target-based wandering (like NPC.randomSquareMovement).
	//   Pick a random destination within a wander radius, walk toward it
	//   along the primary axis, pause on arrival, then pick a new target.

	private getContainerBounds() {
		const pw = this.spriteFrameWidth * this.definition.scale;
		const ph = this.spriteFrameHeight * this.definition.scale;
		const cw = (this.container as HTMLElement).offsetWidth;
		const ch = (this.container as HTMLElement).offsetHeight;
		return {
			minX: pw / 2,
			maxX: cw - pw / 2,
			minY: ph / 2,
			maxY: ch - ph / 2,
		};
	}

	/** Move one step in a direction. Returns true if the pet actually moved. */
	private async moveOneStep(dir: "left" | "right" | "up" | "down"): Promise<boolean> {
		if (this.actionLoopPaused || this.isDestroyed) return false;

		const bounds = this.getContainerBounds();
		const stepDist = this.definition.moveDist * this.speedMultiplier;
		let tx = this.currentX;
		let ty = this.currentY;

		switch (dir) {
			case "left":  tx = this.currentX - stepDist; this.direction = -1; break;
			case "right": tx = this.currentX + stepDist; this.direction = 1; break;
			case "up":    ty = this.currentY - stepDist; break;
			case "down":  ty = this.currentY + stepDist; break;
		}

		tx = Math.max(bounds.minX, Math.min(bounds.maxX, tx));
		ty = Math.max(bounds.minY, Math.min(bounds.maxY, ty));

		if (tx === this.currentX && ty === this.currentY) return false;

		const animName = `move${dir.charAt(0).toUpperCase() + dir.slice(1)}`;
		void this.playAnimation(animName);

		const animation = toAnimation(this.definition.animations[animName]);
		const animCycleMs = animation ? (animation.frames.length / animation.fps) * 1000 : 0;
		const duration = Math.max(200, (this.definition.moveDist / 50) * 1000, animCycleMs);

		this.petEl.setCssProps({
			"--left": `${tx}px`,
			"--top": `${ty}px`,
			"--scale-x": `${this.direction}`,
			"--move-duration": `${duration}ms`,
		});
		this.speechBubbleEl?.setCssProps({ "--bubble-scale-x": `${1 / this.direction}` });
		this.currentX = tx;
		this.currentY = ty;
		await wait(duration);
		return true;
	}

	private pickDirection(avoid?: "left" | "right" | "up" | "down"): "left" | "right" | "up" | "down" {
		const all: Array<"left" | "right" | "up" | "down"> = ["left", "right", "up", "down"];
		const pool = avoid ? all.filter((d) => d !== avoid) : all;
		return pool[Math.floor(Math.random() * pool.length)];
	}

	// ---------- Pet (animal) behavior loop ----------

	private async startPetBehaviorLoop() {
		type PetBehavior = "walking" | "sitting" | "sleeping";
		let behavior: PetBehavior = "walking";
		let facing: "left" | "right" | "up" | "down" = this.pickDirection();
		let blockedDir: "left" | "right" | "up" | "down" | null = null;

		while (!this.isDestroyed) {
			while (this.actionLoopPaused && !this.isDestroyed) await wait(100);
			if (this.isDestroyed) break;

			if (behavior === "walking") {
				facing = this.pickDirection(blockedDir ?? undefined);
				blockedDir = null;

				// Walk 4–12 steps in the chosen direction (SV-style persistent movement)
				const maxSteps = 4 + Math.floor(Math.random() * 9);
				let moved = false;

				for (let i = 0; i < maxSteps; i++) {
					if (this.actionLoopPaused || this.isDestroyed) break;
					const ok = await this.moveOneStep(facing);
					if (!ok) {
						blockedDir = facing;
						break;
					}
					moved = true;

					// ~2 % chance per step to interrupt walking with a behavior change
					if (Math.random() < 0.02) break;
				}

				if (!moved) continue; // stuck — retry with new direction

				// After a walk sequence, decide what to do next
				const rand = Math.random();
				const hasSpecial = Boolean(this.definition.animations.special);
				const hasSleep = Boolean(this.definition.animations.sleep);

				if (hasSleep && rand < 0.12) {
					behavior = "sleeping";
				} else if (hasSpecial && rand < 0.28) {
					behavior = "sitting";
				} else {
					// Brief idle, then keep walking
					void this.playAnimation("idle");
					await wait(300 + Math.random() * 700);
				}
			} else if (behavior === "sitting") {
				void this.playAnimation("special");
				// Sit for 2–6 seconds
				const sitTime = 2000 + Math.random() * 4000;
				const started = Date.now();
				while (Date.now() - started < sitTime && !this.actionLoopPaused && !this.isDestroyed) {
					await wait(Math.min(500, sitTime - (Date.now() - started)));
				}
				behavior = "walking";
			} else if (behavior === "sleeping") {
				void this.playAnimation("sleep");
				const sleepTime = 4000 + Math.random() * 8000;
				const started = Date.now();
				while (Date.now() - started < sleepTime && !this.actionLoopPaused && !this.isDestroyed) {
					await wait(Math.min(500, sleepTime - (Date.now() - started)));
				}
				behavior = "walking";
			}
		}
	}

	// ---------- NPC wander loop (target-based, like randomSquareMovement) ----------

	private async startNPCWanderLoop() {
		while (!this.isDestroyed) {
			while (this.actionLoopPaused && !this.isDestroyed) await wait(100);
			if (this.isDestroyed) break;

			// Pick a random destination within wander radius (150–350 px)
			const bounds = this.getContainerBounds();
			const radius = 150 + Math.random() * 200;
			const rawTx = this.currentX + (Math.random() - 0.5) * radius * 2;
			const rawTy = this.currentY + (Math.random() - 0.5) * radius * 2;
			const targetX = Math.max(bounds.minX, Math.min(bounds.maxX, rawTx));
			const targetY = Math.max(bounds.minY, Math.min(bounds.maxY, rawTy));

			// Walk toward the target (primary-axis-first, creating L-shaped paths)
			const arrived = await this.walkToward(targetX, targetY);
			if (!arrived) continue;

			// Pause at destination (3–8 seconds, like SV's squarePauseTotal)
			void this.playAnimation("idle");
			const pauseTime = 3000 + Math.random() * 5000;
			const started = Date.now();
			while (Date.now() - started < pauseTime && !this.actionLoopPaused && !this.isDestroyed) {
				await wait(500);
			}
		}
	}

	/** Walk toward a target position. Returns true when the target is reached. */
	private async walkToward(tx: number, ty: number): Promise<boolean> {
		const maxSteps = 60;
		for (let i = 0; i < maxSteps; i++) {
			if (this.actionLoopPaused || this.isDestroyed) return false;

			const dx = tx - this.currentX;
			const dy = ty - this.currentY;

			if (Math.abs(dx) < this.definition.moveDist && Math.abs(dy) < this.definition.moveDist) {
				return true;
			}

			// Move along the axis with the larger gap (SV-style primary-axis movement)
			const primaryDir: "left" | "right" | "up" | "down" =
				Math.abs(dx) > Math.abs(dy)
					? (dx > 0 ? "right" : "left")
					: (dy > 0 ? "down" : "up");

			const ok = await this.moveOneStep(primaryDir);
			if (!ok) {
				// Try the secondary axis
				const secondaryDir: "left" | "right" | "up" | "down" =
					Math.abs(dx) > Math.abs(dy)
						? (dy > 0 ? "down" : "up")
						: (dx > 0 ? "right" : "left");
				const ok2 = await this.moveOneStep(secondaryDir);
				if (!ok2) return false; // completely stuck
			}
		}
		return false;
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