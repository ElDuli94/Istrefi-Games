/**
 * Naturlyder laget med Web Audio (ingen filer): bølger, fuglekvitter,
 * vind og sirisser om natta. Veldig lavt volum, bare på kart- og verdenskjermer.
 */
import { useEffect } from 'react';
import { ac } from './sound';
import { getState, useStore } from '../storage/store';
import { getPhase } from '../data/time';

export type Ambient = 'sea' | 'meadow' | 'forest' | 'mountain' | 'city' | 'none';

let current: { kind: Ambient; stop(): void } | null = null;
let wanted: Ambient = 'none';
let unlocked = false; // lyd først etter at barnet har trykket

function noiseBuffer(c: AudioContext, brown: boolean) {
  const len = c.sampleRate * 4;
  const b = c.createBuffer(1, len, c.sampleRate);
  const d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
  }
  return b;
}

function build(kind: Ambient) {
  const c = ac();
  const out = c.createGain();
  out.gain.value = 0;
  out.gain.setTargetAtTime(1, c.currentTime, 1.2);
  out.connect(c.destination);
  const stops: (() => void)[] = [];
  const timers: number[] = [];
  const night = getPhase() === 'night';

  // Bølger: brun støy som sveller opp og ned
  const waves = (vol: number) => {
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, true);
    src.loop = true;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 500;
    const g = c.createGain();
    g.gain.value = vol * 0.5;
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoG = c.createGain();
    lfoG.gain.value = vol * 0.45;
    lfo.connect(lfoG).connect(g.gain);
    src.connect(lp).connect(g).connect(out);
    src.start(); lfo.start();
    stops.push(() => { src.stop(); lfo.stop(); });
  };
  // Vind: filtrert hvit støy med langsom filter-sveip
  const wind = (vol: number) => {
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, false);
    src.loop = true;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 600;
    bp.Q.value = 0.8;
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoG = c.createGain();
    lfoG.gain.value = 350;
    lfo.connect(lfoG).connect(bp.frequency);
    const g = c.createGain();
    g.gain.value = vol;
    src.connect(bp).connect(g).connect(out);
    src.start(); lfo.start();
    stops.push(() => { src.stop(); lfo.stop(); });
  };
  // Fuglekvitter: korte tonesveip med tilfeldige pauser
  const birds = (vol: number) => {
    const chirp = () => {
      const t = c.currentTime + 0.05;
      const n = 2 + Math.floor(Math.random() * 4);
      const f0 = 2200 + Math.random() * 1800;
      for (let i = 0; i < n; i++) {
        const o = c.createOscillator();
        const g = c.createGain();
        const s = t + i * 0.11;
        o.frequency.setValueAtTime(f0, s);
        o.frequency.exponentialRampToValueAtTime(f0 * (1.3 + Math.random() * 0.4), s + 0.06);
        g.gain.setValueAtTime(0.0001, s);
        g.gain.exponentialRampToValueAtTime(vol, s + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, s + 0.09);
        o.connect(g).connect(out);
        o.start(s); o.stop(s + 0.12);
      }
      timers.push(window.setTimeout(chirp, 1800 + Math.random() * 4500));
    };
    timers.push(window.setTimeout(chirp, 800));
  };
  // Sirisser om natta
  const crickets = (vol: number) => {
    const chirp = () => {
      const t = c.currentTime + 0.05;
      for (let i = 0; i < 3; i++) {
        const o = c.createOscillator();
        const g = c.createGain();
        o.frequency.value = 4400;
        const s = t + i * 0.07;
        g.gain.setValueAtTime(0.0001, s);
        g.gain.exponentialRampToValueAtTime(vol, s + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, s + 0.045);
        o.connect(g).connect(out);
        o.start(s); o.stop(s + 0.06);
      }
      timers.push(window.setTimeout(chirp, 700 + Math.random() * 1600));
    };
    timers.push(window.setTimeout(chirp, 500));
  };

  switch (kind) {
    case 'sea': waves(0.05); night ? crickets(0.01) : birds(0.012); break;
    case 'meadow': waves(0.02); night ? crickets(0.012) : birds(0.014); break;
    case 'forest': wind(0.012); night ? crickets(0.014) : birds(0.016); break;
    case 'mountain': wind(0.03); if (!night) birds(0.006); break;
    case 'city': wind(0.01); crickets(0.008); break;
  }

  return {
    kind,
    stop() {
      timers.forEach(clearTimeout);
      out.gain.setTargetAtTime(0, c.currentTime, 0.3);
      setTimeout(() => { stops.forEach((s) => { try { s(); } catch { /* ignorer */ } }); out.disconnect(); }, 1500);
    }
  };
}

function apply() {
  const on = unlocked && getState().settings.nature && !document.hidden;
  const kind = on ? wanted : 'none';
  if (current?.kind === kind) return;
  current?.stop();
  current = null;
  if (kind === 'none') return;
  try { current = build(kind); } catch { current = null; }
}

export function setAmbient(kind: Ambient) {
  wanted = kind;
  apply();
}

document.addEventListener('visibilitychange', apply);
// Nettlesere starter lyd først etter et trykk
window.addEventListener('pointerdown', () => { unlocked = true; if (wanted !== 'none' && !current) apply(); });

/** Spill naturlyd mens skjermen vises. */
export function useAmbient(kind: Ambient) {
  const nature = useStore((s) => s.settings.nature);
  useEffect(() => {
    setAmbient(kind);
    return () => { if (wanted === kind) setAmbient('none'); };
  }, [kind, nature]);
}
