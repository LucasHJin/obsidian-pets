import { AnimationConfig, AnimationName, PetAnimations } from "./pet";
import { findPetAsset, getPetAsset } from "../catalog/assets";
import { getPetType } from "../catalog/pets";

function alterDuration(base: number, variation = 100): number {
	const offset = Math.floor(Math.random() * (variation * 2 + 1)) - variation;
	return base + offset;
}

interface OptionalCatAnimation {
	name: AnimationName;
	file: string;
	frameCount: number;
	duration: number;
}

const OPTIONAL_CAT_ANIMATIONS: OptionalCatAnimation[] = [
	{ name: "idle2", file: "idle2-cat.png", frameCount: 14, duration: 1400 },
	{ name: "liking", file: "liking-cat.png", frameCount: 18, duration: 1800 },
	{ name: "fly", file: "fly-cat.png", frameCount: 3, duration: 600 },
];

export function getCatAnimations(type: string): PetAnimations {
	const animations: PetAnimations = {
		idle: {
			spriteUrl: getPetAsset(type, "idle-cat.png"),
			frameCount: 7,
			frameWidth: 32,
			duration: alterDuration(700, 100),
		},
		jump: {
			spriteUrl: getPetAsset(type, "jump-cat.png"),
			frameCount: 13,
			frameWidth: 32,
			duration: alterDuration(1300, 100),
		},
		jump2: {
			spriteUrl: getPetAsset(type, "jump2-cat.png"),
			frameCount: 9,
			frameWidth: 32,
			duration: alterDuration(900, 100),
		},
		run: {
			spriteUrl: getPetAsset(type, "run-cat.png"),
			frameCount: 7,
			frameWidth: 32,
			duration: alterDuration(700, 100),
		},
		sit: {
			spriteUrl: getPetAsset(type, "sitting-cat.png"),
			frameCount: 3,
			frameWidth: 32,
			duration: alterDuration(750, 100),
		},
		sleep: {
			spriteUrl: getPetAsset(type, "sleep-cat.png"),
			frameCount: 3,
			frameWidth: 32,
			duration: alterDuration(750, 100),
		},
		die: {
			spriteUrl: getPetAsset(type, "die-cat.png"),
			frameCount: 15,
			frameWidth: 32,
			duration: alterDuration(1500, 100),
		},
	};

	if (getPetType(type)?.noJump) {
		delete animations.jump;
		delete animations.jump2;
	}

	for (const { name, file, frameCount, duration } of OPTIONAL_CAT_ANIMATIONS) {
		const spriteUrl = findPetAsset(type, file);
		if (!spriteUrl) continue;
		animations[name] = {
			spriteUrl,
			frameCount,
			frameWidth: 32,
			duration: alterDuration(duration, 100),
		};
	}

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

export function getIdleAnimation(type: string): AnimationConfig | undefined {
	switch (getPetType(type)?.species) {
		case "cat":
			return getCatAnimations(type).idle;
		case "bunny":
			return getBunnyAnimations(type).idle;
		case "ghost":
			return getGhostAnimations(type).idle;
		default:
			return undefined;
	}
}
