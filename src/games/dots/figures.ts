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
  { id: 'heart', emoji: '❤️', color: '#ff4d6d', name: { no: 'Hjerte', sq: 'Zemër' }, pts: heart.map(([x, y]) => [Math.round(x), Math.round(y)] as [number, number]) },
  { id: 'cat', emoji: '🐱', color: '#f4a261', name: { no: 'Katt', sq: 'Mace' }, pts: [[20, 86], [16, 42], [24, 14], [38, 32], [62, 32], [76, 14], [84, 42], [80, 86], [50, 94]] },
  { id: 'butterfly', emoji: '🦋', color: '#c77dff', name: { no: 'Sommerfugl', sq: 'Flutur' }, pts: [[50, 30], [72, 10], [92, 26], [86, 48], [94, 70], [78, 88], [56, 70], [50, 84], [44, 70], [22, 88], [6, 70], [14, 48], [8, 26], [28, 10]] },
  { id: 'car', emoji: '🚗', color: '#e63946', name: { no: 'Bil', sq: 'Makinë' }, pts: [[8, 72], [8, 52], [26, 48], [36, 28], [66, 28], [78, 48], [92, 52], [92, 72], [78, 72], [70, 82], [62, 72], [38, 72], [30, 82], [22, 72]] },
  { id: 'umbrella', emoji: '☂️', color: '#4361ee', name: { no: 'Paraply', sq: 'Çadër' }, pts: [[8, 54], [20, 26], [50, 10], [80, 26], [92, 54], [72, 48], [54, 54], [54, 84], [44, 92], [36, 84], [44, 82], [46, 54], [28, 48]] },
  { id: 'castle', emoji: '🏰', color: '#adb5bd', name: { no: 'Slott', sq: 'Kështjellë' }, pts: [[10, 90], [10, 22], [24, 22], [24, 34], [36, 34], [36, 22], [50, 10], [64, 22], [64, 34], [76, 34], [76, 22], [90, 22], [90, 90], [60, 90], [60, 70], [40, 70], [40, 90]] },
  { id: 'bird', emoji: '🐦', color: '#48cae4', name: { no: 'Fugl', sq: 'Zog' }, pts: [[10, 44], [26, 34], [36, 18], [52, 26], [66, 40], [92, 34], [78, 52], [70, 72], [46, 80], [30, 70], [28, 54]] }
];
