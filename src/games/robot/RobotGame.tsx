/**
 * Robotkoding – legg kommandoer i rekkefølge og trykk Kjør, så roboten finner diamanten.
 * Nivå 1–6: piler som flytter roboten i den retningen pilen peker.
 * Nivå 7–12: roboten kan bare gå «fram» og snu seg – barnet må tenke på hvilken vei den ser.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameProps } from '../types';
import { LevelGrid, advanceGrid, emptyGridProgress, type GridProgress } from '../common/LevelGrid';
import './robot.css';

type Dir = 0 | 1 | 2 | 3; // 0=høyre 1=ned 2=venstre 3=opp
type Cmd = 'R' | 'D' | 'L' | 'U' | 'F' | 'TL' | 'TR';
const VEC: [number, number][] = [[1, 0], [0, 1], [-1, 0], [0, -1]];

const MAPS = [
  ['......', '......', 'S...G.', '......', '......', '......'],
  ['S.....', '......', '......', '...G..', '......', '......'],
  ['S.#...', '..#...', '..#.G.', '......', '......', '......'],
  ['......', '.####.', '.#G.#.', '.#..#.', 'S...#.', '......'],
  ['G.#...', '.##.#.', '...#..', '.#...#', '.#.#..', '...#.S'],
  ['S#...G', '.#.#..', '.#.#.#', '...#..', '##.##.', '......']
];
const LEVELS = 12;
const relative = (lvl: number) => lvl >= 6;
const mapFor = (lvl: number) => MAPS[lvl % 6];

function parse(map: string[]) {
  let start: [number, number] = [0, 0], goal: [number, number] = [0, 0];
  const rocks = new Set<string>();
  map.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === 'S') start = [x, y];
    if (c === 'G') goal = [x, y];
    if (c === '#') rocks.add(`${x},${y}`);
  }));
  return { start, goal, rocks, w: map[0].length, h: map.length };
}

/** Korteste løsning (for stjerner) */
function optimal(lvl: number) {
  const m = parse(mapFor(lvl));
  const rel = relative(lvl);
  const key = (x: number, y: number, d: number) => `${x},${y},${rel ? d : 0}`;
  const q: [number, number, number, number][] = [[m.start[0], m.start[1], 0, 0]];
  const seen = new Set([key(m.start[0], m.start[1], 0)]);
  const free = (x: number, y: number) => x >= 0 && y >= 0 && x < m.w && y < m.h && !m.rocks.has(`${x},${y}`);
  while (q.length) {
    const [x, y, d, steps] = q.shift()!;
    if (x === m.goal[0] && y === m.goal[1]) return steps;
    const next: [number, number, number][] = rel
      ? [[x + VEC[d][0], y + VEC[d][1], d], [x, y, (d + 3) % 4], [x, y, (d + 1) % 4]]
      : VEC.map(([dx, dy]) => [x + dx, y + dy, 0] as [number, number, number]);
    for (const [nx, ny, nd] of next) {
      if (!free(nx, ny) || seen.has(key(nx, ny, nd))) continue;
      seen.add(key(nx, ny, nd));
      q.push([nx, ny, nd, steps + 1]);
    }
  }
  return 99;
}

export default function RobotGame(props: GameProps) {
  const { api } = props;
  const [progress, setProgress] = useState<GridProgress>(() => api.loadData<GridProgress>() ?? emptyGridProgress());
  const [level, setLevel] = useState<number | null>(null);
  if (level === null) return <LevelGrid api={api} count={LEVELS} progress={progress} onPick={setLevel} />;
  return (
    <Play
      {...props}
      level={level}
      onWin={(stars) => {
        const { next, firstClear } = advanceGrid(progress, level, true, stars, LEVELS);
        setProgress(next);
        api.saveData(next);
        return firstClear;
      }}
    />
  );
}

function Play({ api, onFinish, level, onWin }: GameProps & { level: number; onWin: (stars: number) => boolean }) {
  const m = useMemo(() => parse(mapFor(level)), [level]);
  const rel = relative(level);
  const best = useMemo(() => optimal(level), [level]);
  const maxLen = rel ? 22 : 16;
  const [program, setProgram] = useState<Cmd[]>([]);
  const [bot, setBot] = useState({ x: m.start[0], y: m.start[1], d: 0 as Dir });
  const [running, setRunning] = useState(false);
  const [active, setActive] = useState(-1);
  const [msg, setMsg] = useState<string | null>(null);
  const [bump, setBump] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    api.speak(rel ? api.t('robotHelpTurn') : api.t('robotHelp'));
    return () => timers.current.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cmds: { c: Cmd; icon: string; label: string }[] = rel
    ? [{ c: 'TL', icon: '↪️', label: api.t('turnLeft') }, { c: 'F', icon: '⬆️', label: api.t('forward') }, { c: 'TR', icon: '↩️', label: api.t('turnRight') }]
    : [{ c: 'L', icon: '⬅️', label: '' }, { c: 'U', icon: '⬆️', label: '' }, { c: 'D', icon: '⬇️', label: '' }, { c: 'R', icon: '➡️', label: '' }];
  const iconOf = (c: Cmd) => ({ R: '➡️', D: '⬇️', L: '⬅️', U: '⬆️', F: '⬆️', TL: '↪️', TR: '↩️' })[c];

  function add(c: Cmd) {
    if (running || program.length >= maxLen) return;
    api.sfx('tap');
    setMsg(null);
    setProgram((p) => [...p, c]);
  }

  function reset() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setBot({ x: m.start[0], y: m.start[1], d: 0 });
    setRunning(false);
    setActive(-1);
  }

  function run() {
    if (running || !program.length) return;
    reset();
    setRunning(true);
    setMsg(null);
    let s = { x: m.start[0], y: m.start[1], d: 0 as Dir };
    program.forEach((c, i) => {
      timers.current.push(window.setTimeout(() => {
        setActive(i);
        let { x, y, d } = s;
        if (c === 'TL') d = ((d + 3) % 4) as Dir;
        else if (c === 'TR') d = ((d + 1) % 4) as Dir;
        else {
          const dir = c === 'F' ? d : ({ R: 0, D: 1, L: 2, U: 3 } as const)[c as 'R'];
          if (!rel) d = dir as Dir;
          const nx = x + VEC[dir][0], ny = y + VEC[dir][1];
          if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || m.rocks.has(`${nx},${ny}`)) {
            // Kollisjon: stopp programmet
            api.sfx('nope');
            setBump(true);
            setTimeout(() => setBump(false), 400);
            timers.current.forEach(clearTimeout);
            setTimeout(() => { setRunning(false); setMsg(api.t('tryAgain')); api.speak(api.t('tryAgain')); setBot({ x: m.start[0], y: m.start[1], d: 0 }); setActive(-1); }, 700);
            s = { x, y, d };
            setBot(s);
            return;
          }
          x = nx; y = ny;
        }
        s = { x, y, d };
        setBot(s);
        api.sfx(c === 'TL' || c === 'TR' ? 'tap' : 'flip');
        if (x === m.goal[0] && y === m.goal[1]) {
          timers.current.forEach(clearTimeout);
          api.sfx('win');
          const len = i + 1;
          const stars = len <= best ? 3 : len <= best + 2 ? 2 : 1;
          const firstClear = onWin(stars);
          setTimeout(() => onFinish({ won: true, stars, firstClear }), 900);
        } else if (i === program.length - 1) {
          setTimeout(() => { setRunning(false); setMsg(api.t('tryAgain')); api.speak(api.t('tryAgain')); setBot({ x: m.start[0], y: m.start[1], d: 0 }); setActive(-1); }, 700);
        }
      }, 300 + i * 480));
    });
  }

  const cell = `min(${85 / m.w}vw, ${48 / m.h}vh, 64px)`;
  return (
    <div className="robot">
      <div className="robot__board" style={{ gridTemplateColumns: `repeat(${m.w}, ${cell})`, gridAutoRows: cell }}>
        {Array.from({ length: m.w * m.h }, (_, i) => {
          const x = i % m.w, y = Math.floor(i / m.w);
          const rock = m.rocks.has(`${x},${y}`);
          const goal = x === m.goal[0] && y === m.goal[1];
          return <span key={i} className={`rcell ${(x + y) % 2 ? 'is-alt' : ''}`}>{rock ? '🪨' : goal ? '💎' : ''}</span>;
        })}
        <span
          className={`robot__bot ${bump ? 'is-bump' : ''}`}
          style={{ left: `calc(${cell} * ${bot.x})`, top: `calc(${cell} * ${bot.y})`, width: cell, height: cell }}
        >
          <span className="robot__face">🤖</span>
          {rel && <span className="robot__dir" style={{ transform: `rotate(${bot.d * 90}deg)` }}><i>▶</i></span>}
        </span>
      </div>

      <div className="robot__program" aria-label="program">
        {program.length === 0 && <span className="robot__hint">{rel ? api.t('robotHelpTurn') : api.t('robotHelp')}</span>}
        {program.map((c, i) => (
          <button key={i} className={`pcmd ${active === i ? 'is-active' : ''}`} onClick={() => { if (!running) { api.sfx('tap'); setProgram((p) => p.filter((_, k) => k !== i)); } }}>
            {iconOf(c)}
          </button>
        ))}
      </div>
      {msg && <div className="robot__msg pop-in">{msg}</div>}

      <div className="robot__controls">
        {cmds.map(({ c, icon, label }) => (
          <button key={c} className="rcmd" onClick={() => add(c)} aria-label={label || c}>
            <span>{icon}</span>{label && <small>{label}</small>}
          </button>
        ))}
        <button className="rcmd rcmd--clear" onClick={() => { api.sfx('nope'); reset(); setProgram([]); setMsg(null); }} aria-label={api.t('clearAll')}>🗑️</button>
        <button className="rcmd rcmd--run" onClick={run} disabled={running || !program.length}>▶ {api.t('run')}</button>
      </div>
    </div>
  );
}
