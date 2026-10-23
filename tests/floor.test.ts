import { describe, expect, it } from "vitest";
import { PET_FEET_OFFSET, getGroundCss, getGroundY } from "../src/floor";

describe("getGroundCss", () => {
	it("puts a percent floor the pets' feet offset below its line, at the pet's scale", () => {
		expect(getGroundCss({ kind: "percent", value: 78 })).toBe(
			`calc(78% + ${PET_FEET_OFFSET}px * var(--pixel-pets-scale, 1))`,
		);
	});

	it("puts a bottom floor at the bottom edge of the view", () => {
		expect(getGroundCss({ kind: "bottom" })).toBe("100%");
	});
});

describe("getGroundY", () => {
	it("agrees with the CSS ground line", () => {
		expect(getGroundY({ kind: "percent", value: 80 }, 200, 2)).toBe(160 + PET_FEET_OFFSET * 2);
		expect(getGroundY({ kind: "bottom" }, 200, 2)).toBe(200);
	});
});
