#!/usr/bin/env python3
"""mix.py voice.mp3 music.wav sfx.wav -> mix_raw.wav
Music at 50% (-6 dB) of the voice's gated RMS, SFX at <=50% with peaks <= 0.7x voice peak.
Only linear gains + one peak limiter on the sum (no ducking, no compression)."""
import sys, subprocess, numpy as np, wave
SR = 48000
def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()
def grms(x, rel=-40):
    n = int(0.05 * SR); k = len(x) // n; b = x[: k * n].reshape(k, n); r = np.sqrt((b ** 2).mean(1) + 1e-12)
    thr = r.max() * 10 ** (rel / 20); g = r[r > thr]; return float(np.sqrt((g ** 2).mean())) if len(g) else 1e-9
v, m, s = (load(p) for p in sys.argv[1:4]); N = len(v)
m = np.pad(m, (0, max(0, N - len(m))))[:N]; s = np.pad(s, (0, max(0, N - len(s))))[:N]
rv = grms(v); m *= 0.5 * rv / grms(m)
gs = 0.5 * rv / grms(s); gs = min(gs, 0.7 * np.abs(v).max() / max(np.abs(s).max(), 1e-9)); s *= gs
db = lambda a, b: 20 * np.log10(a / b)
print(f"music vs voice: {db(grms(m), rv):+.1f} dB | sfx vs voice: {db(grms(s), rv):+.1f} dB | sfx peak/voice peak {np.abs(s).max() / np.abs(v).max():.2f}")
x = v + m + s
# peak limiter: gain envelope with 5 ms lookahead / 80 ms release, ceiling -1 dBFS
c = 10 ** (-1 / 20); need = np.minimum(1, c / np.maximum(np.abs(x), 1e-9))
L = int(0.005 * SR); from numpy.lib.stride_tricks import sliding_window_view as sw
need = sw(np.pad(need, (0, L), constant_values=1), L + 1).min(1)
g = np.empty_like(need); a = 1.0; rel = 1 - np.exp(-1 / (0.08 * SR))
for i in range(len(need)): a = need[i] if need[i] < a else a + (need[i] - a) * rel; g[i] = a
x *= g
with wave.open("mix_raw.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
print("mix_raw.wav", N / SR, "s")
