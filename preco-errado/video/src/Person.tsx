import React from 'react';

/* Personagens no traço do motor 2D do Bento Contaê (bento-contae/engine2d/engine.js), portado para SVG.
   Origem (0,0) = pés. Cabeça em y = -768. */

const INK = '#262321';
const RED = '#e0443a';

export type Spec = {
  skin: string; hair: 'short' | 'quiff' | 'slick' | 'bald' | 'grey' | 'bun'; hairCol?: string; shirt?: string; emblem?: string;
  pants?: string; shoes?: string; suit?: {jacket: string; tie: string; stripes?: boolean; pocket?: boolean};
  glasses?: boolean; mustache?: boolean; mustacheCol?: string; seed?: number; apron?: string; cap?: string; ref?: 'bento';
};

/** Dr. Bento — o advogado de bigode, "voz" do canal */
export const BENTO: Spec = {ref: 'bento', skin: '#dba97f', hair: 'slick', hairCol: '#2e1e18',
  suit: {jacket: '#2b3550', tie: RED, stripes: true, pocket: true}, pants: '#2b3550', glasses: true, mustache: true, seed: 2};
/** repositor do supermercado (personagem de apoio) */
/** EP "Preço errado": Paulo (protagonista), a operadora de caixa e o gerente */
export const PAULO: Spec = {skin: '#e8b58c', hair: 'quiff', hairCol: '#3b2416', shirt: '#2c9877', emblem: '#ffd23a',
  pants: '#355a9c', seed: 3};
export const CAIXA: Spec = {skin: '#a8714c', hair: 'bun', hairCol: '#2a1a12', shirt: '#e0443a', apron: '#b8302a',
  pants: '#2b2b33', seed: 7};
export const GERENTE: Spec = {skin: '#f0c7a0', hair: 'grey', hairCol: '#9a9a9a', suit: {jacket: '#6b4024', tie: '#2f6fd0'},
  pants: '#6b4024', seed: 9};
/** pessoas da fila (figurantes) */
export const FILA: Spec[] = [
  {skin: '#e8b58c', hair: 'short', hairCol: '#6b3b1d', shirt: '#4FA0B5', pants: '#355a9c', seed: 11},
  {skin: '#a8714c', hair: 'bun', hairCol: '#2a1a12', shirt: '#E36A8E', pants: '#2b2b33', seed: 12},
  {skin: '#f0c7a0', hair: 'grey', hairCol: '#9a9a9a', shirt: '#7CC36B', pants: '#6b4024', seed: 13},
  {skin: '#c98b5e', hair: 'quiff', hairCol: '#2a1a12', shirt: '#F2B040', pants: '#355a9c', seed: 14},
];
export const REPOSITOR: Spec = {skin: '#f0c39a', hair: 'quiff', hairCol: '#6b3b1d', shirt: '#f4efe4', apron: '#e0662a',
  pants: '#355a9c', seed: 5, cap: '#e0662a'};

export type Pose = {L: [number, number]; R: [number, number]};
export const POSES: Record<string, Pose> = {
  down: {L: [8, 0], R: [8, 0]},
  hold: {L: [8, 0], R: [22, -70]},
  holdUp: {L: [8, 0], R: [35, -120]},
  point: {L: [8, 0], R: [150, 15]},
  pointDown: {L: [42, 20], R: [8, 0]},
  handsHead: {L: [165, 20], R: [165, 20]},
  coinShock: {L: [40, -125], R: [150, 115]},
  coin: {L: [40, -125], R: [40, 70]},
  shrug: {L: [55, -95], R: [55, -95]},
  give: {L: [72, -15], R: [8, 0]},
  giveBoth: {L: [70, -20], R: [70, -20]},
  wave: {L: [8, 0], R: [165, -25]},
  hips: {L: [40, 70], R: [40, 70]},
  walk: {L: [12, -10], R: [12, -10]},
  scratch: {L: [8, 0], R: [168, 8]},
  run: {L: [40, -90], R: [40, -90]},
};

export type Face = 'neutral' | 'happy' | 'smile' | 'shock' | 'surprised' | 'worried' | 'sad' | 'angry' | 'smug';

const D2R = Math.PI / 180;
const P2 = (pts: number[][]) => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
const Line: React.FC<{pts: number[][]; w: number; col?: string}> = ({pts, w, col = INK}) =>
  <path d={P2(pts)} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;
const Box: React.FC<{x: number; y: number; w: number; h: number; r: number; fill: string; lw?: number}> = ({x, y, w, h, r, fill, lw = 9}) =>
  <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} stroke={lw ? INK : 'none'} strokeWidth={lw} />;
const Ell: React.FC<{cx: number; cy: number; rx: number; ry: number; fill: string; lw?: number}> = ({cx, cy, rx, ry, fill, lw = 0}) =>
  <ellipse cx={cx} cy={cy} rx={Math.max(0.1, rx)} ry={Math.max(0.1, ry)} fill={fill} stroke={lw ? INK : 'none'} strokeWidth={lw} />;

export const blinkAt = (t: number, seed: number) => {
  const per = 2.6 + (seed % 5) * 0.37, ph = (t + seed * 0.71) % per;
  return ph < 0.06 ? 0.5 : ph < 0.13 ? 1 : 0;
};

const Head: React.FC<{P: Spec; y: number; expr: Face; look: number; t: number; blink: number; talk: number}> =
  ({P, y, expr, look, t, blink: bl, talk}) => {
    const x = 0, r = 132;
    const hc = P.hairCol || '#3b2416';
    const ex = 50, ey = y + 2;
    const lx = look * 12;
    const by = ey - 52;
    const brow = ({sad: [14, -10], worried: [14, -10], angry: [-16, 14], shock: [0, -16], surprised: [0, -12], smug: [-6, 4]} as any)[expr] || [0, 0];
    const my = y + 78;
    const open = talk > 0 ? (0.5 + 0.5 * Math.sin(t * 22)) * talk : 0;
    const mY = my + (P.mustache ? 12 : 0);
    const R = r + 4;
    const a0 = Math.PI * 1.02, a1 = Math.PI * 1.98;
    let mouth: React.ReactNode;
    if (expr === 'surprised' || expr === 'shock' || open > 0.25) {
      const h = expr === 'shock' ? 30 : expr === 'surprised' ? 24 : 10 + open * 16;
      mouth = <><Ell cx={x} cy={mY} rx={expr === 'shock' ? 22 : 18} ry={h} fill="#5a1e1a" lw={7} />
        <Ell cx={x} cy={mY + h * 0.45} rx={10} ry={h * 0.35} fill={RED} /></>;
    } else if (expr === 'smile' || expr === 'happy') {
      mouth = <path d={`M${x - 40} ${mY - 8} Q${x} ${mY + 38} ${x + 40} ${mY - 8} Z`} fill="#5a1e1a" stroke={INK} strokeWidth={7} strokeLinejoin="round" />;
    } else if (expr === 'smug') mouth = <Line pts={[[x - 30, mY + 4], [x + 10, mY + 6], [x + 38, mY - 10]]} w={8} />;
    else if (expr === 'sad') mouth = <Line pts={[[x - 30, mY + 14], [x, mY], [x + 30, mY + 14]]} w={8} />;
    else if (expr === 'worried') mouth = <Line pts={[[x - 32, mY + 6], [x - 16, mY - 2], [x, mY + 6], [x + 16, mY - 2], [x + 32, mY + 6]]} w={7} />;
    else if (expr === 'angry') mouth = <Line pts={[[x - 30, mY + 8], [x + 30, mY + 8]]} w={9} />;
    else mouth = <Line pts={[[x - 22, mY + 2], [x + 22, mY + 2]]} w={8} />;
    return (
      <g>
        <circle cx={x - r + 4} cy={y + 10} r={30} fill={P.skin} stroke={INK} strokeWidth={8} />
        <circle cx={x + r - 4} cy={y + 10} r={30} fill={P.skin} stroke={INK} strokeWidth={8} />
        <circle cx={x} cy={y} r={r} fill={P.skin} stroke={INK} strokeWidth={10} />
        {P.hair === 'slick' && <>
          <path d={`M${x + R * Math.cos(a0)} ${y + 4 + R * Math.sin(a0)} A${R} ${R} 0 0 1 ${x + R * Math.cos(a1)} ${y + 4 + R * Math.sin(a1)}
            Q${x + r * 0.7} ${y - r * 0.55} ${x - r * 0.1} ${y - r * 0.62} Q${x - r * 0.75} ${y - r * 0.5} ${x - r - 2} ${y - 6} Z`}
            fill={hc} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
          <Line pts={[[x - 30, y - r + 6], [x - 10, y - r * 0.62]]} w={5} col="rgba(255,255,255,0.25)" />
        </>}
        {P.hair === 'bun' && <circle cx={x} cy={y - r - 18} r={46} fill={hc} stroke={INK} strokeWidth={9} />}
        {(P.hair === 'bald' || P.hair === 'grey') && [-1, 1].map((sd) => (
          <ellipse key={sd} cx={x + sd * (r - 14)} cy={y - 30} rx={26} ry={52} transform={`rotate(${sd * 14} ${x + sd * (r - 14)} ${y - 30})`}
            fill={P.hair === 'grey' ? '#c9c6c0' : hc} stroke={INK} strokeWidth={7} />
        ))}
        {(P.hair === 'short' || P.hair === 'quiff' || P.hair === 'bun') && (() => {
          const R2 = r + 3, b0 = Math.PI * 1.1, b1 = Math.PI * 1.9;
          return <>
            <path d={`M${x + R2 * Math.cos(b0)} ${y + 4 + R2 * Math.sin(b0)} A${R2} ${R2} 0 0 1 ${x + R2 * Math.cos(b1)} ${y + 4 + R2 * Math.sin(b1)}
              Q${x + r * 0.55} ${y - r * 0.32} ${x} ${y - r * 0.42} Q${x - r * 0.55} ${y - r * 0.32} ${x - r * 0.93} ${y - r * 0.27} Z`}
              fill={hc} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
            {P.hair === 'quiff' && <path d={`M${x - 60} ${y - r + 18} Q${x - 30} ${y - r - 46} ${x + 50} ${y - r - 22} Q${x + 30} ${y - r + 4} ${x + 30} ${y - r + 26} Z`}
              fill={hc} stroke={INK} strokeWidth={9} strokeLinejoin="round" />}
          </>;
        })()}
        {P.cap && <>
          <path d={`M${x - r + 2} ${y - 18} A${r - 2} ${r - 2} 0 0 1 ${x + r - 2} ${y - 18} Z`} fill={P.cap} stroke={INK} strokeWidth={9} />
          <rect x={x - 20} y={y - 36} width={r + 70} height={30} rx={14} fill={P.cap} stroke={INK} strokeWidth={9} />
        </>}
        {[-1, 1].map((sd) => {
          const cx = x + sd * ex;
          if (expr === 'happy' || bl > 0.6) return <Line key={sd} pts={[[cx - 22, ey + 4], [cx, ey - 10], [cx + 22, ey + 4]]} w={8} />;
          const ry = expr === 'smug' ? 18 : (expr === 'surprised' || expr === 'shock') ? 36 : 31;
          return <g key={sd}>
            <Ell cx={cx} cy={ey} rx={30} ry={ry * (1 - bl * 0.9)} fill="#fff" lw={7} />
            {bl < 0.5 && <circle cx={cx + lx} cy={ey + (expr === 'smug' ? 4 : 0)} r={expr === 'shock' ? 10 : 14} fill={INK} />}
            {expr === 'smug' && <Line pts={[[cx - 32, ey - 6], [cx + 32, ey - 6]]} w={8} />}
          </g>;
        })}
        {P.glasses && <g fill="none" stroke="#4a3a2e" strokeWidth={8}>
          <circle cx={x - ex} cy={ey} r={44} /><circle cx={x + ex} cy={ey} r={44} />
          <path d={`M${x - 8} ${ey - 4} L${x + 8} ${ey - 4}`} />
        </g>}
        {[-1, 1].map((sd) => <Line key={sd} w={9} col={hc}
          pts={[[x + sd * 26, by + brow[0] * 0.5 + (expr === 'shock' ? -12 : 0)], [x + sd * 74, by + brow[1] * 0.5 + (expr === 'shock' ? -12 : 0)]]} />)}
        {P.mustache && <path d={`M${x} ${my - 26} C${x - 30} ${my - 48} ${x - 78} ${my - 34} ${x - 84} ${my - 4} C${x - 70} ${my - 14} ${x - 40} ${my - 6} ${x} ${my - 14}
          C${x + 40} ${my - 6} ${x + 70} ${my - 14} ${x + 84} ${my - 4} C${x + 78} ${my - 34} ${x + 30} ${my - 48} ${x} ${my - 26} Z`}
          fill={P.mustacheCol || '#2b1a10'} stroke={INK} strokeWidth={5} strokeLinejoin="round" />}
        {mouth}
      </g>
    );
  };


/* Cabeça do Dr. Bento conforme a arte de referência do canal (cabelo cheio com risca, óculos redondos de aro duplo,
   bigode de pontas enroladas, sobrancelhas grossas, sombra na bochecha). Medidas tiradas da arte 800x800 (escala 0,77). */
const K = 0.77;
const RX = (v: number) => (v - 400) * K;
const RY = (v: number, y: number) => y + (v - 380) * K;
const BentoHead: React.FC<{y: number; expr: Face; look: number; t: number; blink: number; talk: number}> =
  ({y, expr, look, t, blink: bl, talk}) => {
    const P = (pts: string) => pts.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, a, b) => `${RX(+a).toFixed(1)} ${RY(+b, y).toFixed(1)}`);
    const id = 'bface';
    const ey = RY(356, y), ex = 46;
    const shock = expr === 'shock' || expr === 'surprised';
    const brow = ({sad: [10, -8], worried: [10, -8], angry: [-12, 12], shock: [-14, -14], surprised: [-10, -10], smug: [-4, 4]} as any)[expr] || [0, 0];
    const open = talk > 0 ? (0.5 + 0.5 * Math.sin(t * 22)) * talk : 0;
    const mY = RY(492, y);
    let mouth: React.ReactNode;
    if (shock || open > 0.25) {
      const h = expr === 'shock' ? 26 : expr === 'surprised' ? 20 : 8 + open * 14;
      mouth = <><Ell cx={0} cy={mY + 4} rx={expr === 'shock' ? 20 : 16} ry={h} fill="#5a1e1a" lw={6} />
        <Ell cx={0} cy={mY + 4 + h * 0.45} rx={9} ry={h * 0.33} fill={RED} /></>;
    } else if (expr === 'happy') {
      mouth = <path d={`M-30 ${mY - 6} Q0 ${mY + 30} 30 ${mY - 6} Z`} fill="#5a1e1a" stroke={INK} strokeWidth={6} strokeLinejoin="round" />;
    } else if (expr === 'sad') mouth = <Line pts={[[-24, mY + 10], [0, mY], [24, mY + 10]]} w={7} />;
    else if (expr === 'worried') mouth = <Line pts={[[-26, mY + 4], [-13, mY - 3], [0, mY + 4], [13, mY - 3], [26, mY + 4]]} w={6} />;
    else if (expr === 'angry') mouth = <Line pts={[[-24, mY + 4], [24, mY + 4]]} w={7} />;
    else if (expr === 'smug') mouth = <Line pts={[[-24, mY + 2], [8, mY + 4], [28, mY - 8]]} w={7} />;
    else mouth = <path d={`M-26 ${mY - 2} Q0 ${mY + 14} 26 ${mY - 2}`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />;
    return (
      <g>
        <defs><clipPath id={id}><circle cx={RX(402)} cy={RY(385, y)} r={172 * K} /></clipPath></defs>
        {[-1, 1].map((sd) => <circle key={sd} cx={sd * 150} cy={RY(352, y)} r={27} fill="#d8a47a" stroke={INK} strokeWidth={8} />)}
        <circle cx={RX(402)} cy={RY(385, y)} r={172 * K} fill="#c99468" />
        <g clipPath={`url(#${id})`}><circle cx={RX(420)} cy={RY(362, y)} r={172 * K} fill="#e2b48b" /></g>
        <circle cx={RX(402)} cy={RY(385, y)} r={172 * K} fill="none" stroke={INK} strokeWidth={10} />
        {/* cabelo */}
        <path d={P('M228 318 C205 205 268 128 402 124 C535 120 604 196 588 300 C566 264 526 246 474 246 C428 246 380 252 336 236 C298 258 258 276 228 318 Z')}
          fill="#2e1e18" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
        <path d={P('M342 230 C330 190 350 156 392 146')} fill="none" stroke="#6b4a3a" strokeWidth={7} strokeLinecap="round" />
        <path d={P('M452 152 C496 156 528 170 548 192')} fill="none" stroke="#6b4a3a" strokeWidth={7} strokeLinecap="round" />
        {/* sobrancelhas */}
        {[-1, 1].map((sd) => <path key={sd} d={`M${sd * 22} ${RY(296, y) + brow[0] * 0.6} Q${sd * 48} ${RY(286, y) + (brow[0] + brow[1]) * 0.3} ${sd * 80} ${RY(296, y) + brow[1] * 0.6}`}
          fill="none" stroke="#5a3a22" strokeWidth={14} strokeLinecap="round" />)}
        {/* hastes dos óculos */}
        <Line pts={[[-86, ey - 2], [-136, ey - 6]]} w={6} /><Line pts={[[86, ey - 2], [136, ey - 6]]} w={6} />
        {/* olhos + óculos de aro duplo */}
        {[-1, 1].map((sd) => {
          const cx = sd * ex;
          const closed = expr === 'happy' || bl > 0.6;
          const pr = shock ? 8 : 12;
          return <g key={sd}>
            <circle cx={cx} cy={ey} r={41} fill="#fff" stroke={INK} strokeWidth={7} />
            <circle cx={cx} cy={ey} r={31} fill="none" stroke={INK} strokeWidth={4} />
            {closed ? <Line pts={[[cx - 16, ey + 4], [cx, ey - 8], [cx + 16, ey + 4]]} w={7} /> : <>
              <circle cx={cx + look * 8 - sd * 3} cy={ey} r={pr * (1 - bl * 0.6)} fill={INK} />
              <circle cx={cx + look * 8 - sd * 3 + 4} cy={ey - 4} r={3.5} fill="#fff" />
            </>}
          </g>;
        })}
        <path d={`M-6 ${ey - 3} Q0 ${ey - 9} 6 ${ey - 3}`} fill="none" stroke={INK} strokeWidth={6} />
        {/* bigode de pontas enroladas */}
        <path d={P('M402 420 C372 402 330 402 304 422 C292 432 279 432 281 416 C266 422 266 448 292 454 C330 462 372 452 402 440 C432 452 474 462 512 454 C538 448 538 422 523 416 C525 432 512 432 500 422 C474 402 432 402 402 420 Z')}
          fill="#2b1e18" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {mouth}
      </g>
    );
  };

export type PersonProps = {
  P: Spec; x: number; y: number; s?: number; t: number; expr?: Face; pose?: Pose | string; look?: number; flip?: boolean;
  talk?: number; walk?: number | null; holdL?: React.ReactNode; holdR?: React.ReactNode; finger?: 'up' | 'down' | null;
  nod?: number; wiggle?: number;
};

export const Person: React.FC<PersonProps> = (o) => {
  const {P, x, y, s = 1, t, expr = 'neutral', look = 0, flip = false, talk = 0} = o;
  const pose: Pose = typeof o.pose === 'string' ? POSES[o.pose] : (o.pose || POSES.down);
  const br = Math.sin(t * Math.PI * 2 * 0.35 + (P.seed || 0)) * 0.012;
  const walking = o.walk !== undefined && o.walk !== null;
  const walkPh = walking ? Math.sin((o.walk as number) * Math.PI * 2) : 0;
  const bounce = walking ? -Math.abs(walkPh) * 14 : 0;
  const legTop = -330, legW = 70;
  const tw = 250, th = 290, ty = -615;
  const jacket = P.suit ? P.suit.jacket : (P.shirt || '#2f6fd0');
  const sh: Record<string, [number, number]> = {L: [-tw / 2 + 18, ty + 34], R: [tw / 2 - 18, ty + 34]};
  const hand: Record<string, [number, number]> = {} as any;
  const arms = (['L', 'R'] as const).map((side) => {
    const sd = side === 'R' ? 1 : -1;
    let [A1, A2] = pose[side];
    if (walking) A1 += sd * walkPh * -12;
    if (o.wiggle && side === 'R') { A1 += Math.sin(t * 24) * o.wiggle; }
    const p0 = sh[side];
    const p1: [number, number] = [p0[0] + Math.sin(A1 * D2R) * 140 * sd, p0[1] + Math.cos(A1 * D2R) * 140];
    const p2: [number, number] = [p1[0] + Math.sin((A1 + A2) * D2R) * 130 * sd, p1[1] + Math.cos((A1 + A2) * D2R) * 130];
    hand[side] = p2;
    return <g key={side}>
      <Line pts={[p0, p1, p2]} w={44 + 18} />
      <Line pts={[p0, p1, p2]} w={44} col={jacket} />
    </g>;
  });
  const hy = -768 + Math.sin(t * Math.PI * 2 * 0.5 + (P.seed || 0)) * 3 + (o.nod || 0) * 10;
  return (
    <g transform={`translate(${x} ${y + bounce}) scale(${flip ? -s : s} ${s})`}>
      <ellipse cx={0} cy={6 - bounce} rx={150} ry={24} fill="rgba(40,20,0,0.25)" />
      {[-1, 1].map((sd) => {
        const lift = walking ? Math.max(0, sd * walkPh) * 26 : 0;
        const kick = walking ? sd * walkPh * 18 : 0;
        return <g key={sd} transform={`translate(${kick} 0)`}>
          <Box x={sd * 42 - legW / 2} y={legTop} w={legW} h={300 - lift} r={14} fill={P.pants || '#355a9c'} />
          <Ell cx={sd * 50} cy={-22 - lift} rx={62} ry={28} fill={P.shoes || INK} lw={7} />
        </g>;
      })}
      <g transform={`translate(0 ${legTop}) scale(1 ${1 + br}) translate(0 ${-legTop})`}>
        <path d={`M${-tw / 2 + 10} ${ty + 40} Q${-tw / 2} ${ty} ${-tw / 2 + 60} ${ty} L${tw / 2 - 60} ${ty} Q${tw / 2} ${ty} ${tw / 2 - 10} ${ty + 40}
          L${tw / 2 - 8} ${ty + th} L${-tw / 2 + 8} ${ty + th} Z`} fill={jacket} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
        {P.suit ? <>
          {P.suit.stripes && Array.from({length: 9}, (_, i) => <path key={i} d={`M${-tw / 2 + 25 + i * 26} ${ty + 8} V${ty + th - 4}`}
            stroke="rgba(255,255,255,0.12)" strokeWidth={2} />)}
          <path d={`M-38 ${ty + 2} L0 ${ty + 120} L38 ${ty + 2} Z`} fill="#f4f1ea" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          {[-1, 1].map((sd) => <path key={sd} d={`M${sd * 4} ${ty + 14} L${sd * 40} ${ty - 6} L${sd * 30} ${ty + 46} Z`} fill="#f4f1ea" stroke={INK} strokeWidth={6} strokeLinejoin="round" />)}
          <path d={`M-12 ${ty + 22} L12 ${ty + 22} L17 ${ty + 150} L0 ${ty + 175} L-17 ${ty + 150} Z`} fill={P.suit.tie} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <Line pts={[[-40, ty + 2], [-8, ty + 160]]} w={7} /><Line pts={[[40, ty + 2], [8, ty + 160]]} w={7} />
          <Line pts={[[0, ty + 175], [0, ty + th]]} w={6} />
          {P.suit.pocket && <path d={`M62 ${ty + 95} L72 ${ty + 80} L82 ${ty + 95} L92 ${ty + 80} L100 ${ty + 95} Z`} fill="#fff" stroke={INK} strokeWidth={4} />}
        </> : <>
          <path d={`M-42 ${ty + 2} Q0 ${ty + 46} 42 ${ty + 2}`} fill="none" stroke={INK} strokeWidth={7} />
          {P.apron && <path d={`M-90 ${ty + 60} H90 L96 ${ty + th - 4} H-96 Z`} fill={P.apron} stroke={INK} strokeWidth={7} strokeLinejoin="round" />}
          {P.emblem && <circle cx={0} cy={ty + 150} r={30} fill={P.emblem} stroke={INK} strokeWidth={7} />}
        </>}
        {arms}
      </g>
      <Box x={-26} y={-650} w={52} h={50} r={10} fill={P.skin} lw={8} />
      {P.ref === 'bento'
        ? <BentoHead y={hy} expr={expr} look={look} t={t} blink={blinkAt(t, P.seed || 0)} talk={talk} />
        : <Head P={P} y={hy} expr={expr} look={look} t={t} blink={blinkAt(t, P.seed || 0)} talk={talk} />}
      {(['L', 'R'] as const).map((side) => {
        const [hx, hy2] = hand[side];
        const held = side === 'R' ? o.holdR : o.holdL;
        return <g key={side}>
          {held && <g transform={`translate(${hx} ${hy2}) scale(${flip ? -1 : 1} 1)`}>{held}</g>}
          <circle cx={hx} cy={hy2} r={27} fill={P.skin} stroke={INK} strokeWidth={8} />
          {side === 'R' && o.finger === 'up' && <Box x={hx - 8} y={hy2 - 62} w={18} h={46} r={9} fill={P.skin} lw={6} />}
          {side === 'L' && o.finger === 'down' && <Box x={hx - 26} y={hy2 + 10} w={18} h={52} r={9} fill={P.skin} lw={6} />}
        </g>;
      })}
    </g>
  );
};

/* moeda de R$ 1 na mão (desenhada acima do punho) */
export const HeldCoin: React.FC<{shine?: number}> = ({shine = 0}) => (
  <g transform="translate(0 -78)">
    <circle r={66} fill="#C9972E" stroke={INK} strokeWidth={8} />
    <circle r={58} fill="#F2C24E" />
    <circle r={38} fill="#DCE2E8" stroke="#8D96A0" strokeWidth={5} />
    <text x={0} y={18} fontSize={52} fontWeight={900} fontFamily="Inter" textAnchor="middle" fill="#5A6470">1</text>
    <path d="M-42 -30 A50 50 0 0 1 -12 -50" stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.8} />
    {shine > 0 && <path transform={`translate(44 -44) scale(${shine})`} d="M0 -30 L6 -6 L30 0 L6 6 L0 30 L-6 6 L-30 0 L-6 -6 Z" fill="#fff" />}
  </g>
);

/* etiquetadora na mão do repositor */
export const HeldGun: React.FC<{press: number}> = ({press}) => (
  <g transform={`rotate(${-20 + press * 15}) translate(10 -40)`}>
    <path d="M0 0 H130 Q150 0 150 20 V54 H0 Z" fill="#F07A22" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <rect x={14} y={12} width={96} height={26} rx={6} fill="#2B2B2B" />
    <path d="M60 54 L50 120 H86 L92 54 Z" fill="#C55A14" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <rect x={-16} y={8} width={18} height={40} rx={4} fill="#FFF3D6" stroke={INK} strokeWidth={5} />
  </g>
);
