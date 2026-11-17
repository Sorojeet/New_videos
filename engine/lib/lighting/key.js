// KEY LIGHT — one strong sun, hard shadows, low ambient. Dramatic and directional.
// Best for: what-if day/night sides, reveals, a single hero object.
import * as THREE from 'three';
import { makeRig, sun, background } from './common.js';

export const defaults = {
  background: '#141824',
  color: '#ffe0b0',
  intensity: 4.5,
  direction: [5, 4, 2],
  ambient: 0.25,
  size: 3,           // shadow area half-width, match to scene scale
  exposure: 1.0,
};

export function apply(scene, ctx, opts = {}) {
  const o = { ...defaults, ...opts };
  ctx.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  ctx.renderer.toneMappingExposure = o.exposure;
  const rig = makeRig(scene, 'key');
  const hemi = new THREE.HemisphereLight('#9fb4d8', '#20160f', o.ambient);
  const key = sun(o.color, o.intensity, o.direction, { size: o.size });
  rig.add(hemi, key);
  background(scene, o.background);
  scene.fog = null;
  return { name: 'key', rig, hemi, key };
}
