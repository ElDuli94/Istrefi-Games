import type { DictKey } from '../i18n/no';

export type WorldId = 'tiny' | 'small' | 'mid' | 'big';

export interface World {
  id: WorldId;
  nameKey: DictKey;
  ageKey: DictKey;
  icon: string;
  color: string; // hovedfarge
  bg: string; // bakgrunn (gradient)
  /** Posisjon på øykartet i prosent */
  map: { x: number; y: number };
}

export const WORLDS: World[] = [
  { id: 'tiny', nameKey: 'world_tiny', ageKey: 'world_tiny_age', icon: '🧸', color: '#ff9f1c',
    bg: 'linear-gradient(160deg,#ffe8a3,#ffbf69)', map: { x: 27, y: 66 } },
  { id: 'small', nameKey: 'world_small', ageKey: 'world_small_age', icon: '🌳', color: '#2ec4b6',
    bg: 'linear-gradient(160deg,#b8f2c9,#2ec4b6)', map: { x: 72, y: 64 } },
  { id: 'mid', nameKey: 'world_mid', ageKey: 'world_mid_age', icon: '⛰️', color: '#7b2cbf',
    bg: 'linear-gradient(160deg,#cdb4ff,#7b2cbf)', map: { x: 30, y: 30 } },
  { id: 'big', nameKey: 'world_big', ageKey: 'world_big_age', icon: '🌃', color: '#3a0ca3',
    bg: 'linear-gradient(160deg,#4361ee,#240046)', map: { x: 70, y: 27 } }
];

export const worldById = (id: WorldId) => WORLDS.find((w) => w.id === id)!;
