// Small glass jar with a cork lid. Lid is userData.lid so it can pop off.
import * as THREE from 'three';
import { flatMat } from 'engine/lowpoly.js';

export function build({ radius = 0.085, height = 0.17 } = {}) {
  const g = new THREE.Group();
  g.name = 'jar';
  const glass = new THREE.MeshStandardMaterial({
    color: '#cfe8ff', transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.1,
    flatShading: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.95, height, 8, 1, true), glass);
  body.position.y = height / 2;
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.95, 8), glass);
  bottom.rotation.x = -Math.PI / 2;
  bottom.position.y = 0.003;
  const neck = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.88, radius * 0.1, 4, 8), glass);
  neck.rotation.x = Math.PI / 2;
  neck.position.y = height;
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.8, radius * 0.72, 0.05, 8), flatMat('#a9784a'));
  lid.position.y = height + 0.025;
  lid.castShadow = true;
  g.add(body, bottom, neck, lid);
  g.userData = { lid, height, glass };
  return g;
}
