import catSound from '../assets/sounds/cat.mp3';

export function playCatSound(): void {
	try {
		const audio = new Audio(catSound);
		audio.volume = 0.4 + Math.random() * 0.1;
		audio.preservesPitch = false;
		audio.playbackRate = 0.85 + Math.random() * 0.4;
		void audio.play();
	} catch (error) {
		console.error("Failed to play cat sound", error);
	}
}
