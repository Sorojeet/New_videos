// Shared low-poly helpers used by every video's assets and scenes.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// Deterministic random numbers: same seed -> same model every render.
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Flat-shaded material: the core of the low-poly look.
export function flatMat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color, flatShading: true, roughness: 0.9, metalness: 0, ...opts,
  });
}

// Glowing material (lava, windows, beams).
export function glowMat(color, intensity = 1.5) {
  return new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: intensity, flatShading: true,
  });
}

// Randomly push vertices to break up perfect shapes, keeping seams closed.
export function jitter(geometry, amount = 0.05, seed = 1) {
  const r = rng(seed);
  const src = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  src.deleteAttribute('normal');
  src.deleteAttribute('uv');
  const g = mergeVertices(src);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    p.setXYZ(i,
      p.getX(i) + (r() - 0.5) * amount,
      p.getY(i) + (r() - 0.5) * amount,
      p.getZ(i) + (r() - 0.5) * amount);
  }
  const flat = g.toNonIndexed();
  flat.computeVertexNormals();
  return flat;
}

// Make every mesh in an object cast and receive shadows.
export function shadows(obj, cast = true, receive = true) {
  obj.traverse((o) => { if (o.isMesh) { o.castShadow = cast; o.receiveShadow = receive; } });
  return obj;
}

// Animation helpers
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => (t = clamp(t), t * t * (3 - 2 * t));          // smoothstep
export const easeInOut = (t) => (t = clamp(t), t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// Progress 0..1 of time t through the window [start, end].
export const span = (t, start, end) => clamp((t - start) / (end - start));
