import React from 'react';
import {INK} from './props';
import {T} from './props2';

/* Objetos do EP "Preço errado" — todo texto com largura máxima (nunca passa da borda) */

export const ShelfTag: React.FC<{w?: number; price: string; label?: string}> = ({w = 560, price, label = 'PRATELEIRA'}) => (
  <svg width={w} height={w * 0.47} viewBox="0 0 560 262" style={{overflow: 'visible'}}>
    <rect x={6} y={6} width={548} height={250} rx={26} fill="#FFE07A" stroke={INK} strokeWidth={10} />
    <rect x={6} y={6} width={548} height={64} rx={20} fill="#F2B040" stroke={INK} strokeWidth={10} />
    <T x={280} y={52} s={38} fill="#5A3414" max={480}>{label}</T>
    <T x={280} y={200} s={120} max={500}>{price}</T>
  </svg>
);

export const Register: React.FC<{w?: number; price: string; red?: boolean; glow?: boolean; label?: string}> =
  ({w = 580, price, red = false, glow = false, label = 'CAIXA · TOTAL'}) => (
    <svg width={w} height={w * 0.46} viewBox="0 0 580 268" style={{overflow: 'visible',
      filter: glow ? 'drop-shadow(0 0 40px rgba(255,60,40,0.9))' : undefined}}>
      <rect x={6} y={6} width={568} height={256} rx={26} fill="#13233A" stroke={INK} strokeWidth={12} />
      <rect x={26} y={26} width={528} height={216} rx={16} fill="#0B1626" />
      <T x={290} y={80} s={38} fill="#9CC3FF" max={480}>{label}</T>
      <T x={290} y={200} s={118} fill={red ? '#FF4A3D' : '#7CF29A'} max={500}>{price}</T>
    </svg>
  );

export const Check: React.FC<{s?: number; ok?: boolean}> = ({s = 120, ok = true}) => (
  <svg width={s} height={s} viewBox="0 0 120 120">
    <circle cx={60} cy={60} r={54} fill={ok ? '#2c9877' : '#E0443A'} stroke={INK} strokeWidth={9} />
    {ok ? <path d="M32 62 L52 82 L90 40" fill="none" stroke="#fff" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
      : <path d="M38 38 L82 82 M82 38 L38 82" stroke="#fff" strokeWidth={14} strokeLinecap="round" />}
  </svg>
);

export const Balloon: React.FC<{w?: number; text: string; tail?: 'left' | 'right'}> = ({w = 460, text, tail = 'left'}) => (
  <svg width={w} height={w * 0.42} viewBox="0 0 460 194" style={{overflow: 'visible'}}>
    <path d={tail === 'left'
      ? 'M30 10 H430 a20 20 0 0 1 20 20 V130 a20 20 0 0 1 -20 20 H130 L70 190 L84 150 H30 a20 20 0 0 1 -20 -20 V30 a20 20 0 0 1 20 -20 Z'
      : 'M30 10 H430 a20 20 0 0 1 20 20 V130 a20 20 0 0 1 -20 20 H376 L390 190 L330 150 H30 a20 20 0 0 1 -20 -20 V30 a20 20 0 0 1 20 -20 Z'}
      fill="#fff" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
    <T x={230} y={102} s={62} max={400}>{text}</T>
  </svg>
);

export const Phone: React.FC<{w?: number; price?: string}> = ({w = 260, price = 'R$ 19,90'}) => (
  <svg width={w} height={w * 1.8} viewBox="0 0 260 468" style={{overflow: 'visible'}}>
    <rect x={6} y={6} width={248} height={456} rx={36} fill="#2A2A30" stroke={INK} strokeWidth={10} />
    <rect x={22} y={44} width={216} height={380} rx={12} fill="#DCEAF2" />
    <rect x={98} y={18} width={64} height={12} rx={6} fill="#555" />
    <g transform="translate(130 210) rotate(-4)">
      <rect x={-96} y={-56} width={192} height={112} rx={12} fill="#FFE07A" stroke={INK} strokeWidth={6} />
      <T x={0} y={-24} s={20} fill="#5A3414" max={170}>PRATELEIRA</T>
      <T x={0} y={34} s={50} max={176}>{price}</T>
    </g>
    <circle cx={130} cy={360} r={26} fill="#fff" stroke={INK} strokeWidth={6} />
    <T x={130} y={410} s={22} fill="#5A6470" max={200}>FOTO SALVA ✓</T>
  </svg>
);

export const LawCard: React.FC<{w?: number; title: string; sub: string; color?: string}> = ({w = 580, title, sub, color = '#2f6fd0'}) => (
  <svg width={w} height={w * 0.45} viewBox="0 0 580 262" style={{overflow: 'visible'}}>
    <rect x={6} y={6} width={568} height={250} rx={24} fill="#FFFDF5" stroke={INK} strokeWidth={10} />
    <rect x={6} y={6} width={568} height={92} rx={20} fill={color} stroke={INK} strokeWidth={10} />
    <T x={290} y={72} s={56} fill="#fff" max={520}>{title}</T>
    <T x={290} y={190} s={64} max={520}>{sub}</T>
  </svg>
);

export const Scale: React.FC<{w?: number; tilt: number; left: string; right: string; win?: number}> = ({w = 560, tilt, left, right, win = 0}) => {
  const a = tilt * 14;
  const dy = Math.sin((a * Math.PI) / 180) * 180;
  return (
    <svg width={w} height={w * 0.8} viewBox="0 0 560 448" style={{overflow: 'visible'}}>
      <g stroke={INK} strokeWidth={9} strokeLinejoin="round">
        <path d="M250 430 H310 L295 120 H265 Z" fill="#C9962E" />
        <rect x={180} y={420} width={200} height={26} rx={10} fill="#A8781E" />
        <g transform={`rotate(${a} 280 120)`}><rect x={70} y={108} width={420} height={24} rx={12} fill="#E8B94A" /></g>
        <circle cx={280} cy={120} r={22} fill="#E8B94A" />
        {[[-1, left], [1, right]].map(([sd, lab]) => {
          const x = 280 + (sd as number) * 180, y = 120 + (sd as number) * dy;
          const winner = (sd === -1 && win > 0);
          return <g key={sd as number}>
            <path d={`M${x} ${y} L${x - 80} ${y + 120} M${x} ${y} L${x + 80} ${y + 120}`} fill="none" strokeWidth={5} />
            <path d={`M${x - 100} ${y + 120} Q${x} ${y + 190} ${x + 100} ${y + 120} Z`} fill={winner ? '#7CF29A' : '#E8B94A'} />
            <rect x={x - 90} y={y + 60} width={180} height={64} rx={12} fill={sd === -1 ? '#FFE07A' : '#13233A'} strokeWidth={6} />
            <T x={x} y={y + 106} s={42} fill={sd === -1 ? INK : '#FF4A3D'} max={166}>{lab as string}</T>
          </g>;
        })}
      </g>
    </svg>
  );
};

export const Contract: React.FC<{w?: number; sign: number; price?: string}> = ({w = 440, sign, price = 'R$ 19,90'}) => {
  const L = 300;
  return (
    <svg width={w} height={w * 1.25} viewBox="0 0 440 550" style={{overflow: 'visible'}}>
      <rect x={10} y={10} width={420} height={530} rx={14} fill="#FFFDF5" stroke={INK} strokeWidth={10} />
      <T x={220} y={86} s={50} fill="#2f6fd0" max={380}>PROMESSA</T>
      <T x={220} y={170} s={70} max={380}>{price}</T>
      {[0, 1, 2, 3].map((i) => <rect key={i} x={50} y={210 + i * 40} width={i === 3 ? 220 : 340} height={14} rx={7} fill="#D8CFB8" />)}
      <path d="M60 470 H380" stroke={INK} strokeWidth={4} />
      <path d={`M70 455 q30 -60 60 -10 t60 -10 t60 10 t60 -20 t60 10`} fill="none" stroke="#2f6fd0" strokeWidth={8}
        strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - sign)} />
      <T x={220} y={515} s={26} fill="#8A7A6A" max={380}>ASSINADO: A LOJA</T>
    </svg>
  );
};

export const Warning: React.FC<{s?: number}> = ({s = 260}) => (
  <svg width={s} height={s * 0.9} viewBox="0 0 260 234" style={{overflow: 'visible'}}>
    <path d="M130 10 L250 222 H10 Z" fill="#FFD34A" stroke={INK} strokeWidth={12} strokeLinejoin="round" />
    <rect x={118} y={70} width={24} height={90} rx={12} fill={INK} />
    <circle cx={130} cy={190} r={15} fill={INK} />
  </svg>
);

export const TV: React.FC<{w?: number; price: string; flash?: boolean}> = ({w = 600, price, flash = false}) => (
  <svg width={w} height={w * 0.85} viewBox="0 0 600 510" style={{overflow: 'visible'}}>
    <g stroke={INK} strokeWidth={10} strokeLinejoin="round">
      <rect x={10} y={10} width={580} height={350} rx={20} fill="#1A1A20" />
      <rect x={34} y={34} width={532} height={302} rx={8} fill="#2F6FD0" />
      <path d="M260 360 L240 420 H360 L340 360 Z" fill="#2A2A30" />
      <rect x={180} y={410} width={240} height={24} rx={10} fill="#2A2A30" />
    </g>
    <T x={300} y={210} s={64} fill="#fff" max={480}>TV 75"</T>
    <g transform="translate(400 300) rotate(-8)">
      <rect x={-170} y={-70} width={340} height={150} rx={18} fill={flash ? '#FF4A3D' : '#FFE07A'} stroke={INK} strokeWidth={9} />
      <T x={0} y={34} s={92} fill={flash ? '#fff' : INK} max={300}>{price}</T>
    </g>
  </svg>
);

export const Gavel: React.FC<{w?: number; angle: number}> = ({w = 360, angle}) => (
  <svg width={w} height={w} viewBox="0 0 360 360" style={{overflow: 'visible'}}>
    <g stroke={INK} strokeWidth={9} strokeLinejoin="round">
      <rect x={40} y={290} width={280} height={50} rx={14} fill="#8A4A24" />
      <g transform={`rotate(${angle} 300 300)`}>
        <rect x={120} y={140} width={200} height={34} rx={12} fill="#A85A2E" transform="rotate(-30 220 157)" />
        <rect x={40} y={90} width={130} height={90} rx={18} fill="#6B3418" transform="rotate(-30 105 135)" />
      </g>
    </g>
  </svg>
);

export const Checklist: React.FC<{w?: number; items: string[]; n: number}> = ({w = 600, items, n}) => (
  <svg width={w} height={w * 0.75} viewBox="0 0 600 450" style={{overflow: 'visible'}}>
    <rect x={8} y={8} width={584} height={434} rx={28} fill="#FFFDF5" stroke={INK} strokeWidth={10} />
    {items.map((it, i) => (
      <g key={i} transform={`translate(0 ${40 + i * 130})`} opacity={i < n ? 1 : 0.25}>
        <rect x={36} y={6} width={90} height={90} rx={18} fill={i < n ? '#2c9877' : '#fff'} stroke={INK} strokeWidth={8} />
        {i < n && <path d="M56 52 L76 72 L108 30" fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />}
        <T x={150} y={72} s={56} anchor="start" max={410}>{it}</T>
      </g>
    ))}
  </svg>
);

export const ShareIcon: React.FC<{s?: number}> = ({s = 170}) => (
  <svg width={s} height={s} viewBox="0 0 170 170">
    <circle cx={85} cy={85} r={78} fill="#fff" stroke={INK} strokeWidth={9} />
    <path d="M48 112 Q52 62 104 58 V36 L140 78 L104 118 V96 Q70 94 48 112 Z" fill="#E0443A" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
  </svg>
);

export const RainCloud: React.FC<{w?: number; t: number}> = ({w = 300, t}) => (
  <svg width={w} height={w * 0.9} viewBox="0 0 300 270" style={{overflow: 'visible'}}>
    {Array.from({length: 9}, (_, i) => {
      const y = 120 + ((t * 420 + i * 47) % 150);
      return <path key={i} d={`M${50 + i * 25} ${y} l-6 22`} stroke="#6FB8E8" strokeWidth={8} strokeLinecap="round" />;
    })}
    <path d="M60 120 a50 50 0 0 1 20 -90 a60 60 0 0 1 110 -10 a50 50 0 0 1 60 60 a40 40 0 0 1 -10 40 Z" fill="#7A8290" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
  </svg>
);

export const Bag: React.FC<{w?: number}> = ({w = 200}) => (
  <svg width={w} height={w * 1.1} viewBox="0 0 200 220" style={{overflow: 'visible'}}>
    <path d="M60 60 Q60 10 100 10 Q140 10 140 60" fill="none" stroke={INK} strokeWidth={10} />
    <path d="M20 60 H180 L168 210 H32 Z" fill="#F4EFE4" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
    <rect x={44} y={30} width={50} height={40} fill="#E0662A" stroke={INK} strokeWidth={6} />
  </svg>
);

export const Clock: React.FC<{w?: number; t: number; speed?: number}> = ({w = 200, t, speed = 1}) => (
  <svg width={w} height={w} viewBox="0 0 200 200">
    <circle cx={100} cy={100} r={90} fill="#FFFDF5" stroke={INK} strokeWidth={10} />
    {Array.from({length: 12}, (_, i) => <rect key={i} x={96} y={18} width={8} height={18} fill={INK} transform={`rotate(${i * 30} 100 100)`} />)}
    <path d={`M100 100 L${100 + Math.sin(t * 6 * speed) * 70} ${100 - Math.cos(t * 6 * speed) * 70}`} stroke="#E0443A" strokeWidth={8} strokeLinecap="round" />
    <path d={`M100 100 L${100 + Math.sin(t * 0.5 * speed) * 45} ${100 - Math.cos(t * 0.5 * speed) * 45}`} stroke={INK} strokeWidth={12} strokeLinecap="round" />
    <circle cx={100} cy={100} r={10} fill={INK} />
  </svg>
);
