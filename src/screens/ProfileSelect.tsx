import { actions, useStore } from '../storage/store';
import { useT } from '../i18n';
import { go } from '../router';
import { AvatarView } from '../components/AvatarView';
import { Mascot } from '../components/Mascot';
import { playSfx } from '../audio/sound';
import { speak } from '../audio/speech';
import { useEffect } from 'react';

export function ProfileSelect() {
  const t = useT();
  const profiles = useStore((s) => s.profiles);

  useEffect(() => {
    if (profiles.length === 0) go('new');
  }, [profiles.length]);

  return (
    <div className="screen screen--sky profile-select">
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
            <AvatarView avatar={p.avatar} equipped={p.equipped} size={110} />
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
