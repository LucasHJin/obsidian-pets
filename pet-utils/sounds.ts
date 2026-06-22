import catSound from '../assets/sounds/cat.mp3';
import bunnySound from '../assets/sounds/bunny.mp3';
import ghostSound from '../assets/sounds/ghost.mp3';

const SOUNDS: Record<string, string> = {
	cat: catSound,
	bunny: bunnySound,
	ghost: ghostSound,
};

let soundEnabled = false;

export function setSoundEnabled(enabled: boolean): void {
	soundEnabled = enabled;
}

export function playSound(sound: string): void {
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
