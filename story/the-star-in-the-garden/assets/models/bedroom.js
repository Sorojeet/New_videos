// Leo's bedroom (cutaway: back wall with window, left wall, floor).
// Includes bed, nightstand with lamp, rug, shelf of collected treasures, curtains.
// userData: bed, nightstand top position (jar spot), lampMat, window position.
import * as THREE from 'three';
import { flatMat, shadows } from 'engine/lowpoly.js';

export function build() {
  const g = new THREE.Group();
  g.name = 'bedroom';
  const wallMat = flatMat('#e9d7bd'), wall2 = flatMat('#dcc7aa'), wood = flatMat('#a8744a'), woodDark = flatMat('#7c5234');
  const RW = 5, RD = 4, RH = 2.8;

  const floor = new THREE.Mesh(new THREE.BoxGeometry(RW, 0.1, RD), flatMat('#b8875a'));
  floor.position.y = -0.05;
  g.add(floor);
  for (let i = 0; i < 10; i++) {           // floorboard lines
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.005, RD), woodDark);
    line.position.set(-RW / 2 + 0.5 * i, 0.002, 0);
    g.add(line);
  }

  // Back wall with a window opening (built from 4 blocks)
  const winW = 1.3, winH = 1.2, winX = 0.7, winY = 1.55;
  const z = -RD / 2;
  const block = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.15), wallMat); m.position.set(x, y, z); g.add(m); };
  const left = winX - winW / 2 + RW / 2, right = RW / 2 - (winX + winW / 2);
  block(left, RH, -RW / 2 + left / 2, RH / 2);
  block(right, RH, RW / 2 - right / 2, RH / 2);
  block(winW, winY - winH / 2, winX, (winY - winH / 2) / 2);
  block(winW, RH - (winY + winH / 2), winX, RH - (RH - (winY + winH / 2)) / 2);
  // Window frame + panes (thin bars, open view to outside)
  const frame = flatMat('#f4efe6');
  const bar = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.18), frame); m.position.set(x, y, z); g.add(m); };
  bar(winW + 0.1, 0.07, winX, winY - winH / 2);
  bar(winW + 0.1, 0.07, winX, winY + winH / 2);
  bar(0.07, winH, winX - winW / 2, winY);
  bar(0.07, winH, winX + winW / 2, winY);
  bar(0.04, winH, winX, winY);
  bar(winW, 0.04, winX, winY);
  const sill = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.3, 0.06, 0.3), frame);
  sill.position.set(winX, winY - winH / 2 - 0.03, z + 0.1);
  g.add(sill);
  // Curtains
  for (const s of [-1, 1]) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.6, 0.06), flatMat('#5b7fc9'));
    c.position.set(winX + s * (winW / 2 + 0.2), winY - 0.1, z + 0.12);
    g.add(c);
  }
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, winW + 0.9, 5), woodDark);
  rod.rotation.z = Math.PI / 2;
  rod.position.set(winX, winY + winH / 2 + 0.12, z + 0.14);
  g.add(rod);

  // Left wall
  const lw = new THREE.Mesh(new THREE.BoxGeometry(0.15, RH, RD), wall2);
  lw.position.set(-RW / 2, RH / 2, 0);
  g.add(lw);
  // Skirting
  const sk = new THREE.Mesh(new THREE.BoxGeometry(RW, 0.1, 0.04), woodDark);
  sk.position.set(0, 0.05, z + 0.09);
  g.add(sk);

  // Rug
  const rug = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.02, 10), flatMat('#d9604c'));
  rug.position.set(0.6, 0.01, 0.6);
  rug.scale.z = 0.7;
  const rug2 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.025, 10), flatMat('#f2b84b'));
  rug2.position.copy(rug.position);
  rug2.scale.z = 0.7;
  g.add(rug, rug2);

  // Bed (head against the back wall, left side of the room)
  const bed = new THREE.Group();
  bed.name = 'bed';
  const frameB = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 1.9), wood);
  frameB.position.y = 0.25;
  const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.8, 0.08), woodDark);
  headboard.position.set(0, 0.5, -0.95);
  const footboard = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.5, 0.08), woodDark);
  footboard.position.set(0, 0.35, 0.95);
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.14, 1.82), flatMat('#f6f3ee'));
  mattress.position.y = 0.47;
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.12, 1.25), flatMat('#4f78c7'));
  blanket.position.set(0, 0.56, 0.3);
  blanket.name = 'blanket';
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.99, 0.125, 0.12), flatMat('#f2c14e'));
  stripe.position.set(0, 0.56, -0.25);
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.32), flatMat('#ffffff'));
  pillow.position.set(0, 0.6, -0.7);
  pillow.rotation.x = -0.15;
  bed.add(frameB, headboard, footboard, mattress, blanket, stripe, pillow);
  bed.position.set(-1.3, 0, -0.95 + 0.0);
  g.add(bed);

  // Nightstand + lamp (right of bed)
  const ns = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.45), wood);
  box.position.y = 0.25;
  const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.02), woodDark);
  drawer.position.set(0, 0.32, 0.23);
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.25, 6), flatMat('#e8d8b0'));
  lampBase.position.set(-0.12, 0.62, -0.08);
  const lampMat = new THREE.MeshStandardMaterial({ color: '#ffd9a0', emissive: '#ffb860', emissiveIntensity: 1.6, flatShading: true });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.15, 0.17, 6, 1, true), lampMat);
  shade.material.side = THREE.DoubleSide;
  shade.position.set(-0.12, 0.8, -0.08);
  ns.add(box, drawer, lampBase, shade);
  ns.position.set(-0.4, 0, -1.6);
  g.add(ns);

  // Shelf with Leo's collection of little treasures
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.25), woodDark);
  shelf.position.set(-1.0, 1.85, -RD / 2 + 0.2);
  g.add(shelf);
  const treasures = ['#7fd0ff', '#ff8a8a', '#ffd54f', '#9ce07a', '#c792ea'];
  treasures.forEach((c, i) => {
    const geo = [new THREE.IcosahedronGeometry(0.06, 0), new THREE.OctahedronGeometry(0.06, 0),
      new THREE.DodecahedronGeometry(0.055, 0), new THREE.ConeGeometry(0.05, 0.12, 5), new THREE.TetrahedronGeometry(0.07, 0)][i];
    const m = new THREE.Mesh(geo, flatMat(c, { roughness: 0.4 }));
    m.position.set(-1.45 + i * 0.22, 1.94, -RD / 2 + 0.2);
    g.add(m);
  });
  // Picture frame on the left wall
  const pic = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.6), woodDark);
  pic.position.set(-RW / 2 + 0.1, 1.6, 0.6);
  const art = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.4, 0.5), flatMat('#7ec4e8'));
  art.position.copy(pic.position);
  art.position.x += 0.005;
  const hill = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.2, 3), flatMat('#6bb55c'));
  hill.position.set(-RW / 2 + 0.14, 1.48, 0.6);
  g.add(pic, art, hill);

  shadows(g);
  const jarSpot = new THREE.Vector3(-0.4 + 0.1, 0.5, -1.6 + 0.05);
  g.userData = { bed, lampMat, lampPos: new THREE.Vector3(-0.52, 0.8, -1.68), jarSpot,
    window: new THREE.Vector3(winX, winY, z), size: [RW, RD, RH] };
  return g;
}
