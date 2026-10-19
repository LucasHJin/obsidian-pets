import { defineConfig, globalIgnores } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
	globalIgnores([
		"main.js",
		"node_modules/",
		".claude/",
		"esbuild.config.mjs",
		"version-bump.mjs",
		"vitest.config.mjs",
		"scripts/",
	]),
	...obsidianmd.configs.recommended,
	{
		languageOptions: {
			parserOptions: {
				projectService: {
					allowDefaultProject: ["eslint.config.mjs"],
				},
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			"obsidianmd/ui/sentence-case": ["warn", { enforceCamelCaseLower: true }],
		},
	},
]);
