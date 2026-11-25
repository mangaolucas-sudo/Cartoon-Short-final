"""Tempo estimado (sem locução) a partir do roteiro: words.json + meta.json no formato do timing.py.
uso: python3 estimate.py <ep_dir> [palavras_por_segundo]"""
import json, re, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'cartoon-audio-short-final', 'kit', 'tools'))
ep = sys.argv[1]; wps = float(sys.argv[2]) if len(sys.argv) > 2 else 3.2
txt = open(os.path.join(ep, 'work', 'script.txt')).read()
V = 'aeiouáéíóúâêôãõày'
def syl(w):
    w = re.sub(r'[^a-záéíóúâêôãõàçü]', '', w.lower()) or 'x'
    return max(1, len(re.findall(f'[{V}]+', w)))
ws = txt.split(); tot_syl = sum(syl(w) for w in ws)
pauses = sum(0.42 if re.search(r'[.!?…]["”]?$', w) else 0.16 if re.search(r'[,;:]$', w) else 0 for w in ws)
speak = len(ws) / wps - pauses
per = speak / tot_syl
t = 0.15; out = []
for w in ws:
    d = syl(w) * per; out.append({'w': w, 's': round(t, 3), 'e': round(t + d, 3)}); t += d
    t += 0.42 if re.search(r'[.!?…]["”]?$', w) else 0.16 if re.search(r'[,;:]$', w) else 0.02
D = round(t + 0.1, 3)
json.dump(out, open(os.path.join(ep, 'work', 'words.json'), 'w'), ensure_ascii=False, indent=1)
json.dump({'duration': D, 'frames': int(round(D * 30)), 'source': f'estimate {wps} w/s'}, open(os.path.join(ep, 'work', 'meta.json'), 'w'))
print(len(ws), 'palavras', D, 's', int(round(D * 30)), 'quadros')
