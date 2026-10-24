import { Floor } from "../floor";
import { SoundPlayer } from "../audio/sounds";
import { PetType, Species } from "../catalog/pets";
import { Pet, PetAnimations } from "./pet";
import { Cat } from "./cat";
import { Dog } from "./dog";
import { Bunny } from "./bunny";
import { Ghost } from "./ghost";
import { getPetAnimations } from "./pet-animations";

export interface PetSpawn {
	container: HTMLElement;
	type: PetType;
	name: string;
	floor: Floor;
	scale: number;
	sounds: SoundPlayer;
}

interface SpeciesSpec {
	minMoveDist: number;
	moveDistRange: number;
	create(spawn: PetSpawn, animations: PetAnimations, moveDist: number): Pet;
}

const SPECIES: Record<Species, SpeciesSpec> = {
	cat: {
		minMoveDist: 25,
		moveDistRange: 20,
		create: (spawn, animations, moveDist) =>
			new Cat(
				spawn.container,
				animations,
				moveDist,
				spawn.floor,
				spawn.scale,
				spawn.name,
				spawn.sounds,
				spawn.type.flying,
			),
	},
	dog: {
		minMoveDist: 25,
		moveDistRange: 20,
		create: (spawn, animations, moveDist) =>
			new Dog(
				spawn.container,
				animations,
				moveDist,
				spawn.floor,
				spawn.scale,
				spawn.name,
				spawn.sounds,
			),
	},
	bunny: {
		minMoveDist: 45,
		moveDistRange: 30,
		create: (spawn, animations, moveDist) =>
			new Bunny(
				spawn.container,
				animations,
				moveDist,
				spawn.floor,
				spawn.scale,
				spawn.name,
				spawn.sounds,
			),
	},
	ghost: {
		minMoveDist: 20,
		moveDistRange: 20,
		create: (spawn, animations, moveDist) =>
			new Ghost(
				spawn.container,
				animations,
				moveDist,
				spawn.floor,
				spawn.scale,
				spawn.name,
				spawn.sounds,
			),
	},
};

export function createPet(spawn: PetSpawn): Pet {
	const spec = SPECIES[spawn.type.species];
	const moveDist = Math.floor(Math.random() * spec.moveDistRange) + spec.minMoveDist;
	return spec.create(spawn, getPetAnimations(spawn.type), moveDist);
}
