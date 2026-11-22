/** Små glitterprikker der man trykker (ikke inne i spillene). */
const COLORS = ['#ffd60a', '#ff006e', '#4cc9f0', '#06d6a0', '#fff'];

export function installSparkles() {
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  window.addEventListener('pointerdown', (e) => {
    if (location.hash.startsWith('#/play')) return;
    for (let i = 0; i < 7; i++) {
      const s = document.createElement('i');
      s.className = 'tap-spark';
      const a = (i / 7) * Math.PI * 2 + Math.random() * 0.5;
      const r = 26 + Math.random() * 22;
      s.style.left = `${e.clientX}px`;
      s.style.top = `${e.clientY}px`;
      s.style.background = COLORS[i % COLORS.length];
      s.style.setProperty('--dx', `${Math.cos(a) * r}px`);
      s.style.setProperty('--dy', `${Math.sin(a) * r}px`);
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 600);
    }
  }, { passive: true });
}
