"""Copia ./assets/bento para video/public/bento e gera o manifesto de expressões."""
import json, os, shutil, unicodedata
KEYS = {
    "choque": ["choque", "chocado", "surpreso", "susto", "shock", "assustado"],
    "neutro": ["neutro", "normal", "padrao", "explicando", "falando", "neutral"],
    "preocupado": ["preocupado", "nervoso", "tenso", "worried", "duvida", "pensativo"],
    "triste": ["triste", "chorando", "sad", "decepcionado"],
    "feliz": ["feliz", "sorrindo", "alegre", "happy", "rindo", "joia"],
    "apontando": ["apontando", "aponta", "pointing", "baixo"],
    "acenando": ["acenando", "tchau", "oi", "wave", "acenar"],
}
src, dst = "assets/bento", "video/public/bento"
os.makedirs(dst, exist_ok=True)
files = {}
for fn in sorted(os.listdir(src)) if os.path.isdir(src) else []:
    if not fn.lower().endswith((".png", ".webp", ".jpg", ".jpeg")): continue
    n = unicodedata.normalize("NFD", fn.lower()); n = "".join(c for c in n if unicodedata.category(c) != "Mn")
    shutil.copy(os.path.join(src, fn), os.path.join(dst, fn))
    for expr, ks in KEYS.items():
        if expr not in files and any(k in n for k in ks):
            files[expr] = f"bento/{fn}"
json.dump({"files": files}, open("video/src/data/bento.json", "w"), indent=1)
print("expressões encontradas:", files or "nenhuma (usando Bento provisório em SVG)")
