/**
 * Puslespill – velg et bilde, dra bitene på plass. Bitene "klikker" inn når de er nær riktig sted.
 * 2–4 år: 4 biter, 5–7 år: 9 biter, 8–11 år: 16 biter. Et svakt bilde i bakgrunnen hjelper.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import type { GameProps } from '../types';
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

function renderPicture(i: number, size: number): string {
  const p = PICTURES[i];
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, p.bg[0]);
  grad.addColorStop(1, p.bg[1]);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const spots = [[0.18, 0.18], [0.82, 0.2], [0.2, 0.82], [0.8, 0.82]];
  p.deco.forEach((d, k) => { g.font = `${size * 0.16}px serif`; g.fillText(d, size * spots[k][0], size * spots[k][1]); });
  g.font = `${size * 0.55}px serif`;
  g.fillText(p.main, size / 2, size * 0.54);
  return c.toDataURL('image/png');
}

interface SavedData { solved: number[] }

export default function PuzzleGame(props: GameProps) {
  const { api } = props;
  const [saved, setSaved] = useState<SavedData>(() => api.loadData<SavedData>() ?? { solved: [] });
  const [pic, setPic] = useState<number | null>(null);
  const thumbs = useMemo(() => PICTURES.map((_, i) => renderPicture(i, 160)), []);

  if (pic === null) {
    return (
      <div className="puzzle-pick">
        <h2 className="level-picker__title">{api.t('choosePicture')}</h2>
        <div className="puzzle-pick__grid">
          {thumbs.map((src, i) => (
            <button key={i} className="puzzle-thumb pop-in" style={{ animationDelay: `${i * 0.03}s` }} onClick={() => { api.sfx('pop'); setPic(i); }}>
              <img src={src} alt="" />
              {saved.solved.includes(i) && <span className="puzzle-thumb__done">✔</span>}
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
      onSolved={() => {
        const first = !saved.solved.includes(pic);
        if (first) {
          const next = { solved: [...saved.solved, pic] };
          setSaved(next);
          api.saveData(next);
        }
        return first;
      }}
    />
  );
}

interface Piece { id: number; r: number; c: number; x: number; y: number; placed: boolean }

function Board({ world, api, onFinish, pic, onSolved }: GameProps & { pic: number; onSolved: () => boolean }) {
  const n = world === 'tiny' ? 2 : world === 'small' ? 3 : 4;
  const wrapRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(300);
  const [landscape, setLandscape] = useState(true);
  const img = useMemo(() => renderPicture(pic, 800), [pic]);
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

  // Legg bitene tilfeldig i "kurven" ved siden av brettet (første gang).
  // Endres skjermstørrelsen senere (f.eks. iPaden snus), skaleres posisjonene i stedet.
  const prevSize = useRef(0);
  useEffect(() => {
    const cellNow = size / n;
    if (prevSize.current && pieces.length) {
      const k = size / prevSize.current;
      setPieces((ps) => ps.map((p) => (p.placed ? { ...p, x: p.c * cellNow, y: p.r * cellNow } : { ...p, x: p.x * k, y: p.y * k })));
      prevSize.current = size;
      return;
    }
    prevSize.current = size;
    const list: Piece[] = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) list.push({ id: r * n + c, r, c, x: 0, y: 0, placed: false });
    const shuffled = list.sort(() => Math.random() - 0.5);
    const trayW = landscape ? (wrapRef.current?.clientWidth ?? 600) - size - 30 : size;
    const trayH = landscape ? size : (wrapRef.current?.clientHeight ?? 600) - size - 30;
    shuffled.forEach((p) => {
      const tx = Math.random() * Math.max(10, trayW - cellNow);
      const ty = Math.random() * Math.max(10, trayH - cellNow);
      p.x = landscape ? size + 30 + tx : tx;
      p.y = landscape ? ty : size + 30 + ty;
    });
    setPieces(shuffled);
    done.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="puzzle__board" ref={boardRef} style={{ width: size, height: size, backgroundImage: `url(${img})` }}>
        {Array.from({ length: n * n }, (_, i) => (
          <span key={i} className="puzzle__slot" style={{ left: (i % n) * cell, top: Math.floor(i / n) * cell, width: cell, height: cell }} />
        ))}
      </div>
      {pieces.map((p) => (
        <span
          key={p.id}
          className={`puzzle__piece ${p.placed ? 'is-placed' : ''}`}
          style={{
            left: p.x, top: p.y, width: cell, height: cell,
            backgroundImage: `url(${img})`, backgroundSize: `${size}px ${size}px`, backgroundPosition: `${-p.c * cell}px ${-p.r * cell}px`
          }}
          onPointerDown={(e) => down(e, p)}
        />
      ))}
    </div>
  );
}
