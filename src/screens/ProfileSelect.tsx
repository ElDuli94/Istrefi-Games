import { LiveBackdrop } from '../components/LiveBackdrop';
import { actions, getState, useStore } from '../storage/store';
import { useT } from '../i18n';
import { go } from '../router';
import { LivelyAvatar } from '../components/LivelyAvatar';
import { Mascot } from '../components/Mascot';
import { playSfx } from '../audio/sound';
import { speak } from '../audio/speech';
import { useEffect } from 'react';
import { preloadIsland3D } from '../three/support';

export function ProfileSelect() {
  const t = useT();
  const profiles = useStore((s) => s.profiles);

  // Last 3D-øya i bakgrunnen mens barnet velger profil
  useEffect(() => { if (getState().settings.map3d) preloadIsland3D(); }, []);
  useEffect(() => {
    if (profiles.length === 0) go('new');
  }, [profiles.length]);

  return (
    <div className="screen screen--sky profile-select">
      <LiveBackdrop kind="sky" />
      <div className="clouds" aria-hidden />
      <div className="logo">
        <Mascot size={110} className="bob" />
        <h1 className="logo__text">Istrefi <span>Games</span></h1>
      </div>
      <h2 className="say" onClick={() => speak(t('whoIsPlaying'))}>{t('whoIsPlaying')}</h2>
      <div className="profile-grid">
        {profiles.map((p) => (
          <button
            key={p.id}
            className="profile-card pop-in"
            onClick={() => {
              playSfx('pop');
              actions.selectProfile(p.id);
              go('map');
            }}
          >
            <LivelyAvatar profile={p} size={110} interactive={false} />
            {p.name && <span className="profile-card__name">{p.name}</span>}
          </button>
        ))}
        <button className="profile-card profile-card--new pop-in" onClick={() => { playSfx('tap'); go('new'); }}>
          <span className="avatar avatar--plus" style={{ width: 110, height: 110 }}>＋</span>
          <span className="profile-card__name">{t('newPlayer')}</span>
        </button>
      </div>
      <div className="profile-footer">
        <button className="grown-up-link" onClick={() => go('parents/profiles')}>✏️ {t('editProfiles')}</button>
        <button className="grown-up-link" onClick={() => go('parents')}>🔒 {t('parents')}</button>
        <button className="grown-up-link" onClick={() => go('bye')}>🚪 {t('exit')}</button>
      </div>
    </div>
  );
}
