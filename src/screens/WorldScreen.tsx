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

const AMBIENT: Record<WorldId, Ambient> = { tiny: 'meadow', small: 'forest', mid: 'mountain', big: 'city' };

/** Hyllene i den rekkefølgen de vises */
const GROUPS: { id: GameGroup; icon: string; key: DictKey }[] = [
  { id: 'letters', icon: '🔤', key: 'group_letters' },
  { id: 'numbers', icon: '🔢', key: 'group_numbers' },
  { id: 'create', icon: '🎨', key: 'group_create' },
  { id: 'explore', icon: '🐾', key: 'group_explore' },
  { id: 'action', icon: '🎮', key: 'group_action' },
  { id: 'together', icon: '👫', key: 'group_together' }
];

export function WorldScreen({ worldId }: { worldId: string }) {
  const t = useT();
  const profile = useActiveProfile();
  useAmbient(AMBIENT[worldId as WorldId] ?? 'none');
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

  const shelf = (key: string, icon: string, title: string, list: GameDefinition[]) =>
    list.length > 0 && (
      <section className="shelf" key={key}>
        <h2 className="shelf__title"><Emo e={icon} /> {title}</h2>
        <div className="shelf__row">{list.map(card)}</div>
      </section>
    );

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
        {shelf('fav', '❤️', t('myFavorites'), favorites)}
        {shelf('recent', '⭐', t('recentlyPlayed'), recent)}
        {GROUPS.map((gr) => shelf(gr.id, gr.icon, t(gr.key), games.filter((g) => g.group === gr.id)))}
      </div>
    </div>
  );
}
