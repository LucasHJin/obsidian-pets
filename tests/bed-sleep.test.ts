import { describe, expect, it, vi } from "vitest";
import { BED_CUSHION_BOTTOM, BED_HEIGHT, BED_WIDTH, Bed, getBedLift } from "../src/furniture/bed";
import { findCrossedBeds, getBedSeatX } from "../src/furniture/placement";

function makeBed(x = 0.5, width = 300): Bed {
	const el = { setCssProps: () => {}, remove: () => {} };
	const container = { offsetWidth: width, createEl: () => el } as unknown as HTMLElement;
	return new Bed(container, "bed.png", x, { kind: "bottom" }, 1);
}

function fakeBed(centre: number, occupied = false) {
	return {
		occupied,
		getSpan: () => ({ left: centre - BED_WIDTH / 2, right: centre + BED_WIDTH / 2 }),
	};
}

describe("findCrossedBeds", () => {
	it("finds a bed whose centre lies strictly between the start and the target", () => {
		const bed = fakeBed(100);
		expect(findCrossedBeds([bed], 80, 130)).toEqual([bed]);
		expect(findCrossedBeds([bed], 130, 80)).toEqual([bed]);
	});

	it("ignores a bed that is only partly crossed, or behind or beyond the move", () => {
		const bed = fakeBed(100);
		expect(findCrossedBeds([bed], 60, 95)).toEqual([]);
		expect(findCrossedBeds([bed], 105, 140)).toEqual([]);
		expect(findCrossedBeds([bed], 20, 60)).toEqual([]);
	});

	it("ignores a bed the cat is already standing at the centre of", () => {
		const bed = fakeBed(100);
		expect(findCrossedBeds([bed], 100, 140)).toEqual([]);
		expect(findCrossedBeds([bed], 140, 100)).toEqual([]);
	});

	it("skips occupied beds", () => {
		const free = fakeBed(100);
		const taken = fakeBed(110, true);
		expect(findCrossedBeds([taken, free], 80, 140)).toEqual([free]);
	});

	it("lists the beds nearest the start first, whichever way the cat walks", () => {
		const near = fakeBed(100);
		const far = fakeBed(160);
		expect(findCrossedBeds([far, near], 80, 200)).toEqual([near, far]);
		expect(findCrossedBeds([near, far], 200, 80)).toEqual([far, near]);
	});

	it("finds nothing when there are no beds or the cat does not move", () => {
		expect(findCrossedBeds([], 10, 90)).toEqual([]);
		expect(findCrossedBeds([fakeBed(100)], 100, 100)).toEqual([]);
	});
});

describe("getBedSeatX", () => {
	it("puts the sprite's frame at the bed's centre when the art is centred in it", () => {
		expect(getBedSeatX(120, 1, 0, 1)).toBe(120);
		expect(getBedSeatX(120, -1, 0, 2)).toBe(120);
	});

	it("moves the frame so the drawn art, not the frame, is centred, at any size and facing", () => {
		expect(getBedSeatX(120, 1, -1.5, 1)).toBe(121.5);
		expect(getBedSeatX(120, -1, -1.5, 1)).toBe(118.5);
		expect(getBedSeatX(120, 1, -1.5, 2)).toBe(123);
		expect(getBedSeatX(120, 1, 1.5, 2)).toBe(117);
	});
});

describe("getBedLift", () => {
	it("is the gap between the bed's base and its cushion for a sprite that rests on its frame's last row", () => {
		expect(getBedLift(32, 32)).toBe(BED_HEIGHT - BED_CUSHION_BOTTOM);
		expect(getBedLift(32, 32)).toBe(7);
	});

	it("shrinks by the rows a sprite floats above its frame's bottom", () => {
		expect(getBedLift(32, 30)).toBe(5);
		expect(getBedLift(32, 28)).toBe(3);
	});

	it("keeps the cushion line inside the bed", () => {
		expect(BED_CUSHION_BOTTOM).toBeGreaterThan(0);
		expect(BED_CUSHION_BOTTOM).toBeLessThan(BED_HEIGHT);
	});
});

describe("Bed claims", () => {
	it("starts free and can be claimed by only one cat at a time", () => {
		const bed = makeBed();
		const first = vi.fn();
		const second = vi.fn();
		expect(bed.occupied).toBe(false);
		expect(bed.claim(first)).toBe(true);
		expect(bed.occupied).toBe(true);
		expect(bed.claim(second)).toBe(false);
		expect(bed.occupied).toBe(true);
	});

	it("can be claimed again once released, without waking the old claimant", () => {
		const bed = makeBed();
		const first = vi.fn();
		bed.claim(first);
		bed.release();
		expect(bed.occupied).toBe(false);
		expect(bed.claim(vi.fn())).toBe(true);
		bed.destroy();
		expect(first).not.toHaveBeenCalled();
	});

	it("wakes its occupant, once, when it is removed", () => {
		const bed = makeBed();
		const wake = vi.fn();
		bed.claim(wake);
		bed.destroy();
		bed.destroy();
		expect(wake).toHaveBeenCalledTimes(1);
		expect(bed.occupied).toBe(false);
	});

	it("cannot be claimed once removed", () => {
		const bed = makeBed();
		bed.destroy();
		expect(bed.claim(vi.fn())).toBe(false);
	});

	it("reports its centre from its fraction of the width", () => {
		expect(makeBed(0.5, 300).getCentre()).toBe(150);
		expect(makeBed(0, 300).getCentre()).toBe(BED_WIDTH / 2);
		expect(makeBed(1, 300).getCentre()).toBe(300 - BED_WIDTH / 2);
	});
});
