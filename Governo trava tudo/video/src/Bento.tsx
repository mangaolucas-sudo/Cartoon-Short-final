import React from 'react';
import {Img, staticFile} from 'remotion';
import manifest from './data/bento.json';

export type Expr = 'choque' | 'neutro' | 'preocupado' | 'triste' | 'feliz' | 'apontando' | 'acenando';

// Se faltar uma expressão em ./assets/bento, usa a mais próxima.
const NEAREST: Record<Expr, Expr[]> = {
  choque: ['choque', 'preocupado', 'triste', 'neutro'],
  neutro: ['neutro', 'feliz', 'preocupado', 'apontando', 'acenando'],
  preocupado: ['preocupado', 'triste', 'choque', 'neutro'],
  triste: ['triste', 'preocupado', 'choque', 'neutro'],
  feliz: ['feliz', 'acenando', 'neutro', 'apontando'],
  apontando: ['apontando', 'neutro', 'feliz', 'acenando'],
  acenando: ['acenando', 'feliz', 'neutro', 'apontando'],
};

const files = (manifest as any).files as Record<string, string>;

export const pickPng = (expr: Expr): string | null => {
  for (const e of NEAREST[expr]) if (files[e]) return files[e];
  const any = Object.values(files)[0];
  return any ?? null;
};

const INK = '#22140C';
const SKIN = '#F6C59B';
const SKIN_SH = '#E3A57A';
const SHIRT = '#2E6FD6';
const SHIRT_SH = '#2357AC';
const HAIR = '#5A3214';

type Props = {expr: Expr; talk: number; blink: boolean; wave: number; t: number};

// Bento provisório em SVG (cabeça grande, camisa azul). viewBox 400x600.
const Svg: React.FC<Props> = ({expr, talk, blink, wave}) => {
  const sw = 8;
  const eyeR = expr === 'choque' ? 30 : 24;
  const pupil = expr === 'choque' ? 7 : 11;
  const eyeY = 190;
  const lx = 152, rx = 248;
  const browY = expr === 'choque' ? 132 : 148;

  const brows = () => {
    switch (expr) {
      case 'preocupado':
      case 'triste':
        return (<>
          <path d={`M${lx - 28} ${browY + 6} Q${lx} ${browY - 6} ${lx + 26} ${browY - 14}`} />
          <path d={`M${rx + 28} ${browY + 6} Q${rx} ${browY - 6} ${rx - 26} ${browY - 14}`} />
        </>);
      case 'choque':
        return (<>
          <path d={`M${lx - 30} ${browY + 4} Q${lx} ${browY - 18} ${lx + 28} ${browY + 2}`} />
          <path d={`M${rx - 28} ${browY + 2} Q${rx} ${browY - 18} ${rx + 30} ${browY + 4}`} />
        </>);
      default:
        return (<>
          <path d={`M${lx - 26} ${browY} Q${lx} ${browY - 12} ${lx + 26} ${browY}`} />
          <path d={`M${rx - 26} ${browY} Q${rx} ${browY - 12} ${rx + 26} ${browY}`} />
        </>);
    }
  };

  const eyes = () => {
    if (blink) return (<>
      <path d={`M${lx - 22} ${eyeY} Q${lx} ${eyeY + 10} ${lx + 22} ${eyeY}`} fill="none" />
      <path d={`M${rx - 22} ${eyeY} Q${rx} ${eyeY + 10} ${rx + 22} ${eyeY}`} fill="none" />
    </>);
    if (expr === 'feliz' || expr === 'acenando') return (<>
      <path d={`M${lx - 22} ${eyeY + 6} Q${lx} ${eyeY - 20} ${lx + 22} ${eyeY + 6}`} fill="none" />
      <path d={`M${rx - 22} ${eyeY + 6} Q${rx} ${eyeY - 20} ${rx + 22} ${eyeY + 6}`} fill="none" />
    </>);
    const py = expr === 'apontando' ? 10 : expr === 'triste' ? 6 : 0;
    return (<>
      <ellipse cx={lx} cy={eyeY} rx={eyeR - 4} ry={eyeR} fill="#fff" />
      <ellipse cx={rx} cy={eyeY} rx={eyeR - 4} ry={eyeR} fill="#fff" />
      <circle cx={lx + 3} cy={eyeY + py} r={pupil} fill={INK} stroke="none" />
      <circle cx={rx - 3} cy={eyeY + py} r={pupil} fill={INK} stroke="none" />
      <circle cx={lx + 6} cy={eyeY + py - 4} r={3} fill="#fff" stroke="none" />
      <circle cx={rx} cy={eyeY + py - 4} r={3} fill="#fff" stroke="none" />
    </>);
  };

  const mouth = () => {
    const my = 262;
    if (expr === 'choque') {
      const h = 34 + talk * 6;
      return (<g>
        <ellipse cx={200} cy={my + 6} rx={28} ry={h} fill="#5B1A1A" />
        <ellipse cx={200} cy={my + 6 + h * 0.55} rx={17} ry={h * 0.32} fill="#E8636B" stroke="none" />
      </g>);
    }
    if (expr === 'triste') return <path d={`M168 ${my + 14} Q200 ${my - 10} 232 ${my + 14}`} fill="none" />;
    if (expr === 'preocupado') {
      const o = talk * 16;
      return o > 3
        ? <ellipse cx={200} cy={my + 4} rx={22} ry={6 + o * 0.7} fill="#5B1A1A" />
        : <path d={`M170 ${my + 6} q10 -8 20 0 t20 0 t20 0`} fill="none" />;
    }
    // neutro / feliz / apontando / acenando
    const open = expr === 'feliz' || expr === 'acenando' ? 14 + talk * 14 : talk * 22;
    return (<path d={`M162 ${my - 4} Q200 ${my + 22 + open} 238 ${my - 4} Q200 ${my + 6} 162 ${my - 4} Z`}
      fill="#5B1A1A" />);
  };

  // braços: [ombro -> mão]
  const arm = (side: 'l' | 'r') => {
    const sx = side === 'l' ? 120 : 280;
    const sy = 395;
    const dir = side === 'l' ? -1 : 1;
    let hx = sx + dir * 30, hy = 560, ex = sx + dir * 42, ey = 480; // padrão: braço caído
    if (expr === 'choque') { hx = side === 'l' ? 112 : 288; hy = 268; ex = sx + dir * 70; ey = 360; }
    if (expr === 'preocupado' && side === 'r') { hx = 250; hy = 290; ex = 330; ey = 380; }
    if (expr === 'triste') { hx = sx + dir * 10; hy = 565; ex = sx + dir * 24; ey = 480; }
    if (expr === 'neutro' && side === 'l') { hx = 60; hy = 360; ex = 50; ey = 440; }
    if (expr === 'feliz' && side === 'l') { hx = 52; hy = 330; ex = 40; ey = 420; }
    if (expr === 'apontando' && side === 'l') { hx = 30; hy = 560; ex = 50; ey = 470; }
    if (expr === 'acenando' && side === 'r') {
      const a = Math.sin(wave) * 0.35;
      hx = 360 + Math.sin(a) * 60; hy = 210 - Math.cos(a) * 10; ex = 370; ey = 330;
    }
    const pointing = expr === 'apontando' && side === 'l';
    return (
      <g key={side}>
        <path d={`M${sx} ${sy} Q${ex} ${ey} ${hx} ${hy}`} stroke={INK} strokeWidth={46} fill="none" strokeLinecap="round" />
        <path d={`M${sx} ${sy} Q${ex} ${ey} ${hx} ${hy}`} stroke={SHIRT} strokeWidth={30} fill="none" strokeLinecap="round" />
        <circle cx={hx} cy={hy} r={26} fill={SKIN} />
        {pointing && (
          <path d={`M${hx - 8} ${hy + 18} L${hx - 18} ${hy + 70} Q${hx - 18} ${hy + 82} ${hx - 6} ${hy + 76} L${hx + 10} ${hy + 22}`}
            fill={SKIN} />
        )}
        {expr === 'acenando' && side === 'r' && (
          <g fill={SKIN}>
            {[-24, -8, 8, 24].map((dx) => (
              <rect key={dx} x={hx + dx - 7} y={hy - 52} width={14} height={36} rx={7} />
            ))}
          </g>
        )}
      </g>
    );
  };

  const armsBehind = expr === 'choque' || (expr === 'preocupado');
  return (
    <svg viewBox="0 0 400 600" width="100%" height="100%" style={{overflow: 'visible'}}>
      <g stroke={INK} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
        {/* corpo */}
        <path d="M70 760 L92 420 Q100 372 160 360 L240 360 Q300 372 308 420 L330 760 Z" fill={SHIRT} />
        <path d="M104 760 L118 470" stroke={SHIRT_SH} strokeWidth={10} fill="none" />
        <path d="M296 760 L282 470" stroke={SHIRT_SH} strokeWidth={10} fill="none" />
        <path d="M168 360 L200 404 L232 360" fill="#fff" />
        {!armsBehind && arm('l')}
        {!armsBehind && arm('r')}
        {/* pescoço + cabeça */}
        <rect x={176} y={312} width={48} height={56} fill={SKIN_SH} />
        <ellipse cx={86} cy={206} rx={22} ry={30} fill={SKIN} />
        <ellipse cx={314} cy={206} rx={22} ry={30} fill={SKIN} />
        <ellipse cx={200} cy={200} rx={122} ry={134} fill={SKIN} />
        {/* cabelo */}
        <path d="M86 168 Q80 70 190 62 Q300 56 318 160 Q300 112 250 108 Q262 92 240 86 Q226 112 170 108 Q120 108 86 168 Z" fill={HAIR} />
        {/* bochechas */}
        <ellipse cx={120} cy={244} rx={20} ry={11} fill="#F29C8A" stroke="none" opacity={0.7} />
        <ellipse cx={280} cy={244} rx={20} ry={11} fill="#F29C8A" stroke="none" opacity={0.7} />
        <g fill="none" strokeWidth={9}>{brows()}</g>
        <g strokeWidth={6}>{eyes()}</g>
        <path d="M200 206 Q186 236 202 238" fill="none" strokeWidth={6} />
        <g strokeWidth={6}>{mouth()}</g>
        {expr === 'preocupado' && <path d="M300 120 q8 16 0 24 q-8 -8 0 -24z" fill="#8FD3FF" strokeWidth={4} />}
        {armsBehind && arm('l')}
        {armsBehind && arm('r')}
      </g>
    </svg>
  );
};

export const Bento: React.FC<Props & {style?: React.CSSProperties}> = (p) => {
  const png = pickPng(p.expr);
  if (png) {
    return <Img src={staticFile(png)} style={{width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom', ...p.style}} />;
  }
  return <div style={{width: '100%', height: '100%', ...p.style}}><Svg {...p} /></div>;
};
