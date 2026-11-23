#!/usr/bin/env python3
"""Contact sheet of 16:9 stills with frame labels:  python3 sheet.py stills/x sheet.jpg [cols]"""
import sys, glob, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]; W = int(sys.argv[3]) if len(sys.argv) > 3 else 4
fs = sorted(glob.glob(d + "/f*.jpg")); tw, th = 640, 360
ims = [Image.open(f).resize((tw, th)) for f in fs]
sh = Image.new("RGB", (tw * min(W, len(ims)), th * ((len(ims) + W - 1) // W)))
for i, (im, f) in enumerate(zip(ims, fs)):
    ImageDraw.Draw(im).text((8, 6), os.path.basename(f)[1:-4], fill=(255, 255, 0))
    sh.paste(im, ((i % W) * tw, (i // W) * th))
sh.save(out, quality=88); print(out, len(ims))
