// Burned-in subtitles from audio/voiceover_timing.json.
// Lines are split into short phrases; the word being spoken is highlighted.
// Drawn in a separate overlay pass (no bloom, fog or tone mapping).
//
// Optional per-video config: script/subtitles.json
//   { "enabled": true, "font": "assets/fonts/X.woff2", "fontFamily": "X", "size": 60,
//     "y": 0.72, "maxWords": 6, "color": "#ffffff", "highlight": "#ffd36a",
//     "outline": "#10131f", "box": false }
import * as THREE from 'three';

const DEFAULTS = {
  enabled: true, font: null, fontFamily: 'Inter', weight: 700, size: 60, y: 0.72, maxWords: 6,
  color: '#ffffff', highlight: '#ffd36a', outline: '#10131f', box: false, fade: 0.12,
};

// Split a narration line into short phrases, timed by character count.
export function chunkLine(line, maxWords) {
  const words = line.text.split(/\s+/).filter(Boolean);
  const chunks = [];
  let cur = [];
  words.forEach((w, i) => {
    cur.push(w);
    const left = words.length - i - 1;
    const punct = /[,.;:!?]$/.test(w);
    if ((cur.length >= maxWords && left !== 1) || (punct && cur.length >= 3 && left !== 1) || left === 0) {
      chunks.push(cur); cur = [];
    }
  });
  const total = words.join(' ').length;
  const dur = line.end - line.start;
  let t = line.start, out = [];
  for (const c of chunks) {
    const len = c.join(' ').length + 1;
    const d = (dur * len) / (total + 1);
    // word timings inside the chunk
    let wt = t;
    const wtimes = c.map((w) => { const s = wt; wt += (d * (w.length + 1)) / len; return s; });
    out.push({ words: c, start: t, end: t + d, wtimes });
    t += d;
  }
  return out;
}

export async function createSubtitles(ctx, timing, userCfg = {}) {
  const cfg = { ...DEFAULTS, ...userCfg };
  if (!cfg.enabled || !timing?.lines?.length) return null;
  if (cfg.font) {
    try {
      const ff = new FontFace(cfg.fontFamily, `url(${ctx.base}${cfg.font})`);
      await ff.load(); document.fonts.add(ff);
    } catch (e) { console.warn('subtitle font failed', e); }
  }
  const chunks = timing.lines.flatMap((l) => chunkLine(l, cfg.maxWords));
  const W = ctx.width, H = ctx.height, s = W / 1080;
  const fontPx = Math.round(cfg.size * s);
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = Math.round(fontPx * 3.4);
  const g = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(W, canvas.height), mat);
  plane.position.set(0, H / 2 - H * cfg.y, 0);
  const overlay = new THREE.Scene();
  overlay.add(plane);
  const cam = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, -10, 10);
  const font = `${cfg.weight} ${fontPx}px "${cfg.fontFamily}", Inter, sans-serif`;

  // Wrap words into at most 2 lines that fit 86% of the width.
  const layout = (words) => {
    g.font = font;
    const maxW = W * 0.86, lines = [[]];
    for (const w of words) {
      const test = [...lines[lines.length - 1], w].join(' ');
      if (g.measureText(test).width > maxW && lines[lines.length - 1].length) lines.push([w]);
      else lines[lines.length - 1].push(w);
    }
    return lines;
  };

  let lastKey = '';
  function draw(chunk, t) {
    const active = chunk.wtimes.reduce((a, wt, i) => (t >= wt ? i : a), 0);
    const key = `${chunk.start}|${active}`;
    if (key === lastKey) return;
    lastKey = key;
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.font = font;
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    const lines = layout(chunk.words);
    const lh = fontPx * 1.22;
    const y0 = canvas.height / 2 - ((lines.length - 1) * lh) / 2;
    let wi = 0;
    lines.forEach((ln, li) => {
      const space = g.measureText(' ').width;
      const widths = ln.map((w) => g.measureText(w).width);
      const total = widths.reduce((a, b) => a + b, 0) + space * (ln.length - 1);
      let x = (canvas.width - total) / 2;
      const y = y0 + li * lh;
      if (cfg.box) {
        g.fillStyle = 'rgba(10,12,24,0.55)';
        const pad = fontPx * 0.3;
        g.beginPath(); g.roundRect(x - pad, y - lh / 2, total + pad * 2, lh, pad); g.fill();
      }
      ln.forEach((w, k) => {
        g.lineWidth = Math.max(4, fontPx * 0.16);
        g.strokeStyle = cfg.outline;
        g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = fontPx * 0.25; g.shadowOffsetY = fontPx * 0.05;
        g.strokeText(w, x, y);
        g.shadowColor = 'transparent';
        g.fillStyle = wi === active ? cfg.highlight : cfg.color;
        g.fillText(w, x, y);
        x += widths[k] + space;
        wi++;
      });
    });
    tex.needsUpdate = true;
  }

  return {
    chunks,
    render(renderer, t) {
      const c = chunks.find((ch) => t >= ch.start && t < ch.end + 0.05);
      if (!c) return;
      const prev = chunks.find((ch) => Math.abs(ch.end - c.start) < 0.01);
      const fadeIn = prev ? 1 : Math.min(1, (t - c.start) / cfg.fade);
      const next = chunks.find((ch) => ch.start >= c.end - 0.01);
      const gapAfter = next ? next.start - c.end : 1;
      const fadeOut = gapAfter > 0.2 ? Math.min(1, (c.end + 0.05 - t) / cfg.fade) : 1;
      mat.opacity = Math.max(0, Math.min(fadeIn, fadeOut));
      draw(c, t);
      const ac = renderer.autoClear, tm = renderer.toneMapping;
      renderer.autoClear = false;
      renderer.render(overlay, cam);
      renderer.autoClear = ac;
      renderer.toneMapping = tm;
    },
  };
}
