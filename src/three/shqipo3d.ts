/**
 * Shqipo i 3D – bygget av enkle former (kuler og kjegler), helt originalt.
 * Ser fremover langs +z. update() styrer vingeslag, blunking og jubel.
 */
import * as THREE from 'three';

export interface Shqipo3D {
  group: THREE.Group;
  /** Kroppen (for treff-testing) */
  hit: THREE.Object3D;
  update(t: number, dt: number, flying: boolean): void;
  cheer(): void;
}

const mat = (color: number, rough = 0.7) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 });

export function buildShqipo(): Shqipo3D {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);

  const brown = mat(0x5b3a29);
  const dark = mat(0x3d2618);
  const cream = mat(0xf4d8b0);
  const yellow = mat(0xffb703, 0.5);
  const red = mat(0xe63946, 0.6);
  const white = mat(0xffffff, 0.3);
  const black = mat(0x111111, 0.2);
  const pink = new THREE.MeshStandardMaterial({ color: 0xff8fab, roughness: 0.8, transparent: true, opacity: 0.75 });

  const sphere = new THREE.SphereGeometry(1, 24, 16);

  const torso = new THREE.Mesh(sphere, brown);
  torso.scale.set(1, 1.05, 0.95);
  body.add(torso);

  const belly = new THREE.Mesh(sphere, cream);
  belly.scale.set(0.62, 0.5, 0.4);
  belly.position.set(0, -0.35, 0.62);
  body.add(belly);

  // Øyne (gruppe per øye så de kan blunke)
  const eyes: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(s * 0.36, 0.22, 0.8);
    const w = new THREE.Mesh(sphere, white);
    w.scale.setScalar(0.3);
    const p = new THREE.Mesh(sphere, black);
    p.scale.setScalar(0.16);
    p.position.set(s * 0.03, 0.02, 0.2);
    const hl = new THREE.Mesh(sphere, white);
    hl.scale.setScalar(0.05);
    hl.position.set(s * 0.06 + 0.05, 0.08, 0.34);
    eye.add(w, p, hl);
    body.add(eye);
    eyes.push(eye);

    const cheek = new THREE.Mesh(sphere, pink);
    cheek.scale.set(0.15, 0.1, 0.06);
    cheek.position.set(s * 0.62, -0.08, 0.72);
    cheek.lookAt(s * 2, -0.1, 3);
    body.add(cheek);
  }

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 12), yellow);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, -0.08, 1.05);
  body.add(beak);

  // Fjærtopp
  for (const [x, rz, h] of [[-0.22, 0.35, 0.45], [0, 0, 0.6], [0.22, -0.35, 0.45]] as const) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.13, h, 8), dark);
    c.position.set(x, 1.0 + h / 2 - 0.12, -0.05);
    c.rotation.z = rz;
    body.add(c);
  }

  // Rødt skjerf
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.12, 8, 28), red);
  scarf.rotation.x = Math.PI / 2 - 0.25;
  scarf.position.set(0, -0.62, 0.05);
  body.add(scarf);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 3), dark);
  tail.position.set(0, -0.5, -0.95);
  tail.rotation.x = -1.9;
  body.add(tail);

  // Føtter
  for (const s of [-1, 1]) {
    const f = new THREE.Mesh(sphere, yellow);
    f.scale.set(0.2, 0.1, 0.28);
    f.position.set(s * 0.34, -1.02, 0.25);
    body.add(f);
  }

  // Vinger på hver sin "skulder" så de kan flakse
  const wings: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.82, 0.05, -0.1);
    const w = new THREE.Mesh(sphere, dark);
    w.scale.set(0.55, 0.16, 0.5);
    w.position.set(s * 0.5, 0, 0);
    pivot.add(w);
    body.add(pivot);
    wings.push(pivot);
  }

  let blinkAt = 2;
  let cheerT = 0;

  return {
    group,
    hit: torso,
    cheer() { cheerT = 1.6; },
    update(t, dt, flying) {
      // Vingeslag: raske når den flyr, rolige ellers
      const speed = cheerT > 0 ? 18 : flying ? 11 : 3;
      const amp = cheerT > 0 ? 0.9 : flying ? 0.7 : 0.25;
      const a = Math.sin(t * speed) * amp;
      wings[0].rotation.z = a + (flying ? 0 : -0.9);
      wings[1].rotation.z = -a - (flying ? 0 : -0.9);
      // Blunke
      blinkAt -= dt;
      const closed = blinkAt < 0 && blinkAt > -0.13;
      if (blinkAt < -0.13) blinkAt = 2 + Math.random() * 3;
      for (const e of eyes) e.scale.y = closed ? 0.12 : 1;
      // Jubel: hopp og en liten saltomortale
      if (cheerT > 0) {
        cheerT = Math.max(0, cheerT - dt);
        const k = 1 - cheerT / 1.6;
        body.position.y = Math.sin(k * Math.PI) * 0.9;
        body.rotation.z = k * Math.PI * 2;
      } else {
        body.position.y = Math.sin(t * 2.2) * 0.12;
        body.rotation.z = 0;
      }
    }
  };
}
