/**
 * Bokstavlek – dra (eller trykk) bokstaver til tavla, lag ord og få dem lest opp.
 *
 * Fri lek: «Skriv et ord!» – lag hva du vil. «Les opp» lyser opp og sier hver bokstav, og så hele ordet.
 * Kjenner appen ordet (katt, sol, navnet ditt …), dukker bildet opp og ordet samles i en liten ordsamling.
 * Ord-oppgaver: velg tema (dyr, mat, kjøretøy …) og stav ordet på bildet. Hjelpen blir mindre jo eldre barnet er.
 */
import { Emo } from '../../components/Emo';
import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import type { GameApi, GameProps } from '../types';
import type { WorldId } from '../../data/worlds';
import { ALPHABETS, VOWELS, splitLetters } from '../../data/alphabets';
import { VOCAB, type VocabCat } from '../../data/vocab';
import './letters.css';

interface Tile {
  id: number;
  ch: string;
}

interface Drag {
  ch: string;
  fromBoard: number | null; // indeks på tavla, eller null hvis fra bokstavbrettet
  x: number;
  y: number;
  startX: number;
  startY: number;
  moved: boolean;
}

// Oppgaveoppsett per aldersverden
const TASKS: Record<Exclude<WorldId, 'tiny'>, { words: number; maxLen: number; guide: boolean; extra: number | 'all'; colorCorrect: boolean }> = {
  small: { words: 3, maxLen: 4, guide: true, extra: 0, colorCorrect: true },
  mid: { words: 4, maxLen: 6, guide: false, extra: 3, colorCorrect: true },
  big: { words: 5, maxLen: 20, guide: false, extra: 'all', colorCorrect: false }
};

// Temaer for ord-oppgaver (fargene passer dårlig å stave fra bilde)
const TOPICS = VOCAB.filter((c) => c.id !== 'colors');
let nextId = 1;
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

export default function LetterGame(props: GameProps) {
  const { world, api } = props;
  const [mode, setMode] = useState<'free' | 'tasks' | null>(world === 'tiny' ? 'free' : null);
  const [cat, setCat] = useState<VocabCat | null>(null);
  // ⬅️ går først tilbake til spillets egen meny
  useEffect(() => {
    api.setBack(cat ? () => setCat(null) : mode !== null && world !== 'tiny' ? () => setMode(null) : null);
    return () => api.setBack(null);
  }, [mode, cat]); // eslint-disable-line react-hooks/exhaustive-deps

  if (mode === null) {
    return (
      <div className="letters-menu">
        <button className="letters-mode pop-in" onClick={() => { api.sfx('pop'); api.speak(api.t('freePlay')); setMode('free'); }}>
          <span>🎨</span>{api.t('freePlay')}
        </button>
        <button className="letters-mode pop-in" style={{ animationDelay: '.08s' }} onClick={() => { api.sfx('pop'); api.speak(api.t('wordTasks')); setMode('tasks'); }}>
          <span>🐾</span>{api.t('wordTasks')}
        </button>
      </div>
    );
  }
  if (mode === 'free') return <FreePlay {...props} />;
  if (!cat) {
    return (
      <div className="letters-menu letters-menu--cats">
        {TOPICS.map((c, k) => (
          <button key={c.id} className="letters-mode letters-mode--cat pop-in" style={{ animationDelay: `${k * 0.05}s` }} onClick={() => { api.sfx('pop'); api.speak(api.t(c.nameKey)); setCat(c); }}>
            <span><Emo e={c.icon} /></span>{api.t(c.nameKey)}
          </button>
        ))}
      </div>
    );
  }
  return <WordTasks key={cat.id} {...props} world={world} cat={cat} />;
}

// ---------------------------------------------------------------------------
// Felles tavle med dra-og-slipp
// ---------------------------------------------------------------------------
function LetterBoard({ api, board, setBoard, tray, big, correct, guide, onRead, extraButtons, lit = -1, allLit = false, top }: {
  api: GameApi;
  board: Tile[];
  setBoard: (b: Tile[]) => void;
  tray: string[];
  big: boolean;
  /** Markér riktige bokstaver grønt (indekser) */
  correct?: boolean[];
  guide?: string[];
  onRead: () => void;
  extraButtons?: ReactNode;
  /** Bokstav som lyser mens den leses opp */
  lit?: number;
  allLit?: boolean;
  top?: ReactNode;
}) {
  const vowels = VOWELS[api.lang];
  const boardRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const boardRefState = useRef(board);
  boardRefState.current = board;

  function insertIndex(x: number): number {
    const el = boardRef.current;
    if (!el) return boardRefState.current.length;
    const tiles = Array.from(el.querySelectorAll<HTMLElement>('[data-tile]')).filter((t) => !t.classList.contains('is-dragging'));
    for (let i = 0; i < tiles.length; i++) {
      const r = tiles[i].getBoundingClientRect();
      if (x < r.left + r.width / 2) return i;
    }
    return tiles.length;
  }

  function overBoard(x: number, y: number) {
    const r = boardRef.current?.getBoundingClientRect();
    return !!r && x >= r.left - 20 && x <= r.right + 20 && y >= r.top - 30 && y <= r.bottom + 30;
  }

  function start(e: RPointerEvent, ch: string, fromBoard: number | null) {
    e.preventDefault();
    const d: Drag = { ch, fromBoard, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, moved: false };
    dragRef.current = d;
    setDrag(d);

    const move = (ev: PointerEvent) => {
      const cur = dragRef.current!;
      const moved = cur.moved || Math.hypot(ev.clientX - cur.startX, ev.clientY - cur.startY) > 10;
      if (moved && !cur.moved) api.sfx('tap');
      dragRef.current = { ...cur, x: ev.clientX, y: ev.clientY, moved };
      setDrag(dragRef.current);
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      const cur = dragRef.current!;
      dragRef.current = null;
      setDrag(null);
      const b = boardRefState.current;

      if (!cur.moved) {
        // Trykk: fra brettet = legg til bakerst. På tavla = si bokstaven.
        api.speak(cur.ch.toLowerCase());
        if (cur.fromBoard === null) {
          api.sfx('pop');
          setBoard([...b, { id: nextId++, ch: cur.ch }]);
        }
        return;
      }
      const without = cur.fromBoard === null ? b : b.filter((_, i) => i !== cur.fromBoard);
      if (overBoard(ev.clientX, ev.clientY)) {
        const idx = insertIndex(ev.clientX);
        const tile = cur.fromBoard === null ? { id: nextId++, ch: cur.ch } : b[cur.fromBoard];
        const next = [...without];
        next.splice(idx, 0, tile);
        api.sfx('pop');
        if (cur.fromBoard === null) api.speak(cur.ch.toLowerCase());
        setBoard(next);
      } else if (cur.fromBoard !== null) {
        api.sfx('nope'); // dratt av tavla = fjernet
        setBoard(without);
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  const dropAt = drag?.moved && overBoard(drag.x, drag.y) ? insertIndex(drag.x) : -1;
  const tileCls = (ch: string) => (vowels.has(ch) ? 'is-vowel' : 'is-consonant');

  return (
    <div className={`letters ${big ? 'letters--big' : ''}`}>
      {guide && (
        <div className="letters__guide" aria-hidden>
          {guide.map((ch, i) => <span key={i} className={board[i]?.ch === ch ? 'is-done' : ''}>{ch}</span>)}
        </div>
      )}
      {top}
      <div className={`letters__board ${board.length === 0 ? 'is-empty' : ''} ${drag?.moved ? 'is-target' : ''}`} ref={boardRef}>
        {board.length === 0 && dropAt < 0 && <span className="letters__placeholder">{api.t('dragLetters')}</span>}
        {board.map((t, i) => (
          <span key={t.id} style={{ display: 'contents' }}>
            {dropAt === i && <span className="tile tile--slot" />}
            <span
              data-tile
              className={`tile ${tileCls(t.ch)} ${drag?.moved && drag.fromBoard === i ? 'is-dragging' : ''} ${correct?.[i] ? 'is-correct' : ''} ${lit === i ? 'is-lit' : ''} ${allLit ? 'is-alllit' : ''}`}
              onPointerDown={(e) => start(e, t.ch, i)}
            >
              {t.ch}
            </span>
          </span>
        ))}
        {dropAt === board.length && <span className="tile tile--slot" />}
      </div>

      <div className="letters__actions">
        <button className="act act--read" onClick={onRead} disabled={!board.length} aria-label={api.t('readAloud')}>🔊 {api.t('readAloud')}</button>
        <button className="act" onClick={() => { api.sfx('tap'); setBoard(board.slice(0, -1)); }} disabled={!board.length} aria-label={api.t('removeLast')}>⌫</button>
        <button className="act" onClick={() => { api.sfx('nope'); setBoard([]); }} disabled={!board.length} aria-label={api.t('clearAll')}>🗑️</button>
        {extraButtons}
      </div>

      <div className="letters__tray">
        {tray.map((ch, i) => (
          <span key={`${ch}-${i}`} className={`tile ${tileCls(ch)}`} onPointerDown={(e) => start(e, ch, null)}>
            {ch}
          </span>
        ))}
      </div>

      {drag?.moved && (
        <span className={`tile tile--ghost ${tileCls(drag.ch)}`} style={{ left: drag.x, top: drag.y }}>{drag.ch}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fri lek
// ---------------------------------------------------------------------------
function FreePlay({ world, api, onFinish }: GameProps) {
  const [board, setBoard] = useState<Tile[]>([]);
  const [lit, setLit] = useState(-1);
  const [allLit, setAllLit] = useState(false);
  const [result, setResult] = useState<{ word: string; e: string | null; key: number } | null>(null);
  const [found, setFound] = useState<{ word: string; e: string }[]>([]);
  const [reads, setReads] = useState(0);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Ord appen kjenner (med bilde): alle ord i ordbanken + navnet til barnet
  const known = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of VOCAB) for (const it of c.items) if (!/\s/.test(it[api.lang])) m.set(it[api.lang].toUpperCase(), it.e);
    if (api.playerName) m.set(api.playerName.replace(/[^\p{L}]/gu, '').toUpperCase(), '🙂');
    return m;
  }, [api.lang, api.playerName]);

  useEffect(() => {
    api.speak(api.t('writeAWord'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const word = board.map((t) => t.ch).join('');

  function read() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setResult(null);
    setAllLit(false);
    const step = 600;
    // 1) Lys opp og si hver bokstav …
    board.forEach((t, i) => timers.current.push(window.setTimeout(() => { setLit(i); api.speak(t.ch.toLowerCase()); }, i * step)));
    // 2) … så hele ordet. Kjent ord = bilde + feiring.
    timers.current.push(window.setTimeout(() => {
      setLit(-1);
      setAllLit(true);
      const e = known.get(word) ?? null;
      setResult({ word, e, key: Date.now() });
      api.speak(word.toLowerCase());
      if (e) {
        api.sfx('match');
        if (!found.some((f) => f.word === word)) setFound((f) => [...f, { word, e }]);
      } else api.sfx('pop');
      setReads((r) => r + 1);
      timers.current.push(window.setTimeout(() => setAllLit(false), 1200));
    }, board.length * step + 200));
  }

  return (
    <LetterBoard
      api={api}
      board={board}
      setBoard={(b) => { setBoard(b); setResult(null); }}
      tray={ALPHABETS[api.lang]}
      big={world === 'tiny'}
      lit={lit}
      allLit={allLit}
      onRead={read}
      top={
        <div className="letters__top">
          {result ? (
            <button className={`letters__result pop-in ${result.e ? 'is-known' : ''}`} key={result.key} onClick={() => api.speak(result.word.toLowerCase())}>
              {result.e && <span className="letters__result-pic"><Emo e={result.e} /></span>}
              <b>{result.word.toLowerCase()}</b> <Emo e="🔊" />
            </button>
          ) : (
            <button className="letters__prompt" onClick={() => api.speak(api.t('writeAWord'))}>✏️ {api.t('writeAWord')} <Emo e="🔊" /></button>
          )}
          {found.length > 0 && (
            <div className="letters__found" aria-label={api.t('wordsFound')}>
              {found.map((f) => <button key={f.word} onClick={() => api.speak(f.word.toLowerCase())}><Emo e={f.e} /></button>)}
            </div>
          )}
        </div>
      }
      extraButtons={
        reads >= 3 && (
          <button className="act act--done pop-in" onClick={() => onFinish({ won: true, stars: 3, coins: 5 + Math.min(10, found.length * 2) })}>✔ {api.t('done')}</button>
        )
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Ord-oppgaver: stav dyret
// ---------------------------------------------------------------------------
function WordTasks({ world, api, onFinish, cat }: GameProps & { world: WorldId; cat: VocabCat }) {
  const cfg = TASKS[world === 'tiny' ? 'small' : world];
  const words = useMemo(() => {
    const ok = (w: string) => !/[\s-]/.test(w) && splitLetters(w, api.lang).length <= cfg.maxLen;
    let pool = cat.items.filter((a) => ok(a[api.lang]));
    // Finnes det for få korte ord i temaet, fyll på med dyr
    if (pool.length < cfg.words) pool = [...pool, ...VOCAB[0].items.filter((a) => ok(a[api.lang]))];
    return shuffle(pool).slice(0, cfg.words);
  }, [api.lang, cfg, cat]);
  const [index, setIndex] = useState(0);
  const [board, setBoard] = useState<Tile[]>([]);
  const [hints, setHints] = useState(0);
  const [solved, setSolved] = useState(false);

  const current = words[index];
  const target = useMemo(() => splitLetters(current[api.lang], api.lang), [current, api.lang]);
  const tray = useMemo(() => {
    if (cfg.extra === 'all') return ALPHABETS[api.lang];
    const extras = shuffle(ALPHABETS[api.lang].filter((c) => !target.includes(c))).slice(0, cfg.extra);
    return shuffle([...new Set(target), ...extras]);
  }, [target, cfg, api.lang]);

  useEffect(() => {
    // 5–7 år hører ordet; eldre må finne ut hva dyret heter selv.
    api.speak(world === 'small' ? current[api.lang] : api.t('whatIsThis'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const correct = board.map((t, i) => t.ch === target[i]);

  useEffect(() => {
    if (solved || board.length !== target.length || !correct.every(Boolean)) return;
    setSolved(true);
    api.sfx('match');
    api.speak(current[api.lang]);
    setTimeout(() => {
      if (index + 1 < words.length) {
        setIndex(index + 1);
        setBoard([]);
        setSolved(false);
      } else {
        const stars = hints === 0 ? 3 : hints <= 2 ? 2 : 1;
        onFinish({ won: true, stars });
      }
    }, 1800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  function hint() {
    api.sfx('tap');
    setHints((h) => h + 1);
    // Behold riktig begynnelse, legg til neste riktige bokstav.
    let ok = 0;
    while (ok < board.length && board[ok].ch === target[ok]) ok++;
    const fixed = board.slice(0, ok);
    if (ok < target.length) fixed.push({ id: nextId++, ch: target[ok] });
    api.speak(target[ok]?.toLowerCase() ?? '');
    setBoard(fixed);
  }

  return (
    <div className="word-task">
      <div className="word-task__top">
        <span className="word-task__count">{api.t('wordOf', { n: index + 1, total: words.length })}</span>
        <button className={`word-task__pic ${solved ? 'is-solved' : ''}`} onClick={() => api.speak(world === 'small' ? current[api.lang] : api.t('whatIsThis'))}>
          <Emo e={current.e} />
        </button>
        {!cfg.guide && (
          <div className="word-task__slots" aria-hidden>
            {target.map((_, i) => <span key={i} className={board[i] ? 'is-filled' : ''} />)}
          </div>
        )}
      </div>
      <LetterBoard
        key={index}
        api={api}
        board={board}
        setBoard={(b) => !solved && setBoard(b)}
        tray={tray}
        big={false}
        guide={cfg.guide ? target : undefined}
        correct={cfg.colorCorrect ? correct : undefined}
        onRead={() => api.speak(board.map((t) => t.ch).join('').toLowerCase())}
        extraButtons={<button className="act" onClick={hint} disabled={solved} aria-label={api.t('hint')}>💡</button>}
      />
    </div>
  );
}
