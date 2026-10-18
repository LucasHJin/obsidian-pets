import { catToyAsset } from "../catalog/assets";
import { startToySound, stopToySound } from "../audio/sounds";

const FRAME_COUNT = 6;
const FRAME_WIDTH = 32;

export class CatToyOverlay {
	private doc: Document;
	private cursorEl: HTMLElement;
	private mouseMoveHandler: (e: MouseEvent) => void;

	constructor(doc: Document, petSize: number, onMouseMove: (x: number) => void) {
		this.doc = doc;
		this.cursorEl = doc.body.createDiv({ cls: "cat-toy-cursor" });
		this.cursorEl.setCssProps({
			"--cat-toy-url": `url(${catToyAsset})`,
			"--cursor-x": "-100px",
			"--cursor-y": "-100px",
			"--cat-toy-scale": `${1.1 * petSize}`,
			"--cat-toy-frame-size": `${FRAME_WIDTH}px`,
			"--cat-toy-sprite-width": `${FRAME_COUNT * FRAME_WIDTH}px`,
			"--cat-toy-offset": `${-FRAME_WIDTH / 4}px`,
			"--cat-toy-duration": `${FRAME_COUNT * 100}ms`,
		});

		doc.body.addClass("cat-toy-hide-cursor");

		this.mouseMoveHandler = (e: MouseEvent) => {
			this.cursorEl.setCssProps({
				"--cursor-x": `${e.clientX}px`,
				"--cursor-y": `${e.clientY}px`,
			});
			onMouseMove(e.clientX);
		};
		doc.addEventListener("mousemove", this.mouseMoveHandler);

		startToySound();
	}

	updateSize(petSize: number) {
		this.cursorEl.setCssProps({
			"--cat-toy-scale": `${1.1 * petSize}`,
		});
	}

	destroy() {
		stopToySound();
		this.doc.removeEventListener("mousemove", this.mouseMoveHandler);
		this.doc.body.removeClass("cat-toy-hide-cursor");
		this.cursorEl.remove();
	}
}
