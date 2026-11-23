/**
 * Én felles WebGL-tegner for alle små 3D-modeller på skjermen.
 * Nettlesere tåler bare et fåtall WebGL-kontekster samtidig, så hver modell
 * tegnes i tur og orden i samme kontekst og kopieres over til sitt eget 2D-lerret.
 */
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { ModelInfo } from './models';
import { modelUrl } from './models';

const loader = new GLTFLoader();
const cache = new Map<string, Promise<GLTF>>();

export function loadModel(m: ModelInfo): Promise<GLTF> {
  const url = modelUrl(m);
  let p = cache.get(url);
  if (!p) {
    p = loader.loadAsync(url);
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return p;
}

/** En kopi av modellen, skalert til ca. 1 enhet høy og plassert med bunnen på y=0. */
export async function instance(m: ModelInfo, height = 1): Promise<{ root: THREE.Object3D; clips: THREE.AnimationClip[] }> {
  const gltf = await loadModel(m);
  const obj = m.animated ? cloneSkinned(gltf.scene) : gltf.scene.clone(true);
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const s = height / Math.max(size.y, size.x * 0.8, size.z * 0.8, 0.0001);
  obj.scale.setScalar(s);
  const c = box.getCenter(new THREE.Vector3());
  obj.position.set(-c.x * s, -box.min.y * s, -c.z * s);
  const root = new THREE.Group();
  root.add(obj);
  root.rotation.y = m.rotY ?? 0;
  return { root, clips: gltf.animations };
}

export interface View {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  pivot: THREE.Group;
  mixer: THREE.AnimationMixer | null;
  tick?: (t: number, dt: number) => void;
}

let renderer: THREE.WebGLRenderer | null = null;
const views = new Set<View>();
let raf = 0;
let last = 0;
let t = 0;

function ensureRenderer() {
  if (renderer) return renderer;
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(1);
  return renderer;
}

function frame(now: number) {
  raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - (last || now)) / 1000);
  last = now;
  t += dt;
  const r = renderer!;
  // Gjør tegneflaten stor nok for den største visningen
  let maxW = 1, maxH = 1;
  for (const v of views) { maxW = Math.max(maxW, v.canvas.width); maxH = Math.max(maxH, v.canvas.height); }
  const cur = r.getSize(new THREE.Vector2());
  if (cur.x < maxW || cur.y < maxH) r.setSize(Math.max(cur.x, maxW), Math.max(cur.y, maxH), false);
  const H = r.domElement.height;
  r.setScissorTest(true);
  for (const v of views) {
    const { width: w, height: h } = v.canvas;
    if (!w || !h || !v.canvas.isConnected) continue;
    const rect = v.canvas.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight || rect.right < 0 || rect.left > innerWidth) continue;
    v.mixer?.update(dt);
    v.tick?.(t, dt);
    r.setViewport(0, 0, w, h);
    r.setScissor(0, 0, w, h);
    r.clear();
    r.render(v.scene, v.camera);
    v.ctx.clearRect(0, 0, w, h);
    v.ctx.drawImage(r.domElement, 0, H - h, w, h, 0, 0, w, h);
  }
}

export function addView(v: View) {
  ensureRenderer();
  views.add(v);
  if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
}
export function removeView(v: View) {
  views.delete(v);
  if (!views.size && raf) { cancelAnimationFrame(raf); raf = 0; }
}

/** Standard lys og kamera for en liten modell-visning */
export function makeView(canvas: HTMLCanvasElement): View {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a66, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.8);
  sun.position.set(2, 4, 3);
  scene.add(sun);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
  camera.position.set(0, 0.85, 2.6);
  camera.lookAt(0, 0.45, 0);
  const pivot = new THREE.Group();
  scene.add(pivot);
  return { canvas, ctx: canvas.getContext('2d')!, scene, camera, pivot, mixer: null };
}
