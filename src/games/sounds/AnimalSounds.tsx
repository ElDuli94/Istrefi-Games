/**
 * Dyrelyder – trykk på et dyr og hør den ekte lyden, og så navnet.
 * 2–4 år: 9 store dyr, fri lek. 5–7 år: alle dyr + "Gjett dyret"-quiz.
 */
import { Emo } from '../../components/Emo';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameApi, GameProps } from '../types';
import { FARM } from '../../data/farm';
import { playAnimal } from '../../audio/animalSounds';
import './sounds.css';

type Animal = (typeof FARM)[number];
const TODDLER = ['dog', 'cat', 'cow', 'sheep', 'pig', 'duck', 'chicken', 'horse', 'lion'];
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

/** Spiller ekte dyrelyd og sier så navnet (på begge språk hvis tospråklig). Avbryter forrige. */
function useAnimalVoice(api: GameApi) {
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (a: Animal, withName = true) => {
    clearTimeout(timer.current);
    window.speechSynthesis?.cancel();
    const dur = playAnimal(a.id);
    // Først ekte dyrelyd, så sier stemmen bare navnet på dyret (i quizen: bare lyden)
    if (withName) timer.current = window.setTimeout(() => api.sayBoth(a.name[api.lang], a.name[api.otherLang]), dur * 1000 + 150);
  };
}

export default function AnimalSounds(props: GameProps) {
  const { world, api } = props;
  const [mode, setMode] = useState<'free' | 'quiz' | null>(world === 'tiny' ? 'free' : null);
  // ⬅️ går først tilbake til spillets egen meny
  useEffect(() => {
    api.setBack(mode !== null && world !== 'tiny' ? () => setMode(null) : null);
    return () => api.setBack(null);
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps
  if (mode === null) {
    return (
      <div className="sounds-menu">
        <button className="sounds-mode pop-in" onClick={() => { api.sfx('pop'); setMode('free'); }}>
          <span><Emo e="🐮" /></span>{api.t('tapAnAnimal')}
        </button>
        <button className="sounds-mode pop-in" style={{ animationDelay: '.08s' }} onClick={() => { api.sfx('pop'); api.speak(api.t('guessAnimal')); setMode('quiz'); }}>
          <span><Emo e="❓" /></span>{api.t('guessAnimal')}
        </button>
      </div>
    );
  }
  return mode === 'free' ? <Free {...props} /> : <Quiz {...props} />;
}

function Free({ world, api }: GameProps) {
  const animals = useMemo(() => (world === 'tiny' ? FARM.filter((a) => TODDLER.includes(a.id)) : FARM), [world]);
  const [heard, setHeard] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const say = useAnimalVoice(api);
  const done = useRef(false);

  useEffect(() => api.speak(api.t('tapAnAnimal')), []); // eslint-disable-line react-hooks/exhaustive-deps

  function tap(a: Animal) {
    say(a);
    setActive(a.id);
    setTick((t) => t + 1); // start animasjonen på nytt ved hvert trykk
    const next = new Set(heard).add(a.id);
    setHeard(next);
    if (next.size === animals.length && !done.current) {
      // Leken stopper ikke: liten feiring + mynter, og så kan barnet høre alle dyrene igjen
      done.current = true;
      setTimeout(() => {
        api.reward(10);
        setTimeout(() => api.speak(api.t('allAnimalsHeard')), 1600);
        setHeard(new Set());
        done.current = false;
      }, 2200);
    }
  }

  return (
    <div className={`farm farm--${animals.length > 9 ? 'many' : 'few'}`}>
      {animals.map((a) => (
        <button
          key={a.id}
          className={`farm-animal ${active === a.id ? 'is-active' : ''} ${heard.has(a.id) ? 'is-heard' : ''}`}
          style={{ background: a.bg }}
          onPointerDown={() => tap(a)}
          aria-label={a.name[api.lang]}
        >
          <span key={active === a.id ? tick : 0} className="farm-animal__emoji"><Emo e={a.emoji} /></span>
          {active === a.id && <span key={`b${tick}`} className="farm-animal__says">{a.name[api.lang]}</span>}
        </button>
      ))}
    </div>
  );
}

function Quiz({ api, onFinish }: GameProps) {
  const ROUNDS = 5;
  const order = useMemo(() => shuffle(FARM).slice(0, ROUNDS), []);
  const [round, setRound] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [right, setRight] = useState<string | null>(null);
  const say = useAnimalVoice(api);
  const target = order[round];
  const options = useMemo(
    () => shuffle([target, ...shuffle(FARM.filter((a) => a.id !== target.id)).slice(0, 2)]),
    [target]
  );

  useEffect(() => {
    const id = setTimeout(() => say(target, false), 500);
    return () => clearTimeout(id);
  }, [round]); // eslint-disable-line react-hooks/exhaustive-deps

  function pick(a: Animal) {
    if (right) return;
    if (a.id === target.id) {
      setRight(a.id);
      api.sfx('match');
      setTimeout(() => api.sayBoth(a.name[api.lang], a.name[api.otherLang]), 300);
      setTimeout(() => {
        setRight(null);
        if (round + 1 < ROUNDS) setRound(round + 1);
        else onFinish({ won: true, stars: mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1 });
      }, 1600);
    } else {
      setMistakes((m) => m + 1);
      setWrong(a.id);
      api.sfx('nope');
      setTimeout(() => setWrong(null), 500);
    }
  }

  return (
    <div className="quiz">
      <div className="quiz__top">
        <span className="quiz__count">{round + 1} / {ROUNDS}</span>
        <button className="quiz__listen" onClick={() => say(target, false)}>🔊 {api.t('listen')}</button>
        <p className="quiz__q">{api.t('whoSaysThis')}</p>
      </div>
      <div className="quiz__options">
        {options.map((a) => (
          <button
            key={`${round}-${a.id}`}
            className={`farm-animal pop-in ${wrong === a.id ? 'is-wrong' : ''} ${right === a.id ? 'is-right' : ''}`}
            style={{ background: a.bg }}
            onClick={() => pick(a)}
            aria-label={a.name[api.lang]}
          >
            <span className="farm-animal__emoji"><Emo e={a.emoji} /></span>
          </button>
        ))}
      </div>
    </div>
  );
}
