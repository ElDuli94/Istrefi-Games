/**
 * Ordgåten – gjett det hemmelige ordet på 6 forsøk.
 * Grønn = riktig bokstav på riktig plass, gul = bokstaven finnes et annet sted, grå = ikke med.
 * "Dagens ord" er likt for alle hver dag. "Øving" gir nye ord så mye man vil.
 * 💡 Hint viser én bokstav (koster én stjerne). Statistikk: spilt, vunnet, på rad og fordeling av forsøk.
 */
import { useEffect, useMemo, useState } from 'react';
import type { GameProps } from '../types';
import { WORDS } from '../../data/words';
import { ALPHABETS, splitLetters } from '../../data/alphabets';
import './wordgame.css';

const TRIES = 6;
type Mark = 'ok' | 'near' | 'no';
interface Stats { played: number; won: number; streak: number; best: number; dist: number[] }
interface SavedData { daily?: { date: string; won: boolean; tries: number; lang: string }; stats?: Stats }
const emptyStats = (): Stats => ({ played: 0, won: 0, streak: 0, best: 0, dist: Array(TRIES).fill(0) });

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
  // ⬅️ går først tilbake til spillets egen meny
  useEffect(() => {
    api.setBack(mode !== null ? () => setMode(null) : null);
    return () => api.setBack(null);
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps
  const list = useMemo(() => WORDS[api.lang][L as 4 | 5].map((w) => splitLetters(w, api.lang)).filter((w) => w.length === L), [api.lang, L]);
  const dailyDone = saved.daily?.date === today() && saved.daily.lang === api.lang;
  const st = saved.stats ?? emptyStats();
  const maxDist = Math.max(1, ...st.dist);

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
        {st.played > 0 && (
          <div className="wg-stats pop-in">
            <div className="wg-stats__row">
              <span><b>{st.played}</b>{api.t('statPlayed')}</span>
              <span><b>{Math.round((st.won / st.played) * 100)}%</b>{api.t('statWon')}</span>
              <span><b>🔥 {st.streak}</b>{api.t('statStreak')}</span>
              <span><b>🏆 {st.best}</b>{api.t('statBest')}</span>
            </div>
            <div className="wg-dist">
              {st.dist.map((d, k) => (
                <div key={k} className="wg-dist__bar"><i>{k + 1}</i><span style={{ width: `${Math.max(8, (d / maxDist) * 100)}%` }}>{d}</span></div>
              ))}
            </div>
          </div>
        )}
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
        const s0 = saved.stats ?? emptyStats();
        const streak = won ? s0.streak + 1 : 0;
        const stats: Stats = { played: s0.played + 1, won: s0.won + (won ? 1 : 0), streak, best: Math.max(s0.best, streak), dist: s0.dist.map((d, k) => (won && k === tries - 1 ? d + 1 : d)) };
        if (mode !== 'daily') { const next = { ...saved, stats }; setSaved(next); api.saveData(next); return false; }
        const next = { ...saved, stats, daily: { date: today(), won, tries, lang: api.lang } };
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
  const [hint, setHint] = useState<number | null>(null); // posisjon som er avslørt
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
        const stars = won ? Math.max(1, (tries <= 3 ? 3 : tries <= 5 ? 2 : 1) - (hint !== null ? 1 : 0)) : 0;
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

  function useHint() {
    if (hint !== null || over) return;
    // Avslør en plass som ikke allerede er funnet (grønn)
    const known = new Set<number>();
    rows.forEach((r) => r.marks.forEach((m, i) => { if (m === 'ok') known.add(i); }));
    const free = target.map((_, i) => i).filter((i) => !known.has(i));
    if (!free.length) return;
    const i = free[Math.floor(Math.random() * free.length)];
    api.sfx('sticker');
    setHint(i);
  }

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
                <span key={i} className={`wg-cell ${row ? `is-${row.marks[i]} is-flip` : letters[i] ? 'is-typed' : ''} ${!row && r === rows.length && hint === i && !letters[i] ? 'is-ghost' : ''}`} style={{ animationDelay: `${i * 0.12}s` }}>
                  {letters[i] ?? (!row && r === rows.length && hint === i ? target[i] : '')}
                </span>
              ))}
            </div>
          );
        })}
      </div>
      {over && !rows[rows.length - 1].marks.every((m) => m === 'ok') && <div className="wg-reveal pop-in">{api.t('theWordWas', { w: target.join('') })}</div>}
      {!over && rows.length >= 2 && (
        <button className={`wg-hint pop-in ${hint !== null ? 'is-used' : ''}`} onClick={useHint} disabled={hint !== null}>
          💡 {hint !== null ? api.t('hintLetter', { n: hint + 1, l: target[hint] }) : api.t('hintCost')}
        </button>
      )}
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
