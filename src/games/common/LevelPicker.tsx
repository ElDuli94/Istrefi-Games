// Felles nivåvelger som alle spill kan bruke: 3 nivåer, låses opp ett etter ett.
import type { GameApi } from '../types';
import type { DictKey } from '../../i18n/no';
import { Stars } from '../../components/ui';
import './common.css';

export interface LevelProgress {
  unlocked: number; // antall nivåer som er åpne (1–3)
  best: number[]; // beste stjerner per nivå
}

export const emptyProgress = (): LevelProgress => ({ unlocked: 1, best: [0, 0, 0] });

const NAMES: DictKey[] = ['levelEasy', 'levelMedium', 'levelHard'];
const ICONS = ['🐣', '🐥', '🦅'];

export function LevelPicker({ api, progress, onPick, details }: {
  api: GameApi;
  progress: LevelProgress;
  onPick: (level: number) => void;
  /** Kort beskrivelse per nivå, f.eks. "6 par" */
  details?: string[];
}) {
  return (
    <div className="level-picker">
      <h2 className="level-picker__title">{api.t('chooseLevel')}</h2>
      <div className="level-picker__list">
        {NAMES.map((key, i) => {
          const open = i < progress.unlocked;
          const isNext = i === progress.unlocked - 1 && progress.best[i] === 0;
          return (
            <button
              key={key}
              className={`level-btn pop-in ${open ? '' : 'is-locked'} ${isNext ? 'is-next' : ''}`}
              style={{ animationDelay: `${i * 0.08}s` }}
              onClick={() => {
                if (!open) {
                  api.sfx('nope');
                  api.speak(api.t('locked'));
                  return;
                }
                api.sfx('pop');
                api.speak(api.t(key));
                onPick(i);
              }}
              aria-label={open ? api.t(key) : api.t('locked')}
            >
              <span className="level-btn__icon">{open ? ICONS[i] : '🔒'}</span>
              <span className="level-btn__name">{api.t(key)}</span>
              {details?.[i] && <span className="level-btn__detail">{details[i]}</span>}
              <Stars count={progress.best[i] ?? 0} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Oppdater progresjon etter en runde: lagre beste stjerner og lås opp neste nivå ved seier. */
export function advance(progress: LevelProgress, level: number, won: boolean, stars: number): LevelProgress {
  const best = [...progress.best];
  best[level] = Math.max(best[level] ?? 0, stars);
  const unlocked = won ? Math.max(progress.unlocked, Math.min(3, level + 2)) : progress.unlocked;
  return { unlocked, best };
}
