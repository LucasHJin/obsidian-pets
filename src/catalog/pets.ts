export type Species = "cat" | "bunny" | "ghost";

export interface PetType {
	id: string;
	label: string;
	species: Species;
	flying?: boolean;
}

export const PETS: PetType[] = [
	{ id: "pets/batman-black-cat", label: "Black batman cat", species: "cat" },
	{ id: "pets/batman-blue-cat", label: "Blue batman cat", species: "cat" },
	{ id: "pets/black-cat", label: "Black cat", species: "cat" },
	{ id: "pets/brown-cat", label: "Brown cat", species: "cat" },
	{ id: "pets/xmas-cat", label: "Christmas cat", species: "cat" },
	{ id: "pets/xmas-v2-cat", label: "Christmas cat v2", species: "cat" },
	{ id: "pets/xmas-v3-cat", label: "Christmas cat v3", species: "cat" },
	{ id: "pets/classic-cat", label: "Classic cat", species: "cat" },
	{ id: "pets/deer-cat", label: "Deer cat", species: "cat" },
	{ id: "pets/demon-cat", label: "Demonic cat", species: "cat" },
	{ id: "pets/egypt-cat", label: "Egyptian cat", species: "cat" },
	{ id: "pets/ghost", label: "Ghost", species: "ghost" },
	{ id: "pets/grey-bunny", label: "Grey bunny", species: "bunny" },
	{ id: "pets/pirate-cat", label: "Pirate cat", species: "cat" },
	{ id: "pets/pirate-v2-cat", label: "Pirate cat v2", species: "cat" },
	{ id: "pets/pirate-v3-cat", label: "Pirate cat v3", species: "cat" },
	{ id: "pets/siamese-cat", label: "Siamese cat", species: "cat" },
	{ id: "pets/three-cat", label: "Tri-colored cat", species: "cat" },
	{ id: "pets/tiger-cat", label: "Tiger cat", species: "cat" },
	{ id: "pets/vampire-cat", label: "Vampire cat", species: "cat" },
	{ id: "pets/white-cat", label: "White cat", species: "cat" },
	{ id: "pets/witch-cat", label: "Witch cat", species: "cat", flying: true },
];

export function getPetType(id: string): PetType | undefined {
	return PETS.find((pet) => pet.id === id);
}
