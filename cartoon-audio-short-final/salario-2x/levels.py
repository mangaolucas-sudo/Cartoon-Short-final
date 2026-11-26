# per-window check: every 0.4 s window of SFX and music vs the voice's gated RMS (after mix.py gains)
import numpy as np, subprocess
SR = 48000
def load(p): return np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32).copy()
src = open('mix.py').read(); exec(src[src.index('def grms'):src.index('v, m, s =')])
v, m, s = load('voice.mp3'), load('music.wav'), load('sfx.wav'); N = len(v); m = np.pad(m, (0, N))[:N]; s = np.pad(s, (0, N))[:N]
rv = grms(v)
def wmax(x, w=int(0.4 * SR)): k = len(x) // w; return float(np.sqrt((x[:k * w].reshape(k, w) ** 2).mean(1)).max())
m *= min(0.5 * rv / grms(m), 10 ** (-4 / 20) * rv / wmax(m))
s *= min(0.42 * rv / grms(s), 10 ** (-6 / 20) * rv / wmax(s), 0.7 * np.abs(v).max() / max(np.abs(s).max(), 1e-9))
w = int(0.4 * SR); k = N // w; R = lambda x: np.sqrt((x[:k * w].reshape(k, w) ** 2).mean(1))
rs, rm = R(s), R(m)
print("loudest SFX windows:", ", ".join(f"{i*0.4:.1f}s {20*np.log10(rs[i]/rv):+.1f}dB" for i in np.argsort(-rs)[:5]))
print("loudest music windows:", ", ".join(f"{i*0.4:.1f}s {20*np.log10(rm[i]/rv):+.1f}dB" for i in np.argsort(-rm)[:3]))
