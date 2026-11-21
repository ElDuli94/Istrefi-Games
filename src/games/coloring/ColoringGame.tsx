/**
 * Fargeleggingsbok – velg en tegning, velg farge og trykk på en flate for å fylle den.
 * Alle tegninger er laget for Istrefi Games.
 */
import { Emo } from '../../components/Emo';
import { useState } from 'react';
import type { GameProps } from '../types';
import { COLOR_PICS, type ColorPic } from './pictures';
import './coloring.css';

const PALETTE = ['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#2d6a4f', '#4cc9f0', '#1982c4', '#6a4c93', '#ff70a6', '#ffc8dd', '#8d5524', '#3d2618', '#adb5bd', '#23213a', '#ffffff'];

export default function ColoringGame(props: GameProps) {
  const { api } = props;
  const [pic, setPic] = useState<ColorPic | null>(null);
  if (!pic) {
    return (
      <div className="coloring-pick">
        <h2 className="level-picker__title">{api.t('choosePicture')}</h2>
        <div className="coloring-pick__grid">
          {COLOR_PICS.map((p, i) => (
            <button key={p.id} className="coloring-thumb pop-in" style={{ animationDelay: `${i * 0.04}s` }} onClick={() => { api.sfx('pop'); setPic(p); }}>
              <Drawing pic={p} fills={{}} />
              <span className="coloring-thumb__icon"><Emo e={p.icon} /></span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  return <Painter {...props} pic={pic} />;
}

function Drawing({ pic, fills, onTap }: { pic: ColorPic; fills: Record<number, string>; onTap?: (i: number) => void }) {
  return (
    <svg viewBox="0 0 400 400" className="coloring-svg">
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

function Painter({ api, onFinish, pic }: GameProps & { pic: ColorPic }) {
  const [color, setColor] = useState(PALETTE[0]);
  const [fills, setFills] = useState<Record<number, string>>({});
  const filled = Object.keys(fills).length;

  return (
    <div className="painter">
      <div className="painter__paper">
        <Drawing pic={pic} fills={fills} onTap={(i) => { api.sfx('pop'); setFills((f) => ({ ...f, [i]: color })); }} />
      </div>
      <div className="painter__bar">
        <div className="painter__palette">
          {PALETTE.map((c) => (
            <button key={c} className={`swatch ${color === c ? 'is-on' : ''}`} style={{ background: c }} onClick={() => { api.sfx('tap'); setColor(c); }} aria-label={c} />
          ))}
        </div>
        <div className="painter__actions">
          <button className="tool" onClick={() => { api.sfx('nope'); setFills({}); }} disabled={!filled} aria-label={api.t('clearAll')}>🗑️</button>
          <button className="tool tool--done" onClick={() => onFinish({ won: true, stars: 3, coins: 5 })} disabled={filled < 4} aria-label={api.t('done')}>✔</button>
        </div>
      </div>
    </div>
  );
}
