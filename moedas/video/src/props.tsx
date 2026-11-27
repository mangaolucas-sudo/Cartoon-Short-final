import React from 'react';
import {fitProps} from './fit';

export const INK = '#1E120B';
const F = 'Inter Black, Inter, sans-serif';

const T: React.FC<{x: number; y: number; s: number; fill?: string; children: React.ReactNode; anchor?: string; w?: number}> =
  ({x, y, s, fill = INK, children, anchor = 'middle', w}) => (
    <text x={x} y={y} fontSize={s} {...fitProps(children, s, w)} fontFamily={F} fontWeight={900} fill={fill} textAnchor={anchor as any}
      stroke="none" style={{letterSpacing: -0.5}}>{children}</text>
  );

/* ---------- Cadeado ---------- */
export const Padlock: React.FC<{size?: number; open?: number}> = ({size = 200, open = 0}) => (
  <svg width={size} height={size * 1.2} viewBox="0 0 200 240" style={{overflow: 'visible'}}>
    <g stroke={INK} strokeWidth={10} strokeLinejoin="round">
      <path d={`M50 ${110 - open * 40} V70 a50 50 0 0 1 100 0 V${110}`} fill="none" stroke={INK} strokeWidth={34} />
      <path d={`M50 ${110 - open * 40} V70 a50 50 0 0 1 100 0 V${110}`} fill="none" stroke="#B8BEC6" strokeWidth={18} />
      <rect x={18} y={100} width={164} height={128} rx={22} fill="#F5B800" />
      <rect x={18} y={100} width={164} height={30} rx={14} fill="#FFD84A" stroke="none" />
      <circle cx={100} cy={156} r={18} fill={INK} />
      <path d="M92 160 L86 200 H114 L108 160 Z" fill={INK} />
    </g>
  </svg>
);

/* ---------- Cofrinho ---------- */
export const Piggy: React.FC<{size?: number}> = ({size = 520}) => (
  <svg width={size} height={size * 0.78} viewBox="0 0 520 405" style={{overflow: 'visible'}}>
    <g stroke={INK} strokeWidth={10} strokeLinejoin="round" strokeLinecap="round">
      <path d="M120 330 v60 h50 v-50 M330 340 v50 h50 v-60" fill="#F08DAA" />
      <ellipse cx={260} cy={220} rx={210} ry={160} fill="#F7A3BD" />
      <ellipse cx={210} cy={150} rx={90} ry={40} fill="#FBC3D4" stroke="none" />
      <path d="M130 90 L120 20 L190 70 Z" fill="#F08DAA" />
      <path d="M380 210 q70 -10 70 40 q0 40 -40 40" fill="none" />
      <ellipse cx={70} cy={230} rx={52} ry={44} fill="#F08DAA" />
      <ellipse cx={58} cy={222} rx={7} ry={12} fill={INK} />
      <ellipse cx={84} cy={222} rx={7} ry={12} fill={INK} />
      <circle cx={150} cy={170} r={12} fill={INK} />
      <rect x={220} y={58} width={110} height={18} rx={9} fill={INK} />
    </g>
  </svg>
);

export const Coin: React.FC<{size?: number}> = ({size = 90}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx={50} cy={50} r={44} fill="#FFC928" stroke={INK} strokeWidth={8} />
    <circle cx={50} cy={50} r={30} fill="none" stroke="#E0A100" strokeWidth={6} />
    <T x={50} y={64} s={40} fill="#9A6500">$</T>
  </svg>
);

/* ---------- Calendário ---------- */
export const Calendar: React.FC<{top: string; day: string; sub?: string; w?: number; circle?: number}> =
  ({top, day, sub, w = 440, circle = 0}) => (
    <svg width={w} height={w * 1.05} viewBox="0 0 440 462" style={{overflow: 'visible'}}>
      <g stroke={INK} strokeWidth={10} strokeLinejoin="round">
        <rect x={10} y={30} width={420} height={420} rx={30} fill="#FFFDF5" />
        <path d="M10 60 a30 30 0 0 1 30 -30 h360 a30 30 0 0 1 30 30 v70 H10 Z" fill="#E5322D" />
        <rect x={90} y={6} width={26} height={60} rx={13} fill="#8C8C8C" />
        <rect x={324} y={6} width={26} height={60} rx={13} fill="#8C8C8C" />
      </g>
      <T x={220} y={106} s={52} fill="#fff" w={380}>{top}</T>
      <T x={220} y={330} s={200} w={380}>{day}</T>
      {sub && <T x={220} y={410} s={44} fill="#7A4A2A" w={390}>{sub}</T>}
      {circle > 0 && (
        <ellipse cx={220} cy={262} rx={150} ry={118} fill="none" stroke="#E5322D" strokeWidth={14}
          strokeDasharray={900} strokeDashoffset={900 * (1 - circle)} transform="rotate(-8 220 262)" strokeLinecap="round" />
      )}
    </svg>
  );

/* ---------- TV antiga ---------- */
export const OldTV: React.FC<{w?: number; mode: 'static' | 'news' | 'alert'; t: number}> = ({w = 560, mode, t}) => {
  const noise = Array.from({length: 40}, (_, i) => {
    const r = Math.sin(i * 91.7 + Math.floor(t * 30) * 13.3) * 43758.5;
    return r - Math.floor(r);
  });
  const blink = Math.floor(t * 4) % 2 === 0;
  return (
    <svg width={w} height={w * 0.86} viewBox="0 0 560 480" style={{overflow: 'visible'}}>
      <g stroke={INK} strokeWidth={10} strokeLinejoin="round" strokeLinecap="round">
        <path d="M220 90 L150 10 M340 90 L420 20" fill="none" />
        <circle cx={150} cy={10} r={10} fill={INK} />
        <circle cx={420} cy={20} r={10} fill={INK} />
        <rect x={10} y={90} width={540} height={360} rx={40} fill="#9A5A2B" />
        <rect x={40} y={118} width={380} height={300} rx={50} fill="#2B3440" />
        <rect x={60} y={136} width={340} height={264} rx={36} fill={mode === 'static' ? '#9AA3AD' : '#16365C'} />
        <rect x={440} y={130} width={90} height={290} rx={16} fill="#7A4420" />
        <circle cx={485} cy={180} r={22} fill="#D9D2C5" />
        <circle cx={485} cy={250} r={22} fill="#D9D2C5" />
        <path d="M110 450 l-20 26 M450 450 l20 26" fill="none" />
      </g>
      {mode === 'static' && noise.map((n, i) => (
        <rect key={i} x={64 + (i % 8) * 42} y={140 + Math.floor(i / 8) * 52} width={42} height={52}
          fill={`rgba(255,255,255,${n * 0.6})`} />
      ))}
      {mode !== 'static' && (
        <g>
          <rect x={60} y={150} width={340} height={64} fill={mode === 'alert' && blink ? '#FFD400' : '#E5322D'} />
          <T x={230} y={198} s={42} fill={mode === 'alert' && blink ? INK : '#fff'}>URGENTE</T>
          <T x={230} y={276} s={40} fill="#fff">{mode === 'alert' ? 'POUPANÇA' : 'NOVO PLANO'}</T>
          <T x={230} y={330} s={40} fill={mode === 'alert' ? '#FFD400' : '#fff'}>{mode === 'alert' ? 'BLOQUEADA' : 'ECONÔMICO'}</T>
          <rect x={60} y={356} width={340} height={30} fill="#0B1E35" />
          <T x={230} y={380} s={20} fill="#9CC3FF">AO VIVO · 16/03/1990</T>
        </g>
      )}
    </svg>
  );
};

/* ---------- Etiqueta de preço ---------- */
export const PriceTag: React.FC<{w?: number; item: string; prices: string[]; idx: number; local: number[]}> =
  ({w = 520, item, prices, idx, local}) => (
    <svg width={w} height={w * 0.8} viewBox="0 0 520 416" style={{overflow: 'visible'}}>
      <g stroke={INK} strokeWidth={10} strokeLinejoin="round">
        <path d="M110 40 H480 a20 20 0 0 1 20 20 V356 a20 20 0 0 1 -20 20 H110 L20 208 Z" fill="#FFE07A" />
        <circle cx={92} cy={208} r={20} fill="#E88A2E" />
      </g>
      <T x={310} y={120} s={48} fill="#7A4A2A">{item}</T>
      <T x={310} y={290} s={130}>{prices[0]}</T>
      {prices.slice(1).map((p, i) => {
        const k = local[i];
        if (k === undefined || k < 0) return null;
        const s = 1.6 - Math.min(1, k / 5) * 0.6;
        const rot = [-7, 5, -4, 6][i % 4];
        return (
          <g key={i} transform={`translate(310 ${236 - i * 6}) rotate(${rot}) scale(${s})`}>
            <rect x={-200} y={-86} width={400} height={150} rx={14} fill={i === prices.length - 2 ? '#E5322D' : '#FF8A1F'}
              stroke={INK} strokeWidth={8} />
            <T x={0} y={36} s={110} fill="#fff">{p}</T>
          </g>
        );
      })}
      {idx > 0 && null}
    </svg>
  );

/* ---------- Dinheiro ---------- */
export const Bills: React.FC<{w?: number; label: string; color?: string}> = ({w = 420, label, color = '#7CC36B'}) => (
  <svg width={w} height={w * 0.75} viewBox="0 0 420 315" style={{overflow: 'visible'}}>
    <g stroke={INK} strokeWidth={9} strokeLinejoin="round">
      {[60, 36, 12].map((y, i) => (
        <g key={i} transform={`translate(${i * 8} ${y})`}>
          <rect x={20} y={40} width={360} height={170} rx={16} fill={color} />
          <circle cx={200} cy={125} r={52} fill="#BFE6B3" />
        </g>
      ))}
      <rect x={180} y={50} width={40} height={210} fill="#F2E3B5" />
    </g>
    <rect x={20} y={240} width={380} height={74} rx={18} fill={INK} />
    <T x={210} y={293} s={46} fill="#FFE11A">{label}</T>
  </svg>
);

/* ---------- Cofre do Banco Central ---------- */
export const Vault: React.FC<{w?: number; spin?: number}> = ({w = 520, spin = 0}) => (
  <svg width={w} height={w} viewBox="0 0 520 520" style={{overflow: 'visible'}}>
    <g stroke={INK} strokeWidth={10} strokeLinejoin="round">
      <rect x={10} y={10} width={500} height={500} rx={40} fill="#6E7782" />
      <circle cx={260} cy={270} r={200} fill="#AEB6C0" />
      <circle cx={260} cy={270} r={150} fill="#C9D0D8" />
      <g transform={`rotate(${spin} 260 270)`}>
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <rect key={a} x={250} y={130} width={20} height={90} rx={10} fill="#5B636D" transform={`rotate(${a} 260 270)`} />
        ))}
        <circle cx={260} cy={270} r={44} fill="#5B636D" />
      </g>
    </g>
    <rect x={60} y={24} width={400} height={56} rx={12} fill="#1E2A36" />
    <T x={260} y={65} s={36} fill="#fff">BANCO CENTRAL</T>
  </svg>
);

/* ---------- Cartão de conta ---------- */
export const AccountCard: React.FC<{w?: number; label: string; color: string}> = ({w = 560, label, color}) => (
  <svg width={w} height={w * 0.3} viewBox="0 0 560 168" style={{overflow: 'visible'}}>
    <rect x={6} y={6} width={548} height={156} rx={24} fill={color} stroke={INK} strokeWidth={10} />
    <rect x={36} y={52} width={70} height={54} rx={10} fill="#FFD84A" stroke={INK} strokeWidth={6} />
    <T x={128} y={100} s={42} fill="#fff" anchor="start">{label}</T>
  </svg>
);

export const Stamp: React.FC<{text: string; w?: number; color?: string}> = ({text, w = 520, color = '#E5322D'}) => (
  <svg width={w} height={w * 0.32} viewBox="0 0 520 166">
    <rect x={10} y={10} width={500} height={146} rx={18} fill="rgba(255,255,255,0.15)" stroke={color} strokeWidth={14} />
    <T x={260} y={118} s={100} fill={color} w={460}>{text}</T>
  </svg>
);

/* ---------- Casa ---------- */
export const House: React.FC<{w?: number; sold: number; swing: number}> = ({w = 520, sold, swing}) => (
  <svg width={w} height={w} viewBox="0 0 520 520" style={{overflow: 'visible'}}>
    <g stroke={INK} strokeWidth={10} strokeLinejoin="round">
      <rect x={80} y={210} width={330} height={250} fill="#FFF1D6" />
      <path d="M50 230 L245 70 L440 230 Z" fill="#D2452F" />
      <rect x={330} y={90} width={44} height={90} fill="#8A4B2A" />
      <rect x={210} y={320} width={80} height={140} fill="#8A4B2A" />
      <rect x={110} y={260} width={70} height={70} fill="#8FD3FF" />
      <rect x={320} y={260} width={70} height={70} fill="#8FD3FF" />
      <rect x={20} y={460} width={480} height={20} rx={10} fill="#6FB34A" />
      <path d="M440 470 V300" fill="none" />
    </g>
    <g transform={`translate(440 312) rotate(${swing})`}>
      <path d="M-50 0 V30 M50 0 V30" stroke={INK} strokeWidth={6} />
      <rect x={-90} y={30} width={180} height={80} rx={10} fill="#fff" stroke={INK} strokeWidth={8} />
      <T x={0} y={86} s={40} fill={sold ? '#E5322D' : INK}>{sold ? 'VENDIDA' : 'VENDE-SE'}</T>
    </g>
  </svg>
);

/* ---------- Saldo ---------- */
export const Balance: React.FC<{w?: number; value: number}> = ({w = 600, value}) => {
  const txt = 'R$ ' + Math.max(0, Math.round(value)).toLocaleString('pt-BR') + ',00';
  const zero = value <= 0.5;
  return (
    <svg width={w} height={w * 0.42} viewBox="0 0 600 252" style={{overflow: 'visible'}}>
      <rect x={6} y={6} width={588} height={240} rx={30} fill="#13233A" stroke={INK} strokeWidth={10} />
      <T x={300} y={78} s={38} fill="#9CC3FF">SALDO DISPONÍVEL</T>
      <T x={300} y={180} s={zero ? 96 : 76} fill={zero ? '#FF4A3D' : '#7CF29A'}>{txt}</T>
    </svg>
  );
};

/* ---------- Gráfico da Bolsa ---------- */
export const Chart: React.FC<{w?: number; draw: number; crash: number}> = ({w = 640, draw, crash}) => {
  // série: lateral, depois despenca 50%
  const pts: [number, number][] = [];
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const x = i / N;
    let y = 0.25 + Math.sin(i * 1.7) * 0.03 + Math.sin(i * 0.6) * 0.02;
    if (x > 0.45) y += Math.min(1, (x - 0.45) / 0.55) ** 1.2 * 0.55 * crash;
    pts.push([40 + x * 540, 70 + y * 360]);
  }
  const k = Math.max(1, Math.round(draw * N));
  const d = pts.slice(0, k + 1).map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const last = pts[k];
  return (
    <svg width={w} height={w * 0.8} viewBox="0 0 620 496" style={{overflow: 'visible'}}>
      <rect x={6} y={6} width={608} height={484} rx={30} fill="#141B24" stroke={INK} strokeWidth={10} />
      {[1, 2, 3, 4].map((i) => <path key={i} d={`M30 ${i * 96} H590`} stroke="#2A3644" strokeWidth={3} />)}
      <path d={d} fill="none" stroke="#FF3B30" strokeWidth={14} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={14} fill="#FF3B30" stroke="#fff" strokeWidth={5} />
      <T x={40} y={60} s={36} fill="#fff" anchor="start">IBOVESPA</T>
      {crash > 0.6 && <T x={560} y={470} s={64} fill="#FF3B30" anchor="end">-50%</T>}
    </svg>
  );
};

/* ---------- Empresa fechada / obra ---------- */
export const Building: React.FC<{w?: number; label: string; closed: number}> = ({w = 480, label, closed}) => (
  <svg width={w} height={w * 1.1} viewBox="0 0 480 528" style={{overflow: 'visible'}}>
    <g stroke={INK} strokeWidth={10} strokeLinejoin="round">
      <rect x={60} y={80} width={360} height={430} fill="#C98A55" />
      {[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => (
        <rect key={`${r}${c}`} x={100 + c * 100} y={120 + r * 80} width={70} height={52} fill={closed ? '#4A3A30' : '#FFE07A'} />
      )))}
      <rect x={200} y={430} width={80} height={80} fill="#6B3E22" />
    </g>
    <rect x={40} y={20} width={400} height={70} rx={12} fill="#fff" stroke={INK} strokeWidth={8} />
    <T x={240} y={72} s={44}>{label}</T>
    {closed > 0 && (
      <g transform={`translate(240 330) rotate(-12) scale(${closed})`}>
        <rect x={-200} y={-58} width={400} height={116} rx={14} fill="#E5322D" stroke={INK} strokeWidth={8} />
        <T x={0} y={32} s={84} fill="#fff">FECHADO</T>
      </g>
    )}
  </svg>
);

/* ---------- Cédula do Real (genérica) ---------- */
export const RealNote: React.FC<{w?: number}> = ({w = 520}) => (
  <svg width={w} height={w * 0.5} viewBox="0 0 520 260" style={{overflow: 'visible'}}>
    <rect x={8} y={8} width={504} height={244} rx={22} fill="#4FB0A5" stroke={INK} strokeWidth={10} />
    <rect x={30} y={30} width={460} height={200} rx={14} fill="none" stroke="#2D7F76" strokeWidth={6} />
    <circle cx={150} cy={130} r={72} fill="#8ED8CE" stroke="#2D7F76" strokeWidth={6} />
    <T x={150} y={156} s={74} fill="#1F5F58">R$</T>
    <T x={370} y={150} s={80} fill="#fff" w={220}>1994</T>
  </svg>
);

/* ---------- Botão seguir / comentários / setas ---------- */
export const FollowBtn: React.FC<{w?: number; done: boolean}> = ({w = 460, done}) => (
  <svg width={w} height={w * 0.3} viewBox="0 0 460 138" style={{overflow: 'visible'}}>
    <rect x={6} y={6} width={448} height={126} rx={63} fill={done ? '#5A5F66' : '#FE2C55'} stroke={INK} strokeWidth={10} />
    <T x={230} y={90} s={62} fill="#fff" w={400}>{done ? 'SEGUINDO ✓' : '+ SEGUIR'}</T>
  </svg>
);

export const Comment: React.FC<{w?: number; lines?: number; color?: string}> = ({w = 300, lines = 2, color = '#fff'}) => (
  <svg width={w} height={w * 0.55} viewBox="0 0 300 165" style={{overflow: 'visible'}}>
    <path d="M20 10 H280 a14 14 0 0 1 14 14 V110 a14 14 0 0 1 -14 14 H90 L50 158 L56 124 H20 a14 14 0 0 1 -14 -14 V24 a14 14 0 0 1 14 -14 Z"
      fill={color} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
    {Array.from({length: lines}, (_, i) => (
      <rect key={i} x={36} y={36 + i * 34} width={i === lines - 1 ? 140 : 220} height={18} rx={9} fill="#C9C2B8" />
    ))}
  </svg>
);

export const ArrowDown: React.FC<{w?: number; color?: string}> = ({w = 120, color = '#FFE11A'}) => (
  <svg width={w} height={w * 1.3} viewBox="0 0 120 156">
    <path d="M38 8 H82 V86 H112 L60 148 L8 86 H38 Z" fill={color} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
  </svg>
);

export const ArrowUp: React.FC<{w?: number; color?: string}> = ({w = 120, color = '#E5322D'}) => (
  <div style={{transform: 'rotate(180deg)', width: w}}><ArrowDown w={w} color={color} /></div>
);

export const Chain: React.FC<{w?: number}> = ({w = 600}) => (
  <svg width={w} height={60} viewBox={`0 0 ${w} 60`}>
    {Array.from({length: Math.floor(w / 56)}, (_, i) => (
      <rect key={i} x={i * 56 + 4} y={i % 2 ? 18 : 6} width={64} height={i % 2 ? 24 : 48} rx={i % 2 ? 12 : 24}
        fill="none" stroke="#7D858F" strokeWidth={12} />
    ))}
  </svg>
);

export const PhotoFrame: React.FC<{w?: number}> = ({w = 420}) => (
  <svg width={w} height={w * 0.95} viewBox="0 0 420 400" style={{overflow: 'visible'}}>
    <rect x={8} y={8} width={404} height={384} rx={10} fill="#F4E9D2" stroke={INK} strokeWidth={10} />
    <rect x={36} y={36} width={348} height={260} fill="#C9A77A" stroke={INK} strokeWidth={6} />
    {[[140, '#6A8CC7', '#8C8C8C'], [280, '#C76A8C', '#B5B5B5']].map(([x, c, h], i) => (
      <g key={i} stroke={INK} strokeWidth={6}>
        <path d={`M${(x as number) - 60} 296 Q${x} 196 ${(x as number) + 60} 296 Z`} fill={c as string} />
        <circle cx={x as number} cy={168} r={48} fill="#F6C59B" />
        <path d={`M${(x as number) - 48} 160 Q${x} 100 ${(x as number) + 48} 160 Q${x} 136 ${(x as number) - 48} 160Z`} fill={h as string} />
        <circle cx={(x as number) - 16} cy={172} r={5} fill={INK} />
        <circle cx={(x as number) + 16} cy={172} r={5} fill={INK} />
      </g>
    ))}
    <T x={210} y={358} s={46} fill="#5A3A22">PAIS & AVÓS</T>
  </svg>
);

export const Coins12: React.FC<{n: number; w?: number}> = ({n, w = 620}) => (
  <svg width={w} height={w * 0.42} viewBox="0 0 620 260">
    {Array.from({length: 12}, (_, i) => {
      const on = i < n;
      const x = 40 + (i % 6) * 108, y = 30 + Math.floor(i / 6) * 120;
      return (
        <g key={i} transform={`translate(${x} ${y})`} opacity={on ? 1 : 0.25}>
          <circle cx={42} cy={42} r={40} fill={on ? '#FFC928' : '#fff'} stroke={INK} strokeWidth={7} />
          <T x={42} y={58} s={40} fill="#7A4A00">{i + 1}</T>
        </g>
      );
    })}
  </svg>
);
