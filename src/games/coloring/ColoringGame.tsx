/**
 * Fargeleggingsbok – velg en tegning, velg farge og trykk på en flate for å fylle den.
 * Magiske farger: regnbue, glitter, prikker og striper. Angre-knapp.
 * Tegningene lagres, så barnet kan fortsette senere. Alle tegninger er laget for Istrefi Games.
 */
import { Emo } from '../../components/Emo';
import { useEffect, useState } from 'react';
import type { GameProps } from '../types';
import { COLOR_PICS, type ColorPic } from './pictures';
import './coloring.css';

const PALETTE = ['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#2d6a4f', '#4cc9f0', '#1982c4', '#6a4c93', '#ff70a6', '#ffc8dd', '#8d5524', '#3d2618', '#adb5bd', '#23213a', '#ffffff'];
/** Magiske farger: SVG-mønstre som defineres i hver tegning */
const MAGIC = [
  { id: 'url(#cp-rainbow)', icon: '🌈' },
  { id: 'url(#cp-glitter)', icon: '✨' },
  { id: 'url(#cp-dots)', icon: '🔵' },
  { id: 'url(#cp-stripes)', icon: '🦓' }
];
type Fills = Record<number, string>;
interface Saved { fills: Record<string, Fills> }

function PaintDefs() {
  return (
    <defs>
      <linearGradient id="cp-rainbow" x1="0" x2="1" y1="0" y2="1">
        {['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'].map((c, i) => <stop key={c} offset={i / 5} stopColor={c} />)}
      </linearGradient>
      <pattern id="cp-glitter" width="24" height="24" patternUnits="userSpaceOnUse">
        <rect width="24" height="24" fill="#ffd6ff" />
        <path d="M6 2 L7.5 6 L11 7 L7.5 8.5 L6 12 L4.5 8.5 L1 7 L4.5 6 Z" fill="#ffd60a" />
        <circle cx="17" cy="16" r="2.2" fill="#fff" /><circle cx="19" cy="5" r="1.4" fill="#c77dff" /><circle cx="8" cy="19" r="1.2" fill="#4cc9f0" />
      </pattern>
      <pattern id="cp-dots" width="22" height="22" patternUnits="userSpaceOnUse">
        <rect width="22" height="22" fill="#caffbf" /><circle cx="6" cy="6" r="4" fill="#ff70a6" /><circle cx="17" cy="17" r="4" fill="#4cc9f0" />
      </pattern>
      <pattern id="cp-stripes" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="20" height="20" fill="#fff" /><rect width="10" height="20" fill="#23213a" />
      </pattern>
    </defs>
  );
}

export default function ColoringGame(props: GameProps) {
  const { api } = props;
  const [pic, setPic] = useState<ColorPic | null>(null);
  const [saved, setSaved] = useState<Saved>(() => api.loadData<Saved>() ?? { fills: {} });
  // ⬅️ går først tilbake til spillets egen meny
  useEffect(() => {
    api.setBack(pic !== null ? () => setPic(null) : null);
    return () => api.setBack(null);
  }, [pic]); // eslint-disable-line react-hooks/exhaustive-deps
  const store = (id: string, fills: Fills) => {
    const next = { fills: { ...saved.fills, [id]: fills } };
    setSaved(next);
    api.saveData(next);
  };
  if (!pic) {
    return (
      <div className="coloring-pick">
        <h2 className="level-picker__title">{api.t('choosePicture')}</h2>
        <div className="coloring-pick__grid">
          {COLOR_PICS.map((p, i) => (
            <button key={p.id} className="coloring-thumb pop-in" style={{ animationDelay: `${i * 0.04}s` }} onClick={() => { api.sfx('pop'); setPic(p); }}>
              <Drawing pic={p} fills={saved.fills[p.id] ?? {}} />
              <span className="coloring-thumb__icon"><Emo e={p.icon} /></span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  return <Painter {...props} pic={pic} initial={saved.fills[pic.id] ?? {}} onSave={(f) => store(pic.id, f)} />;
}

function Drawing({ pic, fills, onTap }: { pic: ColorPic; fills: Fills; onTap?: (i: number) => void }) {
  return (
    <svg viewBox="0 0 400 400" className="coloring-svg">
      <PaintDefs />
      {pic.shapes.map(([tag, attrs, fillable], i) => {
        const Tag = tag as 'path';
        const canFill = fillable !== false && attrs.fill !== 'none';
        return (
          <Tag
            key={i}
            {...(attrs as Record<string, string>)}
            fill={canFill ? fills[i] ?? '#fff' : 'none'}
            stroke="#23213a"
            strokeWidth={4}
            strokeLinejoin="round"
            strokeLinecap="round"
            onPointerDown={canFill && onTap ? (e) => { e.preventDefault(); onTap(i); } : undefined}
            style={{ cursor: canFill && onTap ? 'pointer' : 'default', transition: 'fill .25s' }}
          />
        );
      })}
    </svg>
  );
}

function Painter({ api, onFinish, pic, initial, onSave }: GameProps & { pic: ColorPic; initial: Fills; onSave: (f: Fills) => void }) {
  const [color, setColor] = useState(PALETTE[0]);
  const [fills, setFills] = useState<Fills>(initial);
  const [history, setHistory] = useState<Fills[]>([]);
  const filled = Object.keys(fills).length;
  const update = (f: Fills) => { setHistory((h) => [...h.slice(-30), fills]); setFills(f); onSave(f); };

  return (
    <div className="painter">
      <div className="painter__paper">
        <Drawing pic={pic} fills={fills} onTap={(i) => { api.sfx(color.startsWith('url') ? 'sticker' : 'pop'); update({ ...fills, [i]: color }); }} />
      </div>
      <div className="painter__bar">
        <div className="painter__palette">
          {MAGIC.map((m) => (
            <button key={m.id} className={`swatch swatch--magic ${color === m.id ? 'is-on' : ''}`} onClick={() => { api.sfx('sticker'); setColor(m.id); }} aria-label={m.icon}>
              <svg viewBox="0 0 40 40" aria-hidden><PaintDefs /><circle cx="20" cy="20" r="20" fill={m.id} /></svg>
            </button>
          ))}
          {PALETTE.map((c) => (
            <button key={c} className={`swatch ${color === c ? 'is-on' : ''}`} style={{ background: c }} onClick={() => { api.sfx('tap'); setColor(c); }} aria-label={c} />
          ))}
        </div>
        <div className="painter__actions">
          <button className="tool" onClick={() => { const prev = history[history.length - 1]; if (!prev) return; api.sfx('flip'); setHistory((h) => h.slice(0, -1)); setFills(prev); onSave(prev); }} disabled={!history.length} aria-label={api.t('undo')}>↩️</button>
          <button className="tool" onClick={() => { api.sfx('nope'); update({}); }} disabled={!filled} aria-label={api.t('clearAll')}>🗑️</button>
          <button className="tool tool--done" onClick={() => onFinish({ won: true, stars: 3, coins: 5 })} disabled={filled < 4} aria-label={api.t('done')}>✔</button>
        </div>
      </div>
    </div>
  );
}
