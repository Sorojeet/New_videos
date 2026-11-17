#!/usr/bin/env python3
"""
Master voiceover generator for all videos, using Kokoro TTS (kokoro-onnx).

Every video folder that has  script/voiceover.txt  gets:
    audio/voiceover.wav           the full narration (24 kHz mono)
    audio/voiceover_timing.json   start/end time of every line, for syncing animation

Usage
    python audio_master.py                                   # all videos
    python audio_master.py what-if/earth-stopped-spinning    # one video
    python audio_master.py --type story                      # every video of one type
    python audio_master.py --voices                          # list available voices
    python audio_master.py --preview am_michael "Test line"  # try a voice

Script format (script/voiceover.txt)
    One sentence or phrase per line; each line is timed separately.
    A blank line = scene break (adds SCENE_GAP seconds of silence).
    [pause 1.5]   on its own line adds that many seconds of silence.
    [at 10]       the next line starts exactly at 10s (to sync narration with scenes).
    # comments    are ignored.

Setup
    pip install kokoro-onnx soundfile
    The model (~350 MB) downloads automatically into .kokoro/ on first run.
"""

import argparse
import json
import re
import sys
import urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent
MODEL_DIR = ROOT / ".kokoro"
MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
MODEL_FILES = ["kokoro-v1.0.onnx", "voices-v1.0.bin"]
SAMPLE_RATE = 24000

# ---------------------------------------------------------------------------
# Voice settings
#   Defaults by video type, then optional overrides for a single video.
#   voice: see --voices  (af_/am_ = US female/male, bf_/bm_ = UK female/male)
#   speed: 0.5–2.0      lang: "en-us" or "en-gb"
# ---------------------------------------------------------------------------
TYPE_DEFAULTS = {
    "what-if":       {"voice": "am_michael", "speed": 1.0,  "lang": "en-us"},
    "explanatory":   {"voice": "af_heart",   "speed": 1.0,  "lang": "en-us"},
    "story":         {"voice": "bm_george",  "speed": 0.92, "lang": "en-gb"},
    "abstract-loop": {"voice": "af_bella",   "speed": 0.95, "lang": "en-us"},
}
FALLBACK = {"voice": "af_heart", "speed": 1.0, "lang": "en-us"}

VIDEO_OVERRIDES = {
    "story/the-star-in-the-garden": {"speed": 1.08},
    # "what-if/earth-stopped-spinning": {"voice": "am_adam", "speed": 1.05},
}

LINE_GAP = 0.25   # seconds of silence between lines
SCENE_GAP = 0.8   # seconds of silence at a blank line
HEAD_PAD = 0.3    # silence at the start
TAIL_PAD = 0.6    # silence at the end
# ---------------------------------------------------------------------------


def ensure_model():
    MODEL_DIR.mkdir(exist_ok=True)
    for name in MODEL_FILES:
        path = MODEL_DIR / name
        if not path.exists():
            print(f"Downloading {name} ...")
            urllib.request.urlretrieve(MODEL_URL + name, path)
    from kokoro_onnx import Kokoro
    return Kokoro(str(MODEL_DIR / MODEL_FILES[0]), str(MODEL_DIR / MODEL_FILES[1]))


def settings_for(video_rel):
    vtype = video_rel.split("/")[0]
    cfg = dict(TYPE_DEFAULTS.get(vtype, FALLBACK))
    cfg.update(VIDEO_OVERRIDES.get(video_rel, {}))
    return cfg


def find_videos(type_filter=None):
    videos = []
    for script in sorted(ROOT.glob("*/*/script/voiceover.txt")):
        rel = script.parent.parent.relative_to(ROOT).as_posix()
        if type_filter and not rel.startswith(type_filter + "/"):
            continue
        videos.append(rel)
    return videos


def parse_script(text):
    """Return a list of ('line', text) / ('gap', seconds) items."""
    items = []
    for raw in text.splitlines():
        line = raw.strip()
        if line.startswith("#"):
            continue
        if not line:
            if items and items[-1][0] == "line":
                items.append(("gap", SCENE_GAP))
            continue
        m = re.fullmatch(r"\[pause\s+([\d.]+)\]", line, re.I)
        a = re.fullmatch(r"\[at\s+([\d.]+)\]", line, re.I)
        if m:
            items.append(("gap", float(m.group(1))))
        elif a:
            while items and items[-1][0] == "gap":
                items.pop()
            items.append(("at", float(a.group(1))))
        else:
            items.append(("line", line))
    while items and items[-1][0] == "gap":
        items.pop()
    return items


def silence(seconds):
    return np.zeros(int(seconds * SAMPLE_RATE), dtype=np.float32)


def render_video(kokoro, video_rel):
    vdir = ROOT / video_rel
    script = vdir / "script" / "voiceover.txt"
    cfg = settings_for(video_rel)
    items = parse_script(script.read_text(encoding="utf-8"))
    if not any(kind == "line" for kind, _ in items):
        print(f"  {video_rel}: script is empty, skipped")
        return

    chunks, timing = [silence(HEAD_PAD)], []
    t = HEAD_PAD
    prev_line = False
    for kind, value in items:
        if kind == "at":
            if t > value + 0.01:
                print(f"  WARNING {video_rel}: narration runs {t - value:.2f}s past the [at {value}] marker")
            else:
                chunks.append(silence(value - t))
                t = value
            prev_line = False
            continue
        if kind == "gap":
            chunks.append(silence(value))
            t += value
            prev_line = False
            continue
        if prev_line:
            chunks.append(silence(LINE_GAP))
            t += LINE_GAP
        audio, sr = kokoro.create(value, voice=cfg["voice"], speed=cfg["speed"], lang=cfg["lang"])
        audio = np.asarray(audio, dtype=np.float32)
        dur = len(audio) / sr
        timing.append({"index": len(timing) + 1, "text": value,
                       "start": round(t, 3), "end": round(t + dur, 3)})
        chunks.append(audio)
        t += dur
        prev_line = True
    chunks.append(silence(TAIL_PAD))

    full = np.concatenate(chunks)
    peak = float(np.max(np.abs(full))) or 1.0
    full = full / peak * 0.89  # normalise to about -1 dBFS

    out_dir = vdir / "audio"
    out_dir.mkdir(exist_ok=True)
    sf.write(out_dir / "voiceover.wav", full, SAMPLE_RATE)
    meta = {"video": video_rel, **cfg, "sample_rate": SAMPLE_RATE,
            "duration": round(len(full) / SAMPLE_RATE, 3), "lines": timing}
    (out_dir / "voiceover_timing.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"  {video_rel}: {meta['duration']:.1f}s, {len(timing)} lines, voice {cfg['voice']}")


def main():
    ap = argparse.ArgumentParser(description="Generate Kokoro voiceovers for all videos.")
    ap.add_argument("videos", nargs="*", help="video folders, e.g. what-if/earth-stopped-spinning")
    ap.add_argument("--type", help="only videos of this type, e.g. story")
    ap.add_argument("--voices", action="store_true", help="list available voices")
    ap.add_argument("--preview", nargs=2, metavar=("VOICE", "TEXT"), help="write preview.wav")
    args = ap.parse_args()

    kokoro = ensure_model()

    if args.voices:
        print("\n".join(sorted(kokoro.get_voices())))
        return
    if args.preview:
        voice, text = args.preview
        lang = "en-gb" if voice.startswith("b") else "en-us"
        audio, sr = kokoro.create(text, voice=voice, speed=1.0, lang=lang)
        sf.write(ROOT / "preview.wav", audio, sr)
        print("Wrote preview.wav")
        return

    videos = [v.strip("/") for v in args.videos] or find_videos(args.type)
    if not videos:
        print("No videos with script/voiceover.txt found.")
        return
    print(f"Generating {len(videos)} voiceover(s):")
    for v in videos:
        if not (ROOT / v / "script" / "voiceover.txt").exists():
            print(f"  {v}: no script/voiceover.txt, skipped")
            continue
        render_video(kokoro, v)


if __name__ == "__main__":
    sys.exit(main())
