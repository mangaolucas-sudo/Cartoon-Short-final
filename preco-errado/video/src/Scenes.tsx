import React from 'react';
import {Easing, interpolate} from 'remotion';
import {Person, CAIXA, GERENTE, PAULO, FILA, POSES} from './Person';
import * as P from './props';
import * as Q from './props2';
import * as R from './props3';

/* ---------------- tipos e utilitários ---------------- */
export type Expr = 'choque' | 'neutro' | 'preocupado' | 'triste' | 'feliz' | 'apontando' | 'acenando' | 'confuso' | 'bravo' | 'confiante' | 'explicando';
export type Word = {w: string; s: number; e: number};
export type BgItem = {at: number; kind: string; v: number};
export type Scene = {id: string; start: number; cues: Record<string, number>; bg: BgItem[]; seq: Record<string, any>};
export type Data = {name: string; fps: number; duration: number; frames: number; scenes: Scene[]; words: Word[]; sfx: any[]; duck: number[] | null};
export const FPS = 30;
export const fr = (s: number) => Math.round(s * FPS);
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const eo = Easing.out(Easing.cubic);
const eio = Easing.inOut(Easing.cubic);
export const pop = (f: number, at: number) => {
  if (f < at) return 0;
  const k = Math.min(1, (f - at) / 7);
  return 0.8 + 0.2 * eo(k) + 0.08 * Math.sin(Math.PI * k) * (1 - k);
};
export const mv = (f: number, at: number, a: number, b: number, d = 8) => interpolate(f, [at, at + d], [a, b], {...clamp, easing: eio});
export const vis = (f: number, a: number, b = Infinity) => f >= a && f < b;
export const lastIdx = (arr: number[], f: number) => { let i = -1; arr.forEach((a, k) => { if (a <= f) i = k; }); return i; };

export const At: React.FC<{x: number; y: number; s?: number; r?: number; o?: number; sh?: boolean; children: React.ReactNode}> =
  ({x, y, s = 1, r = 0, o = 1, sh = true, children}) =>
    s <= 0 ? null : (
      <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(${r}deg) scale(${s})`,
        opacity: o, filter: sh ? 'drop-shadow(0 14px 0 rgba(40,14,0,0.35)) drop-shadow(0 0 30px rgba(0,0,0,0.25))' : undefined}}>{children}</div>
    );
const Stage: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>{children}</svg>
);
const Big: React.FC<{text: string; size?: number; color?: string}> = ({text, size = 90, color = '#fff'}) => (
  <div style={{font: `900 ${size}px/1 Inter`, color, WebkitTextStroke: `${size / 6}px #1A0E06`, paintOrder: 'stroke fill', whiteSpace: 'nowrap'}}>{text}</div>
);

export type Ctx = {f: number; t: number; s0: number; c: Record<string, number>; q: Record<string, any>; data: Data; end: number};
export type LeadCue = {at: number; e: Expr};
export type Def = {
  lead: 'paulo' | 'bento';
  heads: (x: Ctx) => {at: number; text: string}[];
  cues: (x: Ctx) => LeadCue[];
  draw: (x: Ctx) => React.ReactNode;
  leadScale?: (x: Ctx) => number;
  leadHold?: (x: Ctx) => {L?: React.ReactNode; R?: React.ReactNode; pose?: any};
  walkIn?: (x: Ctx) => number | null;
  extra?: (x: Ctx) => React.ReactNode; // desenhado acima do personagem principal
};

export const HOOK = 'PAGA OU [DEIXA?]';

/* gancho: etiqueta x visor do caixa (quadro 0 e loop) */
const hookProps = (f: number, a0: number, cx: number | null, n32: number | null, still = false) => {
  const jump = still ? false : f >= a0 + 4;
  const blink = jump && Math.floor((f - a0) / 4) % 2 === 0;
  const kick = (at: number | null) => (at !== null && f >= at ? 1 + 0.18 * Math.exp(-(f - at) / 4) * Math.cos((f - at) * 0.8) : 1);
  const k = jump ? kick(a0 + 4) * kick(cx) * kick(n32) : 1;
  const bip = (at: number | null) => !still && at !== null && vis(f, at, at + 14);
  return (
    <>
      <At x={360} y={690} r={-3}><R.ShelfTag w={520} price="R$ 19,90" /></At>
      <At x={605} y={590}><R.Check s={110} /></At>
      <At x={370} y={1030} s={k}><R.Register w={540} price={jump ? 'R$ 32,90' : 'R$ 19,90'} red={jump} glow={blink} /></At>
      {(bip(a0 + 4) || bip(cx)) && <At x={170} y={880} r={-10} sh={false} s={pop(f, bip(cx) ? cx! : a0 + 4)}><Big text="BIP!" size={74} color="#FFE11A" /></At>}
    </>
  );
};

/* ---------------- CENAS ---------------- */
export const DEFS: Record<string, Def> = {
  s1: {
    lead: 'paulo',
    heads: () => [{at: 0, text: HOOK}],
    cues: () => [{at: 0, e: 'choque'}],
    draw: ({f, c}) => hookProps(f, 0, c.caixa, c.n32),
  },
  s2: {
    lead: 'paulo',
    heads: ({s0}) => [{at: s0, text: HOOK}],
    cues: ({s0, c}) => [{at: s0, e: 'preocupado'}, {at: c.pd, e: 'choque'}],
    draw: ({f, t, s0, c}) => (
      <>
        <Stage><Person P={CAIXA} x={300} y={1520} s={0.82} t={t} expr="smug" pose={POSES.hips} look={0.6} talk={vis(f, s0, c.pd + 50) ? 0.7 : 0} /></Stage>
        {f >= c.pd && <At x={360} y={640} s={pop(f, c.pd)}><R.Balloon w={440} text="PAGA OU DEIXA." /></At>}
      </>
    ),
  },
  s3: {
    lead: 'paulo',
    heads: ({s0, c}) => [{at: s0, text: 'O PAULO [PAGOU]'}, {at: c.perdeu, text: 'PAGOU [+R$ 13] À TOA'}],
    cues: ({s0, c}) => [{at: s0, e: 'triste'}, {at: c.perdeu, e: 'preocupado'}],
    leadHold: ({f, s0}) => (f < s0 + 24 ? {pose: {L: [70, -20], R: [8, 0]}, L: <g transform="translate(-150 -60) scale(0.5)"><Q.Note w={300} name="REAL" head="50" /></g>} : {}),
    draw: ({f, s0, c}) => (
      <>
        <At x={360} y={760}><R.Register w={500} price="R$ 32,90" red label="PAGO ✓" /></At>
        {f >= c.perdeu && <At x={340} y={mv(f, c.perdeu, 980, 1150, 20)} s={pop(f, c.perdeu)} r={-6}>
          <div style={{background: '#E0443A', border: '9px solid #1E120B', borderRadius: 22, padding: '6px 30px'}}><Big text="−R$ 13,00" size={84} /></div>
        </At>}
        {f >= c.perdeu && [0, 1, 2, 3, 4].map((i) => {
          const k = Math.min(1, (f - c.perdeu) / 24);
          return <At key={i} x={340 + (i - 2) * 70 + k * (i - 2) * 80} y={1050 + k * k * 500 - Math.sin(k * Math.PI) * 120} r={k * 300 * (i % 2 ? 1 : -1)} o={1 - k} sh={false}>
            <Q.Coin1 size={70} spin={k * 6} /></At>;
        })}
        {f < s0 + 30 && null}
      </>
    ),
  },
  s4: {
    lead: 'paulo',
    heads: ({s0}) => [{at: s0, text: 'A LEI TAVA [DO LADO DELE]'}],
    cues: ({s0}) => [{at: s0, e: 'choque'}],
    draw: ({f, s0, c}) => (
      <>
        <At x={360} y={720} r={-3} s={0.8}><R.ShelfTag w={520} price="R$ 19,90" /></At>
        {f >= c.lado - 4 && <At x={350} y={1040} r={-10} s={mv(f, c.lado - 4, 1.8, 1, 5)}><P.Stamp text="ELE TINHA RAZÃO" w={560} color="#fff" /></At>}
        {f < s0 && null}
      </>
    ),
  },
  s5: {
    lead: 'paulo',
    heads: ({s0, c}) => [{at: s0, text: 'ELE MOSTROU [A ETIQUETA]'}, {at: c.sistema, text: '"O CERTO É O [DO SISTEMA]"'}],
    cues: ({s0, c}) => [{at: s0, e: 'explicando'}, {at: c.sistema, e: 'bravo'}],
    leadHold: ({f, s0}) => ({pose: {L: [55, -115], R: [40, 70]}, L: <g transform="translate(-70 -260) scale(0.55)"><R.Phone w={260} /></g>}),
    draw: ({f, t, c}) => (
      <>
        <Stage><Person P={CAIXA} x={300} y={1520} s={0.82} t={t} expr={f >= c.nem ? 'smug' : 'neutral'} pose={POSES.hips}
          flip={f >= c.nem} look={f >= c.nem ? -0.8 : 0.6} talk={f >= c.sistema && f < c.sistema + 40 ? 0.7 : 0} /></Stage>
        {f >= c.sistema && <At x={350} y={620} s={pop(f, c.sistema)}><R.Balloon w={500} text="É O DO SISTEMA." /></At>}
      </>
    ),
  },
  s6: {
    lead: 'paulo',
    heads: ({s0, c, data}) => [{at: s0, text: data.name === 'tiktok' ? 'CHAMOU [O GERENTE]' : 'O GERENTE [AINDA DISSE]'}, {at: c.velha, text: '"ETIQUETA [VELHA]"'}, {at: c.naovale, text: '"[NÃO VALE]"'}],
    cues: ({s0, c}) => [{at: s0, e: 'explicando'}, {at: c.naovale, e: 'triste'}],
    draw: ({f, t, s0, c}) => {
      const wx = mv(f, s0, -220, 290, 22);
      const walking = f < s0 + 22;
      return (
        <>
          <At x={360} y={680} r={-3} s={0.86}><R.ShelfTag w={520} price="R$ 19,90" /></At>
          {f >= c.velha && <At x={360} y={690} r={-12} s={mv(f, c.velha, 1.8, 1, 5)}><P.Stamp text="VELHA" w={360} /></At>}
          {f >= c.naovale && <At x={590} y={600} s={pop(f, c.naovale) * 1.1}><R.Check s={130} ok={false} /></At>}
          <Stage><Person P={GERENTE} x={wx} y={1530} s={0.82} t={t} expr="smug" walk={walking ? (f - s0) / 10 : null}
            pose={walking ? POSES.walk : {L: [8, 0], R: [150, 15]}} finger={walking ? null : 'up'} look={0.5}
            talk={f >= c.velha && f < c.naovale + 25 ? 0.8 : 0} /></Stage>
        </>
      );
    },
  },
  s7: {
    lead: 'paulo',
    heads: ({s0, c}) => [{at: s0, text: 'A FILA [BUFANDO]'}, {at: c.vergonha, text: 'ELE FICOU [COM VERGONHA]'}],
    cues: ({s0, c}) => [{at: s0, e: 'preocupado'}, {at: c.vergonha, e: 'triste'}],
    leadScale: ({f, c}) => mv(f, c.vergonha, 1, 0.82, 24),
    draw: ({f, t, s0, c}) => (
      <>
        <At x={560} y={640} s={pop(f, s0)}><R.Clock w={170} t={t} speed={6} /></At>
        <Stage>
          {FILA.map((sp, i) => (
            <Person key={i} P={sp} x={110 + i * 130} y={1470 - (i % 2) * 14 + Math.abs(Math.sin(t * 5 + i)) * -8} s={0.5} t={t}
              expr={i % 2 ? 'angry' : 'smug'} pose={i % 2 ? POSES.hips : {L: [40, 70], R: [40, 70]}} look={0.8} />
          ))}
        </Stage>
        {f >= s0 + 6 && ['😤', '⏱️', '🙄'].map((e, i) => (
          <At key={i} x={130 + i * 160} y={820 - Math.abs(Math.sin(t * 3 + i)) * 20} s={pop(f, s0 + 6 + i * 5)} sh={false}>
            <div style={{fontSize: 70}}>{e}</div></At>
        ))}
        {f >= c.pagou && <At x={360} y={1180} s={pop(f, c.pagou)}><R.Register w={420} price="R$ 32,90" red label="PAGO" /></At>}
      </>
    ),
  },
  s8: {
    lead: 'paulo',
    heads: ({s0, c}) => [{at: s0, text: '13 REAIS [A MAIS]'}, {at: c.saiu, text: 'E O ERRADO [ERA ELE?]'}],
    cues: ({s0}) => [{at: s0, e: 'triste'}],
    leadHold: () => ({pose: {L: [8, 0], R: [12, 0]}, R: <g transform="translate(-50 -10) scale(0.5)"><R.Bag w={200} /></g>}),
    draw: ({f, s0, c}) => (
      <>
        <At x={340} y={900} s={pop(f, s0)} r={-5}>
          <div style={{background: '#E0443A', border: '9px solid #1E120B', borderRadius: 22, padding: '6px 30px'}}><Big text="−R$ 13" size={120} /></div>
        </At>
        {f >= c.saiu && <At x={330} y={1130} s={pop(f, c.saiu)}><Big text="?" size={220} color="#FFE11A" /></At>}
      </>
    ),
    extra: ({t}) => <At x={760} y={740} sh={false}><R.RainCloud w={300} t={t} /></At>,
  },
  s9: {
    lead: 'bento',
    heads: ({s0, c}) => [{at: s0, text: 'CALMA, QUE O [BENTO CONTA]'}],
    cues: ({s0, c}) => [{at: s0, e: 'feliz'}, {at: c.bento, e: 'confiante'}],
    walkIn: ({s0}) => s0,
    draw: ({f, t, s0}) => (
      <Stage><Person P={PAULO} x={300} y={1560} s={0.72} t={t} expr={f >= s0 + 20 ? 'smile' : 'sad'} pose={POSES.down} look={0.8} /></Stage>
    ),
  },
  s10: {
    lead: 'bento',
    heads: ({s0, data}) => [{at: s0, text: data.name === 'tiktok' ? 'ETIQUETA VELHA [NÃO É DESCULPA]' : 'VALE [SIM!]'}],
    cues: ({s0}) => [{at: s0, e: 'bravo'}, {at: s0 + 18, e: 'confiante'}],
    draw: ({f, s0, data}) => (
      <>
        <At x={360} y={780} r={-3}><R.ShelfTag w={520} price="R$ 19,90" /></At>
        {data.name === 'tiktok'
          ? f >= s0 + 10 && <At x={370} y={1060} r={-10} s={mv(f, s0 + 10, 1.8, 1, 5)}><P.Stamp text="NÃO É DESCULPA" w={560} /></At>
          : <At x={360} y={1060} s={pop(f, s0 + 4)}><R.Check s={200} /></At>}
      </>
    ),
  },
  s11: {
    lead: 'bento',
    heads: ({s0, c}) => [{at: s0, text: 'LEI [10.962/2004]'}, {at: c.dif, text: 'PREÇO [DIFERENTE]?'}, {at: c.menor, text: 'VOCÊ PAGA [O MENOR]'}],
    cues: ({s0, c}) => [{at: s0, e: 'explicando'}, {at: c.menor, e: 'feliz'}],
    draw: ({f, s0, c}) => (
      <>
        <At x={350} y={690} s={pop(f, c.lei)}><R.LawCard w={540} title="LEI 10.962/2004" sub="ART. 5º" /></At>
        {f >= c.dif && <At x={340} y={1100} s={pop(f, c.dif)}>
          <R.Scale w={540} tilt={f >= c.menor ? -mv(f, c.menor, 0, 1, 10) : Math.sin((f - c.dif) / 6) * 0.25} left="R$ 19,90" right="R$ 32,90"
            win={f >= c.menor + 8 ? 1 : 0} /></At>}
        {f >= c.menor + 8 && <At x={150} y={1010} s={pop(f, c.menor + 8)}><R.Check s={120} /></At>}
        {f < s0 && null}
      </>
    ),
  },
  s12: {
    lead: 'bento',
    heads: ({s0, c}) => [{at: s0, text: 'CÓDIGO DE DEFESA [DO CONSUMIDOR]'}, {at: c.promessa, text: 'PREÇO ANUNCIADO = [PROMESSA]'},
      {at: c.cumprir, text: 'A LOJA [TEM QUE CUMPRIR]'}],
    cues: ({s0, c}) => [{at: s0, e: 'explicando'}, {at: c.cumprir, e: 'bravo'}],
    draw: ({f, s0, c}) => (
      <>
        {f < c.promessa && <At x={350} y={760} s={pop(f, s0)}><R.LawCard w={540} title="CDC · ART. 30" sub="A OFERTA OBRIGA" color="#2c9877" /></At>}
        {f >= c.promessa && <At x={340} y={1000} s={pop(f, c.promessa)} r={-3}><R.Contract w={420} sign={mv(f, c.promessa + 6, 0, 1, 24)} /></At>}
        {f >= c.cumprir && <At x={350} y={1150} r={-10} s={mv(f, c.cumprir, 1.8, 1, 5)}><P.Stamp text="TEM QUE CUMPRIR" w={560} color="#fff" /></At>}
      </>
    ),
  },
  s13: {
    lead: 'bento',
    heads: ({s0}) => [{at: s0, text: 'MAS TEM [UMA EXCEÇÃO]'}],
    cues: ({s0}) => [{at: s0, e: 'preocupado'}, {at: s0 + 20, e: 'bravo'}],
    draw: ({f, t, s0}) => (
      <At x={340} y={930} s={pop(f, s0 + 3) * (1 + 0.06 * Math.exp(-(((t * 1.6) % 1) * 6)))}><R.Warning s={320} /></At>
    ),
  },
  s14: {
    lead: 'bento',
    heads: ({s0, c}) => [{at: s0, text: 'TV POR [R$ 9,90]?'}, {at: Math.max(c.grosseiro, s0 + 25), text: '[ERRO GROSSEIRO]'}],
    cues: ({s0}) => [{at: s0, e: 'confuso'}, {at: s0 + 30, e: 'confiante'}],
    draw: ({f, s0, c}) => (
      <>
        <At x={350} y={980} s={pop(f, s0)}><R.TV w={560} price="R$ 9,90" flash={vis(f, c.tv, c.tv + 48) && Math.floor(f / 4) % 2 === 0} /></At>
        {f >= Math.max(c.grosseiro, s0 + 25) && <At x={350} y={1150} r={-8} s={mv(f, Math.max(c.grosseiro, s0 + 25), 1.8, 1, 5)}>
          <P.Stamp text="ERRO GROSSEIRO" w={560} /></At>}
      </>
    ),
  },
  s15: {
    lead: 'bento',
    heads: ({s0}) => [{at: s0, text: 'AÍ A LOJA [NÃO É OBRIGADA]'}],
    cues: ({s0}) => [{at: s0, e: 'explicando'}],
    draw: ({f, s0, q}) => {
      const hits: number[] = q.gavel.map(fr);
      const hi = lastIdx(hits, f);
      const ang = hi < 0 ? mv(f, s0, 0, -45, 8) : (f - hits[hi] < 3 ? 0 : -45 * Math.min(1, (f - hits[hi] - 3) / 6));
      return (
        <>
          <At x={350} y={680} s={pop(f, s0)}><R.LawCard w={520} title="STJ" sub="ERRO GROSSEIRO" color="#6b4024" /></At>
          <At x={330} y={1090}><R.Gavel w={360} angle={ang} /></At>
        </>
      );
    },
  },
  s16: {
    lead: 'bento',
    heads: ({s0, c}) => [{at: s0, text: 'SABÃO EM PÓ [R$ 19,90]?'}, {at: c.normal, text: 'PREÇO [NORMAL]'}, {at: c.vale, text: '[VALE A ETIQUETA]'}],
    cues: ({s0, c}) => [{at: s0, e: 'explicando'}, {at: c.normal, e: 'feliz'}],
    draw: ({f, s0, c}) => (
      <>
        <At x={360} y={690} r={-3} s={0.86}><R.ShelfTag w={520} price="R$ 19,90" /></At>
        <At x={330} y={1100} s={pop(f, s0 + 3)}><Q.Product w={300} label="SABÃO" sub="EM PÓ" color="#2f6fd0" /></At>
        {f >= c.normal && <At x={560} y={950} s={pop(f, c.normal) * 1.2}><R.Check s={140} /></At>}
      </>
    ),
  },
  s17: {
    lead: 'bento',
    heads: ({s0}) => [{at: s0, text: 'FAZ [ASSIM] 👇'}],
    cues: ({s0, c}) => [{at: s0, e: 'explicando'}, {at: c.procon, e: 'confiante'}],
    draw: ({f, c}) => {
      const n = [c.foto, c.menor, c.procon].filter((a) => f >= a).length;
      return <At x={350} y={960}><R.Checklist w={560} items={['FOTO DA ETIQUETA', 'PEDE O MENOR', 'CHAMA O PROCON']} n={n} /></At>;
    },
  },
  s18: {
    lead: 'bento',
    heads: ({s0, c, data}) => [{at: s0, text: 'MANDA PRA QUEM [PAGA SEM CONFERIR]'},
      ...(data.name === 'tiktok' ? [{at: c.segue, text: 'SEGUE O [BENTO CONTAÊ]'}] : [])],
    cues: ({s0, c, data}) => [{at: s0, e: 'apontando'}, ...(data.name === 'tiktok' ? [{at: c.segue, e: 'acenando' as Expr}] : [])],
    draw: ({f, t, s0, c, q}) => {
      const tap = q.tap !== undefined ? fr(q.tap) : Infinity;
      return (
        <>
          <At x={340} y={c.segue !== undefined && f >= c.segue ? 820 : 960} s={pop(f, s0) * (1 + 0.08 * Math.sin(t * 7))}><R.ShareIcon s={230} /></At>
          {c.segue !== undefined && f >= c.segue && <At x={340} y={1160} s={pop(f, c.segue) * (vis(f, tap, tap + 4) ? 0.9 : 1)}>
            <P.FollowBtn w={480} done={f >= tap + 2} /></At>}
          {vis(f, tap - 10, tap + 14) && <At x={mv(f, tap - 10, 470, 400, 10)} y={mv(f, tap - 10, 1330, 1200, 10)} sh={false}>
            <div style={{fontSize: 100}}>👆</div></At>}
        </>
      );
    },
  },
  s19: {
    lead: 'paulo',
    heads: ({s0, c}) => [{at: s0, text: 'NA SEMANA [SEGUINTE]...'}, {at: c.olhou, text: HOOK}],
    cues: ({s0, c}) => [{at: s0, e: 'neutro'}, {at: c.olhou, e: 'choque'}],
    walkIn: ({s0}) => s0,
    leadHold: ({f, c}) => (f < c.olhou ? {R: <g transform="translate(-50 -10) scale(0.5)"><R.Bag w={200} /></g>} : {}),
    draw: ({f, c}) => (f >= c.olhou ? hookProps(f, c.olhou, null, null, true) : <At x={360} y={690} r={-3} s={0.8}><R.ShelfTag w={520} price="R$ 19,90" /></At>),
  },
};
