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
  /** Første gang dette nivået klares – gir bonusmynter. */
  firstClear?: boolean;
  /** Overstyr antall mynter (f.eks. fri lek som gir færre mynter). */
  coins?: number;
}

export interface GameApi {
  lang: Lang;
  /** Barnets navn fra profilen (kan være tomt). */
  playerName: string;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
  sfx: (name: Sfx) => void;
  speak: (text: string) => void;
  /** Hent spillets egne lagrede data for denne profilen. */
  loadData: <T>() => T | undefined;
  /** Lagre spillets egne data (nivå, innstillinger osv.). */
  saveData: (data: unknown) => void;
  /**
   * Smart tilbake-knapp: spillet registrerer hva ⬅️ skal gjøre (f.eks. gå tilbake til nivåvalget).
   * Send null når spillet er i sin egen hovedmeny – da går ⬅️ ut av spillet.
   */
  setBack: (fn: (() => void) | null) => void;
  /** Liten belønning midt i spillet (konfetti + mynter) uten at spillet stopper. Brukes i «uendelige» leker. */
  reward: (coins: number) => void;
  /** Det andre språket (norsk ↔ albansk) */
  otherLang: Lang;
  /** Er «Lær begge språk» slått på? */
  bilingual: boolean;
  /** Les ordet på hovedspråket, og (hvis tospråklig) så på det andre språket. */
  sayBoth: (main: string, other: string) => void;
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
  /** Spillet støtter «Lær begge språk» (viser flaggknapp) */
  bilingual?: boolean;
  component: LazyExoticComponent<ComponentType<GameProps>>;
}
