// World of THE LAST HOUSE in the blocky pastel style.
// The house stands at the origin facing +z at the edge of the forest; the village lies east (+x)
// along a road with power lines. The house has no wires reaching it.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng } from 'engine/lowpoly.js';

const std = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.92, flatShading: true, ...opts });
export const VILLAGE = new THREE.Vector3(42, 0, 16);
const ROAD_Z = (x) => 9 + Math.max(0, Math.min(1, (x - 4) / 34)) * 7;     // road from the house to the village

// Distance outside the open (tree-free) area: < 0 means open ground.
export function clearing(x, z) {
  const dHouse = Math.hypot(x, z - 3) - 13;
  const dVillage = Math.hypot((x - VILLAGE.x) * 0.75, z - VILLAGE.z) - 22;
  const dRoad = x > 0 && x < VILLAGE.x ? Math.abs(z - ROAD_Z(x)) - 5 : 99;
  return Math.min(dHouse, dVillage, dRoad);
}
export function heightAt(x, z) {
  const k = Math.min(1, Math.max(0, clearing(x, z)) / 25);
  return (Math.sin(x * 0.05) * 2.5 + Math.cos(z * 0.045 + 1) * 3 + Math.sin((x - z) * 0.025) * 4 + 4) * k * k;
}

export function terrain({ size = 1400, seg = 160 } = {}) {
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, heightAt(p.getX(i), p.getZ(i)));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, std('#7f8c69', { flatShading: false, roughness: 1 }));
  m.receiveShadow = true;
  m.name = 'terrain';
  // dirt path to the door + village road
  const g = new THREE.Group();
  g.add(m);
  const path = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 7), std('#9c8f78', { flatShading: false }));
  path.rotation.x = -Math.PI / 2; path.position.set(-0.47, 0.02, 7.6); path.receiveShadow = true;
  g.add(path);
  const roadMat = std('#8f8676', { flatShading: false });
  for (let x = 2; x < VILLAGE.x + 22; x += 2) {
    const z0 = ROAD_Z(x), z1 = ROAD_Z(x + 2);
    const seg = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.04, 3.2), roadMat);
    seg.position.set(x + 1, 0.02, (z0 + z1) / 2);
    seg.rotation.y = Math.atan2(2, z1 - z0) - Math.PI / 2;
    seg.receiveShadow = true;
    g.add(seg);
  }
  return g;
}

// ---- Trees (instanced: pines + round trees like the reference) -----------------------
function pineParts() {
  const cones = [0, 1, 2].map((i) => { const c = new THREE.ConeGeometry(1.15 - i * 0.28, 1.5, 7); c.translate(0, 1.4 + i * 0.8, 0); return c; });
  return { trunk: new THREE.CylinderGeometry(0.13, 0.17, 1.3, 6).translate(0, 0.65, 0), crown: mergeGeometries(cones) };
}
function roundParts() {
  const crown = new THREE.IcosahedronGeometry(1.05, 0).translate(0, 2.0, 0);
  return { trunk: new THREE.CylinderGeometry(0.13, 0.17, 1.5, 6).translate(0, 0.75, 0), crown };
}
export function forest({ count = 2600, radius = 240, seed = 5, minClear = 1.5 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  g.name = 'forest';
  const types = [pineParts(), roundParts()];
  const crownCols = [['#4e6b48', '#56754c', '#466243'], ['#5f7f4e', '#6b8a55', '#57774a']];
  const lists = [[], []];
  for (let i = 0; i < count * 5 && lists[0].length + lists[1].length < count; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * radius;
    const x = Math.cos(a) * d + 15, z = Math.sin(a) * d - 10;
    const c = clearing(x, z);
    if (c < minClear || (c < 6 && r() < 0.5)) continue;
    lists[r() < 0.62 ? 0 : 1].push({ x, z, s: 0.9 + r() * 1.0, ry: r() * 6.28, c: Math.floor(r() * 3) });
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
  types.forEach((t, ti) => {
    const list = lists[ti];
    const trunk = new THREE.InstancedMesh(t.trunk, std('#5a4636'), list.length);
    const crown = new THREE.InstancedMesh(t.crown, std('#ffffff'), list.length);
    list.forEach((it, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), it.ry);
      m4.compose(new THREE.Vector3(it.x, heightAt(it.x, it.z) - 0.05, it.z), q, new THREE.Vector3(it.s, it.s, it.s));
      trunk.setMatrixAt(i, m4); crown.setMatrixAt(i, m4);
      crown.setColorAt(i, col.set(crownCols[ti][it.c]));
    });
    for (const im of [trunk, crown]) { im.castShadow = true; im.receiveShadow = true; g.add(im); }
  });
  return g;
}

// ---- Village (pastel houses, road, power poles with lines) ---------------------------
export function village({ seed = 9 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  g.name = 'village';
  const walls = ['#d98d7a', '#b48fc4', '#e7a98a', '#c9a3b8', '#e9c49a', '#9fb3c9'];
  const roofs = ['#8a3f35', '#4f4a74', '#7a3b33', '#5a4a6a'];
  const winMat = new THREE.MeshStandardMaterial({ color: '#ffc781', emissive: '#ff9f45', emissiveIntensity: 0 });
  const blueWin = std('#8fb4c8');
  const spots = [];
  for (let i = 0; i < 18; i++) {
    const side = i % 2 ? 1 : -1;
    const x = 14 + Math.floor(i / 2) * 5.2 + r() * 1.2;
    spots.push([x, ROAD_Z(x) + side * (6 + r() * 2.5), side]);
  }
  for (let i = 0; i < 8; i++) spots.push([VILLAGE.x + 8 + (r() - 0.5) * 22, VILLAGE.z + (r() - 0.5) * 26, r() < 0.5 ? 1 : -1]);
  for (const [x, z, side] of spots) {
    const h = new THREE.Group();
    const w = 3 + r() * 1.2, d = 3 + r() * 0.8, ht = 2.3 + r() * 0.8;
    const wall = std(walls[Math.floor(r() * walls.length)]);
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, ht, d), wall);
    body.position.y = ht / 2;
    const sh = new THREE.Shape();
    sh.moveTo(-d / 2 - 0.25, 0); sh.lineTo(d / 2 + 0.25, 0); sh.lineTo(0, 1.4); sh.lineTo(-d / 2 - 0.25, 0);
    const rg = new THREE.ExtrudeGeometry(sh, { depth: w + 0.3, bevelEnabled: false });
    rg.translate(0, 0, -(w + 0.3) / 2);
    const roof = new THREE.Mesh(rg, std(roofs[Math.floor(r() * roofs.length)]));
    roof.rotation.y = Math.PI / 2; roof.position.y = ht;
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.06), std('#4a3426'));
    door.position.set(-w * 0.2, 0.6, d / 2 + 0.02);
    h.add(body, roof, door);
    for (const wx of [w * 0.22, -w * 0.38]) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.05), r() < 0.6 ? winMat : blueWin);
      win.position.set(wx, ht * 0.6, d / 2 + 0.02);
      h.add(win);
    }
    if (r() < 0.6) { const sp = new THREE.Mesh(new THREE.BoxGeometry(w * 0.5, 0.05, d * 0.35), std('#2c3c5c', { metalness: 0.3, roughness: 0.4 })); sp.position.set(0, ht + 0.75, d * 0.2); sp.rotation.x = -0.55; h.add(sp); }
    h.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    h.position.set(x, heightAt(x, z), z);
    h.rotation.y = side > 0 ? Math.PI : 0;
    g.add(h);
  }
  // Power poles along the road with sagging lines (they stop at the village edge, far from the house)
  const poleMat = std('#5b4636'), wireMat = new THREE.MeshBasicMaterial({ color: '#1b1b1b' });
  const poles = [];
  for (let x = 18; x <= VILLAGE.x + 22; x += 9) {
    const z = ROAD_Z(x) - 3.6;
    const p = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 6, 6), poleMat); post.position.y = 3;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.1), poleMat); arm.position.y = 5.7;
    p.add(post, arm);
    p.position.set(x, heightAt(x, z), z);
    p.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    g.add(p);
    poles.push(p.position.clone());
  }
  for (let i = 0; i < poles.length - 1; i++) for (const off of [-0.6, 0.6]) {
    const a = poles[i].clone().add(new THREE.Vector3(off, 5.75, 0)), b = poles[i + 1].clone().add(new THREE.Vector3(off, 5.75, 0));
    const mid = a.clone().add(b).multiplyScalar(0.5); mid.y -= 0.6;
    const wire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 12, 0.025, 3), wireMat);
    g.add(wire);
  }
  g.userData = { windowMat: winMat };
  return g;
}

// ---- Props near the house ---------------------------------------------------------------
// Dead utility pole, leaning, crossarm with cut wires dangling. No line arrives.
export function deadPole() {
  const g = new THREE.Group();
  const m = std('#56463a');
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 6.2, 0.22), m); post.position.y = 3.1;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.14, 0.14), m); arm.position.y = 5.8;
  g.add(post, arm);
  const wireMat = new THREE.MeshBasicMaterial({ color: '#151515' });
  for (const [x, len, sway] of [[-0.7, 2.4, 0.25], [0.7, 3.3, -0.2]]) {
    const pts = [new THREE.Vector3(x, 5.85, 0), new THREE.Vector3(x + sway * 0.5, 5.85 - len * 0.5, 0.2), new THREE.Vector3(x + sway, 5.85 - len, 0.05)];
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.025, 4), wireMat));
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), std('#7a5a3a'));   // frayed copper end
    tip.position.set(x + sway, 5.85 - len - 0.03, 0.05); g.add(tip);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.rotation.z = -0.13;
  return g;
}
// Rusted mailbox with a blank name plate, door hanging open.
export function mailbox() {
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), std('#5a4636')); post.position.y = 0.55; post.rotation.z = 0.07;
  const boxM = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.32, 0.55), std('#7a5a44')); boxM.position.set(0.04, 1.22, 0);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.01), std('#cfc8b8')); plate.position.set(0.04, 1.2, 0.28);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.3, 0.03), std('#6e503c')); door.position.set(0.04, 1.06, 0.33); door.rotation.x = 1.2;
  const rust = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.012), std('#8a4a2a')); rust.position.set(0.12, 1.32, 0.276);
  g.add(post, boxM, plate, door, rust);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
// Broken picket fence from a to b.
export function fence(a, b, seed = 6) {
  const r = rng(seed);
  const g = new THREE.Group();
  const m = std('#a39a8c');
  const dir = new THREE.Vector3().subVectors(b, a); const len = dir.length();
  const ry = Math.atan2(dir.x, dir.z) + Math.PI / 2;
  for (let t = 0; t < len; t += 0.3) {
    if (r() < 0.2) continue;
    const p = a.clone().add(dir.clone().multiplyScalar(t / len));
    const k = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.05), m);
    k.position.set(p.x, 0.45, p.z); k.rotation.set((r() - 0.5) * 0.3, ry, (r() - 0.5) * 0.35);
    g.add(k);
  }
  for (const h of [0.25, 0.68]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, 0.05), m);
    rail.position.copy(a.clone().add(b).multiplyScalar(0.5)).setY(h); rail.rotation.set(0, ry, (r() - 0.5) * 0.06);
    g.add(rail);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
// Bare dead tree.
export function deadTree() {
  const g = new THREE.Group();
  const m = std('#4a3f37');
  const limb = (x, y, z, len, rz, rx, r) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r, len, 5), m); b.geometry.translate(0, len / 2, 0); b.position.set(x, y, z); b.rotation.set(rx, 0, rz); b.castShadow = true; g.add(b); };
  limb(0, 0, 0, 3.6, 0.05, 0, 0.2); limb(-0.1, 2.2, 0, 1.8, 0.85, 0.2, 0.11); limb(0.05, 2.7, 0, 1.6, -0.75, -0.2, 0.1);
  limb(0, 3.3, 0, 1.1, 0.25, 0.45, 0.07); limb(-1.2, 3.1, 0.25, 0.8, 1.4, 0, 0.05);
  return g;
}
