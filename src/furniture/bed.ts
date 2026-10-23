import { Floor, getGroundCss } from "../floor";
import { BedSpan, getBedSpan } from "./placement";

export const BED_WIDTH = 50;
export const BED_HEIGHT = 28;

export class Bed {
	readonly el: HTMLElement;
	occupied = false;
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
		this.occupied = false;
		this.el.remove();
	}
}
