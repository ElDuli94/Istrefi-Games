/** Sjekker om enheten kan vise 3D-øya (uten å laste three.js). */
const SLOW_KEY = 'istrefi-3d-slow';

export function supportsWebGL2(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    const ok = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

let cached: boolean | null = null;
export function can3D(): boolean {
  if (cached !== null) return cached;
  let slow = false;
  try { slow = localStorage.getItem(SLOW_KEY) === '1'; } catch { /* ignorer */ }
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  cached = !slow && !reduced && supportsWebGL2();
  return cached;
}

/** Husk at denne enheten var for treg til 3D. */
export function markSlow() {
  cached = false;
  try { localStorage.setItem(SLOW_KEY, '1'); } catch { /* ignorer */ }
}
export function clearSlow() {
  cached = null;
  try { localStorage.removeItem(SLOW_KEY); } catch { /* ignorer */ }
}
