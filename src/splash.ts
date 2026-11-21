// Skjuler den animerte åpningsskjermen (som ligger i index.html) når appen er klar.
// Første gang i en økt vises hele animasjonen; senere åpninger går raskere.
// Et trykk på skjermen hopper over animasjonen.
const FULL_MS = 3300;
const QUICK_MS = 1400;

export function hideSplashWhenReady() {
  const el = document.getElementById('splash');
  if (!el) return;
  let seen = false;
  try {
    seen = sessionStorage.getItem('istrefi-splash') === '1';
    sessionStorage.setItem('istrefi-splash', '1');
  } catch {
    /* privat modus */
  }
  const start = (window as unknown as { __splashStart?: number }).__splashStart ?? Date.now();
  const wait = Math.max(0, (seen ? QUICK_MS : FULL_MS) - (Date.now() - start));

  let done = false;
  const hide = () => {
    if (done) return;
    done = true;
    el.classList.add('is-leaving');
    setTimeout(() => el.remove(), 550);
  };
  setTimeout(hide, wait);
  el.addEventListener('pointerdown', hide);
}
