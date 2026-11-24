import { LiveBackdrop } from '../components/LiveBackdrop';
import { useAmbient, type Ambient } from '../audio/ambient';
import { Emo } from '../components/Emo';
import { actions, useActiveProfile } from '../storage/store';
import { useT } from '../i18n';
import { go } from '../router';
import { worldById, WORLDS, type WorldId } from '../data/worlds';
import { GAMES } from '../games/registry';
import type { GameDefinition, GameGroup } from '../games/types';
import type { DictKey } from '../i18n/no';
import { BackButton, Stars, TopBar } from '../components/ui';
import { playSfx } from '../audio/sound';
import { speak } from '../audio/speech';
import { useEffect, useRef, useState } from 'react';

const AMBIENT: Record<WorldId, Ambient> = { tiny: 'meadow', small: 'forest', mid: 'mountain', big: 'city' };

/** Hyllene i den rekkefølgen de vises */
const GROUPS: { id: GameGroup; icon: string; key: DictKey; color: string }[] = [
  { id: 'letters', icon: '🔤', key: 'group_letters', color: '#ff595e' },
  { id: 'numbers', icon: '🔢', key: 'group_numbers', color: '#1982c4' },
  { id: 'create', icon: '🎨', key: 'group_create', color: '#ffb703' },
  { id: 'explore', icon: '🐾', key: 'group_explore', color: '#43aa8b' },
  { id: 'action', icon: '🎮', key: 'group_action', color: '#7b2cbf' },
  { id: 'together', icon: '👫', key: 'group_together', color: '#fb5607' }
];
const drawerKey = (w: string) => `istrefi-drawer-${w}`;

export function WorldScreen({ worldId }: { worldId: string }) {
  const t = useT();
  const profile = useActiveProfile();
  useAmbient(AMBIENT[worldId as WorldId] ?? 'none');
  // Hvilken skuff som er åpen (huskes mens appen er åpen)
  const [openDrawer, setOpenDrawer] = useState<GameGroup | null>(() => {
    try { return (sessionStorage.getItem(drawerKey(worldId)) as GameGroup) || null; } catch { return null; }
  });
  const drawerRefs = useRef<Partial<Record<GameGroup, HTMLElement | null>>>({});
  useEffect(() => {
    try { if (openDrawer) sessionStorage.setItem(drawerKey(worldId), openDrawer); else sessionStorage.removeItem(drawerKey(worldId)); } catch { /* ignorer */ }
  }, [openDrawer, worldId]);
  if (!WORLDS.some((w) => w.id === worldId) || !profile) {
    go('map');
    return null;
  }
  const world = worldById(worldId as WorldId);
  const games = GAMES.filter((g) => g.worlds.includes(world.id));
  const stats = (g: GameDefinition) => profile.games[`${g.id}:${world.id}`];
  const favorites = (profile.favorites ?? []).map((id) => games.find((g) => g.id === id)).filter(Boolean) as GameDefinition[];
  // De 4 sist spilte spillene i denne verdenen
  const recent = games
    .filter((g) => (stats(g)?.lastPlayed ?? 0) > 0)
    .sort((a, b) => (stats(b)!.lastPlayed ?? 0) - (stats(a)!.lastPlayed ?? 0))
    .slice(0, 4);

  const open = (g: GameDefinition) => {
    playSfx('pop');
    speak(t(g.titleKey));
    go(`play/${g.id}/${world.id}`);
  };

  const card = (g: GameDefinition, k: number) => {
    const isFav = (profile.favorites ?? []).includes(g.id);
    const isNew = !stats(g);
    return (
      <div key={g.id} className="shelf-card pop-in" style={{ ['--c' as string]: g.color, animationDelay: `${Math.min(k, 6) * 0.04}s` }}>
        <button className="game-card" onClick={() => open(g)}>
          <span className="game-card__icon"><Emo e={g.icon} /></span>
          <span className="game-card__title">{t(g.titleKey)}</span>
          <Stars count={stats(g)?.bestStars ?? 0} />
        </button>
        {isNew && <span className="shelf-card__new">{t('newBadge')}</span>}
        <button
          className={`shelf-card__fav ${isFav ? 'is-on' : ''}`}
          aria-label={isFav ? t('unfavorite') : t('favorite')}
          aria-pressed={isFav}
          onClick={() => {
            playSfx(isFav ? 'tap' : 'sticker');
            actions.toggleFavorite(profile.id, g.id);
            if (!isFav) speak(t('addedFavorite'));
          }}
        >
          <Emo e={isFav ? '❤️' : '🤍'} />
        </button>
      </div>
    );
  };


  return (
    <div className={`screen world-screen world-screen--${world.id}`} style={{ background: world.bg }}>
      <LiveBackdrop kind={world.id} />
      <TopBar
        left={<BackButton to={() => go('map')} />}
        title={
          <h1 className="world-title">
            <Emo e={world.icon} /> {t(world.nameKey)} <small>{t(world.ageKey)}</small>
          </h1>
        }
      />
      <div className="shelves">
        {(() => {
          // Én kompakt rad: favoritter først, så sist spilte (uten dobbelt)
          const quick = [...favorites, ...recent.filter((g) => !favorites.includes(g))].slice(0, 8);
          return quick.length > 0 && (
            <section className="shelf shelf--quick">
              <h2 className="shelf__title"><Emo e={favorites.length ? '❤️' : '⭐'} /> {favorites.length ? t('myFavorites') : t('recentlyPlayed')}{favorites.length > 0 && recent.length > 0 && <> + <Emo e="⭐" /></>}</h2>
              <div className="shelf__row">{quick.map(card)}</div>
            </section>
          );
        })()}
        <div className="dresser">
          <div className="dresser__top" aria-hidden />
          {GROUPS.map((gr) => {
            const list = games.filter((g) => g.group === gr.id);
            if (!list.length) return null;
            const isOpen = openDrawer === gr.id;
            const hasNew = list.some((g) => !stats(g));
            return (
              <section key={gr.id} className={`drawer ${isOpen ? 'is-open' : ''}`} style={{ ['--dc' as string]: gr.color }} ref={(el) => { drawerRefs.current[gr.id] = el; }}>
                <button
                  className="drawer__front"
                  aria-expanded={isOpen}
                  onClick={() => {
                    playSfx(isOpen ? 'tap' : 'flip');
                    if (!isOpen) {
                      speak(t(gr.key));
                      setTimeout(() => drawerRefs.current[gr.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 120);
                    }
                    setOpenDrawer(isOpen ? null : gr.id);
                  }}
                >
                  <span className="drawer__icon"><Emo e={gr.icon} /></span>
                  <span className="drawer__label">{t(gr.key)}</span>
                  <span className="drawer__count">{list.length}</span>
                  {hasNew && <span className="drawer__new">{t('newBadge')}</span>}
                  <span className="drawer__knob" aria-hidden />
                </button>
                {isOpen && (
                  <div className="drawer__tray">
                    <div className="drawer__games">{list.map(card)}</div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
