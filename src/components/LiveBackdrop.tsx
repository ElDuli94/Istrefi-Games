/**
 * Levende bakgrunn: små ting som svever, flyr og faller – forskjellig for hver
 * verden, etter tid på døgnet og etter årstid. Bare pynt (pointer-events: none).
 */
import { useMemo } from 'react';
import { Emo } from './Emo';
import { getPhase, getSeason, isChristmas } from '../data/time';

export type BackdropKind = 'sea' | 'tiny' | 'small' | 'mid' | 'big' | 'sky';

const FLOATERS: Record<BackdropKind, { e: string; anim: 'drift' | 'rise' | 'flutter' | 'twinkle' | 'fly' }[]> = {
  sea: [{ e: '☁️', anim: 'drift' }, { e: '☁️', anim: 'drift' }, { e: '🐟', anim: 'flutter' }, { e: '⛵', anim: 'drift' }],
  sky: [{ e: '☁️', anim: 'drift' }, { e: '☁️', anim: 'drift' }, { e: '🎈', anim: 'rise' }],
  tiny: [{ e: '🎈', anim: 'rise' }, { e: '🫧', anim: 'rise' }, { e: '🫧', anim: 'rise' }, { e: '🦋', anim: 'flutter' }, { e: '☁️', anim: 'drift' }],
  small: [{ e: '🦋', anim: 'flutter' }, { e: '🐝', anim: 'flutter' }, { e: '🍃', anim: 'drift' }, { e: '🐞', anim: 'flutter' }],
  mid: [{ e: '☁️', anim: 'drift' }, { e: '🐦', anim: 'fly' }, { e: '🪁', anim: 'flutter' }, { e: '☁️', anim: 'drift' }],
  big: [{ e: '✨', anim: 'twinkle' }, { e: '⭐', anim: 'twinkle' }, { e: '✨', anim: 'twinkle' }, { e: '🛸', anim: 'fly' }, { e: '🌙', anim: 'twinkle' }]
};

const SEASON: Record<string, string> = { winter: '❄️', spring: '🌸', autumn: '🍂', summer: '' };

export function LiveBackdrop({ kind }: { kind: BackdropKind }) {
  const phase = getPhase();
  const season = getSeason();
  const xmas = isChristmas();
  const items = useMemo(() => {
    const out: { e: string; cls: string; style: React.CSSProperties }[] = [];
    FLOATERS[kind].forEach((f, i) => {
      out.push({
        e: f.e,
        cls: `lb-${f.anim}`,
        style: {
          left: `${(i * 23 + 7) % 92}%`,
          top: `${(i * 31 + 12) % 80}%`,
          animationDelay: `${-i * 3.1}s`,
          animationDuration: `${f.anim === 'drift' ? 38 + i * 6 : f.anim === 'rise' ? 14 + i * 3 : f.anim === 'fly' ? 18 + i * 4 : 6 + i}s`,
          fontSize: f.anim === 'drift' ? '3.4rem' : '1.9rem'
        }
      });
    });
    const s = SEASON[season];
    if (s) for (let i = 0; i < 10; i++) {
      out.push({
        e: s,
        cls: 'lb-fall',
        style: { left: `${(i * 37 + 5) % 100}%`, animationDelay: `${-i * 1.7}s`, animationDuration: `${9 + (i % 4) * 2.5}s`, fontSize: `${1 + (i % 3) * 0.35}rem` }
      });
    }
    if (xmas && kind !== 'big') out.push({ e: '🎄', cls: 'lb-corner', style: {} });
    return out;
  }, [kind, season, xmas]);

  return (
    <div className={`live-backdrop live-backdrop--${phase}`} aria-hidden>
      {phase === 'night' && kind !== 'big' && (
        <div className="lb-stars">
          {Array.from({ length: 18 }, (_, i) => (
            <i key={i} style={{ left: `${(i * 53) % 100}%`, top: `${(i * 29) % 60}%`, animationDelay: `${(i % 6) * 0.5}s` }} />
          ))}
        </div>
      )}
      {items.map((it, i) => (
        <span key={i} className={`lb-item ${it.cls}`} style={it.style}><Emo e={it.e} /></span>
      ))}
    </div>
  );
}
