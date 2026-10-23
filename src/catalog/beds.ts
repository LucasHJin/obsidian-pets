import blueBed from "../../assets/beds/blue-bed.png";
import brownBed from "../../assets/beds/brown-bed.png";
import greenBed from "../../assets/beds/green-bed.png";
import pinkBed from "../../assets/beds/pink-bed.png";
import purpleBed from "../../assets/beds/purple-bed.png";
import redBed from "../../assets/beds/red-bed.png";

export interface BedType {
	id: string;
	label: string;
	image: string;
}

export const BEDS: BedType[] = [
	{ id: "blue", label: "Blue bed", image: blueBed },
	{ id: "brown", label: "Brown bed", image: brownBed },
	{ id: "green", label: "Green bed", image: greenBed },
	{ id: "pink", label: "Pink bed", image: pinkBed },
	{ id: "purple", label: "Purple bed", image: purpleBed },
	{ id: "red", label: "Red bed", image: redBed },
];

export function getBed(id: string): BedType | undefined {
	return BEDS.find((bed) => bed.id === id);
}

export function getBedImage(id: string): string {
	const bed = getBed(id);
	if (!bed) {
		throw new Error(`Bed "${id}" not found`);
	}
	return bed.image;
}
