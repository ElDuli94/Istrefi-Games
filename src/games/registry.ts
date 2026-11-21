import { lazy } from 'react';
import type { GameDefinition } from './types';

// Alle spill på plattformen. Spillene lastes først når de åpnes (lazy),
// så forsiden er rask selv når vi har mange spill.
export const GAMES: GameDefinition[] = [
  {
    id: 'memory',
    titleKey: 'game_memory',
    icon: '🃏',
    color: '#ff006e',
    worlds: ['tiny', 'small', 'mid', 'big'],
    maxPlayers: 1,
    component: lazy(() => import('./memory/MemoryGame'))
  },
  {
    id: 'letters',
    titleKey: 'game_letters',
    icon: '🔤',
    color: '#8338ec',
    worlds: ['tiny', 'small', 'mid', 'big'],
    maxPlayers: 1,
    component: lazy(() => import('./letters/LetterGame'))
  }
];

export const gameById = (id: string) => GAMES.find((g) => g.id === id);
