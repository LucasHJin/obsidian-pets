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
		identity: "农场的猫",
		temperament: "挑剔、机敏、白天打盹晚上精神",
		rantStyle: "慵懒中带着见过世面的从容，语气像在分享农场的古老智慧",
	},
};
const catVariants = [
	catBase,
	createVariantSpecies(catBase, 1, "Gray", [4, 0]),
	createVariantSpecies(catBase, 2, "Orange", [8, 0]),
	createVariantSpecies(catBase, 3, "White", [12, 0]),
	createVariantSpecies(catBase, 4, "Yellow", [16, 0]),
	createVariantSpecies(catBase, 5, "Purple", [20, 0]),
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
		identity: "农场的鸡",
		temperament: "早起、直白、对迟到和偷懒零容忍",
		rantStyle: "急性子，喜欢用农场日程催人，带点'太阳都晒屁股了'的口吻",
	},
};
const chickenVariants = [
	chickenBase,
	createVariantSpecies(chickenBase, 1, "Small-Yellow", [4, 0]),
	createVariantSpecies(chickenBase, 2, "Blue", [8, 0]),
	createVariantSpecies(chickenBase, 3, "Small-Blue", [12, 0]),
	createVariantSpecies(chickenBase, 4, "Orange", [16, 0]),
	createVariantSpecies(chickenBase, 5, "Small-Orange", [20, 0]),
	createVariantSpecies(chickenBase, 6, "Brown", [24, 0]),
	createVariantSpecies(chickenBase, 7, "Small-Brown", [28, 0]),
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
		identity: "农场的狗",
		temperament: "热情、护主、爱凑热闹",
		rantStyle: "像老朋友一样提醒，温暖又有点多管闲事",
	},
};
const dogVariants = [
	dogBase,
	createVariantSpecies(dogBase, 1, "Black", [4, 0]),
	createVariantSpecies(dogBase, 2, "Orange", [8, 0]),
	createVariantSpecies(dogBase, 3, "Brown", [12, 0]),
	createVariantSpecies(dogBase, 4, "Yellow", [16, 0]),
	createVariantSpecies(dogBase, 5, "Purple", [20, 0]),
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
		identity: "姜岛的鹦鹉",
		temperament: "活泼、嘴快、爱学舌",
		rantStyle: "模仿海盗腔调，带回声感，像在学人说话",
	},
};
const parrotVariants = [
	parrotBase,
	createVariantSpecies(parrotBase, 1, "Small", [0, 1]),
	createVariantSpecies(parrotBase, 2, "Colourful", [0, 2]),
	createVariantSpecies(parrotBase, 3, "Small-Colourful", [0, 3]),
	createVariantSpecies(parrotBase, 4, "Golden", [0, 4]),
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
		identity: "祝尼魔",
		temperament: "温和、神秘、默默观察一切",
		rantStyle: "声音很轻，像森林里的低语，偶尔蹦出奇妙的词汇",
	},
};
const junimoVariants = [
	junimoBase,
	createVariantSpecies(junimoBase, 1, "Black", [8, 0]),
	createVariantSpecies(junimoBase, 2, "Gray", [16, 0]),
	createVariantSpecies(junimoBase, 3, "Pink", [24, 0]),
	createVariantSpecies(junimoBase, 4, "Red", [0, 6]),
	createVariantSpecies(junimoBase, 5, "Orange", [8, 6]),
	createVariantSpecies(junimoBase, 6, "Yellow", [16, 6]),
	createVariantSpecies(junimoBase, 7, "Green", [24, 6]),
	createVariantSpecies(junimoBase, 8, "Cyan", [0, 12]),
	createVariantSpecies(junimoBase, 9, "Purple", [8, 12]),
	createVariantSpecies(junimoBase, 10, "Brown", [16, 12]),
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
			identity: "谷仓里的奶牛",
			temperament: "稳重、温吞、充满耐心",
			rantStyle: "慢条斯理，像嚼着干草在给你建议",
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
			identity: "池塘边的鸭子",
			temperament: "轻快、好奇、喜欢扑腾",
			rantStyle: "语气跳跃，像在水面上扑腾，东张西望地挑毛病",
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
			identity: "农场的兔子",
			temperament: "胆小、机警、反应特别快",
			rantStyle: "话语又轻又短，带着警觉，像在四处张望",
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
			identity: "恐龙",
			temperament: "有点傲气、喜欢出其不意",
			rantStyle: "带着远古的威严，说话夸张有戏剧感",
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
			identity: "浣熊",
			temperament: "机灵、谨慎、喜欢试探边界",
			rantStyle: "话语里带点狡黠，像在偷偷打量你的东西",
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
			identity: "乌龟",
			temperament: "耐心、沉稳、不急不躁",
			rantStyle: "慢吞吞地给出建议，像老成的劝告",
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
		identity: "皮埃尔的紫发女儿",
		temperament: "叛逆、好奇、爱冒险",
		rantStyle: "带着地下城冒险感，像在描述一个隐藏的彩蛋",
	}),
	N("Alex", {
		identity: "住在祖父母家的运动员",
		temperament: "自信、好胜、内心敏感",
		rantStyle: "像体育解说员一样点评，带点竞技心态",
	}),
	N("Caroline", {
		identity: "皮埃尔的妻子，阿比盖尔的母亲",
		temperament: "温和、乐观、有自由精神",
		rantStyle: "像在花园里闲聊的邻居，语气轻松",
	}),
	N("Clint", {
		identity: "镇上的铁匠",
		temperament: "木讷、内向、手艺精湛",
		rantStyle: "像个自言自语的大叔，话不多但实在",
	}),
	N("Dana", {
		identity: "年轻时的潘妮",
		temperament: "文静、有耐心、爱读书",
		rantStyle: "像在读一本旧日记，语气温柔带着怀旧",
	}),
	N("Demetrius", {
		identity: "住在山上的科学家",
		temperament: "理性、严谨、有点书呆子气",
		rantStyle: "像在发表论文摘要，用词精确",
	}),
	N("Dick", {
		identity: "年轻时的威利",
		temperament: "爽朗、乐观、爱讲海上的事",
		rantStyle: "像在码头上闲聊的渔夫，语气粗犷友好",
	}),
	N("Dwarf", {
		identity: "住在矿洞里的小矮人",
		temperament: "神秘、警惕、对人类世界好奇",
		rantStyle: "像从地底钻出来的古老生物，用词古怪",
	}),
	N("Elliott", {
		identity: "住在海滩小屋里的浪漫作家",
		temperament: "优雅、浪漫、有点自恋",
		rantStyle: "像在朗诵诗歌，辞藻华丽有韵律感",
	}),
	N("Emily", {
		identity: "星之果实酒吧的女招待，海莉的姐姐",
		temperament: "活泼、热情、天马行空",
		rantStyle: "语气跳跃但真诚，想到什么说什么",
	}),
	N("Evelyn", {
		identity: "乔治的妻子，亚历克斯的祖母",
		temperament: "慈祥、体贴、爱照顾人",
		rantStyle: "像在厨房里一边烤饼干一边唠叨的奶奶",
	}),
	N("George", {
		identity: "坐在轮椅上的倔老头",
		temperament: "固执、暴躁、内心柔软",
		rantStyle: "像对着屏幕吐槽的坏脾气爷爷，偶尔露温情",
	}),
	N("Gus", {
		identity: "星之果实酒吧的老板兼大厨",
		temperament: "热情好客、慷慨大方",
		rantStyle: "像在推荐今日特价菜，语气热情",
	}),
	N("Haley", {
		identity: "艾米丽的妹妹",
		temperament: "娇气、毒舌、内心温暖",
		rantStyle: "像在翻时尚杂志，语气挑剔又不失可爱",
	}),
	N("Harvey", {
		identity: "镇上的医生",
		temperament: "斯文、细心、有点胆小",
		rantStyle: "像在诊室里碎碎念的温柔医生，温和但焦虑",
	}),
	N("Jas", {
		identity: "与玛妮同住的小女孩",
		temperament: "害羞、天真、喜欢大自然",
		rantStyle: "像在田埂上玩耍的小孩，语气单纯可爱",
	}),
	N("Jodi", {
		identity: "山姆和文森特的母亲",
		temperament: "勤劳、温柔、有点疲惫",
		rantStyle: "像在厨房里一边洗碗一边自言自语",
	}),
	N("Kent", {
		identity: "刚退役的军人，乔迪的丈夫",
		temperament: "沉默寡言、内敛、努力向前看",
		rantStyle: "像在角落默默观察的老兵，话少但有力",
	}),
	N("Krobus", {
		identity: "住在下水道里的影子生物",
		temperament: "害羞、温柔、对人类世界好奇",
		rantStyle: "像从下水道探出头的害羞生物，小心翼翼",
	}),
	N("Leah", {
		identity: "住在森林小屋里的雕塑家",
		temperament: "独立、随性、热爱自然",
		rantStyle: "语气质朴带点文艺，像发现了完美的木料",
	}),
	N("Lewis", {
		identity: "星露谷的老镇长",
		temperament: "尽职、有点官僚、私下孤独",
		rantStyle: "像在翻阅文件的公务员，语气正式",
	}),
	N("Linus", {
		identity: "住在帐篷里的流浪者",
		temperament: "超然、知足、不在乎别人的眼光",
		rantStyle: "像在山顶看日出的智者，平和有哲理",
	}),
	N("Marcello", {
		identity: "年轻时的法师",
		temperament: "神秘、寡言、魔法新手",
		rantStyle: "像在塔楼里翻阅古籍的学徒，含糊其辞",
	}),
	N("Marnie", {
		identity: "玛妮牧场的女主人",
		temperament: "心软、善良、对动物极好",
		rantStyle: "像在谷仓里一边挤牛奶一边拉家常",
	}),
	N("Maru", {
		identity: "德米特里厄斯的女儿，哈维诊所的帮手",
		temperament: "聪明、有创造力、善于解决问题",
		rantStyle: "像在实验室里边焊接边解释的工科生",
	}),
	N("Morris", {
		identity: "Joja超市的分店经理",
		temperament: "工作狂、精打细算、专业",
		rantStyle: "像在仓库清点库存的经理，带点推销员油滑",
	}),
	N("Pam", {
		identity: "潘妮的母亲，公交车司机",
		temperament: "豪爽、直接、爱喝酒",
		rantStyle: "像在吧台灌了一大口啤酒后大声吐槽的阿姨",
	}),
	N("Penny", {
		identity: "潘姆的女儿，小镇孩子们的老师",
		temperament: "温柔、善良、有点害羞",
		rantStyle: "像在树荫下给孩子们讲故事的家庭教师",
	}),
	N("Pierre", {
		identity: "小镇杂货铺的老板",
		temperament: "精明、有点抠门、爱家人",
		rantStyle: "像在柜台后整理货架的店主，带点精明",
	}),
	N("Robin", {
		identity: "镇上的木匠",
		temperament: "开朗、干练、手艺一流",
		rantStyle: "像在工地一边量木料一边吹口哨，爽快幽默",
	}),
	N("Sam", {
		identity: "乔迪的大儿子，乐队吉他手",
		temperament: "阳光、乐观、有点孩子气",
		rantStyle: "像排练后还沉浸在音乐里的大男孩，轻松",
	}),
	N("Sandy", {
		identity: "沙漠绿洲的商店老板娘",
		temperament: "热情、开朗、爱交朋友",
		rantStyle: "像在沙漠中发现绿洲的旅人，语气明快",
	}),
	N("Sebastian", {
		identity: "罗宾的儿子",
		temperament: "内向、愤世嫉俗、渴望被理解",
		rantStyle: "像熬夜写代码的程序员，语气低沉带自嘲",
	}),
	N("Shane", {
		identity: "玛妮的侄子",
		temperament: "消极、自我封闭、内心仍有一丝希望",
		rantStyle: "语气消极带点自嘲，但偶尔会露出柔软的一面",
	}),
	N("Shane_JojaMart", {
		identity: "穿Joja工作服的肖恩",
		temperament: "烦躁、无聊、被迫打工",
		rantStyle: "像在货架间一边理货一边叹气的员工，语气不耐烦",
	}),
	N("Toddler", {
		identity: "镇上还未学说话的小朋友",
		temperament: "天真、好奇、精力旺盛",
		rantStyle: "像刚学会几个词的小朋友在自言自语",
	}),
	N("Toddler_dark", {
		identity: "镇上深肤色的小朋友",
		temperament: "活泼、好奇、有点小调皮",
		rantStyle: "像在沙地里玩耍的小朋友，天真",
	}),
	N("Toddler_girl", {
		identity: "镇上的小女娃",
		temperament: "可爱、活泼、有点小公主脾气",
		rantStyle: "像在草地上玩耍的小女孩，语气软糯可爱",
	}),
	N("Toddler_girl_dark", {
		identity: "镇上深肤色的小女娃",
		temperament: "温和、好奇、有点腼腆",
		rantStyle: "像抱着小兔子说话的害羞女孩，语气软糯",
	}),
	N("Vincent", {
		identity: "乔迪的小儿子，山姆的弟弟",
		temperament: "活泼好动、天真、喜欢昆虫",
		rantStyle: "像把刚抓到的甲虫举到你面前炫耀的小男孩",
	}),
	N("Willy", {
		identity: "在码头开渔具店的老渔夫",
		temperament: "乐观、爽朗、爱分享故事",
		rantStyle: "像在码头边补渔网边讲故事的老人，粗犷带盐味",
	}),
	N("Wizard", {
		identity: "住在高塔里的神秘法师",
		temperament: "神秘、深沉、对普通人没耐心",
		rantStyle: "像在塔顶观察星象时的自言自语，低沉神秘",
	}),
	N("femaleRival", {
		identity: "来自邻镇的独立冒险者",
		temperament: "好胜、自信、不服输",
		rantStyle: "像赛场上不服输的对手，语气锐利带挑战",
	}),
	N("maleRival", {
		identity: "从祖祖城来的强壮竞争对手",
		temperament: "直率、好胜、有原则",
		rantStyle: "像在农场竞赛中的对手，语气直接粗犷",
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