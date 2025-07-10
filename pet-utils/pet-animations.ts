import { normalizePath, App } from "obsidian";
import { AnimationConfig } from "pet-utils/pet";
import type PetPlugin from "main";

export type PetAnimations = {
	idle: AnimationConfig;
	idle2?: AnimationConfig;
	jump: AnimationConfig;
	run: AnimationConfig;
	sit: AnimationConfig;
	sleep: AnimationConfig;
	die: AnimationConfig;
};

// ±100ms variation for each animation duration
function alterDuration(base: number, variation = 100): number {
	const offset = Math.floor(Math.random() * (variation * 2 + 1)) - variation;
	return base + offset;
}

export function getCatAnimations(
	app: App,
	plugin: PetPlugin,
	type: string
): PetAnimations {
	const dir = plugin.manifest.dir;

	const animations: PetAnimations = {
		idle: {
			name: "idle",
			spriteUrl: app.vault.adapter.getResourcePath(
				normalizePath(`${dir}/assets/${type}/idle-cat.png`)
			),
			frameCount: 7,
			frameWidth: 32,
			frameHeight: 32,
			duration: alterDuration(700),
		},
		idle2: {
			name: "idle2",
			spriteUrl: app.vault.adapter.getResourcePath(
				normalizePath(`${dir}/assets/${type}/idle2-cat.png`)
			),
			frameCount: 14,
			frameWidth: 32,
			frameHeight: 32,
			duration: alterDuration(1400),
		},
		jump: {
			name: "jump",
			spriteUrl: app.vault.adapter.getResourcePath(
				normalizePath(`${dir}/assets/${type}/jump-cat.png`)
			),
			frameCount: 13,
			frameWidth: 32,
			frameHeight: 32,
			duration: alterDuration(1300),
		},
		run: {
			name: "run",
			spriteUrl: app.vault.adapter.getResourcePath(
				normalizePath(`${dir}/assets/${type}/run-cat.png`)
			),
			frameCount: 7,
			frameWidth: 32,
			frameHeight: 32,
			duration: alterDuration(700),
		},
		sit: {
			name: "sit",
			spriteUrl: app.vault.adapter.getResourcePath(
				normalizePath(`${dir}/assets/${type}/sitting-cat.png`)
			),
			frameCount: 3,
			frameWidth: 32,
			frameHeight: 32,
			duration: alterDuration(750),
		},
		sleep: {
			name: "sleep",
			spriteUrl: app.vault.adapter.getResourcePath(
				normalizePath(`${dir}/assets/${type}/sleep-cat.png`)
			),
			frameCount: 3,
			frameWidth: 32,
			frameHeight: 32,
			duration: alterDuration(750),
		},
		die: {
			name: "die",
			spriteUrl: app.vault.adapter.getResourcePath(
				normalizePath(`${dir}/assets/${type}/die-cat.png`)
			),
			frameCount: 15,
			frameWidth: 32,
			frameHeight: 32,
			duration: alterDuration(1500),
		},
	};

	if (type === "pets/batman-black-cat" || type === "pets/batman-blue-cat") {
		delete animations.idle2;
	}

	return animations;
}

export function getBunnyAnimations(
	app: App,
	plugin: PetPlugin,
	type: string
): PetAnimations {
	const dir = plugin.manifest.dir;

	return {
		idle: {
			name: "idle",
			spriteUrl: app.vault.adapter.getResourcePath(
				normalizePath(`${dir}/assets/${type}/idle-bunny.png`)
			),
			frameCount: 12,
			frameWidth: 32,
			frameHeight: 32,
			duration: alterDuration(1200),
		},
		idle2: {
			name: "idle2",
			spriteUrl: app.vault.adapter.getResourcePath(
				normalizePath(`${dir}/assets/${type}/liedown-bunny.png`)
			),
			frameCount: 6,
			frameWidth: 32,
			frameHeight: 32,
			duration: alterDuration(600),
		},
		jump: {
			name: "jump",
			spriteUrl: app.vault.adapter.getResourcePath(
				normalizePath(`${dir}/assets/${type}/jump-bunny.png`)
			),
			frameCount: 11,
			frameWidth: 32,
			frameHeight: 32,
			duration: alterDuration(1100),
		},
		run: {
			name: "run",
			spriteUrl: app.vault.adapter.getResourcePath(
				normalizePath(`${dir}/assets/${type}/run-bunny.png`)
			),
			frameCount: 8,
			frameWidth: 32,
			frameHeight: 32,
			duration: alterDuration(800),
		},
		sit: {
			name: "sit",
			spriteUrl: app.vault.adapter.getResourcePath(
				normalizePath(`${dir}/assets/${type}/liking-bunny.png`)
			),
			frameCount: 5,
			frameWidth: 32,
			frameHeight: 32,
			duration: alterDuration(500),
		},
		sleep: {
			name: "sleep",
			spriteUrl: app.vault.adapter.getResourcePath(
				normalizePath(`${dir}/assets/${type}/sleep-bunny.png`)
			),
			frameCount: 6,
			frameWidth: 32,
			frameHeight: 32,
			duration: alterDuration(600),
		},
		die: {
			name: "die",
			spriteUrl: app.vault.adapter.getResourcePath(
				normalizePath(`${dir}/assets/${type}/die-bunny.png`)
			),
			frameCount: 12,
			frameWidth: 32,
			frameHeight: 32,
			duration: alterDuration(1200),
		},
	};
}
