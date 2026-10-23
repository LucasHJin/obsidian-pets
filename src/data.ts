import { getBed } from "./catalog/beds";

export interface PetInstance {
	id: string;
	type: string;
	name: string;
}

export interface BedInstance {
	id: string;
	color: string;
	x: number;
}

export const MAX_BEDS = 3;

export interface PetPluginData {
	selectedBackground: string;
	pets: PetInstance[];
	beds: BedInstance[];
	nextPetIdCounters: Record<string, number>;
	animatedBackground: boolean;
	petSize: number;
	overlayMode: boolean;
	soundEnabled: boolean;
	newNoteNotices: boolean;
}

export const DEFAULT_DATA: PetPluginData = {
	selectedBackground: "none",
	pets: [],
	beds: [],
	nextPetIdCounters: {},
	animatedBackground: false,
	petSize: 1,
	overlayMode: false,
	soundEnabled: false,
	newNoteNotices: true,
};

const REMOVED_CHAT_DATA_KEYS = ["geminiApiKey", "openAiApiKey", "selectedModel", "indexedFiles"];
const REMOVED_CHAT_DATABASE = "obsidian-rag-db";

export function nextBedId(beds: BedInstance[]): string {
	const used = new Set(beds.map((bed) => bed.id));
	let n = 1;
	while (used.has(`bed-${n}`)) {
		n++;
	}
	return `bed-${n}`;
}

function parseBeds(value: unknown): BedInstance[] {
	if (!Array.isArray(value)) {
		return [];
	}
	const rows: unknown[] = value;
	const beds: BedInstance[] = [];
	for (const row of rows) {
		if (typeof row !== "object" || row === null) {
			continue;
		}
		const { id, color, x } = row as Record<string, unknown>;
		if (typeof id !== "string" || id === "" || beds.some((bed) => bed.id === id)) {
			continue;
		}
		if (typeof color !== "string" || !getBed(color)) {
			continue;
		}
		if (typeof x !== "number" || !Number.isFinite(x)) {
			continue;
		}
		beds.push({ id, color, x: Math.min(1, Math.max(0, x)) });
		if (beds.length === MAX_BEDS) {
			break;
		}
	}
	return beds;
}

export function resolveSavedData(raw: unknown): { data: PetPluginData; migrated: boolean } {
	const saved = (raw ?? {}) as Record<string, unknown>;
	const removedKeys = REMOVED_CHAT_DATA_KEYS.filter((key) => key in saved);
	for (const key of removedKeys) {
		delete saved[key];
	}
	const data: PetPluginData = Object.assign({}, structuredClone(DEFAULT_DATA), saved);
	data.beds = parseBeds(saved["beds"]);
	return { data, migrated: removedKeys.length > 0 };
}

export function deleteChatDatabase(): void {
	const request = window.indexedDB.deleteDatabase(REMOVED_CHAT_DATABASE);
	request.onerror = () => console.warn("Failed to delete the old chat index:", request.error);
}
