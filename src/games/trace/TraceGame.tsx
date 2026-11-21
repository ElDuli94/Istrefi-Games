/**
 * Skriv bokstaver – følg den stiplede bokstaven med fingeren.
 * Bokstaven er klar når det meste av den er fargelagt (og ikke for mye utenfor).
 * Fungerer for norsk og albansk alfabet (store og små bokstaver) og tall.
 */
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import type { GameApi, GameProps } from '../types';
import { ALPHABETS } from '../../data/alphabets';
import './trace.css';

type Mode = 'upper' | 'lower' | 'digits';
interface SavedData { done: string[] }
const ROUND = 5;
const FONT = '"Baloo 2", "Arial Rounded MT Bold", sans-serif';

function charsFor(mode: Mode, api: GameApi) {
  if (mode === 'digits') return '0 1 2 3 4 5 6 7 8 9'.split(' ');
  const up = ALPHABETS[api.lang];
  return mode === 'upper' ? up : up.map((c) => c.toLowerCase());
}

export default function TraceGame(props: GameProps) {
  const { api, world, onFinish } = props;
  const [saved, setSaved] = useState<SavedData>(() => api.loadData<SavedData>() ?? { done: [] });
  const [mode, setMode] = useState<Mode>('upper');
  const [start, setStart] = useState<number | null>(null);
  const chars = charsFor(mode, api);

  if (start === null) {
    return (
      <div className="trace-pick">
        <nav className="trace-tabs">
          {([['upper', 'ABC'], ['lower', 'abc'], ['digits', '123']] as const).map(([m, label]) => (
            <button key={m} className={mode === m ? 'is-active' : ''} onClick={() => { api.sfx('tap'); setMode(m); }}>{label}</button>
          ))}
        </nav>
        <div className="trace-grid">
          {chars.map((ch, i) => (
            <button key={ch} className={`trace-tile pop-in ${saved.done.includes(`${mode}:${ch}`) ? 'is-done' : ''}`} style={{ animationDelay: `${Math.min(i, 20) * 0.02}s` }}
              onClick={() => { api.sfx('pop'); api.speak(ch.toLowerCase()); setStart(i); }}>
              {ch}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const round = Array.from({ length: Math.min(ROUND, chars.length) }, (_, k) => chars[(start + k) % chars.length]);
  return (
    <Tracer
      api={api}
      letters={round}
      lenient={world === 'tiny'}
      onLetterDone={(ch) => {
        const key = `${mode}:${ch}`;
        setSaved((s) => {
          if (s.done.includes(key)) return s;
          const next = { done: [...s.done, key] };
          api.saveData(next);
          return next;
        });
      }}
      onRoundDone={(newOnes) => onFinish({ won: true, stars: 3, firstClear: newOnes > 0, coins: 10 + (newOnes > 0 ? 10 : 0) })}
      isNew={(ch) => !saved.done.includes(`${mode}:${ch}`)}
    />
  );
}

function Tracer({ api, letters, lenient, onLetterDone, onRoundDone, isNew }: {
  api: GameApi; letters: string[]; lenient: boolean;
  onLetterDone: (ch: string) => void; onRoundDone: (newOnes: number) => void; isNew: (ch: string) => boolean;
}) {
  const [idx, setIdx] = useState(0);
  const [size, setSize] = useState(0);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const guideRef = useRef<HTMLCanvasElement>(null);
  const paintRef = useRef<HTMLCanvasElement>(null);
  const mask = useRef<{ pts: [number, number][]; inside: (x: number, y: number) => boolean } | null>(null);
  const drawing = useRef(false);
  const last = useRef<[number, number] | null>(null);
  const strokePts = useRef<[number, number][]>([]);
  const hue = useRef(0);
  const newCount = useRef(0);
  const ch = letters[idx];

  useLayoutEffect(() => {
    const el = wrapRef.current!;
    const ro = new ResizeObserver(() => setSize(Math.floor(Math.min(el.clientWidth, el.clientHeight) - 8)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Tegn veiledningen og lag "masken" for bokstaven
  useEffect(() => {
    if (!size) return;
    let cancelled = false;
    const run = async () => {
      try { await document.fonts.load(`800 100px ${FONT}`); } catch { /* bruk reserve-skrift */ }
      if (cancelled) return;
      const dpr = window.devicePixelRatio || 1;
      for (const c of [guideRef.current!, paintRef.current!]) { c.width = size * dpr; c.height = size * dpr; c.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0); }
      const g = guideRef.current!.getContext('2d')!;
      let fs = size * 0.82;
      g.font = `800 ${fs}px ${FONT}`;
      const w = g.measureText(ch).width;
      if (w > size * 0.86) fs *= (size * 0.86) / w;
      const font = `800 ${fs}px ${FONT}`;
      const drawGlyph = (ctx: CanvasRenderingContext2D) => { ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; };
      g.clearRect(0, 0, size, size);
      drawGlyph(g);
      // Stiplet ytterkant: tykk stiplet strek, og så fyll over, så bare kanten utenfor synes
      // (skjuler skriftens interne overlapp).
      g.setLineDash([size * 0.03, size * 0.024]);
      g.lineWidth = Math.max(5, size * 0.024);
      g.lineJoin = 'round';
      g.strokeStyle = '#9aa5b8';
      g.strokeText(ch, size / 2, size * 0.54);
      g.setLineDash([]);
      g.fillStyle = '#eef1f6';
      g.fillText(ch, size / 2, size * 0.54);
      // Maske i lav oppløsning
      const m = document.createElement('canvas');
      m.width = size; m.height = size;
      const mc = m.getContext('2d')!;
      drawGlyph(mc);
      mc.fillStyle = '#000';
      mc.fillText(ch, size / 2, size * 0.54);
      const data = mc.getImageData(0, 0, size, size).data;
      const inside = (x: number, y: number) => {
        const xi = Math.round(x), yi = Math.round(y);
        if (xi < 0 || yi < 0 || xi >= size || yi >= size) return false;
        return data[(yi * size + xi) * 4 + 3] > 40;
      };
      const pts: [number, number][] = [];
      const step = Math.max(4, Math.round(size / 70));
      for (let y = 0; y < size; y += step) for (let x = 0; x < size; x += step) if (inside(x, y)) pts.push([x, y]);
      mask.current = { pts, inside };
      strokePts.current = [];
      setProgress(0);
      setSuccess(false);
      api.speak(ch.toLowerCase());
    };
    run();
    return () => { cancelled = true; };
  }, [size, ch]); // eslint-disable-line react-hooks/exhaustive-deps

  const brush = () => size * 0.13;
  const pos = (e: { clientX: number; clientY: number }): [number, number] => {
    const r = paintRef.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  function down(e: RPointerEvent<HTMLCanvasElement>) {
    if (success) return;
    e.preventDefault();
    paintRef.current!.setPointerCapture(e.pointerId);
    drawing.current = true;
    hue.current = (hue.current + 50) % 360;
    last.current = pos(e);
    paint(last.current, last.current);
  }
  function move(e: RPointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !last.current) return;
    const p = pos(e);
    paint(last.current, p);
    last.current = p;
  }
  function paint(a: [number, number], b: [number, number]) {
    const ctx = paintRef.current!.getContext('2d')!;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brush();
    ctx.strokeStyle = `hsl(${hue.current} 85% 58%)`;
    ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
    strokePts.current.push(b);
  }
  function up() {
    if (!drawing.current) return;
    drawing.current = false;
    check();
  }

  function check() {
    const m = mask.current;
    if (!m || success) return;
    const ctx = paintRef.current!.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const img = ctx.getImageData(0, 0, size * dpr, size * dpr).data;
    const painted = (x: number, y: number) => img[((Math.round(y * dpr) * size * dpr) + Math.round(x * dpr)) * 4 + 3] > 0;
    const coveredPts = m.pts.filter(([x, y]) => painted(x, y)).length;
    const covered = coveredPts / Math.max(1, m.pts.length);
    // Maling utenfor bokstaven (målt på et rutenett). Kludring over hele arket gir mye utenfor.
    let outsidePainted = 0;
    const step = Math.max(4, Math.round(size / 70));
    for (let y = 0; y < size; y += step) for (let x = 0; x < size; x += step) if (painted(x, y) && !m.inside(x, y)) outsidePainted++;
    const tooMessy = outsidePainted > coveredPts * (lenient ? 1.6 : 0.9);
    setProgress(tooMessy ? 0 : Math.min(1, covered / (lenient ? 0.55 : 0.72)));
    if (covered >= (lenient ? 0.55 : 0.72) && !tooMessy) {
      setSuccess(true);
      api.sfx('win');
      api.speak(ch.toLowerCase());
      if (isNew(ch)) newCount.current += 1;
      onLetterDone(ch);
      // Fyll bokstaven med regnbuefarger
      const g = guideRef.current!.getContext('2d')!;
      const grad = g.createLinearGradient(0, 0, size, size);
      ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'].forEach((c, i) => grad.addColorStop(i / 4, c));
      g.setLineDash([]);
      g.fillStyle = grad;
      g.fillText(ch, size / 2, size * 0.54);
      paintRef.current!.getContext('2d')!.clearRect(0, 0, size, size);
      setTimeout(() => {
        if (idx + 1 >= letters.length) onRoundDone(newCount.current);
        else setIdx(idx + 1);
      }, 1400);
    } else if (tooMessy) {
      api.sfx('nope');
    }
  }

  function clear() {
    api.sfx('tap');
    paintRef.current!.getContext('2d')!.clearRect(0, 0, size, size);
    strokePts.current = [];
    setProgress(0);
  }

  return (
    <div className="tracer">
      <div className="tracer__top">
        <span className="hud-chip">{idx + 1} / {letters.length}</span>
        <span className="tracer__meter"><i style={{ width: `${progress * 100}%` }} /></span>
        <button className="hud-chip tracer__btn" onClick={() => api.speak(ch.toLowerCase())} aria-label="lytt">🔊</button>
        <button className="hud-chip tracer__btn" onClick={clear} aria-label="prøv igjen">🔄</button>
      </div>
      <div className="tracer__stage" ref={wrapRef}>
        <div className={`tracer__paper ${success ? 'is-success' : ''}`} style={{ width: size, height: size }}>
          <canvas ref={guideRef} style={{ width: size, height: size }} />
          <canvas ref={paintRef} style={{ width: size, height: size }} className="tracer__paint"
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
          {success && <span className="tracer__star">⭐</span>}
        </div>
      </div>
    </div>
  );
}
