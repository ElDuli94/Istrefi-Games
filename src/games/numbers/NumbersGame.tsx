/**
 * Tallek – lær tall og telling.
 * 2–4 år: «Tell med meg» (trykk på hver ting, hør tallet) og «Hvor mange?» med to valg (1–5).
 * 5–7 år: 10 nivåer – telle til 5/10/20, finn tallet, hva mangler, flest, før/etter.
 * Tingene står i rader på fem (som en tierramme), så barna ser mengden, ikke bare teller.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameApi, GameProps } from '../types';
import { Emo } from '../../components/Emo';
import { LevelGrid, advanceGrid, emptyGridProgress, type GridProgress } from '../common/LevelGrid';
import './numbers.css';

const THINGS = ['🍎', '🐟', '⭐', '🎈', '🐞', '🦆', '🍓', '🚗', '🐣', '🌸', '🍪', '⚽'];
const R = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);
const LEVELS = 10;
const PER_LEVEL = 8;

type Q =
  | { kind: 'count'; n: number; thing: string; options: number[] }
  | { kind: 'find'; n: number; options: number[] }
  | { kind: 'missing'; seq: (number | null)[]; n: number; options: number[] }
  | { kind: 'more'; a: number; b: number; thing: string }
  | { kind: 'after' | 'before'; ref: number; n: number; options: number[] };

/** Svaralternativer rundt riktig tall (unike, innenfor lo–hi) */
function opts(n: number, count: number, lo: number, hi: number): number[] {
  const s = new Set([n]);
  let guard = 0;
  while (s.size < count && guard++ < 50) { const d = R(1, 3) * (Math.random() < 0.5 ? -1 : 1); const x = n + d; if (x >= lo && x <= hi) s.add(x); }
  while (s.size < count) s.add(R(lo, hi));
  return shuffle([...s]);
}

function makeQ(level: number): Q {
  const kinds: Q['kind'][][] = [
    ['count'], ['count', 'find'], ['count'], ['find'], ['missing'],
    ['more'], ['after', 'before'], ['count'], ['missing', 'more'], ['count', 'find', 'missing', 'more', 'after', 'before']
  ];
  const kind = pick(kinds[level]);
  const max = level <= 1 ? 5 : level <= 6 ? 10 : 20;
  const lo = level === 7 ? 11 : 1;
  switch (kind) {
    case 'count': { const n = R(lo, max); return { kind, n, thing: pick(THINGS), options: opts(n, 3, Math.max(1, lo - 2), max) }; }
    case 'find': { const n = R(level === 3 ? 0 : 1, max); return { kind, n, options: opts(n, 4, 0, max) }; }
    case 'missing': {
      const start = R(1, max - 3), hole = R(1, 3);
      const seq: (number | null)[] = [start, start + 1, start + 2, start + 3];
      const n = seq[hole] as number;
      seq[hole] = null;
      return { kind, seq, n, options: opts(n, 3, 1, max) };
    }
    case 'more': { let a = R(1, Math.min(max, 10)), b = R(1, Math.min(max, 10)); while (a === b) b = R(1, Math.min(max, 10)); return { kind, a, b, thing: pick(THINGS) }; }
    case 'after': { const ref = R(1, max - 1); return { kind, ref, n: ref + 1, options: opts(ref + 1, 3, 1, max) }; }
    case 'before': { const ref = R(2, max); return { kind, ref, n: ref - 1, options: opts(ref - 1, 3, 1, max) }; }
  }
}

export default function NumbersGame(props: GameProps) {
  const { api, world } = props;
  const [progress, setProgress] = useState<GridProgress>(() => api.loadData<GridProgress>() ?? emptyGridProgress());
  const [level, setLevel] = useState<number | null>(null);
  useEffect(() => {
    if (world === 'tiny') return;
    api.setBack(level !== null ? () => setLevel(null) : null);
    return () => api.setBack(null);
  }, [level]); // eslint-disable-line react-hooks/exhaustive-deps

  if (world === 'tiny') return <Toddler api={api} onDone={(stars) => props.onFinish({ won: true, stars })} />;
  if (level === null) return <LevelGrid api={api} count={LEVELS} progress={progress} onPick={setLevel} />;
  return (
    <LevelPlay
      key={level}
      api={api}
      level={level}
      onDone={(stars) => {
        const { next, firstClear } = advanceGrid(progress, level, true, stars, LEVELS);
        setProgress(next);
        api.saveData(next);
        props.onFinish({ won: true, stars, firstClear });
      }}
    />
  );
}

// ---------- Ting i rader på fem. Trykk for å telle høyt. ----------
function Things({ n, thing, api, onCounted, big }: { n: number; thing: string; api: GameApi; onCounted?: () => void; big?: boolean }) {
  const [tapped, setTapped] = useState<number[]>([]);
  const rows = Math.ceil(n / 5);
  return (
    <div className={`num-things ${big ? 'is-big' : ''} ${n > 10 ? 'is-many' : ''}`} style={{ ['--rows' as string]: rows }}>
      {Array.from({ length: n }, (_, i) => {
        const k = tapped.indexOf(i);
        return (
          <button
            key={i}
            className={`num-thing pop-in ${k >= 0 ? 'is-tapped' : ''}`}
            style={{ animationDelay: `${i * 0.04}s` }}
            onClick={() => {
              if (k >= 0) return;
              const c = tapped.length + 1;
              api.sfx('tap');
              api.speak(String(c));
              setTapped([...tapped, i]);
              if (c === n) onCounted?.();
            }}
          >
            <Emo e={thing} />
            {k >= 0 && <span className="num-thing__n">{k + 1}</span>}
          </button>
        );
      })}
    </div>
  );
}

function Choices({ options, answer, onRight, api, wrongHint = 2 }: { options: number[]; answer: number; onRight: () => void; api: GameApi; wrongHint?: number }) {
  const [wrong, setWrong] = useState<number[]>([]);
  const [ok, setOk] = useState(false);
  return (
    <div className="num-choices">
      {options.map((o) => (
        <button
          key={o}
          className={`num-choice pop-in ${wrong.includes(o) ? 'is-wrong' : ''} ${ok && o === answer ? 'is-right' : ''} ${!ok && wrong.length >= wrongHint && o === answer ? 'is-hint' : ''}`}
          disabled={wrong.includes(o) || ok}
          onClick={() => {
            if (o === answer) { setOk(true); api.sfx('match'); api.sayBoth(String(o), String(o)); onRight(); }
            else { api.sfx('nope'); api.speak(String(o)); setWrong([...wrong, o]); }
          }}
        >{o}</button>
      ))}
    </div>
  );
}

// ---------- 2–4 år ----------
function Toddler({ api, onDone }: { api: GameApi; onDone: (stars: number) => void }) {
  const ROUNDS = 6;
  const [round, setRound] = useState(0);
  const q = useMemo(() => ({ n: R(1, round < 2 ? 3 : 5), thing: pick(THINGS) }), [round]);
  const counting = round % 2 === 0; // annenhver: tell selv / velg tallet
  const [counted, setCounted] = useState(false);
  const options = useMemo(() => shuffle([q.n, q.n === 1 ? 2 : q.n === 5 ? 4 : q.n + (Math.random() < 0.5 ? 1 : -1)]), [q]);

  useEffect(() => {
    setCounted(false);
    api.speak(counting ? api.t('countWithMe') : api.t('howMany'));
  }, [round]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = () => setTimeout(() => (round + 1 >= ROUNDS ? onDone(3) : setRound(round + 1)), 1600);

  return (
    <div className="numbers">
      <div className="naming-progress">{Array.from({ length: ROUNDS }, (_, k) => <i key={k} className={k < round ? 'is-done' : ''} />)}</div>
      <button className="num-ask" onClick={() => api.speak(counting ? api.t('countWithMe') : api.t('howMany'))}>
        {counting ? api.t('countWithMe') : api.t('howMany')} <Emo e="🔊" />
      </button>
      <Things key={`t${round}`} n={q.n} thing={q.thing} api={api} big onCounted={counting ? () => {
        setCounted(true);
        setTimeout(() => { api.sfx('match'); api.sayBoth(api.t('itIs', { n: q.n }), String(q.n)); }, 500);
        next();
      } : undefined} />
      {counting
        ? counted && <div className="num-big pop-in">{q.n}</div>
        : <Choices key={`c${round}`} options={options} answer={q.n} api={api} wrongHint={1} onRight={next} />}
    </div>
  );
}

// ---------- 5–7 år ----------
function LevelPlay({ api, level, onDone }: { api: GameApi; level: number; onDone: (stars: number) => void }) {
  const [i, setI] = useState(0);
  const [q, setQ] = useState<Q>(() => makeQ(level));
  const mistakes = useRef(0);
  const prompt = (qq: Q) =>
    qq.kind === 'count' ? api.t('howMany')
    : qq.kind === 'find' ? api.t('findNumber', { n: qq.n })
    : qq.kind === 'missing' ? api.t('whatsMissing')
    : qq.kind === 'more' ? api.t('whichMore')
    : qq.kind === 'after' ? api.t('whatAfter', { n: qq.ref }) : api.t('whatBefore', { n: qq.ref });
  useEffect(() => { api.speak(prompt(q)); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const right = () => setTimeout(() => {
    if (i + 1 >= PER_LEVEL) { const m = mistakes.current; onDone(m <= 1 ? 3 : m <= 4 ? 2 : 1); return; }
    setI(i + 1);
    setQ(makeQ(level));
  }, 1300);
  // Tell feil: Choices spiller 'nope' ved feil svar
  const wrapApi = useMemo<GameApi>(() => ({ ...api, sfx: (s) => { if (s === 'nope') mistakes.current++; api.sfx(s); } }), [api]);

  return (
    <div className="numbers">
      <div className="naming-progress">{Array.from({ length: PER_LEVEL }, (_, k) => <i key={k} className={k < i ? 'is-done' : ''} />)}</div>
      <button className="num-ask" onClick={() => api.speak(prompt(q))}>{prompt(q)} <Emo e="🔊" /></button>
      {q.kind === 'count' && (
        <>
          <Things key={`t${i}`} n={q.n} thing={q.thing} api={api} />
          <ChoicesW api={wrapApi} options={q.options} answer={q.n} onRight={right} k={i} />
        </>
      )}
      {q.kind === 'find' && <ChoicesW api={wrapApi} options={q.options} answer={q.n} onRight={right} k={i} />}
      {q.kind === 'missing' && (
        <>
          <div className="num-seq">{q.seq.map((x, k) => <span key={k} className={x === null ? 'is-hole' : ''}>{x ?? '?'}</span>)}</div>
          <ChoicesW api={wrapApi} options={q.options} answer={q.n} onRight={right} k={i} />
        </>
      )}
      {(q.kind === 'after' || q.kind === 'before') && (
        <>
          <div className="num-seq">
            {q.kind === 'after' ? <><span>{q.ref}</span><span className="is-hole">?</span></> : <><span className="is-hole">?</span><span>{q.ref}</span></>}
          </div>
          <ChoicesW api={wrapApi} options={q.options} answer={q.n} onRight={right} k={i} />
        </>
      )}
      {q.kind === 'more' && <More key={`m${i}`} q={q} api={wrapApi} onRight={right} />}
    </div>
  );
}

function ChoicesW({ api, options, answer, onRight, k }: { api: GameApi; options: number[]; answer: number; onRight: () => void; k: number }) {
  return <Choices key={k} options={options} answer={answer} api={api} onRight={onRight} />;
}

function More({ q, api, onRight }: { q: Extract<Q, { kind: 'more' }>; api: GameApi; onRight: () => void }) {
  const [wrong, setWrong] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const side = (n: number, id: string) => (
    <button
      className={`num-group ${wrong === id ? 'is-wrong' : ''} ${ok && n > Math.min(q.a, q.b) ? 'is-right' : ''}`}
      disabled={ok || wrong === id}
      onClick={() => {
        const isMore = n === Math.max(q.a, q.b);
        if (isMore) { setOk(true); api.sfx('match'); api.speak(api.t('itIs', { n })); onRight(); }
        else { api.sfx('nope'); setWrong(id); }
      }}
    >
      <div className="num-group__grid">{Array.from({ length: n }, (_, i) => <Emo key={i} e={q.thing} />)}</div>
      {ok && <b className="num-group__n">{n}</b>}
    </button>
  );
  return <div className="num-more">{side(q.a, 'a')}{side(q.b, 'b')}</div>;
}
