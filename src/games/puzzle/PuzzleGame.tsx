/**
 * Puslespill – velg et bilde, dra bitene på plass. Bitene "klikker" inn når de er nær riktig sted.
 * 2–4 år: 4 biter, 5–7 år: 9 biter, 8–11 år: 16 biter. Et svakt bilde i bakgrunnen hjelper.
 */
import { Emo } from '../../components/Emo';
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import type { GameProps } from '../types';
import { SCENES } from './scenes';
import './puzzle.css';

// Bildene tegnes av appen selv (emoji på fargerik bakgrunn), så de fungerer offline.
const PICTURES: { bg: [string, string]; main: string; deco: string[] }[] = [
  { bg: ['#8ee3ff', '#b7e4c7'], main: '🐶', deco: ['☀️', '🌼', '🦴'] },
  { bg: ['#ffd6a5', '#ffadad'], main: '🐱', deco: ['🧶', '🐟', '🌸'] },
  { bg: ['#caffbf', '#9bf6ff'], main: '🐸', deco: ['🪷', '🐞', '💧'] },
  { bg: ['#fdffb6', '#ffc6ff'], main: '🦄', deco: ['🌈', '⭐', '☁️'] },
  { bg: ['#a0c4ff', '#bdb2ff'], main: '🐳', deco: ['🫧', '🐠', '🌊'] },
  { bg: ['#ffe5b4', '#e9c46a'], main: '🦁', deco: ['🌴', '☀️', '🦋'] },
  { bg: ['#d8f3dc', '#95d5b2'], main: '🐢', deco: ['🍀', '🐌', '🌿'] },
  { bg: ['#ffc8dd', '#cdb4db'], main: '🐼', deco: ['🎋', '🍃', '🌙'] },
  { bg: ['#240046', '#5a189a'], main: '🚀', deco: ['🌟', '🪐', '🌙'] },
  { bg: ['#caf0f8', '#90e0ef'], main: '⛄', deco: ['❄️', '🎄', '🧣'] },
  { bg: ['#ffb4a2', '#e5989b'], main: '🦖', deco: ['🌋', '🥚', '🌿'] },
  { bg: ['#fff3b0', '#ffd166'], main: '🦅', deco: ['🏔️', '☁️', '☀️'] }
];

// Alle bilder: egne tegninger (SVG) først, så emoji-bilder.
type Pic = { id: string; svg?: string; emoji?: (typeof EMOJI_PICS)[number] };
const EMOJI_PICS = PICTURES;
const ALL_PICS: Pic[] = [
  ...SCENES.map((svg, i) => ({ id: `scene-${i}`, svg })),
  ...EMOJI_PICS.map((emoji, i) => ({ id: `emoji-${i}`, emoji }))
];

/** Tegner et bilde som vanlig HTML (emoji vises da riktig på iPhone/iPad). */
function PictureView({ pic, size }: { pic: Pic; size: number }) {
  if (pic.svg) return <img src={pic.svg} width={size} height={size} draggable={false} alt="" style={{ display: 'block', width: size, height: size }} />;
  const p = pic.emoji!;
  const spots = [[0.18, 0.18], [0.82, 0.2], [0.2, 0.82], [0.8, 0.82]];
  return (
    <div className="pic" style={{ width: size, height: size, background: `linear-gradient(135deg, ${p.bg[0]}, ${p.bg[1]})` }}>
      {p.deco.map((d, k) => (
        <span key={k} style={{ left: spots[k][0] * size, top: spots[k][1] * size, fontSize: size * 0.16 }}><Emo e={d} /></span>
      ))}
      <span style={{ left: size / 2, top: size * 0.54, fontSize: size * 0.55 }}><Emo e={p.main} /></span>
    </div>
  );
}

interface SavedData { solved: (number | string)[]; n?: number }
/** Antall biter på hver side som kan velges per alder (2 = 4 biter, 5 = 25 biter) */
const SIZES: Record<string, number[]> = { tiny: [2], small: [2, 3], mid: [3, 4, 5], big: [3, 4, 5] };
const DEFAULT_N: Record<string, number> = { tiny: 2, small: 3, mid: 4, big: 4 };

export default function PuzzleGame(props: GameProps) {
  const { api } = props;
  const [saved, setSaved] = useState<SavedData>(() => api.loadData<SavedData>() ?? { solved: [] });
  const [pic, setPic] = useState<Pic | null>(null);
  const sizes = SIZES[props.world] ?? [3];
  const n = saved.n && sizes.includes(saved.n) ? saved.n : DEFAULT_N[props.world] ?? 3;
  // ⬅️ går først tilbake til spillets egen meny
  useEffect(() => {
    api.setBack(pic !== null ? () => setPic(null) : null);
    return () => api.setBack(null);
  }, [pic]); // eslint-disable-line react-hooks/exhaustive-deps

  if (pic === null) {
    return (
      <div className="puzzle-pick">
        {sizes.length > 1 && (
          <div className="puzzle-sizes">
            {sizes.map((k) => (
              <button key={k} className={`puzzle-size ${n === k ? 'is-on' : ''}`} onClick={() => { api.sfx('tap'); const next = { ...saved, n: k }; setSaved(next); api.saveData(next); }}>
                <span className="puzzle-size__grid" style={{ gridTemplateColumns: `repeat(${k}, 1fr)` }}>{Array.from({ length: k * k }, (_, i) => <i key={i} />)}</span>
                <b>{k * k}</b>
              </button>
            ))}
          </div>
        )}
        <h2 className="level-picker__title">{api.t('choosePicture')}</h2>
        <div className="puzzle-pick__grid">
          {ALL_PICS.map((p, i) => (
            <button key={p.id} className="puzzle-thumb pop-in" style={{ animationDelay: `${Math.min(i, 12) * 0.03}s` }} onClick={() => { api.sfx('pop'); setPic(p); }}>
              <span className="puzzle-thumb__pic"><PictureView pic={p} size={132} /></span>
              {saved.solved.includes(p.id) && <span className="puzzle-thumb__done">✔</span>}
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <Board
      {...props}
      pic={pic}
      n={n}
      onSolved={() => {
        const first = !saved.solved.includes(pic.id);
        if (first) {
          const next = { ...saved, solved: [...saved.solved, pic.id] };
          setSaved(next);
          api.saveData(next);
        }
        return first;
      }}
    />
  );
}

interface Piece { id: number; r: number; c: number; x: number; y: number; placed: boolean }

function Board({ api, onFinish, pic, n, onSolved }: GameProps & { pic: Pic; n: number; onSolved: () => boolean }) {
  const [peek, setPeek] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);
  const [landscape, setLandscape] = useState(true);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const drag = useRef<{ id: number; dx: number; dy: number } | null>(null);
  const done = useRef(false);

  useLayoutEffect(() => {
    const el = wrapRef.current!;
    const ro = new ResizeObserver(() => {
      const land = el.clientWidth > el.clientHeight;
      setLandscape(land);
      setSize(Math.floor(land ? Math.min(el.clientHeight - 10, el.clientWidth * 0.55) : Math.min(el.clientWidth - 10, el.clientHeight * 0.55)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Legg bitene tilfeldig i "kurven" ved siden av brettet. Venter til størrelsen er målt.
  // Endres skjermen senere (f.eks. iPaden snus), beholdes bitene som er lagt, og de løse legges i kurven på nytt.
  useEffect(() => {
    if (!size) return;
    const cellNow = size / n;
    const trayW = landscape ? (wrapRef.current?.clientWidth ?? 600) - size - 30 : size;
    const trayH = landscape ? size : (wrapRef.current?.clientHeight ?? 600) - size - 30;
    const scatter = (p: Piece): Piece => {
      const tx = Math.random() * Math.max(10, trayW - cellNow);
      const ty = Math.random() * Math.max(10, trayH - cellNow);
      return { ...p, x: landscape ? size + 30 + tx : tx, y: landscape ? ty : size + 30 + ty };
    };
    setPieces((prev) => {
      if (prev.length) return prev.map((p) => (p.placed ? { ...p, x: p.c * cellNow, y: p.r * cellNow } : scatter(p)));
      const list: Piece[] = [];
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) list.push({ id: r * n + c, r, c, x: 0, y: 0, placed: false });
      return list.sort(() => Math.random() - 0.5).map(scatter);
    });
  }, [size, landscape, n]);

  const cell = size / n;

  function down(e: RPointerEvent, p: Piece) {
    if (p.placed) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { id: p.id, dx: e.clientX - p.x, dy: e.clientY - p.y };
    api.sfx('tap');
    setPieces((ps) => [...ps.filter((q) => q.id !== p.id), p]); // øverst
  }
  function move(e: RPointerEvent) {
    const d = drag.current;
    if (!d) return;
    setPieces((ps) => ps.map((q) => (q.id === d.id ? { ...q, x: e.clientX - d.dx, y: e.clientY - d.dy } : q)));
  }
  function up() {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    setPieces((ps) => {
      const next = ps.map((q) => {
        if (q.id !== d.id) return q;
        const tx = q.c * cell, ty = q.r * cell;
        if (Math.hypot(q.x - tx, q.y - ty) < cell * 0.4) {
          api.sfx('pop');
          return { ...q, x: tx, y: ty, placed: true };
        }
        return q;
      });
      if (!done.current && next.every((q) => q.placed)) {
        done.current = true;
        api.sfx('win');
        const firstClear = onSolved();
        setTimeout(() => onFinish({ won: true, stars: 3, firstClear }), 1100);
      }
      return next;
    });
  }

  return (
    <div className="puzzle" ref={wrapRef} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <button className="puzzle__peek" onClick={() => { api.sfx('flip'); setPeek(true); setTimeout(() => setPeek(false), 2500); }} aria-label={api.t('showPicture')}>👁️</button>
      <div className={`puzzle__board ${peek ? 'is-peek' : ''}`} ref={boardRef} style={{ width: size, height: size }}>
        <PictureView pic={pic} size={size} />
        {Array.from({ length: n * n }, (_, i) => (
          <span key={i} className="puzzle__slot" style={{ left: (i % n) * cell, top: Math.floor(i / n) * cell, width: cell, height: cell }} />
        ))}
      </div>
      {pieces.map((p) => (
        <span
          key={p.id}
          className={`puzzle__piece ${p.placed ? 'is-placed' : ''}`}
          style={{ left: p.x, top: p.y, width: cell, height: cell }}
          data-pos={`${p.c * cell} ${p.r * cell}`}
          onPointerDown={(e) => down(e, p)}
        >
          <span className="puzzle__piece-pic" style={{ left: -p.c * cell, top: -p.r * cell }}>
            <PictureView pic={pic} size={size} />
          </span>
        </span>
      ))}
    </div>
  );
}
