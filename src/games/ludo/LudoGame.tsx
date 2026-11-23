/**
 * Ludo for 2–4 spillere på samme skjerm. Hver plass kan være person, robot eller av.
 * Klassiske regler: slå 6 for å komme ut, 6 gir nytt kast, lander du på en
 * motstander sendes den hjem. Stjerner og startruter er trygge. Nøyaktig kast inn i mål.
 */
import { useEffect, useRef, useState, type ReactElement } from 'react';
import type { GameApi, GameProps } from '../types';
import { Emo } from '../../components/Emo';
import './ludo.css';

type Seat = 0 | 1 | 2 | 3; // rød, grønn, gul, blå (med klokka)
type Kind = 'human' | 'robot' | 'off';
const COLORS = ['#ef233c', '#2dc653', '#ffbe0b', '#3a86ff'];
const LIGHT = ['#ffccd5', '#c7f9cc', '#fff3b0', '#cfe3ff'];
const NAME_KEYS = ['red', 'green', 'yellow', 'blue'] as const;
const START = [0, 13, 26, 39];
const GOAL = 56; // 0–50 på løypa, 51–55 hjemmestripe, 56 i mål

// De 52 rutene i løypa (kolonne, rad), med klokka fra rød start
const TRACK: [number, number][] = [
  [1, 6], [2, 6], [3, 6], [4, 6], [5, 6],
  [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
  [7, 0],
  [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
  [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
  [14, 7],
  [14, 8], [13, 8], [12, 8], [11, 8], [10, 8], [9, 8],
  [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14],
  [7, 14],
  [6, 14], [6, 13], [6, 12], [6, 11], [6, 10], [6, 9],
  [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  [0, 7],
  [0, 6]
];
const SAFE = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
const HOME_COL: [number, number][][] = [
  [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
  [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]]
];
const YARD_ORIGIN: [number, number][] = [[0, 0], [9, 0], [9, 9], [0, 9]];
const YARD_SPOTS: [number, number][] = [[1.9, 1.9], [4.1, 1.9], [1.9, 4.1], [4.1, 4.1]];
const GOAL_SPOT: [number, number][] = [[6.9, 7.5], [7.5, 6.9], [8.1, 7.5], [7.5, 8.1]];

const trackIndex = (seat: Seat, p: number) => (START[seat] + p) % 52;

/** Midtpunkt (i rutenett-koordinater) for en brikke */
function spot(seat: Seat, p: number, i: number): [number, number] {
  if (p < 0) { const [ox, oy] = YARD_ORIGIN[seat]; const [sx, sy] = YARD_SPOTS[i]; return [ox + sx, oy + sy]; }
  if (p >= GOAL) return GOAL_SPOT[seat];
  if (p > 50) { const [x, y] = HOME_COL[seat][p - 51]; return [x + 0.5, y + 0.5]; }
  const [x, y] = TRACK[trackIndex(seat, p)];
  return [x + 0.5, y + 0.5];
}

interface Setup { kinds: Kind[]; tokens: 2 | 4 }

export default function LudoGame({ api, onFinish }: GameProps) {
  const [setup, setSetup] = useState<Setup | null>(null);
  useEffect(() => {
    api.setBack(setup ? () => setSetup(null) : null);
    return () => api.setBack(null);
  }, [setup]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!setup) return <SetupScreen api={api} onStart={setSetup} />;
  return <Board key={JSON.stringify(setup)} api={api} setup={setup} onFinish={onFinish} />;
}

// ---------------- Oppsett ----------------
function SetupScreen({ api, onStart }: { api: GameApi; onStart: (s: Setup) => void }) {
  const saved = api.loadData<Setup>();
  const [kinds, setKinds] = useState<Kind[]>(saved?.kinds ?? ['human', 'robot', 'robot', 'robot']);
  const [tokens, setTokens] = useState<2 | 4>(saved?.tokens ?? 2);
  const active = kinds.filter((k) => k !== 'off').length;
  const humans = kinds.filter((k) => k === 'human').length;
  const ok = active >= 2 && humans >= 1;
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
        {([2, 4] as const).map((n) => (
          <button key={n} className={tokens === n ? 'is-on' : ''} onClick={() => { api.sfx('tap'); setTokens(n); }}>
            {n === 2 ? `⚡ ${api.t('ludoShort')}` : `🏆 ${api.t('ludoLong')}`}
          </button>
        ))}
      </div>
      <button
        className="big-btn big-btn--go"
        disabled={!ok}
        onClick={() => { api.sfx('pop'); api.saveData({ kinds, tokens }); onStart({ kinds, tokens }); }}
      >▶ {api.t('start')}</button>
      {!ok && <p className="ludo-hint">{api.t('ludoNeed')}</p>}
    </div>
  );
}

// ---------------- Selve spillet ----------------
type Tokens = number[][]; // [seat][brikke] = fremdrift (-1 = i hjemmet)

function legalMoves(tokens: Tokens, seat: Seat, roll: number): number[] {
  return tokens[seat].map((p, i) => {
    if (p >= GOAL) return -1;
    if (p < 0) return roll === 6 ? i : -1;
    return p + roll <= GOAL ? i : -1;
  }).filter((i) => i >= 0);
}

/** Hvem står på denne løype-ruten (andre farger)? */
function opponentsAt(tokens: Tokens, seat: Seat, idx: number, active: boolean[]) {
  const out: [Seat, number][] = [];
  tokens.forEach((ts, s) => {
    if (s === seat || !active[s]) return;
    ts.forEach((p, i) => { if (p >= 0 && p <= 50 && trackIndex(s as Seat, p) === idx) out.push([s as Seat, i]); });
  });
  return out;
}

/** Enkel robot: mål > ta noen > ut av hjemmet > trygg rute > lengst fremme */
function robotChoice(tokens: Tokens, seat: Seat, roll: number, moves: number[], active: boolean[]): number {
  let best = moves[0], bestScore = -Infinity;
  for (const i of moves) {
    const p = tokens[seat][i];
    const np = p < 0 ? 0 : p + roll;
    let score = np;
    if (np === GOAL) score += 100;
    if (p < 0) score += 60;
    if (np <= 50) {
      const idx = trackIndex(seat, np);
      if (!SAFE.has(idx) && opponentsAt(tokens, seat, idx, active).length) score += 80;
      if (SAFE.has(idx)) score += 25;
      // Fare: står en motstander 1–6 ruter bak?
      let danger = false;
      tokens.forEach((ts, s) => {
        if (s === seat || !active[s]) return;
        ts.forEach((op) => {
          if (op < 0 || op > 50) return;
          const d = (idx - trackIndex(s as Seat, op) + 52) % 52;
          if (d >= 1 && d <= 6) danger = true;
        });
      });
      if (danger && !SAFE.has(idx)) score -= 30;
    } else score += 30; // trygt i hjemmestripa
    score += Math.random() * 4;
    if (score > bestScore) { bestScore = score; best = i; }
  }
  return best;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Board({ api, setup, onFinish }: { api: GameApi; setup: Setup; onFinish: GameProps['onFinish'] }) {
  const active = setup.kinds.map((k) => k !== 'off');
  const seats = ([0, 1, 2, 3] as Seat[]).filter((s) => active[s]);
  const [tokens, setTokens] = useState<Tokens>(() => [0, 1, 2, 3].map(() => Array(setup.tokens).fill(-1)));
  const [turn, setTurn] = useState<Seat>(seats[0]);
  const [roll, setRoll] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [face, setFace] = useState(1);
  const [busy, setBusy] = useState(false);
  const [moves, setMoves] = useState<number[]>([]);
  const [msg, setMsg] = useState('');
  const [winner, setWinner] = useState<Seat | null>(null);
  const [hop, setHop] = useState<string>('');
  const tokRef = useRef(tokens);
  tokRef.current = tokens;
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const isHuman = (s: Seat) => setup.kinds[s] === 'human';
  const humanCount = setup.kinds.filter((k) => k === 'human').length;
  const name = (s: Seat) => {
    const c = api.t(NAME_KEYS[s]);
    if (setup.kinds[s] === 'robot') return `${c} 🤖`;
    return humanCount === 1 && api.playerName ? api.playerName : c;
  };

  const say = (text: string, voice = true) => { setMsg(text); if (voice) api.speak(text); };

  // Ny tur: fortell hvem som skal kaste
  useEffect(() => {
    if (winner !== null) return;
    if (isHuman(turn)) say(api.t('ludoRoll', { p: name(turn) }), humanCount > 1);
    else { setMsg(api.t('yourTurn', { p: name(turn) })); void robotTurn(); }
  }, [turn]); // eslint-disable-line react-hooks/exhaustive-deps

  async function doRoll(): Promise<number> {
    setRolling(true);
    api.sfx('flip');
    for (let k = 0; k < 7; k++) { setFace(1 + Math.floor(Math.random() * 6)); await sleep(70); }
    const r = 1 + Math.floor(Math.random() * 6);
    setFace(r);
    setRolling(false);
    setRoll(r);
    return r;
  }

  function nextTurn(again: boolean) {
    setRoll(null);
    setMoves([]);
    setBusy(false);
    if (again) {
      // Samme spiller igjen – trigger effekten manuelt
      if (isHuman(turn)) say(api.t('ludoSix'));
      else void robotTurn();
      return;
    }
    const i = seats.indexOf(turn);
    setTurn(seats[(i + 1) % seats.length]);
  }

  async function robotTurn() {
    setBusy(true);
    await sleep(450);
    if (!alive.current) return;
    const r = await doRoll();
    await sleep(350);
    const m = legalMoves(tokRef.current, turnRef.current, r);
    if (!m.length) { await sleep(500); nextTurn(false); return; }
    const choice = robotChoice(tokRef.current, turnRef.current, r, m, active);
    await move(turnRef.current, choice, r);
  }
  const turnRef = useRef(turn);
  turnRef.current = turn;

  async function humanRoll() {
    if (busy || roll !== null || !isHuman(turn) || winner !== null) return;
    setBusy(true);
    const r = await doRoll();
    const m = legalMoves(tokRef.current, turn, r);
    if (!m.length) {
      say(api.t('ludoNoMove'), false);
      await sleep(1100);
      nextTurn(r === 6);
      return;
    }
    // Bare ett mulig trekk (eller alle like): flytt automatisk
    const distinct = new Set(m.map((i) => tokRef.current[turn][i]));
    if (distinct.size === 1) { await sleep(350); await move(turn, m[0], r); return; }
    setMoves(m);
    setBusy(false);
    setMsg(api.t('ludoPick'));
  }

  async function move(seat: Seat, i: number, r: number) {
    setBusy(true);
    setMoves([]);
    const start = tokRef.current[seat][i];
    const steps = start < 0 ? [0] : Array.from({ length: r }, (_, k) => start + k + 1);
    for (const p of steps) {
      setTokens((ts) => ts.map((row, s) => (s === seat ? row.map((v, j) => (j === i ? p : v)) : row)));
      setHop(`${seat}-${i}-${p}`);
      api.sfx('tap');
      await sleep(130);
      if (!alive.current) return;
    }
    const np = steps[steps.length - 1];
    let captured = false;
    if (np <= 50) {
      const idx = trackIndex(seat, np);
      if (!SAFE.has(idx)) {
        const hits = opponentsAt(tokRef.current, seat, idx, active);
        if (hits.length) {
          captured = true;
          api.sfx('pop');
          setTokens((ts) => ts.map((row, s) => row.map((v, j) => (hits.some(([hs, hi]) => hs === s && hi === j) ? -1 : v))));
          say(api.t('ludoCaught'), false);
        }
      }
    }
    if (np === GOAL) api.sfx('match');
    await sleep(250);
    const after = tokRef.current;
    if (after[seat].every((p) => p >= GOAL)) {
      setWinner(seat);
      api.sfx('win');
      api.speak(api.t('playerWins', { p: name(seat) }));
      const humanWon = isHuman(seat);
      setTimeout(() => onFinish({ won: humanWon, stars: humanWon ? 3 : 1, coins: humanWon ? (setup.tokens === 4 ? 30 : 15) : 3 }), 2200);
      return;
    }
    nextTurn(r === 6 || captured);
  }

  // ---------- Tegning ----------
  const cells: ReactElement[] = [];
  TRACK.forEach(([x, y], idx) => {
    const startOf = START.indexOf(idx);
    const fill = startOf >= 0 ? COLORS[startOf] : '#fff';
    cells.push(<rect key={`t${idx}`} x={x + 0.04} y={y + 0.04} width={0.92} height={0.92} rx={0.14} fill={fill} className="ludo-cell" />);
    if (SAFE.has(idx) && startOf < 0) cells.push(<text key={`s${idx}`} x={x + 0.5} y={y + 0.72} className="ludo-star">★</text>);
    if (startOf >= 0) cells.push(<text key={`a${idx}`} x={x + 0.5} y={y + 0.7} className="ludo-arrow">▶</text>);
  });
  HOME_COL.forEach((col, s) => col.forEach(([x, y], k) => cells.push(<rect key={`h${s}${k}`} x={x + 0.04} y={y + 0.04} width={0.92} height={0.92} rx={0.14} fill={COLORS[s]} opacity={0.85} />)));

  const tokenEls: ReactElement[] = [];
  // Grupper brikker på samme rute, så de kan forskyves litt
  const groups = new Map<string, number>();
  const pos: { s: Seat; i: number; x: number; y: number; n: number }[] = [];
  seats.forEach((s) => tokens[s].forEach((p, i) => {
    const [x, y] = spot(s, p, i);
    const key = p < 0 ? `y${s}${i}` : `${x.toFixed(2)},${y.toFixed(2)}`;
    const n = groups.get(key) ?? 0;
    groups.set(key, n + 1);
    pos.push({ s, i, x, y, n });
  }));
  for (const t of pos) {
    const off = t.n * 0.18;
    const canMove = t.s === turn && moves.includes(t.i);
    const hopping = hop.startsWith(`${t.s}-${t.i}-`);
    tokenEls.push(
      <g
        key={`${t.s}-${t.i}`}
        className={`ludo-pawn ${canMove ? 'is-movable' : ''} ${hopping ? 'is-hop' : ''}`}
        style={{ transform: `translate(${t.x + off}px, ${t.y - off}px)` }}
        onClick={() => canMove && roll !== null && move(t.s, t.i, roll)}
      >
        {canMove && <circle r={0.52} className="ludo-pawn__ring" />}
        <ellipse cy={0.26} rx={0.3} ry={0.1} fill="rgba(0,0,0,.25)" />
        <g className="ludo-pawn__body" key={hopping ? hop : 'still'}>
          <circle r={0.34} fill={COLORS[t.s]} stroke="#fff" strokeWidth={0.08} />
          <circle cx={-0.1} cy={-0.12} r={0.1} fill="rgba(255,255,255,.7)" />
        </g>
      </g>
    );
  }

  return (
    <div className="ludo">
      <div className="ludo__board">
        <svg viewBox="0 0 15 15">
          <rect width={15} height={15} rx={0.6} fill="#fff8e7" />
          {YARD_ORIGIN.map(([x, y], s) => (
            <g key={s} opacity={active[s] ? 1 : 0.35}>
              <rect x={x + 0.1} y={y + 0.1} width={5.8} height={5.8} rx={0.6} fill={COLORS[s]} />
              <rect x={x + 0.8} y={y + 0.8} width={4.4} height={4.4} rx={0.5} fill={LIGHT[s]} />
              {YARD_SPOTS.slice(0, setup.tokens).map(([sx, sy], k) => <circle key={k} cx={x + sx} cy={y + sy} r={0.45} fill="#fff" stroke={COLORS[s]} strokeWidth={0.06} />)}
              {turn === s && winner === null && <rect x={x + 0.1} y={y + 0.1} width={5.8} height={5.8} rx={0.6} className="ludo-turnglow" />}
            </g>
          ))}
          {cells}
          {/* Mål i midten */}
          <polygon points="6,6 7.5,7.5 6,9" fill={COLORS[0]} />
          <polygon points="6,6 9,6 7.5,7.5" fill={COLORS[1]} />
          <polygon points="9,6 9,9 7.5,7.5" fill={COLORS[2]} />
          <polygon points="6,9 7.5,7.5 9,9" fill={COLORS[3]} />
          {tokenEls}
        </svg>
      </div>
      <div className="ludo__side">
        <div className="ludo__msg" style={{ borderColor: COLORS[winner ?? turn] }}>
          <i style={{ background: COLORS[winner ?? turn] }} />
          {winner !== null ? `🏆 ${api.t('playerWins', { p: name(winner) })}` : msg}
        </div>
        <button
          className={`ludo-die ${rolling ? 'is-rolling' : ''} ${isHuman(turn) && roll === null && !busy && winner === null ? 'is-ready' : ''}`}
          style={{ ['--c' as string]: COLORS[turn] }}
          onClick={humanRoll}
          aria-label={api.t('ludoRollBtn')}
        >
          <DieFace n={face} />
        </button>
      </div>
    </div>
  );
}

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 25], [72, 25], [28, 50], [72, 50], [28, 75], [72, 75]]
};
function DieFace({ n }: { n: number }) {
  return (
    <svg viewBox="0 0 100 100" className="ludo-die__face">
      <rect x={4} y={4} width={92} height={92} rx={20} fill="#fff" />
      {PIPS[n].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={9} fill={n === 6 ? '#ef233c' : '#222'} />)}
    </svg>
  );
}
