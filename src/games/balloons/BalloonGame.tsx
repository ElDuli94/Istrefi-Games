/**
 * Ballongsprekk – ballonger flyr opp, trykk for å sprekke dem.
 * 2–4 år: fri lek, hver ballong sier fargen eller tallet sitt.
 * 5–7 år: oppgaver ("Sprekk den røde ballongen!", "Finn tallet 4!").
 */
import { useEffect, useRef, useState } from 'react';
import type { GameProps } from '../types';
import type { DictKey } from '../../i18n/no';
import './balloons.css';

const COLORS = [
  { id: 'red', css: '#ff4d6d' }, { id: 'blue', css: '#3a86ff' }, { id: 'yellow', css: '#ffd60a' }, { id: 'green', css: '#38b000' },
  { id: 'orange', css: '#ff9f1c' }, { id: 'purple', css: '#8338ec' }, { id: 'pink', css: '#ff70a6' }
] as const;
type ColorId = (typeof COLORS)[number]['id'];

interface Balloon { id: number; color: ColorId; num: number | null; x: number; dur: number; popped: boolean }
type Task = { kind: 'color'; color: ColorId } | { kind: 'number'; n: number };

let bid = 1;
const R = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));

export default function BalloonGame({ world, api, onFinish }: GameProps) {
  const free = world === 'tiny';
  const GOAL = free ? 15 : 10;
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [count, setCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [task, setTask] = useState<Task | null>(null);
  const done = useRef(false);
  const taskRef = useRef<Task | null>(null);
  taskRef.current = task;

  const colorWord = (c: ColorId) => api.t(`color_${c}` as DictKey);
  const colorName = (c: ColorId) => api.t(`colorName_${c}` as DictKey);

  function newTask() {
    const t: Task = Math.random() < 0.5 ? { kind: 'color', color: COLORS[R(0, COLORS.length - 1)].id } : { kind: 'number', n: R(1, 9) };
    setTask(t);
    api.speak(t.kind === 'color' ? api.t('popColor', { color: colorWord(t.color) }) : api.t('popNumber', { n: t.n }));
  }

  useEffect(() => {
    if (free) api.speak(api.t('popBalloons'));
    else newTask();
    const spawn = () => {
      const t = taskRef.current;
      let color = COLORS[R(0, COLORS.length - 1)].id;
      let num: number | null = free ? (Math.random() < 0.4 ? R(1, 5) : null) : R(1, 9);
      // Sørg for at riktig ballong dukker opp ofte nok
      if (t && Math.random() < 0.4) {
        if (t.kind === 'color') color = t.color;
        else num = t.n;
      }
      const b: Balloon = { id: bid++, color, num, x: R(6, 88), dur: free ? R(7, 10) : R(6, 9), popped: false };
      setBalloons((bs) => [...bs.slice(-14), b]);
    };
    spawn();
    const id = setInterval(spawn, free ? 1100 : 950);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function pop(b: Balloon) {
    if (b.popped || done.current) return;
    const t = taskRef.current;
    if (t) {
      const ok = t.kind === 'color' ? b.color === t.color : b.num === t.n;
      if (!ok) {
        api.sfx('nope');
        setMistakes((m) => m + 1);
        return;
      }
    }
    api.sfx('pop');
    setBalloons((bs) => bs.map((x) => (x.id === b.id ? { ...x, popped: true } : x)));
    setTimeout(() => setBalloons((bs) => bs.filter((x) => x.id !== b.id)), 350);
    if (free) api.speak(b.num !== null ? String(b.num) : colorName(b.color));
    const next = count + 1;
    setCount(next);
    if (next >= GOAL) {
      done.current = true;
      const stars = free ? 3 : mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1;
      setTimeout(() => onFinish({ won: true, stars, coins: free ? 10 : undefined }), 700);
    } else if (!free) {
      api.sfx('match');
      setTimeout(newTask, 500);
    }
  }

  return (
    <div className={`balloons ${free ? 'balloons--free' : ''}`}>
      <div className="balloons__hud">
        {task && (
          <button className="balloons__task" onClick={() => api.speak(task.kind === 'color' ? api.t('popColor', { color: colorWord(task.color) }) : api.t('popNumber', { n: task.n }))}>
            {task.kind === 'color' ? <span className="balloons__dot" style={{ background: COLORS.find((c) => c.id === task.color)!.css }} /> : <b>{task.n}</b>}
            🔊
          </button>
        )}
        <span className="hud-chip">🎈 {count} / {GOAL}</span>
      </div>
      <div className="balloons__sky">
        {balloons.map((b) => {
          const css = COLORS.find((c) => c.id === b.color)!.css;
          return (
            <button
              key={b.id}
              className={`balloon ${b.popped ? 'is-popped' : ''}`}
              style={{ left: `${b.x}%`, animationDuration: `${b.dur}s`, ['--c' as string]: css }}
              onPointerDown={() => pop(b)}
              onAnimationEnd={(e) => { if (e.animationName === 'balloonUp') setBalloons((bs) => bs.filter((x) => x.id !== b.id)); }}
              aria-label={b.num !== null ? String(b.num) : colorName(b.color)}
            >
              <span className="balloon__body">{b.num ?? ''}</span>
              <span className="balloon__string" />
              {b.popped && <span className="balloon__boom">💥</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
