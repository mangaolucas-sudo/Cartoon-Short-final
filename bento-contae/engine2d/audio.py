"""Trilha + efeitos sintetizados e mixagem sob a voz.
uso: python3 audio.py <ep_dir> [voz.mp3|wav]
- lê work/meta.json (duração) e work/cues.json (efeitos, gerado pelo render.mjs)
- grava work/music.wav, work/sfx.wav e work/mix.wav
- trilha a 50% do RMS (com gate) da voz (-6 dB) e efeitos com picos limitados abaixo do pico da voz.
  Sem voz (prévia), usa uma voz de referência de -20 dBFS RMS.
"""
import json, os, subprocess, sys, wave
import numpy as np

SR = 48000
ep = sys.argv[1]; voice_path = sys.argv[2] if len(sys.argv) > 2 else None
meta = json.load(open(os.path.join(ep, 'work', 'meta.json')))
cues = json.load(open(os.path.join(ep, 'work', 'cues.json')))['cues']
DUR = meta['duration']; N = int(DUR * SR) + 1
rng = np.random.default_rng(11)
midi = lambda m: 440 * 2 ** ((m - 69) / 12)

def lp(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / (1 + (f / fc) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)
def hp(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 - 1 / (1 + (f / fc) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)
def place(buf, sig, t0, g=1.0):
    i = int(t0 * SR); j = min(len(buf), i + len(sig))
    if 0 <= i < len(buf) and j > i: buf[i:j] += sig[: j - i] * g
def tt(d): return np.arange(int(d * SR)) / SR

# ---------------- trilha: marimba + baixo + palmas + chocalho (alegre, ~104 bpm) ----------------
def marimba(f, d=0.45):
    t = tt(d); s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 30)
    return (s * np.exp(-t * 9) * np.minimum(1, t / 0.002)).astype(np.float32)
def bass(f, d=0.4):
    t = tt(d); s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)
    return (s * np.exp(-t * 5) * np.minimum(1, t / 0.01)).astype(np.float32)
def clap():
    t = tt(0.16); s = rng.standard_normal(len(t)) * (np.exp(-t * 40) + 0.5 * np.exp(-np.maximum(0, t - 0.012) * 50) * (t > 0.012))
    return hp(s.astype(np.float32), 900) * 0.6
def shaker():
    t = tt(0.07); return hp((rng.standard_normal(len(t)) * np.exp(-t * 70)).astype(np.float32), 5000) * 0.35
def kick():
    t = tt(0.3); f = 45 + 80 * np.exp(-t * 35); return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10)).astype(np.float32)

BPM = 104; beat = 60 / BPM
prog = [(60, [64, 67, 72]), (57, [64, 69, 72]), (53, [65, 69, 72]), (55, [62, 67, 71])]  # C Am F G
stops = sorted([(c['t'], c['sfx']) for c in cues if c['sfx'] in ('music_stop', 'music_go')])
def music_on(t):
    on = True
    for ts, k in stops:
        if t >= ts: on = (k == 'music_go')
    return on
music = np.zeros(N, np.float32)
bar = 0; t0 = 0.0
pat = [0, 2, 1, 2, 0, 1, 2, 1]
while t0 < DUR:
    root, ch = prog[bar % 4]
    for b in range(4):
        tb = t0 + b * beat
        if tb >= DUR: break
        if not music_on(tb): continue
        place(music, kick(), tb, 0.5 if b in (0, 2) else 0)
        if b in (1, 3): place(music, clap(), tb, 0.45)
        place(music, bass(midi(root - 24)), tb, 0.5 if b in (0, 2) else 0.3)
        for e in range(2):
            te = tb + e * beat / 2
            place(music, marimba(midi(ch[pat[(b * 2 + e) % 8]])), te, 0.22)
            place(music, shaker(), te, 0.5 if e else 0.3)
    bar += 1; t0 += beat * 4
# drone de suspense enquanto a música está parada
for i, (ts, k) in enumerate(stops):
    if k != 'music_stop': continue
    te = next((x for x, kk in stops[i + 1:] if kk == 'music_go'), DUR)
    t = tt(te - ts); d = (np.sin(2 * np.pi * midi(36) * t) + 0.5 * np.sin(2 * np.pi * midi(43) * t) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t)))
    d *= np.minimum(1, t / 0.15) * np.minimum(1, (te - ts - t) / 0.1).clip(0)
    place(music, lp(d.astype(np.float32), 400), ts, 0.35)
music = lp(music, 7000)

# ---------------- efeitos ----------------
def noise(d): return rng.standard_normal(int(d * SR)).astype(np.float32)
def S_whoosh():
    t = tt(0.4); n = noise(0.4); env = np.sin(np.pi * np.clip(t / 0.4, 0, 1)) ** 2
    return lp(hp(n * env, 600), 3500) * 1.4
def S_pop():
    t = tt(0.12); f = 900 * np.exp(-t * 18) + 300; return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35)).astype(np.float32)
def S_stamp():
    t = tt(0.35); s = np.sin(2 * np.pi * np.cumsum(60 + 90 * np.exp(-t * 40)) / SR) * np.exp(-t * 14); s[:int(0.01 * SR)] += noise(0.01) * 0.8
    return s.astype(np.float32)
def S_ding(f=1568):
    t = tt(0.9); s = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t * k) for a, m, k in [(1, 1, 4), (0.5, 2.76, 7), (0.25, 5.4, 11)])
    return (s * np.minimum(1, t / 0.002)).astype(np.float32) * 0.6
def S_cash():
    a = S_ding(2093) * 0.7; b = np.zeros(int(0.15 * SR), np.float32); b[:int(0.05 * SR)] = hp(noise(0.05), 2000) * np.exp(-tt(0.05) * 60)
    out = np.zeros(int(1.0 * SR), np.float32); out[:len(b)] += b; out[int(0.08 * SR):int(0.08 * SR) + len(a)] += a[: len(out) - int(0.08 * SR)]; return out
def S_plof():
    t = tt(0.25); s = np.sin(2 * np.pi * np.cumsum(140 * np.exp(-t * 12) + 50) / SR) * np.exp(-t * 18) + lp(noise(0.25), 800) * np.exp(-t * 25) * 0.6
    return s.astype(np.float32)
def S_siren():
    t = tt(1.0); f = np.where((t * 2.5) % 1 < 0.5, 960, 760); s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.3
    return lp((s * np.minimum(1, t / 0.03) * np.minimum(1, (1 - t) / 0.1)).astype(np.float32), 2500)
def S_boing():
    t = tt(0.5); f = 220 + 160 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 6); return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6)).astype(np.float32) * 0.8
def S_sparkle():
    out = np.zeros(int(0.7 * SR), np.float32)
    for i, f in enumerate([2637, 3136, 3951, 3520]): place(out, S_ding(f)[: int(0.4 * SR)] * 0.5, i * 0.06)
    return out
def S_tap():
    t = tt(0.05); return (np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 120)).astype(np.float32) * 0.8
def S_record():
    out = np.zeros(int(0.5 * SR), np.float32); t = tt(0.12)
    for i in range(2): place(out, (np.sin(2 * np.pi * 1320 * t) * np.minimum(1, (0.12 - t) / 0.01)).astype(np.float32) * 0.4, i * 0.18)
    return out
def S_tick():
    out = np.zeros(int(1.6 * SR), np.float32)
    for i in range(8): place(out, S_tap() * 0.7, i * 0.18)
    return out
def S_boom():
    t = tt(1.2); s = np.sin(2 * np.pi * np.cumsum(38 + 40 * np.exp(-t * 8)) / SR) * np.exp(-t * 3)
    return (s + lp(noise(1.2), 300) * np.exp(-t * 6) * 0.5).astype(np.float32)
SFX = {k[2:]: v for k, v in globals().items() if k.startswith('S_')}
GAIN = {'whoosh': 0.45, 'pop': 0.5, 'stamp': 0.9, 'ding': 0.5, 'cash': 0.6, 'plof': 0.8, 'siren': 0.35, 'boing': 0.6, 'sparkle': 0.45, 'tap': 0.5, 'record': 0.45, 'tick': 0.5, 'boom': 0.9}
sfx = np.zeros(N, np.float32)
for c in cues:
    if c['sfx'] in SFX: place(sfx, SFX[c['sfx']](), c['t'] - 0.02, GAIN.get(c['sfx'], 0.5))

# ---------------- mixagem (trilha a 50% da voz; efeitos ≤ 50% e picos limitados) ----------------
def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    v = np.frombuffer(raw, np.float32).copy(); out = np.zeros(N, np.float32); out[: min(N, len(v))] = v[:N]; return out
def gated_rms(x, gate_db=-40):
    fr = int(0.05 * SR); n = len(x) // fr
    r = np.sqrt((x[: n * fr].reshape(n, fr) ** 2).mean(1) + 1e-12)
    keep = r[20 * np.log10(r) > gate_db + 20 * np.log10(r.max() + 1e-9)]
    return float(np.sqrt((keep ** 2).mean())) if len(keep) else 1e-4
db = lambda x: 20 * np.log10(x + 1e-12)
if voice_path:
    voice = load(voice_path); vr = gated_rms(voice); vpk = float(np.abs(voice).max())
else:
    voice = np.zeros(N, np.float32); vr = 10 ** (-20 / 20); vpk = vr * 4
mr = gated_rms(music); music *= 0.5 * vr / mr
sr_ = gated_rms(sfx) if np.abs(sfx).max() > 0 else 1
sfx *= 0.5 * vr / sr_
pk = np.abs(sfx).max()
if pk > 0.7 * vpk: sfx *= 0.7 * vpk / pk
mix = voice + music + sfx
lim = 10 ** (-1 / 20)
if np.abs(mix).max() > lim: mix *= lim / np.abs(mix).max()
def save(name, x):
    with wave.open(os.path.join(ep, 'work', name), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
save('music.wav', music); save('sfx.wav', sfx); save('mix.wav', mix)
print(f'voz {"ok" if voice_path else "(referência -20 dBFS)"} | trilha {db(gated_rms(music)) - db(vr):+.1f} dB vs voz | efeitos {db(gated_rms(sfx)) - db(vr):+.1f} dB vs voz | pico mix {db(np.abs(mix).max()):.1f} dBFS')
