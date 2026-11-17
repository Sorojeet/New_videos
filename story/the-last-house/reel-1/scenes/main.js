// THE LAST HOUSE — Reel 1 (60 s, 9:16). Blocky pastel style.
//  S1 0-12.5   aerial: forest -> village -> the lone house (dusk)
//  S2 12.5-20  night: the upstairs window lights up
//  S3 20-31    no electricity (cut wires), no owner (blank mailbox), no connection (wide, isolated)
//  S4 31-38    grey morning: the explorer walks up and opens the door
//  S5 38-47    inside: dust, sheets, light shafts; one clean photograph on the table
//  S6 47-60    the photo shows him at this house... dated fifty years ago
import * as THREE from 'three';
import { bloomComposer } from 'engine/post.js';
import { clamp, lerp, ease, easeInOut, span, rng } from 'engine/lowpoly.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const vl = (a, b, k) => a.clone().lerp(b, k);

const ENV = {
  dusk: { top: '#a99cc0', mid: '#e8c8b4', hor: '#f0d7c0', fog: '#e3cbb8', near: 40, far: 420, hemi: ['#ffe9d8', '#6f7a62', 1.35], sun: ['#ffd2a8', 2.1], sunPos: [30, 26, 34], exposure: 1.0 },
  night: { top: '#222a4c', mid: '#3a4370', hor: '#59608a', fog: '#454c74', near: 20, far: 140, hemi: ['#9fb0e6', '#343a4c', 1.05], sun: ['#b4c4ff', 1.0], sunPos: [-20, 30, 18], exposure: 1.0 },
  morning: { top: '#a3a9b4', mid: '#c4c8cc', hor: '#d3d5d3', fog: '#c6c9c9', near: 8, far: 75, hemi: ['#eef1f4', '#7d8573', 1.7], sun: ['#f3efe6', 0.9], sunPos: [12, 25, 16], exposure: 1.0 },
  inside: { top: '#c4c8cc', mid: '#d3d5d3', hor: '#d9dad8', fog: null, hemi: ['#e6d8c4', '#7a6a5a', 2.3], sun: ['#fff0d6', 3.0], sunPos: [5, 6.5, 9], exposure: 1.1 },
};

export async function setup(ctx) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, ctx.aspect, 0.03, 1500);
  scene.add(camera);
  const L = (n) => ctx.load(`../assets/models/${n}.js`);
  const [exM, houseM, worldM, intM, photoM] = await Promise.all(['explorer', 'house', 'world', 'interior', 'photograph'].map(L));
  for (const [f, file] of [['Cormorant', 'CormorantGaramond-MediumItalic.woff2'], ['Caveat', 'Caveat-SemiBold.woff2']]) {
    try { const ff = new FontFace(f, `url(${ctx.base}../assets/fonts/${file})`); await ff.load(); document.fonts.add(ff); } catch {}
  }
  ctx.renderer.toneMapping = THREE.ACESFilmicToneMapping;

  // ---- Sky + lights ---------------------------------------------------------
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, hor: { value: new THREE.Color() } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top, mid, hor; varying vec3 vP; void main(){ float h = clamp(vP.y, 0.0, 1.0); vec3 c = mix(hor, mid, smoothstep(0.0, 0.12, h)); c = mix(c, top, smoothstep(0.12, 0.6, h)); gl_FragColor = vec4(c, 1.0); }',
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1000, 32, 16), skyMat);
  scene.add(sky);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), new THREE.MeshBasicMaterial({ color: '#f1ecdc', fog: false }));
  moon.position.set(-90, 120, -250);
  scene.add(moon);
  scene.fog = new THREE.Fog('#ffffff', 20, 150);
  const hemi = new THREE.HemisphereLight();
  const sun = new THREE.DirectionalLight();
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 120 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  scene.add(hemi, sun, sun.target);
  const setEnv = (name) => {
    const e = ENV[name];
    skyMat.uniforms.top.value.set(e.top); skyMat.uniforms.mid.value.set(e.mid); skyMat.uniforms.hor.value.set(e.hor);
    if (e.fog) { scene.fog = scene.fog || new THREE.Fog(e.fog, e.near, e.far); scene.fog.color.set(e.fog); scene.fog.near = e.near; scene.fog.far = e.far; } else scene.fog = null;
    hemi.color.set(e.hemi[0]); hemi.groundColor.set(e.hemi[1]); hemi.intensity = e.hemi[2];
    sun.color.set(e.sun[0]); sun.intensity = e.sun[1]; sun.position.set(...e.sunPos);
    ctx.renderer.toneMappingExposure = e.exposure;
    moon.visible = name === 'night';
  };

  // ---- Exterior set ---------------------------------------------------------------
  const ext = new THREE.Group();
  scene.add(ext);
  ext.add(worldM.terrain());
  ext.add(worldM.forest({}));
  const village = worldM.village({});
  ext.add(village);
  const house = houseM.build({});
  ext.add(house);
  const hu = house.userData;
  const winLight = new THREE.PointLight('#ffa64a', 0, 9, 2);
  winLight.position.copy(hu.glowPos).add(V(0, 0, 1.2));
  ext.add(winLight);
  const pole = worldM.deadPole();
  pole.position.set(5.2, 0, 6.2);
  ext.add(pole);
  const mailbox = worldM.mailbox();
  mailbox.position.set(0.75, 0, 11.6);
  mailbox.rotation.y = -0.15;
  ext.add(mailbox);
  ext.add(worldM.fence(V(-5.5, 0, 9.5), V(-1.4, 0, 10.2), 3));
  ext.add(worldM.fence(V(0.6, 0, 10.2), V(4.5, 0, 9.4), 4));
  const dead = worldM.deadTree();
  dead.position.set(-4.4, 0, 2.6);
  ext.add(dead);

  // ---- Interior set ---------------------------------------------------------------
  const room = new THREE.Group();
  scene.add(room);
  const interior = intM.build({});
  room.add(interior);
  const iu = interior.userData;
  // dust motes
  const DM = 500, dPos = new Float32Array(DM * 3), dBase = [];
  const r = rng(7);
  for (let i = 0; i < DM; i++) dBase.push([(r() - 0.5) * 6, r() * 3, (r() - 0.5) * 5, r() * 6.28, 0.3 + r() * 0.7]);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  const sprite = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ map: sprite, size: 0.014, color: '#fff3dc', transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
  room.add(dust);
  const fill = new THREE.PointLight('#ffe2b8', 4, 8, 2);
  fill.position.set(1.8, 1.8, 2.2);
  room.add(fill);
  // light shafts from the boarded window (soft additive slabs)
  const shaftMat = new THREE.MeshBasicMaterial({ color: '#fff0d0', transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.12, 4.2), shaftMat);
    s.position.set(1.6, 1.0 + i * 0.36 - 0.6, 1.4);
    s.rotation.set(-0.62, 0.35, 0);
    room.add(s);
  }

  // ---- Characters + props -----------------------------------------------------------
  const ex = exM.build({});
  scene.add(ex);
  const torchLight = new THREE.SpotLight('#fff1d0', 0, 9, 0.42, 0.55, 1.6);
  torchLight.castShadow = true;
  torchLight.shadow.mapSize.set(1024, 1024);
  scene.add(torchLight, torchLight.target);
  const photoRT = new THREE.WebGLRenderTarget(420, 520);
  const photo = photoM.build({ image: photoRT.texture, date: 'November 17|1976', font: 'Caveat' });
  scene.add(photo);

  // ---- Render the photograph's image: the explorer in front of this house ---------------
  {
    setEnv('dusk');
    room.visible = false; ext.visible = true; photo.visible = false;
    ex.position.set(-0.47, 0, 8.6); ex.rotation.y = 0;
    exM.pose(ex, { mouth: 'neutral', gaze: [0, 0] });
    const pc = new THREE.PerspectiveCamera(40, 420 / 520, 0.1, 400);
    pc.position.set(-0.3, 1.6, 15.5); pc.lookAt(-0.3, 2.7, 0);
    ctx.renderer.setRenderTarget(photoRT);
    ctx.renderer.render(scene, pc);
    ctx.renderer.setRenderTarget(null);
  }

  // ---- Title overlay (persistent, top) ------------------------------------------------
  const tc = document.createElement('canvas'); tc.width = 1080; tc.height = 1920;
  const g2 = tc.getContext('2d');
  const titleTex = new THREE.CanvasTexture(tc); titleTex.colorSpace = THREE.SRGBColorSpace;
  const overlay = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: titleTex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, fog: false, color: '#e6e6e6' }));
  overlay.renderOrder = 999;
  const vh = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  overlay.scale.set(vh * camera.aspect, vh, 1); overlay.position.z = -1;
  camera.add(overlay);
  {
    g2.textAlign = 'center'; g2.textBaseline = 'middle';
    g2.font = '500 96px Cormorant, serif';
    g2.shadowColor = 'rgba(30,25,40,0.5)'; g2.shadowBlur = 18; g2.shadowOffsetY = 4;
    const a = 'Nobody had entered it for ', b = 'fifty';
    const wa = g2.measureText(a).width, wb = g2.measureText(b).width;
    g2.fillStyle = '#fbf6ee'; g2.fillText(a, 540 - wb / 2, 300);
    g2.fillStyle = '#e9c27a'; g2.fillText(b, 540 + wa / 2, 300);
    g2.fillStyle = '#e9c27a'; g2.fillText('years', 540, 405);
    titleTex.needsUpdate = true;
  }

  const composer = bloomComposer(ctx, scene, camera, { strength: 0.4, radius: 0.5, threshold: 0.88 });
  const look = (pos, tgt) => { camera.position.copy(pos); camera.lookAt(tgt); };
  const m4 = new THREE.Matrix4();

  // Walking helper along a straight line (y follows porch height near the door)
  const walk = (a, b, t0, t1, t) => {
    const k = span(t, t0, t1), e = k;   // constant pace
    const p = vl(a, b, e);
    ex.position.copy(p);
    ex.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
    return { phase: (a.distanceTo(b) * e / 0.62) * Math.PI, amount: k > 0 && k < 1 ? 1 : 0 };
  };
  const porchY = (z) => (z < 4.0 ? 0.35 : z < 4.6 ? (4.6 - z) / 0.6 * 0.35 : 0);

  function update(t) {
    // defaults
    ext.visible = true; room.visible = false; photo.visible = false;
    torchLight.intensity = 0; winLight.intensity = 0;
    hu.glowMat.emissiveIntensity = 0;
    village.userData.windowMat.emissiveIntensity = 0;
    hu.door.rotation.y = 0;
    ex.visible = false;
    overlay.material.opacity = ease(span(t, 0.3, 1.5));

    // ---------------------------------------------------------------- S1 aerial (dusk)
    if (t < 12.5) {
      setEnv('dusk');
      village.userData.windowMat.emissiveIntensity = 0.5;
      hu.glowMat.emissiveIntensity = 0.15;
      const k = easeInOut(span(t, 0, 12.5));
      look(vl(V(110, 48, 120), V(9, 7.5, 24), k), vl(V(42, 0, 14), V(-0.5, 3.0, 0), ease(span(t, 0, 11))));
    }
    // ---------------------------------------------------------------- S2 window lights (night)
    else if (t < 20) {
      setEnv('night');
      village.userData.windowMat.emissiveIntensity = 1.4;
      const on = t < 13.6 ? 0 : t < 13.75 ? 1 : t < 13.95 ? 0.15 : t < 14.05 ? 1 : 1;
      const flick = 0.92 + 0.08 * Math.sin(t * 17) * Math.sin(t * 5.3);
      hu.glowMat.emissiveIntensity = 2.4 * on * flick;
      winLight.intensity = 4 * on * flick;
      const k = easeInOut(span(t, 12.5, 20));
      look(vl(V(-4.2, 0.55, 15.5), V(-2.9, 1.5, 11.0), k), vl(V(-1.2, 3.2, 0), V(-1.6, 4.2, 2.3), k));
    }
    // ---------------------------------------------------------------- S3 no connection (night)
    else if (t < 31) {
      setEnv('night');
      village.userData.windowMat.emissiveIntensity = 1.4;
      hu.glowMat.emissiveIntensity = 2.2;
      winLight.intensity = 3.6;
      if (t < 24.6) {                       // dead pole, cut wires
        const k = easeInOut(span(t, 20, 24.6));
        look(vl(V(9.5, 1.3, 13.5), V(8.8, 1.6, 12.6), k), vl(V(4.6, 4.6, 5.8), V(4.2, 4.2, 5.4), k));
      } else if (t < 26.1) {                // blank mailbox
        const k = easeInOut(span(t, 24.6, 26.1));
        hemi.intensity = 0.95;
        look(vl(V(2.5, 1.55, 14.6), V(2.2, 1.5, 14.0), k), V(0.75, 1.15, 11.6));
      } else {                              // wide: house alone at the forest edge, village far away
        const k = easeInOut(span(t, 26.1, 31));
        look(vl(V(-14, 13, 30), V(-10, 10.5, 26), k), vl(V(6, 1.5, 4), V(4, 1.8, 3), k));
      }
    }
    // ---------------------------------------------------------------- S4 the explorer (morning)
    else if (t < 38) {
      setEnv('morning');
      ex.visible = true;
      if (t < 34.6) {
        const w = walk(V(-0.47, 0, 15.5), V(-0.47, 0, 6.6), 31, 34.6, t);
        exM.pose(ex, { walk: w.phase, walkAmount: w.amount, look: [0, 0.18], mouth: 'neutral' });
        const p = ex.position;
        look(V(p.x + 1.5, 2.0, p.z + 4.2), V(p.x - 0.1, 1.55, p.z - 2.5));
      } else {
        const w = walk(V(-0.47, 0, 6.6), V(-0.47, 0, 3.05), 34.6, 36.4, t);
        ex.position.y = porchY(ex.position.z);
        const push = ease(span(t, 36.2, 36.9));
        exM.pose(ex, { walk: w.phase, walkAmount: w.amount, push, look: [0, 0.05], mouth: 'neutral', brows: push * 0.5 });
        hu.door.rotation.y = -1.25 * easeInOut(span(t, 36.5, 37.9));     // swings inward
        const k = easeInOut(span(t, 34.6, 38));
        look(vl(V(2.3, 1.55, 3.5), V(2.0, 1.5, 3.3), k), vl(V(-0.3, 1.35, 3.0), V(-0.6, 1.3, 2.5), k));
      }
    }
    // ---------------------------------------------------------------- S5 inside
    else if (t < 47) {
      setEnv('inside');
      ext.visible = false; room.visible = true; ex.visible = true;
      iu.door.rotation.y = -1.25;
      photo.visible = true;
      photo.position.copy(iu.tableTop).add(V(-0.12, 0.001, 0.3));
      photo.rotation.set(-Math.PI / 2, 0, 0.35);
      if (t < 42.5) {
        const w = walk(V(-0.47, 0, 3.6), V(-0.08, 0, 1.12), 38.2, 41.6, t);
        exM.pose(ex, { walk: w.phase, walkAmount: w.amount, aim: 0.85, torchOn: true, look: [0.25 * Math.sin(t * 0.8), 0.1], mouth: 'neutral' });
        const k = easeInOut(span(t, 38, 42.5));
        look(vl(V(1.9, 2.3, -1.6), V(1.5, 2.0, -1.1), k), vl(V(-0.45, 1.3, 2.8), V(-0.3, 1.1, 1.6), k));
      } else {
        ex.position.set(-0.08, 0, 1.12); ex.rotation.y = Math.atan2(0.38, -0.92);
        exM.pose(ex, { aim: 0.85, torchOn: true, look: [0, -0.35], mouth: 'neutral', gaze: [0, -0.6] });
        const k = easeInOut(span(t, 42.5, 47));
        look(vl(V(1.9, 1.6, 2.0), V(1.0, 1.15, 0.95), k), iu.tableTop.clone().add(V(-0.1, 0.05, 0.03)));
      }
      torchLight.intensity = 6;
    }
    // ---------------------------------------------------------------- S6 the photograph
    else {
      setEnv('inside');
      ext.visible = false; room.visible = true; ex.visible = true; photo.visible = true;
      iu.door.rotation.y = -1.25;
      ex.position.set(-0.08, 0, 1.12); ex.rotation.y = Math.atan2(0.38, -0.92);
      torchLight.intensity = 5;
      const lift = ease(span(t, 47.2, 48.6));
      const hold = ease(span(t, 48.2, 49.0));
      exM.pose(ex, { reach: (1 - hold) * (Math.sin(Math.min(1, lift * 1.6) * Math.PI / 2) * 1.25), hold, aim: 0, torchOn: false,
        look: [0, -0.35 + hold * 0.2], gaze: [0, -0.5], mouth: t > 57 ? 'open' : 'neutral', brows: t > 54.2 ? 1 : 0.2 });
      torchLight.intensity = 5;
      // photo path: table -> hand -> held in front of his face
      ex.updateMatrixWorld(true);
      const fwd = V(0, 0, 1).applyQuaternion(ex.quaternion);
      const heldPos = ex.position.clone().add(fwd.clone().multiplyScalar(0.42)).add(V(0, 1.42, 0));
      const tablePos = iu.tableTop.clone().add(V(-0.12, 0.001, 0.3));
      photo.position.copy(vl(tablePos, heldPos, ease(span(t, 47.7, 48.9))));
      const faceQ = new THREE.Quaternion().setFromRotationMatrix(m4.lookAt(heldPos, ex.position.clone().add(V(0, 1.58, 0)), V(0, 1, 0)));
      const flatQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0.35));
      // facing the camera side: the image faces away from him (toward us), he sees... we show the image
      const outQ = faceQ.clone().multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), Math.PI));
      const flip = easeInOut(span(t, 54.0, 54.7));
      const showQ = outQ.clone().multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), Math.PI * flip));
      photo.quaternion.copy(flatQ).slerp(showQ, ease(span(t, 48.6, 49.3)));
      const pn = V(0, 0, 1).applyQuaternion(outQ);       // image normal (toward the viewer)
      if (t < 48.6) {                      // close-up: hand lifts the photo off the table
        const k = easeInOut(span(t, 47, 48.6));
        look(vl(V(1.25, 1.25, -0.35), V(1.1, 1.4, -0.2), k), vl(tablePos.clone().add(V(-0.1, 0.1, 0.2)), heldPos.clone().add(V(0, -0.1, 0)), k));
      } else if (t < 57.0) {               // the photograph fills the frame (then flips to the date)
        const k = easeInOut(span(t, 48.6, 57));
        look(photo.position.clone().add(pn.clone().multiplyScalar(lerp(0.36, 0.26, k))).add(V(0, 0.005, 0)), photo.position);
      } else {                              // his face: shock
        const k = easeInOut(span(t, 57, 60));
        const facePos = ex.position.clone().add(V(0, 1.62, 0));
        look(facePos.clone().add(fwd.clone().multiplyScalar(lerp(2.1, 1.6, k))).add(V(0.2, 0.05, 0)), facePos.clone().add(V(0, 0.02, 0)));
      }
    }

    // dust motes drift
    if (room.visible) {
      for (let i = 0; i < DM; i++) {
        const [x, y, z, ph, s] = dBase[i];
        dPos[i * 3] = x + Math.sin(t * 0.2 * s + ph) * 0.2;
        dPos[i * 3 + 1] = (y + t * 0.04 * s) % 3.0;
        dPos[i * 3 + 2] = z + Math.cos(t * 0.17 * s + ph) * 0.2;
      }
      dGeo.attributes.position.needsUpdate = true;
      sun.target.position.set(0, 0, 0);
    }
    // flashlight follows the torch
    if (ex.visible && ex.userData.torch) {
      ex.updateMatrixWorld(true);
      const tp = ex.userData.torch.getWorldPosition(V(0, 0, 0));
      const dir = V(0, 1, 0).applyQuaternion(ex.userData.torch.getWorldQuaternion(new THREE.Quaternion()));
      torchLight.position.copy(tp);
      torchLight.target.position.copy(tp.clone().add(dir.multiplyScalar(3)));
      if (t >= 42.5 && t < 47) torchLight.target.position.copy(iu.tableTop);
      if (t >= 47) torchLight.target.position.copy(iu.tableTop);
    }
  }

  return { scene, camera, composer, duration: 60, update };
}
