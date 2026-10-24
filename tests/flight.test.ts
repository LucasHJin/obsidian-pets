import { describe, expect, it } from "vitest";
import {
	FlightBounds,
	FlightPlanOptions,
	Point,
	getFlightFacing,
	pickWaypoints,
	planFlight,
} from "../src/pets/flight";

function seeded(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
		return state / 4294967296;
	};
}

const BOUNDS: FlightBounds = { minX: 16, maxX: 268, minY: 4, maxY: 170 };
const RADIUS = 22;
const INNER = {
	minX: BOUNDS.minX + RADIUS,
	maxX: BOUNDS.maxX - RADIUS,
	minY: BOUNDS.minY + RADIUS / 2,
	maxY: BOUNDS.maxY - RADIUS / 2,
};

function options(seed: number, overrides: Partial<FlightPlanOptions> = {}): FlightPlanOptions {
	const random = seeded(seed);
	return {
		start: { x: 16 + random() * 252, y: 0 },
		end: { x: 16 + random() * 252, y: 0 },
		bounds: BOUNDS,
		legs: 2 + Math.floor(random() * 3),
		speed: 130,
		rampMs: 650,
		turnRadius: RADIUS,
		random,
		...overrides,
	};
}

function sample(path: ReturnType<typeof planFlight>, stepMs = 16): Point[] {
	const points: Point[] = [];
	for (let t = 0; t < path.duration; t += stepMs) points.push(path.positionAt(t));
	points.push(path.positionAt(path.duration));
	return points;
}

const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1);

describe("planFlight", () => {
	it("starts where the bird is and ends exactly on the landing spot", () => {
		for (const seed of SEEDS) {
			const plan = options(seed);
			const path = planFlight(plan);
			expect(path.positionAt(0).x).toBeCloseTo(plan.start.x, 6);
			expect(path.positionAt(0).y).toBeCloseTo(plan.start.y, 6);
			expect(path.positionAt(path.duration).x).toBeCloseTo(plan.end.x, 6);
			expect(path.positionAt(path.duration).y).toBeCloseTo(plan.end.y, 6);
			expect(path.positionAt(path.duration + 5000).y).toBeCloseTo(plan.end.y, 6);
		}
	});

	it("never leaves the bounds or dips below the ground", () => {
		for (const seed of SEEDS) {
			for (const point of sample(planFlight(options(seed)))) {
				expect(point.x).toBeGreaterThanOrEqual(BOUNDS.minX - 1e-6);
				expect(point.x).toBeLessThanOrEqual(BOUNDS.maxX + 1e-6);
				expect(point.y).toBeGreaterThanOrEqual(-1e-6);
				expect(point.y).toBeLessThanOrEqual(BOUNDS.maxY + 1e-6);
			}
		}
	});

	it("flies at or below the cruising speed, from rest to rest", () => {
		for (const seed of SEEDS.slice(0, 40)) {
			const path = planFlight(options(seed));
			const points = sample(path, 10);
			const speeds = points
				.slice(1)
				.map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y) / 0.01);
			expect(Math.max(...speeds)).toBeLessThanOrEqual(130 * 1.001);
			expect(speeds[0]).toBeLessThan(10);
			expect(speeds[speeds.length - 2]).toBeLessThan(10);
		}
	});

	it("takes longer for longer routes and has a positive duration", () => {
		const short = planFlight(options(3, { legs: 1 }));
		const long = planFlight(options(3, { legs: 4 }));
		expect(short.duration).toBeGreaterThan(0);
		expect(long.length).toBeGreaterThan(short.length);
		expect(long.duration).toBeGreaterThan(short.duration);
	});

	it("turns in smooth arcs without sharp corners until it flares to land", () => {
		for (const seed of SEEDS) {
			const plan = options(seed);
			const points = sample(planFlight(plan), 16);
			const flaring = (point: Point) =>
				Math.hypot(point.x - plan.end.x, point.y - plan.end.y) < RADIUS * 2;
			let worst = 0;
			for (let i = 2; i < points.length; i++) {
				if (flaring(points[i]) || flaring(points[i - 1])) continue;
				const ax = points[i - 1].x - points[i - 2].x;
				const ay = points[i - 1].y - points[i - 2].y;
				const bx = points[i].x - points[i - 1].x;
				const by = points[i].y - points[i - 1].y;
				if (Math.hypot(ax, ay) < 0.5 || Math.hypot(bx, by) < 0.5) continue;
				const cos = (ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by));
				worst = Math.max(worst, Math.acos(Math.max(-1, Math.min(1, cos))));
			}
			expect(worst).toBeLessThan(0.4);
		}
	});

	it("copes with a view too small to fly in", () => {
		const bounds = { minX: 20, maxX: 20, minY: 4, maxY: 4 };
		const path = planFlight(
			options(7, { bounds, start: { x: 20, y: 0 }, end: { x: 20, y: 0 } }),
		);
		for (const point of sample(path)) {
			expect(point.x).toBeCloseTo(20, 6);
			expect(point.y).toBeGreaterThanOrEqual(-1e-6);
			expect(point.y).toBeLessThanOrEqual(4 + 1e-6);
		}
		const flat = planFlight({
			...options(7),
			bounds: { minX: 20, maxX: 20, minY: 0, maxY: 0 },
			start: { x: 20, y: 0 },
			end: { x: 20, y: 0 },
		});
		expect(flat.duration).toBe(0);
		expect(flat.positionAt(0)).toEqual({ x: 20, y: 0 });
	});

	it("keeps going when the landing spot is next to the start", () => {
		const path = planFlight(options(11, { start: { x: 100, y: 0 }, end: { x: 100.2, y: 0 } }));
		expect(path.positionAt(path.duration).x).toBeCloseTo(100.2, 6);
		expect(path.duration).toBeGreaterThan(0);
	});
});

describe("pickWaypoints", () => {
	it("visits the requested number of legs, then an approach, then the landing", () => {
		for (const legs of [1, 2, 3, 4]) {
			const plan = options(5, { legs });
			const points = pickWaypoints(plan);
			expect(points).toHaveLength(legs + 3);
			expect(points[0]).toEqual(plan.start);
			expect(points[points.length - 1]).toEqual(plan.end);
		}
	});

	it("approaches the landing spot from above and from the side it is flying in from", () => {
		for (const seed of SEEDS) {
			const plan = options(seed);
			const points = pickWaypoints(plan);
			const before = points[points.length - 3];
			const approach = points[points.length - 2];
			expect(approach.y).toBeGreaterThanOrEqual(plan.end.y);
			expect(approach.x).toBeGreaterThanOrEqual(Math.min(before.x, plan.end.x) - 1e-6);
			expect(approach.x).toBeLessThanOrEqual(Math.max(before.x, plan.end.x) + 1e-6);
		}
	});

	it("keeps every waypoint inside the bounds", () => {
		for (const seed of SEEDS) {
			for (const point of pickWaypoints(options(seed)).slice(1, -2)) {
				expect(point.x).toBeGreaterThanOrEqual(INNER.minX);
				expect(point.x).toBeLessThanOrEqual(INNER.maxX);
				expect(point.y).toBeGreaterThanOrEqual(INNER.minY);
				expect(point.y).toBeLessThanOrEqual(INNER.maxY);
			}
			for (const point of pickWaypoints(options(seed)).slice(-2, -1)) {
				expect(point.x).toBeGreaterThanOrEqual(BOUNDS.minX);
				expect(point.x).toBeLessThanOrEqual(BOUNDS.maxX);
				expect(point.y).toBeGreaterThanOrEqual(BOUNDS.minY);
				expect(point.y).toBeLessThanOrEqual(BOUNDS.maxY);
			}
		}
	});

	it("makes every leg cover a real distance sideways", () => {
		const share = (INNER.maxX - INNER.minX) * 0.25;
		for (const seed of SEEDS) {
			const plan = options(seed, { legs: 3 });
			const points = pickWaypoints(plan);
			for (let i = 1; i <= 3; i++) {
				expect(Math.abs(points[i].x - points[i - 1].x)).toBeGreaterThanOrEqual(
					share - 1e-6,
				);
			}
		}
	});

	it("uses the whole range of heights, from just above the ground to near the top", () => {
		const altitudes: number[] = [];
		for (const seed of SEEDS) {
			for (const point of pickWaypoints(options(seed)).slice(1, -2)) {
				altitudes.push(point.y);
			}
		}
		const range = INNER.maxY - INNER.minY;
		expect(Math.min(...altitudes)).toBeLessThan(INNER.minY + range * 0.1);
		expect(Math.max(...altitudes)).toBeGreaterThan(INNER.maxY - range * 0.1);
		const low = altitudes.filter((y) => y < INNER.minY + range / 3).length;
		const high = altitudes.filter((y) => y > INNER.maxY - range / 3).length;
		expect(low).toBeGreaterThan(altitudes.length * 0.15);
		expect(high).toBeGreaterThan(altitudes.length * 0.15);
	});
});

describe("getFlightFacing", () => {
	it("faces the way it is moving", () => {
		expect(getFlightFacing(2, -1)).toBe(1);
		expect(getFlightFacing(-2, 1)).toBe(-1);
	});

	it("keeps its facing while it hangs almost still", () => {
		expect(getFlightFacing(0.05, -1)).toBe(-1);
		expect(getFlightFacing(-0.05, 1)).toBe(1);
		expect(getFlightFacing(0, 1)).toBe(1);
	});
});
