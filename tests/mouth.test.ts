import { describe, expect, it } from "vitest";
import styles from "../styles.css?raw";
import { FISH_WIDTH } from "../src/catalog/fish";
import { PETS } from "../src/catalog/pets";
import {
	DEFAULT_MOUTH,
	FISH_GRIP,
	MOUTH_POSES,
	MOUTH_Y,
	PICKUP_POSE,
	getCatXForFish,
	getHeldFishOrigin,
	getHeldFishOverhang,
	getHeldFishReach,
	getMouthBob,
	getMouthPose,
} from "../src/pets/mouth";

const FRAME_WIDTH = 32;

function readBobKeyframes(pose: string): [number, number][] {
	const block = new RegExp(`@keyframes pixel-pets-mouth-bob-${pose} \\{([\\s\\S]*?)\\n\\}`).exec(
		styles,
	);
	if (!block) throw new Error(`no mouth bob keyframes for ${pose}`);
	const keyframes: [number, number][] = [];
	const step = /([\d.]+)%\s*\{\s*--pixel-pets-mouth-bob:\s*(-?\d+)px;/g;
	for (let match = step.exec(block[1]); match; match = step.exec(block[1])) {
		keyframes.push([Number(match[1]), Number(match[2])]);
	}
	return keyframes;
}

function bobAtFrame(keyframes: [number, number][], frame: number, frames: number): number {
	const at = (frame / frames) * 100 + 0.001;
	let value = 0;
	for (const [percent, bob] of keyframes) {
		if (percent <= at) value = bob;
	}
	return value;
}

describe("held fish placement", () => {
	it("puts the fish grip on the mouth in every pose", () => {
		for (const pose of MOUTH_POSES) {
			const origin = getHeldFishOrigin(DEFAULT_MOUTH, pose);
			expect(origin.x + FISH_GRIP.x).toBe(DEFAULT_MOUTH[pose]);
			expect(origin.y + FISH_GRIP.y).toBe(MOUTH_Y[pose][0]);
		}
	});

	it("starts the fish inside the 32px pet frame in every pose", () => {
		for (const pet of PETS) {
			for (const pose of MOUTH_POSES) {
				const origin = getHeldFishOrigin(pet.mouth ?? DEFAULT_MOUTH, pose);
				expect(origin.x).toBeGreaterThanOrEqual(0);
				expect(origin.x).toBeLessThan(FRAME_WIDTH);
			}
		}
	});

	it("measures how far past the frame the held fish reaches in front of the face", () => {
		expect(getHeldFishOverhang(DEFAULT_MOUTH)).toBe(
			DEFAULT_MOUTH.idle - FISH_GRIP.x + FISH_WIDTH - 32,
		);
		const pirate = PETS.find((pet) => pet.id === "pets/pirate-cat")?.mouth;
		expect(pirate).toBeDefined();
		if (!pirate) return;
		expect(getHeldFishOverhang(pirate)).toBe(pirate.idle - FISH_GRIP.x + FISH_WIDTH - 32);
		for (const pet of PETS) {
			const overhang = getHeldFishOverhang(pet.mouth ?? DEFAULT_MOUTH);
			expect(overhang).toBeGreaterThanOrEqual(0);
			expect(overhang).toBeLessThanOrEqual(4);
		}
	});

	it("measures how far the held fish sits in front of the cat's centre when it is picked up", () => {
		expect(PICKUP_POSE).toBe("idle");
		expect(getHeldFishReach(DEFAULT_MOUTH)).toBe(DEFAULT_MOUTH.idle - 14);
		expect(getHeldFishReach({ ...DEFAULT_MOUTH, idle: 24 })).toBe(
			getHeldFishReach(DEFAULT_MOUTH) + 1,
		);
	});

	it("stands a cat behind the fish it faces and ahead of the fish it faces away from", () => {
		const reach = getHeldFishReach(DEFAULT_MOUTH);
		expect(getCatXForFish(100, 1, 1, DEFAULT_MOUTH)).toBe(100 - reach);
		expect(getCatXForFish(100, -1, 1, DEFAULT_MOUTH)).toBe(100 + reach);
	});

	it("scales the reach with the pet size", () => {
		const reach = getHeldFishReach(DEFAULT_MOUTH);
		expect(getCatXForFish(100, 1, 2, DEFAULT_MOUTH)).toBe(100 - reach * 2);
		expect(getCatXForFish(100, -1, 2, DEFAULT_MOUTH)).toBe(100 + reach * 2);
	});

	it("knows the poses a held fish follows the mouth in", () => {
		expect(getMouthPose("idle")).toBe("idle");
		expect(getMouthPose("run")).toBe("run");
		expect(getMouthPose("sit")).toBe("sit");
		expect(getMouthPose("jump")).toBeNull();
		expect(getMouthPose("fly")).toBeNull();
	});
});

describe("mouth bob keyframes", () => {
	it.each(MOUTH_POSES)("steps through the %s mouth frame by frame", (pose) => {
		const keyframes = readBobKeyframes(pose);
		const frames = MOUTH_Y[pose].length;
		const stepped = Array.from({ length: frames }, (_, frame) =>
			bobAtFrame(keyframes, frame, frames),
		);
		expect(stepped).toEqual(getMouthBob(pose));
	});

	it("starts every pose on its first frame", () => {
		for (const pose of MOUTH_POSES) {
			expect(getMouthBob(pose)[0]).toBe(0);
		}
	});

	it("gives a held fish a class per pose", () => {
		for (const pose of MOUTH_POSES) {
			expect(styles).toContain(`.pixel-pets-pet--mouth-${pose} {`);
		}
	});
});

describe("cat mouths", () => {
	it("are only set on cats and stay within 4px of the default in each pose", () => {
		for (const pet of PETS) {
			if (!pet.mouth) continue;
			expect(pet.species).toBe("cat");
			for (const pose of MOUTH_POSES) {
				expect(Math.abs(pet.mouth[pose] - DEFAULT_MOUTH[pose])).toBeLessThanOrEqual(4);
			}
		}
	});

	it("only give cats a head top, inside the frame", () => {
		for (const pet of PETS) {
			if (pet.headTop === undefined) continue;
			expect(pet.species).toBe("cat");
			expect(pet.headTop).toBeGreaterThanOrEqual(0);
			expect(pet.headTop).toBeLessThan(16);
		}
	});
});
