// Enkel hash-ruter (#/map, #/play/...). Fungerer på GitHub Pages uten serveroppsett.
//
// "Vakt" mot å forlate appen: Når appen starter, legges det inn en usynlig
// vakt-side (#/guard) før første side i nettleserhistorikken. Sveiper barnet
// "tilbake" fra kanten på iPaden, havner det på vakta – og sendes rett inn i
// appen igjen i stedet for å havne på en annen nettside.
import { useSyncExternalStore } from 'react';

const GUARD = '#/guard';
const stack: string[] = []; // sidene vi har besøkt i denne økten (for Tilbake-knappen)

export function installHistoryGuard() {
  const start = window.location.hash && window.location.hash !== GUARD ? window.location.hash : '#/';
  history.replaceState(null, '', GUARD);
  history.pushState(null, '', start);
  stack.push(start);
  window.addEventListener('hashchange', () => {
    const h = window.location.hash;
    if (h === GUARD) {
      // Barnet sveipet tilbake helt til starten – bli i appen.
      history.pushState(null, '', stack[0] ?? '#/');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      return;
    }
    if (stack[stack.length - 2] === h) stack.pop();
    else if (stack[stack.length - 1] !== h) stack.push(h);
  });
}

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};

export function useRoute(): string[] {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  if (hash === GUARD) return [];
  return hash.replace(/^#\/?/, '').split('/').filter(Boolean);
}

export function go(path: string, opts?: { replace?: boolean }) {
  const hash = '#/' + path.replace(/^\//, '');
  if (opts?.replace) {
    // Erstatt nåværende side i historikken (f.eks. etter at en profil er laget)
    history.replaceState(null, '', hash);
    stack[stack.length - 1] = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    return;
  }
  window.location.hash = hash;
}

/** Gå tilbake innenfor appen – aldri ut av den. */
export function back(fallback = 'map') {
  if (stack.length > 1) window.history.back();
  else go(fallback);
}
