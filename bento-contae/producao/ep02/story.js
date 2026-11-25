// EP 02 — A Carteira Achada na Calçada
import { C, W, H, E, pop, wob, ramp, lerp, clamp, within, box, circle, ellipse, line, shape, text, stroked,
  bgDots, bgBurst, bgRoom, bgStreet, person, note, wallet, rgCard, trash, cctv, doc, phone, card, stamp, banner,
  badge, thought, sparkle, flash, FONT_CAP, FONT_UI } from '../../engine2d/engine.js';

export const SCRIPT = [
  { shot: 's01', text: 'O Bruno achou uma carteira com dois mil reais na calçada.' },
  { shot: 's02', text: 'Olhou pros lados. Ninguém viu.' },
  { shot: 's03', text: 'E ele pensou: achado não é roubado.' },
  { shot: 's04', text: 'Tirou as notas, jogou a carteira no lixo e foi direto pro shopping.' },
  { shot: 's05', text: 'Comprou um tênis, um fone novo e ainda pagou o churrasco da galera.' },
  { shot: 's06', text: 'No grupo da família, mandou foto: "hoje o dia tá abençoado".' },
  { shot: 's07', text: 'Só que dentro daquela carteira tinha o RG do dono.' },
  { shot: 's08', text: 'E bem naquela esquina, tinha uma câmera.' },
  { shot: 's09', text: 'O dono registrou boletim de ocorrência no mesmo dia.' },
  { shot: 's10', text: 'Um mês depois, chegou uma intimação.' },
  { shot: 's11', text: 'Calma, que o Bento conta.' },
  { shot: 's12', text: 'Achado não é roubado é ditado. Não é lei.' },
  { shot: 's13', text: 'A lei é o artigo cento e sessenta e nove do Código Penal.' },
  { shot: 's14', text: 'Quem acha uma coisa perdida e não devolve em quinze dias comete apropriação de coisa achada.' },
  { shot: 's15', text: 'Pena de até um ano de detenção, ou multa.' },
  { shot: 's16', text: 'E o Bruno ainda teve que devolver os dois mil reais.' },
  { shot: 's17', text: 'Mas a parte mais irônica é essa:' },
  { shot: 's18', text: 'se ele tivesse devolvido, a lei garantia uma recompensa.' },
  { shot: 's18', text: 'No mínimo, cinco por cento.' },
  { shot: 's19', text: 'Cem reais. Limpinhos. Sem processo.' },
  { shot: 's20', text: 'Achou carteira? Devolve pro dono ou entrega na delegacia.' },
  { shot: 's21', text: 'Achado não é roubado… mas pode virar processo.' },
  { shot: 's22', text: 'Manda esse vídeo pra aquele amigo que vive falando "achado não é roubado".' },
  { shot: 's23', text: 'E segue o Bento Contaê, que a próxima história pode ser a sua.' },
  { shot: 's24', text: 'Uma semana depois, voltando pra casa, o Bruno olhou pra calçada de novo…' },
];
export const KEYS = ['carteira', 'mil', 'ninguém', 'roubado', 'lixo', 'shopping', 'tênis', 'fone', 'churrasco', 'abençoado', 'RG', 'câmera',
  'boletim', 'intimação', 'Bento', 'ditado', 'lei', 'artigo', 'Penal', 'quinze', 'apropriação', 'ano', 'multa', 'devolver', 'irônica',
  'recompensa', 'cinco', 'Cem', 'processo', 'Devolve', 'delegacia', 'amigo', 'segue', 'Contaê', 'calçada'];

// ---------- elenco ----------
const BRUNO = { skin: '#d39a6b', hair: 'quiff', hairCol: '#2a1a12', shirt: '#3fa86b', emblem: '#ffffff', pants: '#33507f', seed: 1 };
const BENTO = { skin: '#c98b5e', hair: 'slick', hairCol: '#3a2414', suit: { jacket: '#2b3550', tie: C.red, stripes: true, pocket: true }, pants: '#2b3550', glasses: true, mustache: true, seed: 2 };
const OFICIAL = { skin: '#8a5a3c', hair: 'bald', hairCol: '#a7a7a7', suit: { jacket: '#6b6e75', tie: C.blue }, pants: '#3c3f46', seed: 3 };
const DONO = { skin: '#f0c9a0', hair: 'grey', hairCol: '#8b8780', shirt: '#c79a5a', pants: '#5b4a3a', glasses: true, seed: 4 };

// ---------- ícones da história ----------
function sneaker(c, x, y, s) {
  within(c, x, y, -0.08, s, (c) => {
    shape(c, (c) => { c.moveTo(-150, 40); c.lineTo(150, 40); c.quadraticCurveTo(170, 10, 140, -10); c.lineTo(20, -40); c.lineTo(-40, -90); c.lineTo(-140, -90); c.quadraticCurveTo(-165, -20, -150, 40); c.closePath(); }, C.red, 9);
    box(c, -160, 20, 330, 40, 18, '#fff', 9);
    for (let i = 0; i < 3; i++) line(c, [[-60 + i * 30, -70 + i * 10], [-20 + i * 30, -50 + i * 10]], 7, '#fff');
    shape(c, (c) => { c.moveTo(-120, -10); c.quadraticCurveTo(-40, -30, 40, 10); }, null, 7);
  });
}
function headphones(c, x, y, s) {
  within(c, x, y, 0, s, (c) => {
    c.beginPath(); c.arc(0, 0, 120, Math.PI * 1.05, Math.PI * 1.95); c.lineWidth = 46; c.strokeStyle = C.ink; c.stroke(); c.lineWidth = 28; c.strokeStyle = '#4b5bd6'; c.stroke();
    for (const sd of [-1, 1]) { box(c, sd * 120 - 45, -20, 90, 130, 30, '#4b5bd6', 9); box(c, sd * 120 - (sd > 0 ? 45 : -15) - 0, 0, 30, 90, 12, '#2c2f6b', 6); }
  });
}
function grill(c, x, y, s, t) {
  within(c, x, y, 0, s, (c) => {
    for (let i = 0; i < 3; i++) { const sx = -70 + i * 70; c.globalAlpha = 0.55; circle(c, sx + wob(t, 0.8, 10, i), -170 - ((t * 60 + i * 40) % 90), 22 + ((t * 30 + i * 20) % 20), '#eee', 0); c.globalAlpha = 1; }
    for (const sd of [-1, 1]) line(c, [[sd * 70, 40], [sd * 110, 150]], 16);
    shape(c, (c) => { c.moveTo(-170, -40); c.lineTo(170, -40); c.quadraticCurveTo(150, 60, 0, 70); c.quadraticCurveTo(-150, 60, -170, -40); c.closePath(); }, '#2d2d33', 9);
    for (let i = 0; i < 4; i++) { line(c, [[-150, -70 + 0], [150, -70]], 0); box(c, -130 + i * 68, -90, 50, 46, 18, i % 2 ? '#b6532c' : '#d9763a', 7); }
    line(c, [[-180, -46], [180, -46]], 8);
  });
}
function bags(c, x, y, s) {
  within(c, x, y, 0, s, (c) => {
    box(c, -60, -100, 120, 130, 10, C.yellow, 8); shape(c, (c) => { c.arc(0, -100, 32, Math.PI, 0); }, null, 7);
    box(c, 10, -70, 100, 110, 10, '#e66a9a', 8); shape(c, (c) => { c.arc(60, -70, 26, Math.PI, 0); }, null, 7);
  });
}
function heart(c, x, y, s, col = C.red) { within(c, x, y, 0, s, (c) => shape(c, (c) => { c.moveTo(0, 30); c.bezierCurveTo(-60, -10, -30, -60, 0, -30); c.bezierCurveTo(30, -60, 60, -10, 0, 30); c.closePath(); }, col, 6)); }
function calendar(c, x, y, s, done) {
  within(c, x, y, 0, s, (c) => {
    box(c, -330, -250, 660, 500, 26, '#fff', 11);
    shape(c, (c) => { rrectTop(c, -330, -250, 660, 110, 26); }, C.red, 11);
    stroked(c, '15 DIAS', 0, -192, { size: 70, fill: '#fff', lw: 12 });
    for (let i = 0; i < 15; i++) {
      const cx = -250 + (i % 5) * 125, cy = -70 + Math.floor(i / 5) * 105;
      box(c, cx - 48, cy - 40, 96, 80, 12, '#f4efe2', 6);
      text(c, String(i + 1), cx, cy + 2, { size: 40, font: FONT_CAP, fill: '#8b8178' });
      const k = clamp(done * 15 - i);
      if (k > 0) { line(c, [[cx - 34, cy - 28], [cx - 34 + 68 * Math.min(1, k * 2), cy - 28 + 56 * Math.min(1, k * 2)]], 11, C.red); if (k > 0.5) line(c, [[cx + 34, cy - 28], [cx + 34 - 68 * (k - 0.5) * 2, cy - 28 + 56 * (k - 0.5) * 2]], 11, C.red); }
    }
  });
}
function rrectTop(c, x, y, w, h, r) { c.moveTo(x, y + h); c.lineTo(x, y + r); c.arcTo(x, y, x + r, y, r); c.lineTo(x + w - r, y); c.arcTo(x + w, y, x + w, y + r, r); c.lineTo(x + w, y + h); c.closePath(); }
function money(c, t, t0, n = 7, seed = 1) {
  for (let i = 0; i < n; i++) {
    const tt = t - t0 - i * 0.12; if (tt < 0) continue;
    const x = ((i * 397 + seed * 131) % 900) + 90, y = -150 + tt * 520 + ((i * 53) % 80);
    if (y > H + 200) continue;
    note(c, x + wob(tt, 0.6, 40, i * 0.3), y, 0.8, wob(tt, 0.4, 0.6, i * 0.2) + i);
  }
}
const talking = (T, a = 0, b = 99) => (T.t > a && T.t < b ? 1 : 0);

// ---------- planos ----------
export const SHOTS = {
  s01(c, T) {
    bgStreet(c, T.g);
    const k = pop(T.t, T.find('carteira') - 0.1);
    person(c, BRUNO, { x: 540, y: 1840, s: 1.04, t: T.g, pose: 'holdUp', expr: 'surprised', look: 0.5, hold: (c) => wallet(c, 20, -60, 0.9 * Math.max(0.01, k), 0.1, { open: 1 }) });
    for (let i = 0; i < 4; i++) sparkle(c, 760 + Math.cos(i * 1.7 + T.t * 2) * 140, 1060 + Math.sin(i * 2.1 + T.t * 2) * 120, 0.5 * pop(T.t, T.find('carteira') + i * 0.06) * (0.7 + 0.3 * Math.sin(T.t * 8 + i)), T.t + i);
    card(c, 540, 560, pop(T.t, T.find('dois') - 0.05), 'R$ 2.000,00', 'NA CALÇADA', { titleCol: '#2c8a4a', size: 120, w: 640 });
  },
  s02(c, T) {
    bgStreet(c, T.g, { sidewalkY: 1600 });
    const nv = T.find(/ninguem/);
    const look = T.t < nv ? Math.sign(Math.sin(T.t * 4.2)) * E.inout(Math.abs(Math.sin(T.t * 4.2)) * 3) : 0;
    within(c, 540, 0, 0, 1, (c) => person(c, BRUNO, { x: 0, y: 2420, s: 1.62, t: T.g, pose: 'holdUp', expr: T.t < nv ? 'worried' : 'smug', look: clamp(look, -1, 1), hold: (c) => wallet(c, 20, -60, 0.9, 0.1) }));
  },
  s03(c, T) {
    bgStreet(c, T.g, { sidewalkY: 1600 });
    person(c, BRUNO, { x: 600, y: 2300, s: 1.45, t: T.g, pose: 'holdUp', expr: 'smug', look: -0.6, lookY: -0.5, hold: (c) => wallet(c, 20, -60, 0.9, 0.1) });
    thought(c, 470, 520, pop(T.t, T.find('achado') - 0.15, 0.4), 'ACHADO NÃO É\nROUBADO', { from: [560, 900], w: 700, size: 82 });
  },
  s04(c, T) {
    bgStreet(c, T.g);
    const tj = T.find('jogou'), ts = T.find('shopping');
    const fly = ramp(T.t, tj, tj + 0.55);
    trash(c, 860, 1700, 0.95, fly > 0 && fly < 1 ? 1 : fly >= 1 ? lerp(1, 0, ramp(T.t, tj + 0.55, tj + 0.8)) : 0);
    const happy = T.t > ts;
    person(c, BRUNO, { x: 360, y: 1840, s: 1.0, t: T.g, pose: happy ? 'wave' : 'holdUp', expr: happy ? 'happy' : 'smug', look: fly > 0 && fly < 1 ? 1 : 0,
      hold: (c) => { if (!happy) for (let i = 0; i < 3; i++) note(c, -20 + i * 18, -60 - i * 10, 0.6, -0.4 + i * 0.3); },
      holdL: (c) => { if (fly <= 0) wallet(c, 0, -40, 0.7, 0.2, { notes: 0 }); if (happy) bags(c, 0, 60, 0.9 * pop(T.t, ts)); } });
    if (fly > 0 && fly < 1) wallet(c, lerp(230, 860, fly), lerp(1340, 1380, fly) - Math.sin(fly * Math.PI) * 420, 0.7, fly * 9, { notes: 0, rg: true });
    if (happy) money(c, T.t, ts, 6, 3);
  },
  s05(c, T) {
    bgDots(c, C.cream, C.creamDot, T.g);
    const a = T.find(/tenis/), b = T.find('fone'), d = T.find('churrasco');
    sneaker(c, 300, 560, pop(T.t, a - 0.08) * 1.0);
    headphones(c, 780, 600, pop(T.t, b - 0.08) * 1.0);
    grill(c, 540, 1000, pop(T.t, d - 0.08) * 1.0, T.g);
    const left = T.t < a ? 2000 : T.t < b ? 1300 : T.t < d ? 700 : 0;
    const shake = (tt) => (T.t > tt && T.t < tt + 0.25 ? wob(T.t, 18, 8) : 0);
    money(c, T.t, 0, 5, 7);
    within(c, 540 + shake(a) + shake(b) + shake(d), 1560, 0, 1, (c) => card(c, 0, 0, 1, 'R$ ' + left.toLocaleString('pt-BR') + ',00', 'SOBRANDO', { titleCol: left ? '#2c8a4a' : C.red, size: 100, w: 620 }));
  },
  s06(c, T) {
    bgDots(c, C.sky, C.skyDot, T.g);
    const k = E.out(T.t / 0.3), tf = T.find('foto'), ta = T.find(/hoje/);
    phone(c, 540, 860 + (1 - k) * 400, 1.38, -0.03, (c) => {
      c.fillStyle = '#e7ddd3'; c.fillRect(-128, -270, 256, 540);
      c.fillStyle = '#1f8f6b'; c.fillRect(-128, -270, 256, 74);
      text(c, 'Família', -10, -232, { size: 30, fill: '#fff' }); heart(c, 70, -234, 0.35);
      const p = pop(T.t, tf - 0.05);
      if (p > 0) within(c, 30, -60, 0, p, (c) => {
        box(c, -95, -110, 190, 200, 14, '#dcf6c6', 5);
        box(c, -82, -98, 164, 130, 10, '#9fd1f0', 4);
        circle(c, -20, -40, 34, BRUNO.skin, 4); shape(c, (c) => { c.arc(-20, -44, 32, Math.PI * 1.05, Math.PI * 1.95); c.closePath(); }, BRUNO.hairCol, 3);
        circle(c, -32, -42, 5, C.ink, 0); circle(c, -8, -42, 5, C.ink, 0); shape(c, (c) => { c.moveTo(-34, -28); c.quadraticCurveTo(-20, -14, -6, -28); }, null, 4);
        within(c, 45, -20, 0, 0.22, (c) => sneaker(c, 0, 0, 1)); within(c, 45, 10, 0, 0.18, (c) => headphones(c, 0, 0, 1));
      });
      const p2 = pop(T.t, ta - 0.05);
      if (p2 > 0) within(c, 10, 150, 0, p2, (c) => { box(c, -110, -50, 220, 100, 16, '#dcf6c6', 5); text(c, 'hoje o dia tá', 0, -16, { size: 28, fill: C.ink }); text(c, 'abençoado 🙏', 0, 18, { size: 28, fill: C.ink }); });
    });
    for (let i = 0; i < 5; i++) heart(c, 160 + i * 190, 1700 - ((T.t * 260 + i * 140) % 700), 0.9 * pop(T.t, ta + i * 0.08), i % 2 ? C.red : '#f08aa8');
  },
  s07(c, T) {
    bgStreet(c, T.g, { sidewalkY: 1500 });
    const tr = T.find(/^rg$/);
    trash(c, 540, 1930, 1.9, 0.35);
    const up = pop(T.t, tr - 0.1, 0.45);
    rgCard(c, 540, lerp(1500, 860, E.out(ramp(T.t, tr - 0.1, tr + 0.35))), 1.6 * Math.max(0.6, up), 0.08 * Math.sin(T.t * 3));
    if (T.t > tr) for (let i = 0; i < 6; i++) sparkle(c, 540 + Math.cos(i) * 320, 860 + Math.sin(i * 1.3) * 230, 0.6 * pop(T.t, tr + 0.1 + i * 0.05), T.t * 2 + i);
  },
  s08(c, T) {
    bgStreet(c, T.g, { offset: 300 });
    const tc = T.find(/camera/);
    cctv(c, 820, 430, 1.25, T.g, -0.12);
    if (T.t > tc) { stroked(c, '● REC', 760, 620, { size: 64, fill: C.red, lw: 12 }); }
    // Bruno pequeno passando com sacolas
    const wx = lerp(80, 520, T.t / T.dur);
    person(c, BRUNO, { x: wx, y: 1720, s: 0.5, t: T.g, pose: 'walk', walk: T.t * 1.6, expr: 'happy', holdL: (c) => bags(c, 0, 60, 0.9), flip: false });
  },
  s09(c, T) {
    bgDots(c, C.cream, C.creamDot, T.g);
    const tb = T.find('boletim');
    person(c, DONO, { x: 540, y: 1880, s: 1.05, t: T.g, pose: 'holdUp', expr: 'angry', look: 0.3, hold: (c) => doc(c, 40, -60, 0.8, 0.1, 'B.O.') });
    stamp(c, 540, 560, pop(T.t, tb - 0.05, 0.25) * 1.0, 'B.O. REGISTRADO', { size: 92 });
  },
  s10(c, T) {
    bgRoom(c, T.g);
    const ti = T.find(/intimacao/);
    const shock = T.t > ti - 0.1;
    person(c, OFICIAL, { x: 300, y: 1880, s: 0.98, t: T.g, pose: 'give', expr: 'angry', look: 1, hold: (c) => doc(c, 40, -40, 0.75, -0.08, 'INTIMAÇÃO') });
    person(c, BRUNO, { x: 790, y: 1880, s: 0.98, t: T.g, pose: shock ? 'handsHead' : 'down', expr: shock ? 'shock' : 'smile', look: -0.8 });
    banner(c, 540, 380, pop(T.t, 0, 0.3), '1 MÊS DEPOIS', { size: 120 });
  },
  s11(c, T) {
    bgBurst(c, T.g);
    const k = E.out(T.t / 0.35);
    person(c, BENTO, { x: lerp(1400, 560, k), y: 1880, s: 1.06, t: T.g, pose: T.t < 0.6 ? 'wave' : 'hips', expr: 'smile', look: -0.2, talk: talking(T, 0.1, T.dur - 0.2) * 0.8 });
    card(c, 540, 470, pop(T.t, T.find('bento') - 0.1), 'DR. BENTO', 'ADVOGADO', { titleCol: C.blue, size: 120, w: 600, rot: -0.03 });
  },
  s12(c, T) {
    bgBurst(c, T.g);
    const tn = T.find(/^nao$/, 1);
    person(c, BENTO, { x: 360, y: 1880, s: 0.98, t: T.g, pose: 'point', expr: T.t > tn ? 'angry' : 'smug', talk: 0.7 });
    card(c, 600, 560, pop(T.t, 0.05), 'ACHADO NÃO É', 'ROUBADO', { titleCol: C.ink, size: 86, subSize: 86, w: 720, rot: 0.03 });
    stamp(c, 640, 860, pop(T.t, tn - 0.05, 0.22) * 1.1, 'NÃO É LEI', { size: 120, rot: -0.14 });
  },
  s13(c, T) {
    bgBurst(c, T.g, C.orange, C.orange2, 400, 900);
    person(c, BENTO, { x: 360, y: 1880, s: 1.02, t: T.g, pose: 'point', expr: 'smile', talk: talking(T, 0, T.dur - 0.2) * 0.7 });
    card(c, 760, 560, pop(T.t, T.find('artigo') - 0.1), 'ART. 169', 'CÓDIGO PENAL', { size: 130, w: 500, rot: 0.02 });
  },
  s14(c, T) {
    bgBurst(c, T.g);
    const tq = T.find('quinze'), tc = T.find('comete'), ta = T.find(/apropriacao/);
    calendar(c, 540, 640, pop(T.t, Math.min(0.05, tq - 0.6), 0.3), ramp(T.t, tq - 0.1, tc));
    card(c, 540, 1050, pop(T.t, ta - 0.1), 'APROPRIAÇÃO', 'DE COISA ACHADA', { size: 100, w: 800, titleCol: C.red });
  },
  s15(c, T) {
    bgBurst(c, T.g, C.orange, C.orange2, 400, 900);
    person(c, BENTO, { x: 340, y: 1880, s: 1.0, t: T.g, pose: 'point', expr: 'angry', talk: 0.7 });
    card(c, 740, 600, pop(T.t, T.find('ano') - 0.1), 'ATÉ 1 ANO', 'DE DETENÇÃO', { size: 110, w: 560, sub2: T.t > T.find('multa') - 0.1 ? 'OU MULTA' : '', rot: 0.02 });
  },
  s16(c, T) {
    bgRoom(c, T.g);
    const td = T.find('devolver');
    const give = E.inout(ramp(T.t, td - 0.2, td + 0.4));
    person(c, DONO, { x: 820, y: 1880, s: 0.95, t: T.g, pose: 'hips', expr: 'angry', look: -1, flip: true });
    person(c, BRUNO, { x: lerp(330, 420, give), y: 1880, s: 0.98, t: T.g, pose: 'down', pose2: 'give', poseMix: give, expr: 'sad', look: 1,
      hold: (c) => { for (let i = 0; i < 5; i++) note(c, 10, -20 - i * 14, 0.6, 0.2); } });
  },
  s17(c, T) {
    bgBurst(c, T.g);
    person(c, BENTO, { x: 540, y: 2500, s: 1.75, t: T.g, pose: 'down', expr: 'smug', look: 0, talk: talking(T, 0, T.dur - 0.25) * 0.6 });
  },
  s18(c, T) {
    bgBurst(c, T.g, C.green, C.green2);
    const tr = T.find('recompensa'), tc = T.find('cinco');
    card(c, 540, 470, pop(T.t, 0.05), 'ART. 1.234', 'CÓDIGO CIVIL', { titleCol: C.green, size: 120, w: 560 });
    banner(c, 540, 780, pop(T.t, tr - 0.08), 'RECOMPENSA', { size: 120, rot: -0.04 });
    const k = pop(T.t, tc - 0.08, 0.4);
    if (k > 0) { within(c, 540, 1040, 0.04, k, (c) => stroked(c, 'MÍNIMO 5%', 0, 0, { size: 150, fill: C.yellow, lw: 22 })); for (let i = 0; i < 6; i++) sparkle(c, 540 + Math.cos(i * 1.05) * 420, 1040 + Math.sin(i * 1.05) * 170, 0.7 * k, T.t * 2 + i); }
  },
  s19(c, T) {
    bgBurst(c, T.g, C.green, C.green2);
    const tl = T.find('limpinhos'), tp = T.find('processo');
    const spin = Math.cos(Math.min(1, T.t / 0.6) * Math.PI * 4);
    within(c, 540, 760, 0, 1, (c) => { c.scale(lerp(0.2, 1, E.out(T.t / 0.6)) * (T.t < 0.6 ? spin : 1), lerp(0.2, 1, E.out(T.t / 0.6))); note(c, 0, 0, 3.4, -0.06, '100'); });
    for (let i = 0; i < 8; i++) sparkle(c, 540 + Math.cos(i * 0.8 + T.t) * 460, 760 + Math.sin(i * 0.8 + T.t) * 300, 0.75 * pop(T.t, tl - 0.05 + i * 0.03) * (0.7 + 0.3 * Math.sin(T.t * 9 + i)), T.t * 3 + i);
    stamp(c, 540, 1050, pop(T.t, T.find('sem') - 0.08, 0.25), 'SEM PROCESSO', { col: '#1f7a5c', size: 100, rot: 0.06 });
  },
  s20(c, T) {
    bgStreet(c, T.g);
    const td = T.find('devolve');
    const give = E.inout(ramp(T.t, td - 0.3, td + 0.3));
    person(c, DONO, { x: 800, y: 1840, s: 0.95, t: T.g, pose: 'down', pose2: 'give', poseMix: give * 0.6, expr: give > 0.5 ? 'happy' : 'neutral', flip: true });
    person(c, BRUNO, { x: lerp(320, 390, give), y: 1840, s: 0.98, t: T.g, pose: 'down', pose2: 'give', poseMix: give, expr: 'smile', look: 1, hold: (c) => wallet(c, 30, -20, 0.6, 0.15, { notes: 1 }) });
    card(c, 540, 500, pop(T.t, 0.05), 'ACHOU?', 'DEVOLVE.', { titleCol: C.green, size: 130, subSize: 70, w: 520 });
    if (T.t > T.find('delegacia') - 0.1) stamp(c, 540, 820, pop(T.t, T.find('delegacia') - 0.1, 0.25), 'OU NA DELEGACIA', { col: C.blue, size: 66, rot: -0.05 });
  },
  s21(c, T) {
    bgDots(c, C.cream, C.creamDot, T.g);
    const tp = T.find('processo');
    card(c, 540, 470, pop(T.t, 0.03), 'ACHADO NÃO É', 'ROUBADO…', { titleCol: C.ink, size: 92, subSize: 92, w: 760 });
    wallet(c, 540, 930, 2.2 * pop(T.t, 0.1, 0.4), -0.06, { notes: 1 });
    stamp(c, 540, 960, pop(T.t, T.find('mas') - 0.05, 0.25) * 1.0, '…MAS VIRA PROCESSO', { size: 84, rot: -0.12 });
  },
  s22(c, T) {
    bgDots(c, C.sky, C.skyDot, T.g);
    const ta = T.find('amigo');
    phone(c, 540, 840, 1.4, 0.02, (c) => {
      c.fillStyle = '#fff'; c.fillRect(-128, -270, 256, 540);
      text(c, 'Enviar para…', 0, -228, { size: 28, fill: C.ink });
      const rows = ['Mãe', 'O amigo do', 'Trabalho', 'Tia Cida'];
      rows.forEach((r, i) => {
        const y = -160 + i * 92, hot = i === 1 && T.t > ta - 0.1;
        if (hot) box(c, -120, y - 40, 240, 80, 14, '#d8f3e3', 0);
        circle(c, -80, y, 28, ['#f2b134', '#3fa86b', '#4b7bd6', '#e66a9a'][i], 4);
        text(c, r, 10, i === 1 ? y - 14 : y, { size: 24, fill: C.ink, maxW: 150 });
        if (i === 1) text(c, '"achado não é roubado"', 10, y + 16, { size: 17, fill: '#555', maxW: 160 });
      });
      box(c, -100, 150, 200, 64, 32, '#1f8f6b', 0); text(c, 'ENVIAR', 0, 183, { size: 30, fill: '#fff' });
    });
    // dedo tocando
    const tap = clamp(1 - Math.abs(T.t - ta) / 0.3);
    if (T.t > ta - 0.55) within(c, 640 + (1 - E.out(ramp(T.t, ta - 0.5, ta))) * 300, 740 + (1 - E.out(ramp(T.t, ta - 0.5, ta))) * 500, 0, 1 - tap * 0.12, (c) => { box(c, -24, -10, 48, 150, 24, BRUNO.skin, 8); ellipse(c, 0, 170, 70, 80, BRUNO.skin, 8); box(c, -70, 230, 140, 400, 30, BRUNO.shirt, 8); });
    if (tap > 0.6) for (let i = 0; i < 3; i++) sparkle(c, 560 + i * 60, 720 - i * 30, 0.5, T.t * 3 + i);
  },
  s23(c, T) {
    bgBurst(c, T.g);
    const ts = T.find(/contae/), press = clamp(1 - Math.abs(T.t - ts - 0.15) / 0.15);
    person(c, BENTO, { x: 540, y: 1880, s: 0.98, t: T.g, pose: 'wave', expr: 'smile', talk: 0.6 });
    const followed = T.t > ts + 0.25;
    within(c, 540, 520, 0, pop(T.t, 0.1) * (1 - press * 0.12), (c) => {
      box(c, -260, -70, 520, 140, 70, followed ? '#9a9da5' : C.red, 11);
      stroked(c, followed ? 'SEGUINDO ✓' : 'SEGUIR', 0, 4, { size: 84, fill: '#fff', lw: 12 });
    });
    text(c, '@BentoContaê', 540, 680, { size: 60, font: FONT_CAP, fill: '#fff' });
  },
  s24(c, T) {
    const tc = T.find(/calcada/), k = E.inout(ramp(T.t, 0, tc));
    bgStreet(c, T.g, { offset: (1 - k) * 500 });
    const stop = T.t > tc;
    const tl = ramp(T.t, tc, tc + 0.4);
    if (T.t > tc - 0.3) { wallet(c, 760, 1800, 0.65, 0.2, { open: 0, notes: 0 }); if (T.t > T.find('novo') - 0.1) sparkle(c, 820, 1740, 0.6 * (0.7 + 0.3 * Math.sin(T.t * 10)), T.t * 2); }
    person(c, BRUNO, { x: lerp(200, 540, k), y: 1840, s: 1.04, t: T.g, pose: 'walk', walk: stop ? 0 : T.t * 1.6, expr: tl > 0.5 ? 'surprised' : 'smile', look: tl * 0.6, lookY: tl, nod: tl });
  },
};

export const OVERLAY = (c, T) => { if (['s01', 's02', 's03'].includes(T.id)) badge(c); flash(c, T.id === 's10' ? 0.9 * (1 - T.t / 0.2) : 0); };

// efeitos sonoros: palavra (ou regex) dentro do plano + deslocamento em segundos
export const CUES = [
  { shot: 's01', word: 'carteira', sfx: 'sparkle' }, { shot: 's01', word: 'dois', sfx: 'pop' },
  { shot: 's02', at: 0.1, sfx: 'whoosh' }, { shot: 's02', at: 0.45, sfx: 'whoosh' },
  { shot: 's03', word: 'achado', off: -0.1, sfx: 'pop' },
  { shot: 's04', word: 'jogou', sfx: 'whoosh' }, { shot: 's04', word: 'jogou', off: 0.55, sfx: 'plof' }, { shot: 's04', word: 'shopping', sfx: 'cash' },
  { shot: 's05', word: /tenis/, sfx: 'pop' }, { shot: 's05', word: 'fone', sfx: 'pop' }, { shot: 's05', word: 'churrasco', sfx: 'pop' },
  { shot: 's06', at: 0, sfx: 'whoosh' }, { shot: 's06', word: 'foto', sfx: 'tap' }, { shot: 's06', word: /hoje/, sfx: 'ding' },
  { shot: 's07', word: /^rg$/, sfx: 'sparkle' },
  { shot: 's08', word: /camera/, sfx: 'record' },
  { shot: 's09', word: 'boletim', sfx: 'stamp' },
  { shot: 's10', at: 0, sfx: 'whoosh' }, { shot: 's10', word: /intimacao/, sfx: 'siren' },
  { shot: 's11', at: 0, sfx: 'whoosh' }, { shot: 's11', word: 'bento', sfx: 'pop' },
  { shot: 's12', at: 0.05, sfx: 'pop' }, { shot: 's12', word: /^nao$/, n: 1, sfx: 'stamp' },
  { shot: 's13', word: 'artigo', sfx: 'pop' },
  { shot: 's14', word: 'quinze', sfx: 'tick' }, { shot: 's14', word: /apropriacao/, sfx: 'pop' },
  { shot: 's15', word: 'ano', sfx: 'stamp' },
  { shot: 's16', word: 'devolver', sfx: 'whoosh' },
  { shot: 's17', at: 0, sfx: 'music_stop' }, { shot: 's17', at: 0.05, sfx: 'boom' },
  { shot: 's18', word: 'recompensa', sfx: 'pop' }, { shot: 's18', word: 'cinco', sfx: 'ding' },
  { shot: 's19', at: 0, sfx: 'music_go' }, { shot: 's19', at: 0, sfx: 'cash' }, { shot: 's19', word: 'limpinhos', sfx: 'sparkle' }, { shot: 's19', word: 'sem', sfx: 'stamp' },
  { shot: 's20', word: 'devolve', sfx: 'ding' }, { shot: 's20', word: 'delegacia', sfx: 'stamp' },
  { shot: 's21', word: 'mas', sfx: 'stamp' },
  { shot: 's22', word: 'amigo', sfx: 'tap' },
  { shot: 's23', word: 'segue', off: 0.15, sfx: 'tap' }, { shot: 's23', word: 'segue', off: 0.25, sfx: 'ding' },
  { shot: 's24', at: -0.9, sfx: 'boing' },
];

// capas (thumbnail do Short) — layout do EP 01: frase em cima, cartão de valor, personagem inteiro, selo grande
function coverLayout(c, l1, l2) {
  c.save(); c.filter = 'blur(5px)'; bgStreet(c, 3); c.restore();
  const g = c.createLinearGradient(0, 0, 0, 700); g.addColorStop(0, 'rgba(40,25,10,0.55)'); g.addColorStop(1, 'rgba(40,25,10,0)'); c.fillStyle = g; c.fillRect(0, 0, W, 700);
  // personagem: carteira aberta com dinheiro na mão
  person(c, BRUNO, { x: 540, y: 1890, s: 1.1, t: 0.3, pose: 'holdUp', expr: 'surprised', look: 0.35, blink: 0, hold: (c) => wallet(c, 40, 45, 0.95, 0.12) });
  for (let i = 0; i < 4; i++) sparkle(c, 860 + Math.cos(i * 1.6) * 130, 1250 + Math.sin(i * 1.6) * 110, 0.75, i);
  // cartão de valor acima da cabeça
  within(c, 540, 700, 0, 1, (c) => {
    box(c, -400, -110, 800, 220, 50, 'rgba(0,0,0,0.25)', 0); box(c, -412, -122, 824, 230, 50, C.paper, 14);
    within(c, -280, -8, 0, 0.62, (c) => wallet(c, 0, 0, 1, 0, { notes: 0.7 }));
    text(c, 'Achou na calçada', -150, -42, { size: 62, align: 'left', fill: C.ink });
    text(c, 'R$ 2.000,00', -150, 40, { size: 80, align: 'left', fill: '#1f8f6b' });
  });
  // frase em cima
  within(c, 540, 0, -0.03, 1, (c) => { stroked(c, l1, 0, 300, { size: 160, fill: '#fff', lw: 34, maxW: 960 }); stroked(c, l2, 0, 460, { size: 175, fill: C.yellow, lw: 36, maxW: 1000 }); });
  // selo grande
  c.font = `64px ${FONT_UI}`; const bw = c.measureText('FICÇÃO · SITUAÇÃO REAL').width + 110;
  box(c, W / 2 - bw / 2, 1470, bw, 104, 52, C.blue, 13); text(c, 'FICÇÃO · SITUAÇÃO REAL', W / 2, 1524, { size: 64, fill: '#fff' });
}
export const COVERS = [
  (c) => coverLayout(c, 'ACHOU 2 MIL', 'NA CALÇADA!'),
  (c) => coverLayout(c, 'ACHOU? É SEU?', 'CUIDADO!'),
  (c) => coverLayout(c, 'ACHADO NÃO É', 'ROUBADO?'),
];
