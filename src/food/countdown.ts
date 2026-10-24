export class Countdown {
	private timer: number | undefined;
	private startedAt = 0;
	private running = false;
	private finished = false;

	constructor(
		private remaining: number,
		private readonly onDone: () => void,
	) {}

	start() {
		if (this.running || this.finished) return;
		this.running = true;
		this.startedAt = window.performance.now();
		this.timer = window.setTimeout(() => {
			this.running = false;
			this.finished = true;
			this.onDone();
		}, this.remaining);
	}

	pause() {
		if (!this.running) return;
		window.clearTimeout(this.timer);
		this.running = false;
		this.remaining = Math.max(0, this.remaining - (window.performance.now() - this.startedAt));
	}

	stop() {
		window.clearTimeout(this.timer);
		this.running = false;
		this.finished = true;
	}
}
