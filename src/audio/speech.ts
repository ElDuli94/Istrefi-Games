/**
 * Opplesing.
 *
 * 1. Naturlig AI-stemme: ferdige lydfiler (public/voice/<språk>/) laget med scripts/make-voices.py.
 *    Hele setningen spilles hvis den finnes som lydfil.
 * 2. Hvis ikke: setningen deles i biter (setninger eller ord, f.eks. "3 pluss 4"), og bitene som
 *    finnes som lydfil spilles etter hverandre. Biter som varierer (f.eks. barnets navn) leses av
 *    enhetens innebygde stemme.
 * 3. Finnes ingen lydfiler, brukes enhetens stemme for alt (som før).
 */
import { getState } from '../storage/store';
import { LANGUAGES, type Lang } from '../i18n';

const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
const BASE = `${import.meta.env.BASE_URL}voice/`;

type Item = ({ kind: 'clip'; url: string } | { kind: 'tts'; text: string }) & { lang: Lang; onStart?: () => void };
/** En bit som skal leses: tekst, valgfritt språk og en funksjon som kalles når biten starter. */
export interface SpeakPart { text: string; lang?: Lang; onStart?: () => void }

let audio: HTMLAudioElement | null = null;
let queue: Item[] = [];
let token = 0;
let doneCb: (() => void) | null = null;

// Oversikten over lydklipp (tekst → fil) hentes fra public/voice/<språk>/index.json
// i stedet for å ligge i selve app-koden – det gjør appen ca. 130 kB mindre.
const voiceFiles: Partial<Record<Lang, Record<string, string>>> = {};
const loading: Partial<Record<Lang, Promise<void>>> = {};
function loadVoices(lang: Lang): Promise<void> {
  return (loading[lang] ??= fetch(`${BASE}${lang}/index.json`)
    .then((r) => (r.ok ? r.json() : {}))
    .then((j: Record<string, string>) => { voiceFiles[lang] = j; })
    .catch(() => { delete loading[lang]; }));
}
// Last begge språk med en gang (tospråklig modus trenger begge)
loadVoices('no');
loadVoices('sq');

function clipUrl(lang: Lang, text: string): string | null {
  const id = voiceFiles[lang]?.[norm(text)];
  return id ? `${BASE}${lang}/${id}.mp3` : null;
}

function findVoice(l: Lang = getState().settings.lang): SpeechSynthesisVoice | null {
  const lang = LANGUAGES[l];
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const prefixes = [lang.speechLang.toLowerCase(), ...lang.speechFallback];
  // Foretrekk "forbedrede"/"premium" stemmer hvis enheten har dem
  const good = /enhanced|premium|forbedret|neural|natural/i;
  for (const p of prefixes) {
    const matches = voices.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(p));
    const best = matches.find((v) => good.test(v.name)) ?? matches[0];
    if (best) return best;
  }
  return null;
}

/** Del opp teksten i biter som kan spilles som lydfil, ellers leses av enheten. */
function plan(lang: Lang, text: string): Item[] {
  const whole = clipUrl(lang, text);
  if (whole) return [{ kind: 'clip', url: whole, lang }];
  const items: Item[] = [];
  const parts = text.split(/(?<=[.!?:–])\s+/).filter(Boolean);
  for (const part of parts) {
    const url = clipUrl(lang, part);
    if (url) { items.push({ kind: 'clip', url, lang }); continue; }
    // Prøv ord for ord (f.eks. "12 pluss 7", "Hei Ilir!")
    const words = part.split(/\s+/);
    const urls = words.map((w) => clipUrl(lang, w) ?? clipUrl(lang, w.replace(/[!?.,:]+$/, '')));
    if (urls.every(Boolean)) urls.forEach((u) => items.push({ kind: 'clip', url: u!, lang }));
    else items.push({ kind: 'tts', text: part, lang });
  }
  return items;
}

function next(my: number) {
  if (my !== token) return;
  const item = queue.shift();
  if (!item) { const cb = doneCb; doneCb = null; cb?.(); return; }
  item.onStart?.();
  if (item.kind === 'clip') {
    audio ??= new Audio();
    audio.src = item.url;
    audio.onended = () => next(my);
    audio.onerror = () => next(my);
    audio.play().catch(() => next(my));
  } else {
    const voice = findVoice(item.lang);
    if (!voice || !('speechSynthesis' in window)) return next(my);
    const u = new SpeechSynthesisUtterance(item.text);
    try { u.voice = voice; } catch { /* enkelte enheter godtar ikke stemmen – bruk språk i stedet */ }
    u.lang = voice.lang;
    u.rate = 0.9;
    u.pitch = 1.1;
    u.onend = () => next(my);
    u.onerror = () => next(my);
    window.speechSynthesis.speak(u);
  }
}

export function stopSpeaking() {
  token++;
  queue = [];
  doneCb = null;
  if (audio) { audio.pause(); audio.onended = null; }
  window.speechSynthesis?.cancel();
}

export function speak(text: string) {
  speakParts([{ text }]);
}

/**
 * Les flere biter etter hverandre – f.eks. først norsk, så albansk («hund … qen»),
 * eller setning for setning i et eventyr (onStart brukes til å lyse opp teksten).
 * onDone kalles når alt er lest (også når stemmen er slått av).
 */
export function speakParts(parts: SpeakPart[], onDone?: () => void) {
  stopSpeaking();
  if (!getState().settings.voice) { onDone?.(); return; }
  const main = getState().settings.lang;
  const my = token;
  // Er ikke lydoversikten lastet ennå (rett etter oppstart)? Vent litt, men maks 1,5 s.
  const missing = [...new Set(parts.map((p) => p.lang ?? main))].filter((l) => !voiceFiles[l]);
  if (missing.length) {
    Promise.race([Promise.all(missing.map(loadVoices)), new Promise((r) => setTimeout(r, 1500))])
      .then(() => { if (my === token) startQueue(parts, main, onDone); });
    return;
  }
  startQueue(parts, main, onDone);
}

function startQueue(parts: SpeakPart[], main: Lang, onDone?: () => void) {
  queue = [];
  for (const p of parts) {
    if (!p.text) continue;
    const items = plan(p.lang ?? main, p.text);
    if (items[0] && p.onStart) items[0].onStart = p.onStart;
    queue.push(...items);
  }
  doneCb = onDone ?? null;
  next(token);
}

// iOS: "lås opp" lydavspilling ved første trykk, så senere opplesing kan starte automatisk
window.addEventListener('pointerdown', function unlock() {
  audio ??= new Audio();
  audio.muted = true;
  audio.play().catch(() => {}).finally(() => { if (audio) { audio.pause(); audio.muted = false; } });
  window.removeEventListener('pointerdown', unlock);
}, { once: true });

// Noen nettlesere laster stemmene asynkront.
window.speechSynthesis?.addEventListener?.('voiceschanged', () => {});
