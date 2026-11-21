import { useEffect } from 'react';
import { useActiveProfile } from '../storage/store';
import { useT } from '../i18n';
import { go } from '../router';
import { WORLDS } from '../data/worlds';
import { RoundButton, TopBar } from '../components/ui';
import { AvatarView } from '../components/AvatarView';
import { CoinChip } from './Shop';
import { MascotSays } from '../components/Mascot';
import { playSfx } from '../audio/sound';
import { speak } from '../audio/speech';

function IslandArt() {
  return (
    <svg viewBox="0 0 100 100" className="island__art" aria-hidden>
      <defs>
        <radialGradient id="grass" cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#9ef01a" />
          <stop offset="1" stopColor="#38b000" />
        </radialGradient>
      </defs>
      {/* Skum og strand */}
      <path className="island__foam" d="M50 4 C74 3 95 18 96 46 C97 74 80 96 50 96 C22 97 4 78 4 50 C3 22 24 5 50 4 Z" fill="#fff" opacity=".55" />
      <path d="M50 7 C72 6 92 20 93 46 C94 72 78 93 50 93 C24 94 7 76 7 50 C6 24 26 8 50 7 Z" fill="#ffe8a3" />
      <path d="M50 12 C70 11 88 24 88 46 C89 70 74 88 50 88 C27 88 12 72 12 50 C11 28 29 13 50 12 Z" fill="url(#grass)" />
      {/* Stier */}
      <path d="M27 66 Q50 50 72 64 M30 30 Q50 45 70 27 M50 48 L50 48" stroke="#ffe8a3" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeDasharray="0.1 4" />
      {/* Fjell (oppe til venstre) */}
      <path d="M16 40 L28 18 L40 40 Z" fill="#9d4edd" />
      <path d="M24 26 L28 18 L32 26 L29 24 L27 27 Z" fill="#fff" />
      <path d="M30 42 L39 26 L48 42 Z" fill="#7b2cbf" />
      {/* By (oppe til høyre) */}
      <rect x="60" y="22" width="7" height="18" rx="1" fill="#3a0ca3" />
      <rect x="68" y="16" width="8" height="24" rx="1" fill="#4361ee" />
      <rect x="77" y="25" width="6" height="15" rx="1" fill="#3a0ca3" />
      <circle cx="80" cy="15" r="1.4" fill="#ffd60a" />
      <circle cx="62" cy="14" r="1" fill="#ffd60a" />
      {/* Skog (nede til høyre) */}
      {[[62, 72], [68, 78], [76, 72], [82, 66], [74, 82]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x - 0.8} y={y} width="1.6" height="4" fill="#7f5539" />
          <circle cx={x} cy={y - 1} r="4" fill="#2d6a4f" />
        </g>
      ))}
      {/* Lekeland (nede til venstre) */}
      <rect x="16" y="70" width="6" height="6" rx="1" fill="#ff595e" />
      <rect x="22" y="70" width="6" height="6" rx="1" fill="#1982c4" />
      <rect x="19" y="64" width="6" height="6" rx="1" fill="#ffca3a" />
      <circle cx="34" cy="78" r="3" fill="#ff924c" />
      <path d="M30 60 q4 -6 8 0" stroke="#fff" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export function IslandMap() {
  const t = useT();
  const profile = useActiveProfile();

  useEffect(() => {
    if (!profile) go('');
  }, [profile]);

  if (!profile) return null;
  const hello = t('mapHello', { name: profile.name || '' }).replace(/\s+!/, '!');

  return (
    <div className="screen screen--sea island-screen">
      <TopBar
        left={
          <>
            <button className="avatar-btn" onClick={() => { playSfx('tap'); go('shop'); }} aria-label={t('myAvatar')}>
              <AvatarView avatar={profile.avatar} equipped={profile.equipped} size={window.innerWidth < 560 ? 48 : 60} />
            </button>
            <button className="avatar-btn" onClick={() => { playSfx('tap'); go('shop'); }} aria-label={t('coins')}>
              <CoinChip coins={profile.coins} />
            </button>
          </>
        }
        right={
          <>
            <RoundButton icon="🛍️" label={t('shop')} onClick={() => go('shop')} color="#ffafcc" />
            <RoundButton icon="📒" label={t('stickers')} onClick={() => go('stickers')} color="#ffd60a" />
            <RoundButton icon="🔒" label={t('parents')} onClick={() => go('parents')} />
            <RoundButton icon="🚪" label={t('exit')} onClick={() => go('bye')} color="#ffadad" />
          </>
        }
      />
      <div className="island-wrap">
        <div className="island">
          <IslandArt />
          {WORLDS.map((w, i) => (
            <button
              key={w.id}
              className={`world-spot pop-in ${profile.world === w.id ? 'is-mine' : ''}`}
              style={{ left: `${w.map.x}%`, top: `${w.map.y}%`, ['--c' as string]: w.color, animationDelay: `${i * 0.1}s` }}
              onClick={() => {
                playSfx('pop');
                speak(t(w.nameKey));
                go(`world/${w.id}`);
              }}
            >
              <span className="world-spot__icon">{w.icon}</span>
              <span className="world-spot__label">
                {t(w.nameKey)}
                <small>{t(w.ageKey)}</small>
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="island-mascot">
        <MascotSays text={hello} onTap={() => speak(hello)} size={80} />
      </div>
    </div>
  );
}
