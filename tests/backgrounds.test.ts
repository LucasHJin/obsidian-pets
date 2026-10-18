import { describe, expect, it } from "vitest";
import { BACKGROUNDS, getBackground } from "../src/catalog/backgrounds";

describe("background catalog", () => {
	it("starts with the none background, which has no image", () => {
		expect(BACKGROUNDS[0]?.id).toBe("none");
		expect(BACKGROUNDS[0]?.image).toBeUndefined();
	});

	it("has unique ids", () => {
		const ids = BACKGROUNDS.map((background) => background.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it.each(BACKGROUNDS)("$id has a floor between 0 and 100", (background) => {
		expect(typeof background.floor).toBe("number");
		expect(background.floor).toBeGreaterThanOrEqual(0);
		expect(background.floor).toBeLessThanOrEqual(100);
	});

	it.each(BACKGROUNDS.slice(1))("$id has an image", (background) => {
		expect(typeof background.image).toBe("string");
		expect(background.image?.length).toBeGreaterThan(0);
	});

	it.each(BACKGROUNDS)("$id only has snow when it has an image", (background) => {
		if (background.snow) {
			expect(background.image).toBeTruthy();
		}
	});

	it("looks backgrounds up by id", () => {
		for (const background of BACKGROUNDS) {
			expect(getBackground(background.id)).toBe(background);
		}
	});

	it("falls back to none for unknown ids", () => {
		expect(getBackground("backgrounds/missing.png")).toBe(BACKGROUNDS[0]);
		expect(getBackground("").id).toBe("none");
	});
});
