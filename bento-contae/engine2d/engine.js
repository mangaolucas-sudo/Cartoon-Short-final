// Bento Contaê — motor 2D (estilo "Ficção · Situação Real")
// Tudo é função pura do tempo: a story define shots; renderFrame(f) desenha o quadro f.
export const W = 1080, H = 1920, FPS = 30;
export const C = {
  ink: '#262321', white: '#ffffff', paper: '#fbf4e2', cream: '#f7e7bb', creamDot: '#efd9a0',
  wall: '#f2dab0', wallDark: '#e6c48c', floor: '#b57d4f', floorDark: '#99653c', win: '#a8d2e8', winDark: '#8cbfdb',
  sky: '#cde7f6', skyDot: '#b9dcf0', orange: '#ea6f1c', orange2: '#f58d33', green: '#2c9877', green2: '#3cab8a',
  yellow: '#ffd23a', red: '#e0443a', redDark: '#b8302a', blue: '#2f6fd0', blueDark: '#24519c',
  money: '#93d58c', moneyDark: '#3f8f4c', grey: '#8d9199', greyLight: '#c9ccd2', brown: '#8a5733', brownDark: '#6b4024',
  street: '#5d6168', sidewalk: '#d7cfc1', sidewalkDark: '#bfb5a4',
};
export const FONT_CAP = '"Lilita"', FONT_UI = '"Fredoka"';

// ---------- math ----------
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ramp = (t, a, b) => clamp((t - a) / (b - a));
export const E = {
  out: (t) => 1 - (1 - clamp(t)) ** 3,
  inout: (t) => { t = clamp(t); return t * t * (3 - 2 * t); },
  back: (t) => { t = clamp(t); const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; },
  elastic: (t) => { t = clamp(t); return t === 0 || t === 1 ? t : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1; },
};
// escala de "pop" que começa em t0 (segundos)
export const pop = (t, t0, d = 0.32) => (t < t0 ? 0 : E.back((t - t0) / d));
export const wob = (t, f = 1, a = 1, ph = 0) => Math.sin((t * f + ph) * Math.PI * 2) * a;

// ---------- primitivas com contorno ----------
export function rrect(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
export function shape(c, path, fill, lw = 9, stroke = C.ink) {
  c.beginPath(); path(c);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (lw) { c.lineWidth = lw; c.strokeStyle = stroke; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
}
export const circle = (c, x, y, r, fill, lw = 9) => shape(c, (c) => c.arc(x, y, r, 0, Math.PI * 2), fill, lw);
export const ellipse = (c, x, y, rx, ry, fill, lw = 9, rot = 0) => shape(c, (c) => c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2), fill, lw);
export const box = (c, x, y, w, h, r, fill, lw = 9) => shape(c, (c) => rrect(c, x, y, w, h, r), fill, lw);
export function line(c, pts, w, col = C.ink) {
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) c.lineTo(p[0], p[1]);
  c.lineWidth = w; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
}
// traço grosso com contorno (membros)
export function limb(c, pts, w, fill, lw = 9) { line(c, pts, w + lw * 2, C.ink); line(c, pts, w, fill); }
export function within(c, x, y, rot, s, fn) { c.save(); c.translate(x, y); if (rot) c.rotate(rot); if (s !== undefined && s !== 1) c.scale(s, s); fn(c); c.restore(); }

// texto com contorno grosso (estilo legenda)
export function stroked(c, txt, x, y, { size = 90, font = FONT_CAP, fill = '#fff', stroke = C.ink, lw = 16, align = 'center', base = 'middle', maxW = 0, spacing = 0 } = {}) {
  c.font = `${size}px ${font}`;
  if (maxW) { const w = c.measureText(txt).width; if (w > maxW) { size *= maxW / w; c.font = `${size}px ${font}`; } }
  c.textAlign = align; c.textBaseline = base; c.letterSpacing = spacing + 'px';
  c.lineJoin = 'round'; c.miterLimit = 2;
  if (lw) { c.lineWidth = lw; c.strokeStyle = stroke; c.strokeText(txt, x, y); }
  c.fillStyle = fill; c.fillText(txt, x, y); c.letterSpacing = '0px';
  return size;
}
export function text(c, txt, x, y, { size = 40, font = FONT_UI, fill = C.ink, align = 'center', base = 'middle', maxW = 0 } = {}) {
  c.font = `${size}px ${font}`;
  if (maxW) { const w = c.measureText(txt).width; if (w > maxW) { size *= maxW / w; c.font = `${size}px ${font}`; } }
  c.textAlign = align; c.textBaseline = base; c.fillStyle = fill; c.fillText(txt, x, y);
}

// ---------- fundos ----------
function vignette(c, col = 'rgba(80,40,10,0.18)') {
  const g = c.createRadialGradient(W / 2, H * 0.45, H * 0.25, W / 2, H * 0.5, H * 0.8);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, col); c.fillStyle = g; c.fillRect(0, 0, W, H);
}
export function bgDots(c, base, dot, t = 0) {
  c.fillStyle = base; c.fillRect(0, 0, W, H);
  c.fillStyle = dot;
  for (let y = 40; y < H; y += 120) for (let x = (y / 120) % 2 ? 100 : 40; x < W; x += 120) { c.beginPath(); c.arc(x, y + wob(t, 0.2, 4, x * 0.01), 7, 0, Math.PI * 2); c.fill(); }
  vignette(c);
}
export function bgBurst(c, t, a = C.orange, b = C.orange2, cx = W / 2, cy = H * 0.42, ring = true) {
  c.fillStyle = a; c.fillRect(0, 0, W, H);
  c.save(); c.translate(cx, cy); c.rotate(t * 0.12); c.fillStyle = b;
  const n = 16;
  for (let i = 0; i < n; i++) { c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 2600, (i / n) * Math.PI * 2, ((i + 0.5) / n) * Math.PI * 2); c.closePath(); c.fill(); }
  c.restore();
  if (ring) { c.beginPath(); c.arc(cx, cy, 430 + wob(t, 0.5, 6), 0, Math.PI * 2); c.lineWidth = 7; c.strokeStyle = 'rgba(255,240,220,0.85)'; c.stroke(); }
  vignette(c, 'rgba(60,20,0,0.25)');
}
// sala (parede + janela + quadro + piso). floorY = linha do rodapé
export function bgRoom(c, t, { floorY = 1500, win = [620, 380, 380, 420], painting = [40, 560, 250, 180], tint = null } = {}) {
  c.fillStyle = C.wall; c.fillRect(0, 0, W, floorY);
  const g = c.createRadialGradient(W * 0.5, floorY * 0.45, 100, W * 0.5, floorY * 0.5, 1100);
  g.addColorStop(0, 'rgba(255,248,230,0.55)'); g.addColorStop(1, 'rgba(200,150,90,0.25)'); c.fillStyle = g; c.fillRect(0, 0, W, floorY);
  if (win) {
    const [x, y, w, h] = win;
    box(c, x, y, w, h, 10, C.win, 10);
    line(c, [[x + w / 2, y], [x + w / 2, y + h]], 9); line(c, [[x, y + h / 2], [x + w, y + h / 2]], 9);
    cloud(c, x + w * 0.3 + wob(t, 0.05, 10), y + h * 0.24, 0.6);
  }
  if (painting) {
    const [x, y, w, h] = painting;
    box(c, x, y, w, h, 8, C.yellow, 10);
    shape(c, (c) => { c.moveTo(x + 14, y + h - 14); c.lineTo(x + w * 0.38, y + h * 0.42); c.lineTo(x + w * 0.58, y + h * 0.66); c.lineTo(x + w * 0.74, y + h * 0.5); c.lineTo(x + w - 14, y + h - 14); c.closePath(); }, '#4f9a59', 0);
  }
  // piso de tábuas
  c.fillStyle = C.floor; c.fillRect(0, floorY, W, H - floorY);
  for (let i = -6; i < 14; i++) { const x0 = W / 2 + i * 150; line(c, [[x0 + (x0 - W / 2) * 0.0, floorY], [W / 2 + (x0 - W / 2) * 1.6, H]], 3, 'rgba(70,35,10,0.35)'); }
  line(c, [[0, floorY], [W, floorY]], 10);
  if (tint) { c.fillStyle = tint; c.fillRect(0, 0, W, H); }
}
export function cloud(c, x, y, s = 1) {
  within(c, x, y, 0, s, (c) => shape(c, (c) => { c.arc(-55, 20, 45, Math.PI * 0.5, Math.PI * 1.5); c.arc(0, -10, 62, Math.PI * 1.05, Math.PI * 1.95); c.arc(60, 18, 48, Math.PI * 1.4, Math.PI * 0.5); c.closePath(); }, '#fff', 8));
}
// rua: céu, prédios, calçada, meio-fio, asfalto. sidewalkY = topo da calçada
export function bgStreet(c, t, { sidewalkY = 1430, offset = 0, cam = true } = {}) {
  const sky = c.createLinearGradient(0, 0, 0, sidewalkY); sky.addColorStop(0, '#9fd1f0'); sky.addColorStop(1, '#d8eef9');
  c.fillStyle = sky; c.fillRect(0, 0, W, sidewalkY);
  cloud(c, 200 + ((t * 8 + offset * 0.2) % 1400) - 200, 230, 1.1); cloud(c, 820 - ((t * 5) % 1300) + 200, 140, 0.8);
  // prédios
  const B = [[-60, 520, 330, '#e9b48a'], [250, 380, 300, '#f2d29b'], [530, 600, 260, '#d9a3a8'], [770, 440, 380, '#bcd3a3']];
  for (const [bx0, by, bw, col] of B) {
    const bx = bx0 - offset * 0.5;
    box(c, bx, by, bw, sidewalkY - by + 20, 6, col, 10);
    for (let yy = by + 70; yy < sidewalkY - 200; yy += 190) for (let xx = bx + 50; xx < bx + bw - 80; xx += 130) box(c, xx, yy, 66, 92, 6, C.win, 7);
  }
  c.fillStyle = 'rgba(255,250,240,0.28)'; c.fillRect(0, 0, W, sidewalkY);
  // calçada
  c.fillStyle = C.sidewalk; c.fillRect(0, sidewalkY, W, 330);
  for (let x = -((offset) % 160); x < W; x += 160) line(c, [[x, sidewalkY], [x - 60, sidewalkY + 330]], 4, C.sidewalkDark);
  line(c, [[0, sidewalkY + 150], [W, sidewalkY + 150]], 4, C.sidewalkDark);
  line(c, [[0, sidewalkY], [W, sidewalkY]], 10);
  c.fillStyle = '#a49a8a'; c.fillRect(0, sidewalkY + 330, W, 40); line(c, [[0, sidewalkY + 330], [W, sidewalkY + 330]], 8);
  c.fillStyle = C.street; c.fillRect(0, sidewalkY + 370, W, H);
  for (let x = -((offset * 1.2) % 300); x < W; x += 300) box(c, x, sidewalkY + 440, 160, 22, 8, '#e9e3d3', 0);
}

// ---------- personagens ----------
// spec: { skin, hair:'short'|'quiff'|'slick'|'bald'|'grey', hairCol, shirt, emblem, pants, shoes, suit:{jacket, tie, stripes}, glasses, mustache }
export const POSES = {
  down: { L: [8, 0], R: [8, 0] },
  hold: { L: [8, 0], R: [22, -70] },          // segura objeto à frente/lado direito da tela
  holdUp: { L: [8, 0], R: [35, -120] },       // objeto na altura do peito/rosto
  point: { L: [8, 0], R: [150, 15] },         // indicador pra cima
  handsHead: { L: [150, 115], R: [150, 115] },
  shrug: { L: [55, -95], R: [55, -95] },
  give: { L: [8, 0], R: [72, -15] },
  giveBoth: { L: [70, -20], R: [70, -20] },
  wave: { L: [8, 0], R: [165, -25] },
  hips: { L: [40, 70], R: [40, 70] },
  walk: { L: [12, -10], R: [12, -10] },
};
const D2R = Math.PI / 180;
export function person(c, P, o) {
  const { x, y, s = 1, t = 0, expr = 'neutral', look = 0, lookY = 0, flip = false, hold = null, holdL = null, blink = null, talk = 0, breath = 1 } = o;
  let pose = typeof o.pose === 'string' ? POSES[o.pose] : (o.pose || POSES.down);
  if (o.pose2 && o.poseMix !== undefined) { const p2 = typeof o.pose2 === 'string' ? POSES[o.pose2] : o.pose2; const m = o.poseMix; pose = { L: [lerp(pose.L[0], p2.L[0], m), lerp(pose.L[1], p2.L[1], m)], R: [lerp(pose.R[0], p2.R[0], m), lerp(pose.R[1], p2.R[1], m)] }; }
  const br = Math.sin(t * Math.PI * 2 * 0.35 + (P.seed || 0)) * 0.012 * breath;
  c.save(); c.translate(x, y); c.scale(flip ? -s : s, s);
  const walkPh = o.walk ? Math.sin(o.walk * Math.PI * 2) : 0;
  // sombra
  c.fillStyle = 'rgba(40,20,0,0.18)'; c.beginPath(); c.ellipse(0, 6, 150, 24, 0, 0, Math.PI * 2); c.fill();
  // pernas
  const legTop = -330, legW = 70;
  for (const sd of [-1, 1]) {
    const lift = o.walk ? Math.max(0, sd * walkPh) * 26 : 0;
    box(c, sd * 42 - legW / 2, legTop, legW, 300 - lift, 14, P.pants || '#355a9c', 9);
    ellipse(c, sd * 50, -22 - lift, 62, 28, P.shoes || C.ink, 7);
  }
  // tronco
  c.save(); c.translate(0, legTop); c.scale(1, 1 + br); c.translate(0, -legTop);
  const tw = 250, th = 290, ty = -615;
  const jacket = P.suit ? P.suit.jacket : P.shirt;
  shape(c, (c) => { c.moveTo(-tw / 2 + 10, ty + 40); c.quadraticCurveTo(-tw / 2, ty, -tw / 2 + 60, ty); c.lineTo(tw / 2 - 60, ty); c.quadraticCurveTo(tw / 2, ty, tw / 2 - 10, ty + 40); c.lineTo(tw / 2 - 8, ty + th); c.lineTo(-tw / 2 + 8, ty + th); c.closePath(); }, jacket, 9);
  if (P.suit) {
    if (P.suit.stripes) { c.save(); c.beginPath(); rrect(c, -tw / 2 + 12, ty + 6, tw - 24, th - 10, 20); c.clip(); for (let xx = -tw / 2 + 25; xx < tw / 2; xx += 26) line(c, [[xx, ty], [xx, ty + th]], 2, 'rgba(255,255,255,0.12)'); c.restore(); }
    shape(c, (c) => { c.moveTo(-38, ty + 2); c.lineTo(0, ty + 120); c.lineTo(38, ty + 2); c.closePath(); }, '#fff', 7);
    shape(c, (c) => { c.moveTo(-12, ty + 22); c.lineTo(12, ty + 22); c.lineTo(17, ty + 150); c.lineTo(0, ty + 175); c.lineTo(-17, ty + 150); c.closePath(); }, P.suit.tie, 6);
    line(c, [[-40, ty + 2], [-8, ty + 160]], 7); line(c, [[40, ty + 2], [8, ty + 160]], 7);
    line(c, [[0, ty + 175], [0, ty + th]], 6);
    if (P.suit.pocket) shape(c, (c) => { c.moveTo(62, ty + 95); c.lineTo(72, ty + 80); c.lineTo(82, ty + 95); c.lineTo(92, ty + 80); c.lineTo(100, ty + 95); c.closePath(); }, '#fff', 4);
  } else {
    shape(c, (c) => { c.moveTo(-42, ty + 2); c.quadraticCurveTo(0, ty + 46, 42, ty + 2); }, null, 7);
    if (P.emblem) circle(c, 0, ty + 150, 30, P.emblem, 7);
    if (P.stripe) { c.fillStyle = P.stripe; c.fillRect(-tw / 2 + 12, ty + 120, tw - 24, 34); line(c, [[-tw / 2 + 12, ty + 120], [tw / 2 - 12, ty + 120]], 5); line(c, [[-tw / 2 + 12, ty + 154], [tw / 2 - 12, ty + 154]], 5); }
  }
  // braços
  const sh = { L: [-tw / 2 + 18, ty + 34], R: [tw / 2 - 18, ty + 34] };
  const handPos = {};
  for (const side of ['L', 'R']) {
    const sd = side === 'R' ? 1 : -1, [a1, a2] = pose[side];
    let A1 = a1, A2 = a2;
    if (o.walk) A1 += sd * walkPh * -12;
    const p0 = sh[side];
    const p1 = [p0[0] + Math.sin(A1 * D2R) * 140 * sd, p0[1] + Math.cos(A1 * D2R) * 140];
    const p2 = [p1[0] + Math.sin((A1 + A2) * D2R) * 130 * sd, p1[1] + Math.cos((A1 + A2) * D2R) * 130];
    limb(c, [p0, p1, p2], 44, jacket);
    handPos[side] = p2;
  }
  c.restore();
  // pescoço + cabeça
  const hy = -768 + Math.sin(t * Math.PI * 2 * 0.5 + (P.seed || 0)) * 3 + (o.nod || 0) * 10;
  box(c, -26, -650, 52, 50, 10, P.skin, 8);
  head(c, P, 0, hy, { expr, look, lookY, t, blink, talk });
  // mãos por cima
  for (const side of ['L', 'R']) {
    const [hx, hy2] = handPos[side];
    const fn = side === 'R' ? hold : holdL;
    if (fn) { c.save(); c.translate(hx, hy2); if (flip) c.scale(-1, 1); fn(c); c.restore(); }
    circle(c, hx, hy2, 27, P.skin, 8);
    if (side === 'R' && pose === POSES.point) { box(c, hx - 8, hy2 - 62, 18, 46, 9, P.skin, 6); }
  }
  c.restore();
}
export function head(c, P, x, y, { expr = 'neutral', look = 0, lookY = 0, t = 0, blink = null, talk = 0 }) {
  const r = 132;
  circle(c, x - r + 4, y + 10, 30, P.skin, 8); circle(c, x + r - 4, y + 10, 30, P.skin, 8);
  circle(c, x, y, r, P.skin, 10);
  const hc = P.hairCol || '#3b2416';
  if (P.hair === 'short' || P.hair === 'quiff') {
    shape(c, (c) => { c.arc(x, y + 4, r + 3, Math.PI * 1.1, Math.PI * 1.9); c.quadraticCurveTo(x + r * 0.55, y - r * 0.32, x, y - r * 0.42); c.quadraticCurveTo(x - r * 0.55, y - r * 0.32, x - r * 0.93, y - r * 0.27); c.closePath(); }, hc, 9);
    if (P.hair === 'quiff') shape(c, (c) => { c.moveTo(x - 60, y - r + 18); c.quadraticCurveTo(x - 30, y - r - 46, x + 50, y - r - 22); c.quadraticCurveTo(x + 30, y - r + 4, x + 30, y - r + 26); c.closePath(); }, hc, 9);
  } else if (P.hair === 'slick') {
    shape(c, (c) => { c.arc(x, y + 4, r + 4, Math.PI * 1.02, Math.PI * 1.98); c.quadraticCurveTo(x + r * 0.7, y - r * 0.55, x - r * 0.1, y - r * 0.62); c.quadraticCurveTo(x - r * 0.75, y - r * 0.5, x - r - 2, y - 6); c.closePath(); }, hc, 9);
    line(c, [[x - 30, y - r + 6], [x - 10, y - r * 0.62]], 5, 'rgba(255,255,255,0.25)');
  } else if (P.hair === 'bald' || P.hair === 'grey') {
    const hcol = P.hair === 'grey' ? '#c9c6c0' : (P.hairCol || '#9a9a9a');
    for (const sd of [-1, 1]) shape(c, (c) => { c.ellipse(x + sd * (r - 14), y - 30, 26, 52, sd * 0.25, 0, Math.PI * 2); }, hcol, 7);
    if (P.hair === 'grey') shape(c, (c) => { c.arc(x, y + 6, r - 2, Math.PI * 1.12, Math.PI * 1.88); c.quadraticCurveTo(x, y - r * 0.55, x - r * 0.9, y - r * 0.45); c.closePath(); }, hcol, 8);
  }
  if (P.cap) { shape(c, (c) => { c.arc(x, y - 18, r - 2, Math.PI, Math.PI * 2); c.closePath(); }, P.cap, 9); shape(c, (c) => { rrect(c, x - 20, y - 36, r + 70, 30, 14); }, P.cap, 9); }
  // olhos
  const ex = 50, ey = y + 2;
  const bl = blink !== null ? blink : blinkAt(t, P.seed || 0);
  const lx = look * 12, ly = lookY * 10;
  for (const sd of [-1, 1]) {
    const cx = x + sd * ex;
    if (expr === 'happy' || bl > 0.6) { line(c, [[cx - 22, ey + 4], [cx, ey - 10], [cx + 22, ey + 4]], 8); continue; }
    const ry = expr === 'smug' ? 18 : (expr === 'surprised' || expr === 'shock') ? 36 : 31;
    ellipse(c, cx, ey, 30, ry * (1 - bl * 0.9), '#fff', 7);
    if (bl < 0.5) circle(c, cx + lx, ey + ly + (expr === 'smug' ? 4 : 0), expr === 'shock' ? 10 : 14, C.ink, 0);
    if (expr === 'smug') line(c, [[cx - 32, ey - 6], [cx + 32, ey - 6]], 8);
  }
  if (P.glasses) { for (const sd of [-1, 1]) { c.beginPath(); c.arc(x + sd * ex, ey, 44, 0, Math.PI * 2); c.lineWidth = 8; c.strokeStyle = '#4a3a2e'; c.stroke(); } line(c, [[x - 8, ey - 4], [x + 8, ey - 4]], 7, '#4a3a2e'); }
  // sobrancelhas
  const by = ey - 52;
  const brow = { sad: [14, -10], worried: [14, -10], angry: [-16, 14], shock: [0, -16], surprised: [0, -12], smug: [-6, 4] }[expr] || [0, 0];
  for (const sd of [-1, 1]) line(c, [[x + sd * 26, by + (brow[0] * 0.5) + (expr === 'shock' ? -12 : 0)], [x + sd * 74, by + brow[1] * 0.5 + (expr === 'shock' ? -12 : 0)]], 9, P.hairCol || '#3b2416');
  // boca
  const my = y + 78;
  if (P.mustache) {
    shape(c, (c) => { c.moveTo(x, my - 26); c.bezierCurveTo(x - 30, my - 48, x - 78, my - 34, x - 84, my - 4); c.bezierCurveTo(x - 70, my - 14, x - 40, my - 6, x, my - 14); c.bezierCurveTo(x + 40, my - 6, x + 70, my - 14, x + 84, my - 4); c.bezierCurveTo(x + 78, my - 34, x + 30, my - 48, x, my - 26); c.closePath(); }, P.mustacheCol || '#2b1a10', 5);
  }
  const open = talk > 0 ? (0.5 + 0.5 * Math.sin(t * 22)) * talk : 0;
  const mY = my + (P.mustache ? 12 : 0);
  if (expr === 'surprised' || expr === 'shock' || open > 0.25) {
    const h = expr === 'shock' ? 30 : expr === 'surprised' ? 24 : 10 + open * 16;
    ellipse(c, x, mY, expr === 'shock' ? 22 : 18, h, '#5a1e1a', 7);
    ellipse(c, x, mY + h * 0.45, 10, h * 0.35, C.red, 0);
  } else if (expr === 'smile' || expr === 'happy') {
    shape(c, (c) => { c.moveTo(x - 40, mY - 8); c.quadraticCurveTo(x, mY + 38, x + 40, mY - 8); c.closePath(); }, '#5a1e1a', 7);
  } else if (expr === 'smug') {
    line(c, [[x - 30, mY + 4], [x + 10, mY + 6], [x + 38, mY - 10]], 8);
  } else if (expr === 'sad') {
    line(c, [[x - 30, mY + 14], [x, mY], [x + 30, mY + 14]], 8);
  } else if (expr === 'worried') {
    line(c, [[x - 32, mY + 6], [x - 16, mY - 2], [x, mY + 6], [x + 16, mY - 2], [x + 32, mY + 6]], 7);
  } else if (expr === 'angry') {
    line(c, [[x - 30, mY + 8], [x + 30, mY + 8]], 9);
  } else { line(c, [[x - 22, mY + 2], [x + 22, mY + 2]], 8); }
}
export function blinkAt(t, seed) { const per = 2.6 + (seed % 5) * 0.37, ph = (t + seed * 0.71) % per; return ph < 0.06 ? 0.5 : ph < 0.13 ? 1 : 0; }

// ---------- objetos ----------
export function note(c, x, y, s = 1, rot = 0, val = '100') {
  within(c, x, y, rot, s, (c) => {
    box(c, -110, -52, 220, 104, 8, C.money, 7);
    box(c, -96, -40, 192, 80, 6, null, 3);
    circle(c, 18, 2, 30, '#b8e4b2', 5); text(c, 'R$', 18, 4, { size: 26, fill: C.moneyDark });
    text(c, val, -66, -20, { size: 22, fill: C.moneyDark });
  });
}
export function wallet(c, x, y, s = 1, rot = 0, { open = 1, notes = 1, rg = false } = {}) {
  within(c, x, y, rot, s, (c) => {
    if (notes > 0) for (let i = 0; i < 3; i++) within(c, -30 + i * 30, -40 - 30 * notes - i * 6, (-0.15 + i * 0.15), 0.7, (c) => note(c, 0, 0, 1, Math.PI / 2));
    if (rg) within(c, 40, -60, 0.2, 0.55, (c) => rgCard(c, 0, 0, 1));
    box(c, -110, -70, 220, 140, 18, C.brown, 9);
    box(c, -110, -70 + 70 * (1 - open), 220, 70 * open, 14, C.brownDark, 7);
    line(c, [[-96, -58], [96, -58]], 3, 'rgba(255,230,190,0.5)');
    circle(c, 82, 0, 12, '#d9b26a', 5);
  });
}
export function rgCard(c, x, y, s = 1) {
  within(c, x, y, 0, s, (c) => {
    box(c, -140, -90, 280, 180, 14, '#a9d9b8', 8);
    box(c, -120, -60, 90, 110, 8, '#e9e2d1', 6);
    circle(c, -75, -20, 22, '#c89a74', 4); shape(c, (c) => { c.arc(-75, 40, 36, Math.PI, 0); }, '#5a7aa8', 4);
    text(c, 'RG', 60, -40, { size: 58, font: FONT_CAP, fill: C.ink });
    for (let i = 0; i < 3; i++) line(c, [[-10, 10 + i * 24], [110 - i * 20, 10 + i * 24]], 6, 'rgba(38,35,33,0.45)');
  });
}
export function trash(c, x, y, s = 1, lid = 0) {
  within(c, x, y, 0, s, (c) => {
    shape(c, (c) => { c.moveTo(-110, -260); c.lineTo(110, -260); c.lineTo(90, 0); c.lineTo(-90, 0); c.closePath(); }, '#4f9a6a', 9);
    for (const xx of [-50, 0, 50]) line(c, [[xx, -220], [xx * 0.85, -30]], 6, 'rgba(0,0,0,0.25)');
    within(c, -120, -262, -lid * 0.6, 1, (c) => { box(c, 0, -28, 240, 34, 12, '#3e7f56', 9); box(c, 95, -52, 50, 26, 10, '#3e7f56', 7); });
  });
}
export function cctv(c, x, y, s = 1, t = 0, rot = 0) {
  within(c, x, y, 0, s, (c) => {
    box(c, -18, -10, 36, 120, 8, C.greyLight, 7);
    within(c, 0, 0, rot, 1, (c) => {
      box(c, -170, -60, 210, 100, 22, '#eef0f3', 9);
      box(c, -200, -50, 50, 80, 14, C.grey, 8);
      circle(c, -205, -10, 22, '#2a3240', 6);
      circle(c, 0, -30, 13, (Math.floor(t * 2) % 2) ? C.red : '#7a2a24', 5);
    });
  });
}
export function doc(c, x, y, s = 1, rot = 0, title = 'INTIMAÇÃO') {
  within(c, x, y, rot, s, (c) => {
    shape(c, (c) => { c.moveTo(-120, -160); c.lineTo(80, -160); c.lineTo(120, -120); c.lineTo(120, 160); c.lineTo(-120, 160); c.closePath(); }, '#fff', 8);
    shape(c, (c) => { c.moveTo(80, -160); c.lineTo(80, -120); c.lineTo(120, -120); }, null, 6);
    text(c, title, 0, -110, { size: 34, font: FONT_CAP, maxW: 200 });
    for (let i = 0; i < 6; i++) line(c, [[-90, -50 + i * 34], [90 - (i % 3) * 30, -50 + i * 34]], 6, 'rgba(38,35,33,0.35)');
  });
}
export function phone(c, x, y, s = 1, rot = 0, screen = null) {
  within(c, x, y, rot, s, (c) => {
    box(c, -150, -300, 300, 600, 46, '#2c2a33', 10);
    box(c, -128, -270, 256, 540, 30, '#eef4f8', 0);
    box(c, -40, -284, 80, 14, 7, '#14131a', 0);
    if (screen) { c.save(); c.beginPath(); rrect(c, -128, -270, 256, 540, 30); c.clip(); screen(c); c.restore(); }
  });
}
// cartão de destaque (ex.: ART. 169 / CÓDIGO PENAL)
export function card(c, x, y, s, title, sub = '', { w = 560, titleCol = C.red, size = 120, subSize = 46, rot = 0, sub2 = '' } = {}) {
  if (s <= 0) return;
  within(c, x, y, rot, s, (c) => {
    const h = size * 1.05 + (sub ? subSize * 1.35 : 0) + (sub2 ? subSize * 1.25 : 0) + 50;
    box(c, -w / 2 + 10, -h / 2 + 14, w, h, 30, 'rgba(0,0,0,0.25)', 0);
    box(c, -w / 2, -h / 2, w, h, 30, C.paper, 11);
    let yy = -h / 2 + 25 + size * 0.55;
    stroked(c, title, 0, yy, { size, fill: titleCol, lw: 12, maxW: w - 60 });
    if (sub) { yy += size * 0.55 + subSize * 0.75; text(c, sub, 0, yy, { size: subSize, font: FONT_CAP, fill: C.ink, maxW: w - 60 }); }
    if (sub2) { yy += subSize * 1.2; text(c, sub2, 0, yy, { size: subSize, font: FONT_CAP, fill: C.ink, maxW: w - 60 }); }
  });
}
// carimbo vermelho
export function stamp(c, x, y, s, txt, { rot = -0.18, col = C.red, size = 96, w = 0 } = {}) {
  if (s <= 0) return;
  within(c, x, y, rot, s, (c) => {
    c.font = `${size}px ${FONT_CAP}`; const tw = w || c.measureText(txt).width + 70, th = size * 1.25;
    box(c, -tw / 2, -th / 2, tw, th, 18, '#fff', 0);
    c.globalAlpha = 0.95; box(c, -tw / 2, -th / 2, tw, th, 18, null, 12, col); box(c, -tw / 2 + 14, -th / 2 + 14, tw - 28, th - 28, 10, null, 5, col);
    text(c, txt, 0, 6, { size, font: FONT_CAP, fill: col }); c.globalAlpha = 1;
  });
}
// faixa grande inclinada (ex.: "1 MÊS DEPOIS")
export function banner(c, x, y, s, txt, { rot = -0.06, size = 110, fill = C.yellow } = {}) {
  if (s <= 0) return; within(c, x, y, rot, s, (c) => stroked(c, txt, 0, 0, { size, fill, lw: 18, maxW: 980 }));
}
export function badge(c, txt = 'FICÇÃO · SITUAÇÃO REAL') {
  c.font = `40px ${FONT_UI}`; const w = c.measureText(txt).width + 70;
  box(c, W / 2 - w / 2, 262, w, 70, 35, C.blue, 9);
  text(c, txt, W / 2, 299, { size: 40, fill: '#fff' });
}
export function thought(c, x, y, s, txt, { w = 620, size = 64, from = null } = {}) {
  if (s <= 0) return;
  within(c, x, y, 0, s, (c) => {
    if (from) { circle(c, from[0] - x + (x - from[0]) * 0.35, from[1] - y + (y - from[1]) * 0.35, 18, '#fff', 7); circle(c, from[0] - x + (x - from[0]) * 0.62, from[1] - y + (y - from[1]) * 0.62, 28, '#fff', 7); }
    const h = 230;
    shape(c, (c) => {
      const n = 9;
      for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2, px = Math.cos(a) * w / 2, py = Math.sin(a) * h / 2; if (i === 0) c.moveTo(px, py); else { const am = ((i - 0.5) / n) * Math.PI * 2; c.quadraticCurveTo(Math.cos(am) * w / 2 * 1.22, Math.sin(am) * h / 2 * 1.35, px, py); } }
      c.closePath();
    }, '#fff', 9);
    const lines = txt.split('\n');
    lines.forEach((l, i) => text(c, l, 0, (i - (lines.length - 1) / 2) * size * 1.05 + 6, { size, font: FONT_CAP, fill: C.ink, maxW: w - 80 }));
  });
}
export function sparkle(c, x, y, s, rot = 0, col = C.yellow) {
  if (s <= 0) return;
  within(c, x, y, rot, s, (c) => shape(c, (c) => { for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 16 : 46; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); }, col, 6));
}
export function flash(c, a) { if (a > 0) { c.fillStyle = `rgba(255,255,255,${clamp(a)})`; c.fillRect(0, 0, W, H); } }

// ---------- legenda (palavra a palavra em blocos) ----------
const norm = (w) => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9$]/g, '');
export function buildChunks(words, { maxWords = 3, maxChars = 17 } = {}) {
  const out = []; let cur = [];
  const push = () => { if (cur.length) out.push(cur); cur = []; };
  for (const w of words) {
    const len = cur.reduce((a, x) => a + x.w.length + 1, 0) + w.w.length;
    if (cur.length && (cur.length >= maxWords || len > maxChars)) push();
    cur.push(w);
    if (/[.,!?;:…]["”]?$/.test(w.w)) push();
  }
  push();
  return out.map((ws, i) => ({ words: ws, s: ws[0].s, e: ws[ws.length - 1].e }));
}
export function caption(c, chunks, keys, t, y = 1300) {
  let ch = null;
  for (let i = 0; i < chunks.length; i++) { const nx = chunks[i + 1]; if (t >= chunks[i].s - 0.04 && t < (nx ? Math.min(nx.s - 0.04, chunks[i].e + 0.6) : chunks[i].e + 0.6)) ch = chunks[i]; }
  if (!ch) return;
  const size = 96, gap = 26;
  c.font = `${size}px ${FONT_CAP}`;
  const ws = ch.words.map((w) => w.w.toUpperCase().replace(/^["“]|["”]$/g, ''));
  const widths = ws.map((w) => c.measureText(w).width);
  let total = widths.reduce((a, b) => a + b, 0) + gap * (ws.length - 1);
  const k = total > 980 ? 980 / total : 1;
  const sc = k * (0.86 + 0.14 * E.back((t - ch.s + 0.04) / 0.14));
  c.save(); c.translate(W / 2, y); c.scale(sc, sc);
  let x = -total / 2;
  ws.forEach((w, i) => {
    const hot = keys.has(norm(ch.words[i].w));
    stroked(c, w, x + widths[i] / 2, 0, { size, fill: hot ? C.yellow : '#fff', lw: 17 });
    x += widths[i] + gap;
  });
  c.restore();
}
export { norm };
