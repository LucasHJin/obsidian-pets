import { describe, expect, it } from "vitest";
import { DEFAULT_DATA, PetPluginData, resolveSavedData } from "../src/data";

const DEFAULTS_SNAPSHOT = structuredClone(DEFAULT_DATA);

const CATBOT_DATA = {
	geminiApiKey: "gemini-key",
	openAiApiKey: "openai-key",
	selectedModel: "gpt-4o",
	indexedFiles: ["note.md"],
};

describe("resolveSavedData", () => {
	it.each([
		["undefined", undefined],
		["null", null],
		["an empty object", {}],
	])("gives the defaults for %s", (_label, raw) => {
		const { data, migrated } = resolveSavedData(raw);
		expect(data).toEqual(DEFAULT_DATA);
		expect(migrated).toBe(false);
	});

	it("returns a copy that can be mutated without touching the defaults", () => {
		const { data } = resolveSavedData({});
		expect(data).not.toBe(DEFAULT_DATA);
		expect(data.pets).not.toBe(DEFAULT_DATA.pets);
		expect(data.nextPetIdCounters).not.toBe(DEFAULT_DATA.nextPetIdCounters);

		data.pets.push({ id: "pets/black-cat-1", type: "pets/black-cat", name: "Midnight" });
		data.nextPetIdCounters["pets/black-cat"] = 1;
		data.petSize = 3;
		data.selectedBackground = "backgrounds/snowbg-1.png";

		expect(DEFAULT_DATA).toEqual(DEFAULTS_SNAPSHOT);
		expect(resolveSavedData({}).data).toEqual(DEFAULTS_SNAPSHOT);
	});

	it("lets saved values override the defaults", () => {
		const saved: PetPluginData = {
			selectedBackground: "backgrounds/snowbg-1.png",
			pets: [{ id: "pets/black-cat-1", type: "pets/black-cat", name: "Midnight" }],
			nextPetIdCounters: { "pets/black-cat": 2 },
			animatedBackground: true,
			petSize: 1.5,
			overlayMode: true,
			soundEnabled: true,
		};
		for (const key of Object.keys(saved) as (keyof PetPluginData)[]) {
			expect(saved[key], key).not.toEqual(DEFAULT_DATA[key]);
		}

		const { data, migrated } = resolveSavedData({ ...saved });
		expect(data).toEqual(saved);
		expect(migrated).toBe(false);
	});

	it("fills in the defaults for keys missing from the saved data", () => {
		const { data } = resolveSavedData({ petSize: 2, soundEnabled: true });
		expect(data).toEqual({ ...DEFAULT_DATA, petSize: 2, soundEnabled: true });
	});

	it.each(Object.keys(CATBOT_DATA))("strips %s and reports a migration", (key) => {
		const raw = { petSize: 2, [key]: CATBOT_DATA[key as keyof typeof CATBOT_DATA] };
		const { data, migrated } = resolveSavedData(raw);
		expect(migrated).toBe(true);
		expect(data).not.toHaveProperty(key);
		expect(data.petSize).toBe(2);
	});

	it("strips every Catbot key at once and keeps the rest of the saved data", () => {
		const { data, migrated } = resolveSavedData({
			...CATBOT_DATA,
			selectedBackground: "backgrounds/castlebg-1.png",
			soundEnabled: true,
		});
		expect(migrated).toBe(true);
		for (const key of Object.keys(CATBOT_DATA)) {
			expect(data).not.toHaveProperty(key);
		}
		expect(data).toEqual({
			...DEFAULT_DATA,
			selectedBackground: "backgrounds/castlebg-1.png",
			soundEnabled: true,
		});
	});
});
