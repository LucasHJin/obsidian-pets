import blueFish from "../../assets/food/blue-fish.png";
import brownFish from "../../assets/food/brown-fish.png";
import greyFish from "../../assets/food/grey-fish.png";
import oliveFish from "../../assets/food/olive-fish.png";
import rainbowFish from "../../assets/food/rainbow-fish.png";

export const FISH_WIDTH = 16;
export const FISH_HEIGHT = 11;
export const RAINBOW_FISH_CHANCE = 0.01;

export interface FishType {
	id: string;
	image: string;
	rainbow?: boolean;
}

export const FISH: FishType[] = [
	{ id: "blue-fish", image: blueFish },
	{ id: "brown-fish", image: brownFish },
	{ id: "grey-fish", image: greyFish },
	{ id: "olive-fish", image: oliveFish },
];

export const RAINBOW_FISH: FishType = { id: "rainbow-fish", image: rainbowFish, rainbow: true };

export function pickFish(random: () => number = Math.random): FishType {
	if (random() < RAINBOW_FISH_CHANCE) return RAINBOW_FISH;
	return FISH[Math.floor(random() * FISH.length)];
}

export function getFishType(id: string): FishType {
	const fish = [...FISH, RAINBOW_FISH].find((entry) => entry.id === id);
	if (!fish) {
		throw new Error(`Fish "${id}" not found`);
	}
	return fish;
}
