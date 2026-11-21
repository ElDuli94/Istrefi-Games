import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { GameProps } from '../types';
import type { WorldId } from '../../data/worlds';
import { ANIMALS } from '../../data/animals';
import { LevelPicker, advance, emptyProgress, type LevelProgress } from '../common/LevelPicker';
import './memory.css';

interface LevelCfg {
  pairs: number;
  flipBackMs: number;
  /** 'word': det ene kortet i hvert par viser dyrets navn i stedet for bilde (lesetrening). */
  mode: 'same' | 'word';
}

// Tre nivåer per aldersverden
const LEVELS: Record<WorldId, LevelCfg[]> = {
  tiny: [
    { pairs: 2, flipBackMs: 1500, mode: 'same' },
    { pairs: 3, flipBackMs: 1400, mode: 'same' },
    { pairs: 4, flipBackMs: 1300, mode: 'same' }
  ],
  small: [
    { pairs: 4, flipBackMs: 1200, mode: 'same' },
    { pairs: 6, flipBackMs: 1100, mode: 'same' },
    { pairs: 8, flipBackMs: 1000, mode: 'same' }
  ],
  mid: [
    { pairs: 6, flipBackMs: 1000, mode: 'same' },
    { pairs: 8, flipBackMs: 900, mode: 'same' },
    { pairs: 8, flipBackMs: 900, mode: 'word' }
  ],
  big: [
    { pairs: 10, flipBackMs: 800, mode: 'same' },
    { pairs: 12, flipBackMs: 700, mode: 'word' },
    { pairs: 15, flipBackMs: 600, mode: 'word' }
  ]
};

const WORLD_UI: Record<WorldId, { showMoves: boolean; showTime: boolean; speakEveryFlip: boolean; alwaysThreeStars: boolean }> = {
  tiny: { showMoves: false, showTime: false, speakEveryFlip: true, alwaysThreeStars: true },
  small: { showMoves: true, showTime: false, speakEveryFlip: false, alwaysThreeStars: false },
  mid: { showMoves: true, showTime: true, speakEveryFlip: false, alwaysThreeStars: false },
  big: { showMoves: true, showTime: true, speakEveryFlip: false, alwaysThreeStars: false }
};

interface Card {
  key: number;
  animal: number;
  isWord: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeDeck(cfg: LevelCfg): Card[] {
  const picked = shuffle(ANIMALS.map((_, i) => i)).slice(0, cfg.pairs);
  return shuffle(
    picked.flatMap((a, i) => [
      { key: i * 2, animal: a, isWord: false },
      { key: i * 2 + 1, animal: a, isWord: cfg.mode === 'word' }
    ])
  );
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

export default function MemoryGame(props: GameProps) {
  const { world, api } = props;
  const [progress, setProgress] = useState<LevelProgress>(() => api.loadData<LevelProgress>() ?? emptyProgress());
  const [level, setLevel] = useState<number | null>(null);

  if (level === null) {
    return (
      <LevelPicker
        api={api}
        progress={progress}
        onPick={setLevel}
        details={LEVELS[world].map((l) => `${l.pairs * 2} 🃏${l.mode === 'word' ? ' + 🔤' : ''}`)}
      />
    );
  }

  return (
    <Board
      {...props}
      cfg={LEVELS[world][level]}
      onDone={(stars) => {
        const next = advance(progress, level, true, stars);
        setProgress(next);
        api.saveData(next);
        return (progress.best[level] ?? 0) === 0;
      }}
    />
  );
}

function Board({ world, api, onFinish, cfg, onDone }: GameProps & { cfg: LevelCfg; onDone: (stars: number) => boolean }) {
  const ui = WORLD_UI[world];
  const [deck] = useState(() => makeDeck(cfg));
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [wiggle, setWiggle] = useState<number[]>([]);
  const lock = useRef(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const [grid, setGrid] = useState({ cols: 4, size: 80 });
  const gap = world === 'tiny' ? 18 : deck.length > 20 ? 8 : 10;

  useLayoutEffect(() => {
    const el = boardRef.current!;
    const ro = new ResizeObserver(() => setGrid(bestGrid(deck.length, el.clientWidth, el.clientHeight, gap)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [deck.length, gap]);

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
    if (ui.speakEveryFlip) api.speak(animalName(i));
    const next = [...open, i];
    setOpen(next);
    if (next.length < 2) return;

    const total = moves + 1;
    setMoves(total);
    const [a, b] = next;
    if (deck[a].animal === deck[b].animal) {
      const nm = new Set(matched).add(a).add(b);
      setMatched(nm);
      setOpen([]);
      setTimeout(() => {
        api.sfx('match');
        if (!ui.speakEveryFlip) api.speak(animalName(a));
      }, 250);
      if (nm.size === deck.length) {
        const p = cfg.pairs;
        const stars = ui.alwaysThreeStars ? 3 : total <= p * 1.5 ? 3 : total <= p * 2.2 ? 2 : 1;
        const firstClear = onDone(stars);
        setTimeout(() => onFinish({ won: true, stars, firstClear, score: Math.max(0, 1000 - total * 20 - seconds * 2) }), 900);
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
      }, cfg.flipBackMs);
    }
  }

  const fmtTime = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div className={`memory memory--${world}`}>
      {(ui.showMoves || ui.showTime) && (
        <div className="memory__hud">
          {ui.showMoves && <span>🔄 {api.t('moves')}: <b>{moves}</b></span>}
          {ui.showTime && <span>⏱️ {api.t('time')}: <b>{fmtTime}</b></span>}
        </div>
      )}
      <div className="memory__board" ref={boardRef}>
        <div className="memory__grid" style={{ gridTemplateColumns: `repeat(${grid.cols}, ${grid.size}px)`, gap }}>
          {deck.map((card, i) => {
            const isUp = open.includes(i) || matched.has(i);
            const name = ANIMALS[card.animal].name[api.lang];
            return (
              <button
                key={card.key}
                className={`mcard ${isUp ? 'is-up' : ''} ${matched.has(i) ? 'is-matched' : ''} ${wiggle.includes(i) ? 'is-wiggle' : ''}`}
                style={{ width: grid.size, height: grid.size * 1.15, fontSize: grid.size * 0.55 }}
                onClick={() => flip(i)}
                aria-label={isUp ? name : '?'}
              >
                <span className="mcard__inner">
                  <span className="mcard__back">⭐</span>
                  {card.isWord ? (
                    <span className="mcard__front mcard__front--word" style={{ fontSize: Math.min(grid.size * 0.26, (grid.size * 1.5) / name.length) }}>
                      {name.toUpperCase()}
                    </span>
                  ) : (
                    <span className="mcard__front">{ANIMALS[card.animal].emoji}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
