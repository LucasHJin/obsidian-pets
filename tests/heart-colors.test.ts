import { describe, expect, it } from "vitest";
import { HEART_COLORS, pickHeartImage } from "../src/catalog/heart-colors";

describe("heart color catalog", () => {
	it("offers red, pink, orange, yellow, green, blue, purple and white", () => {
		expect(HEART_COLORS.map((color) => color.id)).toEqual([
			"red",
			"pink",
			"orange",
			"yellow",
			"green",
			"blue",
			"purple",
			"white",
		]);
	});

	it("has unique ids", () => {
		const ids = HEART_COLORS.map((color) => color.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it.each(HEART_COLORS)("$id has its own image", (color) => {
		expect(typeof color.image).toBe("string");
		expect(color.image.length).toBeGreaterThan(0);
		const others = HEART_COLORS.filter((other) => other.id !== color.id);
		expect(others.map((other) => other.image)).not.toContain(color.image);
	});
});

describe("pickHeartImage", () => {
	it("picks the color the random value points at", () => {
		HEART_COLORS.forEach((color, i) => {
			expect(pickHeartImage(() => (i + 0.5) / HEART_COLORS.length)).toBe(color.image);
		});
	});

	it("reaches every color with the real random source", () => {
		const images = new Set<string>();
		for (let i = 0; i < 400; i++) {
			images.add(pickHeartImage());
		}
		expect(images.size).toBe(HEART_COLORS.length);
	});
});
