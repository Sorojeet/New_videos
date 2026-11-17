// Ground-floor parlour of THE LAST HOUSE, blocky style. Room centred at origin, front wall
// at +z with the door and a boarded window (light comes through the gaps), fireplace at the
// back, staircase on the left, bookshelf on the right (it hides the stairs down in Reel 2),
// sheet-covered furniture, cobwebbed chandelier, and a round table where the photograph lies.
// userData: tableTop (Vector3), door, bookshelf, windowCenter, size
import * as THREE from 'three';
import { rng } from 'engine/lowpoly.js';

const std = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.92, ...opts });
export const ROOM = { W: 7, D: 6, H: 3.2 };

export function build({ seed = 5 } = {}) {
  const r = rng(seed);
  const { W, D, H } = ROOM;
  const g = new THREE.Group();
  g.name = 'interior';
  const add = (w, h, d, m, x, y, z, rx = 0, ry = 0, rz = 0, parent = g) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    b.position.set(x, y, z); b.rotation.set(rx, ry, rz);
    b.castShadow = true; b.receiveShadow = true;
    parent.add(b);
    return b;
  };
  // Dusty palette
  const M = {
    floor: std('#7a6552'), floor2: std('#6e5a48'), wall: std('#a8957f'), wallDark: std('#7d6a58'), ceil: std('#6a5c50'),
    trim: std('#5a4636'), sheet: std('#d9d2c4'), sheet2: std('#cbc3b4'), brick: std('#8a5a48'), dark: std('#1a1614'),
    wood: std('#6a4f3a'), board: std('#8a7058'),
  };
  // Floor planks
  for (let i = 0; i < W / 0.35; i++) add(0.34, 0.06, D, i % 2 ? M.floor : M.floor2, -W / 2 + 0.175 + i * 0.35, -0.03, 0);
  // Walls (front wall built around the door and window openings)
  add(W, H, 0.15, M.wall, 0, H / 2, -D / 2);
  add(0.15, H, D, M.wall, -W / 2, H / 2, 0);
  add(0.15, H, D, M.wall, W / 2, H / 2, 0);
  const fz = D / 2;
  add(2.95, H, 0.15, M.wall, -2.025, H / 2, fz);                 // left of door
  add(1.1, H - 2.3, 0.15, M.wall, 0, 2.3 + (H - 2.3) / 2, fz);   // above door
  add(0.85, H, 0.15, M.wall, 0.975, H / 2, fz);                   // between door and window
  add(1.3, 0.95, 0.15, M.wall, 2.05, 0.475, fz);                  // under window
  add(1.3, H - 2.35, 0.15, M.wall, 2.05, 2.35 + (H - 2.35) / 2, fz);
  add(0.75, H, 0.15, M.wall, 3.075, H / 2, fz);
  // Wainscot + ceiling + trims
  for (const [w, x, z, ry] of [[W, 0, -D / 2 + 0.09, 0], [D, -W / 2 + 0.09, 0, Math.PI / 2], [D, W / 2 - 0.09, 0, Math.PI / 2]]) {
    add(w, 0.9, 0.03, M.wallDark, x, 0.45, z, 0, ry);
    add(w, 0.08, 0.06, M.trim, x, 0.92, z, 0, ry);
    add(w, 0.12, 0.08, M.trim, x, H - 0.06, z, 0, ry);
  }
  add(W, 0.12, D, M.ceil, 0, H + 0.06, 0);
  // Window boards with gaps
  for (let i = 0; i < 4; i++) add(1.6, 0.2, 0.05, M.board, 2.05, 1.1 + i * 0.36, fz - 0.1, 0, 0, (r() - 0.5) * 0.25);
  // Door leaf (opens inward: hinge on its left edge)
  const door = new THREE.Group();
  door.position.set(-0.55, 0, fz - 0.05);
  add(1.08, 2.28, 0.07, std('#4e3b30'), 0.54, 1.14, 0, 0, 0, 0, door);
  g.add(door);
  // Fireplace
  add(2.2, 1.3, 0.4, M.brick, 0, 0.65, -D / 2 + 0.25);
  add(0.9, 0.85, 0.42, M.dark, 0, 0.43, -D / 2 + 0.27);
  add(2.5, 0.12, 0.55, M.wood, 0, 1.36, -D / 2 + 0.3);
  add(0.3, 0.38, 0.16, M.wood, 0.75, 1.61, -D / 2 + 0.3);           // clock
  for (const x of [-0.8, -0.6]) add(0.07, 0.24, 0.07, std('#e6dcc4'), x, 1.54, -D / 2 + 0.3);   // candles
  // Picture frames (one crooked)
  add(0.8, 1.0, 0.05, M.trim, -2.0, 2.2, -D / 2 + 0.1);
  add(0.65, 0.85, 0.055, std('#3a342e'), -2.0, 2.2, -D / 2 + 0.1);
  add(0.9, 0.6, 0.05, M.trim, 2.0, 2.1, -D / 2 + 0.1, 0, 0, 0.12);
  add(0.75, 0.45, 0.055, std('#3a342e'), 2.0, 2.1, -D / 2 + 0.1, 0, 0, 0.12);
  // Staircase (left wall, rising to the back)
  for (let i = 0; i < 11; i++) {
    add(1.1, 0.28 * (i + 1), 0.3, M.wood, -W / 2 + 0.65, 0.14 * (i + 1), 2.2 - i * 0.3);
    if (i % 2 === 0) add(0.05, 0.8, 0.05, M.trim, -W / 2 + 1.18, 0.28 * (i + 1) + 0.4, 2.2 - i * 0.3);
  }
  add(0.07, 0.07, 3.5, M.trim, -W / 2 + 1.18, 2.15, 0.7, -0.75, 0, 0);
  // Bookshelf (right wall)
  const shelf = new THREE.Group();
  shelf.name = 'bookshelf';
  add(0.45, 2.6, 1.8, M.wood, 0, 1.3, 0, 0, 0, 0, shelf);
  const books = ['#7a3a32', '#3c5266', '#6b6a3c', '#8a6a44', '#5a4060', '#40604a'];
  for (let s = 0; s < 5; s++) {
    const y = 0.25 + s * 0.5;
    add(0.42, 0.04, 1.72, std('#5a4433'), -0.02, y, 0, 0, 0, 0, shelf);
    let z = -0.8;
    while (z < 0.75) {
      const t = 0.06 + r() * 0.06, h = 0.28 + r() * 0.13;
      if (r() < 0.1) { z += 0.14; continue; }
      add(0.3, h, t, std(books[Math.floor(r() * books.length)]), -0.05, y + 0.02 + h / 2, z + t / 2, r() < 0.08 ? 0.25 : 0, 0, 0, shelf);
      z += t + 0.01;
    }
  }
  shelf.position.set(W / 2 - 0.3, 0, -1.3);
  g.add(shelf);
  // Sheet-covered furniture (soft blocky shapes)
  const covered = (w, h, d, x, z, ry, m = M.sheet) => {
    const c = new THREE.Group();
    add(w, h, d, m, 0, h / 2, 0, 0, 0, 0, c);
    add(w * 0.9, 0.12, d * 0.9, m, 0, h + 0.05, 0, 0, 0, 0, c);
    add(w + 0.08, 0.25, d + 0.08, m, 0, 0.12, 0, 0, 0, 0, c);                // draped hem
    c.position.set(x, 0, z); c.rotation.y = ry;
    g.add(c);
  };
  covered(2.2, 0.75, 0.95, 1.4, -1.9, 0.1);                 // sofa
  covered(0.95, 0.85, 0.9, -1.4, -1.5, -0.4, M.sheet2);    // armchair
  covered(0.8, 2.0, 0.55, 2.9, 2.2, 0, M.sheet2);          // tall cabinet
  covered(1.4, 1.0, 0.7, -2.2, -2.5, 0.08);                // piano
  // Round table + the photograph spot
  const TT = new THREE.Vector3(0.3, 0.8, 0.2);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.07, 20), M.wood);
  top.position.set(TT.x, TT.y - 0.035, TT.z); top.castShadow = top.receiveShadow = true; g.add(top);
  const dust = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.004, 20), std('#9a8e80'));
  dust.position.set(TT.x, TT.y + 0.002, TT.z); dust.receiveShadow = true; g.add(dust);
  add(0.12, 0.72, 0.12, M.wood, TT.x, 0.38, TT.z);
  add(0.6, 0.06, 0.12, M.wood, TT.x, 0.03, TT.z);
  add(0.12, 0.06, 0.6, M.wood, TT.x, 0.03, TT.z);
  // Overturned chair, scattered papers and debris
  add(0.45, 0.06, 0.45, M.wood, -0.9, 0.24, 1.1, 1.3, 0.4, 0);
  add(0.45, 0.55, 0.06, M.wood, -0.95, 0.1, 1.45, 1.57, 0.4, 0);
  for (let i = 0; i < 9; i++) add(0.2, 0.004, 0.28, std('#cfc6b2'), (r() - 0.5) * 3.5, 0.004, (r() - 0.3) * 3, 0, r() * 3, 0);
  for (let i = 0; i < 14; i++) add(0.08 + r() * 0.06, 0.06, 0.08 + r() * 0.06, std('#9a9084'), (r() - 0.5) * W * 0.8, 0.03, (r() - 0.5) * D * 0.8, 0, r() * 3, 0);
  // Chandelier with cobweb strands
  const ch = new THREE.Group();
  add(0.03, 0.7, 0.03, std('#3a3530'), 0, H - 0.35, 0, 0, 0, 0, ch);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.03, 6, 16), std('#5a5046', { metalness: 0.4 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = H - 0.72; ch.add(ring);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; add(0.05, 0.14, 0.05, std('#e6dcc4'), Math.cos(a) * 0.45, H - 0.63, Math.sin(a) * 0.45, 0, 0, 0, ch); }
  const webM = new THREE.MeshBasicMaterial({ color: '#f2efe6', transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false });
  for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.006, 0.3 + r() * 0.25), webM); const a = r() * 6.28; s.position.set(Math.cos(a) * 0.3, H - 0.95, Math.sin(a) * 0.3); s.rotation.z = (r() - 0.5) * 0.4; ch.add(s); }
  ch.position.set(TT.x, 0, TT.z);
  g.add(ch);
  // Corner cobwebs (triangles)
  for (const [x, z, ry] of [[-W / 2 + 0.08, -D / 2 + 0.08, 0], [W / 2 - 0.08, -D / 2 + 0.08, -Math.PI / 2], [W / 2 - 0.08, D / 2 - 0.08, Math.PI]]) {
    const tri = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.9, 0, 0), new THREE.Vector3(0, -0.9, 0)]), webM);
    tri.position.set(x, H - 0.02, z); tri.rotation.set(0, ry, 0); tri.rotateX(-0.8);
    g.add(tri);
  }
  g.userData = { tableTop: TT.clone().add(new THREE.Vector3(0, 0.006, 0)), door, bookshelf: shelf,
    windowCenter: new THREE.Vector3(2.05, 1.65, fz), size: [W, D, H] };
  return g;
}
