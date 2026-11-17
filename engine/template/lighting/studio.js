// Lighting preset: warm key + cool rim + soft sky fill.
// apply(scene, opts) adds the rig and returns it, so a scene can animate it.
import * as THREE from 'three';

export function apply(scene, { background = '#1b2140', fog = true } = {}) {
  const rig = new THREE.Group();
  rig.name = 'lighting-studio';

  const hemi = new THREE.HemisphereLight('#bcd7ff', '#3a2a40', 0.9);
  const key = new THREE.DirectionalLight('#ffe2b8', 3.0);
  key.position.set(4, 5, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = key.shadow.camera.bottom = -3;
  key.shadow.camera.right = key.shadow.camera.top = 3;
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.02;
  const rim = new THREE.DirectionalLight('#7fb2ff', 2.2);
  rim.position.set(-5, 2, -4);

  rig.add(hemi, key, rim);
  scene.add(rig);
  scene.background = new THREE.Color(background);
  if (fog) scene.fog = new THREE.Fog(background, 8, 18);
  return { rig, hemi, key, rim };
}
