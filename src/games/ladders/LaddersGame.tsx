/**
 * Stigespillet for 2–4 spillere på samme skjerm (person, robot eller av).
 * Kast terningen, gå like mange ruter (tallene telles høyt), klatre opp stiger
 * og skli ned sklier. Først til siste rute vinner (man trenger ikke nøyaktig kast).
 */
import { useEffect, useRef, useState } from 'react';
import type { GameApi, GameProps } from '../types';
import { Emo } from '../../components/Emo';
import { DieFace } from '../common/Die';
import '../ludo/ludo.css';
import './ladders.css';

type Kind = 'human' | 'robot' | 'off';
type Size = 36 | 100;
interface Setup { kinds: Kind[]; size: Size }
const COLORS = ['#ef233c', '#2dc653', '#ffbe0b', '#3a86ff'];
const NAME_KEYS = ['red', 'green', 'yellow', 'blue'] as const;
const CELL_COLORS = ['#fff3b0', '#caffbf', '#bde0fe', '#ffc8dd', '#ffd6a5'];

// Stiger (fra → til) og sklier (fra → til). Få og korte sklier, så det er gøy for små.
const BOARDS: Record<Size, { ladders: [number, number][]; slides: [number, number][] }> = {
  36: { ladders: [[3, 16], [8, 21], [17, 29]], slides: [[14, 4], [25, 12], [33, 23]] },
  100: {
    ladders: [[3, 22], [8, 30], [28, 55], [36, 44], [51, 67], [58, 77], [71, 91], [80, 99]],
    slides: [[16, 6], [47, 26], [49, 30], [62, 43], [87, 66], [93, 73], [98, 78]]
  }
};

/** Midten av rute n (1-basert) i rutenett-koordinater. Slangeformet: annenhver rad går motsatt vei. */
const colsOf = (size: Size) => (size === 36 ? 6 : 10);
function cellXY(n: number, size: Size): [number, number] {
  const cols = colsOf(size), rows = size / cols;
  const row = Math.floor((n - 1) / cols);
  let col = (n - 1) % cols;
  if (row % 2 === 1) col = cols - 1 - col;
  return [col + 0.5, rows - 1 - row + 0.5];
}

export default function LaddersGame({ api, onFinish }: GameProps) {
  const [setup, setSetup] = useState<Setup | null>(null);
  useEffect(() => {
    api.setBack(setup ? () => setSetup(null) : null);
    return () => api.setBack(null);
  }, [setup]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!setup) return <SetupScreen api={api} onStart={setSetup} />;
  return <Board key={JSON.stringify(setup)} api={api} setup={setup} onFinish={onFinish} />;
}

function SetupScreen({ api, onStart }: { api: GameApi; onStart: (s: Setup) => void }) {
  const saved = api.loadData<Setup>();
  const [kinds, setKinds] = useState<Kind[]>(saved?.kinds ?? ['human', 'robot', 'off', 'off']);
  const [size, setSize] = useState<Size>(saved?.size === 100 ? 100 : 36);
  const active = kinds.filter((k) => k !== 'off').length;
  const ok = active >= 2 && kinds.includes('human');
  const cycle = (i: number) => {
    api.sfx('tap');
    const order: Kind[] = ['human', 'robot', 'off'];
    setKinds((ks) => ks.map((k, j) => (j === i ? order[(order.indexOf(k) + 1) % 3] : k)));
  };
  const icon = (k: Kind) => (k === 'human' ? '🙂' : k === 'robot' ? '🤖' : '💤');
  const label = (k: Kind) => api.t(k === 'human' ? 'ludoHuman' : k === 'robot' ? 'ludoRobot' : 'ludoOff');
  return (
    <div className="ludo-setup">
      <h2>{api.t('ludoWho')}</h2>
      <div className="ludo-seats">
        {kinds.map((k, i) => (
          <button key={i} className={`ludo-seat pop-in ${k === 'off' ? 'is-off' : ''}`} style={{ ['--c' as string]: COLORS[i], animationDelay: `${i * 0.06}s` }} onClick={() => cycle(i)}>
            <span className="ludo-seat__pawn" />
            <span className="ludo-seat__icon"><Emo e={icon(k)} /></span>
            <b>{api.t(NAME_KEYS[i])}</b>
            <small>{label(k)}</small>
          </button>
        ))}
      </div>
      <div className="ludo-len">
        {([36, 100] as const).map((n) => (
          <button key={n} className={size === n ? 'is-on' : ''} onClick={() => { api.sfx('tap'); setSize(n); }}>
            {n === 36 ? `⚡ ${api.t('laddersShort')}` : `🏆 ${api.t('laddersLong')}`}
          </button>
        ))}
      </div>
      <button className="big-btn big-btn--go" disabled={!ok} onClick={() => { api.sfx('pop'); api.saveData({ kinds, size }); onStart({ kinds, size }); }}>
        ▶ {api.t('start')}
      </button>
      {!ok && <p className="ludo-hint">{api.t('ludoNeed')}</p>}
    </div>
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Board({ api, setup, onFinish }: { api: GameApi; setup: Setup; onFinish: GameProps['onFinish'] }) {
  const { size } = setup;
  const board = BOARDS[size];
  const seats = [0, 1, 2, 3].filter((s) => setup.kinds[s] !== 'off');
  const [pos, setPos] = useState<number[]>([0, 0, 0, 0]); // 0 = før start
  const [turn, setTurn] = useState(seats[0]);
  const [face, setFace] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [busy, setBusy] = useState(false);
  const [glide, setGlide] = useState<number | null>(null); // spiller som klatrer/sklir (lang animasjon)
  const [msg, setMsg] = useState('');
  const [winner, setWinner] = useState<number | null>(null);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  const posRef = useRef(pos);
  posRef.current = pos;

  const humanCount = setup.kinds.filter((k) => k === 'human').length;
  const isHuman = (s: number) => setup.kinds[s] === 'human';
  const name = (s: number) => {
    const c = api.t(NAME_KEYS[s]);
    if (setup.kinds[s] === 'robot') return `${c} 🤖`;
    return humanCount === 1 && api.playerName ? api.playerName : c;
  };

  useEffect(() => {
    if (winner !== null) return;
    const text = isHuman(turn) ? api.t('ludoRoll', { p: name(turn) }) : api.t('yourTurn', { p: name(turn) });
    setMsg(text);
    if (isHuman(turn) && humanCount > 1) api.speak(text);
    if (!isHuman(turn)) void (async () => { setBusy(true); await sleep(600); if (alive.current) await play(turn); })();
  }, [turn]); // eslint-disable-line react-hooks/exhaustive-deps

  async function play(s: number) {
    setBusy(true);
    setRolling(true);
    api.sfx('flip');
    for (let k = 0; k < 7; k++) { setFace(1 + Math.floor(Math.random() * 6)); await sleep(70); }
    const r = 1 + Math.floor(Math.random() * 6);
    setFace(r);
    setRolling(false);
    await sleep(350);
    // Gå rute for rute og tell høyt (1, 2, 3 …)
    const start = posRef.current[s];
    const end = Math.min(size, start + r);
    for (let p = start + 1, k = 1; p <= end; p++, k++) {
      setPos((ps) => ps.map((v, j) => (j === s ? p : v)));
      api.sfx('tap');
      if (isHuman(s)) api.speak(String(k));
      await sleep(isHuman(s) ? 420 : 220);
      if (!alive.current) return;
    }
    // Stige eller sklie?
    const ladder = board.ladders.find(([a]) => a === end);
    const slide = board.slides.find(([a]) => a === end);
    let final = end;
    if (ladder || slide) {
      final = (ladder ?? slide)![1];
      await sleep(250);
      setMsg(ladder ? `🪜 ${api.t('ladderUp')}` : `🛝 ${api.t('slideDown')}`);
      api.speak(ladder ? api.t('ladderUp') : api.t('slideDown'));
      api.sfx(ladder ? 'match' : 'pop');
      setGlide(s);
      setPos((ps) => ps.map((v, j) => (j === s ? final : v)));
      await sleep(900);
      setGlide(null);
    }
    if (final >= size) {
      setWinner(s);
      api.sfx('win');
      api.speak(api.t('playerWins', { p: name(s) }));
      const won = isHuman(s);
      setTimeout(() => onFinish({ won, stars: won ? 3 : 1, coins: won ? (size === 100 ? 25 : 10) : 3 }), 2200);
      return;
    }
    await sleep(300);
    setBusy(false);
    // 6 gir nytt kast
    if (r === 6) {
      setMsg(`🎲 ${api.t('ludoSix')}`);
      if (isHuman(s)) api.speak(api.t('ludoSix'));
      else { await sleep(500); await play(s); }
      return;
    }
    const i = seats.indexOf(s);
    setTurn(seats[(i + 1) % seats.length]);
  }

  // ---------- Tegning ----------
  const cols = colsOf(size), rows = size / cols;
  const cells = [];
  for (let n = 1; n <= size; n++) {
    const [cx, cy] = cellXY(n, size);
    cells.push(
      <g key={n}>
        <rect x={cx - 0.5 + 0.03} y={cy - 0.5 + 0.03} width={0.94} height={0.94} rx={0.12} fill={CELL_COLORS[(n + Math.floor((n - 1) / 10)) % CELL_COLORS.length]} />
        <text x={cx - 0.42} y={cy - 0.22} className="lad-num">{n}</text>
      </g>
    );
  }
  const [gx, gy] = cellXY(size, size);

  return (
    <div className="ludo ladders">
      <div className="ludo__board ladders__board" style={{ aspectRatio: `${cols} / ${rows}` }}>
        <svg viewBox={`0 0 ${cols} ${rows}`}>
          <rect width={cols} height={rows} rx={0.3} fill="#fff" />
          {cells}
          <text x={gx} y={gy + 0.28} className="lad-goal">🏁</text>
          {board.slides.map(([a, b], i) => <Slide key={`s${i}`} from={cellXY(a, size)} to={cellXY(b, size)} i={i} />)}
          {board.ladders.map(([a, b], i) => <Ladder key={`l${i}`} from={cellXY(a, size)} to={cellXY(b, size)} />)}
          {seats.map((s, k) => {
            const [x, y] = pos[s] === 0 ? [-0.1 + 0.3 * k + 0.25, rows - 0.25] : cellXY(pos[s], size);
            const off = pos[s] === 0 ? [0, 0] : [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]][k];
            return (
              <g key={s} className={`lad-pawn ${glide === s ? 'is-glide' : ''} ${turn === s && winner === null ? 'is-turn' : ''}`}
                style={{ transform: `translate(${x + off[0]}px, ${y + off[1]}px)` }}>
                <ellipse cy={0.2} rx={0.22} ry={0.07} fill="rgba(0,0,0,.25)" />
                <g className="lad-pawn__body">
                  <circle r={0.24} fill={COLORS[s]} stroke="#fff" strokeWidth={0.06} />
                  <circle cx={-0.07} cy={-0.08} r={0.07} fill="rgba(255,255,255,.7)" />
                </g>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="ludo__side">
        <div className="ludo__msg" style={{ borderColor: COLORS[winner ?? turn] }}>
          <i style={{ background: COLORS[winner ?? turn] }} />
          {winner !== null ? `🏆 ${api.t('playerWins', { p: name(winner) })}` : msg}
        </div>
        <button
          className={`ludo-die ${rolling ? 'is-rolling' : ''} ${isHuman(turn) && !busy && winner === null ? 'is-ready' : ''}`}
          style={{ ['--c' as string]: COLORS[turn] }}
          onClick={() => { if (isHuman(turn) && !busy && winner === null) void play(turn); }}
          aria-label={api.t('ludoRollBtn')}
        >
          <DieFace n={face} />
        </button>
      </div>
    </div>
  );
}

function Ladder({ from, to }: { from: [number, number]; to: [number, number] }) {
  const [x1, y1] = from, [x2, y2] = to;
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  const nx = (-dy / len) * 0.18, ny = (dx / len) * 0.18; // sideveis avstand mellom vangene
  const rungs = Math.max(2, Math.round(len / 0.45));
  return (
    <g className="lad-ladder">
      <line x1={x1 + nx} y1={y1 + ny} x2={x2 + nx} y2={y2 + ny} />
      <line x1={x1 - nx} y1={y1 - ny} x2={x2 - nx} y2={y2 - ny} />
      {Array.from({ length: rungs }, (_, i) => {
        const t = (i + 0.5) / rungs;
        const cx = x1 + dx * t, cy = y1 + dy * t;
        return <line key={i} className="lad-rung" x1={cx + nx} y1={cy + ny} x2={cx - nx} y2={cy - ny} />;
      })}
    </g>
  );
}

const SLIDE_COLORS = ['#ff006e', '#8338ec', '#fb5607', '#3a86ff', '#06d6a0', '#ff70a6', '#ffbe0b'];
function Slide({ from, to, i }: { from: [number, number]; to: [number, number]; i: number }) {
  const [x1, y1] = from, [x2, y2] = to;
  const mx = (x1 + x2) / 2 + (i % 2 ? 0.9 : -0.9), my = (y1 + y2) / 2;
  const d = `M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`;
  const c = SLIDE_COLORS[i % SLIDE_COLORS.length];
  return (
    <g className="lad-slide">
      <path d={d} stroke="rgba(0,0,0,.15)" strokeWidth={0.42} transform="translate(0.04 0.06)" />
      <path d={d} stroke={c} strokeWidth={0.36} />
      <path d={d} stroke="#fff" strokeWidth={0.08} strokeDasharray="0.15 0.2" opacity={0.7} />
      <circle cx={x2} cy={y2} r={0.16} fill={c} />
    </g>
  );
}
