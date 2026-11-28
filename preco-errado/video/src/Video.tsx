import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Person, BENTO, PAULO, POSES, Pose, Face} from './Person';
import {Backdrop} from './Scenery';
import {DEFS, Data, Word, BgItem, Ctx, LeadCue, Expr, FPS, fr, clamp, eo, pop, mv, vis} from './Scenes';

const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/* ---------------- título no terço superior ---------------- */
const Headline: React.FC<{text: string; s: number}> = ({text, s}) => {
  const parts = text.split(/(\[[^\]]+\])/g).filter(Boolean);
  const size = text.length > 26 ? 100 : 122;
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: 410, transform: `translateY(-50%) scale(${s})`,
      textAlign: 'center', font: `900 ${size}px/1.04 Inter`, color: '#fff', letterSpacing: -1,
      WebkitTextStroke: '22px #1A0E06', paintOrder: 'stroke fill', textShadow: '0 12px 0 rgba(60,20,0,0.5)'}}>
      {parts.map((p, i) => p.startsWith('[')
        ? <span key={i} style={{color: '#FFE11A'}}>{p.slice(1, -1)}</span>
        : <span key={i}>{p}</span>)}
    </div>
  );
};

/* ---------------- legendas palavra a palavra ---------------- */
const chunkWords = (words: Word[]) => {
  const out: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w) => {
    cur.push(w);
    if (cur.length === 3 || /[.,?!:;]$/.test(w.w)) { out.push(cur); cur = []; }
  });
  if (cur.length) out.push(cur);
  return out;
};

const Captions: React.FC<{words: Word[]; t: number}> = ({words, t}) => {
  const chunks = React.useMemo(() => chunkWords(words), [words]);
  const lead = 1 / FPS;
  let ci = -1;
  for (let i = 0; i < chunks.length; i++) if (chunks[i][0].s - lead <= t || i === 0) ci = i;
  const ch = chunks[ci];
  const last = ch[ch.length - 1];
  if (t > last.e + 0.5 && ci < chunks.length) return null;
  let wi = 0;
  ch.forEach((w, i) => { if (w.s - lead <= t) wi = i; });
  const clean = (s: string) => s.replace(/[!:;]/g, '').replace(/,(?!\d)/g, '').replace(/\.$/, '').toUpperCase();
  return (
    <div style={{position: 'absolute', left: 50, right: 150, top: 1350, transform: 'translateY(-50%)', textAlign: 'center',
      font: '900 94px/1.1 Inter', WebkitTextStroke: '20px #000', paintOrder: 'stroke fill', color: '#fff',
      textShadow: '0 8px 0 rgba(0,0,0,0.5)'}}>
      {ch.map((w, i) => (
        <span key={i} style={{color: i === wi ? '#FFE11A' : '#fff', display: 'inline-block', margin: '0 14px',
          transform: i === wi ? 'scale(1.08)' : 'none'}}>{clean(w.w)}</span>
      ))}
    </div>
  );
};

/* ---------------- camada de cenário com transições ---------------- */
const BackdropLayer: React.FC<{bgs: BgItem[]; f: number; t: number}> = ({bgs, f, t}) => {
  let bi = 0;
  bgs.forEach((b, i) => { if (fr(b.at) <= f) bi = i; });
  const cur = bgs[bi];
  const b0 = fr(cur.at);
  const prev = bi > 0 ? bgs[bi - 1] : null;
  const D = 8;
  const style: React.CSSProperties = {position: 'absolute', inset: 0, filter: 'blur(2.5px) saturate(0.92) brightness(0.9)'};
  if (prev && prev.kind !== cur.kind && f - b0 < D) {
    // chicote (whip pan)
    const k = Easing.inOut(Easing.cubic)((f - b0) / D);
    const dir = bi % 2 ? 1 : -1;
    const blur = 2.5 + 24 * Math.sin(Math.PI * k);
    return (
      <AbsoluteFill style={{...style, filter: `blur(${blur}px) saturate(0.92) brightness(0.9)`}}>
        <AbsoluteFill style={{transform: `translateX(${-dir * k * 1300}px)`}}><Backdrop kind={prev.kind} v={prev.v} t={t} /></AbsoluteFill>
        <AbsoluteFill style={{transform: `translateX(${dir * (1 - k) * 1300}px)`}}><Backdrop kind={cur.kind} v={cur.v} t={t} /></AbsoluteFill>
      </AbsoluteFill>
    );
  }
  // corte seco com "punch" de câmera quando muda só o ângulo
  // troca de ângulo: corte seco (sem zoom)
  const lt = cur.kind === 'fogos' ? t - cur.at : t;
  return (
    <AbsoluteFill style={style}>
      <Backdrop kind={cur.kind} v={cur.v} t={lt} />
    </AbsoluteFill>
  );
};


/* pose + rosto de cada expressão (Paulo e Dr. Bento usam o mesmo mapa) */
const poseOf = (e: Expr, t: number): {pose: Pose; face: Face; finger?: 'down' | 'up'} => {
  switch (e) {
    case 'choque': return {pose: POSES.handsHead, face: 'shock'};
    case 'neutro': return {pose: POSES.down, face: 'neutral'};
    case 'explicando': return {pose: POSES.give, face: 'smile'};
    case 'preocupado': return {pose: POSES.shrug, face: 'worried'};
    case 'triste': return {pose: POSES.down, face: 'sad'};
    case 'feliz': return {pose: POSES.hips, face: 'happy'};
    case 'confiante': return {pose: POSES.hips, face: 'smug'};
    case 'bravo': return {pose: {L: [8, 0], R: [150, 15]}, face: 'angry', finger: 'up'};
    case 'apontando': return {pose: POSES.pointDown, face: 'smile', finger: 'down'};
    case 'acenando': return {pose: {L: [8, 0], R: [165 + Math.sin(t * 9) * 16, -25 + Math.sin(t * 9) * 10]}, face: 'smile'};
    case 'confuso': return {pose: POSES.scratch, face: 'worried'};
  }
};

export const Video: React.FC<{data: Data}> = ({data}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const T = data.frames / FPS;
  const [handle] = useState(() => delayRender('fontes'));
  useEffect(() => {
    const fonts = [new FontFace('Inter', `url(${staticFile('fonts/Inter-Black.otf')})`, {weight: '900'})];
    Promise.all(fonts.map((x) => x.load())).then((l) => { l.forEach((x) => (document as any).fonts.add(x)); continueRender(handle); });
  }, [handle]);

  let si = 0;
  data.scenes.forEach((s, i) => { if (fr(s.start) <= f) si = i; });
  const sc = data.scenes[si];
  const s0 = fr(sc.start);
  const c: Record<string, number> = {};
  Object.entries(sc.cues).forEach(([k, v]) => (c[k] = fr(v)));
  const end = si + 1 < data.scenes.length ? fr(data.scenes[si + 1].start) : data.frames;
  const ctx: Ctx = {f, t, s0, c, q: sc.seq ?? {}, data, end};
  const def = DEFS[sc.id];
  // o fundo de cada cena começa onde a anterior parou se a cena não troca de cenário
  const bgs = data.scenes.flatMap((s) => s.bg);

  // tremidas (sem zoom: só deslocamento)
  const big: number[] = [], small: number[] = [];
  data.sfx.forEach((e: any) => {
    if (e.k === 'impact') big.push(fr(e.t));
    if (['stamp', 'gavel', 'thud', 'register'].includes(e.k)) small.push(fr(e.t));
  });
  let sx = 0, sy = 0;
  small.forEach((a) => { if (vis(f, a, a + 4)) { const k = f - a; sx = [7, -6, 4, -2][k]; sy = [-5, 5, -3, 2][k]; } });
  big.forEach((a) => { if (vis(f, a, a + 6)) { const k = f - a; sx = [20, -16, 12, -8, 5, -2][k]; sy = [-12, 14, -10, 7, -4, 2][k]; } });

  const heads = def.heads(ctx).filter((h) => h.at <= f);
  const head = heads[heads.length - 1];
  const headS = head ? (head.at === 0 && f < 6 ? 1 : pop(f, head.at)) : 0;

  // personagem principal da cena (Paulo na história, Dr. Bento na lei)
  const P = def.lead === 'bento' ? BENTO : PAULO;
  const cl = def.cues(ctx).filter((b) => b.at <= f);
  const cur: LeadCue = cl[cl.length - 1] ?? {at: s0, e: 'neutro'};
  const prevDef = si > 0 ? DEFS[data.scenes[si - 1].id] : null;
  const prev: LeadCue = cl.length > 1 ? cl[cl.length - 2]
    : (prevDef && prevDef.lead === def.lead ? (prevDef.cues({...ctx}).slice(-1)[0] ?? cur) : cur);
  const pc = poseOf(cur.e, t), pp = poseOf(prev.e, t);
  const mixE = Easing.inOut(Easing.cubic)(cur.at === 0 ? 1 : Math.min(1, (f - cur.at) / 6));
  const lerpP = (a: Pose, b: Pose): Pose => ({L: [a.L[0] + (b.L[0] - a.L[0]) * mixE, a.L[1] + (b.L[1] - a.L[1]) * mixE],
    R: [a.R[0] + (b.R[0] - a.R[0]) * mixE, a.R[1] + (b.R[1] - a.R[1]) * mixE]});
  const hold = def.leadHold ? def.leadHold(ctx) : {};
  let pose = hold.pose ?? lerpP(pp.pose, pc.pose);
  let face: Face = pc.face;
  let finger = hold.pose ? undefined : pc.finger;
  let lx = 760, walk: number | null = null;
  const wi = def.walkIn ? def.walkIn(ctx) : null;
  if (wi !== null && f >= wi && f < wi + 20) {
    lx = 1380 - 620 * Easing.out(Easing.quad)((f - wi) / 20); walk = (f - wi) / 10; pose = POSES.walk; face = 'smile'; finger = undefined;
  }
  if (sc.id === 's8') { walk = f / 14; lx = 780 - mv(f, s0, 0, 40, end - s0); }
  const speaking = data.words.some((w) => w.s <= t && t <= w.e);
  const talk = def.lead === 'bento' && speaking ? 0.85 : 0;
  const ls = (def.leadScale ? def.leadScale(ctx) : 1) * (cur.at === 0 ? 1 : interpolate(f, [cur.at, cur.at + 6], [0.96, 1], {...clamp, easing: eo}));
  const look = cur.e === 'choque' ? 0 : walk !== null ? 0 : -0.6;

  const enter = si === 0 ? 1 : pop(f, s0);
  const leak = si > 0 ? Math.max(0, 1 - (f - s0) / 12) : 0;
  const suspense = sc.id === 's13' ? 0.35 + 0.25 * Math.exp(-(((t * 1.6) % 1) * 9)) : 0;
  const flash = sc.id === 's14' && vis(f, s0, s0 + 7) ? mv(f, s0, 0.8, 0, 7) : 0;

  return (
    <AbsoluteFill style={{background: '#2A1206', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px)`}}>
        <BackdropLayer bgs={bgs} f={f} t={t} />
        {Array.from({length: 14}, (_, i) => {
          const y = ((rnd(i) * 1900 - t * (14 + rnd(i + 1) * 20)) % 1900 + 1900) % 1900;
          return <div key={i} style={{position: 'absolute', left: rnd(i + 2) * 1080 + Math.sin(t * 0.7 + i) * 30, top: y,
            width: 6 + rnd(i + 3) * 12, height: 6 + rnd(i + 3) * 12, borderRadius: '50%', background: '#FFE2B0',
            opacity: 0.1 + 0.12 * rnd(i + 4), filter: 'blur(2px)'}} />;
        })}
        <AbsoluteFill style={{transform: `scale(${enter})`, transformOrigin: '360px 960px'}}>{def.draw(ctx)}</AbsoluteFill>
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible',
          filter: 'drop-shadow(-6px 0 16px rgba(255,190,110,0.30))'}}>
          <g transform={`translate(${lx} 1660) scale(${ls}) translate(${-lx} -1660)`}>
            <Person P={P} x={lx} y={1660} s={0.92} t={t} expr={face} pose={pose} look={look} talk={talk} walk={walk}
              holdL={hold.L} holdR={hold.R} finger={finger} wiggle={cur.e === 'confuso' ? 7 : 0} />
          </g>
        </svg>
        {def.extra && def.extra(ctx)}
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(255,150,60,0.08), rgba(0,0,0,0) 40%, rgba(80,30,0,0.14))', mixBlendMode: 'soft-light'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 58%, rgba(25,8,0,0.42) 100%)'}} />
      {suspense > 0 && <AbsoluteFill style={{background: `radial-gradient(ellipse at 45% 50%, rgba(0,0,0,0) 30%, rgba(40,0,0,${suspense}) 100%)`}} />}
      {leak > 0 && <AbsoluteFill style={{background: `radial-gradient(circle at ${si % 2 ? 100 : 0}% 20%, rgba(255,170,60,${0.5 * leak}) 0%, rgba(255,120,40,0) 60%)`,
        mixBlendMode: 'screen'}} />}
      {flash > 0 && <AbsoluteFill style={{background: `rgba(255,240,200,${flash})`}} />}
      <AbsoluteFill style={{opacity: 0.06, mixBlendMode: 'overlay'}}>
        <svg width={1080} height={1920}>
          <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 12} /></filter>
          <rect width={1080} height={1920} filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
      {head && headS > 0 && <Headline text={head.text} s={headS} />}
      {data.name === 'youtube' && f >= data.frames - 90 && (
        <div style={{position: 'absolute', left: 0, right: 120, top: 1480, display: 'flex', justifyContent: 'center',
          transform: `scale(${pop(f, data.frames - 90)})`}}>
          <div style={{background: 'rgba(20,8,2,0.85)', color: '#fff', font: '900 29px Inter', padding: '12px 22px', whiteSpace: 'nowrap',
            borderRadius: 40, border: '4px solid #FFE11A'}}>
            Todo dia uma história real de dinheiro → <span style={{color: '#FFE11A'}}>Inscreva-se</span>
          </div>
        </div>
      )}
      <Captions words={data.words} t={t} />
    </AbsoluteFill>
  );
};
