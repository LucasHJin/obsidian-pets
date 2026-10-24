export interface ColorVariant {
	id: string;
	image: string;
}

export function pickColor(
	variants: readonly ColorVariant[],
	random: () => number = Math.random,
): ColorVariant {
	return variants[Math.min(variants.length - 1, Math.floor(random() * variants.length))];
}
