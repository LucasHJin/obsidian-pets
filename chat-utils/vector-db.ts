import { cosineSim } from "./chat-helpers";

// Build simplified vector DB inheriting from IndexedDB
export class VectorDB {
	private dbName = "obsidian-rag-db";
	private storeName = "vectors";
	private dbPromise: Promise<IDBDatabase>;

	constructor() {
		// Opens/creates obsidian-rag-db database
		this.dbPromise = this.open();
	}

	// Open or create the IndexedDB database
	private open(): Promise<IDBDatabase> {
		return new Promise((res, rej) => {
			const req = indexedDB.open(this.dbName, 1); // Version 1
			req.onupgradeneeded = () => {
				const db = req.result;
				// Creates object store (table) for vectors
				if (!db.objectStoreNames.contains(this.storeName)) {
					const store = db.createObjectStore(this.storeName, {
						keyPath: "id",
					});
					store.createIndex("by_note", "notePath", { unique: false }); // Index on notePath for fast lookup (where the vector embedding goes)
				}
			};
			req.onsuccess = () => res(req.result);
			req.onerror = () => rej(req.error);
		});
	}

	// Stores 1 chunk of data into the database
	// item should have {id, notePath, chunkIndex, text, embedding}
	async put(item: any): Promise<void> {
		const db = await this.dbPromise;
		return new Promise((resolve, reject) => {
			const tx = db.transaction(this.storeName, "readwrite"); // Uses transactions to avoid crash on failure
			tx.objectStore(this.storeName).put(item); // Access vectors table
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	}

	// Get all chunks in database
	// No built in vector search -> manually search with search()
	// Fast enough for small DBs and most vaults
	async getAll(): Promise<any[]> {
		const db = await this.dbPromise;
		return new Promise((res, rej) => {
			const tx = db.transaction(this.storeName, "readonly");
			const req = tx.objectStore(this.storeName).getAll();
			req.onsuccess = () => res(req.result || []);
			req.onerror = () => rej(req.error);
		});
	}

	// Removes all chunks associated with a given notePath (file path)
	async removeByNotePath(notePath: string): Promise<void> {
		const db = await this.dbPromise;
		return new Promise((resolve, reject) => {
			const tx = db.transaction(this.storeName, "readwrite");
			const store = tx.objectStore(this.storeName);
			const index = store.index("by_note");
			const req = index.getAllKeys(notePath); // Get all chunks for this file

			req.onsuccess = () => {
				const keys = req.result;
				// Delete each chunk
				for (const key of keys) {
					store.delete(key);
				}
			};

			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	}

	// Wipes database completely (to be used if ever needing to re-index everything)
		// WARNING: THIS SHOULD NOT BE USED UNLESS COMPLETE RESET IS NEEDED
	async clear(): Promise<void> {
		const db = await this.dbPromise;
		return new Promise((resolve, reject) => {
			const tx = db.transaction(this.storeName, "readwrite");
			tx.objectStore(this.storeName).clear();
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	}

	// Finds the k most semantically similar chunks to the query vector
	async search(
		queryVector: number[],
		topK: number
	): Promise<Array<{ text: string; score: number }>> {
		const items = await this.getAll();
		const scored = items.map((item) => ({
			text: item.text,
			notePath: item.notePath,
			score: cosineSim(queryVector, item.embedding),
		}));

		// Sort by score descending and take top K
		scored.sort((a, b) => b.score - a.score);
		return scored.slice(0, topK);
	}
}