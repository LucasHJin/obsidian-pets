import { AnimationConfig, PetAnimations } from "./pet";
import { getPetAsset } from "../catalog/assets";
import { PetType, Species, getPetType } from "../catalog/pets";

function alterDuration(base: number, variation = 100): number {
	const offset = Math.floor(Math.random() * (variation * 2 + 1)) - variation;
	return base + offset;
}

function sheet(type: string, file: string, frameCount: number, duration: number): AnimationConfig {
	return {
		spriteUrl: getPetAsset(type, file),
		frameCount,
		frameWidth: 32,
		duration: alterDuration(duration, 100),
	};
}

function getFourLeggedAnimations(type: string, species: "cat" | "dog"): PetAnimations {
	return {
		idle: sheet(type, `idle-${species}.png`, 7, 700),
		jump: sheet(type, `jump-${species}.png`, 13, 1300),
		jump2: sheet(type, `jump2-${species}.png`, 9, 900),
		run: sheet(type, `run-${species}.png`, 7, 700),
		sit: sheet(type, `sitting-${species}.png`, 3, 750),
		sleep: sheet(type, `sleep-${species}.png`, 3, 750),
		die: sheet(type, `die-${species}.png`, 15, 1500),
	};
}

export function getCatAnimations(type: string): PetAnimations {
	const animations = getFourLeggedAnimations(type, "cat");

	if (type !== "pets/batman-black-cat" && type !== "pets/batman-blue-cat") {
		animations.idle2 = sheet(type, "idle2-cat.png", 14, 1400);
	}

	if (type === "pets/witch-cat") {
		// Remove jumping from witch cat because of issue with spritesheet
		delete animations.jump;
		delete animations.jump2;
		animations.fly = sheet(type, "fly-cat.png", 3, 600);
	} else if (type === "pets/classic-cat") {
		animations.liking = sheet(type, "liking-cat.png", 18, 1800);
	}

	return animations;
}

export function getDogAnimations(type: string): PetAnimations {
	const animations = getFourLeggedAnimations(type, "dog");
	animations.idle2 = sheet(type, "idle2-dog.png", 14, 1400);
	return animations;
}

export function getBunnyAnimations(type: string): PetAnimations {
	const animations: PetAnimations = {
		idle: {
			spriteUrl: getPetAsset(type, "idle-bunny.png"),
			frameCount: 12,
			frameWidth: 32,
			duration: alterDuration(1200, 150),
		},
		idle2: {
			spriteUrl: getPetAsset(type, "liedown-bunny.png"),
			frameCount: 6,
			frameWidth: 32,
			duration: alterDuration(600, 150),
		},
		jump: {
			spriteUrl: getPetAsset(type, "jump-bunny.png"),
			frameCount: 11,
			frameWidth: 32,
			duration: alterDuration(1100, 150),
		},
		run: {
			spriteUrl: getPetAsset(type, "run-bunny.png"),
			frameCount: 8,
			frameWidth: 32,
			duration: alterDuration(800, 150),
		},
		sit: {
			spriteUrl: getPetAsset(type, "like-bunny.png"),
			frameCount: 5,
			frameWidth: 32,
			duration: alterDuration(500, 150),
		},
		sleep: {
			spriteUrl: getPetAsset(type, "sleep-bunny.png"),
			frameCount: 6,
			frameWidth: 32,
			duration: alterDuration(600, 150),
		},
		die: {
			spriteUrl: getPetAsset(type, "die-bunny.png"),
			frameCount: 12,
			frameWidth: 32,
			duration: alterDuration(1200, 150),
		},
	};

	return animations;
}

export function getGhostAnimations(type: string): PetAnimations {
	const animations: PetAnimations = {
		idle: {
			spriteUrl: getPetAsset(type, "idle-ghost.png"),
			frameCount: 8,
			frameWidth: 32,
			duration: alterDuration(1200, 150),
		},
	};
	return animations;
}

const ANIMATION_BUILDERS: Record<Species, (type: string) => PetAnimations> = {
	cat: getCatAnimations,
	dog: getDogAnimations,
	bunny: getBunnyAnimations,
	ghost: getGhostAnimations,
};

export function getPetAnimations(petType: PetType): PetAnimations {
	return ANIMATION_BUILDERS[petType.species](petType.id);
}

export function getIdleAnimation(type: string): AnimationConfig | undefined {
	const petType = getPetType(type);
	return petType ? getPetAnimations(petType).idle : undefined;
}
