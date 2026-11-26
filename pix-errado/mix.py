"""Level-locked mix:  python3 mix.py voice.mp3 music.wav sfx.wav  ->  mix_raw.wav
Music = 50 % of the voice gated RMS (-6 dB). SFX gated RMS = 50 % of the voice (or less, via SFX_DB),
with SFX peaks limited to 0.7x the voice peak. No ducking, no compression: linear gains only."""
import sys, subprocess, wave, numpy as np, os
SR = 48000
def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()
def gated_rms(x, win=0.4, gate_db=-40):
    n = int(win * SR); k = len(x) // n
    if k == 0: return float(np.sqrt(np.mean(x ** 2)) + 1e-12)
    r = np.sqrt(np.mean(x[: k * n].reshape(k, n) ** 2, axis=1)); top = r.max()
    keep = r[r > top * 10 ** (gate_db / 20)]
    return float(np.sqrt(np.mean(keep ** 2)) + 1e-12)
db = lambda r: 20 * np.log10(r)
v, m, s = (load(p) for p in sys.argv[1:4])
N = len(v); m = np.pad(m, (0, max(0, N - len(m))))[:N]; s = np.pad(s, (0, max(0, N - len(s))))[:N]
rv = gated_rms(v)
gm = 0.5 * rv / gated_rms(m)
sfx_db = float(os.environ.get("SFX_DB", "-6"))
gs = 10 ** (sfx_db / 20) * rv / gated_rms(s)
gs = min(gs, 0.7 * np.abs(v).max() / (np.abs(s).max() + 1e-12))   # no SFX peak above 0.7x the voice peak
mix = v + m * gm + s * gs
peak = np.abs(mix).max()
if peak > 0.98: mix *= 0.98 / peak   # one linear gain on the whole mix (keeps every ratio)
print(f"voice gated RMS {db(rv):.1f} dBFS")
print(f"music vs voice: {db(gated_rms(m * gm) / rv):+.1f} dB (target -6.0)")
print(f"sfx   vs voice: {db(gated_rms(s * gs) / rv):+.1f} dB (target <= -6.0), sfx peak/voice peak {np.abs(s * gs).max() / np.abs(v).max():.2f}")
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
with wave.open("mix_raw.wav", "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print("mix_raw.wav", len(pcm) / SR, "s")
