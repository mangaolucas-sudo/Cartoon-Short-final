// Phone screens + paper props, drawn in Canvas2D (generic bank app, no real brand). Pure functions of a state object.
export const SW = 720, SH = 1480;
const BANK = '#0f7b6c', BANK_D = '#0a5a4f', RED = '#e0322b', INK = '#1d1a22';
const F = (w, px) => `${w} ${px}px Inter, Arial, sans-serif`;
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const txt = (g, s, x, y, font, col = INK, align = 'left') => { g.font = font; g.fillStyle = col; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, y); };
const status = (g, dark = false, clock = '09:41') => {
  txt(g, clock, 60, 50, F(700, 32), dark ? '#fff' : INK);
  g.fillStyle = dark ? '#fff' : INK; for (let i = 0; i < 4; i++) g.fillRect(560 + i * 14, 58 - i * 7, 9, 8 + i * 7);
  rr(g, 630, 36, 52, 26, 6); g.lineWidth = 3; g.strokeStyle = dark ? '#fff' : INK; g.stroke(); g.fillRect(634, 40, 36, 18);
};
const header = (g, title) => {
  g.fillStyle = BANK; g.fillRect(0, 0, SW, 210);
  status(g, true);
  txt(g, '‹', 46, 140, F(400, 80), '#fff'); txt(g, title, SW / 2, 142, F(800, 44), '#fff', 'center');
};
const keypad = (g, y0, pressed = -1) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫'];
  g.fillStyle = '#e9edf0'; g.fillRect(0, y0, SW, SH - y0);
  const kw = 210, kh = (SH - y0 - 60) / 4;
  keys.forEach((k, i) => {
    const c = i % 3, r = (i / 3) | 0, x = 30 + c * (kw + 15), y = y0 + 20 + r * kh;
    rr(g, x, y, kw, kh - 14, 22); g.fillStyle = i === pressed ? '#bfe6df' : '#ffffff'; g.fill();
    g.lineWidth = 2; g.strokeStyle = '#cdd5da'; g.stroke();
    txt(g, k, x + kw / 2, y + (kh - 14) / 2, F(600, 64), INK, 'center');
  });
};
// the Pix key: phone number; digit index 9 is the swapped one (typed 7 instead of 1)
export const KEY_DIGITS = '11987453771'.split('');
export const WRONG = 9;
const keyString = (n) => { // first n digits typed -> "(11) 98745-3721" layout
  const d = KEY_DIGITS.slice(0, n); const out = [];
  d.forEach((c, i) => { if (i === 0) out.push('('); out.push({ c, i }); if (i === 1) out.push(') '); if (i === 6) out.push('-'); });
  return out;
};
const drawPix = (g, s) => {
  header(g, 'Pix · Transferir');
  g.fillStyle = '#ffffff'; g.fillRect(0, 210, SW, 560);
  txt(g, 'Chave Pix (celular)', 60, 280, F(600, 32), '#5c6670');
  rr(g, 40, 310, SW - 80, 130, 22); g.fillStyle = '#f4f7f8'; g.fill(); g.lineWidth = 4; g.strokeStyle = s.blink ? RED : BANK; g.stroke();
  // typed key, one glyph at a time
  g.font = F(800, 62); g.textBaseline = 'middle'; g.textAlign = 'left';
  let x = 70; const y = 377;
  for (const part of keyString(s.typed)) {
    const ch = typeof part === 'string' ? part : part.c, bad = typeof part !== 'string' && part.i === WRONG;
    const w = g.measureText(ch).width;
    if (bad && s.wrong) {
      if (s.blink) { rr(g, x - 6, y - 44, w + 12, 88, 12); g.fillStyle = RED; g.fill(); g.fillStyle = '#fff'; }
      else g.fillStyle = RED;
    } else g.fillStyle = INK;
    g.fillText(ch, x, y); x += w;
  }
  if (s.cursor) { g.fillStyle = BANK; g.fillRect(x + 4, y - 36, 5, 72); }
  txt(g, 'Valor', 60, 500, F(600, 32), '#5c6670');
  txt(g, 'R$ 1.200,00', 60, 568, F(900, 72), INK);
  txt(g, 'Aluguel de novembro', 60, 640, F(500, 30), '#5c6670');
  rr(g, 40, 680, SW - 80, 80, 40); g.fillStyle = BANK; g.fill(); txt(g, 'Continuar', SW / 2, 721, F(800, 36), '#fff', 'center');
  keypad(g, 790, s.pressed ?? -1);
};
const drawReceipt = (g, s) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, SW, SH); status(g);
  g.beginPath(); g.arc(SW / 2, 270, 90, 0, 7); g.fillStyle = '#1fa463'; g.fill();
  g.lineWidth = 22; g.strokeStyle = '#fff'; g.lineCap = 'round'; g.beginPath(); g.moveTo(SW / 2 - 40, 272); g.lineTo(SW / 2 - 8, 304); g.lineTo(SW / 2 + 46, 238); g.stroke();
  txt(g, 'Pix enviado', SW / 2, 420, F(800, 50), INK, 'center');
  txt(g, 'R$ 1.200,00', SW / 2, 510, F(900, 78), INK, 'center');
  g.fillStyle = '#e3e8ea'; g.fillRect(60, 580, SW - 120, 3);
  txt(g, 'Para', 70, 650, F(600, 34), '#5c6670');
  rr(g, 50, 685, SW - 100, 150, 24); g.fillStyle = s.hl ? '#ffe9a8' : '#f4f7f8'; g.fill();
  if (s.hl) { g.lineWidth = 6; g.strokeStyle = '#f2a516'; g.stroke(); }
  txt(g, 'Marcos ***', 80, 760, F(900, 66), INK);
  txt(g, 'CPF ***.482.***-**', 70, 885, F(600, 34), '#5c6670');
  txt(g, 'Chave: (11) 98745-3771', 70, 940, F(600, 34), '#5c6670');
  txt(g, 'Hoje, 09:38', 70, 995, F(600, 34), '#5c6670');
  rr(g, 50, 1300, SW - 100, 100, 50); g.fillStyle = BANK; g.fill(); txt(g, 'Compartilhar', SW / 2, 1351, F(800, 38), '#fff', 'center');
};
const drawCall = (g, s) => {
  const gr = g.createLinearGradient(0, 0, 0, SH); gr.addColorStop(0, '#24354a'); gr.addColorStop(1, '#0f1720'); g.fillStyle = gr; g.fillRect(0, 0, SW, SH);
  status(g, true);
  txt(g, 'chamada recebida', SW / 2, 230, F(500, 36), '#b9c6d3', 'center');
  g.beginPath(); g.arc(SW / 2, 470, 150 + (s.pulse || 0) * 26, 0, 7); g.fillStyle = 'rgba(255,255,255,.08)'; g.fill();
  g.beginPath(); g.arc(SW / 2, 470, 130, 0, 7); g.fillStyle = '#c98b5a'; g.fill();
  txt(g, 'SJ', SW / 2, 474, F(900, 96), '#fff', 'center');
  txt(g, 'Seu Jorge', SW / 2, 700, F(900, 70), '#fff', 'center');
  txt(g, '– Aluguel', SW / 2, 790, F(800, 56), '#ffd36b', 'center');
  for (const [x, col, rot] of [[180, RED, 2.35], [540, '#1fa463', 0]]) {
    g.beginPath(); g.arc(x, 1230, 90, 0, 7); g.fillStyle = col; g.fill();
    g.save(); g.translate(x, 1230); g.rotate(rot); g.fillStyle = '#fff'; rr(g, -44, -14, 88, 28, 14); g.fill(); g.fillRect(-48, -14, 22, 34); g.fillRect(26, -14, 22, 34); g.restore();
  }
};
const drawDetail = (g, s) => { // transaction detail with Contestar / Devolver
  header(g, s.received ? 'Pix recebido' : 'Detalhes do Pix');
  g.fillStyle = '#fff'; g.fillRect(0, 210, SW, SH - 210);
  txt(g, s.received ? 'Você recebeu' : 'Você enviou', 60, 290, F(600, 34), '#5c6670');
  txt(g, 'R$ 1.200,00', 60, 370, F(900, 78), INK);
  txt(g, s.received ? 'De: Juliana S.' : 'Para: Marcos ***', 60, 460, F(700, 40), INK);
  txt(g, 'Hoje, 09:38', 60, 520, F(500, 32), '#5c6670');
  g.fillStyle = '#e3e8ea'; g.fillRect(60, 580, SW - 120, 3);
  const btn = (y, label, on, col) => {
    if (on) { g.save(); g.shadowColor = col; g.shadowBlur = 50; rr(g, 50, y, SW - 100, 130, 30); g.fillStyle = col; g.fill(); g.restore(); }
    rr(g, 50, y, SW - 100, 130, 30); g.fillStyle = on ? col : '#f4f7f8'; g.fill(); g.lineWidth = on ? 8 : 3; g.strokeStyle = on ? '#ffffff' : '#cdd5da'; g.stroke();
    txt(g, label, SW / 2, y + 66, F(900, on ? 74 : 46), on ? '#fff' : '#7a848c', 'center');
  };
  if (s.received) { btn(630, 'DEVOLVER', true, '#1fa463'); btn(830, 'Comprovante', false); btn(1010, 'Ajuda', false); }
  else { btn(650, 'Contestar', !!s.press, BANK_D); btn(830, 'Comprovante', false); btn(1010, 'Ajuda', false); }
  if (s.warn > 0) { // red warning popup
    const k = s.warn; g.fillStyle = `rgba(0,0,0,${0.55 * k})`; g.fillRect(0, 0, SW, SH);
    g.save(); g.translate(SW / 2, 760); g.scale(0.7 + 0.3 * k, 0.7 + 0.3 * k); g.globalAlpha = k;
    rr(g, -310, -330, 620, 660, 40); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 10; g.strokeStyle = RED; g.stroke();
    rr(g, -310, -330, 620, 150, [40, 40, 0, 0]); g.fillStyle = RED; g.fill();
    txt(g, '⚠  ATENÇÃO', 0, -255, F(900, 54), '#fff', 'center');
    txt(g, 'Contestação é só', 0, -120, F(800, 44), INK, 'center');
    txt(g, 'para golpe ou fraude.', 0, -62, F(800, 44), INK, 'center');
    txt(g, 'Erro de digitação', 0, 20, F(600, 40), '#5c6670', 'center');
    txt(g, 'não se enquadra.', 0, 70, F(600, 40), '#5c6670', 'center');
    rr(g, -240, 170, 480, 100, 50); g.fillStyle = RED; g.fill(); txt(g, 'Entendi', 0, 221, F(800, 42), '#fff', 'center');
    g.restore();
  }
};
const drawLock = (g, s) => {
  const gr = g.createLinearGradient(0, 0, 0, SH); gr.addColorStop(0, '#3d4f8a'); gr.addColorStop(1, '#c76d6d'); g.fillStyle = gr; g.fillRect(0, 0, SW, SH);
  status(g, true, '');
  txt(g, '09:12', SW / 2, 300, F(300, 190), '#fff', 'center');
  txt(g, 'quinta-feira, dia 3', SW / 2, 420, F(600, 40), '#e9ecff', 'center');
  if (s.notif > 0) {
    const k = s.notif, y = 560 - (1 - k) * 260;
    g.save(); g.globalAlpha = Math.min(1, k * 1.5);
    rr(g, 30, y, SW - 60, 400, 36); g.fillStyle = 'rgba(255,255,255,.96)'; g.fill();
    g.beginPath(); g.arc(100, y + 70, 34, 0, 7); g.fillStyle = '#1fa463'; g.fill(); txt(g, '✉', 100, y + 72, F(700, 36), '#fff', 'center');
    txt(g, 'Mensagens · agora', 150, y + 70, F(600, 30), '#5c6670');
    txt(g, 'Marcos', 60, y + 145, F(900, 46), INK);
    txt(g, 'Recebi seu dinheiro.', 60, y + 210, F(600, 38), INK);
    txt(g, 'Devolvo... se você me', 60, y + 265, F(600, 38), INK);
    txt(g, 'mandar R$ 200 pelo', 60, y + 320, F(600, 38), INK);
    txt(g, 'incômodo. 😏', 60, y + 372, F(600, 38), INK);
    g.restore();
  }
};
export const drawScreen = (g, s) => {
  g.save(); g.clearRect(0, 0, SW, SH);
  ({ pix: drawPix, receipt: drawReceipt, call: drawCall, detail: drawDetail, lock: drawLock }[s.kind] || drawLock)(g, s);
  g.restore();
};
/** paper with PROTOCOLO (attendant holds it up) */
export const PW = 800, PH = 560;
export const drawPaper = (g) => {
  g.fillStyle = '#fbf8ef'; g.fillRect(0, 0, PW, PH);
  g.fillStyle = '#e8e2cf'; for (let i = 0; i < 6; i++) g.fillRect(60, 330 + i * 36, PW - 120, 5);
  txt(g, 'PROTOCOLO', PW / 2, 120, F(900, 112), '#c0392b', 'center');
  g.fillStyle = '#c0392b'; g.fillRect(90, 190, PW - 180, 8);
  txt(g, 'Nº 2026 1126 0458', PW / 2, 262, F(800, 56), INK, 'center');
  g.lineWidth = 12; g.strokeStyle = INK; g.strokeRect(6, 6, PW - 12, PH - 12);
};
/** wall calendar page: big day number */
export const CW_ = 400, CH_ = 440;
export const drawCalPage = (g, day) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, CW_, CH_);
  g.fillStyle = '#d23a32'; g.fillRect(0, 0, CW_, 110); txt(g, 'NOVEMBRO', CW_ / 2, 58, F(900, 52), '#fff', 'center');
  txt(g, String(day), CW_ / 2, 280, F(900, 230), INK, 'center');
  txt(g, 'DIA', CW_ / 2, 405, F(800, 38), '#5c6670', 'center');
  g.lineWidth = 8; g.strokeStyle = INK; g.strokeRect(4, 4, CW_ - 8, CH_ - 8);
};
