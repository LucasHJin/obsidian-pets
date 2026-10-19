interface HorizontalSpan {
	left: number;
	right: number;
}

export function getTooltipShift(tooltip: HorizontalSpan, bounds: HorizontalSpan): number {
	const fits = tooltip.right - tooltip.left < bounds.right - bounds.left;
	if (!fits || tooltip.left < bounds.left) {
		return bounds.left - tooltip.left;
	}
	if (tooltip.right > bounds.right) {
		return bounds.right - tooltip.right;
	}
	return 0;
}
