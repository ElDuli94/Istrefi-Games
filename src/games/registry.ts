import { lazy } from 'react';
import type { GameDefinition } from './types';

// Alle spill på plattformen. Spillene lastes først når de åpnes (lazy),
// så forsiden er rask selv når vi har mange spill.
export const GAMES: GameDefinition[] = [
  {
    id: 'sounds',
    titleKey: 'game_sounds',
    icon: '🐮',
    color: '#06d6a0',
    worlds: ['tiny', 'small'],
    maxPlayers: 1,
    component: lazy(() => import('./sounds/AnimalSounds'))
  },
  {
    id: 'draw',
    titleKey: 'game_draw',
    icon: '🎨',
    color: '#ff9f1c',
    worlds: ['tiny', 'small', 'mid', 'big'],
    maxPlayers: 2, // flere fingre samtidig – søsken kan tegne sammen
    component: lazy(() => import('./draw/DrawGame'))
  },
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
