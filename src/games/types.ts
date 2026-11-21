/**
 * Felles grensesnitt for alle spill på plattformen.
 *
 * Et nytt spill = én mappe i src/games/<navn>/ + én linje i registry.ts.
 * Spillet får alt det trenger via `GameProps`, og trenger aldri å vite
 * hvordan lagring, lyd eller klistremerker fungerer under panseret.
 */
import type { ComponentType, LazyExoticComponent } from 'react';
import type { DictKey } from '../i18n/no';
import type { Lang } from '../i18n';
import type { WorldId } from '../data/worlds';
import type { Sfx } from '../audio/sound';

export interface GameResult {
  won: boolean;
  /** 0–3 stjerner */
  stars: number;
  score?: number;
}

export interface GameApi {
  lang: Lang;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
  sfx: (name: Sfx) => void;
  speak: (text: string) => void;
  /** Hent spillets egne lagrede data for denne profilen. */
  loadData: <T>() => T | undefined;
  /** Lagre spillets egne data (nivå, innstillinger osv.). */
  saveData: (data: unknown) => void;
}

export interface GameProps {
  world: WorldId;
  /** Antall spillere – forberedt for flerspiller på samme skjerm. */
  players: 1 | 2;
  api: GameApi;
  /** Kall når en runde er ferdig. Plattformen viser feiring og deler ut klistremerke. */
  onFinish: (result: GameResult) => void;
}

export interface GameDefinition {
  id: string;
  titleKey: DictKey;
  icon: string;
  color: string;
  worlds: WorldId[];
  maxPlayers: 1 | 2;
  component: LazyExoticComponent<ComponentType<GameProps>>;
}
