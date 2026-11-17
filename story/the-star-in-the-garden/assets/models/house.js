// Cosy low-poly cottage with warm glowing windows.
// build({ wall, roof, glow }) -> Group; group.userData.windows = window glass meshes.
import * as THREE from 'three';
import { flatMat, shadows } from 'engine/lowpoly.js';

export function build({ wall = '#f3e3c3', roof = '#c8553d', trim = '#7a4a32', glow = '#ffb85c', glowIntensity = 2.2, seed = 1 } = {}) {
  const g = new THREE.Group();
  g.name = 'house';
  const W = 2.2, H = 1.5, D = 1.8;

  const walls = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), flatMat(wall));
  walls.position.y = H / 2;
  g.add(walls);

  // Roof: triangular prism with overhang
  const shape = new THREE.Shape();
  shape.moveTo(-W / 2 - 0.2, 0); shape.lineTo(W / 2 + 0.2, 0); shape.lineTo(0, 1.05); shape.lineTo(-W / 2 - 0.2, 0);
  const roofGeo = new THREE.ExtrudeGeometry(shape, { depth: D + 0.3, bevelEnabled: false });
  roofGeo.translate(0, 0, -(D + 0.3) / 2);
  const roofM = new THREE.Mesh(roofGeo, flatMat(roof));
  roofM.position.y = H;
  g.add(roofM);
  // Gable fill (wall colour) under the roof
  const gShape = new THREE.Shape();
  gShape.moveTo(-W / 2, 0); gShape.lineTo(W / 2, 0); gShape.lineTo(0, 0.9); gShape.lineTo(-W / 2, 0);
  const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(gShape, { depth: D, bevelEnabled: false }), flatMat(wall));
  gable.position.set(0, H, -D / 2);
  g.add(gable);

  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.7, 0.28), flatMat('#9a8f86'));
  chimney.position.set(0.55, H + 0.75, -0.3);
  g.add(chimney);

  // Door
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.78, 0.06), flatMat(trim));
  door.position.set(-0.45, 0.39, D / 2 + 0.01);
  const knob = new THREE.Mesh(new THREE.IcosahedronGeometry(0.03, 0), flatMat('#e8c45a', { metalness: 0.6, roughness: 0.4 }));
  knob.position.set(-0.3, 0.4, D / 2 + 0.05);
  const step = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.3), flatMat('#a59a90'));
  step.position.set(-0.45, 0.04, D / 2 + 0.15);
  g.add(door, knob, step);

  // Windows (front and side); glass is emissive so it glows warmly
  const glassMat = new THREE.MeshStandardMaterial({ color: glow, emissive: glow, emissiveIntensity: glowIntensity, flatShading: true });
  const frameMat = flatMat(trim);
  const windows = [];
  const addWindow = (x, y, z, ry) => {
    const w = new THREE.Group();
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), glassMat);
    glass.name = 'window-glass';
    const fr = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.04), frameMat);
    fr.position.z = -0.015;
    const barV = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.42, 0.03), frameMat);
    const barH = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.03), frameMat);
    barV.position.z = barH.position.z = 0.01;
    const sill = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.05, 0.1), frameMat);
    sill.position.set(0, -0.26, 0.03);
    w.add(fr, glass, barV, barH, sill);
    w.position.set(x, y, z);
    w.rotation.y = ry;
    g.add(w);
    windows.push(glass);
  };
  addWindow(0.45, 0.9, D / 2 + 0.03, 0);
  addWindow(W / 2 + 0.03, 0.9, 0.2, Math.PI / 2);
  addWindow(-W / 2 - 0.03, 0.9, 0.2, -Math.PI / 2);

  shadows(g);
  windows.forEach((w) => { w.castShadow = false; });
  g.userData = { windows, glassMat, size: [W, H, D] };
  return g;
}
