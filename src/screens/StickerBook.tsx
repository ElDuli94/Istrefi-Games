import { useActiveProfile } from '../storage/store';
import { useT } from '../i18n';
import { go } from '../router';
import { STICKERS } from '../data/stickers';
import { BackButton, TopBar } from '../components/ui';
import { MascotSays } from '../components/Mascot';
import { playSfx } from '../audio/sound';
import { speak } from '../audio/speech';

export function StickerBook() {
  const t = useT();
  const profile = useActiveProfile();
  if (!profile) {
    go('');
    return null;
  }
  const owned = new Set(profile.stickers);
  const newest = profile.stickers[profile.stickers.length - 1];
  const count = t('stickerCount', { count: owned.size, total: STICKERS.length });

  return (
    <div className="screen sticker-screen">
      <TopBar left={<BackButton to={() => go('map')} />} title={<h1>📒 {t('stickerBookTitle')}</h1>} />
      <MascotSays text={owned.size ? count : t('stickerHint')} onTap={() => speak(owned.size ? count : t('stickerHint'))} size={70} />
      <div className="sticker-book">
        {STICKERS.map((s) => (
          <button
            key={s.id}
            className={`sticker-slot ${owned.has(s.id) ? 'is-owned' : ''} ${s.id === newest ? 'is-new' : ''}`}
            onClick={() => owned.has(s.id) && playSfx('pop')}
            aria-label={owned.has(s.id) ? s.emoji : '?'}
          >
            {owned.has(s.id) ? s.emoji : '?'}
          </button>
        ))}
      </div>
    </div>
  );
}
