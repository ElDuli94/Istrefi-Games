// Nivåkart med mange nivåer (1, 2, 3 ...). Neste nivå låses opp når forrige er klart.
import type { ReactNode } from 'react';
import type { GameApi } from '../types';
import './common.css';

export interface GridProgress {
  unlocked: number; // antall åpne nivåer
  best: number[]; // beste stjerner per nivå
  highscore?: number; // for uendelig modus
}

export const emptyGridProgress = (): GridProgress => ({ unlocked: 1, best: [] });

export function LevelGrid({ api, count, progress, onPick, extra }: {
  api: GameApi;
  count: number;
  progress: GridProgress;
  onPick: (level: number) => void;
  /** Ekstra knapp, f.eks. "Uendelig" */
  extra?: ReactNode;
}) {
  return (
    <div className="level-grid-wrap">
      <h2 className="level-picker__title">{api.t('chooseLevel')}</h2>
      <div className="level-grid">
        {Array.from({ length: count }, (_, i) => {
          const open = i < progress.unlocked;
          const stars = progress.best[i] ?? 0;
          const isNext = open && stars === 0;
          return (
            <button
              key={i}
              className={`lvl pop-in ${open ? '' : 'is-locked'} ${isNext ? 'is-next' : ''}`}
              style={{ animationDelay: `${Math.min(i, 20) * 0.025}s` }}
              onClick={() => {
                if (!open) {
                  api.sfx('nope');
                  api.speak(api.t('locked'));
                  return;
                }
                api.sfx('pop');
                onPick(i);
              }}
            >
              <span className="lvl__num">{open ? i + 1 : '🔒'}</span>
              <span className="lvl__stars">{[0, 1, 2].map((s) => <i key={s} className={s < stars ? 'on' : ''}>★</i>)}</span>
            </button>
          );
        })}
      </div>
      {extra}
    </div>
  );
}

export function advanceGrid(p: GridProgress, level: number, won: boolean, stars: number, count: number): { next: GridProgress; firstClear: boolean } {
  const best = [...p.best];
  const firstClear = won && !(best[level] > 0);
  if (won) best[level] = Math.max(best[level] ?? 0, stars);
  const unlocked = won ? Math.max(p.unlocked, Math.min(count, level + 2)) : p.unlocked;
  return { next: { ...p, best, unlocked }, firstClear };
}
