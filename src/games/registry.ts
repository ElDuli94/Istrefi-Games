import { lazy } from 'react';
import type { GameDefinition } from './types';

// Alle spill på plattformen. Spillene lastes først når de åpnes (lazy),
// så forsiden er rask selv når vi har mange spill.
export const GAMES: GameDefinition[] = [
  {
    id: 'numbers',
    group: 'numbers',
    titleKey: 'game_numbers',
    icon: '🔢',
    color: '#ff9f1c',
    worlds: ['tiny', 'small'],
    maxPlayers: 1,
    bilingual: true,
    component: lazy(() => import('./numbers/NumbersGame'))
  },
  {
    id: 'naming',
    group: 'letters',
    titleKey: 'game_naming',
    icon: '🖼️',
    color: '#06d6a0',
    worlds: ['tiny', 'small'],
    maxPlayers: 1,
    bilingual: true,
    component: lazy(() => import('./naming/NamingGame'))
  },
  {
    id: 'stories',
    group: 'letters',
    titleKey: 'game_stories',
    icon: '📖',
    color: '#8338ec',
    worlds: ['tiny', 'small'],
    maxPlayers: 1,
    bilingual: true,
    component: lazy(() => import('./stories/StoryGame'))
  },
  {
    id: 'shapes',
    group: 'numbers',
    titleKey: 'game_shapes',
    icon: '🔷',
    color: '#3a86ff',
    worlds: ['tiny', 'small'],
    maxPlayers: 1,
    bilingual: true,
    component: lazy(() => import('./shapes/ShapesGame'))
  },
  {
    id: 'sounds',
    group: 'explore',
    titleKey: 'game_sounds',
    icon: '🐮',
    color: '#06d6a0',
    worlds: ['tiny', 'small'],
    maxPlayers: 1,
    bilingual: true,
    component: lazy(() => import('./sounds/AnimalSounds'))
  },
  {
    id: 'draw',
    group: 'create',
    titleKey: 'game_draw',
    icon: '🎨',
    color: '#ff9f1c',
    worlds: ['tiny', 'small', 'mid', 'big'],
    maxPlayers: 2, // flere fingre samtidig – søsken kan tegne sammen
    component: lazy(() => import('./draw/DrawGame'))
  },
  {
    id: 'memory',
    group: 'numbers',
    titleKey: 'game_memory',
    icon: '🃏',
    color: '#ff006e',
    worlds: ['tiny', 'small', 'mid', 'big'],
    maxPlayers: 1,
    component: lazy(() => import('./memory/MemoryGame'))
  },
  {
    id: 'letters',
    group: 'letters',
    titleKey: 'game_letters',
    icon: '🔤',
    color: '#8338ec',
    worlds: ['tiny', 'small', 'mid', 'big'],
    maxPlayers: 1,
    component: lazy(() => import('./letters/LetterGame'))
  },
  {
    id: 'blocks',
    group: 'action',
    titleKey: 'game_blocks',
    icon: '🧱',
    color: '#3a86ff',
    worlds: ['small', 'mid', 'big'],
    maxPlayers: 1,
    component: lazy(() => import('./blocks/BlockGame'))
  },
  {
    id: 'snake',
    group: 'action',
    titleKey: 'game_snake',
    icon: '🐍',
    color: '#38b000',
    worlds: ['small', 'mid', 'big'],
    maxPlayers: 1,
    component: lazy(() => import('./snake/SnakeGame'))
  },
  {
    id: 'math',
    group: 'numbers',
    titleKey: 'game_math',
    icon: '🧮',
    color: '#ff9f1c',
    worlds: ['small', 'mid', 'big'],
    maxPlayers: 1,
    component: lazy(() => import('./math/MathGame'))
  },
  {
    id: 'balloons',
    group: 'create',
    titleKey: 'game_balloons',
    icon: '🎈',
    color: '#ff4d6d',
    worlds: ['tiny', 'small'],
    maxPlayers: 1,
    component: lazy(() => import('./balloons/BalloonGame'))
  },
  {
    id: 'music',
    group: 'create',
    titleKey: 'game_music',
    icon: '🎹',
    color: '#8338ec',
    worlds: ['tiny', 'small'],
    maxPlayers: 2,
    component: lazy(() => import('./music/MusicGame'))
  },
  {
    id: 'puzzle',
    group: 'numbers',
    titleKey: 'game_puzzle',
    icon: '🧩',
    color: '#2ec4b6',
    worlds: ['tiny', 'small', 'mid'],
    maxPlayers: 1,
    component: lazy(() => import('./puzzle/PuzzleGame'))
  },
  {
    id: 'words',
    group: 'letters',
    titleKey: 'game_words',
    icon: '🔠',
    color: '#06d6a0',
    worlds: ['mid', 'big'],
    maxPlayers: 1,
    component: lazy(() => import('./wordgame/WordGame'))
  },
  {
    id: 'flags',
    group: 'explore',
    titleKey: 'game_flags',
    icon: '🌍',
    color: '#ef476f',
    worlds: ['mid', 'big'],
    maxPlayers: 1,
    component: lazy(() => import('./flags/FlagGame'))
  },
  {
    id: 'trace',
    group: 'letters',
    titleKey: 'game_trace',
    icon: '✍️',
    color: '#ff70a6',
    worlds: ['tiny', 'small'],
    maxPlayers: 1,
    component: lazy(() => import('./trace/TraceGame'))
  },
  {
    id: 'coloring',
    group: 'create',
    titleKey: 'game_coloring',
    icon: '🖍️',
    color: '#ffca3a',
    worlds: ['tiny', 'small'],
    maxPlayers: 2,
    component: lazy(() => import('./coloring/ColoringGame'))
  },
  {
    id: 'dots',
    group: 'create',
    titleKey: 'game_dots',
    icon: '🔢',
    color: '#4cc9f0',
    worlds: ['small', 'mid'],
    maxPlayers: 1,
    component: lazy(() => import('./dots/DotsGame'))
  },
  {
    id: 'robot',
    group: 'numbers',
    titleKey: 'game_robot',
    icon: '🤖',
    color: '#6a4c93',
    worlds: ['mid', 'big'],
    maxPlayers: 1,
    component: lazy(() => import('./robot/RobotGame'))
  },
  {
    id: 'duel',
    group: 'together',
    titleKey: 'game_duel',
    icon: '👫',
    color: '#ff006e',
    worlds: ['small', 'mid', 'big'],
    maxPlayers: 2,
    component: lazy(() => import('./duel/DuelGame'))
  },
  {
    id: 'towers',
    group: 'action',
    titleKey: 'game_towers',
    icon: '🎂',
    color: '#ff70a6',
    worlds: ['small', 'mid', 'big'],
    maxPlayers: 1,
    component: lazy(() => import('./towers/TowerGame'))
  },
  {
    id: 'ludo',
    group: 'together',
    titleKey: 'game_ludo',
    icon: '🎲',
    color: '#ef233c',
    worlds: ['mid', 'big'],
    maxPlayers: 2,
    component: lazy(() => import('./ludo/LudoGame'))
  },
  {
    id: 'ladders',
    group: 'together',
    titleKey: 'game_ladders',
    icon: '🪜',
    color: '#fb5607',
    worlds: ['tiny', 'small', 'mid'],
    maxPlayers: 2,
    component: lazy(() => import('./ladders/LaddersGame'))
  },
  {
    id: 'chess',
    group: 'together',
    titleKey: 'game_chess',
    icon: '♟️',
    color: '#6a4c93',
    worlds: ['small', 'mid', 'big'],
    maxPlayers: 2,
    component: lazy(() => import('./chess/ChessGame'))
  },
  {
    id: 'clock',
    group: 'numbers',
    titleKey: 'game_clock',
    icon: '⏰',
    color: '#ff9f1c',
    worlds: ['small', 'mid'],
    maxPlayers: 1,
    component: lazy(() => import('./clock/ClockGame'))
  }
];

export const gameById = (id: string) => GAMES.find((g) => g.id === id);
