// Post-processing helpers shared by all videos.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Replaces NaN/Inf pixels with black. Flat shading can produce a NaN normal on a
// sub-pixel triangle; without this, bloom spreads that one pixel over the whole frame.
export const SanitizeShader = {
  uniforms: { tDiffuse: { value: null } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
    void main(){ vec4 c = texture2D(tDiffuse, vUv);
      if (any(isnan(c)) || any(isinf(c))) c = vec4(0.0, 0.0, 0.0, 1.0);
      gl_FragColor = vec4(min(c.rgb, vec3(64.0)), c.a); }`,
};

// Scene render -> NaN guard -> bloom -> tone mapping/colour space.
export function bloomComposer(ctx, scene, camera, { strength = 0.6, radius = 0.5, threshold = 0.85 } = {}) {
  const composer = new EffectComposer(ctx.renderer);
  composer.setPixelRatio(1);
  composer.setSize(ctx.width, ctx.height);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new ShaderPass(SanitizeShader));
  const bloom = new UnrealBloomPass(new THREE.Vector2(ctx.width, ctx.height), strength, radius, threshold);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  composer.bloom = bloom;
  return composer;
}
