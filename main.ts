// Note: Run npm run dev and keep it running in development
	// cmd option i for developer tools

import { Plugin } from 'obsidian';

export default class ExamplePlugin extends Plugin {
	statusBarTextElement: HTMLSpanElement;

	private updateLineCount(fileContent?: string) {
		const count = fileContent ? fileContent.split(/\r\n|\r|\n/).length : 0;
		const linesWord = count === 1 ? "line" : "lines";
		this.statusBarTextElement.textContent = `${count} ${linesWord}` 
	}

	private async enableLineCount() {
		const file = this.app.workspace.getActiveFile();
		if (file) {
			const content = await this.app.vault.read(file);
			this.updateLineCount(content);
		} else {
			this.updateLineCount("0");
		}
	}

	onload(): Promise<void> | void {
		this.statusBarTextElement = this.addStatusBarItem().createSpan();
		this.enableLineCount();

		this.app.workspace.on('active-leaf-change', async () => {
			this.enableLineCount();
		});

		this.app.workspace.on('editor-change', editor => {
			const content = editor.getDoc().getValue();
			this.updateLineCount(content);

		});
	}
}