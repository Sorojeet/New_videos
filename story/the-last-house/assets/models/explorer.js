// The explorer: blocky 3D character (box head, body and limbs) with proper eyes:
// white eyeballs, coloured iris, pupil, catchlight, eyelids that blink, brows and a mouth.
// build({ age }) -> Group;  pose(explorer, p) animates it.   ~1.85 units tall.
//   age 0 = young (Reels 1-4), 1 = old man (Reel 5: grey hair and beard)
import * as THREE from 'three';

export const palette = {
  skin: '#e0a882', skinShade: '#c98f6c', hair: '#3b2a20', hairOld: '#d6d2ca',
  jacket: '#56603f', jacketDark: '#454e32', scarf: '#9b3a2c', pants: '#2e3440',
  boot: '#5c4030', pack: '#7a5638', bedroll: '#3f5f70', strap: '#2e261f',
  iris: '#5b3b22', lips: '#8e4a3c', brow: '#2c1f17',
};

const std = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...opts });
const box = (w, h, d, mat, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
};

export function build({ age = 0, flashlight = true } = {}) {
  const c = palette;
  const M = {
    skin: std(c.skin), shade: std(c.skinShade), hair: std(age ? c.hairOld : c.hair),
    jacket: std(c.jacket), jacketDark: std(c.jacketDark), scarf: std(c.scarf), pants: std(c.pants),
    boot: std(c.boot), pack: std(c.pack), bedroll: std(c.bedroll), strap: std(c.strap),
  };
  const root = new THREE.Group();
  root.name = 'explorer';
  const body = new THREE.Group();          // everything; bobs while walking
  root.add(body);

  // Legs (pivot at hip)
  const legs = {};
  for (const s of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(s * 0.11, 0.78, 0);
    leg.add(box(0.19, 0.66, 0.21, M.pants, 0, -0.33, 0));
    leg.add(box(0.21, 0.12, 0.3, M.boot, 0, -0.72, 0.04));
    body.add(leg);
    legs[s < 0 ? 'R' : 'L'] = leg;
  }

  // Torso
  const torso = new THREE.Group();
  torso.position.y = 0.78;
  body.add(torso);
  torso.add(box(0.48, 0.62, 0.28, M.jacket, 0, 0.31, 0));
  torso.add(box(0.49, 0.07, 0.29, M.jacketDark, 0, 0.035, 0));        // jacket hem
  torso.add(box(0.03, 0.5, 0.01, M.jacketDark, 0, 0.32, 0.145));       // zip
  for (const s of [-1, 1]) torso.add(box(0.12, 0.1, 0.02, M.jacketDark, s * 0.13, 0.42, 0.145)); // pockets
  torso.add(box(0.34, 0.09, 0.31, M.scarf, 0, 0.62, 0));                // scarf
  torso.add(box(0.08, 0.2, 0.03, M.scarf, 0.08, 0.5, 0.155));
  for (const s of [-1, 1]) torso.add(box(0.05, 0.56, 0.02, M.strap, s * 0.13, 0.32, 0.145)); // pack straps
  const pack = new THREE.Group();
  pack.position.set(0, 0.32, -0.25);
  pack.add(box(0.38, 0.48, 0.22, M.pack));
  pack.add(box(0.28, 0.16, 0.06, M.pack, 0, -0.1, -0.13));
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.46, 12), M.bedroll);
  roll.rotation.z = Math.PI / 2; roll.position.set(0, 0.31, 0); roll.castShadow = true;
  pack.add(roll);
  torso.add(pack);

  // Arms (pivot at shoulder)
  const arms = {};
  for (const s of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(s * 0.32, 0.56, 0);
    arm.add(box(0.15, 0.5, 0.17, M.jacket, 0, -0.25, 0));
    arm.add(box(0.155, 0.06, 0.175, M.jacketDark, 0, -0.48, 0));       // cuff
    const hand = box(0.13, 0.12, 0.14, M.skin, 0, -0.57, 0);
    arm.add(hand);
    arm.userData.hand = hand;
    torso.add(arm);
    arms[s < 0 ? 'R' : 'L'] = arm;
  }
  let torch = null;
  if (flashlight) {
    torch = new THREE.Group();
    const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.028, 0.2, 10), std('#2a2c30', { roughness: 0.5 }));
    const th = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.032, 0.06, 12), std('#8e9298', { metalness: 0.5, roughness: 0.4 }));
    th.position.y = 0.12;
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.04, 16), new THREE.MeshStandardMaterial({ color: '#fff3cf', emissive: '#fff3cf', emissiveIntensity: 0 }));
    lens.rotation.x = -Math.PI / 2; lens.position.y = 0.151;
    torch.add(tb, th, lens);
    torch.userData.lens = lens;
    torch.rotation.x = Math.PI / 2;
    torch.position.set(0, -0.6, 0.08);
    arms.R.add(torch);
  }

  // Head
  const head = new THREE.Group();
  head.position.y = 0.67;
  torso.add(head);
  const HW = 0.44, HH = 0.44, HD = 0.4, FZ = HD / 2;
  head.add(box(HW, HH, HD, M.skin, 0, HH / 2, 0));
  // hair: top slab, back slab, side burns, fringe
  head.add(box(HW + 0.02, 0.1, HD + 0.02, M.hair, 0, HH + 0.03, 0));
  head.add(box(HW + 0.02, 0.3, 0.06, M.hair, 0, HH - 0.12, -FZ - 0.01));
  for (const s of [-1, 1]) head.add(box(0.04, 0.16, HD * 0.7, M.hair, s * (HW / 2 + 0.01), HH - 0.06, -0.05));
  head.add(box(0.26, 0.06, 0.05, M.hair, -0.07, HH - 0.02, FZ - 0.01));
  head.add(box(0.12, 0.05, 0.05, M.hair, 0.12, HH - 0.005, FZ - 0.01));
  // ears + nose
  for (const s of [-1, 1]) head.add(box(0.04, 0.09, 0.07, M.shade, s * (HW / 2 + 0.02), 0.22, 0.0));
  head.add(box(0.06, 0.08, 0.05, M.shade, 0, 0.17, FZ + 0.02));

  // Eyes: eyeball, iris, pupil, catchlight, eyelid, brow
  const eyes = [];
  const white = new THREE.MeshStandardMaterial({ color: '#f7f4ee', roughness: 0.25 });
  const irisM = new THREE.MeshStandardMaterial({ color: c.iris, roughness: 0.3 });
  const pupilM = new THREE.MeshStandardMaterial({ color: '#0d0b0a', roughness: 0.2 });
  const shineM = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  for (const s of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(s * 0.095, 0.25, FZ);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.044, 20, 14), white);
    ball.scale.set(1, 1.12, 0.42);
    const look = new THREE.Group();                  // iris+pupil move together (gaze)
    look.position.z = 0.02;
    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.026, 24), irisM);
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.015, 20), pupilM);
    pupil.position.z = 0.0005;
    const shine = new THREE.Mesh(new THREE.CircleGeometry(0.0075, 12), shineM);
    shine.position.set(0.011, 0.012, 0.001);
    look.add(iris, pupil, shine);
    // eyelid: skin-coloured half shell that drops down to blink
    // eyelid: skin-coloured shell over the eyeball, grows down from the top to blink
    const lidGeo = new THREE.SphereGeometry(0.047, 20, 12);
    lidGeo.translate(0, -0.047, 0);                  // anchor at the top so it closes downward
    const lid = new THREE.Mesh(lidGeo, M.skin);
    lid.position.y = 0.047 * 1.12;
    lid.scale.set(1.04, 0.0001, 0.47);
    const brow = box(0.1, 0.022, 0.02, std(age ? '#cfc9bf' : c.brow), 0, 0.085, 0.01);
    const lash = box(0.09, 0.009, 0.012, std('#2c1f17'), 0, -0.004, 0.024);   // closed-eye line
    lash.visible = false;
    eye.add(ball, look, lid, brow, lash);
    head.add(eye);
    eyes.push({ eye, look, lid, brow, lash, side: s });
  }
  // Mouth: three shapes, one visible at a time
  const lipsM = std(c.lips);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.011, 8, 16, Math.PI * 0.75), lipsM);
  smile.rotation.z = Math.PI + Math.PI * 0.125; smile.position.set(0, 0.11, FZ + 0.005);
  const neutral = box(0.08, 0.016, 0.012, lipsM, 0, 0.095, FZ + 0.004);
  const open = new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 10), std('#4a1f1a'));
  open.scale.set(1, 1.25, 0.3); open.position.set(0, 0.09, FZ + 0.002);
  head.add(smile, neutral, open);
  if (age) {
    head.add(box(HW * 0.8, 0.14, 0.06, M.hair, 0, 0.06, FZ + 0.01));       // beard
    head.add(box(0.14, 0.03, 0.03, M.hair, 0, 0.13, FZ + 0.02));           // moustache
  }

  root.userData = { body, torso, head, legs, arms, eyes, mouths: { smile, neutral, open }, torch, age };
  pose(root, {});
  return root;
}

// p: { walk (phase), walkAmount 0..1, aim 0..1 (flashlight forward), hold 0..1 (photo at chest),
//      reach 0..1 (right hand reaches down/forward), push 0..1 (left arm pushes door),
//      look [yaw, pitch] head turn, gaze [x, y] eyes (-1..1), blink 0..1, mouth 'smile'|'neutral'|'open',
//      brows 0 (calm) .. 1 (worried/raised), torchOn }
export function pose(ex, p = {}) {
  const u = ex.userData;
  const w = p.walk ?? 0, wa = p.walkAmount ?? 0;
  const aim = p.aim ?? 0, hold = p.hold ?? 0, reach = p.reach ?? 0, push = p.push ?? 0;
  const sw = Math.sin(w) * wa;
  u.legs.L.rotation.x = sw * 0.55;
  u.legs.R.rotation.x = -sw * 0.55;
  u.body.position.y = Math.abs(Math.cos(w)) * 0.025 * wa;
  u.torso.rotation.set(0.03 * wa + reach * 0.3 + (u.age ? 0.18 : 0), 0, 0);
  const R = u.arms.R, L = u.arms.L;
  R.rotation.set(-sw * 0.6 * (1 - Math.max(aim, hold, reach)) - aim * 1.45 - hold * 1.15 - reach * 1.0, 0, -0.05 + hold * 0.45);
  L.rotation.set(sw * 0.6 * (1 - Math.max(push, hold)) - push * 1.45 - hold * 1.15, 0, 0.05 - hold * 0.45);
  const look = p.look || [0, 0];
  u.head.rotation.set(look[1] + (u.age ? 0.12 : 0), look[0], p.tilt ?? 0);
  const gaze = p.gaze || [0, 0];
  const blink = p.blink ?? 0, brows = p.brows ?? 0;
  for (const e of u.eyes) {
    e.look.position.set(gaze[0] * 0.012, gaze[1] * 0.01, 0.02);
    e.lid.scale.y = Math.max(0.0001, blink * 1.14);  // 0 = open, 1 = closed
    e.lid.scale.z = 0.62;
    e.look.visible = blink < 0.55;
    e.lash.visible = blink > 0.85;
    e.brow.position.y = 0.085 + brows * 0.018;
    e.brow.rotation.z = -e.side * brows * 0.25;
  }
  const mouth = p.mouth || 'neutral';
  for (const [k, m] of Object.entries(u.mouths)) m.visible = k === mouth;
  if (u.torch) u.torch.userData.lens.material.emissiveIntensity = p.torchOn ? 4 : 0;
}
