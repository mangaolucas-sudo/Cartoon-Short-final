// Extra painted textures for the outback world (our own, deterministic).
import { rng } from './paint.js';
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
export const INKC = '#241726';

export function redDirt(seed = 21) {
  const [c, g] = cv(512, 512), r = rng(seed);
  g.fillStyle = '#c07a4a'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) { g.fillStyle = hsl(18 + r() * 14, 45 + r() * 15, 44 + r() * 16, 0.5); g.beginPath(); g.ellipse(r() * 512, r() * 512, 2 + r() * 14, 1 + r() * 6, r() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 120; i++) { g.fillStyle = hsl(60 + r() * 20, 30, 40 + r() * 10, 0.6); const x = r() * 512, y = r() * 512; for (let k = 0; k < 5; k++) { g.fillRect(x + k * 2, y - r() * 8, 1.5, 8); } }
  for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(90,40,20,.35)'; g.beginPath(); g.ellipse(r() * 512, r() * 512, 3 + r() * 4, 2 + r() * 3, 0, 0, 7); g.fill(); }
  return c;
}
export function wheat(seed = 22, ripe = 1) {
  const [c, g] = cv(256, 256), r = rng(seed);
  g.fillStyle = ripe ? '#d9b04a' : '#8fae4a'; g.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 8; row++) { g.fillStyle = 'rgba(120,80,20,.35)'; g.fillRect(0, row * 32 + 28, 256, 4); }
  for (let i = 0; i < 700; i++) { const x = r() * 256, y = r() * 256; g.strokeStyle = hsl(ripe ? 40 + r() * 10 : 85, 60, 50 + r() * 22, 0.9); g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + r() * 4 - 2, y - 10); g.stroke(); }
  return c;
}
export function wheatSide(seed = 23) {
  const [c, g] = cv(256, 128), r = rng(seed);
  g.fillStyle = '#c99a3a'; g.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 260; i++) { const x = r() * 256; g.strokeStyle = hsl(38 + r() * 12, 55, 40 + r() * 25); g.lineWidth = 2; g.beginPath(); g.moveTo(x, 128); g.lineTo(x + r() * 10 - 5, 10 + r() * 20); g.stroke(); g.fillStyle = hsl(42, 70, 62); g.beginPath(); g.ellipse(x + 2, 12 + r() * 18, 3, 8, 0.2, 0, 7); g.fill(); }
  return c;
}
export function corrugated(seed = 24, base = [200, 8, 72]) {
  const [c, g] = cv(256, 256), r = rng(seed);
  for (let x = 0; x < 256; x++) { const k = 0.5 + 0.5 * Math.sin(x / 256 * Math.PI * 2 * 16); g.fillStyle = hsl(base[0], base[1], base[2] - 14 + k * 20); g.fillRect(x, 0, 1, 256); }
  for (let i = 0; i < 30; i++) { g.fillStyle = hsl(22, 60, 40, 0.35); g.beginPath(); g.ellipse(r() * 256, r() * 256, 4 + r() * 18, 3 + r() * 10, 0, 0, 7); g.fill(); }
  return c;
}
export function weatherboard(seed = 25, col = [40, 30, 86]) {
  const [c, g] = cv(256, 256), r = rng(seed);
  for (let i = 0; i < 8; i++) { g.fillStyle = hsl(col[0], col[1], col[2] - r() * 6); g.fillRect(0, i * 32, 256, 32); g.fillStyle = 'rgba(60,40,30,.5)'; g.fillRect(0, i * 32 + 28, 256, 4); }
  for (let i = 0; i < 20; i++) { g.fillStyle = 'rgba(120,100,80,.25)'; g.fillRect(r() * 256, r() * 256, 20 + r() * 40, 2); }
  return c;
}
export function bark(seed = 26) {
  const [c, g] = cv(128, 512), r = rng(seed);
  g.fillStyle = '#e8e2d4'; g.fillRect(0, 0, 128, 512);
  for (let i = 0; i < 60; i++) { g.fillStyle = hsl(30 + r() * 20, 20, 60 + r() * 20, 0.6); g.beginPath(); g.ellipse(r() * 128, r() * 512, 6 + r() * 14, 20 + r() * 40, 0, 0, 7); g.fill(); }
  return c;
}
export function woodPanel(seed = 27) {
  const [c, g] = cv(512, 512), r = rng(seed);
  for (let i = 0; i < 4; i++) { g.fillStyle = hsl(24, 45, 30 + r() * 6); g.fillRect(i * 128, 0, 128, 512); g.strokeStyle = 'rgba(20,10,5,.7)'; g.lineWidth = 6; g.strokeRect(i * 128 + 14, 20, 100, 472); }
  for (let k = 0; k < 80; k++) { g.strokeStyle = 'rgba(30,15,5,.25)'; g.lineWidth = 1; g.beginPath(); const x = r() * 512; g.moveTo(x, 0); g.lineTo(x + r() * 6, 512); g.stroke(); }
  return c;
}
export function carpet(seed = 28, col = '#3d6b4a') {
  const [c, g] = cv(256, 256), r = rng(seed);
  g.fillStyle = col; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2000; i++) { g.fillStyle = `rgba(${r() < .5 ? '255,255,255' : '0,0,0'},.06)`; g.fillRect(r() * 256, r() * 256, 2, 2); }
  return c;
}
export function canvasTent(seed = 29) {
  const [c, g] = cv(256, 256), r = rng(seed);
  g.fillStyle = '#b8a476'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 16; i++) { g.fillStyle = 'rgba(90,70,40,.18)'; g.fillRect(0, i * 16, 256, 2); g.fillRect(i * 16, 0, 2, 256); }
  for (let i = 0; i < 12; i++) { g.fillStyle = 'rgba(110,80,50,.25)'; g.beginPath(); g.ellipse(r() * 256, r() * 256, 10 + r() * 20, 6 + r() * 12, 0, 0, 7); g.fill(); }
  return c;
}
export function sandbag(seed = 30) {
  const [c, g] = cv(256, 128), r = rng(seed);
  g.fillStyle = '#7a6a4a'; g.fillRect(0, 0, 256, 128);
  for (let row = 0; row < 3; row++) for (let i = 0; i < 4; i++) { const x = i * 64 + (row % 2) * 32 - 16, y = row * 42; g.fillStyle = hsl(40, 28, 58 + r() * 8); g.beginPath(); g.ellipse(x + 32, y + 21, 31, 19, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(50,40,25,.8)'; g.lineWidth = 3; g.stroke(); }
  return c;
}

/** text sign: wooden / painted board, text centred, multiple lines */
export function sign(lines, { w = 512, h = 256, bg = '#e9dcb8', fg = '#2b2016', font = 'Arial Black', plank = true, border = '#5a3a24', size = 0 } = {}) {
  const [c, g] = cv(w, h), r = rng(lines.join('').length + 3);
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  if (plank) for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(90,60,30,.18)'; g.fillRect(0, i * h / 4, w, 3); for (let k = 0; k < 10; k++) { g.fillStyle = 'rgba(90,60,30,.1)'; g.fillRect(r() * w, i * h / 4 + r() * h / 4, 30 + r() * 60, 2); } }
  g.strokeStyle = border; g.lineWidth = Math.max(6, w / 40); g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, w - g.lineWidth, h - g.lineWidth);
  const fs = size || Math.min(h / (lines.length + 0.6), w / Math.max(...lines.map((l) => l.length)) * 1.55);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `900 ${fs}px ${font}, Arial`;
  lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * fs * 1.1));
  return c;
}
/** chalkboard (drawn each time its content key changes) */
export function chalk(g, w, h, fn) {
  g.fillStyle = '#2f4436'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(255,255,255,.035)'; g.fillRect(Math.random() * 0 + (i * 97) % w, (i * 53) % h, 40, 2); }
  g.strokeStyle = '#7a5434'; g.lineWidth = 24; g.strokeRect(12, 12, w - 24, h - 24);
  g.fillStyle = '#f4f1e6'; g.strokeStyle = '#f4f1e6'; g.lineCap = 'round'; g.lineJoin = 'round';
  fn(g);
}
/** newspaper front page */
export function paper(g, w, h, head, sub, seed = 1) {
  const r = rng(seed);
  g.fillStyle = '#efe8d4'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1e1a16'; g.textAlign = 'center'; g.font = `900 ${w * 0.075}px Georgia, serif`; g.fillText('O DIÁRIO DO MATO', w / 2, h * 0.1);
  g.fillRect(w * 0.05, h * 0.125, w * 0.9, 4); g.fillRect(w * 0.05, h * 0.135, w * 0.9, 2);
  g.font = `900 ${w * 0.105}px Arial Black, Arial`;
  head.forEach((l, i) => g.fillText(l, w / 2, h * (0.25 + i * 0.12)));
  g.font = `italic 700 ${w * 0.05}px Georgia, serif`; g.fillText(sub, w / 2, h * (0.27 + head.length * 0.12));
  // photo box with an emu silhouette
  const px = w * 0.08, py = h * (0.33 + head.length * 0.12), pw = w * 0.42, ph = h * 0.3;
  g.fillStyle = '#b8b0a0'; g.fillRect(px, py, pw, ph); g.fillStyle = '#3a3430';
  g.beginPath(); g.ellipse(px + pw * 0.45, py + ph * 0.62, pw * 0.22, ph * 0.16, -0.2, 0, 7); g.fill();
  g.lineWidth = pw * 0.04; g.strokeStyle = '#3a3430'; g.beginPath(); g.moveTo(px + pw * 0.6, py + ph * 0.55); g.quadraticCurveTo(px + pw * 0.66, py + ph * 0.3, px + pw * 0.72, py + ph * 0.2); g.stroke();
  g.beginPath(); g.ellipse(px + pw * 0.74, py + ph * 0.18, pw * 0.05, ph * 0.05, 0, 0, 7); g.fill();
  for (const dx of [0.4, 0.5]) { g.beginPath(); g.moveTo(px + pw * dx, py + ph * 0.72); g.lineTo(px + pw * (dx - 0.04), py + ph * 0.95); g.stroke(); }
  g.fillStyle = '#6a6458';
  for (let i = 0; i < 14; i++) { g.fillRect(w * 0.55, py + i * ph / 14, w * 0.38 * (0.7 + r() * 0.3), 4); }
  for (let i = 0; i < 6; i++) { g.fillRect(w * 0.08, py + ph + 20 + i * 18, w * 0.85 * (0.7 + r() * 0.3), 4); }
}
