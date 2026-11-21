// Oppgavegenerator for mattespillet. Nivå 0–14 per aldersverden.
import type { WorldId } from '../../data/worlds';

export interface Question {
  text: string; // f.eks. "7 × 8"
  answer: number;
  say?: [number, 'plus' | 'minus' | 'times' | 'div', number]; // for opplesing
  visual?: { a: number; b: number; op: '+' | '−'; emoji: string }; // bilder for de minste
}

const R = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const FRUIT = ['🍎', '🍓', '🍌', '⭐', '🐟', '🎈', '🍪', '🌸'];

function add(max: number, visual = false): Question {
  const a = R(0, max), b = R(0, max - a);
  return { text: `${a} + ${b}`, answer: a + b, say: [a, 'plus', b], visual: visual ? { a, b, op: '+', emoji: pick(FRUIT) } : undefined };
}
function sub(max: number, visual = false): Question {
  const a = R(1, max), b = R(0, a);
  return { text: `${a} − ${b}`, answer: a - b, say: [a, 'minus', b], visual: visual ? { a, b, op: '−', emoji: pick(FRUIT) } : undefined };
}
function mul(tables: number[], maxB = 10): Question {
  const a = pick(tables), b = R(1, maxB);
  return Math.random() < 0.5 ? { text: `${a} × ${b}`, answer: a * b, say: [a, 'times', b] } : { text: `${b} × ${a}`, answer: a * b, say: [b, 'times', a] };
}
function div(tables: number[]): Question {
  const a = pick(tables), b = R(1, 10);
  return { text: `${a * b} : ${a}`, answer: b, say: [a * b, 'div', a] };
}

export function makeQuestion(world: WorldId, lvl: number): Question {
  if (world === 'small' || world === 'tiny') {
    if (lvl <= 2) return add(5, true);
    if (lvl <= 5) return add(10, lvl <= 4);
    if (lvl <= 8) return sub(10, lvl === 6);
    if (lvl <= 11) return Math.random() < 0.5 ? add(20) : sub(20);
    // Hvilket tall mangler?
    const a = R(0, 10), b = R(0, 10);
    return Math.random() < 0.5 ? { text: `${a} + ? = ${a + b}`, answer: b } : { text: `? + ${b} = ${a + b}`, answer: a };
  }
  if (world === 'mid') {
    if (lvl <= 2) return mul([2, 5, 10]);
    if (lvl <= 5) return mul([3, 4]);
    if (lvl <= 8) return mul(lvl === 8 ? [2, 3, 4, 5, 6, 7, 8, 9, 10] : [6, 7, 8, 9]);
    if (lvl <= 11) return div(lvl === 9 ? [2, 5, 10] : [2, 3, 4, 5, 6, 7, 8, 9]);
    const kind = R(0, 2);
    if (kind === 0) { const a = R(10, 99), b = R(1, 100 - a); return { text: `${a} + ${b}`, answer: a + b, say: [a, 'plus', b] }; }
    if (kind === 1) { const a = R(20, 100), b = R(1, a); return { text: `${a} − ${b}`, answer: a - b, say: [a, 'minus', b] }; }
    return Math.random() < 0.5 ? mul([2, 3, 4, 5, 6, 7, 8, 9]) : div([3, 4, 6, 7, 8, 9]);
  }
  // 12–15 år
  if (lvl <= 2) {
    if (Math.random() < 0.5) { const a = R(12, 99), b = R(2, 9); return { text: `${a} × ${b}`, answer: a * b }; }
    const a = R(100, 999), b = R(10, 999);
    return Math.random() < 0.5 ? { text: `${a} + ${b}`, answer: a + b } : { text: `${Math.max(a, b)} − ${Math.min(a, b)}`, answer: Math.abs(a - b) };
  }
  if (lvl <= 5) {
    const a = R(-20, 20), b = R(-20, 20);
    const fmt = (n: number) => (n < 0 ? `(${n})` : `${n}`);
    return Math.random() < 0.5 ? { text: `${a} + ${fmt(b)}`, answer: a + b } : { text: `${a} − ${fmt(b)}`, answer: a - b };
  }
  if (lvl <= 8) {
    const a = R(1, 20), b = R(2, 9), c = R(2, 9);
    return pick([
      { text: `${a} + ${b} × ${c}`, answer: a + b * c },
      { text: `(${a} + ${b}) × ${c}`, answer: (a + b) * c },
      { text: `${b * c + a} − ${b} × ${c}`, answer: a },
      { text: `${a * c} : ${c} + ${b}`, answer: a + b }
    ]);
  }
  if (lvl <= 11) {
    const k = R(0, 2);
    if (k === 0) { const a = R(2, 15); return { text: `${a}²`, answer: a * a }; }
    if (k === 1) { const a = R(2, 15); return { text: `√${a * a}`, answer: a }; }
    const p = pick([10, 20, 25, 50, 75]), base = pick([20, 40, 60, 80, 100, 120, 200, 400]);
    return { text: `${p} % av ${base}`, answer: (p * base) / 100 };
  }
  // Likninger og brøk
  if (Math.random() < 0.6) {
    const x = R(1, 12), a = R(2, 9), b = R(1, 20);
    return { text: `${a}x + ${b} = ${a * x + b}   x = ?`, answer: x };
  }
  const d = pick([2, 3, 4, 5, 10]), n = R(1, d - 1), base = d * R(2, 12);
  return { text: `${n}/${d} av ${base}`, answer: (n * base) / d };
}

/** Svaralternativer: riktig svar + nære feil svar */
export function choicesFor(q: Question, count: number, allowNegative: boolean): number[] {
  const set = new Set<number>([q.answer]);
  const spread = Math.max(3, Math.round(Math.abs(q.answer) * 0.25));
  let guard = 0;
  while (set.size < count && guard++ < 100) {
    const c = q.answer + R(-spread, spread);
    if (c !== q.answer && (allowNegative || c >= 0)) set.add(c);
  }
  return [...set].sort(() => Math.random() - 0.5);
}
