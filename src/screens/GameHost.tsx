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
import { BackButton, RoundButton, Stars, TopBar } from '../components/ui';
import type { DictKey } from '../i18n/no';
import { Mascot } from '../components/Mascot';
import { Shqipo3DView } from '../components/Shqipo3DView';
import { LivelyAvatar } from '../components/LivelyAvatar';
import { playSfx, startMusic, stopMusic } from '../audio/sound';
import { speak, stopSpeaking } from '../audio/speech';

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
  const backRef = useRef<(() => void) | null>(null);
  const [toast, setToast] = useState<{ id: number; coins: number } | null>(null);
  const settings = useStore((s) => s.settings);
  const helpKey = `istrefi-help-${profile?.id}`;
  const [showHelp, setShowHelp] = useState(() => {
    try { return !(JSON.parse(localStorage.getItem(helpKey) || '[]') as string[]).includes(gameId); } catch { return true; }
  });
  const helpText = t(`help_${gameId}` as DictKey);

  // Les forklaringen høyt når den vises
  useEffect(() => {
    if (showHelp && valid) speak(helpText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHelp]);

  function closeHelp() {
    playSfx('pop');
    setShowHelp(false);
    try {
      const seen = JSON.parse(localStorage.getItem(helpKey) || '[]') as string[];
      if (!seen.includes(gameId)) localStorage.setItem(helpKey, JSON.stringify([...seen, gameId]));
    } catch { /* ignorer */ }
  }

  function toggleSound() {
    const on = !(settings.sfx || settings.music);
    actions.updateSettings({ sfx: on, music: on, voice: on, nature: on });
    if (on) { startMusic(); playSfx('pop'); } else { stopMusic(); stopSpeaking(); }
  }

  function goBack() {
    playSfx('tap');
    if (backRef.current) backRef.current();
    else go(`world/${world}`);
  }

  useEffect(() => {
    if (!valid) go('map');
    else if (profile) actions.touchGame(profile.id, statsKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    saveData: (data) => profile && actions.saveGameData(profile.id, statsKey, data),
    setBack: (fn) => { backRef.current = fn; },
    reward: (coins) => {
      if (!profile) return;
      if (coins > 0) actions.addCoins(profile.id, coins);
      playSfx('sticker');
      speak(t('wellDone'));
      const id = Date.now();
      setToast({ id, coins });
      setTimeout(() => setToast((x) => (x && x.id === id ? null : x)), 2400);
    }
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
    backRef.current = null;
    setResult(null);
    setRound((n) => n + 1);
  }

  return (
    <div className="screen game-host" style={{ background: WORLDS.find((w) => w.id === world)!.bg }}>
      <TopBar
        left={<BackButton to={goBack} />}
        title={<h1 className="game-title"><Emo e={game.icon} /> {t(game.titleKey)}</h1>}
        right={
          <>
            <RoundButton icon={settings.sfx || settings.music ? '🔊' : '🔇'} label={settings.sfx || settings.music ? t('soundOff') : t('soundOn')} onClick={toggleSound} />
            <RoundButton icon="❓" label={t('howToPlay')} onClick={() => setShowHelp(true)} color="#ffd60a" />
          </>
        }
      />
      <main className="game-host__stage">
        <Suspense fallback={<div className="loading"><Mascot size={100} className="bob" /></div>}>
          <Game key={round} world={world} players={1} api={api} onFinish={handleFinish} />
        </Suspense>
      </main>

      {toast && (
        <div className="reward-toast" key={toast.id} aria-live="polite">
          <div className="confetti" aria-hidden>
            {Array.from({ length: 24 }, (_, i) => (
              <i key={i} style={{ left: `${(i * 41) % 100}%`, animationDelay: `${(i % 8) * 0.08}s`, background: ['#ff006e', '#ffd60a', '#06d6a0', '#4cc9f0', '#8338ec'][i % 5] }} />
            ))}
          </div>
          <div className="reward-toast__card pop-in">
            <Mascot size={56} mood="cheer" />
            <b>{t('wellDone')}</b>
            {toast.coins > 0 && <span>+{toast.coins} <Emo e="🪙" /></span>}
          </div>
        </div>
      )}

      {showHelp && !result && (
        <div className="help-overlay" role="dialog" onClick={closeHelp}>
          <div className="help-card pop-in" onClick={(e) => e.stopPropagation()}>
            <span className="help-card__icon"><Emo e={game.icon} /></span>
            <h2>{t('howToPlay')}</h2>
            <button className="help-card__text" onClick={() => speak(helpText)}>
              <Mascot size={64} /> <span>{helpText} <Emo e="🔊" /></span>
            </button>
            <button className="big-btn big-btn--go help-card__start" onClick={closeHelp}>▶ {t('start')}</button>
          </div>
        </div>
      )}

      {result && (
        <div className="celebrate" role="dialog">
          <div className="confetti" aria-hidden>
            {Array.from({ length: 40 }, (_, i) => (
              <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 10) * 0.12}s`, background: ['#ff006e', '#ffd60a', '#06d6a0', '#4cc9f0', '#8338ec'][i % 5] }} />
            ))}
          </div>
          <div className="celebrate__card pop-in">
            <div className="celebrate__duo">
              <Shqipo3DView size={130} fallback={<Mascot size={110} mood="cheer" className="bounce" />} />
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
