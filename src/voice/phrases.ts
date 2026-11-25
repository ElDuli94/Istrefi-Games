/**
 * Alle setninger og ord appen kan lese opp – brukes av scripts/make-voices.mjs
 * for å lage lydfiler med naturlig stemme. Setninger med variabler (f.eks. navn)
 * deles opp i biter, så det som ikke varierer også får ekte stemme.
 */
import { no } from '../i18n/no';
import { sq } from '../i18n/sq';
import type { Lang } from '../i18n';
import { ANIMALS } from '../data/animals';
import { VOCAB, wordForLetter } from '../data/vocab';
import { STORIES, sentencesOf } from '../games/stories/stories';
import { SHAPE_NAMES } from '../games/shapes/names';
import { ALL_TIMES, timeText } from '../games/clock/time';
import { FARM } from '../data/farm';
import { COUNTRIES, CAPITALS } from '../data/countries';
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
  for (const l of 'A B D E F H I K L M N O P R S T U'.split(' ')) add(fill(d.popLetter, { l }));
  for (const n of [5, 10, 15, 20]) add(fill(d.streakN, { n }));
  for (let n = 0; n <= 60; n++) add(fill(d.sprintResult, { n }));
  for (let a = 1; a <= 5; a++) for (let b = 1; b <= 5; b++) add(fill(d.ladQuiz, { a, b }));
  // Gangetabellen
  for (let a = 1; a <= 10; a++) { add(fill(d.timesTable, { n: a })); for (let b = 1; b <= 10; b++) { add(fill(d.timesQ, { a, b })); add(fill(d.timesA, { a, b, n: a * b })); } }
  for (let n = 2; n <= 10; n++) for (const sct of sentences(fill(d.ladQuizWrong, { n }))) add(sct);
  for (const p of [d.red, d.blue, 'Shqipo']) add(fill(d.playerWins, { p }));
  for (let c = 1; c <= 60; c++) add(fill(d.youEarned, { coins: c }));
  for (let c = 0; c <= 36; c++) add(fill(d.stickerCount, { count: c, total: 36 }));
  for (const w of COUNTRIES) { add(w.name[lang]); add(fill(d.whichFlag, { c: w.name[lang] })); add(fill(d.capitalOf, { c: w.name[lang] })); add(CAPITALS[w.code][lang]); }
  for (const len of [4, 5] as const) for (const w of WORDS[lang][len]) { add(w.toLowerCase()); add(fill(d.theWordWas, { w: w.toLowerCase() })); }
  // 3) Dyr, sanger, figurer
  for (const a of ANIMALS) add(a.name[lang]);
  for (const a of FARM) add(a.name[lang]);
  for (const s of SONGS) add(s.title[lang]);
  for (const f of DOT_FIGS) add(f.name[lang]);
  // Eventyr, former og klokka
  for (const st of STORIES) {
    add(st.title[lang]);
    for (const pg of st.pages) { for (const s of sentencesOf(pg.text[lang])) add(s); for (const c of pg.choices ?? []) add(c.label[lang]); }
  }
  for (const n of Object.values(SHAPE_NAMES)) { add(n[lang]); add(fill(d.findThe, { x: n[lang] })); add(fill(d.countThe, { x: n[lang] })); }
  for (const [h, m] of ALL_TIMES) { const tt = timeText(h, m, lang); add(tt); add(fill(d.setClock, { t: tt })); }
  // Hva heter det? og Tallek
  for (const c of VOCAB) for (const it of c.items) { add(it[lang]); add(fill(d.findThe, { x: it[lang] })); add(fill(d.whichLetter, { x: it[lang] })); }
  for (const ch of ALPHABETS[lang]) { const ex = wordForLetter(ch, lang); if (ex) add(fill(d.asIn, { l: ch, w: ex[lang] })); }
  for (let n = 0; n <= 20; n++) { add(fill(d.itIs, { n })); add(fill(d.findNumber, { n })); add(fill(d.whatAfter, { n })); add(fill(d.whatBefore, { n })); }
  // 4) Bokstaver (uttales som bokstav) og tall
  for (const ch of ALPHABETS[lang]) add(ch.toLowerCase(), true);
  for (let n = 0; n <= 100; n++) add(String(n));
  for (let n = 110; n <= 200; n += 10) add(String(n));
  // 5) Regneord (settes sammen med tall: "3 pluss 4")
  for (const w of lang === 'no' ? ['pluss', 'minus', 'ganger', 'delt på'] : ['plus', 'minus', 'herë', 'pjesëtuar me']) add(w);
  return [...out.values()];
}
