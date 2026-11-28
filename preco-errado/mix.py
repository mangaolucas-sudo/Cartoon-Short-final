"""Mixa voz (-14 LUFS) + SFX + ambiência por cenário + trilha leve -> video/out/<nome>_mix.wav
Todos os sons são sintetizados aqui (sem bancos de áudio externos).
Se existir ./assets/musica/*, usa esse arquivo como trilha no lugar da trilha sintetizada."""
import json, os, glob, subprocess, sys
import numpy as np, pyloudnorm as pyln, soundfile as sf

SR = 48000
rng = np.random.default_rng(7)


def load(path):
    b = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                       capture_output=True, check=True).stdout
    return np.frombuffer(b, np.float32).astype(np.float64)


def tt(d): return np.arange(int(SR * d)) / SR
def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
def noise(d): return rng.normal(0, 1, int(SR * d))
def lp(x, fc):
    """passa-baixa de 1 polo (fc pode ser vetor)"""
    a = np.exp(-2 * np.pi * np.broadcast_to(np.asarray(fc, float), x.shape) / SR)
    y = np.zeros_like(x); s = 0.0
    for i in range(len(x)):
        s = a[i] * s + (1 - a[i]) * x[i]; y[i] = s
    return y
def lpf(x, fc):  # rápido, fc fixo
    from scipy.signal import butter, lfilter
    b, a = butter(2, fc / (SR / 2), "low"); return lfilter(b, a, x)
def hpf(x, fc):
    from scipy.signal import butter, lfilter
    b, a = butter(2, fc / (SR / 2), "high"); return lfilter(b, a, x)
def bpf(x, lo, hi):
    from scipy.signal import butter, lfilter
    b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], "band"); return lfilter(b, a, x)
def sweep(f0, f1, d, curve=1.0):
    t = tt(d); u = (t / d) ** curve
    f = f0 + (f1 - f0) * u
    return np.sin(2 * np.pi * np.cumsum(f) / SR)
def norm(s, db): return s / (np.max(np.abs(s)) + 1e-9) * 10 ** (db / 20)
def place(dst, src, t0):
    i = int(t0 * SR)
    if i < 0: src = src[-i:]; i = 0
    if i >= len(dst): return
    s = src[: len(dst) - i]; dst[i:i + len(s)] += s


# ---------------- efeitos ----------------
def s_tick(g=0):
    n = int(SR * .05); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * 2600 * t) * env(n, .0005, .008) + rng.normal(0, 1, n) * env(n, .0003, .003) * .5
    return norm(s, -20 + g)

def s_impact():
    n = int(SR * .9); t = np.arange(n) / SR
    f = 30 + 110 * np.exp(-t / .06)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .001, .25)
    nz = lpf(rng.normal(0, 1, n) * env(n, .001, .03), 3000)
    metal = np.sin(2 * np.pi * 620 * t) * np.sin(2 * np.pi * 931 * t) * env(n, .001, .08)
    return norm(boom + nz * 1.2 + metal * .25, -7)

def s_glass():
    d = 1.0; out = np.zeros(int(SR * d))
    out[: int(SR * .25)] += hpf(noise(.25), 2500) * env(int(SR * .25), .001, .05)
    for k in range(40):
        f = rng.uniform(2500, 9000); t0 = rng.exponential(.12)
        n = int(SR * .12); t = np.arange(n) / SR
        place(out, np.sin(2 * np.pi * f * t) * env(n, .0005, .02 + rng.uniform(0, .03)) * rng.uniform(.3, 1), t0)
    return norm(out, -12)

def s_riser(d=1.0):
    t = tt(d); u = t / d
    s = hpf(noise(d), 400) * u ** 2 * .6 + sweep(200, 1400, d, 2) * u ** 2.5 * .4
    return norm(s, -16)

def s_paper():
    d = .45; n = int(SR * d); t = np.arange(n) / SR
    am = (0.5 + 0.5 * np.sin(2 * np.pi * 22 * t + 3 * np.sin(2 * np.pi * 3 * t))) ** 2
    s = bpf(noise(d), 1500, 6000) * am * np.sin(np.pi * t / d)
    return norm(s, -22)

def s_thud():
    n = int(SR * .25); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * (70 + 60 * np.exp(-t / .02)) * t) * env(n, .001, .06) + lpf(rng.normal(0, 1, n), 900) * env(n, .001, .02) * .6
    return norm(s, -18)

def s_pop():
    s = sweep(380, 950, .07) * env(int(SR * .07), .001, .03)
    return norm(np.concatenate([s, np.zeros(1000)]), -15)

def s_stamp():
    n = int(SR * .35); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * (60 + 120 * np.exp(-t / .015)) * t) * env(n, .001, .08) + bpf(rng.normal(0, 1, n), 600, 4000) * env(n, .0005, .02)
    return norm(s, -10)

def s_projector(d):
    out = np.zeros(int(SR * d)); click = hpf(noise(.008), 1500) * env(int(SR * .008), .0002, .002)
    for k in range(int(d * 24)): place(out, click * (1 if k % 2 else .6), k / 24)
    out += lpf(noise(d), 600) * .05
    return norm(out, -30)

def s_scratch():
    d = .45; t = tt(d)
    f = 900 + 700 * np.sin(2 * np.pi * 2.2 * t) ** 2
    s = bpf(noise(d), 400, 3000) * .5 + np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .25
    s = lpf(s, 3500) * np.sin(np.pi * t / d)
    return norm(s, -14)

def s_boing():
    d = .6; t = tt(d)
    f = 220 * (1 + .35 * np.sin(2 * np.pi * 11 * t) * np.exp(-t / .25)) * (1 - .3 * t)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), .003, .25), -18)

def s_snip():
    out = np.zeros(int(SR * .3))
    for t0 in (0, .055):
        n = int(SR * .09); t = np.arange(n) / SR
        c = hpf(rng.normal(0, 1, n), 3000) * env(n, .0002, .004) + np.sin(2 * np.pi * 4200 * t) * env(n, .0003, .03) * .5
        place(out, c, t0)
    return norm(out, -13)

def s_clink():
    n = int(SR * .35); t = np.arange(n) / SR
    s = sum(g * np.sin(2 * np.pi * f * t) for f, g in [(2800, 1), (4150, .7), (6300, .5), (7900, .3)]) * env(n, .0003, .07)
    return norm(s, -20)

def s_flip():
    d = .14; s = bpf(noise(d), 800, 5000) * np.sin(np.pi * tt(d) / d) ** .5
    return norm(s, -18)

def s_kachunk():
    n = int(SR * .2); t = np.arange(n) / SR
    s = hpf(rng.normal(0, 1, n), 2000) * env(n, .0002, .005) * .8
    s += np.sin(2 * np.pi * (90 + 80 * np.exp(-t / .01)) * t) * env(n, .001, .04)
    s[int(SR * .045):] += (hpf(rng.normal(0, 1, n), 2500) * env(n, .0002, .004) * .5)[: n - int(SR * .045)]
    return norm(s, -14)

def s_whoosh(d=.38, db=-17):
    t = tt(d); x = noise(d)
    fc = 300 + 3500 * np.sin(np.pi * t / t[-1]) ** 2
    return norm(lp(x, fc) * np.clip(np.sin(np.pi * t / t[-1]), 0, 1) ** 1.5, db)

def s_ding():
    n = int(SR * 1.0); t = np.arange(n) / SR
    bell = sum(g * np.sin(2 * np.pi * f * t) for f, g in [(2093, 1), (2637, .6), (3136, .4), (4186, .25)])
    s = bell * env(n, .002, .28)
    t2 = np.arange(int(SR * .5)) / SR
    s2 = sum(g * np.sin(2 * np.pi * f * t2) for f, g in [(2637, 1), (3520, .5)]) * env(len(t2), .002, .2)
    off = int(SR * .09); s[off:off + len(s2)] += s2 * .7
    return norm(s, -12)

def s_register():
    s = np.zeros(int(SR * 1.0))
    place(s, s_ding() * 1.2, .12)
    place(s, lpf(noise(.18), 1500) * env(int(SR * .18), .002, .06) * .05, 0)
    return s

def s_crumble():
    d = 1.0; out = np.zeros(int(SR * d))
    for k in range(160):
        t0 = rng.uniform(0, .8) ** 1.3; n = int(SR * .01)
        place(out, bpf(rng.normal(0, 1, n), 1200, 7000) * env(n, .0002, .002) * rng.uniform(.2, 1), t0)
    return norm(out, -16)

def s_wind(d):
    t = tt(d); s = lpf(noise(d), 700) * (0.5 + 0.5 * np.sin(2 * np.pi * .7 * t)) * np.sin(np.pi * t / d)
    return norm(s, -24)

def s_chime():
    out = np.zeros(int(SR * 1.2))
    for k, f in enumerate([1568, 1976, 2349, 3136, 3951]):
        n = int(SR * .8); t = np.arange(n) / SR
        place(out, (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * 2 * f * t)) * env(n, .002, .25), k * .055)
    return norm(out, -19)

def s_creak():
    d = .55; t = tt(d); f = 170 + 40 * np.sin(2 * np.pi * 3 * t) + rng.normal(0, 8, len(t))
    s = bpf(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 300, 2500) * np.sin(np.pi * t / d)
    return norm(s, -24)

def s_heartbeat(d, t_abs):
    out = np.zeros(int(SR * d))
    def beat():
        n = int(SR * .18); t = np.arange(n) / SR
        return np.sin(2 * np.pi * (48 + 30 * np.exp(-t / .02)) * t) * env(n, .002, .05)
    k0 = int(np.ceil(t_abs * 1.6))
    while k0 / 1.6 < t_abs + d:
        tb = k0 / 1.6 - t_abs
        place(out, beat(), tb); place(out, beat() * .6, tb + .17); k0 += 1
    return norm(out, -12)

def s_drumroll(d):
    out = np.zeros(int(SR * (d + .2))); t = 0.0
    while t < d:
        u = t / d; n = int(SR * .05)
        hit = bpf(rng.normal(0, 1, n), 1500, 7000) * env(n, .0005, .012) * (0.25 + 0.75 * u ** 1.5)
        hit += np.sin(2 * np.pi * 190 * np.arange(n) / SR) * env(n, .0005, .01) * .5 * (0.3 + .7 * u)
        place(out, hit, t); t += .085 - .045 * u
    return norm(out, -15)

def s_cymbal():
    d = 2.0; s = hpf(noise(d), 4000) * env(int(SR * d), .001, .55)
    s[: int(SR * .2)] += np.sin(2 * np.pi * 55 * tt(.2)) * env(int(SR * .2), .001, .07) * 3
    return norm(s, -12)

def s_cheer(d):
    t = tt(d); out = np.zeros(len(t))
    for k in range(10):  # vozes "êêê"
        f0 = rng.uniform(250, 600)
        vib = f0 * (1 + .03 * np.sin(2 * np.pi * rng.uniform(4, 7) * t))
        v = np.sign(np.sin(2 * np.pi * np.cumsum(vib) / SR)) * .3
        out += bpf(v, 500, 2500) * (0.5 + .5 * np.sin(2 * np.pi * rng.uniform(.5, 2) * t + rng.uniform(0, 6)))
    for k in range(int(d * 40)):  # palmas
        n = int(SR * .02); place(out, bpf(rng.normal(0, 1, n), 800, 5000) * env(n, .0005, .006) * rng.uniform(.5, 2), rng.uniform(0, d - .05))
    out *= np.minimum(1, t / .15) * np.minimum(1, (d - t) / .6)
    return norm(out, -20)

def s_counter(d):
    out = np.zeros(int(SR * (d + .1))); t = 0.0
    while t < d:
        u = t / d; place(out, s_tick(-2) * (.5 + .5 * u), t); t += .09 - .07 * u
    return out

def s_shrink(d):
    d = max(.3, d); t = tt(d)
    f = 1300 * (200 / 1300) ** (t / d) * (1 + .02 * np.sin(2 * np.pi * 9 * t))
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / .03) * np.minimum(1, (d - t) / .05), -19)

def s_chalk():
    d = .55; t = tt(d)
    am = (np.abs(np.sin(2 * np.pi * 7 * t)) ** .5)
    s = bpf(noise(d), 2500, 8000) * am * np.sin(np.pi * t / d)
    return norm(s, -24)

def s_blip(n=0):
    f = 523.25 * 2 ** ([0, 2, 4, 5, 7, 9, 11, 12][n % 8] / 12)
    k = int(SR * .12); t = np.arange(k) / SR
    return norm((np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * 2 * f * t)) * env(k, .002, .05), -20)

def s_confetti():
    s = np.zeros(int(SR * 1.2)); place(s, s_pop() * 2, 0)
    place(s, s_crumble() * .4, .05)
    return s

def s_click():
    n = int(SR * .04); return norm(hpf(rng.normal(0, 1, n), 2000) * env(n, .0002, .004), -16)

def s_firework():
    out = np.zeros(int(SR * 1.6))
    n = int(SR * .5); t = np.arange(n) / SR
    out[:n] += np.sin(2 * np.pi * (90 + 70 * np.exp(-t / .03)) * t) * env(n, .001, .12) * 1.5
    out[:n] += lpf(rng.normal(0, 1, n), 2000) * env(n, .001, .05)
    for k in range(60):
        m = int(SR * .008); place(out, hpf(rng.normal(0, 1, m), 3000) * env(m, .0002, .002) * rng.uniform(.1, .6), .15 + rng.exponential(.3))
    return norm(out, -12)



# ---------------- efeitos do EP "Preço errado" ----------------
def s_beep():
    n = int(SR * .14); t = np.arange(n) / SR
    return norm(np.sign(np.sin(2 * np.pi * 2900 * t)) * 0.5 * np.minimum(1, t / .003) * np.minimum(1, (t[-1] - t) / .01), -16)

def s_buzz():
    n = int(SR * .35); t = np.arange(n) / SR
    s = lpf(np.sign(np.sin(2 * np.pi * 110 * t)) + .5 * np.sign(np.sin(2 * np.pi * 165 * t)), 1800) * np.minimum(1, t / .005) * np.minimum(1, (t[-1] - t) / .03)
    return norm(s, -15)

def s_hmpf():
    d = .3; t = tt(d)
    return norm(bpf(noise(d), 300, 1400) * np.sin(np.pi * t / d) ** 2 + np.sin(2 * np.pi * 180 * t) * .2 * np.sin(np.pi * t / d), -22)

def s_womp():
    d = .9; t = tt(d)
    f = 220 * (1 - .45 * t / d)
    s = lpf(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 900) * np.minimum(1, t / .02) * np.exp(-t / .5)
    return norm(s, -17)

def s_step():
    n = int(SR * .12); t = np.arange(n) / SR
    return norm(lpf(rng.normal(0, 1, n), 1200) * env(n, .001, .02) + np.sin(2 * np.pi * 90 * t) * env(n, .001, .03), -22)

def s_trombone():
    out = np.zeros(int(SR * 2.2))
    for k, (f0, d) in enumerate([(311, .35), (294, .35), (277, .35), (262, 1.0)]):
        t = tt(d); vib = 1 + (.03 * np.sin(2 * np.pi * 6 * t) if k == 3 else 0)
        tone = sum(np.sin(2 * np.pi * f0 * h * vib * t) / h for h in (1, 2, 3, 4)) * np.minimum(1, t / .03) * np.minimum(1, (d - t) / .06)
        place(out, lpf(tone, 2000), k * .38)
    return norm(out, -16)

def s_tada():
    out = np.zeros(int(SR * 1.2))
    for k, f in enumerate([523, 659, 784, 1047]):
        t = tt(.9 - k * .1)
        place(out, sum(np.sin(2 * np.pi * f * h * t) / h for h in (1, 2, 3)) * env(len(t), .005, .35), k * .07)
    return norm(out, -15)

def s_pen(d=1.0):
    t = tt(d); am = np.abs(np.sin(2 * np.pi * 5 * t)) ** .6
    return norm(bpf(noise(d), 1500, 6000) * am * np.sin(np.pi * t / d), -24)

def s_alarm(d=1.6):
    t = tt(d); f = np.where((t * 4) % 1 < .5, 880, 660)
    return norm(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .5 * np.minimum(1, (d - t) / .05), -21)

def s_gavel():
    n = int(SR * .5); t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * 180 * t) + .5 * np.sin(2 * np.pi * 420 * t)) * env(n, .0005, .06) + lpf(rng.normal(0, 1, n), 3000) * env(n, .0005, .01)
    return norm(s, -10)

# ---------------- ambiências ----------------
def amb(kind, d, t_abs):
    d = max(d, .05); t = tt(d); n = len(t)
    if kind == "night":
        cr = np.sin(2 * np.pi * 4300 * t) * (np.sin(2 * np.pi * 28 * t) > .3) * (np.sin(2 * np.pi * .9 * t) > 0)
        s = cr * .25 + lpf(noise(d), 250) * 1.0
    elif kind == "drone":
        s = np.sin(2 * np.pi * 55 * t) + .6 * np.sin(2 * np.pi * 82.4 * t + np.sin(2 * np.pi * .2 * t)) + lpf(noise(d), 300) * .3
    elif kind == "machine":
        s = lpf(noise(d), 1200) * .3
        for k in range(int(d * 2.5) + 1):
            m = int(SR * .15); place(s, np.sin(2 * np.pi * 55 * np.arange(m) / SR) * env(m, .002, .05), k / 2.5 - (t_abs % .4))
        s += hpf(noise(d), 5000) * .05 * (np.sin(2 * np.pi * 2.5 * t) > .8)
    elif kind == "room":
        s = lpf(noise(d), 500)
    elif kind == "wind":
        s = lpf(noise(d), 500) * (.6 + .4 * np.sin(2 * np.pi * .4 * t))
    elif kind == "tvhum":
        s = sum(np.sin(2 * np.pi * 60 * h * t) / h for h in (1, 2, 3, 5)) * .5 + hpf(noise(d), 3000) * .15
    elif kind == "clock":
        s = lpf(noise(d), 400) * .3
        k0 = int(np.ceil(t_abs))
        while k0 < t_abs + d:
            m = int(SR * .02); place(s, hpf(rng.normal(0, 1, m), 2500) * env(m, .0002, .003) * (3 if k0 % 2 else 2.2), k0 - t_abs); k0 += 1
    elif kind == "hum":
        s = sum(np.sin(2 * np.pi * 120 * h * t) / h for h in (1, 2, 3)) * .4 + lpf(noise(d), 600) * .5
        for k in range(int(d / 1.3)):
            m = int(SR * .08); place(s, np.sin(2 * np.pi * 1850 * np.arange(m) / SR) * .3, rng.uniform(0, d))
    elif kind == "rain":
        s = hpf(noise(d), 1500) * .6 + lpf(noise(d), 400) * .4
    elif kind == "crowd":
        s = np.zeros(n)
        for k in range(8):
            s += bpf(noise(d), 300, 1500) * (.5 + .5 * np.sin(2 * np.pi * rng.uniform(1, 4) * t + rng.uniform(0, 6)))
    else:
        s = lpf(noise(d), 400)
    fade = int(SR * .12)
    w = np.ones(n); w[:fade] = np.linspace(0, 1, min(fade, n))[: n]; w[-fade:] *= np.linspace(1, 0, min(fade, n))
    rms = np.sqrt(np.mean(s ** 2)) + 1e-9
    level = {"night": -34, "drone": -32, "machine": -31, "room": -40, "wind": -36, "tvhum": -38, "clock": -34,
             "hum": -37, "crowd": -33, "rain": -30}.get(kind, -38)
    return s / rms * 10 ** (level / 20) * w


# ---------------- trilha leve sintetizada ----------------
def music(T):
    bpm = 92; beat = 60 / bpm; bar = 4 * beat
    chords = [[50, 57, 60, 64, 69], [43, 55, 59, 62, 65], [48, 55, 59, 62, 64], [45, 55, 60, 64, 67]]  # Dm9 G13 Cmaj9 Am7
    n = int(SR * (T + 2)); out = np.zeros(n)
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)
    def ep(f, d, g):  # piano elétrico
        k = int(SR * d); t = np.arange(k) / SR
        return (np.sin(2 * np.pi * f * t + .8 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / .3)) * env(k, .004, .9) * g)
    nb = int(np.ceil(T / bar)) + 1
    for b in range(nb):
        ch = chords[b % 4]; t0 = b * bar
        for hit, g in [(0, 1), (1.5, .6), (2.5, .8)]:
            for m in ch[1:]: place(out, ep(hz(m), 1.6, .10 * g), t0 + hit * beat)
        k = int(SR * bar); t = np.arange(k) / SR  # baixo
        place(out, np.sin(2 * np.pi * hz(ch[0] - 12) * t) * np.minimum(1, t / .02) * np.exp(-t / 1.6) * .35, t0)
        for i in range(8):  # arpejo pluck
            m = ch[1 + (i * 3) % 4] + 12; kk = int(SR * .4); tp = np.arange(kk) / SR
            place(out, np.sin(2 * np.pi * hz(m) * tp) * env(kk, .002, .12) * .05, t0 + i * beat / 2)
        for i in range(4):  # kick suave + shaker
            if i in (0, 2):
                kk = int(SR * .3); tp = np.arange(kk) / SR
                place(out, np.sin(2 * np.pi * (50 + 60 * np.exp(-tp / .03)) * tp) * env(kk, .002, .1) * .45, t0 + i * beat)
            for j in range(2):
                kk = int(SR * .05); place(out, hpf(rng.normal(0, 1, kk), 6000) * env(kk, .002, .015) * (.08 if j else .05), t0 + (i + j / 2) * beat)
    return out[: int(SR * T)]


def render_event(e, T):
    k = e["k"]; d = e.get("d", 0)
    if k == "tick": return s_tick(e.get("g", 0))
    if k == "riser": return s_riser(d)
    if k == "projector": return s_projector(d)
    if k == "wind": return s_wind(d)
    if k == "heartbeat": return s_heartbeat(d, e["t"])
    if k == "drumroll": return s_drumroll(d)
    if k == "cheer": return s_cheer(d)
    if k == "counter": return s_counter(d)
    if k == "shrink": return s_shrink(d)
    if k == "blip": return s_blip(e.get("n", 0))
    if k == "whoosh": return s_whoosh()
    if k == "whoosh_s": return s_whoosh(.3, -18)
    if k == "swish": return s_whoosh(.22, -23)
    if k == "amb": return amb(e["a"], d, e["t"])
    if k == "pen": return s_pen(d)
    if k == "alarm": return s_alarm(d)
    return {"impact": s_impact, "glass": s_glass, "paper": s_paper, "thud": s_thud, "pop": s_pop, "stamp": s_stamp,
            "scratch": s_scratch, "boing": s_boing, "snip": s_snip, "clink": s_clink, "flip": s_flip, "kachunk": s_kachunk,
            "ding": s_ding, "register": s_register, "crumble": s_crumble, "chime": s_chime, "creak": s_creak,
            "cymbal": s_cymbal, "chalk": s_chalk, "confetti": s_confetti, "click": s_click, "firework": s_firework,
            "beep": s_beep, "buzz": s_buzz, "hmpf": s_hmpf, "womp": s_womp, "step": s_step, "trombone": s_trombone,
            "tada": s_tada, "gavel": s_gavel}[k]()


def mix(name):
    data = json.load(open(f"video/src/data/{name}.json"))
    meter = pyln.Meter(SR)
    T = data["frames"] / 30
    n = round(T * SR)
    v = load(f"narracao_{name}.mp3")
    v = np.pad(v, (0, max(0, n - len(v))))[:n]
    lv = meter.integrated_loudness(np.stack([v, v], 1))
    v = v * 10 ** ((-14 - lv) / 20)
    fx = np.zeros(n)
    for e in data["sfx"]:
        place(fx, render_event(e, T), e["t"])
    # trilha: -27 LUFS, some no suspense e volta na revelação
    mus_files = sorted(glob.glob("assets/musica/*"))
    m = load(mus_files[0]) if mus_files else music(T)
    m = np.tile(m, int(np.ceil(n / len(m))))[:n]
    m *= 10 ** ((-27 - meter.integrated_loudness(np.stack([m, m], 1))) / 20)
    g = np.ones(n)
    if data.get("duck"):
        a, b = int(data["duck"][0] * SR), int(data["duck"][1] * SR)
        g[a:b] = np.linspace(1, .15, b - a)
        r = int(.8 * SR); g[b:b + r] = np.linspace(1.4, 1, r)
    out = v + fx + m * g
    os.makedirs("video/out", exist_ok=True)
    raw = f"video/out/{name}_raw.wav"; sf.write(raw, np.stack([out, out], 1).astype(np.float32), SR, subtype="FLOAT")
    fin = f"video/out/{name}_mix.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", "alimiter=limit=0.89:level=false:attack=2:release=60",
                    "-ar", str(SR), fin], check=True)
    y, _ = sf.read(fin)
    print(f"{name}: voz {meter.integrated_loudness(np.stack([v, v], 1)):.2f} LUFS (orig {lv:.1f}); "
          f"trilha {meter.integrated_loudness(np.stack([m * g, m * g], 1)):.1f} LUFS; "
          f"mix final {meter.integrated_loudness(y):.2f} LUFS, pico {20*np.log10(np.max(np.abs(y))):.1f} dBFS; "
          f"{len(data['sfx'])} eventos de som")


for nm in sys.argv[1:] or ["youtube", "tiktok"]: mix(nm)
