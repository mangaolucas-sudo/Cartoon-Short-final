// "O Bento resolve #1 – Pix errado" — timed to narracao.mp3 (78.60 s, 30 fps, 2358 frames).
// Word frames come from work/words.json (faster-whisper). Scene cuts sit 2-3 frames before the first word of each beat.
import { M, idle, blinkAt, q, clamp, lerp, lerp3, ramp, camFromKeys } from './motion.js';
import { CAPS } from './captions.js';
import { WRONG } from './screens.js';
export const FPS = 30, TOTAL = 2358;
export const SHOTS = [
  { id: 's1', n: 1, a: 0, b: 172 },      // close no teclado: dígito trocado
  { id: 's2', n: 2, a: 173, b: 615 },    // Juliana: comprovante -> Seu Jorge liga -> "já mandei" (mentira)
  { id: 's3', n: 3, a: 616, b: 838 },    // app: Contestar -> aviso vermelho
  { id: 's4', n: 4, a: 839, b: 1126 },   // tela dividida: Juliana chorando / atendente com PROTOCOLO
  { id: 's5', n: 5, a: 1127, b: 1420 },  // calendário 1,2,3 -> notificação do Marcos
  { id: 's6', n: 6, a: 1421, b: 1523 },  // Juliana paralisada
  { id: 's7', n: 7, a: 1524, b: 1960 },  // vizinha advogada + botão Devolver
  { id: 's8', n: 8, a: 1961, b: 2284 },  // tela dividida: paga x bate o pé
  { id: 's9', n: 9, a: 2285, b: 2357 },  // volta ao teclado (loop)
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];

// ---------- light ----------
export const LIGHTS = {
  room: { az: 70, el: 42, sky: '#fff4e6', ground: '#b49a80', hemi: 1.25, sun: '#fff1dc', sunI: 2.1, fog: '#d6e8f6', fogNear: 30, fogFar: 260,
    skyTop: '#5d9be0', skyHor: '#d6e8f6', sat: 1.08, vig: 0.18, shadowExt: 4 },
  night: { az: 70, el: 42, sky: '#c9d4ff', ground: '#6a6080', hemi: 1.0, sun: '#ffe2bc', sunI: 1.6, fog: '#3a4670', fogNear: 30, fogFar: 260,
    skyTop: '#1e2a55', skyHor: '#4a5a8a', sat: 1.05, vig: 0.26, shadowExt: 4 },
};
export const lightFor = (S, f) => ({ ...LIGHTS.room });

// ---------- places ----------
const JU = [-0.9, 0, -1.3];          // Juliana's mark in the living room
const OX = 40, AT = [OX, 0, -1.55];  // attendant behind the desk
const ADV = [0.25, 0, -1.45];        // neighbour
const PHONE_CU = [0.55, 1.12, -0.55]; // phone close-up spot (in the air, room behind)
const eyeJ = [JU[0], 1.55, JU[2]];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// phone close-up camera: straight on, no zoom (fov fixed), only a tiny drift
const phoneCam = (f, f0, P = PHONE_CU, d = 0.33) => {
  const t = (f - f0) / 30, dx = 0.004 * Math.sin(t * 0.7), dy = 0.003 * Math.sin(t * 0.9 + 1);
  return { pos: [P[0] + 0.02 + dx, P[1] + 0.01 + dy, P[2] + d], look: [P[0] + dx * 0.5, P[1] + 0.005 + dy * 0.5, P[2]], fov: 40 };
};
const FULL = { src: [0, 0, 1080, 1920], dst: [0, 0, 1080, 1920] };
const TOP = { src: [0, 480, 1080, 960], dst: [0, 0, 1080, 960] }, BOT = { src: [0, 480, 1080, 960], dst: [0, 960, 1080, 960] };
const LEFT = { src: [270, 0, 540, 1920], dst: [0, 0, 540, 1920] }, RIGHT = { src: [270, 0, 540, 1920], dst: [540, 0, 540, 1920] };

export const viewsAt = (f) => {
  const S = shotAt(f);
  switch (S.id) {
    case 's1': case 's3': case 's9': {
      const C = phoneCam(f, S.a);
      return [{ ...FULL, cam: C, dof: { focus: dist(C.pos, PHONE_CU), cinf: 13 } }];
    }
    case 's2': { // MCU, lateral drift only (phone on screen -> no zoom)
      const t = smooth01(f, S.a, S.b);
      const C = { pos: [lerp(-0.72, -0.6, t), 1.4, JU[2] + 2.1], look: [lerp(-0.8, -0.74, t), 1.36, JU[2]], fov: 40 };
      return [{ ...FULL, cam: C, dof: { focus: dist(C.pos, eyeJ), cinf: 8 } }];
    }
    case 's4': {
      const t = smooth01(f, S.a, S.b);
      const A = { pos: [JU[0] + 0.15 + 0.05 * t, 1.4, JU[2] + 3.6], look: [JU[0] + 0.05, 1.36, JU[2]], fov: 40 };
      const B = { pos: [AT[0] + 0.12 - 0.05 * t, 1.45, AT[2] + 3.2], look: [AT[0] + 0.15, 1.42, AT[2]], fov: 40 };
      return [{ ...TOP, cam: A, dof: { focus: dist(A.pos, eyeJ), cinf: 6 } }, { ...BOT, cam: B, dof: { focus: dist(B.pos, [AT[0], 1.4, AT[2]]), cinf: 6 } }];
    }
    case 's5': {
      if (f < 1210) { // calendar + clock on the wall, gentle sideways drift (text on screen -> no zoom)
        const t = smooth01(f, S.a, 1209);
        const C = { pos: [0.25 + lerp(-0.04, 0.04, t), 1.47, -0.85], look: [0.25, 1.45, -3.4], fov: 40 };
        return [{ ...FULL, cam: C, dof: { focus: 1.4, cinf: 0 } }];
      }
      const P = [0.45, 0.72, -2.72];
      const C = phoneCam(f, 1210, P, 0.33); C.pos[1] += 0.06; // a touch above, looking down at the stand
      return [{ ...FULL, cam: C, dof: { focus: dist(C.pos, P), cinf: 12 } }];
    }
    case 's6': { // close-up, slow push-in limited to 5 % (fov 34 -> 32.3)
      const t = smooth01(f, S.a, S.b);
      const C = { pos: [JU[0] + 0.05, 1.5, JU[2] + 1.75], look: [JU[0], 1.42, JU[2]], fov: 34 * (1 - 0.05 * t), roll: -2 * t };
      return [{ ...FULL, cam: C, dof: { focus: dist(C.pos, eyeJ), cinf: 10 } }];
    }
    case 's7': { // neighbour MCU, Juliana at the edge (phone on screen -> no zoom, slight drift)
      const t = smooth01(f, S.a, S.b);
      const C = { pos: [ADV[0] + 0.05 + 0.08 * t, 1.42, ADV[2] + 2.6], look: [ADV[0] + 0.14, 1.38, ADV[2]], fov: 40 };
      return [{ ...FULL, cam: C, dof: { focus: dist(C.pos, [ADV[0], 1.5, ADV[2]]), cinf: 7 } }];
    }
    case 's8': { // split: left = pays, right = stands firm; zoom <= 5 %
      const t = smooth01(f, S.a, S.b), fov = 40 * (1 - 0.05 * t);
      const A = { pos: [-0.68, 1.3, -1.3 + 3.6], look: [-0.68, 1.28, -1.3], fov };
      const B = { pos: [2.2, 1.3, -1.3 + 3.6], look: [2.2, 1.28, -1.3], fov };
      return [{ ...LEFT, cam: A, dof: { focus: 3.6, cinf: 4 } }, { ...RIGHT, cam: B, dof: { focus: 3.6, cinf: 4 } }];
    }
  }
  return [{ ...FULL, cam: { pos: [0, 1.5, 2], look: [0, 1.5, 0], fov: 40 } }];
};
const smooth01 = (f, a, b) => M.smooth((f - a) / (b - a));

// ---------- world ----------
export const worldAt = (f) => {
  const W = { day: 1, flip: 0, clock: 0 };
  // calendar: 1 -> 2 at f1150, 2 -> 3 at f1180 (each flip 12 frames); clock ticks one step per second
  if (f >= 1127) {
    const f1 = ramp(f, 1150, 1162), f2 = ramp(f, 1182, 1194);
    if (f < 1162) { W.day = 1; W.flip = M.easeIn(f1); } else if (f < 1194) { W.day = 2; W.flip = M.easeIn(f2); } else { W.day = 3; W.flip = 0; }
    W.clock = Math.floor((f - 1127) / 6) * (Math.PI / 6); // fast ticking: days passing
  }
  return W;
};

// ---------- actors ----------
const PERSON = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.personFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const life = (f, seed, o = {}) => { const I = idle(f, seed); return { bob: q(I.bob, 3), tilt: q(I.tilt, 1), headTilt: q(I.headTilt + (o.headTilt || 0), 1), blink: blinkAt(f, seed), ...o, headTilt: q(I.headTilt + (o.headTilt || 0), 1) }; };
const talk = (f, on) => (on && Math.floor(f / 4) % 2 ? 'talk' : 'talkSmile');

export const actorsAt = (f, T, view = 0) => {
  const S = shotAt(f), out = [];
  const ju = (o, pos = JU, extra = {}) => out.push(PERSON(T, 'juliana', life(f, 7, o), pos, extra));
  switch (S.id) {
    case 's1': case 's3': case 's9': ju({ expr: 'worried', R: 'show' }); break; // blurred behind the phone
    case 's2': {
      let expr = 'neutral', R = 'show', look = 0;
      if (f >= 200) expr = 'worried';
      if (f >= 316) expr = 'frozen';
      if (f >= 352) expr = 'nervous';
      if (f >= 428) R = 'ear';
      if (f >= 435) expr = 'liar';
      if (f >= 530) expr = 'nervous';
      if (f >= 562) expr = 'sad';
      const shake = f >= 352 && f < 428 ? q(1.5 * Math.sin(f * 2.3), 1) : 0;
      ju({ expr, R, look, headTilt: shake });
      break;
    }
    case 's4':
      if (view === 0) ju({ expr: f % 40 < 20 ? 'cry' : 'sob', L: 'ear', tears: q(((f - S.a) / 24) % 1, 2) });
      else out.push(PERSON(T, 'atendente', life(f, 12, { expr: f >= 953 ? talk(f, f < 1126) : 'headsetTalk', R: f >= 1030 ? 'show' : 'headset', lift: q(M.back(ramp(f, 1030, 1045)), 2) }), AT));
      break;
    case 's6': ju({ expr: 'frozen', R: 'read', look: 0, bob: 0 }); break;
    case 's7': {
      const speaking = f >= 1673;
      out.push(PERSON(T, 'advogada', life(f, 21, { expr: speaking ? talk(f, true) : 'sure', L: f >= 1673 && f < 1731 ? 'point' : 'hang', R: f >= 1731 ? 'show' : 'hip', lift: q(M.back(ramp(f, 1731, 1746)), 2), facing: 0 }), ADV));
      ju({ expr: f >= 1731 ? 'relief' : 'worried', facing: 1, look: 0.5 }, [-0.75, 0, -1.75]);
      break;
    }
    case 's8':
      if (view === 0) ju({ expr: 'sad', R: 'give', L: 'hang' }, [-0.9, 0, -1.3]);
      else { const st = Math.max(0, Math.sin((f - 2045) / 8 * Math.PI)) * (f >= 2045 ? 1 : 0); ju({ expr: 'determined', R: 'fist', L: 'hip', stomp: q(st, 2) }, [2.2, 0, -1.3]); }
      break;
  }
  return out;
};

// ---------- 2D effects ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
export const fxAt = (f, T, view = 0) => {
  const S = shotAt(f), out = [];
  if (S.id === 's2' && f >= 352 && f < 428) { const t = q(((f - 352) / 18) % 1, 2); out.push(FX('ring' + t, (p) => T.fxPhoneRing(p, t), [JU[0] + 0.36, 0.98, JU[2] + 0.1], 0.5)); }
  if (S.id === 's2' && f >= 530) out.push(FX('sweat', (p) => T.fxSweat(p), [JU[0] + 0.2, 1.35 + Math.min(0.06, (f - 530) * 0.002), JU[2] + 0.1], 0.12));
  if (S.id === 's6') out.push(FX('sweat', (p) => T.fxSweat(p), [JU[0] - 0.17, 1.4, JU[2] + 0.1], 0.1));
  if (S.id === 's8' && view === 0) { const k = q(((f - S.a) / 30) % 1, 2); out.push(FX('bill' + k, (p) => T.fxBill(p, k), [-0.33, 0.98, -1.2], 0.36)); }
  if (S.id === 's7' && f >= 1753 && f < 1775) { const t = q((f - 1753) / 22, 2); out.push(FX('spark' + t, (p) => T.fxSpark(p, t), [ADV[0] + 0.15, 0.95, ADV[2] + 0.3], 0.6)); }
  return out;
};

// ---------- props (phone, paper) ----------
const typedAt = (f) => { // S9: digits typed one by one, the last one lands right before frame 0
  if (f < 2290) return 0; return Math.min(11, 1 + Math.floor((f - 2290) / 5.6));
};
export const propsAt = (f, view = 0) => {
  const S = shotAt(f), out = [];
  const cu = (screen, P = PHONE_CU) => out.push({ kind: 'phone', pos: P, face: 'cam', rot: [0, 0, 0.03], screen });
  switch (S.id) {
    case 's1': {
      if (f < 104) cu({ kind: 'pix', typed: 11, wrong: true, blink: Math.floor(f / 8) % 2 === 0, pressed: f < 4 ? 6 : (f >= 96 && f < 104 ? -1 : -1) });
      else cu({ kind: 'receipt' });
      break;
    }
    case 's9': { const n = typedAt(f), k = (f - 2290) % 5.6; cu({ kind: 'pix', typed: n, wrong: false, blink: false, cursor: Math.floor(f / 8) % 2 === 0, pressed: n > 0 && n < 11 && k < 3 ? [0, 0, 8, 6, 7, 3, 4, 2, 6, 6, 0][n] : -1 }); break; }
    case 's2': {
      const scr = f < 352 ? { kind: 'receipt', hl: f >= 316 } : { kind: 'call', pulse: q(((f - 352) / 18) % 1, 1) };
      out.push({ kind: 'phone', attach: { actor: 0, hand: f >= 428 ? 'ear' : 'show', dx: f >= 428 ? 0 : 0.08, dy: f >= 428 ? 0.02 : 0.16, dz: 0.06 }, rot: f >= 428 ? [0, -1.3, 0.2] : [0, 0, -0.06], screen: scr, s: f >= 428 ? 1.4 : 2.0 });
      break;
    }
    case 's3': cu({ kind: 'detail', press: f >= 670, warn: q(M.back(ramp(f, 721, 731)), 2) }); break;
    case 's4':
      if (view === 0) out.push({ kind: 'phone', attach: { actor: 0, hand: 'ear', dy: 0.02, dz: 0.05 }, rot: [0, 1.3, -0.2], screen: { kind: 'call', pulse: 0 }, s: 1.1 });
      else if (f >= 1030) out.push({ kind: 'paper', attach: { actor: 0, hand: 'show', dx: 0.36, dy: 0.12, dz: 0.09 }, rot: [0, 0, -0.06] });
      break;
    case 's5': if (f >= 1210) out.push({ kind: 'phone', pos: [0.45, 0.72, -2.72], face: 'cam', rot: [0, 0, 0], screen: { kind: 'lock', notif: q(M.back(ramp(f, 1213, 1225)), 2) } }); break;
    case 's6': out.push({ kind: 'phone', attach: { actor: 0, hand: 'read', dy: 0.05, dz: 0.05 }, rot: [-0.5, Math.PI, 0], screen: { kind: 'lock', notif: 1 } }); break;
    case 's7': if (f >= 1731) out.push({ kind: 'phone', attach: { actor: 0, hand: 'show', dx: 0.42, dy: 0.22, dz: 0.14 }, rot: [0, -0.12, 0.06], screen: { kind: 'detail', received: true }, s: 3.1 }); break;
  }
  return out;
};

// ---------- overlays ----------
const H = (lines, t0, y = 300, extra = {}) => ({ type: 'head', lines, t0, y, ...extra });
export const overlayAt = (f) => {
  const S = shotAt(f), out = [];
  let capY = 1300;
  switch (S.id) {
    case 's1': if (f >= 47) out.push(H(['R$ 1.200 PRO', 'DESCONHECIDO!'], 47, 250, { color: '#ffd23f', size: 92 })); break;
    case 's2':
      if (f >= 437) out.push(H(['"JÁ MANDEI..."'], 437, 250, { size: 96 }));
      if (f >= 533) out.push(H(['(MENTIRA)'], 533, 395, { box: '#e0322b', size: 78, rot: -4 }));
      break;
    case 's3': if (f >= 741) out.push(H(['CONTESTAR?', 'SÓ SERVE PRA GOLPE'], 741, 230, { color: '#ffffff', size: 84, box: '#e0322b' })); break;
    case 's4': out.push({ type: 'divider', dir: 'h' }); if (f >= 955) out.push(H(['AVISE O BANCO E', 'GUARDE O PROTOCOLO'], 955, 960, { box: '#0f7b6c', size: 70 })); capY = 790; break;
    case 's5': if (f >= 1313) out.push(H(['"DEVOLVO... SE VOCÊ', 'ME PAGAR R$ 200"'], 1313, 230, { color: '#ffd23f', size: 80 })); break;
    case 's6': if (f >= 1466) out.push(H(['PAGAR PRA RECEBER', 'O QUE É SEU?'], 1466, 260, { color: '#ffd23f', size: 88 })); break;
    case 's7':
      if (f >= 1753) out.push(H(['EXISTE O BOTÃO', '"DEVOLVER"'], 1753, 230, { color: '#7CFC9A', size: 84 }));
      if (f >= 1820) out.push(H(['FICAR COM O DINHEIRO', 'PODE SER CRIME'], 1820, 1420, { box: '#e0322b', size: 64 }));
      break;
    case 's8':
      out.push({ type: 'divider', dir: 'v' });
      if (f >= 2020) out.push(H(['PAGA', 'R$ 200 💸'], 2020, 260, { x: 270, maxW: 500, size: 72, color: '#ffd23f' }));
      if (f >= 2056) out.push(H(['BATE', 'O PÉ ⚖️'], 2056, 260, { x: 810, maxW: 500, size: 72, color: '#7CFC9A' }));
      if (f >= 1967 && f < 2125) out.push(H(['E VOCÊ? COMENTA 👇'], 1967, 1440, { box: '#0f7b6c', size: 66 }));
      if (f >= 2125) out.push(H(['PARTE 2 EM BREVE', 'SEGUE E SE INSCREVE'], 2125, 1420, { box: '#e0322b', size: 62 }));
      break;
  }
  const c = CAPS.find((c) => f >= c.a && f < c.b);
  if (c) out.push({ type: 'cap', words: c.w, a: c.a, y: capY });
  return out;
};
