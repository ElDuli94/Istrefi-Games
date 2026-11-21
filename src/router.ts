// Enkel hash-ruter (#/kart, #/spill/...). Fungerer på GitHub Pages uten serveroppsett,
// og tilbake-knappen på telefonen fungerer som forventet.
import { useSyncExternalStore } from 'react';

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};

export function useRoute(): string[] {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  return hash.replace(/^#\/?/, '').split('/').filter(Boolean);
}

export function go(path: string) {
  window.location.hash = '/' + path.replace(/^\//, '');
}

export function back(fallback = 'map') {
  if (window.history.length > 1) window.history.back();
  else go(fallback);
}
