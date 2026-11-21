/**
 * Musikkleker – piano, xylofon og trommer. Fri lek med lyd, farger og dansende noter.
 */
import { useState } from 'react';
import type { GameProps } from '../types';
import { playNote, playDrum, type Drum } from '../../audio/sound';
import './music.css';

const NOTES = [
  { f: 261.63, n: 'C', c: '#ff595e', a: '🐶' }, { f: 293.66, n: 'D', c: '#ff924c', a: '🐱' }, { f: 329.63, n: 'E', c: '#ffca3a', a: '🐥' },
  { f: 349.23, n: 'F', c: '#8ac926', a: '🐸' }, { f: 392.0, n: 'G', c: '#52a675', a: '🐢' }, { f: 440.0, n: 'A', c: '#1982c4', a: '🐳' },
  { f: 493.88, n: 'H', c: '#4267ac', a: '🦋' }, { f: 523.25, n: 'C', c: '#6a4c93', a: '🦄' }
];
const DRUMS: { kind: Drum; icon: string; c: string }[] = [
  { kind: 'kick', icon: '🥁', c: '#ff595e' }, { kind: 'snare', icon: '🪘', c: '#ffca3a' }, { kind: 'hihat', icon: '✨', c: '#8ac926' },
  { kind: 'clap', icon: '👏', c: '#1982c4' }, { kind: 'tom', icon: '🎵', c: '#6a4c93' }, { kind: 'bell', icon: '🔔', c: '#ff70a6' }
];

export default function MusicGame({ api, onFinish }: GameProps) {
  const [tab, setTab] = useState<'piano' | 'xylo' | 'drums'>('piano');
  const [taps, setTaps] = useState(0);
  const [hit, setHit] = useState<{ key: string; t: number } | null>(null);
  const [notes, setNotes] = useState<{ id: number; x: number; s: string }[]>([]);

  function flash(key: string, x: number) {
    const t = Date.now();
    setHit({ key, t });
    setTimeout(() => setHit((h) => (h && h.t === t ? { key: '', t } : h)), 180);
    setTaps((n) => n + 1);
    const id = Math.random();
    setNotes((ns) => [...ns.slice(-10), { id, x, s: ['🎵', '🎶', '⭐', '💖'][Math.floor(Math.random() * 4)] }]);
    setTimeout(() => setNotes((ns) => ns.filter((n) => n.id !== id)), 1200);
  }

  return (
    <div className="music">
      <nav className="music__tabs">
        {([['piano', '🎹', 'piano'], ['xylo', '🌈', 'xylophone'], ['drums', '🥁', 'drums']] as const).map(([id, icon, key]) => (
          <button key={id} className={tab === id ? 'is-active' : ''} onClick={() => { api.sfx('tap'); setTab(id); }} aria-label={api.t(key)}>
            <span>{icon}</span><small>{api.t(key)}</small>
          </button>
        ))}
        {taps >= 20 && <button className="music__done pop-in" onClick={() => onFinish({ won: true, stars: 3, coins: 5 })}>✔</button>}
      </nav>
      <div className="music__stage">
        <div className="music__notes" aria-hidden>{notes.map((n) => <span key={n.id} style={{ left: `${n.x}%` }}>{n.s}</span>)}</div>
        {tab === 'piano' && (
          <div className="piano">
            {NOTES.map((n, i) => (
              <button
                key={i}
                className={`piano__key ${hit?.key === `p${i}` ? 'is-hit' : ''}`}
                style={{ ['--c' as string]: n.c }}
                onPointerDown={() => { playNote(n.f, 'piano'); flash(`p${i}`, (i + 0.5) * 12.5); }}
                aria-label={n.n}
              >
                <span key={hit?.key === `p${i}` ? hit.t : 0} className="piano__animal">{n.a}</span>
                <span className="piano__dot" />
              </button>
            ))}
          </div>
        )}
        {tab === 'xylo' && (
          <div className="xylo">
            {NOTES.map((n, i) => (
              <button
                key={i}
                className={`xylo__bar ${hit?.key === `x${i}` ? 'is-hit' : ''}`}
                style={{ background: n.c, height: `${92 - i * 7}%` }}
                onPointerDown={() => { playNote(n.f, 'xylo'); flash(`x${i}`, (i + 0.5) * 12.5); }}
                aria-label={n.n}
              >
                <i /><i />
              </button>
            ))}
          </div>
        )}
        {tab === 'drums' && (
          <div className="drums">
            {DRUMS.map((d, i) => (
              <button
                key={d.kind}
                className={`drum ${hit?.key === d.kind ? 'is-hit' : ''}`}
                style={{ background: d.c }}
                onPointerDown={() => { playDrum(d.kind); flash(d.kind, ((i % 3) + 0.5) * 33); }}
                aria-label={d.kind}
              >
                <span key={hit?.key === d.kind ? hit.t : 0}>{d.icon}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
