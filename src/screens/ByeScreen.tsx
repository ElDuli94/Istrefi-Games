import { useEffect } from 'react';
import { useActiveProfile } from '../storage/store';
import { useT } from '../i18n';
import { go } from '../router';
import { Mascot } from '../components/Mascot';
import { LivelyAvatar } from '../components/LivelyAvatar';
import { stopMusic, playSfx } from '../audio/sound';
import { speak } from '../audio/speech';

// «Ha det!»-skjerm. En nettside kan ikke lukke seg selv på iPad,
// så vi stopper lyd og viser en rolig avslutning i stedet.
export function ByeScreen() {
  const t = useT();
  const profile = useActiveProfile();
  const title = t('byeTitle', { name: profile?.name ?? '' }).replace(/\s+!/, '!').replace(/,\s*!/, '!');

  useEffect(() => {
    stopMusic();
    playSfx('sticker');
    speak(`${title} ${t('byeText')}`);
    // Fungerer bare i noen nettlesere (f.eks. når appen er åpnet som eget vindu på PC).
    const id = setTimeout(() => window.close(), 4000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="screen screen--sky bye-screen">
      <div className="clouds" aria-hidden />
      <div className="bye-card pop-in">
        <div className="celebrate__duo">
          <Mascot size={130} mood="cheer" className="wave" />
          {profile && <LivelyAvatar profile={profile} size={100} mode="wave" interactive={false} />}
        </div>
        <h1>{title} 👋</h1>
        <p>{t('byeText')}</p>
        <button className="big-btn big-btn--go" onClick={() => { playSfx('pop'); go(''); }}>▶ {t('playMore')}</button>
        <small>{t('byeHint')}</small>
      </div>
    </div>
  );
}
