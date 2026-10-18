import blueBall from "../../assets/toys/blue-ball.png";
import cyanBall from "../../assets/toys/cyan-ball.png";
import greenBall from "../../assets/toys/green-ball.png";
import orangeBall from "../../assets/toys/orange-ball.png";
import pinkBall from "../../assets/toys/pink-ball.png";
import purpleBall from "../../assets/toys/purple-ball.png";
import redBall from "../../assets/toys/red-ball.png";
import yellowBall from "../../assets/toys/yellow-ball.png";

export interface BallType {
	id: string;
	image: string;
}

export const BALLS: BallType[] = [
	{ id: "blue-ball", image: blueBall },
	{ id: "cyan-ball", image: cyanBall },
	{ id: "green-ball", image: greenBall },
	{ id: "orange-ball", image: orangeBall },
	{ id: "pink-ball", image: pinkBall },
	{ id: "purple-ball", image: purpleBall },
	{ id: "red-ball", image: redBall },
	{ id: "yellow-ball", image: yellowBall },
];

export function getBallImage(id: string): string {
	const ball = BALLS.find((entry) => entry.id === id);
	if (!ball) {
		throw new Error(`Ball "${id}" not found`);
	}
	return ball.image;
}
