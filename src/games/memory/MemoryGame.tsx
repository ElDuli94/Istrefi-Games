import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { GameProps } from '../types';
import type { WorldId } from '../../data/worlds';
import { ANIMALS } from '../../data/animals';
import './memory.css';

// Vanskelighetsgrad per aldersverden
const LEVELS: Record<WorldId, { pairs: number; showMoves: boolean; showTime: boolean; speakEveryFlip: boolean; flipBackMs: number }> = {
  tiny: { pairs: 3, showMoves: false, showTime: false, speakEveryFlip: true, flipBackMs: 1400 },
  small: { pairs: 6, showMoves: true, showTime: false, speakEveryFlip: false, flipBackMs: 1100 },
  mid: { pairs: 8, showMoves: true, showTime: true, speakEveryFlip: false, flipBackMs: 900 },
  big: { pairs: 12, showMoves: true, showTime: true, speakEveryFlip: false, flipBackMs: 700 }
};

interface Card {
  key: number;
  animal: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeDeck(pairs: number): Card[] {
  const picked = shuffle(ANIMALS.map((_, i) => i)).slice(0, pairs);
  return shuffle(picked.flatMap((a, i) => [{ key: i * 2, animal: a }, { key: i * 2 + 1, animal: a }]));
}

/** Finn antall kolonner som gir størst mulig kort i tilgjengelig plass. */
function bestGrid(n: number, w: number, h: number, gap: number) {
  let best = { cols: n, size: 0 };
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const size = Math.min((w - gap * (cols - 1)) / cols, (h - gap * (rows - 1)) / rows / 1.15);
    if (size > best.size) best = { cols, size };
  }
  return best;
}

export default function MemoryGame({ world, api, onFinish }: GameProps) {
  const level = LEVELS[world];
  const [deck] = useState(() => makeDeck(level.pairs));
  const [open, setOpen] = useState<number[]>([]); // indekser som er snudd (maks 2)
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [wiggle, setWiggle] = useState<number[]>([]);
  const lock = useRef(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const [grid, setGrid] = useState({ cols: 4, size: 80 });

  useLayoutEffect(() => {
    const el = boardRef.current!;
    const ro = new ResizeObserver(() => {
      const gap = world === 'tiny' ? 18 : 10;
      setGrid(bestGrid(deck.length, el.clientWidth, el.clientHeight, gap));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [deck.length, world]);

  useEffect(() => {
    api.speak(api.t('findPairs'));
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animalName = (i: number) => ANIMALS[deck[i].animal].name[api.lang];

  function flip(i: number) {
    if (lock.current || open.includes(i) || matched.has(i)) return;
    api.sfx('flip');
    if (level.speakEveryFlip) api.speak(animalName(i));
    const next = [...open, i];
    setOpen(next);
    if (next.length < 2) return;

    setMoves((m) => m + 1);
    const [a, b] = next;
    if (deck[a].animal === deck[b].animal) {
      const nm = new Set(matched).add(a).add(b);
      setMatched(nm);
      setOpen([]);
      setTimeout(() => {
        api.sfx('match');
        if (!level.speakEveryFlip) api.speak(animalName(a));
      }, 250);
      if (nm.size === deck.length) {
        const total = moves + 1;
        const stars = world === 'tiny' ? 3 : total <= level.pairs * 1.5 ? 3 : total <= level.pairs * 2.2 ? 2 : 1;
        setTimeout(() => onFinish({ won: true, stars, score: Math.max(0, 1000 - total * 20 - seconds * 2) }), 900);
      }
    } else {
      lock.current = true;
      setTimeout(() => {
        api.sfx('nope');
        setWiggle([a, b]);
      }, 400);
      setTimeout(() => {
        setOpen([]);
        setWiggle([]);
        lock.current = false;
      }, level.flipBackMs);
    }
  }

  const fmtTime = useMemo(() => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`, [seconds]);

  return (
    <div className={`memory memory--${world}`}>
      {(level.showMoves || level.showTime) && (
        <div className="memory__hud">
          {level.showMoves && <span>🔄 {api.t('moves')}: <b>{moves}</b></span>}
          {level.showTime && <span>⏱️ {api.t('time')}: <b>{fmtTime}</b></span>}
        </div>
      )}
      <div className="memory__board" ref={boardRef}>
        <div
          className="memory__grid"
          style={{ gridTemplateColumns: `repeat(${grid.cols}, ${grid.size}px)`, gap: world === 'tiny' ? 18 : 10 }}
        >
          {deck.map((card, i) => {
            const isUp = open.includes(i) || matched.has(i);
            return (
              <button
                key={card.key}
                className={`mcard ${isUp ? 'is-up' : ''} ${matched.has(i) ? 'is-matched' : ''} ${wiggle.includes(i) ? 'is-wiggle' : ''}`}
                style={{ width: grid.size, height: grid.size * 1.15, fontSize: grid.size * 0.55 }}
                onClick={() => flip(i)}
                aria-label={isUp ? animalName(i) : '?'}
              >
                <span className="mcard__inner">
                  <span className="mcard__back">⭐</span>
                  <span className="mcard__front">{ANIMALS[card.animal].emoji}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
