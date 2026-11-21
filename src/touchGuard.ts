/**
 * Hindrer at barns dra-bevegelser lukker, zoomer eller laster appen på nytt.
 *
 * - Ingen "dra ned for å laste på nytt" / gummistrikk-effekt på siden
 * - Ingen knip-zoom
 * - Rulling er fortsatt mulig inne i lister som faktisk kan rulles
 *
 * Merk: iPadens egne systembevegelser (sveip opp fra bunnen for å gå hjem)
 * kan ingen nettside stoppe. Til det brukes "Guidet tilgang" (se foreldredelen).
 */
function canScroll(el: Element | null, dy: number): boolean {
  while (el && el !== document.body) {
    const style = getComputedStyle(el);
    const scrollY = /(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1;
    const scrollX = /(auto|scroll)/.test(style.overflowX) && el.scrollWidth > el.clientWidth + 1;
    if (scrollX) return true;
    if (scrollY) {
      const atTop = el.scrollTop <= 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      // La lista rulle, men ikke "dra med" hele siden når man er på toppen/bunnen
      if ((dy > 0 && !atTop) || (dy < 0 && !atBottom)) return true;
    }
    el = el.parentElement;
  }
  return false;
}

export function installTouchGuard() {
  let startY = 0;
  document.addEventListener('touchstart', (e) => {
    startY = e.touches[0]?.clientY ?? 0;
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) {
      e.preventDefault(); // knip-zoom
      return;
    }
    const dy = (e.touches[0]?.clientY ?? 0) - startY;
    const target = e.target as Element;
    if (target.closest('input, textarea, select')) return;
    if (!canScroll(target, dy)) e.preventDefault();
  }, { passive: false });

  // Safari: blokker knip-zoom
  for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
  }

  // Dobbelttrykk-zoom stoppes av CSS (touch-action: manipulation), så raske trykk fortsatt virker.

  // Ingen høyreklikk-/hold-meny på bilder og tekst
  document.addEventListener('contextmenu', (e) => e.preventDefault());
}
