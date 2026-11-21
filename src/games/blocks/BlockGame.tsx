/**
 * Klossmester – dra klosser inn på brettet. Fulle rader og kolonner forsvinner og gir poeng.
 * Nivåer: nå målpoengsummen før brettet blir fullt. Uendelig modus: slå rekorden din.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import type { GameProps } from '../types';
import type { WorldId } from '../../data/worlds';
import { LevelGrid, advanceGrid, emptyGridProgress, type GridProgress } from '../common/LevelGrid';
import './blocks.css';

const N = 8;
const LEVELS = 15;
type Cell = string | null; // farge, eller null = tom
interface Piece { id: number; cells: [number, number][]; color: string; w: number; h: number }

// ---- Klosseformer ----
const raw: Record<string, [number, number][]> = {
  o1: [[0, 0]],
  i2: [[0, 0], [0, 1]], i2v: [[0, 0], [1, 0]],
  i3: [[0, 0], [0, 1], [0, 2]], i3v: [[0, 0], [1, 0], [2, 0]],
  l3a: [[0, 0], [1, 0], [1, 1]], l3b: [[0, 1], [1, 0], [1, 1]], l3c: [[0, 0], [0, 1], [1, 0]], l3d: [[0, 0], [0, 1], [1, 1]],
  o2: [[0, 0], [0, 1], [1, 0], [1, 1]],
  i4: [[0, 0], [0, 1], [0, 2], [0, 3]], i4v: [[0, 0], [1, 0], [2, 0], [3, 0]],
  t4a: [[0, 0], [0, 1], [0, 2], [1, 1]], t4b: [[0, 1], [1, 0], [1, 1], [1, 2]], t4c: [[0, 0], [1, 0], [2, 0], [1, 1]], t4d: [[0, 1], [1, 1], [2, 1], [1, 0]],
  l4a: [[0, 0], [1, 0], [2, 0], [2, 1]], l4b: [[0, 0], [0, 1], [0, 2], [1, 0]], l4c: [[0, 0], [0, 1], [1, 1], [2, 1]], l4d: [[1, 0], [1, 1], [1, 2], [0, 2]],
  s4a: [[0, 1], [0, 2], [1, 0], [1, 1]], s4b: [[0, 0], [1, 0], [1, 1], [2, 1]], z4a: [[0, 0], [0, 1], [1, 1], [1, 2]], z4b: [[0, 1], [1, 0], [1, 1], [2, 0]],
  i5: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], i5v: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
  r23: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]], r32: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]],
  o3: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
  bigL: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]]
};
const EASY = ['o1', 'i2', 'i2v', 'i3', 'i3v', 'l3a', 'l3b', 'l3c', 'l3d', 'o2'];
const NORMAL = [...EASY, 'i4', 'i4v', 't4a', 't4b', 't4c', 't4d', 'l4a', 'l4b', 'l4c', 'l4d', 's4a', 's4b', 'z4a', 'z4b'];
const HARD = [...NORMAL, 'i5', 'i5v', 'r23', 'r32', 'o3', 'bigL'];
const COLORS = ['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#2ec4b6', '#1982c4', '#6a4c93', '#ff70a6'];

interface Cfg { pool: string[]; target: number; stones: number }
function levelCfg(world: WorldId, lvl: number): Cfg {
  if (world === 'small' || world === 'tiny') return { pool: lvl < 8 ? EASY : NORMAL.slice(0, 18), target: 50 + lvl * 25, stones: lvl < 5 ? 0 : Math.min(8, lvl - 3) };
  if (world === 'mid') return { pool: lvl < 5 ? NORMAL : HARD.slice(0, NORMAL.length + 4), target: 100 + lvl * 40, stones: lvl < 3 ? 0 : Math.min(14, 2 + lvl) };
  return { pool: lvl < 3 ? NORMAL : HARD, target: 160 + lvl * 60, stones: lvl < 2 ? 0 : Math.min(18, 3 + lvl) };
}

let pid = 1;
function makePiece(pool: string[]): Piece {
  const cells = raw[pool[Math.floor(Math.random() * pool.length)]];
  return {
    id: pid++,
    cells,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    w: Math.max(...cells.map((c) => c[1])) + 1,
    h: Math.max(...cells.map((c) => c[0])) + 1
  };
}

const idx = (r: number, c: number) => r * N + c;
function fits(board: Cell[], p: Piece, r: number, c: number) {
  return p.cells.every(([dr, dc]) => {
    const rr = r + dr, cc = c + dc;
    return rr >= 0 && rr < N && cc >= 0 && cc < N && !board[idx(rr, cc)];
  });
}
function fitsAnywhere(board: Cell[], p: Piece) {
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (fits(board, p, r, c)) return true;
  return false;
}
/** Hvilke rader/kolonner blir fulle hvis brikken legges her */
function fullLines(board: Cell[]) {
  const rows: number[] = [], cols: number[] = [];
  for (let i = 0; i < N; i++) {
    if (Array.from({ length: N }, (_, j) => board[idx(i, j)]).every(Boolean)) rows.push(i);
    if (Array.from({ length: N }, (_, j) => board[idx(j, i)]).every(Boolean)) cols.push(i);
  }
  return { rows, cols };
}
function newTray(board: Cell[], pool: string[]): Piece[] {
  // Barnevennlig: sørg for at minst én av de nye klossene får plass
  for (let tries = 0; tries < 30; tries++) {
    const t = [makePiece(pool), makePiece(pool), makePiece(pool)];
    if (t.some((p) => fitsAnywhere(board, p))) return t;
  }
  return [makePiece(['o1']), makePiece(pool), makePiece(pool)];
}
function stonesBoard(count: number): Cell[] {
  const b: Cell[] = Array(N * N).fill(null);
  let placed = 0, guard = 0;
  while (placed < count && guard++ < 500) {
    const i = Math.floor(Math.random() * N * N);
    if (b[i]) continue;
    b[i] = 'stone';
    const { rows, cols } = fullLines(b);
    if (rows.length || cols.length) b[i] = null;
    else placed++;
  }
  return b;
}

interface Drag { piece: Piece; slot: number; x: number; y: number; offY: number }

export default function BlockGame(props: GameProps) {
  const { api } = props;
  const [progress, setProgress] = useState<GridProgress>(() => api.loadData<GridProgress>() ?? emptyGridProgress());
  const [mode, setMode] = useState<number | 'endless' | null>(null);
  const save = (p: GridProgress) => { setProgress(p); api.saveData(p); };

  if (mode === null) {
    return (
      <LevelGrid
        api={api}
        count={LEVELS}
        progress={progress}
        onPick={setMode}
        extra={
          <button className="mode-btn" onClick={() => { api.sfx('pop'); setMode('endless'); }}>
            ♾️ {api.t('endless')} {progress.highscore ? `· 🏆 ${progress.highscore}` : ''}
          </button>
        }
      />
    );
  }
  return (
    <Board
      {...props}
      level={mode === 'endless' ? null : mode}
      highscore={progress.highscore ?? 0}
      onEnd={(won, stars, score) => {
        if (mode === 'endless') {
          if (score > (progress.highscore ?? 0)) save({ ...progress, highscore: score });
          return false;
        }
        const { next, firstClear } = advanceGrid(progress, mode, won, stars, LEVELS);
        save(next);
        return firstClear;
      }}
    />
  );
}

function Board({ api, world, onFinish, level, highscore, onEnd }: GameProps & {
  level: number | null; highscore: number; onEnd: (won: boolean, stars: number, score: number) => boolean;
}) {
  const cfg = useMemo(() => (level === null ? { pool: world === 'small' ? NORMAL : HARD, target: Infinity, stones: 0 } : levelCfg(world, level)), [world, level]);
  const [board, setBoard] = useState<Cell[]>(() => stonesBoard(cfg.stones));
  const [tray, setTray] = useState<(Piece | null)[]>(() => newTray(board, cfg.pool));
  const [score, setScore] = useState(0);
  const [used, setUsed] = useState(0);
  const [combo, setCombo] = useState(0);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [clearing, setClearing] = useState<Set<number>>(new Set());
  const [pops, setPops] = useState<{ id: number; text: string; big?: boolean }[]>([]);
  const [over, setOver] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [cell, setCell] = useState(40);
  const dragRef = useRef<Drag | null>(null);
  const ended = useRef(false);

  useLayoutEffect(() => {
    const el = wrapRef.current!;
    const ro = new ResizeObserver(() => {
      const landscape = el.clientWidth > el.clientHeight * 1.15;
      const availW = landscape ? el.clientWidth * 0.62 : el.clientWidth;
      const availH = landscape ? el.clientHeight : el.clientHeight * 0.68;
      setCell(Math.floor(Math.max(22, Math.min(availW, availH) - 24) / N));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Hvor havner brikken? (øvre venstre hjørne av brikken under fingeren)
  function target(d: Drag) {
    const r = boardRef.current?.getBoundingClientRect();
    if (!r) return null;
    const pad = 6;
    const left = d.x - (d.piece.w * cell) / 2 - r.left - pad;
    const top = d.y - d.offY - (d.piece.h * cell) / 2 - r.top - pad;
    const c = Math.round(left / cell), rr = Math.round(top / cell);
    return fits(board, d.piece, rr, c) ? { r: rr, c } : null;
  }

  function start(e: RPointerEvent, slot: number) {
    const piece = tray[slot];
    if (!piece || over) return;
    e.preventDefault();
    api.sfx('tap');
    const offY = e.pointerType === 'mouse' ? 0 : cell * 2.2; // løft brikken over fingeren
    const d = { piece, slot, x: e.clientX, y: e.clientY, offY };
    dragRef.current = d;
    setDrag(d);
    const move = (ev: PointerEvent) => {
      dragRef.current = { ...dragRef.current!, x: ev.clientX, y: ev.clientY };
      setDrag(dragRef.current);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      const cur = dragRef.current!;
      dragRef.current = null;
      setDrag(null);
      const t = target(cur);
      if (t) place(cur, t.r, t.c);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  function pop(text: string, big = false) {
    const id = Math.random();
    setPops((p) => [...p, { id, text, big }]);
    setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 1100);
  }

  function place(d: Drag, r: number, c: number) {
    const b = [...board];
    d.piece.cells.forEach(([dr, dc]) => (b[idx(r + dr, c + dc)] = d.piece.color));
    api.sfx('pop');
    let gained = d.piece.cells.length;
    const { rows, cols } = fullLines(b);
    const lines = rows.length + cols.length;
    let nextCombo = 0;
    let finalBoard = b;
    if (lines) {
      nextCombo = combo + 1;
      const clear = new Set<number>();
      rows.forEach((rr) => { for (let j = 0; j < N; j++) clear.add(idx(rr, j)); });
      cols.forEach((cc) => { for (let j = 0; j < N; j++) clear.add(idx(j, cc)); });
      const bonus = Math.round(10 * lines * lines * (1 + (nextCombo - 1) * 0.5));
      gained += bonus;
      finalBoard = b.map((v, i) => (clear.has(i) ? null : v));
      setClearing(clear);
      setTimeout(() => setClearing(new Set()), 350);
      api.sfx(lines > 1 || nextCombo > 1 ? 'win' : 'match');
      pop(`+${bonus}`);
      if (nextCombo > 1) pop(`${api.t('combo')} ×${nextCombo}!`, true);
    }
    setCombo(nextCombo);
    const newScore = score + gained;
    setScore(newScore);
    const newUsed = used + 1;
    setUsed(newUsed);
    setBoard(lines ? b : finalBoard);
    if (lines) setTimeout(() => setBoard(finalBoard), 330);

    let t = tray.map((p, i) => (i === d.slot ? null : p));
    if (t.every((p) => !p)) t = newTray(finalBoard, cfg.pool);
    setTray(t);

    // Vunnet?
    if (newScore >= cfg.target && !ended.current) {
      ended.current = true;
      const par = cfg.target / 9;
      const stars = newUsed <= par ? 3 : newUsed <= par * 1.4 ? 2 : 1;
      const firstClear = onEnd(true, stars, newScore);
      api.speak(api.t('levelDone'));
      setTimeout(() => onFinish({ won: true, stars, score: newScore, firstClear }), 900);
      return;
    }
    // Tapt? (ingen av de gjenværende klossene får plass)
    const left = t.filter(Boolean) as Piece[];
    if (!left.some((p) => fitsAnywhere(finalBoard, p))) {
      ended.current = true;
      setOver(true);
      api.speak(api.t('noMoves'));
      setTimeout(() => {
        if (level === null) {
          onEnd(false, 0, newScore);
          const stars = newScore >= 600 ? 3 : newScore >= 300 ? 2 : newScore >= 100 ? 1 : 0;
          onFinish({ won: stars > 0, stars, score: newScore, coins: Math.min(25, Math.floor(newScore / 40)) });
        } else {
          onEnd(false, 0, newScore);
          onFinish({ won: false, stars: 0, score: newScore });
        }
      }, 1500);
    }
  }

  // Forhåndsvisning av plassering
  const tgt = drag ? target(drag) : null;
  const previewCells = new Set<number>();
  const previewClear = new Set<number>();
  if (drag && tgt) {
    const b = [...board];
    drag.piece.cells.forEach(([dr, dc]) => { const i = idx(tgt.r + dr, tgt.c + dc); previewCells.add(i); b[i] = drag.piece.color; });
    const { rows, cols } = fullLines(b);
    rows.forEach((rr) => { for (let j = 0; j < N; j++) previewClear.add(idx(rr, j)); });
    cols.forEach((cc) => { for (let j = 0; j < N; j++) previewClear.add(idx(j, cc)); });
  }

  useEffect(() => { api.speak(api.t('game_blocks')); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const progressPct = level === null ? 0 : Math.min(100, (score / cfg.target) * 100);
  const mini = Math.max(14, Math.floor(cell * 0.5));

  return (
    <div className="blocks" ref={wrapRef}>
      <div className="blocks__hud">
        {level === null ? (
          <>
            <span className="hud-chip">⭐ {api.t('score')}: <b>{score}</b></span>
            <span className="hud-chip">🏆 {api.t('best')}: <b>{Math.max(highscore, score)}</b></span>
          </>
        ) : (
          <>
            <span className="hud-chip">{api.t('target')}: <b>{score} / {cfg.target}</b></span>
            <span className="blocks__bar"><i style={{ width: `${progressPct}%` }} /></span>
          </>
        )}
      </div>
      <div className="blocks__main">
        <div className="blocks__board" ref={boardRef} style={{ gridTemplateColumns: `repeat(${N}, ${cell}px)`, gridAutoRows: `${cell}px` }}>
          {board.map((v, i) => {
            const preview = previewCells.has(i);
            const color = v === 'stone' ? undefined : v ?? (preview ? drag!.piece.color : undefined);
            return (
              <span
                key={i}
                className={`bcell ${v ? 'is-filled' : ''} ${v === 'stone' ? 'is-stone' : ''} ${preview ? 'is-preview' : ''} ${previewClear.has(i) ? 'is-willclear' : ''} ${clearing.has(i) ? 'is-clearing' : ''}`}
                style={color ? { background: color } : undefined}
              />
            );
          })}
          <div className="blocks__pops">
            {pops.map((p) => <span key={p.id} className={`bpop ${p.big ? 'bpop--big' : ''}`}>{p.text}</span>)}
          </div>
          {over && <div className="blocks__over pop-in">{api.t('noMoves')}</div>}
        </div>
        <div className="blocks__tray">
          {tray.map((p, slot) => (
            <div key={slot} className="tray-slot" onPointerDown={(e) => start(e, slot)}>
              {p && drag?.slot !== slot && (
                <PieceView piece={p} size={mini} dim={!fitsAnywhere(board, p)} />
              )}
            </div>
          ))}
        </div>
      </div>
      {drag && (
        <div className="blocks__ghost" style={{ left: drag.x - (drag.piece.w * cell) / 2, top: drag.y - drag.offY - (drag.piece.h * cell) / 2 }}>
          <PieceView piece={drag.piece} size={cell} />
        </div>
      )}
    </div>
  );
}

function PieceView({ piece, size, dim }: { piece: Piece; size: number; dim?: boolean }) {
  return (
    <div className={`piece ${dim ? 'is-dim' : ''}`} style={{ width: piece.w * size, height: piece.h * size }}>
      {piece.cells.map(([r, c], i) => (
        <span key={i} className="bcell is-filled" style={{ left: c * size, top: r * size, width: size, height: size, background: piece.color, position: 'absolute' }} />
      ))}
    </div>
  );
}
