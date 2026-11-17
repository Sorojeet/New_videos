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
