// THE LAST HOUSE, blocky style. Two storeys, front faces +z. Weathered, boarded windows,
// sagging porch, crooked shutter, broken chimney, and one upstairs window that glows.
// userData: door (hinge group, rotate .y to open), glowMat, glowPos, windowPos, doorPos
import * as THREE from 'three';

const std = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...opts });

export function build({ fresh = false } = {}) {
  const g = new THREE.Group();
  g.name = 'last-house';
  const W = 5.6, D = 4.6, BASE = 0.35, F1 = 2.6, F2 = 2.4, TOP = BASE + F1 + F2;
  const M = {
    wall: std(fresh ? '#d9cbb4' : '#8f8a84'), wall2: std(fresh ? '#cdbfa8' : '#7f7a75'), trim: std(fresh ? '#f2eee6' : '#b3ada2'),
    roof: std(fresh ? '#8a4a3c' : '#4f4343'), base: std('#5c5853'), wood: std(fresh ? '#8a6a4c' : '#6a5643'),
    board: std('#8a7058'), glass: std('#2c3138', { roughness: 0.2, metalness: 0.3 }), door: std(fresh ? '#6a3e2c' : '#4e3b30'),
    shutter: std(fresh ? '#4f6b62' : '#475550'), brick: std('#7a4a3c'), ivy: std('#465d3a'),
  };
  const add = (w, h, d, m, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    b.position.set(x, y, z); b.rotation.set(rx, ry, rz);
    b.castShadow = true; b.receiveShadow = true;
    g.add(b);
    return b;
  };
  add(W + 0.2, BASE, D + 0.2, M.base, 0, BASE / 2, 0);
  add(W, F1, D, M.wall, 0, BASE + F1 / 2, 0);
  add(W, F2, D, M.wall2, 0, BASE + F1 + F2 / 2, 0);
  add(W + 0.1, 0.12, D + 0.1, M.trim, 0, BASE + F1, 0);
  add(W + 0.1, 0.12, D + 0.1, M.trim, 0, TOP, 0);
  for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) add(0.14, F1 + F2, 0.14, M.trim, x * W / 2, BASE + (F1 + F2) / 2, z * D / 2);

  // Roof (gable, ridge along x)
  const sh = new THREE.Shape();
  sh.moveTo(-D / 2 - 0.35, 0); sh.lineTo(D / 2 + 0.35, 0); sh.lineTo(0, 2.0); sh.lineTo(-D / 2 - 0.35, 0);
  const roofGeo = new THREE.ExtrudeGeometry(sh, { depth: W + 0.5, bevelEnabled: false });
  roofGeo.translate(0, 0, -(W + 0.5) / 2);
  const roof = new THREE.Mesh(roofGeo, M.roof);
  roof.rotation.y = Math.PI / 2; roof.position.y = TOP + 0.06;
  roof.castShadow = true; roof.receiveShadow = true;
  g.add(roof);
  const gs = new THREE.Shape();
  gs.moveTo(-D / 2, 0); gs.lineTo(D / 2, 0); gs.lineTo(0, 1.75); gs.lineTo(-D / 2, 0);
  for (const s of [-1, 1]) {
    const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(gs, { depth: 0.08, bevelEnabled: false }), M.wall2);
    gable.rotation.y = Math.PI / 2; gable.position.set(s * (W / 2 - 0.02) - 0.04, TOP + 0.06, 0);
    g.add(gable);
  }
  if (!fresh) add(0.9, 0.06, 0.7, std('#2a2424'), 1.4, TOP + 1.0, 1.0, 0.72, 0, 0);    // hole in the roof
  // Chimney
  add(0.6, 2.0, 0.6, M.brick, 1.6, TOP + 1.4, -0.8);
  add(fresh ? 0.7 : 0.4, 0.15, 0.7, M.brick, fresh ? 1.6 : 1.45, TOP + 2.47, -0.8);

  // Windows: [x, y, z, ry, kind]
  const windows = [
    [1.6, BASE + 1.35, D / 2, 0, fresh ? 'glass' : 'boarded'],
    [-1.6, BASE + F1 + 1.2, D / 2, 0, 'glow'],
    [1.6, BASE + F1 + 1.2, D / 2, 0, fresh ? 'glass' : 'broken'],
    [W / 2, BASE + 1.35, 0, Math.PI / 2, 'glass'], [W / 2, BASE + F1 + 1.2, 0, Math.PI / 2, 'glass'],
    [-W / 2, BASE + 1.35, 0, -Math.PI / 2, fresh ? 'glass' : 'boarded'], [-W / 2, BASE + F1 + 1.2, 0, -Math.PI / 2, 'glass'],
  ];
  const glowMat = new THREE.MeshStandardMaterial({ color: '#ffc27a', emissive: '#ffa64a', emissiveIntensity: 0 });
  for (const [x, y, z, ry, kind] of windows) {
    const wg = new THREE.Group();
    wg.position.set(x, y, z); wg.rotation.y = ry;
    const fr = (w, h, px, py) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), M.trim); b.position.set(px, py, 0.02); b.castShadow = true; wg.add(b); };
    fr(1.0, 0.1, 0, 0.62); fr(1.1, 0.12, 0, -0.62); fr(0.1, 1.2, -0.47, 0); fr(0.1, 1.2, 0.47, 0);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 1.16), kind === 'glow' ? glowMat : M.glass);
    pane.position.z = kind === 'glow' ? -0.04 : 0.005;
    wg.add(pane);
    if (kind !== 'glow') { fr(0.04, 1.16, 0, 0); fr(0.86, 0.04, 0, 0); }
    if (kind === 'glow') {
      for (const s of [-1, 1]) { const cu = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.14, 0.03), std('#9a7058', { emissive: '#3a1c0a', emissiveIntensity: 0 })); cu.position.set(s * 0.3, 0, -0.02); wg.add(cu); wg.userData.curtain = cu; }
      fr(0.04, 1.16, 0, 0); fr(0.86, 0.04, 0, 0);
    }
    if (kind === 'boarded') for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.16, 0.05), M.board); b.position.set(0, -0.35 + i * 0.36, 0.1); b.rotation.z = [0.12, -0.2, 0.06][i]; b.castShadow = true; wg.add(b); }
    if (kind === 'broken') { const hole = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.35), std('#0b0b0d')); hole.position.set(0.2, 0.3, 0.01); hole.rotation.z = 0.5; wg.add(hole); }
    g.add(wg);
  }
  // Shutters (one crooked)
  add(0.36, 1.2, 0.05, M.shutter, 0.92, BASE + 1.35, D / 2 + 0.05);
  add(0.36, 1.2, 0.05, M.shutter, 2.3, BASE + 1.25, D / 2 + 0.09, 0, 0, fresh ? 0 : 0.3);
  add(0.36, 1.2, 0.05, M.shutter, -2.28, BASE + F1 + 1.2, D / 2 + 0.05);
  add(0.36, 1.2, 0.05, M.shutter, -0.92, BASE + F1 + 1.2, D / 2 + 0.05);

  // Door (hinge at its left edge)
  const door = new THREE.Group();
  door.position.set(-0.95, BASE, D / 2 + 0.02);
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.1, 0.08), M.door);
  leaf.position.set(0.475, 1.05, 0); leaf.castShadow = true;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), std('#b39b5c', { metalness: 0.6, roughness: 0.4 }));
  knob.position.set(0.82, 1.0, 0.06);
  door.add(leaf, knob);
  g.add(door);
  const dark = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 2.1), std('#0a0a0b'));
  dark.position.set(-0.475, BASE + 1.05, D / 2 - 0.05);
  g.add(dark);
  add(0.12, 2.25, 0.14, M.trim, -1.0, BASE + 1.12, D / 2 + 0.03);
  add(0.12, 2.25, 0.14, M.trim, 0.05, BASE + 1.12, D / 2 + 0.03);
  add(1.2, 0.14, 0.16, M.trim, -0.47, BASE + 2.2, D / 2 + 0.03);

  // Porch
  const PD = 1.6;
  add(W, 0.1, PD, M.wood, 0, BASE - 0.05, D / 2 + PD / 2, fresh ? 0 : 0.0, 0, fresh ? 0 : 0.015);
  for (let i = 0; i < 2; i++) add(1.3, 0.12, 0.35, M.wood, -0.47, BASE - 0.18 - i * 0.12, D / 2 + PD + 0.17 + i * 0.32);
  for (const x of [-W / 2 + 0.1, -1.3, 0.4, W / 2 - 0.1]) add(0.12, 2.3, 0.12, M.trim, x, BASE + 1.15, D / 2 + PD - 0.08, 0, 0, !fresh && x > 2 ? 0.06 : 0);
  add(W + 0.3, 0.1, PD + 0.3, M.roof, 0, BASE + 2.4, D / 2 + PD / 2, -0.15, 0, fresh ? 0 : 0.025);
  for (const [x0, x1] of [[-W / 2 + 0.1, -1.3], [0.4, W / 2 - 0.1]]) {
    add(x1 - x0, 0.07, 0.07, M.trim, (x0 + x1) / 2, BASE + 0.8, D / 2 + PD - 0.08, 0, 0, !fresh && x0 > 0 ? -0.08 : 0);
    for (let x = x0 + 0.2; x < x1 - 0.05; x += 0.25) if (fresh || Math.sin(x * 13) > -0.6) add(0.05, 0.75, 0.05, M.trim, x, BASE + 0.4, D / 2 + PD - 0.08);
  }
  // Ivy patches
  if (!fresh) for (const [x, y, s] of [[W / 2 + 0.03, 1.2, 1.3], [W / 2 + 0.03, 2.6, 0.9], [-W / 2 - 0.03, 0.9, 1.0]]) {
    const iv = new THREE.Mesh(new THREE.BoxGeometry(0.06, s * 1.4, s * 1.1), M.ivy);
    iv.position.set(x, y, -1.2); g.add(iv);
  }

  g.userData = {
    door, glowMat, size: [W, D, TOP + 2.0],
    glowPos: new THREE.Vector3(-1.6, BASE + F1 + 1.2, D / 2 - 0.4),
    windowPos: new THREE.Vector3(-1.6, BASE + F1 + 1.2, D / 2 + 0.05),
    doorPos: new THREE.Vector3(-0.47, BASE, D / 2), porchFront: D / 2 + PD,
  };
  return g;
}
