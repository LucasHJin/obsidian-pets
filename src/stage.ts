import PetPlugin from "./main";
import { PetInstance } from "./data";
import { Floor } from "./floor";
import { getPetType } from "./catalog/pets";
import { getBallImage } from "./catalog/balls";
import { Pet } from "./pets/pet";
import { canChaseBalls, canFollowToy } from "./pets/capabilities";
import { createPet } from "./pets/pet-factory";
import { Ball } from "./toys/ball";

interface StageOptions {
	getFloor: () => Floor;
	ballLifetime: number;
}

export class Stage {
	pets: { id: string; pet: Pet }[] = [];
	balls: { id: string; ball: Ball }[] = [];
	private getCursorX: (() => number) | null = null;
	private paused = false;

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
			const petType = getPetType(singlePet.type);
			if (!petType) return;
			const pet = createPet({
				container: this.container,
				type: petType,
				name: singlePet.name,
				floor: this.options.getFloor(),
				scale: this.plugin.data.petSize,
				sounds: this.plugin.sounds,
			});
			if (this.getCursorX && canFollowToy(pet)) {
				pet.startFollowingCursor(this.getCursorX);
			}
			this.pets.push({ id: singlePet.id, pet });
			if (this.paused) pet.pause();
			pet.start();
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
				this.plugin.sounds,
			);
			this.balls.push({ id, ball });
			if (this.paused) ball.pause();

			const chasers = this.pets.map(({ pet }) => pet).filter(canChaseBalls);
			const chaser =
				chasers.length > 0 ? chasers[Math.floor(Math.random() * chasers.length)] : null;
			chaser?.startChasingBall(ball);
			ball.onDestroy = () => {
				chaser?.stopChasingBall(ball);
				const index = this.balls.findIndex((b) => b.ball === ball);
				if (index !== -1) {
					this.balls.splice(index, 1);
				}
			};
		} catch (error) {
			console.error("Failed to add ball:", error);
		}
	}

	pause() {
		if (this.paused) return;
		this.paused = true;
		for (const { pet } of this.pets) {
			pet.pause();
		}
		for (const { ball } of this.balls) {
			ball.pause();
		}
	}

	resume() {
		if (!this.paused) return;
		this.paused = false;
		for (const { pet } of this.pets) {
			pet.resume();
		}
		for (const { ball } of this.balls) {
			ball.resume();
		}
	}

	startCursorFollow(getClientX: () => number) {
		const getCursorX = () => getClientX() - this.container.getBoundingClientRect().left;
		this.getCursorX = getCursorX;
		for (const { pet } of this.pets) {
			if (canFollowToy(pet)) {
				pet.startFollowingCursor(getCursorX);
			}
		}
	}

	stopCursorFollow() {
		this.getCursorX = null;
		for (const { pet } of this.pets) {
			if (canFollowToy(pet)) {
				pet.stopFollowingCursor();
			}
		}
	}

	updatePetSize() {
		for (const { pet } of this.pets) {
			pet.scale = this.plugin.data.petSize;
			pet.petEl?.setCssProps({
				"--pixel-pets-scale": `${this.plugin.data.petSize}`,
			});
			void pet.clampToContainer();
		}
		for (const { ball } of this.balls) {
			if (ball.ballEl) {
				ball.scale = this.plugin.data.petSize;
				ball.ballEl.setCssProps({
					"--pixel-pets-scale": `${this.plugin.data.petSize}`,
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

	async clampPets() {
		for (const { ball } of this.balls) {
			ball.wake();
		}
		await Promise.all(this.pets.map(({ pet }) => pet.clampToContainer()));
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
