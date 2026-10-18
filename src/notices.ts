import { Notice, Plugin, TFile } from "obsidian";

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

	"Woof! New note detected! 🐕",
	"Bark bark! Time to write! 🐶",
	"Paws-itively productive!",
	"Fetching new ideas! 🎾",
	"Note-worthy work!",
	"Ruff draft started!",
	"Pup-tastic productivity!",
	"Tail-wagging good writing!",
	"Who's a good writer? You are!",
	"Bone-us note unlocked! 🦴",
	"Arf arf! 🐕",
	"Woof woof! 🐶",
	"*excited bork*",
	"*tail wagging intensifies*",

	"Hop into a new note! 🐰",
	"Some-bunny's productive!",
	"Lettuce write! 🥬",
	"Hare-brained ideas welcome!",
	"Note-hopping along nicely!",
	"Carrot-ch all your thoughts! 🥕",
	"Hop-timistic about this note!",
	"Bunny-lievable productivity!",

	"Write on, hooman! ✍️",
];

export function registerNewNoteNotices(plugin: Plugin): void {
	plugin.app.workspace.onLayoutReady(() => {
		plugin.registerEvent(
			plugin.app.vault.on("create", (file) => {
				if (!(file instanceof TFile) || file.extension !== "md") return;
				const randomMessage =
					NEW_NOTE_MESSAGES[Math.floor(Math.random() * NEW_NOTE_MESSAGES.length)];
				new Notice(randomMessage);
			}),
		);
	});
}
