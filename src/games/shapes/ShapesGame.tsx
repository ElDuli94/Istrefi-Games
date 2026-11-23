/**
 * Former og mønster.
 * - Finn formen: «Finn: trekant!» (2 valg for 2–4 år, 3–4 for 5–7 år).
 * - Formboksen: dra formene ned i riktig hull (2–7 år).
 * - Mønster: hva kommer etter? AB, AAB, ABB, ABC (5–7 år).
 * Feil gir hint, aldri straff.
 */
import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import type { GameApi, GameProps } from '../types';
import { Emo } from '../../components/Emo';
import { NAMES, type ShapeId } from './names';
import './shapes.css';

const BASIC: ShapeId[] = ['circle', 'square', 'triangle', 'star', 'heart'];
const ALL = Object.keys(NAMES) as ShapeId[];
const COLORS = ['#ef233c', '#3a86ff', '#ffbe0b', '#2dc653', '#8338ec', '#ff70a6', '#fb5607'];
const R = (n: number) => Math.floor(Math.random() * n);
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

/** Tegner en form som SVG (viewBox 0 0 100 100). outline = bare kant (hull i formboksen). */
export function Shape({ id, color = '#3a86ff', size = 80, outline = false }: { id: ShapeId; color?: string; size?: number; outline?: boolean }) {
  const p = outline
    ? { fill: 'rgba(0,0,0,.18)', stroke: 'rgba(0,0,0,.35)', strokeWidth: 4, strokeDasharray: '8 6' }
    : { fill: color, stroke: '#fff', strokeWidth: 5 };
  let el;
  switch (id) {
    case 'circle': el = <circle cx={50} cy={50} r={42} {...p} />; break;
    case 'square': el = <rect x={10} y={10} width={80} height={80} rx={8} {...p} />; break;
    case 'triangle': el = <polygon points="50,8 93,90 7,90" strokeLinejoin="round" {...p} />; break;
    case 'star': el = <polygon points="50,5 61,38 96,38 68,59 79,93 50,72 21,93 32,59 4,38 39,38" strokeLinejoin="round" {...p} />; break;
    case 'heart': el = <path d="M50 88 C20 66 5 48 12 28 C18 12 40 10 50 28 C60 10 82 12 88 28 C95 48 80 66 50 88 Z" {...p} />; break;
    case 'rectangle': el = <rect x={4} y={24} width={92} height={52} rx={7} {...p} />; break;
    case 'oval': el = <ellipse cx={50} cy={50} rx={45} ry={30} {...p} />; break;
    case 'hexagon': el = <polygon points="27,10 73,10 95,50 73,90 27,90 5,50" strokeLinejoin="round" {...p} />; break;
    case 'diamond': el = <polygon points="50,4 92,50 50,96 8,50" strokeLinejoin="round" {...p} />; break;
  }
  return <svg viewBox="0 0 100 100" width={size} height={size} className="shape-svg" aria-hidden>{el}</svg>;
}

type Mode = 'find' | 'box' | 'pattern';

export default function ShapesGame(props: GameProps) {
  const { api, world } = props;
  const [mode, setMode] = useState<Mode | null>(null);
  useEffect(() => {
    api.setBack(mode ? () => setMode(null) : null);
    return () => api.setBack(null);
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps
  const tiny = world === 'tiny';
  if (!mode) {
    const modes: [Mode, string, string][] = [
      ['find', '🔷', api.t('findShape')],
      ['box', '📦', api.t('shapeBox')],
      ...(tiny ? [] : [['pattern', '🔁', api.t('patterns')] as [Mode, string, string]])
    ];
    return (
      <div className="shapes-menu">
        {modes.map(([m, e, label], k) => (
          <button key={m} className="shapes-mode pop-in" style={{ animationDelay: `${k * 0.07}s` }} onClick={() => { api.sfx('pop'); api.speak(label); setMode(m); }}>
            <span><Emo e={e} /></span>{label}
          </button>
        ))}
      </div>
    );
  }
  const done = (stars: number) => props.onFinish({ won: true, stars });
  if (mode === 'find') return <FindShape api={api} tiny={tiny} onDone={done} />;
  if (mode === 'box') return <ShapeBox api={api} tiny={tiny} onDone={done} />;
  return <Pattern api={api} onDone={done} />;
}

const nameOf = (api: GameApi, s: ShapeId) => NAMES[s][api.lang];

function Progress({ n, i }: { n: number; i: number }) {
  return <div className="shapes-progress">{Array.from({ length: n }, (_, k) => <i key={k} className={k < i ? 'is-done' : ''} />)}</div>;
}

// ---------- Finn formen ----------
function FindShape({ api, tiny, onDone }: { api: GameApi; tiny: boolean; onDone: (stars: number) => void }) {
  const ROUNDS = tiny ? 6 : 8;
  const [i, setI] = useState(0);
  const pool = tiny ? BASIC : ALL;
  const q = useMemo(() => {
    const opts = shuffle(pool).slice(0, tiny ? 2 : i < 3 ? 3 : 4).map((s) => ({ s, c: COLORS[R(COLORS.length)] }));
    return { opts, target: opts[R(opts.length)].s };
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  const [wrong, setWrong] = useState<ShapeId[]>([]);
  const [ok, setOk] = useState(false);
  const mistakes = useRef(0);
  const ask = () => api.speak(api.t('findThe', { x: nameOf(api, q.target) }));
  useEffect(() => { setWrong([]); setOk(false); ask(); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  function pick(s: ShapeId) {
    if (ok) return;
    if (s === q.target) {
      setOk(true); api.sfx('match'); api.sayBoth(nameOf(api, s), NAMES[s][api.otherLang]);
      setTimeout(() => (i + 1 >= ROUNDS ? onDone(mistakes.current <= 1 ? 3 : mistakes.current <= 4 ? 2 : 1) : setI(i + 1)), 1400);
    } else { api.sfx('nope'); mistakes.current++; setWrong((w) => [...w, s]); }
  }
  const hint = !ok && wrong.length >= (tiny ? 1 : 2);
  return (
    <div className="shapes">
      <Progress n={ROUNDS} i={i} />
      <button className="shapes-ask" onClick={ask}>{api.t('findThe', { x: nameOf(api, q.target) })} <Emo e="🔊" /></button>
      <div className="shapes-choices">
        {q.opts.map(({ s, c }) => (
          <button key={s} className={`shapes-choice pop-in ${wrong.includes(s) ? 'is-wrong' : ''} ${ok && s === q.target ? 'is-right' : ''} ${hint && s === q.target ? 'is-hint' : ''}`}
            disabled={wrong.includes(s)} onClick={() => pick(s)}>
            <Shape id={s} color={c} size={tiny ? 130 : 110} />
            {ok && s === q.target && <span className="shapes-name">{nameOf(api, s)}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- Formboksen (dra og slipp) ----------
interface Piece { s: ShapeId; c: string; x: number; y: number; home: [number, number]; placed: boolean }

function ShapeBox({ api, tiny, onDone }: { api: GameApi; tiny: boolean; onDone: (stars: number) => void }) {
  const ROUNDS = 3;
  const N = tiny ? 3 : 4;
  const [round, setRound] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 600, h: 400 });
  const shapes = useMemo(() => shuffle(tiny ? BASIC : ALL).slice(0, N), [round]); // eslint-disable-line react-hooks/exhaustive-deps
  const holeOrder = useMemo(() => shuffle(shapes), [shapes]);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const drag = useRef<{ k: number; dx: number; dy: number } | null>(null);
  const S = Math.min(130, size.w / (N + 1), size.h / 3.4);

  useEffect(() => {
    const el = wrap.current!;
    const fit = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  const holePos = (k: number): [number, number] => [((k + 0.5) / N) * size.w, size.h * 0.24];
  useEffect(() => {
    setPieces(shapes.map((s, k) => {
      const home: [number, number] = [((k + 0.5) / N) * size.w, size.h * 0.76];
      return { s, c: COLORS[(k + round * 2) % COLORS.length], x: home[0], y: home[1], home, placed: false };
    }));
    if (round === 0) api.speak(api.t('dragShapes'));
  }, [shapes, size.w, size.h]); // eslint-disable-line react-hooks/exhaustive-deps

  function down(e: RPointerEvent, k: number) {
    if (pieces[k].placed) return;
    const r = wrap.current!.getBoundingClientRect();
    drag.current = { k, dx: e.clientX - r.left - pieces[k].x, dy: e.clientY - r.top - pieces[k].y };
    (e.target as Element).setPointerCapture?.(e.pointerId);
    api.speak(nameOf(api, pieces[k].s));
  }
  function move(e: RPointerEvent) {
    const d = drag.current; if (!d) return;
    const r = wrap.current!.getBoundingClientRect();
    const x = e.clientX - r.left - d.dx, y = e.clientY - r.top - d.dy;
    setPieces((ps) => ps.map((p, j) => (j === d.k ? { ...p, x, y } : p)));
  }
  function up() {
    const d = drag.current; if (!d) return;
    drag.current = null;
    const p = pieces[d.k];
    const target = holeOrder.indexOf(p.s);
    const [hx, hy] = holePos(target);
    const near = (k: number) => { const [x, y] = holePos(k); return Math.hypot(p.x - x, p.y - y) < S * 0.75; };
    if (near(target)) {
      api.sfx('match');
      api.sayBoth(nameOf(api, p.s), NAMES[p.s][api.otherLang]);
      const next = pieces.map((q, j) => (j === d.k ? { ...q, x: hx, y: hy, placed: true } : q));
      setPieces(next);
      if (next.every((q) => q.placed)) setTimeout(() => (round + 1 >= ROUNDS ? onDone(3) : setRound(round + 1)), 1300);
    } else {
      if (holeOrder.some((_, k) => near(k))) api.sfx('nope');
      setPieces((ps) => ps.map((q, j) => (j === d.k ? { ...q, x: q.home[0], y: q.home[1] } : q)));
    }
  }

  return (
    <div className="shapes">
      <Progress n={ROUNDS} i={round} />
      <div className="shapebox" ref={wrap} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <div className="shapebox__lid" />
        {holeOrder.map((s, k) => {
          const [x, y] = holePos(k);
          return <div key={`h${s}`} data-shape={s} className="shapebox__hole" style={{ left: x, top: y }}><Shape id={s} size={S} outline /></div>;
        })}
        {pieces.map((p, k) => (
          <div key={`p${p.s}`} data-shape={p.s} className={`shapebox__piece ${p.placed ? 'is-placed' : ''} ${drag.current?.k === k ? 'is-drag' : ''}`}
            style={{ left: p.x, top: p.y }} onPointerDown={(e) => down(e, k)}>
            <Shape id={p.s} color={p.c} size={S * 0.92} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Mønster ----------
type Tok = { s: ShapeId; c: string };
function makePattern(i: number): { row: Tok[]; answer: Tok; options: Tok[] } {
  const kinds = i < 3 ? ['AB'] : i < 6 ? ['AAB', 'ABB'] : ['ABC', 'AAB', 'ABB'];
  const kind = kinds[R(kinds.length)];
  const picks = shuffle(ALL.slice(0, 6)).slice(0, 3);
  const cols = shuffle(COLORS).slice(0, 3);
  const toks: Record<string, Tok> = { A: { s: picks[0], c: cols[0] }, B: { s: picks[1], c: cols[1] }, C: { s: picks[2], c: cols[2] } };
  const seq: Tok[] = [];
  for (let k = 0; seq.length < 7; k++) seq.push(toks[kind[k % kind.length]]);
  const answer = seq[6];
  const row = seq.slice(0, 6);
  const distractors = Object.values(toks).filter((t) => t !== answer);
  const extra = { s: shuffle(ALL.filter((s) => !picks.includes(s)))[0], c: COLORS[R(COLORS.length)] };
  const options = shuffle([answer, ...distractors.slice(0, 1), distractors[1] ?? extra]);
  return { row, answer, options };
}

function Pattern({ api, onDone }: { api: GameApi; onDone: (stars: number) => void }) {
  const ROUNDS = 8;
  const [i, setI] = useState(0);
  const q = useMemo(() => makePattern(i), [i]);
  const [wrong, setWrong] = useState<number[]>([]);
  const [ok, setOk] = useState(false);
  const mistakes = useRef(0);
  useEffect(() => { setWrong([]); setOk(false); api.speak(api.t('whatComesNext')); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  function pick(k: number) {
    if (ok) return;
    if (q.options[k] === q.answer) {
      setOk(true); api.sfx('match'); api.speak(nameOf(api, q.answer.s));
      setTimeout(() => (i + 1 >= ROUNDS ? onDone(mistakes.current <= 1 ? 3 : mistakes.current <= 4 ? 2 : 1) : setI(i + 1)), 1400);
    } else { api.sfx('nope'); mistakes.current++; setWrong((w) => [...w, k]); }
  }
  return (
    <div className="shapes">
      <Progress n={ROUNDS} i={i} />
      <button className="shapes-ask" onClick={() => api.speak(api.t('whatComesNext'))}>{api.t('whatComesNext')} <Emo e="🔊" /></button>
      <div className="pattern-row">
        {q.row.map((t, k) => <span key={k} className="pattern-cell pop-in" style={{ animationDelay: `${k * 0.06}s` }}><Shape id={t.s} color={t.c} size={56} /></span>)}
        <span className={`pattern-cell pattern-cell--q ${ok ? 'is-right' : ''}`}>{ok ? <Shape id={q.answer.s} color={q.answer.c} size={56} /> : '?'}</span>
      </div>
      <div className="shapes-choices">
        {q.options.map((t, k) => (
          <button key={k} className={`shapes-choice pop-in ${wrong.includes(k) ? 'is-wrong' : ''} ${ok && t === q.answer ? 'is-right' : ''} ${!ok && wrong.length >= 2 && t === q.answer ? 'is-hint' : ''}`}
            disabled={wrong.includes(k)} onClick={() => pick(k)}>
            <Shape id={t.s} color={t.c} size={90} />
          </button>
        ))}
      </div>
    </div>
  );
}
