import { Emo } from '../../components/Emo';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { GameProps } from '../types';
import type { WorldId } from '../../data/worlds';
import type { DictKey } from '../../i18n/no';
import { ANIMALS } from '../../data/animals';
import { VOCAB, wordForLetter } from '../../data/vocab';
import { ALPHABETS } from '../../data/alphabets';
import type { Lang } from '../../i18n';
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

/** Ting som kan være på kortene: emoji + navn på hvert språk */
interface Thing { e: string; name: Record<Lang, string> }
type Theme = 'animals' | 'food' | 'vehicles' | 'home' | 'nature' | 'letters';
const THEMES: { id: Theme; icon: string; minWorld: WorldId }[] = [
  { id: 'animals', icon: '🐶', minWorld: 'tiny' }, { id: 'food', icon: '🍎', minWorld: 'tiny' }, { id: 'vehicles', icon: '🚗', minWorld: 'tiny' },
  { id: 'home', icon: '🏠', minWorld: 'tiny' }, { id: 'nature', icon: '🌈', minWorld: 'tiny' }, { id: 'letters', icon: '🔤', minWorld: 'small' }
];
const WORLD_ORDER: WorldId[] = ['tiny', 'small', 'mid', 'big'];
function thingsFor(theme: Theme): Thing[] {
  if (theme === 'animals') return ANIMALS.map((a) => ({ e: a.emoji, name: a.name }));
  const cat = VOCAB.find((c) => c.id === theme);
  return (cat?.items ?? []).map((it) => ({ e: it.e, name: { no: it.no, sq: it.sq } }));
}

interface Card {
  key: number;
  pair: number;
  /** Hva kortet viser: bilde, ord (lesetrening) eller bokstav */
  face: { kind: 'emoji'; e: string } | { kind: 'word'; text: string } | { kind: 'letter'; l: string };
  /** Det som leses opp */
  say: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeDeck(cfg: LevelCfg, theme: Theme, lang: Lang, asIn: (l: string, w: string) => string): Card[] {
  if (theme === 'letters') {
    // Bokstav + bilde som starter på bokstaven («A» og 🐵 ape)
    const pairs = shuffle(ALPHABETS[lang].map((l) => ({ l, it: wordForLetter(l, lang) })).filter((x) => x.it)).slice(0, cfg.pairs);
    return shuffle(pairs.flatMap(({ l, it }, i) => [
      { key: i * 2, pair: i, face: { kind: 'letter' as const, l }, say: l.toLowerCase() },
      { key: i * 2 + 1, pair: i, face: { kind: 'emoji' as const, e: it!.e }, say: asIn(l, it![lang]) }
    ]));
  }
  const all = thingsFor(theme);
  const picked = shuffle(all).slice(0, Math.min(cfg.pairs, all.length));
  return shuffle(
    picked.flatMap((th, i) => [
      { key: i * 2, pair: i, face: { kind: 'emoji' as const, e: th.e }, say: th.name[lang] },
      { key: i * 2 + 1, pair: i, face: cfg.mode === 'word' ? { kind: 'word' as const, text: th.name[lang].toUpperCase() } : { kind: 'emoji' as const, e: th.e }, say: th.name[lang] }
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
  const saved = api.loadData<LevelProgress | { progress: LevelProgress; theme: Theme; two: boolean }>();
  const [progress, setProgress] = useState<LevelProgress>(() => (saved && 'progress' in saved ? saved.progress : (saved as LevelProgress) ?? emptyProgress()));
  const [theme, setTheme] = useState<Theme>(() => (saved && 'theme' in saved ? saved.theme : 'animals'));
  const [two, setTwo] = useState<boolean>(() => !!(saved && 'two' in saved && saved.two));
  const [level, setLevel] = useState<number | null>(null);
  const store = (p: LevelProgress, th: Theme, tw: boolean) => api.saveData({ progress: p, theme: th, two: tw });
  const themes = THEMES.filter((th) => WORLD_ORDER.indexOf(world) >= WORLD_ORDER.indexOf(th.minWorld));
  // ⬅️ går først tilbake til spillets egen meny
  useEffect(() => {
    api.setBack(level !== null ? () => setLevel(null) : null);
    return () => api.setBack(null);
  }, [level]); // eslint-disable-line react-hooks/exhaustive-deps

  if (level === null) {
    return (
      <div className="memory-menu">
        <div className="memory-themes">
          {themes.map((th) => (
            <button key={th.id} className={`memory-theme ${theme === th.id ? 'is-on' : ''}`} onClick={() => { api.sfx('tap'); api.speak(api.t(`memTheme_${th.id}` as DictKey)); setTheme(th.id); store(progress, th.id, two); }}>
              <Emo e={th.icon} /><small>{api.t(`memTheme_${th.id}` as DictKey)}</small>
            </button>
          ))}
          {world !== 'tiny' && (
            <button className={`memory-theme memory-theme--two ${two ? 'is-on' : ''}`} onClick={() => { api.sfx('tap'); setTwo(!two); store(progress, theme, !two); if (!two) api.speak(api.t('twoPlayers')); }}>
              <Emo e="👫" /><small>{api.t('twoPlayers')}</small>
            </button>
          )}
        </div>
        <LevelPicker
          api={api}
          progress={progress}
          onPick={setLevel}
          details={LEVELS[world].map((l) => `${l.pairs * 2} 🃏${l.mode === 'word' && theme !== 'letters' ? ' + 🔤' : ''}`)}
        />
      </div>
    );
  }

  return (
    <Board
      {...props}
      cfg={LEVELS[world][level]}
      theme={theme}
      two={two}
      onDone={(stars) => {
        const next = advance(progress, level, true, stars);
        setProgress(next);
        store(next, theme, two);
        return (progress.best[level] ?? 0) === 0;
      }}
    />
  );
}

function Board({ world, api, onFinish, cfg, theme, two, onDone }: GameProps & { cfg: LevelCfg; theme: Theme; two: boolean; onDone: (stars: number) => boolean }) {
  const ui = WORLD_UI[world];
  const [deck] = useState(() => makeDeck(cfg, theme, api.lang, (l, w) => api.t('asIn', { l, w })));
  const [turn, setTurn] = useState<0 | 1>(0);
  const [score, setScore] = useState<[number, number]>([0, 0]);
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

  const animalName = (i: number) => deck[i].say;

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
    if (deck[a].pair === deck[b].pair) {
      const sc: [number, number] = [...score] as [number, number];
      if (two) { sc[turn] += 1; setScore(sc); }
      const nm = new Set(matched).add(a).add(b);
      setMatched(nm);
      setOpen([]);
      setTimeout(() => {
        api.sfx('match');
        if (!ui.speakEveryFlip) api.speak(animalName(a));
      }, 250);
      if (nm.size === deck.length) {
        if (two) {
          // To spillere: den med flest par vinner
          const w = sc[0] === sc[1] ? -1 : sc[0] > sc[1] ? 0 : 1;
          setTimeout(() => api.speak(w < 0 ? api.t('draw') : api.t('playerWins', { p: api.t(w === 0 ? 'red' : 'blue') })), 700);
          onDone(3);
          setTimeout(() => onFinish({ won: true, stars: 3, coins: 6 }), 2200);
          return;
        }
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
        if (two) setTurn((t) => (t === 0 ? 1 : 0));
      }, cfg.flipBackMs);
    }
  }

  const fmtTime = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div className={`memory memory--${world}`}>
      {two && (
        <div className="memory__hud memory__hud--two">
          <span className={`mem-player mem-player--red ${turn === 0 ? 'is-turn' : ''}`}>🔴 {api.t('red')}: <b>{score[0]}</b></span>
          <span className={`mem-player mem-player--blue ${turn === 1 ? 'is-turn' : ''}`}>🔵 {api.t('blue')}: <b>{score[1]}</b></span>
        </div>
      )}
      {!two && (ui.showMoves || ui.showTime) && (
        <div className="memory__hud">
          {ui.showMoves && <span>🔄 {api.t('moves')}: <b>{moves}</b></span>}
          {ui.showTime && <span>⏱️ {api.t('time')}: <b>{fmtTime}</b></span>}
        </div>
      )}
      <div className="memory__board" ref={boardRef}>
        <div className="memory__grid" style={{ gridTemplateColumns: `repeat(${grid.cols}, ${grid.size}px)`, gap }}>
          {deck.map((card, i) => {
            const isUp = open.includes(i) || matched.has(i);
            const name = card.say;
            return (
              <button
                key={card.key}
                className={`mcard ${isUp ? 'is-up' : ''} ${matched.has(i) ? 'is-matched' : ''} ${wiggle.includes(i) ? 'is-wiggle' : ''}`}
                style={{ width: grid.size, height: grid.size * 1.15, fontSize: grid.size * 0.55 }}
                onClick={() => flip(i)}
                aria-label={isUp ? name : '?'}
              >
                <span className="mcard__inner">
                  <span className="mcard__back"><Emo e="⭐" /></span>
                  {card.face.kind === 'word' ? (
                    <span className="mcard__front mcard__front--word" style={{ fontSize: Math.min(grid.size * 0.26, (grid.size * 1.5) / card.face.text.length) }}>
                      {card.face.text}
                    </span>
                  ) : card.face.kind === 'letter' ? (
                    <span className="mcard__front mcard__front--letter">{card.face.l}</span>
                  ) : (
                    <span className="mcard__front"><Emo e={card.face.e} /></span>
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
