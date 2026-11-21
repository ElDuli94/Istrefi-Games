// Små reserveløsninger for eldre iPader (iOS 13).
if (typeof window.ResizeObserver === 'undefined') {
  class SimpleResizeObserver {
    private cb: () => void;
    constructor(cb: () => void) {
      this.cb = () => cb();
    }
    observe() {
      window.addEventListener('resize', this.cb);
      setTimeout(this.cb, 0);
    }
    unobserve() {}
    disconnect() {
      window.removeEventListener('resize', this.cb);
    }
  }
  (window as unknown as { ResizeObserver: unknown }).ResizeObserver = SimpleResizeObserver;
}
export {};
