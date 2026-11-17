// Combine several lighting presets in one video and crossfade between them.
//
//   import { mixLighting } from 'engine/lighting/mix.js';
//   const light = mixLighting(scene, { ...ctx, camera }, {
//     presets: { 'flat': {}, 'key': {}, 'glow-fog': { glows: [...] } },  // presets used + their options
//     timeline: [
//       [0,  'flat'],              // at 0s: flat light
//       [8,  'key', 1.5],          // at 8s: fade to key light over 1.5s
//       [20, 'glow-fog', 0],       // at 20s: hard cut to glow + fog
//     ],
//   });
//   // in update(t):  light.update(t)
//   // or set weights by hand: light.set({ key: 0.6, 'glow-fog': 0.4 })
//
// Everything blends: light intensities, background colour, fog density, bloom strength,
// and glowing orbs. Return `light.composer` from the scene so bloom is used.
import * as THREE from 'three';
import { lighting } from './index.js';

// Fog density each preset contributes while mixing (linear fog is converted to exp2).
// Exposure each preset wants while mixing (flat needs a lift under filmic tone mapping).
const EXPOSURE = { 'flat': 1.45, 'key': 1.0, 'fill-rim': 1.0, 'glow-fog': 1.1 };
const FOG = { 'flat': 0, 'key': 0, 'fill-rim': 0.035, 'glow-fog': null /* uses its own */ };

export function mixLighting(scene, ctx, { presets, timeline = null }) {
  const names = Object.keys(presets);
  const parts = {};
  let composer = null;
  let bloomBase = 0;

  for (const name of names) {
    const h = lighting[name](scene, ctx, presets[name] || {});
    const bg = scene.background.clone();
    let fog = FOG[name] ?? 0;
    if (scene.fog && scene.fog.isFogExp2) fog = scene.fog.density;
    const lights = [];
    const glowMats = [];
    h.rig.traverse((o) => {
      if (o.isLight) { o.userData.base = o.intensity; lights.push(o); }
      if (o.isMesh && o.material.emissive) { o.material.userData.base = o.material.emissiveIntensity; glowMats.push(o); }
    });
    if (h.composer) {
      composer = h.composer;
      const bloom = composer.passes.find((p) => p.strength !== undefined);
      bloomBase = bloom.strength;
    }
    parts[name] = { handles: h, bg, fog, lights, glowMats };
  }

  // One consistent tone mapping while mixing.
  ctx.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  ctx.renderer.toneMappingExposure = 1.05;
  scene.fog = new THREE.FogExp2(0x000000, 0);
  const bloomPass = composer && composer.passes.find((p) => p.strength !== undefined);

  const set = (weights) => {
    const bg = new THREE.Color(0, 0, 0);
    let fog = 0, exposure = 0, total = 0;
    for (const name of names) {
      const w = weights[name] || 0;
      const p = parts[name];
      for (const l of p.lights) { l.intensity = l.userData.base * w; l.visible = w > 0.001; }
      for (const m of p.glowMats) { m.material.emissiveIntensity = m.material.userData.base * w; m.visible = w > 0.001; }
      bg.r += p.bg.r * w; bg.g += p.bg.g * w; bg.b += p.bg.b * w;
      fog += p.fog * w;
      exposure += (EXPOSURE[name] ?? 1) * w; total += w;
      if (name === 'glow-fog' && bloomPass) bloomPass.strength = bloomBase * w;
    }
    scene.background = bg;
    scene.fog.color.copy(bg);
    scene.fog.density = fog;
    ctx.renderer.toneMappingExposure = total ? exposure / total : 1;
  };

  const weightsAt = (t) => {
    if (!timeline || !timeline.length) return { [names[0]]: 1 };
    let w = { [timeline[0][1]]: 1 };
    for (let i = 1; i < timeline.length; i++) {
      const [start, name, fade = 1] = timeline[i];
      if (t < start) break;
      const prev = timeline[i - 1][1];
      const k = fade > 0 ? Math.min(1, (t - start) / fade) : 1;
      const s = k * k * (3 - 2 * k);
      w = { [prev]: 1 - s };
      w[name] = (w[name] || 0) + s;
    }
    return w;
  };

  set(weightsAt(0));
  return {
    name: 'mix', parts, set, weightsAt,
    // Bloom only runs while glow-fog is visible, so other sections render at full speed.
    get composer() { return bloomPass && bloomPass.strength > 0.001 ? composer : null; },
    update: (t) => set(weightsAt(t)),
    // Handles of one preset's lights, e.g. light.get('key').key.position.set(...)
    get: (name) => parts[name].handles,
    glows: parts['glow-fog']?.handles.glows || [],
  };
}
