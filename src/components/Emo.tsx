/**
 * 3D-emoji (Microsoft Fluent Emoji 3D, MIT-lisens).
 * <Emo e="🐶" /> viser 3D-figuren i samme størrelse som teksten rundt (1em),
 * og faller tilbake til vanlig emoji hvis det ikke finnes en 3D-versjon (f.eks. flagg).
 */
import { Fragment, type CSSProperties } from 'react';
import { EMOJI3D } from '../emoji3dList';

const AVAILABLE = new Set(EMOJI3D);
const BASE = `${import.meta.env.BASE_URL}emoji3d/`;
const keyOf = (e: string) => [...e].map((c) => c.codePointAt(0)!.toString(16)).filter((h) => h !== 'fe0f').join('-');
const seg = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter('en', { granularity: 'grapheme' }) : null;
const EMOJI_RE = /\p{Extended_Pictographic}/u;

export function has3d(e: string) {
  return AVAILABLE.has(keyOf(e));
}
export function emojiUrl(e: string) {
  return has3d(e) ? `${BASE}${keyOf(e)}.webp` : null;
}

export function Emo({ e, size, className = '', style }: { e: string; size?: number | string; className?: string; style?: CSSProperties }) {
  const url = emojiUrl(e);
  const dim = size === undefined ? '1em' : typeof size === 'number' ? `${size}px` : size;
  if (!url) return <span className={`emo emo--txt ${className}`} style={{ fontSize: size, ...style }}>{e}</span>;
  return <img src={url} alt={e} draggable={false} className={`emo ${className}`} style={{ width: dim, height: dim, ...style }} />;
}

/** Tekst der alle emoji byttes ut med 3D-figurer, f.eks. "🎈 Ballongsprekk". */
export function EmojiText({ text }: { text: string }) {
  if (!seg || !EMOJI_RE.test(text)) return <>{text}</>;
  const parts = Array.from(seg.segment(text), (s) => s.segment);
  return (
    <>
      {parts.map((p, i) => (EMOJI_RE.test(p) ? <Emo key={i} e={p} /> : <Fragment key={i}>{p}</Fragment>))}
    </>
  );
}

// ---- For tegning på <canvas> (Slangejakt, Tegnebrett) ----
const imgCache = new Map<string, HTMLImageElement>();
/** Returnerer et ferdig lastet bilde av 3D-emojien, eller null (da tegnes vanlig emoji). */
export function emojiImage(e: string): HTMLImageElement | null {
  const url = emojiUrl(e);
  if (!url) return null;
  let img = imgCache.get(url);
  if (!img) {
    img = new Image();
    img.src = url;
    imgCache.set(url, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}
