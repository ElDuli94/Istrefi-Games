/**
 * Kakevakt – tårnforsvar for barn.
 * Små kryp går langs stien mot kaken. Bygg tårn som skyter vann, snø, bobler og stjerner.
 * Treffes et kryp nok, "popper" det til stjerner (jages bort) – ingen vold.
 */
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import type { GameProps } from '../types';
import type { WorldId } from '../../data/worlds';
import type { DictKey } from '../../i18n/no';
import { LevelGrid, advanceGrid, emptyGridProgress, type GridProgress } from '../common/LevelGrid';
import { Emo, emojiImage } from '../../components/Emo';
import './towers.css';

const COLS = 12, ROWS = 8, LEVELS = 10;
type P = [number, number];

// Fire stier (hjørnepunkter i rutenettet). Kaken står på siste punkt.
const MAPS: P[][] = [
  [[0, 1], [4, 1], [4, 5], [8, 5], [8, 2], [11, 2]],
  [[0, 6], [3, 6], [3, 1], [7, 1], [7, 6], [11, 6]],
  [[0, 3], [2, 3], [2, 0], [5, 0], [5, 7], [9, 7], [9, 3], [11, 3]],
  [[0, 0], [10, 0], [10, 7], [1, 7], [1, 2], [8, 2], [8, 5], [4, 5]]
];

type TowerKind = 'water' | 'ice' | 'bubble' | 'star';
const TOWERS: Record<TowerKind, { emoji: string; nameKey: DictKey; cost: number; range: number; rate: number; dmg: number; color: string; slow?: number; splash?: number; unlock: number }> = {
  water: { emoji: '💧', nameKey: 'towerWater', cost: 40, range: 2.3, rate: 2.2, dmg: 8, color: '#4cc9f0', unlock: 0 },
  ice: { emoji: '❄️', nameKey: 'towerIce', cost: 60, range: 2.0, rate: 1.0, dmg: 4, color: '#bde0fe', slow: 0.45, unlock: 1 },
  bubble: { emoji: '🫧', nameKey: 'towerBubble', cost: 80, range: 2.1, rate: 0.75, dmg: 14, color: '#c77dff', splash: 0.95, unlock: 2 },
  star: { emoji: '⭐', nameKey: 'towerStar', cost: 120, range: 3.6, rate: 0.6, dmg: 42, color: '#ffd60a', unlock: 4 }
};
const ENEMIES = {
  ant: { emoji: '🐜', hp: 30, speed: 1.6, reward: 5 },
  ladybug: { emoji: '🐞', hp: 50, speed: 1.1, reward: 6 },
  caterpillar: { emoji: '🐛', hp: 85, speed: 0.9, reward: 8 },
  snail: { emoji: '🐌', hp: 130, speed: 0.6, reward: 10 },
  beetle: { emoji: '🪲', hp: 420, speed: 0.5, reward: 40 }
} as const;
type EnemyKind = keyof typeof ENEMIES;

const WORLD_TUNE: Record<WorldId, { hp: number; gold: number; lives: number }> = {
  tiny: { hp: 0.6, gold: 60, lives: 15 }, small: { hp: 0.7, gold: 50, lives: 12 }, mid: { hp: 1, gold: 0, lives: 10 }, big: { hp: 1.3, gold: 0, lives: 10 }
};

/** Bølger for et nivå: liste av fiendetyper per bølge */
function wavesFor(level: number): EnemyKind[][] {
  const n = 4 + Math.floor(level / 3);
  const waves: EnemyKind[][] = [];
  for (let w = 0; w < n; w++) {
    const count = 6 + w * 2 + level;
    const pool: EnemyKind[] = w < 1 ? ['ant', 'ladybug'] : w < 2 ? ['ant', 'ladybug', 'caterpillar'] : ['ant', 'ladybug', 'caterpillar', 'snail'];
    const wave: EnemyKind[] = Array.from({ length: count }, (_, i) => pool[(i * 7 + w * 3 + level) % pool.length]);
    if (level >= 2 && w === n - 1) wave.push('beetle');
    if (level >= 6 && w === n - 2) wave.push('beetle');
    waves.push(wave);
  }
  return waves;
}

/** Stien som liste av ruter, og punkter for bevegelse */
function pathOf(corners: P[]) {
  const cells = new Set<string>();
  for (let i = 0; i < corners.length - 1; i++) {
    const [x0, y0] = corners[i], [x1, y1] = corners[i + 1];
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let k = 0; k <= steps; k++) cells.add(`${x0 + Math.sign(x1 - x0) * k},${y0 + Math.sign(y1 - y0) * k}`);
  }
  const segs = corners.slice(1).map((c, i) => Math.hypot(c[0] - corners[i][0], c[1] - corners[i][1]));
  return { cells, corners, total: segs.reduce((a, b) => a + b, 0), segs };
}

export default function TowerGame(props: GameProps) {
  const { api } = props;
  const [progress, setProgress] = useState<GridProgress>(() => api.loadData<GridProgress>() ?? emptyGridProgress());
  const [level, setLevel] = useState<number | null>(null);
  useEffect(() => {
    api.setBack(level !== null ? () => setLevel(null) : null);
    return () => api.setBack(null);
  }, [level]); // eslint-disable-line react-hooks/exhaustive-deps
  if (level === null) return <LevelGrid api={api} count={LEVELS} progress={progress} onPick={setLevel} />;
  return (
    <Play
      key={level}
      {...props}
      level={level}
      onEnd={(won, stars) => {
        const { next, firstClear } = advanceGrid(progress, level, won, stars, LEVELS);
        setProgress(next);
        api.saveData(next);
        return firstClear;
      }}
    />
  );
}

interface Enemy { id: number; kind: EnemyKind; d: number; hp: number; max: number; slowUntil: number }
interface Tower { id: number; kind: TowerKind; x: number; y: number; lvl: number; spent: number; cd: number }
interface Shot { from: P; to: number; kind: TowerKind; t: number; dmg: number; slow?: number; splash?: number; tx: number; ty: number }
interface Fx { x: number; y: number; t: number; text?: string; emoji?: string }

function Play({ api, world, onFinish, level, onEnd }: GameProps & { level: number; onEnd: (won: boolean, stars: number) => boolean }) {
  const tune = WORLD_TUNE[world];
  const map = pathOf(MAPS[level % MAPS.length]);
  const waves = useRef(wavesFor(level)).current;
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cell, setCell] = useState(48);
  const [hud, setHud] = useState({ gold: 120 + tune.gold, lives: tune.lives, wave: 0, running: false });
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [sel, setSel] = useState<{ x: number; y: number; tower?: number } | null>(null);
  const ended = useRef(false);

  const g = useRef({
    gold: 120 + tune.gold, lives: tune.lives, wave: 0, running: false,
    enemies: [] as Enemy[], towers: [] as Tower[], shots: [] as Shot[], fx: [] as Fx[],
    spawnQueue: [] as EnemyKind[], spawnCd: 0, id: 1, time: 0, speed: 1, paused: false
  });
  const sync = () => { const s = g.current; setHud({ gold: s.gold, lives: s.lives, wave: s.wave, running: s.running }); };

  useEffect(() => { api.speak(api.t('help_towers')); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { g.current.speed = speed; }, [speed]);
  useEffect(() => { g.current.paused = paused; }, [paused]);
  // Last inn 3D-figurene på forhånd
  useEffect(() => { [...Object.values(TOWERS).map((t) => t.emoji), ...Object.values(ENEMIES).map((e) => e.emoji), '🎂', '🌸', '🌳', '⭐'].forEach((e) => emojiImage(e)); }, []);

  useLayoutEffect(() => {
    const el = wrapRef.current!;
    const ro = new ResizeObserver(() => setCell(Math.max(10, Math.floor(Math.min(el.clientWidth / COLS, el.clientHeight / ROWS)))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** Posisjon (i ruter) for en avstand d langs stien */
  function posAt(d: number): [number, number] {
    let left = d;
    for (let i = 0; i < map.segs.length; i++) {
      if (left <= map.segs[i]) {
        const [x0, y0] = map.corners[i], [x1, y1] = map.corners[i + 1];
        const f = map.segs[i] ? left / map.segs[i] : 0;
        return [x0 + (x1 - x0) * f + 0.5, y0 + (y1 - y0) * f + 0.5];
      }
      left -= map.segs[i];
    }
    const c = map.corners[map.corners.length - 1];
    return [c[0] + 0.5, c[1] + 0.5];
  }
  const statsOf = (t: Tower) => { const b = TOWERS[t.kind]; const m = 1 + (t.lvl - 1) * 0.6; return { ...b, dmg: b.dmg * m, range: b.range * (1 + (t.lvl - 1) * 0.12), rate: b.rate * (1 + (t.lvl - 1) * 0.15) }; };

  function startWave() {
    const s = g.current;
    if (s.running || s.wave >= waves.length) return;
    s.spawnQueue = [...waves[s.wave]];
    s.wave += 1;
    s.running = true;
    s.spawnCd = 0;
    api.sfx('pop');
    api.speak(api.t('waveIncoming'));
    sync();
  }

  function finish(won: boolean) {
    if (ended.current) return;
    ended.current = true;
    const s = g.current;
    const stars = won ? (s.lives >= tune.lives ? 3 : s.lives >= tune.lives * 0.6 ? 2 : 1) : 0;
    api.speak(won ? api.t('cakeSaved') : api.t('cakeEaten'));
    const firstClear = onEnd(won, stars);
    setTimeout(() => onFinish({ won, stars, firstClear }), 1200);
  }

  // Spill-løkke
  useEffect(() => {
    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      const s = g.current;
      let dt = Math.min(0.05, (now - last) / 1000) * s.speed;
      last = now;
      if (s.paused || ended.current) dt = 0;
      s.time += dt;
      if (dt > 0) step(dt);
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  });

  function step(dt: number) {
    const s = g.current;
    let changed = false;
    // Nye kryp
    if (s.spawnQueue.length) {
      s.spawnCd -= dt;
      if (s.spawnCd <= 0) {
        const kind = s.spawnQueue.shift()!;
        const e = ENEMIES[kind];
        const hp = Math.round(e.hp * tune.hp * (1 + level * 0.18));
        s.enemies.push({ id: s.id++, kind, d: 0, hp, max: hp, slowUntil: 0 });
        s.spawnCd = kind === 'beetle' ? 1.6 : 0.85;
      }
    }
    // Bevegelse
    for (const e of s.enemies) {
      const slow = e.slowUntil > s.time ? 0.55 : 1;
      e.d += ENEMIES[e.kind].speed * slow * dt;
      if (e.d >= map.total) {
        e.hp = -999;
        s.lives -= e.kind === 'beetle' ? 3 : 1;
        api.sfx('nope');
        changed = true;
      }
    }
    // Tårn skyter
    for (const t of s.towers) {
      t.cd -= dt;
      if (t.cd > 0) continue;
      const st = statsOf(t);
      const cx = t.x + 0.5, cy = t.y + 0.5;
      // Sikt på krypet som har kommet lengst innenfor rekkevidde
      let best: Enemy | null = null;
      for (const e of s.enemies) {
        if (e.hp <= 0) continue;
        const [ex, ey] = posAt(e.d);
        if (Math.hypot(ex - cx, ey - cy) <= st.range && (!best || e.d > best.d)) best = e;
      }
      if (best) {
        const [ex, ey] = posAt(best.d);
        s.shots.push({ from: [cx, cy], to: best.id, kind: t.kind, t: 0, dmg: st.dmg, slow: st.slow, splash: st.splash, tx: ex, ty: ey });
        t.cd = 1 / st.rate;
      }
    }
    // Skudd flyr
    for (const sh of s.shots) {
      const target = s.enemies.find((e) => e.id === sh.to && e.hp > 0);
      if (target) [sh.tx, sh.ty] = posAt(target.d);
      sh.t += dt * 7;
      if (sh.t >= 1) {
        const hit = (e: Enemy) => {
          e.hp -= sh.dmg;
          if (sh.slow) e.slowUntil = s.time + 1.5;
        };
        if (sh.splash) {
          for (const e of s.enemies) { if (e.hp <= 0) continue; const [ex, ey] = posAt(e.d); if (Math.hypot(ex - sh.tx, ey - sh.ty) <= sh.splash) hit(e); }
          s.fx.push({ x: sh.tx, y: sh.ty, t: 0, emoji: '🫧' });
        } else if (target) hit(target);
      }
    }
    s.shots = s.shots.filter((sh) => sh.t < 1);
    // Kryp som popper
    for (const e of s.enemies) {
      if (e.hp <= 0 && e.hp > -999) {
        const [ex, ey] = posAt(e.d);
        const reward = ENEMIES[e.kind].reward;
        s.gold += reward;
        s.fx.push({ x: ex, y: ey, t: 0, emoji: '⭐' }, { x: ex, y: ey - 0.3, t: 0, text: `+${reward}` });
        api.sfx('pop');
        changed = true;
      }
    }
    s.enemies = s.enemies.filter((e) => e.hp > 0);
    s.fx.forEach((f) => (f.t += dt));
    s.fx = s.fx.filter((f) => f.t < 0.9);
    // Bølge ferdig?
    if (s.running && !s.spawnQueue.length && !s.enemies.length) {
      s.running = false;
      s.gold += 20 + s.wave * 5; // bonus for klart bølge
      changed = true;
      if (s.wave >= waves.length) finish(true);
    }
    if (s.lives <= 0) { s.lives = 0; finish(false); }
    if (changed) sync();
  }

  function drawEmoji(ctx: CanvasRenderingContext2D, e: string, x: number, y: number, size: number) {
    const img = emojiImage(e);
    if (img) ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    else { ctx.font = `${size * 0.9}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e, x, y); }
  }

  function draw() {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const W = COLS * cell, H = ROWS * cell;
    if (c.width !== Math.round(W * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    const ctx = c.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const s = g.current;
    // Gress og sti
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const path = map.cells.has(`${x},${y}`);
      ctx.fillStyle = path ? ((x + y) % 2 ? '#f4d58d' : '#f6dc9e') : ((x + y) % 2 ? '#95d5b2' : '#a3dbb9');
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
    // Pynt på noen grønne ruter
    for (let i = 0; i < 6; i++) {
      const x = (i * 5 + level * 3) % COLS, y = (i * 3 + level) % ROWS;
      if (!map.cells.has(`${x},${y}`) && !s.towers.some((t) => t.x === x && t.y === y)) drawEmoji(ctx, i % 2 ? '🌸' : '🌳', (x + 0.5) * cell, (y + 0.5) * cell, cell * 0.55);
    }
    // Start og kake
    const start = map.corners[0], end = map.corners[map.corners.length - 1];
    ctx.fillStyle = '#ff006e55'; ctx.fillRect(start[0] * cell, start[1] * cell, cell, cell);
    drawEmoji(ctx, '🎂', (end[0] + 0.5) * cell, (end[1] + 0.5) * cell, cell * 0.95);
    // Valgt rute / rekkevidde
    if (sel) {
      const t = sel.tower !== undefined ? s.towers.find((x) => x.id === sel.tower) : null;
      if (t) {
        const st = statsOf(t);
        ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc((t.x + 0.5) * cell, (t.y + 0.5) * cell, st.range * cell, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else {
        ctx.strokeStyle = '#ffd60a'; ctx.lineWidth = 3; ctx.strokeRect(sel.x * cell + 2, sel.y * cell + 2, cell - 4, cell - 4);
      }
    }
    // Tårn
    for (const t of s.towers) {
      const x = (t.x + 0.5) * cell, y = (t.y + 0.5) * cell;
      ctx.fillStyle = TOWERS[t.kind].color; ctx.beginPath(); ctx.arc(x, y, cell * 0.44, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
      drawEmoji(ctx, TOWERS[t.kind].emoji, x, y, cell * 0.62);
      for (let k = 0; k < t.lvl; k++) { ctx.fillStyle = '#ffd60a'; ctx.beginPath(); ctx.arc(x - cell * 0.18 + k * cell * 0.18, y + cell * 0.38, cell * 0.06, 0, Math.PI * 2); ctx.fill(); }
    }
    // Kryp
    for (const e of s.enemies) {
      const [ex, ey] = posAt(e.d);
      const size = e.kind === 'beetle' ? cell * 0.95 : cell * 0.68;
      drawEmoji(ctx, ENEMIES[e.kind].emoji, ex * cell, ey * cell + Math.sin(s.time * 12 + e.id) * cell * 0.03, size);
      if (e.slowUntil > s.time) drawEmoji(ctx, '❄️', ex * cell + size * 0.35, ey * cell - size * 0.35, cell * 0.25);
      // Livsstripe
      const w = cell * 0.6;
      ctx.fillStyle = '#00000044'; ctx.fillRect(ex * cell - w / 2, ey * cell - size / 2 - 7, w, 5);
      ctx.fillStyle = '#06d6a0'; ctx.fillRect(ex * cell - w / 2, ey * cell - size / 2 - 7, w * Math.max(0, e.hp / e.max), 5);
    }
    // Skudd
    for (const sh of s.shots) {
      const x = (sh.from[0] + (sh.tx - sh.from[0]) * sh.t) * cell, y = (sh.from[1] + (sh.ty - sh.from[1]) * sh.t) * cell;
      if (sh.kind === 'water') { ctx.fillStyle = '#4cc9f0'; ctx.beginPath(); ctx.arc(x, y, cell * 0.1, 0, Math.PI * 2); ctx.fill(); }
      else drawEmoji(ctx, sh.kind === 'ice' ? '❄️' : sh.kind === 'bubble' ? '🫧' : '⭐', x, y, cell * 0.3);
    }
    // Effekter
    for (const f of s.fx) {
      ctx.globalAlpha = 1 - f.t / 0.9;
      if (f.emoji) drawEmoji(ctx, f.emoji, f.x * cell, (f.y - f.t * 0.6) * cell, cell * (0.4 + f.t * 0.4));
      if (f.text) { ctx.fillStyle = '#e85d04'; ctx.font = `800 ${cell * 0.32}px "Baloo 2", sans-serif`; ctx.textAlign = 'center'; ctx.fillText(f.text, f.x * cell, (f.y - f.t * 0.8) * cell); }
      ctx.globalAlpha = 1;
    }
  }

  function tap(e: RPointerEvent<HTMLCanvasElement>) {
    const r = canvasRef.current!.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * COLS), y = Math.floor(((e.clientY - r.top) / r.height) * ROWS);
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
    const s = g.current;
    const t = s.towers.find((tw) => tw.x === x && tw.y === y);
    if (t) { api.sfx('tap'); setSel({ x, y, tower: t.id }); return; }
    if (map.cells.has(`${x},${y}`)) { setSel(null); return; }
    api.sfx('tap');
    setSel({ x, y });
  }

  function build(kind: TowerKind) {
    const s = g.current;
    if (!sel || sel.tower !== undefined) return;
    const cost = TOWERS[kind].cost;
    if (s.gold < cost) { api.sfx('nope'); return; }
    s.gold -= cost;
    s.towers.push({ id: s.id++, kind, x: sel.x, y: sel.y, lvl: 1, spent: cost, cd: 0 });
    api.sfx('match');
    setSel(null);
    sync();
  }
  const upCost = (t: Tower) => Math.round(TOWERS[t.kind].cost * 0.75 * t.lvl);
  function upgrade() {
    const s = g.current;
    const t = s.towers.find((x) => x.id === sel?.tower);
    if (!t || t.lvl >= 3) return;
    const cost = upCost(t);
    if (s.gold < cost) { api.sfx('nope'); return; }
    s.gold -= cost; t.lvl += 1; t.spent += cost;
    api.sfx('win');
    sync();
    setSel({ ...sel! });
  }
  function sell() {
    const s = g.current;
    const t = s.towers.find((x) => x.id === sel?.tower);
    if (!t) return;
    s.gold += Math.round(t.spent * 0.7);
    s.towers = s.towers.filter((x) => x !== t);
    api.sfx('pop');
    setSel(null);
    sync();
  }

  const selTower = sel?.tower !== undefined ? g.current.towers.find((t) => t.id === sel.tower) : undefined;
  return (
    <div className="towers">
      <div className="towers__hud">
        <span className="hud-chip"><Emo e="❤️" /> {hud.lives}</span>
        <span className="hud-chip"><Emo e="🪙" /> {hud.gold}</span>
        <span className="hud-chip">{api.t('wave')} {hud.wave}/{waves.length}</span>
        <button className="hud-chip towers__btn" onClick={() => { api.sfx('tap'); setSpeed(speed === 1 ? 2 : 1); }}>{speed === 1 ? '▶ 1×' : '⏩ 2×'}</button>
        <button className="hud-chip towers__btn" onClick={() => { api.sfx('tap'); setPaused(!paused); }}>{paused ? '▶' : '⏸'}</button>
        <button className="towers__wave" onClick={startWave} disabled={hud.running || hud.wave >= waves.length}>▶ {api.t('nextWave')}</button>
      </div>
      <div className="towers__stage" ref={wrapRef}>
        <canvas ref={canvasRef} style={{ width: COLS * cell, height: ROWS * cell }} onPointerDown={tap} />
      </div>
      <div className="towers__menu">
        {sel && !selTower && (
          <>
            {(Object.keys(TOWERS) as TowerKind[]).map((k) => {
              const t = TOWERS[k];
              const locked = level < t.unlock;
              return (
                <button key={k} className="tbtn" disabled={locked || hud.gold < t.cost} onClick={() => build(k)}>
                  <span className="tbtn__icon"><Emo e={locked ? '🔒' : t.emoji} /></span>
                  <small>{api.t(t.nameKey)}</small>
                  <b><Emo e="🪙" /> {t.cost}</b>
                </button>
              );
            })}
            <button className="tbtn tbtn--x" onClick={() => setSel(null)}>✖</button>
          </>
        )}
        {selTower && (
          <>
            <span className="tbtn tbtn--info"><span className="tbtn__icon"><Emo e={TOWERS[selTower.kind].emoji} /></span><small>{api.t(TOWERS[selTower.kind].nameKey)}</small><b>{'★'.repeat(selTower.lvl)}</b></span>
            <button className="tbtn" onClick={upgrade} disabled={selTower.lvl >= 3 || hud.gold < upCost(selTower)}>
              <span className="tbtn__icon">⬆️</span><small>{selTower.lvl >= 3 ? api.t('maxLevel') : api.t('upgrade')}</small>
              {selTower.lvl < 3 && <b><Emo e="🪙" /> {upCost(selTower)}</b>}
            </button>
            <button className="tbtn" onClick={sell}><span className="tbtn__icon"><Emo e="💰" /></span><small>{api.t('sell')}</small><b>+{Math.round(selTower.spent * 0.7)}</b></button>
            <button className="tbtn tbtn--x" onClick={() => setSel(null)}>✖</button>
          </>
        )}
        {!sel && <span className="towers__hint">{api.t('buildHere')} – {api.t('help_towers')}</span>}
      </div>
    </div>
  );
}

