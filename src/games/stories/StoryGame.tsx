/**
 * Shqipos eventyr – bildehistorier som leses høyt. Setningen som leses lyser opp,
 * og barnet kan trykke på et ord for å høre det. Noen sider har valg.
 */
import { useEffect, useMemo, useState } from 'react';
import type { GameApi, GameProps } from '../types';
import { Emo } from '../../components/Emo';
import { speakParts, stopSpeaking } from '../../audio/speech';
import { STORIES, sentencesOf, type Story } from './stories';
import './stories.css';

interface Saved { done: string[] }

export default function StoryGame({ api, onFinish }: GameProps) {
  const [story, setStory] = useState<Story | null>(null);
  const [saved, setSaved] = useState<Saved>(() => api.loadData<Saved>() ?? { done: [] });
  useEffect(() => {
    api.setBack(story ? () => { stopSpeaking(); setStory(null); } : null);
    return () => api.setBack(null);
  }, [story]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopSpeaking(), []);

  if (!story) {
    return (
      <div className="story-pick">
        {STORIES.map((s, k) => (
          <button key={s.id} className="story-cover pop-in" style={{ animationDelay: `${k * 0.07}s` }}
            onClick={() => { api.sfx('pop'); setStory(s); }}>
            <span className="story-cover__icon"><Emo e={s.icon} /></span>
            <b>{s.title[api.lang]}</b>
            {saved.done.includes(s.id) && <span className="story-cover__done"><Emo e="⭐" /></span>}
          </button>
        ))}
      </div>
    );
  }
  return (
    <Reader
      key={story.id}
      api={api}
      story={story}
      onEnd={() => {
        const first = !saved.done.includes(story.id);
        const next = first ? { done: [...saved.done, story.id] } : saved;
        setSaved(next);
        api.saveData(next);
        onFinish({ won: true, stars: 3, firstClear: first, coins: first ? 10 : 3 });
      }}
    />
  );
}

function Reader({ api, story, onEnd }: { api: GameApi; story: Story; onEnd: () => void }) {
  const [pageId, setPageId] = useState(story.pages[0].id);
  const [history, setHistory] = useState<string[]>([]);
  const [active, setActive] = useState(-1); // setningen som leses nå
  const page = story.pages.find((p) => p.id === pageId)!;
  const sentences = useMemo(() => sentencesOf(page.text[api.lang]), [page, api.lang]);
  const other = useMemo(() => page.text[api.otherLang], [page, api.otherLang]);
  const isEnd = !page.next && !page.choices;

  function read() {
    speakParts(
      sentences.map((s, k) => ({ text: s, onStart: () => setActive(k) })),
      () => setActive(-1)
    );
  }
  // Les siden høyt når den åpnes
  useEffect(() => {
    setActive(-1);
    const id = setTimeout(read, 450);
    return () => { clearTimeout(id); stopSpeaking(); };
  }, [pageId]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (to: string) => { api.sfx('flip'); setHistory((h) => [...h, pageId]); setPageId(to); };
  const back = () => { const h = [...history]; const prev = h.pop(); if (prev) { api.sfx('flip'); setHistory(h); setPageId(prev); } };
  const n = story.pages.indexOf(page);

  return (
    <div className="story">
      <div className="story__scene" style={{ background: page.bg }} key={page.id}>
        {page.items.map((it, k) => (
          <span key={k} className={`story__item story__item--${it.anim ?? 'bob'}`}
            style={{ left: `${it.x}%`, top: `${it.y}%`, fontSize: `${it.size * 1.9}vmin`, animationDelay: `${k * 0.3}s` }}>
            <Emo e={it.e} />
          </span>
        ))}
      </div>
      <div className="story__text">
        <p>
          {sentences.map((s, k) => (
            <span key={k} className={`story__sent ${active === k ? 'is-reading' : ''}`}>
              {s.split(/(\s+)/).map((w, j) => (w.trim()
                ? <button key={j} className="story__word" onClick={() => api.speak(w.replace(/[.,!?…:;]+$/u, ''))}>{w}</button>
                : <span key={j}>{w}</span>))}{' '}
            </span>
          ))}
        </p>
        {api.bilingual && <p className="story__other">{api.otherLang === 'sq' ? '🇦🇱' : '🇳🇴'} {other}</p>}
      </div>
      <div className="story__nav">
        <button className="story__btn" onClick={back} disabled={!history.length} aria-label={api.t('back')}>◀</button>
        <button className="story__btn story__btn--read" onClick={() => { api.sfx('tap'); read(); }} aria-label={api.t('listen')}><Emo e="🔊" /></button>
        {page.choices ? (
          <div className="story__choices">
            {page.choices.map((c) => (
              <button key={c.to} className="story__choice pop-in" onClick={() => { api.speak(c.label[api.lang]); go(c.to); }}>
                <Emo e={c.e} /> {c.label[api.lang]}
              </button>
            ))}
          </div>
        ) : isEnd ? (
          <button className="big-btn big-btn--go story__end pop-in" onClick={() => { api.sfx('win'); onEnd(); }}>⭐ {api.t('theEnd')}</button>
        ) : (
          <button className="story__btn story__btn--next" onClick={() => go(page.next!)} aria-label={api.t('next')}>▶</button>
        )}
        <span className="story__page">{n + 1}</span>
      </div>
    </div>
  );
}
