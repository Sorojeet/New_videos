// Leo's garden: picket fence, flower beds (petals can glow), a flower pot, grass tufts,
// a little path. group.userData.flowers = petal materials, .pot = flower pot group.
import * as THREE from 'three';
import { flatMat, jitter, shadows, rng } from 'engine/lowpoly.js';

const PETALS = ['#ff7aa8', '#ffd84d', '#b48cff', '#ff9a52', '#ffffff', '#6fd0ff'];

export function flower(r, color, height = 0.35) {
  const f = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, height, 4), flatMat('#3f8f3f'));
  stem.position.y = height / 2;
  const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 3), flatMat('#4ea84a'));
  leaf.position.set(0.03, height * 0.4, 0);
  leaf.rotation.z = -1.0;
  const petalMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0, flatShading: true });
  const head = new THREE.Group();
  head.position.y = height;
  const n = 5;
  for (let i = 0; i < n; i++) {
    const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.035, 0), petalMat);
    const a = (i / n) * Math.PI * 2;
    p.position.set(Math.cos(a) * 0.04, 0, Math.sin(a) * 0.04);
    p.scale.set(1, 0.45, 1);
    head.add(p);
  }
  const centre = new THREE.Mesh(new THREE.IcosahedronGeometry(0.025, 0),
    new THREE.MeshStandardMaterial({ color: '#ffcc33', emissive: '#ffaa00', emissiveIntensity: 0, flatShading: true }));
  centre.position.y = 0.01;
  head.add(centre);
  head.rotation.set((r() - 0.5) * 0.5, 0, (r() - 0.5) * 0.5);
  f.add(stem, leaf, head);
  f.userData = { petalMat, centreMat: centre.material, head };
  return f;
}

export function build({ seed = 11, radius = 4.2, backGap = 1.5, potAt = [-1.4, 0, 1.8] } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  g.name = 'garden';

  // Soil patch + lawn
  const lawn = new THREE.Mesh(new THREE.CircleGeometry(radius + 0.4, 18), flatMat('#79c25f'));
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.y = 0.005;
  lawn.receiveShadow = true;
  g.add(lawn);

  // Path stones from gate to the house
  for (let i = 0; i < 7; i++) {
    const s = new THREE.Mesh(jitter(new THREE.CylinderGeometry(0.22, 0.24, 0.05, 6), 0.04, i + 3), flatMat('#c9bfb2'));
    s.position.set(-0.45 + (r() - 0.5) * 0.2, 0.02, -2.6 + i * 0.75);
    s.rotation.y = r() * 3;
    g.add(s);
  }

  // Picket fence ring with a gate gap at the front (+z) and a gap at the back for the house door
  const fenceMat = flatMat('#f6efe3');
  const posts = 48;
  const pts = [];
  for (let i = 0; i < posts; i++) {
    const a = (i / posts) * Math.PI * 2;
    const x = Math.cos(a) * radius, z = Math.sin(a) * radius;
    const skip = (z > radius * 0.8 && Math.abs(x) < 0.55) || (z < -radius * 0.75 && Math.abs(x) < backGap);
    pts.push(skip ? null : { x, z, a });
  }
  pts.forEach((p) => {
    if (!p) return;
    const pk = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.5, 0.04), fenceMat);
    pk.position.set(p.x, 0.25, p.z);
    pk.rotation.y = -p.a + Math.PI / 2;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.09, 4), fenceMat);
    tip.position.y = 0.29;
    tip.rotation.y = Math.PI / 4;
    pk.add(tip);
    g.add(pk);
  });
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % posts];
    if (!p || !q) return;
    const len = Math.hypot(q.x - p.x, q.z - p.z);
    for (const h of [0.15, 0.36]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.04, 0.025), fenceMat);
      rail.position.set((p.x + q.x) / 2, h, (p.z + q.z) / 2);
      rail.rotation.y = -Math.atan2(q.z - p.z, q.x - p.x);
      g.add(rail);
    }
  });

  // Flower beds
  const flowers = [];
  const addFlower = (x, z, color, h) => {
    const f = flower(r, color, h);
    f.position.set(x, 0, z);
    f.rotation.y = r() * 6;
    g.add(f);
    flowers.push({ ...f.userData, node: f });
  };
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2;
    const d = radius - 0.35 - r() * 0.7;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (z < -2.2 && Math.abs(x) < 1.8) continue;            // keep clear in front of house door
    if (Math.hypot(x - potAt[0], z - potAt[2]) < 0.6) continue;
    addFlower(x, z, PETALS[Math.floor(r() * PETALS.length)], 0.25 + r() * 0.2);
  }
  // A cluster in the middle bed
  for (let i = 0; i < 16; i++) {
    const a = r() * Math.PI * 2, d = r() * 0.55;
    addFlower(1.6 + Math.cos(a) * d, 0.6 + Math.sin(a) * d, PETALS[i % PETALS.length], 0.22 + r() * 0.15);
  }

  // Flower pot (the star hides behind this one)
  const pot = new THREE.Group();
  pot.name = 'pot';
  const potBody = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.14, 0.3, 8), flatMat('#c96f45'));
  potBody.position.y = 0.15;
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.06, 8), flatMat('#b85f39'));
  rim.position.y = 0.3;
  const soil = new THREE.Mesh(new THREE.CircleGeometry(0.2, 8), flatMat('#5a3b28'));
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = 0.325;
  pot.add(potBody, rim, soil);
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.35, 3), flatMat(i % 2 ? '#3f9a4a' : '#56b35a'));
    const a = (i / 6) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 0.06, 0.48, Math.sin(a) * 0.06);
    leaf.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
    pot.add(leaf);
  }
  pot.position.set(...potAt);
  g.add(pot);

  // Grass tufts
  const grassMat = flatMat('#5fae4c');
  for (let i = 0; i < 140; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * radius;
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.1 + r() * 0.08, 3), grassMat);
    t.position.set(Math.cos(a) * d, 0.05, Math.sin(a) * d);
    t.rotation.set((r() - 0.5) * 0.4, r() * 3, (r() - 0.5) * 0.4);
    g.add(t);
  }

  shadows(g);
  g.userData = { flowers, pot };
  return g;
}
