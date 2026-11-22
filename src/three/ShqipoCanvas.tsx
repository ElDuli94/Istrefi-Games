import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { buildShqipo } from './shqipo3d';

export default function ShqipoCanvas({ size }: { size: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size, size, false);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x886644, 1.3));
    const d = new THREE.DirectionalLight(0xffffff, 1.4);
    d.position.set(2, 4, 5);
    scene.add(d);
    const cam = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
    cam.position.set(0, 0.9, 7.4);
    cam.lookAt(0, 0.45, 0);
    const s = buildShqipo();
    scene.add(s.group);
    let raf = 0, last = performance.now(), t = 0, next = 0.3;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now; t += dt;
      if (t > next) { s.cheer(); next = t + 2.6; }
      s.group.rotation.y = Math.sin(t * 1.2) * 0.5;
      s.update(t, dt, true);
      renderer.render(scene, cam);
    };
    loop();
    return () => {
      cancelAnimationFrame(raf);
      scene.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose(); (m.material as THREE.Material | undefined)?.dispose?.(); });
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, [size]);
  return <canvas ref={ref} className="shqipo3d" style={{ width: size, height: size }} aria-label="Shqipo" />;
}
