// Barnets figur: valgt dyr + ting fra butikken (hatt, briller, kjæledyr, bakgrunn, ramme, effekt).
import { Emo } from './Emo';
import { AVATARS } from '../data/avatars';
import { itemById } from '../data/shop';
import type { Profile } from '../storage/store';

interface Props {
  avatar: string;
  equipped?: Profile['equipped'];
  size?: number;
  /** Forhåndsvis en ting (i butikken) uten å ha den på */
  preview?: { slot: string; id: string } | null;
}

export function AvatarView({ avatar, equipped = {}, size = 96, preview }: Props) {
  const base = AVATARS[avatar] ?? AVATARS.lion;
  const eq = { ...equipped, ...(preview ? { [preview.slot]: preview.id } : {}) };
  const skin = itemById(eq.skin);
  const held = itemById(eq.held);
  const a = { ...base, emoji: skin?.emoji ?? base.emoji };
  const hat = itemById(eq.hat);
  const glasses = itemById(eq.glasses);
  const pet = itemById(eq.pet);
  const bg = itemById(eq.bg);
  const frame = itemById(eq.frame);
  const fx = itemById(eq.effect);
  const border = Math.max(3, size * 0.055);
  const frameStyle =
    frame?.css === 'rainbow'
      ? { background: 'conic-gradient(#ff595e,#ffca3a,#8ac926,#1982c4,#6a4c93,#ff595e)', padding: border }
      : { background: frame?.css ?? '#fff', padding: border };

  return (
    <span className="av" style={{ width: size, height: size }}>
      <span className="av__frame" style={frameStyle}>
        <span className="av__face" style={{ background: bg?.css ?? a.color, fontSize: size * 0.58 }}>
          <span className="av__animal"><Emo e={a.emoji} /></span>
          {glasses && <span className="av__glasses" style={{ fontSize: size * 0.36 }}><Emo e={glasses.emoji!} /></span>}
        </span>
      </span>
      {hat && <span className="av__hat" style={{ fontSize: size * 0.42 }}><Emo e={hat.emoji!} /></span>}
      {pet && <span className="av__pet" style={{ fontSize: size * 0.34 }}><Emo e={pet.emoji!} /></span>}
      {held && <span className="av__held" style={{ fontSize: size * 0.32 }}><Emo e={held.emoji!} /></span>}
      {fx && (
        <span className="av__fx" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <i key={i} style={{ fontSize: size * 0.18, animationDelay: `${i * 0.5}s`, left: `${[8, 78, 20, 70][i]}%`, top: `${[20, 15, 70, 65][i]}%` }}><Emo e={fx.emoji!} /></i>
          ))}
        </span>
      )}
    </span>
  );
}
