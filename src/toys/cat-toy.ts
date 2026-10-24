import { SoundPlayer } from "../audio/sounds";

const FRAME_COUNT = 6;
const FRAME_WIDTH = 32;

export class CatToyOverlay {
	private doc: Document;
	private cursorEl: HTMLElement;
	private mouseMoveHandler: (e: MouseEvent) => void;

	constructor(
		doc: Document,
		petSize: number,
		image: string,
		private readonly sounds: SoundPlayer,
		private clientX: number,
	) {
		this.doc = doc;
		this.cursorEl = doc.body.createDiv({ cls: "pixel-pets-cat-toy" });
		this.cursorEl.setCssProps({
			"--pixel-pets-cat-toy-url": `url(${image})`,
			"--pixel-pets-cursor-x": "-100px",
			"--pixel-pets-cursor-y": "-100px",
			"--pixel-pets-cat-toy-scale": `${1.1 * petSize}`,
			"--pixel-pets-cat-toy-frame-size": `${FRAME_WIDTH}px`,
			"--pixel-pets-cat-toy-sprite-width": `${FRAME_COUNT * FRAME_WIDTH}px`,
			"--pixel-pets-cat-toy-offset": `${-FRAME_WIDTH / 4}px`,
			"--pixel-pets-cat-toy-frames": `${FRAME_COUNT}`,
			"--pixel-pets-cat-toy-duration": `${FRAME_COUNT * 100}ms`,
		});

		doc.body.addClass("pixel-pets-hide-cursor");

		this.mouseMoveHandler = (e: MouseEvent) => {
			this.cursorEl.setCssProps({
				"--pixel-pets-cursor-x": `${e.clientX}px`,
				"--pixel-pets-cursor-y": `${e.clientY}px`,
			});
			this.clientX = e.clientX;
		};
		doc.addEventListener("mousemove", this.mouseMoveHandler);

		this.sounds.startToy();
	}

	getClientX(): number {
		return this.clientX;
	}

	updateSize(petSize: number) {
		this.cursorEl.setCssProps({
			"--pixel-pets-cat-toy-scale": `${1.1 * petSize}`,
		});
	}

	destroy() {
		this.sounds.stopToy();
		this.doc.removeEventListener("mousemove", this.mouseMoveHandler);
		this.doc.body.removeClass("pixel-pets-hide-cursor");
		this.cursorEl.remove();
	}
}
