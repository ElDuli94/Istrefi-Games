/**
 * Alle setninger og ord appen kan lese opp – brukes av scripts/make-voices.mjs
 * for å lage lydfiler med naturlig stemme. Setninger med variabler (f.eks. navn)
 * deles opp i biter, så det som ikke varierer også får ekte stemme.
 */
import { no } from '../i18n/no';
import { sq } from '../i18n/sq';
import type { Lang } from '../i18n';
import { ANIMALS } from '../data/animals';
import { FARM } from '../data/farm';
import { COUNTRIES } from '../data/countries';
import { WORDS } from '../data/words';
import { ALPHABETS } from '../data/alphabets';
import { SONGS } from '../games/music/songs';
import { DOT_FIGS } from '../games/dots/figures';

/** Samme normalisering brukes ved avspilling. */
export const normVoice = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();

/** Del tekst i setninger (beholder tegnsetting). */
export const sentences = (s: string) => s.split(/(?<=[.!?:–])\s+/).map((x) => x.trim()).filter(Boolean);

export interface Clip { text: string; letter?: boolean }

export function phrasesFor(lang: Lang): Clip[] {
  const d = (lang === 'no' ? no : sq) as Record<string, string>;
  const out = new Map<string, Clip>();
  const add = (text: string, letter = false) => {
    const t = text.trim();
    if (t && !out.has(normVoice(t))) out.set(normVoice(t), { text: t, letter });
  };
  const fill = (tpl: string, vars: Record<string, string | number>) =>
    Object.entries(vars).reduce((s, [k, v]) => s.split(`{${k}}`).join(String(v)), tpl);

  // 1) Alle tekster i appen (de med variabler: bare setningene uten variabler)
  for (const [key, v] of Object.entries(d)) {
    if (v.includes('|') || key.startsWith('install') || key === 'privacyText' || key === 'backupInfo' || key === 'credits') continue;
    if (!v.includes('{')) add(v);
    else for (const sct of sentences(v)) if (!sct.includes('{')) add(sct);
  }
  // 2) Maler med kjente verdier
  for (const c of ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink']) {
    add(fill(d.popColor, { color: d[`color_${c}`] }));
    add(d[`colorName_${c}`]);
  }
  for (let n = 1; n <= 9; n++) add(fill(d.popNumber, { n }));
  for (const p of [d.red, d.blue, 'Shqipo']) add(fill(d.playerWins, { p }));
  for (let c = 1; c <= 60; c++) add(fill(d.youEarned, { coins: c }));
  for (let c = 0; c <= 36; c++) add(fill(d.stickerCount, { count: c, total: 36 }));
  for (const w of COUNTRIES) { add(w.name[lang]); add(fill(d.whichFlag, { c: w.name[lang] })); }
  for (const len of [4, 5] as const) for (const w of WORDS[lang][len]) { add(w.toLowerCase()); add(fill(d.theWordWas, { w: w.toLowerCase() })); }
  // 3) Dyr, lydord, sanger, figurer
  for (const a of ANIMALS) add(a.name[lang]);
  for (const a of FARM) { add(a.name[lang]); add(a.says[lang]); add(`${a.name[lang]}! ${a.says[lang]}`); }
  for (const s of SONGS) add(s.title[lang]);
  for (const f of DOT_FIGS) add(f.name[lang]);
  // 4) Bokstaver (uttales som bokstav) og tall
  for (const ch of ALPHABETS[lang]) add(ch.toLowerCase(), true);
  for (let n = 0; n <= 100; n++) add(String(n));
  // 5) Regneord (settes sammen med tall: "3 pluss 4")
  for (const w of lang === 'no' ? ['pluss', 'minus', 'ganger', 'delt på'] : ['plus', 'minus', 'herë', 'pjesëtuar me']) add(w);
  return [...out.values()];
}
