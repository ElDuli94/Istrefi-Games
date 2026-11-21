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

installHistoryGuard();
installTouchGuard();

registerSW({ immediate: true });

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
