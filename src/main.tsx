import './polyfills';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import '@fontsource/baloo-2/latin-500.css';
import '@fontsource/baloo-2/latin-700.css';
import '@fontsource/baloo-2/latin-800.css';
import './styles/global.css';
import App from './App';
import { hideSplashWhenReady } from './splash';
import { installHistoryGuard } from './router';
import { installTouchGuard } from './touchGuard';
import { installSparkles } from './fx/sparkles';

installHistoryGuard();
installTouchGuard();
installSparkles();

// Oppdateringer: se etter ny versjon når appen åpnes/kommer fram igjen, og bytt til den
// automatisk – men aldri midt i et spill (da byttes det når barnet går ut av spillet).
const hadController = !!navigator.serviceWorker?.controller;
let pendingReload = false;
const maybeReload = () => { if (pendingReload && !location.hash.startsWith('#/play')) { pendingReload = false; location.reload(); } };
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    const check = () => { reg.update().catch(() => {}); };
    document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
    setInterval(check, 30 * 60 * 1000);
  }
});
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  if (!hadController) return; // første installasjon – ingen ny versjon å bytte til
  pendingReload = true;
  maybeReload();
});
window.addEventListener('hashchange', maybeReload);

// Etter en oppdatering kan gamle spillfiler være borte fra serveren.
// Da laster vi siden på nytt én gang i stedet for å vise en feil.
window.addEventListener('vite:preloadError', (e) => {
  e.preventDefault();
  try {
    if (sessionStorage.getItem('istrefi-reloaded') === '1') return;
    sessionStorage.setItem('istrefi-reloaded', '1');
  } catch {
    /* ignorer */
  }
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

hideSplashWhenReady();
