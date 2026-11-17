// Lighting presets shared by every video.
//   import { lighting } from 'engine/lighting/index.js';
//   const light = lighting['fill-rim'](scene, { ...ctx, camera }, { rim: { intensity: 5 } });
// Every preset returns handles to its lights so scenes can animate them over time.
import * as flat from './flat.js';
import * as key from './key.js';
import * as fillRim from './fill-rim.js';
import * as glowFog from './glow-fog.js';

export const lighting = {
  'flat': flat.apply,
  'key': key.apply,
  'fill-rim': fillRim.apply,
  'glow-fog': glowFog.apply,
};

export const defaults = {
  'flat': flat.defaults,
  'key': key.defaults,
  'fill-rim': fillRim.defaults,
  'glow-fog': glowFog.defaults,
};
