import { App, Notice } from "obsidian";
import { chunkText } from "./chat-helpers";
import { VectorDB } from "./vector-db";
import { fetchEmbedding } from "./generator";

export async function indexVault(
	app: App,
	db: VectorDB,
	apiKey: string,
	indexedFiles: Record<string, number> = {} // Track all the indexed files (includes last modified timestamps)
) {
  // Get a set of all markdown file paths in the vault (faster lookup -> good for bigger vaults)
	const files = app.vault.getMarkdownFiles();
  const currentFilePaths = new Set(files.map(f => f.path));

  // Remove deleted files chunks
  const trackedFiles = Object.keys(indexedFiles);
  for (const trackedPath of trackedFiles) {
    if (!currentFilePaths.has(trackedPath)) {
      // If file has been previously indexed but is now deleted -> remove its chunks from the DB
      await db.removeByNotePath(trackedPath);
      delete indexedFiles[trackedPath];
      new Notice(`Removed deleted file: ${trackedPath}.`);
    }
  }

	// Find files that need indexing (new or modified)
	const filesToIndex = files.filter(
		(f) => indexedFiles[f.path] !== f.stat.mtime
	);
	if (filesToIndex.length === 0) {
		new Notice("Vault is already up to date!");
		return;
	}
	new Notice(`Indexing ${filesToIndex.length} files...`);

	let indexed = 0; // Counter for user notifs
  // Go through each file that needs to be indexed
	for (const file of filesToIndex) {
    await db.removeByNotePath(file.path); // Remove old chunks (nothing happens if new file)

    // Get text and split into chunks
		const text = await app.vault.read(file);
		const chunks = chunkText(text);

    // Embed and store each chunk
		for (let i = 0; i < chunks.length; i++) {
			try {
				const emb = await fetchEmbedding(apiKey, chunks[i]);
				await db.put({
					id: `${file.path}::${i}`,
					notePath: file.path,
					chunkIndex: i,
					text: chunks[i],
					embedding: emb,
				});

				// Small delay to avoid rate limits
				await new Promise((resolve) => setTimeout(resolve, 100));
			} catch (e) {
        // Just log and then continue with next chunking if one error
				console.error(`Failed to index ${file.path}::${i}:`, e);
				new Notice(`Error indexing ${file.path}.`);
			}
		}

    // Update modified time
		indexedFiles[file.path] = file.stat.mtime;
		indexed++;

		// Progress notif every 10 files
		if (indexed % 10 === 0) {
			new Notice(`Indexed ${indexed}/${filesToIndex.length} files...`);
		}
	}
}