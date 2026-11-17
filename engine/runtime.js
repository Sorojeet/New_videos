// Browser side of the renderer. Loads a video's scenes/main.js and renders
// frames on demand at exact times, so output is deterministic and frame-perfect.
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { rng } from 'engine/lowpoly.js';

const q = new URLSearchParams(location.search);
const video = q.get('video');
const W = +q.get('w') || 1080;
const H = +q.get('h') || 1920;
const base = `/${video}/`;

function toBase64(buf) {
  let s = '';
  const b = new Uint8Array(buf);
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}

try {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  document.body.appendChild(renderer.domElement);

  let timing = null;
  try {
    const r = await fetch(`${base}audio/voiceover_timing.json`);
    if (r.ok) timing = await r.json();
  } catch {}

  const params = Object.fromEntries([...q.entries()].filter(([k]) => k.startsWith('p_')).map(([k, v]) => [k.slice(2), v]));
  const ctx = {
    THREE, renderer, width: W, height: H, aspect: W / H, timing, params,   // params: from --set key=value
    rng,                                        // rng(seed) -> deterministic random()
    load: (rel) => import(`${base}${rel}`),     // load a module from this video's folder
  };

  window.__exportAssets = async (files) => {
    const exporter = new GLTFExporter();
    const out = {};
    for (const f of files) {
      const mod = await import(`${base}assets/models/${f}`);
      const obj = await mod.build(ctx);
      const glb = await exporter.parseAsync(obj, { binary: true });
      out[f.replace(/\.js$/, '.glb')] = toBase64(glb);
    }
    return out;
  };

  if (q.get('mode') === 'assets') {
    window.__ready = true;
  } else {
    const mod = await import(`${base}scenes/main.js`);
    const s = await mod.setup(ctx);
    window.__duration = s.duration ?? timing?.duration ?? 10;
    window.__renderFrame = async (t, fmt = 'jpeg') => {
      if (s.update) await s.update(t);
      if (s.composer) s.composer.render(); else renderer.render(s.scene, s.camera);
      return fmt === 'png'
        ? renderer.domElement.toDataURL('image/png')
        : renderer.domElement.toDataURL('image/jpeg', 0.95);
    };
    window.__ready = true;
  }
} catch (e) {
  window.__error = String(e && e.stack || e);
}
