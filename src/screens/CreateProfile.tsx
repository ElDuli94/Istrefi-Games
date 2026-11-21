import { useEffect, useState } from 'react';
import { actions, useStore } from '../storage/store';
import { useT } from '../i18n';
import { go } from '../router';
import { AVATARS, AVATAR_KEYS } from '../data/avatars';
import { WORLDS, type WorldId } from '../data/worlds';
import { Avatar, BackButton, TopBar } from '../components/ui';
import { MascotSays } from '../components/Mascot';
import { playSfx } from '../audio/sound';
import { speak } from '../audio/speech';

export function CreateProfile() {
  const t = useT();
  const hasProfiles = useStore((s) => s.profiles.length > 0);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [world, setWorld] = useState<WorldId | null>(null);
  const [name, setName] = useState('');
  const prompt = !avatar ? t('chooseAnimal') : !world ? t('chooseAge') : t('create');

  useEffect(() => {
    speak(prompt);
  }, [prompt]);

  function finish() {
    if (!avatar || !world) return;
    playSfx('win');
    actions.createProfile({ avatar, world, name: name.trim() });
    go('map', { replace: true });
  }

  return (
    <div className="screen screen--sky create-profile">
      <TopBar left={hasProfiles ? <BackButton to={() => go('')} /> : undefined} />
      <MascotSays text={prompt} onTap={() => speak(prompt)} />

      <div className="avatar-picker">
        {AVATAR_KEYS.map((k) => (
          <button
            key={k}
            className={`avatar-option ${avatar === k ? 'is-selected' : ''}`}
            onClick={() => { playSfx('pop'); setAvatar(k); }}
            aria-label={k}
            style={{ ['--c' as string]: AVATARS[k].color }}
          >
            <Avatar avatar={k} size={72} />
          </button>
        ))}
      </div>

      {avatar && (
        <div className="world-picker pop-in">
          {WORLDS.map((w) => (
            <button
              key={w.id}
              className={`world-option ${world === w.id ? 'is-selected' : ''}`}
              style={{ background: w.bg }}
              onClick={() => { playSfx('pop'); setWorld(w.id); speak(t(w.ageKey)); }}
            >
              <span className="world-option__icon">{w.icon}</span>
              <span className="world-option__age">{t(w.ageKey)}</span>
            </button>
          ))}
        </div>
      )}

      {avatar && world && (
        <div className="create-finish pop-in">
          <input
            className="text-input"
            placeholder={t('nameOptional')}
            value={name}
            maxLength={16}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && finish()}
          />
          <button className="big-btn big-btn--go" onClick={finish}>✔ {t('create')}</button>
        </div>
      )}
    </div>
  );
}
