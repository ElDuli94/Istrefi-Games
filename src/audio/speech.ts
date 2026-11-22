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
import { VOICE_FILES } from '../voice/manifest';

const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
const BASE = `${import.meta.env.BASE_URL}voice/`;

type Item = { kind: 'clip'; url: string } | { kind: 'tts'; text: string };

let audio: HTMLAudioElement | null = null;
let queue: Item[] = [];
let token = 0;

function clipUrl(lang: Lang, text: string): string | null {
  const id = VOICE_FILES[lang]?.[norm(text)];
  return id ? `${BASE}${lang}/${id}.mp3` : null;
}

function findVoice(): SpeechSynthesisVoice | null {
  const lang = LANGUAGES[getState().settings.lang];
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

export function canSpeak(): boolean {
  return 'speechSynthesis' in window && findVoice() !== null;
}

/** Del opp teksten i biter som kan spilles som lydfil, ellers leses av enheten. */
function plan(lang: Lang, text: string): Item[] {
  const whole = clipUrl(lang, text);
  if (whole) return [{ kind: 'clip', url: whole }];
  const items: Item[] = [];
  const parts = text.split(/(?<=[.!?:–])\s+/).filter(Boolean);
  for (const part of parts) {
    const url = clipUrl(lang, part);
    if (url) { items.push({ kind: 'clip', url }); continue; }
    // Prøv ord for ord (f.eks. "12 pluss 7", "Hei Ilir!")
    const words = part.split(/\s+/);
    const urls = words.map((w) => clipUrl(lang, w) ?? clipUrl(lang, w.replace(/[!?.,:]+$/, '')));
    if (urls.every(Boolean)) urls.forEach((u) => items.push({ kind: 'clip', url: u! }));
    else items.push({ kind: 'tts', text: part });
  }
  return items;
}

function next(my: number) {
  if (my !== token) return;
  const item = queue.shift();
  if (!item) return;
  if (item.kind === 'clip') {
    audio ??= new Audio();
    audio.src = item.url;
    audio.onended = () => next(my);
    audio.onerror = () => next(my);
    audio.play().catch(() => next(my));
  } else {
    const voice = findVoice();
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
  if (audio) { audio.pause(); audio.onended = null; }
  window.speechSynthesis?.cancel();
}

export function speak(text: string) {
  if (!getState().settings.voice || !text) return;
  stopSpeaking();
  const lang = getState().settings.lang;
  queue = plan(lang, text);
  next(token);
}

/** Antall lydfiler med naturlig stemme for språket (vises i foreldredelen). */
export function voiceClipCount(lang: Lang) {
  return Object.keys(VOICE_FILES[lang] ?? {}).length;
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
