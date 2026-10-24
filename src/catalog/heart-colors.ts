import blueHeart from "../../assets/misc/hearts/blue-heart.png";
import greenHeart from "../../assets/misc/hearts/green-heart.png";
import orangeHeart from "../../assets/misc/hearts/orange-heart.png";
import pinkHeart from "../../assets/misc/hearts/pink-heart.png";
import purpleHeart from "../../assets/misc/hearts/purple-heart.png";
import rainbowHeart from "../../assets/misc/hearts/rainbow-heart.png";
import redHeart from "../../assets/misc/hearts/red-heart.png";
import whiteHeart from "../../assets/misc/hearts/white-heart.png";
import yellowHeart from "../../assets/misc/hearts/yellow-heart.png";
import { ColorVariant, pickColor } from "./colors";

export const HEART_COLORS: ColorVariant[] = [
	{ id: "red", image: redHeart },
	{ id: "pink", image: pinkHeart },
	{ id: "orange", image: orangeHeart },
	{ id: "yellow", image: yellowHeart },
	{ id: "green", image: greenHeart },
	{ id: "blue", image: blueHeart },
	{ id: "purple", image: purpleHeart },
	{ id: "white", image: whiteHeart },
];

export const RAINBOW_HEART: ColorVariant = { id: "rainbow", image: rainbowHeart };

export const RAINBOW_HEART_CHANCE = 0.01;

export interface Heart {
	image: string;
	rainbow: boolean;
}

export function pickHeart(random: () => number = Math.random): Heart {
	if (random() < RAINBOW_HEART_CHANCE) {
		return { image: RAINBOW_HEART.image, rainbow: true };
	}
	return { image: pickColor(HEART_COLORS, random).image, rainbow: false };
}
