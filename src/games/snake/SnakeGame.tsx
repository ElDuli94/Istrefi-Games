/**
 * Slangejakt – styr slangen, spis frukt og unngå steiner (og deg selv!).
 * Styring: sveip på brettet, piltaster/WASD eller de store pilknappene.
 * Nivåer: spis nok frukt før hjertene er brukt opp. Uendelig: slå rekorden.
 */
import { emojiImage } from '../../components/Emo';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { GameProps } from '../types';
import type { WorldId } from '../../data/worlds';
import { LevelGrid, advanceGrid, emptyGridProgress, type GridProgress } from '../common/LevelGrid';
import { EMOJI_FONT } from '../../emojiFont';
import './snake.css';

const LEVELS = 12;
const FRUITS = ['🍎', '🍓', '🍌', '🍇', '🍉', '🍒', '🍑', '🍐', '🥝'];
FRUITS.forEach((e) => emojiImage(e)); // last inn 3D-fruktene på forhånd
type P = [number, number];
type Dir = 'up' | 'down' | 'left' | 'right';
const VEC: Record<Dir, P> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPP: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

interface Cfg { size: number; speed: number; minSpeed: number; goal: number; wrap: boolean; rocks: number; hearts: number }
function cfgFor(world: WorldId, lvl: number | null): Cfg {
  const L = lvl ?? 0;
  const endless = lvl === null;
  if (world === 'small' || world === 'tiny')
    return { size: 12, speed: Math.max(160, 270 - L * 9), minSpeed: 150, goal: endless ? Infinity : 5 + L, wrap: true, rocks: endless ? 0 : L < 5 ? 0 : (L - 4) * 2, hearts: endless ? 1 : 3 };
  if (world === 'mid')
    return { size: 15, speed: Math.max(115, 210 - L * 8), minSpeed: 105, goal: endless ? Infinity : 6 + L, wrap: !endless && L < 3, rocks: endless ? 4 : L < 3 ? 0 : 2 + Math.round(L * 1.5), hearts: endless ? 1 : 3 };
  return { size: 17, speed: Math.max(90, 165 - L * 7), minSpeed: 80, goal: endless ? Infinity : 8 + L, wrap: false, rocks: endless ? 8 : 4 + L * 2, hearts: endless ? 1 : 3 };
}

// Forutsigbar "tilfeldighet" så hvert nivå alltid ser likt ut
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const key = (p: P) => p[0] * 100 + p[1];

function makeRocks(cfg: Cfg, seed: number): Set<number> {
  const r = rng(seed);
  const rocks = new Set<number>();
  const mid = Math.floor(cfg.size / 2);
  let guard = 0;
  while (rocks.size < cfg.rocks && guard++ < 1000) {
    const x = Math.floor(r() * cfg.size), y = Math.floor(r() * cfg.size);
    if (Math.abs(y - mid) <= 1) continue; // hold startraden fri
    const wall = r() < 0.35; // av og til en liten vegg
    const cells: P[] = wall ? (r() < 0.5 ? [[x, y], [x + 1, y], [x + 2, y]] : [[x, y], [x, y + 1], [x, y + 2]]) : [[x, y]];
    if (cells.every(([cx, cy]) => cx > 0 && cy > 0 && cx < cfg.size - 1 && cy < cfg.size - 1 && Math.abs(cy - mid) > 1))
      cells.forEach((c) => rocks.add(key(c)));
  }
  return rocks;
}

export default function SnakeGame(props: GameProps) {
  const { api } = props;
  const [progress, setProgress] = useState<GridProgress>(() => api.loadData<GridProgress>() ?? emptyGridProgress());
  const [mode, setMode] = useState<number | 'endless' | null>(null);
  // ⬅️ går først tilbake til spillets egen meny
  useEffect(() => {
    api.setBack(mode !== null ? () => setMode(null) : null);
    return () => api.setBack(null);
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps
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
    <Play
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

type Phase = 'ready' | 'running' | 'paused' | 'crashed' | 'done';

function Play({ api, world, onFinish, level, highscore, onEnd }: GameProps & {
  level: number | null; highscore: number; onEnd: (won: boolean, stars: number, score: number) => boolean;
}) {
  const cfg = useRef(cfgFor(world, level)).current;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [cellPx, setCellPx] = useState(24);
  const [phase, setPhase] = useState<Phase>('ready');
  const [eaten, setEaten] = useState(0);
  const [hearts, setHearts] = useState(cfg.hearts);

  // Spilltilstand i refs (endres mange ganger i sekundet uten å tegne React på nytt)
  const g = useRef({
    snake: [] as P[],
    dir: 'right' as Dir,
    queue: [] as Dir[],
    fruit: [0, 0] as P,
    fruitEmoji: FRUITS[0],
    rocks: makeRocks(cfg, (level ?? 99) * 7919 + cfg.size),
    speed: cfg.speed,
    last: 0,
    eaten: 0,
    hearts: cfg.hearts,
    phase: 'ready' as Phase,
    flash: 0
  });

  const setPh = (p: Phase) => { g.current.phase = p; setPhase(p); };

  const placeFruit = useCallback(() => {
    const s = g.current;
    const taken = new Set(s.snake.map(key));
    const free: P[] = [];
    for (let x = 0; x < cfg.size; x++) for (let y = 0; y < cfg.size; y++) {
      const k = key([x, y]);
      if (!taken.has(k) && !s.rocks.has(k)) free.push([x, y]);
    }
    s.fruit = free[Math.floor(Math.random() * free.length)] ?? [0, 0];
    s.fruitEmoji = FRUITS[Math.floor(Math.random() * FRUITS.length)];
  }, [cfg.size]);

  const resetSnake = useCallback(() => {
    const s = g.current;
    const mid = Math.floor(cfg.size / 2);
    s.snake = [[3, mid], [2, mid], [1, mid]];
    s.dir = 'right';
    s.queue = [];
  }, [cfg.size]);

  useEffect(() => {
    resetSnake();
    placeFruit();
    api.speak(api.t('tapToStart'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Størrelse på brettet
  useLayoutEffect(() => {
    const el = wrapRef.current!;
    const ro = new ResizeObserver(() => {
      const landscape = el.clientWidth > el.clientHeight * 1.2;
      const w = landscape ? el.clientWidth - 220 : el.clientWidth;
      const h = landscape ? el.clientHeight : el.clientHeight - 190;
      setCellPx(Math.max(12, Math.floor(Math.min(w, h) / cfg.size)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [cfg.size]);

  const turn = useCallback((d: Dir) => {
    const s = g.current;
    if (s.phase === 'ready' || s.phase === 'paused') setPh('running');
    if (s.phase !== 'running' && s.phase !== 'ready' && s.phase !== 'paused') return;
    const lastDir = s.queue[s.queue.length - 1] ?? s.dir;
    if (d === lastDir || d === OPP[lastDir] || s.queue.length >= 2) return;
    s.queue.push(d);
  }, []);

  function finish(won: boolean) {
    const s = g.current;
    setPh('done');
    if (level === null) {
      onEnd(false, 0, s.eaten);
      const stars = s.eaten >= 40 ? 3 : s.eaten >= 25 ? 2 : s.eaten >= 10 ? 1 : 0;
      setTimeout(() => onFinish({ won: stars > 0, stars, score: s.eaten, coins: Math.min(25, s.eaten) }), 900);
      return;
    }
    const stars = won ? Math.max(1, s.hearts) : 0;
    const firstClear = onEnd(won, stars, s.eaten);
    if (won) api.speak(api.t('levelDone'));
    setTimeout(() => onFinish({ won, stars, score: s.eaten, firstClear }), won ? 900 : 1200);
  }

  function step() {
    const s = g.current;
    if (s.queue.length) s.dir = s.queue.shift()!;
    const [vx, vy] = VEC[s.dir];
    let [hx, hy] = s.snake[0];
    hx += vx; hy += vy;
    if (cfg.wrap) { hx = (hx + cfg.size) % cfg.size; hy = (hy + cfg.size) % cfg.size; }
    const out = hx < 0 || hy < 0 || hx >= cfg.size || hy >= cfg.size;
    const eats = hx === s.fruit[0] && hy === s.fruit[1];
    const body = eats ? s.snake : s.snake.slice(0, -1);
    const hitSelf = body.some(([x, y]) => x === hx && y === hy);
    if (out || hitSelf || s.rocks.has(key([hx, hy]))) {
      s.hearts -= 1;
      setHearts(s.hearts);
      s.flash = performance.now();
      api.sfx('nope');
      if (s.hearts <= 0) finish(false);
      else { setPh('crashed'); api.speak(api.t('oops')); }
      return;
    }
    s.snake = [[hx, hy], ...body];
    if (eats) {
      s.eaten += 1;
      setEaten(s.eaten);
      api.sfx('match');
      if (level === null) s.speed = Math.max(cfg.minSpeed, s.speed - 3);
      if (s.eaten >= cfg.goal) { finish(true); return; }
      placeFruit();
    }
  }

  // Spill-løkke + tegning
  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      const s = g.current;
      if (s.phase === 'running' && now - s.last >= s.speed) { s.last = now; step(); }
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
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
      const d = map[e.key];
      if (d) { e.preventDefault(); turn(d); }
      if (e.key === ' ') { e.preventDefault(); tapBoard(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function tapBoard() {
    const s = g.current;
    if (s.phase === 'ready' || s.phase === 'paused') setPh('running');
    else if (s.phase === 'crashed') { resetSnake(); setPh('running'); }
  }

  // Sveip
  const swipe = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  function onDown(e: React.PointerEvent) { swipe.current = { x: e.clientX, y: e.clientY, moved: false }; }
  function onMove(e: React.PointerEvent) {
    const sw = swipe.current;
    if (!sw) return;
    const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
    if (Math.hypot(dx, dy) < 24) return;
    if (g.current.phase === 'crashed') { resetSnake(); setPh('running'); }
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
    swipe.current = { x: e.clientX, y: e.clientY, moved: true };
  }
  function onUp() {
    if (swipe.current && !swipe.current.moved) tapBoard();
    swipe.current = null;
  }

  function draw(now: number) {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const px = cellPx * cfg.size;
    if (c.width !== Math.round(px * dpr)) { c.width = Math.round(px * dpr); c.height = Math.round(px * dpr); }
    const ctx = c.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const s = g.current;
    const cs = cellPx;
    // Bakgrunn (rutemønster)
    for (let x = 0; x < cfg.size; x++) for (let y = 0; y < cfg.size; y++) {
      ctx.fillStyle = (x + y) % 2 ? '#a7e08c' : '#b5e89c';
      ctx.fillRect(x * cs, y * cs, cs, cs);
    }
    // Steiner
    s.rocks.forEach((k) => {
      const x = Math.floor(k / 100), y = k % 100;
      ctx.fillStyle = '#8d99ae';
      roundRect(ctx, x * cs + 2, y * cs + 2, cs - 4, cs - 4, cs * 0.3); ctx.fill();
      ctx.fillStyle = '#adb5bd';
      roundRect(ctx, x * cs + 5, y * cs + 4, cs * 0.45, cs * 0.3, cs * 0.15); ctx.fill();
    });
    // Frukt (dumper litt)
    const bob = Math.sin(now / 200) * cs * 0.06;
    ctx.font = `${cs * 0.85}px ${EMOJI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fruitImg = emojiImage(s.fruitEmoji);
    if (fruitImg) ctx.drawImage(fruitImg, s.fruit[0] * cs + cs * 0.06, s.fruit[1] * cs + cs * 0.06 + bob, cs * 0.88, cs * 0.88);
    else ctx.fillText(s.fruitEmoji, s.fruit[0] * cs + cs / 2, s.fruit[1] * cs + cs / 2 + bob);
    // Slange
    const n = s.snake.length;
    const flashing = now - s.flash < 500 && Math.floor((now - s.flash) / 80) % 2 === 0;
    for (let i = n - 1; i >= 0; i--) {
      const [x, y] = s.snake[i];
      const cx = x * cs + cs / 2, cy = y * cs + cs / 2;
      // Kobling til neste ledd (ikke over kanten ved "wrap")
      if (i > 0) {
        const [px2, py2] = s.snake[i - 1];
        if (Math.abs(px2 - x) + Math.abs(py2 - y) === 1) {
          ctx.strokeStyle = i % 2 ? '#2a9d8f' : '#38b000';
          ctx.lineWidth = cs * 0.72;
          ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px2 * cs + cs / 2, py2 * cs + cs / 2); ctx.stroke();
        }
      }
      ctx.fillStyle = flashing ? '#ff595e' : i === 0 ? '#2b9348' : i % 2 ? '#2a9d8f' : '#38b000';
      ctx.beginPath(); ctx.arc(cx, cy, i === 0 ? cs * 0.48 : cs * 0.38, 0, Math.PI * 2); ctx.fill();
    }
    // Øyne
    if (n) {
      const [hx, hy] = s.snake[0];
      const [vx, vy] = VEC[s.dir];
      const cx = hx * cs + cs / 2 + vx * cs * 0.12, cy = hy * cs + cs / 2 + vy * cs * 0.12;
      const ox = vy !== 0 ? cs * 0.2 : 0, oy = vx !== 0 ? cs * 0.2 : 0;
      for (const sgn of [-1, 1]) {
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(cx + ox * sgn, cy + oy * sgn, cs * 0.14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(cx + ox * sgn + vx * cs * 0.05, cy + oy * sgn + vy * cs * 0.05, cs * 0.07, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  const goalText = level === null ? `${eaten}` : `${eaten} / ${cfg.goal}`;
  return (
    <div className="snake" ref={wrapRef}>
      <div className="snake__hud">
        <span className="hud-chip">🍎 <b>{goalText}</b></span>
        {level === null ? (
          <span className="hud-chip">🏆 <b>{Math.max(highscore, eaten)}</b></span>
        ) : (
          <span className="hud-chip snake__hearts">{Array.from({ length: cfg.hearts }, (_, i) => (i < hearts ? '❤️' : '🤍')).join('')}</span>
        )}
        <button className="hud-chip snake__pause" onClick={() => setPh(phase === 'running' ? 'paused' : 'running')} aria-label={api.t('paused')}>
          {phase === 'running' ? '⏸️' : '▶️'}
        </button>
      </div>
      <div className="snake__main">
        <div
          className="snake__board"
          style={{ width: cellPx * cfg.size, height: cellPx * cfg.size }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={() => (swipe.current = null)}
        >
          <canvas ref={canvasRef} style={{ width: cellPx * cfg.size, height: cellPx * cfg.size }} />
          {(phase === 'ready' || phase === 'paused' || phase === 'crashed') && (
            <div className="snake__overlay pop-in">
              <span>{phase === 'crashed' ? '💥' : phase === 'paused' ? '⏸️' : '👆'}</span>
              {phase === 'crashed' ? api.t('oops') : phase === 'paused' ? api.t('paused') : api.t('tapToStart')}
            </div>
          )}
        </div>
        <div className="dpad">
          <button className="dpad__btn dpad__up" onPointerDown={(e) => { e.preventDefault(); if (phase === 'crashed') { resetSnake(); setPh('running'); } turn('up'); }} aria-label="opp">▲</button>
          <button className="dpad__btn dpad__left" onPointerDown={(e) => { e.preventDefault(); if (phase === 'crashed') { resetSnake(); setPh('running'); } turn('left'); }} aria-label="venstre">◀</button>
          <button className="dpad__btn dpad__right" onPointerDown={(e) => { e.preventDefault(); if (phase === 'crashed') { resetSnake(); setPh('running'); } turn('right'); }} aria-label="høyre">▶</button>
          <button className="dpad__btn dpad__down" onPointerDown={(e) => { e.preventDefault(); if (phase === 'crashed') { resetSnake(); setPh('running'); } turn('down'); }} aria-label="ned">▼</button>
        </div>
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
