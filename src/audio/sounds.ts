import catSound from "../../assets/sounds/cat.mp3";
import bunnySound from "../../assets/sounds/bunny.mp3";
import ghostSound from "../../assets/sounds/ghost.mp3";
import bounceSound from "../../assets/sounds/bounce.mp3";
import jingleSound from "../../assets/sounds/jingle.mp3";
import spawnSound from "../../assets/sounds/spawn.mp3";

export type PetSound = "cat" | "bunny" | "ghost" | "spawn";

const PET_SOUNDS: Record<PetSound, string> = {
	cat: catSound,
	bunny: bunnySound,
	ghost: ghostSound,
	spawn: spawnSound,
};

const BALL_MAX_SPEED = 10;

export class SoundPlayer {
	private toyAudio: HTMLAudioElement | null = null;

	constructor(private enabled = false) {}

	setEnabled(enabled: boolean): void {
		this.enabled = enabled;
		if (!enabled) this.stopToy();
	}

	startToy(): void {
		if (!this.enabled || this.toyAudio) return;
		try {
			this.toyAudio = new Audio(jingleSound);
			this.toyAudio.loop = true;
			this.toyAudio.volume = 0.85;
			void this.toyAudio.play();
		} catch (error) {
			console.error("Failed to play jingle sound", error);
		}
	}

	stopToy(): void {
		if (!this.toyAudio) return;
		this.toyAudio.pause();
		this.toyAudio = null;
	}

	playPet(sound: PetSound): void {
		if (!this.enabled) return;
		try {
			const audio = new Audio(PET_SOUNDS[sound]);
			audio.volume = 0.3 + Math.random() * 0.1;
			audio.preservesPitch = false;
			audio.playbackRate = 0.85 + Math.random() * 0.4;
			void audio.play();
		} catch (error) {
			console.error(`Failed to play ${sound} sound`, error);
		}
	}

	playBounce(speed: number): void {
		if (!this.enabled) return;
		try {
			const audio = new Audio(bounceSound);
			const t = Math.min(speed / BALL_MAX_SPEED, 1);
			audio.volume = 0.7 + t * 0.3;
			audio.preservesPitch = false;
			audio.playbackRate = 1.3 - t * 0.3;
			void audio.play();
		} catch (error) {
			console.error("Failed to play bounce sound", error);
		}
	}
}
