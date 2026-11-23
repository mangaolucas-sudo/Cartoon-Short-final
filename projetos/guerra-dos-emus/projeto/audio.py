"""Synthesized music bed + SFX for the emu war short, mixed under voice.wav."""
import numpy as np, subprocess, wave

SR = 48000
DUR = 10196 / 30
N = int(DUR * SR)
rng = np.random.default_rng(7)
t_all = np.arange(N) / SR

def load_voice():
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "voice.wav", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    v = np.frombuffer(raw, np.float32).copy()
    out = np.zeros(N, np.float32); out[:min(N, len(v))] = v[:N]; return out

def env(n, a=0.005, r=0.2, sus=None):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)
    return e

def lp(x, k):  # one-pole low-pass, k in (0,1)
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)): acc += k * (x[i] - acc); y[i] = acc
    return y

def lp_fast(x, cutoff):
    # FFT brick-ish low-pass (fast, fine for beds)
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)

def hp_fast(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 - 1 / (1 + (f / cutoff) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)

def place(buf, sig, t0, gain=1.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if i < N and j > i: buf[i:j] += sig[: j - i] * gain

midi = lambda m: 440 * 2 ** ((m - 69) / 12)

def pluck(f, dur=0.35, bright=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum((bright ** k) * np.sin(2 * np.pi * f * (k + 1) * t) / (k + 1) for k in range(6))
    return (s * env(n, 0.003, dur * 0.35)).astype(np.float32)
def brass(fs, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in fs:
        ph = 2 * np.pi * f * t + 0.003 * np.sin(2 * np.pi * 5 * t)
        s += sum(np.sin((k + 1) * ph) / (k + 1) ** 1.3 for k in range(8))
    a = np.minimum(1, t / 0.08) * np.minimum(1, (dur - t) / 0.15).clip(0)
    return lp_fast((s * a).astype(np.float32), 1800) / len(fs)
def drum(kind):
    if kind == "kick":
        n = int(0.35 * SR); t = np.arange(n) / SR; f = 50 + 90 * np.exp(-t * 30)
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)).astype(np.float32)
    n = int(0.18 * SR); t = np.arange(n) / SR
    s = rng.standard_normal(n) * np.exp(-t * 28) * 0.6 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 20) * 0.5
    return hp_fast(s.astype(np.float32), 300)


def noise(d): return rng.standard_normal(int(d * SR)).astype(np.float32)
def thunk(f0=90, d=0.3):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f0 * t * (1 + 0.6 * np.exp(-t * 40))) * np.exp(-t * 14) + lp_fast(noise(d), 1200) * np.exp(-t * 30) * 0.5).astype(np.float32)
def rumble(d):
    n = int(d * SR); t = np.arange(n) / SR
    s = lp_fast(noise(d), 160) * 3 * np.minimum(1, t / 0.15) * np.exp(-t / (d * 0.45))
    return s.astype(np.float32)
def crash(d=1.2):
    n = int(d * SR); t = np.arange(n) / SR; s = np.zeros(n, np.float32)
    for k in range(14):
        tk = rng.uniform(0, d * 0.6); i = int(tk * SR); g = thunk(rng.uniform(60, 160), 0.35) * rng.uniform(0.3, 0.9)
        s[i:i + len(g)] += g[: n - i]
    s += lp_fast(noise(d), 2500) * np.exp(-t * 3) * 0.25
    return s
def cuckoo():
    out = []
    for f, d in [(740, 0.16), (587, 0.24)]:
        n = int(d * SR); t = np.arange(n) / SR
        out.append(np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.01) * np.exp(-t * 6)); out.append(np.zeros(int(0.06 * SR)))
    return np.concatenate(out).astype(np.float32)
def scrape(d=0.8):
    n = int(d * SR); t = np.arange(n) / SR
    s = noise(d) * (0.5 + 0.5 * np.sin(2 * np.pi * 13 * t)) * np.sin(np.pi * t / d)
    s = hp_fast(lp_fast(s, 5000), 1500)
    ring = np.sin(2 * np.pi * 1870 * t) * np.exp(-t * 3) * 0.2
    return (s * 0.6 + ring).astype(np.float32)
def ting():
    n = int(1.2 * SR); t = np.arange(n) / SR
    return (sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in [(2093, 4), (3136, 6), (4186, 8)]) * 0.3).astype(np.float32)
def sting():
    n = int(2.0 * SR); t = np.arange(n) / SR
    low = np.sin(2 * np.pi * 41 * t) * np.exp(-t * 1.5) * 1.2
    hit = lp_fast(noise(2.0), 900) * np.exp(-t * 6) * 0.8
    stab = brass([midi(45), midi(48), midi(51)], 1.4); s = low + hit; s[: len(stab)] += stab * 2.2 * np.exp(-np.arange(len(stab)) / SR * 2)
    return s.astype(np.float32)
def creak(d=0.6, f0=140):
    n = int(d * SR); t = np.arange(n) / SR
    rate = f0 * (1 + 0.35 * np.sin(2 * np.pi * 1.3 * t / d))
    ph = np.cumsum(rate) / SR; pulses = (np.mod(ph, 1) < 0.08).astype(np.float32)
    s = lp_fast(pulses * (0.6 + 0.4 * rng.random(n).astype(np.float32)), 2200) * np.sin(np.pi * t / d)
    return hp_fast(s, 200) * 2.5
def snap():
    d = 0.5; n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(noise(d), 800) * np.exp(-t * 18) * 1.4 + np.pad(thunk(120, 0.4), (0, n - int(0.4 * SR))) * 0.6).astype(np.float32)
def splash(d=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    s = lp_fast(noise(d), 4000) * (np.exp(-t * 4) * np.minimum(1, t / 0.01)) + lp_fast(noise(d), 400) * np.exp(-t * 7) * 1.5
    return s.astype(np.float32)
def whoosh(d=0.5):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 1500) * np.sin(np.pi * t / d) ** 2 * 0.6).astype(np.float32)
def snore(d=1.1):
    n = int(d * SR); t = np.arange(n) / SR
    buzz = (np.mod(np.cumsum(60 + 25 * np.sin(np.pi * t / d)) / SR, 1) < 0.3).astype(np.float32)
    return (lp_fast(buzz * 0.5 + noise(d) * 0.15, 700) * np.sin(np.pi * t / d) ** 2).astype(np.float32)
def leaves(d):
    n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(lp_fast(noise(d), 6000), 2500) * (0.3 + 0.3 * np.sin(2 * np.pi * 0.7 * t) ** 2) * np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.4)).astype(np.float32)
def water(d):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 900) * 0.5 + hp_fast(lp_fast(noise(d), 3000), 1200) * 0.15 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.4 * t))).astype(np.float32)


# ---------------- music: sections by frame, each a little generator ----------------
music = np.zeros(N, np.float32)
F = lambda f: f / 30
def tuba(f, d):
    n = int(d * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * (k + 1) * t) / (k + 1) ** 1.6 for k in range(5))
    return (lp_fast((s * np.minimum(1, t / 0.02) * np.exp(-t * 3.5)).astype(np.float32), 900) * 1.2)
def pad(fs, d):
    n = int(d * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in fs: s += np.sin(2 * np.pi * f * t + 0.4 * np.sin(2 * np.pi * 0.3 * t)) + 0.3 * np.sin(4 * np.pi * f * t)
    a = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.6).clip(0)
    return lp_fast((s * a / len(fs)).astype(np.float32), 1200)
def hat():
    n = int(0.06 * SR); t = np.arange(n) / SR
    return (hp_fast(rng.standard_normal(n).astype(np.float32), 6000) * np.exp(-t * 60) * 0.5)
G = {"C": [48, [60, 64, 67]], "G": [43, [55, 59, 62]], "Am": [45, [57, 60, 64]], "F": [41, [53, 57, 60]], "Dm": [50, [62, 65, 69]], "E": [40, [56, 59, 64]], "D": [50, [62, 66, 69]], "Em": [52, [64, 67, 71]], "Bb": [46, [58, 62, 65]], "Eb": [51, [63, 67, 70]]}
def section(a, b, style, prog, bpm, vol=1.0, tr=0):
    t0, t1 = F(a), F(b + 1); beat = 60 / bpm; buf = np.zeros(int((t1 - t0 + 3) * SR), np.float32)
    def pl(sig, t, g):
        i = int(t * SR); j = min(len(buf), i + len(sig))
        if 0 <= i < len(buf): buf[i:j] += sig[: j - i] * g
    tt, bar = 0.0, 0
    while tt < t1 - t0:
        root, ch = G[prog[bar % len(prog)]]; root += tr; ch = [c + tr for c in ch]
        if style == "march":
            pl(brass([midi(m) for m in ch], beat * 4 * 0.95), tt, 0.08)
            for k in range(4):
                tb = tt + k * beat; pl(drum("kick" if k % 2 == 0 else "snare"), tb, 0.45 if k % 2 == 0 else 0.28)
                pl(tuba(midi(root - 12 + (7 if k % 2 else 0)), beat * 0.8), tb, 0.5)
            if bar % 2: [pl(brass([midi(m + 12)], beat * 0.4), tt + 2 * beat + i * beat / 2, 0.06) for i, m in enumerate(ch)]
        elif style == "folk":
            for k in range(4):
                tb = tt + k * beat; pl(pluck(midi(root - 12 if k % 2 == 0 else root - 5), 0.5, 0.4), tb, 0.38)
                for j, m in enumerate(ch): pl(pluck(midi(m + 12), 0.25, 0.7), tb + beat / 2 + j * 0.015, 0.07)
            pl(pad([midi(m) for m in ch], beat * 4), tt, 0.05)
        elif style == "comic":  # staccato bassoon-ish bounce + woodblock
            for k in range(8):
                tb = tt + k * beat / 2
                if k % 2 == 0: pl(tuba(midi(root - 12 + [0, 7, 12, 7][k // 2]), beat * 0.35), tb, 0.55)
                else: pl(pluck(midi(ch[(k // 2) % 3] + 12), 0.12, 0.8), tb, 0.16)
                pl(thunk(900, 0.06) * 0.4, tb, 0.1 if k % 2 else 0.0)
        elif style == "chase":
            for k in range(8):
                tb = tt + k * beat / 2; pl(tuba(midi(root - 12 + (7 if k % 2 else 0)), beat * 0.3), tb, 0.5)
                pl(drum("snare"), tb, 0.12 if k % 2 else 0.2); pl(hat(), tb + beat / 4, 0.3)
                pl(pluck(midi(ch[k % 3] + 24), 0.1, 0.9), tb, 0.08)
            pl(brass([midi(m + 12) for m in ch], beat * 2), tt, 0.05)
        elif style == "pad":
            pl(pad([midi(m - 12) for m in ch] + [midi(root - 12)], beat * 4.2), tt, 0.16)
            pl(pluck(midi(ch[bar % 3] + 12), 1.2, 0.3), tt, 0.05)
        elif style == "suspense":
            pl(pad([midi(root - 12), midi(root - 11)], beat * 4.2), tt, 0.14)
            for k in range(4): pl(thunk(55, 0.4), tt + k * beat, 0.35)
            for k in range(8): pl(pluck(midi(ch[0] + 12), 0.08, 0.9), tt + k * beat / 2, 0.06)
        bar += 1; tt += beat * 4
    L = int((t1 - t0) * SR); buf = buf[:L]; fd = int(0.25 * SR)
    buf[:fd] *= np.linspace(0, 1, fd); buf[-fd:] *= np.linspace(1, 0, fd)
    place(music, buf * vol, t0)

S = [  # (a, b, style, progression, bpm, vol, transpose)
  (0, 176, "march", ["Am", "F", "G", "E"], 100, 1.0, 0),
  (210, 262, "pad", ["Am"], 60, 0.8, 0),
  (263, 677, "folk", ["G", "C", "D", "G"], 104, 1.0, 0),
  (678, 974, "pad", ["Am", "Dm", "Am", "E"], 64, 1.0, 0),
  (975, 1060, "suspense", ["Am"], 72, 1.0, 0),
  (1061, 2172, "comic", ["C", "G", "Am", "F"], 116, 1.0, 0),
  (2173, 3347, "march", ["C", "F", "G", "C"], 108, 1.0, 2),
  (3348, 3578, "pad", ["Dm", "Am", "Bb", "Am"], 60, 1.0, 0),
  (3579, 3946, "march", ["Dm", "Bb", "C", "Dm"], 112, 0.9, 0),
  (3947, 4309, "comic", ["F", "C", "G", "C"], 124, 1.0, 0),
  (4310, 4702, "suspense", ["Dm", "Dm", "Bb", "E"], 84, 1.0, 0),
  (4833, 4992, "comic", ["C", "Am", "F", "G"], 92, 0.8, 0),
  (4993, 5154, "march", ["G", "D", "Em", "D"], 112, 1.0, 0),
  (5155, 5799, "chase", ["Am", "G", "F", "E"], 150, 1.0, 0),
  (5865, 6367, "suspense", ["Em", "Em", "C", "D"], 70, 0.9, 0),
  (6368, 6780, "pad", ["Am", "F", "Dm", "E"], 66, 0.9, 0),
  (6781, 7373, "comic", ["F", "C", "Dm", "G"], 128, 1.0, 0),
  (7374, 7787, "folk", ["Am", "Dm", "G", "C"], 100, 0.9, 0),
  (7788, 8199, "march", ["Dm", "G", "C", "F"], 104, 0.85, 0),
  (8200, 8572, "pad", ["C", "Am", "F", "G"], 70, 0.9, 0),
  (8573, 8933, "march", ["C", "G", "F", "G"], 96, 1.1, 0),
  (8934, 9681, "folk", ["G", "Em", "C", "D"], 96, 1.0, 0),
  (9682, 10136, "march", ["C", "F", "G", "C"], 104, 1.1, 0),
]
for a, b, st, pr, bpm, v, tr in S: section(a, b, st, pr, bpm, v, tr)

# ---------------- sfx cues ----------------
sfx = np.zeros(N, np.float32)
def boing(d=0.6, f0=180):
    n = int(d * SR); t = np.arange(n) / SR; f = f0 + 140 * np.sin(2 * np.pi * 8 * t) * np.exp(-t * 4)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4) * 0.8).astype(np.float32)
def pop():
    n = int(0.12 * SR); t = np.arange(n) / SR; f = 600 - 3000 * t
    return (np.sin(2 * np.pi * np.cumsum(np.maximum(f, 120)) / SR) * np.exp(-t * 30)).astype(np.float32)
def shot():
    n = int(0.11 * SR); t = np.arange(n) / SR
    return (lp_fast(noise(0.11), 3000) * np.exp(-t * 45) * 1.2 + np.sin(2 * np.pi * 70 * t) * np.exp(-t * 35)).astype(np.float32)
def burst(d, rate=12):
    s = np.zeros(int(d * SR), np.float32)
    for k in range(int(d * rate)):
        g = shot() * (0.8 + 0.2 * rng.random()); i = int(k / rate * SR); s[i:i + len(g)] += g[: len(s) - i]
    return s
def click():
    n = int(0.08 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 80) + hp_fast(noise(0.08), 3000) * np.exp(-t * 70) * 0.5).astype(np.float32)
def slide(d=0.7, f0=900, f1=160):
    n = int(d * SR); t = np.arange(n) / SR; f = f0 * (f1 / f0) ** (t / d)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) * 0.6).astype(np.float32)
def motor(d):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast((np.mod(t * 34, 1) < 0.3).astype(np.float32) * 0.7 + noise(d) * 0.25, 420) * np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.4)).astype(np.float32)
def rain(d):
    n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(lp_fast(noise(d), 7000), 1500) * 0.45 * np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.6)).astype(np.float32)
def steps(d, rate=6, f0=140):
    s = np.zeros(int(d * SR), np.float32)
    for k in range(int(d * rate)):
        g = thunk(f0 * (0.8 + 0.4 * rng.random()), 0.12) * (0.5 + 0.5 * rng.random()); i = int((k + rng.random() * 0.4) / rate * SR); s[i:i + len(g)] += g[: len(s) - i]
    return s
def squawk(d=0.45):
    n = int(d * SR); t = np.arange(n) / SR; f = 420 + 160 * np.sin(2 * np.pi * 9 * t)
    buzz = (np.mod(np.cumsum(f) / SR, 1) < 0.35).astype(np.float32)
    return (lp_fast(buzz - 0.35, 2200) * np.sin(np.pi * t / d) * 0.9).astype(np.float32)
def drumbeat(d=0.12): return lp_fast(noise(d), 300) * np.exp(-np.arange(int(d * SR)) / SR * 30) * 2
def chalk(d=0.5):
    n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(noise(d), 2500) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * t)) * np.sin(np.pi * t / d) * 0.5).astype(np.float32)
def horn(): return slide(0.5, 520, 560) + slide(0.5, 780, 820) * 0.5
def coin():
    n = int(0.5 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 2637 * t) * np.exp(-t * 9) * 0.5 + np.sin(2 * np.pi * 3951 * t) * np.exp(-t * 12) * 0.3).astype(np.float32)
def fanfare():
    s = np.zeros(int(1.6 * SR), np.float32)
    for k, m in enumerate([60, 64, 67, 72]):
        g = brass([midi(m)], 0.5 if k < 3 else 1.0); i = int(k * 0.16 * SR); s[i:i + len(g)] += g[: len(s) - i] * 2
    return s

P = lambda sig, f, g=1.0: place(sfx, sig, F(f), g)
P(whoosh(0.8), 30, 0.4); P(thunk(70, 0.4), 176, 0.7); P(slide(0.8, 500, 180), 180, 0.35)
P(boing(), 212, 0.7); P(sting(), 214, 0.6); P(whoosh(1.2), 262, 0.45)
P(steps(2.0, 4), 385, 0.3); P(pop(), 610, 0.9); P(slide(0.9, 300, 1400), 642, 0.3)
P(slide(1.2, 900, 120), 760, 0.45); P(creak(0.5, 160), 845, 0.6); P(boing(0.5, 300), 860, 0.3)
P(whoosh(1.5), 907, 0.3)
for i in range(9): P(pop(), 1000 + i * 4, 0.45)
P(sting(), 1030, 0.5)
P(steps(4.0, 22, 110), 1061, 0.35); P(steps(4.2, 30, 90), 1179, 0.35)
P(ting(), 1306, 0.4); P(ting(), 1350, 0.3); P(whoosh(1.4), 1392, 0.4); P(ting(), 1545, 0.4)
P(rumble(3.0), 1611, 0.7); P(steps(3.2, 30, 100), 1611, 0.4)
P(slide(1.6, 200, 900), 1780, 0.25); P(boing(0.4, 250), 1832, 0.4)
P(whoosh(0.5), 1905, 0.8); P(slide(0.6, 1200, 400), 1906, 0.3)
for f in (2010, 2018, 2026): P(thunk(80, 0.3), f, 0.8)
P(snap(), 2058, 0.7); P(creak(0.6, 140), 2060, 0.5)
for i in range(4): P(boing(0.3, 420), 2105 + i * 12, 0.25)
P(thunk(60, 0.3), 2195, 0.4); P(horn(), 2318, 0.3)
P(whoosh(0.8), 2362, 0.3); P(thunk(90, 0.4), 2542, 0.8)
P(thunk(70, 0.4), 2603, 1.0); P(ting(), 2606, 0.5)
P(click(), 2866, 0.9); P(pop(), 2868, 0.5)
P(steps(3.0, 14, 900) * 0.3, 2900, 0.5)
P(thunk(80, 0.3), 3022, 0.4); P(whoosh(1.2), 3103, 0.35); P(boing(0.5, 220), 3270, 0.6)
P(rain(F(3578 - 3348)), 3348, 0.7)
P(rumble(1.2), 3352, 0.4)
P(ting(), 3600, 0.3); P(steps(4, 6), 3740, 0.3)
P(burst(F(3992 - 3953), 15), 3953, 0.9); P(squawk(), 4006, 0.5); P(squawk(), 4018, 0.4)
P(whoosh(1.0), 4096, 0.6); P(steps(3.5, 30, 110), 4096, 0.35)
P(horn(), 4218, 0.4); P(pop(), 4220, 0.6)
P(whoosh(0.6), 4310, 0.6); P(steps(4.0, 20, 90), 4440, 0.4)
P(burst(F(4789 - 4705), 15), 4705, 0.9); P(thunk(140, 0.3), 4790, 1.0); P(click(), 4792, 0.8); P(slide(1.0, 700, 150), 4796, 0.3)
P(steps(5, 5, 120), 4834, 0.3)
P(thunk(80, 0.3), 5045, 0.4)
P(motor(F(5864 - 5155)), 5155, 0.6)
for f in range(5305, 5506, 14): P(thunk(60, 0.25), f, 0.5)
P(steps(5, 25, 100), 5507, 0.35); P(squawk(), 5702, 0.6); P(whoosh(0.4), 5705, 0.6)
P(crash(1.4), 5800, 0.9); P(snap(), 5802, 0.6); P(ting(), 5812, 0.25)
P(squawk(0.6), 6242, 0.8); P(whoosh(1.2), 6262, 0.6); P(steps(2, 30, 110), 6262, 0.35); P(ting(), 6332, 0.4)
P(whoosh(0.5), 6368, 0.6); P(chalk(0.6), 6470, 0.5); P(chalk(0.8), 6622, 0.5); P(boing(0.5, 260), 6605, 0.4)
for i in range(3): P(whoosh(0.5), 6781 + i * 26, 0.6); P(thunk(200, 0.15), 6795 + i * 26, 0.5)
P(thunk(90, 0.3), 7140, 0.3); P(ting(), 7232, 0.5); P(pop(), 7232, 0.5)
for f in (7279, 7310, 7335): P(ting(), f, 0.4)
P(motor(4.0), 7380, 0.4); P(squawk(), 7520, 0.3); P(motor(1.9), 7730, 0.5)
P(burst(1.0, 12), 8040, 0.5)
for f in range(8100, 8160, 12): P(chalk(0.25), f, 0.6)
P(chalk(0.6), 8356, 0.5); P(sting(), 8512, 0.4)
P(whoosh(0.6), 8934, 0.6)
for i in range(5): P(coin(), 9213 + i * 12, 0.6)
for f in range(9320, 9412, 6): P(click(), f, 0.25)
P(motor(3.0), 9437, 0.35); P(steps(5, 25, 100), 9682, 0.35)
P(fanfare(), 9864, 0.5); P(pop(), 9937, 0.6); P(pop(), 9967, 0.6)
P(steps(1.0, 4, 120), 10060, 0.3); P(sting(), 10137, 0.55); P(ting(), 10176, 0.5); P(pop(), 10180, 0.6); P(horn(), 10180, 0.3)

def save(name, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(name, "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
pk = max(np.abs(music).max(), np.abs(sfx).max(), 1e-6)
save("music.wav", music / pk * 0.9); save("sfx.wav", sfx / pk * 0.9); print("stems ok", DUR)
