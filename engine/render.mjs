#!/usr/bin/env node
// Renders a video folder with three.js in headless Chrome.
//
//   node engine/render.mjs <type>/<video>                  full video -> renders/<video>.mp4
//   node engine/render.mjs <type>/<video> --preview        half resolution, quick check
//   node engine/render.mjs <type>/<video> --stills 0,5,12  PNG frames at these seconds
//   node engine/render.mjs <type>/<video> --from 4 --to 9  render only part of the video
//   node engine/render.mjs <type>/<video> --export-assets  assets/models/*.js -> .glb
//   --set key=value   pass options to the scene (ctx.params), e.g. --set light=glow-fog
//   --tag name        prefix for still file names
//
// Audio: audio/voiceover.wav and audio/music.(mp3|wav|m4a) are mixed in when present.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const video = (args.find((a) => !a.startsWith('--')) || '').replace(/\/+$/, '');
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i < 0 ? def : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true);
};

if (!video || !fs.existsSync(path.join(ROOT, video))) {
  console.error('Usage: node engine/render.mjs <type>/<video> [--preview] [--stills 0,5] [--export-assets]');
  process.exit(1);
}
const VDIR = path.join(ROOT, video);
const NAME = path.basename(video);
const preview = !!opt('preview', false);
const W = +opt('width', preview ? 540 : 1080);
const H = +opt('height', preview ? 960 : 1920);
const FPS = +opt('fps', 30);
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';

// --- static file server for the repo ---------------------------------------
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.wav': 'audio/wav' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    res.writeHead(404); return res.end();
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;

// --- browser ---------------------------------------------------------------
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) console.error('[page]', m.text()); });
page.on('pageerror', (e) => console.error('[page]', e.message));
await page.setViewport({ width: W, height: H });

// --set key=value (repeatable) -> ctx.params in the scene, e.g. --set light=glow-fog
const sets = args.flatMap((a, i) => (a === '--set' && args[i + 1] ? [args[i + 1]] : []))
  .map((kv) => kv.split('=')).map(([k, v]) => `&p_${encodeURIComponent(k)}=${encodeURIComponent(v ?? '')}`).join('');
const mode = opt('export-assets', false) ? 'assets' : 'render';
await page.goto(`http://127.0.0.1:${PORT}/engine/runtime.html?video=${encodeURIComponent(video)}&w=${W}&h=${H}&mode=${mode}${sets}`);
await page.waitForFunction('window.__ready || window.__error', { timeout: 120000 });
const err = await page.evaluate('window.__error');
if (err) { console.error(err); await shutdown(1); }

const outDir = path.join(VDIR, 'renders');
fs.mkdirSync(outDir, { recursive: true });
const decode = (dataUrl) => Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');

if (mode === 'assets') {
  const mdir = path.join(VDIR, 'assets', 'models');
  const files = fs.readdirSync(mdir).filter((f) => f.endsWith('.js'));
  const out = await page.evaluate((f) => window.__exportAssets(f), files);
  for (const [name, b64] of Object.entries(out)) {
    fs.writeFileSync(path.join(mdir, name), Buffer.from(b64, 'base64'));
    console.log('exported', path.join(video, 'assets/models', name));
  }
  await shutdown(0);
}

const duration = await page.evaluate('window.__duration');
const stills = opt('stills', null);

if (stills) {
  const times = String(stills).split(',').map(Number);
  for (const t of times) {
    const data = await page.evaluate((tt) => window.__renderFrame(tt, 'png'), t);
    const tag = opt('tag', null);
    const file = path.join(outDir, `still_${tag ? tag + '_' : ''}${String(t.toFixed(2)).replace('.', '_')}s.png`);
    fs.writeFileSync(file, decode(data));
    console.log('wrote', path.relative(ROOT, file));
  }
  await shutdown(0);
}

// --- full video --------------------------------------------------------------
const from = +opt('from', 0);
const to = Math.min(+opt('to', duration), duration);
const frames = Math.round((to - from) * FPS);
const out = path.join(outDir, `${NAME}${preview ? '_preview' : ''}.mp4`);

const audioDir = path.join(VDIR, 'audio');
const vo = path.join(audioDir, 'voiceover.wav');
const music = ['mp3', 'wav', 'm4a'].map((e) => path.join(audioDir, `music.${e}`)).find(fs.existsSync);
const ff = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-'];
const inputs = [];
if (fs.existsSync(vo)) { ff.push('-ss', String(from), '-i', vo); inputs.push('vo'); }
if (music) { ff.push('-ss', String(from), '-i', music); inputs.push('music'); }
if (inputs.length === 2) {
  ff.push('-filter_complex', '[2:a]volume=0.22[m];[1:a][m]amix=inputs=2:duration=longest:normalize=0[a]',
    '-map', '0:v', '-map', '[a]');
} else if (inputs.length === 1) {
  ff.push('-map', '0:v', '-map', '1:a');
}
if (inputs.length) ff.push('-c:a', 'aac', '-b:a', '192k');
ff.push('-t', String(to - from), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18',
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out);

const enc = spawn('ffmpeg', ff, { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let i = 0; i < frames; i++) {
  const data = await page.evaluate((tt) => window.__renderFrame(tt), from + i / FPS);
  if (!enc.stdin.write(decode(data))) await new Promise((r) => enc.stdin.once('drain', r));
  if (i % FPS === 0 || i === frames - 1) {
    const el = (Date.now() - t0) / 1000;
    const eta = (el / (i + 1)) * (frames - i - 1);
    process.stdout.write(`\rframe ${i + 1}/${frames}  ${(el / (i + 1)).toFixed(2)}s/frame  ~${Math.ceil(eta / 60)} min left   `);
  }
}
enc.stdin.end();
await new Promise((r) => enc.on('close', r));
console.log(`\nwrote ${path.relative(ROOT, out)} (${(to - from).toFixed(1)}s, ${W}x${H}, ${FPS}fps)`);
await shutdown(0);

async function shutdown(code) {
  await browser.close().catch(() => {});
  server.close();
  process.exit(code);
}
