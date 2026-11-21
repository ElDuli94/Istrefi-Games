/**
 * GameHost: rammen rundt alle spill. Laster spillet, gir det GameApi,
 * måler spilletid, lagrer resultat og viser feiring + klistremerke.
 */
import { Emo } from '../components/Emo';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { actions, getState, useActiveProfile, useStore } from '../storage/store';
import { useT } from '../i18n';
import { go } from '../router';
import { gameById } from '../games/registry';
import { WORLDS, type WorldId } from '../data/worlds';
import { coinsFor } from '../data/shop';
import type { GameApi, GameResult } from '../games/types';
import { BackButton, Stars, TopBar } from '../components/ui';
import { Mascot } from '../components/Mascot';
import { LivelyAvatar } from '../components/LivelyAvatar';
import { playSfx } from '../audio/sound';
import { speak } from '../audio/speech';

export function GameHost({ gameId, worldId }: { gameId: string; worldId: string }) {
  const t = useT();
  const lang = useStore((s) => s.settings.lang);
  const profile = useActiveProfile();
  const game = gameById(gameId);
  const valid = !!game && !!profile && WORLDS.some((w) => w.id === worldId) && game.worlds.includes(worldId as WorldId);
  const world = worldId as WorldId;
  const statsKey = `${gameId}:${worldId}`;

  const [round, setRound] = useState(0);
  const [result, setResult] = useState<(GameResult & { earned: number }) | null>(null);
  const startedAt = useRef(Date.now());
  const finished = useRef(false);

  useEffect(() => {
    if (!valid) go('map');
  }, [valid]);

  // Lagre spilletid også hvis barnet avslutter midt i et spill.
  useEffect(() => {
    startedAt.current = Date.now();
    finished.current = false;
    return () => {
      const seconds = (Date.now() - startedAt.current) / 1000;
      if (!finished.current && profile && seconds > 5) {
        actions.recordGame(profile.id, statsKey, { won: false, stars: 0, seconds });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const api = useMemo<GameApi>(() => ({
    lang,
    playerName: profile?.name ?? '',
    t,
    sfx: playSfx,
    speak,
    loadData: <T,>() => getState().profiles.find((p) => p.id === profile?.id)?.games[statsKey]?.data as T | undefined,
    saveData: (data) => profile && actions.saveGameData(profile.id, statsKey, data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [lang, profile?.id, profile?.name, statsKey]);

  if (!valid || !game || !profile) return null;
  const Game = game.component;

  function handleFinish(r: GameResult) {
    if (finished.current || !profile) return;
    finished.current = true;
    const seconds = (Date.now() - startedAt.current) / 1000;
    actions.recordGame(profile.id, statsKey, { ...r, seconds });
    const earned = coinsFor(r);
    if (earned > 0) actions.addCoins(profile.id, earned);
    setResult({ ...r, earned });
    playSfx(r.won ? 'win' : 'pop');
    speak(r.won ? t('wellDone') : t('goodTry'));
    if (earned > 0) setTimeout(() => playSfx('sticker'), 1200);
  }

  function again() {
    setResult(null);
    setRound((n) => n + 1);
  }

  return (
    <div className="screen game-host" style={{ background: WORLDS.find((w) => w.id === world)!.bg }}>
      <TopBar left={<BackButton to={() => go(`world/${world}`)} />} title={<h1 className="game-title"><Emo e={game.icon} /> {t(game.titleKey)}</h1>} />
      <main className="game-host__stage">
        <Suspense fallback={<div className="loading"><Mascot size={100} className="bob" /></div>}>
          <Game key={round} world={world} players={1} api={api} onFinish={handleFinish} />
        </Suspense>
      </main>

      {result && (
        <div className="celebrate" role="dialog">
          <div className="confetti" aria-hidden>
            {Array.from({ length: 40 }, (_, i) => (
              <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 10) * 0.12}s`, background: ['#ff006e', '#ffd60a', '#06d6a0', '#4cc9f0', '#8338ec'][i % 5] }} />
            ))}
          </div>
          <div className="celebrate__card pop-in">
            <div className="celebrate__duo">
              <Mascot size={110} mood="cheer" className="bounce" />
              <LivelyAvatar profile={profile} size={96} mode={result.won ? 'dance' : 'idle'} />
            </div>
            <h2>{result.won ? t('wellDone') : t('goodTry')}</h2>
            <Stars count={result.stars} size={2.4} />
            {result.earned > 0 && (
              <div className="celebrate__coins">
                <span className="coin-burst"><Emo e="🪙" /></span>
                <p>{t('youEarned', { coins: result.earned })}</p>
              </div>
            )}
            <div className="celebrate__actions">
              <button className="big-btn big-btn--go" onClick={() => { playSfx('tap'); again(); }}>🔁 {t('playAgain')}</button>
              <button className="big-btn" onClick={() => { playSfx('tap'); go(`world/${world}`); }}>🏝️</button>
              <button className="big-btn" onClick={() => { playSfx('tap'); go('shop'); }}>🛍️</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
