import { describe, expect, it } from "vitest";
import { getTooltipFlip, getTooltipShift } from "../src/pets/tooltip-shift";

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

describe("getTooltipFlip", () => {
	const tooltip = (top: number) => ({ top, bottom: top + 24 });

	it("keeps a tooltip above the pet while it fits inside the view", () => {
		expect(getTooltipFlip(tooltip(40), { top: 0 }, 200)).toBe(false);
		expect(getTooltipFlip(tooltip(0), { top: 0 }, 200)).toBe(false);
		expect(getTooltipFlip(tooltip(120), { top: 100 }, 200)).toBe(false);
	});

	it("moves a tooltip below the pet when it would stick out of the top", () => {
		expect(getTooltipFlip(tooltip(-1), { top: 0 }, 200)).toBe(true);
		expect(getTooltipFlip(tooltip(80), { top: 100 }, 200)).toBe(true);
	});

	it("keeps a tooltip above the pet when there is no room for it below either", () => {
		expect(getTooltipFlip(tooltip(-10), { top: 0 }, 10)).toBe(false);
		expect(getTooltipFlip(tooltip(-10), { top: 0 }, 24)).toBe(true);
	});
});
