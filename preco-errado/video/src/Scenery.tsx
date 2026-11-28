import React from 'react';

/* Cenários de fundo ("cinema"): cada um é um SVG 1080x1920 com margem de 200px para zoom/tremida.
   Recebem t (segundos) para animação/parallax e v (variante = ângulo de câmera / momento). */

const INK = '#1E120B';
const FLOOR = 1320;
const r = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const W = (n: number, fn: (i: number) => React.ReactNode) => Array.from({length: n}, (_, i) => fn(i));
const F = 'Inter Black, Inter, sans-serif';
const Tx: React.FC<{x: number; y: number; s: number; fill: string; children: React.ReactNode; anchor?: string; op?: number; rot?: number}> =
  ({x, y, s, fill, children, anchor = 'middle', op = 1, rot = 0}) => (
    <text x={x} y={y} fontSize={s} fontFamily={F} fontWeight={900} fill={fill} textAnchor={anchor as any} opacity={op}
      transform={rot ? `rotate(${rot} ${x} ${y})` : undefined}>{children}</text>
  );

type BG = React.FC<{t: number; v: number}>;

/* luz volumétrica */
const Cone: React.FC<{x: number; y: number; w: number; h: number; c: string; o?: number; id: string; rot?: number}> =
  ({x, y, w, h, c, o = 0.35, id, rot = 0}) => (
    <g transform={`rotate(${rot} ${x} ${y})`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c} stopOpacity={o} />
          <stop offset="1" stopColor={c} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`M${x - 20} ${y} L${x + 20} ${y} L${x + w / 2} ${y + h} L${x - w / 2} ${y + h} Z`} fill={`url(#${id})`} />
    </g>
  );

const Sky: React.FC<{id: string; stops: [number, string][]}> = ({id, stops}) => (
  <>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        {stops.map(([o, c], i) => <stop key={i} offset={o} stopColor={c} />)}
      </linearGradient>
    </defs>
    <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${id})`} />
  </>
);

const Glow: React.FC<{x: number; y: number; r: number; c: string; o?: number; id: string}> = ({x, y, r: rr, c, o = 0.6, id}) => (
  <>
    <defs>
      <radialGradient id={id}>
        <stop offset="0" stopColor={c} stopOpacity={o} />
        <stop offset="1" stopColor={c} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={x} cy={y} r={rr} fill={`url(#${id})`} />
  </>
);

/* ---------------- RUA À NOITE (cena 1 / 10) ---------------- */
const Rua: BG = ({t}) => (
  <>
    <Sky id="rua-sky" stops={[[0, '#170F26'], [0.35, '#3A1E3A'], [0.62, '#8A3B2C'], [0.72, '#D0662A']]} />
    <Glow x={540} y={1150} r={700} c="#FF9A3C" o={0.35} id="rua-g" />
    {W(40, (i) => <circle key={i} cx={r(i) * 1400 - 160} cy={r(i + 50) * 700 - 100} r={1.5 + r(i + 9) * 2.5}
      fill="#FFF3D6" opacity={0.3 + 0.5 * Math.abs(Math.sin(t * 2 + i))} />)}
    {/* prédios distantes */}
    <g transform={`translate(${-t * 4} 0)`}>
      {W(12, (i) => {
        const w = 120 + r(i) * 120, h = 300 + r(i + 3) * 420, x = -200 + i * 130;
        return (
          <g key={i}>
            <rect x={x} y={1150 - h} width={w} height={h + 200} fill="#2A1830" />
            {W(Math.floor(h / 60), (j) => W(3, (k) => r(i * 31 + j * 7 + k) > 0.55 &&
              <rect key={`${j}${k}`} x={x + 14 + k * (w - 28) / 3} y={1150 - h + 24 + j * 60} width={18} height={26}
                fill="#FFB04A" opacity={0.55} />))}
          </g>
        );
      })}
    </g>
    {/* fachadas próximas */}
    <g transform={`translate(${-t * 10} 0)`}>
      {[[-200, 430, '#5A2E22', 'PADARIA'], [230, 400, '#4A2620', 'BANCO'], [630, 470, '#5E3424', 'ARMAZÉM'], [1100, 400, '#4A2620', '']].map(([x, w, c, s], i) => (
        <g key={i} stroke={INK} strokeWidth={8}>
          <rect x={x as number} y={640} width={w as number} height={700} fill={c as string} />
          <rect x={(x as number) + 40} y={960} width={(w as number) - 80} height={260} fill="#FFC56A" />
          <rect x={(x as number) + 40} y={960} width={(w as number) - 80} height={260} fill="url(#rua-g)" stroke="none" />
          {W(6, (k) => <path key={k} d={`M${(x as number) + 20 + k * ((w as number) - 40) / 6} 880 h${((w as number) - 40) / 6} l-10 70 h-${((w as number) - 40) / 6 - 20} Z`}
            fill={k % 2 ? '#E8A04A' : '#F4E3C6'} strokeWidth={5} />)}
          {s && <><rect x={(x as number) + 40} y={740} width={(w as number) - 80} height={90} rx={12} fill="#2A140C" />
            <Tx x={(x as number) + (w as number) / 2} y={803} s={54} fill="#FFCF7A">{s}</Tx></>}
          {W(2, (k) => <rect key={k} x={(x as number) + 50 + k * ((w as number) / 2 - 20)} y={670} width={(w as number) / 2 - 90} height={50} fill="#7A4434" strokeWidth={5} />)}
        </g>
      ))}
    </g>
    {/* calçada em perspectiva */}
    <rect x={-200} y={FLOOR - 20} width={1480} height={900} fill="#6E4A3A" />
    {W(14, (i) => <path key={i} d={`M${540 + (i - 7) * 60} ${FLOOR - 20} L${540 + (i - 7) * 260} 2120`} stroke="#5A3A2E" strokeWidth={5} />)}
    {W(8, (i) => <path key={i} d={`M-200 ${FLOOR + i * i * 14} H1280`} stroke="#5A3A2E" strokeWidth={4} />)}
    <rect x={-200} y={FLOOR - 40} width={1480} height={26} fill="#8E6A55" stroke={INK} strokeWidth={6} />
    {/* poste */}
    <g stroke={INK} strokeWidth={8}>
      <rect x={930} y={420} width={28} height={920} fill="#2E2A30" />
      <path d="M944 430 Q944 360 860 360 H820" fill="none" strokeWidth={22} stroke="#2E2A30" />
      <path d="M780 360 h90 l-20 40 h-50 Z" fill="#2E2A30" />
    </g>
    <Glow x={825} y={410} r={140} c="#FFE2A0" o={0.9} id="rua-l" />
    <Cone x={825} y={400} w={760} h={1000} c="#FFD27A" o={0.28} id="rua-c" />
    <ellipse cx={825} cy={FLOOR + 120} rx={380} ry={70} fill="#FFC56A" opacity={0.18} />
  </>
);

/* ---------------- COSMOS DE ZEROS ---------------- */
const Cosmos: BG = ({t, v}) => (
  <>
    <Sky id="cos-sky" stops={[[0, '#0A0614'], [0.5, '#1C0C26'], [1, '#2A0E0A']]} />
    <Glow x={300} y={500} r={600} c={v ? '#FF6A1A' : '#B04AFF'} o={0.35} id="cos-n1" />
    <Glow x={850} y={1200} r={700} c={v ? '#FFB040' : '#FF7A2A'} o={0.3} id="cos-n2" />
    {W(110, (i) => <circle key={i} cx={r(i) * 1480 - 200} cy={r(i + 200) * 2320 - 200} r={1 + r(i + 7) * 3}
      fill="#fff" opacity={0.25 + 0.6 * Math.abs(Math.sin(t * 3 + i * 1.3))} />)}
    {W(22, (i) => {
      const z = 0.4 + r(i + 40) * 1.2;
      const y = ((r(i + 60) * 2400 - t * 60 * z * (v ? 3 : 1)) % 2400 + 2400) % 2400 - 250;
      return <Tx key={i} x={r(i + 80) * 1300 - 100} y={y} s={60 + z * 120} fill="#FFB66A" op={0.12 + z * 0.15}
        rot={Math.sin(t + i) * 20}>0</Tx>;
    })}
    <ellipse cx={540} cy={FLOOR + 160} rx={700} ry={120} fill="#FF8A2A" opacity={0.18} />
    <ellipse cx={540} cy={FLOOR + 160} rx={460} ry={60} fill="#FFD08A" opacity={0.15} />
  </>
);

/* ---------------- GRÁFICA DE DINHEIRO ---------------- */
const Grafica: BG = ({t, v}) => (
  <>
    <Sky id="gr-sky" stops={[[0, '#2A140C'], [0.6, '#4A2414'], [1, '#2A140C']]} />
    {W(18, (j) => W(12, (i) => <rect key={`${i}-${j}`} x={-200 + i * 130 + (j % 2) * 65} y={-200 + j * 70} width={124} height={64}
      fill={r(i * 13 + j) > 0.5 ? '#5E2E1C' : '#55291A'} />))}
    {W(3, (i) => <g key={i}>
      <rect x={140 + i * 360} y={-200} width={6} height={430} fill="#1A0C06" />
      <path d={`M${83 + i * 360} 230 h120 l30 50 h-180 Z`} fill="#2E2420" stroke={INK} strokeWidth={6} />
      <Cone x={143 + i * 360} y={280} w={520} h={1100} c="#FFC870" o={0.22} id={`gr-c${i}`} />
    </g>)}
    {/* rolos da prensa */}
    {[[300, 760, 190], [760, 700, 150]].map(([x, y, rr], i) => (
      <g key={i} transform={`translate(${x} ${y}) rotate(${t * (i ? -120 : 90)})`} stroke={INK} strokeWidth={10}>
        <circle r={rr} fill="#8A5A3A" />
        <circle r={rr * 0.75} fill="#A87048" />
        {W(6, (k) => <rect key={k} x={-10} y={-rr * 0.75} width={20} height={rr * 0.75} fill="#6A3E24" transform={`rotate(${k * 60})`} strokeWidth={5} />)}
        <circle r={30} fill="#3A2216" />
      </g>
    ))}
    {/* esteira com folhas de notas */}
    <rect x={-200} y={1060} width={1480} height={90} fill="#3A2A24" stroke={INK} strokeWidth={8} />
    {W(16, (i) => <circle key={i} cx={((i * 100 + t * 200) % 1600) - 200} cy={1105} r={30} fill="#5A4A42" stroke={INK} strokeWidth={5} />)}
    {W(6, (i) => {
      const x = ((i * 290 + t * 200 * (v ? 1.6 : 1)) % 1740) - 300;
      return <g key={i} transform={`translate(${x} 1000)`} stroke={INK} strokeWidth={6}>
        <rect width={240} height={60} rx={6} fill={['#E39A52', '#9DBE7E', '#D97B6C', '#A98CC4'][i % 4]} />
        <rect x={100} width={40} height={60} fill="#F2E3B5" />
      </g>;
    })}
    <rect x={-200} y={FLOOR - 20} width={1480} height={900} fill="#3A2016" />
    {W(10, (i) => <path key={i} d={`M${-200 + i * 160} ${FLOOR - 20} l120 900`} stroke="#E8A04A" strokeWidth={30} opacity={0.12} />)}
    <rect x={-200} y={FLOOR - 30} width={1480} height={14} fill="#E8A04A" opacity={0.5} />
    {/* faíscas de vapor */}
    {W(10, (i) => { const k = ((t * 0.6 + r(i)) % 1); return <circle key={i} cx={300 + r(i + 4) * 500} cy={560 - k * 500} r={30 + k * 80} fill="#fff" opacity={0.08 * (1 - k)} />; })}
  </>
);

/* ---------------- MUSEU DO DINHEIRO ---------------- */
const Museu: BG = ({t}) => {
  const frames: [number, number, string, string][] = [[-120, 520, '#D8B47A', 'RÉIS'], [250, 440, '#E39A52', 'CRUZEIRO'],
    [620, 520, '#9DBE7E', 'CRUZADO'], [980, 440, '#A98CC4', 'CR. REAL']];
  return (
    <>
      <Sky id="mu-sky" stops={[[0, '#3A120E'], [0.6, '#5A1E16'], [1, '#3A120E']]} />
      {W(14, (i) => <rect key={i} x={-200 + i * 110} y={-200} width={4} height={1520} fill="#4A1610" />)}
      <rect x={-200} y={1150} width={1480} height={30} fill="#7A3A22" stroke={INK} strokeWidth={6} />
      {frames.map(([x, y, c, n], i) => (
        <g key={i} transform={`translate(${x - t * 6} ${y})`}>
          <Cone x={150} y={-560} w={520} h={900} c="#FFE2A8" o={0.25} id={`mu-c${i}`} />
          <rect x={-10} y={-10} width={320} height={200} fill="#C9962E" stroke={INK} strokeWidth={8} />
          <rect x={14} y={14} width={272} height={152} fill={c} stroke={INK} strokeWidth={5} />
          <ellipse cx={80} cy={90} rx={34} ry={40} fill="rgba(255,255,255,0.35)" />
          <Tx x={190} y={104} s={30} fill={INK}>{n}</Tx>
          <rect x={90} y={210} width={120} height={36} fill="#2A140C" />
          <Tx x={150} y={236} s={20} fill="#E8C690">{['1500', '1942', '1986', '1993'][i]}</Tx>
        </g>
      ))}
      <rect x={-200} y={FLOOR - 20} width={1480} height={900} fill="#6A3A22" />
      {W(12, (i) => <path key={i} d={`M${-200 + i * 130} ${FLOOR - 20} L${-500 + i * 200} 2120`} stroke="#5A2E1A" strokeWidth={6} />)}
      <rect x={-200} y={FLOOR - 20} width={1480} height={900} fill="url(#mu-sky)" opacity={0.2} />
      {/* cordão de isolamento */}
      {[60, 520, 980].map((x) => <g key={x} stroke={INK} strokeWidth={6}>
        <rect x={x - 10} y={1140} width={20} height={200} fill="#C9962E" /><circle cx={x} cy={1136} r={20} fill="#E8B94A" />
      </g>)}
      <path d="M60 1160 Q290 1250 520 1160 Q750 1250 980 1160" fill="none" stroke="#9A1E1E" strokeWidth={18} />
    </>
  );
};

/* ---------------- ANOS 40 (sépia) ---------------- */
const Anos40: BG = ({t, v}) => (
  <>
    <Sky id="a4-sky" stops={[[0, '#E8D3A8'], [0.7, '#C9A26E'], [1, '#8A6A44']]} />
    <Glow x={260} y={420} r={300} c="#FFF6DC" o={0.6} id="a4-sun" />
    {/* prédios art déco */}
    {[[-200, 380, 760], [170, 300, 620], [470, 340, 820], [810, 300, 680], [1100, 300, 600]].map(([x, w, h], i) => (
      <g key={i} stroke="#4A3420" strokeWidth={6}>
        <rect x={x} y={1220 - h} width={w} height={h} fill={i % 2 ? '#B08A5A' : '#A07A4C'} />
        <path d={`M${x + w * 0.3} ${1220 - h} v-60 h${w * 0.4} v60`} fill="#9A744A" />
        {W(Math.floor(h / 110), (j) => W(3, (k) => <rect key={`${j}${k}`} x={x + 30 + k * (w - 60) / 3} y={1220 - h + 40 + j * 110}
          width={(w - 120) / 3} height={70} fill="#6A4E30" strokeWidth={3} />))}
      </g>
    ))}
    <rect x={-200} y={560} width={1480} height={4} fill="#4A3420" />
    {/* bonde */}
    <g transform={`translate(${(v ? 520 : 1250) - t * 70} 960)`} stroke="#3A2818" strokeWidth={8}>
      <path d="M200 -300 L260 -380 M200 -300 L140 -380" fill="none" />
      <rect x={0} y={-300} width={520} height={260} rx={30} fill="#9C6A3A" />
      <rect x={0} y={-300} width={520} height={50} rx={24} fill="#7A4A22" />
      {W(5, (k) => <rect key={k} x={24 + k * 98} y={-230} width={80} height={90} fill="#EAD7B0" />)}
      <Tx x={260} y={-262} s={34} fill="#F2E0BC">BONDE · 1942</Tx>
      <circle cx={110} cy={-30} r={34} fill="#3A2818" /><circle cx={410} cy={-30} r={34} fill="#3A2818" />
    </g>
    <rect x={-200} y={FLOOR - 20} width={1480} height={900} fill="#8A6A44" />
    {[0, 1].map((k) => <path key={k} d={`M-200 ${FLOOR + 60 + k * 50} H1280`} stroke="#5A4228" strokeWidth={10} />)}
    {W(12, (i) => <rect key={i} x={-200 + i * 140} y={FLOOR + 50} width={60} height={70} fill="#6A5034" opacity={0.6} />)}
    {/* poste antigo */}
    <g stroke="#3A2818" strokeWidth={6}><rect x={900} y={700} width={22} height={640} fill="#3A2818" />
      <path d="M880 700 h62 l-12 -70 h-38 Z" fill="#EAD7B0" /></g>
    {/* arranhões de filme */}
    {W(4, (i) => r(i + Math.floor(t * 12)) > 0.5 && <rect key={i} x={r(i * 3 + Math.floor(t * 12)) * 1080} y={-200} width={2} height={2320}
      fill="#3A2818" opacity={0.35} />)}
  </>
);

/* ---------------- ANOS 60 (pôr do sol, modernismo) ---------------- */
const Anos60: BG = ({t, v}) => (
  <>
    <Sky id="a6-sky" stops={[[0, '#2A5A7A'], [0.45, '#E08A4A'], [0.7, '#FFC46A']]} />
    <circle cx={540} cy={1000} r={260} fill="#FFE29A" opacity={0.9} />
    {/* torres gêmeas + cúpulas (silhueta genérica modernista) */}
    <g fill="#5A2E22" stroke={INK} strokeWidth={6}>
      <rect x={470} y={560} width={60} height={600} /><rect x={550} y={560} width={60} height={600} />
      <rect x={60} y={1080} width={960} height={80} />
      <path d="M160 1080 Q260 980 360 1080 Z" /><path d="M700 1080 Q820 1170 940 1080 Z" fill="#6A3A26" />
    </g>
    {W(9, (i) => <path key={i} d={`M${i * 140 - 200} 1160 q70 -40 140 0`} fill="none" stroke="#7A4A2A" strokeWidth={5} />)}
    {/* carro antigo */}
    <g transform={`translate(${(v ? 900 : -400) + t * (v ? -60 : 90)} 1250)`} stroke={INK} strokeWidth={8}>
      <path d="M0 0 Q20 -110 150 -120 Q270 -120 300 0 Z" fill="#4FA0B5" />
      <path d="M60 -50 Q80 -100 150 -102 Q220 -100 240 -50 Z" fill="#CFEFF5" />
      <circle cx={70} cy={10} r={36} fill="#2A2420" /><circle cx={240} cy={10} r={36} fill="#2A2420" />
    </g>
    <rect x={-200} y={FLOOR - 20} width={1480} height={900} fill="#9A5A32" />
    <rect x={-200} y={FLOOR - 20} width={1480} height={16} fill="#C97A42" />
    {W(10, (i) => <rect key={i} x={-200 + i * 160 + ((t * 30) % 160)} y={FLOOR + 90} width={80} height={12} fill="#FFE29A" opacity={0.4} />)}
  </>
);

/* ---------------- ANOS 70 (sala retrô com TV) ---------------- */
const Anos70: BG = ({t}) => (
  <>
    <rect x={-200} y={-200} width={1480} height={2320} fill="#C9702E" />
    {W(10, (j) => W(9, (i) => <g key={`${i}${j}`}>
      <circle cx={-200 + i * 180 + (j % 2) * 90} cy={-200 + j * 160} r={64} fill="#A8521E" />
      <circle cx={-200 + i * 180 + (j % 2) * 90} cy={-200 + j * 160} r={36} fill="#E39A52" />
    </g>))}
    <rect x={-200} y={900} width={1480} height={500} fill="#6A3A1E" />
    {W(16, (i) => <rect key={i} x={-200 + i * 95} y={900} width={6} height={500} fill="#4A2412" />)}
    {/* TV de madeira */}
    <g transform="translate(120 560)" stroke={INK} strokeWidth={9}>
      <rect width={420} height={330} rx={30} fill="#7A4420" />
      <rect x={24} y={26} width={290} height={250} rx={40} fill="#2A3A3A" />
      <rect x={40} y={40} width={258} height={222} rx={30} fill="#6A8A6A" opacity={0.7 + 0.3 * Math.sin(t * 20)} />
      <Tx x={169} y={170} s={44} fill="#F2F0C0">CRUZEIRO</Tx>
      <circle cx={368} cy={90} r={22} fill="#D9C08A" /><circle cx={368} cy={160} r={22} fill="#D9C08A" />
      <path d="M150 0 L100 -110 M270 0 L320 -110" fill="none" />
      <path d="M60 330 l-20 60 M360 330 l20 60" />
    </g>
    {/* abajur */}
    <g stroke={INK} strokeWidth={8}><path d="M800 560 h200 l-50 -170 h-100 Z" fill="#F2B040" /><rect x={890} y={560} width={20} height={420} fill="#3A2216" /></g>
    <Glow x={900} y={520} r={320} c="#FFE0A0" o={0.5} id="a7-g" />
    <rect x={-200} y={FLOOR - 20} width={1480} height={900} fill="#8A4A22" />
    {W(30, (i) => <path key={i} d={`M${-200 + i * 50} ${FLOOR - 20} l-30 900`} stroke="#A0602E" strokeWidth={18} />)}
  </>
);

/* ---------------- PAREDE DE JORNAIS (anos 80/90) ---------------- */
const Jornal: BG = ({t, v}) => {
  const heads = v
    ? [['CORTE DE', '3 ZEROS'], ['NOVO', 'DINHEIRO'], ['INFLAÇÃO', '1.000%'], ['TROCA', 'DE MOEDA'], ['PLANO', 'NOVO'], ['PREÇOS', 'DISPARAM']]
    : [['NASCE O', 'CRUZADO'], ['CRUZADO', 'NOVO!'], ['VOLTA O', 'CRUZEIRO'], ['INFLAÇÃO', 'RECORDE'], ['MAIS UM', 'PLANO'], ['CRUZEIRO', 'REAL']];
  return (
    <>
      <Sky id="jo-sky" stops={[[0, '#4A2A1A'], [1, '#2A160C']]} />
      {heads.map(([a, b], i) => {
        const x = -150 + (i % 3) * 420 + r(i) * 40 - t * 8, y = 150 + Math.floor(i / 3) * 560 + r(i + 5) * 60;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${(r(i + 9) - 0.5) * 12})`} stroke={INK} strokeWidth={6}>
            <rect width={390} height={500} fill="#F2E8D2" />
            <rect x={20} y={20} width={350} height={46} fill="#2A2420" />
            <Tx x={195} y={56} s={30} fill="#F2E8D2">O DIÁRIO · {1986 + i}</Tx>
            <Tx x={195} y={140} s={62} fill="#1E120B">{a}</Tx>
            <Tx x={195} y={210} s={62} fill="#B3261E">{b}</Tx>
            <rect x={20} y={240} width={170} height={130} fill="#B8A88A" strokeWidth={4} />
            {W(7, (k) => <rect key={k} x={206} y={248 + k * 18} width={150} height={8} fill="#B8A88A" stroke="none" />)}
            {W(5, (k) => <rect key={k} x={20} y={392 + k * 18} width={340} height={8} fill="#B8A88A" stroke="none" />)}
          </g>
        );
      })}
      <Glow x={540} y={700} r={900} c="#FFB060" o={0.25} id="jo-g" />
      <rect x={-200} y={FLOOR - 20} width={1480} height={900} fill="#3A2216" />
      <rect x={-200} y={FLOOR - 20} width={1480} height={14} fill="#7A4A2A" />
    </>
  );
};

/* ---------------- ESCRITÓRIO (calendário, persiana) ---------------- */
const Escritorio: BG = ({t}) => (
  <>
    <Sky id="es-sky" stops={[[0, '#7A4A2A'], [1, '#4A2A16']]} />
    <rect x={500} y={180} width={560} height={720} fill="#FFD9A0" stroke={INK} strokeWidth={10} />
    {W(14, (i) => <rect key={i} x={500} y={180 + i * 52} width={560} height={30} fill="#C98A4A" stroke={INK} strokeWidth={3} />)}
    <path d="M500 180 L-200 1500 L-200 2000 L1060 900 Z" fill="#FFD9A0" opacity={0.08} />
    {W(12, (i) => <path key={i} d={`M500 ${196 + i * 52} L-200 ${1400 + i * 60}`} stroke="#FFE3B0" strokeWidth={14} opacity={0.08} />)}
    {/* relógio */}
    <g transform="translate(220 360)" stroke={INK} strokeWidth={8}>
      <circle r={110} fill="#FFF6E6" />
      <path d={`M0 0 L${Math.sin(t * 6) * 80} ${-Math.cos(t * 6) * 80}`} strokeWidth={8} />
      <path d={`M0 0 L${Math.sin(t / 2) * 50} ${-Math.cos(t / 2) * 50}`} strokeWidth={12} />
      <circle r={10} fill={INK} />
    </g>
    {/* arquivo */}
    <g stroke={INK} strokeWidth={8}>
      <rect x={-120} y={760} width={300} height={580} fill="#7A8088" />
      {W(4, (i) => <g key={i}><rect x={-100} y={780 + i * 140} width={260} height={120} fill="#8E949C" /><rect x={10} y={830 + i * 140} width={40} height={16} fill="#3A3A3A" /></g>)}
    </g>
    <rect x={-200} y={FLOOR - 20} width={1480} height={900} fill="#5A3420" />
    {W(10, (i) => <path key={i} d={`M-200 ${FLOOR + i * 70} H1280`} stroke="#4A2816" strokeWidth={4} />)}
  </>
);

/* ---------------- SUPERMERCADO ---------------- */
const Mercado: BG = ({t, v}) => {
  const fl = Math.sin(t * 37) > 0.97 ? 0.6 : 1;
  const cols = ['#E5322D', '#F2B040', '#4FA0B5', '#7CC36B', '#E36A8E', '#FFF4DC'];
  return (
    <>
      <Sky id="me-sky" stops={[[0, '#D9CDB0'], [1, '#B8A888']]} />
      {/* luzes de teto em perspectiva */}
      {W(6, (i) => { const k = 1 - i / 7; return <rect key={i} x={540 - 300 * k} y={-60 + i * 60} width={600 * k} height={24 * k}
        fill="#FFFDF0" opacity={fl} />; })}
      {/* corredor: prateleiras laterais */}
      {[-1, 1].map((sd) => W(6, (j) => {
        const y0 = 260 + j * 170;
        return <g key={`${sd}${j}`}>
          <path d={`M${540 + sd * 220} ${520 + j * 70} L${540 + sd * 900} ${y0} L${540 + sd * 900} ${y0 + 30} L${540 + sd * 220} ${530 + j * 70} Z`}
            fill="#8A6A4A" stroke={INK} strokeWidth={4} />
          {W(8, (k) => { const u = k / 8; const x = 540 + sd * (220 + u * 680); const y = 520 + j * 70 + (y0 - 520 - j * 70) * u;
            const h = 30 + u * 110; return <rect key={k} x={x - (sd > 0 ? 0 : 40 + u * 60)} y={y - h} width={40 + u * 60} height={h}
              fill={cols[(k + j * 3) % 6]} stroke={INK} strokeWidth={3} />; })}
        </g>;
      }))}
      {/* placas */}
      <g transform={`translate(540 ${300 + Math.sin(t * 2) * 8})`} stroke={INK} strokeWidth={8}>
        <path d="M0 -300 V-60" />
        <rect x={-220} y={-60} width={440} height={130} rx={14} fill="#E5322D" />
        <Tx x={0} y={30} s={80} fill="#FFF">{['OFERTA', 'MERCEARIA', 'LIMPEZA'][v] ?? 'OFERTA'}</Tx>
      </g>
      <rect x={-200} y={FLOOR - 20} width={1480} height={900} fill="#E8E0CC" />
      {W(10, (i) => <path key={i} d={`M${540 + (i - 5) * 80} ${FLOOR - 20} L${540 + (i - 5) * 400} 2120`} stroke="#C8BEA8" strokeWidth={5} />)}
      {W(6, (i) => <path key={i} d={`M-200 ${FLOOR + i * i * 20} H1280`} stroke="#C8BEA8" strokeWidth={4} />)}
    </>
  );
};

/* ---------------- RUA DE DIA (correria) ---------------- */
const RuaDia: BG = ({t, v}) => (
  <>
    <Sky id="rd-sky" stops={[[0, '#F2B068'], [0.6, '#FFD9A0']]} />
    {[[-200, 300, 900, '#B86A3A'], [120, 260, 700, '#9A5A32'], [400, 320, 980, '#C9804A'], [740, 280, 760, '#A8603A'], [1040, 260, 860, '#8E4E2A']].map(([x, w, h, c], i) => (
      <g key={i} stroke={INK} strokeWidth={6}>
        <rect x={x as number} y={1250 - (h as number)} width={w as number} height={h as number} fill={c as string} />
        {W(Math.floor((h as number) / 100), (j) => W(3, (k) => <rect key={`${j}${k}`} x={(x as number) + 24 + k * ((w as number) - 48) / 3}
          y={1250 - (h as number) + 30 + j * 100} width={((w as number) - 96) / 3} height={60} fill="#FFE8B8" strokeWidth={3} />))}
      </g>
    ))}
    {v === 1 && <g stroke={INK} strokeWidth={8}>
      <rect x={260} y={900} width={560} height={110} rx={14} fill="#2A140C" />
      <Tx x={540} y={980} s={70} fill="#FFCF7A">LOJA · LIQUIDA</Tx>
    </g>}
    <rect x={-200} y={FLOOR - 20} width={1480} height={900} fill="#9A7A62" />
    <rect x={-200} y={FLOOR - 30} width={1480} height={20} fill="#C9A88A" stroke={INK} strokeWidth={5} />
    {/* multidão correndo (silhuetas em parallax) */}
    {W(9, (i) => {
      const sp = 260 + r(i) * 240;
      const x = ((r(i + 3) * 1600 + t * sp * (i % 2 ? 1 : -1)) % 1600 + 1600) % 1600 - 260;
      const s = 0.8 + r(i + 8) * 0.5;
      const leg = Math.sin(t * 16 + i) * 26;
      return <g key={i} transform={`translate(${x} ${FLOOR + 40}) scale(${(i % 2 ? 1 : -1) * s} ${s})`} fill="#3A2216" opacity={0.75}>
        <circle cx={0} cy={-250} r={34} />
        <path d="M-30 -210 h60 l10 120 h-80 Z" />
        <path d={`M-10 -90 l${-leg} 90 M10 -90 l${leg} 90`} stroke="#3A2216" strokeWidth={22} strokeLinecap="round" />
        <path d={`M-26 -190 l${leg} 70 M26 -190 l${-leg} 70`} stroke="#3A2216" strokeWidth={16} strokeLinecap="round" />
        {i % 3 === 0 && <rect x={20} y={-150} width={50} height={60} rx={6} fill="#E39A52" />}
      </g>;
    })}
  </>
);

/* ---------------- SALA (gaveta de guardados) ---------------- */
const Sala: BG = ({t}) => (
  <>
    <rect x={-200} y={-200} width={1480} height={2320} fill="#8A4A2A" />
    {W(20, (i) => <rect key={i} x={-200 + i * 80} y={-200} width={40} height={1520} fill="#7A3E22" />)}
    {/* janela à noite */}
    <g stroke={INK} strokeWidth={10}>
      <rect x={560} y={200} width={420} height={520} fill="#1E2440" />
      <path d="M770 200 V720 M560 460 H980" />
    </g>
    <circle cx={880} cy={300} r={46} fill="#FFF3C9" />
    {W(10, (i) => <circle key={i} cx={580 + r(i) * 380} cy={220 + r(i + 4) * 480} r={3} fill="#fff" opacity={0.5 + 0.5 * Math.sin(t * 3 + i)} />)}
    {/* quadros */}
    <g stroke={INK} strokeWidth={8}>
      <rect x={60} y={240} width={300} height={220} fill="#C9962E" /><rect x={80} y={260} width={260} height={180} fill="#B8A88A" />
      <circle cx={170} cy={340} r={40} fill="#8A6A4A" /><circle cx={250} cy={350} r={36} fill="#6A5A4A" />
    </g>
    {/* cômoda */}
    <g stroke={INK} strokeWidth={9}>
      <rect x={-120} y={880} width={620} height={460} fill="#6A3418" />
      {W(3, (i) => <g key={i}><rect x={-90} y={910 + i * 140} width={560} height={120} fill="#8A4A24" /><circle cx={190} cy={970 + i * 140} r={14} fill="#E8B94A" /></g>)}
    </g>
    {/* abajur */}
    <g stroke={INK} strokeWidth={8}><path d="M60 880 l40 -180 h160 l40 180 Z" fill="#F2B040" /></g>
    <Glow x={180} y={760} r={520} c="#FFD890" o={0.55} id="sa-g" />
    <rect x={-200} y={FLOOR - 20} width={1480} height={900} fill="#5A2C16" />
    <ellipse cx={540} cy={FLOOR + 200} rx={700} ry={120} fill="#A8402A" opacity={0.6} />
  </>
);

/* ---------------- FOGOS DE 1994 ---------------- */
const Fogos: BG = ({t, v}) => {
  const bursts = v ? [[260, 420, 0], [800, 300, 0.45], [540, 560, 0.9], [180, 260, 1.3], [880, 520, 1.7]] : [];
  const cols = ['#FFD34A', '#FF6A2A', '#7CF2C0', '#FF8AD0', '#FFF6C9'];
  return (
    <>
      <Sky id="fo-sky" stops={[[0, '#0A0818'], [0.55, '#2A1430'], [0.75, '#6A2A22']]} />
      {W(60, (i) => <circle key={i} cx={r(i) * 1480 - 200} cy={r(i + 33) * 900 - 200} r={1 + r(i + 2) * 2} fill="#fff" opacity={0.6} />)}
      {/* holofotes de suspense */}
      {!v && [0, 1].map((k) => <Cone key={k} x={k ? 900 : 180} y={1300} w={260} h={-1500} c="#FFE2A0" o={0.22} id={`fo-s${k}`}
        rot={Math.sin(t * 1.2 + k * 2) * 25} />)}
      {bursts.map(([x, y, d], i) => {
        const k = (t - (d as number)) % 2.2;
        if (k < 0) return null;
        const p = Math.min(1, k / 0.7);
        return <g key={i} opacity={Math.max(0, 1 - k / 1.6)}>
          <circle cx={x} cy={y} r={300 * p} fill={cols[i % 5]} opacity={0.12} />
          {W(18, (j) => { const a = (j / 18) * Math.PI * 2; const R = 260 * p;
            return <path key={j} d={`M${x + Math.cos(a) * R * 0.5} ${y + Math.sin(a) * R * 0.5 + k * 30} L${x + Math.cos(a) * R} ${y + Math.sin(a) * R + k * 60}`}
              stroke={cols[(i + j) % 5]} strokeWidth={8} strokeLinecap="round" />; })}
        </g>;
      })}
      {/* skyline */}
      {W(11, (i) => { const w = 110 + r(i + 70) * 110, h = 300 + r(i + 71) * 500, x = -200 + i * 140;
        return <g key={i}><rect x={x} y={1260 - h} width={w} height={h} fill="#1E1222" />
          {W(Math.floor(h / 70), (j) => r(i * 9 + j) > (v ? 0.3 : 0.7) && <rect key={j} x={x + 20 + (j % 2) * (w - 60)} y={1260 - h + 30 + j * 70} width={20} height={28} fill="#FFC56A" opacity={0.8} />)}
        </g>; })}

      <rect x={-200} y={FLOOR - 20} width={1480} height={900} fill="#2A1620" />
      {v === 1 && <ellipse cx={540} cy={FLOOR + 100} rx={800} ry={160} fill="#FF8A2A" opacity={0.18} />}
    </>
  );
};

/* ---------------- AGÊNCIA BANCÁRIA (troca) ---------------- */
const Agencia: BG = ({t, v}) => (
  <>
    <Sky id="ag-sky" stops={[[0, '#E8D2B0'], [1, '#B8946A']]} />
    {W(4, (i) => <g key={i} stroke={INK} strokeWidth={6}>
      <rect x={-120 + i * 380} y={100} width={90} height={1240} fill="#F2E6D0" />
      {W(4, (k) => <rect key={k} x={-104 + i * 380 + k * 20} y={120} width={8} height={1200} fill="#D8C8AA" stroke="none" />)}
      <rect x={-140 + i * 380} y={80} width={130} height={40} fill="#D8C8AA" />
    </g>)}
    <rect x={-200} y={60} width={1480} height={60} fill="#C9A86A" stroke={INK} strokeWidth={6} />
    {/* placa de câmbio */}
    <g transform="translate(540 260)" stroke={INK} strokeWidth={8}>
      <rect x={-330} y={-70} width={660} height={140} rx={16} fill="#2A140C" />
      <Tx x={0} y={28} s={72} fill="#FFCF7A">TROCA: CR$ → R$</Tx>
    </g>
    {/* balcão / guichês */}
    <g stroke={INK} strokeWidth={8}>
      <rect x={-200} y={820} width={1480} height={520} fill="#7A4A2A" />
      {W(4, (i) => <g key={i}><rect x={-140 + i * 380} y={560} width={300} height={260} fill="#BFE0E8" opacity={0.6} />
        <rect x={-100 + i * 380} y={860} width={220} height={60} fill="#5A3420" />
        <Tx x={10 + i * 380} y={902} s={32} fill="#FFD59A">CAIXA {i + 1}</Tx></g>)}
    </g>
    <Cone x={540} y={-200} w={1200} h={1700} c="#FFF2D0" o={v === 2 ? 0.35 : 0.18} id="ag-c" />
    <rect x={-200} y={FLOOR - 20} width={1480} height={900} fill="#D8C4A0" />
    {W(8, (i) => W(5, (j) => (i + j) % 2 === 0 && <rect key={`${i}${j}`} x={-200 + i * 190} y={FLOOR - 20 + j * 120} width={190} height={120} fill="#B8A07A" />))}
    {/* fila */}
    {v === 0 && W(4, (i) => <g key={i} transform={`translate(${-60 + i * 110} ${FLOOR + 30}) scale(0.7)`} fill="#5A3A26" opacity={0.6}>
      <circle cx={0} cy={-250 + Math.sin(t * 3 + i) * 4} r={34} /><path d="M-36 -210 h72 l10 210 h-92 Z" />
    </g>)}
  </>
);

/* ---------------- LOUSA ---------------- */
const Lousa: BG = ({t}) => (
  <>
    <Sky id="lo-sky" stops={[[0, '#C98A4A'], [1, '#9A5A2A']]} />
    <g stroke={INK} strokeWidth={12}>
      <rect x={-140} y={180} width={1360} height={980} fill="#8A5A2E" />
      <rect x={-110} y={210} width={1300} height={920} fill="#24402E" />
    </g>
    {W(12, (i) => <path key={i} d={`M${-80 + r(i) * 1200} ${260 + r(i + 1) * 800} q30 -20 60 0 t60 0`} stroke="#E8F0E0" strokeWidth={3} fill="none" opacity={0.15} />)}
    <rect x={-110} y={1110} width={1300} height={30} fill="#6A4422" />
    <rect x={200} y={1112} width={80} height={16} fill="#F2F2E8" />
    <rect x={-200} y={FLOOR - 20} width={1480} height={900} fill="#7A4A26" />
    {W(20, (i) => <path key={i} d={`M${-200 + i * 80} ${FLOOR - 20} l-20 900`} stroke="#6A3E1E" strokeWidth={8} />)}
    <circle cx={900 + Math.sin(t) * 10} cy={1050} r={0} />
  </>
);

/* ---------------- PALCO (campeão) ---------------- */
const Palco: BG = ({t, v}) => (
  <>
    <rect x={-200} y={-200} width={1480} height={2320} fill="#1E0C08" />
    {/* cortinas */}
    {[-1, 1].map((sd) => W(6, (i) => <path key={`${sd}${i}`} d={`M${540 + sd * (380 + i * 60)} -200 q${sd * 30} 800 ${sd * 10} 1520 h${sd * 60} q${sd * 10} -700 ${sd * -20} -1520 Z`}
      fill={i % 2 ? '#8A1E16' : '#A8281E'} />))}
    <path d="M-200 -200 H1280 V120 Q540 260 -200 120 Z" fill="#B8301E" stroke={INK} strokeWidth={8} />
    {[0, 1, 2].map((k) => <Cone key={k} x={[120, 540, 960][k]} y={-200} w={600} h={1700} c="#FFF0C0" o={0.3}
      id={`pa-c${k}`} rot={Math.sin(t * 1.5 + k * 2) * (k === 1 ? 4 : 18)} />)}
    <rect x={-200} y={FLOOR - 20} width={1480} height={900} fill="#5A2A16" />
    <ellipse cx={540} cy={FLOOR + 90} rx={560} ry={100} fill="#FFE8B0" opacity={0.3} />
    {/* confete */}
    {v === 1 && W(70, (i) => { const y = ((r(i) * 2000 + t * (200 + r(i + 1) * 300)) % 2200) - 200;
      return <rect key={i} x={r(i + 2) * 1400 - 160 + Math.sin(t * 3 + i) * 30} y={y} width={18} height={30}
        fill={['#FFD34A', '#FF6A2A', '#5FBDB1', '#fff', '#E36A8E'][i % 5]} transform={`rotate(${t * 200 + i * 40} ${r(i + 2) * 1400 - 160} ${y})`} />; })}
  </>
);

/* ---------------- ESTÚDIO DO BENTO ---------------- */
const Estudio: BG = ({t, v}) => {
  const neon = v === 1 && Math.sin(t * 30) > 0.9 ? 0.4 : 1;
  return (
    <>
      <Sky id="et-sky" stops={[[0, '#3A1A10'], [1, '#5A2A16']]} />
      {W(8, (i) => <rect key={i} x={-200 + i * 200} y={-200} width={100} height={1520} fill="#4A2214" />)}
      <g opacity={neon}>
        <Glow x={540} y={330} r={520} c="#FF8A2A" o={0.45} id="et-g" />
        <rect x={150} y={250} width={780} height={160} rx={80} fill="none" stroke="#FFB060" strokeWidth={14} />
        <Tx x={540} y={365} s={100} fill="#FFE2B0">BENTO CONTAÊ</Tx>
      </g>
      {/* estantes */}
      {[0, 1].map((k) => <g key={k} stroke={INK} strokeWidth={6}>
        <rect x={k ? 760 : -120} y={560 + k * 60} width={400} height={24} fill="#8A5A2E" />
        <circle cx={(k ? 820 : -40)} cy={520 + k * 60} r={40} fill="#5FA05A" />
        <rect x={(k ? 900 : 40)} y={480 + k * 60} width={60} height={80} fill="#E39A52" />
        <circle cx={(k ? 1040 : 160)} cy={530 + k * 60} r={30} fill="#F2C24E" />
      </g>)}
      {/* ring light */}
      <g transform={`translate(${v ? 120 : 160} 860)`}>
        <circle r={150} fill="none" stroke="#FFF6E0" strokeWidth={30} />
        <circle r={150} fill="none" stroke="#fff" strokeWidth={8} opacity={0.8} />
        <rect x={-8} y={150} width={16} height={480} fill="#2A2420" />
      </g>
      <Glow x={160} y={860} r={420} c="#FFF6E0" o={0.3} id="et-r" />
      <rect x={-200} y={FLOOR - 20} width={1480} height={900} fill="#4A2416" />
      <ellipse cx={540} cy={FLOOR + 120} rx={700} ry={120} fill="#FF8A2A" opacity={0.15} />
    </>
  );
};


/* ---------------- CAIXA DO SUPERMERCADO ---------------- */
const Checkout: BG = ({t, v}) => {
  const lanes = [0, 1, 2];
  return (
    <>
      <Sky id="ck-sky" stops={[[0, '#E8DDC6'], [1, '#C8B898']]} />
      {/* janelas/vitrine ao fundo com luz do dia */}
      {W(6, (i) => <rect key={i} x={-180 + i * 250} y={160} width={220} height={420} fill="#CFE6EE" stroke={INK} strokeWidth={6} />)}
      <rect x={-200} y={580} width={1480} height={40} fill="#B8A88A" />
      {/* luzes dos caixas */}
      {lanes.map((k) => (
        <g key={k} transform={`translate(${60 + k * 420 - (v === 2 ? 120 : 0)} 0)`}>
          <rect x={-6} y={-200} width={12} height={560} fill="#5A4A3A" />
          <g transform="translate(0 380)">
            <rect x={-70} y={-50} width={140} height={100} rx={18} fill={k === 1 ? '#2c9877' : '#5A6470'} stroke={INK} strokeWidth={7} />
            <Tx x={0} y={22} s={64} fill="#fff">{k + 2}</Tx>
          </g>
          {k === 1 && <Glow x={0} y={380} r={160} c="#7CF2C0" o={0.45 + 0.2 * Math.sin(t * 4)} id={`ck-g${k}`} />}
        </g>
      ))}
      {/* balcão com esteira */}
      <g stroke={INK} strokeWidth={8}>
        <rect x={-200} y={1060} width={1480} height={300} fill="#8A5A3A" />
        <rect x={-200} y={1030} width={1480} height={50} rx={10} fill="#3A3A40" />
        {W(26, (i) => <rect key={i} x={((i * 60 - t * 90) % 1560 + 1560) % 1560 - 220} y={1040} width={30} height={30} fill="#4A4A52" strokeWidth={3} />)}
        {/* caixa registradora */}
        <rect x={720} y={860} width={260} height={180} rx={18} fill="#D8D2C4" />
        <rect x={745} y={885} width={210} height={80} rx={8} fill="#13233A" />
        <rect x={760} y={985} width={180} height={40} rx={6} fill="#B8B0A0" />
        {/* doces/estante de impulso */}
        <rect x={-120} y={760} width={260} height={280} fill="#C9553A" />
        {W(3, (j) => W(4, (i) => <rect key={`${i}${j}`} x={-100 + i * 60} y={780 + j * 85} width={46} height={64} rx={6}
          fill={['#FFD34A', '#E36A8E', '#4FA0B5', '#7CC36B'][(i + j) % 4]} strokeWidth={4} />))}
      </g>
      <Tx x={850} y={940} s={44} fill="#7CF29A">R$</Tx>
      <rect x={-200} y={FLOOR + 40} width={1480} height={900} fill="#E8E0CC" />
      {W(10, (i) => <path key={i} d={`M${540 + (i - 5) * 80} ${FLOOR + 40} L${540 + (i - 5) * 400} 2120`} stroke="#C8BEA8" strokeWidth={5} />)}
    </>
  );
};

/* ---------------- RAIOS (marca do Dr. Bento): v0 laranja, v1 verde (solução), v2 alerta ---------------- */
const Raios: BG = ({t, v}) => {
  const [a, b, c] = [['#F58D33', '#EA6F1C', '#A34A12'], ['#3CAB8A', '#2C9877', '#185E48'], ['#E0443A', '#B8302A', '#5A120E']][v] ?? ['#F58D33', '#EA6F1C', '#A34A12'];
  return (
    <>
      <defs>
        <radialGradient id={`ra-g${v}`} cx="50%" cy="42%" r="70%">
          <stop offset="0" stopColor={a} /><stop offset="0.6" stopColor={b} /><stop offset="1" stopColor={c} />
        </radialGradient>
      </defs>
      <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#ra-g${v})`} />
      <g transform={`rotate(${t * 6} 540 800)`}>
        {W(24, (i) => <path key={i} d={`M540 800 L${540 + Math.cos((i / 24) * Math.PI * 2) * 2400} ${800 + Math.sin((i / 24) * Math.PI * 2) * 2400}
          L${540 + Math.cos(((i + 0.5) / 24) * Math.PI * 2) * 2400} ${800 + Math.sin(((i + 0.5) / 24) * Math.PI * 2) * 2400} Z`}
          fill="#fff" opacity={0.08} />)}
      </g>
      <circle cx={540} cy={800} r={560} fill="none" stroke="#FFE8C8" strokeWidth={8} opacity={0.5} />
      <ellipse cx={540} cy={FLOOR + 230} rx={800} ry={140} fill="#000" opacity={0.18} />
    </>
  );
};

/* ---------------- LOJA DE ELETRÔNICOS (parede de TVs) ---------------- */
const Eletro: BG = ({t, v}) => (
  <>
    <Sky id="el-sky" stops={[[0, '#2A2630'], [1, '#3A3440']]} />
    {W(4, (j) => W(5, (i) => {
      const x = -160 + i * 300 + (v ? -80 : 0), y = 120 + j * 230;
      const ph = Math.floor(t * 3 + i + j) % 3;
      return <g key={`${i}${j}`} stroke={INK} strokeWidth={7}>
        <rect x={x} y={y} width={270} height={170} rx={10} fill="#111" />
        {ph === 0 && W(7, (k) => <rect key={k} x={x + 12 + k * 35} y={y + 12} width={35} height={146}
          fill={['#fff', '#FFD34A', '#4FD0E0', '#5FD06A', '#E36AD0', '#E0443A', '#3A5AE0'][k]} stroke="none" />)}
        {ph === 1 && <rect x={x + 12} y={y + 12} width={246} height={146} fill="#2F6FD0" stroke="none" />}
        {ph === 2 && <rect x={x + 12} y={y + 12} width={246} height={146} fill="#F58D33" stroke="none" />}
      </g>;
    }))}
    <Cone x={540} y={-200} w={1400} h={1700} c="#FFE8C8" o={0.16} id="el-c" />
    <rect x={-200} y={FLOOR - 20} width={1480} height={900} fill="#5A5460" />
    {W(10, (i) => <path key={i} d={`M${540 + (i - 5) * 80} ${FLOOR - 20} L${540 + (i - 5) * 400} 2120`} stroke="#4A4450" strokeWidth={5} />)}
  </>
);

/* ---------------- TRIBUNAL ---------------- */
const Tribunal: BG = ({t}) => (
  <>
    <Sky id="tr-sky" stops={[[0, '#6A3A1E'], [1, '#3A1E0E']]} />
    {W(12, (i) => <rect key={i} x={-200 + i * 130} y={-200} width={120} height={1500} fill={i % 2 ? '#7A4424' : '#6E3C1E'} />)}
    {/* brasão com balança */}
    <g transform="translate(540 330)" stroke={INK} strokeWidth={8}>
      <circle r={150} fill="#C9962E" />
      <circle r={120} fill="#E8B94A" />
      <path d="M0 -80 V70 M-70 -40 H70" fill="none" strokeWidth={10} />
      <path d="M-70 -40 l-35 70 h70 Z M70 -40 l-35 70 h70 Z" fill="#FFF3C9" strokeWidth={6} />
    </g>
    {/* bancada do juiz */}
    <g stroke={INK} strokeWidth={9}>
      <rect x={-60} y={760} width={1200} height={560} fill="#8A4A24" />
      <rect x={-60} y={730} width={1200} height={50} rx={8} fill="#A85A2E" />
      {W(5, (i) => <rect key={i} x={-20 + i * 240} y={820} width={200} height={420} fill="#7A3E1E" />)}
    </g>
    <Tx x={540} y={710} s={70} fill="#FFE2B0" op={0.9}>JUSTIÇA</Tx>
    <Cone x={540} y={-200} w={1100} h={1700} c="#FFE2A8" o={0.2} id="tr-c" />
    <rect x={-200} y={FLOOR - 20} width={1480} height={900} fill="#4A2412" />
  </>
);

const KINDS: Record<string, BG> = {checkout: Checkout, raios: Raios, eletro: Eletro, tribunal: Tribunal, rua: Rua, cosmos: Cosmos, grafica: Grafica, museu: Museu, anos40: Anos40, anos60: Anos60,
  anos70: Anos70, jornal: Jornal, escritorio: Escritorio, mercado: Mercado, rua_dia: RuaDia, sala: Sala, fogos: Fogos,
  agencia: Agencia, lousa: Lousa, palco: Palco, estudio: Estudio};

/* variantes de câmera: v0 plano geral, v1 plano mais fechado, v2 contra-plano */
/* variantes de câmera SEM zoom: só deslocamento lateral/vertical (o cenário tem 200 px de sobra em cada lado) */
const CAM: Record<number, string> = {0: 'none', 1: 'translate(-150px, 20px)', 2: 'translate(150px, -20px)'};
const CAMK: Record<string, Record<number, string>> = {
  rua: {1: 'translate(-120px, -190px)'},
};

export const Backdrop: React.FC<{kind: string; v: number; t: number}> = ({kind, v, t}) => {
  const K = KINDS[kind] ?? Rua;
  const cam = CAMK[kind]?.[v] ?? CAM[v] ?? 'none';
  const sepia = kind === 'anos40';
  return (
    <div style={{position: 'absolute', left: -200, top: -200, width: 1480, height: 2320, transform: cam, transformOrigin: '740px 1160px',
      filter: sepia ? 'sepia(0.5) contrast(1.05)' : undefined}}>
      <svg width={1480} height={2320} viewBox="-200 -200 1480 2320" style={{display: 'block'}}>
        <K t={t} v={v} />
      </svg>
    </div>
  );
};
