import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Fish } from "../src/food/fish";

class FakeElement {
	classes = new Set<string>();
	props: Record<string, string> = {};
	children: FakeElement[] = [];
	parent: FakeElement | null = null;
	offsetWidth = 300;

	createDiv(options?: { cls?: string }): FakeElement {
		const child = new FakeElement();
		if (options?.cls) child.classes.add(options.cls);
		this.appendChild(child);
		return child;
	}

	createEl(): FakeElement {
		return this.createDiv();
	}

	appendChild(child: FakeElement): FakeElement {
		child.remove();
		child.parent = this;
		this.children.push(child);
		return child;
	}

	addClass(name: string) {
		this.classes.add(name);
	}

	setCssProps(props: Record<string, string>) {
		Object.assign(this.props, props);
	}

	remove() {
		this.parent?.children.splice(this.parent.children.indexOf(this), 1);
		this.parent = null;
	}
}

function makeFish(lifetime = 1000, rainbow = false) {
	const container = new FakeElement();
	const fish = new Fish(
		container as unknown as HTMLElement,
		"fish.png",
		{ kind: "bottom" },
		1,
		lifetime,
		rainbow,
	);
	const fishEl = fish.fishEl as unknown as FakeElement;
	return { container, fish, fishEl };
}

describe("Fish", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.stubGlobal("window", { setTimeout, clearTimeout, performance });
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it("can be claimed once and is then unavailable", () => {
		const { fish } = makeFish();
		expect(fish.isAvailable()).toBe(true);
		expect(fish.claim()).toBe(true);
		expect(fish.claim()).toBe(false);
		expect(fish.isAvailable()).toBe(false);
	});

	it("does not fade while claimed, and carries on with its lifetime once released", () => {
		const { fish, fishEl } = makeFish(1000);
		vi.advanceTimersByTime(400);
		fish.claim();
		vi.advanceTimersByTime(60000);
		expect(fishEl.classes.has("pixel-pets-fish--fading")).toBe(false);
		fish.release();
		expect(fish.isAvailable()).toBe(true);
		vi.advanceTimersByTime(599);
		expect(fishEl.classes.has("pixel-pets-fish--fading")).toBe(false);
		vi.advanceTimersByTime(1);
		expect(fishEl.classes.has("pixel-pets-fish--fading")).toBe(true);
	});

	it("keeps a claimed fish still when the stage pauses and resumes", () => {
		const { fish, fishEl } = makeFish(1000);
		fish.claim();
		fish.pause();
		fish.resume();
		vi.advanceTimersByTime(60000);
		expect(fishEl.classes.has("pixel-pets-fish--fading")).toBe(false);
		expect(vi.getTimerCount()).toBe(0);
	});

	it("does not start its lifetime again on release while the stage is paused", () => {
		const { fish } = makeFish(1000);
		fish.claim();
		fish.pause();
		fish.release();
		expect(vi.getTimerCount()).toBe(0);
		fish.resume();
		expect(vi.getTimerCount()).toBe(1);
	});

	it("only moves into a parent when it was claimed, and takes the held look", () => {
		const { fish, fishEl, container } = makeFish();
		const mouth = new FakeElement();
		fish.hold(mouth as unknown as HTMLElement, 15, 19);
		expect(fishEl.parent).toBe(container);
		fish.claim();
		fish.hold(mouth as unknown as HTMLElement, 15, 19);
		expect(fishEl.parent).toBe(mouth);
		expect(container.children).toHaveLength(0);
		expect(fishEl.classes.has("pixel-pets-fish--held")).toBe(true);
		expect(fishEl.props["--pixel-pets-held-x"]).toBe("15px");
		expect(fishEl.props["--pixel-pets-held-y"]).toBe("19px");
	});

	it("follows a new held origin as the mouth moves", () => {
		const { fish, fishEl } = makeFish();
		fish.claim();
		fish.hold(new FakeElement() as unknown as HTMLElement, 15, 19);
		fish.setHeldOrigin(17, 17);
		expect(fishEl.props["--pixel-pets-held-x"]).toBe("17px");
		expect(fishEl.props["--pixel-pets-held-y"]).toBe("17px");
	});

	it("shimmers only when it is a rainbow fish", () => {
		expect(makeFish(1000, true).fishEl.classes.has("pixel-pets-rainbow")).toBe(true);
		expect(makeFish(1000, false).fishEl.classes.has("pixel-pets-rainbow")).toBe(false);
		expect(makeFish().fishEl.classes.has("pixel-pets-rainbow")).toBe(false);
	});

	it("keeps shimmering while it is held and fading", () => {
		const { fish, fishEl } = makeFish(1000, true);
		fish.claim();
		fish.hold(new FakeElement() as unknown as HTMLElement, 15, 19);
		void fish.fadeOut();
		expect(fishEl.classes.has("pixel-pets-rainbow")).toBe(true);
		expect(fishEl.classes.has("pixel-pets-fish--held")).toBe(true);
		expect(fishEl.classes.has("pixel-pets-fish--fading")).toBe(true);
	});

	it("cannot be released once held", () => {
		const { fish } = makeFish();
		fish.claim();
		fish.hold(new FakeElement() as unknown as HTMLElement, 15, 19);
		fish.release();
		expect(fish.isAvailable()).toBe(false);
	});

	it("fades out and is gone after the fade", async () => {
		const { fish, fishEl } = makeFish();
		const destroyed = vi.fn();
		fish.onDestroy = destroyed;
		fish.claim();
		let gone = false;
		void fish.fadeOut().then(() => {
			gone = true;
		});
		expect(fishEl.classes.has("pixel-pets-fish--fading")).toBe(true);
		await vi.advanceTimersByTimeAsync(599);
		expect(gone).toBe(false);
		await vi.advanceTimersByTimeAsync(1);
		expect(gone).toBe(true);
		expect(destroyed).toHaveBeenCalledTimes(1);
		expect(fishEl.parent).toBeNull();
		expect(vi.getTimerCount()).toBe(0);
	});

	it("finishes fading when the stage pauses and resumes while it is held", async () => {
		const { fish, fishEl } = makeFish();
		fish.claim();
		fish.hold(new FakeElement() as unknown as HTMLElement, 15, 19);
		let gone = false;
		void fish.fadeOut().then(() => {
			gone = true;
		});
		await vi.advanceTimersByTimeAsync(200);
		fish.pause();
		await vi.advanceTimersByTimeAsync(60000);
		expect(gone).toBe(false);
		fish.resume();
		await vi.advanceTimersByTimeAsync(399);
		expect(gone).toBe(false);
		await vi.advanceTimersByTimeAsync(1);
		expect(gone).toBe(true);
		expect(fishEl.parent).toBeNull();
		expect(vi.getTimerCount()).toBe(0);
	});

	it("resolves everything waiting for it when it is destroyed early", async () => {
		const { fish } = makeFish();
		fish.claim();
		const first = fish.gone();
		const second = fish.fadeOut();
		fish.destroy();
		await Promise.all([first, second]);
		await expect(fish.gone()).resolves.toBeUndefined();
		expect(vi.getTimerCount()).toBe(0);
	});

	it("cannot be claimed or released after it is destroyed", () => {
		const { fish } = makeFish();
		fish.destroy();
		expect(fish.claim()).toBe(false);
		fish.release();
		expect(fish.isAvailable()).toBe(false);
	});
});
