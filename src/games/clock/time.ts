import type { Lang } from '../../i18n';

/** Tid som tekst: «halv fire», «kvart på 5» / «ora 3 e gjysmë», «ora 5 pa një çerek». */
export function timeText(h: number, m: number, lang: Lang): string {
  const n = (h % 12) + 1;
  if (lang === 'no') {
    switch (m) {
      case 0: return `klokka ${h}`;
      case 5: return `fem over ${h}`;
      case 10: return `ti over ${h}`;
      case 15: return `kvart over ${h}`;
      case 20: return `ti på halv ${n}`;
      case 25: return `fem på halv ${n}`;
      case 30: return `halv ${n}`;
      case 35: return `fem over halv ${n}`;
      case 40: return `ti over halv ${n}`;
      case 45: return `kvart på ${n}`;
      case 50: return `ti på ${n}`;
      default: return `fem på ${n}`;
    }
  }
  if (m === 0) return `ora ${h}`;
  if (m === 15) return `ora ${h} e një çerek`;
  if (m === 30) return `ora ${h} e gjysmë`;
  if (m === 45) return `ora ${n} pa një çerek`;
  if (m < 30) return `ora ${h} e ${m}`;
  return `ora ${n} pa ${60 - m}`;
}
export const ALL_TIMES = Array.from({ length: 12 }, (_, i) => i + 1).flatMap((h) => Array.from({ length: 12 }, (_, k) => [h, k * 5] as [number, number]));
