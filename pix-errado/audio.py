"""Synthesized music bed + SFX stems for "O Bento resolve #1 – Pix errado". Writes music.wav and sfx.wav (mono, 48 kHz).
Levels are NOT set here: mix.py locks music to 50 % of the voice (gated RMS) and SFX to <= 50 %."""
import numpy as np, wave

SR = 48000
TOTAL = 2358
DUR = TOTAL / 30
N = int(round(DUR * SR))
rng = np.random.default_rng(11)
F = lambda f: f / 30

def write(name, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(name, "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())

def env(n, a=0.005, r=0.2):
    t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)
def lp(x, c):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / (1 + (f / c) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)
def hp(x, c):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 - 1 / (1 + (f / c) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)
def place(buf, sig, t0, gain=1.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if i < 0: sig = sig[-i:]; j = min(N, len(sig)); i = 0
    if i < N and j > i: buf[i:j] += sig[: j - i] * gain
def noise(d): return rng.standard_normal(int(d * SR)).astype(np.float32)
midi = lambda m: 440 * 2 ** ((m - 69) / 12)

# ---------------- music: light, curious pizzicato bed (minor -> brighter after the reveal) ----------------
music = np.zeros(N, np.float32)
BPM = 112; beat = 60 / BPM
def pluck(f, dur=0.3, bright=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum((bright ** k) * np.sin(2 * np.pi * f * (k + 1) * t) / (k + 1) for k in range(6))
    return (s * env(n, 0.002, dur * 0.3)).astype(np.float32)
def pad(fs, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in fs: s += np.sin(2 * np.pi * f * t + 0.002 * np.sin(2 * np.pi * 4.5 * t)) + 0.3 * np.sin(4 * np.pi * f * t)
    a = np.minimum(1, t / 0.25) * np.minimum(1, (dur - t) / 0.3).clip(0)
    return lp((s * a).astype(np.float32), 1400) / len(fs)
def kick():
    n = int(0.3 * SR); t = np.arange(n) / SR; f = 50 + 80 * np.exp(-t * 30)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10)).astype(np.float32)
def shaker():
    n = int(0.08 * SR); t = np.arange(n) / SR; return hp(rng.standard_normal(n).astype(np.float32) * np.exp(-t * 60), 4000)

MINOR = [(57, [57, 60, 64]), (53, [53, 57, 60]), (50, [50, 53, 57]), (52, [52, 56, 59])]   # Am F Dm E
MAJOR = [(60, [60, 64, 67]), (57, [57, 60, 64]), (53, [53, 57, 60]), (55, [55, 59, 62])]   # C Am F G
def section(t0, t1, prog, drums=True):
    bar = 0; tt = t0
    while tt < t1:
        root, ch = prog[bar % 4]
        place(music, pad([midi(m) for m in ch], min(beat * 4, t1 - tt)), tt, 0.08)
        for b in range(8):
            tb = tt + b * beat / 2
            if tb >= t1: break
            m = ch[(b * 2 + bar) % 3] + (12 if b % 2 else 0)
            place(music, pluck(midi(m + 12), 0.22, 0.55), tb, 0.12 if b % 2 else 0.16)
            if drums and b % 4 == 0: place(music, kick(), tb, 0.35)
            if drums: place(music, shaker(), tb + beat / 4, 0.05)
        place(music, pluck(midi(root - 12), 0.5, 0.35), tt, 0.3); place(music, pluck(midi(root - 12), 0.4, 0.35), tt + 2 * beat, 0.22)
        bar += 1; tt += beat * 4
def fade(t0, t1, up=False):
    i0, i1 = int(t0 * SR), int(t1 * SR); r = np.linspace(0, 1, i1 - i0) if up else np.linspace(1, 0, i1 - i0)
    music[i0:i1] *= r ** 2

SILENCE_A, SILENCE_B = F(1421), F(1524)   # short silence in scene 6
section(0, SILENCE_A + 0.3, MINOR)
fade(SILENCE_A - 0.25, SILENCE_A + 0.05); music[int((SILENCE_A + 0.05) * SR):int(SILENCE_B * SR)] = 0
tmp = music.copy(); music[:] = 0
section(SILENCE_B, DUR + 1, MAJOR)
i = int(SILENCE_B * SR); tmp[i:] = 0; music += tmp
fade(SILENCE_B, SILENCE_B + 0.6, up=True)

# ---------------- sfx ----------------
sfx = np.zeros(N, np.float32)
def tap():
    d = 0.06; n = int(d * SR); t = np.arange(n) / SR
    return (hp(noise(d), 1800) * np.exp(-t * 90) * 0.8 + np.sin(2 * np.pi * 1400 * t) * np.exp(-t * 120) * 0.4).astype(np.float32)
def plim():
    out = np.zeros(int(0.9 * SR), np.float32)
    for k, (f, t0) in enumerate([(1568, 0), (2093, 0.09)]):
        n = int(0.8 * SR); t = np.arange(n) / SR
        s = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)) * env(n, 0.003, 0.22)
        i = int(t0 * SR); out[i:i + n] += s[: len(out) - i].astype(np.float32) * 0.6
    return out
def ring(d):
    n = int(d * SR); t = np.arange(n) / SR
    tone = (np.sin(2 * np.pi * 1320 * t) + np.sin(2 * np.pi * 1660 * t)) * 0.5 * (np.sin(2 * np.pi * 20 * t) > 0)
    gate = ((t % 1.6) < 0.4) | (((t % 1.6) > 0.55) & ((t % 1.6) < 0.95))   # "trrim trrim"
    return lp((tone * gate).astype(np.float32), 5000) * 0.6
def error():
    out = []
    for f in (330, 262):
        n = int(0.18 * SR); t = np.arange(n) / SR
        s = np.sign(np.sin(2 * np.pi * f * t)) * 0.4 * np.minimum(1, (0.18 - t) / 0.02); out.append(lp(s.astype(np.float32), 2500)); out.append(np.zeros(int(0.04 * SR), np.float32))
    return np.concatenate(out)
def tick(hi=True):
    d = 0.05; n = int(d * SR); t = np.arange(n) / SR
    return (hp(noise(d), 2500 if hi else 1500) * np.exp(-t * 140) + np.sin(2 * np.pi * (2600 if hi else 1900) * t) * np.exp(-t * 160) * 0.5).astype(np.float32)
def whoosh(d=0.35):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp(noise(d), 2200) * np.sin(np.pi * t / d) ** 2 * 0.5).astype(np.float32)
def notif():
    out = np.zeros(int(0.7 * SR), np.float32)
    for f, t0 in [(1047, 0), (1319, 0.1), (1568, 0.2)]:
        n = int(0.45 * SR); t = np.arange(n) / SR; s = np.sin(2 * np.pi * f * t) * env(n, 0.003, 0.12)
        i = int(t0 * SR); out[i:i + n] += s.astype(np.float32) * 0.5
    return out
def impact():
    d = 1.6; n = int(d * SR); t = np.arange(n) / SR
    low = np.sin(2 * np.pi * (38 + 30 * np.exp(-t * 8)) * t) * np.exp(-t * 2.2)
    hit = lp(noise(d), 700) * np.exp(-t * 7) * 0.7
    return (low + hit).astype(np.float32)
def ding():
    n = int(1.4 * SR); t = np.arange(n) / SR
    return (sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in [(1760, 3), (2637, 4.5), (3520, 6)]) * 0.3).astype(np.float32)
def pop():
    d = 0.12; n = int(d * SR); t = np.arange(n) / SR; f = 900 * np.exp(-t * 18) + 250
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30)).astype(np.float32)
def stomp():
    d = 0.35; n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 70 * t * (1 + 0.5 * np.exp(-t * 40))) * np.exp(-t * 14) + lp(noise(d), 900) * np.exp(-t * 30) * 0.5).astype(np.float32)

# scene 1: key tap on the wrong digit (frame 0) + Pix "plim" when it is sent
place(sfx, tap(), F(0), 0.8)
place(sfx, tap(), F(96), 0.6)
place(sfx, plim(), F(104), 0.8)
# scene 2: phone ringing while "Seu Jorge" calls
place(sfx, ring(F(428) - F(352)), F(352), 0.55)
# scene 3: tap on Contestar, error buzz with the red warning
place(sfx, tap(), F(670), 0.7)
place(sfx, error(), F(721), 0.65)
# scene 5: clock tick-tock while the days pass, page flips, then notification + dramatic hit
for k, f in enumerate(range(1127, 1209, 6)): place(sfx, tick(k % 2 == 0), F(f), 0.55)
place(sfx, whoosh(0.3), F(1150), 0.4); place(sfx, whoosh(0.3), F(1182), 0.4)
place(sfx, notif(), F(1213), 0.75)
place(sfx, impact(), F(1216), 0.9)
# scene 6: short silence (music cut in the bed, no sfx)
# scene 7: reveal "ding" on "Devolver"
place(sfx, ding(), F(1753), 0.7)
# scene 8: a "pop" for each option + a soft stomp
place(sfx, pop(), F(2020), 0.8); place(sfx, pop(), F(2056), 0.8)
place(sfx, stomp(), F(2049), 0.35)
# scene 9: typing the key again, one tap per digit (loop lands on the frame-0 tap)
for k in range(1, 11): place(sfx, tap(), F(2290 + (k - 1) * 5.6), 0.5)

write("music.wav", music)
write("sfx.wav", sfx)
print("stems ok", N / SR)
