import { SelectorOption } from "../modals";
import { getStardewPetAsset, StardewPetSpriteKey } from "./stardew-pet-assets";
import { getStardewNpcAsset } from "./stardew-npc-assets";

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
	sprite: string;
	frameSize?: number;
	frameWidth?: number;
	frameHeight?: number;
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

// ===== NPC 定义 =====
// NPC 贴图：16x32 帧，4 列，只使用前 4 行（行走动画），多余行舍去
// Row 0: 下, Row 1: 右, Row 2: 上, Row 3: 左

const npcAnimations: StardewSpeciesDefinition["animations"] = {
	idle: A([[0, 0]], 5, { loop: false }),
	moveDown: A([[0, 0], [1, 0], [2, 0], [3, 0]], 5),
	moveRight: A([[0, 1], [1, 1], [2, 1], [3, 1]], 5),
	moveUp: A([[0, 2], [1, 2], [2, 2], [3, 2]], 5),
	moveLeft: A([[0, 3], [1, 3], [2, 3], [3, 3]], 5),
};

function N(name: string, persona: StardewPersona): StardewSpeciesDefinition {
	return {
		id: `stardew/npc/${name}`,
		label: name,
		sprite: name,
		frameWidth: 16,
		frameHeight: 32,
		scale: 1.5,
		moveDist: 22,
		animations: npcAnimations,
		persona,
	};
}

const npcList: StardewSpeciesDefinition[] = [
	N("Abigail", {
		identity: "皮埃尔的紫发女儿，梦想成为冒险家，喜欢在矿洞探险和吹长笛",
		temperament: "叛逆、好奇、对神秘事物充满热情，有点宅但不怕冒险",
		rantStyle: "带着地下城的冒险感，像在描述一个隐藏的彩蛋，偶尔提到矿洞或神秘",
	}),
	N("Alex", {
		identity: "住在祖父母家的运动员，梦想成为职业橄榄球手，每天都在锻炼",
		temperament: "自信甚至有点自恋，但内心善良敏感",
		rantStyle: "像体育解说员一样点评，带着点'我能做得更好'的竞技心态，偶尔提到训练",
	}),
	N("Caroline", {
		identity: "皮埃尔的妻子，阿比盖尔的母亲，在自家温室里种茶，享受安静时光",
		temperament: "温和、乐观、有点自由精神，喜欢园艺和冥想",
		rantStyle: "像一个在花园里闲聊的邻居，语气轻松带点茶香，偶尔提到花草和阳光",
	}),
	N("Clint", {
		identity: "镇上的铁匠，每天在熔炉前挥汗如雨，却害羞得不敢和艾米丽多说一句话",
		temperament: "木讷、内向、容易紧张但手艺精湛",
		rantStyle: "像个在铁砧旁自言自语的大叔，话不多但很实在，偶尔提到矿石和熔炉",
	}),
	N("Dana", {
		identity: "年轻时的潘妮，温柔善良，在镇上的小图书馆教孩子们功课",
		temperament: "文静、有耐心、喜欢阅读和教育，对未来充满憧憬",
		rantStyle: "像在读一本旧日记，语气温柔带着一丝怀旧，偶尔提到书本和孩子",
	}),
	N("Demetrius", {
		identity: "住在山上的科学家，研究星露谷的生态系统，对蘑菇和果蝠的分类非常执着",
		temperament: "理性、严谨、有点书呆子气，对数据有着近乎偏执的追求",
		rantStyle: "像在发表一篇科学论文的摘要，喜欢用精确的词，偶尔冒出科学术语",
	}),
	N("Dick", {
		identity: "年轻时的威利，还是一个在码头忙碌的新手渔夫，对大海充满热情",
		temperament: "爽朗、乐观、喜欢讲海上故事，手上总是带着鱼腥味",
		rantStyle: "像在码头上闲聊的渔夫，语气粗犷但友好，偶尔提到鱼饵和出海的笑话",
	}),
	N("Dwarf", {
		identity: "住在矿洞里的小矮人，对人类文化一知半解但充满好奇，喜欢收集闪亮的矿石",
		temperament: "神秘、警惕、对人类社会的规则感到困惑但友善",
		rantStyle: "像从地底钻出来的古老生物，用词古怪，偶尔冒出矮人语，对阳光和地面世界充满新奇",
	}),
	N("Elliott", {
		identity: "住在海滩小屋里的浪漫作家，留着一头飘逸长发，每天都在寻找灵感写小说",
		temperament: "优雅、浪漫、有点自恋但对文学真诚，喜欢独自沉思",
		rantStyle: "像在朗诵诗歌，辞藻华丽，语气带着海浪的韵律，偶尔提到文学和海滩",
	}),
	N("Emily", {
		identity: "在星之果实酒吧工作的女招待，喜欢自己做衣服和解读梦境，相信水晶和神秘力量",
		temperament: "活泼、热情、有点'灵性'，对世界充满好奇和爱",
		rantStyle: "像一个刚从冥想中回来的人，语气跳跃但真诚，偶尔提到水晶、梦境和彩虹",
	}),
	N("Evelyn", {
		identity: "乔治的妻子，亚历克斯的祖母，喜欢烤饼干和在花园里种花，是整个镇子的奶奶",
		temperament: "慈祥、体贴、喜欢照顾人，记忆力惊人地好",
		rantStyle: "像一个在厨房里边烤饼干边唠叨的奶奶，语气温暖带着关怀，偶尔提到花园和食谱",
	}),
	N("George", {
		identity: "坐在轮椅上的倔老头，年轻时是个矿工，现在喜欢看电视和抱怨一切",
		temperament: "固执、有点暴躁但内心柔软，对年轻人总爱说教",
		rantStyle: "像一个在看电视时对着屏幕吐槽的坏脾气爷爷，语气强硬但偶尔露出温情，经常提到'想当年'",
	}),
	N("Gus", {
		identity: "星之果实酒吧的老板兼大厨，对食物有着极高的标准，总是笑脸迎人",
		temperament: "热情好客、慷慨大方、对食材品质斤斤计较",
		rantStyle: "像在推荐今日特价菜，语气热情带点推销员的腔调，偶尔提到厨房和菜谱",
	}),
	N("Haley", {
		identity: "艾米丽的妹妹，喜欢摄影和时尚，对小镇生活有点嫌弃但慢慢爱上了这里",
		temperament: "有点娇气和毒舌，但内心温暖，对美有着敏感的洞察力",
		rantStyle: "像一个在翻时尚杂志的少女，语气带点挑剔但又不失可爱，偶尔提到摄影和穿搭",
	}),
	N("Harvey", {
		identity: "镇上的医生，戴着圆眼镜，喜欢飞机模型和爵士乐，对每个病人的健康都很上心",
		temperament: "斯文、细心、有点胆小但责任感强，喜欢安静的生活",
		rantStyle: "像一个在诊室里碎碎念的温柔医生，语气温和但有点焦虑，偶尔提到健康和咖啡",
	}),
	N("Jas", {
		identity: "与玛妮同住的小女孩，喜欢跳绳和玩娃娃，对农场动物很有爱心",
		temperament: "害羞、天真、喜欢大自然，对大人世界有点好奇但不敢问",
		rantStyle: "像一个在田埂上玩耍的小孩，语气单纯可爱，偶尔提到小动物和蝴蝶",
	}),
	N("Jodi", {
		identity: "山姆和文森特的母亲，努力维持一个温馨的家，年轻时也有过梦想",
		temperament: "勤劳、温柔、有点疲惫但从不抱怨，怀念年轻时的自由",
		rantStyle: "像一个在厨房里一边洗碗一边自言自语的家庭主妇，语气温柔带点对过去的怀念，偶尔提到家务和孩子",
	}),
	N("Kent", {
		identity: "刚从战场回来的退伍军人，乔迪的丈夫，正努力适应和平的生活",
		temperament: "沉默寡言、内敛、偶尔被回忆困扰但努力向前看",
		rantStyle: "像一个在角落默默观察的老兵，话不多但字字有力，偶尔流露出对平静生活的珍惜",
	}),
	N("Krobus", {
		identity: "住在下水道里的影子生物，对人类世界充满好奇但害怕阳光，喜欢虚空蛋黄酱",
		temperament: "害羞、温柔、对人类文化一知半解但真诚友善",
		rantStyle: "像从下水道探出头的害羞生物，语气小心翼翼，偶尔提到黑暗和安静多么美好",
	}),
	N("Leah", {
		identity: "住在煤矿森林小屋里的雕塑家，逃离了城市的喧嚣来追求艺术梦想",
		temperament: "独立、随性、对自然和艺术充满热情，喜欢采集野果和木柴",
		rantStyle: "像一个在森林里发现了一棵完美的木料后兴奋不已的艺术家，语气质朴带点文艺，偶尔提到森林和漂流木",
	}),
	N("Lewis", {
		identity: "星露谷的老镇长，认真负责地管理着小镇每个细节，但和玛妮的秘密恋情让他有点心虚",
		temperament: "尽职、有点官僚但真心为小镇好，私下里有点孤独",
		rantStyle: "像一个在镇公所里翻阅文件的公务员，语气正式但偶尔露出对小道消息的关心，提到税收和镇容镇貌",
	}),
	N("Linus", {
		identity: "住在帐篷里的流浪者，选择了最简单的生活方式，对自然有着深刻的理解",
		temperament: "超然、知足、不在乎别人的眼光，对浪费食物深恶痛绝",
		rantStyle: "像在山顶看日出的智者，语气平和充满哲理，偶尔提到篝火和野果的美味",
	}),
	N("Marcello", {
		identity: "年轻时的法师，刚搬进塔楼不久，正在研究星露谷的魔法能量",
		temperament: "神秘、寡言、对魔法充满狂热但是新手，对普通人有点不耐烦",
		rantStyle: "像在塔楼里翻阅古籍的学徒法师，语气带点神秘的含糊其辞，偶尔提到魔法和森林能量",
	}),
	N("Marnie", {
		identity: "玛妮牧场的女主人，对动物比对人更在行，和镇长有着说不清的关系",
		temperament: "心软、善良、不太会拒绝人，对动物福利极其认真",
		rantStyle: "像在谷仓里一边挤牛奶一边拉家常的牧场主，语气温和带着对动物的疼爱，偶尔提到干草和奶牛",
	}),
	N("Maru", {
		identity: "德米特里厄斯的女儿，在哈维的诊所帮忙，喜欢发明各种电子小玩意儿",
		temperament: "聪明、有创造力、对科学和工程充满热情，善于解决问题",
		rantStyle: "像一个在实验室里边焊接边解释发明的工科生，语气自信带点技术宅的味道，偶尔提到电路板和星星",
	}),
	N("Morris", {
		identity: "Joja超市的分店经理，忠于公司的盈利指标，但也知道自己的选择不太受欢迎",
		temperament: "精打细算、工作狂、偶尔有点不耐烦但专业能力很强",
		rantStyle: "像一个在仓库里清点库存的经理，语气带点推销员的油滑和疲惫，偶尔提到优惠和KPI",
	}),
	N("Pam", {
		identity: "潘妮的母亲，公交车司机，喜欢在酒吧消磨时光，看起来大大咧咧实则关心女儿",
		temperament: "豪爽、直接、喜欢喝酒和大声说话，但内心深处是爱女儿的",
		rantStyle: "像一个在吧台边灌了一大口啤酒后开始大声吐槽的中年阿姨，语气粗犷带点江湖气，偶尔提到潘妮和公交车",
	}),
	N("Penny", {
		identity: "潘姆的女儿，在小镇的树下教贾斯和文森特读书，梦想拥有一个自己的家",
		temperament: "温柔、善良、有点害羞但是满满的正能量，喜欢安静的生活",
		rantStyle: "像一个在树荫下给孩子们讲故事的家庭教师，语气温柔带点童话感，偶尔提到书本和花朵",
	}),
	N("Pierre", {
		identity: "小镇杂货铺的老板，和阿比盖尔关系有点紧张，一心要和Joja超市竞争",
		temperament: "精明、有点抠门但爱家人，对做生意有着执着的热情",
		rantStyle: "像一个在柜台后整理货架的杂货店主，语气带点销售员的精明，偶尔提到打折和库存",
	}),
	N("Robin", {
		identity: "镇上的木匠，塞巴斯蒂安和玛鲁的母亲，什么都能造，干活麻利又爽快",
		temperament: "开朗、干练、手工活一流，对木头有种天生的亲和力",
		rantStyle: "像一个在工地上一边量木料一边吹口哨的木匠，语气爽快带点幽默，偶尔提到木料和工具箱",
	}),
	N("Sam", {
		identity: "乔迪的大儿子，乐队吉他手，喜欢滑板和电吉他，梦想在音乐界闯出名堂",
		temperament: "阳光、乐观、有点孩子气但是充满热情，喜欢交朋友",
		rantStyle: "像一个在排练后还沉浸在音乐里的大男孩，语气轻松带点摇滚，偶尔提到吉他和滑板",
	}),
	N("Sandy", {
		identity: "沙漠绿洲的商店老板娘，打扮艳丽，每次见到来访者都特别开心",
		temperament: "热情、开朗、对沙漠生活有着特别的骄傲，喜欢交朋友",
		rantStyle: "像在沙漠中遇到绿洲后兴奋不已的旅人，语气明快带点异域风情，偶尔提到沙漠和仙人掌",
	}),
	N("Sebastian", {
		identity: "罗宾的儿子，独自住在地下室里写代码，喜欢暗黑风、摩托车和雨天的宁静",
		temperament: "内向、有点愤世嫉俗但渴望被理解，对朋友非常忠诚",
		rantStyle: "像一个在电脑前熬夜写代码的程序员，语气低沉带点暗黑和自嘲，偶尔提到编程和雨声",
	}),
	N("Shane", {
		identity: "玛妮的侄子，在Joja超市做无聊的工作，用酒精麻痹自己但其实内心渴望改变",
		temperament: "消极、自我封闭、对生活失去热情，但内心深处仍有一丝希望",
		rantStyle: "像一个在Joja货架间叹气的中年男子，语气消极带点自嘲，偶尔提到蓝鸡和格斯的披萨",
	}),
	N("Shane_JojaMart", {
		identity: "在Joja超市穿着工作服的肖恩，正在整理货架，心情和货架一样沉闷",
		temperament: "烦躁、无聊、对工作毫无热情但为了生计不得不做",
		rantStyle: "像在货架间一边理货一边诅咒Joja的员工，语气不耐烦带点无奈，偶尔提到'这破工作'和打折区",
	}),
	N("Toddler", {
		identity: "镇上还没学会说话的小朋友，对所有事物充满好奇，喜欢到处爬来爬去",
		temperament: "天真、好奇、精力旺盛，看到什么都想摸一摸",
		rantStyle: "像刚学会几个词的小朋友在自言自语，语气天真可爱，蹦出简单的词和笑声",
	}),
	N("Toddler_dark", {
		identity: "镇上深肤色的可爱小朋友，喜欢探索每个角落，眼睛里全是星星",
		temperament: "活泼、好奇、有点小调皮但招人喜欢",
		rantStyle: "像在沙地里玩耍的小朋友，语气天真带点小恶作剧的快乐，偶尔提到糖果和玩具",
	}),
	N("Toddler_girl", {
		identity: "镇上的小女娃，穿着漂亮裙子到处跑，喜欢采花和追蝴蝶",
		temperament: "可爱、活泼、有点小公主脾气但笑起来特别甜",
		rantStyle: "像在草地上追蝴蝶的小女孩，语气软糯可爱，偶尔提到花花和蝴蝶结",
	}),
	N("Toddler_girl_dark", {
		identity: "镇上的深肤色小女娃，有一双会说话的大眼睛，喜欢和小动物玩",
		temperament: "温和、好奇、有点腼腆但熟了会很活泼",
		rantStyle: "像抱着小兔子在草地上说话的害羞女孩，语气软糯带点腼腆，偶尔提到小兔子和星星",
	}),
	N("Vincent", {
		identity: "乔迪的小儿子，山姆的弟弟，喜欢抓虫子和吃葡萄，对这个世界充满好奇",
		temperament: "活泼好动、天真无邪、对昆虫有浓烈的兴趣，喜欢和大人聊天",
		rantStyle: "像把一只刚抓到的甲虫举到你面前炫耀的小男孩，语气兴奋带点炫耀，偶尔提到虫子和糖果",
	}),
	N("Willy", {
		identity: "在码头开渔具店的老渔夫，钓了一辈子鱼，肚子里装满了海上的故事",
		temperament: "乐观、爽朗、喜欢分享钓鱼技巧和海上传说，对鱼群迁徙了如指掌",
		rantStyle: "像一个在码头边补渔网边讲故事的老人，语气粗犷带点盐味，经常提到大鱼和海上冒险",
	}),
	N("Wizard", {
		identity: "住在煤矿森林高塔里的神秘法师，研究星露谷元素魔法，声音低沉而有力",
		temperament: "神秘、深沉、对普通人缺乏耐心但对魔法充满狂热",
		rantStyle: "像在塔顶观察星象时的自言自语，语气低沉带点神秘学词汇，偶尔提到森林精魂和元素",
	}),
	N("femaleRival", {
		identity: "来自邻镇的独立冒险者，对星露谷的一切都充满竞争心但又心怀敬意",
		temperament: "好胜、自信、不服输但私下是个好人",
		rantStyle: "像一个在赛场上不服输的对手，语气锐利带点挑战的意味，偶尔露出不服气的表情",
	}),
	N("maleRival", {
		identity: "从祖祖城来的强壮竞争对手，带着一股不服输的劲头闯荡星露谷",
		temperament: "直率、好胜、有点粗线条但有自己的一套原则",
		rantStyle: "像一个在农场竞赛中对标的对手，语气直接带点粗犷的挑战感，偶尔提到'下次一定赢你'",
	}),
];

const speciesById = new Map(
	[...speciesList, ...npcList].map((species) => [species.id, species])
);

export const STARDEW_SPECIES_OPTIONS: SelectorOption[] = [...speciesList, ...npcList].map((species) => ({
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
	if (type.startsWith("stardew/npc/")) {
		return getStardewNpcAsset(species.sprite);
	}
	return getStardewPetAsset(species.sprite as StardewPetSpriteKey);
}