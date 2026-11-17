// Design sheet renders (not a video): render stills at t = 0..3
//   0 explorer turnaround · 1 face close-up (eyes, blink, mouths) · 2 dusk frame with title · 3 night window
import * as THREE from 'three';
import { bloomComposer } from 'engine/post.js';

export async function setup(ctx) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, ctx.aspect, 0.05, 500);
  scene.add(camera);
  const ex = await ctx.load('../assets/models/explorer.js');
  const hs = await ctx.load('../assets/models/house.js');
  for (const [f, file] of [['Cormorant', 'CormorantGaramond-MediumItalic.woff2'], ['Jost', 'Jost-Medium.woff2']]) {
    try { const ff = new FontFace(f, `url(${ctx.base}../assets/fonts/${file})`); await ff.load(); document.fonts.add(ff); } catch {}
  }
  ctx.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  ctx.renderer.toneMappingExposure = 1.0;

  // Pastel sky dome
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color('#a99cc0') }, mid: { value: new THREE.Color('#e8c8b4') }, hor: { value: new THREE.Color('#f0d7c0') } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top, mid, hor; varying vec3 vP; void main(){ float h = clamp(vP.y, 0.0, 1.0); vec3 c = mix(hor, mid, smoothstep(0.0, 0.12, h)); c = mix(c, top, smoothstep(0.12, 0.6, h)); gl_FragColor = vec4(c, 1.0); }',
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), skyMat));
  scene.fog = new THREE.Fog('#e3cbb8', 14, 70);

  const hemi = new THREE.HemisphereLight('#ffe9d8', '#6f7a62', 1.4);
  const sun = new THREE.DirectionalLight('#ffd2a8', 2.2);
  sun.position.set(8, 9, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 });
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
  scene.add(hemi, sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: '#7f8c69', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  scene.add(ground);
  const path = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 9), new THREE.MeshStandardMaterial({ color: '#9c8f78', roughness: 1 }));
  path.rotation.x = -Math.PI / 2; path.position.set(-0.47, 0.01, 8.5); path.receiveShadow = true;
  scene.add(path);

  // Trees like the reference: cones + round crowns
  const treeG = new THREE.Group();
  const tr = (x, z, s, round) => {
    const t = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.2, 6), new THREE.MeshStandardMaterial({ color: '#5a4636', flatShading: true }));
    trunk.position.y = 0.6; t.add(trunk);
    const m = new THREE.MeshStandardMaterial({ color: round ? '#5f7f4e' : '#4e6b48', flatShading: true });
    if (round) { const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 0), m); c.position.y = 1.9; t.add(c); }
    else for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.1 - i * 0.25, 1.4, 7), m); c.position.y = 1.4 + i * 0.75; t.add(c); }
    t.scale.setScalar(s); t.position.set(x, 0, z);
    t.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    treeG.add(t);
  };
  let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 90; i++) { const a = rnd() * Math.PI * 2, d = 11 + rnd() * 40; const x = Math.cos(a) * d, z = Math.sin(a) * d - 6; if (z > 6 && Math.abs(x) < 9) continue; tr(x, z, 0.9 + rnd() * 0.9, rnd() < 0.35); }
  scene.add(treeG);
  // Dead tree beside the house
  const dead = new THREE.Group();
  const dm = new THREE.MeshStandardMaterial({ color: '#4a3f37', flatShading: true });
  const limb = (x, y, z, len, rz, rx, r) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r, len, 5), dm); b.geometry.translate(0, len / 2, 0); b.position.set(x, y, z); b.rotation.set(rx, 0, rz); b.castShadow = true; dead.add(b); };
  limb(0, 0, 0, 3.2, 0.05, 0, 0.18); limb(-0.1, 2.0, 0, 1.6, 0.8, 0.2, 0.1); limb(0.05, 2.5, 0, 1.4, -0.7, -0.2, 0.09); limb(0, 3.0, 0, 1.0, 0.2, 0.4, 0.07);
  dead.position.set(4.6, 0, 1.8);
  scene.add(dead);

  const house = hs.build({});
  scene.add(house);
  const winLight = new THREE.PointLight('#ffa64a', 0, 7, 2);
  winLight.position.copy(house.userData.glowPos).add(new THREE.Vector3(0, 0, 0.9));
  scene.add(winLight);

  const front = ex.build({}), threeQ = ex.build({}), back = ex.build({}), hero = ex.build({});
  scene.add(front, threeQ, back, hero);

  // Overlay: title + subtitle drawn on a camera-attached canvas plane
  const tc = document.createElement('canvas'); tc.width = 1080; tc.height = 1920;
  const g2 = tc.getContext('2d');
  const tex = new THREE.CanvasTexture(tc); tex.colorSpace = THREE.SRGBColorSpace;
  const ov = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, fog: false }));
  ov.renderOrder = 999;
  const dist = 1, vh = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist;
  ov.scale.set(vh * camera.aspect, vh, 1); ov.position.z = -dist;
  camera.add(ov);
  const drawOverlay = (title, gold, sub, label) => {
    g2.clearRect(0, 0, 1080, 1920);
    g2.textAlign = 'center'; g2.textBaseline = 'middle';
    if (title) {
      g2.font = '500 92px Cormorant, serif';
      g2.shadowColor = 'rgba(40,30,40,0.45)'; g2.shadowBlur = 18; g2.shadowOffsetY = 4;
      const lines = [title, gold];
      g2.fillStyle = '#fbf6ee';
      const [a, b] = title.split('|');
      const wA = g2.measureText(a).width, wB = g2.measureText(b).width;
      g2.fillText(a, 540 - wB / 2, 320); g2.fillStyle = '#e9c27a'; g2.fillText(b, 540 + wA / 2, 320);
      g2.fillStyle = '#fbf6ee'; g2.fillText(gold, 540, 420);
    }
    if (sub) {
      g2.font = '500 62px Jost, sans-serif';
      g2.shadowColor = 'rgba(0,0,0,0.55)'; g2.shadowBlur = 14; g2.shadowOffsetY = 3;
      g2.fillStyle = '#ffffff'; g2.fillText(sub, 540, 1340);
    }
    if (label) {
      g2.shadowBlur = 0; g2.font = '500 44px Jost, sans-serif'; g2.fillStyle = 'rgba(40,40,50,0.75)';
      g2.textAlign = 'left'; g2.fillText(label, 60, 1840);
    }
    tex.needsUpdate = true;
  };

  const composer = bloomComposer(ctx, scene, camera, { strength: 0.35, radius: 0.5, threshold: 0.9 });
  const hideAll = () => [front, threeQ, back, hero].forEach((e) => (e.visible = false));

  return {
    scene, camera, composer, duration: 4, subtitles: false,
    update(t) {
      const mode = Math.floor(t + 1e-6), sub = t - mode;
      hideAll();
      house.visible = mode >= 2;
      house.userData.glowMat.emissiveIntensity = mode === 3 ? 2.2 : 0.25;
      winLight.intensity = mode === 3 ? 3 : 0;
      if (mode === 3) {
        skyMat.uniforms.top.value.set('#1d2340'); skyMat.uniforms.mid.value.set('#3a4268'); skyMat.uniforms.hor.value.set('#56597a');
        scene.fog.color.set('#3c4264'); hemi.intensity = 0.55; hemi.color.set('#8ea0d8'); sun.intensity = 0.5; sun.color.set('#9fb4ff');
      } else {
        skyMat.uniforms.top.value.set('#a99cc0'); skyMat.uniforms.mid.value.set('#e8c8b4'); skyMat.uniforms.hor.value.set('#f0d7c0');
        scene.fog.color.set('#e3cbb8'); hemi.intensity = 1.4; hemi.color.set('#ffe9d8'); sun.intensity = 2.2; sun.color.set('#ffd2a8');
      }
      if (mode === 0) {
        house.visible = false;
        for (const [e, x, ry] of [[threeQ, -1.0, 0.6], [front, 0, 0], [back, 1.0, Math.PI]]) {
          e.visible = true; e.position.set(x, 0, 12); e.rotation.y = ry; ex.pose(e, { mouth: 'smile' });
        }
        camera.position.set(0, 1.1, 21.5); camera.lookAt(0, 0.95, 12);
        drawOverlay(null, null, null, 'Explorer · 3/4, front, back');
      } else if (mode === 1) {
        house.visible = false;
        front.visible = true; front.position.set(0, 0, 12); front.rotation.y = 0;
        const faces = [
          [{ mouth: 'neutral', gaze: [0.2, 0.1] }, 'Calm'],
          [{ mouth: 'neutral', blink: 1 }, 'Blink'],
          [{ mouth: 'open', brows: 1, gaze: [0, 0.25] }, 'Scared'],
          [{ mouth: 'smile', gaze: [-0.2, 0] }, 'Smile'],
        ];
        const [p, name] = faces[Math.min(3, Math.round(sub * 4))];
        ex.pose(front, p);
        camera.position.set(0.25, 1.68, 13.7); camera.lookAt(0, 1.62, 12);
        drawOverlay(null, null, null, 'Face · ' + name);
      } else if (mode === 2) {
        hero.visible = true; hero.position.set(-0.5, 0, 6.2); hero.rotation.y = Math.PI;
        ex.pose(hero, { look: [0.15, 0.25] });
        camera.position.set(2.2, 1.7, 21); camera.lookAt(-0.3, 3.4, 0);
        drawOverlay('Nobody had entered it for |fifty', 'years', 'there was a house that nobody', 'Frame · dusk');
      } else {
        hero.visible = true; hero.position.set(-1.2, 0, 10.5); hero.rotation.y = Math.PI;
        ex.pose(hero, { aim: 0.6, torchOn: true, look: [0.2, 0.35] });
        camera.position.set(-2.2, 1.3, 16.5); camera.lookAt(-1.4, 4.6, 0);
        drawOverlay('Every night, a |light', 'appeared upstairs', 'a light appeared in its upstairs window.', 'Frame · night');
      }
    },
  };
}
