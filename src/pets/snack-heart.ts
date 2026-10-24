import type { CatMouth } from "./mouth";

export const HEART_BOB_MIN_MS = 1600;
export const HEART_BOB_MAX_MS = 2600;
export const HEART_BEHIND_MOUTH = 2;

export interface HeartRhythm {
	duration: number;
	phase: number;
}

export function pickHeartRhythm(random: () => number = Math.random): HeartRhythm {
	return {
		duration: Math.round(HEART_BOB_MIN_MS + random() * (HEART_BOB_MAX_MS - HEART_BOB_MIN_MS)),
		phase: random(),
	};
}

export function getHeartX(mouth: CatMouth): number {
	return mouth.idle - HEART_BEHIND_MOUTH;
}
