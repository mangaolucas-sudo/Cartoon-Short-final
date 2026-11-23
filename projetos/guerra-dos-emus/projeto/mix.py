"""Mix voice + music + sfx with fixed level ratios.
music RMS (gated, where the music plays) = 50% of the gated voice RMS (-6 dB); sfx gated RMS <= 50%, sfx peaks <= 0.7x voice peak.
Only linear gains + one peak limiter on the sum. Usage: python3 mix.py voice.wav music.wav sfx.wav"""
import sys, subprocess, numpy as np, wave
SR = 48000
def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()
def grms(x, thr_db=-40):
    b = 2400; n = len(x) // b; e = np.sqrt((x[: n * b].reshape(n, b) ** 2).mean(1) + 1e-12)
    g = e[e > e.max() * 10 ** (thr_db / 20)]; return float(np.sqrt((g ** 2).mean()))
v, m, s = (load(p) for p in sys.argv[1:4]); N = max(len(v), len(m), len(s))
v, m, s = (np.pad(x, (0, N - len(x))) for x in (v, m, s))
rv = grms(v); m *= 0.5 * rv / grms(m)
gs = 0.5 * rv / grms(s, -30); s *= gs
pk = np.abs(s).max(); lim = 0.7 * np.abs(v).max()
if pk > lim: s *= lim / pk
mix = v + m + s
# peak limiter (fast attack, 80 ms release) on the sum only
pk = np.abs(mix); ceil = 0.98; g = np.minimum(1, ceil / np.maximum(pk, 1e-9)); rel = np.exp(-1 / (0.08 * SR))
gg = np.empty_like(g); acc = 1.0
for i in range(len(g)):
    acc = g[i] if g[i] < acc else min(1.0, g[i] + (acc - g[i]) * rel); gg[i] = acc
mix *= gg
with wave.open("mix_raw.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
db = lambda a, b: 20 * np.log10(a / b)
print(f"music {db(grms(m), rv):+.1f} dB vs voice, sfx {db(grms(s, -30), rv):+.1f} dB (gated RMS), sfx peak {np.abs(s).max() / np.abs(v).max():.2f}x voice peak")
