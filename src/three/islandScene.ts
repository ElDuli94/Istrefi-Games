/**
 * 3D-øya: alt lages med kode (ingen modellfiler), i lavpoly tegneseriestil.
 * Hav med bølger, skyer, båter, hoppende fisk, fire verdener, Shqipo som flyr,
 * dag/kveld/natt etter klokka og pynt etter årstid.
 */
import * as THREE from 'three';
import { buildShqipo } from './shqipo3d';
import type { Phase, Season } from '../data/time';
import type { WorldId } from '../data/worlds';

export interface IslandOptions {
  phase: Phase;
  season: Season;
  christmas: boolean;
  worlds: { id: WorldId; x: number; z: number }[];
  onWorld(id: WorldId): void;
  onShqipo(): void;
  onSlow(): void;
}

export interface IslandHandle {
  /** Skjermposisjon (px) for hver verden-etikett */
  project(id: WorldId): { x: number; y: number } | null;
  resize(w: number, h: number): void;
  /** Kalles hver frame etter tegning (for å flytte HTML-etiketter) */
  onFrame: (() => void) | null;
  dispose(): void;
}

const SKY: Record<Phase, { bg: number; hemiSky: number; hemiGround: number; hemi: number; sun: number; sunColor: number; sea: number }> = {
  day: { bg: 0x8fd8ff, hemiSky: 0xdff4ff, hemiGround: 0x6a994e, hemi: 1.05, sun: 1.6, sunColor: 0xfff4e0, sea: 0x1fb3e0 },
  dusk: { bg: 0xffa98a, hemiSky: 0xffd6b0, hemiGround: 0x7a5c61, hemi: 0.85, sun: 1.2, sunColor: 0xff9f5a, sea: 0x3d8ccf },
  night: { bg: 0x0d2263, hemiSky: 0x7f95e6, hemiGround: 0x2a3560, hemi: 0.95, sun: 0.9, sunColor: 0xaac4ff, sea: 0x14427a }
};

const std = (color: number, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, flatShading: true, ...extra });

/** Rund en sylinder litt ujevnt så kanten blir "håndlaget" */
function wobblyCylinder(rTop: number, rBot: number, h: number, seg: number, seed: number) {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, seg, 1);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const r = Math.hypot(x, z);
    if (r < 0.01) continue;
    const a = Math.atan2(z, x);
    const k = 1 + 0.045 * Math.sin(a * 3 + seed) + 0.03 * Math.sin(a * 7 + seed * 2);
    pos.setX(i, x * k);
    pos.setZ(i, z * k);
  }
  g.computeVertexNormals();
  return g;
}

function windowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, 32, 64);
  for (let y = 4; y < 60; y += 10) for (let x = 4; x < 28; x += 10) {
    g.fillStyle = Math.random() < 0.75 ? '#ffd60a' : '#222';
    g.fillRect(x, y, 6, 6);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

let dotTex: THREE.CanvasTexture | null = null;
function dotTexture() {
  if (dotTex) return dotTex;
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.6, 'rgba(255,255,255,.9)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 32, 32);
  dotTex = new THREE.CanvasTexture(c);
  return dotTex;
}

export function createIsland(canvas: HTMLCanvasElement, opts: IslandOptions): IslandHandle {
  const { phase, season } = opts;
  const sky = SKY[phase];
  const night = phase === 'night';
  const winter = season === 'winter';

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: (window.devicePixelRatio || 1) < 2, powerPreference: 'low-power' });
  let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(sky.bg);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(sky.bg);
  const fog = new THREE.Fog(sky.bg, 34, 70);
  scene.fog = fog;

  const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 200);

  // ---- Lys ----
  scene.add(new THREE.HemisphereLight(sky.hemiSky, sky.hemiGround, sky.hemi));
  const sun = new THREE.DirectionalLight(sky.sunColor, sky.sun);
  sun.position.set(night ? -10 : 12, 20, 8);
  scene.add(sun);

  const anim: ((t: number, dt: number) => void)[] = [];
  const clickables: THREE.Object3D[] = [];

  // ---- Himmel: sol/måne og stjerner ----
  if (night) {
    const moon = new THREE.Mesh(new THREE.SphereGeometry(1.6, 20, 14), new THREE.MeshBasicMaterial({ color: 0xfff6d5, fog: false }));
    moon.position.set(-22, 18, -30);
    scene.add(moon);
    const n = 260;
    const pts = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, e = 0.15 + Math.random() * 1.2, r = 60;
      pts.set([Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r * 0.6 + 4, Math.sin(a) * Math.cos(e) * r], i * 3);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    const sm = new THREE.PointsMaterial({ color: 0xffffff, size: 0.6, fog: false, transparent: true, map: dotTexture(), depthWrite: false });
    scene.add(new THREE.Points(sg, sm));
    anim.push((t) => { sm.opacity = 0.75 + Math.sin(t * 2) * 0.2; });
  } else {
    const sunBall = new THREE.Mesh(new THREE.SphereGeometry(phase === 'dusk' ? 3 : 2.2, 20, 14), new THREE.MeshBasicMaterial({ color: phase === 'dusk' ? 0xff7b39 : 0xfff3a0, fog: false }));
    sunBall.position.set(phase === 'dusk' ? 30 : 24, phase === 'dusk' ? 4 : 22, -40);
    scene.add(sunBall);
  }

  // ---- Hav ----
  const seaGeo = new THREE.PlaneGeometry(110, 110, 44, 44);
  seaGeo.rotateX(-Math.PI / 2);
  const seaPos = seaGeo.attributes.position as THREE.BufferAttribute;
  const base = Float32Array.from(seaPos.array as Float32Array);
  const sea = new THREE.Mesh(seaGeo, new THREE.MeshPhongMaterial({ color: sky.sea, flatShading: true, shininess: 80, specular: 0x88ccff }));
  scene.add(sea);
  const waveY = (x: number, z: number, t: number) => Math.sin(x * 0.35 + t * 1.1) * 0.18 + Math.cos(z * 0.42 + t * 0.9) * 0.15;
  anim.push((t) => {
    const a = seaPos.array as Float32Array;
    for (let i = 0; i < seaPos.count; i++) {
      const x = base[i * 3], z = base[i * 3 + 2];
      const d = Math.hypot(x, z);
      a[i * 3 + 1] = d < 10 ? -0.3 : waveY(x, z, t);
    }
    seaPos.needsUpdate = true;
  });

  // ---- Øya ----
  const island = new THREE.Group();
  scene.add(island);
  const sand = new THREE.Mesh(wobblyCylinder(10.9, 11.8, 1, 36, 1), std(0xffe8a3));
  sand.position.y = 0;
  island.add(sand);
  const grassColor = winter ? 0xf1f7fb : season === 'autumn' ? 0x8ac34a : 0x55c22b;
  const grass = new THREE.Mesh(wobblyCylinder(9.3, 9.9, 1, 32, 2), std(grassColor));
  grass.position.y = 0.6;
  island.add(grass);
  const TOP = 1.1;

  const foamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
  const foam = new THREE.Mesh(new THREE.RingGeometry(11.6, 12.6, 48), foamMat);
  foam.rotation.x = -Math.PI / 2;
  foam.position.y = 0.05;
  scene.add(foam);
  anim.push((t) => {
    const s = 1 + Math.sin(t * 1.4) * 0.025;
    foam.scale.set(s, s, 1);
    foamMat.opacity = 0.45 + Math.sin(t * 1.4) * 0.2;
  });

  // Stier fra midten til hver verden
  const pathMat = std(winter ? 0xd7e3ea : 0xffe8a3);
  const stone = new THREE.CylinderGeometry(0.28, 0.32, 0.12, 8);
  for (const w of opts.worlds) {
    for (let k = 0.18; k < 0.8; k += 0.11) {
      const m = new THREE.Mesh(stone, pathMat);
      m.position.set(w.x * k + Math.sin(k * 9) * 0.25, TOP + 0.02, w.z * k);
      island.add(m);
    }
  }

  // ---- Lekeland (tiny) ----
  const zone = (id: WorldId) => {
    const w = opts.worlds.find((v) => v.id === id)!;
    const g = new THREE.Group();
    g.position.set(w.x, TOP, w.z);
    g.userData.world = id;
    island.add(g);
    clickables.push(g);
    return g;
  };
  {
    const g = zone('tiny');
    const box = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    [[0xff595e, -0.9, 0.45, 0.4], [0x1982c4, 0.05, 0.45, 0.55], [0xffca3a, -0.45, 1.35, 0.45]].forEach(([c, x, y, z], i) => {
      const m = new THREE.Mesh(box, std(c));
      m.position.set(x, y, z);
      m.rotation.y = i * 0.3;
      g.add(m);
    });
    // Karusell
    const car = new THREE.Group();
    car.position.set(1.3, 0, -0.6);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.6, 6), std(0xffffff));
    pole.position.y = 0.8;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1, 0.7, 8), std(0xff006e));
    roof.position.y = 1.9;
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.15, 8), std(0x8338ec));
    floor.position.y = 0.08;
    car.add(pole, roof, floor);
    [0xffd60a, 0x06d6a0, 0x4cc9f0].forEach((c, i) => {
      const seat = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), std(c));
      const a = (i / 3) * Math.PI * 2;
      seat.position.set(Math.cos(a) * 0.7, 0.55, Math.sin(a) * 0.7);
      car.add(seat);
    });
    g.add(car);
    anim.push((t) => { car.rotation.y = t * 0.8; });
    // Hoppende ball
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), std(0xff924c, { flatShading: false }));
    ball.position.set(-0.2, 0.35, -1.3);
    g.add(ball);
    anim.push((t) => { ball.position.y = 0.35 + Math.abs(Math.sin(t * 2.6)) * 1.1; });
    // Regnbue
    const rb = new THREE.Group();
    [0xff595e, 0xffca3a, 0x8ac926, 0x1982c4].forEach((c, i) => {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(1.15 - i * 0.16, 0.08, 6, 20, Math.PI), std(c));
      rb.add(arc);
    });
    rb.position.set(-1.2, 0, -0.9);
    rb.rotation.y = 0.6;
    g.add(rb);
    if (winter) {
      // Snømann
      const sn = new THREE.Group();
      const snow = std(0xffffff, { flatShading: false });
      const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 10), snow);
      b1.position.y = 0.4;
      const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), snow);
      b2.position.y = 0.98;
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.25, 6), std(0xff7b00));
      nose.rotation.x = Math.PI / 2;
      nose.position.set(0, 1.0, 0.32);
      sn.add(b1, b2, nose);
      sn.position.set(0.9, 0, 1.1);
      g.add(sn);
    }
  }

  // ---- Skogen (small) ----
  const leafColors = season === 'autumn' ? [0xf77f00, 0xd62828, 0xfcbf49, 0x2d6a4f]
    : season === 'spring' ? [0xffafcc, 0x2d6a4f, 0x52b788, 0xffc8dd]
    : [0x2d6a4f, 0x40916c, 0x1b4332, 0x52b788];
  function tree(x: number, z: number, s: number, i: number, parent: THREE.Object3D) {
    const t = new THREE.Group();
    t.position.set(x, 0, z);
    t.scale.setScalar(s);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.7, 6), std(0x7f5539));
    trunk.position.y = 0.35;
    const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.2, 7), std(leafColors[i % leafColors.length]));
    c1.position.y = 1.1;
    const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.9, 7), std(leafColors[i % leafColors.length]));
    c2.position.y = 1.7;
    t.add(trunk, c1, c2);
    if (winter) {
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.45, 7), std(0xffffff));
      cap.position.y = 2.0;
      t.add(cap);
    }
    parent.add(t);
    const ph = i * 1.3;
    anim.push((tt) => { t.rotation.z = Math.sin(tt * 1.5 + ph) * 0.05; t.rotation.x = Math.cos(tt * 1.2 + ph) * 0.03; });
    return t;
  }
  {
    const g = zone('small');
    [[-1.2, -0.6, 1.2], [0.2, -1.2, 1.4], [1.3, -0.2, 1.1], [-0.3, 0.6, 1.3], [1.0, 1.1, 1.0], [-1.5, 1.0, 0.9], [0.4, 2.0, 0.8]]
      .forEach(([x, z, s], i) => tree(x, z, s, i, g));
    // Sopp
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), std(0xe63946));
    cap.position.set(-0.6, 0.25, 1.6);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.25, 6), std(0xfff1e6));
    stem.position.set(-0.6, 0.12, 1.6);
    g.add(cap, stem);
  }

  // ---- Fjellene (mid) ----
  {
    const g = zone('mid');
    const peaks: [number, number, number, number, number][] = [[-0.8, 0.3, 2.2, 4.2, 0x9d4edd], [1.0, -0.6, 1.8, 3.3, 0x7b2cbf], [0.6, 1.2, 1.2, 2.2, 0xc77dff]];
    for (const [x, z, r, h, c] of peaks) {
      const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), std(c));
      m.position.set(x, h / 2, z);
      g.add(m);
      const capH = h * (winter ? 0.5 : 0.3);
      const capM = new THREE.Mesh(new THREE.ConeGeometry(r * (capH / h) * 1.04, capH, 6), std(0xffffff));
      capM.position.set(x, h - capH / 2 + 0.01, z);
      g.add(capM);
    }
    // Liten foss
    const fallMat = new THREE.MeshBasicMaterial({ color: 0xbde0fe, transparent: true, opacity: 0.8 });
    const fall = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 1.6), fallMat);
    fall.position.set(-0.2, 0.8, 1.75);
    fall.rotation.x = -0.35;
    if (!winter) g.add(fall);
    anim.push((t) => { fallMat.opacity = 0.65 + Math.sin(t * 8) * 0.15; });
  }

  // ---- Byen (big) ----
  {
    const g = zone('big');
    const tex = windowTexture();
    const em = night ? 1.2 : phase === 'dusk' ? 0.6 : 0;
    const blocks: [number, number, number, number, number][] = [[-1.1, 0.2, 0.9, 2.2, 0x3a0ca3], [0, -0.4, 1.0, 3.4, 0x4361ee], [1.1, 0.3, 0.8, 1.8, 0x3a0ca3], [0.2, 1.0, 0.8, 1.3, 0x7209b7], [-0.6, -1.3, 0.7, 2.6, 0x4895ef]];
    let top: THREE.Mesh | null = null;
    for (const [x, z, w, h, c] of blocks) {
      const t2 = tex.clone();
      t2.repeat.set(1, h / 2);
      t2.wrapT = THREE.RepeatWrapping;
      t2.needsUpdate = true;
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), std(c, { emissive: 0xffd60a, emissiveMap: t2, emissiveIntensity: em }));
      m.position.set(x, h / 2, z);
      g.add(m);
      if (h > 3) top = m;
    }
    if (top) {
      const lampMat = new THREE.MeshBasicMaterial({ color: 0xff006e });
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), lampMat);
      lamp.position.set(top.position.x, 3.55, top.position.z);
      g.add(lamp);
      anim.push((t) => { lamp.visible = Math.sin(t * 4) > -0.2; });
    }
  }

  // ---- Midten: flaggstang og (i desember) juletre ----
  {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6), std(0xffffff));
    pole.position.set(0.3, TOP + 1.3, -0.2);
    island.add(pole);
    const fg = new THREE.PlaneGeometry(1.1, 0.7, 8, 1);
    fg.translate(0.55, 0, 0);
    const fpos = fg.attributes.position as THREE.BufferAttribute;
    const fbase = Float32Array.from(fpos.array as Float32Array);
    const flag = new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ color: 0xe41e20, side: THREE.DoubleSide, roughness: 0.8 }));
    flag.position.set(0.33, TOP + 2.25, -0.2);
    island.add(flag);
    anim.push((t) => {
      const a = fpos.array as Float32Array;
      for (let i = 0; i < fpos.count; i++) {
        const x = fbase[i * 3];
        a[i * 3 + 2] = Math.sin(x * 4 - t * 5) * 0.12 * x;
      }
      fpos.needsUpdate = true;
    });
    if (opts.christmas) {
      const xt = new THREE.Group();
      xt.position.set(-0.9, TOP, 0.6);
      for (let k = 0; k < 3; k++) {
        const c = new THREE.Mesh(new THREE.ConeGeometry(0.9 - k * 0.22, 0.9, 8), std(0x1b5e20));
        c.position.y = 0.6 + k * 0.55;
        xt.add(c);
      }
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.2), new THREE.MeshBasicMaterial({ color: 0xffd60a }));
      star.position.y = 2.25;
      xt.add(star);
      const bulbs: THREE.MeshBasicMaterial[] = [];
      for (let i = 0; i < 12; i++) {
        const bm = new THREE.MeshBasicMaterial({ color: [0xff006e, 0xffd60a, 0x4cc9f0, 0x06d6a0][i % 4] });
        bulbs.push(bm);
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), bm);
        const y = 0.3 + (i / 12) * 1.7, r = 0.85 * (1 - (y - 0.15) / 2.1);
        const a = i * 2.3;
        b.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
        xt.add(b);
      }
      island.add(xt);
      anim.push((t) => {
        star.rotation.y = t;
        bulbs.forEach((b, i) => { b.color.setHex(Math.sin(t * 3 + i) > 0 ? [0xff006e, 0xffd60a, 0x4cc9f0, 0x06d6a0][i % 4] : 0x333333); });
      });
    }
  }

  // ---- Palmer langs stranden ----
  for (let i = 0; i < 6; i++) {
    const a = i * 1.07 + 0.3;
    const r = 10.2;
    const p = new THREE.Group();
    p.position.set(Math.cos(a) * r, 0.5, Math.sin(a) * r);
    const lean = new THREE.Group();
    lean.rotation.z = 0.25;
    lean.rotation.y = -a;
    p.add(lean);
    for (let k = 0; k < 4; k++) {
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.5, 6), std(0xa47148));
      seg.position.set(k * 0.07, 0.25 + k * 0.46, 0);
      lean.add(seg);
    }
    const crown = new THREE.Group();
    crown.position.set(0.3, 2.0, 0);
    for (let k = 0; k < 5; k++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 4), std(winter ? 0x74c69d : 0x38b000));
      leaf.scale.set(0.8, 0.07, 0.22);
      leaf.position.set(0.6, -0.15, 0);
      const holder = new THREE.Group();
      holder.rotation.y = (k / 5) * Math.PI * 2;
      holder.rotation.z = -0.35;
      holder.add(leaf);
      crown.add(holder);
    }
    lean.add(crown);
    island.add(p);
    anim.push((t) => { crown.rotation.y = Math.sin(t * 0.9 + i) * 0.15; crown.rotation.z = Math.sin(t * 1.3 + i) * 0.08; });
  }

  // ---- Blomster om våren/sommeren ----
  if (season === 'spring' || season === 'summer') {
    const cols = [0xff70a6, 0xffd60a, 0xffffff, 0xc77dff];
    const fgeo = new THREE.SphereGeometry(0.12, 6, 4);
    for (let i = 0; i < 46; i++) {
      const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 6.8;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (opts.worlds.some((w) => Math.hypot(w.x - x, w.z - z) < 2.2)) continue;
      const f = new THREE.Mesh(fgeo, std(cols[i % cols.length]));
      f.position.set(x, TOP + 0.1, z);
      island.add(f);
    }
    // Sommerfugler
    for (let i = 0; i < 4; i++) {
      const b = new THREE.Group();
      const wm = new THREE.MeshBasicMaterial({ color: [0xff006e, 0xffbe0b, 0x3a86ff, 0x8338ec][i], side: THREE.DoubleSide });
      const wl = new THREE.Mesh(new THREE.CircleGeometry(0.22, 8), wm);
      const wr = wl.clone();
      wl.position.x = -0.2; wr.position.x = 0.2;
      const pl = new THREE.Group(); pl.add(wl);
      const pr = new THREE.Group(); pr.add(wr);
      b.add(pl, pr);
      island.add(b);
      const cx = (Math.random() - 0.5) * 10, cz = (Math.random() - 0.5) * 10;
      anim.push((t) => {
        const k = t * 0.5 + i * 2;
        b.position.set(cx + Math.sin(k) * 2, TOP + 1.2 + Math.sin(k * 3) * 0.4, cz + Math.cos(k * 1.3) * 2);
        b.rotation.y = -k;
        pl.rotation.y = Math.sin(t * 14) * 1.1;
        pr.rotation.y = -Math.sin(t * 14) * 1.1;
      });
    }
  }

  // ---- Ildfluer om natta ----
  if (night && !winter) {
    const fm = new THREE.MeshBasicMaterial({ color: 0xfff3a0, transparent: true });
    for (let i = 0; i < 14; i++) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), fm.clone());
      island.add(f);
      const cx = (Math.random() - 0.5) * 14, cz = (Math.random() - 0.5) * 14;
      anim.push((t) => {
        f.position.set(cx + Math.sin(t * 0.4 + i) * 1.5, TOP + 0.8 + Math.sin(t * 0.9 + i * 3) * 0.6, cz + Math.cos(t * 0.5 + i) * 1.5);
        (f.material as THREE.MeshBasicMaterial).opacity = 0.4 + Math.max(0, Math.sin(t * 3 + i * 2)) * 0.6;
      });
    }
  }

  // ---- Skyer ----
  const cloudMat = std(night ? 0x8090c0 : 0xffffff, { flatShading: false, roughness: 1, transparent: true, opacity: 0.9 });
  const puff = new THREE.SphereGeometry(1, 12, 8);
  for (let i = 0; i < 7; i++) {
    const c = new THREE.Group();
    const n = 3 + (i % 3);
    for (let k = 0; k < n; k++) {
      const m = new THREE.Mesh(puff, cloudMat);
      const s = 0.9 + Math.random() * 0.8;
      m.scale.set(s * 1.2, s * 0.8, s);
      m.position.set(k * 1.2 - n * 0.6, Math.random() * 0.4, (Math.random() - 0.5) * 0.8);
      c.add(m);
    }
    // Skyene seiler utenfor øya (bak og foran), så de ikke dekker verdenene
    const startX = -30 + i * 9, y = 7 + (i % 3) * 1.2, z = [-19, -15, 17, -23, 21, -17, 15][i];
    scene.add(c);
    const speed = 0.4 + (i % 3) * 0.15;
    anim.push((t) => {
      c.position.set(((startX + t * speed + 32) % 64) - 32, y + Math.sin(t * 0.4 + i) * 0.3, z);
    });
  }

  // ---- Båter ----
  for (let i = 0; i < 2; i++) {
    const b = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.6), std(i ? 0xff595e : 0xffffff));
    hull.position.y = 0.2;
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 5), std(0x7f5539));
    mast.position.y = 1.0;
    const sailG = new THREE.BufferGeometry();
    sailG.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0.5, 0, 0, 1.7, 0, 0.75, 0.5, 0]), 3));
    sailG.computeVertexNormals();
    const sail = new THREE.Mesh(sailG, new THREE.MeshStandardMaterial({ color: i ? 0xffd60a : 0x4cc9f0, side: THREE.DoubleSide }));
    b.add(hull, mast, sail);
    scene.add(b);
    const r = 15 + i * 3, sp = 0.06 + i * 0.03;
    anim.push((t) => {
      const a = t * sp * (i ? -1 : 1) + i * 3;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      b.position.set(x, waveY(x, z, t) - 0.05, z);
      b.rotation.y = -a + (i ? Math.PI : 0);
      b.rotation.z = Math.sin(t * 1.6 + i) * 0.08;
    });
  }

  // ---- Fisk som hopper ----
  {
    const fish = new THREE.Group();
    const fbody = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), std(0xff9f1c));
    fbody.scale.set(1.4, 0.8, 0.6);
    const ftail = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.4, 4), std(0xff9f1c));
    ftail.rotation.z = Math.PI / 2;
    ftail.position.x = -0.6;
    fish.add(fbody, ftail);
    fish.visible = false;
    scene.add(fish);
    let next = 2, start = 0, fx = 0, fz = 0, dir = 0;
    anim.push((t) => {
      if (!fish.visible && t > next) {
        const a = Math.random() * Math.PI * 2, r = 13 + Math.random() * 4;
        fx = Math.cos(a) * r; fz = Math.sin(a) * r; dir = Math.random() * Math.PI * 2;
        start = t; fish.visible = true;
      }
      if (fish.visible) {
        const k = (t - start) / 1.1;
        if (k >= 1) { fish.visible = false; next = t + 3 + Math.random() * 4; return; }
        fish.position.set(fx + Math.cos(dir) * (k - 0.5) * 2.4, Math.sin(k * Math.PI) * 2 - 0.2, fz + Math.sin(dir) * (k - 0.5) * 2.4);
        fish.rotation.set(0, -dir, Math.cos(k * Math.PI) * 1.1);
      }
    });
  }

  // ---- Snø eller løv som faller ----
  if (winter || season === 'autumn') {
    const n = winter ? 500 : 90;
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) p.set([(Math.random() - 0.5) * 34, Math.random() * 16, (Math.random() - 0.5) * 34], i * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const pm = new THREE.PointsMaterial({ color: winter ? 0xffffff : 0xf77f00, size: winter ? 0.32 : 0.45, transparent: true, opacity: 0.95, map: dotTexture(), depthWrite: false });
    scene.add(new THREE.Points(g, pm));
    const fall = winter ? 1.3 : 0.9;
    anim.push((t, dt) => {
      const a = g.attributes.position.array as Float32Array;
      for (let i = 0; i < n; i++) {
        a[i * 3 + 1] -= fall * dt * (0.6 + (i % 5) * 0.12);
        a[i * 3] += Math.sin(t + i) * dt * 0.4;
        if (a[i * 3 + 1] < 0) a[i * 3 + 1] = 16;
      }
      g.attributes.position.needsUpdate = true;
    });
  }

  // ---- Shqipo ----
  const shq = buildShqipo();
  shq.group.scale.setScalar(0.9);
  scene.add(shq.group);
  shq.hit.userData.shqipo = true;
  clickables.push(shq.group);
  const shqPos = new THREE.Vector3(0, 6, 8);
  const shqTarget = new THREE.Vector3();
  let visitUntil = 0;
  const visitPoint = new THREE.Vector3();
  let lastLook = new THREE.Vector3(0, 6, 9);

  // ---- Kamera (dra for å snurre øya) ----
  let yaw = 0.0, pitch = 0.95, yawVel = 0, touchedPitch = false;
  let dist = 30;
  let zoomTo: { x: number; z: number; t0: number } | null = null;
  function placeCamera(t: number) {
    let target = new THREE.Vector3(0, 0.5, 0);
    let d = dist;
    if (zoomTo) {
      const k = Math.min(1, (t - zoomTo.t0) / 0.5);
      const e = k * k * (3 - 2 * k);
      target = target.lerp(new THREE.Vector3(zoomTo.x, 1, zoomTo.z), e);
      d = dist * (1 - 0.45 * e);
    }
    camera.position.set(
      target.x + Math.sin(yaw) * Math.cos(pitch) * d,
      target.y + Math.sin(pitch) * d,
      target.z + Math.cos(yaw) * Math.cos(pitch) * d
    );
    camera.lookAt(target);
  }

  let width = 1, height = 1;
  function resize(w: number, h: number) {
    width = Math.max(1, w); height = Math.max(1, h);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Sørg for at hele øya (radius ~13) får plass både i høyde og bredde
    const vf = (camera.fov * Math.PI) / 360;
    const hf = Math.atan(Math.tan(vf) * camera.aspect);
    dist = Math.max(13.5 / Math.tan(vf) * 0.78, 13.5 / Math.tan(hf)) + 2;
    camera.far = dist + 120;
    fog.near = dist + 4;
    fog.far = dist + 50;
    // Stående skjerm: se mer rett ovenfra så øya fyller mer av høyden
    if (!touchedPitch) pitch = camera.aspect < 0.8 ? 1.18 : camera.aspect < 1.2 ? 1.05 : 0.95;
    camera.updateProjectionMatrix();
  }

  // ---- Input ----
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let down: { x: number; y: number; id: number; moved: boolean; lastX: number; lastY: number; time: number } | null = null;
  let lastInput = 0;

  function pick(cx: number, cy: number) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray;
  }
  const onDown = (e: PointerEvent) => {
    if (down) return;
    down = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false, lastX: e.clientX, lastY: e.clientY, time: performance.now() };
    try { canvas.setPointerCapture(e.pointerId); } catch { /* ignorer */ }
  };
  const onMove = (e: PointerEvent) => {
    if (!down || e.pointerId !== down.id) return;
    const dx = e.clientX - down.lastX, dy = e.clientY - down.lastY;
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) down.moved = true;
    if (down.moved) {
      const now = performance.now();
      const step = -dx * 0.008;
      yaw += step;
      yawVel = step / Math.max(1, now - down.time) * 16;
      pitch = Math.min(1.3, Math.max(0.55, pitch + dy * 0.004));
      if (Math.abs(dy) > 0) touchedPitch = true;
      down.time = now;
      lastInput = clock.elapsedTime;
    }
    down.lastX = e.clientX; down.lastY = e.clientY;
  };
  const onUp = (e: PointerEvent) => {
    if (!down || e.pointerId !== down.id) return;
    const wasTap = !down.moved;
    down = null;
    if (!wasTap) return;
    const r = pick(e.clientX, e.clientY);
    const hits = r.intersectObjects(clickables, true);
    for (const h of hits) {
      let o: THREE.Object3D | null = h.object;
      while (o) {
        if (o === shq.group) { shq.cheer(); opts.onShqipo(); return; }
        if (o.userData.world) { goWorld(o.userData.world as WorldId); return; }
        o = o.parent;
      }
    }
    // Trykk på hav/gress: Shqipo flyr dit
    const p = new THREE.Vector3();
    if (r.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -2.5), p)) {
      const len = Math.hypot(p.x, p.z);
      if (len > 16) p.multiplyScalar(16 / len);
      visitPoint.copy(p);
      visitUntil = clock.elapsedTime + 4;
    }
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', () => { down = null; });

  let navigating = false;
  function goWorld(id: WorldId) {
    if (navigating) return;
    navigating = true;
    const w = opts.worlds.find((v) => v.id === id)!;
    zoomTo = { x: w.x, z: w.z, t0: clock.elapsedTime };
    visitPoint.set(w.x, 4, w.z);
    visitUntil = clock.elapsedTime + 5;
    setTimeout(() => opts.onWorld(id), 480);
  }

  // ---- Animasjonsløkke ----
  // Enkel klokke (sekunder siden start, stopper når appen er skjult)
  const clock = {
    elapsedTime: 0, last: performance.now(), running: true,
    getDelta() { const n = performance.now(); const d = this.running ? (n - this.last) / 1000 : 0; this.last = n; this.elapsedTime += Math.min(d, 0.05); return d; },
    stop() { this.running = false; },
    start() { this.running = true; this.last = performance.now(); }
  };
  let raf = 0;
  let frames = 0, perfStart = 0, slowChecked = false;
  const v = new THREE.Vector3();
  const handle: IslandHandle = {
    onFrame: null,
    resize,
    project(id) {
      const w = opts.worlds.find((x) => x.id === id);
      if (!w) return null;
      v.set(w.x, id === 'mid' ? 5.8 : id === 'big' ? 5 : 3.8, w.z).project(camera);
      return { x: (v.x * 0.5 + 0.5) * width, y: (-v.y * 0.5 + 0.5) * height };
    },
    dispose() {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        mats.forEach((x) => {
          (x as THREE.MeshStandardMaterial).map?.dispose();
          (x as THREE.MeshStandardMaterial).emissiveMap?.dispose();
          x.dispose();
        });
      });
      dotTex = null;
      renderer.dispose();
      renderer.forceContextLoss();
    }
  };

  function frame() {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;

    // Treghet når man slipper etter dra
    if (!down) {
      yaw += yawVel;
      yawVel *= 0.92;
      // Rolig selvrotasjon når ingen rører skjermen
      if (t - lastInput > 6 && !zoomTo) yaw += dt * 0.03;
    }
    placeCamera(t);

    for (const f of anim) f(t, dt);

    // Shqipo flyr en åtte rundt øya, eller til stedet man trykket
    const a = t * 0.28;
    if (t < visitUntil) shqTarget.copy(visitPoint).add(v.set(Math.cos(t * 2) * 0.8, Math.sin(t * 3) * 0.3, Math.sin(t * 2) * 0.8));
    else shqTarget.set(Math.sin(a) * 9, 5 + Math.sin(a * 3) * 0.8, Math.sin(a * 2) * 6);
    const before = shqPos.clone();
    shqPos.lerp(shqTarget, Math.min(1, dt * 1.6));
    shq.group.position.copy(shqPos);
    const vel = shqPos.clone().sub(before);
    if (vel.lengthSq() > 1e-6) lastLook = shqPos.clone().add(vel.normalize());
    shq.group.lookAt(lastLook);
    shq.update(t, dt, true);

    renderer.render(scene, camera);
    handle.onFrame?.();

    // Ytelsessjekk: for treg maskin → senk oppløsning, deretter 2D
    if (t > 1.2 && !slowChecked) {
      if (!perfStart) perfStart = t;
      frames++;
      if (t - perfStart > 3) {
        const fps = frames / (t - perfStart);
        if (fps < 24 && pixelRatio > 1) {
          pixelRatio = 1;
          renderer.setPixelRatio(1);
          resize(width, height);
          frames = 0; perfStart = t;
        } else {
          slowChecked = true;
          if (fps < 18) opts.onSlow();
        }
      }
    }
  }
  const onVis = () => {
    if (document.hidden) { cancelAnimationFrame(raf); clock.stop(); }
    else { clock.start(); frames = 0; perfStart = 0; raf = requestAnimationFrame(frame); }
  };
  document.addEventListener('visibilitychange', onVis);
  raf = requestAnimationFrame(frame);
  return handle;
}
