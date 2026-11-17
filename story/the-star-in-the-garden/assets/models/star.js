// The little star: a chunky five-point star with a tiny happy face, glowing gold.
// group.userData.glowMat lets scenes animate its brightness.
import * as THREE from 'three';

export function build({ size = 0.09, color = '#ffd34d', intensity = 3 } = {}) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? size : size * 0.48;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y);
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: size * 0.25, bevelEnabled: true, bevelThickness: size * 0.18, bevelSize: size * 0.12, bevelSegments: 1,
  });
  geo.center();
  const glowMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, flatShading: true });
  const g = new THREE.Group();
  g.name = 'star';
  const body = new THREE.Mesh(geo, glowMat);
  g.add(body);

  const faceMat = new THREE.MeshBasicMaterial({ color: '#5a3a10' });
  const z = size * 0.32;
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(size * 0.07, 6, 4), faceMat);
    eye.position.set(s * size * 0.17, size * 0.05, z);
    eye.scale.z = 0.4;
    g.add(eye);
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(size * 0.1, size * 0.025, 3, 8, Math.PI), faceMat);
  smile.position.set(0, -size * 0.09, z);
  smile.rotation.z = Math.PI;
  g.add(smile);
  g.userData = { glowMat };
  return g;
}
