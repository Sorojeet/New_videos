#!/usr/bin/env python3
"""
THE STAR IN THE GARDEN — music + sound effects, synthesized (no samples needed).
Writes audio/music.wav (60 s, 48 kHz stereo). The renderer mixes it under the voiceover.

  0-20s   soft magical: warm pad + music-box arpeggio (D major)
  20-32s  garden comes alive: brighter arps + shimmer, sparkle on touch (21.2s)
  32-45s  warm & tender, GLASS CHIME as the jar closes (34.6s)
  45-56s  midnight: minor, slow, low drone; lid pops (48.3s)
  56.2s   SUDDEN MYSTERIOUS STING, then an unresolved ringing chord to the end
"""
import numpy as np
import soundfile as sf
from pathlib import Path

SR = 48000
DUR = 60.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)


def hz(note):  # MIDI -> Hz
    return 440.0 * 2 ** ((note - 69) / 12)


def add(sig, t0, pan=0.0, gain=1.0):
    i = int(t0 * SR)
    if i >= N: return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))


def env(n, a, d_total):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    return e * np.exp(-t / d_total)


def music_box(note, length=1.8):
    n = int(length * SR); t = np.arange(n) / SR; f = hz(note)
    s = (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 3)
         + 0.12 * np.sin(2 * np.pi * 3.93 * f * t) * np.exp(-t * 6))
    return s * env(n, 0.003, 0.55)


def chime(note, length=4.0):          # glass: inharmonic partials, long ring
    n = int(length * SR); t = np.arange(n) / SR; f = hz(note)
    parts = [(1, 1, 1.6), (2.76, 0.5, 1.1), (5.40, 0.3, 0.7), (8.93, 0.18, 0.45)]
    s = sum(a * np.sin(2 * np.pi * f * r * t + r) * np.exp(-t / d) for r, a, d in parts)
    return s * np.minimum(1, t / 0.002)


def pad(notes, length, attack=1.5, release=1.5, bright=0.3):
    n = int(length * SR); t = np.arange(n) / SR
    s = np.zeros(n)
    for note in notes:
        for det in (-0.08, 0.0, 0.07):
            f = hz(note + det)
            s += np.sin(2 * np.pi * f * t) + bright * 0.5 * np.sin(2 * np.pi * 2 * f * t) + bright * 0.2 * np.sin(2 * np.pi * 3 * f * t)
    e = np.minimum(1, t / attack) * np.minimum(1, (length - t) / release)
    return s * np.clip(e, 0, 1) / (len(notes) * 3)


def noise_swell(length, f_lo=800, f_hi=9000):
    n = int(length * SR)
    x = rng.standard_normal(n)
    spec = np.fft.rfft(x); fr = np.fft.rfftfreq(n, 1 / SR)
    spec[(fr < f_lo) | (fr > f_hi)] = 0
    y = np.fft.irfft(spec, n)
    return y / (np.abs(y).max() + 1e-9) * np.linspace(0, 1, n) ** 3


def boom(length=3.5):
    n = int(length * SR); t = np.arange(n) / SR
    f = 55 * np.exp(-t * 0.6) + 32
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / 1.1) * np.minimum(1, t / 0.005)


# ---- Harmony -------------------------------------------------------------------
# D major: Dmaj7, Bm7, Gmaj7, A6sus — 3 s per chord
prog = [[50, 57, 61, 64], [47, 54, 57, 62], [43, 50, 54, 59], [45, 52, 57, 59]]
arp_sets = [[74, 78, 81, 85, 81, 78], [71, 74, 78, 81, 78, 74], [67, 71, 74, 79, 74, 71], [69, 73, 76, 81, 76, 73]]

t = 0.0
i = 0
while t < 45.0:
    chord = prog[i % 4]
    bright = 0.25 if t < 20 else (0.5 if t < 32 else 0.3)
    add(pad(chord, 3.6, attack=1.0 if t > 0 else 2.5, release=1.2, bright=bright), t, pan=0.0, gain=0.55)
    arp = arp_sets[i % 4]
    step = 0.5 if t < 20 or t >= 32 else 0.25            # busier when the garden comes alive
    k = 0
    while k * step < 3.0:
        note = arp[k % len(arp)] + (12 if (20 <= t < 32 and k % 4 == 3) else 0)
        add(music_box(note), t + k * step, pan=0.35 * np.sin(k), gain=0.22 if step == 0.5 else 0.15)
        k += 1
    t += 3.0
    i += 1

# Shimmer layer while the garden glows (20-32 s)
for k in range(48):
    tt = 21.2 + k * 0.23 + rng.uniform(0, 0.1)
    if tt > 32: break
    add(music_box(rng.choice([86, 88, 90, 93, 95, 98]), 1.2), tt, pan=rng.uniform(-0.8, 0.8), gain=0.06)

# Sparkle glissando when Leo touches the star (21.2 s)
for k, note in enumerate([81, 85, 88, 90, 93, 97, 100, 102]):
    add(chime(note, 2.5), 21.0 + k * 0.06, pan=-0.6 + k * 0.17, gain=0.10)

# GLASS CHIME: jar lid closes (34.6 s)
add(chime(88, 4.5), 34.58, pan=0.1, gain=0.45)
add(chime(95, 3.5), 34.61, pan=-0.1, gain=0.22)

# ---- Midnight (45-56 s): B minor, slow, low drone -----------------------------------
night = [[47, 54, 59, 62], [43, 50, 55, 59], [40, 47, 52, 55], [42, 49, 54, 58]]   # Bm, G, Em, F#
for j, chord in enumerate(night):
    add(pad(chord, 3.4, attack=1.2, release=1.2, bright=0.15), 45.0 + j * 2.8, gain=0.5)
add(pad([35, 42], 11.5, attack=2.0, release=1.0, bright=0.05), 45.0, gain=0.5)          # drone
for k, note in enumerate([83, 81, 78, 74, 76, 78, 74, 71, 73, 74, 78]):                 # slow, uncertain music box
    add(music_box(note, 2.2), 45.4 + k * 0.95, pan=0.4 * np.sin(k * 1.3), gain=0.17)
# lid pops (48.3 s) + rising sparkle as the star escapes
add(chime(93, 1.5), 48.28, gain=0.25)
for k, note in enumerate([86, 90, 93, 98]):
    add(chime(note, 2.0), 48.5 + k * 0.12, pan=0.2 * k, gain=0.08)

# ---- STING (56.2 s): reverse swell -> hit -> dark unresolved chord ------------------
add(noise_swell(1.2), 55.0, gain=0.22)
add(boom(), 56.2, gain=0.9)
sting = [47, 53, 59, 60, 65]                         # B, F, B, C, F: tritones + minor 2nd
add(pad(sting, 3.9, attack=0.03, release=1.6, bright=0.6), 56.2, gain=0.85)
add(chime(71, 4.0), 56.2, pan=-0.3, gain=0.3)
add(chime(77, 4.0), 56.22, pan=0.3, gain=0.25)

# ---- Reverb (convolution with a decaying noise tail) + master --------------------------
def reverb(x, seconds=2.4, wet=0.28, seed=1):
    n = int(seconds * SR)
    ir = np.random.default_rng(seed).standard_normal(n) * np.exp(-np.arange(n) / SR * 3.2)
    ir[0] = 0
    m = len(x) + n
    size = 1 << (m - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
    y /= np.abs(y).max() + 1e-9
    return x * (1 - wet) + y * wet * np.abs(x).max()

L = reverb(L, seed=1); R = reverb(R, seed=2)
mix = np.stack([L, R], axis=1)
fade = np.ones(N); fade[-int(0.5 * SR):] = np.linspace(1, 0, int(0.5 * SR))
mix *= fade[:, None]
mix = mix / (np.abs(mix).max() + 1e-9) * 0.5          # about -6 dBFS peak
out = Path(__file__).with_name('music.wav')
sf.write(out, mix.astype(np.float32), SR)
print(f'wrote {out} ({DUR:.0f}s)')
