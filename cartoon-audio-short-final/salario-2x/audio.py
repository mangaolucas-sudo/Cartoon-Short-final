"""Music bed + SFX stems for salario-2x (voice is mixed by mix.py)."""
import numpy as np, subprocess, wave

SR = 48000
DUR = 1954 / 30
N = int(DUR * SR)
rng = np.random.default_rng(7)
t_all = np.arange(N) / SR

def load_voice():
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "voice.mp3", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
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

# ---------------- music ----------------
music = np.zeros(N, np.float32)
BPM = 100; beat = 60 / BPM
prog = [(57, [57, 60, 64]), (53, [53, 57, 60]), (50, [50, 53, 57]), (52, [52, 56, 59])]  # Am F Dm E
def pluck(f, dur=0.35, bright=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum((bright ** k) * np.sin(2 * np.pi * f * (k + 1) * t) / (k + 1) for k in range(6))
    return (s * env(n, 0.003, dur * 0.35)).astype(np.float32)
def pad(fs, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in fs: s += np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t + 0.5)
    a = np.minimum(1, t / 0.2) * np.minimum(1, (dur - t) / 0.2).clip(0)
    return lp_fast((s * a).astype(np.float32), 1400) / len(fs)
def brass(fs, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in fs:
        ph = 2 * np.pi * f * t + 0.003 * np.sin(2 * np.pi * 5 * t)
        s += sum(np.sin((k + 1) * ph) / (k + 1) ** 1.3 for k in range(8))
    a = np.minimum(1, t / 0.08) * np.minimum(1, (dur - t) / 0.15).clip(0)
    return lp_fast((s * a).astype(np.float32), 1800) / len(fs)
def drum(kind):
    if kind == "kick":
        n = int(0.3 * SR); t = np.arange(n) / SR; f = 50 + 80 * np.exp(-t * 30)
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10)).astype(np.float32)
    if kind == "hat":
        n = int(0.06 * SR); t = np.arange(n) / SR
        return hp_fast((rng.standard_normal(n) * np.exp(-t * 70)).astype(np.float32), 6000)
    n = int(0.16 * SR); t = np.arange(n) / SR
    s = rng.standard_normal(n) * np.exp(-t * 30) * 0.5 + np.sin(2 * np.pi * 200 * t) * np.exp(-t * 22) * 0.4
    return hp_fast(s.astype(np.float32), 300)
mel = [0, 2, 4, 2, 0, -1, 0, 2]
def groove(t0, t1, light=False):
    tt = t0; bar = 0
    while tt < t1 - 0.01:
        root, ch = prog[bar % 4]
        place(music, pad([midi(m) for m in ch], beat * 4 * 0.98), tt, 0.07)
        for b in range(8):
            tb = tt + b * beat / 2
            if tb >= t1: break
            if b % 4 == 0: place(music, drum("kick"), tb, 0.5)
            if b % 4 == 2 and not light: place(music, drum("snare"), tb, 0.25)
            place(music, drum("hat"), tb, 0.12 if b % 2 else 0.07)
            if b % 2 == 0: place(music, pluck(midi(root - 12), 0.32, 0.4), tb, 0.32)
            place(music, pluck(midi(ch[(mel[b] + 3 * 3) % 3] + 12 + (12 if light else 0)), 0.18, 0.7), tb + 0.02, 0.09)
        bar += 1; tt += beat * 4
def drone(t0, t1, g=0.09, pulse=False):
    n = int((t1 - t0) * SR); t = np.arange(n) / SR
    d = (np.sin(2 * np.pi * 55 * t) + 0.5 * np.sin(2 * np.pi * 82.4 * t) + 0.25 * np.sin(2 * np.pi * 116.5 * t)) * np.minimum(1, t / 0.6)
    if pulse: d *= 0.65 + 0.35 * (np.mod(t, beat) < beat * 0.45)
    place(music, lp_fast(d.astype(np.float32), 600), t0, g)
groove(0.0, 40.2)                 # story builds
drone(40.25, 44.2)                # "Ricardo gelou"
groove(44.2, 53.9, light=True)    # CTA
drone(53.9, 62.95, 0.13, pulse=True)  # dona Célia: tension a bit louder
for k in range(int((62.95 - 53.9) / beat)): place(music, drum('kick'), 53.9 + k * beat, 0.25)
groove(62.95, DUR + 2)            # loop back into the hook (no fade)
music = music[:N]

# ---------------- sfx ----------------
sfx = np.zeros(N, np.float32)
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

F = lambda f: f / 30
def buzz(d=0.5):
    n = int(d * SR); t = np.arange(n) / SR
    s = np.sign(np.sin(2 * np.pi * 150 * t)) * (np.mod(t, 0.25) < 0.17)
    return (lp_fast(s.astype(np.float32), 900) * 0.5).astype(np.float32)
def chime():
    n = int(0.9 * SR); t = np.arange(n) / SR
    a = np.sin(2 * np.pi * 1318 * t) * np.exp(-t * 7); b = np.sin(2 * np.pi * 1760 * t) * np.exp(-np.maximum(0, t - 0.11) * 7) * (t > 0.11)
    return ((a + b) * 0.4).astype(np.float32)
def kaching():
    s = ting(); n = len(s); t = np.arange(n) / SR
    s[: int(0.12 * SR)] += hp_fast(noise(0.12), 3000) * 0.5
    return s
def pop():
    n = int(0.12 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * (300 + 900 * t / 0.12) * t) * np.exp(-t * 30)).astype(np.float32)
def whisper(d):
    n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(lp_fast(noise(d), 5000), 1500) * 0.25 * (0.5 + 0.5 * np.sin(2 * np.pi * 3.1 * t) ** 2)).astype(np.float32)
def hum(d):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 250) * 0.6 + np.sin(2 * np.pi * 60 * t) * 0.05).astype(np.float32)
def tick(hi=True):
    n = int(0.05 * SR); t = np.arange(n) / SR
    return (hp_fast(noise(0.05), 2500) * np.exp(-t * 160) + np.sin(2 * np.pi * (2400 if hi else 1900) * t) * np.exp(-t * 120) * 0.6).astype(np.float32)
def stampfx():
    d = 0.45; n = int(d * SR); t = np.arange(n) / SR
    s = np.pad(thunk(75, 0.4), (0, n - int(0.4 * SR))) * 1.1 + lp_fast(noise(d), 3500) * np.exp(-t * 45) * 0.9   # wood thud + paper slap
    return s.astype(np.float32)
def msg():  # generic two-note message pop (not any app's real sound)
    out = np.zeros(int(0.35 * SR), np.float32)
    for k, (f0, t0) in enumerate([(880, 0.0), (1175, 0.11)]):
        n = int(0.16 * SR); t = np.arange(n) / SR; i = int(t0 * SR)
        out[i:i + n] += (np.sin(2 * np.pi * f0 * t) * np.exp(-t * 22) + 0.3 * np.sin(4 * np.pi * f0 * t) * np.exp(-t * 35)).astype(np.float32)
    return out * 0.6
def boom(f0=48, d=1.4):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f0 * t * (1 + 0.5 * np.exp(-t * 12))) * np.exp(-t * 2.5) * 1.2 + lp_fast(noise(d), 300) * np.exp(-t * 6) * 0.5).astype(np.float32)
def dun(m, d=0.9):
    n = int(d * SR); t = np.arange(n) / SR
    s = brass([midi(m), midi(m + 3), midi(m - 12)], d) * 2.0 + np.sin(2 * np.pi * midi(m - 24) * t) * np.exp(-t * 3) * 0.8
    return (s * np.exp(-t * 1.6)).astype(np.float32)
def gulp():
    d = 0.32; n = int(d * SR); t = np.arange(n) / SR
    f = 160 + 260 * np.exp(-((t - 0.12) / 0.05) ** 2)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-((t - 0.13) / 0.07) ** 2) + lp_fast(noise(d), 900) * 0.15 * np.exp(-((t - 0.12) / 0.06) ** 2)
    return s.astype(np.float32)
def register():  # cash drawer rattle + bell
    s = ting(); s[: int(0.15 * SR)] += (hp_fast(noise(0.15), 2500) * np.exp(-np.arange(int(0.15 * SR)) / SR * 25) * 0.7)
    r = np.zeros(int(0.12 * SR), np.float32); r[::int(0.012 * SR)] = 1; r = lp_fast(r, 4000) * 0.8
    return np.concatenate([r, s]).astype(np.float32)
def rustle(d):
    n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(lp_fast(noise(d), 7000), 1800) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 4.5 * t))) * np.minimum(1, t / 0.05) * np.exp(-t * 1.4) * 0.6).astype(np.float32)
def riser(d):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 2500) * (t / d) ** 2 * 0.6).astype(np.float32)
# 1) hook: one "plim" per Pix
place(sfx, chime(), 0.0, 0.55); place(sfx, chime(), F(20), 0.55)
for a, b in [(116, 429), (429, 665), (724, 1208), (1208, 1327)]: place(sfx, hum(F(b - a)), F(a), 0.15)
place(sfx, whoosh(0.5), F(112), 0.5)
place(sfx, pop(), F(200), 0.5); place(sfx, ting(), F(203), 0.3)
place(sfx, buzz(0.5), F(292), 0.45); place(sfx, chime(), F(336), 0.55)
place(sfx, whoosh(0.4), F(383), 0.5)
place(sfx, buzz(0.6), F(429), 0.5); place(sfx, chime(), F(431), 0.55)
place(sfx, thunk(160, 0.25), F(438), 0.5)
for f in (520, 534, 547): place(sfx, pop(), F(f), 0.4)
# 2) R$ 5.600: cha-ching
place(sfx, register(), F(586), 0.8)
place(sfx, whoosh(0.4), F(662), 0.45)
# 3) stamp hits the paper
place(sfx, stampfx(), F(689), 1.0)
place(sfx, whoosh(0.4), F(721), 0.45)
# 4) quiet clock tick-tock under the suspicion
for k, f in enumerate(range(724, 846, 15)): place(sfx, tick(k % 2 == 0), F(f), 0.35)
place(sfx, pop(), F(742), 0.35); place(sfx, pop(), F(770), 0.35)
place(sfx, whoosh(0.4), F(845), 0.45)
# 5) short whisper
place(sfx, whisper(1.3), F(852), 0.7)
place(sfx, whoosh(0.4), F(1022), 0.45)
# 6) group message pop + deep suspense "tum"
place(sfx, msg(), F(1055), 0.5); place(sfx, boom(52, 1.4), F(1113), 0.3)
# 7) "Ricardo gelou": dun dun dun + dry gulp
for k, (f, m) in enumerate([(1220, 45), (1232, 44), (1246, 41)]): place(sfx, dun(m, 1.1 if k == 2 else 0.5), F(f), 0.22)
place(sfx, gulp(), F(1312), 0.45)
# 8) split: whoosh as the boards enter, pop on each word, whoosh for the follow card
place(sfx, whoosh(0.4), F(1378), 0.6); place(sfx, pop(), F(1433), 0.6); place(sfx, pop(), F(1471), 0.6)
place(sfx, whoosh(0.4), F(1496), 0.5); place(sfx, ting(), F(1500), 0.3)
place(sfx, whoosh(0.5), F(1616), 0.45)
# 9) dona Célia: papers slip and fall
place(sfx, ting(), F(1770), 0.25)
place(sfx, sting(), F(1854), 0.3)
place(sfx, rustle(1.1), F(1857), 0.8); place(sfx, lp_fast(noise(0.12), 2500) * np.exp(-np.arange(int(0.12 * SR)) / SR * 40), F(1880), 0.5)
# 10) loop: soft whoosh into the hook, then a short riser that runs into the opening "plim" (no closing sound)
place(sfx, whoosh(0.5), F(1886), 0.4)
place(sfx, riser(F(1954 - 1928)), F(1928), 0.35)

def wav(name, x):
    with wave.open(name, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
mx = max(np.abs(music).max(), np.abs(sfx).max(), 1e-6)
wav("music.wav", music / mx * 0.9); wav("sfx.wav", sfx / mx * 0.9)
print("stems ok", N / SR)
