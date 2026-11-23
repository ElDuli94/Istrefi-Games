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
  },
  {
    id: 'blocks',
    titleKey: 'game_blocks',
    icon: '🧱',
    color: '#3a86ff',
    worlds: ['small', 'mid', 'big'],
    maxPlayers: 1,
    component: lazy(() => import('./blocks/BlockGame'))
  },
  {
    id: 'snake',
    titleKey: 'game_snake',
    icon: '🐍',
    color: '#38b000',
    worlds: ['small', 'mid', 'big'],
    maxPlayers: 1,
    component: lazy(() => import('./snake/SnakeGame'))
  },
  {
    id: 'math',
    titleKey: 'game_math',
    icon: '🧮',
    color: '#ff9f1c',
    worlds: ['small', 'mid', 'big'],
    maxPlayers: 1,
    component: lazy(() => import('./math/MathGame'))
  },
  {
    id: 'balloons',
    titleKey: 'game_balloons',
    icon: '🎈',
    color: '#ff4d6d',
    worlds: ['tiny', 'small'],
    maxPlayers: 1,
    component: lazy(() => import('./balloons/BalloonGame'))
  },
  {
    id: 'music',
    titleKey: 'game_music',
    icon: '🎹',
    color: '#8338ec',
    worlds: ['tiny', 'small'],
    maxPlayers: 2,
    component: lazy(() => import('./music/MusicGame'))
  },
  {
    id: 'puzzle',
    titleKey: 'game_puzzle',
    icon: '🧩',
    color: '#2ec4b6',
    worlds: ['tiny', 'small', 'mid'],
    maxPlayers: 1,
    component: lazy(() => import('./puzzle/PuzzleGame'))
  },
  {
    id: 'words',
    titleKey: 'game_words',
    icon: '🔠',
    color: '#06d6a0',
    worlds: ['mid', 'big'],
    maxPlayers: 1,
    component: lazy(() => import('./wordgame/WordGame'))
  },
  {
    id: 'flags',
    titleKey: 'game_flags',
    icon: '🌍',
    color: '#ef476f',
    worlds: ['mid', 'big'],
    maxPlayers: 1,
    component: lazy(() => import('./flags/FlagGame'))
  },
  {
    id: 'trace',
    titleKey: 'game_trace',
    icon: '✍️',
    color: '#ff70a6',
    worlds: ['tiny', 'small'],
    maxPlayers: 1,
    component: lazy(() => import('./trace/TraceGame'))
  },
  {
    id: 'coloring',
    titleKey: 'game_coloring',
    icon: '🖍️',
    color: '#ffca3a',
    worlds: ['tiny', 'small'],
    maxPlayers: 2,
    component: lazy(() => import('./coloring/ColoringGame'))
  },
  {
    id: 'dots',
    titleKey: 'game_dots',
    icon: '🔢',
    color: '#4cc9f0',
    worlds: ['small', 'mid'],
    maxPlayers: 1,
    component: lazy(() => import('./dots/DotsGame'))
  },
  {
    id: 'robot',
    titleKey: 'game_robot',
    icon: '🤖',
    color: '#6a4c93',
    worlds: ['mid', 'big'],
    maxPlayers: 1,
    component: lazy(() => import('./robot/RobotGame'))
  },
  {
    id: 'duel',
    titleKey: 'game_duel',
    icon: '👫',
    color: '#ff006e',
    worlds: ['small', 'mid', 'big'],
    maxPlayers: 2,
    component: lazy(() => import('./duel/DuelGame'))
  },
  {
    id: 'towers',
    titleKey: 'game_towers',
    icon: '🎂',
    color: '#ff70a6',
    worlds: ['small', 'mid', 'big'],
    maxPlayers: 1,
    component: lazy(() => import('./towers/TowerGame'))
  },
  {
    id: 'ludo',
    titleKey: 'game_ludo',
    icon: '🎲',
    color: '#ef233c',
    worlds: ['mid', 'big'],
    maxPlayers: 2,
    component: lazy(() => import('./ludo/LudoGame'))
  }
];

export const gameById = (id: string) => GAMES.find((g) => g.id === id);
