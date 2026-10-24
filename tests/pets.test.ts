import { describe, expect, it } from "vitest";
import { petAssets } from "../src/catalog/assets";
import { PETS, PetType, Species, getPetType } from "../src/catalog/pets";
import { AnimationConfig, AnimationName, PetAnimations } from "../src/pets/pet";
import {
	getBunnyAnimations,
	getCatAnimations,
	getDogAnimations,
	getGhostAnimations,
} from "../src/pets/pet-animations";
import { Bunny } from "../src/pets/bunny";
import { Cat } from "../src/pets/cat";
import { canChaseBalls, canFollowToy } from "../src/pets/capabilities";
import { Dog } from "../src/pets/dog";
import { Ghost } from "../src/pets/ghost";

const ANIMATION_BUILDERS: Record<Species, (type: string) => PetAnimations> = {
	cat: getCatAnimations,
	dog: getDogAnimations,
	bunny: getBunnyAnimations,
	ghost: getGhostAnimations,
};

const REQUIRED_ANIMATIONS: Record<Species, AnimationName[]> = {
	cat: ["idle", "run", "die"],
	dog: ["idle", "idle2", "jump", "jump2", "run", "sit", "sleep", "die"],
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

function sheetShape(animations: PetAnimations): (string | number)[][] {
	return listConfigs(animations)
		.map(([name, config]) => [name, config.frameCount, config.frameWidth])
		.sort();
}

describe("dog animations", () => {
	const cat = getCatAnimations("pets/black-cat");
	const catDurations = new Map(listConfigs(cat).map(([name, config]) => [name, config.duration]));

	it.each(PETS.filter((pet) => pet.species === "dog"))(
		"$id uses the same sheet layout and timing as a cat",
		(pet) => {
			const dog = buildAnimations(pet);
			expect(sheetShape(dog)).toEqual(sheetShape(cat));
			for (const [name, config] of listConfigs(dog)) {
				const catDuration = catDurations.get(name) ?? 0;
				expect(Math.abs(config.duration - catDuration), name).toBeLessThanOrEqual(200);
			}
		},
	);
});

describe("dog breeds", () => {
	const dogs = PETS.filter((pet) => pet.species === "dog");

	it("offers a husky, chihuahua, golden retriever, beagle and dalmatian", () => {
		const ids = dogs.map((pet) => pet.id);
		for (const breed of ["husky", "chihuahua", "golden-retriever", "beagle", "dalmatian"]) {
			expect(ids).toContain(`pets/${breed}-dog`);
		}
	});

	it.each(dogs)("$id is labelled after its breed", (pet) => {
		const breed = pet.id.replace(/^pets\//, "").replace(/-dog$/, "");
		expect(pet.label.toLowerCase()).toBe(`${breed.replace(/-/g, " ")} dog`);
	});
});

describe("pet capabilities", () => {
	it("lets cats and dogs chase balls but only cats follow the cat toy", () => {
		expect(canChaseBalls(Cat.prototype)).toBe(true);
		expect(canChaseBalls(Dog.prototype)).toBe(true);
		expect(canFollowToy(Cat.prototype)).toBe(true);
		expect(canFollowToy(Dog.prototype)).toBe(false);
	});

	it("keeps bunnies and ghosts out of both", () => {
		for (const pet of [Bunny.prototype, Ghost.prototype]) {
			expect(canChaseBalls(pet)).toBe(false);
			expect(canFollowToy(pet)).toBe(false);
		}
	});
});
