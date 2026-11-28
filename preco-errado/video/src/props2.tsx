import React from 'react';
import {INK} from './props';
import {em, fitProps} from './fit';

const F = 'Inter Black, Inter, sans-serif';
export const T: React.FC<{x: number; y: number; s: number; fill?: string; children: React.ReactNode; anchor?: string;
  stroke?: string; sw?: number; ls?: number; op?: number; max?: number}> =
  ({x, y, s, fill = INK, children, anchor = 'middle', stroke, sw = 0, ls = -0.5, op = 1, max}) => (
    <text x={x} y={y} fontSize={s} {...fitProps(children, s, max)} fontFamily={F} fontWeight={900} fill={fill} textAnchor={anchor as any} opacity={op}
      stroke={stroke ?? 'none'} strokeWidth={sw} paintOrder="stroke fill" strokeLinejoin="round"
      style={{letterSpacing: ls}}>{children}</text>
  );

/* cores das moedas (notas estilizadas, sem reproduzir cédulas reais) */
export const CUR: Record<string, {c: string; d: string; sym: string}> = {
  'RÉIS': {c: '#D8B47A', d: '#8A6A3A', sym: 'Rs'},
  'CRUZEIRO': {c: '#E39A52', d: '#9A5520', sym: 'Cr$'},
  'CRUZEIRO NOVO': {c: '#C98B62', d: '#7E4A2A', sym: 'NCr$'},
  'CRUZADO': {c: '#9DBE7E', d: '#4F7A38', sym: 'Cz$'},
  'CRUZADO NOVO': {c: '#D97B6C', d: '#8E3A2E', sym: 'NCz$'},
  'CRUZEIRO REAL': {c: '#A98CC4', d: '#5E4480', sym: 'CR$'},
  'REAL': {c: '#5FBDB1', d: '#2D7F76', sym: 'R$'},
};

/* ---------- Moeda de R$ 1 (bimetálica estilizada) ---------- */
export const Coin1: React.FC<{size?: number; spin?: number; shine?: number}> = ({size = 200, spin = 0, shine = 0}) => {
  const sx = Math.cos(spin);
  const edge = Math.abs(sx) < 0.2;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{overflow: 'visible'}}>
      <g transform={`translate(100 100) scale(${Math.max(0.08, Math.abs(sx))} 1)`}>
        <circle r={92} fill="#C9972E" stroke={INK} strokeWidth={8} />
        <circle r={84} fill="#F2C24E" />
        {Array.from({length: 36}, (_, i) => (
          <rect key={i} x={-2} y={-90} width={4} height={8} fill="#B5841F" transform={`rotate(${i * 10})`} />
        ))}
        <circle r={58} fill="#C7CED6" stroke="#8D96A0" strokeWidth={5} />
        <circle r={50} fill="#DCE2E8" />
        {!edge && sx > 0 && <>
          <T x={0} y={26} s={78} fill="#5A6470">1</T>
          <T x={0} y={-62} s={18} fill="#8A5F12" ls={3}>REAL</T>
        </>}
        {!edge && sx <= 0 && <>
          <circle r={24} fill="none" stroke="#8D96A0" strokeWidth={5} />
          <path d="M-18 6 L0 -18 L18 6 Z" fill="#8D96A0" />
        </>}
        <path d="M-60 -40 A72 72 0 0 1 -20 -70" stroke="#fff" strokeWidth={8} fill="none" opacity={0.75} strokeLinecap="round" />
      </g>
      {shine > 0 && (
        <g transform={`translate(150 46) scale(${shine}) rotate(${shine * 40})`} fill="#fff">
          <path d="M0 -44 L8 -8 L44 0 L8 8 L0 44 L-8 8 L-44 0 L-8 -8 Z" />
        </g>
      )}
    </svg>
  );
};

/* ---------- Nota estilizada ---------- */
export const Note: React.FC<{w?: number; name: string; head?: string; tail?: string; cut?: number; scissorsLine?: number}> =
  ({w = 520, name, head = '1', tail = '', cut = 0, scissorsLine = 0}) => {
    const k = CUR[name] ?? CUR['CRUZEIRO'];
    const small = name.length > 10;
    return (
      <svg width={w} height={w * 0.5} viewBox="0 0 520 260" style={{overflow: 'visible'}}>
        <g stroke={INK} strokeWidth={10} strokeLinejoin="round">
          <rect x={6} y={6} width={508} height={248} rx={20} fill={k.c} />
        </g>
        <rect x={26} y={26} width={468} height={208} rx={12} fill="none" stroke={k.d} strokeWidth={5} strokeDasharray="2 9"
          strokeLinecap="round" />
        <ellipse cx={120} cy={138} rx={68} ry={78} fill="rgba(255,255,255,0.35)" stroke={k.d} strokeWidth={6} />
        <path d="M120 96 l12 26 28 3 -21 19 6 28 -25 -14 -25 14 6 -28 -21 -19 28 -3 Z" fill={k.d} opacity={0.7} />
        <rect x={210} y={40} width={286} height={50} rx={10} fill={k.d} />
        <T x={353} y={78} s={small ? 30 : 38} fill="#fff" ls={1} max={266}>{name}</T>
        {(() => {
          // área do valor: x 200..496 (à direita do retrato) — nada passa da borda da cédula
          const L = 200, Rr = 496, avail = Rr - L;
          if (!tail) {
            const txt = k.sym + ' ' + head;
            const sz = Math.min(104, avail / em(txt));
            return <T x={(L + Rr) / 2} y={200} s={sz} fill={INK} max={avail}>{txt}</T>;
          }
          const sz = Math.min(104, avail / em(head + tail));
          const hw = em(head) * sz, tw = em(tail) * sz;
          const x0 = (L + Rr) / 2 - (hw + tw) / 2;
          const cx = x0 + hw;
          return <>
            <T x={x0} y={128} s={34} fill={k.d} anchor="start">{k.sym}</T>
            <text x={x0} y={200} fontSize={sz} fontFamily={F} fontWeight={900} fill={INK} textLength={hw} lengthAdjust="spacingAndGlyphs">{head}</text>
            <g transform={`translate(${cx + cut * 40} ${200 + cut * cut * 520}) rotate(${cut * 70})`} opacity={1 - Math.max(0, cut - 0.7) / 0.3}>
              <text x={0} y={0} fontSize={sz} fontFamily={F} fontWeight={900} fill="#B3261E" textLength={tw} lengthAdjust="spacingAndGlyphs">{tail}</text>
            </g>
            {scissorsLine > 0 && <path d={`M${cx} 16 V${16 + 230 * scissorsLine}`} stroke="#fff" strokeWidth={6} strokeDasharray="14 10" />}
          </>;
        })()}
      </svg>
    );
  };

/* ---------- Tesoura ---------- */
export const Scissors: React.FC<{w?: number; open: number}> = ({w = 300, open}) => {
  const a = 6 + open * 28;
  const blade = (s: number) => (
    <g transform={`rotate(${s * a})`}>
      <path d={`M0 0 L260 ${-s * 12} Q275 0 260 ${s * 6} L0 ${s * 22} Z`} fill="#D8DEE4" stroke={INK} strokeWidth={8}
        strokeLinejoin="round" />
      <ellipse cx={-70} cy={s * 34} rx={52} ry={34} fill="none" stroke={INK} strokeWidth={30} />
      <ellipse cx={-70} cy={s * 34} rx={52} ry={34} fill="none" stroke="#E5322D" strokeWidth={18} />
    </g>
  );
  return (
    <svg width={w} height={w * 0.8} viewBox="-150 -120 440 240" style={{overflow: 'visible'}}>
      {blade(-1)}{blade(1)}
      <circle r={12} fill="#7D858F" stroke={INK} strokeWidth={6} />
    </svg>
  );
};

/* ---------- Etiquetadora ---------- */
export const PriceGun: React.FC<{w?: number; press: number}> = ({w = 300, press}) => (
  <svg width={w} height={w} viewBox="0 0 300 300" style={{overflow: 'visible'}}>
    <g stroke={INK} strokeWidth={9} strokeLinejoin="round">
      <path d="M40 60 H230 Q260 60 260 90 V140 H40 Z" fill="#F07A22" />
      <rect x={60} y={80} width={150} height={40} rx={8} fill="#2B2B2B" />
      <path d="M150 140 L130 280 H190 L200 140 Z" fill="#C55A14" />
      <path d={`M210 150 Q${250 - press * 20} 200 ${220 - press * 20} 250`} fill="none" strokeWidth={18} />
      <rect x={14} y={70} width={30} height={60} rx={6} fill="#FFF3D6" />
    </g>
    <T x={135} y={110} s={28} fill="#FFB040">0000</T>
  </svg>
);

export const Product: React.FC<{w?: number; label?: string; sub?: string; color?: string}> = ({w = 360, label = 'ARROZ', sub = '5 KG', color = '#E0662A'}) => (
  <svg width={w} height={w * 1.25} viewBox="0 0 360 450" style={{overflow: 'visible'}}>
    <g stroke={INK} strokeWidth={10} strokeLinejoin="round">
      <path d="M40 60 Q180 20 320 60 L340 420 Q180 450 20 420 Z" fill="#FFF4DC" />
      <path d="M40 60 Q180 20 320 60 L318 110 Q180 80 42 110 Z" fill={color} />
      <rect x={60} y={150} width={240} height={110} rx={14} fill={color} />
    </g>
    <T x={180} y={230} s={66} fill="#fff" max={220}>{label}</T>
    <T x={180} y={320} s={40} fill="#9A5520" max={260}>{sub}</T>
    {[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx={110 + i * 35} cy={370 + (i % 2) * 10} rx={10} ry={5} fill="#E8D7B0" />)}
  </svg>
);

export const Sticker: React.FC<{w?: number; text: string; color?: string}> = ({w = 300, text, color = '#FFE07A'}) => (
  <svg width={w} height={w * 0.42} viewBox="0 0 300 126" style={{overflow: 'visible'}}>
    <rect x={5} y={5} width={290} height={116} rx={14} fill={color} stroke={INK} strokeWidth={8} />
    <T x={150} y={84} s={58} max={258}>{text}</T>
  </svg>
);

/* ---------- Envelope de salário ---------- */
export const Envelope: React.FC<{w?: number; open?: number}> = ({w = 360, open = 0}) => (
  <svg width={w} height={w * 0.7} viewBox="0 0 360 252" style={{overflow: 'visible'}}>
    <g stroke={INK} strokeWidth={9} strokeLinejoin="round">
      {open > 0 && <rect x={60} y={40 - open * 70} width={240} height={120} rx={10} fill={CUR['CRUZEIRO REAL'].c} />}
      <rect x={10} y={40} width={340} height={200} rx={14} fill="#E9C88E" />
      <path d={`M10 50 L180 ${open > 0 ? 20 : 160} L350 50`} fill="#D9B070" />
    </g>
    <T x={180} y={215} s={44} fill="#7A4A1A" max={300}>SALÁRIO</T>
  </svg>
);

/* ---------- Ficha de nome de moeda ---------- */
export const Chip: React.FC<{w?: number; name: string; year: string; tag?: string; tagS?: number}> = ({w = 540, name, year, tag, tagS = 1}) => {
  const k = CUR[name] ?? CUR['CRUZEIRO'];
  return (
    <svg width={w} height={w * 0.26} viewBox="0 0 540 140" style={{overflow: 'visible'}}>
      <rect x={6} y={6} width={528} height={128} rx={22} fill={k.c} stroke={INK} strokeWidth={10} />
      <rect x={20} y={20} width={130} height={100} rx={14} fill={k.d} />
      <T x={85} y={86} s={40} fill="#fff" max={116}>{year}</T>
      <T x={168} y={92} s={58} anchor="start" fill={INK} max={352}>{name}</T>
      {tag && (
        <g transform={`translate(470 0) rotate(12) scale(${tagS})`}>
          <rect x={-120} y={-40} width={240} height={70} rx={12} fill="#E5322D" stroke={INK} strokeWidth={7} />
          <T x={0} y={12} s={40} fill="#fff" max={220}>{tag}</T>
        </g>
      )}
    </svg>
  );
};

/* ---------- Comentário com texto ---------- */
export const CommentT: React.FC<{w?: number; text: string; user: string; color?: string}> = ({w = 420, text, user, color = '#fff'}) => (
  <svg width={w} height={w * 0.42} viewBox="0 0 420 176" style={{overflow: 'visible'}}>
    <path d="M20 10 H400 a14 14 0 0 1 14 14 V120 a14 14 0 0 1 -14 14 H100 L60 170 L66 134 H20 a14 14 0 0 1 -14 -14 V24 a14 14 0 0 1 14 -14 Z"
      fill={color} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
    <circle cx={48} cy={52} r={22} fill="#E39A52" stroke={INK} strokeWidth={5} />
    <T x={82} y={62} s={26} anchor="start" fill="#8A6A5A" max={310}>{user}</T>
    <T x={32} y={112} s={36} anchor="start" max={370}>{text}</T>
  </svg>
);

/* ---------- Caixa de lata (guardados) ---------- */
export const TinBox: React.FC<{w?: number; open: number}> = ({w = 460, open}) => (
  <svg width={w} height={w * 0.8} viewBox="0 0 460 368" style={{overflow: 'visible'}}>
    <g stroke={INK} strokeWidth={10} strokeLinejoin="round">
      <g transform={`translate(30 150) rotate(${-open * 105})`}>
        <rect x={0} y={-36} width={400} height={44} rx={10} fill="#B5462E" />
        <rect x={150} y={-56} width={100} height={22} rx={8} fill="#E0A03A" />
      </g>
      <rect x={40} y={150} width={380} height={200} rx={16} fill="#C9553A" />
      <rect x={70} y={190} width={320} height={120} rx={12} fill="#E7B65C" />
    </g>
    <T x={230} y={270} s={44} fill="#7A2E1A" max={300}>GUARDADOS</T>
  </svg>
);

/* ---------- Pilha de notas ---------- */
export const Stack: React.FC<{w?: number; n: number; name?: string}> = ({w = 420, n, name = 'CRUZEIRO REAL'}) => {
  const k = CUR[name];
  const layers = Math.max(1, Math.round(n));
  return (
    <svg width={w} height={w} viewBox="0 0 420 420" style={{overflow: 'visible'}}>
      {Array.from({length: layers}, (_, i) => {
        const y = 380 - i * 16;
        const dx = Math.sin(i * 2.3) * 10;
        return (
          <g key={i} transform={`translate(${dx} ${y})`}>
            <rect x={30} y={-30} width={360} height={30} rx={6} fill={i % 2 ? k.c : k.d} stroke={INK} strokeWidth={6} />
            <rect x={180} y={-30} width={40} height={30} fill="#F2E3B5" stroke={INK} strokeWidth={4} />
          </g>
        );
      })}
    </svg>
  );
};

/* ---------- Gráfico de duração das moedas ---------- */
export const Durations: React.FC<{w?: number; k: number; win: number}> = ({w = 600, k, win}) => {
  const items: [string, number][] = [['CRUZEIRO', 25], ['CRUZ. NOVO', 3], ['CRUZEIRO', 16], ['CRUZADO', 3],
    ['CRUZ. NOVO', 1], ['CRUZEIRO', 3], ['CR. REAL', 1], ['REAL', 32]];
  return (
    <svg width={w} height={w * 1.05} viewBox="0 0 600 630" style={{overflow: 'visible'}}>
      <rect x={6} y={6} width={588} height={618} rx={30} fill="rgba(30,14,6,0.85)" stroke={INK} strokeWidth={10} />
      <T x={300} y={64} s={36} fill="#FFD59A" max={540}>ANOS DE CADA MOEDA</T>
      {items.map(([n, v], i) => {
        const kk = Math.max(0, Math.min(1, k * 8 - i));
        const real = i === items.length - 1;
        const len = (v / 32) * 300 * kk * (real ? 1 + 0.04 * win : 1);
        return (
          <g key={i} transform={`translate(0 ${100 + i * 64})`} opacity={kk > 0 ? 1 : 0.25}>
            <T x={190} y={38} s={30} anchor="end" fill={real ? '#FFE11A' : '#fff'} max={170}>{n}</T>
            <rect x={205} y={8} width={Math.max(6, len)} height={40} rx={8}
              fill={real ? '#5FBDB1' : (CUR[n.replace('CRUZ.', 'CRUZEIRO').replace('CR.', 'CRUZEIRO')]?.c ?? '#E39A52')}
              stroke={INK} strokeWidth={5} />
            {kk >= 1 && <T x={215 + len} y={40} s={28} anchor="start" fill="#fff">{real ? '30+' : v}</T>}
          </g>
        );
      })}
    </svg>
  );
};

/* ---------- Ponto de interrogação ---------- */
export const QMark: React.FC<{s?: number; color?: string}> = ({s = 120, color = '#FFE11A'}) => (
  <div style={{font: `900 ${s}px Inter`, color, WebkitTextStroke: `${s / 8}px ${INK}`, paintOrder: 'stroke fill'}}>?</div>
);

/* ---------- Faíscas / estrela ---------- */
export const Spark: React.FC<{s?: number; color?: string}> = ({s = 80, color = '#FFF6C9'}) => (
  <svg width={s} height={s} viewBox="-50 -50 100 100" style={{overflow: 'visible'}}>
    <path d="M0 -48 L9 -9 L48 0 L9 9 L0 48 L-9 9 L-48 0 L-9 -9 Z" fill={color} />
  </svg>
);
