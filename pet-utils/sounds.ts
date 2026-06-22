import catSound from '../assets/sounds/cat.mp3';
import bunnySound from '../assets/sounds/bunny.mp3';
import ghostSound from '../assets/sounds/ghost.mp3';

const SOUNDS: Record<string, string> = {
	cat: catSound,
	bunny: bunnySound,
	ghost: ghostSound,
};

export function playSound(sound: string): void {
	try {
		const audio = new Audio(SOUNDS[sound]);
		audio.volume = 0.4 + Math.random() * 0.1;
		audio.preservesPitch = false;
		audio.playbackRate = 0.85 + Math.random() * 0.4;
		void audio.play();
	} catch (error) {
		console.error(`Failed to play ${sound} sound`, error);
	}
}
