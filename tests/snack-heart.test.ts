import { describe, expect, it } from "vitest";
import { PETS } from "../src/catalog/pets";
import { DEFAULT_MOUTH } from "../src/pets/mouth";
import {
	HEART_BEHIND_MOUTH,
	HEART_BOB_MAX_MS,
	HEART_BOB_MIN_MS,
	getHeartX,
	pickHeartRhythm,
} from "../src/pets/snack-heart";

const HEART_WIDTH = 13 * 1.05;

function rolls(...values: number[]): () => number {
	let index = 0;
	return () => values[index++ % values.length];
}

describe("pickHeartRhythm", () => {
	it("spans the bob durations and the whole phase", () => {
		expect(pickHeartRhythm(rolls(0, 0))).toEqual({ duration: HEART_BOB_MIN_MS, phase: 0 });
		const slowest = pickHeartRhythm(rolls(1, 0.999));
		expect(slowest.duration).toBe(HEART_BOB_MAX_MS);
		expect(slowest.phase).toBe(0.999);
	});

	it("rolls the duration and the phase separately", () => {
		const rhythm = pickHeartRhythm(rolls(0.25, 0.75));
		expect(rhythm.duration).toBe(
			Math.round(HEART_BOB_MIN_MS + 0.25 * (HEART_BOB_MAX_MS - HEART_BOB_MIN_MS)),
		);
		expect(rhythm.phase).toBe(0.75);
	});

	it("gives cats rhythms of their own", () => {
		const rhythms = Array.from({ length: 20 }, () => pickHeartRhythm());
		for (const { duration, phase } of rhythms) {
			expect(duration).toBeGreaterThanOrEqual(HEART_BOB_MIN_MS);
			expect(duration).toBeLessThanOrEqual(HEART_BOB_MAX_MS);
			expect(phase).toBeGreaterThanOrEqual(0);
			expect(phase).toBeLessThan(1);
		}
		expect(new Set(rhythms.map((r) => r.duration)).size).toBeGreaterThan(10);
		expect(new Set(rhythms.map((r) => r.phase)).size).toBeGreaterThan(10);
	});
});

describe("getHeartX", () => {
	it("sits over the head, a little behind the mouth", () => {
		expect(getHeartX(DEFAULT_MOUTH)).toBe(DEFAULT_MOUTH.idle - HEART_BEHIND_MOUTH);
		expect(getHeartX({ ...DEFAULT_MOUTH, idle: 26 })).toBe(26 - HEART_BEHIND_MOUTH);
	});

	it("keeps the 13px heart inside the 32px frame for every cat", () => {
		for (const pet of PETS) {
			const x = getHeartX(pet.mouth ?? DEFAULT_MOUTH);
			expect(x - HEART_WIDTH / 2).toBeGreaterThanOrEqual(0);
			expect(x + HEART_WIDTH / 2).toBeLessThanOrEqual(32);
		}
	});
});
