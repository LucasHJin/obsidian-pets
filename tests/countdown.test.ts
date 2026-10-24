import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Countdown } from "../src/food/countdown";

describe("Countdown", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.stubGlobal("window", { setTimeout, clearTimeout, performance });
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it("does nothing until it is started", () => {
		const done = vi.fn();
		new Countdown(1000, done);
		vi.advanceTimersByTime(5000);
		expect(done).not.toHaveBeenCalled();
	});

	it("finishes once after its duration", () => {
		const done = vi.fn();
		const countdown = new Countdown(1000, done);
		countdown.start();
		vi.advanceTimersByTime(999);
		expect(done).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(done).toHaveBeenCalledTimes(1);
		countdown.start();
		vi.advanceTimersByTime(5000);
		expect(done).toHaveBeenCalledTimes(1);
	});

	it("does not run down while paused and carries on with what was left", () => {
		const done = vi.fn();
		const countdown = new Countdown(1000, done);
		countdown.start();
		vi.advanceTimersByTime(400);
		countdown.pause();
		vi.advanceTimersByTime(60000);
		expect(done).not.toHaveBeenCalled();
		countdown.start();
		vi.advanceTimersByTime(599);
		expect(done).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(done).toHaveBeenCalledTimes(1);
	});

	it("counts each stretch of running time once across repeated pauses", () => {
		const done = vi.fn();
		const countdown = new Countdown(1000, done);
		countdown.start();
		vi.advanceTimersByTime(300);
		countdown.pause();
		countdown.pause();
		vi.advanceTimersByTime(5000);
		countdown.start();
		vi.advanceTimersByTime(300);
		countdown.pause();
		vi.advanceTimersByTime(5000);
		countdown.start();
		vi.advanceTimersByTime(399);
		expect(done).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(done).toHaveBeenCalledTimes(1);
	});

	it("ignores a second start while running", () => {
		const done = vi.fn();
		const countdown = new Countdown(1000, done);
		countdown.start();
		vi.advanceTimersByTime(600);
		countdown.start();
		vi.advanceTimersByTime(400);
		expect(done).toHaveBeenCalledTimes(1);
	});

	it("never finishes once stopped, and leaves no timer behind", () => {
		const done = vi.fn();
		const countdown = new Countdown(1000, done);
		countdown.start();
		countdown.stop();
		expect(vi.getTimerCount()).toBe(0);
		countdown.start();
		vi.advanceTimersByTime(5000);
		expect(done).not.toHaveBeenCalled();
		expect(vi.getTimerCount()).toBe(0);
	});

	it("leaves no timer behind while paused", () => {
		const countdown = new Countdown(1000, vi.fn());
		countdown.start();
		expect(vi.getTimerCount()).toBe(1);
		countdown.pause();
		expect(vi.getTimerCount()).toBe(0);
	});
});
