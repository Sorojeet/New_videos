# New Videos — Low-Poly Motion Graphics

Vertical 9:16, 30–60s low-poly videos with AI voiceover and music.
Videos are grouped into folders by type; each video has its own folder inside its type.

```
what-if/
  earth-stopped-spinning/
explanatory/
  how-a-volcano-erupts/
story/
  the-lighthouse-keeper/
abstract-loop/
  lowpoly-planet-loop/
```

New videos go into the matching type folder, e.g. `what-if/<new-video>/`.

## Inside each video folder

```
assets/models/     low-poly models built for this video
assets/materials/  materials and colour palettes
lighting/          lighting rigs and presets
scenes/            scene files and render scripts
script/            voiceover script and timing
audio/             voiceover and music
renders/           sample frames (video files are not pushed)
```

## Voiceovers — `audio_master.py`

One master script generates every voiceover with Kokoro TTS.

```
pip install kokoro-onnx soundfile
python audio_master.py                                  # all videos
python audio_master.py what-if/earth-stopped-spinning   # one video
python audio_master.py --type story                     # one type
python audio_master.py --voices                         # list voices
```

Write the narration in `<type>/<video>/script/voiceover.txt` (one line per sentence,
blank line = scene break, `[pause 1.5]` = silence). Output goes to that video's
`audio/voiceover.wav` and `audio/voiceover_timing.json` (per-line timing for syncing
animation). Voices per type are set at the top of `audio_master.py`.

## Rendering — three.js (`engine/`)

Videos are rendered with three.js in headless Chrome, frame by frame, then encoded
with ffmpeg (voiceover and `audio/music.*` are mixed in automatically).

```
cd engine && npm install && cd ..
node engine/render.mjs what-if/earth-stopped-spinning --stills 0,5,10   # sample frames (PNG)
node engine/render.mjs what-if/earth-stopped-spinning --preview         # quick half-res video
node engine/render.mjs what-if/earth-stopped-spinning                   # final 1080x1920 30fps
node engine/render.mjs what-if/earth-stopped-spinning --export-assets   # models -> .glb
```

How a video folder plugs in (copy `engine/template/` to start a new video):

- `assets/models/<name>.js` exports `build(opts)` returning a model; `--export-assets`
  saves it as `<name>.glb` (opens in Blender, Unity, Unreal, any three.js project)
- `lighting/main.js` picks one of the shared lighting presets and tunes it for that video
- `scenes/main.js` exports `setup(ctx)` returning `{ scene, camera, duration, update(t) }`;
  `ctx.timing` holds the voiceover line timings so animation can sync to narration
- Shared low-poly helpers (flat materials, vertex jitter, easing) live in `engine/lib/lowpoly.js`

## Lighting presets (`engine/lib/lighting/`)

| Preset | Look | Good for |
|---|---|---|
| `flat` | Even, shadowless, true colours | Infographics, explainers, clean loops |
| `key` | One strong sun, hard shadows, dark ambient | Day/night sides, reveals, hero objects |
| `fill-rim` | Warm key + soft cool fill + bright rim outline | Characters, story scenes |
| `glow-fog` | Dark fog, moonlight, glowing lights + bloom | Night, storms, lava, sci-fi |

Each video chooses and tunes one in `lighting/main.js`. Try another without editing:
`node engine/render.mjs <video> --stills 2 --set light=glow-fog`
