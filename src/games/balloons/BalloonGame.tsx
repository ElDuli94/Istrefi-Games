/**
 * Ballongsprekk – ballonger flyr opp, trykk for å sprekke dem.
 * 2–4 år: fri lek, hver ballong sier fargen, tallet eller dyret sitt. Uendelig – liten feiring hver 15. ballong.
 * 5–7 år: oppgaver («Sprekk den røde ballongen!», «Finn tallet 4!», «Sprekk bokstaven A!»), og fartsøkning.
 * Spesialballonger: ⭐ gullballong (bonus) og 🌈 regnbueballong (sprekker alle på skjermen).
 */
import { useEffect, useRef, useState } from 'react';
import type { GameProps } from '../types';
import type { DictKey } from '../../i18n/no';
import { Emo } from '../../components/Emo';
import { ANIMALS } from '../../data/animals';
import './balloons.css';

const COLORS = [
  { id: 'red', css: '#ff4d6d' }, { id: 'blue', css: '#3a86ff' }, { id: 'yellow', css: '#ffd60a' }, { id: 'green', css: '#38b000' },
  { id: 'orange', css: '#ff9f1c' }, { id: 'purple', css: '#8338ec' }, { id: 'pink', css: '#ff70a6' }
] as const;
type ColorId = (typeof COLORS)[number]['id'];
// Bokstaver som finnes i både norsk og albansk og er lette å kjenne igjen
const LETTERS = 'A B D E F H I K L M N O P R S T U'.split(' ');

type Special = 'star' | 'rainbow';
interface Balloon {
  id: number; color: ColorId; num: number | null; letter: string | null; animal: number | null;
  special: Special | null; x: number; dur: number; popped: boolean;
}
type Task = { kind: 'color'; color: ColorId } | { kind: 'number'; n: number } | { kind: 'letter'; l: string };

let bid = 1;
const R = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
const CONFETTI = ['#ff006e', '#ffd60a', '#06d6a0', '#4cc9f0', '#8338ec', '#fb5607'];

export default function BalloonGame({ world, api, onFinish }: GameProps) {
  const free = world === 'tiny';
  const GOAL = free ? 15 : 12;
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [count, setCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [task, setTask] = useState<Task | null>(null);
  const [streak, setStreak] = useState(0);
  const done = useRef(false);
  const taskRef = useRef<Task | null>(null);
  taskRef.current = task;
  const countRef = useRef(0);
  countRef.current = count;

  const colorWord = (c: ColorId) => api.t(`color_${c}` as DictKey);
  const colorName = (c: ColorId) => api.t(`colorName_${c}` as DictKey);
  const taskText = (t: Task) => t.kind === 'color' ? api.t('popColor', { color: colorWord(t.color) }) : t.kind === 'number' ? api.t('popNumber', { n: t.n }) : api.t('popLetter', { l: t.l });

  function newTask() {
    const r = Math.random();
    const t: Task = r < 0.34 ? { kind: 'color', color: pick(COLORS).id } : r < 0.67 ? { kind: 'number', n: R(1, 9) } : { kind: 'letter', l: pick(LETTERS) };
    setTask(t);
    api.speak(taskText(t));
  }

  useEffect(() => {
    if (free) api.speak(api.t('popBalloons'));
    else newTask();
    const spawn = () => {
      const t = taskRef.current;
      const roll = Math.random();
      const special: Special | null = roll < 0.06 ? 'star' : free && roll < 0.1 ? 'rainbow' : null;
      let color = pick(COLORS).id;
      let num: number | null = null, letter: string | null = null, animal: number | null = null;
      if (!special) {
        if (free) {
          const k = Math.random();
          if (k < 0.3) num = R(1, 5); else if (k < 0.5) animal = R(0, Math.min(ANIMALS.length, 12) - 1);
        } else if (Math.random() < 0.5) num = R(1, 9);
        else letter = pick(LETTERS);
      }
      // Sørg for at riktig ballong dukker opp ofte nok
      if (t && !special && Math.random() < 0.4) {
        if (t.kind === 'color') color = t.color;
        else if (t.kind === 'number') { num = t.n; letter = null; }
        else { letter = t.l; num = null; }
      }
      // 5–7 år: ballongene går fortere jo flere man har sprukket
      const dur = free ? R(7, 10) : Math.max(4, R(6, 9) - countRef.current * 0.25);
      setBalloons((bs) => [...bs.slice(-14), { id: bid++, color, num, letter, animal, special, x: R(6, 88), dur, popped: false }]);
    };
    spawn();
    const id = setInterval(spawn, free ? 1100 : 950);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const burst = (id: number) => {
    setBalloons((bs) => bs.map((x) => (x.id === id ? { ...x, popped: true } : x)));
    setTimeout(() => setBalloons((bs) => bs.filter((x) => x.id !== id)), 450);
  };

  function pop(b: Balloon) {
    if (b.popped || done.current) return;
    const t = taskRef.current;
    let gain = 1;
    if (b.special === 'star') {
      api.sfx('sticker');
      api.speak(api.t('starBalloon'));
      gain = 2;
    } else if (b.special === 'rainbow') {
      // Regnbuen sprekker alle ballongene på skjermen
      api.sfx('win');
      api.speak(api.t('rainbowBalloon'));
      const others = balloons.filter((x) => !x.popped && x.id !== b.id);
      others.forEach((x, k) => setTimeout(() => burst(x.id), 60 + k * 70));
      gain = 1 + others.length;
    } else if (t) {
      const ok = t.kind === 'color' ? b.color === t.color : t.kind === 'number' ? b.num === t.n : b.letter === t.l;
      if (!ok) {
        api.sfx('nope');
        setMistakes((m) => m + 1);
        setStreak(0);
        return;
      }
    }
    if (!b.special) api.sfx('pop');
    burst(b.id);
    if (free && !b.special) {
      if (b.animal !== null) api.speak(ANIMALS[b.animal].name[api.lang]);
      else api.speak(b.num !== null ? String(b.num) : colorName(b.color));
    }
    const next = count + gain;
    setCount(next);
    if (free) {
      // 2–4 år: leken fortsetter for alltid. Hver 15. ballong gir en liten feiring + mynter.
      if (Math.floor(next / GOAL) > Math.floor(count / GOAL)) api.reward(5);
      return;
    }
    if (b.special) return; // bonus teller, men oppgaven står
    const s = streak + 1;
    setStreak(s);
    if (s > 0 && s % 5 === 0) { api.sfx('sticker'); api.speak(api.t('streakN', { n: s })); }
    if (next >= GOAL) {
      done.current = true;
      const stars = mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1;
      setTimeout(() => onFinish({ won: true, stars }), 700);
    } else {
      api.sfx('match');
      setTimeout(newTask, 500);
    }
  }

  return (
    <div className={`balloons ${free ? 'balloons--free' : ''}`}>
      <div className="balloons__hud">
        {task && (
          <button className="balloons__task" onClick={() => api.speak(taskText(task))}>
            {task.kind === 'color' ? <span className="balloons__dot" style={{ background: COLORS.find((c) => c.id === task.color)!.css }} /> : <b>{task.kind === 'number' ? task.n : task.l}</b>}
            🔊
          </button>
        )}
        <span className="hud-chip">🎈 {free ? count : `${Math.min(count, GOAL)} / ${GOAL}`}</span>
        {!free && streak >= 3 && <span className="hud-chip balloons__streak">🔥 {streak}</span>}
      </div>
      <div className="balloons__sky">
        {balloons.map((b) => {
          const css = COLORS.find((c) => c.id === b.color)!.css;
          return (
            <button
              key={b.id}
              className={`balloon ${b.popped ? 'is-popped' : ''} ${b.special ? `balloon--${b.special}` : ''}`}
              style={{ left: `${b.x}%`, animationDuration: `${b.dur}s`, ['--c' as string]: css }}
              onPointerDown={() => pop(b)}
              onAnimationEnd={(e) => { if (e.animationName === 'balloonUp') setBalloons((bs) => bs.filter((x) => x.id !== b.id)); }}
              aria-label={b.num !== null ? String(b.num) : b.letter ?? colorName(b.color)}
            >
              <span className="balloon__body">
                {b.special === 'star' ? <Emo e="⭐" /> : b.special === 'rainbow' ? <Emo e="🌈" /> : b.animal !== null ? <Emo e={ANIMALS[b.animal].emoji} /> : b.num ?? b.letter ?? ''}
              </span>
              <span className="balloon__string" />
              {b.popped && (
                <span className="balloon__confetti" aria-hidden>
                  {Array.from({ length: 10 }, (_, k) => (
                    <i key={k} style={{ ['--a' as string]: `${k * 36}deg`, background: CONFETTI[k % CONFETTI.length] }} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
