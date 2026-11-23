/**
 * Lær klokka – 8 nivåer: hele og halve timer, kvart over/på, fem-minutter,
 * still klokka selv (dra den lange viseren), og digital → analog.
 */
import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import type { GameApi, GameProps } from '../types';
import { Emo } from '../../components/Emo';
import { LevelGrid, advanceGrid, emptyGridProgress, type GridProgress } from '../common/LevelGrid';
import { timeText } from './time';
import './clock.css';

const LEVELS = 8;
const PER_LEVEL = 6;
const R = (n: number) => Math.floor(Math.random() * n);
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

const digital = (h: number, m: number) => `${h}:${String(m).padStart(2, '0')}`;

/** Analog klokke. onDrag gjør den lange viseren flyttbar (timeviseren følger med). */
function Clock({ h, m, size = 240, onDrag, onRelease }: { h: number; m: number; size?: number; onDrag?: (deltaMin: number) => void; onRelease?: () => void }) {
  const ref = useRef<SVGSVGElement>(null);
  const last = useRef<number | null>(null);
  const hourA = ((h % 12) + m / 60) * 30, minA = m * 6;
  function angleMin(e: RPointerEvent) {
    const r = ref.current!.getBoundingClientRect();
    const a = Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2)));
    return Math.round((((a * 180) / Math.PI + 360) % 360) / 30) * 5 % 60; // nærmeste 5 minutter
  }
  return (
    <svg ref={ref} viewBox="0 0 200 200" width={size} height={size} className={`clock ${onDrag ? 'is-drag' : ''}`}
      onPointerDown={(e) => { if (!onDrag) return; (e.target as Element).setPointerCapture?.(e.pointerId); last.current = angleMin(e); }}
      onPointerMove={(e) => {
        if (!onDrag || last.current === null) return;
        const cur = angleMin(e);
        let d = cur - last.current;
        if (d > 30) d -= 60; if (d < -30) d += 60;
        if (d) { onDrag(d); last.current = cur; }
      }}
      onPointerUp={() => { if (last.current !== null) { last.current = null; onRelease?.(); } }}
      onPointerCancel={() => { last.current = null; }}>
      <circle cx={100} cy={100} r={94} fill="#fff" stroke="#ff9f1c" strokeWidth={8} />
      {Array.from({ length: 60 }, (_, k) => {
        const a = (k * 6 * Math.PI) / 180, big = k % 5 === 0;
        return <line key={k} x1={100 + Math.sin(a) * (big ? 76 : 82)} y1={100 - Math.cos(a) * (big ? 76 : 82)} x2={100 + Math.sin(a) * 86} y2={100 - Math.cos(a) * 86} stroke={big ? '#333' : '#bbb'} strokeWidth={big ? 3 : 1.5} />;
      })}
      {Array.from({ length: 12 }, (_, k) => {
        const n = k + 1, a = (n * 30 * Math.PI) / 180;
        return <text key={n} x={100 + Math.sin(a) * 62} y={100 - Math.cos(a) * 62 + 7} textAnchor="middle" className="clock__num">{n}</text>;
      })}
      <line x1={100} y1={100} x2={100 + Math.sin((hourA * Math.PI) / 180) * 42} y2={100 - Math.cos((hourA * Math.PI) / 180) * 42} stroke="#3a0ca3" strokeWidth={9} strokeLinecap="round" />
      <line x1={100} y1={100} x2={100 + Math.sin((minA * Math.PI) / 180) * 70} y2={100 - Math.cos((minA * Math.PI) / 180) * 70} stroke="#ef233c" strokeWidth={6} strokeLinecap="round" />
      {onDrag && <circle cx={100 + Math.sin((minA * Math.PI) / 180) * 70} cy={100 - Math.cos((minA * Math.PI) / 180) * 70} r={11} fill="#ef233c" stroke="#fff" strokeWidth={3} className="clock__knob" />}
      <circle cx={100} cy={100} r={7} fill="#333" />
    </svg>
  );
}

type Q = { kind: 'read' | 'set' | 'digital'; h: number; m: number; options: [number, number][] };

function minutesFor(level: number): number[] {
  if (level === 0) return [0];
  if (level === 1) return [30];
  if (level === 2) return [15, 45];
  if (level === 3 || level === 5 || level === 6) return [0, 15, 30, 45];
  return Array.from({ length: 12 }, (_, k) => k * 5);
}
function makeQ(level: number): Q {
  const kind: Q['kind'] = level === 5 || level === 7 ? 'set' : level === 6 ? 'digital' : 'read';
  const ms = minutesFor(level);
  const h = 1 + R(12), m = ms[R(ms.length)];
  const opts = new Map<string, [number, number]>([[`${h}:${m}`, [h, m]]]);
  while (opts.size < 3) {
    // Lure-svar: samme minutter med annen time, eller samme time med andre minutter
    const oh = Math.random() < 0.5 ? 1 + R(12) : h;
    const om = ms.length > 1 && oh === h ? ms[R(ms.length)] : m;
    if (oh !== h || om !== m) opts.set(`${oh}:${om}`, [oh, om]);
  }
  return { kind, h, m, options: shuffle([...opts.values()]) };
}

export default function ClockGame(props: GameProps) {
  const { api } = props;
  const [progress, setProgress] = useState<GridProgress>(() => api.loadData<GridProgress>() ?? emptyGridProgress());
  const [level, setLevel] = useState<number | null>(null);
  useEffect(() => {
    api.setBack(level !== null ? () => setLevel(null) : null);
    return () => api.setBack(null);
  }, [level]); // eslint-disable-line react-hooks/exhaustive-deps
  if (level === null) return <LevelGrid api={api} count={LEVELS} progress={progress} onPick={setLevel} />;
  return (
    <Play key={level} api={api} level={level} onDone={(stars) => {
      const { next, firstClear } = advanceGrid(progress, level, true, stars, LEVELS);
      setProgress(next);
      api.saveData(next);
      props.onFinish({ won: true, stars, firstClear });
    }} />
  );
}

function Play({ api, level, onDone }: { api: GameApi; level: number; onDone: (stars: number) => void }) {
  const [i, setI] = useState(0);
  const q = useMemo(() => makeQ(level), [i, level]);
  const [wrong, setWrong] = useState<number[]>([]);
  const [ok, setOk] = useState(false);
  const [total, setTotal] = useState(12 * 60); // still klokka: starter på 12:00
  const [checked, setChecked] = useState<'no' | null>(null);
  const mistakes = useRef(0);
  const target = timeText(q.h, q.m, api.lang);
  const prompt = q.kind === 'read' ? api.t('whatTime') : q.kind === 'digital' ? api.t('findClock') : api.t('setClock', { t: target });

  useEffect(() => { setWrong([]); setOk(false); setTotal(12 * 60); setChecked(null); api.speak(prompt); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = () => setTimeout(() => (i + 1 >= PER_LEVEL ? onDone(mistakes.current <= 1 ? 3 : mistakes.current <= 4 ? 2 : 1) : setI(i + 1)), 1500);
  function right() { setOk(true); api.sfx('match'); api.speak(target); advance(); }
  function pick(k: number) {
    if (ok) return;
    const [h, m] = q.options[k];
    if (h === q.h && m === q.m) right();
    else { api.sfx('nope'); mistakes.current++; setWrong((w) => [...w, k]); api.speak(timeText(h, m, api.lang)); }
  }
  const setH = (((Math.floor(total / 60) - 1) % 12) + 12) % 12 + 1;
  const setM = ((total % 60) + 60) % 60;
  function check() {
    if (ok) return;
    if (setH === q.h && setM === q.m) right();
    else { api.sfx('nope'); mistakes.current++; setChecked('no'); api.speak(api.t('notQuite')); }
  }
  const hint = (k: number) => !ok && wrong.length >= 2 && q.options[k][0] === q.h && q.options[k][1] === q.m;

  return (
    <div className="clockgame">
      <div className="shapes-progress">{Array.from({ length: PER_LEVEL }, (_, k) => <i key={k} className={k < i ? 'is-done' : ''} />)}</div>
      <button className="shapes-ask" onClick={() => api.speak(prompt)}>{prompt} <Emo e="🔊" /></button>
      {q.kind === 'read' && (
        <>
          <Clock h={q.h} m={q.m} size={230} />
          <div className="clock-options">
            {q.options.map(([h, m], k) => (
              <button key={k} className={`clock-opt pop-in ${wrong.includes(k) ? 'is-wrong' : ''} ${ok && h === q.h && m === q.m ? 'is-right' : ''} ${hint(k) ? 'is-hint' : ''}`}
                disabled={wrong.includes(k)} onClick={() => pick(k)}>{timeText(h, m, api.lang)}</button>
            ))}
          </div>
        </>
      )}
      {q.kind === 'digital' && (
        <>
          <div className="clock-digital">{digital(q.h, q.m)}</div>
          <div className="clock-options">
            {q.options.map(([h, m], k) => (
              <button key={k} className={`clock-opt clock-opt--clock pop-in ${wrong.includes(k) ? 'is-wrong' : ''} ${ok && h === q.h && m === q.m ? 'is-right' : ''} ${hint(k) ? 'is-hint' : ''}`}
                disabled={wrong.includes(k)} onClick={() => pick(k)}><Clock h={h} m={m} size={130} /></button>
            ))}
          </div>
        </>
      )}
      {q.kind === 'set' && (
        <>
          <div className={`clock-set ${ok ? 'is-right' : ''} ${checked === 'no' ? 'is-wrong' : ''}`}>
            <Clock h={setH} m={setM} size={250} onDrag={(d) => { setChecked(null); setTotal((t) => t + d); }} />
          </div>
          <div className="clock-setrow">
            <span className="clock-digital clock-digital--small">{digital(setH, setM)}</span>
            <button className="big-btn big-btn--go" onClick={check} disabled={ok}>✔ {api.t('check')}</button>
          </div>
        </>
      )}
    </div>
  );
}
