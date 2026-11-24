/**
 * Mattespill – 10 oppgaver per nivå. 5–11 år velger blant store svarknapper,
 * 12–15 år skriver svaret på et talltastatur.
 */
import { Emo } from '../../components/Emo';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameProps } from '../types';
import type { Lang } from '../../i18n';
import { LevelGrid, advanceGrid, emptyGridProgress, type GridProgress } from '../common/LevelGrid';
import { makeQuestion, choicesFor, type Question } from './questions';
import './math.css';

const LEVELS = 15;
const PER_LEVEL = 10;
const SPRINT = -1; // tidsutfordring: 60 sekunder, så mange riktige som mulig
const SPRINT_SECONDS = 60;
const WORDS: Record<Lang, Record<'plus' | 'minus' | 'times' | 'div', string>> = {
  no: { plus: 'pluss', minus: 'minus', times: 'ganger', div: 'delt på' },
  sq: { plus: 'plus', minus: 'minus', times: 'herë', div: 'pjesëtuar me' }
};

export default function MathGame(props: GameProps) {
  const { api } = props;
  const [progress, setProgress] = useState<GridProgress>(() => api.loadData<GridProgress>() ?? emptyGridProgress());
  const [level, setLevel] = useState<number | null>(null);
  // ⬅️ går først tilbake til spillets egen meny
  useEffect(() => {
    api.setBack(level !== null ? () => setLevel(null) : null);
    return () => api.setBack(null);
  }, [level]); // eslint-disable-line react-hooks/exhaustive-deps
  if (level === null) {
    return (
      <LevelGrid
        api={api}
        count={LEVELS}
        progress={progress}
        onPick={setLevel}
        extra={
          <button className="math-sprint-btn pop-in" onClick={() => { api.sfx('pop'); api.speak(api.t('sprintHint')); setLevel(SPRINT); }}>
            ⏱️ {api.t('sprint')} {progress.highscore ? <small>🏆 {progress.highscore}</small> : null}
          </button>
        }
      />
    );
  }
  return (
    <Quiz
      {...props}
      level={level}
      maxLevel={Math.max(0, progress.unlocked - 1)}
      onEnd={(won, stars, score) => {
        if (level === SPRINT) {
          if (score > (progress.highscore ?? 0)) { const next = { ...progress, highscore: score }; setProgress(next); api.saveData(next); }
          return false;
        }
        const { next, firstClear } = advanceGrid(progress, level, won, stars, LEVELS);
        setProgress(next);
        api.saveData(next);
        return firstClear;
      }}
    />
  );
}

function Quiz({ api, world, onFinish, level, maxLevel, onEnd }: GameProps & { level: number; maxLevel: number; onEnd: (won: boolean, stars: number, score: number) => boolean }) {
  const keypad = world === 'big';
  const sprint = level === SPRINT;
  // Tidsutfordring: blandede oppgaver fra alle nivåene barnet har låst opp
  const nextQ = () => makeQuestion(world, sprint ? Math.floor(Math.random() * (maxLevel + 1)) : level);
  const [n, setN] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SPRINT_SECONDS);
  const ended = useRef(false);
  const [q, setQ] = useState<Question>(nextQ);
  const [feedback, setFeedback] = useState<{ ok: boolean; picked: number } | null>(null);
  const [input, setInput] = useState('');
  const choices = useMemo(() => choicesFor(q, world === 'small' && level < 6 ? 3 : 4, world === 'big'), [q, world, level]);

  useEffect(() => {
    if (q.say && world !== 'big' && !sprint) api.speak(`${q.say[0]} ${WORDS[api.lang][q.say[1]]} ${q.say[2]}`);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  // Nedtelling i tidsutfordringen
  useEffect(() => {
    if (!sprint) return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [sprint]);
  useEffect(() => {
    if (!sprint || timeLeft > 0 || ended.current) return;
    ended.current = true;
    api.sfx('win');
    api.speak(api.t('sprintResult', { n: correct }));
    const stars = correct >= 20 ? 3 : correct >= 12 ? 2 : correct >= 5 ? 1 : 0;
    onEnd(correct >= 5, stars, correct);
    setTimeout(() => onFinish({ won: correct >= 5, stars, score: correct, coins: Math.min(40, correct * 2) }), 1200);
  }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  function answer(v: number) {
    if (feedback || ended.current) return;
    const ok = v === q.answer;
    setFeedback({ ok, picked: v });
    api.sfx(ok ? 'match' : 'nope');
    if (!ok && world !== 'big' && !sprint) api.speak(String(q.answer));
    const total = correct + (ok ? 1 : 0);
    setCorrect(total);
    const st = ok ? streak + 1 : 0;
    setStreak(st);
    if (ok && st > 0 && st % 5 === 0) { api.sfx('sticker'); if (!sprint) api.speak(api.t('streakN', { n: st })); }
    setTimeout(() => {
      setFeedback(null);
      setInput('');
      if (sprint) { setN(n + 1); setQ(nextQ()); return; }
      if (n + 1 >= PER_LEVEL) {
        const won = total >= 6;
        const stars = total >= 10 ? 3 : total >= 8 ? 2 : won ? 1 : 0;
        const firstClear = onEnd(won, stars, total);
        onFinish({ won, stars, score: total, firstClear });
      } else {
        setN(n + 1);
        setQ(nextQ());
      }
    }, sprint ? (ok ? 350 : 900) : ok ? 700 : 1600);
  }

  function key(k: string) {
    if (feedback) return;
    api.sfx('tap');
    if (k === '⌫') setInput((s) => s.slice(0, -1));
    else if (k === '−') setInput((s) => (s.startsWith('-') ? s.slice(1) : '-' + s));
    else if (k === 'OK') { if (input && input !== '-') answer(Number(input)); }
    else setInput((s) => (s.length < 6 ? s + k : s));
  }

  return (
    <div className="math">
      {sprint ? (
        <div className="math__sprint">
          <span className={`hud-chip ${timeLeft <= 10 ? 'is-hurry' : ''}`}>⏱️ {Math.max(0, timeLeft)}</span>
          <span className="hud-chip">✔ {correct}</span>
          {streak >= 3 && <span className="hud-chip math__streak">🔥 {streak}</span>}
        </div>
      ) : (
        <div className="math__progress">
          {Array.from({ length: PER_LEVEL }, (_, i) => <i key={i} className={i < n ? 'done' : i === n ? 'now' : ''} />)}
          {streak >= 3 && <span className="math__streak">🔥 {streak}</span>}
        </div>
      )}
      <div className={`math__card ${feedback ? (feedback.ok ? 'is-ok' : 'is-wrong') : ''}`}>
        {q.visual && (
          <div className="math__visual">
            <span>{Array.from({ length: q.visual.a }, (_, i) => <Emo key={i} e={q.visual!.emoji} />)}</span>
            <b>{q.visual.op === '+' ? '+' : '−'}</b>
            <span className={q.visual.op === '−' ? 'is-gone' : ''}>{Array.from({ length: q.visual.b }, (_, i) => <Emo key={i} e={q.visual!.emoji} />)}</span>
          </div>
        )}
        <div className="math__q">{q.text}{q.text.includes('?') ? '' : ' = '}{!q.text.includes('?') && <span className="math__slot">{keypad ? input || '?' : feedback ? q.answer : '?'}</span>}</div>
        {q.text.includes('?') && keypad && <div className="math__q math__q--small">{input || '…'}</div>}
        {feedback && !feedback.ok && <div className="math__correct">✔ {q.answer}</div>}
      </div>
      {keypad ? (
        <div className="math__keypad">
          {['7', '8', '9', '4', '5', '6', '1', '2', '3', '−', '0', '⌫'].map((k) => <button key={k} onClick={() => key(k)}>{k}</button>)}
          <button className="is-ok" onClick={() => key('OK')}>OK</button>
        </div>
      ) : (
        <div className="math__choices">
          {choices.map((c) => (
            <button
              key={`${n}-${c}`}
              className={`math__choice pop-in ${feedback && c === q.answer ? 'is-right' : ''} ${feedback && !feedback.ok && c === feedback.picked ? 'is-wrong' : ''}`}
              onClick={() => answer(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
