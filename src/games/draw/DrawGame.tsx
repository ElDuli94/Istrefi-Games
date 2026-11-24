/**
 * Tegnebrett – tegn fritt med fingeren (flere fingre samtidig går fint).
 * Tegningen lagres som "streker" (vektor), så angre og skjermrotasjon fungerer uten tap.
 * Pensler: vanlig, regnbue, glitter og neon. Speiltegning (sommerfugleffekt) og fire bakgrunner.
 */
import { Emo, emojiImage } from '../../components/Emo';
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import type { GameProps } from '../types';
import { EMOJI_FONT } from '../../emojiFont';
import './draw.css';

type Tool = 'brush' | 'rainbow' | 'glitter' | 'neon' | 'stamp' | 'eraser';
interface Stroke {
  tool: Tool;
  color: string;
  size: number;
  points: [number, number][];
  stamp?: string;
  /** Speiltegning: lerretets bredde (CSS-piksler) da streken ble tegnet */
  mirror?: number;
}
interface SavedData {
  gallery: string[];
}

const COLORS_TODDLER = ['#e63946', '#ff9f1c', '#ffd60a', '#06d6a0', '#3a86ff', '#8338ec', '#ff70a6', '#3d2618'];
const COLORS_ALL = [...COLORS_TODDLER, '#000000', '#ffffff', '#8ecae6', '#2d6a4f', '#ffb4a2', '#adb5bd'];
const STAMPS = ['⭐', '❤️', '🌸', '☀️', '🌈', '🐶', '🐱', '🦋', '🚗', '🎈', '🍎', '👑'];
const SIZES = [6, 14, 28];
const MAX_GALLERY = 8;
const PAPERS = ['white', 'sky', 'grass', 'night'] as const;
type Paper = (typeof PAPERS)[number];
/** Tegner bakgrunnen (brukes når tegningen lagres i galleriet) */
function paintPaper(g: CanvasRenderingContext2D, w: number, h: number, paper: Paper) {
  if (paper === 'white') { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); return; }
  const gr = g.createLinearGradient(0, 0, 0, h);
  if (paper === 'sky') { gr.addColorStop(0, '#8ed8ff'); gr.addColorStop(1, '#e8f7ff'); }
  if (paper === 'grass') { gr.addColorStop(0, '#a0e7ff'); gr.addColorStop(0.62, '#d9f6ff'); gr.addColorStop(0.62, '#95d5b2'); gr.addColorStop(1, '#52b788'); }
  if (paper === 'night') { gr.addColorStop(0, '#10002b'); gr.addColorStop(1, '#3c096c'); }
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  if (paper === 'night') { g.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc((i * 97) % w, (i * 53) % (h * 0.7), 1.5, 0, Math.PI * 2); g.fill(); } }
}
// Glitter: faste «tilfeldige» tall per punkt, så tegningen ser lik ut etter angre/rotasjon
const rnd = (i: number, k: number) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
STAMPS.forEach((e) => emojiImage(e)); // last inn 3D-stemplene på forhånd

function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke, from = 0) {
  drawStrokeOnce(ctx, s, from);
  if (s.mirror) {
    // Speilet kopi på den andre siden av midtlinjen
    ctx.save();
    ctx.translate(s.mirror, 0);
    ctx.scale(-1, 1);
    drawStrokeOnce(ctx, s, from);
    ctx.restore();
  }
}

function drawStrokeOnce(ctx: CanvasRenderingContext2D, s: Stroke, from = 0) {
  ctx.globalCompositeOperation = s.tool === 'eraser' ? 'destination-out' : 'source-over';
  if (s.tool === 'stamp') {
    const [x, y] = s.points[0];
    ctx.font = `${s.size * 3}px ${EMOJI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const img = emojiImage(s.stamp ?? '⭐');
    const d = s.size * 3.2;
    if (img) ctx.drawImage(img, x - d / 2, y - d / 2, d, d);
    else ctx.fillText(s.stamp ?? '⭐', x, y);
    return;
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = s.size;
  if (s.tool === 'glitter') {
    // Små stjerner og prikker i mange farger rundt streken
    for (let i = from; i < s.points.length; i++) {
      const [x, y] = s.points[i];
      for (let k = 0; k < 3; k++) {
        const dx = (rnd(i, k) - 0.5) * s.size * 2.2, dy = (rnd(i, k + 7) - 0.5) * s.size * 2.2;
        ctx.fillStyle = `hsl(${Math.floor(rnd(i, k + 3) * 360)} 95% 60%)`;
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, 1 + rnd(i, k + 5) * s.size * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
      if (i % 6 === 0) { ctx.fillStyle = '#fff8b0'; ctx.font = `${s.size * 1.2}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✦', x, y); }
    }
    return;
  }
  if (s.tool === 'neon') {
    ctx.shadowColor = s.color;
    ctx.shadowBlur = s.size * 1.2;
  }
  const color = (i: number) => (s.tool === 'eraser' ? '#000' : s.tool === 'rainbow' ? `hsl(${(i * 6) % 360} 90% 55%)` : s.tool === 'neon' ? '#ffffff' : s.color);
  if (s.points.length === 1) {
    const [x, y] = s.points[0];
    ctx.fillStyle = color(0);
    ctx.beginPath();
    ctx.arc(x, y, s.size / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  for (let i = Math.max(1, from); i < s.points.length; i++) {
    ctx.strokeStyle = color(i);
    ctx.beginPath();
    ctx.moveTo(...s.points[i - 1]);
    ctx.lineTo(...s.points[i]);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  if (s.tool === 'neon') {
    // Farget kant rundt den hvite kjernen
    ctx.globalCompositeOperation = 'destination-over';
    ctx.lineWidth = s.size * 1.8;
    ctx.strokeStyle = s.color;
    ctx.beginPath();
    for (let i = Math.max(1, from); i < s.points.length; i++) { ctx.moveTo(...s.points[i - 1]); ctx.lineTo(...s.points[i]); }
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }
}

export default function DrawGame({ world, api, onFinish }: GameProps) {
  const toddler = world === 'tiny';
  const colors = toddler ? COLORS_TODDLER : COLORS_ALL;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const active = useRef(new Map<number, Stroke>());
  const [count, setCount] = useState(0); // antall streker (for knapper)
  const [tool, setTool] = useState<Tool>('brush');
  const [color, setColor] = useState(colors[0]);
  const [size, setSize] = useState(toddler ? 28 : 14);
  const [stamp, setStamp] = useState(STAMPS[0]);
  const [mirror, setMirror] = useState(false);
  const [paper, setPaper] = useState<Paper>('white');
  const [showStamps, setShowStamps] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [gallery, setGallery] = useState(() => api.loadData<SavedData>()?.gallery ?? []);
  const [showGallery, setShowGallery] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);

  const ctx = () => canvasRef.current!.getContext('2d')!;

  function redraw() {
    const c = canvasRef.current!;
    const g = ctx();
    const dpr = window.devicePixelRatio || 1;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, c.width, c.height);
    strokes.current.forEach((s) => drawStroke(g, s));
  }

  useLayoutEffect(() => {
    const wrap = wrapRef.current!;
    const ro = new ResizeObserver(() => {
      const c = canvasRef.current!;
      const dpr = window.devicePixelRatio || 1;
      c.width = Math.round(wrap.clientWidth * dpr);
      c.height = Math.round(wrap.clientHeight * dpr);
      redraw();
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  useEffect(() => api.speak(api.t('drawSomething')), []); // eslint-disable-line react-hooks/exhaustive-deps

  const pos = (e: { clientX: number; clientY: number }): [number, number] => {
    const r = canvasRef.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  function down(e: RPointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    setConfirmClear(false);
    setShowStamps(false);
    canvasRef.current!.setPointerCapture(e.pointerId);
    const s: Stroke = { tool, color, size: tool === 'eraser' ? size * 2 : size, points: [pos(e)], stamp, mirror: mirror ? canvasRef.current!.clientWidth : undefined };
    if (tool === 'stamp') {
      api.sfx('pop');
      strokes.current.push(s);
      drawStroke(ctx(), s);
      setCount(strokes.current.length);
      return;
    }
    active.current.set(e.pointerId, s);
    strokes.current.push(s);
    drawStroke(ctx(), s);
  }

  function move(e: RPointerEvent<HTMLCanvasElement>) {
    const s = active.current.get(e.pointerId);
    if (!s) return;
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
    const from = s.points.length;
    for (const ev of events) s.points.push(pos(ev));
    drawStroke(ctx(), s, from);
  }

  function up(e: RPointerEvent<HTMLCanvasElement>) {
    if (active.current.delete(e.pointerId)) setCount(strokes.current.length);
  }

  function undo() {
    api.sfx('tap');
    strokes.current.pop();
    setCount(strokes.current.length);
    redraw();
  }

  function clear() {
    if (!confirmClear) {
      api.sfx('tap');
      setConfirmClear(true);
      api.speak(api.t('tapAgainToClear'));
      setTimeout(() => setConfirmClear(false), 2500);
      return;
    }
    api.sfx('nope');
    strokes.current = [];
    setCount(0);
    setConfirmClear(false);
    redraw();
  }

  function finish() {
    // Lag et lite bilde til galleriet (sparer plass i nettleserens lagring).
    const c = canvasRef.current!;
    const scale = Math.min(1, 480 / Math.max(c.width, c.height));
    const t = document.createElement('canvas');
    t.width = Math.round(c.width * scale);
    t.height = Math.round(c.height * scale);
    const tg = t.getContext('2d')!;
    paintPaper(tg, t.width, t.height, paper);
    tg.drawImage(c, 0, 0, t.width, t.height);
    const next = [t.toDataURL('image/jpeg', 0.75), ...gallery].slice(0, MAX_GALLERY);
    setGallery(next);
    api.saveData({ gallery: next } satisfies SavedData);
    onFinish({ won: true, stars: 3, coins: 5 });
  }

  const pickTool = (t: Tool) => { api.sfx('tap'); setTool(t); setShowStamps(t === 'stamp' && (tool !== 'stamp' || !showStamps)); };

  return (
    <div className={`draw ${toddler ? 'draw--toddler' : ''}`}>
      <div className={`draw__paper draw__paper--${paper} ${mirror ? 'is-mirror' : ''}`} ref={wrapRef}>
        <canvas
          ref={canvasRef}
          className={`draw__canvas draw__canvas--${tool}`}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        />
      </div>

      <div className="draw__bar">
        <div className="draw__colors">
          {colors.map((c) => (
            <button
              key={c}
              className={`swatch ${color === c && (tool === 'brush' || tool === 'neon') ? 'is-on' : ''}`}
              style={{ background: c }}
              onClick={() => { api.sfx('pop'); setColor(c); setTool(tool === 'neon' ? 'neon' : 'brush'); setShowStamps(false); }}
              aria-label={c}
            />
          ))}
          <button className={`swatch swatch--rainbow ${tool === 'rainbow' ? 'is-on' : ''}`} onClick={() => pickTool('rainbow')} aria-label="rainbow" />
          <button className={`swatch swatch--fx ${tool === 'glitter' ? 'is-on' : ''}`} onClick={() => pickTool('glitter')} aria-label="glitter"><Emo e="✨" /></button>
          <button className={`swatch swatch--fx swatch--neon ${tool === 'neon' ? 'is-on' : ''}`} style={{ ['--c' as string]: color }} onClick={() => pickTool('neon')} aria-label="neon"><Emo e="💡" /></button>
        </div>

        <div className="draw__tools">
          <button className={`tool ${tool === 'stamp' ? 'is-on' : ''}`} onClick={() => pickTool('stamp')} aria-label="stamp"><Emo e={stamp} /></button>
          <button className={`tool ${tool === 'eraser' ? 'is-on' : ''}`} onClick={() => pickTool('eraser')} aria-label="eraser">🧽</button>
          <button className={`tool ${mirror ? 'is-on' : ''}`} onClick={() => { api.sfx('tap'); setMirror(!mirror); if (!mirror) api.speak(api.t('mirrorOn')); }} aria-label={api.t('mirrorOn')}>🦋</button>
          <button className="tool" onClick={() => { api.sfx('tap'); setPaper(PAPERS[(PAPERS.indexOf(paper) + 1) % PAPERS.length]); }} aria-label={api.t('paper')}>{paper === 'white' ? '📄' : paper === 'sky' ? '🌤️' : paper === 'grass' ? '🌳' : '🌙'}</button>
          {!toddler && SIZES.map((s) => (
            <button key={s} className={`tool tool--size ${size === s ? 'is-on' : ''}`} onClick={() => { api.sfx('tap'); setSize(s); }} aria-label={`size ${s}`}>
              <span style={{ width: s * 0.9 + 4, height: s * 0.9 + 4, background: tool === 'brush' ? color : '#333' }} />
            </button>
          ))}
          <button className="tool" onClick={undo} disabled={!count} aria-label="undo">↩️</button>
          <button className={`tool ${confirmClear ? 'is-warn' : ''}`} onClick={clear} disabled={!count} aria-label={api.t('clearAll')}>🗑️</button>
          <button className="tool" onClick={() => { api.sfx('tap'); setShowGallery(true); }} aria-label={api.t('myDrawings')}>🖼️</button>
          <button className="tool tool--done" onClick={finish} disabled={count < 2} aria-label={api.t('done')}>✔</button>
        </div>

        {showStamps && (
          <div className="draw__stamps pop-in">
            {STAMPS.map((s) => (
              <button key={s} className={`tool ${stamp === s ? 'is-on' : ''}`} onClick={() => { api.sfx('pop'); setStamp(s); setShowStamps(false); }}><Emo e={s} /></button>
            ))}
          </div>
        )}
      </div>

      {showGallery && (
        <div className="gallery" onClick={() => { setShowGallery(false); setViewing(null); }}>
          <div className="gallery__card pop-in" onClick={(e) => e.stopPropagation()}>
            <h2>🖼️ {api.t('myDrawings')}</h2>
            {viewing ? (
              <div className="gallery__view">
                <img src={viewing} alt="" />
                <div className="gallery__actions">
                  <button className="tool" onClick={() => setViewing(null)}>⬅️</button>
                  {!toddler && <a className="tool" href={viewing} download="istrefi-tegning.jpg">⬇️</a>}
                </div>
              </div>
            ) : gallery.length === 0 ? (
              <p>{api.t('noDrawings')}</p>
            ) : (
              <div className="gallery__grid">
                {gallery.map((src, i) => (
                  <button key={i} onClick={() => setViewing(src)}><img src={src} alt="" /></button>
                ))}
              </div>
            )}
            <button className="tool gallery__close" onClick={() => { setShowGallery(false); setViewing(null); }}>✖</button>
          </div>
        </div>
      )}
    </div>
  );
}
