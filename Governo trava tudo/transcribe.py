import json, sys, subprocess, numpy as np
def load(f):
    b=subprocess.run(["ffmpeg","-v","error","-i",f,"-f","s16le","-ac","1","-ar","16000","-"],capture_output=True).stdout
    return np.frombuffer(b,np.int16).astype(np.float32)/32768
from faster_whisper import WhisperModel
m = WhisperModel("small", device="cpu", compute_type="int8")
for name in sys.argv[1:]:
    segs, info = m.transcribe(load(f"narracao_{name}.mp3"), language="pt", word_timestamps=True, beam_size=5)
    out = {"duration": info.duration, "segments": []}
    for s in segs:
        out["segments"].append({"start": s.start, "end": s.end, "text": s.text.strip(),
            "words": [{"w": w.word.strip(), "s": w.start, "e": w.end} for w in s.words]})
    json.dump(out, open(f"timestamps/{name}.json", "w"), ensure_ascii=False, indent=1)
    print(name, info.duration)
    for s in out["segments"]: print(f'{s["start"]:6.2f} {s["end"]:6.2f} {s["text"]}')
