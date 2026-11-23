/**
 * Viser én ekte 3D-modell. Dyr har animasjoner: står og puster (idle),
 * og gjør et lite triks (dans / nikk / hopp) når `play` endrer seg eller man trykker.
 * Dra sidelengs for å snurre modellen.
 */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { addView, instance, makeView, removeView, type View } from './modelStage';
import type { ModelInfo } from './models';

const TRICKS = ['gesture-positive', 'dance', 'eat', 'run'];

export default function ModelView({ model, play = 0, spin = true, idle = 'idle', onFail }: {
  model: ModelInfo;
  /** Øk tallet for å få dyret til å gjøre et triks */
  play?: number;
  /** Snurrer rolig rundt når ingen rører */
  spin?: boolean;
  idle?: string;
  onFail?: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const view = useRef<View | null>(null);
  const actions = useRef<Record<string, THREE.AnimationAction>>({});
  const drag = useRef<{ x: number; v: number } | null>(null);
  const rotV = useRef(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const cv = canvas.current!;
    const v = makeView(cv);
    view.current = v;
    let alive = true;
    const fit = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, Math.round(r.width * dpr));
      cv.height = Math.max(1, Math.round(r.height * dpr));
      v.camera.aspect = cv.width / cv.height;
      v.camera.updateProjectionMatrix();
    };
    fit();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    ro?.observe(cv);
    instance(model).then(({ root, clips }) => {
      if (!alive) return;
      v.pivot.add(root);
      if (clips.length) {
        const mixer = new THREE.AnimationMixer(root);
        v.mixer = mixer;
        for (const c of clips) actions.current[c.name] = mixer.clipAction(c);
        const a = actions.current[idle] ?? actions.current[clips[0].name];
        a?.play();
        mixer.addEventListener('finished', () => {
          for (const x of Object.values(actions.current)) x.fadeOut(0.25);
          actions.current[idle]?.reset().fadeIn(0.25).play();
        });
      }
      v.tick = (t, dt) => {
        if (!drag.current) {
          rotV.current *= 0.94;
          v.pivot.rotation.y += rotV.current + (spin ? dt * 0.35 : 0);
        }
        if (!clips.length) v.pivot.position.y = Math.sin(t * 2) * 0.03;
      };
      addView(v);
      setReady(true);
    }).catch(() => onFail?.());
    return () => { alive = false; ro?.disconnect(); removeView(v); };
  }, [model]); // eslint-disable-line react-hooks/exhaustive-deps

  // Triks når `play` øker
  useEffect(() => {
    if (!play) return;
    const names = TRICKS.filter((n) => actions.current[n]);
    if (!names.length) { rotV.current += 0.25; return; }
    const a = actions.current[names[play % names.length]];
    for (const x of Object.values(actions.current)) if (x !== a) x.fadeOut(0.2);
    a.reset();
    a.setLoop(THREE.LoopOnce, 1);
    a.clampWhenFinished = false;
    a.fadeIn(0.2).play();
  }, [play]);

  return (
    <canvas
      ref={canvas}
      className={`model-view ${ready ? 'is-ready' : ''}`}
      onPointerDown={(e) => { drag.current = { x: e.clientX, v: 0 }; }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || !view.current) return;
        const dx = (e.clientX - d.x) * 0.012;
        view.current.pivot.rotation.y += dx;
        rotV.current = dx;
        d.x = e.clientX;
      }}
      onPointerUp={() => { drag.current = null; }}
      onPointerCancel={() => { drag.current = null; }}
      onPointerLeave={() => { drag.current = null; }}
    />
  );
}
