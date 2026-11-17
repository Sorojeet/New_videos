// Scene entry point. setup(ctx) builds the scene once; update(t) poses it for
// time t (seconds). Never use real clocks or Math.random(): use t and ctx.rng.
import * as THREE from 'three';
import { easeInOut, span, lerp } from 'engine/lowpoly.js';

export async function setup(ctx) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, ctx.aspect, 0.1, 100);

  // Lighting from this video's lighting/main.js (override with --set light=<preset>)
  const { apply } = await ctx.load('lighting/main.js');
  const light = apply(scene, { ...ctx, camera });

  const { build } = await ctx.load('assets/models/planet.js');
  const planet = build({ seed: 7 });
  scene.add(planet);

  // ctx.timing has the voiceover line times when audio/voiceover_timing.json exists.
  const duration = ctx.timing?.duration ?? 8;

  return {
    scene, camera, duration,
    get composer() { return light.composer; },   // bloom from glow-fog; null otherwise
    update(t) {
      light.update?.(t);                 // lighting timeline (mixed presets)
      planet.rotation.y = t * 0.35;
      planet.rotation.x = 0.25;
      const p = easeInOut(span(t, 0, duration));
      camera.position.set(0, lerp(0.6, 0.2, p), lerp(9.5, 7.5, p));
      camera.lookAt(0, 0, 0);
      // Glows orbit the planet
      (light.glows || []).forEach((g, i) => {
        const a = t * 0.6 + i * Math.PI;
        g.position.set(Math.cos(a) * 1.8, 0.7 - i * 1.3, Math.sin(a) * 1.8 - 0.4);
      });
    },
  };
}
