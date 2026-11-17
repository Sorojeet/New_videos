// Rolling green hills with a flat clearing in the middle for the garden.
import * as THREE from 'three';
import { rng } from 'engine/lowpoly.js';

export function heightAt(x, z, flat = 7) {
  const d = Math.hypot(x, z);
  const k = Math.min(1, Math.max(0, (d - flat) / 10));
  const h = Math.sin(x * 0.18) * 1.6 + Math.cos(z * 0.15 + 1.3) * 1.9 + Math.sin((x + z) * 0.09) * 2.2 + 2.0;
  return h * k * k;
}

export function build({ size = 140, segments = 70, seed = 3, flat = 7, palette = ['#7cc46a', '#6bb55c', '#8fd176', '#5ea654', '#78bf63'] } = {}) {
  const r = rng(seed);
  const geo = new THREE.PlaneGeometry(size, size, segments, segments).toNonIndexed();
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  // Height per unique vertex (keyed by position so shared corners stay joined)
  const cache = new Map();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const key = `${x.toFixed(3)},${z.toFixed(3)}`;
    if (!cache.has(key)) {
      const jx = Math.hypot(x, z) > flat + 1 ? (r() - 0.5) * 0.35 : 0;
      cache.set(key, heightAt(x, z, flat) + jx);
    }
    p.setY(i, cache.get(key));
  }
  const colors = [];
  const col = new THREE.Color();
  for (let f = 0; f < p.count / 3; f++) {
    col.set(palette[Math.floor(r() * palette.length)]);
    for (let k = 0; k < 3; k++) colors.push(col.r, col.g, col.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
  mesh.name = 'hills';
  mesh.receiveShadow = true;
  return mesh;
}
