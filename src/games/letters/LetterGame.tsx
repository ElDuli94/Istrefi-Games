/**
 * Bokstavlek – dra (eller trykk) bokstaver til tavla, lag ord og få dem lest opp.
 *
 * Fri lek: lag hva du vil. Barn 5–7 får navnet sitt som hjelpelinje.
 * Ord-oppgaver: stav dyret på bildet. Hjelpen blir mindre jo eldre barnet er.
 */
import { Emo } from '../../components/Emo';
import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import type { GameApi, GameProps } from '../types';
import type { WorldId } from '../../data/worlds';
import { ALPHABETS, VOWELS, splitLetters } from '../../data/alphabets';
import { ANIMALS } from '../../data/animals';
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

let nextId = 1;
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

export default function LetterGame(props: GameProps) {
  const { world, api } = props;
  const [mode, setMode] = useState<'free' | 'tasks' | null>(world === 'tiny' ? 'free' : null);

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
  return mode === 'free' ? <FreePlay {...props} /> : <WordTasks {...props} world={world} />;
}

// ---------------------------------------------------------------------------
// Felles tavle med dra-og-slipp
// ---------------------------------------------------------------------------
function LetterBoard({ api, board, setBoard, tray, big, correct, guide, onRead, extraButtons }: {
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
      <div className={`letters__board ${board.length === 0 ? 'is-empty' : ''} ${drag?.moved ? 'is-target' : ''}`} ref={boardRef}>
        {board.length === 0 && dropAt < 0 && <span className="letters__placeholder">{api.t('dragLetters')}</span>}
        {board.map((t, i) => (
          <span key={t.id} style={{ display: 'contents' }}>
            {dropAt === i && <span className="tile tile--slot" />}
            <span
              data-tile
              className={`tile ${tileCls(t.ch)} ${drag?.moved && drag.fromBoard === i ? 'is-dragging' : ''} ${correct?.[i] ? 'is-correct' : ''}`}
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
  const [readWords, setReadWords] = useState<Set<string>>(new Set());
  const nameLetters = useMemo(
    () => (api.playerName && (world === 'tiny' || world === 'small') ? splitLetters(api.playerName.replace(/[^\p{L}]/gu, ''), api.lang) : null),
    [api.playerName, api.lang, world]
  );

  useEffect(() => {
    api.speak(nameLetters ? `${api.t('writeYourName')} ${api.playerName}` : api.t('dragLetters'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const word = board.map((t) => t.ch).join('');

  function read() {
    api.speak(word.toLowerCase());
    if (nameLetters && word === nameLetters.join('')) api.sfx('match');
    setReadWords((s) => new Set(s).add(word));
  }

  return (
    <LetterBoard
      api={api}
      board={board}
      setBoard={setBoard}
      tray={ALPHABETS[api.lang]}
      big={world === 'tiny'}
      guide={nameLetters ?? undefined}
      onRead={read}
      extraButtons={
        readWords.size >= 3 && (
          <button className="act act--done pop-in" onClick={() => onFinish({ won: true, stars: 3, coins: 5 })}>✔ {api.t('done')}</button>
        )
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Ord-oppgaver: stav dyret
// ---------------------------------------------------------------------------
function WordTasks({ world, api, onFinish }: GameProps & { world: WorldId }) {
  const cfg = TASKS[world === 'tiny' ? 'small' : world];
  const words = useMemo(() => {
    const pool = ANIMALS.filter((a) => splitLetters(a.name[api.lang], api.lang).length <= cfg.maxLen);
    return shuffle(pool).slice(0, cfg.words);
  }, [api.lang, cfg]);
  const [index, setIndex] = useState(0);
  const [board, setBoard] = useState<Tile[]>([]);
  const [hints, setHints] = useState(0);
  const [solved, setSolved] = useState(false);

  const current = words[index];
  const target = useMemo(() => splitLetters(current.name[api.lang], api.lang), [current, api.lang]);
  const tray = useMemo(() => {
    if (cfg.extra === 'all') return ALPHABETS[api.lang];
    const extras = shuffle(ALPHABETS[api.lang].filter((c) => !target.includes(c))).slice(0, cfg.extra);
    return shuffle([...new Set(target), ...extras]);
  }, [target, cfg, api.lang]);

  useEffect(() => {
    // 5–7 år hører ordet; eldre må finne ut hva dyret heter selv.
    api.speak(world === 'small' ? current.name[api.lang] : api.t('whatIsThis'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const correct = board.map((t, i) => t.ch === target[i]);

  useEffect(() => {
    if (solved || board.length !== target.length || !correct.every(Boolean)) return;
    setSolved(true);
    api.sfx('match');
    api.speak(current.name[api.lang]);
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
        <button className={`word-task__pic ${solved ? 'is-solved' : ''}`} onClick={() => api.speak(world === 'small' ? current.name[api.lang] : api.t('whatIsThis'))}>
          <Emo e={current.emoji} />
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
