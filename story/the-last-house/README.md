# The Last House (5-reel mystery series)

Blocky 3D style (box characters with modelled eyes, brows and mouths), pastel haze, italic serif
title with a gold key word, Jost subtitles. Narration: Kokoro `am_michael` at 0.94×. 9:16, ~60 s per reel.

## Shared assets (`assets/`) — reused by every reel
- `models/explorer.js`: the explorer (`build({ age })`, age 1 = old man for Reel 5) + `pose()`:
  walk, aim flashlight, reach, hold, push door, head look, eye gaze, blink, brows, mouth (smile/neutral/open)
- `models/house.js`: the last house (door opens, upstairs window glows; `fresh: true` = renovated, Reel 4)
- `models/world.js`: terrain, instanced forest, pastel village with power lines, dead pole, mailbox, fences, dead tree
- `models/interior.js`: dusty parlour (sheets, fireplace, stairs, bookshelf for Reel 2, table)
- `models/photograph.js`: aged sepia print from a live render + handwritten date on the back
- `fonts/`: Cormorant Garamond italic (title), Jost (subtitles), Caveat (handwriting) — SIL OFL
- `design/`: character/house design sheet (`node engine/render.mjs story/the-last-house/design --stills 0,1,2,3`)

## Reels
| Reel | Folder | Status |
|---|---|---|
| 1 The Last House | `reel-1/` | built |
| 2 The Photograph | `reel-2/` | – |
| 3 The Secret Room | `reel-3/` | – |
| 4 The Escape | `reel-4/` | – |
| 5 The New Owner | `reel-5/` | – |

## Build a reel
```
python audio_master.py story/the-last-house/reel-1
python story/the-last-house/reel-1/audio/music.py
node engine/render.mjs story/the-last-house/reel-1 --stills 6,15,29,39.5,50.5,59
node engine/render.mjs story/the-last-house/reel-1
```
