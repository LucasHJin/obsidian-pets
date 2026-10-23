import { AnimationConfig } from "../pets/pet";

export interface SpriteBounds {
	left: number;
	top: number;
	right: number;
	bottom: number;
	width: number;
	height: number;
}

const boundsByUrl = new Map<string, Promise<SpriteBounds | null>>();

export function createSprite(
	parent: HTMLElement,
	cls: string,
	animation: AnimationConfig,
	scale = 1,
): HTMLElement {
	const sprite = parent.createDiv({ cls });
	const sheetWidth = animation.frameCount * animation.frameWidth * scale;
	sprite.setCssProps({
		"--pixel-pets-sprite-url": `url(${animation.spriteUrl})`,
		"--pixel-pets-sprite-size": `${sheetWidth}px auto`,
		"--pixel-pets-sprite-total-width": `-${sheetWidth}px`,
		"--pixel-pets-sprite-duration": `${animation.duration}ms`,
		"--pixel-pets-frame-count": `${animation.frameCount}`,
	});
	return sprite;
}

export function getSpriteBounds(animation: AnimationConfig): Promise<SpriteBounds | null> {
	let bounds = boundsByUrl.get(animation.spriteUrl);
	if (!bounds) {
		bounds = measureFirstFrame(animation.spriteUrl, animation.frameWidth);
		boundsByUrl.set(animation.spriteUrl, bounds);
	}
	return bounds;
}

export function getCenteringOffset(bounds: SpriteBounds): { x: number; y: number } {
	return {
		x: Math.round(bounds.width / 2 - (bounds.left + bounds.right) / 2),
		y: Math.round(bounds.height / 2 - (bounds.top + bounds.bottom) / 2),
	};
}

async function measureFirstFrame(url: string, width: number): Promise<SpriteBounds | null> {
	const image = createEl("img", { attr: { src: url } });
	try {
		await image.decode();
	} catch {
		return null;
	}
	const height = image.naturalHeight;
	const context = createEl("canvas", { attr: { width, height } }).getContext("2d");
	if (!context || height === 0) {
		return null;
	}
	context.drawImage(image, 0, 0);
	const pixels = context.getImageData(0, 0, width, height).data;
	let left = width;
	let top = height;
	let right = 0;
	let bottom = 0;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (!pixels[(y * width + x) * 4 + 3]) {
				continue;
			}
			left = Math.min(left, x);
			top = Math.min(top, y);
			right = Math.max(right, x + 1);
			bottom = Math.max(bottom, y + 1);
		}
	}
	return right > left ? { left, top, right, bottom, width, height } : null;
}
