/**
 * Lokal lagring for Istrefi Games.
 *
 * Alt lagres i nettleserens localStorage på enheten – ingen server, ingen konto.
 * Dataene har et versjonsnummer slik at vi trygt kan endre formatet senere
 * (se `migrate`). Komponenter leser data med `useStore(selector)` og endrer
 * data med funksjonene i `actions`.
 */
import { useSyncExternalStore } from 'react';
import type { Lang } from '../i18n';
import type { WorldId } from '../data/worlds';

export const STORAGE_KEY = 'istrefi-games';
export const SCHEMA_VERSION = 1;

export interface GameStats {
  plays: number;
  wins: number;
  bestStars: number;
  bestScore?: number;
  totalSeconds: number;
  lastPlayed: number;
  /** Fritt felt for spill som vil lagre egen progresjon (nivåer o.l.). */
  data?: unknown;
}

export interface Profile {
  id: string;
  name: string;
  avatar: string; // nøkkel i AVATARS
  world: WorldId; // foretrukket aldersverden
  createdAt: number;
  stickers: string[]; // id-er i STICKERS, i rekkefølgen de ble vunnet
  games: Record<string, GameStats>;
}

export interface Settings {
  lang: Lang;
  music: boolean;
  sfx: boolean;
  voice: boolean;
}

export interface AppState {
  version: number;
  profiles: Profile[];
  activeProfileId: string | null;
  settings: Settings;
}

const defaultState = (): AppState => ({
  version: SCHEMA_VERSION,
  profiles: [],
  activeProfileId: null,
  settings: { lang: 'no', music: true, sfx: true, voice: true }
});

function migrate(raw: unknown): AppState {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<AppState>;
  // Fremtidige migreringer: if (r.version === 1) { ... r.version = 2 }
  return {
    version: SCHEMA_VERSION,
    profiles: Array.isArray(r.profiles) ? r.profiles : [],
    activeProfileId: r.activeProfileId ?? null,
    settings: { ...base.settings, ...(r.settings ?? {}) }
  };
}

function load(): AppState {
  try {
    const txt = localStorage.getItem(STORAGE_KEY);
    return txt ? migrate(JSON.parse(txt)) : defaultState();
  } catch {
    return defaultState();
  }
}

let state: AppState = load();
const listeners = new Set<() => void>();

function setState(updater: (s: AppState) => AppState) {
  state = updater(state);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* privat modus eller full lagring – spillet fungerer likevel denne økten */
  }
  listeners.forEach((l) => l());
}

// Synkroniser hvis appen er åpen i flere faner.
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) {
    state = load();
    listeners.forEach((l) => l());
  }
});

// Be nettleseren om ikke å slette dataene våre automatisk.
navigator.storage?.persist?.().catch(() => {});

export function getState() {
  return state;
}

export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => selector(state)
  );
}

export function useActiveProfile(): Profile | null {
  return useStore((s) => s.profiles.find((p) => p.id === s.activeProfileId) ?? null);
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function updateProfile(id: string, fn: (p: Profile) => Profile) {
  setState((s) => ({ ...s, profiles: s.profiles.map((p) => (p.id === id ? fn(p) : p)) }));
}

export const actions = {
  createProfile(input: { name: string; avatar: string; world: WorldId }) {
    const profile: Profile = { id: uid(), createdAt: Date.now(), stickers: [], games: {}, ...input };
    setState((s) => ({ ...s, profiles: [...s.profiles, profile], activeProfileId: profile.id }));
    return profile;
  },
  selectProfile(id: string | null) {
    setState((s) => ({ ...s, activeProfileId: id }));
  },
  editProfile(id: string, patch: Partial<Pick<Profile, 'name' | 'avatar' | 'world'>>) {
    updateProfile(id, (p) => ({ ...p, ...patch }));
  },
  deleteProfile(id: string) {
    setState((s) => ({
      ...s,
      profiles: s.profiles.filter((p) => p.id !== id),
      activeProfileId: s.activeProfileId === id ? null : s.activeProfileId
    }));
  },
  updateSettings(patch: Partial<Settings>) {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  },
  recordGame(profileId: string, gameId: string, r: { won: boolean; stars: number; score?: number; seconds: number }) {
    updateProfile(profileId, (p) => {
      const g: GameStats = p.games[gameId] ?? { plays: 0, wins: 0, bestStars: 0, totalSeconds: 0, lastPlayed: 0 };
      const higherIsBetter = r.score !== undefined && (g.bestScore === undefined || r.score > g.bestScore);
      return {
        ...p,
        games: {
          ...p.games,
          [gameId]: {
            ...g,
            plays: g.plays + 1,
            wins: g.wins + (r.won ? 1 : 0),
            bestStars: Math.max(g.bestStars, r.stars),
            bestScore: higherIsBetter ? r.score : g.bestScore,
            totalSeconds: g.totalSeconds + Math.round(r.seconds),
            lastPlayed: Date.now()
          }
        }
      };
    });
  },
  saveGameData(profileId: string, gameId: string, data: unknown) {
    updateProfile(profileId, (p) => {
      const g = p.games[gameId] ?? { plays: 0, wins: 0, bestStars: 0, totalSeconds: 0, lastPlayed: 0 };
      return { ...p, games: { ...p.games, [gameId]: { ...g, data } } };
    });
  },
  addSticker(profileId: string, stickerId: string) {
    updateProfile(profileId, (p) => (p.stickers.includes(stickerId) ? p : { ...p, stickers: [...p.stickers, stickerId] }));
  },

  // ---- Sikkerhetskopi ----
  exportBackup(): string {
    return JSON.stringify({ app: 'istrefi-games', exportedAt: new Date().toISOString(), state }, null, 2);
  },
  importBackup(json: string): boolean {
    try {
      const parsed = JSON.parse(json);
      if (parsed?.app !== 'istrefi-games' || !parsed.state) return false;
      const next = migrate(parsed.state);
      setState(() => next);
      return true;
    } catch {
      return false;
    }
  }
};
