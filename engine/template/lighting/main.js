// This video's lighting. Use ONE shared preset, or MIX several across the video.
// Presets: 'flat' | 'key' | 'fill-rim' | 'glow-fog'  (see engine/lib/lighting/)
import { lighting } from 'engine/lighting/index.js';
import { mixLighting } from 'engine/lighting/mix.js';

// Single preset used when `timeline` is null.
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
      { position: [-1.5, -0.6, 1.0], color: '#57e0ff', intensity: 3, distance: 4, orb: 0.06 },
    ],
  },
};

// Lighting changes over time: [seconds, preset, fade seconds (0 = hard cut)].
// Set to null to use the single `preset` for the whole video.
export const timeline = [
  [0.0, 'flat'],
  [1.5, 'key', 1.0],
  [3.5, 'fill-rim', 1.0],
  [5.5, 'glow-fog', 1.0],
];

// apply(scene, ctx) -> light handles. --set light=<preset> forces a single preset.
export function apply(scene, ctx) {
  const forced = ctx.params?.light;
  if (!forced && timeline) {
    const used = [...new Set(timeline.flatMap((e) => (typeof e[1] === 'string' ? [e[1]] : Object.keys(e[1]))))];
    const presets = Object.fromEntries(used.map((n) => [n, options[n] || {}]));
    return mixLighting(scene, ctx, { presets, timeline });
  }
  const name = forced || preset;
  return lighting[name](scene, ctx, options[name] || {});
}
