"""Gera video/src/data/<versao>.json a partir dos timestamps do Whisper.
Cenas e gatilhos são ancorados no início das frases (busca por palavras)."""
import json, re, subprocess, unicodedata, sys

FPS = 30
LEAD = 2 / FPS  # reação visual 2 quadros antes da palavra

FIX = {  # correções de transcrição para as legendas
    ("à", "vida"): "a",
}

def norm(w):
    w = unicodedata.normalize("NFD", w.lower())
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9%]", "", w)

def load(name):
    d = json.load(open(f"timestamps/{name}.json"))
    words = [w for s in d["segments"] for w in s["words"]]
    # correções
    for i, w in enumerate(words):
        nxt = norm(words[i + 1]["w"]) if i + 1 < len(words) else ""
        if w["w"] == "à" and nxt == "vida": w["w"] = "a"
        if norm(w["w"]) == "bento": w["w"] = w["w"].replace("bento", "Bento")
        if norm(w["w"]) == "real" and i and norm(words[i-1]["w"]) == "plano":
            w["w"] = w["w"].replace("real", "Real"); words[i-1]["w"] = "Plano"
        if norm(w["w"]) == "bolsa": w["w"] = w["w"].replace("bolsa", "Bolsa")
    merged = []
    for w in words:  # junta tokens tipo "-feira" à palavra anterior
        if merged and w["w"].startswith("-"):
            merged[-1]["w"] += w["w"]; merged[-1]["e"] = w["e"]
        else: merged.append(dict(w))
    words = merged
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                          "-of", "csv=p=0", f"narracao_{name}.mp3"]))
    return words, dur

def finder(words):
    keys = [norm(w["w"]) for w in words]
    def at(phrase, after=0.0, end=False):
        p = [norm(x) for x in phrase.split()]
        for i in range(len(keys) - len(p) + 1):
            if words[i]["s"] >= after - 0.01 and keys[i:i + len(p)] == p:
                return round((words[i + len(p) - 1]["e"] if end else words[i]["s"]), 3)
        raise SystemExit(f"frase não encontrada: {phrase!r} após {after}")
    return at

def build(name):
    words, dur = load(name)
    at = finder(words)
    tt = name == "tiktok"
    sc = []
    def scene(sid, start, **cues):
        sc.append({"id": sid, "start": start, "cues": cues})

    scene("s1", 0.0, coins=at("junta dinheiro"), sexta=at("sextafeira"), trava=at("trava tudo"))
    t = at("isso aconteceu")
    scene("s2", t, dia=at("16 de março", t), tv=at("um dia depois", t), plano=at("anunciou", t))
    if tt:
        t = at("o brasil vivia")
        scene("s3", t, tag1=at("inflação", t), tag2=at("naquele mes", t), tag3=at("subiram", t),
              pct=at("80%", t), acabar=at("o plano era", t))
    t = at("a regra")
    scene("s4", t, saque=at("sacar", t), hoje=at("hoje", t), resto=at("todo o resto", t),
          meses=at("18 meses", t))
    if tt:
        t = at("e nao era so")
        scene("s5", t, cc=at("conta corrente", t), apl=at("aplicação", t), retido=at("retido", t),
              casa=at("imagina quem", t), vender=at("vender a casa", t), conta=at("na conta", t))
    t = at("pergunta para")
    scene("s6", t, coment=at("e conta aqui", t))
    if tt:
        t = at("em uma semana")
        scene("s7", t, vagas=at("13 mil", t), bolsa=at("bolsa", t), caiu=at("caiu", t))
        t = at("o dinheiro so")
        scene("s8", t, setembro=at("setembro", t), setembroEnd=at("1991", t, end=True),
              parcelas=at("12 parcelas", t), inflacao=at("e a inflação", t), voltou=at("voltou", t),
              real=at("1994", t))
        t = at("segue o bento")
        scene("s9", t, seguir=at("segue", t), amanha=at("amanha", t))
    else:
        t = at("empresas demitiram")
        scene("s7", t, vagas=t, bolsa=at("bolsa", t), caiu=at("caiu", t))
    t = at("por isso quando")
    scene("s10", t, lembra=at("lembra", t))

    # gatilhos visuais 2 quadros antes da palavra
    for i, s in enumerate(sc):
        if i: s["start"] = max(0.0, s["start"] - LEAD)
        s["cues"] = {k: max(0.0, v - LEAD) for k, v in s["cues"].items()}
    frames = round(dur * FPS)
    out = {"name": name, "fps": FPS, "duration": dur, "frames": frames, "scenes": sc,
           "words": [{"w": w["w"], "s": round(w["s"], 3), "e": round(w["e"], 3)} for w in words]}
    json.dump(out, open(f"video/src/data/{name}.json", "w"), ensure_ascii=False, indent=1)
    print(name, f"{dur:.3f}s", frames, "frames")
    for s in sc: print(f'  {s["id"]:4} {s["start"]:6.2f}', {k: round(v, 2) for k, v in s["cues"].items()})

import os; os.makedirs("video/src/data", exist_ok=True)
for n in sys.argv[1:] or ["youtube", "tiktok"]: build(n)
