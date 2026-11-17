// Small low-poly planet with trees and rocks. build(ctx) returns a THREE.Group.
import * as THREE from 'three';
import { flatMat, jitter, shadows, rng } from 'engine/lowpoly.js';

export function build({ seed = 7 } = {}) {
  const r = rng(seed);
  const group = new THREE.Group();
  group.name = 'planet';

  const ground = new THREE.Mesh(jitter(new THREE.IcosahedronGeometry(1, 3), 0.06, seed), flatMat('#6fbf73'));
  ground.name = 'ground';
  group.add(ground);

  const water = new THREE.Mesh(new THREE.IcosahedronGeometry(0.985, 3), flatMat('#3b8fd4', { roughness: 0.4 }));
  water.name = 'water';
  group.add(water);

  const trunkMat = flatMat('#7a5232');
  const leafMats = [flatMat('#2f8f4e'), flatMat('#3fa35a'), flatMat('#24733f')];
  const rockMat = flatMat('#8c8c94');
  const up = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i < 40; i++) {
    const dir = new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize();
    const item = new THREE.Group();
    if (r() < 0.8) {
      const h = 0.12 + r() * 0.1;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, h * 0.4, 5), trunkMat);
      trunk.position.y = h * 0.2;
      const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.05 + r() * 0.03, h, 6), leafMats[i % 3]);
      leaves.position.y = h * 0.4 + h * 0.4;
      item.add(trunk, leaves);
    } else {
      const rock = new THREE.Mesh(jitter(new THREE.DodecahedronGeometry(0.04 + r() * 0.03, 0), 0.02, i), rockMat);
      item.add(rock);
    }
    item.position.copy(dir.clone().multiplyScalar(1.0));
    item.quaternion.setFromUnitVectors(up, dir);
    group.add(item);
  }
  return shadows(group);
}
