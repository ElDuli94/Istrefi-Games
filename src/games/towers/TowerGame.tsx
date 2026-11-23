/**
 * Kakevakt 2.0 – tårnforsvar for barn.
 * Små kryp går langs stien mot kaken. Bygg tårn som skyter vann, snø, bobler, stjerner, lyn og regnbuer.
 * Treffes et kryp nok, «popper» det til stjerner (jages bort) – ingen vold.
 *
 * - 30 nivåer i tre kapitler (Hagen, Stranden, Snølandet) + uendelig modus med rekord
 * - 8 tårn, oppgradering til nivå 5 (★5 = superkraft)
 * - Kraftknapper: frys alle, konfettibombe, gullregn
 * - Kakeverkstedet: bruk stjernene fra nivåene på varige forbedringer og nye kaker
 */
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import type { GameApi, GameProps } from '../types';
import type { WorldId } from '../../data/worlds';
import type { DictKey } from '../../i18n/no';
import { LevelGrid, advanceGrid, emptyGridProgress, type GridProgress } from '../common/LevelGrid';
import { Emo, emojiImage } from '../../components/Emo';
import './towers.css';

const COLS = 12, ROWS = 8, LEVELS = 30, MAX_LVL = 5;
const ENDLESS = -1;
type P = [number, number];

// Ti stier (hjørnepunkter i rutenettet). Kaken står på siste punkt.
const MAPS: P[][] = [
  [[0, 1], [4, 1], [4, 5], [8, 5], [8, 2], [11, 2]],
  [[0, 6], [3, 6], [3, 1], [7, 1], [7, 6], [11, 6]],
  [[0, 3], [2, 3], [2, 0], [5, 0], [5, 7], [9, 7], [9, 3], [11, 3]],
  [[0, 0], [10, 0], [10, 7], [1, 7], [1, 2], [8, 2], [8, 5], [4, 5]],
  [[1, 0], [1, 6], [4, 6], [4, 1], [7, 1], [7, 6], [10, 6], [10, 0]],
  [[0, 7], [5, 7], [5, 4], [2, 4], [2, 1], [9, 1], [9, 5], [11, 5]],
  [[11, 0], [11, 3], [6, 3], [6, 0], [2, 0], [2, 7], [8, 7], [8, 5]],
  [[0, 1], [6, 1], [6, 6], [11, 6]],
  [[0, 4], [3, 4], [3, 1], [6, 1], [6, 6], [9, 6], [9, 2], [11, 2]],
  [[0, 0], [11, 0], [11, 7], [0, 7], [0, 2], [9, 2], [9, 5], [2, 5], [2, 4]]
];
const THEMES = [
  { grass: ['#95d5b2', '#a3dbb9'], path: ['#f4d58d', '#f6dc9e'], deco: ['🌸', '🌳'], nameKey: 'chapterGarden' as DictKey },
  { grass: ['#ffe8a3', '#ffeebf'], path: ['#d4a373', '#ddb48a'], deco: ['🌴', '🐚'], nameKey: 'chapterBeach' as DictKey },
  { grass: ['#edf6f9', '#f8fbfc'], path: ['#a9def9', '#b9e6fb'], deco: ['⛄', '🌲'], nameKey: 'chapterSnow' as DictKey }
];

type TowerKind = 'water' | 'ice' | 'bubble' | 'sun' | 'star' | 'honey' | 'zap' | 'rainbow';
interface TowerDef {
  emoji: string; nameKey: DictKey; cost: number; range: number; rate: number; dmg: number; color: string; unlock: number;
  slow?: number; splash?: number; pierce?: boolean; chain?: number; aura?: boolean; income?: number;
}
const TOWERS: Record<TowerKind, TowerDef> = {
  water: { emoji: '💧', nameKey: 'towerWater', cost: 40, range: 2.3, rate: 2.2, dmg: 8, color: '#4cc9f0', unlock: 0 },
  ice: { emoji: '❄️', nameKey: 'towerIce', cost: 60, range: 2.0, rate: 1.0, dmg: 4, color: '#bde0fe', slow: 0.45, unlock: 1 },
  bubble: { emoji: '🫧', nameKey: 'towerBubble', cost: 80, range: 2.1, rate: 0.75, dmg: 14, color: '#c77dff', splash: 0.95, unlock: 2 },
  sun: { emoji: '🌻', nameKey: 'towerSun', cost: 70, range: 0, rate: 0, dmg: 0, color: '#ffd166', income: 15, unlock: 3 },
  star: { emoji: '⭐', nameKey: 'towerStar', cost: 120, range: 3.6, rate: 0.6, dmg: 42, color: '#ffd60a', pierce: true, unlock: 4 },
  honey: { emoji: '🍯', nameKey: 'towerHoney', cost: 90, range: 1.8, rate: 0, dmg: 3, color: '#f4a261', slow: 0.5, aura: true, unlock: 6 },
  zap: { emoji: '⚡', nameKey: 'towerZap', cost: 150, range: 2.6, rate: 0.9, dmg: 20, color: '#9b5de5', chain: 3, pierce: true, unlock: 9 },
  rainbow: { emoji: '🌈', nameKey: 'towerRainbow', cost: 230, range: 4.4, rate: 1.1, dmg: 30, color: '#ff70a6', splash: 0.6, pierce: true, unlock: 14 }
};
const KINDS = Object.keys(TOWERS) as TowerKind[];

interface EnemyDef { emoji: string; hp: number; speed: number; reward: number; lives: number; size: number; armor?: number; hop?: boolean; split?: number; boss?: boolean }
const ENEMIES = {
  ant: { emoji: '🐜', hp: 30, speed: 1.6, reward: 5, lives: 1, size: 0.62 },
  ladybug: { emoji: '🐞', hp: 50, speed: 1.1, reward: 6, lives: 1, size: 0.66 },
  caterpillar: { emoji: '🐛', hp: 85, speed: 0.9, reward: 8, lives: 1, size: 0.7 },
  snail: { emoji: '🐌', hp: 140, speed: 0.6, reward: 10, lives: 1, size: 0.72, armor: 0.7 },
  bee: { emoji: '🐝', hp: 40, speed: 2.5, reward: 7, lives: 1, size: 0.6 },
  hopper: { emoji: '🦗', hp: 75, speed: 1.0, reward: 9, lives: 1, size: 0.7, hop: true },
  mouse: { emoji: '🐭', hp: 170, speed: 1.25, reward: 12, lives: 2, size: 0.72, armor: 0.5 },
  spider: { emoji: '🕷️', hp: 130, speed: 0.95, reward: 10, lives: 2, size: 0.74, split: 3 },
  beetle: { emoji: '🪲', hp: 450, speed: 0.5, reward: 40, lives: 3, size: 0.95, armor: 0.6 },
  raccoon: { emoji: '🦝', hp: 2600, speed: 0.36, reward: 150, lives: 10, size: 1.25, armor: 0.75, boss: true },
  bear: { emoji: '🐻', hp: 6500, speed: 0.3, reward: 400, lives: 20, size: 1.45, armor: 0.7, boss: true }
} satisfies Record<string, EnemyDef>;
type EnemyKind = keyof typeof ENEMIES;
const EN: Record<EnemyKind, EnemyDef> = ENEMIES;

const WORLD_TUNE: Record<WorldId, { hp: number; gold: number; lives: number; bonus: number }> = {
  tiny: { hp: 0.55, gold: 60, lives: 15, bonus: 1.3 },
  small: { hp: 0.75, gold: 40, lives: 12, bonus: 1.15 },
  mid: { hp: 1.0, gold: 10, lives: 10, bonus: 1 },
  big: { hp: 1.45, gold: -10, lives: 8, bonus: 0.9 }
};

/** Bølger for et nivå (eller bølge nr. w i uendelig modus) */
function waveFor(level: number, w: number, n: number): EnemyKind[] {
  const lvl = level === ENDLESS ? Math.min(29, Math.floor(w * 0.9)) : level;
  const pool: EnemyKind[] = ['ant', 'ladybug'];
  if (lvl >= 1 && w >= 1) pool.push('caterpillar');
  if (lvl >= 3 && w >= 2) pool.push('snail');
  if (lvl >= 5 && w >= 1) pool.push('bee');
  if (lvl >= 8 && w >= 1) pool.push('hopper');
  if (lvl >= 11 && w >= 2) pool.push('mouse');
  if (lvl >= 14 && w >= 2) pool.push('spider');
  const count = Math.round(5 + w * 2 + lvl * 0.45);
  const wave: EnemyKind[] = Array.from({ length: count }, (_, i) => pool[(i * 7 + w * 3 + lvl) % pool.length]);
  if (lvl >= 2 && w === n - 1) wave.push('beetle');
  if (lvl >= 6 && w >= n - 2) wave.push('beetle');
  if (lvl >= 18 && w >= n - 3) wave.push('beetle', 'beetle');
  if (level !== ENDLESS && w === n - 1 && lvl % 10 === 9) wave.push('raccoon');
  if (level === 29 && w === n - 1) wave.push('bear');
  if (level === ENDLESS && w > 0 && w % 10 === 9) wave.push(w >= 29 ? 'bear' : 'raccoon');
  return wave;
}
const waveCount = (level: number) => (level === ENDLESS ? Infinity : 4 + Math.floor(level / 3));

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

// ---------------- Kakeverkstedet (varige forbedringer) ----------------
type PerkId = 'gold' | 'lives' | 'power' | 'cheap' | 'freeze' | 'bomb' | 'rain';
const PERKS: { id: PerkId; emoji: string; nameKey: DictKey; costs: number[] }[] = [
  { id: 'gold', emoji: '🪙', nameKey: 'perkGold', costs: [3, 5, 8, 12] },
  { id: 'lives', emoji: '❤️', nameKey: 'perkLives', costs: [4, 7, 10] },
  { id: 'power', emoji: '💪', nameKey: 'perkPower', costs: [4, 6, 9, 12, 15] },
  { id: 'cheap', emoji: '🏷️', nameKey: 'perkCheap', costs: [5, 8, 11, 14] },
  { id: 'freeze', emoji: '🧊', nameKey: 'perkFreeze', costs: [6] },
  { id: 'rain', emoji: '💰', nameKey: 'perkRain', costs: [8] },
  { id: 'bomb', emoji: '🎉', nameKey: 'perkBomb', costs: [10] }
];
const CAKES: { e: string; cost: number }[] = [
  { e: '🎂', cost: 0 }, { e: '🧁', cost: 3 }, { e: '🍩', cost: 6 }, { e: '🍰', cost: 10 }, { e: '🍪', cost: 15 }, { e: '🥧', cost: 20 }, { e: '🍫', cost: 25 }
];

interface Saved { grid: GridProgress; spent: number; perks: Partial<Record<PerkId, number>>; cakes: string[]; cake: string; highscore: number }
function loadSaved(api: GameApi): Saved {
  const d = api.loadData<Saved | GridProgress>();
  const base: Saved = { grid: emptyGridProgress(), spent: 0, perks: {}, cakes: ['🎂'], cake: '🎂', highscore: 0 };
  if (!d) return base;
  if ('unlocked' in d) return { ...base, grid: d }; // gammel lagring (bare nivåer)
  return { ...base, ...d };
}
const starsEarned = (s: Saved) => s.grid.best.reduce((a, b) => a + (b ?? 0), 0);

export default function TowerGame(props: GameProps) {
  const { api } = props;
  const [saved, setSaved] = useState<Saved>(() => loadSaved(api));
  const [level, setLevel] = useState<number | null>(null);
  const [shop, setShop] = useState(false);
  useEffect(() => {
    api.setBack(level !== null ? () => setLevel(null) : shop ? () => setShop(false) : null);
    return () => api.setBack(null);
  }, [level, shop]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = (s: Saved) => { setSaved(s); api.saveData(s); };
  const free = starsEarned(saved) - saved.spent;

  if (shop) return <Workshop api={api} saved={saved} free={free} onSave={save} />;
  if (level === null) {
    return (
      <LevelGrid
        api={api}
        count={LEVELS}
        progress={saved.grid}
        onPick={setLevel}
        extra={
          <div className="towers-extra">
            <button className="towers-extra__btn towers-extra__btn--shop" onClick={() => { api.sfx('pop'); api.speak(api.t('workshop')); setShop(true); }}>
              <Emo e="🛠️" /> {api.t('workshop')} <span className="towers-extra__stars"><Emo e="⭐" /> {free}</span>
            </button>
            <button
              className="towers-extra__btn"
              disabled={saved.grid.unlocked < 6}
              onClick={() => { api.sfx('pop'); setLevel(ENDLESS); }}
            >
              <Emo e="♾️" /> {api.t('endless')} {saved.highscore > 0 && <small>🏆 {saved.highscore}</small>}
              {saved.grid.unlocked < 6 && <small>🔒 {api.t('unlockAt', { n: 5 })}</small>}
            </button>
          </div>
        }
      />
    );
  }
  return (
    <Play
      key={level}
      {...props}
      level={level}
      saved={saved}
      onEnd={(won, stars, waves) => {
        if (level === ENDLESS) {
          if (waves > saved.highscore) save({ ...saved, highscore: waves });
          return false;
        }
        const { next, firstClear } = advanceGrid(saved.grid, level, won, stars, LEVELS);
        save({ ...saved, grid: next });
        return firstClear;
      }}
    />
  );
}

function Workshop({ api, saved, free, onSave }: { api: GameApi; saved: Saved; free: number; onSave: (s: Saved) => void }) {
  useEffect(() => { api.speak(api.t('workshopHint')); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  function buyPerk(id: PerkId, cost: number) {
    if (free < cost) { api.sfx('nope'); api.speak(api.t('needStars', { n: cost - free })); return; }
    api.sfx('sticker');
    onSave({ ...saved, spent: saved.spent + cost, perks: { ...saved.perks, [id]: (saved.perks[id] ?? 0) + 1 } });
  }
  function cake(e: string, cost: number) {
    if (saved.cakes.includes(e)) { api.sfx('pop'); onSave({ ...saved, cake: e }); return; }
    if (free < cost) { api.sfx('nope'); api.speak(api.t('needStars', { n: cost - free })); return; }
    api.sfx('sticker');
    onSave({ ...saved, spent: saved.spent + cost, cakes: [...saved.cakes, e], cake: e });
  }
  return (
    <div className="workshop">
      <h2><Emo e="🛠️" /> {api.t('workshop')} <span className="workshop__stars"><Emo e="⭐" /> {free}</span></h2>
      <p className="workshop__hint">{api.t('workshopHint')}</p>
      <div className="workshop__grid">
        {PERKS.map((p) => {
          const have = saved.perks[p.id] ?? 0;
          const max = have >= p.costs.length;
          const cost = p.costs[have];
          return (
            <button key={p.id} className={`perk ${max ? 'is-max' : ''}`} disabled={max} onClick={() => buyPerk(p.id, cost)}>
              <span className="perk__icon"><Emo e={p.emoji} /></span>
              <b>{api.t(p.nameKey)}</b>
              <span className="perk__pips">{p.costs.map((_, k) => <i key={k} className={k < have ? 'on' : ''} />)}</span>
              <span className="perk__cost">{max ? '✔' : <><Emo e="⭐" /> {cost}</>}</span>
            </button>
          );
        })}
      </div>
      <h3>{api.t('chooseCake')}</h3>
      <div className="workshop__cakes">
        {CAKES.map((c) => {
          const owned = saved.cakes.includes(c.e);
          return (
            <button key={c.e} className={`cakebtn ${saved.cake === c.e ? 'is-on' : ''}`} onClick={() => cake(c.e, c.cost)}>
              <span><Emo e={c.e} /></span>
              <small>{owned ? (saved.cake === c.e ? '✔' : '') : <><Emo e="⭐" /> {c.cost}</>}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface Enemy { id: number; kind: EnemyKind; d: number; hp: number; max: number; slowUntil: number; frozenUntil: number; hopCd: number }
interface Tower { id: number; kind: TowerKind; x: number; y: number; lvl: number; spent: number; cd: number }
interface Shot { from: P; to: number; kind: TowerKind; t: number; dmg: number; slow?: number; splash?: number; pierce?: boolean; tx: number; ty: number }
interface Fx { x: number; y: number; t: number; text?: string; emoji?: string; line?: [number, number, number, number] }
type Power = 'freeze' | 'rain' | 'bomb';
const POWERS: { id: Power; emoji: string; cd: number }[] = [{ id: 'freeze', emoji: '🧊', cd: 35 }, { id: 'rain', emoji: '💰', cd: 45 }, { id: 'bomb', emoji: '🎉', cd: 30 }];

function Play({ api, world, onFinish, level, saved, onEnd }: GameProps & { level: number; saved: Saved; onEnd: (won: boolean, stars: number, waves: number) => boolean }) {
  const tune = WORLD_TUNE[world];
  const endless = level === ENDLESS;
  const chapter = endless ? 2 : Math.floor(level / 10);
  const theme = THEMES[chapter];
  const map = pathOf(MAPS[endless ? 9 : level % MAPS.length]);
  const nWaves = waveCount(level);
  const perk = (id: PerkId) => saved.perks[id] ?? 0;
  const startGold = Math.max(100, 120 + tune.gold + perk('gold') * 25 + (endless ? 80 : Math.max(0, level) * 16));
  const startLives = tune.lives + perk('lives') * 2;
  const powerMult = 1 + perk('power') * 0.1;
  const costMult = 1 - perk('cheap') * 0.05;
  const costOf = (k: TowerKind) => Math.round(TOWERS[k].cost * costMult);
  const powers = POWERS.filter((p) => perk(p.id) > 0);
  const lvlForUnlock = endless ? 29 : level;

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cell, setCell] = useState(48);
  const [hud, setHud] = useState({ gold: startGold, lives: startLives, wave: 0, running: false });
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [sel, setSel] = useState<{ x: number; y: number; tower?: number } | null>(null);
  const [cds, setCds] = useState<Record<Power, number>>({ freeze: 0, rain: 0, bomb: 0 });
  const [auto, setAuto] = useState(false);
  const ended = useRef(false);

  const g = useRef({
    gold: startGold, lives: startLives, wave: 0, running: false,
    enemies: [] as Enemy[], towers: [] as Tower[], shots: [] as Shot[], fx: [] as Fx[],
    spawnQueue: [] as EnemyKind[], spawnCd: 0, id: 1, time: 0, speed: 1, paused: false,
    cds: { freeze: 0, rain: 0, bomb: 0 } as Record<Power, number>, auto: false, autoCd: 0
  });
  const sync = () => { const s = g.current; setHud({ gold: s.gold, lives: s.lives, wave: s.wave, running: s.running }); };

  useEffect(() => { api.speak(endless ? api.t('endlessHint') : api.t(theme.nameKey)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { g.current.speed = speed; }, [speed]);
  useEffect(() => { g.current.paused = paused; }, [paused]);
  useEffect(() => { g.current.auto = auto; }, [auto]);
  useEffect(() => {
    [...KINDS.map((k) => TOWERS[k].emoji), ...Object.values(EN).map((e) => e.emoji), saved.cake, ...theme.deco, '⭐', '🧊', '🎉', '💰', '⚡'].forEach((e) => emojiImage(e));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Nedtelling for kraftknappene vises hvert halve sekund
  useEffect(() => { const id = setInterval(() => setCds({ ...g.current.cds }), 500); return () => clearInterval(id); }, []);

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
  const statsOf = (t: Tower) => {
    const b = TOWERS[t.kind];
    const sup = t.lvl >= MAX_LVL ? 1.3 : 1;
    const m = (1 + (t.lvl - 1) * 0.55) * sup * powerMult;
    return {
      ...b, dmg: b.dmg * m, range: b.range * (1 + (t.lvl - 1) * 0.1), rate: b.rate * (1 + (t.lvl - 1) * 0.12),
      chain: b.chain ? b.chain + (t.lvl - 1) : undefined, splash: b.splash ? b.splash * (1 + (t.lvl - 1) * 0.12) : undefined,
      income: b.income ? b.income * t.lvl : undefined, slow: b.slow ? Math.max(0.25, b.slow - (t.lvl - 1) * 0.04) : undefined
    };
  };

  function startWave() {
    const s = g.current;
    if (s.running || s.wave >= nWaves || ended.current) return;
    s.spawnQueue = waveFor(level, s.wave, nWaves);
    s.wave += 1;
    s.running = true;
    s.spawnCd = 0;
    api.sfx('pop');
    if (!s.auto) api.speak(s.spawnQueue.some((k) => EN[k].boss) ? api.t('bossIncoming') : api.t('waveIncoming'));
    sync();
  }

  function finish(won: boolean) {
    if (ended.current) return;
    ended.current = true;
    const s = g.current;
    const survived = endless ? s.wave - 1 : s.wave;
    let stars = 0;
    if (endless) stars = survived >= 20 ? 3 : survived >= 10 ? 2 : survived >= 5 ? 1 : 0;
    else if (won) stars = s.lives >= startLives ? 3 : s.lives >= startLives * 0.6 ? 2 : 1;
    const ok = endless ? survived >= 5 : won;
    api.speak(endless ? api.t('endlessResult', { n: survived }) : won ? api.t('cakeSaved') : api.t('cakeEaten'));
    const firstClear = onEnd(ok, stars, survived);
    setTimeout(() => onFinish(endless
      ? { won: ok, stars, score: survived, coins: Math.min(60, survived * 2) }
      : { won, stars, firstClear }), 1400);
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

  function damage(e: Enemy, dmg: number, pierce?: boolean) {
    const armor = EN[e.kind].armor;
    e.hp -= pierce || !armor ? dmg : dmg * armor;
  }

  function step(dt: number) {
    const s = g.current;
    let changed = false;
    for (const p of POWERS) s.cds[p.id] = Math.max(0, s.cds[p.id] - dt);
    // Nye kryp
    if (s.spawnQueue.length) {
      s.spawnCd -= dt;
      if (s.spawnCd <= 0) {
        const kind = s.spawnQueue.shift()!;
        const e = EN[kind];
        const wScale = endless ? 0.8 + s.wave * 0.11 + Math.max(0, s.wave - 20) * 0.06 : 0.7 + (s.wave - 1) * 0.08;
        const hp = Math.round(e.hp * tune.hp * (endless ? 1 : 1 + level * 0.1) * wScale);
        s.enemies.push({ id: s.id++, kind, d: 0, hp, max: hp, slowUntil: 0, frozenUntil: 0, hopCd: 1.5 });
        s.spawnCd = e.boss ? 2.4 : kind === 'beetle' ? 1.4 : kind === 'bee' ? 0.45 : 0.8;
        if (e.boss) api.sfx('nope');
      }
    }
    // Honning-tårn: senker farten på alle i nærheten og gir litt skade
    for (const t of s.towers) {
      if (!TOWERS[t.kind].aura) continue;
      const st = statsOf(t);
      const cx = t.x + 0.5, cy = t.y + 0.5;
      for (const e of s.enemies) {
        const [ex, ey] = posAt(e.d);
        if (Math.hypot(ex - cx, ey - cy) <= st.range) { e.slowUntil = Math.max(e.slowUntil, s.time + 0.25); damage(e, st.dmg * dt, true); }
      }
    }
    // Bevegelse
    for (const e of s.enemies) {
      const def = EN[e.kind];
      if (e.frozenUntil > s.time) continue;
      const slow = e.slowUntil > s.time ? 0.5 : 1;
      e.d += def.speed * slow * dt;
      if (def.hop) { e.hopCd -= dt; if (e.hopCd <= 0) { e.d += 1.1; e.hopCd = 2.2; } }
      if (e.d >= map.total && e.hp > 0) {
        e.hp = -999;
        s.lives -= def.lives;
        api.sfx('nope');
        changed = true;
      }
    }
    // Tårn skyter
    for (const t of s.towers) {
      const b = TOWERS[t.kind];
      if (b.aura || b.income) continue;
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
      if (!best) continue;
      t.cd = 1 / st.rate;
      if (st.chain) {
        // Lyn hopper fra kryp til kryp
        const hitList: Enemy[] = [best];
        let cur = best;
        while (hitList.length < st.chain) {
          const [px, py] = posAt(cur.d);
          let nxt: Enemy | null = null, nd = 1.8;
          for (const e of s.enemies) {
            if (e.hp <= 0 || hitList.includes(e)) continue;
            const [ex, ey] = posAt(e.d);
            const dd = Math.hypot(ex - px, ey - py);
            if (dd < nd) { nd = dd; nxt = e; }
          }
          if (!nxt) break;
          hitList.push(nxt); cur = nxt;
        }
        let [lx, ly] = [cx, cy];
        for (const e of hitList) {
          const [ex, ey] = posAt(e.d);
          damage(e, st.dmg, true);
          s.fx.push({ x: ex, y: ey, t: 0.5, line: [lx, ly, ex, ey] });
          [lx, ly] = [ex, ey];
        }
        continue;
      }
      const [ex, ey] = posAt(best.d);
      s.shots.push({ from: [cx, cy], to: best.id, kind: t.kind, t: 0, dmg: st.dmg, slow: st.slow, splash: st.splash, pierce: st.pierce, tx: ex, ty: ey });
      // ★5 vannsprut skyter dobbelt
      if (t.kind === 'water' && t.lvl >= MAX_LVL) s.shots.push({ from: [cx, cy], to: best.id, kind: t.kind, t: -0.25, dmg: st.dmg, tx: ex, ty: ey });
    }
    // Skudd flyr
    for (const sh of s.shots) {
      const target = s.enemies.find((e) => e.id === sh.to && e.hp > 0);
      if (target) [sh.tx, sh.ty] = posAt(target.d);
      sh.t += dt * 7;
      if (sh.t >= 1) {
        const hit = (e: Enemy) => {
          damage(e, sh.dmg, sh.pierce);
          if (sh.slow) e.slowUntil = s.time + 1.5;
        };
        if (sh.splash) {
          for (const e of s.enemies) { if (e.hp <= 0) continue; const [ex, ey] = posAt(e.d); if (Math.hypot(ex - sh.tx, ey - sh.ty) <= sh.splash) hit(e); }
          s.fx.push({ x: sh.tx, y: sh.ty, t: 0, emoji: sh.kind === 'rainbow' ? '🌈' : '🫧' });
        } else if (target) hit(target);
      }
    }
    s.shots = s.shots.filter((sh) => sh.t < 1);
    // Kryp som popper (edderkopper deler seg i maur)
    const born: Enemy[] = [];
    for (const e of s.enemies) {
      if (e.hp <= 0 && e.hp > -999) {
        const [ex, ey] = posAt(e.d);
        const def = EN[e.kind];
        const reward = Math.round(def.reward * tune.bonus);
        s.gold += reward;
        s.fx.push({ x: ex, y: ey, t: 0, emoji: def.boss ? '🎉' : '⭐' }, { x: ex, y: ey - 0.3, t: 0, text: `+${reward}` });
        if (def.split) for (let k = 0; k < def.split; k++) {
          const hp = Math.round(e.max * 0.18);
          born.push({ id: s.id++, kind: 'ant', d: Math.max(0, e.d - k * 0.25), hp, max: hp, slowUntil: 0, frozenUntil: 0, hopCd: 9 });
        }
        api.sfx('pop');
        changed = true;
      }
    }
    s.enemies = s.enemies.filter((e) => e.hp > 0).concat(born);
    s.fx.forEach((f) => (f.t += dt));
    s.fx = s.fx.filter((f) => f.t < 0.9);
    // Bølge ferdig?
    if (s.running && !s.spawnQueue.length && !s.enemies.length) {
      s.running = false;
      const income = s.towers.reduce((a, t) => a + (statsOf(t).income ?? 0), 0);
      s.gold += Math.round((20 + s.wave * 5) * tune.bonus) + income;
      if (income) s.fx.push({ x: COLS / 2, y: 1, t: 0, text: `🌻 +${income}` });
      changed = true;
      if (s.wave >= nWaves) finish(true);
      else if (s.auto) s.autoCd = 2.5;
    }
    // Automatisk neste bølge
    if (s.auto && !s.running && !ended.current) { s.autoCd -= dt; if (s.autoCd <= 0) { startWave(); s.autoCd = 2.5; } }
    if (s.lives <= 0) { s.lives = 0; finish(false); }
    if (changed) sync();
  }

  function firePower(p: Power) {
    const s = g.current;
    if (s.cds[p] > 0 || ended.current) return;
    s.cds[p] = POWERS.find((x) => x.id === p)!.cd;
    if (p === 'freeze') {
      for (const e of s.enemies) e.frozenUntil = s.time + (EN[e.kind].boss ? 1.5 : 3.5);
      s.fx.push({ x: COLS / 2, y: ROWS / 2, t: 0, emoji: '🧊' });
      api.sfx('flip');
    } else if (p === 'rain') {
      s.gold += 60 + s.wave * 5;
      for (let k = 0; k < 8; k++) s.fx.push({ x: 1 + k * 1.4, y: 1 + (k % 3), t: k * 0.05, emoji: '🪙' });
      api.sfx('sticker');
    } else {
      // Konfettibombe der det er flest kryp (rundt krypet som har kommet lengst)
      const lead = [...s.enemies].sort((a, b) => b.d - a.d)[0];
      if (lead) {
        const [bx, by] = posAt(lead.d);
        for (const e of s.enemies) { const [ex, ey] = posAt(e.d); if (Math.hypot(ex - bx, ey - by) <= 2.2) damage(e, 220 * tune.hp * (1 + Math.max(0, level) * 0.1) * powerMult, true); }
        for (let k = 0; k < 6; k++) s.fx.push({ x: bx + Math.cos(k) * 0.8, y: by + Math.sin(k) * 0.8, t: 0, emoji: '🎉' });
      }
      api.sfx('win');
    }
    setCds({ ...s.cds });
    sync();
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
    // Bakken og stien (farger etter kapittel)
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const path = map.cells.has(`${x},${y}`);
      ctx.fillStyle = path ? theme.path[(x + y) % 2] : theme.grass[(x + y) % 2];
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
    // Pynt på noen ruter
    for (let i = 0; i < 6; i++) {
      const x = (i * 5 + Math.max(0, level) * 3) % COLS, y = (i * 3 + Math.max(0, level)) % ROWS;
      if (!map.cells.has(`${x},${y}`) && !s.towers.some((t) => t.x === x && t.y === y)) drawEmoji(ctx, theme.deco[i % 2], (x + 0.5) * cell, (y + 0.5) * cell, cell * 0.55);
    }
    // Start og kake
    const start = map.corners[0], end = map.corners[map.corners.length - 1];
    ctx.fillStyle = '#ff006e55'; ctx.fillRect(start[0] * cell, start[1] * cell, cell, cell);
    drawEmoji(ctx, saved.cake, (end[0] + 0.5) * cell, (end[1] + 0.5) * cell, cell * 0.95);
    // Valgt rute / rekkevidde
    if (sel) {
      const t = sel.tower !== undefined ? s.towers.find((x) => x.id === sel.tower) : null;
      if (t && statsOf(t).range > 0) {
        const st = statsOf(t);
        ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc((t.x + 0.5) * cell, (t.y + 0.5) * cell, st.range * cell, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else if (!t) {
        ctx.strokeStyle = '#ffd60a'; ctx.lineWidth = 3; ctx.strokeRect(sel.x * cell + 2, sel.y * cell + 2, cell - 4, cell - 4);
      }
    }
    // Tårn
    for (const t of s.towers) {
      const x = (t.x + 0.5) * cell, y = (t.y + 0.5) * cell;
      const def = TOWERS[t.kind];
      if (def.aura) { ctx.fillStyle = 'rgba(244,162,97,.16)'; ctx.beginPath(); ctx.arc(x, y, statsOf(t).range * cell, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = def.color; ctx.beginPath(); ctx.arc(x, y, cell * 0.44, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = t.lvl >= MAX_LVL ? '#ffd60a' : '#fff'; ctx.lineWidth = t.lvl >= MAX_LVL ? 5 : 3; ctx.stroke();
      drawEmoji(ctx, def.emoji, x, y, cell * 0.62);
      for (let k = 0; k < t.lvl; k++) { ctx.fillStyle = '#ffd60a'; ctx.beginPath(); ctx.arc(x - cell * 0.28 + k * cell * 0.14, y + cell * 0.38, cell * 0.055, 0, Math.PI * 2); ctx.fill(); }
    }
    // Kryp
    for (const e of s.enemies) {
      const [ex, ey] = posAt(e.d);
      const def = EN[e.kind];
      const size = cell * def.size;
      const bob = e.frozenUntil > s.time ? 0 : Math.sin(s.time * 12 + e.id) * cell * 0.03;
      drawEmoji(ctx, def.emoji, ex * cell, ey * cell + bob, size);
      if (e.frozenUntil > s.time) drawEmoji(ctx, '🧊', ex * cell, ey * cell, size * 0.7);
      else if (e.slowUntil > s.time) drawEmoji(ctx, '❄️', ex * cell + size * 0.35, ey * cell - size * 0.35, cell * 0.25);
      if (def.armor) drawEmoji(ctx, '🛡️', ex * cell - size * 0.38, ey * cell - size * 0.3, cell * 0.22);
      // Livsstripe
      const w = def.boss ? cell * 1.2 : cell * 0.6;
      ctx.fillStyle = '#00000044'; ctx.fillRect(ex * cell - w / 2, ey * cell - size / 2 - 7, w, 5);
      ctx.fillStyle = def.boss ? '#ff006e' : '#06d6a0'; ctx.fillRect(ex * cell - w / 2, ey * cell - size / 2 - 7, w * Math.max(0, e.hp / e.max), 5);
    }
    // Skudd
    for (const sh of s.shots) {
      if (sh.t < 0) continue;
      const x = (sh.from[0] + (sh.tx - sh.from[0]) * sh.t) * cell, y = (sh.from[1] + (sh.ty - sh.from[1]) * sh.t) * cell;
      if (sh.kind === 'water') { ctx.fillStyle = '#4cc9f0'; ctx.beginPath(); ctx.arc(x, y, cell * 0.1, 0, Math.PI * 2); ctx.fill(); }
      else drawEmoji(ctx, sh.kind === 'ice' ? '❄️' : sh.kind === 'bubble' ? '🫧' : sh.kind === 'rainbow' ? '🌈' : '⭐', x, y, cell * 0.3);
    }
    // Effekter
    for (const f of s.fx) {
      ctx.globalAlpha = Math.max(0, 1 - f.t / 0.9);
      if (f.line) {
        ctx.strokeStyle = '#fff3b0'; ctx.lineWidth = 4; ctx.shadowColor = '#9b5de5'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.moveTo(f.line[0] * cell, f.line[1] * cell); ctx.lineTo(f.line[2] * cell, f.line[3] * cell); ctx.stroke();
        ctx.shadowBlur = 0;
      }
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
    const cost = costOf(kind);
    if (s.gold < cost) { api.sfx('nope'); return; }
    s.gold -= cost;
    s.towers.push({ id: s.id++, kind, x: sel.x, y: sel.y, lvl: 1, spent: cost, cd: 0 });
    api.sfx('match');
    setSel(null);
    sync();
  }
  const upCost = (t: Tower) => Math.round(TOWERS[t.kind].cost * costMult * 0.7 * t.lvl);
  function upgrade() {
    const s = g.current;
    const t = s.towers.find((x) => x.id === sel?.tower);
    if (!t || t.lvl >= MAX_LVL) return;
    const cost = upCost(t);
    if (s.gold < cost) { api.sfx('nope'); return; }
    s.gold -= cost; t.lvl += 1; t.spent += cost;
    api.sfx('win');
    if (t.lvl === MAX_LVL) api.speak(api.t('superTower'));
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
  const waveLabel = endless ? `${hud.wave}` : `${hud.wave}/${nWaves}`;
  return (
    <div className="towers">
      <div className="towers__hud">
        <span className="hud-chip"><Emo e="❤️" /> {hud.lives}</span>
        <span className="hud-chip"><Emo e="🪙" /> {hud.gold}</span>
        <span className="hud-chip">{endless ? '♾️' : api.t('wave')} {waveLabel}</span>
        {powers.map((p) => (
          <button key={p.id} className={`hud-chip towers__power ${cds[p.id] > 0 ? 'is-cd' : ''}`} onClick={() => firePower(p.id)} disabled={cds[p.id] > 0} aria-label={api.t(p.id === 'freeze' ? 'perkFreeze' : p.id === 'rain' ? 'perkRain' : 'perkBomb')}>
            <Emo e={p.emoji} />{cds[p.id] > 0 && <small>{Math.ceil(cds[p.id])}</small>}
          </button>
        ))}
        <button className="hud-chip towers__btn" onClick={() => { api.sfx('tap'); setSpeed(speed === 1 ? 2 : speed === 2 ? 3 : 1); }}>{speed === 1 ? '▶ 1×' : speed === 2 ? '⏩ 2×' : '⏩ 3×'}</button>
        <button className="hud-chip towers__btn" onClick={() => { api.sfx('tap'); setPaused(!paused); }}>{paused ? '▶' : '⏸'}</button>
        <button className={`hud-chip towers__btn ${auto ? 'is-on' : ''}`} onClick={() => { api.sfx('tap'); setAuto(!auto); if (!auto) g.current.autoCd = 0.5; }} aria-label={api.t('autoWave')}>🔁</button>
        <button className="towers__wave" onClick={startWave} disabled={hud.running || hud.wave >= nWaves}>▶ {api.t('nextWave')}</button>
      </div>
      <div className="towers__stage" ref={wrapRef}>
        <canvas ref={canvasRef} style={{ width: COLS * cell, height: ROWS * cell }} onPointerDown={tap} />
      </div>
      <div className="towers__menu">
        {sel && !selTower && (
          <>
            {KINDS.map((k) => {
              const t = TOWERS[k];
              const locked = lvlForUnlock < t.unlock;
              return (
                <button key={k} className="tbtn" disabled={locked || hud.gold < costOf(k)} onClick={() => build(k)} title={api.t(t.nameKey)}>
                  <span className="tbtn__icon"><Emo e={locked ? '🔒' : t.emoji} /></span>
                  <small>{locked ? api.t('levelN', { n: t.unlock + 1 }) : api.t(t.nameKey)}</small>
                  <b><Emo e="🪙" /> {costOf(k)}</b>
                </button>
              );
            })}
            <button className="tbtn tbtn--x" onClick={() => setSel(null)}>✖</button>
          </>
        )}
        {selTower && (
          <>
            <span className="tbtn tbtn--info"><span className="tbtn__icon"><Emo e={TOWERS[selTower.kind].emoji} /></span><small>{api.t(TOWERS[selTower.kind].nameKey)}</small><b>{'★'.repeat(selTower.lvl)}</b></span>
            <button className="tbtn" onClick={upgrade} disabled={selTower.lvl >= MAX_LVL || hud.gold < upCost(selTower)}>
              <span className="tbtn__icon">{selTower.lvl === MAX_LVL - 1 ? '🌟' : '⬆️'}</span><small>{selTower.lvl >= MAX_LVL ? api.t('maxLevel') : selTower.lvl === MAX_LVL - 1 ? api.t('superUpgrade') : api.t('upgrade')}</small>
              {selTower.lvl < MAX_LVL && <b><Emo e="🪙" /> {upCost(selTower)}</b>}
            </button>
            <button className="tbtn" onClick={sell}><span className="tbtn__icon"><Emo e="💰" /></span><small>{api.t('sell')}</small><b>+{Math.round(selTower.spent * 0.7)}</b></button>
            <button className="tbtn tbtn--x" onClick={() => setSel(null)}>✖</button>
          </>
        )}
        {!sel && <span className="towers__hint">{endless ? api.t('endlessHint') : `${api.t(theme.nameKey)} · ${api.t('buildHere')}`}</span>}
      </div>
    </div>
  );
}
