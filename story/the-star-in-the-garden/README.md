# The Star in the Garden

Low-poly 3D story · 60 s · 1080×1920 (9:16) · 30 fps · Mood: happy, magical, mysterious

## Build it

```
python audio_master.py story/the-star-in-the-garden          # Kokoro narration (bm_george, 1.08x)
python story/the-star-in-the-garden/audio/music.py           # music + SFX
node engine/render.mjs story/the-star-in-the-garden --stills 5,18,28,41,58   # sample frames
node engine/render.mjs story/the-star-in-the-garden          # final video -> renders/ (not pushed)
node engine/render.mjs story/the-star-in-the-garden --export-assets           # models -> .glb
```

## Shots

| Time | Scene | Camera | Lighting |
|---|---|---|---|
| 0–10 | Village on green hills, cottage with glowing windows, Leo playing with his pebble collection | Wide establishing → slow push to Leo | Fill + rim: warm key, soft blue moon fill, orange window glow |
| 10–20 | Leo spots a golden light behind the flower pot, walks over, star in the grass | Over-the-shoulder follow → slow zoom to the star | Glow + fog, soft blue ambient |
| 20–32 | Leo picks up the star, flowers light up, fireflies appear | Close-up of hands → orbit around Leo | Golden glow: fill + rim blended with glow + fog |
| 32–38 | Star goes into the glass jar (chime), Leo carries it home | Side close-up → side tracking | Same, fading |
| 38–45 | Bedroom: jar beside the bed, Leo smiling | Slow push in | Key (warm interior) + lamp, soft shadows |
| 45–56 | Midnight: lid pops, star floats out, over Leo's sleeping face, out of the window | Push to the jar → face close-up → follow to window | Glow + fog, dark blue moonlight, golden star particles |
| 56–60 | Hundreds of lights in the forest. **"WHERE WERE THEY TAKING HIM?"** | Push out through the window | Glow + fog, mysterious sting |

## Files

- `script/voiceover.txt`: narration; `[at X]` pins each scene's lines to its start time
- `assets/models/`: `leo` (jointed, with `pose()`), `house`, `hills`, `garden`, `star`, `jar`, `forest`, `bedroom`
- `assets/fonts/`: Fredoka SemiBold (SIL OFL) for the end title
- `lighting/main.js`: preset blend timeline + sky colours
- `scenes/main.js`: all shots, animation and effects
- `audio/music.py`: synthesized music bed, glass chime (34.6 s), lid pop (48.3 s), sting (56.2 s)
- `audio/mix.json`: music level + auto-ducking under the narration
- `script/subtitles.json`: subtitle style (Fredoka, gold word highlight)
