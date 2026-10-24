import { describe, expect, it } from "vitest";
import {
	HEART_COLORS,
	RAINBOW_HEART,
	RAINBOW_HEART_CHANCE,
	pickHeart,
} from "../src/catalog/heart-colors";

function sequence(...values: number[]): () => number {
	let i = 0;
	return () => values[Math.min(i++, values.length - 1)];
}

function seeded(seed: number): () => number {
	let state = seed;
	return () => {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

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

	it("keeps the rainbow heart out of the normal colors", () => {
		expect(HEART_COLORS.map((color) => color.id)).not.toContain(RAINBOW_HEART.id);
		expect(HEART_COLORS.map((color) => color.image)).not.toContain(RAINBOW_HEART.image);
		expect(RAINBOW_HEART.image.length).toBeGreaterThan(0);
	});
});

describe("pickHeart", () => {
	it("is rare: the rainbow heart has a 1% chance", () => {
		expect(RAINBOW_HEART_CHANCE).toBe(0.01);
	});

	it("picks the color the second random value points at", () => {
		HEART_COLORS.forEach((color, i) => {
			const heart = pickHeart(sequence(0.5, (i + 0.5) / HEART_COLORS.length));
			expect(heart).toEqual({ image: color.image, rainbow: false });
		});
	});

	it("shows the rainbow heart when the first random value is under the chance", () => {
		expect(pickHeart(sequence(0))).toEqual({ image: RAINBOW_HEART.image, rainbow: true });
		expect(pickHeart(sequence(0.0099))).toEqual({
			image: RAINBOW_HEART.image,
			rainbow: true,
		});
	});

	it("shows a normal heart when the first random value is at or over the chance", () => {
		for (const roll of [RAINBOW_HEART_CHANCE, 0.0101, 0.5, 0.999999]) {
			expect(pickHeart(sequence(roll, 0)).rainbow, String(roll)).toBe(false);
		}
	});

	it("reaches every normal color with the real random source", () => {
		const images = new Set<string>();
		for (let i = 0; i < 2000; i++) {
			const heart = pickHeart();
			if (!heart.rainbow) images.add(heart.image);
		}
		expect(images.size).toBe(HEART_COLORS.length);
	});

	it("shows about one rainbow heart in a hundred", () => {
		const random = seeded(1234);
		let rainbow = 0;
		const total = 100000;
		for (let i = 0; i < total; i++) {
			if (pickHeart(random).rainbow) rainbow++;
		}
		expect(rainbow / total).toBeGreaterThan(0.008);
		expect(rainbow / total).toBeLessThan(0.012);
	});

	it("never gives the rainbow heart a normal color's image", () => {
		const random = seeded(99);
		for (let i = 0; i < 5000; i++) {
			const heart = pickHeart(random);
			const normal = HEART_COLORS.some((color) => color.image === heart.image);
			expect(normal, `heart ${i}`).toBe(!heart.rainbow);
		}
	});
});
