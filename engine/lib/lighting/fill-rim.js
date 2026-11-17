// FILL + RIM — classic three-point: warm key, soft cool fill, bright rim from behind
// that outlines the silhouette against the background.
// Best for: characters, story scenes, objects that must pop from a dark background.
import * as THREE from 'three';
import { makeRig, sun, background } from './common.js';

export const defaults = {
  background: '#1b2140',
  key: { color: '#ffe2b8', intensity: 3.0, direction: [4, 5, 4] },
  fill: { color: '#9cc0ff', intensity: 0.9, direction: [-5, 1, 3] },
  rim: { color: '#8fd0ff', intensity: 4.0, direction: [-2, 3, -6] },
  ambient: 0.35,
  size: 3,
  fog: [8, 18],      // [near, far] or null
  exposure: 1.0,
};

export function apply(scene, ctx, opts = {}) {
  const o = { ...defaults, ...opts,
    key: { ...defaults.key, ...opts.key },
    fill: { ...defaults.fill, ...opts.fill },
    rim: { ...defaults.rim, ...opts.rim } };
  ctx.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  ctx.renderer.toneMappingExposure = o.exposure;
  const rig = makeRig(scene, 'fill-rim');
  const hemi = new THREE.HemisphereLight('#bcd7ff', '#2a2030', o.ambient);
  const key = sun(o.key.color, o.key.intensity, o.key.direction, { size: o.size });
  const fill = sun(o.fill.color, o.fill.intensity, o.fill.direction, { shadow: false });
  const rim = sun(o.rim.color, o.rim.intensity, o.rim.direction, { shadow: false });
  rig.add(hemi, key, fill, rim);
  background(scene, o.background);
  scene.fog = o.fog ? new THREE.Fog(o.background, o.fog[0], o.fog[1]) : null;
  return { name: 'fill-rim', rig, hemi, key, fill, rim };
}
