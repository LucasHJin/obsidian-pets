import PetPlugin from "./main";
import { PetInstance } from "./data";
import { Floor } from "./floor";
import { getPetType } from "./catalog/pets";
import { getBallImage } from "./catalog/balls";
import { Pet } from "./pets/pet";
import { Cat } from "./pets/cat";
import { Bunny } from "./pets/bunny";
import { Ghost } from "./pets/ghost";
import { Ball } from "./toys/ball";
import { getCatAnimations, getBunnyAnimations, getGhostAnimations } from "./pets/pet-animations";

interface StageOptions {
	getFloor: () => Floor;
	ballLifetime: number;
}

export class Stage {
	pets: { id: string; pet: Pet }[] = [];
	balls: { id: string; ball: Ball }[] = [];
	private getCursorX: (() => number) | null = null;

	constructor(
		readonly container: HTMLElement,
		private readonly plugin: PetPlugin,
		private readonly options: StageOptions,
	) {
		const getClientX = this.plugin.getCatToyClientX();
		if (getClientX) {
			this.startCursorFollow(getClientX);
		}
	}

	addPet(singlePet: PetInstance) {
		try {
			const floor = this.options.getFloor();
			const petType = getPetType(singlePet.type);

			if (petType?.species === "cat") {
				const catAnimations = getCatAnimations(singlePet.type);
				const moveDist = Math.floor(Math.random() * 20) + 25;
				const cat = new Cat(
					this.container,
					catAnimations,
					moveDist,
					floor,
					this.plugin.data.petSize,
					singlePet.name,
					petType.flying,
				);
				if (this.getCursorX) {
					cat.startFollowingCursor(this.getCursorX);
				}
				this.pets.push({ id: singlePet.id, pet: cat });
			} else if (petType?.species === "bunny") {
				const bunnyAnimations = getBunnyAnimations(singlePet.type);
				const moveDist = Math.floor(Math.random() * 30) + 45;
				const bunny = new Bunny(
					this.container,
					bunnyAnimations,
					moveDist,
					floor,
					this.plugin.data.petSize,
					singlePet.name,
				);
				this.pets.push({ id: singlePet.id, pet: bunny });
			} else if (petType?.species === "ghost") {
				const ghostAnimations = getGhostAnimations(singlePet.type);
				const moveDist = Math.floor(Math.random() * 20) + 20;
				const ghost = new Ghost(
					this.container,
					ghostAnimations,
					moveDist,
					floor,
					this.plugin.data.petSize,
					singlePet.name,
				);
				this.pets.push({ id: singlePet.id, pet: ghost });
			}
		} catch (error) {
			console.error(`Failed to create pet ${singlePet.id}:`, error);
		}
	}

	removePet(id: string) {
		const index = this.pets.findIndex((p) => p.id === id);
		if (index !== -1) {
			void this.pets[index].pet.destroy();
			this.pets.splice(index, 1);
		}
	}

	removeAllPets() {
		for (const { pet } of this.pets) {
			void pet.destroy();
		}
		this.pets = [];
	}

	throwBall(id: string) {
		try {
			const ball = new Ball(
				this.container,
				getBallImage(id),
				this.options.getFloor(),
				this.plugin.data.petSize,
				this.options.ballLifetime,
			);
			this.balls.push({ id, ball });

			const cats = this.pets.filter((p) => p.pet instanceof Cat);
			const randomCat =
				cats.length > 0 ? (cats[Math.floor(Math.random() * cats.length)].pet as Cat) : null;
			randomCat?.startChasingBall(ball);
			ball.onDestroy = () => {
				randomCat?.stopChasingBall(ball);
				const index = this.balls.findIndex((b) => b.ball === ball);
				if (index !== -1) {
					this.balls.splice(index, 1);
				}
			};
		} catch (error) {
			console.error("Failed to add ball:", error);
		}
	}

	startCursorFollow(getClientX: () => number) {
		const getCursorX = () => getClientX() - this.container.getBoundingClientRect().left;
		this.getCursorX = getCursorX;
		for (const { pet } of this.pets) {
			if (pet instanceof Cat) {
				pet.startFollowingCursor(getCursorX);
			}
		}
	}

	stopCursorFollow() {
		this.getCursorX = null;
		for (const { pet } of this.pets) {
			if (pet instanceof Cat) {
				pet.stopFollowingCursor();
			}
		}
	}

	updatePetSize() {
		for (const { pet } of this.pets) {
			pet.scale = this.plugin.data.petSize;
			pet.petEl?.setCssProps({
				"--scale": `${this.plugin.data.petSize}`,
			});
			void pet.clampToContainer();
		}
		for (const { ball } of this.balls) {
			if (ball.ballEl) {
				ball.scale = this.plugin.data.petSize;
				ball.ballEl.setCssProps({
					"--scale": `${this.plugin.data.petSize}`,
				});
			}
		}
	}

	updateFloor() {
		const floor = this.options.getFloor();
		for (const { pet } of this.pets) {
			pet.updateVerticalPosition(floor);
		}
	}

	clearImmediately() {
		for (const { pet } of this.pets) {
			pet.destroyImmediate();
		}
		this.pets = [];
		for (const { ball } of [...this.balls]) {
			ball.destroy();
		}
	}
}
