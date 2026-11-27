"""Gera video/src/data/<versao>.json a partir dos timestamps do Whisper.
Cenas, gatilhos e trocas de cenário são ancorados no início das frases/palavras."""
import json, re, subprocess, unicodedata, sys

FPS = 30
LEAD = 2 / FPS  # reação visual 2 quadros antes da palavra


def norm(w):
    w = unicodedata.normalize("NFD", w.lower())
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9%]", "", w)


def load(name):
    d = json.load(open(f"timestamps/{name}.json"))
    words = [dict(w) for s in d["segments"] for w in s["words"]]
    out = []
    for w in words:
        # "2" + ".750" -> "2.750";  "2" + ",5" -> erro do Whisper ("2,5 milhões" = "2 quintilhões")
        if out and w["w"].startswith((".", ",")) and norm(out[-1]["w"]).isdigit():
            if w["w"] == ",5":
                continue
            out[-1]["w"] += w["w"]; out[-1]["e"] = w["e"]; continue
        out.append(w)
    for i, w in enumerate(out):
        n = norm(w["w"])
        prev = norm(out[i - 1]["w"]) if i else ""
        if n == "milhoes" and prev == "2": w["w"] = "quintilhões"
        if n == "reais" and prev == "de" and i < 20: w["w"] = w["w"].replace("reais", "réis")
        if n == "bento": w["w"] = w["w"].replace("bento", "Bento")
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                          "-of", "csv=p=0", f"narracao_{name}.mp3"]))
    return out, dur


def finder(words):
    keys = [norm(w["w"]) for w in words]

    def at(phrase, after=0.0, end=False):
        p = [norm(x) for x in phrase.split()]
        for i in range(len(keys) - len(p) + 1):
            if words[i]["s"] >= after - 0.01 and keys[i:i + len(p)] == p:
                return round((words[i + len(p) - 1]["e"] if end else words[i]["s"]), 3)
        raise SystemExit(f"frase não encontrada: {phrase!r} após {after}")
    return at


NUM = "2.750.000.000.000.000.000"


def sequences(sc, bgs, dur):
    """Tempos de animações em série (seq) + lista de efeitos sonoros (sfx)."""
    fx = []
    add = lambda k, t, **kw: fx.append({"k": k, "t": round(t, 3), **kw})
    for i, s in enumerate(sc):
        c, s0 = s["cues"], s["start"]
        end = sc[i + 1]["start"] if i + 1 < len(sc) else dur
        q = s["seq"] = {}
        if s["id"] == "s1":
            q["digits"] = [0.0] + [round(0.35 + (c["reis"] - 0.35) * ((k / 24) ** 0.85), 3) for k in range(1, 25)]
            for k, t in enumerate(q["digits"]):
                if k and NUM[k] != ".": add("tick", t, g=-4 * (1 - k / 24))
            add("riser", c["quad"] - 0.3, d=c["reis"] - c["quad"] + 0.3)
            add("impact", c["reis"]); add("glass", c["reis"] + 0.02)
        if s["id"] == "s2":
            n = 8; a, b2 = s0 + 0.2, end - 1.1
            q["notes"] = [round(a + (b2 - a) * k / (n - 1), 3) for k in range(n)]
            for t in q["notes"]: add("paper", t); add("thud", t + 0.42)
            add("pop", c["oito"]); add("stamp", c["anos"])
        if s["id"] == "s3":
            add("projector", s0, d=c["cz"] - s0)
            for k in ["reis", "cz", "czn"]: add("pop", c[k])
            add("scratch", c["cz2"]); add("boing", c["cz2"] + 0.25)
        if s["id"] == "s4":
            q["snips"] = [round(c[k] + 0.45, 3) for k in ["c1", "c2", "c4"]]
            for t in q["snips"]: add("snip", t); add("clink", t + 0.35)
            add("stamp", c["c3"] + 0.4)
            add("snip", c["zeros"]); add("impact", c["zeros"] + 0.12)
            for k in range(3): add("clink", c["zeros"] + 0.5 + k * 0.13)
            q["flips"] = [round(c["ano"] + 0.2 + k * (c["outro"] - c["ano"] - 0.2) / 4, 3) for k in range(4)]
            for t in q["flips"]: add("flip", t)
            add("stamp", c["outro"])
        if s["id"] == "s5":
            ts, t, dt = [], c["infl"], 0.8
            while t < c["salario"] - 0.25:
                ts.append(round(t, 3)); t += dt; dt = max(0.2, dt * 0.84)
            q["stamps"] = ts
            for t in ts: add("kachunk", t)
            add("pop", c["salario"]); add("whoosh_s", c["corria"]); add("register", c["gastar"] + 0.3)
            add("crumble", c["po"]); add("wind", c["po"] + 0.1, d=1.4)
        if s["id"] == "s6":
            add("chime", c["gaveta"]); add("creak", s0 + 0.15)
            for k in range(3): add("pop", c["coment"] + k * 0.45)
        if s["id"] == "s7":
            add("heartbeat", s0 + 0.1, d=c["real"] - s0 - 0.2)
            add("drumroll", c["ano"], d=c["real"] - c["ano"])
            add("cymbal", c["real"]); add("cheer", c["real"] + 0.1, d=1.9)
            q["count"] = [round(c["trocar"] + 0.3, 3), round(c["cruz"], 3)]
            add("counter", q["count"][0], d=q["count"][1] - q["count"][0])
            add("impact", c["n2750"]); add("shrink", c["viravam"], d=c["um"] - c["viravam"])
            add("ding", c["um"] + 0.12); add("chime", c["um"] + 0.2)
        if s["id"] == "s8":
            a, b2 = s0 + 0.3, c["conta"] - 0.5
            q["chalk"] = [round(a + (b2 - a) * k / 4, 3) for k in range(5)]
            for t in q["chalk"]: add("chalk", t)
            add("riser", c["conta"] - 0.8, d=0.8); add("impact", c["conta"])
            for k in range(8): add("blip", c["durou"] + k * 0.14, n=k)
            add("ding", c["trinta"]); add("cheer", c["trinta"] + 0.05, d=1.8); add("confetti", c["trinta"])
        if s["id"] == "s9":
            add("pop", s0 + 0.05); q["tap"] = round(s0 + 26 / FPS, 3)
            add("click", q["tap"]); add("chime", q["tap"] + 0.1)
        if s["id"] == "s10":
            add("chime", s0 + 0.3)
    # trocas de cenário
    for j, b in enumerate(bgs):
        if j == 0: continue
        add("whoosh" if bgs[j - 1]["kind"] != b["kind"] else "swish", b["at"] - 0.1)
        # fogos: estouros (mesmos atrasos do cenário Fogos v1)
        if b["kind"] == "fogos" and b["v"] == 1:
            for d in [0, 0.45, 0.9, 1.3, 1.7]: add("firework", b["at"] + d)
    # ambiência por cenário
    AMB = {"rua": "night", "cosmos": "drone", "grafica": "machine", "museu": "room", "anos40": "room", "anos60": "wind",
           "anos70": "tvhum", "jornal": "room", "escritorio": "clock", "mercado": "hum", "rua_dia": "crowd", "sala": "clock",
           "fogos": "crowd", "agencia": "crowd", "lousa": "room", "palco": "crowd", "estudio": "room"}
    ends = [b["at"] for b in bgs[1:]] + [dur]
    for b, e in zip(bgs, ends):
        k = AMB[b["kind"]]
        if b["kind"] == "fogos" and b["v"] == 0: k = "drone"
        add("amb", b["at"], d=round(e - b["at"], 3), a=k)
    fx.sort(key=lambda x: x["t"])
    return fx


def build(name):
    words, dur = load(name)
    at = finder(words)
    tt = name == "tiktok"
    sc = []

    def scene(sid, start, bg, **cues):
        """bg: lista de (gatilho, cenário, variante). gatilho None = início da cena."""
        sc.append({"id": sid, "start": start, "cues": cues, "bg": bg})

    # 1. a moeda
    scene("s1", 0.0, [(0.0, "rua", 0), (at("750"), "cosmos", 0)],
          dois=at("2"), quint=at("quintilhoes"), q750=at("750"), quad=at("quadrilhoes"), reis=at("de", at("quadrilhoes")))
    # 2. trocou de dinheiro
    t = at("e que o brasil")
    scene("s2", t, [(t, "grafica", 0), (at("vezes", t), "museu", 0)],
          oito=at("8", t), anos=at("52", t))
    # 3. réis -> cruzeiros (TikTok)
    if tt:
        t = at("ate 1942")
        scene("s3", t, [(t, "anos40", 0), (at("o dinheiro aqui", t), "anos40", 1), (at("ai veio", t), "anos60", 0),
                        (at("depois o cruzeiro novo", t), "anos60", 1), (at("depois o cruzeiro de", t), "anos70", 0)],
              ano=at("1942", t), reis=at("reis", t), cz=at("cruzeiro", t), czn=at("cruzeiro novo", t),
              cz2=at("cruzeiro de novo", t))
    # 4. linha do tempo + tesoura
    t = at("cruzado")
    scene("s4", t, [(t, "jornal", 0), (at("cruzeiro", t), "jornal", 1), (at("quase toda", t), "grafica", 1),
                    (at("as vezes", t), "escritorio", 0)],
          c1=t, c2=at("cruzado novo", t), c3=at("cruzeiro", t), c4=at("cruzeiro real", t),
          quase=at("quase toda", t), corte=at("corte", t), zeros=at("3 zeros", t), ano=at("as vezes", t), outro=at("outro", t))
    # 5. inflação (TikTok)
    if tt:
        t = at("isso porque")
        scene("s5", t, [(t, "mercado", 0), (at("remarcava", t), "mercado", 1), (at("quem recebia", t), "rua_dia", 0),
                        (at("antes que", t), "rua_dia", 1)],
              infl=at("inflacao", t), remarca=at("remarcava", t), dia=at("todo dia", t), salario=at("salario", t),
              corria=at("corria", t), gastar=at("gastar", t), po=at("po", t))
    # 6. nota antiga guardada
    t = at("ainda tem")
    scene("s6", t, [(t, "sala", 0), (at("comenta", t), "sala", 1)], gaveta=at("guardada", t), coment=at("comenta", t))
    # 7. 1994: o real
    t = at("ate que em")
    scene("s7", t, [(t, "fogos", 0), (at("veio o real", t), "fogos", 1), (at("e para trocar", t), "agencia", 0), (at("2.750", t), "agencia", 1), (at("viravam", t), "agencia", 2)],
          ano=at("1994", t), real=at("veio o real", t), trocar=at("e para trocar", t), assim=at("assim", t),
          n2750=at("2.750", t), cruz=at("cruzeiros", t), viravam=at("viravam", t), um=at("1 real", t))
    if tt:
        # 8. a conta maluca + 30 anos
        t = at("se voce somar")
        scene("s8", t, [(t, "lousa", 0), (at("chega nessa", t), "cosmos", 1), (at("e o real ja", t), "palco", 0),
                        (at("mais de 30", t), "palco", 1)],
              cortes=at("cortes", t), reis=at("reis", t), conta=at("conta maluca", t), durou=at("durou", t),
              trinta=at("30", t))
        # 9. segue o Bento
        t = at("segue o bento")
        scene("s9", t, [(t, "estudio", 0), (at("historia real", t), "estudio", 1)],
              seguir=t, amanha=at("amanha", t))
    # 10. volta ao visual da cena 1 (loop)
    t = at("por isso")
    scene("s10", t, [(t, "rua", 1), (at("achar", t), "rua", 0)], achar=at("achar", t), chao=at("chao", t))

    # gatilhos visuais 2 quadros antes da palavra
    for i, s in enumerate(sc):
        if i: s["start"] = max(0.0, s["start"] - LEAD)
        s["cues"] = {k: max(0.0, v - LEAD) for k, v in s["cues"].items()}
        s["bg"] = [{"at": (s["start"] if j == 0 else max(0.0, b[0] - LEAD)), "kind": b[1], "v": b[2]}
                   for j, b in enumerate(s["bg"])]
    frames = round(dur * FPS)
    bgs = [b for s in sc for b in s["bg"]]
    sfx = sequences(sc, bgs, dur)
    out = {"name": name, "fps": FPS, "duration": dur, "frames": frames, "scenes": sc, "sfx": sfx,
           "words": [{"w": w["w"], "s": round(w["s"], 3), "e": round(w["e"], 3)} for w in words]}
    json.dump(out, open(f"video/src/data/{name}.json", "w"), ensure_ascii=False, indent=1)
    print(name, f"{dur:.3f}s", frames, "frames")
    for s in sc:
        print(f'  {s["id"]:4} {s["start"]:6.2f}', {k: round(v, 2) for k, v in s["cues"].items()})
    ends = [b["at"] for b in bgs[1:]] + [dur]
    lens = [round(e - b["at"], 2) for b, e in zip(bgs, ends)]
    print("  cenários:", [(b["kind"], b["v"], round(b["at"], 2), l) for b, l in zip(bgs, lens)])
    bad = [l for l in lens if l > 4.2]
    if bad: print("  ATENÇÃO cenários > 4s:", bad)


import os; os.makedirs("video/src/data", exist_ok=True)
for n in sys.argv[1:] or ["youtube", "tiktok"]: build(n)
