/**
 * Flaggquiz – 10 spørsmål per nivå. Først Norden og Balkan, så Europa, så hele verden.
 * Fra nivå 4 kommer også omvendte spørsmål: finn riktig flagg til et land.
 */
import { useEffect, useMemo, useState } from 'react';
import type { GameProps } from '../types';
import { COUNTRIES, flagOf, type Country } from '../../data/countries';
import { LevelGrid, advanceGrid, emptyGridProgress, type GridProgress } from '../common/LevelGrid';
import '../math/math.css';
import './flags.css';

const LEVELS = 10;
const PER = 10;
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

function poolFor(level: number) {
  const g = level <= 2 ? 1 : level <= 5 ? 2 : 3;
  return COUNTRIES.filter((c) => c.group <= g);
}

export default function FlagGame(props: GameProps) {
  const { api } = props;
  const [progress, setProgress] = useState<GridProgress>(() => api.loadData<GridProgress>() ?? emptyGridProgress());
  const [level, setLevel] = useState<number | null>(null);
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

function Quiz({ api, onFinish, level, onEnd }: GameProps & { level: number; onEnd: (won: boolean, stars: number) => boolean }) {
  const pool = useMemo(() => poolFor(level), [level]);
  // Nyere land i nivået vises oftere, men tidligere land repeteres også
  const questions = useMemo(() => shuffle(pool).slice(0, PER), [pool]);
  const [n, setN] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const q = questions[n];
  const reverse = level >= 3 && n % 2 === 1;
  const options = useMemo(() => shuffle([q, ...shuffle(pool.filter((c) => c.code !== q.code)).slice(0, 3)]), [q, pool]);

  useEffect(() => {
    api.speak(reverse ? api.t('whichFlag', { c: q.name[api.lang] }) : api.t('whichCountry'));
  }, [n]); // eslint-disable-line react-hooks/exhaustive-deps

  function choose(c: Country) {
    if (picked) return;
    const ok = c.code === q.code;
    setPicked(c.code);
    api.sfx(ok ? 'match' : 'nope');
    api.speak(q.name[api.lang]);
    const total = correct + (ok ? 1 : 0);
    setCorrect(total);
    setTimeout(() => {
      setPicked(null);
      if (n + 1 >= PER) {
        const won = total >= 6;
        const stars = total >= 10 ? 3 : total >= 8 ? 2 : won ? 1 : 0;
        onFinish({ won, stars, score: total, firstClear: onEnd(won, stars) });
      } else setN(n + 1);
    }, ok ? 900 : 1700);
  }

  return (
    <div className="math">
      <div className="math__progress">
        {Array.from({ length: PER }, (_, i) => <i key={i} className={i < n ? 'done' : i === n ? 'now' : ''} />)}
      </div>
      <div className={`math__card ${picked ? (picked === q.code ? 'is-ok' : 'is-wrong') : ''}`}>
        {reverse ? (
          <div className="flags__name">{api.t('whichFlag', { c: q.name[api.lang] })}</div>
        ) : (
          <>
            <div className="flags__big">{flagOf(q.code)}</div>
            <div className="flags__q">{api.t('whichCountry')}</div>
          </>
        )}
      </div>
      <div className={`math__choices ${reverse ? 'flags__choices--flags' : ''}`}>
        {options.map((c) => (
          <button
            key={`${n}-${c.code}`}
            className={`math__choice flags__choice pop-in ${picked && c.code === q.code ? 'is-right' : ''} ${picked === c.code && c.code !== q.code ? 'is-wrong' : ''}`}
            onClick={() => choose(c)}
          >
            {reverse ? <span className="flags__opt-flag">{flagOf(c.code)}</span> : c.name[api.lang]}
          </button>
        ))}
      </div>
    </div>
  );
}
