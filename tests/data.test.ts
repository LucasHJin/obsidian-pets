import { describe, expect, it } from "vitest";
import { DEFAULT_DATA, MAX_BEDS, PetPluginData, nextBedId, resolveSavedData } from "../src/data";

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
		expect(data.beds).not.toBe(DEFAULT_DATA.beds);
		expect(data.nextPetIdCounters).not.toBe(DEFAULT_DATA.nextPetIdCounters);

		data.pets.push({ id: "pets/black-cat-1", type: "pets/black-cat", name: "Midnight" });
		data.beds.push({ id: "bed-1", color: "blue", x: 0.5 });
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
			beds: [{ id: "bed-1", color: "blue", x: 0.25 }],
			nextPetIdCounters: { "pets/black-cat": 2 },
			animatedBackground: true,
			petSize: 1.5,
			overlayMode: true,
			soundEnabled: true,
			newNoteNotices: false,
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

	it("turns new note notices on for saved data that predates the setting", () => {
		const { data } = resolveSavedData({ petSize: 2, soundEnabled: true });
		expect(data.newNoteNotices).toBe(true);
	});

	it("keeps new note notices off when it was saved as off", () => {
		const { data } = resolveSavedData({ newNoteNotices: false });
		expect(data.newNoteNotices).toBe(false);
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

	it("gives no beds for saved data that predates them", () => {
		const { data } = resolveSavedData({ petSize: 2 });
		expect(data.beds).toEqual([]);
	});

	it("keeps well-formed beds in order", () => {
		const beds = [
			{ id: "bed-1", color: "pink", x: 0.1 },
			{ id: "bed-2", color: "red", x: 0.9 },
		];
		const { data, migrated } = resolveSavedData({ beds: structuredClone(beds) });
		expect(data.beds).toEqual(beds);
		expect(migrated).toBe(false);
	});

	it.each([
		["a string", "bed"],
		["an object", { id: "bed-1", color: "blue", x: 0.5 }],
		["null", null],
		["a number", 3],
	])("treats beds saved as %s as no beds", (_label, beds) => {
		expect(resolveSavedData({ beds }).data.beds).toEqual([]);
	});

	it.each([
		["a null row", null],
		["a string row", "bed-1"],
		["an unknown colour", { id: "bed-1", color: "teal", x: 0.5 }],
		["a missing colour", { id: "bed-1", x: 0.5 }],
		["a colour that isn't a string", { id: "bed-1", color: 4, x: 0.5 }],
		["a missing id", { color: "blue", x: 0.5 }],
		["an empty id", { id: "", color: "blue", x: 0.5 }],
		["a numeric id", { id: 1, color: "blue", x: 0.5 }],
		["a missing x", { id: "bed-1", color: "blue" }],
		["an x that is a string", { id: "bed-1", color: "blue", x: "0.5" }],
		["an x that isn't finite", { id: "bed-1", color: "blue", x: null }],
	])("drops %s and keeps the good rows", (_label, bad) => {
		const good = { id: "bed-2", color: "green", x: 0.4 };
		const { data } = resolveSavedData({ beds: [bad, good] });
		expect(data.beds).toEqual([good]);
	});

	it("clamps an x outside the view back into it", () => {
		const { data } = resolveSavedData({
			beds: [
				{ id: "bed-1", color: "blue", x: -2 },
				{ id: "bed-2", color: "blue", x: 7 },
			],
		});
		expect(data.beds.map((bed) => bed.x)).toEqual([0, 1]);
	});

	it("keeps the first of two beds that share an id", () => {
		const { data } = resolveSavedData({
			beds: [
				{ id: "bed-1", color: "blue", x: 0.1 },
				{ id: "bed-1", color: "red", x: 0.9 },
			],
		});
		expect(data.beds).toEqual([{ id: "bed-1", color: "blue", x: 0.1 }]);
	});

	it("keeps only as many beds as the limit allows", () => {
		const beds = Array.from({ length: MAX_BEDS + 2 }, (_value, i) => ({
			id: `bed-${i + 1}`,
			color: "blue",
			x: i / 10,
		}));
		const { data } = resolveSavedData({ beds });
		expect(data.beds).toEqual(beds.slice(0, MAX_BEDS));
	});

	it("keeps the rest of the saved data when it drops a bed", () => {
		const { data } = resolveSavedData({
			petSize: 2,
			beds: [{ id: "bed-1", color: "teal", x: 0.5 }],
		});
		expect(data).toEqual({ ...DEFAULT_DATA, petSize: 2 });
	});
});

describe("nextBedId", () => {
	it("starts at bed-1", () => {
		expect(nextBedId([])).toBe("bed-1");
	});

	it("takes the first number that is free", () => {
		const bed = (id: string) => ({ id, color: "blue", x: 0.5 });
		expect(nextBedId([bed("bed-1")])).toBe("bed-2");
		expect(nextBedId([bed("bed-1"), bed("bed-3")])).toBe("bed-2");
		expect(nextBedId([bed("bed-2")])).toBe("bed-1");
	});
});
