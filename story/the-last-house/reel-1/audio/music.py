#!/usr/bin/env python3
"""
THE LAST HOUSE — Reel 1: score + ambience + sound effects (synthesized). Writes music.wav.
  0-12.5   dusk: soft uneasy pad (D minor), sparse music-box notes, light wind
  12.5-31  night: crickets, low drone, soft glow tone as the window lights (13.6s)
  31-38    morning: wind, footsteps on the path, then on the porch boards, DOOR CREAK (36.5s)
  38-47    inside: room tone, low drone, slow music box
  47-54    tension swell
  54.1     STING as the date is revealed; second hit on his face (57s); ring out
"""
import numpy as np
import soundfile as sf
from pathlib import Path

SR = 48000
DUR = 60.0
N = int(SR * DUR)
rng = np.random.default_rng(11)
L = np.zeros(N); R = np.zeros(N)


def hz(n): return 440.0 * 2 ** ((n - 69) / 12)


def add(sig, t0, pan=0.0, gain=1.0):
    i = int(t0 * SR)
    if i >= N or i < 0: return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))


def bandnoise(length, lo, hi, seed=0):
    n = int(length * SR)
    x = np.random.default_rng(seed).standard_normal(n)
    s = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR)
    s[(f < lo) | (f > hi)] = 0
    y = np.fft.irfft(s, n)
    return y / (np.abs(y).max() + 1e-9)


def env(n, a, r):
    t = np.arange(n) / SR
    return np.clip(np.minimum(t / max(a, 1e-4), (n / SR - t) / max(r, 1e-4)), 0, 1)


def pad(notes, length, attack=2.0, release=2.0, bright=0.2):
    n = int(length * SR); t = np.arange(n) / SR
    s = np.zeros(n)
    for note in notes:
        for d in (-0.07, 0.0, 0.06):
            f = hz(note + d)
            s += np.sin(2 * np.pi * f * t) + bright * 0.4 * np.sin(4 * np.pi * f * t)
    return s * env(n, attack, release) / (len(notes) * 3)


def music_box(note, length=2.5):
    n = int(length * SR); t = np.arange(n) / SR; f = hz(note)
    s = np.sin(2 * np.pi * f * t) + 0.2 * np.sin(4 * np.pi * f * t) * np.exp(-t * 3) + 0.1 * np.sin(2 * np.pi * 3.9 * f * t) * np.exp(-t * 6)
    return s * np.exp(-t / 0.8) * np.minimum(1, t / 0.003)


def boom(length=4.0, f0=48):
    n = int(length * SR); t = np.arange(n) / SR
    ph = 2 * np.pi * np.cumsum(f0 * np.exp(-t * 0.5) + 28) / SR
    return np.sin(ph) * np.exp(-t / 1.3) * np.minimum(1, t / 0.004)


def step(seed, wood=False):
    n = int(0.12 * SR); t = np.arange(n) / SR
    x = bandnoise(0.12, 150 if wood else 600, 1800 if wood else 6000, seed)
    s = x * np.exp(-t / (0.03 if not wood else 0.045))
    if wood: s += 0.6 * np.sin(2 * np.pi * 140 * t) * np.exp(-t / 0.05)
    return s


def creak(length=1.4):
    n = int(length * SR); t = np.arange(n) / SR
    f = 230 + 90 * np.sin(2 * np.pi * 1.3 * t) + 40 * np.sin(2 * np.pi * 7.1 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
    grit = (np.random.default_rng(3).random(n) < 0.035).astype(float) * 0.8
    s = (saw * 0.6 + grit) * (0.6 + 0.4 * np.sin(2 * np.pi * 11 * t) ** 2)
    return s * env(n, 0.08, 0.3)


# ---- Score ------------------------------------------------------------------------
# Dusk (0-12.5): Dm(add9) pad + sparse music box
add(pad([50, 57, 62, 64, 65], 13.5, attack=3, release=2.5, bright=0.3), 0.0, gain=0.55)
for k, note in enumerate([74, 77, 76, 72, 74, 69, 70, 69]):
    add(music_box(note), 1.0 + k * 1.45, pan=0.3 * np.sin(k), gain=0.22)
# Night (12.5-31): low drone + crickets + glow tone
add(pad([38, 45, 50], 19.0, attack=1.5, release=2.0, bright=0.1), 12.3, gain=0.6)
add(pad([62, 65, 69], 6.0, attack=0.6, release=3, bright=0.4), 13.55, gain=0.35)     # window lights
for k, note in enumerate([81, 77, 74, 76]):
    add(music_box(note, 3.0), 16.0 + k * 3.4, pan=-0.3 + 0.2 * k, gain=0.14)
crick = bandnoise(18.5, 4200, 5200, 5)
tt = np.arange(len(crick)) / SR
chirp = (np.sin(2 * np.pi * 24 * tt) > 0.6).astype(float) * (np.sin(2 * np.pi * 0.9 * tt) > -0.2)
add(crick * chirp * env(len(crick), 1.0, 1.0), 12.5, pan=-0.4, gain=0.05)
add(np.roll(crick, 4000) * np.roll(chirp, 9000) * env(len(crick), 1.0, 1.0), 12.5, pan=0.5, gain=0.04)
# Morning (31-38): wind, footsteps, porch, creak
wind = bandnoise(8.0, 120, 900, 9)
add(wind * env(len(wind), 1.0, 1.5) * (0.6 + 0.4 * np.sin(np.arange(len(wind)) / SR * 0.8)), 30.8, gain=0.12)
add(pad([41, 48, 53], 8.0, attack=1.0, release=1.5, bright=0.05), 30.8, gain=0.45)
tstep = 31.05
i = 0
while tstep < 36.3:
    wood = tstep > 35.7
    add(step(i, wood), tstep, pan=0.1 * (1 if i % 2 else -1), gain=0.5 if wood else 0.32)
    tstep += 0.4 if tstep < 34.6 else 0.36
    i += 1
add(creak(1.5), 36.45, pan=-0.2, gain=0.42)
# Inside (38-47): room tone + drone + slow music box
room = bandnoise(9.5, 60, 400, 21)
add(room * env(len(room), 0.5, 1.0), 37.9, gain=0.06)
add(pad([38, 45, 48, 53], 9.5, attack=1.2, release=1.5, bright=0.1), 37.9, gain=0.55)
for k, note in enumerate([69, 72, 70, 65, 69]):
    add(music_box(note, 3.0), 39.0 + k * 1.7, pan=0.25 * np.sin(k * 2), gain=0.17)
# Tension (47-54): rising cluster swell
sw = pad([50, 51, 57, 58, 62], 7.2, attack=6.0, release=0.4, bright=0.5)
add(sw * np.linspace(0.5, 1.0, len(sw)) ** 1.5, 47.0, gain=0.8)
add(bandnoise(1.0, 2000, 9000, 33) * np.linspace(0, 1, SR) ** 3, 53.1, gain=0.15)
# STING (54.1) + second hit on his face (57.0)
add(boom(), 54.1, gain=0.95)
add(pad([38, 44, 50, 51, 56], 5.5, attack=0.02, release=2.5, bright=0.7), 54.1, gain=0.85)
add(music_box(86, 4.0), 54.12, gain=0.25)
add(boom(3.0, 40), 57.0, gain=0.6)
add(pad([37, 44, 49, 50], 3.0, attack=0.05, release=1.8, bright=0.4), 57.0, gain=0.5)


# ---- Reverb + master ------------------------------------------------------------------
def reverb(x, seconds=2.6, wet=0.3, seed=1):
    n = int(seconds * SR)
    ir = np.random.default_rng(seed).standard_normal(n) * np.exp(-np.arange(n) / SR * 2.8)
    ir[0] = 0
    size = 1 << (len(x) + n - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
    y /= np.abs(y).max() + 1e-9
    return x * (1 - wet) + y * wet * np.abs(x).max()

L = reverb(L, seed=1); R = reverb(R, seed=2)
mix = np.stack([L, R], 1)
mix[-int(0.4 * SR):] *= np.linspace(1, 0, int(0.4 * SR))[:, None]
mix = mix / (np.abs(mix).max() + 1e-9) * 0.5
out = Path(__file__).with_name('music.wav')
sf.write(out, mix.astype(np.float32), SR)
print(f'wrote {out}')
