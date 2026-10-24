import { petAssets } from "virtual:pet-assets";

export { petAssets };

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
