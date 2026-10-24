import { FISH_WIDTH } from "../catalog/fish";

export type MouthPose = "idle" | "run" | "sit";

export interface CatMouth {
	sit: number;
	idle: number;
	run: number;
}

export const DEFAULT_MOUTH: CatMouth = { sit: 21, idle: 23, run: 23 };
export const DEFAULT_HEAD_TOP = 8;
export const PICKUP_POSE: MouthPose = "idle";
export const FISH_GRIP = { x: 6, y: 2 };

export const MOUTH_POSES: readonly MouthPose[] = ["idle", "run", "sit"];

export const MOUTH_Y: Record<MouthPose, readonly number[]> = {
	sit: [21, 22, 21],
	idle: [19, 19, 20, 20, 21, 21, 20],
	run: [19, 21, 21, 17, 17, 17, 17],
};

const FRAME_WIDTH = 32;

export function getMouthPose(animation: string): MouthPose | null {
	return MOUTH_POSES.find((pose) => pose === animation) ?? null;
}

export function getMouthBob(pose: MouthPose): number[] {
	const rows = MOUTH_Y[pose];
	return rows.map((y) => y - rows[0]);
}

export function getHeldFishOrigin(mouth: CatMouth, pose: MouthPose): { x: number; y: number } {
	return { x: mouth[pose] - FISH_GRIP.x, y: MOUTH_Y[pose][0] - FISH_GRIP.y };
}

export function getHeldFishReach(mouth: CatMouth): number {
	return getHeldFishOrigin(mouth, PICKUP_POSE).x + FISH_WIDTH / 2 - FRAME_WIDTH / 2;
}

export function getHeldFishOverhang(mouth: CatMouth): number {
	let overhang = 0;
	for (const pose of MOUTH_POSES) {
		overhang = Math.max(overhang, getHeldFishOrigin(mouth, pose).x + FISH_WIDTH - FRAME_WIDTH);
	}
	return overhang;
}

export function getCatXForFish(
	fishX: number,
	direction: number,
	scale: number,
	mouth: CatMouth,
): number {
	return fishX - direction * getHeldFishReach(mouth) * scale;
}
