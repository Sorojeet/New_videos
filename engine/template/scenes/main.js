// Scene entry point. setup(ctx) builds the scene once; update(t) poses it for
// time t (seconds). Never use real clocks or Math.random(): use t and ctx.rng.
import * as THREE from 'three';
import { easeInOut, span, lerp } from 'engine/lowpoly.js';

export async function setup(ctx) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, ctx.aspect, 0.1, 100);

  const { apply } = await ctx.load('lighting/studio.js');
  const light = apply(scene);

  const { build } = await ctx.load('assets/models/planet.js');
  const planet = build({ seed: 7 });
  scene.add(planet);

  // ctx.timing has the voiceover line times when audio/voiceover_timing.json exists.
  const duration = ctx.timing?.duration ?? 6;

  return {
    scene, camera, duration,
    update(t) {
      planet.rotation.y = t * 0.35;
      planet.rotation.x = 0.25;
      const p = easeInOut(span(t, 0, duration));
      camera.position.set(0, lerp(0.6, 0.2, p), lerp(9.5, 7.5, p));
      camera.lookAt(0, 0, 0);
      light.key.intensity = 3.0;
    },
  };
}
