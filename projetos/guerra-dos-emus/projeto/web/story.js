// "A Guerra Que a Austrália Perdeu Para Pássaros" — shot plan timed to voice.wav (339.88 s, 30 fps, 10196 frames).
import { M, clamp, lerp, lerp3, ramp, camFromKeys, blinkAt, q } from './motion.js';
import * as Q from './paint2.js';
export const FPS = 30, TOTAL = 10196;
const sm = M.smooth;
const rnd = (s, i) => { const x = Math.sin(s * 127.1 + i * 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------- places ----------
const CAMP = [112, 0, 8], BAGS = [76, 0, 50], LOOK = [24, 0, 92], OFF = [1000, 0, 0], PAR = [1100, 0, 0], STU = [1200, 0, 0];
const off = (b, x, y, z) => [b[0] + x, b[1] + y, b[2] + z];

// ---------- lights ----------
export const LIGHTS = {
  day: { az: 130, el: 50, sky: '#cfe0f4', ground: '#a8704a', hemi: 1.15, sun: '#fff1dc', sunI: 2.6, fog: '#e6d6c6', fogNear: 90, fogFar: 1100, skyTop: '#3a86d8', skyHor: '#d6e6f2', sat: 1.12, vig: 0.2, shadowExt: 22 },
  golden: { az: 200, el: 12, sky: '#a898c8', ground: '#7a4c38', hemi: 1.0, sun: '#ffb46c', sunI: 2.9, fog: '#f0b88c', fogNear: 80, fogFar: 900, skyTop: '#6f6eb0', skyHor: '#ffc27e', sunDisc: '#fff0c8', sunSize: 0.004, sat: 1.12, gain: '#fff2e2', vig: 0.26, shadowExt: 24, waterShal: '#d99a6e', glint: '#ffe2a8' },
  grey: { az: 120, el: 40, sky: '#a8b0b8', ground: '#7a6a5a', hemi: 1.25, sun: '#d8dce0', sunI: 1.1, fog: '#b8b8b4', fogNear: 60, fogFar: 600, skyTop: '#7a8694', skyHor: '#c0c4c4', sat: 0.72, vig: 0.3, shadowExt: 22 },
  dusk: { az: 220, el: 5, sky: '#6a5a9a', ground: '#4a3038', hemi: 0.9, sun: '#ff8a5a', sunI: 2.4, fog: '#d88a7a', fogNear: 60, fogFar: 700, skyTop: '#3a3a7a', skyHor: '#ff9a6a', sunDisc: '#ffd8a8', sunSize: 0.006, sat: 1.15, gain: '#ffe8e0', vig: 0.32, shadowExt: 24 },
  rain: { az: 120, el: 50, sky: '#8a96a4', ground: '#5a4a40', hemi: 1.3, sun: '#c8d0d8', sunI: 0.7, fog: '#8e9aa6', fogNear: 30, fogFar: 380, skyTop: '#5a6674', skyHor: '#9aa6b2', sat: 0.8, vig: 0.32, shadowExt: 22, waterDeep: '#4a5a66', waterShal: '#7a8a96' },
  office: { az: 60, el: 30, sky: '#f0e4d0', ground: '#6a4a30', hemi: 1.15, sun: '#ffe8c8', sunI: 1.8, fog: '#2a2018', fogNear: 200, fogFar: 900, skyTop: '#3a86d8', skyHor: '#d6e6f2', sat: 1.08, gain: '#fff4e6', vig: 0.3, shadowExt: 10 },
  parl: { az: 80, el: 60, sky: '#f0e8d8', ground: '#3a5a3a', hemi: 1.3, sun: '#fff0d8', sunI: 1.4, fog: '#2a2018', fogNear: 200, fogFar: 900, skyTop: '#3a86d8', skyHor: '#d6e6f2', sat: 1.08, gain: '#fff6ea', vig: 0.28, shadowExt: 16 },
  studio: { az: 100, el: 55, sky: '#ffffff', ground: '#c8b890', hemi: 1.35, sun: '#ffffff', sunI: 1.5, fog: '#ffffff', fogNear: 300, fogFar: 1200, skyTop: '#3a86d8', skyHor: '#d6e6f2', sat: 1.1, vig: 0.18, shadowExt: 12 },
};

// ---------- card helpers ----------
const PER = (T, who, o, pos, extra = {}) => ({ kind: 'person', key: 'p' + who + JSON.stringify(o), draw: (p) => T.person(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const EMU = (T, o, pos, extra = {}) => ({ kind: 'emu', key: 'e' + JSON.stringify(o), draw: (p) => T.emu(p, o), x: pos[0], y: pos[1], z: pos[2], s: 1.02, ...extra });
const FX = (key, draw, pos, s, extra = {}) => ({ kind: 'fx', key, draw, x: pos[0], y: pos[1], z: pos[2], w: s, h: s, blob: false, shadow: false, order: 5, ...extra });
const ph8 = (x) => (Math.round((((x % 1) + 1) % 1) * 8) % 8) / 8;
/** overlay card filling the view at `dist` in front of the camera */
const overlay = (C, key, draw, dist = 2.5, extra = {}) => {
  const f = [C.look[0] - C.pos[0], C.look[1] - C.pos[1], C.look[2] - C.pos[2]], fl = Math.hypot(...f); f.forEach((v, i) => (f[i] = v / fl));
  const r = [-f[2], 0, f[0]], rl = Math.hypot(...r); r.forEach((v, i) => (r[i] = v / rl));
  const up = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
  const h = 2 * dist * Math.tan(C.fov * Math.PI / 360) * 1.06, w = h * 16 / 9;
  const c = C.pos.map((v, i) => v + f[i] * dist - up[i] * h * 0.475);
  return { kind: 'fx', key, draw, x: c[0], y: c[1], z: c[2], w, h, dw: 1000, res: 0.9, face: true, nd: false, fog: false, blob: false, shadow: false, order: 9, ...extra };
};
/** a herd of emus. sp: n, seed, c:[x,z], spread:[sx,sz], v:[vx,vz] m/s, f0, mode, res, rate (cycles/s), eat (share eating) */
const herd = (T, f, sp, out) => {
  const { n, seed = 1, c, spread = [10, 10], v = [0, 0], f0 = 0, mode = 'run', res = 0.32, rate = 2.6, s = 1, eat = 0, tint, y = 0 } = sp;
  const t = (f - f0) / 30;
  for (let i = 0; i < n; i++) {
    const r1 = rnd(seed, i), r2 = rnd(seed + 1, i), r3 = rnd(seed + 2, i);
    const vx = v[0] * (0.85 + 0.3 * r3), vz = v[1] * (0.85 + 0.3 * r3);
    const x = c[0] + (r1 - 0.5) * spread[0] + vx * t, z = c[1] + (r2 - 0.5) * spread[1] + vz * t;
    const md = eat && r3 < eat ? 'eat' : mode;
    const still = md === 'eat' || md === 'stand' || md === 'alarm';
    const o = { mode: md, phase: still ? 0 : ph8(t * rate * (0.9 + 0.2 * r1) + r2) };
    const moving = Math.abs(vx) + Math.abs(vz) > 0.01;
    out.push(EMU(T, o, [x, y, z], { vx: moving ? vx : (r1 < 0.5 ? 1 : -1), vz: moving ? vz : 0, res, s: s * (0.9 + 0.2 * r3), tint }));
  }
};

// ---------- shots ----------
const SH = [];
const S = (id, a, b, light, keys, o = {}) => SH.push({ id, a, b, light, keys, ...o });
const K = (f, pos, look, fov = 32, extra = {}) => ({ f, pos, look, fov, ...extra });
const idleT = (f, s) => q(1.4 * Math.sin((f + s * 7) * 0.05), 1);
const bl = (f, s) => blinkAt(f, s);
const GUN1 = [20, 0, -4];

// 1 hook: soldiers + Lewis gun at the edge of the wheat
S('hook', 0, 174, 'day', [K(0, [20.6, 1.25, -6.6], [19.7, 1.5, -3.0], 34), K(30, [20.8, 1.3, -7.0], [19.7, 1.5, -3.0], 34), K(150, [25.5, 4.2, -15], [19.2, 1.2, -3.2], 40), K(174, [25.8, 4.4, -15.4], [19.2, 1.2, -3.2], 40)], {
  dof: [[19.4, 1.6, -3.1], 10, 0, 60],
  w: (f, W) => { W.guns = [{ x: GUN1[0], z: GUN1[2], yaw: Math.PI / 2, pitch: 0.05 }]; },
  act: (f, T, out) => {
    out.push(PER(T, 'gunner', { expr: 'stern', blink: bl(f, 3), tilt: idleT(f, 3), look: -0.3 }, [19.3, 0, -3.1]));
    out.push(PER(T, 'gunner2', { expr: 'stern', blink: bl(f, 5), L: 'hold', tilt: idleT(f, 5) }, [21.0, 0, -3.3]));
    out.push(PER(T, 'major', { expr: 'stern', R: f > 70 ? 'point' : 'hang', L: 'hip', blink: bl(f, 7), facing: -1 }, [17.4, 0, -2.6]));
    herd(T, f, { n: 6, seed: 4, c: [20, -60], spread: [40, 10], mode: 'stand', res: 0.25, eat: 0.6, y: 0.75 }, out);
  },
});
S('lost', 175, 206, 'day', [K(175, [20.8, 1.75, -0.6], [19.3, 1.75, -3.1], 30), K(206, [20.5, 1.7, -1.1], [19.3, 1.7, -3.1], 28)], {
  dof: [[19.3, 1.8, -3.1], 12],
  w: (f, W) => { W.guns = [{ x: GUN1[0], z: GUN1[2], yaw: Math.PI / 2, pitch: lerp(0.05, -0.25, sm(ramp(f, 180, 196))) }]; },
  act: (f, T, out) => { out.push(PER(T, 'gunner', { expr: 'sad', blink: bl(f, 3), headTilt: q(-6 * sm(ramp(f, 180, 195)), 1), tilt: q(-3 * sm(ramp(f, 180, 195)), 1) }, [19.3, 0, -3.1])); },
});
S('birds', 207, 260, 'day', [K(207, [20.6, 1.7, -1.0], [19.6, 1.75, -3.1], 30), K(260, [20.4, 1.7, -1.3], [19.6, 1.75, -3.1], 28)], {
  dof: [[19.5, 1.8, -3.0], 10],
  act: (f, T, out) => {
    out.push(PER(T, 'gunner', { expr: f > 222 ? 'shock' : 'sad', blink: 0, look: 0.8, headTilt: f > 222 ? 4 : -6 }, [19.3, 0, -3.1]));
    const k = M.back(ramp(f, 210, 222));
    out.push(EMU(T, { mode: 'stand', expr: f > 236 ? 'smug' : 'neutral', blink: bl(f, 9), look: -0.2 }, [lerp(22.5, 20.0, k), 0, -3.9], { res: 0.8, flip: true, s: 1.05 }));
  },
});
// 2 Campion
S('campion', 261, 381, 'day', [K(261, [-60, 55, 90], [-10, 0, -10], 40), K(381, [8, 3.2, 34], [2, 1.9, 23], 36, { path: [[-20, 26, 70]] })], {
  dof: [[2, 1.9, 23], 0], w: (f, W) => { W.mill = 0.08; },
});
// 3 veterans get land (fields still empty)
S('veterans', 382, 547, 'day', [K(382, [-17, 1.7, 30.4], [-19, 1.4, 25], 40), K(547, [-15.6, 1.75, 30.2], [-17.4, 1.4, 25], 36)], {
  dof: [[-15, 1.5, 25.5], 6],
  w: (f, W) => { W.wheat = 0.03; },
  act: (f, T, out) => {
    const wk = Math.min(1, (f - 382) / 70), st = (k) => f < 452 ? q(((f + k * 9) / 18) % 1, 2) : 0;
    const x0 = lerp(-24, -16, sm(wk));
    out.push(PER(T, 'farmerA', { step: st(0), prop: 'deed', R: f > 470 ? 'up' : 'hold', expr: f > 470 ? 'grin' : 'smile', blink: bl(f, 2) }, [x0, 0, 25.5]));
    out.push(PER(T, 'farmerB', { step: st(1), expr: 'smile', L: f > 480 ? 'wave' : 'hang', wv: q(f * 0.4, 1), blink: bl(f, 4) }, [x0 - 1.6, 0, 24.6]));
    out.push(PER(T, 'farmerC', { step: st(2), expr: 'grin', R: f > 490 ? 'up' : 'hang', blink: bl(f, 6) }, [x0 - 3.0, 0, 25.9]));
  },
});
// 4 rifle -> hoe, wheat grows
S('swap', 548, 677, 'day', [K(548, [6, 1.6, -3.5], [3, 1.5, -8.2], 32), K(640, [6.4, 1.8, -2.8], [3, 1.4, -8.2], 34), K(677, [7.8, 3.6, 0.5], [2, 0.8, -14], 40)], {
  dof: [[3, 1.6, -8.4], 8, 0, 120],
  w: (f, W) => { W.wheat = lerp(0.03, 0.9, sm(ramp(f, 640, 672))); W.green = true; },
  act: (f, T, out) => {
    const hoe = f >= 612;
    out.push(PER(T, 'farmerA', { prop: hoe ? 'hoe' : 'rifle', R: 'hold', expr: hoe ? 'grin' : 'neutral', blink: bl(f, 2), tilt: idleT(f, 2) }, [3, 0, -8.4]));
  },
  fx: (f, T, out) => { if (f >= 608 && f < 624) { const t = q((f - 608) / 16); out.push(FX('puff' + t, (p) => { p.g.translate(200, 300); p.g.scale(1.1, 1.1); T.fxPuff(p, t); }, [3.4, 0.6, -8.2], 1.4)); } },
});
// 5 depression
S('price', 678, 822, 'grey', [K(678, [-30.2, 1.8, 25.0], [-30.4, 1.6, 19.6], 38), K(822, [-30.4, 1.7, 24.2], [-30.6, 1.6, 19.6], 34)], {
  dof: [[-31.2, 1.6, 19.7], 5], w: (f, W) => { W.price = sm(ramp(f, 755, 805)); W.mill = 0.01; },
  act: (f, T, out) => { out.push(PER(T, 'farmerB', { expr: f > 790 ? 'shock' : 'sad', blink: f > 790 ? 0 : bl(f, 4), look: -0.5, L: f > 795 ? 'cheek' : 'hang', R: f > 795 ? 'cheek' : 'hang' }, [-29.3, 0.45, 19.9], { ground: 0.45 })); },
});
S('mail', 823, 906, 'grey', [K(823, [-4.6, 1.6, 27.6], [-6.6, 1.3, 23.0], 34), K(906, [-4.9, 1.55, 27.0], [-6.6, 1.3, 23.0], 30)], {
  dof: [[-6, 1.3, 23.3], 8], w: (f, W) => { W.mailOpen = sm(ramp(f, 845, 858)); W.price = 1; },
  act: (f, T, out) => { out.push(PER(T, 'farmerC', { expr: f > 862 ? 'sad' : 'neutral', blink: bl(f, 6), R: f < 862 ? 'point' : 'hang', look: 0.6 }, [-7.4, 0, 22.4])); },
  fx: (f, T, out) => { if (f > 856 && f < 900) { const t = (f - 856) / 44, w = q(Math.sin(t * 30), 1); out.push(FX('moth' + w, (p) => { p.ell(500, 500, 60, 40, '#cfc4a8', 10); p.ell(450, 470, 50, 36, '#e0d6bc', 8, 0, 360, -30 + 40 * w); p.ell(550, 470, 50, 36, '#e0d6bc', 8, 0, 360, 30 - 40 * w); }, [-6 + t * 0.8, 1.3 + t * 1.2, 23.6 + t * 0.3], 0.35)); } },
});
S('alone', 907, 974, 'grey', [K(907, [0.4, 1.6, -14], [0, 1.5, -22], 36), K(974, [0.6, 16, -2], [0, 0, -28], 46)], {
  dof: [[0, 1.5, -22], 0], w: (f, W) => { W.price = 1; },
  act: (f, T, out) => { out.push(PER(T, 'farmerD', { expr: 'sad', blink: bl(f, 8) }, [0, 0, -22])); },
});
// 6 dusk: they appear
S('appear', 975, 1060, 'dusk', [K(975, [1.5, 1.6, -13], [0, 1.3, -24], 42), K(1060, [1.4, 1.5, -14], [0, 1.4, -24], 36)], {
  dof: [[0, 1.6, -36], 0],
  act: (f, T, out) => {
    for (let i = 0; i < 9; i++) { const k = M.back(ramp(f, 1000 + i * 4, 1016 + i * 4)); out.push(EMU(T, { mode: 'stand', look: 0.6, blink: bl(f, i) }, [-9 + i * 2.2, lerp(-1.9, 0.0, k), -22 - (i % 3) * 2], { res: 0.45, blob: false, tint: '#8a6a8a', flip: i % 2 === 0 })); }
  },
});
// 7 migration
S('migrate', 1061, 1178, 'day', [K(1061, [-133, 1.6, 54], [-136, 1.3, 72], 40), K(1178, [-166, 1.8, 54], [-169, 1.3, 72], 40)], {
  dof: [[-160, 1.5, 70], 0],
  act: (f, T, out) => { herd(T, f, { n: 40, seed: 7, c: [-135, 74], spread: [34, 14], v: [-9, 0], f0: 1061, res: 0.4 }, out); },
  fx: (f, T, out) => { for (let i = 0; i < 6; i++) { const k = q(((f * 0.03 + i / 6) % 1), 2); out.push(FX('dust' + k, (p) => T.fxDust(p, k, '#d8a888'), [-135 - (f - 1061) * 0.3 + i * 6 - 18, 0.1, 82], 3, { tint: '#f0c8a8' })); } },
});
S('march', 1179, 1303, 'day', [K(1179, [-150, 26, 20], [-200, 0, 80], 40), K(1303, [-190, 22, 22], [-230, 0, 80], 40)], {
  dof: [[0, 0, 0], 0],
  act: (f, T, out) => { herd(T, f, { n: 110, seed: 9, c: [-170, 80], spread: [70, 40], v: [-9, 0.5], f0: 1179, res: 0.25 }, out); },
});
// 8 banquet
S('banquet', 1304, 1391, 'day', [K(1304, [9, 1.5, -1], [8, 2.2, -20], 36), K(1391, [9, 2.4, -3], [8, 1.8, -40], 40)], {
  dof: [[8, 1.6, -12], 0],
  act: (f, T, out) => { for (let i = 0; i < 5; i++) out.push(EMU(T, { mode: 'stand', look: 0.2, blink: bl(f, i + 2), expr: f > 1350 && i === 2 ? 'happy' : 'neutral' }, [4 + i * 2.2, 0, -6.6 - (i % 2) * 0.6], { res: 0.6, flip: i % 2 === 1 })); },
});
S('fields', 1392, 1486, 'day', [K(1392, [-10, 4, 10], [-14, 7, 19], 40), K(1486, [-2, 22, 14], [10, 0, -60], 46, { path: [[-8, 12, 12]] })], {
  dof: [[0, 0, 0], 0], w: (f, W) => { W.mill = 0.14; },
});
S('restaurant', 1487, 1610, 'day', [K(1487, [0, 1.7, -3], [0, 1.5, -9.9], 34), K(1610, [-0.6, 1.6, -4.5], [0, 1.6, -9.9], 30)], {
  dof: [[0, 1.5, -9.4], 6], w: (f, W) => { W.rest = true; },
  act: (f, T, out) => {
    out.push(EMU(T, { mode: 'stand', look: 0.0, expr: f > 1540 ? 'happy' : 'neutral', blink: bl(f, 3) }, [-1.8, 0, -8.6], { res: 0.6, flip: false }));
    out.push(EMU(T, { mode: 'stand', look: 0.2, expr: f > 1560 ? 'happy' : 'neutral', blink: bl(f, 5) }, [1.9, 0, -8.4], { res: 0.6, flip: true }));
    const wk = ph8((f - 1487) / 14);
    out.push(EMU(T, { mode: f < 1580 ? 'walk' : 'stand', phase: f < 1580 ? wk : 0, blink: bl(f, 7) }, [lerp(-9, -4, sm(ramp(f, 1487, 1580))), 0, -7.4], { res: 0.55, vx: 1, vz: 0 }));
  },
});
S('invade', 1611, 1707, 'day', [K(1611, [30, 14, 22], [6, 0, -14], 44), K(1707, [36, 18, 26], [6, 0, -18], 46)], {
  dof: [[0, 0, 0], 0], w: (f, W) => { W.fenceBreak = 1; },
  act: (f, T, out) => {
    for (let i = 0; i < 140; i++) {
      const r1 = rnd(31, i), r2 = rnd(32, i), t = (f - 1611) / 30 + 1.6 - r2 * 3.4;
      const z = 18 - t * 9 + r1 * 4, x = -30 + r1 * 70; let y = 0;
      if (z < -8.5 && z > -11.5) y = Math.sin((z + 11.5) / 3 * Math.PI) * 1.4; else if (z <= -11.5) y = 0.7;
      if (z < -50) continue;
      out.push(EMU(T, { mode: 'run', phase: ph8(t * 2.6 + r1) }, [x, y, z], { res: 0.25, vx: 0, vz: -1, s: 0.95 + 0.15 * r2, blob: z > -9 }));
    }
  },
});
// 9 close-up of one emu
S('meet', 1708, 1869, 'day', [K(1708, [3.6, 0.35, 2.6], [1, 0.3, 0], 34), K(1780, [3.8, 0.6, 3.2], [1, 0.4, 0], 34), K(1869, [5.2, 1.4, 4.6], [0.9, 1.3, 0], 34)], {
  dof: [[1, 1, 0], 6], w: (f, W) => { W.ruler = [-0.4, 0, -0.3]; },
  act: (f, T, out) => {
    out.push(EMU(T, { mode: 'stand', blink: bl(f, 3), look: 0.5, expr: f > 1830 ? 'smug' : 'neutral' }, [1.2, 0, 0], { res: 1.1, s: 1.12, flip: true }));
    out.push(PER(T, 'farmerC', { expr: f > 1820 ? 'shock' : 'neutral', look: 0.7, blink: bl(f, 6) }, [2.9, 0, -0.8]));
  },
});
S('legs', 1870, 1899, 'day', [K(1870, [2.4, 0.5, 2.3], [1.2, 0.6, 0], 30), K(1899, [2.2, 0.55, 2.2], [1.2, 0.65, 0], 28)], {
  dof: [[1.2, 0.6, 0], 8],
  act: (f, T, out) => { out.push(EMU(T, { mode: 'walk', phase: ph8((f - 1870) / 24), blink: 0 }, [1.2 - (f - 1870) * 0.004, 0, 0], { res: 1.1, s: 1.12, vx: -1, vz: 0 })); },
});
S('dash', 1900, 1980, 'day', [K(1900, [4, 1.3, 7], [0, 1.0, 0], 36), K(1980, [3, 1.3, 7.6], [-14, 1.0, 0], 40, { ease: 'easeOut' })], {
  dof: [[0, 1, 0], 0], w: (f, W) => { W.speed = [-6, 0, 1.6]; },
  act: (f, T, out) => { const t = Math.max(0, f - 1905) / 30; out.push(EMU(T, { mode: f < 1905 ? 'stand' : 'run', phase: ph8(t * 3), expr: 'smug' }, [1 - t * t * 4 - t * 6, 0, 0], { res: 0.8, s: 1.1, vx: -1, vz: 0 })); },
  fx: (f, T, out, C) => { if (f > 1912) { const t = q(((f - 1912) / 20) % 1, 2); out.push(overlay(C, 'spd' + t, (p) => T.fxSpeed(p, t), 2.2, { alpha: 0.9 })); } },
});
// 10 damage
S('damage', 1981, 2172, 'day', [K(1981, [12.4, 1.2, -3.2], [13.5, 1.0, -11], 34), K(2080, [11.6, 1.3, -2.6], [13.5, 0.9, -10], 36), K(2172, [10.6, 0.8, -3.2], [13.5, 0.4, -10], 34)], {
  dof: [[13.5, 0.9, -10], 4],
  w: (f, W) => { W.fenceBreak = sm(ramp(f, 2055, 2075)); },
  act: (f, T, out) => {
    let z = -12.6, mode = 'eat';
    if (f > 2002 && f < 2035) mode = 'stand';
    if (f >= 2035) { z = lerp(-12.6, -7, sm(ramp(f, 2035, 2100))); mode = f < 2100 ? 'walk' : 'stand'; }
    const stomp = f > 2008 && f < 2030 ? ((f - 2008) % 8 < 3 ? 0.06 : 0) : 0;
    out.push(EMU(T, { mode, phase: mode === 'walk' ? ph8((f - 2035) / 16) : 0, blink: bl(f, 4), expr: f > 2100 ? 'smug' : 'neutral' }, [13.5, stomp, z], { res: 0.75, flip: true, s: 1.05 }));
    for (let i = 0; i < 4; i++) { const t0 = 2105 + i * 12; if (f < t0) continue; const t = (f - t0) / 30; const rz = -12 + t * 3.2; if (rz > -4) continue; out.push({ kind: 'fx', key: 'rab' + ph8(t * 2.5), draw: (p) => T.rabbit(p, ph8(t * 2.5)), x: 13.2 + (i % 2 ? 0.5 : -0.4), y: 0, z: rz, w: 0.55, h: 0.55, res: 0.4, order: 3, vx: 0, vz: 1 }); }
  },
  fx: (f, T, out) => { if (f > 2010 && f < 2034) { const k = q(((f - 2010) % 8) / 8, 2); out.push(FX('dst' + k, (p) => T.fxDust(p, k, '#d8b888'), [13.5, 0.05, -12.4], 1.2, { tint: '#f0d0a8' })); } },
});
// 11 veterans call for help
S('salute', 2173, 2311, 'day', [K(2173, [-24, 1.6, 30.4], [-24, 1.5, 24.5], 48), K(2311, [-24.4, 1.6, 30.0], [-24, 1.6, 24.5], 44)], {
  dof: [[-24, 1.6, 24.5], 5],
  act: (f, T, out) => { ['farmerA', 'farmerB', 'farmerC', 'farmerD'].forEach((k, i) => out.push(PER(T, k, { expr: 'stern', R: f > 2190 + i * 4 ? 'salute' : 'hang', blink: bl(f, i + 1), tilt: idleT(f, i) }, [-27 + i * 2, 0, 24.5 + (i % 2) * 0.3]))); },
});
S('reinforce', 2312, 2361, 'day', [K(2312, [-24, 1.4, 28], [-24, 1.9, 24.5], 38), K(2361, [-24, 1.3, 27.4], [-24, 2.0, 24.5], 36)], {
  dof: [[-24, 1.8, 24.5], 5],
  act: (f, T, out) => { ['farmerA', 'farmerB', 'farmerC', 'farmerD'].forEach((k, i) => out.push(PER(T, k, { expr: 'grin', L: 'fist', R: i === 1 ? 'up' : 'fist', prop: i === 1 ? 'paper' : null, blink: bl(f, i + 1), bob: q(0.02 * Math.abs(Math.sin((f + i * 5) * 0.4)), 3) }, [-27 + i * 2, 0, 24.5 + (i % 2) * 0.3]))); },
});
// 12 the capital
S('capital', 2362, 2520, 'office', [K(2362, off(OFF, 0, 1.9, 6.5), off(OFF, 0, 1.4, -3), 40), K(2520, off(OFF, 0.6, 1.7, 2.4), off(OFF, 0, 1.6, -3.2), 32)], {
  dof: [off(OFF, 0, 1.6, -3.2), 3], camShadow: off(OFF, 0, 1, -1),
  act: (f, T, out) => {
    out.push(PER(T, 'minister', { expr: 'neutral', L: 'belly', R: 'belly', blink: bl(f, 2), tilt: idleT(f, 2) }, off(OFF, 0, 0, -3.3)));
    ['farmerA', 'farmerB', 'farmerC'].forEach((k, i) => out.push(PER(T, k, { prop: 'hatHand', R: 'chest', hatOff: true, expr: 'nervous', blink: bl(f, i + 3) }, off(OFF, [-2.3, -1.1, 1.7][i], 0, 0.4 + (i % 2) * 0.3))));
  },
});
S('ask', 2521, 2580, 'office', [K(2521, off(OFF, 1.2, 1.6, 2.6), off(OFF, 0, 1.7, 0.6), 34), K(2580, off(OFF, 1.1, 1.6, 2.4), off(OFF, 0, 1.75, 0.6), 30)], {
  dof: [off(OFF, 0, 1.7, 0.6), 8], camShadow: off(OFF, 0, 1, -1),
  act: (f, T, out) => {
    out.push(PER(T, 'farmerB', { prop: 'hatHand', R: 'chest', hatOff: true, L: f > 2540 ? 'fist' : 'hang', expr: f > 2540 ? 'angry' : 'neutral', blink: bl(f, 4) }, off(OFF, 0, 0, 0.7)));
    out.push(PER(T, 'minister', { expr: f > 2560 ? 'shock' : 'neutral', L: 'belly', R: 'belly', blink: 0 }, off(OFF, 0.2, 0, -3.3)));
  },
});
S('stamp', 2581, 2704, 'office', [K(2581, off(OFF, 0.9, 1.9, -0.6), off(OFF, 0.3, 1.0, -1.8), 34), K(2626, off(OFF, 0.9, 1.9, -0.6), off(OFF, 0.3, 1.0, -1.8), 32), K(2704, off(OFF, 0.6, 1.8, -0.2), off(OFF, 0.1, 1.85, -3.3), 30)], {
  dof: [off(OFF, 0.2, 1.4, -2.6), 4], camShadow: off(OFF, 0, 1, -2),
  w: (f, W) => { const k = ramp(f, 2590, 2604); W.stampUp = f < 2590 ? 1 : f < 2604 ? 1 - k : sm(ramp(f, 2606, 2616)) * 0.6; W.approved = f >= 2604; },
  act: (f, T, out) => { out.push(PER(T, 'minister', { expr: f > 2620 ? 'smug' : 'grin', L: 'belly', R: f > 2650 ? 'up' : 'belly', blink: bl(f, 2), tilt: idleT(f, 2) }, off(OFF, 0.1, 0, -3.3))); },
  fx: (f, T, out) => { if (f >= 2603 && f < 2612) { const t = q((f - 2603) / 9); out.push(FX('bst' + t, (p) => T.fxBurst(p, t, '#fff3b0'), off(OFF, 0.3, 0.6, -1.7), 1.0)); } },
});
// 13 the minister's dream (studio)
S('dream', 2705, 2894, 'studio', [K(2705, off(STU, -3, 1.7, 5.6), off(STU, -3, 1.4, 0), 36), K(2780, off(STU, -0.5, 1.7, 5.6), off(STU, -0.5, 1.4, 0), 36), K(2835, off(STU, 3.2, 1.8, 5.6), off(STU, 3.2, 1.4, 0), 36), K(2894, off(STU, 3.4, 1.7, 4.8), off(STU, 3.4, 1.5, 0), 32)], {
  dof: [off(STU, 0, 1.4, 0), 0], w: (f, W) => { W.backdrop = '#f2c46a'; },
  cam: (f, C) => { if (f >= 2868 && f < 2876) C.flash = (1 - (f - 2868) / 8) * 0.9; },
  act: (f, T, out) => {
    out.push(PER(T, 'gunner', { prop: 'rifle', R: 'hold', L: 'cross', expr: 'stern', blink: bl(f, 1), tilt: idleT(f, 1) }, off(STU, -3.8, 0, 0)));
    out.push({ kind: 'fx', key: 'target', draw: (p) => { for (let i = 0; i < 4; i++) p.ell(500, 500, 400 - i * 100, 400 - i * 100, i % 2 ? '#ffffff' : '#c0353a', 10); }, x: STU[0] - 1.8, y: 0.8, z: -1, w: 1.2, h: 1.2, blob: false, res: 0.4 });
    out.push(PER(T, 'farmerA', { expr: 'laugh', L: 'up', R: 'up', blink: 0, bob: q(0.03 * Math.abs(Math.sin(f * 0.3)), 3) }, off(STU, -0.4, 0, 0)));
    out.push(PER(T, 'minister', { expr: 'proud', L: 'belly', R: f > 2860 ? 'up' : 'belly', blink: bl(f, 2) }, off(STU, 3, 0, 0)));
    out.push({ kind: 'fx', key: 'cam1', draw: (p) => T.filmCam(p, 0), x: STU[0] + 4.6, y: 0, z: 1.6, w: 1.0, h: 1.7, dw: 600, res: 0.6 });
  },
});
S('cameraman', 2895, 2992, 'day', [K(2895, [14, 1.7, 30.4], [10, 1.4, 27.5], 36), K(2992, [13.2, 1.6, 30.2], [10, 1.5, 27.5], 32)], {
  dof: [[9.5, 1.5, 27.6], 6],
  act: (f, T, out) => {
    out.push(PER(T, 'camera', { expr: 'grin', L: 'wave', wv: q(f * 0.3, 1), blink: bl(f, 2) }, [8.4, 0, 27.4]));
    out.push({ kind: 'fx', key: 'cam' + ph8(f / 12), draw: (p) => T.filmCam(p, ph8(f / 12)), x: 10, y: 0, z: 27.8, w: 1.0, h: 1.7, dw: 600, res: 0.7, flip: true });
  },
});
// 14 major Meredith + crew
S('major', 2993, 3102, 'day', [K(2993, off(CAMP, -1, 1.7, 9), off(CAMP, -1, 1.8, 4.6), 34), K(3102, off(CAMP, -1, 1.85, 7.4), off(CAMP, -1, 1.9, 4.6), 28)], {
  dof: [off(CAMP, -1, 1.9, 4.6), 7],
  act: (f, T, out) => { out.push(PER(T, 'major', { expr: f > 3040 ? 'proud' : 'stern', R: f > 3020 ? 'salute' : 'hang', L: 'hip', blink: bl(f, 7), tilt: idleT(f, 7) }, off(CAMP, -1, 0, 4.6))); },
});
S('crew', 3103, 3224, 'day', [K(3103, off(CAMP, -4, 1.6, 12), off(CAMP, -1, 1.2, 4.5), 40), K(3224, off(CAMP, 7.6, 1.7, 9), off(CAMP, 4.4, 0.7, 2.3), 34, { path: [off(CAMP, 1, 1.6, 11)] })], {
  dof: [off(CAMP, 2, 1, 4), 0],
  w: (f, W) => { W.guns = [{ x: CAMP[0] - 0.4, z: CAMP[2] + 5.4, yaw: -0.4 }, { x: CAMP[0] + 1.8, z: CAMP[2] + 5.0, yaw: 0.3 }]; },
  act: (f, T, out) => {
    out.push(PER(T, 'major', { expr: 'proud', L: 'hip', R: 'point', blink: bl(f, 7) }, off(CAMP, -2.6, 0, 4.6)));
    out.push(PER(T, 'gunner', { expr: 'stern', R: 'salute', blink: bl(f, 3) }, off(CAMP, -0.8, 0, 4.4)));
    out.push(PER(T, 'gunner2', { expr: 'stern', R: 'salute', blink: bl(f, 5) }, off(CAMP, 1.0, 0, 4.2)));
  },
});
S('vs', 3225, 3347, 'day', [K(3225, off(CAMP, 6.2, 1.0, 5.5), off(CAMP, 4.3, 0.7, 2.3), 36), K(3347, off(CAMP, 6.4, 1.3, 4.6), off(CAMP, 6.3, 1.4, 2.0), 30)], {
  dof: [off(CAMP, 6.3, 1.3, 2.0), 7],
  act: (f, T, out) => { const k = M.back(ramp(f, 3268, 3282)); out.push(EMU(T, { mode: 'stand', expr: f > 3300 ? 'smug' : 'neutral', blink: bl(f, 5), look: 0.9 }, off(CAMP, lerp(7.4, 6.3, k), 0, 2.0), { res: 0.7, flip: true, s: 0.95 })); },
});
// 15 rain
const rainFx = (f, T, out, C, a = 0.7) => { const t = q(((f / 10) % 1), 1); out.push(overlay(C, 'rain' + t, (p) => T.fxRain(p, t), 2.2, { alpha: a })); };
S('rain', 3348, 3428, 'rain', [K(3348, off(CAMP, -1, 1.5, 6), off(CAMP, 0, 1.2, 0), 36), K(3428, off(CAMP, -1, 1.4, 5.2), off(CAMP, 0, 1.2, 0), 33)], {
  dof: [off(CAMP, 0, 1.2, 1.5), 4], w: (f, W) => { W.wet = true; },
  act: (f, T, out) => { out.push(PER(T, 'gunner', { expr: 'sad', blink: bl(f, 3), L: 'cross', R: 'cross' }, off(CAMP, -0.6, 0, 2.2))); out.push(PER(T, 'gunner2', { expr: 'sad', blink: bl(f, 5) }, off(CAMP, 0.8, 0, 1.9))); },
  fx: (f, T, out, C) => rainFx(f, T, out, C),
});
S('scatter', 3429, 3505, 'rain', [K(3429, [40, 9, 140], [40, 0, 100], 46), K(3505, [46, 11, 144], [40, 0, 100], 48)], {
  dof: [[0, 0, 0], 0], w: (f, W) => { W.wet = true; },
  act: (f, T, out) => { herd(T, f, { n: 50, seed: 15, c: [40, 100], spread: [110, 60], mode: 'stand', res: 0.22, eat: 0.5 }, out); },
  fx: (f, T, out, C) => rainFx(f, T, out, C, 0.6),
});
S('wait', 3506, 3578, 'rain', [K(3506, off(CAMP, -2.4, 1.6, 8.2), off(CAMP, -2.4, 1.4, 4.6), 34), K(3578, off(CAMP, -2.4, 1.55, 7.6), off(CAMP, -2.4, 1.5, 4.6), 31)], {
  dof: [off(CAMP, -2.4, 1.5, 4.6), 6], w: (f, W) => { W.wet = true; },
  act: (f, T, out) => { out.push(PER(T, 'major', { expr: 'sad', L: 'cross', R: 'cross', blink: bl(f, 7), headTilt: q(4 * Math.sin(f * 0.08), 1) }, off(CAMP, -2.4, 0, 4.6))); },
  fx: (f, T, out, C) => rainFx(f, T, out, C),
});
// 16 2 November
S('binoc', 3579, 3660, 'day', [K(3579, [20.4, 1.75, 44], [20, 1.8, 41], 34), K(3660, [20.4, 1.75, 43.4], [20, 1.85, 41], 30)], {
  dof: [[20, 1.8, 41], 6],
  act: (f, T, out) => { out.push(PER(T, 'major', { expr: 'stern', L: 'eyes', R: 'eyes', blink: 0 }, [20, 0, 41])); out.push(PER(T, 'gunner', { expr: 'neutral', blink: bl(f, 3), look: -0.5 }, [21.6, 0, 41.6])); },
});
S('pov', 3661, 3739, 'day', [K(3661, [20, 1.8, 41], [40, 0.8, 110], 10), K(3739, [20, 1.8, 41], [42, 0.8, 110], 9)], {
  dof: [[40, 1, 110], 0],
  act: (f, T, out) => { herd(T, f, { n: 50, seed: 17, c: [40, 110], spread: [40, 16], mode: 'stand', eat: 0.6, res: 0.25 }, out); },
  fx: (f, T, out, C) => { out.push(overlay(C, 'binoc', (p) => { const g = p.g; g.fillStyle = '#0c0a10'; g.fillRect(0, 0, 1000, 563); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(370, 281, 235, 0, 7); g.fill(); g.beginPath(); g.arc(630, 281, 235, 0, 7); g.fill(); g.globalCompositeOperation = 'source-over'; }, 1.5)); },
});
S('push', 3740, 3868, 'day', [K(3740, [30, 1.7, 98], [36, 1.3, 108], 38), K(3868, [36, 1.7, 92], [42, 1.3, 102], 38)], {
  dof: [[40, 1.3, 106], 0],
  act: (f, T, out) => {
    const t = (f - 3740) / 30; herd(T, f, { n: 26, seed: 19, c: [40, 106], spread: [14, 6], v: [0.4, -2.4], f0: 3740, mode: 'walk', rate: 1.5, res: 0.4 }, out);
    ['farmerA', 'farmerB', 'farmerD'].forEach((k, i) => out.push(PER(T, k, { expr: 'grin', L: 'wave', R: 'wave', wv: q(f * 0.5 + i, 1), step: q(((f + i * 6) / 14) % 1, 2), blink: 0 }, [36 + i * 4, 0, 116 - t * 2.2 + (i % 2)])));
  },
});
S('far', 3869, 3946, 'day', [K(3869, [19.0, 1.8, 39.6], [36, 1.0, 96], 24), K(3946, [19.1, 1.8, 39.8], [36, 1.0, 96], 20)], {
  dof: [[20.1, 1.8, 41.9], 6, 0, 10],
  w: (f, W) => { W.guns = [{ x: 20.4, z: 42.8, yaw: -1.25, pitch: 0.05 }]; },
  act: (f, T, out) => {
    out.push(PER(T, 'gunner', { expr: 'squint', blink: 0, facing: 1 }, [20.1, 0, 41.9]));
    herd(T, f, { n: 24, seed: 21, c: [40, 98], spread: [14, 8], mode: 'stand', eat: 0.5, res: 0.3 }, out);
  },
});
S('fire1', 3947, 3999, 'day', [K(3947, [23.2, 1.5, 41.6], [20.6, 1.1, 42.6], 38), K(3999, [23.5, 1.5, 41.4], [20.6, 1.1, 42.6], 36)], {
  dof: [[20.4, 1.1, 43], 5],
  cam: (f, C) => { if (f > 3952 && f < 3992) { const s = (f % 2 ? 1 : -1) * 0.03; C.look = [C.look[0], C.look[1] + s, C.look[2]]; } },
  w: (f, W) => { W.guns = [{ x: 20.4, z: 42.8, yaw: -1.25, pitch: 0.05, recoil: f > 3952 && f < 3992 ? (f % 2) : 0 }]; },
  act: (f, T, out) => { out.push(PER(T, 'gunner', { expr: 'angry', blink: 0, facing: 1, bob: f > 3952 && f < 3992 ? (f % 2) * 0.01 : 0 }, [20.1, 0, 41.9])); },
  fx: (f, T, out) => { if (f > 3952 && f < 3992 && f % 3 !== 2) out.push(FX('mz' + (f % 3), (p) => T.fxMuzzle(p, f % 3, f % 3 + 1), [20.4 + Math.cos(-1.25) * 1.3, 0.85, 42.8 - Math.sin(-1.25) * 1.3], 0.9, { nd: false, fog: false })); },
});
S('unexpected', 4000, 4089, 'day', [K(4000, [36, 1.6, 90], [40, 1.6, 97], 34), K(4089, [36.6, 1.5, 91], [40, 1.6, 97], 30)], {
  dof: [[40, 1.6, 97], 5],
  act: (f, T, out) => { for (let i = 0; i < 5; i++) out.push(EMU(T, { mode: f < 4040 ? 'alarm' : 'stand', expr: f < 4040 ? 'alarm' : 'smug', look: (i % 2 ? 0.8 : -0.8), blink: f > 4040 ? bl(f, i) : 0 }, [37.6 + i * 1.5, 0, 97 + (i % 2) * 1.4], { res: 0.55, flip: i % 2 === 0 })); },
  fx: (f, T, out) => { if (f > 4004 && f < 4040) out.push(FX('ex' + q((f - 4004) / 36, 1), (p) => T.fxExclaim(p, q((f - 4004) / 36, 1)), [40.5, 2.4, 97], 0.8)); },
});
S('split', 4090, 4215, 'day', [K(4090, [40, 30, 70], [40, 0, 100], 44), K(4215, [40, 36, 64], [40, 0, 100], 50)], {
  dof: [[0, 0, 0], 0],
  act: (f, T, out) => {
    const t = Math.max(0, (f - 4096) / 30);
    for (let gI = 0; gI < 8; gI++) { const a = gI / 8 * Math.PI * 2 + 0.3; for (let i = 0; i < 6; i++) { const r1 = rnd(23, gI * 10 + i), r2 = rnd(24, gI * 10 + i); const vx = Math.cos(a) * 8, vz = Math.sin(a) * 8; out.push(EMU(T, { mode: t > 0 ? 'run' : 'stand', phase: t > 0 ? ph8(t * 2.6 + r1) : 0 }, [40 + (r1 - 0.5) * 6 + vx * t, 0, 100 + (r2 - 0.5) * 6 + vz * t], { res: 0.25, vx, vz })); } }
  },
});
S('confetti', 4216, 4309, 'day', [K(4216, [23.2, 1.6, 38.6], [20.2, 1.3, 42.2], 40), K(4309, [23.6, 1.7, 38.2], [20.2, 1.3, 42.2], 40)], {
  dof: [[20.6, 1.4, 43.4], 4],
  w: (f, W) => { W.guns = [{ x: 20.4, z: 42.8, yaw: -1.25 + 0.6 * Math.sin(f * 0.25), pitch: 0.05 }]; },
  act: (f, T, out) => { out.push(PER(T, 'gunner', { expr: 'dazed', blink: 0, facing: 1, headTilt: q(8 * Math.sin(f * 0.25), 0) }, [20.1, 0, 41.9])); },
  fx: (f, T, out, C) => { const t = q(((f - 4216) / 40) % 1, 2); out.push(overlay(C, 'conf' + t, (p) => T.fxConfetti(p, t), 2.0)); },
});
// 17 the dam ambush
S('dam', 4310, 4439, 'golden', [K(4310, [60, 14, 30], [86, 0, 58], 44), K(4439, [70, 3.4, 40], [78, 1.0, 52], 40, { path: [[64, 8, 34]] })], {
  dof: [[76, 1, 50], 0], camFlash: 4310,
  w: (f, W) => { W.guns = [{ x: BAGS[0] - 0.6, z: BAGS[2] - 1.0, yaw: -1.1, pitch: 0.02 }, { x: BAGS[0] + 2.2, z: BAGS[2] - 0.6, yaw: -1.0, pitch: 0.02 }]; },
  act: (f, T, out) => {
    out.push(PER(T, 'major', { expr: 'stern', L: 'eyes', R: 'eyes', blink: 0 }, [BAGS[0] - 2.8, 0, BAGS[2] - 1.3]));
    out.push(PER(T, 'gunner', { expr: 'stern', blink: bl(f, 3), facing: 1 }, [BAGS[0] - 0.9, 0, BAGS[2] - 1.9]));
    out.push(PER(T, 'gunner2', { expr: 'stern', blink: bl(f, 5), facing: 1 }, [BAGS[0] + 1.8, 0, BAGS[2] - 1.5]));
  },
});
S('thousand', 4440, 4560, 'golden', [K(4440, [96, 1.2, 104], [122, 1.4, 124], 34), K(4560, [98, 1.1, 106], [122, 1.4, 124], 30)], {
  dof: [[0, 0, 0], 0],
  act: (f, T, out) => { herd(T, f, { n: 160, seed: 27, c: [140, 150], spread: [60, 60], v: [-3.2, -4], f0: 4440, mode: 'walk', rate: 1.6, res: 0.28 }, out); },
});
S('perfect', 4561, 4702, 'golden', [K(4561, [BAGS[0] - 1.8, 1.8, BAGS[2] - 6.4], [BAGS[0] - 1.9, 1.55, BAGS[2] - 1.5], 40), K(4702, [BAGS[0] - 1.9, 1.8, BAGS[2] - 5.8], [BAGS[0] - 1.4, 1.5, BAGS[2] + 2], 42)], {
  dof: [[BAGS[0] - 2.8, 1.7, BAGS[2] - 1.3], 6],
  w: (f, W) => { W.guns = [{ x: BAGS[0] - 0.6, z: BAGS[2] - 1.0, yaw: -1.1, pitch: 0.02 }]; },
  act: (f, T, out) => {
    out.push(PER(T, 'major', { expr: f < 4610 ? 'grin' : 'stern', L: 'hip', R: f > 4615 ? 'stop' : 'hang', blink: bl(f, 7), facing: 1 }, [BAGS[0] - 2.8, 0, BAGS[2] - 1.3]));
    out.push(PER(T, 'gunner', { expr: 'nervous', sweat: true, blink: bl(f, 3), facing: 1 }, [BAGS[0] - 0.9, 0, BAGS[2] - 1.9]));
    const t = (f - 4561) / 30; herd(T, f, { n: 40, seed: 29, c: [BAGS[0] + 14 - t * 1.6, BAGS[2] + 20 - t * 2.0], spread: [16, 12], mode: 'walk', rate: 1.4, res: 0.3, v: [-0.8, -1.0] }, out);
  },
});
S('fire2', 4703, 4789, 'golden', [K(4703, [BAGS[0] - 3, 1.2, BAGS[2] - 3.6], [BAGS[0] + 6, 1.2, BAGS[2] + 8], 40), K(4789, [BAGS[0] - 3.2, 1.2, BAGS[2] - 3.8], [BAGS[0] + 6, 1.2, BAGS[2] + 8], 42)], {
  dof: [[0, 0, 0], 0],
  cam: (f, C) => { if (f > 4705) { const s = (f % 2 ? 1 : -1) * 0.04; C.look = [C.look[0], C.look[1] + s, C.look[2]]; } },
  w: (f, W) => { W.guns = [{ x: BAGS[0] - 0.6, z: BAGS[2] - 1.0, yaw: -1.1 + 0.15 * Math.sin(f * 0.3), pitch: 0.02, recoil: f % 2 }, { x: BAGS[0] + 2.2, z: BAGS[2] - 0.6, yaw: -1.0, pitch: 0.02, recoil: (f + 1) % 2 }]; },
  act: (f, T, out) => { out.push(PER(T, 'gunner', { expr: 'angry', facing: 1, blink: 0 }, [BAGS[0] - 0.9, 0, BAGS[2] - 1.9])); herd(T, f, { n: 40, seed: 29, c: [BAGS[0] + 9, BAGS[2] + 12], spread: [18, 12], mode: 'alarm', res: 0.3 }, out); },
  fx: (f, T, out) => { for (const [g, yaw] of [[[BAGS[0] - 0.6, BAGS[2] - 1.0], -1.1], [[BAGS[0] + 2.2, BAGS[2] - 0.6], -1.0]]) if (f % 3 !== 2) out.push(FX('mz' + (f % 3), (p) => T.fxMuzzle(p, f % 3, f % 3 + 1), [g[0] + Math.cos(yaw) * 1.35, 0.9, g[1] - Math.sin(yaw) * 1.35], 0.9, { nd: false, fog: false })); },
});
S('jam', 4790, 4832, 'golden', [K(4790, [BAGS[0] + 0.4, 1.3, BAGS[2] - 3.6], [BAGS[0] - 0.6, 1.0, BAGS[2] - 1.0], 34), K(4832, [BAGS[0] + 0.3, 1.3, BAGS[2] - 3.2], [BAGS[0] - 0.6, 1.0, BAGS[2] - 1.0], 30)], {
  dof: [[BAGS[0] - 0.7, 1.1, BAGS[2] - 1.4], 6],
  w: (f, W) => { W.guns = [{ x: BAGS[0] - 0.6, z: BAGS[2] - 1.0, yaw: -1.1, pitch: -0.1 }]; },
  act: (f, T, out) => { out.push(PER(T, 'gunner', { expr: 'shock', facing: 1, blink: 0, L: 'cheek', R: 'cheek' }, [BAGS[0] - 0.9, 0, BAGS[2] - 1.9])); },
  fx: (f, T, out) => { const k = q(ramp(f, 4792, 4830), 2); out.push(FX('smk' + k, (p) => T.fxSmoke(p, k), [BAGS[0] - 0.4, 0.9, BAGS[2] - 1.0], 1.4)); out.push(FX('sl12', (p) => T.fxSlate(p, '12'), [BAGS[0] + 0.1, 0.8, BAGS[2] - 1.5], 0.8, { res: 0.5 })); },
});
S('leave', 4833, 4992, 'golden', [K(4833, [90, 1.5, 80], [96, 1.4, 86], 36), K(4992, [94, 1.6, 78], [104, 1.4, 86], 36)], {
  dof: [[98, 1.4, 86], 0],
  act: (f, T, out) => { const t = (f - 4833) / 30; for (let i = 0; i < 9; i++) out.push(EMU(T, { mode: 'walk', phase: ph8(t * 1.3 + i * 0.37), expr: i === 4 && f > 4900 ? 'smug' : 'neutral', blink: bl(f, i) }, [92 + t * 1.6 + i * 2.2 - 6, 0, 86 + (i % 3) * 1.6], { res: 0.45, vx: 1, vz: 0 })); },
});
// 18 the truck
S('major2', 4993, 5154, 'day', [K(4993, [14, 1.75, 30.4], [14, 1.85, 27.6], 34), K(5154, [15, 1.8, 30.6], [12.4, 1.6, 26.2], 40)], {
  dof: [[14, 1.85, 27.6], 6],
  w: (f, W) => { W.truck = { x: 9.5, z: 26, yaw: 0 }; },
  act: (f, T, out) => { out.push(PER(T, 'major', { expr: f > 5040 ? 'grin' : 'angry', L: f < 5040 ? 'fist' : 'hip', R: f > 5060 ? 'point' : 'hang', blink: bl(f, 7), facing: -1 }, [14, 0, 27.8])); },
});
const truckX = (f) => 9.5 + Math.max(0, f - 5155) / 30 * 7.5;
const truckAct = (f, T, out, tr, extra = {}) => {
  const c = Math.cos(tr.yaw || 0), s = Math.sin(tr.yaw || 0), w = (lx, lz) => [tr.x + c * lx + s * lz, tr.z - s * lx + c * lz];
  const b = tr.bounce || 0;
  const [gx, gz] = w(-2.1, 0.2); out.push(PER(T, 'gunner', { expr: extra.gExpr || 'stern', facing: 1, blink: 0 }, [gx, 0.98 + b * 1.4, gz], { ground: 0.98, blob: false, s: 0.95 }));
  const [dx, dz] = w(0.35, -0.35); out.push(PER(T, 'gunner2', { expr: extra.dExpr || 'neutral', blink: bl(f, 5), facing: 1, L: 'hold', R: 'hold' }, [dx, 0.62 + b, dz], { ground: 0.6, blob: false, s: 0.85 }));
};
S('truck', 5155, 5304, 'day', [K(5155, [6, 2.2, 17], [10, 1.2, 26], 44), K(5304, [38, 2.6, 16], [44, 1.2, 26], 44)], {
  dof: [[0, 0, 0], 0],
  w: (f, W) => { const x = truckX(f); W.truck = { x, z: 26, yaw: 0, dist: x, bounce: 0.04 * Math.abs(Math.sin(f * 0.6)) }; },
  act: (f, T, out, W) => { truckAct(f, T, out, W.truck, { gExpr: 'grin' }); },
  fx: (f, T, out) => { const x = truckX(f); for (let i = 0; i < 4; i++) { const k = q(((f * 0.05 + i / 4) % 1), 2); out.push(FX('dust' + k, (p) => T.fxDust(p, k, '#d8a888'), [x - 3.5 - k * 5, 0.1, 26 + (i - 1.5) * 0.6], 2.4 + k * 2, { tint: '#f0c8a8' })); } },
});
const bumpy = (f) => ({ bounce: 0.22 * Math.abs(Math.sin(f * 0.45)) + 0.08 * Math.abs(Math.sin(f * 1.3)), roll: 0.08 * Math.sin(f * 0.37), pitch: 0.06 * Math.sin(f * 0.53) });
S('bumpy', 5305, 5506, 'day', [K(5305, [0, 2.7, 3.8], [-1.7, 2.2, 0], 40), K(5506, [0.2, 2.6, 3.6], [-1.6, 2.2, 0], 38)], {
  dof: [[-1.9, 2.1, 0], 4],
  cam: (f, C, W) => { const tr = W.truck, b = tr.bounce * 0.6; C.pos = [C.pos[0] + tr.x, C.pos[1] + b, C.pos[2] + tr.z]; C.look = [C.look[0] + tr.x, C.look[1] + tr.bounce, C.look[2] + tr.z]; C.roll = (C.roll || 0) + tr.roll * 30; C.shadowAt = [tr.x, 1, tr.z]; },
  w: (f, W) => { const x = -40 + (f - 5305) / 30 * 7.5; W.truck = { x, z: 26, yaw: 0, dist: x, ...bumpy(f), gunPitch: 0.25 * Math.sin(f * 0.5), gunYaw: 0.35 * Math.sin(f * 0.31) }; },
  act: (f, T, out, W) => { truckAct(f, T, out, W.truck, { gExpr: 'dazed' }); },
});
S('outrun', 5507, 5657, 'day', [K(5507, [0, 1.6, -9], [0, 1.2, 0], 44), K(5657, [0, 1.6, -9], [0, 1.2, 0], 44)], {
  dof: [[0, 0, 0], 0],
  cam: (f, C, W) => { const x = W.truck.x + 1.5; C.pos = [C.pos[0] + x, C.pos[1], C.pos[2] + 26]; C.look = [C.look[0] + x, C.look[1], C.look[2] + 26]; C.shadowAt = [x, 1, 26]; },
  w: (f, W) => { const x = (f - 5507) / 30 * 9 - 30; W.truck = { x: x - 1.5, z: 26, yaw: 0, dist: x, ...bumpy(f) }; },
  act: (f, T, out, W) => {
    const tr = W.truck; truckAct(f, T, out, tr, { gExpr: 'shock' });
    const t = (f - 5507) / 30;
    for (let i = 0; i < 5; i++) { const ex = tr.x - 8 + i * 2.3 + t * (3 + i * 0.4); out.push(EMU(T, { mode: 'run', phase: ph8(t * 3 + i * 0.3), expr: i === 2 && t > 2.5 ? 'smug' : 'neutral', look: -0.5 }, [ex, 0, 23.2 - (i % 2) * 1.1], { res: 0.5, vx: 1, vz: 0 })); }
  },
  fx: (f, T, out, C) => { const t = q(((f - 5507) / 20) % 1, 2); out.push(overlay(C, 'spd' + t, (p) => T.fxSpeed(p, t), 2.4, { alpha: 0.7 })); },
});
S('tangle', 5658, 5754, 'day', [K(5658, [4.6, 1.9, 2.6], [0.6, 1.7, 0], 40), K(5754, [4.8, 1.9, 3.0], [0.6, 1.7, 0.2], 42)], {
  dof: [[0.8, 1.8, 0], 3],
  cam: (f, C, W) => { const tr = W.truck; C.pos = [C.pos[0] + tr.x, C.pos[1] + tr.bounce * 0.5, C.pos[2] + 26]; C.look = [C.look[0] + tr.x, C.look[1] + tr.bounce, C.look[2] + 26]; C.roll = tr.roll * 40; C.shadowAt = [tr.x, 1, tr.z]; },
  w: (f, W) => { const x = 20 + (f - 5658) / 30 * 7; W.truck = { x, z: 26 + 0.3 * Math.sin(f * 0.3) * ramp(f, 5700, 5754), yaw: -0.15 * Math.sin(f * 0.25) * ramp(f, 5700, 5754), dist: x, ...bumpy(f) }; },
  act: (f, T, out, W) => {
    const tr = W.truck; truckAct(f, T, out, tr, { gExpr: 'shock', dExpr: f > 5700 ? 'shock' : 'neutral' });
    const k = sm(ramp(f, 5670, 5705));
    out.push(EMU(T, { mode: f < 5705 ? 'run' : 'tumble', phase: f < 5705 ? ph8(f / 9) : 0, expr: f > 5705 ? 'alarm' : 'neutral', spin: f > 5705 ? q(Math.sin(f * 0.4) * 0.4, 1) : 0 }, [tr.x + lerp(5, 1.9, k), lerp(0, 1.2, sm(ramp(f, 5700, 5712))) + tr.bounce, tr.z + lerp(1.8, 0.1, k)], { res: 0.6, vx: 1, vz: 0, s: 0.9, order: 4, blob: false }));
  },
  fx: (f, T, out, C, W) => { if (f > 5705) { const k = q(((f - 5705) / 30) % 1, 2); out.push(FX('fth' + k, (p) => T.fxFeathers(p, k), [W.truck.x + 1, 2.0, W.truck.z], 2.2)); } },
});
S('crash', 5755, 5864, 'day', [K(5755, [50, 2.6, 41], [56, 1.0, 28], 36), K(5864, [51, 2.8, 42], [60, 1.0, 30], 34)], {
  dof: [[0, 0, 0], 0],
  cam: (f, C) => { const d = f - 5800; if (d >= 0 && d < 9) { const s = (d % 2 ? -1 : 1) * 0.06 * (1 - d / 9); C.look = [C.look[0], C.look[1] + s * 3, C.look[2]]; C.roll = s * 30; } },
  w: (f, W) => { const t = sm(ramp(f, 5755, 5800)); const x = lerp(40, 60.2, t), z = lerp(26, 30.2, t * t); W.truck = { x, z, yaw: lerp(0, -0.5, t), dist: x, bounce: f < 5800 ? 0.08 * Math.abs(Math.sin(f * 0.6)) : 0, pitch: f >= 5800 ? 0.06 : 0 }; W.crash = sm(ramp(f, 5798, 5812)); },
  act: (f, T, out, W) => { truckAct(f, T, out, W.truck, { gExpr: f > 5800 ? 'dazed' : 'shock', dExpr: f > 5800 ? 'dazed' : 'shock' }); },
  fx: (f, T, out) => { if (f >= 5798) { const k = q(ramp(f, 5798, 5850), 2); out.push(FX('cd' + k, (p) => T.fxDust(p, k, '#e0b898'), [61, 0.3, 31], 5, { tint: '#f0c8a8' })); if (f > 5810) { const t = q(((f - 5810) / 24) % 1, 2); out.push(FX('st' + t, (p) => T.fxStars(p, t), [58.2, 2.4, 29.6], 1.0)); } } },
});
// 19 the leader
S('strange', 5865, 5970, 'day', [K(5865, [57, 1.6, 36], [58.5, 1.5, 32], 34), K(5970, [56.6, 1.6, 35.6], [58.5, 1.6, 32], 30)], {
  dof: [[58.5, 1.6, 32.4], 6],
  w: (f, W) => { W.truck = { x: 60.2, z: 30.2, yaw: -0.5, dist: 60, pitch: 0.06 }; W.crash = 1; },
  act: (f, T, out) => {
    out.push(PER(T, 'gunner', { expr: f < 5920 ? 'dazed' : 'squint', blink: 0, look: 0.6, L: f > 5925 ? 'eyes' : 'hang', R: f > 5925 ? 'eyes' : 'hang' }, [58.0, 0, 32.6]));
    out.push(PER(T, 'major', { expr: f < 5915 ? 'dazed' : 'stern', blink: bl(f, 7), look: 0.6, R: 'scratch' }, [59.4, 0, 32.2]));
  },
  fx: (f, T, out) => { if (f < 5925) { const t = q(((f - 5865) / 24) % 1, 2); out.push(FX('st' + t, (p) => T.fxStars(p, t), [58.0, 2.3, 32.6], 0.9)); } },
});
S('herdlead', 5971, 6034, 'day', [K(5971, [24, 1.6, 74], [26, 1.8, 92], 26), K(6034, [24.2, 1.6, 75.4], [24.5, 2.6, 92], 22)], {
  dof: [[24, 3, 92], 0],
  act: (f, T, out) => { out.push(EMU(T, { mode: 'alarm', dark: true, expr: 'angry', blink: bl(f, 2), look: -0.5 }, [LOOK[0], 3.05, LOOK[2]], { res: 0.6, s: 1.15, blob: false, flip: true })); herd(T, f, { n: 16, seed: 33, c: [24, 92], spread: [16, 10], mode: 'eat', res: 0.35 }, out); },
});
S('leader', 6035, 6183, 'day', [K(6035, [22, 0.6, 84.6], [24, 3.6, 92], 36), K(6183, [21, 0.7, 85.6], [24, 3.7, 92], 30)], {
  dof: [[24, 4, 92], 3],
  act: (f, T, out) => { out.push(EMU(T, { mode: 'alarm', dark: true, expr: 'angry', blink: bl(f, 2), look: q(Math.sin(f * 0.04), 1) }, [LOOK[0], 3.05, LOOK[2]], { res: 0.9, s: 1.2, blob: false, flip: Math.sin(f * 0.02) > 0 })); herd(T, f, { n: 10, seed: 35, c: [24, 92], spread: [10, 6], mode: 'eat', res: 0.4 }, out); },
});
S('signal', 6184, 6305, 'day', [K(6184, [14, 1.4, 76], [24, 1.5, 90], 36), K(6305, [12, 1.6, 74], [24, 1.6, 90], 40)], {
  dof: [[0, 0, 0], 0],
  act: (f, T, out) => {
    const sq = f > 6240 && f < 6262;
    out.push(EMU(T, { mode: 'alarm', dark: true, expr: 'angry', squawk: sq ? 1 : 0, blink: 0, look: -0.6 }, [LOOK[0], 3.05, LOOK[2]], { res: 0.6, s: 1.15, blob: false, flip: true }));
    const t = Math.max(0, (f - 6262) / 30);
    for (let i = 0; i < 12; i++) { const r1 = rnd(37, i), r2 = rnd(38, i), a = r1 * 6.28; const vx = Math.cos(a) * 11, vz = Math.abs(Math.sin(a)) * 11 + 3; out.push(EMU(T, { mode: t > 0 ? 'run' : 'eat', phase: t > 0 ? ph8(t * 3 + r2) : 0 }, [24 + (r1 - 0.5) * 12 + vx * t, 0, 92 + (r2 - 0.5) * 8 + vz * t], { res: 0.35, vx, vz })); }
    const sk = (k) => [17 + k * 1.6 + (f - 6184) * 0.012, 0, 80 + k * 0.6 + (f - 6184) * 0.02];
    out.push(PER(T, 'gunner', { expr: f > 6250 ? 'shock' : 'squint', blink: 0, tilt: 8, step: q(((f / 20) % 1), 2) }, sk(0)));
    out.push(PER(T, 'major', { expr: f > 6250 ? 'shock' : 'stern', blink: 0, tilt: 8, R: 'stop', step: q((((f + 10) / 20) % 1), 2) }, sk(1)));
  },
  fx: (f, T, out) => { if (f > 6238 && f < 6266) { const t = q((f - 6238) / 28, 2); out.push(FX('sq' + t, (p) => T.fxSquawk(p, t), [LOOK[0] + 0.8, 5.0, LOOK[2]], 1.8)); } if (f > 6266) { const k = q(ramp(f, 6266, 6300), 2); out.push(FX('dd' + k, (p) => T.fxDust(p, k, '#e0b898'), [24, 0.5, 94], 9, { tint: '#f0c8a8' })); } },
});
S('sentinel', 6306, 6367, 'day', [K(6306, [21.0, 3.3, 85.4], [24, 4.4, 92], 32), K(6367, [21.4, 3.5, 86.2], [24, 4.6, 92], 28)], {
  dof: [[24, 4.6, 92], 6],
  act: (f, T, out) => { out.push(EMU(T, { mode: 'alarm', dark: true, expr: f > 6330 ? 'wink' : 'smug', blink: 0, look: 0.1 }, [LOOK[0], 3.05, LOOK[2]], { res: 1.0, s: 1.2, blob: false, flip: true })); },
});
// 20 the week's count
S('count', 6368, 6555, 'day', [K(6368, off(CAMP, -0.2, 1.8, 9.0), off(CAMP, -0.2, 1.5, 3.8), 38), K(6555, off(CAMP, -0.2, 1.75, 8.0), off(CAMP, -0.2, 1.6, 3.8), 34)], {
  dof: [off(CAMP, 0.6, 1.6, 3.7), 4], camFlash: 6368,
  w: (f, W) => { W.tally = f < 6470 ? 'ammo:...:' : 'ammo:2.500:'; W.crateLabel = false; },
  act: (f, T, out) => { out.push(PER(T, 'major', { expr: f > 6480 ? 'sad' : 'neutral', R: f > 6470 ? 'point' : 'hang', L: 'hip', blink: bl(f, 7), facing: 1 }, off(CAMP, -1.2, 0, 4.4))); },
});
S('unknown', 6556, 6780, 'day', [K(6556, off(CAMP, 0.2, 1.7, 7), off(CAMP, 0, 1.6, 3.6), 36), K(6780, off(CAMP, -0.6, 1.75, 6.4), off(CAMP, -0.4, 1.7, 3.6), 32)], {
  dof: [off(CAMP, -0.6, 1.7, 4.4), 4],
  w: (f, W) => { W.tally = f < 6620 ? 'ammo:2.500:?' : 'ammo:2.500:50? 200?'; W.crateLabel = false; },
  act: (f, T, out) => { out.push(PER(T, 'major', { expr: f > 6680 ? 'nervous' : 'squint', R: f > 6680 ? 'shrug' : 'scratch', L: f > 6680 ? 'shrug' : 'hip', blink: bl(f, 7), facing: 1 }, off(CAMP, -1.2, 0, 4.4))); },
  fx: (f, T, out) => { if (f > 6600 && f < 6690) { const t = q(((f / 30) % 1), 1); out.push(FX('q' + t, (p) => T.fxQuestion(p, t), off(CAMP, -1.6, 2.4, 4.4), 0.8)); } },
});
// 21 press + parliament
const PAPERS = [[['EMUS VENCEM', 'O EXÉRCITO!'], 'Metralhadoras não assustam ninguém'], [['A GUERRA', 'DOS EMUS'], 'Pássaros 1, soldados 0'], [['BALAS PRA', 'QUÊ?'], 'Emus seguem comendo o trigo']];
S('press', 6781, 6870, 'studio', [K(6781, off(STU, 0, 1.6, 8), off(STU, 0, 1.6, 0), 34), K(6870, off(STU, 0, 1.6, 7), off(STU, 0, 1.6, 0), 34)], {
  dof: [off(STU, 0, 1.6, 0), 0], w: (f, W) => { W.backdrop = '#5a8ac8'; },
  act: (f, T, out) => { PAPERS.forEach(([h, s], i) => { const t0 = 6781 + i * 26, k = M.back(ramp(f, t0, t0 + 18)); if (f < t0) return; out.push({ kind: 'fx', key: 'np' + i, draw: (p) => Q.paper(p.g, 1000, 1300, h, s, i + 1), x: STU[0] + (i - 1) * 2.4, y: lerp(4, 0.4, k), z: lerp(-6, i * 0.2, k), w: 2.0, h: 2.6, res: 0.6, roll: q((1 - k) * 6 + (i - 1) * 0.08, 2), blob: false }); }); },
});
S('laugh', 6871, 6980, 'studio', [K(6871, off(STU, 0, 1.6, 6.5), off(STU, 0, 1.5, 0), 36), K(6980, off(STU, 0, 1.6, 5.6), off(STU, 0, 1.5, 0), 34)], {
  dof: [off(STU, 0, 1.5, 0), 0], w: (f, W) => { W.backdrop = '#5a8ac8'; },
  act: (f, T, out) => { [['reader', -1.6], ['reader2', 0], ['farmerB', 1.6]].forEach(([k, x], i) => out.push(PER(T, k, { prop: 'news', L: 'hold', R: 'hold', expr: 'laugh', tilt: q(5 * Math.sin(f * 0.5 + i), 0), bob: q(0.025 * Math.abs(Math.sin(f * 0.5 + i)), 2) }, off(STU, x, 0, 0)))); },
});
S('parliament', 6981, 7146, 'parl', [K(6981, off(PAR, 9, 3.2, 0), off(PAR, -2, 1.2, 0), 44), K(7146, off(PAR, 3, 2.0, 0.6), off(PAR, -1, 1.7, -2.2), 34)], {
  dof: [off(PAR, -1, 1.7, -2.2), 0], camShadow: off(PAR, 0, 1, 0),
  act: (f, T, out) => {
    out.push(PER(T, 'mp1', { expr: f > 7060 ? 'grin' : 'neutral', R: 'up', L: 'hip', blink: bl(f, 2) }, off(PAR, -1, 0, -2.0)));
    [[-4, -2.2, 'mp2'], [2.6, -2.2, 'mp3'], [-3, 2.2, 'mp3'], [1, 2.2, 'mp2'], [4, 2.1, 'mp1']].forEach(([x, z, k], i) => out.push(PER(T, k, { expr: f > 7080 ? 'laugh' : 'smile', blink: bl(f, i + 4), L: 'belly', R: 'belly', bob: f > 7080 ? q(0.02 * Math.abs(Math.sin(f * 0.5 + i)), 2) : 0, seed: i + 4 }, off(PAR, x, 0, z))));
  },
});
S('answer', 7147, 7199, 'parl', [K(7147, off(PAR, 1.4, 1.75, -1.8), off(PAR, -0.6, 1.7, 1.2), 32), K(7199, off(PAR, 1.2, 1.75, -1.5), off(PAR, -0.6, 1.75, 1.2), 30)], {
  dof: [off(PAR, -0.6, 1.8, 1.2), 6], camShadow: off(PAR, 0, 1, 1),
  act: (f, T, out) => { out.push(PER(T, 'mp2', { expr: 'grin', R: 'point', L: 'hip', blink: bl(f, 3) }, off(PAR, -0.6, 0, 1.2))); },
});
S('medal', 7200, 7278, 'studio', [K(7200, off(STU, 0, 1.6, 6), off(STU, 0, 1.3, 0), 34), K(7278, off(STU, 0.3, 1.4, 4.2), off(STU, 0.3, 1.4, 0), 30)], {
  dof: [off(STU, 0, 1.4, 0), 0], w: (f, W) => { W.backdrop = '#e9c46a'; },
  act: (f, T, out) => { out.push(EMU(T, { mode: 'stand', medal: f > 7230, expr: f > 7230 ? 'happy' : 'neutral', blink: bl(f, 2), look: 0.4 }, off(STU, -0.3, 0, 0), { res: 0.8, s: 1.1 })); },
  fx: (f, T, out, C) => { if (f > 7230) { const t = q(((f - 7230) / 40) % 1, 2); out.push(overlay(C, 'conf3' + t, (p) => T.fxConfetti(p, t, 3), 2.0)); } },
});
S('rounds', 7279, 7373, 'studio', [K(7279, off(STU, 0, 1.8, 7), off(STU, 0, 1.7, 0), 34), K(7373, off(STU, 0, 1.8, 6), off(STU, 0, 1.7, 0), 32)], {
  dof: [off(STU, 0, 1.7, 0), 0], w: (f, W) => { W.backdrop = '#c0353a'; },
  act: (f, T, out) => {
    const sc = f < 7310 ? 1 : f < 7335 ? 2 : 3;
    out.push({ kind: 'fx', key: 'score' + sc, draw: (p) => T.scoreCard(p, sc, 0), x: STU[0] + 0.8, y: 0.3, z: 0, w: 3.0, h: 3.0, res: 0.5, blob: false });
    out.push(EMU(T, { mode: 'alarm', medal: true, expr: 'happy', blink: bl(f, 2), look: 0.6 }, off(STU, -1.8, 0.05 * Math.abs(Math.sin(f * 0.4)), 0.6), { res: 0.7, s: 1.05 }));
  },
});
// 22 withdrawal + return
S('retreat', 7374, 7498, 'golden', [K(7374, [96, 2.0, 17], [104, 1.3, 27], 40), K(7498, [99, 2.2, 16.5], [114, 1.3, 27], 42)], {
  dof: [[0, 0, 0], 0],
  w: (f, W) => { const x = 100 + (f - 7374) / 30 * 2.5; W.truck = { x, z: 26, yaw: 0, dist: x, bounce: 0.02 * Math.abs(Math.sin(f * 0.5)) }; },
  act: (f, T, out, W) => { truckAct(f, T, out, W.truck, { gExpr: 'sad', dExpr: 'sad' }); for (let i = 0; i < 4; i++) out.push(EMU(T, { mode: 'stand', expr: 'happy', blink: bl(f, i), look: 0.6 }, [99 + i * 2.2, 0, 29.4 + (i % 2) * 0.6], { res: 0.45, flip: true })); },
});
S('again', 7499, 7624, 'day', [K(7499, [8, 3.0, -2], [6, 0.8, -20], 40), K(7624, [10, 3.4, -2.6], [8, 0.8, -22], 40)], {
  dof: [[0, 0, 0], 0], w: (f, W) => { W.fenceBreak = 1; },
  act: (f, T, out) => { herd(T, f, { n: 60, seed: 41, c: [8, -28], spread: [50, 26], mode: 'stand', res: 0.3, eat: 0.75, y: 0.7 }, out); },
});
S('complain', 7625, 7679, 'day', [K(7625, [-24, 1.6, 29], [-24, 1.6, 24.5], 36), K(7679, [-24, 1.6, 28.4], [-24, 1.7, 24.5], 33)], {
  dof: [[-24, 1.7, 24.5], 5],
  act: (f, T, out) => { ['farmerA', 'farmerB', 'farmerC'].forEach((k, i) => out.push(PER(T, k, { expr: 'angry', L: 'fist', R: i === 1 ? 'fist' : 'hip', blink: bl(f, i + 1), bob: q(0.02 * Math.abs(Math.sin((f + i * 4) * 0.5)), 2) }, [-26 + i * 2, 0, 24.5 + (i % 2) * 0.3]))); },
});
S('sheepish', 7680, 7729, 'office', [K(7680, off(OFF, 0.2, 1.9, 0.6), off(OFF, 0, 1.8, -3.3), 30), K(7729, off(OFF, 0.2, 1.9, 0.2), off(OFF, 0, 1.8, -3.3), 28)], {
  dof: [off(OFF, 0, 1.8, -3.3), 6], camShadow: off(OFF, 0, 1, -2),
  act: (f, T, out) => { out.push(PER(T, 'minister', { expr: 'nervous', sweat: true, R: 'scratch', L: 'belly', blink: bl(f, 2) }, off(OFF, 0, 0, -3.3))); },
});
S('back', 7730, 7787, 'day', [K(7730, [114, 1.9, 19], [104, 1.2, 26], 42), K(7787, [113.6, 1.9, 19.2], [106, 1.2, 26], 42)], {
  dof: [[0, 0, 0], 0],
  w: (f, W) => { const x = 92 + (f - 7730) / 30 * 5; W.truck = { x, z: 26, yaw: 0, dist: x, bounce: 0.03 * Math.abs(Math.sin(f * 0.5)) }; },
  act: (f, T, out, W) => { truckAct(f, T, out, W.truck, { gExpr: 'stern', dExpr: 'stern' }); },
});
// 23 second round
S('lessons', 7788, 7916, 'day', [K(7788, off(CAMP, 0, 1.7, 9), off(CAMP, 0, 1.4, 4), 38), K(7916, off(CAMP, 0.6, 1.7, 8), off(CAMP, 0, 1.5, 4), 34)], {
  dof: [off(CAMP, 0, 1.5, 4.2), 3], w: (f, W) => { W.crateLabel = false; },
  act: (f, T, out) => { out.push(PER(T, 'major', { expr: 'stern', R: 'point', L: 'hip', blink: bl(f, 7), facing: 1 }, off(CAMP, -1.6, 0, 4.4))); out.push(PER(T, 'gunner', { expr: 'neutral', blink: bl(f, 3), headTilt: q(5 * Math.sin(f * 0.15), 0) }, off(CAMP, 0.4, 0, 5))); out.push(PER(T, 'gunner2', { expr: 'neutral', blink: bl(f, 5), headTilt: q(5 * Math.sin(f * 0.15 + 1), 0) }, off(CAMP, 1.8, 0, 4.8))); },
});
S('hide', 7917, 8076, 'day', [K(7917, [36, 1.2, 60], [40, 1.0, 70], 36), K(8076, [36.5, 1.2, 61], [42, 1.0, 72], 34)], {
  dof: [[39, 1, 66], 0],
  w: (f, W) => { W.guns = [{ x: 39.4, z: 66.6, yaw: -1.3, pitch: 0.02, recoil: f > 8040 && f < 8070 ? f % 2 : 0 }]; },
  act: (f, T, out) => {
    for (let i = 0; i < 3; i++) out.push(PER(T, i === 1 ? 'major' : 'gunner', { expr: 'squint', blink: 0, look: 0.6 }, [38 + i * 1.4, -0.4, 66.4 + i * 0.3], { blob: false }));
    for (let i = 0; i < 5; i++) out.push({ kind: 'fx', key: 'bush' + i, draw: (p) => T.bushCard(p, i + 1), x: 37.6 + i * 1.0, y: 0, z: 65.6 + (i % 2) * 0.3, w: 1.6, h: 1.6, res: 0.35, order: 3, roll: q(0.02 * Math.sin(f * 0.2 + i), 2) });
    herd(T, f, { n: 18, seed: 45, c: [50, 92], spread: [16, 8], mode: 'walk', v: [-0.4, -1.2], f0: 7917, rate: 1.4, res: 0.3 }, out);
  },
  fx: (f, T, out) => { if (f > 8040 && f < 8070 && f % 3 !== 2) out.push(FX('mz' + (f % 3), (p) => T.fxMuzzle(p, f % 3, f % 3 + 1), [39.4 + Math.cos(-1.3) * 1.35, 0.9, 66.6 - Math.sin(-1.3) * 1.35], 0.8, { nd: false, fog: false })); },
});
S('bit', 8077, 8199, 'day', [K(8077, off(CAMP, 0.6, 1.7, 6.2), off(CAMP, 0.6, 1.6, 3.6), 32), K(8199, off(CAMP, 0.6, 1.65, 5.4), off(CAMP, 0.6, 1.6, 3.6), 28)], {
  dof: [off(CAMP, 0.6, 1.6, 3.65), 3],
  w: (f, W) => { W.tally = 'marks:' + (f < 8100 ? 3 : f < 8150 ? Math.min(7, 3 + Math.floor((f - 8100) / 12)) : 8); W.crateLabel = false; },
});
// 24 final numbers
S('numbers', 8200, 8572, 'day', [K(8200, off(CAMP, 2.4, 1.8, 9), off(CAMP, 0.0, 1.5, 3.6), 38), K(8500, off(CAMP, 1.2, 1.7, 7), off(CAMP, 0.6, 1.6, 3.6), 30), K(8572, off(CAMP, 0.9, 1.65, 5.8), off(CAMP, 0.6, 1.4, 3.6), 26)], {
  dof: [off(CAMP, 0.6, 1.6, 3.65), 2],
  w: (f, W) => { W.tally = f < 8355 ? 'ammo:...:' : f < 8510 ? 'final:0' : 'final:1'; W.crateLabel = false; },
  act: (f, T, out) => { out.push(PER(T, 'major', { expr: f > 8510 ? 'shock' : 'stern', R: f > 8355 ? 'point' : 'hang', L: 'hip', blink: bl(f, 7), facing: 1 }, off(CAMP, -1.4, 0, 4.4))); },
});
S('quote', 8573, 8710, 'golden', [K(8573, [30, 1.7, 46], [28, 1.8, 42], 34), K(8710, [30.6, 1.7, 46.4], [28.6, 1.8, 42], 30)], {
  dof: [[28, 1.8, 42], 5],
  act: (f, T, out) => { out.push(PER(T, 'major', { expr: f > 8640 ? 'proud' : 'shock', blink: bl(f, 7), look: -0.7, L: 'hip', R: f > 8650 ? 'chest' : 'hang' }, [28, 0, 42])); out.push(EMU(T, { mode: 'stand', expr: 'smug', blink: bl(f, 2), look: 0.6 }, [25.8, 0, 41.2], { res: 0.6, flip: false })); },
});
S('army', 8711, 8933, 'studio', [K(8711, off(STU, -6, 1.4, 9), off(STU, 0, 1.2, 0), 38), K(8933, off(STU, 5, 2.2, 9), off(STU, 0, 1.3, 0), 40, { path: [off(STU, 0, 1.2, 10)] })], {
  dof: [off(STU, 0, 1.2, 0), 0], w: (f, W) => { W.backdrop = '#9aa66a'; },
  act: (f, T, out) => {
    const t = (f - 8711) / 30;
    for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) out.push(EMU(T, { mode: 'walk', helmet: true, phase: ph8(t * 1.6 + row * 0.5), expr: 'angry', blink: 0 }, [STU[0] - 6 + i * 2.2 + ((t * 1.2) % 2.2), 0, -1.5 + row * 1.6], { res: 0.45, vx: 1, vz: 0, s: 0.95 }));
    out.push(PER(T, 'major', { expr: 'proud', R: 'salute', blink: bl(f, 7) }, off(STU, 5.6, 0, 3)));
  },
});
// 25 years later: bounty
S('later', 8934, 9103, 'golden', [K(8934, [-14, 3, 40], [-22, 6, 18], 40), K(9103, [-10, 8, 44], [-20, 5, 16], 44)], {
  dof: [[0, 0, 0], 0], camFlash: 8934, w: (f, W) => { W.mill = 0.1; },
});
S('bounty', 9104, 9294, 'office', [K(9104, off(OFF, 0, 1.8, 5), off(OFF, 0, 1.3, -2.2), 38), K(9294, off(OFF, 0.8, 1.7, 2.8), off(OFF, 0, 1.4, -2.2), 32)], {
  dof: [off(OFF, 0, 1.4, -2.2), 3], camShadow: off(OFF, 0, 1, -1),
  act: (f, T, out) => { out.push(PER(T, 'clerk', { expr: 'smile', L: f > 9180 ? 'point' : 'belly', R: 'belly', blink: bl(f, 2), facing: 1 }, off(OFF, 0, 0, -3.3))); out.push(PER(T, 'farmerD', { prop: 'shotgun', R: 'hold', expr: f > 9220 ? 'grin' : 'neutral', blink: bl(f, 4) }, off(OFF, 1.5, 0, 0.0))); },
  fx: (f, T, out) => { for (let i = 0; i < 5; i++) { const t0 = 9200 + i * 12; if (f < t0) continue; const k = Math.min(1, (f - t0) / 14); out.push(FX('coin', (p) => T.fxCoin(p), off(OFF, -0.2 + i * 0.12, lerp(1.6, 1.02, M.easeIn(k)), -1.8), 0.16)); } },
});
S('receipts', 9295, 9436, 'studio', [K(9295, off(STU, 0, 1.6, 7), off(STU, 0, 1.5, 0), 36), K(9436, off(STU, 0, 1.8, 6.4), off(STU, 0, 1.7, 0), 34)], {
  dof: [off(STU, 0, 1.6, 0), 0], w: (f, W) => { W.backdrop = '#6aa8b8'; },
  act: (f, T, out) => {
    const k = q(sm(ramp(f, 9300, 9400)), 2); out.push({ kind: 'fx', key: 'rc' + k, draw: (p) => T.receipts(p, k), x: STU[0] - 1.6, y: 0, z: 0, w: 3.4, h: 3.4, res: 0.4, blob: false });
    const n = Math.round(57034 * sm(ramp(f, 9320, 9410))); const txt = n.toLocaleString('pt-BR');
    out.push({ kind: 'fx', key: 'num' + txt, draw: (p) => { const g = p.g; g.font = '900 210px Arial Black, Arial'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 30; g.strokeStyle = Q.INKC; g.strokeText(txt, 500, 560); g.fillStyle = '#ffd23a'; g.fillText(txt, 500, 560); }, x: STU[0] + 1.8, y: 0.8, z: 0.4, w: 3.6, h: 3.6, res: 0.4, blob: false, shadow: false });
  },
});
S('notarmy', 9437, 9533, 'golden', [K(9437, [110, 2.2, 17], [118, 1.3, 26], 40), K(9533, [112, 2.4, 16.5], [126, 1.3, 26], 42)], {
  dof: [[0, 0, 0], 0],
  w: (f, W) => { const x = 116 + (f - 9437) / 30 * 3; W.truck = { x, z: 26, yaw: 0, dist: x, bounce: 0.02 * Math.abs(Math.sin(f * 0.5)) }; },
  act: (f, T, out, W) => { truckAct(f, T, out, W.truck, { gExpr: 'sad', dExpr: 'sad' }); },
});
S('farmers', 9534, 9681, 'day', [K(9534, [-2, 1.8, -0.6], [0.5, 1.6, -8.6], 46), K(9681, [5, 1.8, -0.6], [2.5, 1.6, -8.6], 46)], {
  dof: [[0, 1.5, -8.6], 0], w: (f, W) => { W.fenceTall = 1; },
  act: (f, T, out) => { [['farmerA', 'shotgun'], ['farmerB', 'shotgun'], ['farmerC', 'hoe'], ['farmerD', null]].forEach(([k, pr], i) => out.push(PER(T, k, { prop: pr, R: pr ? 'hold' : 'cross', L: pr ? 'hip' : 'cross', expr: i === 3 ? 'smug' : 'stern', blink: bl(f, i + 1), tilt: idleT(f, i) }, [-4 + i * 3, 0, -8.2 + (i % 2) * 0.3]))); },
});
// 26 today
S('today', 9682, 9859, 'golden', [K(9682, [-60, 2, 160], [-40, 1.6, 140], 38), K(9859, [-40, 9, 176], [-20, 1.0, 140], 44)], {
  dof: [[0, 0, 0], 0],
  act: (f, T, out) => { herd(T, f, { n: 70, seed: 51, c: [-50, 138], spread: [50, 22], v: [8, -0.5], f0: 9682, res: 0.3 }, out); },
  fx: (f, T, out) => { for (let i = 0; i < 5; i++) { const k = q(((f * 0.03 + i / 5) % 1), 2); out.push(FX('dust' + k, (p) => T.fxDust(p, k, '#e8c0a0'), [-50 + (f - 9682) / 30 * 8 - 30 + i * 8, 0.1, 146], 3.5, { tint: '#ffd8b8', alpha: 0.7 })); } },
});
S('emblem', 9860, 10041, 'studio', [K(9860, off(STU, 0, 2.0, 8), off(STU, 0, 2.0, 0), 34), K(9960, off(STU, 0, 2.0, 7), off(STU, 0, 2.0, 0), 34), K(10041, off(STU, 0, 2.0, 6.4), off(STU, 0, 2.0, 0), 34)], {
  dof: [off(STU, 0, 2, 0), 0], w: (f, W) => { W.backdrop = '#2a4a8a'; },
  act: (f, T, out) => {
    const k1 = M.back(ramp(f, 9862, 9880));
    out.push({ kind: 'fx', key: 'arms0', draw: (p) => T.arms(p, 0), x: STU[0], y: 0.2, z: 0, w: 4 * k1 + 0.01, h: 4 * k1 + 0.01, res: 0.6, blob: false });
    if (f > 9935) { const k = M.back(ramp(f, 9935, 9950)); out.push({ kind: 'fx', key: 'stamp', draw: (p) => T.stamp(p), x: STU[0] - 2.7, y: 0.5, z: 1.6, w: 1.6 * k + 0.01, h: 1.6 * k + 0.01, res: 0.5, blob: false, roll: -0.12 }); }
    if (f > 9965) { const k = M.back(ramp(f, 9965, 9980)), a = q((f / 10) % 6.28, 1); out.push({ kind: 'fx', key: 'coin' + a, draw: (p) => T.coin(p, a), x: STU[0] + 2.7, y: 0.5, z: 1.6, w: 1.6 * k + 0.01, h: 1.6 * k + 0.01, res: 0.5, blob: false }); }
  },
});
S('war', 10042, 10136, 'golden', [K(10042, [46, 1.0, 44], [44, 0.9, 41], 34), K(10136, [47, 1.6, 46], [44, 1.2, 41], 38)], {
  dof: [[44, 1, 41], 4],
  w: (f, W) => { W.guns = [{ x: 44, y: -0.4, z: 41, yaw: 0.6, pitch: -0.2 }]; },
  act: (f, T, out) => { const k = sm(ramp(f, 10060, 10090)); out.push(EMU(T, { mode: f > 10090 ? 'stand' : 'walk', phase: f > 10090 ? 0 : ph8(f / 12), expr: f > 10095 ? 'smug' : 'neutral', blink: bl(f, 3), look: 0.6 }, [lerp(41, 43.6, k), 0, 41.2], { res: 0.6, vx: 1, vz: 0 })); },
});
S('end', 10137, 10195, 'studio', [K(10137, off(STU, 0, 2.2, 6.4), off(STU, 0, 2.3, 0), 34), K(10195, off(STU, 0, 2.3, 5.4), off(STU, 0, 2.4, 0), 32)], {
  dof: [off(STU, 0, 2.2, 0), 0], w: (f, W) => { W.backdrop = '#2a4a8a'; },
  act: (f, T, out) => { const h = f > 10175 ? 1 : 0; out.push({ kind: 'fx', key: 'armsH' + h, draw: (p) => T.arms(p, h), x: STU[0], y: 0.2, z: 0, w: 4, h: 4, res: 0.7, blob: false }); },
  fx: (f, T, out, C) => { if (f > 10178) { const t = q(((f - 10178) / 40) % 1, 2); out.push(overlay(C, 'conf5' + t, (p) => T.fxConfetti(p, t, 5), 2.0)); } },
});

// ---------- dispatch ----------
export const SHOTS = SH;
export const shotAt = (f) => SH.find((s) => f >= s.a && f <= s.b) || SH[SH.length - 1];
export const lightFor = (S_) => ({ ...LIGHTS[S_.light] });
export const worldAt = (f) => { const s = shotAt(f), W = { wheat: 1, mill: 0.05, guns: null, truck: null, tally: 'marks:0' }; if (s.w) s.w(f, W); return W; };
export const camAt = (f) => {
  const s = shotAt(f); const C = camFromKeys(s.keys, f, { creep: 0.0006 });
  if (s.cam) s.cam(f, C, worldAt(f));
  const fl = s.camFlash; if (fl !== undefined && f >= fl && f < fl + 6) C.flash = Math.max(C.flash || 0, (1 - (f - fl) / 6) * 0.85);
  if (!C.shadowAt && s.camShadow) C.shadowAt = s.camShadow;
  return C;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const s = shotAt(f), C = camAt(f), d = s.dof || [[0, 0, 0], 0];
  if (!d[1]) return { focus: 10, cinf: 0 };
  const pt = s.cam && s.id !== 'dream' ? C.look : d[0];
  let cinf = d[1];
  if (d[3] !== undefined) cinf = lerp(d[1], d[2], sm(ramp(f, s.a, s.a + d[3])));
  return { focus: dist(C.pos, pt), cinf };
};
export const actorsAt = (f, T) => { const s = shotAt(f), out = []; if (s.act) s.act(f, T, out, worldAt(f)); return out; };
export const fxAt = (f, T) => { const s = shotAt(f), out = []; if (s.fx) s.fx(f, T, out, camAt(f), worldAt(f)); return out; };
