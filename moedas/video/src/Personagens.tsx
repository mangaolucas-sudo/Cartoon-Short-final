import React from 'react';
import {AbsoluteFill, continueRender, delayRender, staticFile} from 'remotion';
import {Person, BENTO, PAULO, CAIXA, GERENTE, REPOSITOR, POSES, Face} from './Person';

/* Folha de personagens: padrão visual do canal (Dr. Bento + elenco de apoio) */
export const Personagens: React.FC = () => {
  const [h] = React.useState(() => delayRender('fonte'));
  React.useEffect(() => {
    const ff = new FontFace('Inter', `url(${staticFile('fonts/Inter-Black.otf')})`, {weight: '900'});
    ff.load().then((x) => { (document as any).fonts.add(x); continueRender(h); });
  }, [h]);
  const faces: [Face, string, string][] = [['neutral', 'down', 'NEUTRO'], ['smile', 'give', 'EXPLICANDO'], ['happy', 'hips', 'FELIZ'],
    ['shock', 'handsHead', 'CHOQUE'], ['worried', 'shrug', 'PREOCUPADO'], ['sad', 'down', 'TRISTE'], ['angry', 'point', 'BRAVO'],
    ['smug', 'hips', 'CONFIANTE']];
  const cast: [any, string, string][] = [[PAULO, 'PAULO', 'protagonista do EP'], [CAIXA, 'OPERADORA DE CAIXA', 'apoio'],
    [GERENTE, 'GERENTE', 'apoio'], [REPOSITOR, 'REPOSITOR', 'apoio']];
  const lab = (x: number, y: number, t: string, s = 34, c = '#fff') =>
    <text x={x} y={y} fontSize={s} fontFamily="Inter" fontWeight={900} fill={c} textAnchor="middle">{t}</text>;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 30%, #f58d33, #ea6f1c 55%, #a34a12)'}}>
      <svg width={2400} height={1800}>
        {lab(1200, 90, 'BENTO CONTAÊ · PADRÃO DE PERSONAGENS', 64)}
        {lab(1200, 140, 'DR. BENTO — advogado de bigode, voz do canal (rosto conforme a arte de referência)', 30, '#ffe2b0')}
        {faces.map(([f, p, n], i) => (
          <g key={n}>
            <Person P={BENTO} x={150 + i * 300} y={1000} s={0.82} t={0.4} expr={f} pose={POSES[p]} finger={p === 'point' ? 'up' : null} />
            {lab(150 + i * 300, 1060, n, 30)}
          </g>
        ))}
        {cast.map(([P, n, d], i) => (
          <g key={n}>
            <Person P={P} x={300 + i * 600} y={1680} s={0.62} t={0.4} expr="smile" pose={POSES.down} />
            {lab(300 + i * 600, 1730, n, 30)}
            {lab(300 + i * 600, 1768, d, 24, '#ffe2b0')}
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};
