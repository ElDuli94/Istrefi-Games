/**
 * Gangetabellen – lær 1- til 10-gangen.
 * - Velg en tabell: 10 spørsmål (N × 1 … N × 10 i blandet rekkefølge).
 *   💡 viser regnestykket som rader med prikker, 📖 viser hele tabellen.
 * - Gangemester: 20 blandede spørsmål fra tabellene du har øvd på, med 🔥 rekke.
 * - Oversikten (10 × 10) viser hvilke gangestykker barnet kan – grønt = kan det!
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameApi, GameProps } from '../types';
import { Emo } from '../../components/Emo';
import './times.css';

interface Saved { stars: Record<number, number>; facts: Record<string, number> }
const MIX = 0; // «tabell 0» = Gangemester
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);
const factKey = (a: number, b: number) => `${Math.min(a, b)}x${Math.max(a, b)}`;
const TABLE_COLORS = ['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#2ec4b6', '#1982c4', '#4267ac', '#6a4c93', '#ff70a6', '#e76f51'];

function options(a: number, b: number): number[] {
  const n = a * b;
  const s = new Set([n]);
  const cands = [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, n + 1, n - 1, n + 10, n - 10, n + 2].filter((x) => x > 0 && x !== n);
  for (const c of shuffle(cands)) { if (s.size >= 4) break; s.add(c); }
  return shuffle([...s]);
}

export default function TimesGame(props: GameProps) {
  const { api } = props;
  const [saved, setSaved] = useState<Saved>(() => ({ stars: {}, facts: {}, ...api.loadData<Saved>() }));
  const [table, setTable] = useState<number | null>(null);
  const [overview, setOverview] = useState(false);
  useEffect(() => {
    api.setBack(table !== null || overview ? () => { setTable(null); setOverview(false); } : null);
    return () => api.setBack(null);
  }, [table, overview]); // eslint-disable-line react-hooks/exhaustive-deps

  const known = (a: number, b: number) => (saved.facts[factKey(a, b)] ?? 0) >= 2;
  const learning = (a: number, b: number) => (saved.facts[factKey(a, b)] ?? 0) === 1;

  if (overview) return <Overview api={api} known={known} learning={learning} />;
  if (table === null) {
    const practiced = Object.keys(saved.stars).length;
    return (
      <div className="times-menu">
        <h2 className="level-picker__title">{api.t('chooseTable')}</h2>
        <div className="times-grid">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n, i) => (
            <button key={n} className="times-card pop-in" style={{ animationDelay: `${i * 0.03}s`, ['--c' as string]: TABLE_COLORS[i] }}
              onClick={() => { api.sfx('pop'); api.speak(api.t('timesTable', { n })); setTable(n); }}>
              <b>{n}</b>
              <small>{api.t('timesTableShort')}</small>
              <span className="times-card__stars">{[0, 1, 2].map((k) => <i key={k} className={k < (saved.stars[n] ?? 0) ? 'on' : ''}>★</i>)}</span>
            </button>
          ))}
        </div>
        <div className="times-menu__row">
          <button className="times-mode" onClick={() => { api.sfx('pop'); api.speak(api.t('timesMaster')); setTable(MIX); }} disabled={practiced < 1}>
            🏆 {api.t('timesMaster')} {saved.stars[MIX] ? `· ${'★'.repeat(saved.stars[MIX])}` : ''}
          </button>
          <button className="times-mode" onClick={() => { api.sfx('pop'); setOverview(true); }}>🗺️ {api.t('timesOverview')}</button>
        </div>
        {practiced < 1 && <p className="times-hint">{api.t('timesMasterHint')}</p>}
      </div>
    );
  }
  return (
    <Quiz
      key={table}
      api={api}
      table={table}
      pool={Object.keys(saved.stars).map(Number).filter((n) => n > 0)}
      onDone={(stars, results) => {
        const facts = { ...saved.facts };
        results.forEach(([a, b, firstTry]) => {
          const k = factKey(a, b);
          facts[k] = firstTry ? (facts[k] ?? 0) + 1 : Math.max(0, (facts[k] ?? 0) - 1);
        });
        const first = !saved.stars[table];
        const next: Saved = { stars: { ...saved.stars, [table]: Math.max(saved.stars[table] ?? 0, stars) }, facts };
        setSaved(next);
        api.saveData(next);
        setTimeout(() => props.onFinish({ won: true, stars, firstClear: first, coins: table === MIX ? 10 + stars * 5 : undefined }), 900);
      }}
    />
  );
}

/** Regnestykket som rader med prikker: a rader med b prikker */
function Dots({ a, b }: { a: number; b: number }) {
  return (
    <div className="times-dots" style={{ ['--cols' as string]: b }}>
      {Array.from({ length: a }, (_, r) => (
        <div key={r} className="times-dots__row" style={{ animationDelay: `${r * 0.08}s` }}>
          {Array.from({ length: b }, (_, c) => <i key={c} style={{ background: TABLE_COLORS[r % 10] }} />)}
          <span className="times-dots__sum">{(r + 1) * b}</span>
        </div>
      ))}
    </div>
  );
}

function Quiz({ api, table, pool, onDone }: {
  api: GameApi; table: number; pool: number[];
  onDone: (stars: number, results: [number, number, boolean][]) => void;
}) {
  const mix = table === MIX;
  const questions = useMemo<[number, number][]>(() => {
    if (!mix) return shuffle(Array.from({ length: 10 }, (_, i) => [table, i + 1] as [number, number]));
    const tables = pool.length ? pool : [2, 5, 10];
    return Array.from({ length: 20 }, () => {
      const a = tables[Math.floor(Math.random() * tables.length)], b = 1 + Math.floor(Math.random() * 10);
      return (Math.random() < 0.5 ? [a, b] : [b, a]) as [number, number];
    });
  }, [table]); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);
  const [ok, setOk] = useState(false);
  const [showDots, setShowDots] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [streak, setStreak] = useState(0);
  const mistakes = useRef(0);
  const results = useRef<[number, number, boolean][]>([]);
  const [a, b] = questions[i];
  const opts = useMemo(() => options(a, b), [i]); // eslint-disable-line react-hooks/exhaustive-deps
  const ask = () => api.speak(api.t('timesQ', { a, b }));
  useEffect(() => { setWrong([]); setOk(false); setShowDots(!mix && table <= 2 && i < 2); ask(); }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  function pick(o: number) {
    if (ok) return;
    if (o === a * b) {
      setOk(true);
      const first = wrong.length === 0;
      results.current.push([a, b, first]);
      api.sfx('match');
      api.speak(api.t('timesA', { a, b, n: o }));
      const st = first ? streak + 1 : 0;
      setStreak(st);
      if (st > 0 && st % 5 === 0) api.sfx('sticker');
      setTimeout(() => {
        if (i + 1 >= questions.length) {
          const m = mistakes.current;
          onDone(m === 0 ? 3 : m <= (mix ? 4 : 2) ? 2 : 1, results.current);
        } else setI(i + 1);
      }, 1500);
    } else {
      api.sfx('nope');
      mistakes.current++;
      setStreak(0);
      setWrong((w) => [...w, o]);
      setShowDots(true); // feil svar: vis prikkene som hjelp
    }
  }

  return (
    <div className="times">
      <div className="times__top">
        <div className="naming-progress">{questions.map((_, k) => <i key={k} className={k < i ? 'is-done' : ''} />)}</div>
        {streak >= 3 && <span className="hud-chip pop-in" key={streak}>🔥 {streak}</span>}
      </div>
      <button className={`times__q ${ok ? 'is-ok' : ''}`} onClick={ask}>
        <span>{a}</span><b>×</b><span>{b}</span><b>=</b><span className="times__ans">{ok ? a * b : '?'}</span>
      </button>
      <div className="times__help">
        {showDots && a <= 10 && b <= 10 ? <Dots a={a} b={b} /> : (
          <button className="times__hintbtn" onClick={() => { api.sfx('tap'); setShowDots(true); }}>💡 {api.t('timesShowDots')}</button>
        )}
      </div>
      <div className="times__opts">
        {opts.map((o) => (
          <button key={`${i}-${o}`} className={`times__opt pop-in ${wrong.includes(o) ? 'is-wrong' : ''} ${ok && o === a * b ? 'is-right' : ''}`} disabled={wrong.includes(o) || ok} onClick={() => pick(o)}>{o}</button>
        ))}
      </div>
      {!mix && <button className="times__tablebtn" onClick={() => { api.sfx('tap'); setShowTable(!showTable); }}>📖 {api.t('timesSeeTable')}</button>}
      {showTable && (
        <div className="times-sheet pop-in" onClick={() => setShowTable(false)}>
          <div className="times-sheet__card">
            {Array.from({ length: 10 }, (_, k) => (
              <button key={k} onClick={(e) => { e.stopPropagation(); api.speak(api.t('timesA', { a: table, b: k + 1, n: table * (k + 1) })); }}>
                {table} × {k + 1} = <b>{table * (k + 1)}</b>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Overview({ api, known, learning }: { api: GameApi; known: (a: number, b: number) => boolean; learning: (a: number, b: number) => boolean }) {
  const count = Array.from({ length: 100 }, (_, k) => known(Math.floor(k / 10) + 1, (k % 10) + 1)).filter(Boolean).length;
  return (
    <div className="times-overview">
      <h2 className="level-picker__title">{api.t('timesOverview')} · {count} / 100</h2>
      <div className="times-ov">
        <span className="times-ov__corner">×</span>
        {Array.from({ length: 10 }, (_, c) => <span key={`h${c}`} className="times-ov__head">{c + 1}</span>)}
        {Array.from({ length: 10 }, (_, r) => (
          <div key={r} style={{ display: 'contents' }}>
            <span className="times-ov__head">{r + 1}</span>
            {Array.from({ length: 10 }, (_, c) => {
              const k = known(r + 1, c + 1);
              return (
                <button key={c} className={`times-ov__cell ${k ? 'is-known' : learning(r + 1, c + 1) ? 'is-learning' : ''}`}
                  onClick={() => api.speak(api.t('timesA', { a: r + 1, b: c + 1, n: (r + 1) * (c + 1) }))}>
                  {(r + 1) * (c + 1)}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p className="times-hint"><Emo e="🟩" /> {api.t('timesKnownHint')}</p>
    </div>
  );
}
