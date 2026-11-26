import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import * as SC from './screens.js';
import { SHOTS, TOTAL, shotAt, viewsAt, LIGHTS, lightFor, actorsAt, worldAt, fxAt, propsAt, overlayAt } from './story.js';
import { drawOverlay } from './overlay.js';

const W = 1080, H = 1920;
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.08, 1500);
const rx = (a) => a * Math.PI / 180;

// ---------- materials ----------
const grad = (() => { const d = new Uint8Array([90, 90, 90, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 2, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toon = (opts) => new THREE.MeshToonMaterial({ gradientMap: grad, ...opts });
const texM = (c, rx_ = 1, ry_ = 1, color = '#ffffff') => toon({ map: P.tex(c, rx_, ry_), color });

const M = {
  plank: texM(P.planks(1), 2, 2), grass: texM(P.grass(6), 40, 40), roof: texM(P.roof(9), 2, 2),
  wallA: texM(P.plaster(8, 32), 1, 1, '#ffe9d6'), wallB: texM(P.plaster(18, 190), 1, 1, '#e3f1f2'), wallC: texM(P.plaster(28, 200), 1, 1, '#dfe9f3'),
  conc: texM(P.plaster(38, 30), 1, 1, '#d9d3cc'), city1: texM(P.plaster(48, 35), 1, 1, '#f0d8b8'), city2: texM(P.plaster(58, 200), 1, 1, '#b9cde0'),
  wood: toon({ color: '#9a6a43' }), woodD: toon({ color: '#6b4630' }), white: toon({ color: '#f4f1ea' }), trim: toon({ color: '#f7f3ec' }),
  sofa: toon({ color: '#3f7f8f' }), sofaD: toon({ color: '#33697a' }), cushion: toon({ color: '#f2b84b' }), cushion2: toon({ color: '#e2673f' }),
  rug: toon({ color: '#c9a77a' }), pot: toon({ color: '#c46a3c' }), leaf: toon({ color: '#4f9a45' }), leafD: toon({ color: '#3c7a37' }),
  metal: toon({ color: '#3a3f4a' }), lampShade: toon({ color: '#f7e2b0' }), glass: toon({ color: '#bfe3f2' }), frameM: toon({ color: '#2b2430' }),
  desk: toon({ color: '#d9c7a8' }), part: toon({ color: '#5a8fa0' }), screen: toon({ color: '#1f2a38' }), black: toon({ color: '#1b1b20' }),
  windowC: toon({ color: '#9fd0ea' }), tree: toon({ color: '#5c9a3c' }), trunk: toon({ color: '#6a4a32' }), road: toon({ color: '#8a8a90' }),
};

// ---------- ink / normal-depth contract ----------
const NOINK = 'noink'; // userData flag: never outlined (cards, fx, water handled specially)
const ndMat = new THREE.ShaderMaterial({
  vertexShader: `varying vec3 vN; varying float vD; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `varying vec3 vN; varying float vD; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n*.5+.5, vD); }`,
  side: THREE.DoubleSide,
});
const cardNd = (map) => new THREE.ShaderMaterial({
  uniforms: { map: { value: map } },
  vertexShader: `varying vec2 vUv; varying float vD; void main(){ vUv=uv; vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying float vD; void main(){ if(texture2D(map,vUv).a<.5) discard; gl_FragColor=vec4(0.,0.,0.,vD); }`,
  side: THREE.DoubleSide,
});
const waterNd = new THREE.ShaderMaterial({
  vertexShader: `varying float vD; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `varying float vD; void main(){ gl_FragColor=vec4(.5,1.,.5,vD); }`,
});

// ---------- helpers ----------
const add = (geo, mat, x = 0, y = 0, z = 0, parent = scene, opts = {}) => {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = opts.cast ?? true; m.receiveShadow = true; parent.add(m); return m;
};
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const uvScale = (geo, su, sv) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return geo; };
/** box with world-scaled UVs per face (texel density 1 tile per `t` metres) */
const tbox = (w, h, d, t = 2) => {
  const g = box(w, h, d), uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / t, uv.getY(i) * dims[f][1] / t); }
  return g;
};

// ---------- sky ----------
const skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() }, sunSize: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 top, hor, sunDir, sunCol; uniform float sunSize; varying vec3 vP;
    void main(){ float h = clamp(vP.y,0.,1.); vec3 c = mix(hor, top, pow(h, .55)); if(vP.y<0.) c = hor;
      float s = dot(normalize(vP), normalize(sunDir)); c += sunCol * (smoothstep(1.-sunSize, 1.-sunSize*.6, s) + .35*pow(max(s,0.), 24.)*step(.001,sunSize));
      gl_FragColor = vec4(c,1.); }`,
}));
sky.userData.sky = true; scene.add(sky);

// ---------- lights ----------
const hemi = new THREE.HemisphereLight('#ffffff', '#ffffff', 1); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffffff', 2); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2;
scene.add(sun); scene.add(sun.target);
scene.fog = new THREE.Fog('#ffffff', 40, 600);
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
const CAL = new THREE.Vector3(0.5, 1.5, ROOM.zb + 0.11);
add(box(0.48, 0.6, 0.03), M.woodD, CAL.x, CAL.y - 0.02, CAL.z, world);
const calTex = [1, 2, 3, 4].map((d) => canvasTex(SC.CW_, SC.CH_, (g) => SC.drawCalPage(g, d)));
const calUnder = plane(0.4, 0.44, basic(calTex[1]), CAL.x, CAL.y, CAL.z + 0.02);
const calHinge = new THREE.Group(); calHinge.position.set(CAL.x, CAL.y + 0.22, CAL.z + 0.03); world.add(calHinge);
const calTop = add(new THREE.PlaneGeometry(0.4, 0.44), basic(calTex[0], { side: THREE.DoubleSide }), 0, -0.22, 0, calHinge, { cast: false });
add(new THREE.CylinderGeometry(0.02, 0.02, 0.44, 8), M.metal, CAL.x, CAL.y + 0.24, CAL.z + 0.04, world).rotation.z = Math.PI / 2;
const CLK = new THREE.Vector3(-0.02, 1.6, ROOM.zb + 0.11);
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

// ---------- cards ----------
const CW = 1200, CH = 2000, CM = 2.25; // canvas px, card height in metres (design 600x1000 -> 2.25 m)
const cardGeo = new THREE.PlaneGeometry(CM * 0.6, CM); cardGeo.translate(0, CM / 2 - CM * 0.025, 0);
const blobTex = P.tex(P.radial('20,14,30', 0.6));
class Card {
  constructor(scale = 1) {
    [this.c, this.g] = (() => { const c = document.createElement('canvas'); c.width = CW; c.height = CH; return [c, c.getContext('2d')]; })();
    this.t = new THREE.CanvasTexture(this.c); this.t.colorSpace = THREE.SRGBColorSpace; this.t.anisotropy = 4;
    this.mat = new THREE.MeshBasicMaterial({ map: this.t, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, fog: true });
    this.mesh = new THREE.Mesh(cardGeo, this.mat); this.mesh.userData.nd = cardNd(this.t); this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.t, alphaTest: 0.5 });
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, fog: true }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.userData.ndSkip = true; this.blob.renderOrder = 1;
    scene.add(this.mesh); scene.add(this.blob); this.key = ''; this.mesh.visible = this.blob.visible = false;
  }
  draw(key, fn) {
    if (key === this.key) return; this.key = key;
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0);
    const p = new T.Pen(g); fn(p); this.t.needsUpdate = true;
  }
}
const cards = []; const getCard = (i) => cards[i] || (cards[i] = new Card());


// ---------- render targets & post ----------
const rtColor = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
const rtNd = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const rtInk = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), fsGeo = new THREE.PlaneGeometry(2, 2);
const fs = (mat) => { const s = new THREE.Scene(); s.add(new THREE.Mesh(fsGeo, mat)); return s; };
const inkU = { col: { value: rtColor.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, px: { value: 1.6 }, fogCol: { value: new THREE.Color() },
  sat: { value: 1.08 }, lift: { value: new THREE.Color(0, 0, 0) }, gain: { value: new THREE.Color(1, 1, 1) }, vig: { value: 0.22 }, flash: { value: 0 } };
const inkScene = fs(new THREE.ShaderMaterial({ uniforms: inkU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D col, nd; uniform vec2 res; uniform float px, sat, vig, flash; uniform vec3 fogCol, lift, gain; varying vec2 vUv;
  float edgeAt(vec2 uv, float r){
    vec4 c = texture2D(nd, uv); if (dot(c.rgb,c.rgb) < .01) return 0.; float d = c.a; vec3 n = c.rgb*2.-1.;
    float e = 0.; float rr = r * clamp(7./d, .62, 1.25);
    for (int i=0;i<16;i++){ float a = float(i)*.785398 + (i>7 ? .39 : 0.); float k = i>7 ? .5 : 1.;
      vec2 o = vec2(cos(a), sin(a))*rr*k/res; vec4 s = texture2D(nd, uv+o);
      float ds = s.a; bool card = dot(s.rgb,s.rgb) < .01;
      if (card && ds > 0.) continue;            // character cards: never outlined by the world ink
      if (card) ds = 1e4;                        // sky
      vec3 ns = s.rgb*2.-1.;
      e = max(e, smoothstep(.006, .02, (ds - d)/d));                           // depth jump, near side only
      if (!card && abs(ds-d)/d < .06) e = max(e, smoothstep(.88, .72, dot(n, ns)) * .9); // crease
    }
    return e * (1. - smoothstep(140., 520., d)*.8);
  }
  void main(){
    vec3 c = texture2D(col, vUv).rgb;
    float e = edgeAt(vUv, px);
    c = mix(c, vec3(.012,.01,.014), e);
    if (flash < -0.5) c = vec3(e);
    float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, sat);
    c = c*gain + lift;
    vec2 q = vUv-.5; c *= 1. - vig*dot(q*vec2(1.,.75), q*vec2(1.,.75))*2.2;
    c = mix(c, vec3(1.), flash);
    gl_FragColor = vec4(c,1.); }` }));
const dofU = { src: { value: rtInk.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, focus: { value: 5 }, cinf: { value: 0 }, near: { value: 1 } };
const dofScene = fs(new THREE.ShaderMaterial({ uniforms: dofU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D src, nd; uniform vec2 res; uniform float focus, cinf, near; varying vec2 vUv;
  float coc(vec2 uv){ float d = texture2D(nd, uv).a; if (d <= 0.) d = 2000.; float k = 1. - focus/d; return k > 0. ? cinf*k : min(-k*cinf*near, cinf*1.4); }
  void main(){
    float c0 = coc(vUv);
    if (cinf < .5 || c0 < .6) { gl_FragColor = linearToOutputTexel(vec4(texture2D(src, vUv).rgb, 1.)); return; }
    vec3 acc = vec3(0.); float wsum = 0.;
    for (int i=0;i<48;i++){ float fi = float(i); float r = sqrt((fi+.5)/48.); float a = fi*2.39996;
      vec2 o = vec2(cos(a), sin(a))*r*c0/res; float cs = coc(vUv+o);
      float w = smoothstep(r*c0-1.5, r*c0+.5, cs + .5);
      acc += texture2D(src, vUv+o).rgb*w; wsum += w; }
    gl_FragColor = linearToOutputTexel(vec4(acc/max(wsum,1e-3), 1.)); }` }));
// final copy with sRGB handled by the renderer output (we render to screen with linear->sRGB in the shader chunk)
dofScene.children[0].material.toneMapped = false;

// ---------- per-frame state ----------
const tmpV = new THREE.Vector3();
function applyLight(L, f) {
  hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.hemi;
  sun.color.set(L.sun); sun.intensity = L.sunI;
  scene.fog.color.set(L.fog); scene.fog.near = L.fogNear; scene.fog.far = L.fogFar;
  skyU.top.value.set(L.skyTop); skyU.hor.value.set(L.skyHor); skyU.sunCol.value.set(L.sunDisc || '#000'); skyU.sunSize.value = L.sunSize || 0;
  inkU.sat.value = L.sat; inkU.gain.value.set(L.gain || '#ffffff'); inkU.lift.value.set(L.lift || '#000000');
}
function placeSun(L, focus) {
  // sun direction from azimuth/elevation in world space
  const az = rx(L.az), el = rx(L.el); tmpV.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  skyU.sunDir.value.copy(tmpV);
  sun.position.copy(focus).addScaledVector(tmpV, 80); sun.target.position.copy(focus);
  const ext = L.shadowExt || 30, sc = sun.shadow.camera; sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 200; sc.updateProjectionMatrix();
}

const swapForNd = (on) => {
  scene.traverse((o) => {
    if (!o.isMesh) return;
    if (on) {
      o.userData.mat0 = o.material;
      if (o.userData.ndSkip) { o.userData.vis0 = o.visible; o.visible = false; return; }
      if (o === sky || o.userData.sky) { o.userData.vis0 = o.visible; o.visible = false; return; }
      o.material = o.userData.nd || ndMat;
    } else {
      o.material = o.userData.mat0; if (o.userData.vis0 !== undefined) { o.visible = o.userData.vis0; delete o.userData.vis0; }
    }
  });
};

// ---------- per-frame ----------
const GROUND = 0;
function drawActors(list, cam) {
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  list.forEach((a, i) => {
    const c = getCard(i);
    if (a.key !== c.key) { c.key = a.key; const g = c.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0); c.hands = a.draw(new T.Pen(g)) || {}; c.t.needsUpdate = true; }
    c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
    const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, Math.atan2(cam.position.x - a.x, cam.position.z - a.z) + (a.yaw || 0), a.roll || 0);
    c.mat.color.set(a.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1;
    c.mesh.castShadow = a.shadow !== false; c.mesh.renderOrder = a.order || 2;
    if (a.blob !== false && a.y < 0.3) { c.blob.visible = true; c.blob.position.set(a.x, (a.ground ?? GROUND) + 0.015, a.z); c.blob.scale.set(0.95 * s, 0.6 * s, 1); }
    c.mesh.updateMatrixWorld(); a._card = c;
  });
}
const tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler();
function placeProps(list, actors, cam) {
  for (const k in PROPS) PROPS[k].visible = false;
  for (const pr of list) {
    const o = PROPS[pr.kind]; if (!o) continue; o.visible = true;
    if (pr.kind === 'phone' && pr.screen) setScreen(pr.screen);
    if (pr.attach) { // to a card's hand: card-local coordinates -> world
      const a = actors[pr.attach.actor], c = a && a._card, h = c && c.hands && c.hands[pr.attach.hand];
      if (!h) { o.visible = false; continue; }
      const lx = (h.x / 600 - 0.5) * CM * 0.6, ly = (1 - h.y / 1000) * CM - CM * 0.025;
      const v = new THREE.Vector3(lx + (pr.attach.dx || 0), ly + (pr.attach.dy || 0), pr.attach.dz ?? 0.06); c.mesh.localToWorld(v);
      o.position.copy(v); o.quaternion.copy(c.mesh.quaternion);
      if (pr.rot) { tmpE.set(...pr.rot); tmpQ.setFromEuler(tmpE); o.quaternion.multiply(tmpQ); }
    } else {
      o.position.set(...pr.pos);
      if (pr.face === 'cam') { o.lookAt(cam.position); if (pr.rot) { tmpE.set(...pr.rot); tmpQ.setFromEuler(tmpE); o.quaternion.multiply(tmpQ); } }
      else o.rotation.set(...(pr.rot || [0, 0, 0]));
    }
    o.scale.setScalar(pr.s || 1);
  }
}
const outC = document.getElementById('o'), outG = outC.getContext('2d');
function renderView(f, V, S, L, vi) {
  const C = V.cam;
  camera.position.set(...C.pos); camera.up.set(0, 1, 0); camera.lookAt(...C.look); camera.rotateZ(rx(C.roll || 0));
  camera.fov = C.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  placeSun(L, new THREE.Vector3(...(C.shadowAt || C.look)));
  const actors = [...actorsAt(f, T, vi), ...fxAt(f, T, vi)];
  drawActors(actors, camera);
  placeProps(propsAt(f, vi), actors, camera);
  sky.position.copy(camera.position);
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  const fog = scene.fog; scene.fog = null; const sm = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false; renderer.shadowMap.autoUpdate = false;
  swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false);
  scene.fog = fog; renderer.shadowMap.enabled = sm; renderer.shadowMap.autoUpdate = true;
  const D = V.dof || { focus: 5, cinf: 0 };
  inkU.px.value = 2.5; inkU.flash.value = window.DEBUG_E ? -1 : (V.flash || 0); inkU.vig.value = L.vig ?? 0.22;
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  dofU.focus.value = D.focus; dofU.cinf.value = D.cinf; dofU.near.value = D.near ?? 1;
  renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  const [sx, sy, sw, sh] = V.src || [0, 0, W, H], [dx, dy, dw, dh] = V.dst || [0, 0, W, H];
  outG.drawImage(canvas, sx, sy, sw, sh, dx, dy, dw, dh);
}
window.renderFrame = (f) => {
  const S = shotAt(f), L = lightFor(S, f);
  applyLight(L, f); worldState(worldAt(f), f);
  outG.setTransform(1, 0, 0, 1, 0, 0); outG.clearRect(0, 0, W, H);
  viewsAt(f).forEach((V, vi) => renderView(f, V, S, L, vi));
  drawOverlay(outG, overlayAt(f), f);
  return true;
};
window.TOTAL = TOTAL;
document.fonts.load('900 80px Inter').then(() => document.fonts.load('40px "Noto Color Emoji"')).finally(() => { window.ready = true; });
