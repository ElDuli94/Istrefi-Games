/**
 * Tid på døgnet og årstid – brukes til levende bakgrunner og 3D-øya.
 * For testing kan man overstyre med ?time=night&season=winter i adressen.
 */
export type Phase = 'day' | 'dusk' | 'night';
export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

function param(name: string): string | null {
  try { return new URLSearchParams(location.search).get(name); } catch { return null; }
}

export function getPhase(d = new Date()): Phase {
  const p = param('time');
  if (p === 'day' || p === 'dusk' || p === 'night') return p;
  const h = d.getHours();
  if (h >= 7 && h < 18) return 'day';
  if (h >= 18 && h < 21) return 'dusk';
  return 'night';
}

export function getSeason(d = new Date()): Season {
  const p = param('season');
  if (p === 'winter' || p === 'spring' || p === 'summer' || p === 'autumn') return p;
  const m = d.getMonth();
  if (m === 11 || m <= 1) return 'winter';
  if (m <= 4) return 'spring';
  if (m <= 7) return 'summer';
  return 'autumn';
}

/** Juletid: hele desember (eller ?xmas=1). */
export function isChristmas(d = new Date()): boolean {
  return param('xmas') === '1' || d.getMonth() === 11;
}
