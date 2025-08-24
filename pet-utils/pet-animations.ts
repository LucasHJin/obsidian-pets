import { AnimationConfig } from "./pet";
import { getPetAsset } from "./pet-assets";

// Allow for optional pet animations
type PetAnimations = {
	idle: AnimationConfig;
	idle2?: AnimationConfig;
	jump: AnimationConfig;
    jump2?: AnimationConfig;
	run: AnimationConfig;
	sit: AnimationConfig;
	sleep: AnimationConfig;
	die: AnimationConfig;
    liking?: AnimationConfig;
    fly?: AnimationConfig;
};

// ±100ms variation for each animation duration
function alterDuration(base: number, variation = 100): number {
	const offset = Math.floor(Math.random() * (variation * 2 + 1)) - variation;
	return base + offset;
}

export function getCatAnimations(
	type: string
): PetAnimations {
    /*
    Exceptions:
    - Classic cat -> liking
    - Witch cat -> flying
    */
    const animations: PetAnimations = {
        idle: {
            name: "idle",
            spriteUrl: getPetAsset(type, "idle-cat.png"),
            frameCount: 7,
            frameWidth: 32,
            frameHeight: 32,
            duration: alterDuration(700, 100),
        },
        idle2: {
            name: "idle2",
            spriteUrl: getPetAsset(type, "idle2-cat.png"),
            frameCount: 14,
            frameWidth: 32,
            frameHeight: 32,
            duration: alterDuration(1400, 100),
        },
        jump: {
            name: "jump",
            spriteUrl: getPetAsset(type, "jump-cat.png"),
            frameCount: 13,
            frameWidth: 32,
            frameHeight: 32,
            duration: alterDuration(1300, 100),
        },
        jump2: {
            name: "jump2",
            spriteUrl: getPetAsset(type, "jump2-cat.png"),
            frameCount: 9,
            frameWidth: 32,
            frameHeight: 32,
            duration: alterDuration(900, 100),
        },
        run: {
            name: "run",
            spriteUrl: getPetAsset(type, "run-cat.png"),
            frameCount: 7,
            frameWidth: 32,
            frameHeight: 32,
            duration: alterDuration(700, 100),
        },
        sit: {
            name: "sit",
            spriteUrl: getPetAsset(type, "sitting-cat.png"),
            frameCount: 3,
            frameWidth: 32,
            frameHeight: 32,
            duration: alterDuration(750, 100),
        },
        sleep: {
            name: "sleep",
            spriteUrl: getPetAsset(type, "sleep-cat.png"),
            frameCount: 3,
            frameWidth: 32,
            frameHeight: 32,
            duration: alterDuration(750, 100),
        },
        die: {
            name: "die",
            spriteUrl: getPetAsset(type, "die-cat.png"),
            frameCount: 15,
            frameWidth: 32,
            frameHeight: 32,
            duration: alterDuration(1500, 100),
        },
    }

    if (type === "pets/batman-black-cat" || type === "pets/batman-blue-cat") {
		delete animations.idle2;
	}

    return animations;
}

export function getBunnyAnimations(
	type: string
): PetAnimations {
    const animations: PetAnimations = { 
        idle: {
            name: "idle",
            spriteUrl: getPetAsset(type, "idle-bunny.png"),
            frameCount: 12,
            frameWidth: 32,
            frameHeight: 32,
            duration: alterDuration(1200, 150),
        },
        idle2: {
            name: "liedown",
            spriteUrl: getPetAsset(type, "liedown-bunny.png"),
            frameCount: 6,
            frameWidth: 32,
            frameHeight: 32,
            duration: alterDuration(600, 150),
        },
        jump: {
            name: "jump",
            spriteUrl: getPetAsset(type, "jump-bunny.png"),
            frameCount: 11,
            frameWidth: 32,
            frameHeight: 32,
            duration: alterDuration(1100, 150),
        },
        run: {
            name: "run",
            spriteUrl: getPetAsset(type, "run-bunny.png"),
            frameCount: 8,
            frameWidth: 32,
            frameHeight: 32,
            duration: alterDuration(800, 150),
        },
        sit: {
            name: "like",
            spriteUrl: getPetAsset(type, "like-bunny.png"),
            frameCount: 5,
            frameWidth: 32,
            frameHeight: 32,
            duration: alterDuration(500, 150),
        },
        sleep: {
            name: "sleep",
            spriteUrl: getPetAsset(type, "sleep-bunny.png"),
            frameCount: 6,
            frameWidth: 32,
            frameHeight: 32,
            duration: alterDuration(600, 150),
        },
        die: {
            name: "die",
            spriteUrl: getPetAsset(type, "die-bunny.png"),
            frameCount: 12,
            frameWidth: 32,
            frameHeight: 32,
            duration: alterDuration(1200, 150),
        },
    }

    return animations;
}