export type Floor = { kind: "percent"; value: number } | { kind: "bottom" };

export const PET_FEET_OFFSET = 16;

export function getGroundY(floor: Floor, height: number, scale: number): number {
	if (floor.kind === "bottom") {
		return height;
	}
	return (height * floor.value) / 100 + PET_FEET_OFFSET * scale;
}

export function getGroundCss(floor: Floor): string {
	if (floor.kind === "bottom") {
		return "100%";
	}
	return `calc(${floor.value}% + ${PET_FEET_OFFSET}px * var(--pixel-pets-scale, 1))`;
}
