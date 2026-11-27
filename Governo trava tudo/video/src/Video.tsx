import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Bento, Expr} from './Bento';
import * as P from './props';

type Word = {w: string; s: number; e: number};
type Scene = {id: string; start: number; cues: Record<string, number>};
type Data = {name: string; fps: number; duration: number; frames: number; scenes: Scene[]; words: Word[]};

const FPS = 30;
const fr = (s: number) => Math.round(s * FPS);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const eo = Easing.out(Easing.cubic);
const eio = Easing.inOut(Easing.cubic);

/** "pop": escala 0.8 → 1.0 em 6 quadros. 0 = ainda invisível. */
const pop = (f: number, at: number) => (f < at ? 0 : interpolate(f, [at, at + 6], [0.8, 1], {...clamp, easing: eo}));
/** interpola a → b começando em `at` durante `d` quadros */
const mv = (f: number, at: number, a: number, b: number, d = 8) =>
  interpolate(f, [at, at + d], [a, b], {...clamp, easing: eio});
const vis = (f: number, a: number, b = Infinity) => f >= a && f < b;

const At: React.FC<{x: number; y: number; s?: number; r?: number; o?: number; children: React.ReactNode}> =
  ({x, y, s = 1, r = 0, o = 1, children}) =>
    s <= 0 ? null : (
      <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(${r}deg) scale(${s})`,
        opacity: o, filter: 'drop-shadow(0 14px 0 rgba(60,20,0,0.28))'}}>{children}</div>
    );

type Ctx = {f: number; t: number; s0: number; c: Record<string, number>; data: Data; T: number; end: number};
type Def = {
  heads: (x: Ctx) => {at: number; text: string}[];
  bento: (x: Ctx) => {at: number; e: Expr}[];
  draw: (x: Ctx) => React.ReactNode;
};

const HOOK = 'O GOVERNO PEGOU A [POUPANÇA] DE TODO MUNDO';

/* ---------------- cena 1 / cena 10: cofrinho com cadeado ---------------- */
const piggyScene = (x: Ctx, full: boolean) => {
  const {f, c} = x;
  const tv = full ? c.trava : Infinity;
  const open = full ? (vis(f, tv - 6, tv) ? mv(f, tv - 6, 0, 1, 3) : 0) : 0;
  const lockS = full && f >= tv ? 1 + 0.35 * Math.exp(-(f - tv) / 3) * Math.cos((f - tv) * 0.9) : 1;
  return (
    <>
      <At x={340} y={960}><P.Piggy size={580} /></At>
      {full && [0, 1, 2].map((i) => {
        const a = c.coins + i * 6;
        if (!vis(f, a, a + 11)) return null;
        const y = mv(f, a, 640, 790, 10);
        return <At key={i} x={420 + (i - 1) * 6} y={y} r={(f - a) * 14}><P.Coin size={96} /></At>;
      })}
      {full && f >= c.sexta && (
        <At x={170} y={720} r={-8} s={pop(f, c.sexta)}>
          <div style={{background: '#FFF6C9', border: `8px solid ${P.INK}`, borderRadius: 14, padding: '10px 22px',
            font: '900 46px Inter', color: P.INK}}>SEXTA-FEIRA</div>
        </At>
      )}
      {full && f >= tv && [-14, 12].map((r, i) => (
        <At key={i} x={340} y={985 + i * 30} r={r} s={pop(f, tv + i * 2)}><P.Chain w={600} /></At>
      ))}
      <At x={330} y={1070} s={lockS}><P.Padlock size={180} open={open} /></At>
    </>
  );
};

const DEFS: Record<string, Def> = {
  s1: {
    heads: () => [{at: 0, text: HOOK}],
    bento: () => [{at: 0, e: 'choque'}],
    draw: (x) => piggyScene(x, true),
  },
  s2: {
    heads: ({s0, c}) => [{at: s0, text: 'ISSO FOI [REAL]'}, {at: c.tv, text: '1 DIA APÓS A POSSE'},
      {at: c.plano, text: '[PLANO COLLOR]'}],
    bento: ({s0, c}) => [{at: s0, e: 'neutro'}, {at: c.plano, e: 'preocupado'}],
    draw: ({f, t, s0, c}) => {
      const small = f >= c.tv;
      const k = mv(f, c.tv, 0, 1, 8);
      return (
        <>
          <At x={330 - 140 * k} y={930 - 170 * k} s={pop(f, s0) * (1 - 0.45 * k)} r={-4 * k}>
            <P.Calendar top="16/03/1990" day="16" sub="SEXTA-FEIRA" circle={mv(f, c.dia, 0, 1, 10)} w={460} />
          </At>
          {small && (
            <At x={400} y={1080} s={pop(f, c.tv)}>
              <P.OldTV w={560} t={t} mode={f < c.tv + 10 ? 'static' : f < c.plano ? 'news' : 'alert'} />
            </At>
          )}
        </>
      );
    },
  },
  s3: {
    heads: ({s0, c}) => [{at: s0, text: 'INFLAÇÃO [ABSURDA]'}, {at: c.pct, text: '[+80%] NUM MÊS'}],
    bento: ({s0, c}) => [{at: s0, e: 'preocupado'}, {at: c.pct, e: 'choque'}, {at: c.acabar, e: 'neutro'}],
    draw: ({f, s0, c}) => (
      <>
        <At x={350} y={960} s={pop(f, s0)} r={-3}>
          <P.PriceTag w={560} item="ARROZ 5 KG" prices={['R$ 10', 'R$ 13', 'R$ 15', 'R$ 18']} idx={0}
            local={[c.tag1, c.tag2, c.tag3].map((a) => f - a)} />
        </At>
        {f >= c.pct && (
          <At x={120} y={760 - Math.abs(Math.sin((f - c.pct) / 5)) * 30} s={pop(f, c.pct)}><P.ArrowUp w={120} /></At>
        )}
      </>
    ),
  },
  s4: {
    heads: ({s0, c}) => [{at: s0, text: 'A REGRA:'}, {at: c.saque, text: 'SAQUE MÁXIMO: [~R$\u00a08\u00a0MIL]'},
      {at: c.resto, text: 'RESTO: [BLOQUEADO 18 MESES]'}],
    bento: ({s0, c}) => [{at: s0, e: 'neutro'}, {at: c.saque, e: 'preocupado'}, {at: c.resto, e: 'choque'}],
    draw: ({f, s0, c}) => {
      const k = mv(f, c.resto - 6, 0, 1, 8);
      const drop = c.resto - 5;
      return (
        <>
          {f < c.saque && (
            <At x={340} y={950} s={pop(f, s0)}><P.Building w={440} label="BANCO" closed={0} /></At>
          )}
          {f >= c.saque && (
            <At x={340 - 180 * k} y={960 - 190 * k} s={pop(f, c.saque) * (1 - 0.55 * k) * (f >= c.hoje ? pop(f, c.hoje) : 1)}>
              <P.Bills w={470} label={f < c.hoje ? 'NCz$ 50 MIL' : '≈ R$ 8 MIL HOJE'} />
            </At>
          )}
          {f >= c.resto - 6 && (
            <At x={370} y={1030} s={pop(f, c.resto - 6)}><P.Vault w={500} spin={(f - c.resto) * 1.5} /></At>
          )}
          {f >= drop && (
            <At x={370} y={mv(f, drop, 560, 1080, 5)} s={1 + (f >= c.resto ? 0.25 * Math.exp(-(f - c.resto) / 3) : 0)}>
              <P.Padlock size={210} />
            </At>
          )}
          {f >= c.meses && (
            <At x={560} y={800} r={10} s={pop(f, c.meses)}>
              <div style={{background: '#E5322D', border: `8px solid ${P.INK}`, borderRadius: 16, padding: '8px 22px',
                font: '900 54px Inter', color: '#fff'}}>18 MESES</div>
            </At>
          )}
        </>
      );
    },
  },
  s5: {
    heads: ({s0, c}) => [{at: s0, text: 'NÃO ERA SÓ A [POUPANÇA]'}, {at: c.retido, text: '[TUDO] RETIDO'},
      {at: c.casa, text: 'VENDEU A [CASA]?'}, {at: c.conta, text: 'SALDO: [ZERO]'}],
    bento: ({s0, c}) => [{at: s0, e: 'neutro'}, {at: c.retido, e: 'choque'}, {at: c.casa, e: 'preocupado'},
      {at: c.conta, e: 'triste'}],
    draw: ({f, s0, c}) => {
      if (f < c.casa) {
        const cards: [string, string, number][] = [['POUPANÇA', '#E36A8E', s0], ['CONTA CORRENTE', '#2F7FD8', c.cc],
          ['APLICAÇÕES', '#2FA36B', c.apl]];
        return (
          <>
            {cards.map(([l, col, a], i) => f >= a && (
              <React.Fragment key={l}>
                <At x={330} y={770 + i * 180} s={pop(f, a)}><P.AccountCard w={560} label={l} color={col} /></At>
                <At x={655} y={765 + i * 180} s={pop(f, a + 5) * 0.5}><P.Padlock size={180} /></At>
              </React.Fragment>
            ))}
            {f >= c.retido && (
              <At x={340} y={950} r={-12} s={mv(f, c.retido, 1.6, 1, 5)}><P.Stamp text="RETIDO" w={560} /></At>
            )}
          </>
        );
      }
      const k = mv(f, c.conta, 0, 1, 8);
      return (
        <>
          <At x={340 - 160 * k} y={960 - 190 * k} s={pop(f, c.casa) * (1 - 0.5 * k)}>
            <P.House w={520} sold={f >= c.vender ? 1 : 0}
              swing={f >= c.vender ? 14 * Math.exp(-(f - c.vender) / 8) * Math.sin((f - c.vender) / 2) : 0} />
          </At>
          {f >= c.conta && (
            <At x={370} y={1060} s={pop(f, c.conta)}>
              <P.Balance w={620} value={interpolate(f, [c.conta + 6, c.conta + 36], [480000, 0], {...clamp, easing: Easing.in(Easing.quad)})} />
            </At>
          )}
        </>
      );
    },
  },
  s6: {
    heads: ({s0, c}) => [{at: s0, text: 'SEUS PAIS [PERDERAM]? 👇'}, {at: c.coment, text: 'CONTA NOS [COMENTÁRIOS] 👇'}],
    bento: ({s0}) => [{at: s0, e: 'apontando'}],
    draw: ({f, s0, c}) => {
      const k = mv(f, c.coment, 0, 1, 8);
      const b = Math.abs(Math.sin((f - s0) / 6)) * 26;
      return (
        <>
          <At x={330} y={890 - 70 * k} s={pop(f, s0) * (1 - 0.2 * k)} r={-3}><P.PhotoFrame w={420} /></At>
          {f >= c.coment && <At x={210} y={1150} s={pop(f, c.coment)}><P.Comment w={280} /></At>}
          {f >= c.coment && <At x={430} y={1210} s={pop(f, c.coment + 5)}><P.Comment w={260} color="#FFF3B0" /></At>}
          <At x={90} y={1150 + b} s={pop(f, s0 + 4)}><P.ArrowDown w={100} /></At>
        </>
      );
    },
  },
  s7: {
    heads: ({s0, c, data}) => data.name === 'tiktok'
      ? [{at: s0, text: 'EM [1 SEMANA]...'}, {at: c.vagas, text: '[13 MIL] VAGAS FECHADAS'},
        {at: c.bolsa, text: 'BOLSA: [-50%] EM 10 DIAS'}]
      : [{at: s0, text: 'EMPRESAS [DEMITIRAM]'}, {at: c.bolsa, text: 'BOLSA: [-50%] EM 10 DIAS'}],
    bento: ({s0, c}) => [{at: s0, e: 'preocupado'}, {at: c.caiu, e: 'choque'}],
    draw: ({f, s0, c, data}) => {
      const k = mv(f, c.bolsa, 0, 1, 8);
      const closeAt = data.name === 'tiktok' ? c.vagas : s0 + 12;
      return (
        <>
          <At x={340 - 170 * k} y={960 - 200 * k} s={pop(f, s0) * (1 - 0.55 * k)}>
            <P.Building w={440} label={data.name === 'tiktok' ? 'CONSTRUTORA' : 'EMPRESA'}
              closed={f >= closeAt ? mv(f, closeAt, 1.5, 1, 5) : 0} />
          </At>
          {f >= c.bolsa && (
            <At x={380} y={1040} s={pop(f, c.bolsa)}>
              <P.Chart w={640} draw={mv(f, c.bolsa, 0.1, 1, c.caiu - c.bolsa + 24)} crash={mv(f, c.caiu, 0, 1, 18)} />
            </At>
          )}
        </>
      );
    },
  },
  s8: {
    heads: ({s0, c}) => [{at: s0, text: 'DINHEIRO [DE VOLTA]?'}, {at: c.setembro, text: 'SÓ EM [09/1991]'},
      {at: c.parcelas, text: 'EM [12 PARCELAS]'}, {at: c.inflacao, text: 'A INFLAÇÃO [VOLTOU]'},
      {at: c.real, text: '1994: [PLANO REAL]'}],
    bento: ({s0, c}) => [{at: s0, e: 'neutro'}, {at: c.parcelas, e: 'preocupado'}, {at: c.inflacao, e: 'triste'},
      {at: c.real, e: 'feliz'}],
    draw: ({f, s0, c}) => {
      const months = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO',
        'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
      const step = Math.floor(interpolate(f, [s0 + 6, c.setembroEnd], [0, 18], {...clamp, easing: Easing.in(Easing.quad)}));
      const m = 2 + step; // março/1990 + 18 = setembro/1991
      const mm = (m % 12) + 1, yy = 1990 + Math.floor(m / 12);
      const stepAt = s0 + 6 + Math.round(interpolate(step, [0, 18], [0, c.setembroEnd - s0 - 6]));
      const flip = step < 18 ? 1 : pop(f, c.setembro);
      const k = mv(f, c.parcelas, 0, 1, 8);
      if (f >= c.real) return (
        <At x={360} y={980} s={pop(f, c.real)} r={-5 + Math.sin((f - c.real) / 10) * 3}><P.RealNote w={600} /></At>
      );
      if (f >= c.inflacao) return (
        <At x={350} y={960} s={pop(f, c.inflacao)} r={-3}>
          <P.PriceTag w={560} item="ARROZ 5 KG" prices={['R$ 18', 'R$ 22', 'R$ 27', 'R$ 33']} idx={0}
            local={[10, 24, 38].map((d) => f - (c.inflacao + d))} />
        </At>
      );
      return (
        <>
          <At x={340 - 160 * k} y={930 - 170 * k} s={pop(f, s0) * (1 - 0.5 * k) * (f < stepAt + 3 ? 0.96 : 1) * flip}>
            <P.Calendar top={String(yy)} day={String(mm).padStart(2, '0')} sub={months[m % 12]} w={460}
              circle={f >= c.setembro ? mv(f, c.setembro, 0, 1, 10) : 0} />
          </At>
          {f >= c.parcelas && (
            <At x={380} y={1030} s={pop(f, c.parcelas)}>
              <P.Coins12 w={640} n={Math.floor(interpolate(f, [c.parcelas, c.parcelas + 30], [0, 12], clamp))} />
            </At>
          )}
        </>
      );
    },
  },
  s9: {
    heads: ({s0, c}) => [{at: s0, text: 'SEGUE O [BENTO]'}, {at: c.amanha, text: 'AMANHÃ: OUTRA [HISTÓRIA REAL]'}],
    bento: ({s0}) => [{at: s0, e: 'acenando'}],
    draw: ({f, s0}) => {
      const tap = s0 + 26;
      const press = vis(f, tap, tap + 4) ? 0.9 : 1;
      return (
        <>
          <At x={330} y={1000} s={pop(f, s0) * press}><P.FollowBtn w={540} done={f >= tap + 2} /></At>
          {vis(f, tap - 10, tap + 14) && (
            <At x={mv(f, tap - 10, 470, 400, 10)} y={mv(f, tap - 10, 1180, 1040, 10)}>
              <div style={{fontSize: 110}}>👆</div>
            </At>
          )}
          {vis(f, tap, tap + 12) && (
            <At x={400} y={1010} s={mv(f, tap, 0.3, 1.6, 12)} o={mv(f, tap, 0.8, 0, 12)}>
              <div style={{width: 160, height: 160, borderRadius: 80, border: '10px solid #fff'}} />
            </At>
          )}
        </>
      );
    },
  },
  s10: {
    heads: ({s0}) => [{at: s0, text: HOOK}],
    bento: ({s0}) => [{at: s0, e: 'choque'}],
    draw: (x) => piggyScene(x, false),
  },
};

/* ---------------- título no terço superior ---------------- */
const Headline: React.FC<{text: string; s: number}> = ({text, s}) => {
  const parts = text.split(/(\[[^\]]+\])/g).filter(Boolean);
  const size = text.length > 26 ? 104 : 124;
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: 410, transform: `translateY(-50%) scale(${s})`,
      textAlign: 'center', font: `900 ${size}px/1.04 Inter`, color: '#fff', letterSpacing: -1,
      WebkitTextStroke: '22px #1A0E06', paintOrder: 'stroke fill', textShadow: '0 12px 0 rgba(60,20,0,0.45)'}}>
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
  const clean = (s: string) => s.replace(/[.,!:;]/g, '').toUpperCase();
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
  const ctx: Ctx = {f, t, s0, c, data, T, end};
  const def = DEFS[sc.id];

  // tremida de 4 quadros nos impactos
  const shakes: number[] = [];
  data.scenes.forEach((s) => {
    if (s.id === 's1') shakes.push(fr(s.cues.trava));
    if (s.id === 's4') shakes.push(fr(s.cues.resto));
    if (s.id === 's5') shakes.push(fr(s.cues.retido));
  });
  const smallShakes: number[] = [];
  data.scenes.forEach((s) => {
    if (s.id === 's3') smallShakes.push(fr(s.cues.tag1), fr(s.cues.tag2), fr(s.cues.tag3));
  });
  let sx = 0, sy = 0;
  shakes.forEach((a) => { if (vis(f, a, a + 4)) { const k = f - a; sx = [18, -16, 12, -8][k]; sy = [-12, 14, -10, 6][k]; } });
  smallShakes.forEach((a) => { if (vis(f, a, a + 4)) { const k = f - a; sx = [8, -7, 5, -3][k]; sy = [-5, 6, -4, 2][k]; } });

  const zoom = zoomAt(t, T);
  const env = Math.min(1, t / 0.6, Math.max(0, (T - 1 / FPS - t)) / 0.6);
  const rays = 8 * Math.sin((2 * Math.PI * t) / T);

  // título atual
  const heads = def.heads(ctx).filter((h) => h.at <= f);
  const head = heads[heads.length - 1];
  const headS = head ? (head.at === 0 && f < 6 ? 1 : pop(f, head.at)) : 0;

  // Bento
  const bl = def.bento(ctx).filter((b) => b.at <= f);
  const bcur = bl[bl.length - 1] ?? {at: 0, e: 'neutro' as Expr};
  const bentoPop = bcur.at === 0 ? 1 : interpolate(f, [bcur.at, bcur.at + 6], [0.92, 1], {...clamp, easing: eo});
  const speaking = data.words.some((w) => w.s <= t && t <= w.e);
  const talk = speaking ? 0.5 + 0.5 * Math.sin(t * 26) : 0;
  const blink = f % 101 >= 97 && f > 8 && f < data.frames - 8;
  const bob = Math.sin(t * 2.4) * 8 * env;

  // entrada da cena (exceto no quadro 0)
  const enter = si === 0 ? 1 : pop(f, s0);

  return (
    <AbsoluteFill style={{background: '#7A3A10', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${zoom})`, transformOrigin: '540px 980px'}}>
        <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 46%, #FFAA45 0%, #EE7A1C 42%, #A34A12 78%, #6A2C0A 100%)'}} />
        <AbsoluteFill style={{background: `repeating-conic-gradient(from ${rays}deg at 50% 46%, rgba(255,240,200,0.10) 0deg 9deg, rgba(0,0,0,0) 9deg 18deg)`}} />
        <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 55%, rgba(50,15,0,0.45) 100%)'}} />
        {/* chão */}
        <div style={{position: 'absolute', left: -200, right: -200, top: 1330, height: 800, background: '#8A3F12',
          borderTop: '10px solid #5A250A', borderRadius: '50% 50% 0 0 / 60px 60px 0 0'}} />
        <AbsoluteFill style={{transform: `scale(${enter})`, transformOrigin: '360px 960px'}}>
          {def.draw(ctx)}
        </AbsoluteFill>
        <div style={{position: 'absolute', left: 585, top: 840 + bob, width: 480, height: 720,
          transform: `scale(${bentoPop})`, transformOrigin: '50% 100%', filter: 'drop-shadow(0 16px 0 rgba(60,20,0,0.3))'}}>
          <Bento expr={bcur.e} talk={talk} blink={blink} wave={t * 9} t={t} />
        </div>
      </AbsoluteFill>
      {head && headS > 0 && <Headline text={head.text} s={headS} />}
      {data.name === 'youtube' && f >= data.frames - 90 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 640, display: 'flex', justifyContent: 'center',
          transform: `scale(${pop(f, data.frames - 90)})`}}>
          <div style={{background: 'rgba(20,8,2,0.82)', color: '#fff', font: '900 36px Inter', padding: '14px 26px', whiteSpace: 'nowrap',
            borderRadius: 40, border: '4px solid #FFE11A'}}>
            Todo dia uma história real de dinheiro → <span style={{color: '#FFE11A'}}>Inscreva-se</span>
          </div>
        </div>
      )}
      <Captions words={data.words} t={t} />
    </AbsoluteFill>
  );
};
