import { describe, expect, it } from "vitest";
import { PET_FEET_OFFSET, getGroundCss, getGroundY } from "../src/floor";

describe("ground line", () => {
	it("is the bottom edge for the overlay floor", () => {
		expect(getGroundY({ kind: "bottom" }, 600, 2)).toBe(600);
		expect(getGroundCss({ kind: "bottom" })).toBe("100%");
	});

	it("sits a pet's half-height below the floor percentage in the panel", () => {
		expect(getGroundY({ kind: "percent", value: 50 }, 400, 1)).toBe(200 + PET_FEET_OFFSET);
		expect(getGroundY({ kind: "percent", value: 50 }, 400, 2)).toBe(200 + PET_FEET_OFFSET * 2);
	});

	it("writes the same panel ground line in CSS", () => {
		expect(getGroundCss({ kind: "percent", value: 62 })).toBe(
			`calc(62% + ${PET_FEET_OFFSET}px * var(--pixel-pets-scale, 1))`,
		);
	});
});
