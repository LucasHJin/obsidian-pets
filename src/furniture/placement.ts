export interface BedSpan {
	left: number;
	right: number;
}

interface Interval {
	start: number;
	end: number;
}

export function getBedSpan(x: number, containerWidth: number, bedWidth: number): BedSpan {
	const half = bedWidth / 2;
	const centre = Math.max(half, Math.min(containerWidth - half, x * containerWidth));
	return { left: centre - half, right: centre + half };
}

export function bedCentre(span: BedSpan): number {
	return (span.left + span.right) / 2;
}

export function getBedSeatX(
	centre: number,
	direction: number,
	artOffset: number,
	scale: number,
): number {
	return centre - direction * artOffset * scale;
}

export function findCrossedBeds<T extends { occupied: boolean; getSpan(): BedSpan }>(
	beds: T[],
	fromX: number,
	toX: number,
): T[] {
	return beds
		.map((bed) => ({ bed, centre: bedCentre(bed.getSpan()) }))
		.filter(({ bed, centre }) => !bed.occupied && (centre - fromX) * (centre - toX) < 0)
		.sort((a, b) => Math.abs(a.centre - fromX) - Math.abs(b.centre - fromX))
		.map(({ bed }) => bed);
}

function mergeBlocked(blocked: Interval[]): Interval[] {
	const merged: Interval[] = [];
	for (const interval of [...blocked].sort((a, b) => a.start - b.start)) {
		const last = merged[merged.length - 1];
		if (last && interval.start <= last.end) {
			last.end = Math.max(last.end, interval.end);
		} else {
			merged.push({ ...interval });
		}
	}
	return merged;
}

function findFreeIntervals(low: number, high: number, blocked: Interval[]): Interval[] {
	const free: Interval[] = [];
	let cursor = low;
	for (const interval of mergeBlocked(blocked)) {
		if (interval.start > cursor) {
			free.push({ start: cursor, end: Math.min(interval.start, high) });
		}
		cursor = Math.max(cursor, interval.end);
	}
	if (cursor < high) {
		free.push({ start: cursor, end: high });
	}
	return free.filter((interval) => interval.end > interval.start);
}

function pickFarthest(low: number, high: number, taken: number[]): number {
	const sorted = [...taken].sort((a, b) => a - b);
	const candidates = [low, high];
	for (let i = 1; i < sorted.length; i++) {
		candidates.push((sorted[i - 1] + sorted[i]) / 2);
	}
	let best = candidates[0];
	let bestGap = -1;
	for (const candidate of candidates) {
		const clamped = Math.max(low, Math.min(high, candidate));
		const gap = Math.min(...sorted.map((x) => Math.abs(x - clamped)));
		if (gap > bestGap) {
			best = clamped;
			bestGap = gap;
		}
	}
	return best;
}

export function pickBedX(
	containerWidth: number,
	bedWidth: number,
	taken: number[],
	random: () => number = Math.random,
): number {
	const half = bedWidth / 2 / containerWidth;
	const low = half;
	const high = 1 - half;
	if (!(low < high)) {
		return 0.5;
	}
	const gap = bedWidth / containerWidth;
	const blocked = taken.map((x) => ({ start: x - gap, end: x + gap }));
	const free = findFreeIntervals(low, high, blocked);
	if (free.length === 0) {
		return pickFarthest(low, high, taken);
	}
	const total = free.reduce((sum, interval) => sum + (interval.end - interval.start), 0);
	let offset = random() * total;
	for (const interval of free) {
		const length = interval.end - interval.start;
		if (offset < length) {
			return interval.start + offset;
		}
		offset -= length;
	}
	return free[free.length - 1].end;
}
