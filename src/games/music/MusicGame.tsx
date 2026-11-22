/**
 * Musikkleker – lær sanger på piano, eller spill fritt på piano, xylofon og trommer.
 *
 * «Sanger»: tangenten som skal trykkes lyser og hopper, og de neste notene vises over pianoet.
 * «Hør sangen» lar pianoet spille sangen først, så barnet kan herme etter.
 */
import { Emo } from '../../components/Emo';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameApi, GameProps } from '../types';
import { playNote, playDrum, type Drum } from '../../audio/sound';
import { SONGS, parseSong, type Song } from './songs';
import './music.css';

const NOTES = [
  { f: 261.63, n: 'C', c: '#ff595e', a: '🐶' }, { f: 293.66, n: 'D', c: '#ff924c', a: '🐱' }, { f: 329.63, n: 'E', c: '#ffca3a', a: '🐥' },
  { f: 349.23, n: 'F', c: '#8ac926', a: '🐸' }, { f: 392.0, n: 'G', c: '#52a675', a: '🐢' }, { f: 440.0, n: 'A', c: '#1982c4', a: '🐳' },
  { f: 493.88, n: 'H', c: '#4267ac', a: '🦋' }, { f: 523.25, n: 'C', c: '#6a4c93', a: '🦄' }
];
const DRUMS: { kind: Drum; icon: string; c: string }[] = [
  { kind: 'kick', icon: '🥁', c: '#ff595e' }, { kind: 'snare', icon: '🪘', c: '#ffca3a' }, { kind: 'hihat', icon: '✨', c: '#8ac926' },
  { kind: 'clap', icon: '👏', c: '#1982c4' }, { kind: 'tom', icon: '🎵', c: '#6a4c93' }, { kind: 'bell', icon: '🔔', c: '#ff70a6' }
];

type Tab = 'songs' | 'piano' | 'xylo' | 'drums';
interface SavedData { songs: Record<string, number> }

/** Pianotangenter som brukes både i fri lek og i sangmodus. */
function Piano({ onPress, target, hitKey, wrongKey }: { onPress: (i: number) => void; target?: number | null; hitKey?: string; wrongKey?: number | null }) {
  return (
    <div className="piano">
      {NOTES.map((n, i) => (
        <button
          key={i}
          className={`piano__key ${hitKey === `p${i}` ? 'is-hit' : ''} ${target === i ? 'is-target' : ''} ${wrongKey === i ? 'is-wrong' : ''}`}
          style={{ ['--c' as string]: n.c }}
          onPointerDown={() => onPress(i)}
          aria-label={n.n}
        >
          {target === i && <span className="piano__arrow">⬇️</span>}
          <span className="piano__animal"><Emo e={n.a} /></span>
          <span className="piano__dot" />
        </button>
      ))}
    </div>
  );
}

export default function MusicGame(props: GameProps) {
  const { api, world } = props;
  const [tab, setTab] = useState<Tab>(world === 'tiny' ? 'piano' : 'songs');
  const [taps, setTaps] = useState(0);
  const [hit, setHit] = useState<{ key: string; t: number } | null>(null);
  const [notes, setNotes] = useState<{ id: number; x: number; s: string }[]>([]);

  function flash(key: string, x: number) {
    const t = Date.now();
    setHit({ key, t });
    setTimeout(() => setHit((h) => (h && h.t === t ? { key: '', t } : h)), 180);
    setTaps((n) => n + 1);
    const id = Math.random();
    setNotes((ns) => [...ns.slice(-10), { id, x, s: ['🎵', '🎶', '⭐', '💖'][Math.floor(Math.random() * 4)] }]);
    setTimeout(() => setNotes((ns) => ns.filter((n) => n.id !== id)), 1200);
  }

  const tabs: [Tab, string, 'songs' | 'piano' | 'xylophone' | 'drums'][] = [
    ['songs', '🎵', 'songs'], ['piano', '🎹', 'piano'], ['xylo', '🌈', 'xylophone'], ['drums', '🥁', 'drums']
  ];

  return (
    <div className="music">
      <nav className="music__tabs">
        {tabs.map(([id, icon, key]) => (
          <button key={id} className={tab === id ? 'is-active' : ''} onClick={() => { api.sfx('tap'); setTab(id); }} aria-label={api.t(key)}>
            <span><Emo e={icon} /></span><small>{api.t(key)}</small>
          </button>
        ))}
        {tab !== 'songs' && taps >= 20 && <button className="music__done pop-in" onClick={() => props.onFinish({ won: true, stars: 3, coins: 5 })}>✔</button>}
      </nav>
      <div className="music__stage">
        <div className="music__notes" aria-hidden>{notes.map((n) => <span key={n.id} style={{ left: `${n.x}%` }}>{n.s}</span>)}</div>
        {tab === 'songs' && <Songs {...props} />}
        {tab === 'piano' && (
          <Piano hitKey={hit?.key} onPress={(i) => { playNote(NOTES[i].f, 'piano'); flash(`p${i}`, (i + 0.5) * 12.5); }} />
        )}
        {tab === 'xylo' && (
          <div className="xylo">
            {NOTES.map((n, i) => (
              <button
                key={i}
                className={`xylo__bar ${hit?.key === `x${i}` ? 'is-hit' : ''}`}
                style={{ background: n.c, height: `${92 - i * 7}%` }}
                onPointerDown={() => { playNote(n.f, 'xylo'); flash(`x${i}`, (i + 0.5) * 12.5); }}
                aria-label={n.n}
              >
                <i /><i />
              </button>
            ))}
          </div>
        )}
        {tab === 'drums' && (
          <div className="drums">
            {DRUMS.map((d, i) => (
              <button
                key={d.kind}
                className={`drum ${hit?.key === d.kind ? 'is-hit' : ''}`}
                style={{ background: d.c }}
                onPointerDown={() => { playDrum(d.kind); flash(d.kind, ((i % 3) + 0.5) * 33); }}
                aria-label={d.kind}
              >
                <span key={hit?.key === d.kind ? hit.t : 0}><Emo e={d.icon} /></span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sangmodus
// ---------------------------------------------------------------------------
function Songs({ api, world, onFinish }: GameProps) {
  const [saved, setSaved] = useState<SavedData>(() => api.loadData<SavedData>() ?? { songs: {} });
  const [song, setSong] = useState<Song | null>(null);
  // ⬅️ går først tilbake til spillets egen meny
  useEffect(() => {
    api.setBack(song !== null ? () => setSong(null) : null);
    return () => api.setBack(null);
  }, [song]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!song) {
    return (
      <div className="songs">
        <h2 className="level-picker__title">{api.t('learnSongs')}</h2>
        <div className="songs__list">
          {SONGS.map((s, i) => (
            <button key={s.id} className="song-card pop-in" style={{ animationDelay: `${i * 0.04}s` }} onClick={() => { api.sfx('pop'); api.speak(s.title[api.lang]); setSong(s); }}>
              <span className="song-card__icon"><Emo e={s.icon} /></span>
              <span className="song-card__title">{s.title[api.lang]}</span>
              <span className="song-card__meta">
                <span className="song-card__level">{'🎵'.repeat(s.level)}</span>
                <span className="song-card__stars">{[0, 1, 2].map((k) => <i key={k} className={k < (saved.songs[s.id] ?? 0) ? 'on' : ''}>★</i>)}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <SongPlayer
      api={api}
      song={song}
      lenient={world === 'tiny'}
      onBack={() => setSong(null)}
      onDone={(stars) => {
        const first = !(saved.songs[song.id] > 0);
        const next = { songs: { ...saved.songs, [song.id]: Math.max(saved.songs[song.id] ?? 0, stars) } };
        setSaved(next);
        api.saveData(next);
        setTimeout(() => onFinish({ won: true, stars, firstClear: first }), 900);
      }}
    />
  );
}

function SongPlayer({ api, song, lenient, onBack, onDone }: {
  api: GameApi; song: Song; lenient: boolean; onBack: () => void; onDone: (stars: number) => void;
}) {
  const seq = useMemo(() => parseSong(song.notes), [song]);
  const [pos, setPos] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hitKey, setHitKey] = useState('');
  const [wrongKey, setWrongKey] = useState<number | null>(null);
  const [demo, setDemo] = useState(false);
  const demoTimers = useRef<number[]>([]);
  const done = pos >= seq.length;

  useEffect(() => {
    api.speak(api.t('playTheGlowing'));
    return () => demoTimers.current.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function light(i: number) {
    setHitKey(`p${i}`);
    setTimeout(() => setHitKey((k) => (k === `p${i}` ? '' : k)), 200);
  }

  function press(i: number) {
    if (demo || done) return;
    playNote(NOTES[i].f, 'piano');
    light(i);
    if (i === seq[pos].key) {
      const next = pos + 1;
      setPos(next);
      if (next >= seq.length) {
        api.sfx('win');
        onDone(lenient ? 3 : mistakes <= 2 ? 3 : mistakes <= 6 ? 2 : 1);
      }
    } else {
      setMistakes((m) => m + 1);
      setWrongKey(i);
      setTimeout(() => setWrongKey(null), 350);
    }
  }

  function toggleDemo() {
    if (demo) {
      demoTimers.current.forEach(clearTimeout);
      demoTimers.current = [];
      setDemo(false);
      return;
    }
    setDemo(true);
    const beat = 420;
    let t = 300;
    seq.forEach((n) => {
      demoTimers.current.push(window.setTimeout(() => { playNote(NOTES[n.key].f, 'piano'); light(n.key); }, t));
      t += n.beats * beat;
    });
    demoTimers.current.push(window.setTimeout(() => setDemo(false), t));
  }

  // Vis noen noter bakover og framover
  const from = Math.max(0, pos - 2);
  const window_ = seq.slice(from, from + 10);

  return (
    <div className="song-player">
      <div className="song-player__top">
        <button className="hud-chip song-player__btn" onClick={() => { demoTimers.current.forEach(clearTimeout); onBack(); }}>⬅️</button>
        <span className="song-player__title"><Emo e={song.icon} /> {song.title[api.lang]}</span>
        <button className={`hud-chip song-player__btn ${demo ? 'is-on' : ''}`} onClick={toggleDemo}>{demo ? `⏹ ${api.t('stopSong')}` : `🔊 ${api.t('listenSong')}`}</button>
      </div>
      <div className="song-strip">
        {window_.map((n, k) => {
          const idx = from + k;
          const state = idx < pos ? 'done' : idx === pos ? 'now' : 'next';
          return (
            <span key={idx} className={`song-note is-${state}`} style={{ ['--c' as string]: NOTES[n.key].c, ['--w' as string]: n.beats }}>
              {state === 'done' ? '✔' : <Emo e={NOTES[n.key].a} />}
            </span>
          );
        })}
        <span className="song-strip__progress"><i style={{ width: `${(pos / seq.length) * 100}%` }} /></span>
      </div>
      <Piano onPress={press} target={demo || done ? null : seq[pos]?.key} hitKey={hitKey} wrongKey={wrongKey} />
    </div>
  );
}
