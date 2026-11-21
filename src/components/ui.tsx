import type { ReactNode } from 'react';
import { AVATARS } from '../data/avatars';
import { playSfx } from '../audio/sound';
import { back } from '../router';
import { useT } from '../i18n';

export function Avatar({ avatar, size = 96 }: { avatar: string; size?: number }) {
  const a = AVATARS[avatar] ?? AVATARS.lion;
  return (
    <span className="avatar" style={{ width: size, height: size, background: a.color, fontSize: size * 0.62 }}>
      {a.emoji}
    </span>
  );
}

export function RoundButton({ icon, label, onClick, color = '#fff', big }: {
  icon: ReactNode; label: string; onClick: () => void; color?: string; big?: boolean;
}) {
  return (
    <button
      className={`round-btn ${big ? 'round-btn--big' : ''}`}
      style={{ background: color }}
      onClick={() => { playSfx('tap'); onClick(); }}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}

export function BackButton({ to }: { to?: () => void }) {
  const t = useT();
  return <RoundButton icon="⬅️" label={t('back')} onClick={to ?? (() => back())} />;
}

export function TopBar({ left, title, right }: { left?: ReactNode; title?: ReactNode; right?: ReactNode }) {
  return (
    <header className="topbar">
      <div className="topbar__side">{left}</div>
      <div className="topbar__title">{title}</div>
      <div className="topbar__side topbar__side--right">{right}</div>
    </header>
  );
}

export function Stars({ count, max = 3, size = 1 }: { count: number; max?: number; size?: number }) {
  return (
    <span className="stars" style={{ fontSize: `${size}em` }}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < count ? 'star is-on' : 'star'} style={{ animationDelay: `${i * 0.2}s` }}>★</span>
      ))}
    </span>
  );
}
