import { describe, expect, it } from "vitest";
import { BEDS, getBed, getBedImage } from "../src/catalog/beds";

describe("bed catalog", () => {
	it("has the six colours, in order", () => {
		expect(BEDS.map((bed) => bed.id)).toEqual([
			"blue",
			"brown",
			"green",
			"pink",
			"purple",
			"red",
		]);
	});

	it("has unique ids", () => {
		const ids = BEDS.map((bed) => bed.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it.each(BEDS)("$id has a sentence-case label and an image", (bed) => {
		expect(bed.label).toBe(`${bed.id[0].toUpperCase()}${bed.id.slice(1)} bed`);
		expect(typeof bed.image).toBe("string");
		expect(bed.image.length).toBeGreaterThan(0);
		expect(getBedImage(bed.id)).toBe(bed.image);
		expect(getBed(bed.id)).toBe(bed);
	});

	it("has a different image for each colour", () => {
		const images = BEDS.map((bed) => bed.image);
		expect(new Set(images).size).toBe(images.length);
	});

	it("returns nothing for an unknown id and throws for its image", () => {
		expect(getBed("teal")).toBeUndefined();
		expect(() => getBedImage("teal")).toThrow();
	});
});
