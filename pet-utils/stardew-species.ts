import { SelectorOption } from "../modals";
import { getStardewPetAsset, StardewPetSpriteKey } from "./stardew-pet-assets";

export type StardewFrame = [number, number];

export type StardewAnimation = {
	frames: StardewFrame[];
	fps: number;
	loop?: boolean;
	flip?: boolean;
};

export type StardewPersona = {
	identity: string;
	temperament: string;
	rantStyle: string;
};

export type StardewSpeciesDefinition = {
	id: string;
	label: string;
	sprite: StardewPetSpriteKey;
	frameSize?: number;
	scale: number;
	moveDist: number;
	animations: Record<string, StardewAnimation | StardewAnimation[]>;
	persona: StardewPersona;
	/** 在精灵图中的变体偏移量（以 frame 为单位） */
	variantOffset?: [number, number];
};

function A(frames: StardewFrame[], fps: number, options: { loop?: boolean; flip?: boolean } = {}): StardewAnimation {
	return { frames, fps, ...options };
}

function createVariantSpecies(
	base: StardewSpeciesDefinition,
	index: number,
	label: string,
	offset: [number, number]
): StardewSpeciesDefinition {
	return {
		...base,
		id: `${base.id}/${index}`,
		label: `${base.label} ${label}`,
		variantOffset: offset,
	};
}

// ===== 基础动画定义 =====

const catAnimations: StardewSpeciesDefinition["animations"] = {
	idle: A([[0, 4], [1, 4], [2, 4]], 5, { loop: false }),
	moveDown: A([[0, 0], [1, 0], [2, 0], [3, 0]], 5),
	moveRight: A([[0, 1], [1, 1], [2, 1], [3, 1]], 5),
	moveUp: A([[0, 2], [1, 2], [2, 2], [3, 2]], 5),
	moveLeft: A([[0, 3], [1, 3], [2, 3], [3, 3]], 5),
	special: A([[0, 5], [1, 5], [2, 5], [3, 5], [0, 5], [2, 4]], 5, { loop: false }),
	sleep: A([[0, 7], [1, 7]], 1),
};

const chickenAnimations: StardewSpeciesDefinition["animations"] = {
	idle: A([[0, 0]], 5, { loop: false }),
	moveDown: A([[0, 0], [1, 0], [2, 0], [3, 0]], 5),
	moveRight: A([[0, 1], [1, 1], [2, 1], [3, 1]], 5),
	moveUp: A([[0, 2], [1, 2], [2, 2], [3, 2]], 5),
	moveLeft: A([[0, 3], [1, 3], [2, 3], [3, 3]], 5),
	special: A([[0, 6], [1, 6], [2, 6], [1, 6], [2, 6], [1, 6], [0, 6], [0, 0]], 5, { loop: false }),
	sleep: A([[0, 4], [1, 4]], 1, { loop: false }),
};

const dogAnimations: StardewSpeciesDefinition["animations"] = {
	idle: A([[0, 5], [1, 5], [2, 5], [3, 5]], 5, { loop: false }),
	moveDown: A([[0, 0], [1, 0], [2, 0], [3, 0]], 5),
	moveRight: A([[0, 1], [1, 1], [2, 1], [3, 1]], 5),
	moveUp: A([[0, 2], [1, 2], [2, 2], [3, 2]], 5),
	moveLeft: A([[0, 3], [1, 3], [2, 3], [3, 3]], 5),
	special: A([[1, 6], [0, 6], [2, 6], [3, 5]], 5, { loop: false }),
	sleep: A([[0, 7], [1, 7]], 1),
};

const parrotAnimations: StardewSpeciesDefinition["animations"] = {
	idle: A([[0, 0]], 5, { loop: false }),
	moveUp: A([[8, 0], [9, 0], [10, 0]], 5),
	moveRight: A([[2, 0], [3, 0], [4, 0]], 5, { flip: true }),
	moveDown: A([[5, 0], [6, 0], [7, 0]], 5),
	moveLeft: A([[2, 0], [3, 0], [4, 0]], 5),
	special: A([[0, 0], [1, 0], [0, 0], [1, 0], [0, 0]], 5, { loop: false }),
};

const junimoAnimations: StardewSpeciesDefinition["animations"] = {
	idle: A([[0, 0]], 5, { loop: false }),
	moveDown: A([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0]], 8),
	moveRight: A([[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2]], 8),
	moveLeft: A([[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2]], 8, { flip: true }),
	moveUp: A([[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4]], 8),
	special: [A([[4, 3], [5, 3], [6, 3], [7, 3]], 10), A([[4, 5], [5, 5], [6, 5], [7, 5]], 10)],
	sleep: A([[4, 1], [5, 1], [6, 1], [7, 1]], 1),
};

// ===== 变体生成 =====

// Cat: 6种，横向排列，frameSize=32，单个体 4列×8行
const catBase: StardewSpeciesDefinition = {
	id: "stardew/cat",
	label: "Cat",
	sprite: "cat",
	frameSize: 32,
	scale: 1,
	moveDist: 26,
	animations: catAnimations,
	persona: {
		identity: "夜巡农场的监工",
		temperament: "挑剔、机灵、很会盯着页面细节",
		rantStyle: "喜欢吐槽布局、拖延和一切看起来不够整齐的东西",
	},
};
const catVariants = [
	catBase,
	createVariantSpecies(catBase, 1, "Black", [4, 0]),
	createVariantSpecies(catBase, 2, "Gray", [8, 0]),
	createVariantSpecies(catBase, 3, "Orange", [12, 0]),
	createVariantSpecies(catBase, 4, "White", [16, 0]),
	createVariantSpecies(catBase, 5, "Siamese", [20, 0]),
];

// Chicken: 8种，横向排列，frameSize=16，单个体 4列×7行
const chickenBase: StardewSpeciesDefinition = {
	id: "stardew/chicken",
	label: "Chicken",
	sprite: "chicken",
	scale: 1,
	moveDist: 18,
	animations: chickenAnimations,
	persona: {
		identity: "早起的鸡群播报员",
		temperament: "直白、敏感、对迟到很有意见",
		rantStyle: "更爱提醒节奏、效率和有没有按时完成",
	},
};
const chickenVariants = [
	chickenBase,
	createVariantSpecies(chickenBase, 1, "Brown", [4, 0]),
	createVariantSpecies(chickenBase, 2, "Blue", [8, 0]),
	createVariantSpecies(chickenBase, 3, "White", [12, 0]),
	createVariantSpecies(chickenBase, 4, "Void", [16, 0]),
	createVariantSpecies(chickenBase, 5, "Golden", [20, 0]),
	createVariantSpecies(chickenBase, 6, "Duck", [24, 0]),
	createVariantSpecies(chickenBase, 7, "Rabbit", [28, 0]),
];

// Dog: 6种，横向排列，frameSize=32，单个体 4列×9行
const dogBase: StardewSpeciesDefinition = {
	id: "stardew/dog",
	label: "Dog",
	sprite: "dog",
	frameSize: 32,
	scale: 1,
	moveDist: 28,
	animations: dogAnimations,
	persona: {
		identity: "忠诚的门口看守",
		temperament: "热情、护短、爱凑热闹",
		rantStyle: "吐槽会更像朋友式提醒，带一点护主味道",
	},
};
const dogVariants = [
	dogBase,
	createVariantSpecies(dogBase, 1, "Shepherd", [4, 0]),
	createVariantSpecies(dogBase, 2, "Dark", [8, 0]),
	createVariantSpecies(dogBase, 3, "Husky", [12, 0]),
	createVariantSpecies(dogBase, 4, "Golden", [16, 0]),
	createVariantSpecies(dogBase, 5, "Spotty", [20, 0]),
];

// Parrot: 5种，竖向排列，frameSize=24，单个体 11列×1行
const parrotBase: StardewSpeciesDefinition = {
	id: "stardew/parrot",
	label: "Parrot",
	sprite: "parrot",
	frameSize: 24,
	scale: 1,
	moveDist: 22,
	animations: parrotAnimations,
	persona: {
		identity: "爱学舌的树梢传声筒",
		temperament: "活泼、嘴快、很会重复别人的话",
		rantStyle: "吐槽像学舌一样，带一点模仿和回声感",
	},
};
const parrotVariants = [
	parrotBase,
	createVariantSpecies(parrotBase, 1, "Red", [0, 1]),
	createVariantSpecies(parrotBase, 2, "Blue", [0, 2]),
	createVariantSpecies(parrotBase, 3, "Green", [0, 3]),
	createVariantSpecies(parrotBase, 4, "Purple", [0, 4]),
];

// Junimo: 11种有效（4×3排列，最后一格透明），frameSize=16，单个体 8列×6行
const junimoBase: StardewSpeciesDefinition = {
	id: "stardew/junimo",
	label: "Junimo",
	sprite: "junimo",
	frameSize: 16,
	scale: 1,
	moveDist: 20,
	animations: junimoAnimations,
	persona: {
		identity: "安静的森林小帮手",
		temperament: "温和、神秘、总像在观察什么",
		rantStyle: "更像低声提醒和旁白，不会太吵闹",
	},
};
const junimoVariants = [
	junimoBase,
	createVariantSpecies(junimoBase, 1, "Red", [8, 0]),
	createVariantSpecies(junimoBase, 2, "Purple", [16, 0]),
	createVariantSpecies(junimoBase, 3, "Yellow", [24, 0]),
	createVariantSpecies(junimoBase, 4, "Blue", [0, 6]),
	createVariantSpecies(junimoBase, 5, "White", [8, 6]),
	createVariantSpecies(junimoBase, 6, "Black", [16, 6]),
	createVariantSpecies(junimoBase, 7, "Pink", [24, 6]),
	createVariantSpecies(junimoBase, 8, "Orange", [0, 12]),
	createVariantSpecies(junimoBase, 9, "Teal", [8, 12]),
	createVariantSpecies(junimoBase, 10, "Gray", [16, 12]),
	// 第12个 [24, 12] 全透明，跳过
];

const speciesList: StardewSpeciesDefinition[] = [
	...catVariants,
	...chickenVariants,
	{
		id: "stardew/cow",
		label: "Cow",
		sprite: "cow",
		scale: 1,
		moveDist: 16,
		animations: {
			idle: A([[0, 0]], 5, { loop: false }),
			moveDown: A([[0, 0], [1, 0], [2, 0], [3, 0]], 5),
			moveRight: A([[0, 1], [1, 1], [2, 1], [3, 1]], 5),
			moveLeft: A([[0, 1], [1, 1], [2, 1], [3, 1]], 5, { flip: true }),
			moveUp: A([[0, 2], [1, 2], [2, 2], [3, 2]], 5),
			special: A([[0, 4], [1, 4], [3, 4], [2, 4], [3, 4], [1, 4], [0, 4]], 5, { loop: false }),
			sleep: A([[0, 3], [1, 3]], 4),
		},
		persona: {
			identity: "温吞的谷仓顾问",
			temperament: "稳重、慢半拍、但很有耐心",
			rantStyle: "说话会偏向安慰和提醒，不会太尖锐",
		},
	},
	...dogVariants,
	{
		id: "stardew/duck",
		label: "Duck",
		sprite: "duck",
		frameSize: 16,
		scale: 1,
		moveDist: 20,
		animations: {
			idle: A([[0, 0]], 5, { loop: false }),
			moveDown: A([[0, 0], [1, 0], [2, 0], [3, 0]], 5),
			moveRight: A([[0, 1], [1, 1], [2, 1], [3, 1]], 5),
			moveUp: A([[0, 2], [1, 2], [2, 2], [3, 2]], 5),
			moveLeft: A([[0, 3], [1, 3], [2, 3], [3, 3]], 5),
			special: A([[0, 6], [1, 6], [2, 6], [3, 6], [2, 6], [3, 6], [2, 6], [1, 6], [0, 6]], 5, { loop: false }),
			sleep: A([[0, 7], [1, 7]], 1),
		},
		persona: {
			identity: "爱湿脚的小观察员",
			temperament: "轻快、碎嘴、反应很快",
			rantStyle: "会用更跳跃的语气挑页面毛病",
		},
	},
	{
		id: "stardew/rabbit",
		label: "Rabbit",
		sprite: "rabbit",
		scale: 1,
		moveDist: 30,
		animations: {
			idle: A([[0, 0]], 5, { loop: false }),
			moveDown: A([[0, 0], [1, 0], [2, 0], [3, 0]], 5),
			moveRight: A([[0, 1], [1, 1], [2, 1], [3, 1]], 5),
			moveUp: A([[0, 2], [1, 2], [2, 2], [3, 2]], 5),
			moveLeft: A([[0, 3], [1, 3], [2, 3], [3, 3]], 5),
			special: A([[0, 6], [1, 6], [2, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 0]], 5, { loop: false }),
			sleep: A([[0, 4], [1, 4]], 4, { loop: false }),
		},
		persona: {
			identity: "谨慎的田埂信使",
			temperament: "胆小、敏锐、反应特别快",
			rantStyle: "吐槽会显得更轻、更短、更带警觉感",
		},
	},
	{
		id: "stardew/dino",
		label: "Dinosaur",
		sprite: "dino",
		scale: 1,
		moveDist: 24,
		animations: {
			idle: A([[0, 0]], 5, { loop: false }),
			moveDown: A([[0, 0], [1, 0], [2, 0], [3, 0]], 5),
			moveRight: A([[0, 1], [1, 1], [2, 1], [3, 1]], 5),
			moveUp: A([[0, 2], [1, 2], [2, 2], [3, 2]], 5),
			moveLeft: A([[0, 3], [1, 3], [2, 3], [3, 3]], 5),
			special: A([[0, 6], [1, 6], [2, 6], [3, 6], [0, 6], [0, 0]], 5, { loop: false }),
			sleep: A([[0, 4], [1, 4]], 4),
		},
		persona: {
			identity: "脾气古怪的远古居民",
			temperament: "有点傲气、喜欢出其不意",
			rantStyle: "适合说带点夸张和戏剧感的吐槽",
		},
	},
	...parrotVariants,
	...junimoVariants,
	{
		id: "stardew/raccoon",
		label: "Raccoon",
		sprite: "raccoon",
		frameSize: 32,
		scale: 1,
		moveDist: 24,
		animations: {
			idle: A([[0, 0]], 5, { loop: false }),
			moveDown: A([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0]], 5),
			moveLeft: A([[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1]], 5),
			moveUp: A([[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2]], 5),
			moveRight: A([[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3]], 5),
			special: A([[8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2], [15, 2]], 5, { loop: true }),
		},
		persona: {
			identity: "夜里的翻找专家",
			temperament: "机灵、警惕、很会试探边界",
			rantStyle: "吐槽里会有点狡黠，像在悄悄拆台",
		},
	},
	{
		id: "stardew/turtle",
		label: "Turtle",
		sprite: "turtle",
		frameSize: 32,
		scale: 1,
		moveDist: 12,
		animations: {
			idle: A([[0, 4]], 5, { loop: false }),
			moveDown: A([[0, 0], [1, 0], [2, 0], [3, 0]], 2),
			moveRight: A([[0, 1], [1, 1], [2, 1], [3, 1]], 2),
			moveUp: A([[0, 2], [1, 2], [2, 2], [3, 2]], 2),
			moveLeft: A([[0, 3], [1, 3], [2, 3], [3, 3]], 2),
			special: A([[0, 6], [1, 6], [2, 6], [3, 6]], 5),
			sleep: A([[0, 4], [1, 4], [2, 4], [3, 4], [0, 5]], 5, { loop: false }),
		},
		persona: {
			identity: "慢吞吞的看门老朋友",
			temperament: "耐心、沉稳、很少大声说话",
			rantStyle: "吐槽会更慢、更稳，像老成的劝告",
		},
	},
];

const speciesById = new Map(speciesList.map((species) => [species.id, species]));

export const STARDEW_SPECIES_OPTIONS: SelectorOption[] = speciesList.map((species) => ({
	value: species.id,
	label: species.label,
	requiresName: true,
}));

export function getStardewSpeciesDefinition(type: string): StardewSpeciesDefinition | undefined {
	return speciesById.get(type);
}

export function isStardewSpecies(type: string): boolean {
	return speciesById.has(type);
}

export function getStardewSpeciesPersona(type: string) {
	return speciesById.get(type)?.persona;
}

export function getStardewSpeciesSprite(type: string): string {
	const species = speciesById.get(type);
	if (!species) {
		throw new Error(`Unknown Stardew species: ${type}`);
	}
	return getStardewPetAsset(species.sprite);
}