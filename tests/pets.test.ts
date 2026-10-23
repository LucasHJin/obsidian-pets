import { describe, expect, it } from "vitest";
import { petAssets } from "../src/catalog/assets";
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

function buildAnimations(pet: PetType): PetAnimations {
	return ANIMATION_BUILDERS[pet.species](pet.id);
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
});
