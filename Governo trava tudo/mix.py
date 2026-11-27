"""Mixa voz (-14 LUFS) + SFX (+ trilha opcional de ./assets/musica a -24 LUFS) -> video/out/<nome>_mix.wav"""
import json, os, glob, subprocess, sys
import numpy as np, pyloudnorm as pyln, soundfile as sf

SR = 48000
rng = np.random.default_rng(7)

def load(path):
    b = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                       capture_output=True, check=True).stdout
    return np.frombuffer(b, np.float32).astype(np.float64)

def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)

def ding():
    n = int(SR * 1.0); t = np.arange(n) / SR
    bell = sum(g * np.sin(2 * np.pi * f * t) for f, g in [(2093, 1), (2637, .6), (3136, .4), (4186, .25)])
    s = bell * env(n, .002, .28)
    click = rng.normal(0, 1, int(SR * .03)) * np.exp(-np.arange(int(SR * .03)) / (SR * .006))
    s[:len(click)] += click * .8
    t2 = np.arange(int(SR * .5)) / SR  # segundo toque "ka-ching"
    s2 = sum(g * np.sin(2 * np.pi * f * t2) for f, g in [(2637, 1), (3520, .5)]) * env(len(t2), .002, .2)
    off = int(SR * .09); s[off:off + len(s2)] += s2 * .7
    return s

def impact():
    n = int(SR * .9); t = np.arange(n) / SR
    f = 30 + 110 * np.exp(-t / .06)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .001, .25)
    noise = rng.normal(0, 1, n) * env(n, .001, .03)
    k = np.ones(40) / 40; noise = np.convolve(noise, k, "same")
    metal = np.sin(2 * np.pi * 620 * t) * np.sin(2 * np.pi * 931 * t) * env(n, .001, .08)
    return boom + noise * 1.2 + metal * .25

def whoosh():
    n = int(SR * .38); t = np.arange(n) / SR
    x = rng.normal(0, 1, n)
    out = np.zeros(n); y = 0.0
    fc = 300 + 3500 * np.sin(np.pi * t / t[-1]) ** 2  # filtro passa-baixa varrendo
    a = np.exp(-2 * np.pi * fc / SR)
    for i in range(n):
        y = a[i] * y + (1 - a[i]) * x[i]; out[i] = y
    return out * np.clip(np.sin(np.pi * t / t[-1]), 0, 1) ** 1.5

def peak_to(s, db): return s / np.max(np.abs(s)) * 10 ** (db / 20)

SFX = {"ding": peak_to(ding(), -11), "impact": peak_to(impact(), -7), "whoosh": peak_to(whoosh(), -17)}

def events(data):
    ev = []
    for i, s in enumerate(data["scenes"]):
        if i: ev.append(("whoosh", s["start"] - 0.12))
        if s["id"] == "s1": ev.append(("impact", s["cues"]["trava"]))
        if s["id"] == "s4":
            ev.append(("ding", s["cues"]["saque"])); ev.append(("impact", s["cues"]["resto"]))
    return ev

def mix(name):
    data = json.load(open(f"video/src/data/{name}.json"))
    meter = pyln.Meter(SR)
    v = load(f"narracao_{name}.mp3")
    n = round(data["frames"] / 30 * SR)
    v = np.pad(v, (0, max(0, n - len(v))))[:n]
    lv = meter.integrated_loudness(np.stack([v, v], 1))  # medido no arquivo final (estéreo)
    v = v * 10 ** ((-14 - lv) / 20)
    out = v.copy()
    for k, at in events(data):
        i = max(0, int(at * SR)); s = SFX[k][: n - i]; out[i:i + len(s)] += s
    mus = sorted(glob.glob("assets/musica/*"))
    if mus:
        m = load(mus[0]); m = np.tile(m, int(np.ceil(n / len(m))))[:n]
        m *= 10 ** ((-24 - meter.integrated_loudness(np.stack([m, m], 1))) / 20)
        out += m
    os.makedirs("video/out", exist_ok=True)
    raw = f"video/out/{name}_raw.wav"; sf.write(raw, np.stack([out, out], 1).astype(np.float32), SR, subtype="FLOAT")
    print(f"  pico antes do limitador: {20*np.log10(np.max(np.abs(out))):.1f} dBFS")
    fin = f"video/out/{name}_mix.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", "alimiter=limit=0.89:level=false:attack=2:release=60",
                    "-ar", str(SR), fin], check=True)
    y, _ = sf.read(fin)
    vl = meter.integrated_loudness(np.stack([v, v], 1))
    print(f"{name}: voz normalizada {vl:.2f} LUFS; voz original {lv:.1f} LUFS -> mix final {meter.integrated_loudness(y):.2f} LUFS, "
          f"pico {20*np.log10(np.max(np.abs(y))):.1f} dBFS, trilha: {mus[0] if mus else 'nenhuma'}, "
          f"SFX: {[(k, round(a, 2)) for k, a in events(data)]}")

for nm in sys.argv[1:] or ["youtube", "tiktok"]: mix(nm)
