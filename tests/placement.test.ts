import { describe, expect, it } from "vitest";
import { getBedSpan, pickBedX } from "../src/furniture/placement";

const WIDTH = 300;
const BED = 50;
const GAP = BED / WIDTH;

function sweep(taken: number[], width = WIDTH, bed = BED): number[] {
	return Array.from({ length: 101 }, (_value, i) => pickBedX(width, bed, taken, () => i / 100));
}

describe("getBedSpan", () => {
	it("centres the bed on its fraction of the width", () => {
		expect(getBedSpan(0.5, 300, 50)).toEqual({ left: 125, right: 175 });
		expect(getBedSpan(0.25, 400, 60)).toEqual({ left: 70, right: 130 });
	});

	it("keeps the bed inside the view at both edges", () => {
		expect(getBedSpan(0, 300, 50)).toEqual({ left: 0, right: 50 });
		expect(getBedSpan(1, 300, 50)).toEqual({ left: 250, right: 300 });
	});

	it("follows a resize because the fraction stays the same", () => {
		expect(getBedSpan(0.5, 600, 50)).toEqual({ left: 275, right: 325 });
	});

	it("pins a bed wider than the view to the left edge", () => {
		expect(getBedSpan(0.5, 40, 50)).toEqual({ left: 0, right: 50 });
	});
});

describe("pickBedX", () => {
	it("keeps the whole bed inside the view", () => {
		for (const x of sweep([])) {
			const span = getBedSpan(x, WIDTH, BED);
			expect(span.left).toBeGreaterThanOrEqual(-1e-9);
			expect(span.right).toBeLessThanOrEqual(WIDTH + 1e-9);
			expect(x).toBeGreaterThanOrEqual(GAP / 2 - 1e-9);
			expect(x).toBeLessThanOrEqual(1 - GAP / 2 + 1e-9);
		}
	});

	it("reaches both ends of the view", () => {
		const xs = sweep([]);
		expect(Math.min(...xs)).toBeCloseTo(GAP / 2);
		expect(Math.max(...xs)).toBeCloseTo(1 - GAP / 2);
	});

	it("uses the random source", () => {
		expect(pickBedX(WIDTH, BED, [], () => 0)).toBeCloseTo(GAP / 2);
		expect(pickBedX(WIDTH, BED, [], () => 0.5)).toBeCloseTo(0.5);
		expect(pickBedX(WIDTH, BED, [], () => 0.999999)).toBeCloseTo(1 - GAP / 2, 4);
	});

	it("never overlaps a bed that is already there while there is room", () => {
		for (const taken of [[0.5], [0.2, 0.8], [0.15, 0.5], [0.3, 0.7]]) {
			for (const x of sweep(taken)) {
				for (const other of taken) {
					expect(Math.abs(x - other)).toBeGreaterThanOrEqual(GAP - 1e-9);
				}
			}
		}
	});

	it("can use the gap between two beds", () => {
		const xs = sweep([0.2, 0.8]);
		expect(xs.some((x) => x > 0.2 + GAP && x < 0.8 - GAP)).toBe(true);
	});

	it("can sit right beside a bed", () => {
		const xs = sweep([0.5]);
		expect(Math.min(...xs.filter((x) => x > 0.5))).toBeCloseTo(0.5 + GAP, 1);
	});

	it("picks the roomiest spot when nothing fits", () => {
		const taken = [0.2, 0.5, 0.8];
		const x = pickBedX(WIDTH, 120, taken, () => 0.3);
		const gaps = taken.map((other) => Math.abs(x - other));
		expect(Math.min(...gaps)).toBeCloseTo(0.15);
	});

	it("falls back to the far end when the only room left is a corner", () => {
		const x = pickBedX(WIDTH, 120, [0.5], () => 0.3);
		expect(Math.abs(x - 0.5)).toBeGreaterThanOrEqual(0.3 - 1e-9);
		const span = getBedSpan(x, WIDTH, 120);
		expect(span.left).toBeGreaterThanOrEqual(0);
		expect(span.right).toBeLessThanOrEqual(WIDTH);
	});

	it("centres a bed that is as wide as the view or wider", () => {
		expect(pickBedX(50, 50, [], () => 0.2)).toBe(0.5);
		expect(pickBedX(40, 50, [0.1], () => 0.9)).toBe(0.5);
	});

	it("scales with the bed size", () => {
		for (const x of sweep([0.5], 284, 60)) {
			expect(Math.abs(x - 0.5)).toBeGreaterThanOrEqual(60 / 284 - 1e-9);
		}
	});
});
