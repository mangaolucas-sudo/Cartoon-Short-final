import sys, re, json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro('kokoro-v1.0.onnx', 'voices-v1.0.bin')
script, outdir, voice, speed = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
name = sys.argv[5] if len(sys.argv) > 5 else 'voice'
txt = open(script, encoding='utf-8').read()
sents = [s.strip() for s in re.split(r'(?<=[.?!:])\s+', txt.replace('\n', ' ')) if s.strip()]
SR = 24000; parts = [np.zeros(int(0.15 * SR), np.float32)]; t = 0.15; P = []
extra = {i: 0.25 for i, s in enumerate(sents) if s.startswith(('Mas ', 'Ou seja', 'E ', 'Doze'))}
for i, s in enumerate(sents):
    if i in extra: parts.append(np.zeros(int(extra[i] * SR), np.float32)); t += extra[i]
    a, _ = k.create(s, voice=voice, speed=speed, lang='pt-br'); a = np.asarray(a, np.float32)
    nz = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, nz[0] - 120): nz[-1] + 600]
    P.append({"text": s, "start": round(t, 3), "end": round(t + len(a) / SR, 3)}); parts.append(a); t += len(a) / SR
    g = 0.22 if s.endswith(':') else 0.36; parts.append(np.zeros(int(g * SR), np.float32)); t += g
a = np.concatenate(parts); a /= np.abs(a).max() / 0.9
sf.write(f'{outdir}/{name}.wav', a, SR); json.dump(P, open(f'{outdir}/{name}_phrases.json', 'w'), ensure_ascii=False, indent=1)
print("dur", round(len(a) / SR, 2), "frames", round(len(a) / SR * 30))
