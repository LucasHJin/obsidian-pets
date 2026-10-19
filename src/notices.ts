import { Notice, TFile } from "obsidian";
import type PetPlugin from "./main";

const NEW_NOTE_MESSAGES = [
	"Meow! A new note! 😸",
	"Purr-fect time to write! 🐱",
	"I'm feline creative! 😻",
	"Note-hing can stop you now!",
	"Paws and write! 🐾",
	"Cat-ch those ideas!",
	"Whisker up some brilliance! 🐈",
	"You've cat to be kitten - another note?",
	"Fur real, you're productive!",
	"Meow-velous note-taking!",
	"Meow meow! 😺",
	"*purrs contentedly* 🐱",
	"Mew mew!",
	"Claw-some note! 🐾",
	"Pounce right into it! 🐱",
	"Nine lives, nine notes!",
	"Purr-sonally proud of you! 🐱",
	"Whiskers twitching with ideas! 🐱",
	"Knead some inspiration? 😺",
	"Fresh page, time for a cat-nap? Not yet!",
	"Litter-ally a new note! 🐈",

	"Boo! A new note! 👻",
	"Spook-tacular start! 👻",
	"Ghost-writing is my specialty! 👻",
	"Boo-tiful new note! 👻",

	"Hop into a new note! 🐰",
	"Some-bunny's productive!",
	"Lettuce write! 🥬",
	"Hare-brained ideas welcome!",
	"Note-hopping along nicely!",
	"Carrot-ch all your thoughts! 🥕",
	"Hop-timistic about this note!",
	"Bunny-lievable productivity!",
	"Bun-derful new note! 🐰",
	"Ears up, let's get writing! 🐰",

	"Write on, hooman! ✍️",
];

export function registerNewNoteNotices(plugin: PetPlugin): void {
	plugin.app.workspace.onLayoutReady(() => {
		plugin.registerEvent(
			plugin.app.vault.on("create", (file) => {
				if (!(file instanceof TFile) || file.extension !== "md") return;
				if (!plugin.data.newNoteNotices) return;
				const randomMessage =
					NEW_NOTE_MESSAGES[Math.floor(Math.random() * NEW_NOTE_MESSAGES.length)];
				new Notice(randomMessage);
			}),
		);
	});
}
