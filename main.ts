// Note: Run npm run dev and keep it running in development
	// cmd option i for developer tools

import { Plugin } from 'obsidian';

export default class ExamplePlugin extends Plugin {
	onload(): Promise<void> | void {
		console.log("Hello World!")
	}
}