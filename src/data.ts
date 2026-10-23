export interface PetInstance {
	id: string;
	type: string;
	name: string;
}

export interface PetPluginData {
	selectedBackground: string;
	pets: PetInstance[];
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
	nextPetIdCounters: {},
	animatedBackground: false,
	petSize: 1,
	overlayMode: false,
	soundEnabled: false,
	newNoteNotices: true,
};

const REMOVED_CHAT_DATA_KEYS = ["geminiApiKey", "openAiApiKey", "selectedModel", "indexedFiles"];
const REMOVED_CHAT_DATABASE = "obsidian-rag-db";

export function resolveSavedData(raw: unknown): { data: PetPluginData; migrated: boolean } {
	const saved = (raw ?? {}) as Record<string, unknown>;
	const removedKeys = REMOVED_CHAT_DATA_KEYS.filter((key) => key in saved);
	for (const key of removedKeys) {
		delete saved[key];
	}
	return {
		data: Object.assign({}, structuredClone(DEFAULT_DATA), saved),
		migrated: removedKeys.length > 0,
	};
}

export function deleteChatDatabase(): void {
	const request = window.indexedDB.deleteDatabase(REMOVED_CHAT_DATABASE);
	request.onerror = () => console.warn("Failed to delete the old chat index:", request.error);
}
