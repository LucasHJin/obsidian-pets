import { describe, expect, it } from "vitest";
import { FISH_WIDTH } from "../src/catalog/fish";
import { clampFishX, nearestFishOnPath, pickFishX } from "../src/food/fish";

const HALF = FISH_WIDTH / 2;

function fish(x: number, available = true) {
	return { x, getX: () => x, isAvailable: () => available };
}

describe("clampFishX", () => {
	it("leaves a fish that fits where it is", () => {
		expect(clampFishX(120, 300, 1)).toBe(120);
	});

	it("keeps the whole fish inside the view", () => {
		expect(clampFishX(-40, 300, 1)).toBe(HALF);
		expect(clampFishX(900, 300, 1)).toBe(300 - HALF);
	});

	it("keeps room for a larger fish at a larger pet size", () => {
		expect(clampFishX(0, 300, 2)).toBe(HALF * 2);
		expect(clampFishX(300, 300, 2)).toBe(300 - HALF * 2);
	});

	it("returns whole pixels even when half the fish is fractional", () => {
		const x = clampFishX(0, 301, 1.25);
		expect(Number.isInteger(x)).toBe(true);
		expect(x - (FISH_WIDTH * 1.25) / 2).toBeGreaterThanOrEqual(0);
	});

	it("centres the fish in a view too narrow for it", () => {
		expect(clampFishX(5, 10, 1)).toBe(5);
		expect(clampFishX(5, 0, 1)).toBe(0);
	});
});

describe("pickFishX", () => {
	it("spans the free width", () => {
		expect(pickFishX(300, 1, 0)).toBe(HALF);
		expect(pickFishX(300, 1, 1)).toBe(300 - HALF);
		expect(pickFishX(300, 1, 0.5)).toBe(150);
	});

	it("stays inside the view for any roll and size", () => {
		for (const scale of [0.5, 1, 1.5, 2, 3]) {
			for (let roll = 0; roll <= 1; roll += 0.05) {
				const x = pickFishX(240, scale, roll);
				const half = (FISH_WIDTH * scale) / 2;
				expect(x - half).toBeGreaterThanOrEqual(0);
				expect(x + half).toBeLessThanOrEqual(240);
			}
		}
	});
});

describe("nearestFishOnPath", () => {
	const all = [fish(40), fish(90), fish(160), fish(210)];

	it("finds nothing when no fish lies on the path", () => {
		expect(nearestFishOnPath(all, 100, 150)).toBeNull();
		expect(nearestFishOnPath([], 0, 300)).toBeNull();
	});

	it("finds the fish nearest the start walking right", () => {
		expect(nearestFishOnPath(all, 60, 300)?.x).toBe(90);
	});

	it("finds the fish nearest the start walking left", () => {
		expect(nearestFishOnPath(all, 300, 60)?.x).toBe(210);
	});

	it("counts a fish at either end of the path", () => {
		expect(nearestFishOnPath(all, 90, 160)?.x).toBe(90);
		expect(nearestFishOnPath(all, 160, 90)?.x).toBe(160);
		expect(nearestFishOnPath(all, 50, 90)?.x).toBe(90);
	});

	it("skips fish that were taken, fading or gone", () => {
		const list = [fish(90, false), fish(160)];
		expect(nearestFishOnPath(list, 60, 300)?.x).toBe(160);
		expect(nearestFishOnPath([fish(90, false)], 60, 300)).toBeNull();
	});
});
