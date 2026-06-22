import catSound from '../assets/sounds/cat.mp3';

export function playCatSound(): void {
	try {
		const audio = new Audio(catSound);
		audio.volume = 0.5;
		void audio.play();
	} catch (error) {
		console.error("Failed to play cat sound", error);
	}
}
