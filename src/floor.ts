export type Floor = { kind: "percent"; value: number } | { kind: "bottom" };

export const PET_FEET_OFFSET = 16;

export function getGroundY(floor: Floor, height: number, scale: number): number {
	if (floor.kind === "bottom") {
		return height;
	}
	return (height * floor.value) / 100 + PET_FEET_OFFSET * scale;
}
