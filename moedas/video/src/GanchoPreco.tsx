import React from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame, interpolate} from 'remotion';
import {Backdrop} from './Scenery';
import {Person, PAULO, CAIXA} from './Person';
import * as P from './props';

/* Prévia do gancho do EP "Preço errado" (quadro 0 → 0,5 s) */
export const GanchoPreco: React.FC = () => {
  const f = useCurrentFrame();
  const [h] = React.useState(() => delayRender('fonte'));
  React.useEffect(() => {
    const ff = new FontFace('Inter', `url(${staticFile('fonts/Inter-Black.otf')})`, {weight: '900'});
    ff.load().then((x) => { (document as any).fonts.add(x); continueRender(h); });
  }, [h]);
  const jump = f >= 4;
  const blink = Math.floor(f / 4) % 2 === 0;
  const k = interpolate(f, [4, 10], [1.35, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const txt = (s: number, c = '#fff') => ({font: `900 ${s}px/1 Inter`, color: c, WebkitTextStroke: `${s / 6}px #1A0E06`, paintOrder: 'stroke fill'} as React.CSSProperties);
  return (
    <AbsoluteFill style={{background: '#E8E0CC', overflow: 'hidden'}}>
      <AbsoluteFill style={{filter: 'blur(3px) brightness(1.05)'}}><Backdrop kind="mercado" v={0} t={0} /></AbsoluteFill>
      {/* metade de cima: etiqueta da prateleira */}
      <div style={{position: 'absolute', left: 90, top: 560, width: 560, height: 260, background: '#FFE07A', border: '10px solid #1E120B',
        borderRadius: 26, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-3deg)',
        boxShadow: '0 16px 0 rgba(40,14,0,0.35)'}}>
        <div style={{font: '900 40px Inter', color: '#7A4A2A'}}>PRATELEIRA</div>
        <div style={{font: '900 112px/1 Inter', color: '#1E120B', whiteSpace: 'nowrap'}}>R$ 19,90</div>
      </div>
      <div style={{position: 'absolute', left: 590, top: 520, width: 120, height: 120, borderRadius: 65, background: '#2c9877',
        border: '10px solid #1E120B', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '900 90px Inter', color: '#fff'}}>✓</div>
      {/* metade de baixo: visor do caixa */}
      <div style={{position: 'absolute', left: 90, top: 900, width: 580, height: 270, background: '#13233A', border: '12px solid #1E120B',
        borderRadius: 26, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `scale(${jump ? k : 1})`,
        boxShadow: jump && blink ? '0 0 70px rgba(255,60,40,0.9)' : '0 16px 0 rgba(40,14,0,0.35)'}}>
        <div style={{font: '900 40px Inter', color: '#9CC3FF'}}>CAIXA · TOTAL</div>
        <div style={{font: '900 112px/1 Inter', color: jump ? '#FF4A3D' : '#7CF29A', whiteSpace: 'nowrap'}}>{jump ? 'R$ 32,90' : 'R$ 19,90'}</div>
      </div>
      {jump && <div style={{position: 'absolute', left: 560, top: 840, transform: 'rotate(10deg)', ...txt(70, '#FFE11A')}}>BIP!</div>}
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <Person P={CAIXA} x={1010} y={1500} s={0.55} t={0} expr="smug" pose={{L: [60, 110], R: [60, 110]}} />
        <Person P={PAULO} x={830} y={1700} s={0.92} t={0} expr="shock" pose={{L: [165, 20], R: [165, 20]}} />
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', whiteSpace: 'nowrap', ...txt(108)}}>
        PAGA OU <span style={{color: '#FFE11A'}}>DEIXA?</span>
      </div>
      <div style={{position: 'absolute', left: 30, right: 30, top: 1350, transform: 'translateY(-50%)', textAlign: 'center',
        font: '900 94px Inter', WebkitTextStroke: '20px #000', paintOrder: 'stroke fill', color: '#fff'}}>
        <span style={{color: '#FFE11A'}}>NA</span> PRATELEIRA
      </div>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 60%, rgba(25,8,0,0.4) 100%)'}} />
    </AbsoluteFill>
  );
};
