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
import { useEffect, useState } from 'react';
import { DrawerFace, type FaceKind } from '../components/DrawerFace';

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
const FACES: Record<GameGroup, FaceKind> = { letters: 'dots', numbers: 'happy', create: 'wink', explore: 'lashes', action: 'big', together: 'sleepy' };

export function WorldScreen({ worldId }: { worldId: string }) {
  const t = useT();
  const profile = useActiveProfile();
  useAmbient(AMBIENT[worldId as WorldId] ?? 'none');
  // Hvilken skuff som er åpen (huskes mens appen er åpen)
  const [openDrawer, setOpenDrawer] = useState<GameGroup | null>(() => {
    try { return (sessionStorage.getItem(drawerKey(worldId)) as GameGroup) || null; } catch { return null; }
  });
  const [pulling, setPulling] = useState<GameGroup | null>(null);
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
        <div className="cabinet">
          {GROUPS.filter((gr) => games.some((g) => g.group === gr.id)).map((gr, k) => {
            const list = games.filter((g) => g.group === gr.id);
            const hasNew = list.some((g) => !stats(g));
            return (
              <button
                key={gr.id}
                className={`cdrawer ${pulling === gr.id ? 'is-pulling' : ''}`}
                style={{ ['--dc' as string]: gr.color, animationDelay: `${k * 0.06}s` }}
                aria-label={t(gr.key)}
                onClick={() => {
                  if (pulling) return;
                  playSfx('flip');
                  speak(t(gr.key));
                  setPulling(gr.id);
                  // Skuffen trekkes ut, så spretter spillene opp
                  setTimeout(() => { setOpenDrawer(gr.id); setPulling(null); playSfx('pop'); }, 380);
                }}
              >
                <span className="cdrawer__box">
                  <DrawerFace face={FACES[gr.id]} dark={k % 2 === 1} />
                  {hasNew && <span className="cdrawer__new">{t('newBadge')}</span>}
                </span>
                <span className="cdrawer__tag"><Emo e={gr.icon} /> {t(gr.key)} <b>{list.length}</b></span>
              </button>
            );
          })}
        </div>
      </div>
      {openDrawer && (() => {
        const gr = GROUPS.find((x) => x.id === openDrawer)!;
        const list = games.filter((g) => g.group === gr.id);
        if (!list.length) return null;
        const close = () => { playSfx('tap'); setOpenDrawer(null); };
        return (
          <div className="drawer-pop" onClick={close} role="dialog" aria-label={t(gr.key)} style={{ ['--dc' as string]: gr.color }}>
            <div className="drawer-pop__inner" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-pop__head">
                <h2><Emo e={gr.icon} /> {t(gr.key)}</h2>
                <button className="drawer-pop__close" onClick={close} aria-label={t('back')}>✖</button>
              </div>
              <div className="drawer-pop__games">
                {list.map((g, k) => (
                  <div key={g.id} className="drawer-pop__fly" style={{ animationDelay: `${0.12 + k * 0.08}s`, ['--k' as string]: k }}>
                    {card(g, k)}
                  </div>
                ))}
              </div>
              <div className="drawer-pop__drawer" aria-hidden>
                <span className="drawer-pop__inside" />
                <span className="drawer-pop__front"><DrawerFace face={FACES[gr.id]} /></span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
