/**
 * Ordgåten – gjett det hemmelige ordet på 6 forsøk.
 * Grønn = riktig bokstav på riktig plass, gul = bokstaven finnes et annet sted, grå = ikke med.
 * "Dagens ord" er likt for alle hver dag. "Øving" gir nye ord så mye man vil.
 */
import { useEffect, useMemo, useState } from 'react';
import type { GameProps } from '../types';
import { WORDS } from '../../data/words';
import { ALPHABETS, splitLetters } from '../../data/alphabets';
import './wordgame.css';

const TRIES = 6;
type Mark = 'ok' | 'near' | 'no';
interface SavedData { daily?: { date: string; won: boolean; tries: number; lang: string } }

const today = () => new Date().toISOString().slice(0, 10);
function hash(s: string) { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return Math.abs(h); }

function evaluate(guess: string[], target: string[]): Mark[] {
  const marks: Mark[] = guess.map(() => 'no');
  const left: Record<string, number> = {};
  target.forEach((t, i) => { if (guess[i] === t) marks[i] = 'ok'; else left[t] = (left[t] ?? 0) + 1; });
  guess.forEach((g, i) => { if (marks[i] !== 'ok' && left[g]) { marks[i] = 'near'; left[g]--; } });
  return marks;
}

export default function WordGame(props: GameProps) {
  const { api, world } = props;
  const L = world === 'big' ? 5 : 4;
  const [saved, setSaved] = useState<SavedData>(() => api.loadData<SavedData>() ?? {});
  const [mode, setMode] = useState<'daily' | 'practice' | null>(null);
  const list = useMemo(() => WORDS[api.lang][L as 4 | 5].map((w) => splitLetters(w, api.lang)).filter((w) => w.length === L), [api.lang, L]);
  const dailyDone = saved.daily?.date === today() && saved.daily.lang === api.lang;

  if (mode === null) {
    return (
      <div className="wg-menu">
        <p className="wg-help">{api.t('wordHelp')}</p>
        <button className="wg-mode pop-in" onClick={() => { api.sfx('pop'); setMode('daily'); }} disabled={dailyDone}>
          <span>📅</span>{api.t('dailyWord')}
          {dailyDone && <small>{saved.daily!.won ? `✔ ${saved.daily!.tries}/${TRIES}` : '✖'} · {api.t('dailyDone')}</small>}
        </button>
        <button className="wg-mode pop-in" style={{ animationDelay: '.08s' }} onClick={() => { api.sfx('pop'); setMode('practice'); }}>
          <span>🔁</span>{api.t('practice')}
        </button>
      </div>
    );
  }
  const target = mode === 'daily' ? list[hash(`${today()}-${api.lang}-${L}`) % list.length] : list[Math.floor(Math.random() * list.length)];
  return (
    <Board
      {...props}
      target={target}
      daily={mode === 'daily'}
      onEnd={(won, tries) => {
        if (mode !== 'daily') return false;
        const next = { ...saved, daily: { date: today(), won, tries, lang: api.lang } };
        setSaved(next);
        api.saveData(next);
        return won;
      }}
    />
  );
}

function Board({ api, onFinish, target, daily, onEnd }: GameProps & { target: string[]; daily: boolean; onEnd: (won: boolean, tries: number) => boolean }) {
  const L = target.length;
  const [rows, setRows] = useState<{ letters: string[]; marks: Mark[] }[]>([]);
  const [cur, setCur] = useState<string[]>([]);
  const [shake, setShake] = useState(false);
  const [over, setOver] = useState(false);
  const alphabet = ALPHABETS[api.lang];

  const keyMarks = useMemo(() => {
    const m: Record<string, Mark> = {};
    const rank = { ok: 3, near: 2, no: 1 };
    rows.forEach((r) => r.letters.forEach((l, i) => { if (!m[l] || rank[r.marks[i]] > rank[m[l]]) m[l] = r.marks[i]; }));
    return m;
  }, [rows]);

  function press(k: string) {
    if (over) return;
    if (k === '⌫') { api.sfx('tap'); setCur((c) => c.slice(0, -1)); return; }
    if (k === '✔') {
      if (cur.length < L) { api.sfx('nope'); setShake(true); setTimeout(() => setShake(false), 400); return; }
      const marks = evaluate(cur, target);
      const next = [...rows, { letters: cur, marks }];
      setRows(next);
      setCur([]);
      const won = marks.every((m) => m === 'ok');
      if (won || next.length >= TRIES) {
        setOver(true);
        const tries = next.length;
        const word = target.join('');
        api.sfx(won ? 'win' : 'nope');
        api.speak(won ? word.toLowerCase() : api.t('theWordWas', { w: word.toLowerCase() }));
        const firstClear = onEnd(won, tries);
        const stars = won ? (tries <= 3 ? 3 : tries <= 5 ? 2 : 1) : 0;
        setTimeout(() => onFinish({ won, stars, firstClear, coins: daily ? undefined : won ? 5 : 0 }), 2000);
      } else api.sfx('pop');
      return;
    }
    if (cur.length < L) { api.sfx('tap'); setCur((c) => [...c, k]); }
  }

  // Fysisk tastatur (PC)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') press('✔');
      else if (e.key === 'Backspace') press('⌫');
      else {
        const up = e.key.toUpperCase();
        if (alphabet.includes(up)) press(up);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Tastatur i tre rader
  const per = Math.ceil(alphabet.length / 3);
  const keyRows = [alphabet.slice(0, per), alphabet.slice(per, per * 2), alphabet.slice(per * 2)];

  return (
    <div className="wg">
      <div className="wg-grid" style={{ ['--L' as string]: L }}>
        {Array.from({ length: TRIES }, (_, r) => {
          const row = rows[r];
          const letters = row ? row.letters : r === rows.length ? cur : [];
          return (
            <div key={r} className={`wg-row ${r === rows.length && shake ? 'is-shake' : ''}`}>
              {Array.from({ length: L }, (_, i) => (
                <span key={i} className={`wg-cell ${row ? `is-${row.marks[i]} is-flip` : letters[i] ? 'is-typed' : ''}`} style={{ animationDelay: `${i * 0.12}s` }}>
                  {letters[i] ?? ''}
                </span>
              ))}
            </div>
          );
        })}
      </div>
      {over && !rows[rows.length - 1].marks.every((m) => m === 'ok') && <div className="wg-reveal pop-in">{api.t('theWordWas', { w: target.join('') })}</div>}
      <div className="wg-keys">
        {keyRows.map((row, i) => (
          <div key={i} className="wg-keyrow">
            {i === 2 && <button className="wg-key wg-key--wide" onClick={() => press('⌫')} aria-label="slett">⌫</button>}
            {row.map((k) => <button key={k} className={`wg-key ${keyMarks[k] ? `is-${keyMarks[k]}` : ''}`} onClick={() => press(k)}>{k}</button>)}
            {i === 2 && <button className="wg-key wg-key--wide wg-key--enter" onClick={() => press('✔')} aria-label="ok">✔</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
