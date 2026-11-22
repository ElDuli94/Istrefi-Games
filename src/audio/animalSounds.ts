/**
 * Dyrelyder: ekte opptak (CC0) spilles fra public/sounds/animals/.
 * De syntetiske lydene under (Web Audio) brukes bare som reserve hvis en fil ikke kan spilles.
 */
import { ac } from './sound';
import { getState } from '../storage/store';

export type AnimalSound =
  | 'dog' | 'cat' | 'cow' | 'sheep' | 'pig' | 'duck' | 'chicken' | 'bird'
  | 'frog' | 'lion' | 'owl' | 'horse' | 'elephant' | 'monkey';

type Pt = [number, number]; // [tid i sek, verdi]

/** Én "stemme": oscillator gjennom filter med kurver for tonehøyde, filter og volum. */
function voice(opts: {
  at: number; dur: number; type?: OscillatorType;
  freq: Pt[]; filter?: Pt[]; q?: number; vol?: number;
  vibrato?: { rate: number; depth: number };
  am?: { rate: number; depth: number };
}) {
  const c = ac();
  const t0 = c.currentTime + opts.at;
  const o = c.createOscillator();
  o.type = opts.type ?? 'sawtooth';
  opts.freq.forEach(([t, f], i) => (i === 0 ? o.frequency.setValueAtTime(f, t0 + t) : o.frequency.linearRampToValueAtTime(f, t0 + t)));
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = opts.q ?? 2;
  (opts.filter ?? [[0, 1500]]).forEach(([t, v], i) => (i === 0 ? f.frequency.setValueAtTime(v, t0 + t) : f.frequency.linearRampToValueAtTime(v, t0 + t)));
  const g = c.createGain();
  const vol = opts.vol ?? 0.5;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.04, opts.dur / 4));
  g.gain.setValueAtTime(vol, t0 + opts.dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
  if (opts.vibrato) {
    const l = c.createOscillator(); const lg = c.createGain();
    l.frequency.value = opts.vibrato.rate; lg.gain.value = opts.vibrato.depth;
    l.connect(lg).connect(o.frequency); l.start(t0); l.stop(t0 + opts.dur + 0.1);
  }
  let out: AudioNode = g;
  if (opts.am) {
    const amg = c.createGain(); amg.gain.value = 1 - opts.am.depth;
    const l = c.createOscillator(); const lg = c.createGain();
    l.type = 'square'; l.frequency.value = opts.am.rate; lg.gain.value = opts.am.depth;
    l.connect(lg).connect(amg.gain); l.start(t0); l.stop(t0 + opts.dur + 0.1);
    g.connect(amg); out = amg;
  }
  o.connect(f).connect(g);
  out.connect(c.destination);
  o.start(t0);
  o.stop(t0 + opts.dur + 0.1);
}

function noise(at: number, dur: number, filter: Pt[], vol = 0.4, q = 1) {
  const c = ac();
  const t0 = c.currentTime + at;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = q;
  filter.forEach(([t, v], i) => (i === 0 ? f.frequency.setValueAtTime(v, t0 + t) : f.frequency.linearRampToValueAtTime(v, t0 + t)));
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t0);
}

// Ekte opptak av dyr (CC0, fra Freesound/Wikimedia Commons via Openverse) i public/sounds/animals/.
// Lengde i sekunder, brukt for å vente med opplesingen til dyret er ferdig.
const RECORDED: Record<AnimalSound, number> = {"dog": 2.2, "cat": 1.23, "cow": 2.38, "sheep": 2.2, "pig": 1.07, "duck": 0.55, "chicken": 0.99, "bird": 2.2, "frog": 1.33, "lion": 3.0, "owl": 3.0, "horse": 1.91, "elephant": 1.34, "monkey": 2.5};
const BASE = `${import.meta.env.BASE_URL}sounds/animals/`;
let player: HTMLAudioElement | null = null;

/** Spiller ekte dyrelyd og returnerer hvor lang den er (sek). Faller tilbake til datalyd ved feil. */
export function playAnimal(s: AnimalSound): number {
  if (!getState().settings.sfx) return 0;
  try {
    player ??= new Audio();
    player.pause();
    player.src = `${BASE}${s}.mp3`;
    player.currentTime = 0;
    player.play().catch(() => { try { playAnimalInner(s); } catch { /* ignorer */ } });
    return RECORDED[s] ?? 1.5;
  } catch {
    try {
      return playAnimalInner(s);
    } catch {
      return 0;
    }
  }
}

function playAnimalInner(s: AnimalSound): number {
  switch (s) {
    case 'dog':
      for (const at of [0, 0.28]) {
        voice({ at, dur: 0.16, freq: [[0, 420], [0.16, 200]], filter: [[0, 1200], [0.16, 600]], q: 1.5, vol: 0.7 });
        noise(at, 0.1, [[0, 2500]], 0.15);
      }
      return 0.5;
    case 'cat':
      voice({ at: 0, dur: 0.75, freq: [[0, 520], [0.25, 800], [0.75, 480]], filter: [[0, 900], [0.3, 2600], [0.75, 900]], q: 4, vol: 0.6 });
      return 0.8;
    case 'cow':
      voice({ at: 0, dur: 1.3, freq: [[0, 140], [0.3, 125], [1.3, 105]], filter: [[0, 300], [0.4, 900], [1.3, 350]], q: 3, vol: 0.8 });
      return 1.3;
    case 'sheep':
      voice({ at: 0, dur: 0.9, freq: [[0, 330], [0.9, 300]], filter: [[0, 1100], [0.9, 1400]], q: 3, vol: 0.6, vibrato: { rate: 28, depth: 25 } });
      return 0.9;
    case 'pig':
      for (const at of [0, 0.3]) voice({ at, dur: 0.2, type: 'square', freq: [[0, 180], [0.08, 280], [0.2, 140]], filter: [[0, 600], [0.2, 900]], q: 5, vol: 0.5 });
      return 0.5;
    case 'duck':
      for (const at of [0, 0.25, 0.5]) voice({ at, dur: 0.16, freq: [[0, 260], [0.16, 220]], filter: [[0, 1700], [0.16, 1300]], q: 8, vol: 0.8 });
      return 0.7;
    case 'chicken':
      [0, 0.14, 0.28].forEach((at) => voice({ at, dur: 0.08, type: 'square', freq: [[0, 520], [0.08, 420]], filter: [[0, 1400]], q: 6, vol: 0.4 }));
      voice({ at: 0.45, dur: 0.5, type: 'square', freq: [[0, 600], [0.15, 900], [0.5, 650]], filter: [[0, 1600], [0.5, 1200]], q: 6, vol: 0.45 });
      return 1;
    case 'bird':
      [0, 0.18, 0.36, 0.7, 0.85].forEach((at, i) =>
        voice({ at, dur: 0.12, type: 'sine', freq: [[0, 2400 + i * 100], [0.12, 4000]], filter: [[0, 3000]], q: 0.5, vol: 0.3 }));
      return 1;
    case 'frog':
      for (const at of [0, 0.45]) voice({ at, dur: 0.32, type: 'square', freq: [[0, 110], [0.32, 140]], filter: [[0, 500], [0.32, 900]], q: 3, vol: 0.6, am: { rate: 35, depth: 0.9 } });
      return 0.8;
    case 'lion':
      noise(0, 1.4, [[0, 250], [0.4, 900], [1.4, 200]], 0.7, 4);
      voice({ at: 0, dur: 1.4, freq: [[0, 90], [0.4, 120], [1.4, 70]], filter: [[0, 300], [0.4, 700], [1.4, 250]], q: 2, vol: 0.6, vibrato: { rate: 18, depth: 12 } });
      return 1.4;
    case 'owl':
      voice({ at: 0, dur: 0.35, type: 'sine', freq: [[0, 420], [0.35, 390]], filter: [[0, 500]], q: 0.7, vol: 0.6 });
      voice({ at: 0.5, dur: 0.6, type: 'sine', freq: [[0, 430], [0.6, 380]], filter: [[0, 500]], q: 0.7, vol: 0.6 });
      return 1.1;
    case 'horse':
      voice({ at: 0, dur: 1.1, freq: [[0, 700], [0.2, 1000], [1.1, 420]], filter: [[0, 1600], [1.1, 900]], q: 3, vol: 0.55, vibrato: { rate: 12, depth: 60 } });
      noise(0.9, 0.3, [[0, 1500]], 0.2);
      return 1.2;
    case 'elephant':
      voice({ at: 0, dur: 1, freq: [[0, 380], [0.2, 620], [1, 560]], filter: [[0, 1200], [0.3, 2200], [1, 1500]], q: 2, vol: 0.6, vibrato: { rate: 6, depth: 15 } });
      return 1;
    case 'monkey':
      [[0, 500], [0.22, 520], [0.5, 900], [0.75, 950]].forEach(([at, f]) =>
        voice({ at, dur: 0.2, freq: [[0, f], [0.1, f * 1.3], [0.2, f]], filter: [[0, f * 2]], q: 3, vol: 0.5 }));
      return 1;
  }
}
