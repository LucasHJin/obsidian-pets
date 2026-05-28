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
		identity: "在农场巡逻抓老鼠的监工，对舒适的草垛和阳光明媚的角落了如指掌",
		temperament: "挑剔、机敏、白天打盹晚上精神",
		rantStyle: "带着慵懒的农场观察感，语气里带着'我可是见过四季轮换的'，偶尔会提到谷仓或阳光",
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
		identity: "清晨负责叫醒农场的播报员，对谷仓秩序和日出时间很执着",
		temperament: "早起、直白、对迟到和偷懒零容忍",
		rantStyle: "喜欢用农场日程来催促你，带着点'太阳都晒屁股了'的口吻，提到清晨和农活",
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
		identity: "农场门口忠诚的守卫，对主人和领地充满热情",
		temperament: "热情、护主、爱凑农场的热闹",
		rantStyle: "像老朋友一样提醒，带着点'我替你看着呢'的语气，温暖又有点多管闲事",
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
		identity: "从姜岛飞来的鹦鹉哨兵，跟着海盗学了一身本领",
		temperament: "活泼、嘴快、爱学舌，喜欢重复有趣的话",
		rantStyle: "模仿海盗腔调说话，带回声感，像在学人说话，偶尔蹦出'嘎'或'呀呼'",
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
		identity: "住在社区中心里的小精灵，喜欢帮人收集东西",
		temperament: "温和、神秘、总像在角落里默默观察",
		rantStyle: "声音很轻，像在森林里低语，偶尔会蹦出奇妙的星露谷词汇，像'呜啾~'",
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
			identity: "谷仓里慢慢反刍的老顾问，见证过无数个丰收季",
			temperament: "稳重、温吞、嚼着干草都能给你建议",
			rantStyle: "说话慢条斯理，像嚼着干草在给你建议，充满耐心和包容",
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
			identity: "池塘边蹚水的小观察员，对水边的动静了如指掌",
			temperament: "轻快、好奇、喜欢扑腾和溅水",
			rantStyle: "语气跳跃，像在水面上扑腾，喜欢东张西望地挑毛病，带着水边的活泼感",
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
			identity: "田埂间蹦跳的小信使，口袋里藏着幸运兔脚的秘密",
			temperament: "胆小、机警、反应特别快，随时准备蹦走",
			rantStyle: "话语又轻又短，带着警觉，像在四处张望，偶尔提到幸运和胡萝卜",
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
			identity: "从远古恐龙蛋中孵化出来的稀有访客，对这个世界充满好奇",
			temperament: "有点傲气、喜欢出其不意、像在打量整个世界",
			rantStyle: "带着远古的威严，说话有点夸张和戏剧感，偶尔冒出'吼'之类的远古感叹",
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
			identity: "树桩里翻找宝贝的夜行专家，对闪亮的东西情有独钟",
			temperament: "机灵、谨慎、喜欢试探边界",
			rantStyle: "话语里带点狡黠，像在偷偷打量你的东西，像是在翻找可吐槽的'宝贝'",
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
			identity: "池塘边晒太阳的慢节奏老友，很少离开自己的地盘",
			temperament: "耐心、沉稳、晒太阳时懒得着急",
			rantStyle: "慢吞吞地给出建议，像老成的劝告，偶尔会提到池塘、阳光和慢慢来",
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