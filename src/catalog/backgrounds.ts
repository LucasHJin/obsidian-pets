import snow1Background from "../../assets/backgrounds/snowbg-1.png";
import snow2Background from "../../assets/backgrounds/snowbg-2.png";
import snowGif from "../../assets/backgrounds/snow.gif";
import castle1Background from "../../assets/backgrounds/castlebg-1.png";
import castle2Background from "../../assets/backgrounds/castlebg-2.png";
import summer1Background from "../../assets/backgrounds/summerbg-1.png";
import summer2Background from "../../assets/backgrounds/summerbg-2.png";
import summer3Background from "../../assets/backgrounds/summerbg-3.png";
import temple1Background from "../../assets/backgrounds/templebg-1.png";
import temple2Background from "../../assets/backgrounds/templebg-2.png";

export interface Background {
	id: string;
	label: string;
	image?: string;
	floor: number;
	snow?: boolean;
}

export const SNOW_ANIMATION = snowGif;

const NO_BACKGROUND: Background = { id: "none", label: "None", floor: 80 };

export const BACKGROUNDS: Background[] = [
	NO_BACKGROUND,
	{
		id: "backgrounds/snowbg-1.png",
		label: "Snow #1",
		image: snow1Background,
		floor: 85,
		snow: true,
	},
	{
		id: "backgrounds/snowbg-2.png",
		label: "Snow #2",
		image: snow2Background,
		floor: 86,
		snow: true,
	},
	{
		id: "backgrounds/summerbg-1.png",
		label: "Summer #1",
		image: summer1Background,
		floor: 78,
	},
	{
		id: "backgrounds/summerbg-2.png",
		label: "Summer #2",
		image: summer2Background,
		floor: 88,
	},
	{
		id: "backgrounds/summerbg-3.png",
		label: "Summer #3",
		image: summer3Background,
		floor: 75,
	},
	{
		id: "backgrounds/templebg-1.png",
		label: "Temple #1",
		image: temple1Background,
		floor: 85.5,
	},
	{
		id: "backgrounds/templebg-2.png",
		label: "Temple #2",
		image: temple2Background,
		floor: 78.3,
	},
	{
		id: "backgrounds/castlebg-1.png",
		label: "Castle #1",
		image: castle1Background,
		floor: 82.1,
	},
	{
		id: "backgrounds/castlebg-2.png",
		label: "Castle #2",
		image: castle2Background,
		floor: 74,
	},
];

export function getBackground(id: string): Background {
	return BACKGROUNDS.find((background) => background.id === id) ?? NO_BACKGROUND;
}
