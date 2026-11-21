/**
 * Lyd uten lydfiler: alle effekter og bakgrunnsmusikken lages med Web Audio API.
 * Det gjør appen liten og gjør at den fungerer offline. Senere kan vi bytte
 * til ekte innspilte lyder ved å endre bare denne filen.
 */
import { getState } from '../storage/store';

let ctx: AudioContext | null = null;
let musicGain: GainNode | null = null;
let musicTimer: number | null = null;

export function ac(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.2, dest?: AudioNode) {
  const c = ac();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(dest ?? c.destination);
  o.start(start);
  o.stop(start + dur + 0.05);
  return o;
}

export type Sfx = 'tap' | 'flip' | 'match' | 'nope' | 'win' | 'sticker' | 'pop';

export function playSfx(name: Sfx) {
  if (!getState().settings.sfx) return;
  try {
    playSfxInner(name);
  } catch {
    /* lyd skal aldri kunne stoppe spillet */
  }
}

function playSfxInner(name: Sfx) {
  const c = ac();
  const t = c.currentTime;
  switch (name) {
    case 'tap':
      tone(660, t, 0.08, 'triangle', 0.15);
      break;
    case 'pop': {
      const o = tone(400, t, 0.12, 'sine', 0.25);
      o.frequency.exponentialRampToValueAtTime(900, t + 0.1);
      break;
    }
    case 'flip':
      tone(520, t, 0.07, 'triangle', 0.12);
      tone(780, t + 0.04, 0.07, 'triangle', 0.1);
      break;
    case 'match':
      [523, 659, 784].forEach((f, i) => tone(f, t + i * 0.08, 0.2, 'triangle', 0.18));
      break;
    case 'nope': // mykt og vennlig, aldri "feil-lyd"
      tone(392, t, 0.12, 'sine', 0.1);
      tone(349, t + 0.1, 0.16, 'sine', 0.08);
      break;
    case 'win':
      [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, t + i * 0.11, 0.25, 'triangle', 0.18));
      break;
    case 'sticker':
      [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.07, 0.3, 'sine', 0.16));
      break;
  }
}

// ---- Bakgrunnsmusikk: en rolig, glad melodi i loop ----
const BPM = 100;
const MELODY = [0, 4, 7, 4, 5, 9, 7, null, 4, 7, 12, 7, 5, 4, 2, null]; // halvtoner over C
const BASS = [0, 0, 5, 5, 7, 7, 0, 0];
const midi = (n: number) => 261.63 * Math.pow(2, n / 12);

export function startMusic() {
  if (musicTimer !== null || !getState().settings.music) return;
  let c: AudioContext;
  try {
    c = ac();
  } catch {
    return;
  }
  musicGain = c.createGain();
  musicGain.gain.value = 0.35;
  musicGain.connect(c.destination);
  const step = 60 / BPM / 2;
  let i = 0;
  let next = c.currentTime + 0.1;
  const schedule = () => {
    while (next < c.currentTime + 0.5) {
      const m = MELODY[i % MELODY.length];
      if (m !== null) tone(midi(m), next, step * 0.9, 'triangle', 0.06, musicGain!);
      if (i % 2 === 0) tone(midi(BASS[(i / 2) % BASS.length] - 12), next, step * 1.8, 'sine', 0.07, musicGain!);
      next += step;
      i++;
    }
  };
  schedule();
  musicTimer = window.setInterval(schedule, 200);
}

export function stopMusic() {
  if (musicTimer !== null) clearInterval(musicTimer);
  musicTimer = null;
  if (musicGain && ctx) {
    musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    const g = musicGain;
    setTimeout(() => g.disconnect(), 600);
  }
  musicGain = null;
}

// Pause musikken når appen er skjult (bytte app / skjerm av).
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopMusic();
});

// ---- Instrumenter (Musikkleker) ----
export type Timbre = 'piano' | 'xylo';
export function playNote(freq: number, timbre: Timbre = 'piano') {
  if (!getState().settings.sfx) return;
  try {
    const c = ac();
    const t = c.currentTime;
    if (timbre === 'piano') {
      tone(freq, t, 1.2, 'triangle', 0.28);
      tone(freq * 2, t, 0.6, 'sine', 0.06);
    } else {
      tone(freq * 2, t, 0.7, 'sine', 0.3);
      tone(freq * 8.1, t, 0.12, 'sine', 0.05); // metallisk "pling"
    }
  } catch { /* ignorer */ }
}

export type Drum = 'kick' | 'snare' | 'hihat' | 'clap' | 'tom' | 'bell';
function noiseHit(t: number, dur: number, type: BiquadFilterType, freq: number, vol: number) {
  const c = ac();
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t);
}
export function playDrum(kind: Drum) {
  if (!getState().settings.sfx) return;
  try {
    const c = ac();
    const t = c.currentTime;
    switch (kind) {
      case 'kick': { const o = tone(150, t, 0.4, 'sine', 0.8); o.frequency.exponentialRampToValueAtTime(45, t + 0.3); break; }
      case 'snare': noiseHit(t, 0.2, 'bandpass', 1800, 0.6); tone(220, t, 0.1, 'triangle', 0.3); break;
      case 'hihat': noiseHit(t, 0.06, 'highpass', 7000, 0.4); break;
      case 'clap': [0, 0.012, 0.024].forEach((d) => noiseHit(t + d, 0.12, 'bandpass', 1200, 0.5)); break;
      case 'tom': { const o = tone(220, t, 0.45, 'sine', 0.6); o.frequency.exponentialRampToValueAtTime(110, t + 0.4); break; }
      case 'bell': tone(540, t, 0.5, 'square', 0.08); tone(800, t, 0.5, 'square', 0.06); break;
    }
  } catch { /* ignorer */ }
}
