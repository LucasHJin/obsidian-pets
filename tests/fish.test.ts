import { describe, expect, it } from "vitest";
import {
	FISH,
	RAINBOW_FISH,
	RAINBOW_FISH_CHANCE,
	getFishType,
	pickFish,
} from "../src/catalog/fish";

function rolls(...values: number[]): () => number {
	let index = 0;
	return () => values[index++ % values.length];
}

describe("fish catalog", () => {
	it("has unique ids", () => {
		const ids = [...FISH, RAINBOW_FISH].map((fish) => fish.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it.each([...FISH, RAINBOW_FISH])("$id has an image", (fish) => {
		expect(typeof fish.image).toBe("string");
		expect(fish.image.length).toBeGreaterThan(0);
		expect(getFishType(fish.id)).toBe(fish);
	});

	it("throws for an unknown id", () => {
		expect(() => getFishType("missing-fish")).toThrow();
	});

	it("keeps the rainbow fish out of the normal fish", () => {
		expect(FISH).not.toContain(RAINBOW_FISH);
		expect(FISH.some((fish) => fish.rainbow)).toBe(false);
		expect(RAINBOW_FISH.rainbow).toBe(true);
	});
});

describe("pickFish", () => {
	it("makes a rainbow fish rare", () => {
		expect(RAINBOW_FISH_CHANCE).toBe(0.01);
	});

	it("picks the rainbow fish when the roll is under the chance", () => {
		expect(pickFish(rolls(0, 0.5))).toBe(RAINBOW_FISH);
		expect(pickFish(rolls(RAINBOW_FISH_CHANCE - 0.001, 0.5))).toBe(RAINBOW_FISH);
	});

	it("picks a normal fish at the chance and above it", () => {
		expect(pickFish(rolls(RAINBOW_FISH_CHANCE, 0)).rainbow).toBeUndefined();
		expect(pickFish(rolls(0.99, 0.999))).toBe(FISH[FISH.length - 1]);
	});

	it("reaches every normal fish with a fresh roll", () => {
		const picked = FISH.map((_, index) => pickFish(rolls(0.5, (index + 0.5) / FISH.length)));
		expect(picked).toEqual(FISH);
	});

	it("drops about one rainbow fish in a hundred", () => {
		let seed = 12345;
		const random = () => {
			seed = (seed * 1664525 + 1013904223) % 4294967296;
			return seed / 4294967296;
		};
		let rainbow = 0;
		const drops = 100000;
		for (let i = 0; i < drops; i++) {
			if (pickFish(random).rainbow) rainbow++;
		}
		expect(rainbow / drops).toBeGreaterThan(0.008);
		expect(rainbow / drops).toBeLessThan(0.012);
	});

	it("uses Math.random by default", () => {
		for (let i = 0; i < 50; i++) {
			const fish = pickFish();
			expect(fish === RAINBOW_FISH || FISH.includes(fish)).toBe(true);
		}
	});
});
