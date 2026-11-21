import { useActiveProfile } from '../storage/store';
import { useT } from '../i18n';
import { go } from '../router';
import { worldById, WORLDS, type WorldId } from '../data/worlds';
import { GAMES } from '../games/registry';
import { BackButton, Stars, TopBar } from '../components/ui';
import { playSfx } from '../audio/sound';
import { speak } from '../audio/speech';

const PLACEHOLDERS = ['🔢', '🧩', '🎵', '🚗', '🎈', '🧮'];

export function WorldScreen({ worldId }: { worldId: string }) {
  const t = useT();
  const profile = useActiveProfile();
  if (!WORLDS.some((w) => w.id === worldId) || !profile) {
    go('map');
    return null;
  }
  const world = worldById(worldId as WorldId);
  const games = GAMES.filter((g) => g.worlds.includes(world.id));

  return (
    <div className={`screen world-screen world-screen--${world.id}`} style={{ background: world.bg }}>
      <TopBar
        left={<BackButton to={() => go('map')} />}
        title={
          <h1 className="world-title">
            {world.icon} {t(world.nameKey)} <small>{t(world.ageKey)}</small>
          </h1>
        }
      />
      <div className="game-grid">
        {games.map((g) => {
          const stats = profile.games[`${g.id}:${world.id}`];
          return (
            <button
              key={g.id}
              className="game-card pop-in"
              style={{ ['--c' as string]: g.color }}
              onClick={() => {
                playSfx('pop');
                speak(t(g.titleKey));
                go(`play/${g.id}/${world.id}`);
              }}
            >
              <span className="game-card__icon">{g.icon}</span>
              <span className="game-card__title">{t(g.titleKey)}</span>
              <Stars count={stats?.bestStars ?? 0} />
            </button>
          );
        })}
        {PLACEHOLDERS.slice(0, 6 - games.length).map((icon, i) => (
          <div key={i} className="game-card game-card--soon" aria-label={t('comingSoon')}>
            <span className="game-card__icon">{icon}</span>
            <span className="game-card__title">{t('comingSoon')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
