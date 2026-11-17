// Leo: a small low-poly boy (~1.2 units tall) with jointed limbs for animation.
// build() returns the character; pose(leo, p) poses it (see below).
import * as THREE from 'three';
import { flatMat, shadows } from 'engine/lowpoly.js';

export const colors = {
  skin: '#f1c39b', hair: '#5b3a24', shirt: '#e8573f', shorts: '#3d5fa8',
  shoe: '#f4f1ea', sole: '#3a3030', eye: '#1d1a24', cheek: '#f29a8a', pyjama: '#7fb6e6',
};

function limb(r1, r2, len, mat) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, len, 6), mat);
  m.position.y = -len / 2;
  return m;
}

export function build({ outfit = 'day' } = {}) {
  const c = colors;
  const skin = flatMat(c.skin), hair = flatMat(c.hair);
  const shirt = flatMat(outfit === 'pyjama' ? c.pyjama : c.shirt);
  const shorts = flatMat(outfit === 'pyjama' ? c.pyjama : c.shorts);
  const shoe = flatMat(c.shoe), eyeM = flatMat(c.eye, { roughness: 0.3 });

  const leo = new THREE.Group();
  leo.name = 'leo';
  const body = new THREE.Group();            // everything above the feet; bends for crouch
  body.name = 'body';
  leo.add(body);

  // Legs (pivot at hip)
  const legs = {};
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.085, 0.44, 0);
    const thigh = limb(0.07, 0.06, 0.22, shorts);
    const shin = new THREE.Group();
    shin.position.y = -0.22;
    shin.add(limb(0.05, 0.045, 0.18, skin));
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.17), shoe);
    foot.position.set(0, -0.2, 0.03);
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.02, 0.175), flatMat(c.sole));
    sole.position.set(0, -0.235, 0.03);
    shin.add(foot, sole);
    leg.add(thigh, shin);
    leg.userData.shin = shin;
    body.add(leg);
    legs[side < 0 ? 'L' : 'R'] = leg;
  }

  // Torso
  const torso = new THREE.Group();
  torso.name = 'torso';
  torso.position.y = 0.44;
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.36, 7), shirt);
  chest.position.y = 0.18;
  const hipM = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.165, 0.08, 7), shorts);
  hipM.position.y = 0.02;
  torso.add(chest, hipM);
  body.add(torso);

  // Arms (pivot at shoulder, children of torso)
  const arms = {};
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.2, 0.32, 0);
    const upper = limb(0.05, 0.045, 0.16, shirt);
    const fore = new THREE.Group();
    fore.position.y = -0.16;
    fore.add(limb(0.04, 0.035, 0.14, skin));
    const hand = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05, 0), skin);
    hand.position.y = -0.17;
    hand.name = side < 0 ? 'handL' : 'handR';
    fore.add(hand);
    arm.add(upper, fore);
    arm.userData.fore = fore;
    arm.userData.hand = hand;
    arm.rotation.z = side * 0.12;
    torso.add(arm);
    arms[side < 0 ? 'L' : 'R'] = arm;
  }

  // Head
  const head = new THREE.Group();
  head.name = 'head';
  head.position.y = 0.38;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.06, 6), skin);
  neck.position.y = 0.02;
  const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(0.21, 1), skin);
  skull.position.y = 0.22;
  skull.scale.set(1, 0.98, 0.95);
  const hairTop = new THREE.Mesh(new THREE.IcosahedronGeometry(0.225, 1), hair);
  hairTop.position.set(0, 0.27, -0.025);
  hairTop.scale.set(1.0, 0.8, 1.0);
  const fringe = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 0), hair);
  fringe.position.set(0.04, 0.36, 0.11);
  fringe.scale.set(1.35, 0.42, 0.75);
  fringe.rotation.z = -0.25;
  const back = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), hair);
  back.position.set(0, 0.2, -0.07);
  back.scale.set(1.04, 0.85, 0.9);
  head.add(neck, skull, hairTop, fringe, back);

  const eyes = [];
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), eyeM);
    eye.position.set(side * 0.075, 0.22, 0.185);
    eye.scale.set(1, 1.25, 0.6);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
    shine.position.set(0.01, 0.012, 0.02);
    eye.add(shine);
    const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.028, 6), flatMat(c.cheek));
    cheek.position.set(side * 0.12, 0.16, 0.175);
    cheek.rotation.y = side * 0.5;
    head.add(eye, cheek);
    eyes.push(eye);
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.009, 4, 8, Math.PI), eyeM);
  mouth.position.set(0, 0.13, 0.19);
  mouth.rotation.z = Math.PI;
  const ears = [-1, 1].map((s) => {
    const e = new THREE.Mesh(new THREE.IcosahedronGeometry(0.04, 0), skin);
    e.position.set(s * 0.205, 0.21, 0);
    return e;
  });
  head.add(mouth, ...ears);
  torso.add(head);

  leo.userData = { body, torso, head, legs, arms, eyes, mouth };
  return shadows(leo);
}

// Pose helper. All values optional:
//   walk:  phase in radians (advance ~2π per step pair); walkAmount 0..1
//   reach: 0..1 both arms forward (holding things), reachDown: 0..1 arms reach to ground
//   crouch: 0..1 bend down, look: [yaw, pitch] of head, blink: 0..1 eyes closed
//   smile: 0..1 bigger smile
export function pose(leo, p = {}) {
  const u = leo.userData;
  const walk = p.walk ?? 0, wa = p.walkAmount ?? 0;
  const crouch = p.crouch ?? 0, reach = p.reach ?? 0, down = p.reachDown ?? 0;
  const sw = Math.sin(walk) * 0.55 * wa;

  u.legs.L.rotation.x = sw - crouch * 1.3;
  u.legs.R.rotation.x = -sw - crouch * 1.3;
  u.legs.L.userData.shin.rotation.x = Math.max(0, -Math.sin(walk)) * 0.6 * wa + crouch * 2.2;
  u.legs.R.userData.shin.rotation.x = Math.max(0, Math.sin(walk)) * 0.6 * wa + crouch * 2.2;
  u.body.position.y = Math.abs(Math.cos(walk)) * 0.025 * wa - crouch * 0.2;
  u.torso.rotation.x = crouch * 0.55 + down * 0.15;

  for (const [k, s] of [['L', 1], ['R', -1]]) {
    const arm = u.arms[k];
    const swing = (k === 'L' ? -sw : sw) * 0.9 * (1 - reach);
    arm.rotation.x = swing - reach * 1.15 - down * 1.0;
    arm.rotation.z = (k === 'L' ? -0.12 : 0.12) * (1 - reach) + (k === 'L' ? 0.28 : -0.28) * reach;
    arm.userData.fore.rotation.x = -reach * 0.6 - down * 0.2;
  }
  const look = p.look || [0, 0];
  u.head.rotation.set(look[1] - crouch * 0.2, look[0], p.tilt ?? 0);
  const blink = p.blink ?? 0;
  for (const e of u.eyes) e.scale.y = 1.25 * (1 - blink * 0.9);
  const sm = p.smile ?? 0.5;
  u.mouth.scale.set(0.8 + sm * 0.6, 0.6 + sm * 0.8, 1);
}
