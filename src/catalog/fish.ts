import blueFish from "../../assets/food/blue-fish.png";
import brownFish from "../../assets/food/brown-fish.png";
import greyFish from "../../assets/food/grey-fish.png";
import oliveFish from "../../assets/food/olive-fish.png";

export const FISH_WIDTH = 16;
export const FISH_HEIGHT = 11;

export interface FishType {
	id: string;
	image: string;
}

export const FISH: FishType[] = [
	{ id: "blue-fish", image: blueFish },
	{ id: "brown-fish", image: brownFish },
	{ id: "grey-fish", image: greyFish },
	{ id: "olive-fish", image: oliveFish },
];

export function getFishImage(id: string): string {
	const fish = FISH.find((entry) => entry.id === id);
	if (!fish) {
		throw new Error(`Fish "${id}" not found`);
	}
	return fish.image;
}
