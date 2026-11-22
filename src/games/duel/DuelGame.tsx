/**
 * To spillere – tre på rad, fire på rad og luft-hockey på samme skjerm.
 * Tre/fire på rad kan også spilles mot Shqipo (enkel datamotstander).
 */
import { EmojiText } from '../../components/Emo';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { GameApi, GameProps } from '../types';
import type { WorldId } from '../../data/worlds';
import './duel.css';

type Sub = 'ttt' | 'c4' | 'hockey';
type Who = 1 | 2;
const COLORS: Record<Who, string> = { 1: '#ff4d6d', 2: '#3a86ff' };

export default function DuelGame(props: GameProps) {
  const { api } = props;
  const [sub, setSub] = useState<Sub | null>(null);
  // ⬅️ går først tilbake til spillets egen meny
  useEffect(() => {
    api.setBack(sub !== null ? () => setSub(null) : null);
    return () => api.setBack(null);
  }, [sub]); // eslint-disable-line react-hooks/exhaustive-deps
  const [ai, setAi] = useState(false);
  if (!sub) {
    const card = (s: Sub, icon: string, label: string, allowAi = true) => (
      <div className="duel-card pop-in" key={s}>
        <span className="duel-card__icon"><EmojiText text={icon} /></span>
        <b>{label}</b>
        <div className="duel-card__btns">
          <button onClick={() => { api.sfx('pop'); setAi(false); setSub(s); }}>👫 {api.t('twoPlayers')}</button>
          {allowAi && <button className="is-ai" onClick={() => { api.sfx('pop'); setAi(true); setSub(s); }}>🦅 {api.t('vsShqipo')}</button>}
        </div>
      </div>
    );
    return (
      <div className="duel-menu">
        {card('ttt', '❌⭕', api.t('ticTacToe'))}
        {card('c4', '🔴🔵', api.t('connectFour'))}
        {card('hockey', '🏒', api.t('airHockey'))}
      </div>
    );
  }
  const end = (winner: Who | 0) => {
    const name = winner === 0 ? '' : winner === 2 && ai ? 'Shqipo' : api.t(winner === 1 ? 'red' : 'blue');
    api.speak(winner === 0 ? api.t('draw') : api.t('playerWins', { p: name }));
    const humanWon = !ai || winner === 1;
    setTimeout(() => props.onFinish({ won: humanWon, stars: humanWon ? 3 : 1, coins: humanWon ? 5 : 2 }), 1800);
  };
  if (sub === 'ttt') return <TicTacToe api={api} ai={ai} onEnd={end} />;
  if (sub === 'c4') return <ConnectFour api={api} ai={ai} onEnd={end} />;
  return <Hockey api={api} ai={ai} world={props.world} onEnd={end} />;
}

function Status({ api, turn, winner, ai }: { api: GameApi; turn: Who; winner: Who | 0 | null; ai: boolean }) {
  const name = (w: Who) => (w === 2 && ai ? 'Shqipo 🦅' : api.t(w === 1 ? 'red' : 'blue'));
  return (
    <div className="duel-status" style={{ borderColor: winner ? COLORS[winner as Who] ?? '#ccc' : COLORS[turn] }}>
      {winner === null ? <><i style={{ background: COLORS[turn] }} /> {api.t('yourTurn', { p: name(turn) })}</>
        : winner === 0 ? `🤝 ${api.t('draw')}` : `🏆 ${api.t('playerWins', { p: name(winner) })}`}
    </div>
  );
}

// ---------------- Tre på rad ----------------
const LINES3 = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
function winner3(b: (Who | 0)[]): { w: Who | 0; line: number[] } | null {
  for (const l of LINES3) if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[1]] === b[l[2]]) return { w: b[l[0]] as Who, line: l };
  return b.every(Boolean) ? { w: 0, line: [] } : null;
}
function ai3(b: (Who | 0)[]): number {
  const free = b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  for (const who of [2, 1] as Who[]) for (const i of free) { const t = [...b]; t[i] = who; if (winner3(t)?.w === who) return i; }
  if (!b[4]) return 4;
  return free[Math.floor(Math.random() * free.length)];
}
function TicTacToe({ api, ai, onEnd }: { api: GameApi; ai: boolean; onEnd: (w: Who | 0) => void }) {
  const [b, setB] = useState<(Who | 0)[]>(Array(9).fill(0));
  const [turn, setTurn] = useState<Who>(1);
  const res = winner3(b);
  function play(i: number, who: Who) {
    if (b[i] || res) return;
    const nb = [...b]; nb[i] = who;
    setB(nb);
    api.sfx('pop');
    const r = winner3(nb);
    if (r) { api.sfx(r.w ? 'win' : 'nope'); onEnd(r.w); return; }
    setTurn(who === 1 ? 2 : 1);
  }
  useEffect(() => {
    if (ai && turn === 2 && !res) { const id = setTimeout(() => play(ai3(b), 2), 600); return () => clearTimeout(id); }
  }); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="duel">
      <Status api={api} turn={turn} winner={res ? res.w : null} ai={ai} />
      <div className="ttt">
        {b.map((v, i) => (
          <button key={i} className={`ttt__cell ${res?.line.includes(i) ? 'is-win' : ''}`} onClick={() => (!ai || turn === 1) && play(i, turn)}>
            {v === 1 && <span className="mark mark--x">✖</span>}
            {v === 2 && <span className="mark mark--o">●</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------- Fire på rad ----------------
const C = 7, R = 6;
function drop(b: (Who | 0)[], col: number) { for (let r = R - 1; r >= 0; r--) if (!b[r * C + col]) return r; return -1; }
function win4(b: (Who | 0)[]): { w: Who | 0; cells: number[] } | null {
  const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const w = b[r * C + c]; if (!w) continue;
    for (const [dc, dr] of dirs) {
      const cells = [0, 1, 2, 3].map((k) => [r + dr * k, c + dc * k]);
      if (cells.every(([rr, cc]) => rr >= 0 && rr < R && cc >= 0 && cc < C && b[rr * C + cc] === w)) return { w, cells: cells.map(([rr, cc]) => rr * C + cc) };
    }
  }
  return b.every(Boolean) ? { w: 0, cells: [] } : null;
}
function ai4(b: (Who | 0)[]): number {
  const cols = [3, 2, 4, 1, 5, 0, 6].filter((c) => drop(b, c) >= 0);
  for (const who of [2, 1] as Who[]) for (const c of cols) { const t = [...b]; t[drop(b, c) * C + c] = who; if (win4(t)?.w === who) return c; }
  // Unngå å gi motstanderen en vinner rett over
  const safe = cols.filter((c) => { const t = [...b]; const r = drop(b, c); t[r * C + c] = 2; if (r - 1 < 0) return true; t[(r - 1) * C + c] = 1; return win4(t)?.w !== 1; });
  const pool = safe.length ? safe : cols;
  return Math.random() < 0.7 ? pool[0] : pool[Math.floor(Math.random() * pool.length)];
}
function ConnectFour({ api, ai, onEnd }: { api: GameApi; ai: boolean; onEnd: (w: Who | 0) => void }) {
  const [b, setB] = useState<(Who | 0)[]>(Array(C * R).fill(0));
  const [turn, setTurn] = useState<Who>(1);
  const [lastIdx, setLastIdx] = useState(-1);
  const res = win4(b);
  function play(col: number, who: Who) {
    if (res) return;
    const r = drop(b, col); if (r < 0) return;
    const nb = [...b]; nb[r * C + col] = who;
    setB(nb); setLastIdx(r * C + col);
    api.sfx('pop');
    const w = win4(nb);
    if (w) { api.sfx(w.w ? 'win' : 'nope'); onEnd(w.w); return; }
    setTurn(who === 1 ? 2 : 1);
  }
  useEffect(() => {
    if (ai && turn === 2 && !res) { const id = setTimeout(() => play(ai4(b), 2), 700); return () => clearTimeout(id); }
  }); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="duel">
      <Status api={api} turn={turn} winner={res ? res.w : null} ai={ai} />
      <div className="c4">
        {Array.from({ length: C }, (_, col) => (
          <button key={col} className="c4__col" onClick={() => (!ai || turn === 1) && play(col, turn)} aria-label={`kolonne ${col + 1}`}>
            {Array.from({ length: R }, (_, r) => {
              const i = r * C + col, v = b[i];
              return (
                <span key={r} className="c4__hole">
                  {v ? <span className={`c4__disc ${i === lastIdx ? 'is-new' : ''} ${res?.cells.includes(i) ? 'is-win' : ''}`} style={{ background: COLORS[v as Who], ['--r' as string]: r + 1 }} /> : null}
                </span>
              );
            })}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------- Luft-hockey ----------------
// Hvor flink Shqipo er i luft-hockey, etter alder
const HOCKEY_AI: Record<WorldId, { speed: number; err: number; miss: number; hit: number }> = {
  tiny: { speed: 0.3, err: 0.14, miss: 0.35, hit: 0.06 },
  small: { speed: 0.32, err: 0.12, miss: 0.3, hit: 0.08 },
  mid: { speed: 0.46, err: 0.08, miss: 0.18, hit: 0.13 },
  big: { speed: 0.52, err: 0.07, miss: 0.16, hit: 0.15 }
};

function Hockey({ api, ai, world, onEnd }: { api: GameApi; ai: boolean; world: WorldId; onEnd: (w: Who | 0) => void }) {
  const aiCfg = HOCKEY_AI[world];
  const aiState = useRef({ aim: 0, ignore: false, inHalf: false });
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [dim, setDim] = useState({ w: 300, h: 500 });
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const scoreRef = useRef<[number, number]>([0, 0]);
  const over = useRef(false);
  const st = useRef({
    puck: { x: 0.5, y: 0.5, vx: 0, vy: 0 },
    p: { 1: { x: 0.5, y: 0.85, px: 0.5, py: 0.85 }, 2: { x: 0.5, y: 0.15, px: 0.5, py: 0.15 } } as Record<Who, { x: number; y: number; px: number; py: number }>,
    touch: new Map<number, Who>()
  });
  const GOAL = 5;

  useLayoutEffect(() => {
    const el = wrap.current!;
    const ro = new ResizeObserver(() => {
      // Spillebrettet er alltid stående (høyere enn bredt)
      const h = el.clientHeight, w = Math.min(el.clientWidth, h * 0.62);
      setDim({ w: Math.floor(w), h: Math.floor(h) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function rel(e: React.PointerEvent) {
    const r = canvas.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }
  function down(e: React.PointerEvent) {
    const p = rel(e);
    const who: Who = p.y > 0.5 ? 1 : 2;
    if (ai && who === 2) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    st.current.touch.set(e.pointerId, who);
    moveTo(who, p);
  }
  function move(e: React.PointerEvent) {
    const who = st.current.touch.get(e.pointerId);
    if (who) moveTo(who, rel(e));
  }
  function moveTo(who: Who, p: { x: number; y: number }) {
    const pd = st.current.p[who];
    pd.x = Math.min(0.92, Math.max(0.08, p.x));
    pd.y = who === 1 ? Math.min(0.95, Math.max(0.55, p.y)) : Math.min(0.45, Math.max(0.05, p.y));
  }

  useEffect(() => {
    let raf = 0, last = performance.now();
    const ar = dim.h / dim.w; // brettets høyde/bredde
    const PR = 0.075, KR = 0.05; // radius (i bredde-enheter) for kølle og puck
    const resetPuck = (toward: Who) => { st.current.puck = { x: 0.5, y: 0.5, vx: (Math.random() - 0.5) * 0.2, vy: toward === 1 ? 0.25 : -0.25 }; };
    // Server pucken mot barnet ved start (før lå den stille midt på banen)
    if (st.current.puck.vx === 0 && st.current.puck.vy === 0) resetPuck(1);
    let still = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const s = st.current, k = s.puck;
      // Shqipo styrer øverste kølle – med vilje litt treg og upresis, så barn kan vinne
      if (ai) {
        const p2 = s.p[2], a = aiState.current;
        const inHalf = k.y < 0.5;
        if (inHalf && !a.inHalf) {
          // Pucken kom over midtlinja: velg hvor upresis Shqipo er denne gangen, og om han "sover"
          a.aim = (Math.random() * 2 - 1) * aiCfg.err;
          a.ignore = Math.random() < aiCfg.miss;
        }
        a.inHalf = inHalf;
        const chase = inHalf && k.vy < 0.05 && !a.ignore;
        const tx = chase ? k.x + a.aim : 0.5 + a.aim * 0.5;
        const ty = chase ? Math.min(0.32, Math.max(0.06, k.y - 0.05)) : 0.12;
        const sp = aiCfg.speed * dt;
        p2.x += Math.max(-sp, Math.min(sp, tx - p2.x));
        p2.y += Math.max(-sp, Math.min(sp, ty - p2.y));
      }
      // Kollisjon kølle–puck (y måles i bredde-enheter ved å gange med ar)
      for (const who of [1, 2] as Who[]) {
        const p = s.p[who];
        const pvx = (p.x - p.px) / Math.max(dt, 0.001), pvy = (p.y - p.py) / Math.max(dt, 0.001);
        const dx = k.x - p.x, dy = (k.y - p.y) * ar, dist = Math.hypot(dx, dy);
        if (dist < PR + KR && dist > 0) {
          const nx = dx / dist, ny = dy / dist;
          k.x = p.x + nx * (PR + KR); k.y = p.y + (ny * (PR + KR)) / ar;
          const rv = (k.vx - pvx) * nx + (k.vy - pvy) * ar * ny;
          const bounce = ai && who === 2 ? 1.6 : 1.9;
          const push = ai && who === 2 ? aiCfg.hit : 0.25;
          if (rv < 0) { k.vx -= bounce * rv * nx; k.vy -= (bounce * rv * ny) / ar; }
          k.vx += pvx * push; k.vy += pvy * push;
          api.sfx('tap');
        }
        p.px = p.x; p.py = p.y;
      }
      const sp = Math.hypot(k.vx, k.vy * ar); const MAX = 2.2;
      if (sp > MAX) { k.vx *= MAX / sp; k.vy *= MAX / sp; }
      k.x += k.vx * dt; k.y += k.vy * dt;
      k.vx *= 0.995; k.vy *= 0.995;
      // Ligger pucken nesten stille en stund, får den et lite dytt mot barnets side
      if (Math.hypot(k.vx, k.vy) < 0.03) { still += dt; if (still > 2.5) { k.vy = 0.22; k.vx = (Math.random() - 0.5) * 0.15; still = 0; } } else still = 0;
      if (k.x < KR) { k.x = KR; k.vx = Math.abs(k.vx); }
      if (k.x > 1 - KR) { k.x = 1 - KR; k.vx = -Math.abs(k.vx); }
      const inGoal = k.x > 0.3 && k.x < 0.7;
      const kh = KR / ar;
      if (k.y < kh) { if (inGoal && !over.current) { goal(1); resetPuck(2); } else { k.y = kh; k.vy = Math.abs(k.vy); } }
      if (k.y > 1 - kh) { if (inGoal && !over.current) { goal(2); resetPuck(1); } else { k.y = 1 - kh; k.vy = -Math.abs(k.vy); } }
      draw(PR, KR);
      raf = requestAnimationFrame(loop);
    };
    const goal = (who: Who) => {
      const sc: [number, number] = [...scoreRef.current] as [number, number];
      sc[who - 1] += 1; scoreRef.current = sc; setScore(sc);
      api.sfx('match');
      if (sc[who - 1] >= GOAL) { over.current = true; api.sfx('win'); onEnd(who); }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [dim]); // eslint-disable-line react-hooks/exhaustive-deps

  function draw(PR: number, KR: number) {
    const c = canvas.current; if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    if (c.width !== dim.w * dpr) { c.width = dim.w * dpr; c.height = dim.h * dpr; }
    const g = c.getContext('2d')!; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = dim.w, H = dim.h;
    g.fillStyle = '#e8f6ff'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#a0c4ff'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
    g.beginPath(); g.arc(W / 2, H / 2, W * 0.15, 0, Math.PI * 2); g.stroke();
    g.fillStyle = COLORS[2]; g.fillRect(W * 0.3, 0, W * 0.4, 8);
    g.fillStyle = COLORS[1]; g.fillRect(W * 0.3, H - 8, W * 0.4, 8);
    const s = st.current;
    for (const who of [1, 2] as Who[]) {
      const p = s.p[who];
      g.fillStyle = COLORS[who]; g.beginPath(); g.arc(p.x * W, p.y * H, PR * W, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffffff88'; g.beginPath(); g.arc(p.x * W, p.y * H, PR * W * 0.45, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = '#23213a'; g.beginPath(); g.arc(s.puck.x * W, s.puck.y * H, KR * W, 0, Math.PI * 2); g.fill();
  }

  return (
    <div className="hockey" ref={wrap}>
      <div className="hockey__table" style={{ width: dim.w, height: dim.h }}>
        <canvas ref={canvas} style={{ width: dim.w, height: dim.h }} onPointerDown={down} onPointerMove={move}
          onPointerUp={(e) => st.current.touch.delete(e.pointerId)} onPointerCancel={(e) => st.current.touch.delete(e.pointerId)} />
        <span className="hockey__score hockey__score--top" style={{ color: COLORS[2] }}>{score[1]}</span>
        <span className="hockey__score hockey__score--bottom" style={{ color: COLORS[1] }}>{score[0]}</span>
      </div>
    </div>
  );
}
