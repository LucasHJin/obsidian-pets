import { Pet } from "./pet";
import { Ball } from "../toys/ball";

export interface BallChaser {
	startChasingBall(ball: Ball): void;
	stopChasingBall(ball: Ball): void;
}

export interface ToyFollower {
	startFollowingCursor(getCursorX: () => number): void;
	stopFollowingCursor(): void;
}

export function canChaseBalls(pet: Pet): pet is Pet & BallChaser {
	return "startChasingBall" in pet && "stopChasingBall" in pet;
}

export function canFollowToy(pet: Pet): pet is Pet & ToyFollower {
	return "startFollowingCursor" in pet && "stopFollowingCursor" in pet;
}
