import json,re
w=json.load(open('work/words.json'))
fix={'PIX.':'Pix.'}
words=[{'w':fix.get(x['w'],x['w']),'a':round(x['s']*30),'b':round(x['e']*30)} for x in w]
# phrases at punctuation / pauses
phr=[];cur=[]
for i,x in enumerate(words):
    cur.append(x); nxt=words[i+1] if i+1<len(words) else None
    if re.search(r'[.?!,]$',x['w']) or x['w'].endswith('...') or (nxt and nxt['a']-x['b']>9): phr.append(cur); cur=[]
if cur: phr.append(cur)
L=lambda ws: len(' '.join(y['w'] for y in ws))
chunks=[]
for p in phr:
    n=max(1,-(-L(p)//24))  # pieces of <=24 chars, balanced
    while n<len(p):
        # best balanced split into n pieces (greedy by target length)
        tgt=L(p)/n; pieces=[];c=[]
        for y in p:
            if c and L(c+[y])>tgt+4 and len(pieces)<n-1: pieces.append(c); c=[]
            c.append(y)
        pieces.append(c)
        if all(L(q)<=26 for q in pieces): break
        n+=1
    else: pieces=[p] if n==1 else [[y] for y in p]
    if n==1: pieces=[p]
    chunks+=pieces
# merge a short phrase into the previous one when tiny and close
merged=[]
for c in chunks:
    if merged and L(c)<=6 and L(merged[-1])+L(c)<=24 and c[0]['a']-merged[-1][-1]['b']<8 and not re.search(r'[.?!]$',merged[-1][-1]['w']): merged[-1]=merged[-1]+c
    else: merged.append(c)
out=[]
for i,c in enumerate(merged):
    a=c[0]['a']-2; nb=merged[i+1][0]['a']-2 if i+1<len(merged) else 2358
    out.append({'a':a,'b':min(nb,c[-1]['b']+12),'w':[[y['w'],y['a']] for y in c]})
open('web/captions.js','w').write('export const CAPS = '+json.dumps(out,ensure_ascii=False)+';\n')
for c in out: print(c['a'],c['b'],' '.join(y[0] for y in c['w']))
