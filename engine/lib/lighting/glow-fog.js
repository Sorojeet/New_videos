// GLOW + FOG — dark, atmospheric. Dense fog, dim moonlight, glowing point lights,
// and bloom so anything emissive (lava, lamps, beams, eyes) halos softly.
// Best for: night, storms, lava, sci-fi, mysterious openings.
import * as THREE from 'three';
import { bloomComposer } from '../post.js';
import { makeRig, sun, background } from './common.js';

export const defaults = {
  background: '#0b0f1e',
  fogDensity: 0.07,
  moon: { color: '#7f9cff', intensity: 0.9, direction: [-3, 6, 2] },
  ambient: 0.2,
  // Glowing light sources: each gets a point light and (optionally) a visible orb.
  glows: [],         // [{ position:[x,y,z], color:'#ff8a3d', intensity:6, distance:6, orb:0.08 }]
  bloom: { strength: 0.9, radius: 0.6, threshold: 0.6 },
  size: 3,
  exposure: 1.1,
};

export function apply(scene, ctx, opts = {}) {
  const o = { ...defaults, ...opts,
    moon: { ...defaults.moon, ...opts.moon }, bloom: { ...defaults.bloom, ...opts.bloom } };
  ctx.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  ctx.renderer.toneMappingExposure = o.exposure;
  const rig = makeRig(scene, 'glow-fog');
  const hemi = new THREE.HemisphereLight('#3a4a80', '#0a0608', o.ambient);
  const moon = sun(o.moon.color, o.moon.intensity, o.moon.direction, { size: o.size });
  rig.add(hemi, moon);

  const glows = o.glows.map((g) => addGlow(rig, g));
  background(scene, o.background);
  scene.fog = new THREE.FogExp2(o.background, o.fogDensity);

  // Bloom post-processing; the engine uses `composer` automatically when the scene returns it.
  let composer = null;
  if (ctx.camera) composer = makeComposer(scene, ctx, o.bloom);

  return { name: 'glow-fog', rig, hemi, moon, glows, composer,
    addGlow: (g) => { const x = addGlow(rig, g); glows.push(x); return x; },
    attachCamera: (camera) => (composer = makeComposer(scene, { ...ctx, camera }, o.bloom)) };
}

function addGlow(rig, { position = [0, 0, 0], color = '#ff8a3d', intensity = 6, distance = 6, orb = 0.08 } = {}) {
  const light = new THREE.PointLight(color, intensity, distance, 2);
  light.position.set(...position);
  if (orb) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(orb, 1),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 4, flatShading: true }));
    light.add(m);
  }
  rig.add(light);
  return light;
}

function makeComposer(scene, ctx, b) {
  return bloomComposer(ctx, scene, ctx.camera, b);
}
