import { defineConfig } from "vitest/config";
import { petAssetsVitePlugin } from "./scripts/pet-assets.mjs";

export default defineConfig({
	plugins: [petAssetsVitePlugin()],
	test: {
		include: ["tests/**/*.test.ts"],
	},
});
