import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Person, BENTO, REPOSITOR, POSES, Pose, Face, HeldCoin, HeldGun} from './Person';

export type Expr = 'choque' | 'neutro' | 'preocupado' | 'triste' | 'feliz' | 'apontando' | 'acenando' | 'confuso';
import * as P from './props';
import * as Q from './props2';
import {Backdrop} from './Scenery';

type Word = {w: string; s: number; e: number};
type BgItem = {at: number; kind: string; v: number};
type Scene = {id: string; start: number; cues: Record<string, number>; bg: BgItem[]; seq: Record<string, any>};
type Data = {name: string; fps: number; duration: number; frames: number; scenes: Scene[]; words: Word[]; sfx: any[]};

const FPS = 30;
const fr = (s: number) => Math.round(s * FPS);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const eo = Easing.out(Easing.cubic);
const eio = Easing.inOut(Easing.cubic);
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** "pop": escala 0.8 → 1.0 (com leve overshoot) em 7 quadros. 0 = ainda invisível. */
const pop = (f: number, at: number) => {
  if (f < at) return 0;
  const k = Math.min(1, (f - at) / 7);
  return 0.8 + 0.2 * eo(k) + 0.08 * Math.sin(Math.PI * k) * (1 - k);
};
const mv = (f: number, at: number, a: number, b: number, d = 8) =>
  interpolate(f, [at, at + d], [a, b], {...clamp, easing: eio});
const vis = (f: number, a: number, b = Infinity) => f >= a && f < b;
const lastIdx = (arr: number[], f: number) => { let i = -1; arr.forEach((a, k) => { if (a <= f) i = k; }); return i; };

const At: React.FC<{x: number; y: number; s?: number; r?: number; o?: number; sh?: boolean; children: React.ReactNode}> =
  ({x, y, s = 1, r = 0, o = 1, sh = true, children}) =>
    s <= 0 ? null : (
      <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(${r}deg) scale(${s})`,
        opacity: o, filter: sh ? 'drop-shadow(0 14px 0 rgba(40,14,0,0.35)) drop-shadow(0 0 30px rgba(0,0,0,0.25))' : undefined}}>{children}</div>
    );

type Ctx = {f: number; t: number; s0: number; c: Record<string, number>; q: Record<string, any>; data: Data; T: number; end: number};
type BentoCue = {at: number; e: Expr; coin?: boolean};
type Def = {
  heads: (x: Ctx) => {at: number; text: string}[];
  bento: (x: Ctx) => BentoCue[];
  draw: (x: Ctx) => React.ReactNode;
};

const HOOK = 'R$ 1 = [2,75 QUINTILHÕES]';
const NUM = '2.750.000.000.000.000.000';

/* número gigante: cresce dígito a dígito */
const BigNumber: React.FC<{n: number; size?: number; punch?: number; y?: number; color?: string; fit?: boolean}> =
  ({n, size = 150, punch = 0, y = 720, color = '#FFE11A', fit = false}) => {
    const txt = NUM.slice(0, Math.max(1, n));
    const sc = fit ? Math.min(1, 1000 / (NUM.length * size * 0.6)) : 1;
    return (
      <div style={{position: 'absolute', left: 540, top: y, transform: `translate(-50%, -50%) scale(${(1 + punch) * sc})`,
        whiteSpace: 'nowrap', font: `900 ${size}px/1 Inter`, color, letterSpacing: -2,
        WebkitTextStroke: `${size * 0.16}px #1A0E06`, paintOrder: 'stroke fill',
        textShadow: `0 10px 0 rgba(60,20,0,0.55), 0 0 60px rgba(255,170,40,${0.35 + punch})`}}>
        {txt.split('').map((ch, i) => (
          <span key={i} style={{display: 'inline-block', transform: i === txt.length - 1 && n < NUM.length ? 'scale(1.15)' : 'none'}}>{ch}</span>
        ))}
      </div>
    );
  };

/* rachaduras de "tela quebrada" */
const Cracks: React.FC<{k: number}> = ({k}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: k}}>
    {[[0, 720, 1], [1080, 720, -1]].map(([x, y, d], i) => (
      <g key={i} stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round"
        style={{filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.8))'}}>
        {Array.from({length: 7}, (_, j) => {
          const a = (j / 6 - 0.5) * 2.4;
          const L = 160 + rnd(j + i * 9) * 220;
          const mx = x + d * Math.cos(a) * L * 0.5, my = y + Math.sin(a) * L * 0.5 + (rnd(j) - 0.5) * 40;
          return <path key={j} d={`M${x} ${y} L${mx} ${my} L${x + d * Math.cos(a) * L} ${y + Math.sin(a) * L}`} />;
        })}
        <circle cx={x} cy={y} r={50} strokeWidth={5} />
      </g>
    ))}
  </svg>
);

/* cena 1 / cena 10: Bento com a moeda + número */
const coinScene = (x: Ctx, full: boolean) => {
  const {f, t, q, c} = x;
  const digits: number[] = full ? q.digits.map(fr) : [0];
  const n = full ? lastIdx(digits, f) + 1 : 1;
  const burst = full ? c.reis : Infinity;
  const punch = f >= burst ? 0.22 * Math.exp(-(f - burst) / 5) * Math.cos((f - burst) * 0.8) : 0;
  const spin = 0.55 * Math.sin((2 * Math.PI * t) / 3.2);
  return (
    <>
      <At x={320} y={1060} r={-6}><Q.Coin1 size={400} spin={spin} shine={0.6 + 0.4 * Math.sin(t * 4)} /></At>
      <BigNumber n={n} punch={punch} />
      {f >= burst && <Cracks k={mv(f, burst, 0, 1, 2)} />}
      {f >= burst && (
        <At x={540} y={720} s={mv(f, burst, 0.4, 2.6, 12)} o={mv(f, burst, 0.9, 0, 12)} sh={false}>
          <div style={{width: 400, height: 400, borderRadius: 200, border: '24px solid #FFF6C9'}} />
        </At>
      )}
    </>
  );
};

/* ---------------- CENAS ---------------- */
const NOTE8 = ['RÉIS', 'CRUZEIRO', 'CRUZEIRO NOVO', 'CRUZEIRO', 'CRUZADO', 'CRUZADO NOVO', 'CRUZEIRO', 'CRUZEIRO REAL'];
const STEPS: [string, string, boolean][] = [['CRUZEIRO', 'CRUZADO', true], ['CRUZADO', 'CRUZADO NOVO', true],
  ['CRUZADO NOVO', 'CRUZEIRO', false], ['CRUZEIRO', 'CRUZEIRO REAL', true]];
const TL: [string, string][] = [['CRUZADO', '1986'], ['CRUZADO NOVO', '1989'], ['CRUZEIRO', '1990'], ['CRUZEIRO REAL', '1993']];
const brl = (v: number) => Math.round(v).toLocaleString('pt-BR');

const DEFS: Record<string, Def> = {
  s1: {
    heads: () => [{at: 0, text: HOOK}],
    bento: ({c}) => [{at: 0, e: 'choque', coin: true}, {at: c.q750, e: 'preocupado', coin: true}, {at: c.reis, e: 'choque', coin: true}],
    draw: (x) => coinScene(x, true),
  },
  s2: {
    heads: ({s0, c}) => [{at: s0, text: 'O BRASIL [TROCOU] DE DINHEIRO'}, {at: c.oito, text: '[8 MOEDAS] EM 52 ANOS'}],
    bento: ({s0, c}) => [{at: s0, e: 'neutro'}, {at: c.oito, e: 'choque'}, {at: c.anos, e: 'preocupado'}],
    draw: ({f, q, c}) => {
      const ts: number[] = q.notes.map(fr);
      const n = lastIdx(ts, f) + 1;
      return (
        <>
          {ts.map((a, k) => {
            if (f < a) return null;
            const d = 13, u = Math.min(1, (f - a) / d);
            const x0 = 330 + (rnd(k) - 0.5) * 90;
            const yL = 1228 - k * 24;
            const y = interpolate(u, [0, 1], [-260, yL], {easing: Easing.in(Easing.quad)});
            const rot = u < 1 ? Math.sin((f - a) * 0.7 + k) * 25 : (rnd(k + 3) - 0.5) * 10;
            const land = u >= 1 ? 1 + 0.06 * Math.exp(-(f - a - d) / 2) : 1;
            return <At key={k} x={x0 + (u < 1 ? Math.sin((f - a) * 0.5) * 40 : 0)} y={y} r={rot} s={land}>
              <Q.Note w={400} name={NOTE8[k]} head={['500', '1', '1', '10', '1', '1', '50', '1'][k]} />
            </At>;
          })}
          {n > 0 && (
            <At x={150} y={760} s={f >= c.oito ? pop(f, c.oito) * 1.15 : 1} r={-8}>
              <div style={{background: '#E5322D', border: `8px solid ${P.INK}`, borderRadius: 24, padding: '4px 26px',
                font: '900 92px Inter', color: '#fff'}}>{n}×</div>
            </At>
          )}
          {f >= c.anos && <At x={350} y={860} r={-10} s={mv(f, c.anos, 1.7, 1, 5)}><P.Stamp text="52 ANOS" w={520} color="#FFE11A" /></At>}
        </>
      );
    },
  },
  s3: {
    heads: ({s0, c}) => [{at: s0, text: 'ATÉ [1942]...'}, {at: c.reis, text: 'O DINHEIRO ERA O [RÉIS]'},
      {at: c.cz, text: 'DEPOIS: [CRUZEIRO]'}, {at: c.czn, text: '[CRUZEIRO NOVO]'}, {at: c.cz2, text: 'CRUZEIRO [DE NOVO?!]'}],
    bento: ({s0, c}) => [{at: s0, e: 'neutro'}, {at: c.reis, e: 'feliz'}, {at: c.cz, e: 'confuso'}, {at: c.cz2, e: 'choque'},
      {at: c.cz2 + 14, e: 'confuso'}],
    draw: ({f, t, s0, c}) => {
      if (f < c.reis) {
        return (
          <>
            <At x={330} y={mv(f, s0, 1400, 1080, 14)} r={-4}><Q.Note w={500} name="RÉIS" head="500" /></At>
            <At x={330} y={800} s={pop(f, c.ano)}>
              <div style={{background: '#3A2818', border: '8px solid #E8D3A8', borderRadius: 16, padding: '6px 34px',
                font: '900 150px Inter', color: '#F2E0BC', letterSpacing: 4}}>1942</div>
            </At>
          </>
        );
      }
      const chips: [string, string, number][] = [['RÉIS', 'ATÉ 42', c.reis], ['CRUZEIRO', '1942', c.cz],
        ['CRUZEIRO NOVO', '1967', c.czn], ['CRUZEIRO', '1970', c.cz2]];
      return (
        <>
          {chips.map(([n, y, a], i) => f >= a && (
            <React.Fragment key={i}>
              {i > 0 && <At x={330} y={650 + i * 170 - 85} s={pop(f, a)} sh={false}>
                <div style={{font: '900 60px Inter', color: '#FFE11A', WebkitTextStroke: `10px ${P.INK}`, paintOrder: 'stroke fill'}}>▼</div>
              </At>}
              <At x={330 + (i === 3 && f >= c.cz2 ? Math.sin((f - c.cz2) * 1.4) * 14 * Math.exp(-(f - c.cz2) / 12) : 0)}
                y={650 + i * 170} s={pop(f, a)}>
                <Q.Chip w={540} name={n} year={y} tag={i === 3 ? 'DE NOVO?!' : undefined} tagS={i === 3 ? pop(f, c.cz2 + 6) : 1} />
              </At>
            </React.Fragment>
          ))}
          {f >= c.cz && [0, 1, 2].map((k) => (
            <At key={k} x={700 + k * 110} y={760 - k * 40 + Math.sin(t * 4 + k) * 16} s={pop(f, c.cz + k * 5) * (0.8 + k * 0.15)}
              r={Math.sin(t * 3 + k) * 14} sh={false}><Q.QMark s={130} /></At>
          ))}
        </>
      );
    },
  },
  s4: {
    heads: ({c}) => [{at: c.c1, text: 'CRUZADO [1986]'}, {at: c.c2, text: 'CRUZADO NOVO [1989]'}, {at: c.c3, text: 'CRUZEIRO [1990]'},
      {at: c.c4, text: 'CRUZEIRO REAL [1993]'}, {at: c.corte, text: 'QUASE TODA TROCA: [−3 ZEROS]'},
      {at: c.ano, text: 'DE UM ANO [PRO OUTRO]'}],
    bento: ({c}) => [{at: c.c1, e: 'neutro'}, {at: c.c3, e: 'confuso'}, {at: c.quase, e: 'preocupado'}, {at: c.zeros, e: 'choque'},
      {at: c.ano, e: 'preocupado'}, {at: c.outro, e: 'choque'}],
    draw: ({f, t, c, q}) => {
      const cs = [c.c1, c.c2, c.c3, c.c4];
      const snips: number[] = q.snips.map(fr);
      const flips: number[] = q.flips.map(fr);
      // linha do tempo
      const tl = f < c.quase && (
        <div style={{position: 'absolute', left: 0, top: 0}}>
          <At x={540} y={660} sh={false}><div style={{width: 920, height: 14, background: '#FFE2B0', border: `5px solid ${P.INK}`, borderRadius: 8}} /></At>
          {TL.map(([n, y], i) => f >= cs[i] && (
            <At key={i} x={150 + i * 260} y={660} s={pop(f, cs[i])}>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: 250}}>
                <div style={{width: 50, height: 50, borderRadius: 25, background: i === lastIdx(cs, f) ? '#FFE11A' : Q.CUR[n].c,
                  border: `7px solid ${P.INK}`, marginTop: 92}} />
                <div style={{font: '900 50px Inter', color: '#fff', WebkitTextStroke: `10px ${P.INK}`, paintOrder: 'stroke fill', marginTop: 4}}>{y}</div>
                <div style={{font: '900 34px Inter', color: Q.CUR[n].c, WebkitTextStroke: `8px ${P.INK}`, paintOrder: 'stroke fill',
                  textAlign: 'center', lineHeight: 1}}>{n}</div>
              </div>
            </At>
          ))}
        </div>
      );
      if (f < c.quase) {
        const i = Math.max(0, lastIdx(cs, f));
        const [from, to, cut] = STEPS[i];
        const sn = cut ? snips[[0, 1, -1, 2][i]] : c.c3 + 12;
        const k = cut ? mv(f, sn, 0, 1, 14) : 0;
        const done = f >= sn + 9;
        const sciX = mv(f, cs[i], 760, 470, 8);
        const open = cut ? (f < sn ? 0.5 + 0.5 * Math.sin((f - cs[i]) * 0.9) : mv(f, sn, 0, 0.6, 6)) : 0;
        return (
          <>
            {tl}
            <At x={330} y={1060} s={done ? pop(f, sn + 9) : 1} r={-3}>
              <Q.Note w={540} name={done ? to : from} head="1" tail={!done && cut ? '.000' : (done ? '' : '')} cut={k} scissorsLine={cut && !done ? mv(f, cs[i], 0, 1, 6) : 0} />
            </At>
            {cut && f < sn + 14 && <At x={sciX} y={1000} r={90}><Q.Scissors w={300} open={open} /></At>}
            {!cut && f >= sn && <At x={340} y={1060} r={-14} s={mv(f, sn, 1.8, 1, 5)}><P.Stamp text="TROCA 1:1" w={440} color="#E5322D" /></At>}
          </>
        );
      }
      if (f < c.ano) {
        const k = mv(f, c.zeros, 0, 1, 18);
        const open = f < c.zeros ? 0.5 + 0.5 * Math.sin((f - c.quase) * 0.35) : mv(f, c.zeros, 0, 0.7, 5);
        return (
          <>
            <At x={330} y={1040} s={pop(f, c.quase) * (f >= c.zeros ? 1 + 0.06 * Math.exp(-(f - c.zeros) / 3) : 1)} r={-2}>
              <Q.Note w={620} name="CRUZEIRO" head="1.000" tail={k < 1 ? '.000' : ''} cut={k} scissorsLine={mv(f, c.quase, 0, 1, 10)} />
            </At>
            {f < c.zeros + 20 && (
              <At x={mv(f, c.quase, 900, 560, 12)} y={mv(f, c.zeros - 4, 700, 980, 4)} r={90} s={1.3}><Q.Scissors w={320} open={open} /></At>
            )}
          </>
        );
      }
      const fi = lastIdx(flips, f);
      const months = ['OUTUBRO', 'NOVEMBRO', 'DEZEMBRO', 'JANEIRO', 'MARÇO'];
      const yr = fi >= 2 ? '90' : '89';
      return (
        <>
          <At x={330} y={1000} s={pop(f, c.ano) * (fi >= 0 && f - flips[fi] < 3 ? 0.95 : 1)} r={fi % 2 ? 2 : -2}>
            <P.Calendar top={months[fi + 1]} day={yr} sub={fi >= 2 ? 'CRUZEIRO' : 'CRUZADO NOVO'} w={460}
              circle={f >= c.outro ? mv(f, c.outro, 0, 1, 10) : 0} />
          </At>
          {fi >= 0 && f - flips[fi] < 6 && (
            <At x={330} y={mv(f, flips[fi], 820, 600, 6)} r={mv(f, flips[fi], 0, -40, 6)} o={mv(f, flips[fi], 1, 0, 6)} sh={false}>
              <div style={{width: 420, height: 160, background: '#FFFDF5', border: `8px solid ${P.INK}`, borderRadius: 20}} />
            </At>
          )}
          {f >= c.outro && <At x={360} y={1180} r={-10} s={mv(f, c.outro, 1.8, 1, 5)}><P.Stamp text="NOVA MOEDA" w={480} /></At>}
          {Math.sin(t) > 2 && null}
        </>
      );
    },
  },
  s5: {
    heads: ({s0, c}) => [{at: s0, text: 'INFLAÇÃO [FORA DE CONTROLE]'}, {at: c.remarca, text: 'PREÇO NOVO [TODO DIA]'},
      {at: c.salario, text: 'RECEBEU? [GASTA HOJE!]'}, {at: c.po, text: 'O DINHEIRO [VIRAVA PÓ]'}],
    bento: ({s0, c}) => [{at: s0, e: 'preocupado'}, {at: c.remarca, e: 'choque'}, {at: c.dia, e: 'preocupado'},
      {at: c.salario, e: 'neutro'}, {at: c.corria, e: 'choque'}, {at: c.po, e: 'triste'}],
    draw: ({f, t, s0, c, q}) => {
      if (f < c.salario) {
        const ts: number[] = q.stamps.map(fr);
        const n = lastIdx(ts, f);
        const press = n >= 0 && f - ts[n] < 3 ? 1 : 0;
        return (
          <>
            <At x={400} y={mv(f, s0, 1500, 1060, 10)} r={-2}><Q.Product w={360} /></At>
            {ts.map((a, k) => f >= a && (
              <At key={k} x={400 + (rnd(k) - 0.5) * 60} y={1080 - k * 7 + (rnd(k + 1) - 0.5) * 30} r={(rnd(k + 2) - 0.5) * 24}
                s={mv(f, a, 1.5, 1, 4)} sh={k === n}>
                <Q.Sticker w={300} text={'Cr$ ' + brl(1200 * Math.pow(1.19, k))} color={k === n ? '#FFE07A' : ['#FFD08A', '#FFC26A', '#FFE9B0'][k % 3]} />
              </At>
            ))}
            <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
              <Person P={REPOSITOR} x={mv(f, s0, -200, 130, 14)} y={1470} s={0.66} t={t} expr={press ? 'smug' : 'smile'} look={0.8}
                walk={f < s0 + 14 ? (f - s0) / 10 : null} pose={{L: [10, 0], R: [62 + press * 22, -48]}} holdR={<HeldGun press={press} />} />
            </svg>
            {f >= c.remarca && <At x={120} y={700 - Math.abs(Math.sin(t * 6)) * 30} s={pop(f, c.remarca)}><P.ArrowUp w={110} /></At>}
          </>
        );
      }
      const dust = f >= c.po ? Math.min(1, (f - c.po) / 30) : 0;
      return (
        <>
          <At x={330 + (f >= c.corria ? Math.sin(f * 1.3) * 6 : 0)} y={1120} s={pop(f, c.salario)}><Q.Envelope w={420} open={mv(f, c.corria, 0, 1, 8)} /></At>
          {f >= c.corria + 4 && (
            <At x={330 + dust * 60} y={mv(f, c.corria + 4, 1040, 820, 10)} r={-6 + Math.sin(t * 5) * 4} o={1 - dust}>
              <div style={{clipPath: `inset(0 ${dust * 100}% 0 0)`}}><Q.Note w={460} name="CRUZEIRO REAL" head="50.000" /></div>
            </At>
          )}
          {f >= c.gastar && f < c.po && <At x={210} y={780} s={pop(f, c.gastar)} r={-10}>
            <div style={{background: '#2FA36B', border: `8px solid ${P.INK}`, borderRadius: 18, padding: '6px 20px', font: '900 54px Inter', color: '#fff'}}>CORRE!</div>
          </At>}
          {dust > 0 && Array.from({length: 70}, (_, i) => {
            const k = Math.max(0, Math.min(1, dust * 1.6 - rnd(i) * 0.6));
            if (k <= 0) return null;
            return <div key={i} style={{position: 'absolute', left: 330 + 230 - (i % 10) * 46 + k * (260 + rnd(i + 5) * 500),
              top: 760 + Math.floor(i / 10) * 30 - k * (120 + rnd(i + 9) * 260) + Math.sin(t * 6 + i) * 10,
              width: 10 + rnd(i + 2) * 16, height: 10 + rnd(i + 2) * 16, borderRadius: 4, opacity: 1 - k,
              background: ['#A98CC4', '#5E4480', '#D8C8AA'][i % 3], transform: `rotate(${i * 40 + k * 200}deg)`}} />;
          })}
        </>
      );
    },
  },
  s6: {
    heads: ({s0}) => [{at: s0, text: 'QUAL VOCÊ TEM [GUARDADA]? 👇'}],
    bento: ({s0}) => [{at: s0, e: 'apontando'}],
    draw: ({f, t, s0, c}) => {
      const k = mv(f, c.coment, 0, 1, 10);
      const rise = (i: number) => mv(f, c.gaveta + i * 4, 0, 1, 10);
      const coms: [string, string, number][] = [['@ana.r', 'Tenho um cruzado!', 0], ['@vo_jose', 'Réis do meu avô', 1], ['@lu', 'Cruzeiro real aqui', 2]];
      return (
        <>
          <At x={330 - 110 * k} y={1130 + 60 * k} s={pop(f, s0) * (1 - 0.3 * k)}><Q.TinBox w={460} open={mv(f, s0 + 4, 0, 1, 12)} /></At>
          {f >= c.gaveta && ['CRUZEIRO', 'CRUZADO', 'CRUZEIRO REAL'].map((n, i) => (
            <At key={n} x={(330 - 110 * k) + (i - 1) * 90 * (1 - k)} y={(1060 - rise(i) * (260 + i * 30)) * (1 - k) + k * (1040 - i * 20)}
              r={(i - 1) * 14 + Math.sin(t * 2 + i) * 3} s={(0.4 + 0.6 * rise(i)) * (1 - 0.4 * k)}>
              <Q.Note w={320} name={n} head={['100', '50', '500'][i]} />
            </At>
          ))}
          {f >= c.gaveta && f < c.gaveta + 20 && <At x={330} y={900} s={mv(f, c.gaveta, 0.3, 1.4, 20)} o={mv(f, c.gaveta, 1, 0, 20)} sh={false}><Q.Spark s={260} /></At>}
          {coms.map(([u, txt, i]) => f >= c.coment + i * 14 && (
            <At key={u} x={340 + i * 24} y={700 + i * 150} s={pop(f, c.coment + i * 14)}><Q.CommentT w={440} user={u} text={txt} color={i === 1 ? '#FFF3B0' : '#fff'} /></At>
          ))}
          <At x={570} y={1210 + Math.abs(Math.sin((f - s0) / 6)) * 26} s={pop(f, s0 + 4)}><P.ArrowDown w={90} /></At>
        </>
      );
    },
  },
  s7: {
    heads: ({s0, c}) => [{at: s0, text: 'ATÉ QUE, EM [1994]...'}, {at: c.real, text: 'CHEGA O [REAL]!'},
      {at: c.trocar, text: 'E A TROCA ERA [ASSIM]:'}, {at: c.n2750, text: '2.750 CRUZEIROS REAIS = [R$ 1]'}],
    bento: ({s0, c}) => [{at: s0, e: 'preocupado'}, {at: c.real, e: 'feliz'}, {at: c.trocar, e: 'neutro'}, {at: c.n2750, e: 'choque'},
      {at: c.um, e: 'feliz'}],
    draw: ({f, t, s0, c, q}) => {
      if (f < c.real) {
        const beat = Math.exp(-(((t * 1.6) % 1) * 9));
        return (
          <>
            <At x={330} y={1000} s={pop(f, s0) * (1 + 0.04 * beat)}>
              <div style={{background: '#1A0C06', border: '10px solid #FF6A2A', borderRadius: 26, padding: '10px 40px',
                font: '900 170px Inter', color: Math.floor(t * 2) % 2 ? '#FF6A2A' : '#FFD34A', boxShadow: `0 0 ${60 + beat * 60}px rgba(255,120,40,0.7)`}}>
                {f >= c.ano + 10 ? '1994' : '1993'}</div>
            </At>
            <At x={330} y={1180} s={pop(f, s0 + 6)} sh={false}>
              <div style={{font: '900 46px Inter', color: '#fff', WebkitTextStroke: `9px ${P.INK}`, paintOrder: 'stroke fill', letterSpacing: 6}}>
                {['.', '..', '...'][Math.floor(t * 3) % 3]}</div>
            </At>
          </>
        );
      }
      if (f < c.trocar) {
        return (
          <>
            <At x={330} y={1020} s={pop(f, c.real) * 1.05} r={-5 + Math.sin((f - c.real) / 10) * 3}><P.RealNote w={580} /></At>
            {[0, 1, 2, 3].map((k) => <At key={k} x={330 + Math.cos(k * 1.7) * 300} y={1000 + Math.sin(k * 1.7) * 200}
              s={0.5 + 0.5 * Math.abs(Math.sin(t * 4 + k))} sh={false}><Q.Spark s={80} /></At>)}
          </>
        );
      }
      const [ca, cb] = (q.count as number[]).map(fr);
      const cnt = Math.round(interpolate(f, [ca, cb], [0, 2750], {...clamp, easing: Easing.in(Easing.quad)}));
      const shrink = f >= c.viravam ? interpolate(f, [c.viravam, c.um], [1, 0], {...clamp, easing: Easing.in(Easing.cubic)}) : 1;
      const coinS = f >= c.um - 4 ? pop(f, c.um - 4) : 0;
      return (
        <>
          {shrink > 0.02 && (
            <div style={{position: 'absolute', left: 330, top: 1310, transform: `translate(-50%, -100%) scale(${shrink})`, transformOrigin: '50% 100%'}}>
              <div style={{position: 'relative', width: 460, height: 460}}>
                <div style={{position: 'absolute', left: 0, bottom: 0}}><Q.Stack w={460} n={Math.max(1, (cnt / 2750) * 34)} /></div>
              </div>
            </div>
          )}
          {shrink > 0.02 && f >= ca && (
            <At x={330} y={1310 - 460 * shrink + (350 - (Math.round(Math.max(1, (cnt / 2750) * 34)) - 1) * 16) * 1.095 * shrink - 70} s={shrink * (f >= c.n2750 ? pop(f, c.n2750) : 1)}>
              <div style={{background: '#1A0C06', border: '8px solid #FFE11A', borderRadius: 20, padding: '4px 24px', font: '900 76px Inter', color: '#FFE11A', whiteSpace: 'nowrap'}}>
                CR$ {brl(cnt)}</div>
            </At>
          )}
          {coinS > 0 && <At x={330} y={1180 - Math.abs(Math.sin((f - c.um) / 6)) * 40 * Math.exp(-(f - c.um) / 30)} s={coinS}>
            <Q.Coin1 size={260} spin={Math.sin(t * 2) * 0.4} shine={1} /></At>}
          {f >= c.um && f < c.um + 18 && <At x={330} y={1160} s={mv(f, c.um, 0.3, 2, 18)} o={mv(f, c.um, 1, 0, 18)} sh={false}><Q.Spark s={300} /></At>}
        </>
      );
    },
  },
  s8: {
    heads: ({s0, c}) => [{at: s0, text: 'SOMA [TODOS OS CORTES]'}, {at: c.conta, text: '[2,75 QUINTILHÕES] DE RÉIS'},
      {at: c.durou, text: 'A MOEDA QUE [MAIS DUROU]'}, {at: c.trinta, text: 'REAL: [+30 ANOS]'}],
    bento: ({s0, c}) => [{at: s0, e: 'neutro'}, {at: c.reis, e: 'apontando'}, {at: c.conta, e: 'choque'}, {at: c.durou, e: 'feliz'},
      {at: c.trinta, e: 'acenando'}],
    draw: ({f, t, c, q}) => {
      if (f < c.conta) {
        const ts: number[] = q.chalk.map(fr);
        const lines = ['RÉIS ÷ 1.000', '÷ 1.000 ÷ 1.000', '÷ 1.000 ÷ 1.000', '÷ 2.750', '= R$ 1'];
        return (
          <>
            {lines.map((l, i) => f >= ts[i] && (
              <div key={i} style={{position: 'absolute', left: 110, top: 640 + i * 120, font: '900 70px Inter', color: '#F2F4EA', opacity: 0.92,
                clipPath: `inset(0 ${100 - mv(f, ts[i], 0, 100, 10)}% 0 0)`, textShadow: '0 0 6px rgba(255,255,255,0.4)', letterSpacing: 2,
                whiteSpace: 'nowrap'}}>{l}</div>
            ))}
          </>
        );
      }
      if (f < c.durou) {
        const punch = 0.2 * Math.exp(-(f - c.conta) / 5) * Math.cos((f - c.conta) * 0.8);
        return (
          <>
            <BigNumber n={NUM.length} punch={punch} fit size={150} y={760} />
            <At x={330} y={950} s={pop(f, c.conta + 6)} sh={false}>
              <div style={{font: '900 110px Inter', color: '#fff', WebkitTextStroke: `16px ${P.INK}`, paintOrder: 'stroke fill'}}>RÉIS</div>
            </At>
            <At x={540} y={760} s={mv(f, c.conta, 0.4, 2.6, 14)} o={mv(f, c.conta, 0.9, 0, 14)} sh={false}>
              <div style={{width: 400, height: 400, borderRadius: 200, border: '24px solid #FFF6C9'}} />
            </At>
          </>
        );
      }
      const k = mv(f, c.durou, 0, 1, 40);
      const win = f >= c.trinta ? Math.abs(Math.sin((f - c.trinta) / 5)) : 0;
      return (
        <>
          <At x={340} y={990} s={pop(f, c.durou)}><Q.Durations w={620} k={k} win={win} /></At>
          {f >= c.trinta && <At x={330} y={700} s={pop(f, c.trinta) * (1 + 0.05 * Math.sin(t * 8))}>
            <div style={{fontSize: 150}}>🏆</div></At>}
        </>
      );
    },
  },
  s9: {
    heads: ({s0, c}) => [{at: s0, text: 'SEGUE O [BENTO]'}, {at: c.amanha, text: 'AMANHÃ: OUTRA [HISTÓRIA REAL]'}],
    bento: ({s0}) => [{at: s0, e: 'acenando'}],
    draw: ({f, q}) => {
      const tap = fr(q.tap);
      const press = vis(f, tap, tap + 4) ? 0.9 : 1;
      const s0 = tap - 26;
      return (
        <>
          <At x={330} y={1000} s={pop(f, s0) * press}><P.FollowBtn w={540} done={f >= tap + 2} /></At>
          {vis(f, tap - 10, tap + 14) && (
            <At x={mv(f, tap - 10, 470, 400, 10)} y={mv(f, tap - 10, 1180, 1040, 10)} sh={false}>
              <div style={{fontSize: 110}}>👆</div>
            </At>
          )}
          {vis(f, tap, tap + 12) && (
            <At x={400} y={1010} s={mv(f, tap, 0.3, 1.6, 12)} o={mv(f, tap, 0.8, 0, 12)} sh={false}>
              <div style={{width: 160, height: 160, borderRadius: 80, border: '10px solid #fff'}} />
            </At>
          )}
        </>
      );
    },
  },
  s10: {
    heads: ({s0, c}) => [{at: s0, text: 'DA PRÓXIMA VEZ...'}, {at: c.achar, text: HOOK}],
    bento: ({s0, c}) => [{at: s0, e: 'apontando'}, {at: c.achar, e: 'choque', coin: true}],
    draw: (x) => {
      const {f, t, s0, c} = x;
      if (f < c.achar) {
        const gl = Math.max(0, Math.sin((f - s0) / 7));
        return (
          <>
            <At x={330} y={1250} s={pop(f, s0)} sh={false}>
              <div style={{transform: 'scaleY(0.45)'}}><Q.Coin1 size={260} spin={0} shine={gl} /></div>
            </At>
            <At x={330} y={1290} sh={false}><div style={{width: 300, height: 40, borderRadius: '50%', background: 'rgba(255,220,140,0.35)', filter: 'blur(8px)'}} /></At>
            {Math.sin(t) > 2 && null}
          </>
        );
      }
      return coinScene(x, false);
    },
  },
};

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
  const clean = (s: string) => s.replace(/[,!:;]/g, '').replace(/\.$/, '').toUpperCase();
  return (
    <div style={{position: 'absolute', left: 30, right: 30, top: 1350, transform: 'translateY(-50%)', textAlign: 'center',
      font: '900 94px/1.1 Inter', WebkitTextStroke: '20px #000', paintOrder: 'stroke fill', color: '#fff',
      textShadow: '0 8px 0 rgba(0,0,0,0.5)'}}>
      {ch.map((w, i) => (
        <span key={i} style={{color: i === wi ? '#FFE11A' : '#fff', display: 'inline-block', margin: '0 14px',
          transform: i === wi ? 'scale(1.08)' : 'none'}}>{clean(w.w)}</span>
      ))}
    </div>
  );
};

/* ---------------- câmera: zoom suave 1.0 ↔ 1.15 ---------------- */
const zoomAt = (t: number, T: number) => {
  let n = Math.round(T / 2.5);
  if (n % 2) n += 1;
  const seg = T / n;
  const i = Math.min(n - 1, Math.floor(t / seg));
  const u = (t - i * seg) / seg;
  const e = (1 - Math.cos(Math.PI * u)) / 2;
  const [a, b] = i % 2 === 0 ? [1, 1.15] : [1.15, 1];
  return a + (b - a) * e;
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
  const punch = prev && prev.kind === cur.kind ? interpolate(f, [b0, b0 + 7], [1.07, 1], {...clamp, easing: eo}) : 1;
  const lt = cur.kind === 'fogos' ? t - cur.at : t;
  return (
    <AbsoluteFill style={{...style, transform: `scale(${punch})`}}>
      <Backdrop kind={cur.kind} v={cur.v} t={lt} />
    </AbsoluteFill>
  );
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

  // cena atual
  let si = 0;
  data.scenes.forEach((s, i) => { if (fr(s.start) <= f) si = i; });
  const sc = data.scenes[si];
  const s0 = fr(sc.start);
  const c: Record<string, number> = {};
  Object.entries(sc.cues).forEach(([k, v]) => (c[k] = fr(v)));
  const end = si + 1 < data.scenes.length ? fr(data.scenes[si + 1].start) : data.frames;
  const ctx: Ctx = {f, t, s0, c, q: sc.seq ?? {}, data, T, end};
  const def = DEFS[sc.id];
  const bgs = data.scenes.flatMap((s) => s.bg);

  // tremidas nos impactos
  const big: number[] = [], small: number[] = [];
  data.sfx.forEach((e: any) => {
    if (e.k === 'impact') big.push(fr(e.t));
    if (['kachunk', 'stamp', 'snip', 'thud', 'firework', 'cymbal'].includes(e.k)) small.push(fr(e.t));
  });
  let sx = 0, sy = 0;
  small.forEach((a) => { if (vis(f, a, a + 4)) { const k = f - a; sx = [7, -6, 4, -2][k]; sy = [-5, 5, -3, 2][k]; } });
  big.forEach((a) => { if (vis(f, a, a + 6)) { const k = f - a; sx = [22, -18, 14, -10, 6, -3][k]; sy = [-14, 16, -11, 8, -4, 2][k]; } });

  const zoom = zoomAt(t, T);
  const env = Math.min(1, t / 0.6, Math.max(0, (T - 1 / FPS - t)) / 0.6);

  // título atual
  const heads = def.heads(ctx).filter((h) => h.at <= f);
  const head = heads[heads.length - 1];
  const headS = head ? (head.at === 0 && f < 6 ? 1 : pop(f, head.at)) : 0;

  // Dr. Bento
  const bAll = def.bento(ctx);
  const bl = bAll.filter((b) => b.at <= f);
  const bcur = bl[bl.length - 1] ?? {at: 0, e: 'neutro' as Expr};
  const bprev = bl.length > 1 ? bl[bl.length - 2] : (si > 0 ? (DEFS[data.scenes[si - 1].id].bento({...ctx}).slice(-1)[0] ?? bcur) : bcur);
  const speaking = data.words.some((w) => w.s <= t && t <= w.e);
  const look = (e: Expr) => (e === 'choque' ? 0 : e === 'acenando' ? 0.2 : -0.6);
  const look0 = look(bcur.e);
  const poseOf = (b: BentoCue): {pose: Pose; face: Face; finger?: 'down'} => {
    const W = (p: Pose): Pose => p;
    switch (b.e) {
      case 'choque': return {pose: b.coin ? W({L: [150, 20], R: [165, 20]}) : POSES.handsHead, face: 'shock'};
      case 'neutro': return {pose: b.coin ? W({L: [150, 20], R: [40, 70]}) : POSES.give, face: 'neutral'};
      case 'preocupado': return {pose: b.coin ? W({L: [150, 20], R: [55, -95]}) : POSES.shrug, face: 'worried'};
      case 'triste': return {pose: POSES.down, face: 'sad'};
      case 'feliz': return {pose: POSES.hips, face: 'happy'};
      case 'apontando': return {pose: POSES.pointDown, face: 'smile', finger: 'down'};
      case 'acenando': return {pose: {L: [8, 0], R: [165 + Math.sin(t * 9) * 16, -25 + Math.sin(t * 9) * 10]}, face: 'smile'};
      case 'confuso': return {pose: POSES.scratch, face: 'worried'};
    }
  };
  const pc = poseOf(bcur), pp = poseOf(bprev);
  const mixK = bcur.at === 0 ? 1 : Math.min(1, (f - bcur.at) / 6);
  const mixE = Easing.inOut(Easing.cubic)(mixK);
  const lerpP = (a: Pose, b: Pose): Pose => ({L: [a.L[0] + (b.L[0] - a.L[0]) * mixE, a.L[1] + (b.L[1] - a.L[1]) * mixE],
    R: [a.R[0] + (b.R[0] - a.R[0]) * mixE, a.R[1] + (b.R[1] - a.R[1]) * mixE]});
  let bPose = lerpP(pp.pose, pc.pose);
  let bFace: Face = pc.face;
  let bx = 820, bWalk: number | null = null;
  // entradas andando
  const walkIns: Record<string, number> = {s2: s0, s6: s0, s7: c.trocar, s8: c.durou, s9: s0};
  const wi = walkIns[sc.id];
  if (wi !== undefined && f >= wi && f < wi + 20) {
    const k = (f - wi) / 20;
    bx = 1380 - 560 * Easing.out(Easing.quad)(k); bWalk = (f - wi) / 10; bPose = POSES.walk; bFace = 'smile';
  }
  // correndo (salário)
  if (sc.id === 's5' && f >= c.corria && f < c.po) { bWalk = f / 6; bPose = POSES.run; bFace = 'shock'; }
  const coinHeld = !!bcur.coin;
  const bump = bcur.at === 0 ? 1 : interpolate(f, [bcur.at, bcur.at + 6], [0.96, 1], {...clamp, easing: eo});
  const nameTag = sc.id === 's1' && f >= 12 && f < c.reis;

  const enter = si === 0 ? 1 : pop(f, s0);
  // vazamento de luz nas trocas de cena
  const leak = si > 0 ? Math.max(0, 1 - (f - s0) / 12) : 0;
  // pulso de suspense (cena 7 antes do Real)
  const suspense = sc.id === 's7' && f < c.real ? 0.35 + 0.25 * Math.exp(-(((t * 1.6) % 1) * 9)) : 0;
  const flash = sc.id === 's7' && vis(f, c.real, c.real + 8) ? mv(f, c.real, 0.85, 0, 8) : 0;

  return (
    <AbsoluteFill style={{background: '#2A1206', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${zoom})`, transformOrigin: '540px 980px'}}>
        <BackdropLayer bgs={bgs} f={f} t={t} />
        {/* partículas de luz (poeira em suspensão) */}
        {Array.from({length: 18}, (_, i) => {
          const y = ((rnd(i) * 1900 - t * (14 + rnd(i + 1) * 20)) % 1900 + 1900) % 1900;
          return <div key={i} style={{position: 'absolute', left: rnd(i + 2) * 1080 + Math.sin(t * 0.7 + i) * 30, top: y,
            width: 6 + rnd(i + 3) * 14, height: 6 + rnd(i + 3) * 14, borderRadius: '50%', background: '#FFE2B0',
            opacity: 0.12 + 0.15 * rnd(i + 4), filter: 'blur(2px)'}} />;
        })}
        <AbsoluteFill style={{transform: `scale(${enter})`, transformOrigin: '360px 960px'}}>
          {def.draw(ctx)}
        </AbsoluteFill>
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible',
          filter: 'drop-shadow(-6px 0 16px rgba(255,190,110,0.30))'}}>
          <g transform={`translate(${bx} 1660) scale(${bump}) translate(${-bx} -1660)`}>
            <Person P={BENTO} x={bx} y={1660} s={0.92} t={t} expr={bFace} pose={bPose} look={bWalk !== null ? 0 : look0}
              talk={speaking ? 0.85 : 0} walk={bWalk} holdL={coinHeld ? <HeldCoin shine={0.5 + 0.5 * Math.sin(t * 4)} /> : undefined}
              finger={pc.finger} wiggle={bcur.e === 'confuso' ? 7 : 0} />
          </g>
        </svg>
        {nameTag && <At x={830} y={1530} s={pop(f, 12)}>
          <div style={{background: '#2f6fd0', border: `7px solid ${P.INK}`, borderRadius: 18, padding: '4px 22px', textAlign: 'center'}}>
            <div style={{font: '900 46px Inter', color: '#fff', lineHeight: 1.05}}>DR. BENTO</div>
            <div style={{font: '900 24px Inter', color: '#FFE11A', letterSpacing: 3}}>ADVOGADO</div>
          </div>
        </At>}
      </AbsoluteFill>
      {/* gradação de cor de cinema */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(255,150,60,0.10), rgba(0,0,0,0) 40%, rgba(80,30,0,0.18))', mixBlendMode: 'soft-light'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 52%, rgba(25,8,0,0.55) 100%)'}} />
      {suspense > 0 && <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 35%, rgba(40,0,0,${suspense}) 100%)`}} />}
      {leak > 0 && <AbsoluteFill style={{background: `radial-gradient(circle at ${si % 2 ? 100 : 0}% 20%, rgba(255,170,60,${0.55 * leak}) 0%, rgba(255,120,40,0) 60%)`,
        mixBlendMode: 'screen'}} />}
      {flash > 0 && <AbsoluteFill style={{background: `rgba(255,240,200,${flash})`}} />}
      {/* granulado de filme */}
      <AbsoluteFill style={{opacity: 0.07, mixBlendMode: 'overlay'}}>
        <svg width={1080} height={1920}>
          <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 12} /></filter>
          <rect width={1080} height={1920} filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
      {head && headS > 0 && <Headline text={head.text} s={headS} />}
      {data.name === 'youtube' && f >= data.frames - 90 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1480, display: 'flex', justifyContent: 'center',
          transform: `scale(${pop(f, data.frames - 90)})`}}>
          <div style={{background: 'rgba(20,8,2,0.85)', color: '#fff', font: '900 36px Inter', padding: '14px 26px', whiteSpace: 'nowrap',
            borderRadius: 40, border: '4px solid #FFE11A'}}>
            Todo dia uma história real de dinheiro → <span style={{color: '#FFE11A'}}>Inscreva-se</span>
          </div>
        </div>
      )}
      <Captions words={data.words} t={t} />
    </AbsoluteFill>
  );
};
