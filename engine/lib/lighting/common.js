// Shared bits for lighting presets.
import * as THREE from 'three';

export function makeRig(scene, name) {
  const rig = new THREE.Group();
  rig.name = `lighting-${name}`;
  scene.add(rig);
  return rig;
}

// Directional light with a shadow box sized to the scene (opts.size = half-width).
export function sun(color, intensity, pos, { shadow = true, size = 3, mapSize = 2048 } = {}) {
  const l = new THREE.DirectionalLight(color, intensity);
  l.position.set(...pos);
  if (shadow) {
    l.castShadow = true;
    l.shadow.mapSize.set(mapSize, mapSize);
    const c = l.shadow.camera;
    c.left = c.bottom = -size;
    c.right = c.top = size;
    c.near = 0.1;
    c.far = 50;
    l.shadow.bias = -0.0005;
    l.shadow.normalBias = 0.02;
  }
  return l;
}

export function background(scene, color) {
  scene.background = new THREE.Color(color);
}
