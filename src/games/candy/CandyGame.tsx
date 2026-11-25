/**
 * Godteriregn – godteribiter faller ned. Snu og flytt dem så de fyller hele rader.
 * Fulle rader forsvinner og gir poeng. Jo flere rader, jo fortere faller godteriet.
 * Laget for Istrefi Games (eget navn og utseende): runde godteriklosser med fjes.
 *
 * Styring: knappene under brettet, sveip på brettet (sideveis = flytt, trykk = snu,
 * rask sveip ned = slipp), eller piltaster + mellomrom på PC.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { GameProps } from '../types';
import type { WorldId } from '../../data/worlds';
import './candy.css';

const COLS = 10, ROWS = 18;
type Kind = 0 | 1 | 2 | 3 | 4 | 5 | 6;
// Formene (rad, kolonne) i et 4×4-felt
const SHAPES: [number, number][][] = [
  [[1, 0], [1, 1], [1, 2], [1, 3]], // lang
  [[0, 1], [0, 2], [1, 1], [1, 2]], // firkant
  [[0, 1], [1, 0], [1, 1], [1, 2]], // T
  [[0, 1], [0, 2], [1, 0], [1, 1]], // S
  [[0, 0], [0, 1], [1, 1], [1, 2]], // Z
  [[0, 0], [1, 0], [1, 1], [1, 2]], // J
  [[0, 2], [1, 0], [1, 1], [1, 2]] // L
];
// Godterifarger: jordbær, sitron, mynte, blåbær, appelsin, drue, tyggegummi
const CANDY = ['#ff4d8d', '#ffd23f', '#3ddc97', '#4d96ff', '#ff8c42', '#9b5de5', '#f15bb5'];
const SIZE = [4, 4, 3, 3, 3, 3, 3]; // rotasjonsfelt per form

interface Piece { k: Kind; cells: [number, number][]; r: number; c: number }
type Grid = (Kind | null)[][];

const emptyGrid = (): Grid => Array.from({ length: ROWS }, () => Array(COLS).fill(null));
function rotate(cells: [number, number][], n: number): [number, number][] {
  return cells.map(([r, c]) => [c, n - 1 - r]);
}
function fits(g: Grid, p: Piece, dr = 0, dc = 0, cells = p.cells) {
  return cells.every(([r, c]) => {
    const rr = p.r + r + dr, cc = p.c + c + dc;
    return cc >= 0 && cc < COLS && rr < ROWS && (rr < 0 || g[rr][cc] === null);
  });
}

function startSpeed(world: WorldId) { return world === 'big' ? 650 : world === 'mid' ? 780 : 950; }

export default function CandyGame({ api, world, onFinish }: GameProps) {
  const saved = useRef(api.loadData<{ highscore?: number }>() ?? {});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [cell, setCell] = useState(24);
  const [hud, setHud] = useState({ score: 0, lines: 0, level: 1 });
  const [phase, setPhase] = useState<'ready' | 'running' | 'paused' | 'over'>('ready');
  const [pop, setPop] = useState<{ text: string; key: number } | null>(null);

  const g = useRef({
    grid: emptyGrid(),
    piece: null as Piece | null,
    next: 0 as Kind,
    bag: [] as Kind[],
    last: 0,
    speed: startSpeed(world),
    soft: false,
    score: 0, lines: 0, level: 1,
    clearing: [] as number[], clearAt: 0,
    phase: 'ready' as 'ready' | 'running' | 'paused' | 'over'
  });
  const setPh = (p: typeof g.current.phase) => { g.current.phase = p; setPhase(p); };

  /** «Pose» med alle syv formene i tilfeldig rekkefølge – ingen lange tørkeperioder */
  function draw7(): Kind {
    const s = g.current;
    if (!s.bag.length) s.bag = ([0, 1, 2, 3, 4, 5, 6] as Kind[]).sort(() => Math.random() - 0.5);
    return s.bag.pop()!;
  }
  function spawn() {
    const s = g.current;
    const k = s.next;
    s.next = draw7();
    const p: Piece = { k, cells: SHAPES[k].map(([r, c]) => [r, c] as [number, number]), r: -1, c: 3 };
    if (!fits(s.grid, p)) { gameOver(); return; }
    s.piece = p;
  }

  useEffect(() => {
    const s = g.current;
    s.next = draw7();
    spawn();
    api.speak(api.t('candyStart'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Brettets størrelse
  useLayoutEffect(() => {
    const el = wrapRef.current!;
    const ro = new ResizeObserver(() => {
      const landscape = el.clientWidth > el.clientHeight;
      const w = landscape ? el.clientWidth - 320 : el.clientWidth - 90;
      const h = landscape ? el.clientHeight - 20 : el.clientHeight - 150;
      setCell(Math.max(14, Math.floor(Math.min(w / COLS, h / ROWS))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function gameOver() {
    const s = g.current;
    setPh('over');
    api.sfx('nope');
    const best = Math.max(saved.current.highscore ?? 0, s.score);
    const record = s.score > (saved.current.highscore ?? 0) && s.score > 0;
    saved.current = { highscore: best };
    api.saveData(saved.current);
    api.speak(record ? api.t('newRecord') : api.t('candyOver'));
    const stars = s.lines >= 40 ? 3 : s.lines >= 20 ? 2 : s.lines >= 5 ? 1 : 0;
    setTimeout(() => onFinish({ won: stars > 0, stars, score: s.score, coins: Math.min(30, s.lines) }), 2200);
  }

  function lock() {
    const s = g.current;
    const p = s.piece!;
    p.cells.forEach(([r, c]) => { if (p.r + r >= 0) s.grid[p.r + r][p.c + c] = p.k; });
    if (p.cells.some(([r]) => p.r + r < 0)) { s.piece = null; gameOver(); return; }
    s.piece = null;
    const full = s.grid.map((row, i) => (row.every((x) => x !== null) ? i : -1)).filter((i) => i >= 0);
    if (full.length) {
      s.clearing = full;
      s.clearAt = performance.now();
      const pts = [0, 100, 300, 500, 800][full.length] * s.level;
      s.score += pts;
      s.lines += full.length;
      const lvl = 1 + Math.floor(s.lines / 10);
      if (lvl > s.level) { s.level = lvl; s.speed = Math.max(90, startSpeed(world) - (lvl - 1) * 70); api.sfx('sticker'); api.speak(api.t('candyLevelUp')); }
      api.sfx(full.length >= 4 ? 'win' : 'match');
      setPop({ text: full.length >= 4 ? `🍭 ${api.t('candyParty')} +${pts}` : `+${pts}`, key: performance.now() });
      if (full.length >= 4) api.speak(api.t('candyParty'));
    } else {
      api.sfx('pop');
      spawn();
    }
    setHud({ score: s.score, lines: s.lines, level: s.level });
  }

  function finishClear() {
    const s = g.current;
    s.grid = [...s.clearing.map(() => Array(COLS).fill(null)), ...s.grid.filter((_, i) => !s.clearing.includes(i))];
    s.clearing = [];
    spawn();
  }

  // Handlinger
  const act = {
    move(dc: number) { const s = g.current; if (s.phase !== 'running' || !s.piece) return; if (fits(s.grid, s.piece, 0, dc)) { s.piece.c += dc; api.sfx('tap'); } },
    rotate() {
      const s = g.current; const p = s.piece;
      if (s.phase !== 'running' || !p || p.k === 1) return;
      const cells = rotate(p.cells, SIZE[p.k]);
      // Prøv å dytte biten litt til siden/opp hvis den står inntil noe
      for (const [dr, dc] of [[0, 0], [0, -1], [0, 1], [0, -2], [0, 2], [-1, 0]]) {
        if (fits(s.grid, p, dr, dc, cells)) { p.cells = cells; p.r += dr; p.c += dc; api.sfx('flip'); return; }
      }
    },
    drop() {
      const s = g.current; if (s.phase !== 'running' || !s.piece) return;
      while (fits(s.grid, s.piece, 1)) { s.piece.r++; s.score += 2; }
      lock();
    }
  };

  function start() {
    const s = g.current;
    if (s.phase === 'ready' || s.phase === 'paused') { setPh('running'); s.last = performance.now(); }
  }

  // Spill-løkke og tegning
  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      const s = g.current;
      if (s.phase === 'running') {
        if (s.clearing.length) { if (now - s.clearAt > 280) finishClear(); }
        else if (s.piece && now - s.last >= (s.soft ? Math.min(50, s.speed) : s.speed)) {
          s.last = now;
          if (fits(s.grid, s.piece, 1)) { s.piece.r++; if (s.soft) s.score += 1; }
          else lock();
        }
      }
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onHide = () => { if (document.hidden && g.current.phase === 'running') setPh('paused'); };
    document.addEventListener('visibilitychange', onHide);
    return () => { cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', onHide); };
  }); // eslint-disable-line react-hooks/exhaustive-deps

  // Tastatur
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(k)) e.preventDefault();
      if (g.current.phase !== 'running') { if (k === ' ' || k === 'Enter') start(); return; }
      if (k === 'ArrowLeft' || k === 'a') act.move(-1);
      else if (k === 'ArrowRight' || k === 'd') act.move(1);
      else if (k === 'ArrowUp' || k === 'w') act.rotate();
      else if (k === 'ArrowDown' || k === 's') g.current.soft = true;
      else if (k === ' ') act.drop();
    };
    const upk = (e: KeyboardEvent) => { if (e.key === 'ArrowDown' || e.key === 's') g.current.soft = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', upk);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', upk); };
  });

  // Sveip på brettet
  const sw = useRef<{ x: number; y: number; t: number; moved: boolean; cx: number } | null>(null);
  function onDown(e: React.PointerEvent) {
    if (g.current.phase !== 'running') { start(); return; }
    sw.current = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false, cx: e.clientX };
  }
  function onMove(e: React.PointerEvent) {
    const s = sw.current; if (!s) return;
    const dx = e.clientX - s.cx;
    if (Math.abs(dx) >= cell * 0.9) { act.move(dx > 0 ? 1 : -1); s.cx = e.clientX; s.moved = true; }
  }
  function onUp(e: React.PointerEvent) {
    const s = sw.current; sw.current = null; if (!s) return;
    const dy = e.clientY - s.y, dt = performance.now() - s.t;
    if (!s.moved && dy > cell * 2.5 && dt < 400) act.drop();
    else if (!s.moved && Math.hypot(e.clientX - s.x, dy) < 12) act.rotate();
  }

  function drawCandy(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, k: Kind, alpha = 1, face = true) {
    const r = size * 0.28, pad = size * 0.05;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = CANDY[k];
    roundRect(ctx, x + pad, y + pad, size - pad * 2, size - pad * 2, r); ctx.fill();
    // Glans
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    roundRect(ctx, x + size * 0.18, y + size * 0.14, size * 0.38, size * 0.18, size * 0.09); ctx.fill();
    // Skygge nederst
    ctx.fillStyle = 'rgba(0,0,0,.12)';
    roundRect(ctx, x + pad, y + size * 0.72, size - pad * 2, size * 0.23, r * 0.6); ctx.fill();
    if (face && size >= 16) {
      ctx.fillStyle = '#2b2440';
      ctx.beginPath(); ctx.arc(x + size * 0.36, y + size * 0.5, size * 0.06, 0, Math.PI * 2); ctx.arc(x + size * 0.64, y + size * 0.5, size * 0.06, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2b2440'; ctx.lineWidth = Math.max(1, size * 0.05); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(x + size * 0.5, y + size * 0.6, size * 0.1, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function draw(now: number) {
    const c = canvasRef.current; if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const W = cell * COLS, H = cell * ROWS;
    if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    const ctx = c.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // Rutemønster
    for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++) {
      ctx.fillStyle = (r + col) % 2 ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.02)';
      ctx.fillRect(col * cell, r * cell, cell, cell);
    }
    const s = g.current;
    const flash = s.clearing.length ? Math.floor((now - s.clearAt) / 70) % 2 === 0 : false;
    s.grid.forEach((row, r) => row.forEach((k, col) => {
      if (k === null) return;
      if (s.clearing.includes(r)) { if (flash) { ctx.fillStyle = '#fff'; roundRect(ctx, col * cell + 2, r * cell + 2, cell - 4, cell - 4, cell * 0.28); ctx.fill(); } else drawCandy(ctx, col * cell, r * cell, cell, k); }
      else drawCandy(ctx, col * cell, r * cell, cell, k);
    }));
    const p = s.piece;
    if (p && s.phase !== 'over') {
      // Skygge der biten lander
      let gr = 0; while (fits(s.grid, p, gr + 1)) gr++;
      p.cells.forEach(([r, col]) => { if (p.r + r + gr >= 0) drawCandy(ctx, (p.c + col) * cell, (p.r + r + gr) * cell, cell, p.k, 0.22, false); });
      p.cells.forEach(([r, col]) => { if (p.r + r >= 0) drawCandy(ctx, (p.c + col) * cell, (p.r + r) * cell, cell, p.k); });
    }
    // Neste bit
    const n = nextRef.current;
    if (n) {
      const ns = Math.round(cell * 0.7), NW = ns * 4, NH = ns * 2;
      if (n.width !== Math.round(NW * dpr)) { n.width = Math.round(NW * dpr); n.height = Math.round(NH * dpr); }
      const nctx = n.getContext('2d')!;
      nctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nctx.clearRect(0, 0, NW, NH);
      const cells = SHAPES[s.next];
      const minR = Math.min(...cells.map((q) => q[0])), maxC = Math.max(...cells.map((q) => q[1])), minC = Math.min(...cells.map((q) => q[1]));
      const off = (4 - (maxC - minC + 1)) / 2 - minC;
      cells.forEach(([r, col]) => drawCandy(nctx, (col + off) * ns, (r - minR) * ns, ns, s.next));
    }
  }

  const btn = (label: string, aria: string, onPress: () => void, extra = '', onRelease?: () => void) => (
    <button className={`candy-btn ${extra}`} aria-label={aria}
      onPointerDown={(e) => { e.preventDefault(); if (g.current.phase !== 'running') { start(); return; } onPress(); }}
      onPointerUp={onRelease} onPointerLeave={onRelease} onPointerCancel={onRelease}>{label}</button>
  );

  return (
    <div className="candy" ref={wrapRef}>
      <div className="candy__main">
        <div className="candy__side">
          <div className="candy-stat"><small>{api.t('score')}</small><b>{hud.score}</b></div>
          <div className="candy-stat"><small>{api.t('candyLines')}</small><b>{hud.lines}</b></div>
          <div className="candy-stat"><small>{api.t('candyLevel')}</small><b>{hud.level}</b></div>
          <div className="candy-stat"><small>{api.t('candyNext')}</small><canvas ref={nextRef} style={{ width: Math.round(cell * 0.7) * 4, height: Math.round(cell * 0.7) * 2 }} /></div>
          <div className="candy-stat"><small>🏆</small><b>{Math.max(saved.current.highscore ?? 0, hud.score)}</b></div>
          <button className="candy-pause" onClick={() => (phase === 'running' ? setPh('paused') : start())} aria-label={api.t('paused')}>{phase === 'running' ? '⏸️' : '▶️'}</button>
        </div>
        <div className="candy__board" style={{ width: cell * COLS, height: cell * ROWS }}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => (sw.current = null)}>
          <canvas ref={canvasRef} style={{ width: cell * COLS, height: cell * ROWS }} />
          {pop && <span key={pop.key} className="candy__pop">{pop.text}</span>}
          {phase !== 'running' && (
            <div className="candy__overlay pop-in">
              <span>{phase === 'over' ? '🍬' : phase === 'paused' ? '⏸️' : '👆'}</span>
              {phase === 'over' ? `${api.t('candyOver')} ${hud.score}` : phase === 'paused' ? api.t('paused') : api.t('tapToStart')}
            </div>
          )}
        </div>
      </div>
      <div className="candy__controls">
        {btn('◀', api.t('candyLeft'), () => act.move(-1))}
        {btn('⟳', api.t('candyRotate'), () => act.rotate(), 'candy-btn--rot')}
        {btn('▼', api.t('candyDown'), () => { g.current.soft = true; }, '', () => { g.current.soft = false; })}
        {btn('⤓', api.t('candyDrop'), () => act.drop(), 'candy-btn--drop')}
        {btn('▶', api.t('candyRight'), () => act.move(1))}
      </div>
    </div>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
