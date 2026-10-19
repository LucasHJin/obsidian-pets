import { petAssets } from "virtual:pet-assets";
import catToy from "../../assets/toys/cat-toy.png";
import heart from "../../assets/misc/heart.png";

export { petAssets };

export const catToyAsset = catToy;

export const heartAsset = heart;

export function getPetAsset(petType: string, assetName: string): string {
	const assets = petAssets[petType];
	if (!assets) {
		throw new Error(`Pet type "${petType}" not found`);
	}
	const asset = assets[assetName];
	if (!asset) {
		throw new Error(`Asset "${assetName}" not found for pet type "${petType}"`);
	}
	return asset;
}
