// THE STAR IN THE GARDEN — 60s, 9:16.
// Two sets share the origin and are swapped per shot: the garden exterior and Leo's bedroom.
import * as THREE from 'three';
import { bloomComposer } from 'engine/post.js';
import { rng, clamp, lerp, ease, easeInOut, span } from 'engine/lowpoly.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const vlerp = (a, b, k) => a.clone().lerp(b, k);

// ---- Layout (world units, Leo ≈ 1.25 tall) --------------------------------
const L1 = V(1.1, 0, 0.6);          // Leo plays here (scene 1)
const POT = V(-1.4, 0, 1.8);        // flower pot
const STAR = V(-1.8, 0.07, 2.05);   // star lying in the grass, behind the pot
const L2 = V(-1.48, 0, 2.5);        // Leo stands here to pick it up
const DOOR = V(-0.45, 0, -4.2);
const HOUSE_Z = -5.1;

export async function setup(ctx) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, ctx.aspect, 0.05, 400);
  scene.add(camera);
  const r = rng(42);

  const M = async (name) => ctx.load(`assets/models/${name}.js`);
  const [leoM, houseM, hillsM, gardenM, starM, jarM, forestM, bedroomM] = await Promise.all(
    ['leo', 'house', 'hills', 'garden', 'star', 'jar', 'forest', 'bedroom'].map(M));
  const lightMod = await ctx.load('lighting/main.js');
  const light = lightMod.apply(scene, ctx);

  // ---- Sky: gradient dome + stars + moon ---------------------------------
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 horizon; varying vec3 vP; void main(){ float h = clamp(vP.y*1.6+0.05,0.0,1.0); gl_FragColor = vec4(mix(horizon, top, pow(h,0.7)),1.0); }',
  });
  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(200, 24, 12), skyMat);
  skyDome.renderOrder = -1;
  scene.add(skyDome);
  const starPts = [];
  for (let i = 0; i < 500; i++) {
    const a = r() * Math.PI * 2, y = 0.12 + r() * 0.88, rr = Math.sqrt(1 - y * y);
    starPts.push(Math.cos(a) * rr * 190, y * 190, Math.sin(a) * rr * 190);
  }
  const starsGeo = new THREE.BufferGeometry();
  starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPts, 3));
  const nightStars = new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, transparent: true, fog: false }));
  scene.add(nightStars);
  const moon = new THREE.Mesh(new THREE.IcosahedronGeometry(6, 2), new THREE.MeshBasicMaterial({ color: '#fff3d6', fog: false }));
  moon.position.set(-45, 70, -150);
  scene.add(moon);

  // ---- Shared terrain ------------------------------------------------------
  const hills = hillsM.build({ flat: 8 });
  scene.add(hills);

  // ---- EXTERIOR set --------------------------------------------------------
  const ext = new THREE.Group();
  scene.add(ext);
  const garden = gardenM.build({ potAt: [POT.x, 0, POT.z] });
  ext.add(garden);
  const house = houseM.build({ glowIntensity: 1.4 });
  house.position.set(0, 0, HOUSE_Z);
  ext.add(house);
  const windowLights = [V(0.45, 0.9, HOUSE_Z + 1.3), V(1.6, 0.9, HOUSE_Z + 0.2)].map((p) => {
    const l = new THREE.PointLight('#ffa64d', 1.5, 6, 2);
    l.position.copy(p);
    ext.add(l);
    return l;
  });
  // Village on the hills
  const villageSpots = [[-9, -15, 0.8], [-16, -9, 0.7], [11, -13, 0.85], [18, -21, 0.75], [-5, -25, 0.7],
    [7, -29, 0.65], [-22, -21, 0.7], [25, -10, 0.7], [-13, -32, 0.6], [15, -36, 0.6]];
  const villageColors = [['#f6d9a8', '#5a7fc4'], ['#f2c6c2', '#b8483a'], ['#e8f0d0', '#8a5a9e'], ['#fbe7b0', '#3f8f7a'], ['#d9e6f5', '#c96f3d']];
  villageSpots.forEach(([x, z, s], i) => {
    const [wall, roof] = villageColors[i % villageColors.length];
    const h = houseM.build({ wall, roof, glowIntensity: 1.8 });
    h.scale.setScalar(s);
    h.position.set(x, hillsM.heightAt(x, z, 8) - 0.05, z);
    h.rotation.y = Math.atan2(-x, -z) + Math.PI + (r() - 0.5) * 0.6;
    ext.add(h);
  });
  const farForest = forestM.build({ count: 160, area: [-60, 60, -75, -40], seed: 5, heightFn: (x, z) => hillsM.heightAt(x, z, 8) });
  const sideForest = forestM.build({ count: 60, area: [-45, -22, -35, 10], seed: 6, heightFn: (x, z) => hillsM.heightAt(x, z, 8) });
  const sideForest2 = forestM.build({ count: 60, area: [22, 45, -35, 10], seed: 7, heightFn: (x, z) => hillsM.heightAt(x, z, 8) });
  ext.add(farForest, sideForest, sideForest2);

  // Leo (day clothes) + his pebble collection
  const leo = leoM.build({ outfit: 'day' });
  ext.add(leo);
  const pebbleColors = ['#7fd0ff', '#ff8fb0', '#ffe066', '#a3e48a', '#c7a2ff'];
  const pebbles = pebbleColors.map((c, i) => {
    const p = new THREE.Mesh(new THREE.DodecahedronGeometry(0.045, 0),
      new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.3, metalness: 0.1 }));
    p.position.set(L1.x - 0.24 + i * 0.12, 0.035, L1.z + 0.42 + (i % 2) * 0.05);
    p.castShadow = true;
    ext.add(p);
    return p;
  });
  const heldPebble = pebbles[0];

  // Fireflies (scene 3)
  const FF = 46;
  const fireflies = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.022, 0),
    new THREE.MeshStandardMaterial({ color: '#f4ff9a', emissive: '#e6ff6a', emissiveIntensity: 2.2 }), FF);
  const ffSeed = Array.from({ length: FF }, () => [r(), r(), r(), r()]);
  ext.add(fireflies);

  // ---- BEDROOM set ----------------------------------------------------------
  const room = new THREE.Group();
  scene.add(room);
  const bedroom = bedroomM.build();
  room.add(bedroom);
  const bu = bedroom.userData;
  const lampLight = new THREE.PointLight('#ffb866', 1.0, 5, 2);
  lampLight.position.copy(bu.lampPos).add(V(0, -0.02, 0.1));
  room.add(lampLight);
  const leoBed = leoM.build({ outfit: 'pyjama' });
  room.add(leoBed);
  const blanket = bu.bed.getObjectByName('blanket');
  const nearForest = forestM.build({ count: 120, area: [-22, 22, -34, -12], seed: 9, heightFn: (x, z) => hillsM.heightAt(x, z, 8), dark: true });
  room.add(nearForest);
  // Hundreds of glowing lights waiting in the forest
  const FL = 360;
  const forestLights = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.11, 0),
    new THREE.MeshStandardMaterial({ color: '#ffe9a0', emissive: '#ffd36a', emissiveIntensity: 2.4 }), FL);
  const flData = [];
  const flCol = new THREE.Color();
  for (let i = 0; i < FL; i++) {
    const z = -11 - r() * 20, x = 0.3 + (r() - 0.5) * (Math.abs(z) * 0.55);
    const y = hillsM.heightAt(x, z, 8) + 0.3 + r() * 3.6;
    flData.push({ p: V(x, y, z), delay: r() * 1.4, ph: r() * 6.28, sp: 0.6 + r() * 1.4 });
    flCol.set(r() < 0.75 ? '#ffd36a' : '#9fe8ff');
    forestLights.setColorAt(i, flCol);
  }
  room.add(forestLights);

  // ---- The star, jar and star particles -----------------------------------
  const star = starM.build({ size: 0.09 });
  scene.add(star);
  const starLight = new THREE.PointLight('#ffcf4a', 0, 3, 2);
  star.add(starLight);
  const jar = jarM.build();
  scene.add(jar);
  const SP = 40;
  const sparks = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(0.02, 0),
    new THREE.MeshStandardMaterial({ color: '#ffe08a', emissive: '#ffc94a', emissiveIntensity: 2.4 }), SP);
  const spSeed = Array.from({ length: SP }, () => [r(), r(), r()]);
  scene.add(sparks);

  // ---- End title -------------------------------------------------------------
  try {
    const ff = new FontFace('Fredoka', `url(${ctx.base}assets/fonts/Fredoka-SemiBold.woff2)`);
    await ff.load(); document.fonts.add(ff);
  } catch {}
  const tc = document.createElement('canvas');
  tc.width = 1024; tc.height = 512;
  const g2 = tc.getContext('2d');
  const bg = g2.createRadialGradient(512, 265, 20, 512, 265, 480);
  bg.addColorStop(0, 'rgba(5,8,20,0.6)'); bg.addColorStop(1, 'rgba(5,8,20,0)');
  g2.save(); g2.scale(1, 0.42); g2.fillStyle = bg; g2.fillRect(0, 0, 1024, 1220); g2.restore();
  g2.textAlign = 'center';
  g2.font = '600 92px Fredoka, Inter, sans-serif';
  g2.shadowColor = 'rgba(255,200,90,0.9)';
  g2.shadowBlur = 36;
  g2.fillStyle = '#fff6df';
  g2.fillText('WHERE WERE THEY', 512, 210);
  g2.fillText('TAKING HIM?', 512, 320);
  g2.shadowBlur = 0;
  g2.fillText('WHERE WERE THEY', 512, 210);
  g2.fillText('TAKING HIM?', 512, 320);
  const titleTex = new THREE.CanvasTexture(tc);
  titleTex.colorSpace = THREE.SRGBColorSpace;
  const title = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.5),
    new THREE.MeshBasicMaterial({ map: titleTex, color: '#c8c8c8', transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false }));
  title.renderOrder = 999;
  const tz = -1;
  const visW = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * Math.abs(tz) * camera.aspect;
  title.scale.setScalar(visW * 0.92);
  title.position.set(0, -0.2, tz);
  camera.add(title);

  // ---- Bloom ----------------------------------------------------------------
  const composer = bloomComposer(ctx, scene, camera, { strength: 0.45, radius: 0.4, threshold: 0.92 });

  // ---- Helpers ----------------------------------------------------------------
  const tmp = V(0, 0, 0), tmp2 = V(0, 0, 0);
  const lookAt = (pos, target) => { camera.position.copy(pos); camera.lookAt(target); };
  const face = (obj, dx, dz) => { obj.rotation.y = Math.atan2(dx, dz); };
  const handsMid = (who) => {
    who.updateMatrixWorld(true);
    who.userData.arms.L.userData.hand.getWorldPosition(tmp);
    who.userData.arms.R.userData.hand.getWorldPosition(tmp2);
    return tmp.clone().add(tmp2).multiplyScalar(0.5);
  };
  const handL = (who) => { who.updateMatrixWorld(true); return who.userData.arms.L.userData.hand.getWorldPosition(V(0, 0, 0)); };
  const colorKeys = (keys, t) => {
    let top = new THREE.Color(keys[0][1]), hor = new THREE.Color(keys[0][2]);
    for (let i = 1; i < keys.length; i++) {
      const [s, tp, hz, fade = 1] = keys[i];
      if (t < s) break;
      const k = fade > 0 ? ease((t - s) / fade) : 1;
      top.lerp(new THREE.Color(tp), k); hor.lerp(new THREE.Color(hz), k);
    }
    return [top, hor];
  };
  const walkTo = (who, a, b, t0, t1, t) => {
    const k = span(t, t0, t1);
    const e = easeInOut(k);
    const pos = vlerp(a, b, e);
    who.position.copy(pos);
    face(who, b.x - a.x, b.z - a.z);
    const dist = a.distanceTo(b) * e;
    return { phase: (dist / 0.5) * Math.PI, amount: k > 0 && k < 1 ? clamp(Math.min(k, 1 - k) * 8) : 0 };
  };
  // Star path at midnight (scene 5)
  const jarSpot = bu.jarSpot.clone();
  const H1 = V(-0.3, 1.3, -1.45), H2 = V(-1.15, 1.2, -1.3), WIN = V(0.7, 1.6, -2.0), OUT = V(0.6, 1.9, -4.5), FAR = V(0.2, 3.0, -16);
  const starNight = (t) => {
    if (t < 48.4) return jarSpot.clone().add(V(0, 0.085, 0));
    if (t < 50.5) return vlerp(jarSpot.clone().add(V(0, 0.085, 0)), H1, easeInOut(span(t, 48.4, 50.5)));
    if (t < 53.0) return vlerp(H1, H2, easeInOut(span(t, 50.5, 53.0)));
    if (t < 55.6) return vlerp(H2, WIN, easeInOut(span(t, 53.0, 55.6)));
    if (t < 56.2) return vlerp(WIN, OUT, span(t, 55.6, 56.2));
    return vlerp(OUT, FAR, ease(span(t, 56.2, 60)));
  };

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = V(1, 1, 1);

  function update(t) {
    light.update(t);
    const [top, hor] = colorKeys(lightMod.sky, t);
    skyMat.uniforms.top.value.copy(top);
    skyMat.uniforms.horizon.value.copy(hor);
    if (scene.fog) scene.fog.color.copy(hor);
    nightStars.material.opacity = t < 10 ? 0.25 : t < 45 ? 0.6 : 1;

    const inRoom = t >= 38;
    ext.visible = !inRoom;
    room.visible = inRoom;
    for (const wl of windowLights) wl.intensity = t < 20 ? 1.5 : 1.0;
    title.visible = false;
    sparks.visible = false;
    jar.visible = false;
    star.scale.setScalar(1);
    star.rotation.set(0, 0, 0);

    // Flowers glow outward from the star once Leo touches it
    for (const f of garden.userData.flowers) {
      const d = Math.hypot(f.node.position.x - STAR.x, f.node.position.z - STAR.z);
      const k = ease(span(t, 21.3 + d * 0.55, 22.1 + d * 0.55));
      const tw = 0.85 + 0.15 * Math.sin(t * 3 + d * 5);
      f.petalMat.emissiveIntensity = k * 0.7 * tw;
      f.centreMat.emissiveIntensity = k * 1.3 * tw;
    }

    // Fireflies
    const ffOn = ease(span(t, 22.5, 24.5)) * (1 - span(t, 37, 38));
    fireflies.visible = ffOn > 0.01;
    if (fireflies.visible) {
      const c = V(L2.x, 0.9, L2.z);
      ffSeed.forEach(([a, b, c2, d], i) => {
        const ang = a * 6.28 + t * (0.25 + b * 0.5) * (i % 2 ? 1 : -1);
        const rad = 0.5 + c2 * 1.8;
        const y = 0.25 + d * 1.7 + Math.sin(t * 1.3 + i) * 0.15;
        const blink = 0.55 + 0.45 * Math.sin(t * (2 + b * 3) + i * 1.7);
        sc.setScalar(ffOn * blink + 0.001);
        m4.compose(V(c.x + Math.cos(ang) * rad, y, c.z + Math.sin(ang) * rad), q, sc);
        fireflies.setMatrixAt(i, m4);
      });
      fireflies.instanceMatrix.needsUpdate = true;
    }

    // ------------------------------------------------------------------ SCENE 1
    if (t < 10) {
      leo.position.copy(L1);
      face(leo, -0.15, 1);
      const crouch = 1 - ease(span(t, 4.6, 5.8));
      leoM.pose(leo, { crouch: crouch * 0.85, reachDown: crouch * 0.7, reach: (1 - crouch) * 0.55,
        look: [t > 8.6 ? -0.9 * ease(span(t, 8.6, 9.6)) : 0, crouch > 0.5 ? -0.35 : 0.25 * (1 - ease(span(t, 8.6, 9.6)))],
        smile: 0.8 });
      // pebble: picked up at ~4.8, held up to admire
      if (t > 4.8) { heldPebble.position.copy(handsMid(leo)).add(V(0, 0.06, 0.02)); heldPebble.rotation.y = t; }
      else heldPebble.position.set(L1.x - 0.24, 0.035, L1.z + 0.42);
      star.position.copy(STAR);
      starLight.intensity = 0;
      star.userData.glowMat.emissiveIntensity = 1.6;
      const k = easeInOut(span(t, 0, 10));
      const k2 = ease(span(t, 0, 10));
      lookAt(vlerp(V(-2.5, 6.5, 17), V(2.4, 1.35, 4.2), k), vlerp(V(0, 0.8, -3), V(1.05, 0.62, 0.7), k2));
    }

    // ------------------------------------------------------------------ SCENE 2
    else if (t < 20) {
      heldPebble.visible = false;
      // glimmer behind the pot
      const glimmer = 0.6 + 0.4 * Math.sin(t * 5.3) * Math.sin(t * 2.1);
      starLight.intensity = 0.15 + glimmer * 0.2;
      star.position.copy(STAR);
      star.rotation.set(-1.35, 0, 0.3);         // lying in the grass
      star.userData.glowMat.emissiveIntensity = 0.8 + glimmer * 0.3 - ease(span(t, 17.8, 20)) * 0.25;
      let w = { phase: 0, amount: 0 };
      if (t < 12) {
        leo.position.copy(L1);
        const turn = ease(span(t, 10, 11.6));
        const dir = vlerp(V(-0.15, 0, 1), V(L2.x - L1.x, 0, L2.z - L1.z).normalize(), turn);
        face(leo, dir.x, dir.z);
      } else if (t < 16.5) {
        w = walkTo(leo, L1, L2, 12, 16.5, t);
      } else {
        leo.position.copy(L2);
        const turn = ease(span(t, 16.5, 17.5));
        const a0 = V(L2.x - L1.x, 0, L2.z - L1.z).normalize(), a1 = V(STAR.x - L2.x, 0, STAR.z - L2.z).normalize();
        const dir = vlerp(a0, a1, turn);
        face(leo, dir.x, dir.z);
      }
      leoM.pose(leo, { walk: w.phase, walkAmount: w.amount, crouch: ease(span(t, 17.5, 19.5)) * 0.25,
        look: [0, -0.15 - ease(span(t, 17.2, 18.5)) * 0.35], smile: 0.4 });
      // Over-the-shoulder camera: behind Leo looking at the pot, follows his walk,
      // then swings behind him as he turns and slowly zooms to the star.
      leo.updateMatrixWorld(true);
      const d1 = V(L2.x - L1.x, 0, L2.z - L1.z).normalize();          // walking direction
      const s1 = V(d1.z, 0, -d1.x);                                   // its right side
      const f2 = V(STAR.x - L2.x, 0, STAR.z - L2.z).normalize();      // facing the star
      const s2 = V(f2.z, 0, -f2.x);
      const follow = (p) => p.clone().add(d1.clone().multiplyScalar(-2.3)).add(s1.clone().multiplyScalar(0.7)).add(V(0, 1.75, 0));
      if (t < 16.5) {
        const camPos = follow(leo.position);
        const aim = leo.position.clone().add(d1.clone().multiplyScalar(2.4)).add(V(0, 0.45, 0));
        lookAt(camPos, vlerp(aim, POT.clone().add(V(0, 0.3, 0)), t < 12 ? 1 : 0.4));
      } else {
        const behind = L2.clone().add(f2.clone().multiplyScalar(-1.9)).add(s2.clone().multiplyScalar(0.75)).add(V(0, 1.6, 0));
        const close = STAR.clone().add(f2.clone().multiplyScalar(-0.2)).add(s2.clone().multiplyScalar(0.9)).add(V(0, 0.55, 0));
        const swing = easeInOut(span(t, 16.5, 17.8));
        const zoom = easeInOut(span(t, 17.8, 20));
        const pos = vlerp(vlerp(follow(L2), behind, swing), close, zoom * 0.75);
        const aim = vlerp(vlerp(POT.clone().add(V(0, 0.3, 0)), STAR.clone().add(V(0, 0.15, 0)), swing), STAR, zoom);
        lookAt(pos, aim);
      }
    }

    // ------------------------------------------------------------------ SCENE 3
    else if (t < 32) {
      heldPebble.visible = false;
      leo.position.copy(L2);
      const toStar = V(STAR.x - L2.x, 0, STAR.z - L2.z).normalize();
      face(leo, toStar.x, toStar.z);
      const down = 1 - ease(span(t, 22.4, 24.0));
      const crouchIn = ease(span(t, 20, 21.0));
      const c = crouchIn * down;
      leoM.pose(leo, { crouch: c * 0.9, reachDown: c * 0.9, reach: 0.75 * (1 - c * 0.6),
        look: [Math.sin(t * 0.8) * 0.12 * (t > 25 ? 1 : 0), -0.45 + (1 - down) * 0.05], smile: 0.6 + ease(span(t, 21.2, 23)) * 0.4 });
      // star rises into his hands
      const lift = ease(span(t, 21.0, 22.4));
      const hands = handsMid(leo).add(V(0, 0.09, 0)).add(toStar.clone().multiplyScalar(0.05));
      star.position.copy(vlerp(STAR, hands, lift));
      star.rotation.set(-1.35 * (1 - lift), t * 0.6 * lift, 0.3 * (1 - lift));
      const glow = ease(span(t, 21.0, 22.5));
      star.userData.glowMat.emissiveIntensity = 1.0 + glow * 0.5 + Math.sin(t * 4) * 0.1;
      starLight.intensity = 0.12 + glow * 0.3;
      starLight.distance = 4;
      if (t < 25) {
        // Close-up of his hands from the other side of the star
        const camPos = STAR.clone().add(toStar.clone().multiplyScalar(1.15)).add(V(0.3, 0.45, 0)).add(V(0, lift * 0.5, 0));
        lookAt(vlerp(camPos, camPos.clone().add(V(0, 0.25, 0)), ease(span(t, 22.5, 25))), vlerp(STAR.clone().add(V(0, 0.08, 0)), hands, lift));
      } else {
        // Orbit around Leo
        const o = easeInOut(span(t, 25, 32));
        const a0 = Math.atan2(toStar.x, toStar.z);
        const ang = a0 + 0.6 + o * 3.4;
        const rad = lerp(2.6, 3.1, o);
        const pos = V(L2.x + Math.sin(ang) * rad, lerp(0.9, 1.45, o), L2.z + Math.cos(ang) * rad);
        lookAt(pos, V(L2.x, 0.82, L2.z));
      }
    }

    // ------------------------------------------------------------------ SCENE 4a (garden)
    else if (t < 38) {
      heldPebble.visible = false;
      jar.visible = true;
      let w = { phase: 0, amount: 0 };
      const toStar = V(STAR.x - L2.x, 0, STAR.z - L2.z).normalize();
      if (t < 34.9) {
        leo.position.copy(L2);
        const turn = ease(span(t, 34.2, 34.9));
        const toDoor = V(DOOR.x - L2.x, 0, DOOR.z - L2.z).normalize();
        const dir = vlerp(toStar, toDoor, turn);
        face(leo, dir.x, dir.z);
      } else {
        const end = vlerp(L2, DOOR, 0.62);
        w = walkTo(leo, L2, end, 34.9, 38.6, t);
      }
      leoM.pose(leo, { walk: w.phase, walkAmount: w.amount, reach: 0.72, look: [0, -0.35], smile: 1 });
      const hands = handsMid(leo);
      if (t < 34.6) {
        // jar in left hand, star lowered in from the right
        jar.position.copy(handL(leo)).add(V(0, -0.03, 0));
        const into = easeInOut(span(t, 32.6, 34.2));
        const above = hands.clone().add(V(0, 0.12, 0));
        star.position.copy(vlerp(above, jar.position.clone().add(V(0, 0.085, 0)), into));
        star.scale.setScalar(lerp(1, 0.7, into));
        jar.userData.lid.position.y = jar.userData.height + 0.025 + (1 - ease(span(t, 34.2, 34.6))) * 0.15;
        jar.userData.lid.visible = t > 34.0;
      } else {
        jar.position.copy(hands).add(V(0, -0.09, 0));
        star.position.copy(jar.position).add(V(0, 0.085, 0));
        star.scale.setScalar(0.7);
        jar.userData.lid.position.y = jar.userData.height + 0.025;
        jar.userData.lid.visible = true;
      }
      star.rotation.set(0, t * 0.8, 0);
      star.userData.glowMat.emissiveIntensity = 1.2;
      starLight.intensity = 0.25;
      leo.updateMatrixWorld(true);
      const fwd = V(0, 0, 1).applyQuaternion(leo.quaternion);
      const side = V(fwd.z, 0, -fwd.x);
      if (t < 34.9) {
        const k = ease(span(t, 32, 34.9));
        lookAt(leo.position.clone().add(side.clone().multiplyScalar(1.7)).add(fwd.clone().multiplyScalar(1.1)).add(V(0, lerp(1.15, 1.3, k), 0)),
          hands.clone().add(V(0, 0.12, 0)));
      } else {
        // side tracking
        lookAt(leo.position.clone().add(side.clone().multiplyScalar(-3.1)).add(V(0, 1.1, 0)).add(fwd.clone().multiplyScalar(0.15)),
          leo.position.clone().add(V(0, 0.65, 0)).add(fwd.clone().multiplyScalar(0.15)));
      }
    }

    // ------------------------------------------------------------------ SCENE 4b + 5 (bedroom)
    else {
      jar.visible = true;
      jar.position.copy(jarSpot);
      const night = t >= 45;
      lampLight.intensity = night ? 0 : 1.0;
      bu.lampMat.emissiveIntensity = night ? 0.05 : 1.1;
      // Leo in bed: sitting up (4b) or asleep (5)
      if (!night) {
        leoBed.rotation.set(0, 0, 0);
        leoBed.position.set(-1.3, 0.12, -1.42);
        leoM.pose(leoBed, { reach: 0, look: [0.75 * ease(span(t, 38.3, 39.5)), -0.15], smile: 1, blink: (t > 41.5 && t < 41.65) ? 1 : 0 });
        for (const k of ['L', 'R']) { leoBed.userData.legs[k].rotation.x = -1.5; leoBed.userData.legs[k].userData.shin.rotation.x = 0; }
        leoBed.userData.arms.L.rotation.x = -0.3;
        leoBed.userData.arms.R.rotation.x = -0.3;
        blanket.position.y = 0.56; blanket.scale.y = 1;
      } else {
        leoBed.rotation.set(-Math.PI / 2, 0, 0);
        leoBed.position.set(-1.3, 0.69, -0.42);
        leoM.pose(leoBed, { blink: 1, smile: 0.7, look: [0.25, 0] });
        leoBed.userData.arms.L.rotation.x = 0; leoBed.userData.arms.R.rotation.x = 0;
        blanket.position.y = 0.74; blanket.scale.y = 2.4;
      }
      // star
      if (!night) {
        star.position.copy(jarSpot).add(V(0, 0.085, 0));
        star.scale.setScalar(0.7);
        star.rotation.set(0, t * 0.6, 0);
        star.userData.glowMat.emissiveIntensity = 1.3;
        starLight.intensity = 0.25;
        jar.userData.lid.position.y = jar.userData.height + 0.025;
        jar.userData.lid.rotation.set(0, 0, 0);
        const k = easeInOut(span(t, 38, 45));
        lookAt(vlerp(V(1.5, 1.55, 1.8), V(0.3, 1.3, 0.4), k), vlerp(V(-0.9, 0.75, -1.3), V(-0.95, 0.75, -1.45), k));
      } else {
        star.position.copy(starNight(t));
        const free = span(t, 48.4, 49.2);
        star.scale.setScalar(lerp(0.7, 1, free));
        star.rotation.set(Math.sin(t * 1.3) * 0.3, t * 1.4, Math.sin(t) * 0.2);
        const pulse = 0.5 + 0.5 * Math.sin(t * 3.1);
        star.userData.glowMat.emissiveIntensity = (1.1 + pulse * 0.3 + ease(span(t, 48.2, 48.6)) * 0.4) * (1 - 0.35 * span(t, 53, 54.5)) ;
        starLight.intensity = 0.15 + ease(span(t, 48.2, 49)) * 0.3;
        starLight.distance = 4;
        // lid pops off
        const pop = span(t, 48.2, 48.9);
        jar.userData.lid.position.set(pop * 0.12, jar.userData.height + 0.025 + Math.sin(pop * Math.PI) * 0.18 + (pop >= 1 ? -0.0 : 0), 0);
        jar.userData.lid.rotation.z = pop * 1.3;
        // golden particles trailing the star
        sparks.visible = t > 48.4;
        if (sparks.visible) {
          spSeed.forEach(([a, b, c], i) => {
            const lag = (i / SP) * 1.2;
            const p = starNight(Math.max(48.4, t - lag));
            const life = 1 - i / SP;
            sc.setScalar(life * (0.6 + 0.6 * Math.sin(t * 8 + i)) + 0.001);
            m4.compose(p.add(V((a - 0.5) * 0.25 * (1 - life), (b - 0.5) * 0.25 * (1 - life) - lag * 0.05, (c - 0.5) * 0.25 * (1 - life))), q, sc);
            sparks.setMatrixAt(i, m4);
          });
          sparks.instanceMatrix.needsUpdate = true;
        }
        // cameras
        if (t < 50.5) {
          const k = easeInOut(span(t, 45, 50.5));
          lookAt(vlerp(V(1.7, 1.6, 1.6), V(0.35, 1.05, -0.55), k), vlerp(V(-0.6, 0.75, -1.2), star.position.clone().add(V(0, -0.1, 0)), ease(span(t, 47.5, 50.5))));
        } else if (t < 53.0) {
          const k = ease(span(t, 50.5, 53));
          const face0 = V(-1.3, 0.92, -1.5);
          lookAt(vlerp(V(-0.7, 1.7, -0.75), V(-0.82, 1.55, -0.88), k), face0);
        } else if (t < 56.2) {
          const k = easeInOut(span(t, 53, 56.2));
          lookAt(vlerp(V(1.0, 1.35, 1.2), V(0.9, 1.45, 0.35), k), star.position);
        } else {
          const k = easeInOut(span(t, 56.2, 60));
          lookAt(vlerp(V(0.7, 1.65, -2.5), V(0.55, 3.0, -6.5), k), vlerp(V(0.4, 2.0, -14), V(0.2, 1.6, -22), k));
        }
      }
      // forest lights appear when the star reaches the window
      const fOn = span(t, 55.6, 57.6);
      forestLights.visible = fOn > 0;
      if (forestLights.visible) {
        flData.forEach((d, i) => {
          const k = ease(clamp((fOn * 2 - d.delay) / 0.6));
          const tw = 0.7 + 0.3 * Math.sin(t * d.sp * 3 + d.ph);
          sc.setScalar(k * tw + 0.001);
          m4.compose(d.p.clone().add(V(0, Math.sin(t * d.sp + d.ph) * 0.15, 0)), q, sc);
          forestLights.setMatrixAt(i, m4);
        });
        forestLights.instanceMatrix.needsUpdate = true;
      }
      // end title
      const tk = ease(span(t, 57.0, 58.2));
      title.visible = tk > 0;
      title.material.opacity = tk;
    }
  }

  return { scene, camera, duration: 60, composer, update };
}
