import { Floor, getGroundCss } from "../floor";
import { BedSpan, bedCentre, getBedSpan } from "./placement";

export const BED_WIDTH = 50;
export const BED_HEIGHT = 28;
export const BED_CUSHION_BOTTOM = 21;

export interface BedLookup {
	findBedsOnPath(fromX: number, toX: number): Bed[];
}

export function getBedLift(spriteHeight: number, spriteBottom: number): number {
	return BED_HEIGHT - BED_CUSHION_BOTTOM - (spriteHeight - spriteBottom);
}

export class Bed {
	readonly el: HTMLElement;
	occupied = false;
	private onEvict: (() => void) | null = null;
	private isDestroyed = false;

	constructor(
		private readonly container: HTMLElement,
		image: string,
		private readonly x: number,
		floor: Floor,
		private scale: number,
	) {
		this.el = container.createEl("img", {
			cls: "pixel-pets-bed",
			attr: { src: image, alt: "" },
		});
		this.el.setCssProps({
			"--pixel-pets-bed-width": `${BED_WIDTH}px`,
			"--pixel-pets-bed-height": `${BED_HEIGHT}px`,
			"--pixel-pets-bed-x": `${x}`,
			"--pixel-pets-bed-ground": getGroundCss(floor),
			"--pixel-pets-scale": `${scale}`,
		});
	}

	getSpan(): BedSpan {
		return getBedSpan(this.x, this.container.offsetWidth, BED_WIDTH * this.scale);
	}

	getCentre(): number {
		return bedCentre(this.getSpan());
	}

	claim(onEvict: () => void): boolean {
		if (this.occupied || this.isDestroyed) return false;
		this.occupied = true;
		this.onEvict = onEvict;
		return true;
	}

	release() {
		this.occupied = false;
		this.onEvict = null;
	}

	setScale(scale: number) {
		this.scale = scale;
		this.el.setCssProps({ "--pixel-pets-scale": `${scale}` });
	}

	setFloor(floor: Floor) {
		this.el.setCssProps({ "--pixel-pets-bed-ground": getGroundCss(floor) });
	}

	destroy() {
		if (this.isDestroyed) return;
		this.isDestroyed = true;
		const evict = this.onEvict;
		this.release();
		this.el.remove();
		evict?.();
	}
}
