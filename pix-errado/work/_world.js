// ---------- world ----------
const world = new THREE.Group(); scene.add(world);
const plane = (w, h, mat, x, y, z, ry = 0, rx_ = 0, parent = world) => { const m = add(new THREE.PlaneGeometry(w, h), mat, x, y, z, parent, { cast: false }); m.rotation.set(rx_, ry, 0); return m; };
const canvasTex = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = P.tex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; };
const basic = (map, extra = {}) => new THREE.MeshBasicMaterial({ map, fog: false, ...extra });
// painted city facade with a window grid
const facade = (seed, base, win) => canvasTex(256, 512, (g, w, h) => {
  const r = P.rng(seed); g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let y = 20; y < h - 20; y += 44) for (let x = 18; x < w - 30; x += 52) { g.fillStyle = r() < 0.25 ? '#ffe7a6' : win; g.fillRect(x, y, 32, 28); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x, y + 24, 32, 4); }
});
const art = (seed, cols) => canvasTex(256, 320, (g, w, h) => {
  const r = P.rng(seed); g.fillStyle = cols[0]; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 6; i++) { g.fillStyle = cols[1 + (i % (cols.length - 1))]; g.beginPath(); g.ellipse(r() * w, r() * h, 30 + r() * 70, 20 + r() * 60, r() * 3, 0, 7); g.fill(); }
  g.lineWidth = 14; g.strokeStyle = '#2b2430'; g.strokeRect(0, 0, w, h);
});
// --- living room (origin) ---
const ROOM = { x0: -4.5, x1: 4.5, zb: -3.5, h: 2.9 };
add(tbox(9.4, 0.1, 9, 1.6), M.plank, 0, -0.05, 0, world, { cast: false });
const rug = add(new THREE.CylinderGeometry(1.7, 1.7, 0.02, 40), M.rug, -1.0, 0.012, -1.4, world, { cast: false }); rug.scale.set(1.3, 1, 0.8);
// back wall with a window opening (x 1.2..3.4, y 0.9..2.4)
const wall = (w, h, x, y, z = ROOM.zb, mat = M.wallA, d = 0.2) => add(tbox(w, h, d, 1.4), mat, x, y, z, world);
wall(5.7, ROOM.h, -1.65, ROOM.h / 2); wall(1.1, ROOM.h, 3.95, ROOM.h / 2); wall(2.2, 0.9, 2.3, 0.45); wall(2.2, 0.5, 2.3, 2.65);
add(tbox(0.2, ROOM.h, 7, 1.4), M.wallA, ROOM.x0, ROOM.h / 2, 0, world); add(tbox(0.2, ROOM.h, 7, 1.4), M.wallA, ROOM.x1, ROOM.h / 2, 0, world);
for (const [w, h, x, y] of [[2.3, 0.08, 2.3, 0.9], [2.3, 0.08, 2.3, 2.4], [0.08, 1.58, 1.2, 1.65], [0.08, 1.58, 3.4, 1.65], [0.05, 1.5, 2.3, 1.65], [2.3, 0.14, 2.3, 0.86]]) add(box(w, h, 0.26), M.trim, x, y, ROOM.zb + 0.02, world);
add(box(9, 0.12, 0.04), M.trim, 0, 0.06, ROOM.zb + 0.12, world, { cast: false }); // skirting
// curtains
for (const s of [-1, 1]) { const c = add(tbox(0.42, 2.1, 0.08, 1), M.cushion, 2.3 + s * 1.38, 1.55, ROOM.zb + 0.2, world); }
// outside: city below, other buildings
const out = new THREE.Group(); world.add(out);
add(new THREE.PlaneGeometry(400, 400), M.grass, 0, -24, -120, out, { cast: false }).rotation.x = -Math.PI / 2;
{ const r = P.rng(7); for (let i = 0; i < 26; i++) {
  const w = 6 + r() * 8, h = 18 + r() * 40, x = -60 + r() * 120, z = -16 - r() * 70, m = new THREE.MeshToonMaterial({ gradientMap: grad, map: facade(i + 3, ['#e8c9a0', '#b9cde0', '#d9a28a', '#c8d6b0', '#f0e2c4'][i % 5], '#3d5a7a') });
  m.map.repeat.set(1, 1); add(box(w, h, w * 0.8), m, x, -24 + h / 2, z, out, { cast: false });
} }
// sofa
const sofa = new THREE.Group(); sofa.position.set(-1.7, 0, -2.95); world.add(sofa);
add(tbox(2.3, 0.42, 0.95, 1), M.sofa, 0, 0.25, 0, sofa); add(tbox(2.3, 0.62, 0.24, 1), M.sofaD, 0, 0.72, -0.38, sofa);
for (const s of [-1, 1]) add(tbox(0.24, 0.62, 0.95, 1), M.sofaD, s * 1.17, 0.4, 0, sofa);
for (const s of [-1, 1]) add(tbox(1.0, 0.14, 0.78, 1), M.sofa, s * 0.52, 0.53, 0.06, sofa);
add(tbox(0.45, 0.4, 0.14, 1), M.cushion, -0.75, 0.78, -0.22, sofa).rotation.z = 0.15; add(tbox(0.42, 0.38, 0.14, 1), M.cushion2, 0.78, 0.77, -0.22, sofa).rotation.z = -0.12;
for (const s of [-1, 1]) for (const t of [-1, 1]) add(new THREE.CylinderGeometry(0.03, 0.03, 0.1, 6), M.woodD, s * 1.1, 0.05, t * 0.36, sofa);
// pictures above the sofa
plane(0.62, 0.78, basic(art(3, ['#f6e7c8', '#e2673f', '#3f7f8f', '#f2b84b'])), -2.3, 1.75, ROOM.zb + 0.11);
plane(0.5, 0.62, basic(art(9, ['#e3f1f2', '#4f9a45', '#f2b84b', '#c46a3c'])), -1.35, 1.85, ROOM.zb + 0.11);
// side table + coffee table (phone stand for scene 5)
const ctab = new THREE.Group(); ctab.position.set(0.45, 0, -2.75); world.add(ctab);
add(tbox(0.9, 0.06, 0.55, 1), M.wood, 0, 0.55, 0, ctab); for (const s of [-1, 1]) for (const t of [-1, 1]) add(tbox(0.05, 0.55, 0.05, 1), M.woodD, s * 0.4, 0.275, t * 0.23, ctab);
// wall calendar (tear-off) + wall clock between sofa and window
const CAL = new THREE.Vector3(0.45, 1.55, ROOM.zb + 0.11);
add(box(0.48, 0.6, 0.03), M.woodD, CAL.x, CAL.y - 0.02, CAL.z, world);
const calTex = [1, 2, 3, 4].map((d) => canvasTex(SC.CW_, SC.CH_, (g) => SC.drawCalPage(g, d)));
const calUnder = plane(0.4, 0.44, basic(calTex[1]), CAL.x, CAL.y, CAL.z + 0.02);
const calHinge = new THREE.Group(); calHinge.position.set(CAL.x, CAL.y + 0.22, CAL.z + 0.03); world.add(calHinge);
const calTop = add(new THREE.PlaneGeometry(0.4, 0.44), basic(calTex[0], { side: THREE.DoubleSide }), 0, -0.22, 0, calHinge, { cast: false });
add(new THREE.CylinderGeometry(0.02, 0.02, 0.44, 8), M.metal, CAL.x, CAL.y + 0.24, CAL.z + 0.04, world).rotation.z = Math.PI / 2;
const CLK = new THREE.Vector3(0.45, 2.32, ROOM.zb + 0.11);
const clockFace = add(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 40), basic(canvasTex(256, 256, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#241726'; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.fillRect(128 + Math.cos(a) * 104 - 6, 128 + Math.sin(a) * 104 - 6, 12, 12); } })), CLK.x, CLK.y, CLK.z, world);
clockFace.rotation.x = Math.PI / 2;
const ring = add(new THREE.TorusGeometry(0.2, 0.025, 8, 40), M.cushion2, CLK.x, CLK.y, CLK.z + 0.02, world);
const handH = new THREE.Group(), handM = new THREE.Group(); handH.position.copy(CLK).add(new THREE.Vector3(0, 0, 0.035)); handM.position.copy(handH.position); world.add(handH); world.add(handM);
add(box(0.022, 0.11, 0.01), M.black, 0, 0.05, 0, handH, { cast: false }); add(box(0.014, 0.16, 0.01), M.cushion2, 0, 0.075, 0.006, handM, { cast: false });
// plant + floor lamp
const plant = (x, z, s = 1, parent = world) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); parent.add(g);
  add(new THREE.CylinderGeometry(0.22, 0.17, 0.42, 16), M.pot, 0, 0.21, 0, g);
  const r = P.rng(Math.round(x * 10 + 99)); for (let i = 0; i < 7; i++) { const l = add(new THREE.SphereGeometry(0.2 + r() * 0.08, 10, 8), i % 2 ? M.leaf : M.leafD, (r() - 0.5) * 0.4, 0.62 + r() * 0.6, (r() - 0.5) * 0.4, g); l.scale.set(0.8, 1.3, 0.8); } return g; };
plant(-3.85, -2.9, 1.15); plant(3.95, -2.6, 0.95);
const lamp = new THREE.Group(); lamp.position.set(-3.15, 0, -3.0); world.add(lamp);
add(new THREE.CylinderGeometry(0.18, 0.2, 0.04, 16), M.metal, 0, 0.02, 0, lamp); add(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8), M.metal, 0, 0.77, 0, lamp);
add(new THREE.CylinderGeometry(0.17, 0.27, 0.32, 20, 1, true), M.lampShade, 0, 1.6, 0, lamp);
// door on the left wall
add(box(0.06, 2.1, 0.95), M.woodD, ROOM.x0 + 0.12, 1.05, -1.2, world); add(new THREE.SphereGeometry(0.035, 8, 8), M.cushion, ROOM.x0 + 0.17, 1.0, -0.85, world);
// shelf with books on the right wall
add(tbox(0.3, 0.04, 1.4, 1), M.wood, ROOM.x1 - 0.17, 1.5, -1.0, world);
{ const r = P.rng(5); let z = -1.6; for (let i = 0; i < 9; i++) { const w = 0.05 + r() * 0.04, h = 0.2 + r() * 0.1; add(box(0.22, h, w), [M.cushion, M.sofa, M.cushion2, M.leaf, M.white][i % 5], ROOM.x1 - 0.18, 1.52 + h / 2, z, world); z += w + 0.01; } }

// --- bank call centre (x = 40) ---
const OX = 40, office = new THREE.Group(); office.position.set(OX, 0, 0); world.add(office);
add(tbox(10, 0.1, 9, 1.6), toon({ color: '#b8bcc4' }), 0, -0.05, 0, office, { cast: false });
add(tbox(10, 2.9, 0.2, 1.4), M.wallC, 0, 1.45, -3.5, office);
add(tbox(0.2, 2.9, 7, 1.4), M.wallC, -4.6, 1.45, 0, office); add(tbox(0.2, 2.9, 7, 1.4), M.wallC, 4.6, 1.45, 0, office);
// sign on the wall (generic, no brand)
plane(2.4, 0.42, basic(canvasTex(1024, 180, (g, w, h) => { g.fillStyle = '#0f7b6c'; g.fillRect(0, 0, w, h); g.font = '900 78px Inter, Arial'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CENTRAL DE ATENDIMENTO', w / 2, h / 2 + 4); })), 0, 2.3, -3.38, 0, 0, office);
// partitions behind + desks
for (const x of [-2.6, 2.6]) add(tbox(1.8, 1.3, 0.06, 1), M.part, x, 0.65, -2.4, office);
const desk = (x, z, parent = office) => { const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  add(tbox(1.5, 0.05, 0.7, 1), M.desk, 0, 0.76, 0, g); add(tbox(1.5, 0.7, 0.04, 1), M.desk, 0, 0.38, 0.3, g);
  for (const s of [-1, 1]) add(tbox(0.05, 0.74, 0.66, 1), M.desk, s * 0.72, 0.37, 0, g); return g; };
desk(0, -0.95); desk(-2.6, -2.9); desk(2.6, -2.9);
const mon = (x, y, z, ry, parent = office) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  add(box(0.56, 0.34, 0.03), M.black, 0, 0.26, 0, g); add(box(0.04, 0.12, 0.04), M.black, 0, 0.06, -0.02, g); add(box(0.2, 0.015, 0.14), M.black, 0, 0.008, 0, g);
  plane(0.52, 0.3, basic(canvasTex(256, 150, (gg, w, h) => { gg.fillStyle = '#e9f4f2'; gg.fillRect(0, 0, w, h); gg.fillStyle = '#0f7b6c'; gg.fillRect(0, 0, w, 26); gg.fillStyle = '#9fb3b0'; for (let i = 0; i < 5; i++) gg.fillRect(16, 40 + i * 20, 120 + (i * 37) % 90, 9); })), 0, 0.26, 0.016, 0, 0, g); return g; };
mon(0.48, 0.785, -1.12, -0.5); mon(-2.6, 0.785, -3.05, 0); mon(2.6, 0.785, -3.05, 0);
plant(-4.0, -2.9, 1.1, office); plant(4.0, -2.9, 1.0, office);
for (let i = 0; i < 3; i++) add(box(0.32, 0.02, 0.24), M.white, -0.45 + i * 0.05, 0.795 + i * 0.012, -0.9, office);
// window in the office side wall view (painted sky panel)
plane(2.2, 1.3, basic(canvasTex(512, 300, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6fa8e6'); gr.addColorStop(1, '#cfe6f7'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#9fb6cc'; for (let i = 0; i < 7; i++) g.fillRect(i * 74, h - 60 - (i * 53) % 120, 60, 200); g.lineWidth = 14; g.strokeStyle = '#f7f3ec'; g.strokeRect(0, 0, w, h); g.fillStyle = '#f7f3ec'; g.fillRect(w / 2 - 5, 0, 10, h); })), -2.6, 1.95, -3.38, 0, 0, office);

// ---------- props: phone, paper ----------
const phone = new THREE.Group(); scene.add(phone); phone.visible = false;
const scrC = document.createElement('canvas'); scrC.width = SC.SW; scrC.height = SC.SH; const scrG = scrC.getContext('2d');
const scrT = new THREE.CanvasTexture(scrC); scrT.colorSpace = THREE.SRGBColorSpace; scrT.anisotropy = 8;
add(box(0.078, 0.158, 0.009), toon({ color: '#20232b' }), 0, 0, -0.0045, phone);
const scr = add(new THREE.PlaneGeometry(0.07, 0.144), new THREE.MeshBasicMaterial({ map: scrT, fog: false, toneMapped: false }), 0, 0, 0.0002, phone, { cast: false });
scr.userData.nd = new THREE.ShaderMaterial({ vertexShader: `varying float vD; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`, fragmentShader: `varying float vD; void main(){ gl_FragColor=vec4(.5,.5,1.,vD); }` });
let scrKey = '';
const setScreen = (s) => { const k = JSON.stringify(s); if (k === scrKey) return; scrKey = k; SC.drawScreen(scrG, s); scrT.needsUpdate = true; };
const paper = add(new THREE.PlaneGeometry(0.4, 0.28), basic(canvasTex(SC.PW, SC.PH, (g) => SC.drawPaper(g)), { side: THREE.DoubleSide }), 0, 0, 0, scene, { cast: true });
paper.visible = false;
const PROPS = { phone, paper };

function worldState(S, f) {
  // calendar: top page shows S.day, flips up/away with S.flip 0..1
  const d = Math.max(1, Math.min(3, S.day || 1));
  calTop.material.map = calTex[d - 1]; calUnder.material.map = calTex[d];
  calHinge.rotation.x = -(S.flip || 0) * 2.6; calTop.visible = (S.flip || 0) < 0.98;
  handM.rotation.z = -(S.clock || 0); handH.rotation.z = -(S.clock || 0) / 12 - 1.1;
}
