from PIL import Image, ImageDraw, ImageFont, ImageFilter
BLK='/usr/share/fonts/opentype/inter/InterDisplay-Black.otf'
INK=(18,13,22)
def font(s): return ImageFont.truetype(BLK, s)
def fit(d, t, size, maxw):
    while d.textlength(t, font=font(size)) > maxw: size -= 4
    return font(size)
def outlined(im, t, cx, cy, size, fill, maxw=960, stroke=None, rot=0):
    d=ImageDraw.Draw(im); f=fit(d,t,size,maxw); sw=stroke or max(8,f.size//7)
    layer=Image.new('RGBA',im.size,(0,0,0,0)); ld=ImageDraw.Draw(layer)
    ld.text((cx,cy+f.size*0.08),t,font=f,anchor='mm',fill=(0,0,0,150),stroke_width=sw,stroke_fill=(0,0,0,150))
    layer=layer.filter(ImageFilter.GaussianBlur(6)); im.alpha_composite(layer)
    d=ImageDraw.Draw(im); d.text((cx,cy),t,font=f,anchor='mm',fill=fill,stroke_width=sw,stroke_fill=INK)
    return f.size
def boxed(im, t, cx, cy, size, bg, fg=(255,255,255), maxw=940):
    d=ImageDraw.Draw(im); f=fit(d,t,size,maxw-60); w=d.textlength(t,font=f)+64; h=f.size*1.32
    d.rounded_rectangle((cx-w/2+8,cy-h/2+12,cx+w/2+8,cy+h/2+12),22,fill=(0,0,0,120))
    d.rounded_rectangle((cx-w/2,cy-h/2,cx+w/2,cy+h/2),22,fill=bg,outline=INK,width=8)
    d.text((cx,cy+2),t,font=f,anchor='mm',fill=fg)
def grade(im, top=0.55, bot=0.35):
    g=Image.new('RGBA',im.size,(0,0,0,0)); d=ImageDraw.Draw(g); W,H=im.size
    for y in range(H):
        a=0
        if y<620: a=int(255*top*(1-y/620))
        if y>1250: a=int(255*bot*(y-1250)/(H-1250))
        d.line([(0,y),(W,y)],fill=(10,6,14,a))
    im.alpha_composite(g)
# --- capa A: Juliana travada ---
im=Image.open('work/cover/f1490.jpg').convert('RGBA'); grade(im)
boxed(im,'O BENTO RESOLVE #1',540,150,46,(15,123,108))
outlined(im,'PIX',540,330,250,(255,210,63))
outlined(im,'ERRADO!',540,515,175,(255,255,255))
boxed(im,'R$ 1.200 PRO DESCONHECIDO',540,1420,62,(224,50,43))
outlined(im,'E AGORA?',540,1560,96,(255,210,63))
im.convert('RGB').save('out/capa_A.jpg',quality=93)
# --- capa B: o dígito trocado ---
im=Image.open('work/cover/f0004.jpg').convert('RGBA'); grade(im,0.7,0.4)
boxed(im,'O BENTO RESOLVE #1',540,105,44,(15,123,108))
outlined(im,'1 NÚMERO TROCADO',540,235,118,(255,255,255))
d=ImageDraw.Draw(im)
cx,cy=646,724
for w,c in [(18,INK),(9,(255,210,63))]: d.ellipse((cx-56,cy-80,cx+60,cy+80),outline=c,width=w)
# arrow from the title down to the digit
for w,c in [(30,INK),(16,(255,210,63))]:
    d.line([(850,330),(740,560)],fill=c,width=w)
    d.polygon([(700,640),(690,520),(800,575)],fill=c) if c!=INK else d.polygon([(692,660),(675,505),(818,575)],fill=c)
boxed(im,'R$ 1.200 PRO ESTRANHO',540,1210,70,(224,50,43))
outlined(im,'E AGORA?',540,1350,100,(255,210,63))
im.convert('RGB').save('out/capa_B.jpg',quality=93)
