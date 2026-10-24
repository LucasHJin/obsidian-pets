export interface Point {
	x: number;
	y: number;
}

export interface FlightBounds {
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
}

export interface FlightPlanOptions {
	start: Point;
	end: Point;
	bounds: FlightBounds;
	legs: number;
	speed: number;
	rampMs: number;
	turnRadius: number;
	random?: () => number;
}

export interface FlightPath {
	waypoints: Point[];
	duration: number;
	length: number;
	positionAt: (elapsedMs: number) => Point;
}

const MIN_LEG_SHARE = 0.25;
const MIN_ALTITUDE_CHANGE_SHARE = 0.25;
const PICK_ATTEMPTS = 8;
const APPROACH_RADIUS_SHARE = 2.5;
const APPROACH_DROP = 36;
const REACH_RADIUS_SHARE = 1.5;
const STEP = 2;
const MAX_STEPS = 4000;
const SMOOTHING_PASSES = 2;
const SMOOTHING_REACH = 4;
const FACING_THRESHOLD = 0.15;

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function distance(a: Point, b: Point): number {
	return Math.hypot(b.x - a.x, b.y - a.y);
}

function pickFarFrom(
	random: () => number,
	min: number,
	max: number,
	from: number,
	minGap: number,
): number {
	let best = min + random() * (max - min);
	for (let attempt = 0; attempt < PICK_ATTEMPTS; attempt++) {
		if (Math.abs(best - from) >= minGap) return best;
		best = min + random() * (max - min);
	}
	return Math.abs(max - from) > Math.abs(min - from) ? max : min;
}

function inset(min: number, max: number, margin: number): [number, number] {
	const room = Math.max(0, max - min);
	const applied = Math.min(margin, room / 4);
	return [min + applied, Math.max(min, max) - applied];
}

export function pickWaypoints(options: FlightPlanOptions): Point[] {
	const { start, end, legs, turnRadius } = options;
	const random = options.random ?? Math.random;
	const [minX, maxX] = inset(options.bounds.minX, options.bounds.maxX, turnRadius);
	const [minY, maxY] = inset(options.bounds.minY, options.bounds.maxY, turnRadius / 2);

	const points: Point[] = [start];
	let previous = start;
	for (let i = 0; i < legs; i++) {
		const next = {
			x: pickFarFrom(random, minX, maxX, previous.x, (maxX - minX) * MIN_LEG_SHARE),
			y: pickFarFrom(
				random,
				minY,
				maxY,
				previous.y,
				(maxY - minY) * MIN_ALTITUDE_CHANGE_SHARE,
			),
		};
		points.push(next);
		previous = next;
	}

	const lead = Math.min(turnRadius * APPROACH_RADIUS_SHARE, Math.abs(previous.x - end.x) * 0.8);
	points.push({
		x: end.x + Math.sign(previous.x - end.x) * lead,
		y: clamp(end.y + APPROACH_DROP, options.bounds.minY, options.bounds.maxY),
	});
	points.push(end);
	return points;
}

function wrapAngle(angle: number): number {
	let wrapped = angle;
	while (wrapped > Math.PI) wrapped -= 2 * Math.PI;
	while (wrapped < -Math.PI) wrapped += 2 * Math.PI;
	return wrapped;
}

function smooth(curve: Point[]): Point[] {
	let current = curve;
	for (let pass = 0; pass < SMOOTHING_PASSES; pass++) {
		const previous = current;
		current = previous.map((_, index) => {
			const reach = Math.min(SMOOTHING_REACH, index, previous.length - 1 - index);
			let x = 0;
			let y = 0;
			for (let offset = -reach; offset <= reach; offset++) {
				x += previous[index + offset].x;
				y += previous[index + offset].y;
			}
			return { x: x / (2 * reach + 1), y: y / (2 * reach + 1) };
		});
	}
	return current;
}

function traceCurve(waypoints: Point[], radius: number, limits: FlightBounds): Point[] {
	const first = waypoints[0];
	const last = waypoints[waypoints.length - 1];
	const hull = {
		minX: Math.min(limits.minX, first.x, last.x),
		maxX: Math.max(limits.maxX, first.x, last.x),
		minY: Math.min(limits.minY, first.y, last.y),
		maxY: Math.max(limits.maxY, first.y, last.y),
	};
	const curve = [first];
	let position = first;
	let heading = Math.atan2(waypoints[1].y - first.y, waypoints[1].x - first.x);
	let target = 1;

	for (let step = 0; step < MAX_STEPS; step++) {
		const goal = waypoints[target];
		const remaining = distance(position, goal);
		const final = target === waypoints.length - 1;
		if (final && remaining <= STEP) break;
		if (!final && remaining <= radius * REACH_RADIUS_SHARE) {
			target++;
			continue;
		}

		const wanted = Math.atan2(goal.y - position.y, goal.x - position.x);
		const finishing = final ? clamp(1 - remaining / (2 * radius), 0, 1) : 0;
		const maxTurn = (STEP / radius) * (1 + 3 * finishing);
		heading += clamp(wrapAngle(wanted - heading), -maxTurn, maxTurn);
		position = {
			x: clamp(position.x + STEP * Math.cos(heading), hull.minX, hull.maxX),
			y: clamp(position.y + STEP * Math.sin(heading), hull.minY, hull.maxY),
		};
		curve.push(position);
	}
	curve.push(last);
	return smooth(curve);
}

function dedupe(points: Point[]): Point[] {
	const unique: Point[] = [];
	for (const [index, point] of points.entries()) {
		const last = unique[unique.length - 1];
		if (!last || distance(point, last) >= 1) {
			unique.push(point);
		} else if (index === points.length - 1) {
			unique[unique.length - 1] = point;
		}
	}
	return unique;
}

export function planFlight(options: FlightPlanOptions): FlightPath {
	const waypoints = pickWaypoints(options);
	const points = dedupe(waypoints);
	if (points.length < 2) {
		const only = points[0] ?? options.end;
		return { waypoints, duration: 0, length: 0, positionAt: () => ({ ...only }) };
	}

	const curve = traceCurve(points, Math.max(options.turnRadius, 1), options.bounds);
	const distances = [0];
	for (let i = 1; i < curve.length; i++) {
		distances.push(distances[i - 1] + distance(curve[i - 1], curve[i]));
	}
	const length = distances[distances.length - 1];

	const speed = options.speed;
	const ramp = Math.max(options.rampMs, 1) / 1000;
	const accel = speed / ramp;
	const rampLength = 0.5 * speed * ramp;
	const trapezoid = length >= 2 * rampLength;
	const peak = trapezoid ? speed : Math.sqrt(length * accel);
	const rampSeconds = peak / accel;
	const cruiseSeconds = trapezoid ? (length - 2 * rampLength) / speed : 0;
	const seconds = 2 * rampSeconds + cruiseSeconds;

	const distanceAt = (elapsed: number): number => {
		const t = clamp(elapsed / 1000, 0, seconds);
		if (t < rampSeconds) return 0.5 * accel * t * t;
		const rampDistance = 0.5 * accel * rampSeconds * rampSeconds;
		if (t < rampSeconds + cruiseSeconds) return rampDistance + peak * (t - rampSeconds);
		const left = seconds - t;
		return length - 0.5 * accel * left * left;
	};

	const positionAt = (elapsed: number): Point => {
		const target = clamp(distanceAt(elapsed), 0, length);
		let low = 0;
		let high = distances.length - 1;
		while (high - low > 1) {
			const mid = (low + high) >> 1;
			if (distances[mid] <= target) low = mid;
			else high = mid;
		}
		const span = distances[high] - distances[low];
		const share = span === 0 ? 0 : (target - distances[low]) / span;
		return {
			x: curve[low].x + (curve[high].x - curve[low].x) * share,
			y: curve[low].y + (curve[high].y - curve[low].y) * share,
		};
	};

	return { waypoints, duration: seconds * 1000, length, positionAt };
}

export function getFlightFacing(dx: number, current: number): 1 | -1 {
	if (Math.abs(dx) < FACING_THRESHOLD) return current < 0 ? -1 : 1;
	return dx < 0 ? -1 : 1;
}
