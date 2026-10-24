import { FISH_HEIGHT, FISH_WIDTH } from "../catalog/fish";
import { Floor, getGroundCss } from "../floor";
import { Countdown } from "./countdown";

export const FISH_LIFETIME_MS = 30000;
const FADE_MS = 600;

export function clampFishX(x: number, width: number, scale: number): number {
	const half = (FISH_WIDTH * scale) / 2;
	const min = Math.ceil(half);
	const max = Math.floor(width - half);
	if (max < min) return Math.round(width / 2);
	return Math.round(Math.max(min, Math.min(max, x)));
}

export function pickFishX(width: number, scale: number, random: number): number {
	const half = (FISH_WIDTH * scale) / 2;
	return clampFishX(half + random * (width - half * 2), width, scale);
}

export function nearestFishOnPath<T extends { getX(): number; isAvailable(): boolean }>(
	fish: readonly T[],
	fromX: number,
	toX: number,
): T | null {
	const low = Math.min(fromX, toX);
	const high = Math.max(fromX, toX);
	let nearest: T | null = null;
	for (const candidate of fish) {
		const x = candidate.getX();
		if (!candidate.isAvailable() || x < low || x > high) continue;
		if (!nearest || Math.abs(x - fromX) < Math.abs(nearest.getX() - fromX)) {
			nearest = candidate;
		}
	}
	return nearest;
}

export class Fish {
	readonly fishEl: HTMLElement;
	scale: number;
	onDestroy?: () => void;

	private x = 0;
	private countdown: Countdown;
	private startedUnsized = false;
	private taken = false;
	private fading = false;
	private destroyed = false;

	constructor(
		private readonly container: HTMLElement,
		spriteUrl: string,
		floor: Floor,
		scale: number,
		lifetime: number,
	) {
		this.scale = scale;

		this.fishEl = this.createFishElement(spriteUrl, floor);
		this.placeAtStart();

		this.countdown = new Countdown(lifetime, () => this.fade());
		this.countdown.start();
	}

	private createFishElement(spriteUrl: string, floor: Floor): HTMLElement {
		const el = this.container.createDiv({ cls: "pixel-pets-fish" });
		el.createEl("img", { attr: { src: spriteUrl, alt: "" } });
		el.setCssProps({
			"--pixel-pets-fish-width": `${FISH_WIDTH}px`,
			"--pixel-pets-fish-height": `${FISH_HEIGHT}px`,
			"--pixel-pets-fish-ground": getGroundCss(floor),
			"--pixel-pets-scale": `${this.scale}`,
		});
		return el;
	}

	private placeAtStart() {
		const width = this.container.offsetWidth;
		this.startedUnsized = width === 0;
		this.x = pickFishX(width, this.scale, Math.random());
		this.renderPosition();
	}

	private renderPosition() {
		this.fishEl.setCssProps({ "--pixel-pets-fish-x": `${this.x}px` });
	}

	private fade() {
		this.fading = true;
		this.fishEl.addClass("pixel-pets-fish--fading");
		this.countdown = new Countdown(FADE_MS, () => this.destroy());
		this.countdown.start();
	}

	getX(): number {
		return this.x;
	}

	isAvailable(): boolean {
		return !this.taken && !this.fading && !this.destroyed;
	}

	claim(): boolean {
		if (!this.isAvailable()) return false;
		this.taken = true;
		this.countdown.stop();
		return true;
	}

	setFloor(floor: Floor) {
		this.fishEl.setCssProps({ "--pixel-pets-fish-ground": getGroundCss(floor) });
	}

	setScale(scale: number) {
		this.scale = scale;
		this.fishEl.setCssProps({ "--pixel-pets-scale": `${scale}` });
		this.clamp();
	}

	clamp() {
		const width = this.container.offsetWidth;
		if (this.destroyed || width === 0) return;
		this.x = clampFishX(this.x, width, this.scale);
		this.renderPosition();
	}

	pause() {
		this.countdown.pause();
	}

	resume() {
		if (this.destroyed) return;
		if (this.startedUnsized && this.container.offsetWidth > 0) {
			this.placeAtStart();
		}
		this.countdown.start();
	}

	destroy() {
		if (this.destroyed) return;
		this.destroyed = true;
		this.countdown.stop();
		this.fishEl.remove();
		this.onDestroy?.();
	}
}
