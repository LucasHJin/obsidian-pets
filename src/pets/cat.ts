import { AnimationName, PetAnimations } from "./pet";
import { Chaser } from "./chaser";
import { ToyFollower } from "./capabilities";
import { Floor } from "../floor";
import { SoundPlayer } from "../audio/sounds";

const TOY_SPEED = 3.5;

export class Cat extends Chaser implements ToyFollower {
	private canFly: boolean;
	private chasingCursor = false;
	private getCursorX: (() => number) | null = null;
	private readonly toySpeed: number;

	constructor(
		container: HTMLElement,
		animations: PetAnimations,
		moveDist: number,
		floor: Floor,
		scale: number,
		petName: string,
		sounds: SoundPlayer,
		canFly = false,
	) {
		super(container, animations, moveDist, floor, scale, petName, sounds);
		this.canFly = canFly;
		this.toySpeed = moveDist * TOY_SPEED * (0.85 + Math.random() * 0.3);
	}

	protected override playSound(): void {
		this.sounds.playPet("cat");
	}

	startFollowingCursor(getCursorX: () => number): void {
		this.getCursorX = getCursorX;
		this.chasingCursor = true;
		this.interruptAction = true;
	}

	stopFollowingCursor(): void {
		this.chasingCursor = false;
		this.getCursorX = null;
		this.interruptAction = false;
	}

	protected override async runPriorityBehaviour(): Promise<boolean> {
		if (this.chasingCursor) {
			this.interruptAction = false;
			await this.pursue(
				() => (this.chasingCursor && this.getCursorX ? this.getCursorX() : null),
				this.toySpeed,
				false,
			);
			this.setAnimation("idle");
			return true;
		}
		return super.runPriorityBehaviour();
	}

	protected override routineActions(): AnimationName[] {
		return super.routineActions().filter((name) => name !== "fly");
	}

	protected override movingAnimation(): AnimationName {
		return this.canFly && Math.random() < 0.3 ? "fly" : "run";
	}
}
