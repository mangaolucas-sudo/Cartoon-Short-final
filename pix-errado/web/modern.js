
// ---------------- "O Bento resolve" modern cast (our own designs), built on the Pen / blob / face helpers above ----------------
FACE.cry = { eye: ["squeeze", "squeeze"], brow: [-5, 3], mouth: "wave" };
FACE.sob = { eye: ["squeeze", "squeeze"], brow: [-5, 3], mouth: "O" };
FACE.sad = { eye: ["small", "small"], brow: [-4, 3], mouth: "frown" };
FACE.worried = { eye: ["lid", "lid"], brow: [-4, 2], mouth: "wave" };
FACE.frozen = { eye: ["shock", "shock"], brow: [-7, -6], mouth: "dash" };
FACE.talk = { eye: ["lid", "lid"], brow: [-1, -2], mouth: "o" };
FACE.talkSmile = { eye: ["lid", "lid"], brow: [-1, -2], mouth: "smile" };
FACE.sure = { eye: ["lid", "lid"], brow: [2, -2], mouth: "smirk" };
FACE.determined = { eye: ["lid", "lid"], brow: [5, -3], mouth: "teeth" };
FACE.liar = { eye: ["small", "small"], brow: [-3, 2], mouth: "smileWide" };
FACE.headsetTalk = { eye: ["happy", "happy"], brow: [-2, -2], mouth: "smile" };

export const PEOPLE = {
  // Juliana: same design in every scene (seed 7)
  juliana: { top: "#e2673f", pants: "#38507e", shoes: "#f4f1ea", skin: "#d9a074", hair: "#3a2418", hairStyle: "long", earrings: "#f2c94c", seed: 7 },
  // bank attendant: headset, teal polo with a plain badge
  atendente: { top: "#2f8f8a", pants: "#2e3440", shoes: "#2a2226", skin: "#f1c9a5", hair: "#7a3e22", hairStyle: "pony", headset: true, badge: true, seed: 12 },
  // neighbour, a lawyer: grey bun, glasses, navy blazer over a white shirt
  advogada: { top: "#2c3b63", shirt: "#f4f1ea", pants: "#2c3b63", shoes: "#4a2a22", skin: "#c48a62", hair: "#b9b4ad", hairStyle: "bun", glasses: true, blazer: true, seed: 21 },
};

/** Long / pony / bun hair drawn BEHIND the head (before the head fill) */
const hairBack = (p, O, H, cx, hc, chin, HH, light, thick, ow, u) => {
  if (O.hairStyle === "long") {
    const top = hc - H.b * 1.02, bot = chin + 0.42 * HH;
    const pts = [[cx - H.a * 1.12, hc - 0.1 * H.b], ...ellPts(cx, hc - 0.05 * H.b, H.a * 1.12, H.b * 1.04, 180, 360, 0, 30),
      [cx + H.a * 1.12, hc - 0.1 * H.b], [cx + H.a * 1.18, bot - 0.1 * HH], [cx + H.a * 0.9, bot], [cx + H.a * 0.45, bot - 0.06 * HH],
      [cx - H.a * 0.45, bot - 0.06 * HH], [cx - H.a * 0.9, bot], [cx - H.a * 1.18, bot - 0.1 * HH]];
    p.shadedFill(pts, O.hair, mul(O.hair, [0.7, 0.66, 0.72]), light, H.a * 1.2, 0.35);
    p.clip(pts, () => { for (let i = -4; i <= 4; i++) p.stroke(curve([cx + i * 22 * u, top + 30 * u], [cx + i * 26 * u, hc + 0.4 * H.b], [cx + i * 24 * u, bot - 10 * u]), 1.6 * u, mul(O.hair, [1.5, 1.5, 1.5])); });
    p.inkRing(pts, ow * 0.9, thick);
  }
  if (O.hairStyle === "pony") {
    const pts = blobPts(cx + H.a * 1.02, hc + 0.1 * H.b, { a: 0.32 * H.a, b: 0.95 * H.b, nTop: 2.2, nBot: 1.8, egg: -0.2, asym: 0, rot: rad(-14), noise: 0.02, seed: 5 });
    p.shadedFill(pts, O.hair, mul(O.hair, [0.7, 0.66, 0.72]), light, 0.4 * H.a, 0.35); p.inkRing(pts, ow * 0.85, thick);
  }
  if (O.hairStyle === "bun") {
    const pts = blobPts(cx, hc - H.b * 1.08, { a: 0.38 * H.a, b: 0.3 * H.b, nTop: 2.2, nBot: 2.2, egg: 0, asym: 0, rot: 0, noise: 0.02, seed: 9 });
    p.shadedFill(pts, O.hair, mul(O.hair, [0.74, 0.72, 0.76]), light, 0.4 * H.a, 0.35); p.inkRing(pts, ow * 0.85, thick);
  }
};

/** front-facing modern character. opts: expr, blink, look, facing, seed, L/R arm poses, tilt, headTilt, bob, tears (0..1 loop phase), talk */
export const personFront = (p, key, opts = {}) => {
  const O = typeof key === "string" ? PEOPLE[key] : key;
  const { expr = "neutral", blink = 0, look = 0, facing = 0, L = "hang", R = "hang", tilt = 0, headTilt = 0, bob = 0, light = rad(-120), step = 0, tears = -1, stomp = 0, lift = 0 } = opts;
  const seed = O.seed ?? 3;
  const lid = lidOf(blink), skin = O.skin ?? SKIN;
  const H = headBlob(seed, 118, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
  const torsoL = 1.08, legsL = 1.38, sole = 975;
  const torsoBot = sole - legsL * HH - bob * HH, chin = torsoBot - torsoL * HH, hc = chin - H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 5 * u, cx = 300;
  const legCol = O.pants, armCol = O.blazer ? O.top : O.top;
  p.rot = null;
  // ---- legs (pants + shoes) ----
  for (const side of [-1, 1]) {
    const raise = side === 1 ? stomp * 0.22 * HH : 0;
    const hx = cx + side * 16 * u, fx = cx + side * 22 * u, fy = sole - 4 * u - raise;
    p.stroke(curve([hx, hipY], [(hx + fx) / 2 + side * 2 * u, (hipY + fy) / 2], [fx, fy]), 7.5 * u + 2, INK);
    p.stroke(curve([hx, hipY], [(hx + fx) / 2 + side * 2 * u, (hipY + fy) / 2], [fx, fy]), 7.5 * u, legCol);
    const sh = [[fx - side * 5 * u, fy - 3 * u], [fx + side * 14 * u, fy - 1 * u], [fx + side * 15 * u, fy + 4 * u], [fx - side * 6 * u, fy + 4 * u]];
    p.poly(sh, O.shoes, 2.2 * u);
  }
  // ---- upper body ----
  p.rot = tilt ? [rad(tilt), cx, hipY] : null;
  const T = { a: (0.4 * W) / 1.06, b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.6, egg: 0.12, asym: 0.04 * facing, rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = cx + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const S = (side) => [tcx + side * 0.85 * T.a, chin + 0.12 * HH];
  const hands = {};
  const arm = (side, pose) => {
    const s = S(side), X = (k) => tcx + side * (T.a * 1.1 + k * u);
    switch (pose) {
      case "point": return { pts: [s, [X(28), s[1] - 0.02 * HH], [X(62), s[1] - 0.1 * HH]], front: false, finger: true };
      case "up": return { pts: [s, [X(14), s[1] - 0.3 * HH], [X(22), s[1] - 0.75 * HH]], front: false };
      case "fist": return { pts: [s, [X(26), s[1] - 0.05 * HH], [X(14), s[1] - 0.62 * HH]], front: false, fist: true };
      case "wave": return { pts: [s, [X(16), s[1] - 0.2 * HH], [X(30 + 10 * Math.sin(opts.wv || 0)), s[1] - 0.62 * HH]], front: false };
      case "hip": return { pts: [s, [X(22), s[1] + 0.3 * HH], [tcx + side * T.a * 0.95, torsoBot - 0.3 * HH]], front: false };
      case "belly": return { pts: [s, [X(8), s[1] + 0.45 * HH], [tcx + side * 0.25 * T.a, torsoBot - 0.35 * HH]], front: true };
      case "cross": return { pts: [s, [X(2), s[1] + 0.38 * HH], [tcx - side * 0.45 * T.a, s[1] + 0.32 * HH]], front: true };
      case "cheek": return { pts: [s, [X(16), s[1] + 0.05 * HH], [cx + side * (H.a + 2 * u), hc + 0.25 * H.b]], front: false };
      case "temple": return { pts: [s, [X(26), s[1] + 0.05 * HH], [cx + side * (H.a + 16 * u), hc - 0.1 * HH]], front: false };
      // phone at the ear
      case "ear": return { pts: [s, [X(20), s[1] + 0.22 * HH], [cx + side * (H.a * 0.98), hc + 0.08 * H.b]], front: false, hold: "ear" };
      // holding something up in front of the chest, screen to camera (read / show)
      case "show": return { pts: [s, [X(10), s[1] + 0.42 * HH], [tcx + side * 0.32 * T.a, chin + 0.12 * HH - lift * 0.3 * HH]], front: true, hold: "show" };
      // held lower, reading
      case "read": return { pts: [s, [X(8), s[1] + 0.45 * HH], [tcx + side * 0.36 * T.a, chin + 0.42 * HH]], front: true, hold: "read" };
      // arm stretched out to the side, handing something over
      case "give": return { pts: [s, [X(22), s[1] + 0.2 * HH], [X(52), s[1] + 0.12 * HH]], front: false, hold: "give" };
      case "headset": return { pts: [s, [X(22), s[1] + 0.12 * HH], [cx + side * (H.a * 1.05), hc + 0.3 * H.b]], front: false };
      default: return { pts: [s, [X(4), s[1] + 0.48 * HH], [X(3), chin + 1.04 * HH]], front: false };
    }
  };
  const arms = [arm(-1, L), arm(1, R)];
  const sleeve = O.blazer ? O.top : O.top;
  const drawArm = (a, side) => {
    const c = curve(a.pts[0], a.pts[1], a.pts[2]);
    // short sleeve (top colour) then skin forearm, except blazer (full sleeve)
    if (O.blazer) { p.stroke(c, 6.2 * u + 2, INK); p.stroke(c, 6.2 * u, sleeve); }
    else {
      p.stroke(c, 5.4 * u + 2, INK); p.stroke(c, 5.4 * u, skin);
      const n = Math.floor(c.length * 0.4); p.stroke(c.slice(0, n), 7 * u + 2, INK); p.stroke(c.slice(0, n), 7 * u, sleeve);
    }
    const [hx, hy] = a.pts[2];
    p.dot(hx, hy, 6.2 * u, INK); p.dot(hx, hy, 5 * u, skin);
    if (a.finger) { const dx = a.pts[2][0] - a.pts[1][0], dy = a.pts[2][1] - a.pts[1][1], l = Math.hypot(dx, dy); p.stroke([[hx, hy], [hx + dx / l * 14 * u, hy + dy / l * 14 * u]], 3.6 * u, INK); p.stroke([[hx, hy], [hx + dx / l * 13 * u, hy + dy / l * 13 * u]], 2 * u, skin); }
    if (a.fist) { p.ell(hx, hy, 8 * u, 7 * u, skin, 2.2 * u); p.stroke([[hx - 5 * u, hy - 1 * u], [hx + 5 * u, hy - 1 * u]], 1.2 * u); }
    if (a.hold) hands[a.hold] = { x: hx, y: hy, side };
  };
  // long hair goes behind the shoulders
  if (O.hairStyle === "long" || O.hairStyle === "pony" || O.hairStyle === "bun") {
    const [cpx0, cpy0] = rotAbout([cx, chin], rad(tilt), [cx, hipY]);
    const save = p.rot; const Ah0 = tilt + headTilt; p.rot = Ah0 ? [rad(Ah0), cx, chin, cpx0 - cx, cpy0 - chin] : null;
    hairBack(p, O, H, cx, hc, chin, HH, light, thick, ow, u);
    p.rot = save;
  }
  arms.forEach((a, i) => { if (!a.front) drawArm(a, i ? 1 : -1); });
  p.gradFill(tp, O.top, mul(O.top, SH_CLOTH), light);
  p.clip(tp, () => {
    if (O.blazer) {
      const sh = O.shirt;
      p.poly([[tcx - 0.34 * T.a, chin - 0.05 * HH], [tcx + 0.34 * T.a, chin - 0.05 * HH], [tcx + 0.12 * T.a, torsoBot - 0.1 * HH], [tcx - 0.12 * T.a, torsoBot - 0.1 * HH]], sh, 1.6 * u);
      for (const s of [-1, 1]) p.poly([[tcx + s * 0.36 * T.a, chin - 0.05 * HH], [tcx + s * 0.08 * T.a, chin + 0.45 * HH], [tcx + s * 0.5 * T.a, chin + 0.2 * HH]], mul(O.top, [0.8, 0.8, 0.9]), 1.6 * u);
      for (let i = 0; i < 2; i++) p.dot(tcx + 0.16 * T.a, chin + (0.62 + i * 0.2) * HH, 2.4 * u, "#d9b45a");
    } else {
      // round neckline + hem
      p.ell(tcx, chin + 0.02 * HH, 0.36 * T.a, 0.1 * HH, skin, 1.8 * u);
      p.band([[tcx - 1.4 * T.a, torsoBot - 0.06 * HH], [tcx + 1.4 * T.a, torsoBot - 0.06 * HH]], mul(O.top, [0.82, 0.82, 0.88]), 0.05 * HH, 1.2 * u);
    }
    if (O.badge) { p.poly(rrect(tcx + 0.28 * T.a, chin + 0.3 * HH, tcx + 0.7 * T.a, chin + 0.46 * HH, 2 * u), "#f4f1ea", 1.5 * u); p.stroke([[tcx + 0.34 * T.a, chin + 0.37 * HH], [tcx + 0.62 * T.a, chin + 0.37 * HH]], 1.4 * u, "#2f8f8a"); }
  });
  p.inkRing(tp, ow, thick);
  arms.forEach((a, i) => { if (a.front) drawArm(a, i ? 1 : -1); });
  // ---- head ----
  const [cpx, cpy] = rotAbout([cx, chin], rad(tilt), [cx, hipY]);
  const Ah = tilt + headTilt;
  p.rot = Ah ? [rad(Ah), cx, chin, cpx - cx, cpy - chin] : null;
  const hp = blobPts(cx, hc, H);
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  if (O.earrings) for (const s of [-1, 1]) { p.dot(cx + s * H.a * 0.98, hc + 0.42 * H.b, 4.4 * u, INK); p.dot(cx + s * H.a * 0.98, hc + 0.42 * H.b, 3.2 * u, O.earrings); }
  // fringe / top hair (in front)
  { // own fringe: hair cap with a side part, hairline well above the brows
    const yl = (x) => { const t = (x - cx) / H.a; return hc - H.b * (0.5 + 0.12 * t * t) + (t < -0.15 ? 0.1 * H.b * Math.sin((t + 0.15) * 5) : -0.06 * H.b * (t + 0.15)); };
    const edge = []; for (let i = 0; i <= 24; i++) { const x = cx - H.a * 1.1 + i / 24 * H.a * 2.2; edge.push([x, yl(x)]); }
    const cap = [[cx - H.a * 1.2, hc - H.b * 1.3], [cx + H.a * 1.2, hc - H.b * 1.3], ...edge.slice().reverse()];
    if (O.hairStyle === "long") { cap.splice(2, 0, [cx + H.a * 1.2, hc + 0.2 * H.b], [cx + H.a * 0.86, hc - 0.1 * H.b]); cap.push([cx - H.a * 0.86, hc - 0.1 * H.b], [cx - H.a * 1.2, hc + 0.2 * H.b]); }
    p.clip(hp, () => {
      p.shadedFill(cap, O.hair, mul(O.hair, [0.7, 0.66, 0.72]), light, H.a, 0.35);
      p.stroke(cap.slice(2), 2.6 * u);
      p.stroke(curve([cx - 0.25 * H.a, hc - 1.02 * H.b], [cx - 0.2 * H.a, hc - 0.8 * H.b], [cx - 0.12 * H.a, yl(cx - 0.12 * H.a)]), 1.8 * u, mul(O.hair, [1.6, 1.6, 1.6]));
    });
    p.inkRing(hp, ow, thick);
  }
  faceFront(p, cx, hc, W, expr, facing, look, lid, false, skin, null, false);
  if (O.glasses) {
    const fx = cx + 7 * u * facing;
    for (const s of [-1, 1]) { p.ell(fx + s * 13 * u, hc, 10.5 * u, 9 * u, null, 2.6 * u); p.ell(fx + s * 13 * u, hc, 9 * u, 7.5 * u, "#ffffff22", 0); }
    p.stroke([[fx - 3 * u, hc - 2 * u], [fx + 3 * u, hc - 2 * u]], 2.4 * u);
    for (const s of [-1, 1]) p.stroke([[fx + s * 23 * u, hc - 2 * u], [cx + s * H.a * 0.97, hc - 5 * u]], 2.4 * u);
  }
  if (O.headset) {
    p.stroke(ellPts(cx, hc - 0.05 * H.b, H.a * 1.1, H.b * 1.08, 195, 345, 0, 30), 4.2 * u + 3, INK);
    p.stroke(ellPts(cx, hc - 0.05 * H.b, H.a * 1.1, H.b * 1.08, 195, 345, 0, 30), 4.2 * u, "#3a3f4a");
    p.ell(cx - H.a * 1.02, hc + 0.05 * H.b, 9 * u, 13 * u, "#3a3f4a", 2.4 * u);
    p.stroke(curve([cx - H.a * 1.0, hc + 0.3 * H.b], [cx - H.a * 0.8, hc + 0.9 * H.b], [cx - 12 * u, hc + 0.62 * H.b]), 2.6 * u, INK);
    p.ell(cx - 11 * u, hc + 0.62 * H.b, 4 * u, 3.2 * u, "#3a3f4a", 1.6 * u);
  }
  // tears: two streams + falling drops (phase 0..1)
  if (tears >= 0) {
    const fx = cx + 7 * u * facing;
    for (const s of [-1, 1]) {
      const x = fx + s * 15 * u, y0 = hc + 5 * u;
      p.stroke([[x, y0], [x + s * 2 * u, y0 + 16 * u], [x + s * 1 * u, y0 + 30 * u]], 4.6 * u, "#ffffff");
      p.stroke([[x, y0], [x + s * 2 * u, y0 + 16 * u], [x + s * 1 * u, y0 + 30 * u]], 3.2 * u, "#8fd0ff");
      const k = (tears + (s > 0 ? 0.5 : 0)) % 1;
      p.ell(x + s * (4 + 10 * k) * u, y0 + (30 + 40 * k) * u, 3.2 * u, 4.6 * u, "#8fd0ff", 1.6 * u);
    }
  }
  p.rot = null;
  return hands;
};

/** money bill card (R$ 200 note in a cartoon style, no real banknote design) */
export const fxBill = (p, k = 0) => {
  const g = p.g; g.save(); g.translate(300, 500); g.rotate(-0.15 + 0.1 * Math.sin(k * 6.28));
  p.poly(rrect(-150, -75, 150, 75, 12), "#9fd39a", 10);
  p.poly(rrect(-122, -52, 122, 52, 10), null, 4);
  p.ell(0, 0, 44, 44, "#7cbf78", 5);
  g.font = "900 64px Inter, Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#1e4a22"; g.fillText("200", 0, 3);
  g.font = "900 30px Inter, Arial"; g.fillText("R$", -95, -30); g.fillText("R$", 95, 32);
  g.restore();
};
/** ringing arcs next to a phone (t 0..1 loop) */
export const fxPhoneRing = (p, t) => {
  for (let i = 0; i < 3; i++) {
    const k = (t + i / 3) % 1, r = 60 + k * 220, a = Math.max(0, 1 - k);
    const g = p.g; g.save(); g.globalAlpha = a;
    for (const s of [-1, 1]) { p.arc(300 + s * 10, 500, r, r, s > 0 ? -40 : 140, s > 0 ? 40 : 220, 16, INK); p.arc(300 + s * 10, 500, r, r, s > 0 ? -40 : 140, s > 0 ? 40 : 220, 9, "#ffd23f"); }
    g.restore();
  }
};
/** sweat drop */
export const fxSweat = (p) => { p.poly([[300, 380], [345, 500], [300, 545], [255, 500]], "#8fd0ff", 10); p.ell(285, 490, 12, 22, "#ffffff", 0); };
/** spark burst (ding) */
export const fxSpark = (p, t) => fxBurst(p, t, "#fff3b0", 12, 40, 260);
