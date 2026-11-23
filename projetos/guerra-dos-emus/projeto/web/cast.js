
// ---------------- "A Guerra dos Emus" cast (original designs) on top of the Pen / blob / face helpers ----------------
FACE.smug = { eye: ["lid", "lid"], brow: [-2, -2], mouth: "smirk" };
FACE.proud = { eye: ["happy", "happy"], brow: [-3, -3], mouth: "smileWide" };
FACE.sad = { eye: ["lid", "lid"], brow: [-4, 4], mouth: "frown" };
FACE.angry = { eye: ["lid", "lid"], brow: [5, -4], mouth: "frown" };
FACE.squint = { eye: ["slit", "slit"], brow: [3, -2], mouth: "dash" };

const KHAKI = "#a08a56", KHAKI_D = "#7d6a3e", BOOT = "#3d2a1e";
export const PEOPLE = {
  gunner: { shirt: KHAKI, pants: KHAKI_D, hat: "slouch", hatCol: "#8a7348", skin: "#f5c9a0" },
  gunner2: { shirt: KHAKI, pants: KHAKI_D, hat: "slouch", hatCol: "#7b6440", skin: "#ecd0b6", moustache: "#4a3020" },
  major: { shirt: "#8e7a4c", pants: KHAKI_D, hat: "peak", hatCol: "#7d6a3e", band: "#b8282b", skin: "#f3d6bb", moustache: "#5a3a24", stout: true, belt: "#5a3a24", pips: true },
  farmerA: { shirt: "#c8553d", pants: "#3f5a7a", hat: "wide", hatCol: "#c9a464", skin: "#f5c9a0" },
  farmerB: { shirt: "#5f8fbf", pants: "#5a4a3a", hat: "wide", hatCol: "#9a7a4a", skin: "#c99067", moustache: "#2a201a" },
  farmerC: { shirt: "#e0b84a", pants: "#4a4f3a", hat: "slouch", hatCol: "#6e5a3a", skin: "#ecd0b6", stout: true },
  farmerD: { shirt: "#7a9a4a", pants: "#3b3f52", hat: "wide", hatCol: "#b08850", skin: "#ffe2c2", beard: "#7a5a3a" },
  minister: { shirt: "#2f3440", pants: "#262a33", hat: "bald", skin: "#f3d6bb", moustache: "#e8e2d6", stout: true, tie: "#9a2a2a", suit: true, brows: "#e8e2d6" },
  mp1: { shirt: "#3a3f4a", pants: "#2c3038", hat: "hair", hair: "#3b2a20", skin: "#f5c9a0", tie: "#2a4a8a", suit: true },
  mp2: { shirt: "#4a4038", pants: "#2c2a28", hat: "bald", skin: "#ecd0b6", tie: "#7a2a4a", suit: true, moustache: "#3a2a20", stout: true },
  mp3: { shirt: "#2f3a48", pants: "#262a33", hat: "hair", hair: "#9a9a9a", skin: "#ffe2c2", tie: "#5a7a2a", suit: true },
  camera: { shirt: "#6a5a8a", pants: "#3b3f52", hat: "flat", hatCol: "#5a5a5a", skin: "#f5c9a0", vest: "#4a4a5a" },
  reader: { shirt: "#3f6fb5", pants: "#3b3f52", hat: "hair", hair: "#5a3b2a", skin: "#f5c9a0" },
  reader2: { shirt: "#c25a7a", pants: "#3b3f52", hat: "bonnet", hatCol: "#d9a441", skin: "#ecd0b6", dress: "#c25a7a" },
  clerk: { shirt: "#e8e2d6", pants: "#3b3f52", hat: "hair", hair: "#2b211c", skin: "#f5c9a0", vest: "#5a4a3a", glasses: true },
};

/** hats drawn on top of the head */
const hatDraw = (p, kind, col, H, cx, hc, light, u, O) => {
  const thick = thickAngle(light), ow = 4.2 * u, crownY = hc - H.b;
  if (kind === "slouch" || kind === "wide") {
    const by = hc - 0.5 * H.b, bw = (kind === "wide" ? 1.75 : 1.6) * H.a;
    // crown
    const cr = [[cx - 0.72 * H.a, by], [cx - 0.66 * H.a, crownY - 0.18 * H.b], [cx - 0.2 * H.a, crownY - 0.34 * H.b], [cx + 0.2 * H.a, crownY - 0.34 * H.b], [cx + 0.66 * H.a, crownY - 0.18 * H.b], [cx + 0.72 * H.a, by]];
    p.gradFill(cr, col, mul(col, [0.7, 0.66, 0.62]), light); p.inkRing(cr, ow, thick);
    p.stroke([[cx, crownY - 0.3 * H.b], [cx, crownY + 0.05 * H.b]], 2.2 * u, mul(col, [0.6, 0.55, 0.5]));
    p.band([[cx - 0.71 * H.a, by - 0.12 * H.b], [cx + 0.71 * H.a, by - 0.12 * H.b]], kind === "slouch" ? "#4a3a2a" : "#7a4a2a", 0.16 * H.b, 1.4 * u);
    // brim (slouch: left side pinned up)
    const br = kind === "slouch"
      ? [[cx - 0.62 * H.a, by - 0.02 * H.b], [cx - 0.95 * H.a, by - 0.9 * H.b], [cx - 1.08 * H.a, by - 0.78 * H.b], [cx - 0.9 * H.a, by + 0.1 * H.b], [cx + 0.2 * H.a, by + 0.16 * H.b], [cx + bw, by + 0.1 * H.b], [cx + bw * 0.98, by - 0.06 * H.b], [cx + 0.2 * H.a, by - 0.04 * H.b]]
      : ellPts(cx, by + 0.05 * H.b, bw, 0.17 * H.b, 0, 360, 0, 40);
    p.gradFill(br, mix(col, "#ffffff", 0.08), mul(col, [0.66, 0.62, 0.58]), light); p.inkRing(br, ow, thick);
    if (kind === "slouch") { p.dot(cx - 0.9 * H.a, by - 0.45 * H.b, 5 * u, "#d9a845"); p.dot(cx - 0.9 * H.a, by - 0.45 * H.b, 2 * u, "#fff3c4"); }
  } else if (kind === "peak") {
    const by = hc - 0.48 * H.b;
    const top = ellPts(cx, crownY - 0.12 * H.b, 1.02 * H.a, 0.3 * H.b, 0, 360, 0, 40);
    const body = [[cx - 0.8 * H.a, by], [cx - 0.98 * H.a, crownY - 0.1 * H.b], [cx + 0.98 * H.a, crownY - 0.1 * H.b], [cx + 0.8 * H.a, by]];
    p.gradFill(body, col, mul(col, [0.7, 0.66, 0.62]), light); p.inkRing(body, ow, thick);
    p.gradFill(top, mix(col, "#ffffff", 0.1), mul(col, [0.75, 0.7, 0.65]), light); p.inkRing(top, ow, thick);
    p.band([[cx - 0.8 * H.a, by - 0.1 * H.b], [cx + 0.8 * H.a, by - 0.1 * H.b]], O.band || "#5a3a24", 0.2 * H.b, 1.6 * u);
    const vis = [[cx - 0.78 * H.a, by], [cx + 0.78 * H.a, by], [cx + 0.6 * H.a, by + 0.2 * H.b], [cx - 0.6 * H.a, by + 0.2 * H.b]];
    p.poly(vis, "#2a1e16", ow * 0.8);
    p.ell(cx, by - 0.42 * H.b, 9 * u, 8 * u, "#d9a845", 1.6 * u);
  } else if (kind === "flat") {
    const by = hc - 0.5 * H.b;
    const cap = [[cx - 0.86 * H.a, by], [cx - 0.8 * H.a, crownY - 0.05 * H.b], [cx + 0.2 * H.a, crownY - 0.2 * H.b], [cx + 0.95 * H.a, crownY + 0.05 * H.b], [cx + 1.25 * H.a, by + 0.06 * H.b], [cx + 0.86 * H.a, by + 0.1 * H.b]];
    p.gradFill(cap, col, mul(col, [0.7, 0.7, 0.72]), light); p.inkRing(cap, ow, thick);
    p.stroke([[cx - 0.5 * H.a, crownY + 0.1 * H.b], [cx + 0.7 * H.a, crownY + 0.2 * H.b]], 1.6 * u, mul(col, [0.6, 0.6, 0.6]));
  } else if (kind === "bonnet") {
    const bp = ellPts(cx, hc - 0.35 * H.b, 1.12 * H.a, 0.82 * H.b, 180, 360, 0, 40);
    bp.push([cx + 1.12 * H.a, hc + 0.2 * H.b], [cx - 1.12 * H.a, hc + 0.2 * H.b]);
    p.gradFill(bp, col, mul(col, [0.75, 0.7, 0.6]), light); p.inkRing(bp, ow, thick);
    p.band([[cx - 1.1 * H.a, hc - 0.3 * H.b], [cx + 1.1 * H.a, hc - 0.3 * H.b]], "#c25a7a", 0.18 * H.b, 1.4 * u);
  } else if (kind === "hair") {
    const hb = ellPts(cx, hc - 0.38 * H.b, 1.04 * H.a, 0.7 * H.b, 180, 360, 0, 32);
    hb.push([cx + 1.0 * H.a, hc - 0.2 * H.b], [cx + 0.4 * H.a, hc - 0.5 * H.b], [cx - 0.3 * H.a, hc - 0.45 * H.b], [cx - 1.0 * H.a, hc - 0.2 * H.b]);
    p.poly(hb, O.hair, ow * 0.9);
  } else if (kind === "bald") {
    for (const s of [-1, 1]) p.ell(cx + s * 0.92 * H.a, hc - 0.12 * H.b, 0.2 * H.a, 0.28 * H.b, O.brows || "#cfc8bc", 3 * u);
    p.stroke(ellPts(cx - 0.25 * H.a, hc - 0.7 * H.b, 0.22 * H.a, 0.1 * H.b, 200, 330, 0, 10), 4 * u, "#ffffff66");
  }
};

/** helmet (1916 style) — also used on the emus */
const brodie = (p, x, y, w, light, u) => {
  const dome = ellPts(x, y, w * 0.62, w * 0.42, 180, 360, 0, 30); dome.push([x + w * 0.62, y], [x - w * 0.62, y]);
  p.gradFill(dome, "#6f7a52", "#454d32", light); p.inkRing(dome, 4 * u, thickAngle(light));
  const rim = ellPts(x, y, w, w * 0.14, 0, 360, 0, 30); p.poly(rim, "#5e6845", 3.5 * u);
};

/** front-facing 1932 Australian character. opts: expr, blink, look, facing, seed, L/R arm poses, tilt, headTilt, bob, prop, step, hatOff */
export const person = (p, key, opts = {}) => {
  const O = typeof key === "string" ? PEOPLE[key] : key;
  const { expr = "neutral", blink = 0, look = 0, facing = 0, seed = 3, L = "hang", R = "hang", tilt = 0, headTilt = 0,
    bob = 0, light = rad(-120), step = 0, prop = null, hatOff = false, sweat = false } = opts;
  const lid = lidOf(blink), skin = O.skin ?? SKIN;
  const H = headBlob(seed, 112, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
  const torsoL = O.stout ? 1.12 : 1.08, legsL = 1.38, sole = 975;
  const torsoBot = sole - legsL * HH - bob * HH, chin = torsoBot - torsoL * HH, hc = chin - H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 5 * u, cx = 300;
  const legCol = O.pants, armCol = mix(O.shirt, INK, 0.25);
  p.rot = null;
  // ---- legs (trousers + boots) ----
  for (const side of [-1, 1]) {
    const ph = step + (side > 0 ? 0.5 : 0), up = step ? Math.max(0, Math.sin(Math.PI * 2 * ph)) * 34 : 0, sw = step ? Math.cos(Math.PI * 2 * ph) * 10 * u : 0;
    const hx = cx + side * 17 * u, fx = cx + side * 20 * u + sw, fy = sole - 6 * u - up;
    if (!O.dress) p.line(curve([hx, hipY], [(hx + fx) / 2 + side * 3 * u, (hipY + fy) / 2], [fx, fy]), legCol, 12 * u);
    else p.line([[hx, (hipY + fy) / 2], [fx, fy]], skin, 5 * u);
    p.poly(rrect(fx - 12 * u, fy - 6 * u, fx + 14 * u, fy + 6 * u, 5 * u), BOOT, 2.6 * u);
  }
  // ---- upper body ----
  p.rot = tilt ? [rad(tilt), cx, hipY] : null;
  const T = { a: (0.4 * W) / 1.06 * (O.stout ? 1.15 : 1), b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.6, egg: O.stout ? 0.2 : 0.12, asym: 0.04 * facing, rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = cx + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const S = (side) => [tcx + side * 0.85 * T.a, chin + 0.12 * HH];
  const arm = (side, pose) => {
    const s = S(side), X = (k) => tcx + side * (T.a * 1.1 + k * u);
    switch (pose) {
      case "point": return { pts: [s, [X(28), s[1] - 0.02 * HH], [X(62), s[1] - 0.1 * HH]], finger: true };
      case "up": return { pts: [s, [X(14), s[1] - 0.3 * HH], [X(22), s[1] - 0.75 * HH]] };
      case "fist": return { pts: [s, [X(16), s[1] - 0.28 * HH], [X(12), s[1] - 0.7 * HH]], fist: true };
      case "wave": return { pts: [s, [X(16), s[1] - 0.2 * HH], [X(30 + 10 * Math.sin(opts.wv || 0)), s[1] - 0.62 * HH]] };
      case "hip": return { pts: [s, [X(22), s[1] + 0.3 * HH], [tcx + side * T.a * 0.95, torsoBot - 0.3 * HH]] };
      case "belly": return { pts: [s, [X(8), s[1] + 0.45 * HH], [tcx + side * 0.25 * T.a, torsoBot - 0.35 * HH]], front: true };
      case "cross": return { pts: [s, [X(2), s[1] + 0.38 * HH], [tcx - side * 0.45 * T.a, s[1] + 0.32 * HH]], front: true };
      case "cheek": return { pts: [s, [X(16), s[1] + 0.05 * HH], [cx + side * (H.a + 2 * u), hc + 0.25 * H.b]] };
      case "salute": return { pts: [s, [X(34), s[1] - 0.12 * HH], [cx + side * 0.62 * H.a, hc - 0.5 * H.b]] };
      case "eyes": return { pts: [s, [X(18), s[1] + 0.02 * HH], [cx + side * 0.32 * H.a, hc - 0.02 * H.b]] };
      case "scratch": return { pts: [s, [X(30), s[1] - 0.22 * HH], [cx + side * 0.45 * H.a, hc - 1.0 * H.b]] };
      case "shrug": return { pts: [s, [X(26), s[1] + 0.2 * HH], [X(52), s[1] - 0.05 * HH]], palm: true };
      case "hold": return { pts: [s, [X(10), s[1] + 0.38 * HH], [tcx + side * 0.9 * T.a, torsoBot - 0.15 * HH]], front: true };
      case "chest": return { pts: [s, [X(6), s[1] + 0.3 * HH], [tcx + side * 0.15 * T.a, chin + 0.42 * HH]], front: true };
      case "stop": return { pts: [s, [X(30), s[1] - 0.05 * HH], [X(56), s[1] - 0.32 * HH]], palm: true };
      default: return { pts: [s, [X(4), s[1] + 0.48 * HH], [X(3), chin + 1.04 * HH]] };
    }
  };
  const arms = [arm(-1, L), arm(1, R)];
  const hand = (a) => {
    const [hx, hy] = a.pts[2];
    p.ell(hx, hy, (a.fist ? 7.5 : 6.5) * u, (a.fist ? 7.5 : 6.5) * u, skin, 2.2 * u);
    if (a.finger) { const dx = a.pts[2][0] - a.pts[1][0], dy = a.pts[2][1] - a.pts[1][1], l = Math.hypot(dx, dy); p.line([[hx, hy], [hx + dx / l * 14 * u, hy + dy / l * 14 * u]], skin, 3 * u); }
  };
  const drawArm = (a) => { p.line(curve(a.pts[0], a.pts[1], a.pts[2]), armCol, 10 * u); hand(a); };
  // long props behind the body (hoe, rifle, shotgun)
  const rh = arms[1].pts[2];
  if (prop === "rifle" || prop === "shotgun") {
    const a = [rh[0] + 6 * u, rh[1] + 0.3 * HH], b = [rh[0] - 4 * u, rh[1] - 1.05 * HH];
    p.band([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]], "#7a4a2a", 9 * u, 1.6 * u, "round");
    p.band([[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], b], "#3a3a3a", 3.6 * u, 1.4 * u, "round");
    if (prop === "shotgun") p.band([[(a[0] + b[0]) / 2 + 4 * u, (a[1] + b[1]) / 2], [b[0] + 4 * u, b[1]]], "#3a3a3a", 3.2 * u, 1.2 * u, "round");
  }
  for (const a of arms) if (!a.front) drawArm(a);
  if (O.dress) {
    const D = { a: 0.5 * W * 0.98, b: 0.5 * ((sole - 0.35 * HH) - (chin - 0.2 * HH)), nTop: 2.0, nBot: 3.0, egg: 0.35, asym: 0, rot: 0, noise: 0.006, seed: seed + 9 };
    const dp = blobPts(cx, sole - 0.35 * HH - D.b, D);
    p.gradFill(dp, O.dress, mul(O.dress, SH_CLOTH), light); p.inkRing(dp, ow, thick);
  }
  p.gradFill(tp, O.shirt, mul(O.shirt, SH_CLOTH), light);
  p.clip(tp, () => {
    if (O.suit) { // lapels + shirt + tie
      p.poly([[tcx - 0.28 * T.a, chin], [tcx + 0.28 * T.a, chin], [tcx, chin + 0.55 * HH]], "#f2efe6", 1.6 * u);
      p.poly([[tcx - 0.07 * T.a, chin + 0.06 * HH], [tcx + 0.07 * T.a, chin + 0.06 * HH], [tcx + 0.09 * T.a, chin + 0.45 * HH], [tcx, chin + 0.52 * HH], [tcx - 0.09 * T.a, chin + 0.45 * HH]], O.tie, 1.4 * u);
      for (const s of [-1, 1]) p.stroke([[tcx + s * 0.3 * T.a, chin], [tcx + s * 0.08 * T.a, chin + 0.6 * HH]], 2 * u, mul(O.shirt, [0.6, 0.6, 0.6]));
      for (let i = 0; i < 2; i++) p.dot(tcx + 0.05 * T.a, chin + (0.7 + i * 0.18) * HH, 2.4 * u, "#1a1a1a");
    } else {
      if (O.vest) p.poly([[tcx - 1.2 * T.a, chin + 0.1 * HH], [tcx - 0.12 * T.a, chin + 0.25 * HH], [tcx - 0.12 * T.a, torsoBot], [tcx - 1.2 * T.a, torsoBot]], O.vest, 1.6 * u), p.poly([[tcx + 1.2 * T.a, chin + 0.1 * HH], [tcx + 0.12 * T.a, chin + 0.25 * HH], [tcx + 0.12 * T.a, torsoBot], [tcx + 1.2 * T.a, torsoBot]], O.vest, 1.6 * u);
      p.stroke([[tcx - 0.22 * T.a, chin + 0.02 * HH], [tcx, chin + 0.18 * HH], [tcx + 0.22 * T.a, chin + 0.02 * HH]], 2 * u);
      p.stroke([[tcx, chin + 0.18 * HH], [tcx, torsoBot]], 1.6 * u, mul(O.shirt, [0.62, 0.62, 0.62]));
      for (let i = 0; i < 3; i++) p.dot(tcx + 4 * u, chin + (0.32 + i * 0.22) * HH, 2.2 * u, "#e8e2d0");
      for (const s of [-1, 1]) p.poly(rrect(tcx + s * 0.5 * T.a - 12 * u, chin + 0.3 * HH, tcx + s * 0.5 * T.a + 12 * u, chin + 0.48 * HH, 3 * u), mul(O.shirt, [0.86, 0.86, 0.86]), 1.4 * u);
    }
    p.band([[tcx - 1.4 * T.a, torsoBot - 0.16 * HH], [tcx + 1.4 * T.a, torsoBot - 0.16 * HH]], O.belt || (O.suit ? mul(O.shirt, [0.8, 0.8, 0.8]) : "#5a3b2a"), 0.07 * HH, 1.2 * u);
    if (O.pips) for (const s of [-1, 1]) for (let k = 0; k < 2; k++) p.dot(tcx + s * (0.62 + k * 0.14) * T.a, chin + 0.12 * HH, 3 * u, "#e8c45a");
  });
  p.inkRing(tp, ow, thick);
  if (O.pips) p.band([[tcx - 0.7 * T.a, chin + 0.05 * HH], [tcx + 0.6 * T.a, torsoBot - 0.18 * HH]], "#6a4a2a", 0.06 * HH, 1.2 * u); // Sam Browne strap
  if (prop === "hoe") {
    p.band([[rh[0] + 2 * u, sole - 4 * u], [rh[0] + 2 * u, rh[1] - 0.9 * HH]], "#8a5a34", 4.2 * u, 1.4 * u, "round");
    p.poly([[rh[0] - 26 * u, rh[1] - 0.9 * HH], [rh[0] + 8 * u, rh[1] - 0.92 * HH], [rh[0] + 4 * u, rh[1] - 0.78 * HH], [rh[0] - 22 * u, rh[1] - 0.8 * HH]], "#9aa0a6", 2 * u);
  }
  for (const a of arms) if (a.front) drawArm(a);
  // small props in front
  if (prop === "paper" || prop === "deed") { const [hx, hy] = arms[1].pts[2]; p.poly(rrect(hx - 26 * u, hy - 44 * u, hx + 20 * u, hy + 10 * u, 2 * u), "#f4efe0", 2 * u); for (let i = 0; i < 4; i++) p.stroke([[hx - 18 * u, hy - 34 * u + i * 9 * u], [hx + 12 * u, hy - 34 * u + i * 9 * u]], 1.6 * u, "#8a8070"); if (prop === "deed") p.dot(hx + 6 * u, hy, 6 * u, "#c0353a"); }
  if (prop === "news") {
    const y0 = chin + 0.2 * HH, y1 = torsoBot + 0.1 * HH, x0 = tcx - 1.25 * T.a, x1 = tcx + 1.25 * T.a;
    p.poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], "#ece6d4", 2.4 * u);
    p.stroke([[(x0 + x1) / 2, y0], [(x0 + x1) / 2, y1]], 1.4 * u, "#a8a090");
    for (let i = 0; i < 2; i++) p.poly(rrect(x0 + 8 * u + i * (x1 - x0) / 2, y0 + 8 * u, x0 + (i + 1) * (x1 - x0) / 2 - 8 * u, y0 + 20 * u, 1), "#2a2a2a", 0);
    for (let i = 0; i < 6; i++) for (let k = 0; k < 2; k++) p.stroke([[x0 + 8 * u + k * (x1 - x0) / 2, y0 + (30 + i * 8) * u], [x0 + (k + 1) * (x1 - x0) / 2 - 8 * u, y0 + (30 + i * 8) * u]], 1.4 * u, "#9a9488");
  }
  if (prop === "hatHand") { const [hx, hy] = arms[1].pts[2]; p.ell(hx, hy + 6 * u, 34 * u, 10 * u, O.hatCol || "#9a7a4a", 2.4 * u); p.ell(hx, hy - 2 * u, 20 * u, 14 * u, mul(O.hatCol || "#9a7a4a", [0.85, 0.85, 0.85]), 2.4 * u); }
  // ---- head ----
  const [cpx, cpy] = rotAbout([cx, chin], rad(tilt), [cx, hipY]);
  const Ah = tilt + headTilt;
  p.rot = Ah ? [rad(Ah), cx, chin, cpx - cx, cpy - chin] : null;
  const hp = blobPts(cx, hc, H);
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  if (O.beard) {
    const bd = blobPts(cx + 6 * u * facing, hc + 0.75 * H.b, { a: 0.7 * H.a, b: 0.55 * H.b, nTop: 2.4, nBot: 1.8, egg: -0.3, asym: 0, rot: 0, noise: 0.02, seed: seed + 4 });
    p.shadedFill(bd, O.beard, mul(O.beard, [0.8, 0.8, 0.86]), light, 0.6 * H.a, 0.3); p.inkRing(bd, ow * 0.8, thick);
  }
  const hatKind = hatOff ? (O.hat === "bald" ? "bald" : "hairOff") : O.hat;
  if (hatKind === "hairOff") hatDraw(p, "hair", null, H, cx, hc, light, u, { hair: O.hair || "#5a3b2a" });
  faceFront(p, cx, hc, W, expr, facing, look, lid, false, skin, O.moustache, !!O.stout);
  if (O.brows) for (const s of [-1, 1]) p.ell(cx + 7 * u * facing + s * 14 * u, hc - 20 * u, 11 * u, 5 * u, O.brows, 2 * u);
  if (O.glasses) for (const s of [-1, 1]) p.ell(cx + 7 * u * facing + s * 13 * u, hc - 2 * u, 10 * u, 9 * u, null, 2 * u);
  if (!hatOff && hatKind !== "hairOff") hatDraw(p, hatKind, O.hatCol, H, cx, hc, light, u, O);
  if (L === "eyes" && R === "eyes") { // binoculars
    for (const s of [-1, 1]) { p.poly(rrect(cx + s * 13 * u - 9 * u, hc - 12 * u, cx + s * 13 * u + 9 * u, hc + 14 * u, 3 * u), "#2a2a2e", 2.4 * u); p.ell(cx + s * 13 * u, hc - 12 * u, 9 * u, 4 * u, "#6a8aa8", 2 * u); }
  }
  if (sweat) { p.poly([[cx + 1.05 * H.a, hc - 0.5 * H.b], [cx + 1.12 * H.a, hc - 0.25 * H.b], [cx + 1.0 * H.a, hc - 0.25 * H.b]], "#bfe6ff", 2 * u); }
  p.rot = null;
};

// ---------------- emu (side view, facing right; square card: design 1000x1000, feet at y=975) ----------------
const legIK = (hip, foot, l1, l2) => {
  const dx = foot[0] - hip[0], dy = foot[1] - hip[1], d = Math.min(l1 + l2 - 1, Math.hypot(dx, dy));
  const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), k = Math.atan2(dy, dx) + A; // knee bends backwards
  return [hip[0] + l1 * Math.cos(k), hip[1] + l1 * Math.sin(k)];
};
/** opts: mode run|walk|stand|eat|look|alarm|tumble, phase 0..1, blink, expr neutral|smug|alarm|angry|happy|wink, dark, medal, helmet, look(-1..1), squawk */
export const emu = (p, opts = {}) => {
  const { mode = "stand", phase = 0, blink = 0, expr = "neutral", dark = false, medal = false, helmet = false, squawk = 0, neck = null, spin = 0 } = opts;
  const g = p.g, u = 1, two = Math.PI * 2;
  const body = dark ? "#2f2722" : "#6b5848", bodyD = dark ? "#1c1714" : "#4a3c31", feather = dark ? "#463a33" : "#8a7460";
  const skinN = dark ? "#5d7590" : "#86a0b8", legC = "#7d7062", legD = "#5d5247";
  const run = mode === "run", walk = mode === "walk", moving = run || walk;
  const bob = run ? 22 * Math.abs(Math.sin(two * phase)) : walk ? 8 * Math.abs(Math.sin(two * phase)) : 0;
  const lean = run ? 0.22 : walk ? 0.06 : mode === "eat" ? 0.18 : 0;
  const hip = [470, 600 - bob];
  if (spin) { p.rot = [spin, 500, 560]; }
  // legs
  const legs = [];
  for (const side of [0, 1]) {
    const ph = (phase + side * 0.5) % 1;
    let fx, fy;
    if (run) { fx = hip[0] + 40 + 210 * Math.sin(two * ph); fy = 970 - Math.max(0, 120 * Math.cos(two * ph)); }
    else if (walk) { fx = hip[0] + 30 + 110 * Math.sin(two * ph); fy = 970 - Math.max(0, 60 * Math.cos(two * ph)); }
    else if (mode === "tumble") { fx = hip[0] + 120 + side * 120; fy = 760 - side * 100; }
    else { fx = hip[0] + 10 + (side ? 46 : -34); fy = 970; }
    legs.push({ side, foot: [fx, fy], knee: legIK(hip, [fx, fy], 205, 215) });
  }
  const drawLeg = (L, far) => {
    const c = far ? legD : legC;
    p.line([hip, L.knee, L.foot], c, 27, true);
    // toes
    const [fx, fy] = L.foot;
    p.line([[fx - 18, fy], [fx + 62, fy + 4]], c, 11, true);
    p.line([[fx, fy], [fx + 44, fy - 16]], c, 9, true);
    p.line([[fx, fy], [fx - 34, fy + 2]], c, 9, true);
  };
  drawLeg(legs[1], true);
  // body: shaggy blob, tilted forward when running
  const bc = [460, 505 - bob], rx = 250, ry = 165;
  const pts = [];
  for (let i = 0; i < 64; i++) {
    const a = i / 64 * two, shag = (Math.sin(a) > 0.1 || Math.cos(a) < -0.5) ? (i % 2 ? 1 : 0.82) : 1;
    let x = Math.cos(a) * rx * shag, y = Math.sin(a) * ry * shag;
    if (Math.cos(a) < -0.3) y *= 1.08; // bushy tail end
    const r = -lean; pts.push([bc[0] + x * Math.cos(r) - y * Math.sin(r), bc[1] + x * Math.sin(r) + y * Math.cos(r) + 10 * Math.sin(phase * two + i)]);
  }
  p.gradFill(pts, body, bodyD, rad(-120), 0.3);
  p.clip(pts, () => {
    for (let i = 0; i < 26; i++) { const x = bc[0] - 220 + (i * 97) % 440, y = bc[1] - 110 + ((i * 53) % 220), d = run ? -30 : -18; p.stroke([[x, y], [x + d, y + 46], [x + d - 6, y + 70]], 5, feather); }
  });
  p.inkRing(pts, 12, thickAngle(rad(-120)));
  drawLeg(legs[0], false);
  // neck + head
  let nb = [bc[0] + 190, bc[1] - 70], hd;
  if (neck) hd = neck;
  else if (run) hd = [bc[0] + 380, bc[1] - 250];
  else if (walk) hd = [bc[0] + 300, bc[1] - 330];
  else if (mode === "eat") hd = [bc[0] + 330, 930];
  else if (mode === "alarm") hd = [bc[0] + 230, bc[1] - 420];
  else if (mode === "tumble") hd = [bc[0] + 320, bc[1] + 120];
  else hd = [bc[0] + 250, bc[1] - 390];
  const mid = mode === "eat" ? [nb[0] + 160, nb[1] + 40] : [nb[0] + 40 + (hd[0] - nb[0]) * 0.2, (nb[1] + hd[1]) / 2];
  p.line(curve(nb, mid, hd, 14), skinN, 52, true);
  // neck feather ruff
  p.ell(nb[0] - 10, nb[1] + 10, 70, 58, body, 10);
  for (let i = 0; i < 5; i++) p.stroke([[nb[0] - 40 + i * 18, nb[1] - 30], [nb[0] - 50 + i * 18, nb[1] + 30]], 4, feather);
  if (medal) { // ribbon + medal on the chest
    const mx = bc[0] + 200, my = bc[1] + 20;
    p.poly([[mx - 22, my - 60], [mx + 22, my - 60], [mx + 14, my], [mx - 14, my]], "#c0353a", 4); p.stroke([[mx, my - 60], [mx, my]], 8, "#2a4a8a");
    p.ell(mx, my + 26, 34, 34, "#e6b53a", 6); p.ell(mx, my + 26, 18, 18, "#f6d36a", 3); p.dot(mx - 10, my + 14, 6, "#fff4c4");
  }
  // head (big, expressive)
  const hx = hd[0], hy = hd[1], K = 1.45;
  const head = ellPts(hx, hy, 62 * K, 50 * K, 0, 360, mode === "eat" ? 30 : 0, 30);
  p.shadedFill(head, mix(skinN, body, 0.35), mul(skinN, [0.7, 0.72, 0.8]), rad(-120), 60 * K);
  p.inkRing(head, 10, thickAngle(rad(-120)));
  p.clip(head, () => { p.ell(hx - 22 * K, hy - 40 * K, 56 * K, 28 * K, dark ? "#1c1714" : "#3e322a", 0); });
  const by = hy + 10 * K + (mode === "eat" ? 18 : 0), open = squawk * 34;
  p.poly([[hx + 50 * K, by - 14 * K], [hx + 130 * K, by + 2 * K], [hx + 52 * K, by + 6 * K]], "#3e3a36", 7);
  p.poly([[hx + 50 * K, by + 6 * K], [hx + 122 * K, by + 8 * K + open], [hx + 48 * K, by + 18 * K + open * 0.6]], "#4f4a44", 7);
  const ex = hx + 16 * K, ey = hy - 8 * K, lid = lidOf(blink);
  if (expr === "wink") { p.arc(ex, ey + 2, 26, 14, 200, 340, 8); }
  else if (lid >= 1) p.stroke([[ex - 28, ey + 2], [ex + 28, ey + 2]], 8);
  else {
    const er = expr === "alarm" ? 38 : 32;
    p.ell(ex, ey, er, er * 1.1, "#fbf6ea", 6);
    const lk = opts.look ?? 0.4;
    p.dot(ex + lk * 10, ey + 3, expr === "alarm" ? 10 : 15, "#d9822b"); p.dot(ex + lk * 10, ey + 3, expr === "alarm" ? 6 : 9, INK); p.dot(ex + lk * 10 + 5, ey - 4, 4, "#ffffff");
    const lc = mix(skinN, body, 0.35);
    if (lid > 0 || expr === "smug" || expr === "happy") p.poly([[ex - er - 4, ey - er * 1.25], [ex + er + 4, ey - er * 1.25], [ex + er + 4, ey - er * (expr === "smug" ? 0.05 : 0.3)], [ex - er - 4, ey - er * (expr === "smug" ? 0.15 : 0.4)]], lc, 6);
    if (expr === "angry") p.stroke([[ex - 38, ey - 50], [ex + 32, ey - 30]], 10);
    if (expr === "happy") p.arc(ex, ey + 26, 26, 12, 200, 340, 7, "#ffffff");
  }
  if (helmet) brodie(p, hx - 6, hy - 52, 130, rad(-120), 1);
  p.rot = null;
};

/** rabbit (side view, square card), phase = hop */
export const rabbit = (p, phase = 0) => {
  const two = Math.PI * 2, h = 120 * Math.max(0, Math.sin(two * phase)), y = 900 - h;
  p.ell(470, y, 150, 100, "#9a8a7a", 10);
  p.ell(600, y - 80, 70, 62, "#a89888", 10);
  p.ell(560, y - 200, 22, 80, "#a89888", 8, 0, 360, -10); p.ell(600, y - 210, 22, 84, "#a89888", 8, 0, 360, 8);
  p.dot(625, y - 92, 10); p.dot(628, y - 96, 3, "#ffffff"); p.dot(668, y - 70, 8, "#d97a8a");
  p.ell(330, y - 10, 40, 36, "#f4efe6", 8);
  p.ell(520, y + 90, 70, 20, "#8a7a6a", 8);
};

/** film camera on a tripod (front-ish card) */
export const filmCam = (p, crank = 0) => {
  for (const [a, b] of [[[300, 560], [190, 975]], [[300, 560], [410, 975]], [[300, 560], [300, 975]]]) p.line([a, b], "#6a4a2a", 10, true);
  p.poly(rrect(200, 400, 400, 560, 14), "#3a3a42", 8);
  p.ell(250, 380, 60, 60, "#4a4a52", 8); p.ell(350, 380, 60, 60, "#4a4a52", 8);
  p.poly(rrect(390, 450, 470, 510, 8), "#2a2a2e", 7); p.ell(470, 480, 20, 34, "#7a9ac8", 6);
  const a = crank * Math.PI * 2; p.line([[210, 480], [210 - 40 * Math.cos(a), 480 + 40 * Math.sin(a)]], "#9a9a9a", 8, true);
};

/** speech/sign bubbles and graphic effects */
export const fxMuzzle = (p, t, seed = 1) => {
  const n = 9, R = 260 * (0.6 + 0.4 * Math.sin(seed * 3.1 + t * 20)), pts = [];
  for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * Math.PI * 2 + seed, r = i % 2 ? R * 0.45 : R; pts.push([500 + Math.cos(a) * r, 500 + Math.sin(a) * r * 0.8]); }
  p.poly(pts, "#ffd23a", 10); p.ell(500, 500, R * 0.3, R * 0.24, "#fff6c8", 0);
};
export const fxConfetti = (p, t, seed = 1) => {
  const cols = ["#e2453c", "#3f6fb5", "#f0c23a", "#5ab04a", "#c25ac9", "#ffffff"];
  for (let i = 0; i < 60; i++) {
    const r = rnd(seed, i), r2 = rnd(seed, i + 100), x = 80 + r * 840, y = ((r2 * 1000 + t * 600 * (0.6 + r)) % 1000), a = t * 8 + i;
    const w = 18, h = 30; p.poly([[x + Math.cos(a) * w, y + Math.sin(a) * h * 0.4], [x + Math.cos(a + 1.6) * w * 0.5, y + h * 0.6], [x - Math.cos(a) * w, y - Math.sin(a) * h * 0.4], [x - Math.cos(a + 1.6) * w * 0.5, y - h * 0.6]], cols[i % 6], 3);
  }
};
export const fxRain = (p, t) => { for (let i = 0; i < 70; i++) { const x = (i * 137 + t * 90) % 1000, y = (i * 263 + t * 2400) % 1100 - 60; p.stroke([[x, y], [x - 14, y + 70]], 5, "#d8e8f8"); } };
export const fxSpeed = (p, t) => { for (let i = 0; i < 9; i++) { const y = 200 + i * 75, x = (i * 211 + t * 2200) % 1400 - 300; p.stroke([[x, y], [x + 260, y]], 9, "#ffffffcc"); } };
export const fxSmoke = (p, k) => {
  const g = p.g; g.save(); g.globalAlpha = Math.max(0, 1 - k);
  for (let i = 0; i < 6; i++) p.ell(500 + Math.sin(i * 2.1) * 120 * k, 700 - k * 500 - i * 40, 90 + 120 * k, 70 + 90 * k, i % 2 ? "#8a8a8a" : "#a8a8a8", 8);
  g.restore();
};
export const fxFeathers = (p, k) => {
  for (let i = 0; i < 12; i++) { const a = i * 0.52 + 0.3, r = 120 + 380 * k, x = 500 + Math.cos(a) * r, y = 500 + Math.sin(a) * r * 0.7 + 300 * k * k; p.ell(x, y, 34, 12, i % 2 ? "#6b5848" : "#8a7460", 5, 0, 360, a * 57 + k * 200); }
};
export const fxQuestion = (p, t) => {
  const g = p.g; g.save(); g.font = "900 620px Arial Black, Arial"; g.textAlign = "center"; g.lineJoin = "round"; g.translate(500, 780 - 30 * Math.sin(t * 6)); g.rotate(0.12 * Math.sin(t * 4));
  g.lineWidth = 50; g.strokeStyle = INK; g.strokeText("?", 0, 0); g.fillStyle = "#ffd23a"; g.fillText("?", 0, 0); g.restore();
};
export const fxExclaim = (p, t) => {
  const g = p.g; g.save(); g.font = "900 620px Arial Black, Arial"; g.textAlign = "center"; g.lineJoin = "round"; g.translate(500, 800); const s = 0.8 + 0.25 * Math.sin(Math.min(1, t * 4) * Math.PI); g.scale(s, s);
  g.lineWidth = 50; g.strokeStyle = INK; g.strokeText("!", 0, 0); g.fillStyle = "#ff5a3a"; g.fillText("!", 0, 0); g.restore();
};
export const fxSquawk = (p, t) => { for (let k = 0; k < 3; k++) { const r = 140 + k * 110 + t * 160; p.arc(500, 500, r, r * 0.9, -50, 50, 14, "#ffffff"); } };
export const fxMedal = (p, glint = 0) => {
  p.poly([[420, 120], [580, 120], [560, 460], [440, 460]], "#c0353a", 12); p.stroke([[500, 120], [500, 460]], 30, "#2a4a8a");
  p.ell(500, 640, 200, 200, "#e6b53a", 14); p.ell(500, 640, 140, 140, "#f6d36a", 8);
  const g = p.g; g.save(); g.font = "900 150px Arial Black, Arial"; g.textAlign = "center"; g.fillStyle = "#b8862a"; g.fillText("★", 500, 690); g.restore();
  if (glint > 0) { const k = glint; p.poly([[430 + 200 * k, 520], [445 + 200 * k, 600], [520 + 200 * k, 615], [445 + 200 * k, 630], [430 + 200 * k, 710], [415 + 200 * k, 630], [340 + 200 * k, 615], [415 + 200 * k, 600]], "#ffffff", 0); }
};

/** kangaroo (side view facing right, square card) */
export const kangaroo = (p, opts = {}) => {
  const col = "#b8784a", d = "#8a5432";
  p.line([[380, 760], [200, 900], [120, 960]], col, 46, true); // tail
  p.ell(470, 660, 150, 210, col, 12, 0, 360, 18);
  p.ell(430, 900, 130, 60, d, 10); p.line([[470, 930], [640, 965]], d, 30, true);
  p.ell(600, 440, 70, 60, col, 10);
  p.line([[560, 560], [640, 640], [680, 620]], col, 22, true); // arm
  p.ell(650, 330, 78, 62, col, 12, 0, 360, -12);
  p.ell(720, 350, 40, 28, mix(col, "#ffffff", 0.2), 8);
  p.dot(745, 345, 9); p.ell(610, 240, 22, 60, col, 9, 0, 360, -12); p.ell(650, 236, 22, 62, col, 9, 0, 360, 8);
  p.ell(668, 318, 15, 17, "#fbf6ea", 5); p.dot(672, 320, 8);
  if (opts.smile) p.arc(712, 372, 22, 10, 20, 160, 5);
};
/** stylized emblem: shield with emu and kangaroo supporters and a star (our own simplified drawing) */
export const arms = (p, hero = 0) => {
  p.poly([[330, 360], [670, 360], [670, 620], [500, 760], [330, 620]], "#f4efe0", 14);
  const q = [["#c0353a", 330, 360], ["#2a4a8a", 500, 360], ["#2a4a8a", 330, 520], ["#e6b53a", 500, 520]];
  p.clip([[330, 360], [670, 360], [670, 620], [500, 760], [330, 620]], () => { for (const [c, x, y] of q) p.poly([[x + 8, y + 8], [x + 162, y + 8], [x + 162, y + 152], [x + 8, y + 152]], c, 0); });
  p.poly([[330, 360], [670, 360], [670, 620], [500, 760], [330, 620]], null, 14);
  // star
  const st = []; for (let i = 0; i < 14; i++) { const a = -Math.PI / 2 + i * Math.PI / 7, r = i % 2 ? 34 : 80; st.push([500 + Math.cos(a) * r, 270 + Math.sin(a) * r]); } p.poly(st, "#e6b53a", 10);
  // wattle sprigs
  for (let i = 0; i < 9; i++) p.dot(300 + i * 50, 820 + 20 * Math.sin(i), 18, "#f0c23a");
  p.line([[280, 830], [720, 830]], "#5a8a3a", 12, true);
  // supporters
  p.g.save(); p.g.translate(-75, 150); p.g.scale(0.6, 0.6); kangaroo(p); p.g.restore();
  p.g.save(); p.g.translate(1150, 225 - hero * 40); p.g.scale(-0.55, 0.55); emu(p, { mode: "stand", expr: hero ? "wink" : "neutral", look: 0.4 }); p.g.restore();
};
export const stamp = (p) => {
  const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push([200 + t * 600, 200 + (i % 2) * 14]); } for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push([800 - (i % 2) * 14, 200 + t * 600]); } for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push([800 - t * 600, 800 - (i % 2) * 14]); } for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push([200 + (i % 2) * 14, 800 - t * 600]); }
  p.poly(pts, "#f4efe0", 8); p.poly([[250, 250], [750, 250], [750, 700], [250, 700]], "#8ac0d8", 6);
  p.poly([[250, 600], [750, 560], [750, 700], [250, 700]], "#c07a4a", 0);
  p.g.save(); p.g.translate(330, 200); p.g.scale(0.45, 0.45); emu(p, { mode: "walk", phase: 0.2 }); p.g.restore();
  const g = p.g; g.save(); g.font = "900 60px Arial Black, Arial"; g.textAlign = "center"; g.fillStyle = INK; g.fillText("AUSTRÁLIA", 500, 770); g.fillText("5c", 690, 320); g.restore();
};
export const coin = (p, k = 0) => {
  const sx = Math.max(0.08, Math.abs(Math.cos(k)));
  p.g.save(); p.g.translate(500, 500); p.g.scale(sx, 1); p.g.translate(-500, -500);
  p.ell(500, 500, 330, 330, "#c8c8c0", 16); p.ell(500, 500, 290, 290, "#dcdcd4", 6);
  if (Math.cos(k) > 0) { p.g.save(); p.g.translate(310, 260); p.g.scale(0.42, 0.42); emu(p, { mode: "stand" }); p.g.restore(); }
  p.g.restore();
};
export const receipts = (p, k) => {
  const n = Math.floor(4 + k * 26);
  for (let i = 0; i < n; i++) { const r1 = rnd(9, i), r2 = rnd(10, i); const x = 500 + (r1 - 0.5) * 520 * (1 - i / 40), y = 940 - i * 22; p.poly(rrect(x - 120, y - 40, x + 120, y + 40, 4).map(([a, b]) => [a + (r2 - 0.5) * 30, b]), "#f4efe0", 5); p.stroke([[x - 80, y - 10], [x + 70, y - 10]], 4, "#a8a090"); p.stroke([[x - 80, y + 10], [x + 30, y + 10]], 4, "#a8a090"); }
};
export const scoreCard = (p, a = 3, b = 0) => {
  p.poly(rrect(120, 220, 880, 780, 30), "#1e2a3a", 14);
  const g = p.g; g.save(); g.textAlign = "center"; g.font = "900 90px Arial Black, Arial"; g.fillStyle = "#ffd23a"; g.fillText("PLACAR", 500, 330);
  g.font = "900 110px Arial Black, Arial"; g.fillStyle = "#ffffff"; g.fillText("EMUS  " + a, 500, 520); g.fillText("EXÉRCITO  " + b, 500, 690); g.restore();
};
export const bushCard = (p, seed = 1) => {
  for (let i = 0; i < 14; i++) { const r = rnd(seed, i), r2 = rnd(seed, i + 30); p.ell(200 + r * 600, 560 + r2 * 360, 110 + 60 * r2, 90 + 50 * r, i % 2 ? "#7d9a5a" : "#647f48", 10); }
};
export const fxCoin = (p) => { p.ell(500, 500, 220, 220, "#e6b53a", 18); p.ell(500, 500, 150, 150, "#f6d36a", 8); p.dot(440, 440, 30, "#fff4c4"); };
export const fxThought = (p) => { for (const [x, y, r] of [[200, 900, 40], [280, 800, 60]]) p.ell(x, y, r, r * 0.8, "#ffffff", 10); p.ell(560, 420, 380, 300, "#ffffff", 14); };
export const fxSlate = (p, txt) => { p.poly(rrect(250, 300, 750, 700, 30), "#2f4436", 14); const g = p.g; g.save(); g.font = "900 220px Arial Black, Arial"; g.textAlign = "center"; g.fillStyle = "#f4f1e6"; g.fillText(txt, 500, 580); g.restore(); };
