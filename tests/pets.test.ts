import { describe, expect, it } from "vitest";
import { findPetAsset, getPetAsset, petAssets } from "../src/catalog/assets";
import { PETS, PetType, Species, getPetType } from "../src/catalog/pets";
import { AnimationConfig, AnimationName, PetAnimations } from "../src/pets/pet";
import {
	getBunnyAnimations,
	getCatAnimations,
	getGhostAnimations,
} from "../src/pets/pet-animations";

const ANIMATION_BUILDERS: Record<Species, (type: string) => PetAnimations> = {
	cat: getCatAnimations,
	bunny: getBunnyAnimations,
	ghost: getGhostAnimations,
};

const REQUIRED_ANIMATIONS: Record<Species, AnimationName[]> = {
	cat: ["idle", "run", "die"],
	bunny: ["idle", "run", "die"],
	ghost: ["idle"],
};

const CATS = PETS.filter((pet) => pet.species === "cat");

const OPTIONAL_CAT_SPRITES: [AnimationName, string][] = [
	["idle2", "idle2-cat.png"],
	["liking", "liking-cat.png"],
	["fly", "fly-cat.png"],
];

function buildAnimations(pet: PetType): PetAnimations {
	return ANIMATION_BUILDERS[pet.species](pet.id);
}

function animationsFor(id: string): PetAnimations {
	const pet = getPetType(id);
	if (!pet) throw new Error(`Unknown pet ${id}`);
	return buildAnimations(pet);
}

function listConfigs(animations: PetAnimations): [string, AnimationConfig][] {
	const configs: [string, AnimationConfig][] = [];
	for (const [name, config] of Object.entries(animations)) {
		if (config) configs.push([name, config]);
	}
	return configs;
}

describe("pet catalog", () => {
	it("has unique ids", () => {
		const ids = PETS.map((pet) => pet.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("has an asset set for every pet and no asset set without a pet", () => {
		expect(Object.keys(petAssets).sort()).toEqual(PETS.map((pet) => pet.id).sort());
	});

	it("looks pets up by id", () => {
		for (const pet of PETS) {
			expect(getPetType(pet.id)).toBe(pet);
		}
		expect(getPetType("pets/missing")).toBeUndefined();
	});
});

describe("pet assets", () => {
	it("finds a shipped asset and returns undefined for anything else", () => {
		expect(findPetAsset("pets/classic-cat", "idle-cat.png")).toBe(
			petAssets["pets/classic-cat"]["idle-cat.png"],
		);
		expect(findPetAsset("pets/black-cat", "liking-cat.png")).toBeUndefined();
		expect(findPetAsset("pets/missing", "idle-cat.png")).toBeUndefined();
	});

	it("still throws from getPetAsset for a missing pet or asset", () => {
		expect(getPetAsset("pets/classic-cat", "idle-cat.png")).toBe(
			findPetAsset("pets/classic-cat", "idle-cat.png"),
		);
		expect(() => getPetAsset("pets/black-cat", "liking-cat.png")).toThrow();
		expect(() => getPetAsset("pets/missing", "idle-cat.png")).toThrow();
	});
});

describe("pet animations", () => {
	it.each(PETS)("$id builds the animations its species needs", (pet) => {
		const animations = buildAnimations(pet);
		for (const name of REQUIRED_ANIMATIONS[pet.species]) {
			expect(animations[name], name).toBeDefined();
		}
	});

	it.each(PETS)("$id gives every animation a sprite and positive timing", (pet) => {
		const configs = listConfigs(buildAnimations(pet));
		expect(configs.length).toBeGreaterThan(0);
		for (const [name, config] of configs) {
			expect(typeof config.spriteUrl, `${name} spriteUrl`).toBe("string");
			expect(config.spriteUrl.length, `${name} spriteUrl`).toBeGreaterThan(0);
			expect(config.frameCount, `${name} frameCount`).toBeGreaterThan(0);
			expect(config.frameWidth, `${name} frameWidth`).toBeGreaterThan(0);
			expect(config.duration, `${name} duration`).toBeGreaterThan(0);
		}
	});

	it.each(PETS)("$id has a fly animation exactly when it is flying", (pet) => {
		expect(buildAnimations(pet).fly !== undefined).toBe(pet.flying === true);
	});

	it.each(CATS)("$id has each optional animation exactly when it ships the sprite", (pet) => {
		const animations = buildAnimations(pet);
		for (const [name, file] of OPTIONAL_CAT_SPRITES) {
			const sprite = findPetAsset(pet.id, file);
			expect(animations[name]?.spriteUrl, name).toBe(sprite);
		}
	});

	it.each(CATS)("$id has jump animations exactly when it is not marked noJump", (pet) => {
		const animations = buildAnimations(pet);
		expect(animations.jump !== undefined, "jump").toBe(pet.noJump !== true);
		expect(animations.jump2 !== undefined, "jump2").toBe(pet.noJump !== true);
	});

	it.each(PETS)("$id uses every sprite it ships", (pet) => {
		const used = new Set(
			listConfigs(buildAnimations(pet)).map(([, config]) => config.spriteUrl),
		);
		const unused = Object.entries(petAssets[pet.id])
			.filter(([, url]) => !used.has(url))
			.map(([file]) => file)
			.sort();
		expect(unused).toEqual(pet.noJump ? ["jump-cat.png", "jump2-cat.png"] : []);
	});

	it("keeps the optional animations the shipped cats have always had", () => {
		expect(animationsFor("pets/black-cat").idle2).toBeDefined();
		expect(animationsFor("pets/batman-black-cat").idle2).toBeUndefined();
		expect(animationsFor("pets/batman-blue-cat").idle2).toBeUndefined();
		expect(animationsFor("pets/classic-cat").liking).toBeDefined();
		expect(animationsFor("pets/black-cat").liking).toBeUndefined();
		const witch = animationsFor("pets/witch-cat");
		expect(witch.fly).toBeDefined();
		expect(witch.jump).toBeUndefined();
		expect(witch.jump2).toBeUndefined();
	});
});
