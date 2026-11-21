import type { Lang } from '../../i18n';

// Prikk-til-prikk-figurer (koordinater 0–100). Figuren lukkes tilbake til første prikk.
export interface DotFig { id: string; emoji: string; color: string; name: Record<Lang, string>; pts: [number, number][] }

const ring = (n: number, f: (i: number) => [number, number]) => Array.from({ length: n }, (_, i) => f(i));
const star = ring(10, (i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5; const r = i % 2 ? 19 : 44; return [50 + Math.cos(a) * r, 54 + Math.sin(a) * r]; });
const heart = ring(14, (i) => { const t = Math.PI - (i * 2 * Math.PI) / 14; return [50 + 2.6 * 16 * Math.sin(t) ** 3, 48 - 2.6 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]; });

export const DOT_FIGS: DotFig[] = [
  { id: 'house', emoji: '🏠', color: '#ff6b6b', name: { no: 'Hus', sq: 'Shtëpi' }, pts: [[22, 88], [22, 50], [50, 20], [78, 50], [78, 88]] },
  { id: 'star', emoji: '⭐', color: '#ffd60a', name: { no: 'Stjerne', sq: 'Yll' }, pts: star.map(([x, y]) => [Math.round(x), Math.round(y)] as [number, number]) },
  { id: 'gem', emoji: '💎', color: '#4cc9f0', name: { no: 'Diamant', sq: 'Diamant' }, pts: [[30, 26], [70, 26], [86, 44], [50, 88], [14, 44]] },
  { id: 'boat', emoji: '⛵', color: '#ff9f1c', name: { no: 'Båt', sq: 'Varkë' }, pts: [[14, 62], [48, 62], [48, 14], [80, 58], [86, 62], [72, 84], [28, 84]] },
  { id: 'crown', emoji: '👑', color: '#ffc300', name: { no: 'Krone', sq: 'Kurorë' }, pts: [[16, 80], [16, 34], [33, 56], [50, 24], [67, 56], [84, 34], [84, 80]] },
  { id: 'fish', emoji: '🐟', color: '#3a86ff', name: { no: 'Fisk', sq: 'Peshk' }, pts: [[12, 50], [32, 32], [58, 30], [76, 44], [92, 28], [92, 72], [76, 56], [58, 70], [32, 68]] },
  { id: 'rocket', emoji: '🚀', color: '#e63946', name: { no: 'Rakett', sq: 'Raketë' }, pts: [[50, 8], [62, 28], [62, 62], [76, 80], [62, 75], [38, 75], [24, 80], [38, 62], [38, 28]] },
  { id: 'tree', emoji: '🌲', color: '#2d6a4f', name: { no: 'Tre', sq: 'Pemë' }, pts: [[50, 8], [70, 36], [60, 36], [80, 62], [56, 62], [56, 88], [44, 88], [44, 62], [20, 62], [40, 36], [30, 36]] },
  { id: 'heart', emoji: '❤️', color: '#ff4d6d', name: { no: 'Hjerte', sq: 'Zemër' }, pts: heart.map(([x, y]) => [Math.round(x), Math.round(y)] as [number, number]) }
];
