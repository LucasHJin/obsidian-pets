import { StardewPet } from "./stardew-pet";
import { getStardewSpeciesDefinition, isStardewSpecies } from "./stardew-species";

export type RenderablePet = StardewPet;

export function createRenderablePet(
	container: Element,
	type: string,
	background: string,
	petId: string,
	scale: number,
	petName: string,
	rightClickTextProvider: (() => string | Promise<string>) | null,
	speedMultiplier = 1,
	speechEnabledProvider: (() => boolean) | null = null,
): RenderablePet | null {
	if (isStardewSpecies(type)) {
		const species = getStardewSpeciesDefinition(type);
		if (!species) {
			return null;
		}
		return new StardewPet(container, species, background, petId, scale, petName, rightClickTextProvider, speedMultiplier, speechEnabledProvider);
	}

	return null;
}