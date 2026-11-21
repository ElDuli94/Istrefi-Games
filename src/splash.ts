// Skjuler den animerte åpningsskjermen (som ligger i index.html) når appen er klar.
// Første gang i en økt vises hele animasjonen; senere åpninger går raskere,
// og rett etter en omlasting vises den ikke i det hele tatt.
// Et trykk på skjermen hopper over animasjonen.
const FULL_MS = 3300;
const QUICK_MS = 1400;

export function hideSplashWhenReady() {
  const el = document.getElementById('splash');
  if (!el) return;
  let seen = false;
  let recent = false;
  try {
    const last = Number(sessionStorage.getItem('istrefi-splash') || 0);
    seen = last > 0;
    recent = Date.now() - last < 30000; // vist for under 30 sek siden (f.eks. etter en omlasting)
    sessionStorage.setItem('istrefi-splash', String(Date.now()));
  } catch {
    /* privat modus */
  }
  if (recent) {
    el.remove(); // ikke vis åpningsskjermen to ganger rett etter hverandre
    return;
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
