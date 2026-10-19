import { readdirSync } from "node:fs";
import path from "node:path";

export const PET_ASSETS_MODULE = "virtual:pet-assets";

const PETS_DIR = path.resolve(import.meta.dirname, "../assets/pets");
const RESOLVED_VITE_ID = `\0${PET_ASSETS_MODULE}`;

function byName(a, b) {
	if (a < b) return -1;
	return a > b ? 1 : 0;
}

function scanPetAssets() {
	const folders = readdirSync(PETS_DIR, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort(byName);

	const pets = [];
	for (const folder of folders) {
		const dir = path.join(PETS_DIR, folder);
		const files = readdirSync(dir)
			.filter((file) => file.endsWith(".png"))
			.sort(byName);
		if (files.length > 0) pets.push({ folder, dir, files });
	}
	return pets;
}

export function generatePetAssetsModule() {
	const imports = [];
	const entries = [];
	let index = 0;

	for (const { folder, dir, files } of scanPetAssets()) {
		const lines = [];
		for (const file of files) {
			const name = `asset${index++}`;
			imports.push(`import ${name} from ${JSON.stringify(path.join(dir, file))};`);
			lines.push(`\t\t${JSON.stringify(file)}: ${name},`);
		}
		entries.push(`\t${JSON.stringify(`pets/${folder}`)}: {\n${lines.join("\n")}\n\t},`);
	}

	return `${imports.join("\n")}\n\nexport const petAssets = {\n${entries.join("\n")}\n};\n`;
}

export function petAssetsEsbuildPlugin() {
	return {
		name: "pet-assets",
		setup(build) {
			build.onResolve({ filter: /^virtual:pet-assets$/ }, () => ({
				path: PET_ASSETS_MODULE,
				namespace: "pet-assets",
			}));
			build.onLoad({ filter: /.*/, namespace: "pet-assets" }, () => ({
				contents: generatePetAssetsModule(),
				loader: "js",
				resolveDir: PETS_DIR,
				watchDirs: [PETS_DIR, ...scanPetAssets().map((pet) => pet.dir)],
			}));
		},
	};
}

export function petAssetsVitePlugin() {
	return {
		name: "pet-assets",
		resolveId(id) {
			return id === PET_ASSETS_MODULE ? RESOLVED_VITE_ID : null;
		},
		load(id) {
			return id === RESOLVED_VITE_ID ? generatePetAssetsModule() : null;
		},
	};
}
