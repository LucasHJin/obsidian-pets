import heart from '../assets/misc/heart.png';
import { getStardewBackgroundAsset, stardewBackgrounds } from './stardew-pet-assets';

export const heartAsset = heart;

export function getBackgroundAsset(backgroundName: string): string {
	return getStardewBackgroundAsset(backgroundName as keyof typeof stardewBackgrounds);
}
