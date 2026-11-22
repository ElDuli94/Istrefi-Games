/**
 * React-innpakning for 3D-øya. Lastes bare når enheten støtter WebGL2.
 * Verden-navnene er vanlige HTML-knapper som følger 3D-posisjonene.
 */
import { useEffect, useRef } from 'react';
import { createIsland, type IslandHandle } from './islandScene';
import { WORLDS, type WorldId } from '../data/worlds';
import { getPhase, getSeason, isChristmas } from '../data/time';
import { Emo } from '../components/Emo';
import { useT } from '../i18n';

const S = 9; // kartprosent → 3D-koordinater

export default function Island3D({ myWorld, onWorld, onShqipo, onSlow }: {
  myWorld: WorldId;
  onWorld(id: WorldId): void;
  onShqipo(): void;
  onSlow(): void;
}) {
  const t = useT();
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pins = useRef<Partial<Record<WorldId, HTMLButtonElement | null>>>({});
  const cb = useRef({ onWorld, onShqipo, onSlow });
  cb.current = { onWorld, onShqipo, onSlow };

  useEffect(() => {
    const el = wrap.current!, cv = canvas.current!;
    let h: IslandHandle;
    try {
      h = createIsland(cv, {
        phase: getPhase(),
        season: getSeason(),
        christmas: isChristmas(),
        worlds: WORLDS.map((w) => ({ id: w.id, x: ((w.map.x - 50) / 50) * S, z: ((w.map.y - 50) / 50) * S })),
        onWorld: (id) => cb.current.onWorld(id),
        onShqipo: () => cb.current.onShqipo(),
        onSlow: () => cb.current.onSlow()
      });
    } catch {
      cb.current.onSlow();
      return;
    }
    const fit = () => h.resize(el.clientWidth, el.clientHeight);
    fit();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    ro?.observe(el);
    window.addEventListener('resize', fit);
    h.onFrame = () => {
      for (const w of WORLDS) {
        const p = h.project(w.id), b = pins.current[w.id];
        if (p && b) b.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -100%)`;
      }
    };
    const lost = (e: Event) => { e.preventDefault(); cb.current.onSlow(); };
    cv.addEventListener('webglcontextlost', lost);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', fit);
      cv.removeEventListener('webglcontextlost', lost);
      h.dispose();
    };
  }, []);

  return (
    <div className="island3d" ref={wrap}>
      <canvas ref={canvas} className="island3d__canvas" aria-hidden />
      {WORLDS.map((w) => (
        <button
          key={w.id}
          ref={(b) => { pins.current[w.id] = b; }}
          className={`world-pin ${myWorld === w.id ? 'is-mine' : ''}`}
          style={{ ['--c' as string]: w.color }}
          onClick={() => onWorld(w.id)}
        >
          <span className="world-pin__icon"><Emo e={w.icon} /></span>
          <span className="world-pin__label">{t(w.nameKey)}<small>{t(w.ageKey)}</small></span>
        </button>
      ))}
    </div>
  );
}
