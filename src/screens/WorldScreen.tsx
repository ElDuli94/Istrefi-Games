import { LiveBackdrop } from '../components/LiveBackdrop';
import { useAmbient, type Ambient } from '../audio/ambient';
import { Emo } from '../components/Emo';
import { useActiveProfile } from '../storage/store';
import { useT } from '../i18n';
import { go } from '../router';
import { worldById, WORLDS, type WorldId } from '../data/worlds';
import { GAMES } from '../games/registry';
import { BackButton, Stars, TopBar } from '../components/ui';
import { playSfx } from '../audio/sound';
import { speak } from '../audio/speech';

const AMBIENT: Record<WorldId, Ambient> = { tiny: 'meadow', small: 'forest', mid: 'mountain', big: 'city' };
const PLACEHOLDERS = ['🔢', '🧩', '🎵', '🚗', '🎈', '🧮'];

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
  // De 3 sist spilte spillene i denne verdenen
  const recent = games
    .map((g) => ({ g, last: profile.games[`${g.id}:${world.id}`]?.lastPlayed ?? 0 }))
    .filter((x) => x.last > 0)
    .sort((x, y) => y.last - x.last)
    .slice(0, 3)
    .map((x) => x.g);

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
      {recent.length > 0 && (
        <div className="recent">
          <span className="recent__label"><Emo e="⭐" /> {t('recentlyPlayed')}</span>
          <div className="recent__row">
            {recent.map((g) => (
              <button
                key={g.id}
                className="recent__chip pop-in"
                style={{ ['--c' as string]: g.color }}
                onClick={() => { playSfx('pop'); speak(t(g.titleKey)); go(`play/${g.id}/${world.id}`); }}
                aria-label={t(g.titleKey)}
              >
                <Emo e={g.icon} /> <span>{t(g.titleKey)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
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
              <span className="game-card__icon"><Emo e={g.icon} /></span>
              <span className="game-card__title">{t(g.titleKey)}</span>
              <Stars count={stats?.bestStars ?? 0} />
            </button>
          );
        })}
        {PLACEHOLDERS.slice(0, Math.max(0, 6 - games.length)).map((icon, i) => (
          <div key={i} className="game-card game-card--soon" aria-label={t('comingSoon')}>
            <span className="game-card__icon"><Emo e={icon} /></span>
            <span className="game-card__title">{t('comingSoon')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
