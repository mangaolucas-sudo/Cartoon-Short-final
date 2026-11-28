"""EP "Preço errado": gera video/src/data/<versao>.json a partir dos timestamps do Whisper.
Cenas, gatilhos, cenários (2–4 s) e efeitos sonoros ancorados no início das frases."""
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
        # "19" + ",90" -> "19,90" ; "10" + ",962"/".962" -> "10.962"
        if out and w["w"][:1] in ".," and norm(out[-1]["w"]).isdigit() and norm(w["w"]).isdigit():
            tail = w["w"]
            if norm(out[-1]["w"]) == "10" and norm(tail).startswith("962"): tail = "." + tail[1:]
            out[-1]["w"] += tail; out[-1]["e"] = w["e"]; continue
        out.append(w)
    for i, w in enumerate(out):
        n = norm(w["w"]); prev = norm(out[i - 1]["w"]) if i else ""
        if n == "um" and prev == "sabao": w["w"] = "em"
        if n == "bento": w["w"] = w["w"].replace("bento", "Bento")
        if n == "justica": w["w"] = w["w"].replace("justiça", "Justiça")
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


def build(name):
    words, dur = load(name)
    at = finder(words)
    tt = name == "tiktok"
    sc = []

    def scene(sid, start, bg, **cues):
        sc.append({"id": sid, "start": start, "cues": cues, "bg": bg})

    # 1. gancho
    scene("s1", 0.0, [(0.0, "mercado", 0), (at("no caixa"), "checkout", 0)], caixa=at("no caixa"), n32=at("3290"))
    # 2. paga ou deixa
    t = at("e a moca")
    scene("s2", t, [(t, "checkout", 1)], pd=at("paga ou deixa", t))
    # 3. pagou
    t = at("o paulo pagou")
    scene("s3", t, [(t, "checkout", 2)], perdeu=at("perdeu", t))
    if tt:
        # 4. reganche
        t = at("porque a lei")
        scene("s4", t, [(t, "raios", 2)], lado=at("do lado dele", t))
        # 5. mostrou a etiqueta
        t = at("ele mostrou")
        scene("s5", t, [(t, "checkout", 0), (at("o preco certo", t), "checkout", 2)], nem=at("a moca nem", t),
              sistema=at("o preco certo", t))
        # 6. gerente
        t = at("chamou o gerente")
        scene("s6", t, [(t, "mercado", 1)], velha=at("etiqueta velha", t), naovale=at("nao vale", t))
        # 7. fila
        t = at("atras dele")
        scene("s7", t, [(t, "checkout", 1), (at("ele ficou", t), "checkout", 0)], vergonha=at("ele ficou", t),
              pagou=at("pagou", at("ele ficou", t)))
        # 8. saiu
        t = at("13 reais")
        scene("s8", t, [(t, "rua_dia", 0), (at("e saiu", t), "rua_dia", 1)], saiu=at("e saiu", t))
    else:
        t = at("o gerente ainda")
        scene("s6", t, [(t, "mercado", 1)], velha=at("etiqueta velha", t), naovale=at("nao vale", t))
    # 9. Calma, que o Bento conta
    t = at("calma que o bento")
    scene("s9", t, [(t, "raios", 0)], bento=at("bento", t))
    # 10. não é desculpa / vale sim
    t = at("etiqueta velha nao e") if tt else at("vale sim")
    scene("s10", t, [(t, "mercado", 1)] if tt else [])
    # 11. a lei 10.962
    t = at("a lei 10962")
    scene("s11", t, [(t, "escritorio", 0), (at("diz", t), "escritorio", 1),
                     (at("for diferente", t) if tt else at("prateleira e caixa", t), "mercado", 0),
                     ] + ([] if tt else []), lei=at("10962", t), dif=at("diferente", t), menor=at("paga o menor", t))
    if tt:
        # 12. CDC
        t = at("e o codigo")
        scene("s12", t, [(t, "escritorio", 2), (at("preco anunciado", t), "raios", 0), (at("a loja tem", t), "raios", 1)],
              promessa=at("preco anunciado", t), cumprir=at("a loja tem", t))
    # 13. exceção
    t = at("mas presta") if tt else at("so tem uma")
    scene("s13", t, [(t, "palco", 0)] + ([(at("pode sim", t), "palco", 2)] if tt else []),
          excecao=at("tem um caso", t) if tt else at("excecao", t))
    # 14. TV por 9,90
    t = at("se a etiqueta diz") if tt else at("televisao por")
    scene("s14", t, [(t, "eletro", 0)] + ([(at("isso e erro", t), "eletro", 1)] if tt else []),
          tv=at("televisao", t), grosseiro=at("erro grosseiro", t) if tt else at("televisao", t))
    # 15. Justiça não obriga
    t = at("ai a justica") if tt else at("a loja nao e obrigada")
    scene("s15", t, [(t, "tribunal", 0)])
    if tt:
        # 16. sabão em pó
        t = at("agora")
        scene("s16", t, [(t, "mercado", 2), (at("isso e preco", t), "mercado", 0)], normal=at("isso e preco", t),
              vale=at("vale a etiqueta", t))
    # 17. faz assim
    t = at("entao preco") if tt else at("preco diferente", at("vender"))
    scene("s17", t, [(t, "raios", 1), (at("pede o menor", t), "checkout", 0)],
          foto=at("tira foto", t), menor=at("pede o menor", t), procon=at("chama o procon", t))
    # 18. manda / segue
    t = at("manda")
    scene("s18", t, [(t, "estudio", 0)] + ([(at("segue", t), "estudio", 1)] if tt else []),
          **({"segue": at("segue", t)} if tt else {}))
    # 19. loop: volta ao quadro 0
    t = at("na semana")
    scene("s19", t, [(t, "mercado", 2), (at("e olhou", t), "mercado", 0)], olhou=at("e olhou", t))

    for i, s in enumerate(sc):
        if i: s["start"] = max(0.0, s["start"] - LEAD)
        s["cues"] = {k: max(0.0, v - LEAD) for k, v in s["cues"].items()}
        s["bg"] = [{"at": (s["start"] if j == 0 else max(0.0, b[0] - LEAD)), "kind": b[1], "v": b[2]}
                   for j, b in enumerate(s["bg"])]
    frames = round(dur * FPS)
    bgs = [b for s in sc for b in s["bg"]]
    sfx = sequences(sc, bgs, dur)
    duck = next(([s["start"], sc[i + 1]["start"]] for i, s in enumerate(sc) if s["id"] == "s13"), None)
    out = {"name": name, "fps": FPS, "duration": dur, "frames": frames, "scenes": sc, "sfx": sfx, "duck": duck,
           "words": [{"w": w["w"], "s": round(w["s"], 3), "e": round(w["e"], 3)} for w in words]}
    json.dump(out, open(f"video/src/data/{name}.json", "w"), ensure_ascii=False, indent=1)
    print(name, f"{dur:.3f}s", frames, "frames")
    for s in sc: print(f'  {s["id"]:4} {s["start"]:6.2f}', {k: round(v, 2) for k, v in s["cues"].items()})
    ends = [b["at"] for b in bgs[1:]] + [dur]
    lens = [round(e - b["at"], 2) for b, e in zip(bgs, ends)]
    print("  cenários:", [(b["kind"], b["v"], round(b["at"], 2), l) for b, l in zip(bgs, lens)])
    bad = [(b["kind"], l) for b, l in zip(bgs, lens) if l > 4.3 or l < 1.4]
    if bad: print("  ATENÇÃO:", bad)


def sequences(sc, bgs, dur):
    fx = []
    add = lambda k, t, **kw: fx.append({"k": k, "t": round(t, 3), **kw})
    for i, s in enumerate(sc):
        c, s0 = s["cues"], s["start"]
        end = sc[i + 1]["start"] if i + 1 < len(sc) else dur
        q = s["seq"] = {}
        k = s["id"]
        if k == "s1":
            add("beep", 0.13); add("buzz", 0.2); add("beep", c["caixa"]); add("buzz", c["n32"]); add("impact", c["n32"])
        if k == "s2": add("pop", c["pd"]); add("hmpf", c["pd"] + 0.1)
        if k == "s3": add("register", s0 + 0.2); add("womp", c["perdeu"])
        if k == "s4": add("riser", s0, d=c["lado"] - s0 + 0.2); add("stamp", c["lado"])
        if k == "s5": add("beep", s0 + 0.3); add("swish", c["nem"]); add("pop", c["sistema"])
        if k == "s6":
            q["steps"] = [round(s0 + 0.1 + j * 0.22, 3) for j in range(4)]
            for t in q["steps"]: add("step", t)
            add("stamp", c["velha"]); add("stamp", c["naovale"])
        if k == "s7": add("amb", s0, d=c["pagou"] - s0, a="crowd"); add("register", c["pagou"])
        if k == "s8": add("trombone", s0 + 0.1); add("amb", c["saiu"], d=end - c["saiu"], a="rain")
        if k == "s9": add("tada", c["bento"])
        if k == "s10": add("stamp", s0 + 0.35)
        if k == "s11": add("pop", c["lei"]); add("thud", c["dif"]); add("ding", c["menor"]); add("chime", c["menor"] + 0.1)
        if k == "s12": add("pop", s0 + 0.1); add("pen", c["promessa"], d=1.0); add("stamp", c["cumprir"])
        if k == "s13": add("heartbeat", s0, d=end - s0); add("riser", end - 1.0, d=1.0)
        if k == "s14": add("alarm", c["tv"], d=1.6); add("boing", c["grosseiro"] + 0.2)
        if k == "s15":
            q["gavel"] = [round(s0 + 0.35, 3), round(s0 + 0.75, 3)]
            for t in q["gavel"]: add("gavel", t)
        if k == "s16": add("pop", s0 + 0.2); add("ding", c["normal"]); add("ding", c["vale"])
        if k == "s17":
            for kk in ("foto", "menor", "procon"): add("pop", c[kk]); add("blip", c[kk] + 0.05, n={"foto": 0, "menor": 2, "procon": 4}[kk])
            add("click", c["foto"] + 0.15)
        if k == "s18":
            add("pop", s0 + 0.1)
            if "segue" in c: q["tap"] = round(c["segue"] + 0.4, 3); add("click", q["tap"]); add("chime", q["tap"] + 0.1)
        if k == "s19": q["steps"] = [round(s0 + 0.1 + j * 0.25, 3) for j in range(6)]; [add("step", t) for t in q["steps"]]; add("beep", c["olhou"] + 0.1)
    for j, b in enumerate(bgs):
        if j: add("whoosh" if bgs[j - 1]["kind"] != b["kind"] else "swish", b["at"] - 0.1)
    AMB = {"mercado": "hum", "checkout": "hum", "raios": "room", "escritorio": "clock", "palco": "drone", "eletro": "tvhum",
           "tribunal": "room", "estudio": "room", "rua_dia": "crowd"}
    ends = [b["at"] for b in bgs[1:]] + [dur]
    for b, e in zip(bgs, ends):
        add("amb", b["at"], d=round(e - b["at"], 3), a=AMB.get(b["kind"], "room"))
    fx.sort(key=lambda x: x["t"])
    return fx


import os; os.makedirs("video/src/data", exist_ok=True)
for n in sys.argv[1:] or ["youtube", "tiktok"]: build(n)
