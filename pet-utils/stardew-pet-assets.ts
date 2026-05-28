import catSprite from "../assets/stardew/pets/cat.png";
import chickenSprite from "../assets/stardew/pets/chicken.png";
import cowSprite from "../assets/stardew/pets/cow.png";
import dinoSprite from "../assets/stardew/pets/dino.png";
import dogSprite from "../assets/stardew/pets/dog.png";
import duckSprite from "../assets/stardew/pets/duck.png";
import junimoSprite from "../assets/stardew/pets/junimo.png";
import parrotSprite from "../assets/stardew/pets/parrot.png";
import rabbitSprite from "../assets/stardew/pets/rabbit.png";
import raccoonSprite from "../assets/stardew/pets/raccoon.png";
import turtleSprite from "../assets/stardew/pets/turtle.png";

import dirtBackground from "../assets/stardew/backgrounds/dirt.png";
import grassBackground from "../assets/stardew/backgrounds/grass.png";
import grassFallBackground from "../assets/stardew/backgrounds/grass_fall.png";
import sandBackground from "../assets/stardew/backgrounds/sand.png";
import snowBackground from "../assets/stardew/backgrounds/snow.png";
import woodBrokenBackground from "../assets/stardew/backgrounds/wood_broken.png";
import woodDarkBackground from "../assets/stardew/backgrounds/wood_dark.png";
import woodLightBackground from "../assets/stardew/backgrounds/wood_light.png";
import woodOrangeBackground from "../assets/stardew/backgrounds/wood_orange.png";

export const stardewPetSprites = {
	cat: catSprite,
	chicken: chickenSprite,
	cow: cowSprite,
	dino: dinoSprite,
	dog: dogSprite,
	duck: duckSprite,
	junimo: junimoSprite,
	parrot: parrotSprite,
	rabbit: rabbitSprite,
	raccoon: raccoonSprite,
	turtle: turtleSprite,
};

export const stardewBackgrounds = {
	dirt: dirtBackground,
	grass: grassBackground,
	grass_fall: grassFallBackground,
	sand: sandBackground,
	snow: snowBackground,
	wood_broken: woodBrokenBackground,
	wood_dark: woodDarkBackground,
	wood_light: woodLightBackground,
	wood_orange: woodOrangeBackground,
};

export type StardewPetSpriteKey = keyof typeof stardewPetSprites;

export function getStardewPetAsset(petType: StardewPetSpriteKey): string {
	const asset = stardewPetSprites[petType];
	if (!asset) {
		throw new Error(`Unknown Stardew pet asset: ${petType}`);
	}
	return asset;
}

export function getStardewBackgroundAsset(backgroundName: keyof typeof stardewBackgrounds): string {
	const asset = stardewBackgrounds[backgroundName];
	if (!asset) {
		throw new Error(`Unknown Stardew background asset: ${backgroundName}`);
	}
	return asset;
}
