/**
 * Mattespill – 10 oppgaver per nivå. 5–11 år velger blant store svarknapper,
 * 12–15 år skriver svaret på et talltastatur.
 */
import { Emo } from '../../components/Emo';
import { useEffect, useMemo, useState } from 'react';
import type { GameProps } from '../types';
import type { Lang } from '../../i18n';
import { LevelGrid, advanceGrid, emptyGridProgress, type GridProgress } from '../common/LevelGrid';
import { makeQuestion, choicesFor, type Question } from './questions';
import './math.css';

const LEVELS = 15;
const PER_LEVEL = 10;
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
  if (level === null) return <LevelGrid api={api} count={LEVELS} progress={progress} onPick={setLevel} />;
  return (
    <Quiz
      {...props}
      level={level}
      onEnd={(won, stars) => {
        const { next, firstClear } = advanceGrid(progress, level, won, stars, LEVELS);
        setProgress(next);
        api.saveData(next);
        return firstClear;
      }}
    />
  );
}

function Quiz({ api, world, onFinish, level, onEnd }: GameProps & { level: number; onEnd: (won: boolean, stars: number) => boolean }) {
  const keypad = world === 'big';
  const [n, setN] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [q, setQ] = useState<Question>(() => makeQuestion(world, level));
  const [feedback, setFeedback] = useState<{ ok: boolean; picked: number } | null>(null);
  const [input, setInput] = useState('');
  const choices = useMemo(() => choicesFor(q, world === 'small' && level < 6 ? 3 : 4, world === 'big'), [q, world, level]);

  useEffect(() => {
    if (q.say && world !== 'big') api.speak(`${q.say[0]} ${WORDS[api.lang][q.say[1]]} ${q.say[2]}`);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  function answer(v: number) {
    if (feedback) return;
    const ok = v === q.answer;
    setFeedback({ ok, picked: v });
    api.sfx(ok ? 'match' : 'nope');
    if (!ok && world !== 'big') api.speak(String(q.answer));
    const total = correct + (ok ? 1 : 0);
    setCorrect(total);
    setTimeout(() => {
      setFeedback(null);
      setInput('');
      if (n + 1 >= PER_LEVEL) {
        const won = total >= 6;
        const stars = total >= 10 ? 3 : total >= 8 ? 2 : won ? 1 : 0;
        const firstClear = onEnd(won, stars);
        onFinish({ won, stars, score: total, firstClear });
      } else {
        setN(n + 1);
        setQ(makeQuestion(world, level));
      }
    }, ok ? 700 : 1600);
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
      <div className="math__progress">
        {Array.from({ length: PER_LEVEL }, (_, i) => <i key={i} className={i < n ? 'done' : i === n ? 'now' : ''} />)}
      </div>
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
