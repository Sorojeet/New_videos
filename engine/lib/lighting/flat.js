// FLAT LIGHT — even, shadowless, poster-like. Colours read exactly as picked.
// Best for: infographics, explainer diagrams, clean abstract loops.
import * as THREE from 'three';
import { makeRig, sun, background } from './common.js';

export const defaults = {
  background: '#e9eef5',
  ambient: 1.6,       // overall brightness
  shade: 0.9,         // how much the facets still differ (0 = totally flat)
  direction: [2, 4, 5],
};

export function apply(scene, ctx, opts = {}) {
  const o = { ...defaults, ...opts };
  ctx.renderer.toneMapping = THREE.NoToneMapping;
  const rig = makeRig(scene, 'flat');
  const hemi = new THREE.HemisphereLight('#ffffff', '#dfe4ee', o.ambient);
  const key = sun('#ffffff', o.shade, o.direction, { shadow: false });
  rig.add(hemi, key);
  background(scene, o.background);
  scene.fog = null;
  return { name: 'flat', rig, hemi, key };
}
