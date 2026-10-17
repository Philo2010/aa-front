// DPDG (defensive points differential given) sign helpers.
//
// Sign convention, shared by every DPDG surface in the app:
//   +  the opponent(s) scored BELOW their event average -> the defence worked
//   -  the opponent(s) scored ABOVE their event average -> the defence leaked
//   0  the opponent(s) scored exactly at their average (or no prior data)
//
// We colour/tag by the SIGN of the value, never by the raw magnitude, so the
// same visual language applies to both the points and the percent forms.

export const DPDG_POS_COLOR = '#5dde8a'; // green — good defence
export const DPDG_NEG_COLOR = '#e05555'; // red   — bad defence
export const DPDG_ZERO_COLOR = 'rgba(255, 255, 255, 0.45)';

export type DpdgClass = 'dpdg-pos' | 'dpdg-neg' | 'dpdg-zero';

/** Chart/text colour for a DPDG value. */
export function dpdgColor(v: number | null | undefined): string {
	if (v == null || v === 0) return DPDG_ZERO_COLOR;
	return v > 0 ? DPDG_POS_COLOR : DPDG_NEG_COLOR;
}

/** CSS class carrying the colour for a DPDG value. */
export function dpdgClass(v: number | null | undefined): DpdgClass {
	if (v == null || v === 0) return 'dpdg-zero';
	return v > 0 ? 'dpdg-pos' : 'dpdg-neg';
}

/** Always shows the leading sign so positive vs negative is unambiguous. */
export function dpdgSigned(v: number, digits = 1): string {
	return (v > 0 ? '+' : '') + v.toFixed(digits);
}

/** Signed value with a percent suffix, for the `_percent` DPDG fields. */
export function dpdgPercent(v: number, digits = 1): string {
	return dpdgSigned(v, digits) + '%';
}

/** One-line explanation reused on each DPDG surface. */
export const DPDG_LEGEND =
	'+ opponent held BELOW their average (good defence)  ·  − opponent scored ABOVE their average';

/** Tooltip text attached to individual DPDG values. */
export const DPDG_TOOLTIP =
	'DPDG sign: + means the opponent(s) scored below their event average (your defence suppressed them); ' +
	'− means they scored above their average.';
