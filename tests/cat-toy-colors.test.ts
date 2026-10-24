import { describe, expect, it } from "vitest";
import { CAT_TOY_COLORS, pickCatToyImage } from "../src/catalog/cat-toy-colors";

describe("cat toy color catalog", () => {
	it("offers blue, red, orange, yellow, green, pink and purple", () => {
		expect(CAT_TOY_COLORS.map((color) => color.id)).toEqual([
			"blue",
			"red",
			"orange",
			"yellow",
			"green",
			"pink",
			"purple",
		]);
	});

	it("has unique ids", () => {
		const ids = CAT_TOY_COLORS.map((color) => color.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it.each(CAT_TOY_COLORS)("$id has its own image", (color) => {
		expect(typeof color.image).toBe("string");
		expect(color.image.length).toBeGreaterThan(0);
		const others = CAT_TOY_COLORS.filter((other) => other.id !== color.id);
		expect(others.map((other) => other.image)).not.toContain(color.image);
	});
});

describe("pickCatToyImage", () => {
	it("picks the color the random value points at", () => {
		CAT_TOY_COLORS.forEach((color, i) => {
			expect(pickCatToyImage(() => (i + 0.5) / CAT_TOY_COLORS.length)).toBe(color.image);
		});
	});

	it("reaches every color with the real random source", () => {
		const images = new Set<string>();
		for (let i = 0; i < 400; i++) {
			images.add(pickCatToyImage());
		}
		expect(images.size).toBe(CAT_TOY_COLORS.length);
	});
});
