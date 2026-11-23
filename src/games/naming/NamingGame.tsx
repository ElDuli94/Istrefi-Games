/**
 * Hva heter det? – lær navnet på ting (mat, kjøretøy, kroppen, klær, hjemme, natur, farger, dyr).
 * 2–4 år: Bildebok (trykk og hør) og så «Finn …!» med to valg. Feil gir hint, aldri straff.
 * 5–7 år: «Finn …!» med tre–fire valg og «Hvilken bokstav starter det på?».
 * Ordet vises skrevet under bildet, så barna ser ordbildet mens de hører det.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameApi, GameProps } from '../types';
import { VOCAB, firstLetter, type VocabCat, type VocabItem } from '../../data/vocab';
import { ALPHABETS } from '../../data/alphabets';
import { Emo } from '../../components/Emo';
import { Thing } from '../../components/Thing';
import './naming.css';

const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);
interface Saved { done: string[] }

export default function NamingGame(props: GameProps) {
  const { api } = props;
  const [cat, setCat] = useState<VocabCat | null>(null);
  const [saved, setSaved] = useState<Saved>(() => api.loadData<Saved>() ?? { done: [] });
  useEffect(() => {
    api.setBack(cat ? () => setCat(null) : null);
    return () => api.setBack(null);
  }, [cat]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cat) {
    return (
      <div className="naming-cats">
        {VOCAB.map((c, i) => (
          <button
            key={c.id}
            className="naming-cat pop-in"
            style={{ animationDelay: `${i * 0.05}s` }}
            onClick={() => { api.sfx('pop'); api.speak(api.t(c.nameKey)); setCat(c); }}
          >
            <span className="naming-cat__icon"><Emo e={c.icon} /></span>
            <b>{api.t(c.nameKey)}</b>
            {saved.done.includes(`${props.world}:${c.id}`) && <span className="naming-cat__done"><Emo e="⭐" /></span>}
          </button>
        ))}
      </div>
    );
  }
  const finish = (stars: number) => {
    const key = `${props.world}:${cat.id}`;
    const first = !saved.done.includes(key);
    const next = first ? { done: [...saved.done, key] } : saved;
    setSaved(next);
    api.saveData(next);
    props.onFinish({ won: true, stars, firstClear: first });
  };
  return props.world === 'tiny'
    ? <Toddler key={cat.id} api={api} cat={cat} onDone={finish} />
    : <Kids key={cat.id} api={api} cat={cat} onDone={finish} />;
}

const name = (api: GameApi, it: VocabItem) => it[api.lang];
const other = (api: GameApi, it: VocabItem) => it[api.otherLang];
/** Ordet skrevet – og på det andre språket under, hvis «Lær begge språk» er på */
function Word({ api, it }: { api: GameApi; it: VocabItem }) {
  return (
    <span className="naming-word">
      {name(api, it)}
      {api.bilingual && <small className="naming-word__other">{api.otherLang === 'sq' ? '🇦🇱' : '🇳🇴'} {other(api, it)}</small>}
    </span>
  );
}

// ---------------- 2–4 år ----------------
function Toddler({ api, cat, onDone }: { api: GameApi; cat: VocabCat; onDone: (stars: number) => void }) {
  const items = useMemo(() => shuffle(cat.items).slice(0, 6), [cat]);
  const [phase, setPhase] = useState<'book' | 'quiz'>('book');
  const [heard, setHeard] = useState<Set<string>>(new Set());
  const [bounce, setBounce] = useState<string | null>(null);
  const [taps, setTaps] = useState(0);

  useEffect(() => { api.speak(api.t('tapToHear')); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === 'quiz') return <Quiz api={api} pool={items} rounds={5} choices={2} letters={false} onDone={onDone} />;
  return (
    <div className="naming">
      <div className="naming-book">
        {items.map((it, i) => (
          <button
            key={it.e}
            className={`naming-pic pop-in ${heard.has(it.e) ? 'is-heard' : ''} ${bounce === it.e ? 'is-bounce' : ''}`}
            style={{ animationDelay: `${i * 0.06}s` }}
            onClick={() => {
              api.sfx('pop');
              api.sayBoth(name(api, it), other(api, it));
              setBounce(null);
              requestAnimationFrame(() => setBounce(it.e));
              setHeard((h) => new Set(h).add(it.e));
              setTaps((n) => n + 1);
            }}
          >
            <Thing e={it.e} play={bounce === it.e ? taps : 0} />
            <Word api={api} it={it} />
          </button>
        ))}
      </div>
      {heard.size >= Math.min(4, items.length) && (
        <button className="big-btn big-btn--go pop-in" onClick={() => { api.sfx('pop'); setPhase('quiz'); }}>▶ {api.t('letsPlay')}</button>
      )}
    </div>
  );
}

// ---------------- 5–7 år ----------------
function Kids({ api, cat, onDone }: { api: GameApi; cat: VocabCat; onDone: (stars: number) => void }) {
  // Fargeord og ord med mellomrom passer dårlig til bokstavspørsmål
  const letters = cat.id !== 'colors';
  return <Quiz api={api} pool={cat.items} rounds={8} choices={cat.items.length >= 12 ? 4 : 3} letters={letters} onDone={onDone} />;
}

// ---------------- Felles quiz ----------------
type Q = { kind: 'find'; target: VocabItem; options: VocabItem[] } | { kind: 'letter'; target: VocabItem; options: string[]; answer: string };

function makeQ(api: GameApi, pool: VocabItem[], choices: number, letters: boolean, i: number, last?: VocabItem): Q {
  const cands = pool.filter((p) => p !== last);
  const target = cands[Math.floor(Math.random() * cands.length)];
  if (letters && i % 2 === 1 && !name(api, target).includes(' ')) {
    const answer = firstLetter(name(api, target), api.lang);
    const others = shuffle(ALPHABETS[api.lang].filter((l) => l !== answer)).slice(0, 2);
    return { kind: 'letter', target, answer, options: shuffle([answer, ...others]) };
  }
  const others = shuffle(pool.filter((p) => p !== target)).slice(0, choices - 1);
  return { kind: 'find', target, options: shuffle([target, ...others]) };
}

function Quiz({ api, pool, rounds, choices, letters, onDone }: {
  api: GameApi; pool: VocabItem[]; rounds: number; choices: number; letters: boolean; onDone: (stars: number) => void;
}) {
  const [i, setI] = useState(0);
  const [q, setQ] = useState<Q>(() => makeQ(api, pool, choices, letters, 0));
  const [wrong, setWrong] = useState<string[]>([]);
  const [hint, setHint] = useState(false);
  const [solved, setSolved] = useState(false);
  const mistakes = useRef(0);

  const ask = (qq: Q) => api.speak(qq.kind === 'find' ? api.t('findThe', { x: name(api, qq.target) }) : api.t('whichLetter', { x: name(api, qq.target) }));
  useEffect(() => { ask(q); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  function answer(ok: boolean, key: string) {
    if (solved) return;
    if (ok) {
      api.sfx('match');
      setSolved(true);
      if (q.kind === 'find') api.sayBoth(name(api, q.target), other(api, q.target));
      else api.speak(`${q.answer}. ${api.t('asIn', { l: q.answer, w: name(api, q.target) })}`);
      setTimeout(() => {
        if (i + 1 >= rounds) {
          const m = mistakes.current;
          onDone(m <= 1 ? 3 : m <= 4 ? 2 : 1);
          return;
        }
        setI(i + 1);
        setWrong([]);
        setHint(false);
        setSolved(false);
        setQ(makeQ(api, pool, choices, letters, i + 1, q.target));
      }, 1500);
    } else {
      api.sfx('nope');
      mistakes.current++;
      setWrong((w) => [...w, key]);
      // Riktig svar vugger litt (de minste med en gang, ellers etter to feil) – barnet lykkes alltid til slutt
      if (wrong.length + 1 >= (choices <= 2 ? 1 : 2)) setHint(true);
      ask(q);
    }
  }

  return (
    <div className="naming">
      <div className="naming-progress">{Array.from({ length: rounds }, (_, k) => <i key={k} className={k < i || (k === i && solved) ? 'is-done' : ''} />)}</div>
      <button className="naming-ask" onClick={() => ask(q)}>
        {q.kind === 'find' ? api.t('findThe', { x: name(api, q.target) }) : api.t('whichLetter', { x: name(api, q.target) })} <Emo e="🔊" />
      </button>
      {q.kind === 'find' ? (
        <div className={`naming-choices naming-choices--${q.options.length}`}>
          {q.options.map((o) => {
            const isT = o === q.target;
            return (
              <button
                key={o.e}
                className={`naming-pic pop-in ${wrong.includes(o.e) ? 'is-wrong' : ''} ${hint && isT && !solved ? 'is-hint' : ''} ${solved && isT ? 'is-right' : ''}`}
                disabled={wrong.includes(o.e)}
                onClick={() => answer(isT, o.e)}
              >
                <Thing e={o.e} play={solved && isT ? 1 : 0} />
                {solved && isT && <Word api={api} it={o} />}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="naming-letterq">
          <div className={`naming-pic naming-pic--big ${solved ? 'is-right' : ''}`}>
            <Thing e={q.target.e} play={solved ? 1 : 0} />
            <span className="naming-word">
              {solved ? name(api, q.target) : <><b className="naming-blank">_</b>{name(api, q.target).slice(q.answer.length)}</>}
            </span>
          </div>
          <div className="naming-letters">
            {q.options.map((l) => (
              <button
                key={l}
                className={`naming-letter pop-in ${wrong.includes(l) ? 'is-wrong' : ''} ${hint && l === q.answer && !solved ? 'is-hint' : ''} ${solved && l === q.answer ? 'is-right' : ''}`}
                disabled={wrong.includes(l)}
                onClick={() => answer(l === q.answer, l)}
              >{l}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
