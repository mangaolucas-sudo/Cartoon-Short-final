import React from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile} from 'remotion';
import {Backdrop} from './Scenery';
import {Person, PAULO, BENTO, POSES} from './Person';
import * as R from './props3';

/* Capas do EP "Preço errado" (1080x1920). Tudo importante fica no miolo 3:4 (y 240–1680),
   que é o recorte da grade do perfil do TikTok. */
const txt = (s: number, c = '#fff'): React.CSSProperties =>
  ({font: `900 ${s}px/0.95 Inter`, color: c, WebkitTextStroke: `${s / 5.5}px #1A0E06`, paintOrder: 'stroke fill', textAlign: 'center'});
const At: React.FC<{x: number; y: number; s?: number; r?: number; children: React.ReactNode}> = ({x, y, s = 1, r = 0, children}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(${r}deg) scale(${s})`,
    filter: 'drop-shadow(0 14px 0 rgba(40,14,0,0.35))'}}>{children}</div>
);

export const Capa: React.FC<{v: 'A' | 'B'}> = ({v}) => {
  const [h] = React.useState(() => delayRender('fonte'));
  React.useEffect(() => {
    const ff = new FontFace('Inter', `url(${staticFile('fonts/Inter-Black.otf')})`, {weight: '900'});
    ff.load().then((x) => { (document as any).fonts.add(x); continueRender(h); });
  }, [h]);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#E8E0CC'}}>
      {v === 'A'
        ? <AbsoluteFill style={{filter: 'blur(4px) brightness(1.05)'}}><Backdrop kind="mercado" v={0} t={0} /></AbsoluteFill>
        : <AbsoluteFill><Backdrop kind="raios" v={0} t={0} /></AbsoluteFill>}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 55%, rgba(25,8,0,0.45) 100%)'}} />
      {/* selo da série */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 270, display: 'flex', justifyContent: 'center'}}>
        <div style={{background: '#1A0E06', color: '#FFE11A', font: '900 40px Inter', padding: '10px 26px', borderRadius: 16, letterSpacing: 2}}>
          O BENTO RESOLVE</div>
      </div>
      {v === 'A' ? <>
        <div style={{position: 'absolute', left: 30, right: 30, top: 350, ...txt(150)}}>PAGA OU<br /><span style={{color: '#FFE11A'}}>DEIXA?</span></div>
        <At x={300} y={800} r={-5} s={0.8}><R.ShelfTag w={520} price="R$ 19,90" /></At>
        <At x={490} y={700}><R.Check s={100} /></At>
        <At x={300} y={1080} r={4} s={0.8}><R.Register w={540} price="R$ 32,90" red glow /></At>
        <At x={500} y={970}><R.Check s={100} ok={false} /></At>
        <At x={300} y={1310} s={0.9}><div style={{...txt(64, '#fff'), background: '#E0443A', border: '8px solid #1A0E06', borderRadius: 18,
          padding: '6px 22px', WebkitTextStroke: '0', whiteSpace: 'nowrap'}}>+R$ 13 NO CAIXA</div></At>
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <Person P={PAULO} x={790} y={1860} s={1.05} t={0.3} expr="shock" pose={POSES.handsHead} />
        </svg>
      </> : <>
        <div style={{position: 'absolute', left: 30, right: 30, top: 350, ...txt(140)}}>R$ 13<br /><span style={{color: '#FFE11A'}}>A MAIS?</span></div>
        <At x={290} y={900} r={-6} s={0.8}><R.ShelfTag w={520} price="R$ 19,90" /></At>
        <At x={290} y={1130} r={4} s={0.72}><R.Register w={540} price="R$ 32,90" red /></At>
        <At x={290} y={1330} s={0.9}><div style={{...txt(64, '#fff'), background: '#2c9877', border: '8px solid #1A0E06', borderRadius: 18, padding: '6px 22px',
          WebkitTextStroke: '0', whiteSpace: 'nowrap'}}>PAGA O MENOR ✓</div></At>
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <Person P={BENTO} x={760} y={1900} s={1.15} t={0.3} expr="smug" pose={{L: [8, 0], R: [150, 15]}} finger="up" />
        </svg>
      </>}
    </AbsoluteFill>
  );
};
