// This video's lighting: pick one of the shared presets and tune it here.
// Presets: 'flat' | 'key' | 'fill-rim' | 'glow-fog'  (see engine/lib/lighting/)
import { lighting } from 'engine/lighting/index.js';

export const preset = 'fill-rim';

// Per-preset tweaks for this video (merged over the preset defaults).
export const options = {
  'flat': { background: '#e8f1ea' },
  'key': { direction: [5, 3, 1] },
  'fill-rim': { rim: { intensity: 4.5 } },
  'glow-fog': {
    fogDensity: 0.06,
    glows: [
      { position: [1.6, 0.8, 1.2], color: '#ff9a4a', intensity: 8, distance: 5, orb: 0.09 },
      { position: [-1.5, -0.6, 1.0], color: '#57e0ff', intensity: 6, distance: 5, orb: 0.07 },
    ],
  },
};

// apply(scene, ctx, name?) -> light handles (+ composer for glow-fog).
export function apply(scene, ctx, name = ctx.params?.light || preset) {
  return lighting[name](scene, ctx, options[name] || {});
}
