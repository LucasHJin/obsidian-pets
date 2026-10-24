import blueCatToy from "../../assets/toys/cat-toys/blue-cat-toy.png";
import greenCatToy from "../../assets/toys/cat-toys/green-cat-toy.png";
import orangeCatToy from "../../assets/toys/cat-toys/orange-cat-toy.png";
import pinkCatToy from "../../assets/toys/cat-toys/pink-cat-toy.png";
import purpleCatToy from "../../assets/toys/cat-toys/purple-cat-toy.png";
import redCatToy from "../../assets/toys/cat-toys/red-cat-toy.png";
import yellowCatToy from "../../assets/toys/cat-toys/yellow-cat-toy.png";
import { ColorVariant, pickColor } from "./colors";

export const CAT_TOY_COLORS: ColorVariant[] = [
	{ id: "blue", image: blueCatToy },
	{ id: "red", image: redCatToy },
	{ id: "orange", image: orangeCatToy },
	{ id: "yellow", image: yellowCatToy },
	{ id: "green", image: greenCatToy },
	{ id: "pink", image: pinkCatToy },
	{ id: "purple", image: purpleCatToy },
];

export function pickCatToyImage(random?: () => number): string {
	return pickColor(CAT_TOY_COLORS, random).image;
}
