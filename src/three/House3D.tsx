/**
 * Shqipos hus i 3D – viser rommet barnet har innredet, med ekte 3D-møbler, planter og dyr
 * (Kenney, CC0). Ting uten modell vises som 3D-emoji på et «skilt». Dra for å se rundt.
 * Barnets figur står i rommet og danser når man trykker på den.
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { instance } from './modelStage';
import { modelFor } from './models';
import { buildShqipo } from './shqipo3d';
import { emojiUrl } from '../components/Emo';
import { houseItemById, type House } from '../data/house';

/** Gjør om CSS-bakgrunn (farge/stripe/rute/prikker) til en enkel tekstur. */
function cssTexture(css: string, repeat: [number, number]): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const cols = css.match(/#[0-9a-f]{3,8}/gi) ?? ['#ffe5b4'];
  if (css.includes('repeating-linear-gradient(90deg')) {
    g.fillStyle = cols[0]; g.fillRect(0, 0, 128, 128);
    g.fillStyle = cols[1] ?? cols[0]; g.fillRect(120, 0, 8, 128);
  } else if (css.includes('repeating-linear-gradient(0deg')) {
    g.fillStyle = cols[0]; g.fillRect(0, 0, 128, 128);
    g.fillStyle = cols[1] ?? '#fff'; g.fillRect(0, 108, 128, 20);
  } else if (css.includes('conic')) {
    g.fillStyle = cols[0]; g.fillRect(0, 0, 128, 128);
    g.fillStyle = cols[1] ?? '#ccc'; g.fillRect(64, 0, 64, 64); g.fillRect(0, 64, 64, 64);
  } else if (css.includes('radial')) {
    g.fillStyle = cols[cols.length - 1]; g.fillRect(0, 0, 128, 128);
    g.fillStyle = cols[0];
    for (const [x, y] of [[32, 32], [96, 96]]) { g.beginPath(); g.arc(x, y, 12, 0, Math.PI * 2); g.fill(); }
  } else if (cols.length > 1) {
    const gr = g.createLinearGradient(0, 0, 128, 0);
    cols.forEach((col, i) => gr.addColorStop(i / (cols.length - 1), col));
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  } else { g.fillStyle = cols[0]; g.fillRect(0, 0, 128, 128); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  return t;
}

/** 3D-emoji som et «skilt» som alltid ser mot kameraet */
function emojiSprite(e: string, h: number): THREE.Sprite {
  const mat = new THREE.SpriteMaterial({ transparent: true });
  const url = emojiUrl(e);
  const tex = url ? new THREE.TextureLoader().load(url) : (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d')!; g.font = '100px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, 64, 70);
    return new THREE.CanvasTexture(c);
  })();
  tex.colorSpace = THREE.SRGBColorSpace;
  mat.map = tex;
  const s = new THREE.Sprite(mat);
  s.scale.set(h, h, 1);
  s.center.set(0.5, 0);
  return s;
}

const CAT_H: Record<string, number> = { furniture: 1.4, plants: 1.1, toys: 0.8, decor: 0.7, pets: 0.8 };

export default function House3D({ house, avatarEmoji }: { house: House; avatarEmoji: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cv = ref.current!, el = wrap.current!;
    const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfff8ef);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xb08968, 1.5));
    const sun = new THREE.DirectionalLight(0xfff2d6, 1.6);
    sun.position.set(-3, 6, 4);
    scene.add(sun);

    const W = 10, D = 8, H = 4.6;
    const wallCss = houseItemById(house.wall)?.css ?? '#ffe5b4';
    const floorCss = houseItemById(house.floor)?.css ?? '#deb887';
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: cssTexture(floorCss, [4, 3]), roughness: 0.9 }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    const wallMat = new THREE.MeshStandardMaterial({ map: cssTexture(wallCss, [4, 2]), roughness: 1, side: THREE.DoubleSide });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    back.position.set(0, H / 2, -D / 2);
    const left = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    left.position.set(-W / 2, H / 2, 0); left.rotation.y = Math.PI / 2;
    const right = left.clone(); right.position.x = W / 2; right.rotation.y = -Math.PI / 2;
    scene.add(back, left, right);
    // Vindu med himmel
    const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.5), new THREE.MeshBasicMaterial({ color: 0x9bdcff }));
    win.position.set(2.6, 2.9, -D / 2 + 0.01);
    const frame = new THREE.Mesh(new THREE.PlaneGeometry(2.45, 1.75), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    frame.position.set(2.6, 2.9, -D / 2 + 0.005);
    scene.add(frame, win);
    const sunE = emojiSprite('☀️', 0.6); sunE.position.set(3.1, 2.9, -D / 2 + 0.05); scene.add(sunE);

    const mixers: THREE.AnimationMixer[] = [];
    let alive = true;
    // Ting barnet har plassert. 2D: y < 62 % = på veggen, ellers på gulvet.
    for (const p of house.items) {
      const it = houseItemById(p.id);
      if (!it?.emoji) continue;
      const onWall = p.y < 60;
      const x = ((p.x - 50) / 46) * (W / 2 - 0.6);
      const z = onWall ? -D / 2 + 0.25 : -D / 2 + 0.8 + ((p.y - 60) / 38) * (D - 1.8);
      const y = onWall ? 0.6 + ((60 - p.y) / 48) * (H - 1.6) : 0;
      const h = (CAT_H[it.cat] ?? 0.8) * p.s;
      const m = modelFor(it.emoji);
      if (m) {
        instance(m, h).then(({ root, clips }) => {
          if (!alive) return;
          root.position.set(x, y, z);
          root.rotation.y = (m.rotY ?? 0) + (p.f ? Math.PI : 0) + (m.path.startsWith('furniture') ? 0 : -0.3);
          scene.add(root);
          if (clips.length) {
            const mixer = new THREE.AnimationMixer(root);
            const idle = clips.find((c) => c.name === 'idle') ?? clips[0];
            mixer.clipAction(idle).play();
            mixers.push(mixer);
          }
        }).catch(() => { const s = emojiSprite(it.emoji!, h); s.position.set(x, y, z); scene.add(s); });
      } else {
        const s = emojiSprite(it.emoji, h);
        s.position.set(x, y, z);
        scene.add(s);
      }
    }
    // Barnets dyr (danser) og Shqipo som flyr rundt i rommet
    const ax = ((house.avatar.x - 50) / 46) * (W / 2 - 0.6);
    const az = -D / 2 + 0.8 + ((Math.max(60, house.avatar.y) - 60) / 38) * (D - 1.8);
    let avatarMixer: THREE.AnimationMixer | null = null;
    let avatarClips: THREE.AnimationClip[] = [];
    let avatarRoot: THREE.Object3D | null = null;
    const am = modelFor(avatarEmoji);
    if (am) {
      instance(am, 1.3).then(({ root, clips }) => {
        if (!alive) return;
        root.position.set(ax, 0, az);
        scene.add(root);
        avatarRoot = root;
        avatarMixer = new THREE.AnimationMixer(root);
        avatarClips = clips;
        const c = clips.find((x) => x.name === 'dance') ?? clips[0];
        if (c) avatarMixer.clipAction(c).play();
      }).catch(() => {});
    } else {
      const s = emojiSprite(avatarEmoji, 1.2); s.position.set(ax, 0, az); scene.add(s);
    }
    const shq = buildShqipo();
    shq.group.scale.setScalar(0.4);
    scene.add(shq.group);

    // Kamera: dra for å se rundt
    let yaw = 0, yawV = 0, dragX: number | null = null;
    const down = (e: PointerEvent) => { dragX = e.clientX; };
    const move = (e: PointerEvent) => { if (dragX === null) return; yawV = (e.clientX - dragX) * -0.004; yaw += yawV; dragX = e.clientX; };
    const up = () => { dragX = null; };
    const tap = () => {
      // Trykk: figuren gjør et triks, Shqipo jubler
      shq.cheer();
      if (avatarMixer && avatarClips.length) {
        const c = avatarClips.find((x) => x.name === 'gesture-positive') ?? avatarClips[0];
        const a = avatarMixer.clipAction(c); a.reset(); a.setLoop(THREE.LoopOnce, 1); a.play();
      }
    };
    cv.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    cv.addEventListener('click', tap);

    const fit = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w / h < 1 ? 62 : 45;
      camera.updateProjectionMatrix();
    };
    fit();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    ro?.observe(el);

    let raf = 0, last = performance.now(), t = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now; t += dt;
      if (dragX === null) { yawV *= 0.92; yaw += yawV; yaw += (Math.sin(t * 0.25) * 0.25 - yaw) * 0.005; }
      yaw = Math.max(-0.75, Math.min(0.75, yaw));
      const r = 7.4;
      camera.position.set(Math.sin(yaw) * r, 3.4, Math.cos(yaw) * r);
      camera.lookAt(0, 1.2, -0.6);
      for (const m of mixers) m.update(dt);
      avatarMixer?.update(dt);
      // Shqipo flyr en liten runde under taket
      const a = t * 0.5;
      shq.group.position.set(Math.cos(a) * 3, 3.3 + Math.sin(t * 1.3) * 0.2, Math.sin(a) * 2 - 0.5);
      shq.group.lookAt(Math.cos(a + 0.1) * 3, 3.3, Math.sin(a + 0.1) * 2 - 0.5);
      shq.update(t, dt, true);
      if (avatarRoot) avatarRoot.rotation.y = Math.sin(t * 0.6) * 0.4;
      renderer.render(scene, camera);
    };
    loop();
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      cv.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      cv.removeEventListener('click', tap);
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, [house, avatarEmoji]);

  return (
    <div className="house3d" ref={wrap}>
      <canvas ref={ref} className="house3d__canvas" />
    </div>
  );
}
