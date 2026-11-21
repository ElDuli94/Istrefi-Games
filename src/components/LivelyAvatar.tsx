// Figuren med liv: puster/svever, vinker ved start, danser ved seier,
// og reagerer med en morsom animasjon og snakkeboble når man trykker på den.
import { useEffect, useRef, useState } from 'react';
import { AvatarView } from './AvatarView';
import { useT } from '../i18n';
import type { DictKey } from '../i18n/no';
import type { Profile } from '../storage/store';
import { playSfx } from '../audio/sound';
import { speak } from '../audio/speech';

type Move = 'jump' | 'spin' | 'wiggle' | 'dance' | 'wave' | 'squish';
const TAP_MOVES: Move[] = ['jump', 'spin', 'wiggle', 'dance', 'squish'];
const PHRASES: DictKey[] = ['avHi', 'avHihi', 'avYay', 'avPlay', 'avClever', 'avTickle', 'avLove'];

interface Props {
  profile: Pick<Profile, 'avatar' | 'equipped' | 'name'>;
  size?: number;
  /** Fast animasjon, f.eks. 'dance' i feiringen */
  mode?: 'idle' | 'dance' | 'wave';
  /** Trykk gir reaksjon (standard på) */
  interactive?: boolean;
  /** Snakkeboblens plassering */
  bubble?: 'top' | 'right';
}

export function LivelyAvatar({ profile, size = 80, mode = 'idle', interactive = true, bubble = 'top' }: Props) {
  const t = useT();
  const [move, setMove] = useState<Move | null>(mode === 'wave' ? 'wave' : null);
  const [say, setSay] = useState<string | null>(null);
  const [hearts, setHearts] = useState<number[]>([]);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (mode === 'wave') timer.current = window.setTimeout(() => setMove(null), 1600);
    return () => clearTimeout(timer.current);
  }, [mode]);

  function react(e: React.PointerEvent) {
    if (!interactive) return;
    e.stopPropagation();
    const m = TAP_MOVES[Math.floor(Math.random() * TAP_MOVES.length)];
    const phrase = t(PHRASES[Math.floor(Math.random() * PHRASES.length)], { name: profile.name || '' }).replace(/\s+!/, '!');
    setMove(null);
    requestAnimationFrame(() => setMove(m));
    setSay(phrase);
    playSfx(m === 'squish' ? 'pop' : 'match');
    speak(phrase);
    const id = Date.now();
    setHearts((h) => [...h.slice(-4), id]);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { setMove(null); setSay(null); }, 1800);
    setTimeout(() => setHearts((h) => h.filter((x) => x !== id)), 1200);
  }

  const cls = mode === 'dance' ? 'is-dance' : move ? `is-${move}` : 'is-idle';
  return (
    <span className={`lively lively--bubble-${bubble}`} onPointerDown={react} role={interactive ? 'button' : undefined} aria-label={profile.name || 'avatar'}>
      <span className={`lively__body ${cls}`}>
        <AvatarView avatar={profile.avatar} equipped={profile.equipped} size={size} />
        {(move === 'wave' || (mode === 'wave' && !interactive)) && <span className="lively__hand" style={{ fontSize: size * 0.32 }}>👋</span>}
      </span>
      {hearts.map((h) => <span key={h} className="lively__heart">💖</span>)}
      {say && <span className="lively__say pop-in">{say}</span>}
    </span>
  );
}
