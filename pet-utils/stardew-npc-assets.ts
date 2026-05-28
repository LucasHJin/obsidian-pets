import abigailSprite from "../assets/stardew/NPC/Abigail..png";
import alexSprite from "../assets/stardew/NPC/Alex..png";
import carolineSprite from "../assets/stardew/NPC/Caroline..png";
import clintSprite from "../assets/stardew/NPC/Clint..png";
import danaSprite from "../assets/stardew/NPC/Dana..png";
import demetriusSprite from "../assets/stardew/NPC/Demetrius..png";
import dickSprite from "../assets/stardew/NPC/Dick..png";
import dwarfSprite from "../assets/stardew/NPC/Dwarf..png";
import elliottSprite from "../assets/stardew/NPC/Elliott..png";
import emilySprite from "../assets/stardew/NPC/Emily..png";
import evelynSprite from "../assets/stardew/NPC/Evelyn..png";
import georgeSprite from "../assets/stardew/NPC/George..png";
import gusSprite from "../assets/stardew/NPC/Gus..png";
import haleySprite from "../assets/stardew/NPC/Haley..png";
import harveySprite from "../assets/stardew/NPC/Harvey..png";
import jasSprite from "../assets/stardew/NPC/Jas..png";
import jodiSprite from "../assets/stardew/NPC/Jodi..png";
import kentSprite from "../assets/stardew/NPC/Kent..png";
import krobusSprite from "../assets/stardew/NPC/Krobus..png";
import leahSprite from "../assets/stardew/NPC/Leah..png";
import lewisSprite from "../assets/stardew/NPC/Lewis..png";
import linusSprite from "../assets/stardew/NPC/Linus..png";
import marcelloSprite from "../assets/stardew/NPC/Marcello..png";
import marnieSprite from "../assets/stardew/NPC/Marnie..png";
import maruSprite from "../assets/stardew/NPC/Maru..png";
import morrisSprite from "../assets/stardew/NPC/Morris..png";
import pamSprite from "../assets/stardew/NPC/Pam..png";
import pennySprite from "../assets/stardew/NPC/Penny..png";
import pierreSprite from "../assets/stardew/NPC/Pierre..png";
import robinSprite from "../assets/stardew/NPC/Robin..png";
import samSprite from "../assets/stardew/NPC/Sam..png";
import sandySprite from "../assets/stardew/NPC/Sandy..png";
import sebastianSprite from "../assets/stardew/NPC/Sebastian..png";
import shaneSprite from "../assets/stardew/NPC/Shane..png";
import shaneJojaSprite from "../assets/stardew/NPC/Shane_JojaMart..png";
import toddlerSprite from "../assets/stardew/NPC/Toddler..png";
import toddlerDarkSprite from "../assets/stardew/NPC/Toddler_dark..png";
import toddlerGirlSprite from "../assets/stardew/NPC/Toddler_girl..png";
import toddlerGirlDarkSprite from "../assets/stardew/NPC/Toddler_girl_dark..png";
import vincentSprite from "../assets/stardew/NPC/Vincent..png";
import willySprite from "../assets/stardew/NPC/Willy..png";
import wizardSprite from "../assets/stardew/NPC/Wizard..png";
import femaleRivalSprite from "../assets/stardew/NPC/femaleRival..png";
import maleRivalSprite from "../assets/stardew/NPC/maleRival..png";

export const stardewNpcSprites: Record<string, string> = {
	Abigail: abigailSprite,
	Alex: alexSprite,
	Caroline: carolineSprite,
	Clint: clintSprite,
	Dana: danaSprite,
	Demetrius: demetriusSprite,
	Dick: dickSprite,
	Dwarf: dwarfSprite,
	Elliott: elliottSprite,
	Emily: emilySprite,
	Evelyn: evelynSprite,
	George: georgeSprite,
	Gus: gusSprite,
	Haley: haleySprite,
	Harvey: harveySprite,
	Jas: jasSprite,
	Jodi: jodiSprite,
	Kent: kentSprite,
	Krobus: krobusSprite,
	Leah: leahSprite,
	Lewis: lewisSprite,
	Linus: linusSprite,
	Marcello: marcelloSprite,
	Marnie: marnieSprite,
	Maru: maruSprite,
	Morris: morrisSprite,
	Pam: pamSprite,
	Penny: pennySprite,
	Pierre: pierreSprite,
	Robin: robinSprite,
	Sam: samSprite,
	Sandy: sandySprite,
	Sebastian: sebastianSprite,
	Shane: shaneSprite,
	Shane_JojaMart: shaneJojaSprite,
	Toddler: toddlerSprite,
	Toddler_dark: toddlerDarkSprite,
	Toddler_girl: toddlerGirlSprite,
	Toddler_girl_dark: toddlerGirlDarkSprite,
	Vincent: vincentSprite,
	Willy: willySprite,
	Wizard: wizardSprite,
	femaleRival: femaleRivalSprite,
	maleRival: maleRivalSprite,
};

export type StardewNpcSpriteKey = keyof typeof stardewNpcSprites;

export function getStardewNpcAsset(npcType: StardewNpcSpriteKey): string {
	const asset = stardewNpcSprites[npcType];
	if (!asset) {
		throw new Error(`Unknown Stardew NPC asset: ${npcType}`);
	}
	return asset;
}
