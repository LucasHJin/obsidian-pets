import catSound from '../assets/sounds/cat.mp3';
import bunnySound from '../assets/sounds/bunny.mp3';
import ghostSound from '../assets/sounds/ghost.mp3';
import bounceSound from '../assets/sounds/bounce.mp3';
import jingleSound from '../assets/sounds/jingle.mp3';
import spawnSound from '../assets/sounds/spawn.mp3';

const SOUNDS: Record<string, string> = {
	cat: catSound,
	bunny: bunnySound,
	ghost: ghostSound,
	spawn: spawnSound,
};

const BALL_MAX_SPEED = 10;

let soundEnabled = false;
let toyAudio: HTMLAudioElement | null = null;

export function setSoundEnabled(enabled: boolean): void {
	soundEnabled = enabled;
	if (!enabled) stopToySound();
}

export function startToySound(): void {
	if (!soundEnabled || toyAudio) return;
	try {
		toyAudio = new Audio(jingleSound);
		toyAudio.loop = true;
		toyAudio.volume = 0.85;
		void toyAudio.play();
	} catch (error) {
		console.error("Failed to play jingle sound", error);
	}
}

export function stopToySound(): void {
	if (!toyAudio) return;
	toyAudio.pause();
	toyAudio = null;
}

export function playPetSound(sound: string): void {
	if (!soundEnabled) return;
	try {
		const audio = new Audio(SOUNDS[sound]);
		audio.volume = 0.3 + Math.random() * 0.1;
		audio.preservesPitch = false;
		audio.playbackRate = 0.85 + Math.random() * 0.4;
		void audio.play();
	} catch (error) {
		console.error(`Failed to play ${sound} sound`, error);
	}
}

export function playBallSound(speed: number): void {
	if (!soundEnabled) return;
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
