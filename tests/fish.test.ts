import { describe, expect, it } from "vitest";
import { FISH, getFishImage } from "../src/catalog/fish";

describe("fish catalog", () => {
	it("has unique ids", () => {
		const ids = FISH.map((fish) => fish.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it.each(FISH)("$id has an image", (fish) => {
		expect(typeof fish.image).toBe("string");
		expect(fish.image.length).toBeGreaterThan(0);
		expect(getFishImage(fish.id)).toBe(fish.image);
	});

	it("throws for an unknown id", () => {
		expect(() => getFishImage("missing-fish")).toThrow();
	});
});
