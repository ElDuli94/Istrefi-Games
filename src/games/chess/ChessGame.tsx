/**
 * Sjakk – for alle nivåer.
 * - Mot robot: fem nivåer, fra 🐣 Nybegynner (tilfeldige trekk) til 🦅 Mester (tenker fire trekk fram).
 * - To spillere på samme skjerm.
 * - Lær brikkene: én brikke om gangen på tomt brett, med forklaring opplest.
 * Trykk på en brikke for å se alle lovlige trekk (prikker = flytt, ring = slå).
 * Angre og hint gjør det lett å lære. Partiet lagres, så man kan fortsette senere.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameApi, GameProps } from '../types';
import type { DictKey } from '../../i18n/no';
import { Emo } from '../../components/Emo';
import {
  bestMove, colOf, customState, inCheck, initialState, kingSquare, legalMoves, makeMove, other, outcome, positionKey, rowOf,
  type Color, type Kind, type Move, type Outcome, type Piece, type State
} from './engine';
import './chess.css';

type Mode = 'robot' | 'two';
interface Setup { mode: Mode; level: number; human: Color }
interface Saved { game?: { setup: Setup; states: State[]; helped: boolean }; wins?: number[] }

const GLYPH: Record<Kind, string> = { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' };
const BOTS = [
  { icon: '🐣', key: 'chessBot1' }, { icon: '🐰', key: 'chessBot2' }, { icon: '🦊', key: 'chessBot3' },
  { icon: '🦉', key: 'chessBot4' }, { icon: '🦅', key: 'chessBot5' }
] as const;
const START_COUNT: Record<Kind, number> = { K: 1, Q: 1, R: 2, B: 2, N: 2, P: 8 };

function PieceGlyph({ p }: { p: Piece }) {
  return <span className={`cpiece cpiece--${p.c}`}>{GLYPH[p.k]}{'︎'}</span>;
}

export default function ChessGame(props: GameProps) {
  const { api } = props;
  const [saved, setSaved] = useState<Saved>(() => api.loadData<Saved>() ?? {});
  const [screen, setScreen] = useState<'menu' | 'robot' | 'learn' | 'play'>('menu');
  const [game, setGame] = useState<NonNullable<Saved['game']> | null>(null);
  useEffect(() => {
    api.setBack(screen !== 'menu' ? () => setScreen('menu') : null);
    return () => api.setBack(null);
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  const store = (next: Saved) => { setSaved(next); api.saveData(next); };
  const start = (setup: Setup) => {
    const g = { setup, states: [initialState()], helped: false };
    setGame(g);
    store({ ...saved, game: g });
    setScreen('play');
  };

  if (screen === 'menu') {
    return (
      <div className="chess-menu">
        <div className="chess-menu__logo" aria-hidden><PieceGlyph p={{ c: 'w', k: 'K' }} /><PieceGlyph p={{ c: 'b', k: 'Q' }} /></div>
        {saved.game && (
          <button className="chess-mode chess-mode--continue pop-in" onClick={() => { api.sfx('pop'); setGame(saved.game!); setScreen('play'); }}>
            <span><Emo e="▶️" /></span>{api.t('chessContinue')}
          </button>
        )}
        <button className="chess-mode pop-in" style={{ animationDelay: '.05s' }} onClick={() => { api.sfx('pop'); api.speak(api.t('chessVsRobot')); setScreen('robot'); }}>
          <span><Emo e="🤖" /></span>{api.t('chessVsRobot')}
        </button>
        <button className="chess-mode pop-in" style={{ animationDelay: '.1s' }} onClick={() => { api.sfx('pop'); start({ mode: 'two', level: 0, human: 'w' }); }}>
          <span><Emo e="👫" /></span>{api.t('twoPlayers')}
        </button>
        <button className="chess-mode pop-in" style={{ animationDelay: '.15s' }} onClick={() => { api.sfx('pop'); api.speak(api.t('chessLearn')); setScreen('learn'); }}>
          <span><Emo e="📖" /></span>{api.t('chessLearn')}
        </button>
      </div>
    );
  }
  if (screen === 'robot') return <RobotSetup api={api} wins={saved.wins ?? []} onStart={start} />;
  if (screen === 'learn') return <Learn api={api} />;
  return (
    <Play
      key={JSON.stringify(game!.setup) + game!.states.length}
      api={api}
      game={game!}
      onSave={(g) => store({ ...saved, game: g })}
      onEnd={(result, helped) => {
        const { setup } = game!;
        const next: Saved = { ...saved, game: undefined };
        if (setup.mode === 'robot' && result === 'win') {
          const wins = [...(saved.wins ?? [])];
          wins[setup.level - 1] = (wins[setup.level - 1] ?? 0) + 1;
          next.wins = wins;
        }
        store(next);
        setTimeout(() => {
          if (setup.mode === 'two') props.onFinish({ won: true, stars: 3, coins: 5 });
          else if (result === 'win') {
            const stars = Math.max(1, Math.min(3, Math.ceil(setup.level / 2) + 1) - (helped ? 1 : 0));
            props.onFinish({ won: true, stars, coins: 5 + setup.level * 5 });
          } else if (result === 'draw') props.onFinish({ won: true, stars: 1, coins: 3 });
          else props.onFinish({ won: false, stars: 0 });
        }, 3200);
      }}
    />
  );
}

// ---------------- Velg robot og farge ----------------
function RobotSetup({ api, wins, onStart }: { api: GameApi; wins: number[]; onStart: (s: Setup) => void }) {
  const [level, setLevel] = useState(1);
  const [color, setColor] = useState<Color | 'random'>('w');
  return (
    <div className="chess-setup">
      <h2>{api.t('chessLevel')}</h2>
      <div className="chess-bots">
        {BOTS.map((b, i) => (
          <button key={b.key} className={`chess-bot pop-in ${level === i + 1 ? 'is-on' : ''}`} style={{ animationDelay: `${i * 0.05}s` }}
            onClick={() => { api.sfx('tap'); setLevel(i + 1); api.speak(`${api.t(b.key)}. ${api.t(`chessBotDesc${i + 1}` as DictKey)}`); }}>
            <span className="chess-bot__icon"><Emo e={b.icon} /></span>
            <b>{api.t(b.key)}</b>
            <small>{api.t(`chessBotDesc${i + 1}` as DictKey)}</small>
            {(wins[i] ?? 0) > 0 && <span className="chess-bot__wins">🏆 {wins[i]}</span>}
          </button>
        ))}
      </div>
      <h3>{api.t('chessPlayAs')}</h3>
      <div className="chess-colors">
        {(['w', 'b', 'random'] as const).map((c) => (
          <button key={c} className={color === c ? 'is-on' : ''} onClick={() => { api.sfx('tap'); setColor(c); }}>
            {c === 'random' ? <Emo e="🎲" /> : <PieceGlyph p={{ c, k: 'K' }} />}
            {api.t(c === 'w' ? 'chessWhite' : c === 'b' ? 'chessBlack' : 'chessRandom')}
          </button>
        ))}
      </div>
      <button className="big-btn big-btn--go" onClick={() => {
        api.sfx('pop');
        onStart({ mode: 'robot', level, human: color === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : color });
      }}>▶ {api.t('start')}</button>
    </div>
  );
}

// ---------------- Brettet ----------------
function Board({ state, flipped, selected, targets, last, hint, onTap, coords = true }: {
  state: State; flipped: boolean; selected: number | null; targets: Move[]; last?: Move | null; hint?: Move | null;
  onTap: (sq: number) => void; coords?: boolean;
}) {
  const checkSq = inCheck(state, state.turn) ? kingSquare(state, state.turn) : -1;
  return (
    <div className="chess-board">
      {Array.from({ length: 64 }, (_, i) => {
        const sq = flipped ? 63 - i : i;
        const r = rowOf(sq), c = colOf(sq);
        const p = state.b[sq];
        const t = targets.find((m) => m.to === sq);
        const cls = [
          'csq', (r + c) % 2 ? 'is-dark' : 'is-light',
          selected === sq && 'is-selected',
          last && (last.from === sq || last.to === sq) && 'is-last',
          hint && (hint.from === sq || hint.to === sq) && 'is-hint',
          checkSq === sq && 'is-check'
        ].filter(Boolean).join(' ');
        return (
          <button key={i} className={cls} onClick={() => onTap(sq)} aria-label={`${'abcdefgh'[c]}${8 - r}`}>
            {coords && i % 8 === 0 && <span className="csq__rank">{8 - r}</span>}
            {coords && i >= 56 && <span className="csq__file">{'abcdefgh'[c]}</span>}
            {p && <PieceGlyph p={p} />}
            {t && <span className={t.capture ? 'csq__ring' : 'csq__dot'} />}
          </button>
        );
      })}
    </div>
  );
}

/** Slåtte brikker for én farge (brikkene «by» har slått) og materiell-fordel */
function Captured({ state, by }: { state: State; by: Color }) {
  const victim = other(by);
  const left: Record<string, number> = {};
  state.b.forEach((p) => { if (p && p.c === victim) left[p.k] = (left[p.k] ?? 0) + 1; });
  const list: Kind[] = [];
  (['Q', 'R', 'B', 'N', 'P'] as Kind[]).forEach((k) => { for (let n = 0; n < Math.max(0, START_COUNT[k] - (left[k] ?? 0)); n++) list.push(k); });
  const val: Record<Kind, number> = { K: 0, Q: 9, R: 5, B: 3, N: 3, P: 1 };
  const mat = (c: Color) => state.b.reduce((s, p) => s + (p && p.c === c ? val[p.k] : 0), 0);
  const diff = mat(by) - mat(victim);
  return (
    <span className="chess-captured">
      {list.map((k, i) => <PieceGlyph key={i} p={{ c: victim, k }} />)}
      {diff > 0 && <b>+{diff}</b>}
    </span>
  );
}

type Result = 'win' | 'loss' | 'draw';

function Play({ api, game, onSave, onEnd }: {
  api: GameApi; game: NonNullable<Saved['game']>; onSave: (g: NonNullable<Saved['game']>) => void; onEnd: (r: Result, helped: boolean) => void;
}) {
  const { setup } = game;
  const [states, setStates] = useState<State[]>(game.states);
  const [moves, setMoves] = useState<(Move | null)[]>(() => game.states.map(() => null));
  const [helped, setHelped] = useState(game.helped);
  const [selected, setSelected] = useState<number | null>(null);
  const [hint, setHint] = useState<Move | null>(null);
  const [promo, setPromo] = useState<Move[] | null>(null);
  const [thinking, setThinking] = useState(false);
  const [msg, setMsg] = useState('');
  const [over, setOver] = useState<Outcome>(null);
  const [flip, setFlip] = useState(setup.mode === 'robot' && setup.human === 'b');
  const state = states[states.length - 1];
  const keys = useMemo(() => states.map(positionKey), [states]);
  const robotTurn = setup.mode === 'robot' && state.turn !== setup.human;
  const workerRef = useRef<Worker | null>(null);
  const reqId = useRef(0);
  const ended = useRef(false);

  // Robot-tråd
  useEffect(() => {
    try { workerRef.current = new Worker(new URL('./chess.worker.ts', import.meta.url), { type: 'module' }); } catch { workerRef.current = null; }
    return () => workerRef.current?.terminate();
  }, []);

  const turnText = (s: State) =>
    setup.mode === 'robot' ? (s.turn === setup.human ? api.t('chessYourTurn') : api.t('chessThinking')) : api.t(s.turn === 'w' ? 'chessWhiteTurn' : 'chessBlackTurn');

  // Etter hvert trekk: sjekk slutt, sjakk, og la roboten trekke
  useEffect(() => {
    const o = outcome(state, keys);
    if (o) {
      setOver(o);
      if (ended.current) return;
      ended.current = true;
      let text: string, result: Result;
      if (o.kind === 'mate') {
        if (setup.mode === 'robot') { result = o.winner === setup.human ? 'win' : 'loss'; text = api.t(result === 'win' ? 'chessYouWon' : 'chessYouLost'); }
        else { result = 'win'; text = `${api.t('chessMate')} ${api.t('playerWins', { p: api.t(o.winner === 'w' ? 'chessWhite' : 'chessBlack') })}`; }
      } else { result = 'draw'; text = o.kind === 'stalemate' ? api.t('chessStalemate') : api.t('draw'); }
      setMsg(text);
      api.sfx(result === 'loss' ? 'nope' : 'win');
      api.speak(text);
      onEnd(result, helped);
      return;
    }
    if (inCheck(state, state.turn)) { setMsg(api.t('chessCheck')); api.speak(api.t('chessCheck')); }
    else setMsg(turnText(state));
    if (states.length > 1) onSave({ setup, states, helped });
    if (robotTurn) {
      setThinking(true);
      const id = ++reqId.current;
      const t0 = performance.now();
      const apply = (m: Move | null) => {
        if (id !== reqId.current || !m) return;
        const wait = Math.max(0, 500 - (performance.now() - t0)); // litt «tenketid» så barnet ser hva som skjer
        setTimeout(() => { if (id === reqId.current) { setThinking(false); doMove(m); } }, wait);
      };
      if (workerRef.current) {
        workerRef.current.onmessage = (e: MessageEvent<{ id: number; move: Move | null }>) => { if (e.data.id === id) apply(e.data.move); };
        workerRef.current.postMessage({ id, state, level: setup.level });
      } else setTimeout(() => apply(bestMove(state, setup.level)), 50);
    }
  }, [states]); // eslint-disable-line react-hooks/exhaustive-deps

  function doMove(m: Move) {
    const s = states[states.length - 1];
    const next = makeMove(s, m);
    api.sfx(m.capture ? 'match' : m.castle ? 'sticker' : 'pop');
    setSelected(null);
    setHint(null);
    setStates((ss) => [...ss, next]);
    setMoves((ms) => [...ms, m]);
  }

  const targets = selected !== null ? legalMoves(state, selected) : [];

  function tap(sq: number) {
    if (over || thinking || robotTurn || promo) return;
    const p = state.b[sq];
    const t = targets.filter((m) => m.to === sq);
    if (t.length) {
      if (t.length > 1) { setPromo(t); api.speak(api.t('chessPromote')); return; } // forvandling: velg brikke
      doMove(t[0]);
      return;
    }
    if (p && p.c === state.turn) {
      if (selected === sq) { setSelected(null); return; }
      const lm = legalMoves(state, sq);
      setSelected(sq);
      api.sfx('tap');
      if (!lm.length) {
        const text = inCheck(state, state.turn) ? api.t('chessSaveKing') : api.t('chessCantMove');
        setMsg(text); api.speak(text);
      } else setMsg(turnText(state));
      return;
    }
    setSelected(null);
  }

  function undo() {
    if (thinking || over) return;
    // Mot robot: angre både robotens og ditt trekk
    const back = setup.mode === 'robot' ? (state.turn === setup.human ? 2 : 1) : 1;
    if (states.length - back < 1) return;
    api.sfx('flip');
    reqId.current++;
    setHelped(true);
    setSelected(null);
    setHint(null);
    setStates((ss) => ss.slice(0, ss.length - back));
    setMoves((ms) => ms.slice(0, ms.length - back));
  }

  function showHint() {
    if (thinking || over || robotTurn) return;
    const m = bestMove(state, 3);
    if (!m) return;
    api.sfx('sticker');
    setHelped(true);
    setSelected(m.from);
    setHint(m);
  }

  const top: Color = flip ? 'w' : 'b';
  const bottom = other(top);
  const label = (c: Color) => setup.mode === 'robot' && c !== setup.human
    ? <><Emo e={BOTS[setup.level - 1].icon} /> {api.t(BOTS[setup.level - 1].key)}</>
    : setup.mode === 'robot' ? <>🙂 {api.playerName || api.t(c === 'w' ? 'chessWhite' : 'chessBlack')}</> : <><PieceGlyph p={{ c, k: 'K' }} /> {api.t(c === 'w' ? 'chessWhite' : 'chessBlack')}</>;
  const player = (c: Color) => (
    <div className={`chess-player ${state.turn === c && !over ? 'is-turn' : ''} ${setup.mode === 'two' && c === 'b' && !flip ? '' : ''}`}>
      <span className="chess-player__name">{label(c)}{thinking && c === state.turn && <span className="chess-dots"><i /><i /><i /></span>}</span>
      <Captured state={state} by={c} />
    </div>
  );

  return (
    <div className="chess">
      {player(top)}
      <div className="chess__boardwrap">
        <Board state={state} flipped={flip} selected={selected} targets={targets} last={moves[moves.length - 1]} hint={hint} onTap={tap} />
        {promo && (
          <div className="chess-promo pop-in">
            <p>{api.t('chessPromote')}</p>
            <div>
              {promo.map((m) => (
                <button key={m.promo} onClick={() => { setPromo(null); doMove(m); }}><PieceGlyph p={{ c: state.turn, k: m.promo! }} /></button>
              ))}
            </div>
          </div>
        )}
      </div>
      {player(bottom)}
      <div className={`chess-msg ${over ? 'is-over' : ''} ${!over && inCheck(state, state.turn) ? 'is-check' : ''}`}>{msg}</div>
      <div className="chess-tools">
        <button onClick={undo} disabled={thinking || !!over || states.length < 2}><Emo e="↩️" /><small>{api.t('undo')}</small></button>
        <button onClick={showHint} disabled={thinking || !!over || robotTurn}><Emo e="💡" /><small>{api.t('hint')}</small></button>
        <button onClick={() => { api.sfx('tap'); setFlip(!flip); }}><Emo e="🔄" /><small>{api.t('chessFlip')}</small></button>
      </div>
    </div>
  );
}

// ---------------- Lær brikkene ----------------
const LEARN: { k: Kind | 'goal'; setup: [number, Piece][] }[] = [
  // Målet: dronningen går fra a7 til e7 – sjakk matt (kongen på e6 passer på dronningen)
  { k: 'goal', setup: [[4, { c: 'b', k: 'K' }], [20, { c: 'w', k: 'K' }], [8, { c: 'w', k: 'Q' }]] },
  { k: 'K', setup: [[35, { c: 'w', k: 'K' }]] },
  { k: 'Q', setup: [[35, { c: 'w', k: 'Q' }], [14, { c: 'b', k: 'P' }]] },
  { k: 'R', setup: [[35, { c: 'w', k: 'R' }], [11, { c: 'b', k: 'P' }]] },
  { k: 'B', setup: [[35, { c: 'w', k: 'B' }], [14, { c: 'b', k: 'P' }]] },
  { k: 'N', setup: [[35, { c: 'w', k: 'N' }], [26, { c: 'w', k: 'P' }], [27, { c: 'w', k: 'P' }], [28, { c: 'w', k: 'P' }], [34, { c: 'w', k: 'P' }], [36, { c: 'w', k: 'P' }], [42, { c: 'w', k: 'P' }], [43, { c: 'w', k: 'P' }], [44, { c: 'w', k: 'P' }]] },
  { k: 'P', setup: [[51, { c: 'w', k: 'P' }], [44, { c: 'b', k: 'N' }]] }
];

function Learn({ api }: { api: GameApi }) {
  const [idx, setIdx] = useState<number | null>(null);
  if (idx === null) {
    return (
      <div className="chess-learn-menu">
        {LEARN.map((l, i) => (
          <button key={l.k} className="chess-learn-card pop-in" style={{ animationDelay: `${i * 0.05}s` }} onClick={() => { api.sfx('pop'); setIdx(i); }}>
            <span>{l.k === 'goal' ? <Emo e="👑" /> : <PieceGlyph p={{ c: 'w', k: l.k }} />}</span>
            <b>{api.t(l.k === 'goal' ? 'chessGoalTitle' : (`piece_${l.k}` as DictKey))}</b>
          </button>
        ))}
      </div>
    );
  }
  return <LearnPiece key={idx} api={api} idx={idx} onNext={() => setIdx(idx + 1 < LEARN.length ? idx + 1 : null)} onMenu={() => setIdx(null)} />;
}

function LearnPiece({ api, idx, onNext, onMenu }: { api: GameApi; idx: number; onNext: () => void; onMenu: () => void }) {
  const lesson = LEARN[idx];
  const [state, setState] = useState<State>(() => customState(lesson.setup));
  const [steps, setSteps] = useState(0);
  const text = api.t(lesson.k === 'goal' ? 'chessGoal' : (`learn_${lesson.k}` as DictKey));
  useEffect(() => { api.speak(text); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Øvingsbrikken er den første i oppsettet (målet: dronningen som setter matt)
  const pieceSq = state.b.findIndex((p) => p && p.c === 'w' && p.k === (lesson.k === 'goal' ? 'Q' : lesson.k));
  const targets = lesson.k === 'goal' ? [] : legalMoves(state, pieceSq);
  const mateMove: Move | null = lesson.k === 'goal' && steps === 0 ? { from: 8, to: 12 } : null;
  function tap(sq: number) {
    if (lesson.k === 'goal') {
      if (steps === 0 && (sq === 8 || sq === 12)) {
        setState(makeMove(state, { from: 8, to: 12 }));
        setSteps(1);
        api.sfx('win');
        api.speak(api.t('chessMate'));
      }
      return;
    }
    const m = targets.find((t) => t.to === sq);
    if (!m) return;
    let next = makeMove(state, m.promo ? { ...m, promo: 'Q' } : m);
    next = { ...next, turn: 'w', ep: null };
    api.sfx(m.capture ? 'match' : 'pop');
    if (m.promo) api.speak(api.t('learnPromoted'));
    setState(next);
    setSteps(steps + 1);
  }
  return (
    <div className="chess chess--learn">
      <button className="chess-learn-text" onClick={() => api.speak(text)}>
        <b>{lesson.k === 'goal' ? <Emo e="👑" /> : <PieceGlyph p={{ c: 'w', k: lesson.k }} />} {api.t(lesson.k === 'goal' ? 'chessGoalTitle' : (`piece_${lesson.k}` as DictKey))}</b>
        <span>{text} <Emo e="🔊" /></span>
      </button>
      <div className="chess__boardwrap">
        <Board state={state} flipped={false} selected={lesson.k === 'goal' ? null : pieceSq} targets={targets} hint={mateMove} onTap={tap} />
      </div>
      <p className="chess-learn-try">{lesson.k === 'goal' ? (steps ? api.t('chessMate') : api.t('learnTapGlow')) : api.t('learnTry')}</p>
      <div className="chess-tools">
        <button onClick={() => { api.sfx('flip'); setState(customState(lesson.setup)); setSteps(0); }}><Emo e="🔁" /><small>{api.t('chessReset')}</small></button>
        <button onClick={onMenu}><Emo e="📖" /><small>{api.t('chessLearn')}</small></button>
        <button className="is-next" onClick={() => { api.sfx('pop'); onNext(); }} disabled={steps === 0}><Emo e="➡️" /><small>{api.t('next')}</small></button>
      </div>
    </div>
  );
}
