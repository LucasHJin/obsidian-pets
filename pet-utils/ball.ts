import { AnimationConfig } from "./pet";

export class Ball {
	private container: Element;
	private ballEl: HTMLElement;
	private animation: AnimationConfig;
	private ballId: string;

	constructor(container: Element, animation: AnimationConfig, ballId: string) {
		this.container = container;
		this.animation = animation;
		this.ballId = ballId;

		// Create ball element immediately
		this.ballEl = this.createBallElement();

		// Set up animation
		this.setAnimation();

		// Remove ball after 5 seconds
		setTimeout(() => {
			this.destroy();
		}, 5000);
	}

	private createBallElement(): HTMLElement {
		const el = this.container.createDiv({ cls: "ball" });

		// Initial CSS properties
		el.setCssProps({
			"--ball-size": `${this.animation.frameWidth}px`,
		});

		return el;
	}

	private setAnimation() {
		const anim = this.animation;
		const keyframeName = `${anim.name}-${this.ballId}`;

		// Generate keyframes once
		if (!document.getElementById(`kf-${keyframeName}`)) {
			const style = document.createElement("style");
			style.id = `kf-${keyframeName}`;
			document.head.appendChild(style);

			const keyframeRule = `
				@keyframes ${keyframeName} {
					from { background-position: 0 0; }
					to { background-position: -${anim.frameCount * anim.frameWidth}px 0; }
				}`;
			(style.sheet as CSSStyleSheet).insertRule(keyframeRule, 0);
		}

		// Apply animation + sprite
		this.ballEl.setCssStyles({
			animation: `${keyframeName} ${anim.duration}ms steps(${anim.frameCount}) infinite`,
			width: `${anim.frameWidth}px`,
			height: `${anim.frameHeight}px`,
			backgroundImage: `url(${anim.spriteUrl})`,
			backgroundSize: `${anim.frameCount * anim.frameWidth}px auto`,
		});
	}

	public destroy() {
		this.ballEl.remove();
	}
}
