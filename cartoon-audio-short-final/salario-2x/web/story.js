// "O salário que caiu duas vezes" — timed to voice.mp3 (65.15 s, 30 fps, 1954 frames).
// Scene cuts come from word timestamps (work/words.json). Frame = round(s*30).
import { M, clamp, lerp, lerp3, ramp, camFromKeys, idle, blinkAt, walk, q } from './motion.js';
export const FPS = 30, TOTAL = 1954;
export const SHOTS = [
  { id: 'hook', a: 0, b: 115, light: 'home' },
  { id: 'work', a: 116, b: 428, light: 'shop' },
  { id: 'app', a: 429, b: 664, light: 'shop' },
  { id: 'boleto', a: 665, b: 723, light: 'home' },
  { id: 'wait', a: 724, b: 846, light: 'shop' },
  { id: 'colega', a: 847, b: 1023, light: 'shop' },
  { id: 'group', a: 1024, b: 1207, light: 'shop' },
  { id: 'gelou', a: 1208, b: 1326, light: 'cold' },
  { id: 'split', a: 1327, b: 1617, light: 'studio' },
  { id: 'celia', a: 1618, b: 1888, light: 'office' },
  { id: 'loop', a: 1889, b: 1953, light: 'home' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const smooth = M.smooth;

// ---------- lights ----------
const IN = { skyTop: '#d9dde2', skyHor: '#e6e8ea', fogNear: 40, fogFar: 160 };
export const LIGHTS = {
  shop: { ...IN, az: 70, el: 62, sky: '#f4f1e8', ground: '#8c8778', hemi: 1.3, sun: '#fff3dc', sunI: 1.7, fog: '#cfd3d8', sat: 1.1, vig: 0.24, shadowExt: 9 },
  home: { ...IN, az: 55, el: 48, sky: '#ffeedd', ground: '#9a7a5a', hemi: 1.2, sun: '#ffe0b0', sunI: 1.9, fog: '#e8d8c0', sat: 1.12, gain: '#fff6ea', vig: 0.26, shadowExt: 2.2 },
  cold: { ...IN, az: 70, el: 62, sky: '#c9d8f2', ground: '#5d6a80', hemi: 1.2, sun: '#dce6ff', sunI: 1.3, fog: '#b8c4d6', sat: 0.8, gain: '#e4eeff', lift: '#000814', vig: 0.42, shadowExt: 9 },
  studio: { ...IN, az: 80, el: 55, sky: '#ffffff', ground: '#b0b0b0', hemi: 1.35, sun: '#ffffff', sunI: 1.3, fog: '#ffffff', sat: 1.12, vig: 0.18, shadowExt: 6 },
  office: { ...IN, az: 50, el: 38, sky: '#f6e6d0', ground: '#7a6a5a', hemi: 1.15, sun: '#ffd49a', sunI: 2.0, fog: '#e6d6c0', sat: 1.06, gain: '#fff0e0', vig: 0.3, shadowExt: 7 },
};
export const lightFor = (S, f) => {
  const L = { ...LIGHTS[S.light] };
  if (S.id === 'celia') { const k = smooth(ramp(f, 1815, 1860)); L.sunI = lerp(2.0, 1.2, k); L.sat = lerp(1.06, 0.85, k); L.vig = lerp(0.3, 0.45, k); }
  if (S.id === 'gelou') L.vig = lerp(0.3, 0.5, smooth(ramp(f, 1208, 1300)));
  return L;
};

// ---------- places ----------
const RIC = [0, 0, 0], TABLE = 0.79;
const PH_TABLE = [-60.05, TABLE + 0.008, 0.0];
const HAND = [0.04, 1.18, 0.16];          // where Ricardo holds the phone (card "phone" pose)
const STU = [60, 0, 0], CEL = [120.2, 0, -0.45];
const LOOPCAM = { pos: [-60.04, 1.33, 0.29], look: [-60.05, 0.79, 0.012], fov: 40 };

// ---------- cameras ----------
const CAMS = {
  hook: { keys: [{ f: 0, ...LOOPCAM }, { f: 115, pos: [-60.045, 1.26, 0.26], look: [-60.05, 0.79, 0.015], fov: 39, roll: -2 }], creep: 0 },
  work: { keys: [
    { f: 116, pos: [5.6, 3.7, 8.6], look: [-0.6, 1.0, -2.5], fov: 46 },
    { f: 196, pos: [1.2, 1.65, 3.6], look: [0, 1.15, -0.3], fov: 40, ease: 'smooth' },
    { f: 290, pos: [0.45, 1.55, 2.75], look: [0.05, 1.36, 0], fov: 38 },
    { f: 385, pos: [0.25, 1.55, 2.45], look: [0.05, 1.38, 0], fov: 37 },
    { f: 386, pos: [-1.6, 1.6, 3.2], look: [0, 1.15, -0.2], fov: 40 },
    { f: 428, pos: [-1.3, 1.58, 3.0], look: [0, 1.17, -0.2], fov: 39 },
  ] },
  app: { keys: [
    { f: 429, pos: [0.2, 1.5, 2.2], look: [0.05, 1.36, 0], fov: 38 },
    { f: 584, pos: [0.12, 1.5, 1.9], look: [0.05, 1.37, 0], fov: 37 },
    { f: 600, pos: [0.06, 1.24, 0.72], look: [0.04, 1.2, 0.16], fov: 36, ease: 'easeOut' },
    { f: 664, pos: [0.06, 1.24, 0.66], look: [0.04, 1.2, 0.16], fov: 35, roll: 2 },
  ] },
  boleto: { keys: [{ f: 665, pos: [-60.46, 1.62, 0.32], look: [-60.48, 0.79, 0.1], fov: 40, roll: 4 }, { f: 723, pos: [-60.47, 1.52, 0.29], look: [-60.48, 0.79, 0.1], fov: 38, roll: 1 }] },
  wait: { keys: [{ f: 724, pos: [-0.9, 1.55, 2.9], look: [0, 1.36, 0], fov: 40 }, { f: 846, pos: [0.9, 1.52, 2.65], look: [0, 1.37, 0], fov: 39 }] },
  colega: { keys: [{ f: 847, pos: [-0.06, 1.55, 3.6], look: [-0.06, 1.32, 0], fov: 40 }, { f: 1023, pos: [-0.04, 1.55, 3.0], look: [-0.04, 1.36, 0], fov: 38 }] },
  group: { keys: [
    { f: 1024, pos: [0.07, 1.22, 0.62], look: [0.04, 1.18, 0.16], fov: 38 },
    { f: 1100, pos: [0.06, 1.2, 0.58], look: [0.04, 1.175, 0.16], fov: 37 },
    { f: 1130, pos: [0.05, 1.17, 0.56], look: [0.04, 1.155, 0.16], fov: 36, ease: 'easeOut' },
    { f: 1207, pos: [0.05, 1.17, 0.53], look: [0.04, 1.155, 0.16], fov: 35, roll: -2 },
  ] },
  gelou: { keys: [{ f: 1208, pos: [0, 1.6, 2.4], look: [0, 1.48, 0], fov: 38 }, { f: 1326, pos: [0, 1.62, 1.75], look: [0, 1.53, 0], fov: 36, roll: -5 }] },
  split: { keys: [{ f: 1327, pos: [60, 1.4, 3.5], look: [60, 1.22, 0], fov: 40 }, { f: 1617, pos: [60, 1.42, 3.1], look: [60, 1.25, 0], fov: 39 }] },
  celia: { keys: [
    { f: 1618, pos: [121.9, 1.7, 3.8], look: [120.3, 1.35, -1.0], fov: 42 },
    { f: 1700, pos: [120.5, 1.5, 1.9], look: [120.2, 1.3, -0.45], fov: 38 },
    { f: 1760, pos: [120.4, 1.52, 1.75], look: [120.15, 1.32, -0.45], fov: 38 },
    { f: 1790, pos: [120.0, 1.75, 1.9], look: [119.6, 1.75, -1.6], fov: 40 },
    { f: 1820, pos: [120.05, 1.72, 1.85], look: [119.65, 1.72, -1.6], fov: 39 },
    { f: 1850, pos: [120.25, 1.58, 1.4], look: [120.2, 1.48, -0.45], fov: 36, roll: 3, ease: 'easeOut' },
    { f: 1888, pos: [120.25, 1.58, 1.3], look: [120.2, 1.49, -0.45], fov: 35, roll: 5 },
  ] },
  loop: { keys: [{ f: 1889, pos: [-60.0, 1.48, 0.4], look: [-60.05, 0.79, 0.0], fov: 40, roll: 3 }, { f: 1954, ...LOOPCAM }], creep: 0 },
};
const KICKS = [{ f: 440, a: 0.03 }, { f: 520, a: 0.015 }, { f: 534, a: 0.015 }, { f: 547, a: 0.015 }, { f: 590, a: 0.025 }, { f: 690, a: 0.03 },
  { f: 1115, a: 0.015 }, { f: 1221, a: 0.035 }, { f: 1856, a: 0.03 }];
export const camAt = (f) => {
  const S = shotAt(f), C = CAMS[S.id];
  const c = camFromKeys(C.keys, f, { creep: C.creep ?? 0.0012, kicks: KICKS });
  c.flash = f >= 386 && f < 392 ? (1 - (f - 386) / 6) * 0.9 : 0;
  if (S.id === 'hook' || S.id === 'loop' || S.id === 'boleto') c.shadowAt = [-60.1, TABLE, 0];
  else if (S.id === 'group' || S.id === 'app') c.shadowAt = [0, 1, 0];
  return c;
};

// ---------- lens ----------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const EYE = (p, h = 1.5) => [p[0], h, p[2]];
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  switch (S.id) {
    case 'hook': case 'loop': return { focus: dist(C.pos, PH_TABLE), cinf: 8 };
    case 'boleto': return { focus: dist(C.pos, [-60.48, TABLE, 0.07]), cinf: 8 };
    case 'work': { const t = smooth(ramp(f, 150, 196)); return { focus: dist(C.pos, EYE(RIC)), cinf: lerp(0, 10, t) }; }
    case 'app': { const t = smooth(ramp(f, 585, 600)); return { focus: lerp(dist(C.pos, EYE(RIC)), dist(C.pos, HAND), t), cinf: lerp(10, 12, t) }; }
    case 'wait': return { focus: dist(C.pos, EYE(RIC)), cinf: 10 };
    case 'colega': return { focus: dist(C.pos, [-0.3, 1.5, 0.05]), cinf: 9 };
    case 'group': return { focus: dist(C.pos, HAND), cinf: 13 };
    case 'gelou': return { focus: dist(C.pos, EYE(RIC)), cinf: 12 };
    case 'split': return { focus: dist(C.pos, EYE(STU)), cinf: 0 };
    case 'celia': { const plaque = f >= 1772 && f < 1835; return { focus: plaque ? dist(C.pos, [119.3, 2.2, -2.88]) : dist(C.pos, EYE(CEL, 1.45)), cinf: 9 }; }
  }
  return { focus: 10, cinf: 0 };
};

// ---------- world state ----------
const lockScr = (notifs) => ({ kind: 'lock', time: '10:12', date: 'terça-feira, 5 de novembro', notifs });
const HOOK_SCR = lockScr([{ t: 'agora' }, { t: '2 h atrás' }]);
export const worldAt = (f) => {
  const S = shotAt(f), W = { forkX: -11 + (f / TOTAL) * 26, stamp: f >= 684 ? (f - 684) / 6 : 0, phone: null };
  if (S.id === 'boleto' || S.id === 'hook' || S.id === 'loop') {
    // phone lies on the table; a short buzz right after the hook frame (and the same buzz in the loop shot)
    const bz = (f >= 6 && f < 30) ? Math.sin(f * 2.6) * 0.03 * (1 - (f - 6) / 24) : (f >= 1900 && f < 1924) ? Math.sin(f * 2.6) * 0.03 * (1 - (f - 1900) / 24) : 0;
    W.phone = { pos: PH_TABLE, rx: -Math.PI / 2, ry: 0, rz: 0.1 + bz, scr: HOOK_SCR };
    if (S.id === 'boleto') W.phone = { pos: PH_TABLE, rx: -Math.PI / 2, rz: 0.1, scr: { kind: 'lock', time: '10:14', date: 'terça-feira, 5 de novembro', notifs: [{ t: '2 min' }, { t: '2 h atrás' }] } };
  }
  if (S.id === 'app') {
    const scr = f < 482 ? lockScr([{ t: 'agora', pop: q(M.back(ramp(f, 431, 440)), 2) }, { t: '2 h atrás' }]) : { kind: 'bank', hl: f >= 589 ? q(Math.max(0, 1 - (f - 589) / 40), 2) : 0 };
    const bz = f < 452 ? Math.sin(f * 2.6) * 0.04 * (1 - (f - 429) / 23) : 0;
    const tk = [520, 534, 547].reduce((m, t) => m + (f >= t && f < t + 10 ? Math.sin((f - t) / 10 * Math.PI) * 0.05 : 0), 0); // triple take: phone jerks up
    W.phone = { pos: [HAND[0], HAND[1] + tk, HAND[2]], rx: -0.12, ry: 0.06, rz: bz, s: 0.62, scr };
  }
  if (S.id === 'group') {
    const pop = q(M.back(ramp(f, 1055, 1066)), 2);
    W.phone = { pos: HAND, rx: -0.08, ry: 0.04, rz: -0.03, s: 0.62, scr: { kind: 'chat', n: f >= 1055 ? 3 : 2, pop } };
  }
  return W;
};

// ---------- actors (2D cards) ----------
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const life = (f, seed) => { const i = idle(f, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1), blink: blinkAt(f, seed) }; };
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [];
  const tint = S.light === 'cold' ? '#dfe8ff' : '#ffffff';
  const ric = (o, pos = RIC, extra = {}) => out.push(R(T, 'ricardo', { seed: 3, ...life(f, 3), ...o }, pos, { tint, ...extra }));
  switch (S.id) {
    case 'work': {
      if (f < 386) {
        const wk = walk(f, 116, 0.9, 0.55), x = Math.min(0, -2.6 + wk.dist), moving = x < 0;
        const phase = f >= 290, ph = phase ? { L: 'hang', R: 'phone', prop: 'phone' } : { L: 'box', R: 'box', prop: 'box' };
        const expr = f >= 347 ? 'grin' : f >= 300 ? 'smile' : f >= 198 ? 'smile_closed' : 'neutral';
        ric({ ...ph, expr, step: moving ? q(wk.phase, 2) : 0, look: phase ? 0.45 : 0, R: f >= 352 && f < 384 ? 'thumb' : ph.R, prop: f >= 352 && f < 384 ? null : ph.prop }, [x, 0, 0]);
      } else ric({ L: 'box', R: 'box', prop: 'box', expr: 'neutral' }, [0, 0, 0]);
      // coworkers for life
      const wa = walk(f, 116, 0.7, 0.5); out.push(R(T, 'extraA', { seed: 11, step: q(wa.phase, 2), facing: -1, L: 'box', R: 'box', prop: 'box', ...life(f, 11) }, [5.5 - wa.dist, 0, -3.5]));
      out.push(R(T, 'extraB', { seed: 12, facing: 1, L: 'hang', R: 'point', expr: 'smile', ...life(f, 12) }, [-3.0, 0, -1.8]));
      break;
    }
    case 'app': {
      const shock = f >= 438;
      const take = [520, 534, 547].some((t) => f >= t && f < t + 6);
      ric({ R: 'phone', expr: shock ? 'shock' : 'neutral', look: 0.5, blink: take ? 1 : shock ? 0 : blinkAt(f, 3), headTilt: take ? 6 : q(idle(f, 3).headTilt, 1), bob: take ? 0.015 : 0 });
      break;
    }
    case 'wait': {
      const lk = f < 762 ? -0.85 : f < 800 ? 0.85 : 0;
      ric({ expr: f >= 803 ? 'nervous' : 'suspicious', look: lk, L: 'hang', R: 'hang', headTilt: q(lk * -4, 1) });
      const w = walk(f, 790, 1.0, 0.55);
      if (f >= 790) out.push(R(T, 'extraA', { seed: 11, step: q(w.phase, 2), facing: 1, L: 'box', R: 'box', prop: 'box', ...life(f, 11) }, [-3.2 + w.dist, 0, -2.4]));
      if (f >= 800) out.push(R(T, 'extraB', { seed: 12, step: q(walk(f, 800, 0.9, 0.55).phase, 2), facing: -1, expr: 'whistle', ...life(f, 12) }, [3.4 - walk(f, 800, 0.9).dist, 0, -3.0]));
      break;
    }
    case 'colega': {
      const talking = (f >= 847 && f < 933) || (f >= 941 && f < 1007);
      const mouthOpen = talking && Math.floor(f / 4) % 2 === 0;
      const ask = f >= 941;
      ric({ expr: f >= 1000 ? 'squint' : f >= 905 ? 'listen' : 'neutral', look: -0.7, L: 'hang', R: 'hang' }, [0.3, 0, 0]);
      out.push(R(T, 'colega', { seed: 21, ...life(f, 21), facing: 1, look: 0.7, expr: ask ? (mouthOpen ? 'whisper' : 'stern') : f >= 905 && f < 935 ? 'grin' : mouthOpen ? 'whisper' : 'neutral',
        R: ask ? 'hang' : 'mouth', L: ask ? 'point' : 'hang', tilt: 6, headTilt: q(8 + 2 * Math.sin(f * 0.2), 1) }, [-0.42, 0, 0.22]));
      break;
    }
    case 'group': {
      ric({ R: 'phone', expr: f >= 1118 ? 'shock' : 'neutral', look: 0.4 });
      break;
    }
    case 'gelou': {
      const sh = f >= 1221 && f < 1240 ? q(Math.sin(f * 2.2) * 3, 1) : 0;
      ric({ R: 'phone', prop: 'phone', expr: f < 1250 ? 'shock' : 'worried', look: 0, pale: q(smooth(ramp(f, 1215, 1240)) * 0.75, 2), sweat: f >= 1235 ? q((f * 0.02) % 1, 2) : 0, headTilt: sh, blink: 0 });
      break;
    }
    case 'split': {
      const L = f >= 1433 && f < 1500 ? 'point' : f >= 1500 ? 'thumb' : 'hang', Rr = f >= 1471 && f < 1500 ? 'point' : f >= 1500 ? 'thumb' : 'hang';
      const look = f >= 1433 && f < 1471 ? -0.9 : f >= 1471 && f < 1500 ? 0.9 : 0;
      ric({ L, R: Rr, look, expr: f >= 1500 ? 'grin' : f >= 1384 ? 'nervous' : 'neutral', headTilt: q(look * -6 + idle(f, 3).headTilt, 1) }, STU);
      break;
    }
    case 'celia': {
      const ex = f >= 1852 ? 'shock' : 'worried';
      const drop = f >= 1856;
      out.push(R(T, 'celia', { seed: 31, ...life(f, 31), L: drop ? 'cheek' : 'hold', R: drop ? 'cheek' : 'hold', prop: drop ? null : 'papers', expr: ex, look: f < 1700 ? -0.3 : 0, sweat: f >= 1830 ? q((f * 0.02) % 1, 2) : 0, blink: ex === 'shock' ? 0 : blinkAt(f, 31) }, CEL));
      break;
    }
  }
  return out;
};

// ---------- 2D effects (cards) ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
const rrp = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
const pill = (lines, bg, fg = '#fff', w = 560) => (p) => { const g = p.g; g.save(); const h = 70 + lines.length * 80; rrp(g, 300 - w / 2, 500 - h / 2, w, h, 40); g.fillStyle = bg; g.fill(); g.lineWidth = 12; g.strokeStyle = '#241726'; g.stroke();
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; lines.forEach(([t, sz], i) => { g.font = `900 ${sz}px Inter`; g.fillText(t, 300, 500 + (i - (lines.length - 1) / 2) * 82); }); g.restore(); };
const mark = (ch, col) => (p) => { const g = p.g; g.save(); g.font = '900 360px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 26; g.lineJoin = 'round'; g.strokeStyle = '#241726'; g.strokeText(ch, 300, 500); g.fillStyle = col; g.fillText(ch, 300, 500); g.restore(); };
const squig = (t) => (p) => { const g = p.g; g.save(); g.lineCap = 'round'; for (let i = 0; i < 3; i++) { const k = (t + i / 3) % 1; g.globalAlpha = Math.sin(k * Math.PI); g.strokeStyle = '#ffffff'; g.lineWidth = 14; g.beginPath(); for (let x = 0; x <= 200; x += 10) g.lineTo(150 + x + k * 120, 380 + i * 110 + Math.sin(x * 0.08 + k * 10) * 18); g.stroke(); g.strokeStyle = '#241726'; g.lineWidth = 5; g.stroke(); } g.restore(); };
const pop = (f, a, d = 8) => q(M.back(ramp(f, a, a + d)), 2);
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  if (S.id === 'work') {
    if (f >= 200 && f < 290) { const k = pop(f, 200); out.push(FX('tag' + k, pill([['R$ 2.800 / mês', 66]], '#1f9a5a'), [0.62, 1.95, 0.1], 0.48 * Math.max(0.05, k))); }
    if (f >= 336 && f < 386) { const k = pop(f, 336); out.push(FX('pix1' + k, pill([['Pix recebido', 54], ['R$ 2.800,00', 74]], '#ffffff', '#0f8a55'), [0.62, 1.98, 0.1], 0.5 * Math.max(0.05, k))); }
  }
  if (S.id === 'app' && f >= 438 && f < 470) { const k = pop(f, 438, 6); out.push(FX('ex' + k, mark('!', '#ffd23a'), [-0.42, 1.95, 0.05], 0.32 * Math.max(0.05, k), { roll: -0.2 })); }
  if (S.id === 'wait') {
    if (f >= 742 && f < 800) { const k = pop(f, 742, 6); out.push(FX('q1' + k, mark('?', '#ffffff'), [-0.5, 1.7, 0.05], 0.24 * Math.max(0.05, k), { roll: 0.2 })); }
    if (f >= 770 && f < 805) { const k = pop(f, 770, 6); out.push(FX('q2' + k, mark('?', '#ffffff'), [0.5, 1.76, 0.05], 0.2 * Math.max(0.05, k), { roll: -0.2 })); }
  }
  if (S.id === 'colega' && f < 1007) { const t = q((f * 0.04) % 1, 2); out.push(FX('sq' + t, squig(t), [0.02, 1.4, 0.3], 0.16)); }
  if (S.id === 'celia' && f >= 1856) for (let i = 0; i < 5; i++) { // papers slip out of her hands and flutter down
    const t = (f - 1856) / 30, y = Math.max(0.03, 1.3 - t * (0.32 + i * 0.05) - 0.1 * t * t), sx = Math.sin(t * 4 + i * 1.7) * 0.16;
    out.push(FX('paper' + i, (p) => { const g = p.g; g.save(); g.fillStyle = '#fbf8ef'; g.strokeStyle = '#241726'; g.lineWidth = 10; g.fillRect(160, 380, 280, 360); g.strokeRect(160, 380, 280, 360); g.fillStyle = '#8a8fa0'; for (let k = 0; k < 6; k++) g.fillRect(195, 430 + k * 45, k === 5 ? 120 : 210, 12); g.restore(); },
      [CEL[0] - 0.3 + i * 0.15 + sx, y, CEL[2] + 0.35], 0.16, { roll: q(Math.sin(t * 6 + i) * 0.7 + i * 0.4, 2), order: 6 }));
  }
  if (S.id === 'gelou') for (let i = 0; i < 4; i++) { const t = ((f - 1208) * 0.012 + i * 0.25) % 1; out.push(FX('ice', mark('❄', '#cfe8ff'), [-0.9 + i * 0.6, 2.3 - t * 1.6, -0.6], 0.12, { alpha: 0.85 })); }
  return out;
};

// ---------- on-screen titles (2D overlay) ----------
export const TEXTS = [
  { a: 0, b: 115, lines: ['CAIU 2 VEZES?!'], y: 300, size: 120, ph: 0 },
  { a: 1889, b: 1953, lines: ['CAIU 2 VEZES?!'], y: 300, size: 120, ph: -1954, still: true },
  { a: 588, b: 664, lines: ['R$ 5.600', 'NA CONTA'], y: 330, size: 124, fill: '#9cff7a' },
  { a: 1113, b: 1207, lines: ['"HOUVE UM ERRO', 'NO PAGAMENTO"'], y: 330, size: 92, fill: '#ffffff', box: '#d9443a', rot: -2 },
  { a: 1382, b: 1617, lines: ['DEVOLVE 🤝'], x: 275, y: 400, size: 72, fill: '#ffffff', box: '#1f8f46', rot: -4, pulse: 1433 },
  { a: 1386, b: 1617, lines: ['FICA 💰'], x: 805, y: 400, size: 72, fill: '#ffffff', box: '#b8322c', rot: 4, pulse: 1471 },
  { a: 1499, b: 1617, lines: ['SEGUE E SE INSCREVE'], y: 240, size: 78, fill: '#ffffff', box: '#241726', rot: -2 },
];
