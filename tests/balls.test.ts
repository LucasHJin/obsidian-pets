import { describe, expect, it } from "vitest";
import { BALLS, getBallImage } from "../src/catalog/balls";

describe("ball catalog", () => {
	it("has unique ids", () => {
		const ids = BALLS.map((ball) => ball.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it.each(BALLS)("$id has an image", (ball) => {
		expect(typeof ball.image).toBe("string");
		expect(ball.image.length).toBeGreaterThan(0);
		expect(getBallImage(ball.id)).toBe(ball.image);
	});

	it("throws for an unknown id", () => {
		expect(() => getBallImage("missing-ball")).toThrow();
	});
});
