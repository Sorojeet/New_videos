// THE STAR IN THE GARDEN — lighting.
// Shared presets mixed over time + this video's practical lights (windows, star, lamp)
// which the scene animates itself.
import { mixLighting } from 'engine/lighting/mix.js';

export const options = {
  // Scene 1 dusk + Scene 3 golden garden: warm key, soft blue moon fill, cool rim
  'fill-rim': {
    background: '#3a4778',
    key: { color: '#ffb46e', intensity: 2.6, direction: [7, 3.2, 5] },
    fill: { color: '#7090e0', intensity: 0.9, direction: [-6, 5, 3] },
    rim: { color: '#a8c2ff', intensity: 2.6, direction: [-2, 4, -7] },
    ambient: 0.5, size: 7, fog: [14, 50], mixFog: 0.011,
  },
  // Scene 2 evening + Scene 5 midnight: soft blue ambient, moonlight, fog
  'glow-fog': {
    background: '#141c3d', fogDensity: 0.022,
    moon: { color: '#8aa2ff', intensity: 1.5, direction: [-4, 7, 3] },
    ambient: 0.8, size: 7,
  },
  // Scene 4 bedroom: warm interior light, soft shadows
  'key': {
    background: '#0d1430', color: '#ffcf94', intensity: 1.6, direction: [3, 6, 4], ambient: 0.6, size: 4, mixFog: 0.015,
  },
};

// [seconds, preset or blend, fade seconds (0 = cut)]
export const timeline = [
  [0, 'fill-rim'],
  [10, 'glow-fog', 2.0],
  [20.3, { 'fill-rim': 0.75, 'glow-fog': 0.55 }, 1.5],
  [38.0, 'key', 0],
  [45.0, { 'glow-fog': 0.85 }, 0],
];

// Sky gradient keyframes: [seconds, top colour, horizon colour, fade (0 = cut)]
export const sky = [
  [0, '#2b3a78', '#d9907a'],
  [10, '#141d45', '#3c4f8f', 2.0],
  [20.3, '#1a2150', '#6a5f92', 1.5],
  [38.0, '#0b1230', '#27346a', 0],
  [45.0, '#04070f', '#101a3e', 0],
];

export function apply(scene, ctx) {
  // No camera passed: this video makes its own bloom pass in the scene.
  const { camera, ...noCam } = ctx;
  return mixLighting(scene, noCam, { presets: options, timeline });
}
