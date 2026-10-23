import { describe, expect, it } from "vitest";
import { getTooltipShift } from "../src/pets/tooltip-shift";

const BOUNDS = { left: 50, right: 334 };

describe("getTooltipShift", () => {
	it("leaves a tooltip that fits where it is", () => {
		expect(getTooltipShift({ left: 100, right: 160 }, BOUNDS)).toBe(0);
		expect(getTooltipShift({ left: 50, right: 110 }, BOUNDS)).toBe(0);
		expect(getTooltipShift({ left: 274, right: 334 }, BOUNDS)).toBe(0);
	});

	it("moves a tooltip that sticks out on the left inward by the overflow", () => {
		expect(getTooltipShift({ left: 20, right: 80 }, BOUNDS)).toBe(30);
		expect(getTooltipShift({ left: -7.2, right: 143.2 }, BOUNDS)).toBeCloseTo(57.2);
	});

	it("moves a tooltip that sticks out on the right inward by the overflow", () => {
		expect(getTooltipShift({ left: 300, right: 360 }, BOUNDS)).toBe(-26);
		expect(getTooltipShift({ left: 301.1, right: 338.9 }, BOUNDS)).toBeCloseTo(-4.9);
	});

	it("pins a tooltip wider than the bounds to the left edge", () => {
		expect(getTooltipShift({ left: -66, right: 235 }, BOUNDS)).toBe(116);
		expect(getTooltipShift({ left: 60, right: 380 }, BOUNDS)).toBe(-10);
		expect(getTooltipShift({ left: 50, right: 334 }, BOUNDS)).toBe(0);
	});
});
