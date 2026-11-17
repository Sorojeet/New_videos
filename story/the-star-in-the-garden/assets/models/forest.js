// Low-poly pine forest. build({ count, area:[x0,x1,z0,z1], seed, heightFn })
import * as THREE from 'three';
import { flatMat, rng } from 'engine/lowpoly.js';

export function pine(r, mats, trunkMat, scale = 1) {
  const t = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.6, 5), trunkMat);
  trunk.position.y = 0.3;
  t.add(trunk);
  const tiers = 3;
  for (let i = 0; i < tiers; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.75 - i * 0.18, 0.95, 6), mats[Math.floor(r() * mats.length)]);
    c.position.y = 0.8 + i * 0.5;
    c.rotation.y = r() * 3;
    t.add(c);
  }
  t.scale.setScalar(scale);
  return t;
}

export function build({ count = 120, area = [-30, 30, -40, -14], seed = 21, heightFn = () => 0, dark = false } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  g.name = 'forest';
  const mats = (dark ? ['#1f4a3a', '#24553f', '#1a4034'] : ['#2f7d4f', '#3a8f57', '#276b45']).map((c) => flatMat(c));
  const trunkMat = flatMat('#5b3d2a');
  const [x0, x1, z0, z1] = area;
  for (let i = 0; i < count; i++) {
    const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0);
    const t = pine(r, mats, trunkMat, 1.2 + r() * 1.3);
    t.position.set(x, heightFn(x, z) - 0.1, z);
    g.add(t);
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } });
  return g;
}
