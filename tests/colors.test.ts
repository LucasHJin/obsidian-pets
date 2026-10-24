import { describe, expect, it } from "vitest";
import { ColorVariant, pickColor } from "../src/catalog/colors";

const VARIANTS: ColorVariant[] = [
	{ id: "red", image: "red.png" },
	{ id: "green", image: "green.png" },
	{ id: "blue", image: "blue.png" },
];

describe("pickColor", () => {
	it("picks by the random value", () => {
		expect(pickColor(VARIANTS, () => 0).id).toBe("red");
		expect(pickColor(VARIANTS, () => 0.34).id).toBe("green");
		expect(pickColor(VARIANTS, () => 0.67).id).toBe("blue");
	});

	it("stays inside the list at the top of the random range", () => {
		expect(pickColor(VARIANTS, () => 0.999999).id).toBe("blue");
		expect(pickColor(VARIANTS, () => 1).id).toBe("blue");
	});

	it("gives every variant an equal share of the random range", () => {
		const counts: Record<string, number> = { red: 0, green: 0, blue: 0 };
		for (let i = 0; i < 300; i++) {
			counts[pickColor(VARIANTS, () => i / 300).id]++;
		}
		expect(counts).toEqual({ red: 100, green: 100, blue: 100 });
	});

	it("reaches every variant with the real random source", () => {
		const seen = new Set<string>();
		for (let i = 0; i < 300; i++) {
			seen.add(pickColor(VARIANTS).id);
		}
		expect([...seen].sort()).toEqual(["blue", "green", "red"]);
	});

	it("returns the only variant of a one-item list", () => {
		expect(pickColor([VARIANTS[0]], () => 0.9)).toBe(VARIANTS[0]);
	});
});
