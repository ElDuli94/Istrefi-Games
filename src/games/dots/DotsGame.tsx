/**
 * Prikk til prikk – trykk eller dra fra 1 til siste tall, så kommer en figur fram.
 */
import { Emo, emojiUrl } from '../../components/Emo';
import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import type { GameProps } from '../types';
import { DOT_FIGS, type DotFig } from './figures';
import './dots.css';

interface SavedData { done: string[] }

export default function DotsGame(props: GameProps) {
  const { api } = props;
  const [saved, setSaved] = useState<SavedData>(() => api.loadData<SavedData>() ?? { done: [] });
  const [fig, setFig] = useState<DotFig | null>(null);
  // ⬅️ går først tilbake til spillets egen meny
  useEffect(() => {
    api.setBack(fig !== null ? () => setFig(null) : null);
    return () => api.setBack(null);
  }, [fig]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!fig) {
    return (
      <div className="dots-pick">
        <h2 className="level-picker__title">{api.t('choosePicture')}</h2>
        <div className="dots-pick__grid">
          {DOT_FIGS.map((f, i) => (
            <button key={f.id} className={`dots-thumb pop-in ${saved.done.includes(f.id) ? 'is-done' : ''}`} style={{ animationDelay: `${i * 0.04}s` }} onClick={() => { api.sfx('pop'); setFig(f); }}>
              {saved.done.includes(f.id) ? <span className="dots-thumb__emoji"><Emo e={f.emoji} /></span> : <span className="dots-thumb__q">{f.pts.length}</span>}
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <Board
      {...props}
      fig={fig}
      onDone={() => {
        const first = !saved.done.includes(fig.id);
        if (first) { const next = { done: [...saved.done, fig.id] }; setSaved(next); api.saveData(next); }
        return first;
      }}
    />
  );
}

function Board({ api, onFinish, fig, onDone }: GameProps & { fig: DotFig; onDone: () => boolean }) {
  const [n, setN] = useState(1); // antall prikker som er koblet (første er "startet")
  const [wrong, setWrong] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const done = n > fig.pts.length;
  const finished = useRef(false);

  // Gjør skjermkoordinater om til tegningens egne koordinater (tar hensyn til viewBox og skalering)
  function toUnits(e: { clientX: number; clientY: number }): [number, number] {
    const svg = svgRef.current!;
    const ctm = svg.getScreenCTM();
    if (!ctm) return [-100, -100];
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(ctm.inverse());
    return [p.x, p.y];
  }
  function tryHit(e: RPointerEvent) {
    if (done) return;
    const [x, y] = toUnits(e);
    const target = n < fig.pts.length ? fig.pts[n] : fig.pts[0];
    // Stort treffområde: trykk 12 enheter unna (ved dra: 9) teller som treff
    const radius = e.type === 'pointerdown' ? 12 : 9;
    if (Math.hypot(target[0] - x, target[1] - y) < radius) {
      api.sfx('pop');
      api.speak(String(n < fig.pts.length ? n + 1 : 1));
      const next = n + 1;
      setN(next);
      if (next > fig.pts.length && !finished.current) {
        finished.current = true;
        api.sfx('win');
        setTimeout(() => api.speak(fig.name[api.lang]), 500);
        const firstClear = onDone();
        setTimeout(() => onFinish({ won: true, stars: 3, firstClear }), 2200);
      }
      return;
    }
    // Trykk på feil prikk (bare ved trykk, ikke under dra)
    if (e.type === 'pointerdown') {
      const hit = fig.pts.findIndex(([px, py], i) => i !== n && Math.hypot(px - x, py - y) < 5);
      if (hit >= 0) { api.sfx('nope'); setWrong(hit); setTimeout(() => setWrong(null), 400); }
    }
  }

  const connected = fig.pts.slice(0, Math.min(n, fig.pts.length));
  const linePts = [...connected, ...(done ? [fig.pts[0]] : [])].map(([x, y]) => `${x},${y}`).join(' ');

  return (
    <div className="dots">
      <svg
        ref={svgRef}
        viewBox="-4 -4 108 108"
        className={`dots__svg ${done ? 'is-done' : ''}`}
        onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); tryHit(e); }}
        onPointerMove={(e) => { if (e.buttons || e.pointerType === 'touch') tryHit(e); }}
      >
        {done && <polygon points={fig.pts.map(([x, y]) => `${x},${y}`).join(' ')} fill={fig.color} className="dots__fill" />}
        <polyline points={linePts} fill="none" stroke="#23213a" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
        {!done && fig.pts.map(([x, y], i) => {
          const state = i < n ? 'done' : i === n ? 'next' : 'todo';
          return (
            <g key={i} className={`dot is-${state} ${wrong === i ? 'is-wrong' : ''}`}>
              {state === 'next' && <circle cx={x} cy={y} r={7} className="dot__ring" />}
              <circle cx={x} cy={y} r={state === 'next' ? 3.8 : 2.8} />
              <text x={x} y={y - 5.2} textAnchor="middle">{i + 1}</text>
            </g>
          );
        })}
        {!done && n === fig.pts.length && <circle cx={fig.pts[0][0]} cy={fig.pts[0][1]} r={4.5} className="dot-back" />}
        {done && (emojiUrl(fig.emoji)
          ? <image href={emojiUrl(fig.emoji)!} x={36} y={36} width={28} height={28} className="dots__emoji" />
          : <text x={50} y={58} textAnchor="middle" className="dots__emoji">{fig.emoji}</text>)}
      </svg>
      {done && <div className="dots__name pop-in">{fig.name[api.lang]}!</div>}
    </div>
  );
}
