import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import { SHOTS, TOTAL, shotAt, camAt, dofAt, LIGHTS, lightFor, actorsAt, worldAt, fxAt, TEXTS } from './story.js';
import { SUBS } from './subs.js';

const W = 1080, H = 1920;
// platform-safe area (TikTok/Shorts UI): keep 150 px top, 350 px bottom, 150 px right clear
export const SAFE = { x0: 40, x1: 930, y0: 150, y1: 1570, cx: 485, cy: 860, dx: 540 - 485, dy: 960 - 860 };
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
  plank: texM(P.planks(1), 1, 6), beam: texM(P.beam(2), 1, 2), beamDark: texM(P.beam(3, [28, 36, 30]), 1, 2),
  rot: texM(P.rotten(4), 1, 1), rotB: texM(P.rotten(14), 1, 1),
  stone: texM(P.stone(4), 1, 1), stoneMoss: texM(P.mossy(P.stone(4), 5, 1.2), 1, 1),
  grass: texM(P.grass(6), 40, 40), dirt: texM(P.dirt(7), 6, 30), plaster: texM(P.plaster(8), 1, 1), plaster2: texM(P.plaster(18, 28), 1, 1),
  roof: texM(P.roof(9), 2, 2), marble: texM(P.marble(10), 1, 1), marbleTop: toon({ color: '#ece2cf' }),
  trunk: toon({ color: '#6a4a32' }), cypress: toon({ color: '#3f6b36' }), pine: toon({ color: '#5c8a3c' }), bush: toon({ color: '#6c9a42' }),
  hill: toon({ color: '#7aa64c' }), hillFar: toon({ color: '#86ad60' }), mount: toon({ color: '#8fa7b8' }), snow: toon({ color: '#f4f6fa' }),
  iron: toon({ color: '#5c5a57' }), bronze: toon({ color: '#b08a4a' }), wood: toon({ color: '#7a5434' }), door: toon({ color: '#5a3a24' }),
  window: toon({ color: '#2b2430' }), red: toon({ color: '#b8282b' }),
};
M.banner = new THREE.MeshToonMaterial({ gradientMap: grad, map: P.tex(P.banner()), alphaTest: 0.5, side: THREE.DoubleSide });
// helmet
const helmetIn = P.tex(P.helmetInside()); helmetIn.wrapS = helmetIn.wrapT = THREE.ClampToEdgeWrapping;
M.helmIn = new THREE.MeshToonMaterial({ gradientMap: grad, map: helmetIn, side: THREE.BackSide });
M.helmOut = toon({ color: '#8f8a7e' });

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
const DECK = 0;
const world = new THREE.Group(); scene.add(world);
const waterU = { t: { value: 0 }, deep: { value: new THREE.Color() }, shal: { value: new THREE.Color() }, glint: { value: new THREE.Color() } };
const W2 = {
  conc: texM(P.concrete(51)), corr: texM(P.corrugated(52)), corrB: texM(P.corrugated(57, 25, 22, 60)),
  rackU: toon({ color: '#2f5fa8' }), rackB: toon({ color: '#e8742a' }), pallet: texM(P.planks(61), 1, 1, '#e8d2a8'),
  tiles: texM(P.tiles(54)), plasterW: texM(P.plaster(62, 45)), woodTop: texM(P.woodTop(56)), wood: toon({ color: '#6b4528' }), floorW: texM(P.planks(64), 1, 1, '#d8b48a'),
  carpet: texM(P.carpet(55)), officeWall: texM(P.plaster(63, 38)), metal: toon({ color: '#9aa3ad' }), dark: toon({ color: '#2b2f3a' }),
  yellow: toon({ color: '#f2c230' }), white: toon({ color: '#f3f1ea' }), plant: toon({ color: '#4c8f3c' }), pot: toon({ color: '#b8643a' }),
  glass: toon({ color: '#bfe0f2' }), frame: toon({ color: '#f4efe4' }), ceil: toon({ color: '#3a3f4a' }), mug: toon({ color: '#e85d4a' }),
  green: toon({ color: '#38b25a' }), greenF: toon({ color: '#2a8f46' }), red: toon({ color: '#e0453c' }), redF: toon({ color: '#b8322c' }),
};
const boxMats = [0, 1, 2, 3, 4, 5].map((i) => texM(P.cardboard(70 + i, i === 2 ? 'FRÁGIL' : i === 4 ? 'BEBIDAS' : '')));
const plane = (w, h, mat, x, y, z, parent = world, rotX = 0, rotY = 0, opts = {}) => { const m = add(new THREE.PlaneGeometry(w, h), mat, x, y, z, parent, { cast: false, ...opts }); m.rotation.set(rotX, rotY, 0); return m; };
const signMat = (c) => new THREE.MeshBasicMaterial({ map: P.tex(c), fog: false });
const rb = P.rng(77);
const boxStack = (x, z, parent = world, y0 = 0, w = 1.1, d = 1.0, levels = 2) => {
  for (let k = 0; k < levels; k++) for (const [ox, oz] of [[-0.27, -0.25], [0.27, -0.25], [-0.27, 0.25], [0.27, 0.25]]) {
    if (k === levels - 1 && rb() < 0.3) continue;
    const s = 0.46 + rb() * 0.08, h = 0.38 + rb() * 0.14;
    const b = add(tbox(s, h, s, 0.5), boxMats[(rb() * 6) | 0], x + ox * w / 1.1, y0 + k * 0.52 + h / 2, z + oz * d, parent); b.rotation.y = (rb() - 0.5) * 0.2;
  }
};
const pallet = (x, z, parent = world, y0 = 0) => { add(tbox(1.2, 0.14, 1.0, 1), W2.pallet, x, y0 + 0.07, z, parent); };
// ===== A) warehouse at the origin =====
{
  const fl = add(uvScale(new THREE.PlaneGeometry(44, 34), 11, 8.5), W2.conc, 0, 0, -4, world, { cast: false }); fl.rotation.x = -Math.PI / 2; W2.conc.map.repeat.set(1, 1);
  for (const z of [2.3, -2.7]) plane(44, 0.12, W2.yellow, 0, 0.006, z, world, -Math.PI / 2);
  add(tbox(44, 10, 0.3, 3), W2.corr, 0, 5, -15, world);
  for (const s of [-1, 1]) add(tbox(0.3, 10, 34, 3), W2.corrB, s * 21, 5, -2, world);
  plane(44, 34, W2.ceil, 0, 10, -2, world, Math.PI / 2);
  plane(7.2, 1.8, signMat(P.sign([['DISTRIBUIDORA SÃO JORGE', 92], ['ESTOQUE • SETOR B', 64]], { w: 1024, h: 256, bg: '#1f4f8a' })), 0, 7.6, -14.8, world);
  plane(1.6, 0.8, signMat(P.sign([['USE O COLETE', 120]], { w: 1024, h: 512, bg: '#f2c230', fg: '#222', border: '#222' })), -8, 2.4, -14.8, world);
  const rack = (x, z, len, rotY = 0) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; world.add(g);
    const n = Math.round(len / 2.7);
    for (let i = 0; i <= n; i++) for (const dz of [-0.55, 0.55]) add(tbox(0.1, 4.6, 0.1, 1), W2.rackU, -len / 2 + i * len / n, 2.3, dz, g);
    for (const y of [0.15, 1.55, 2.95, 4.35]) for (const dz of [-0.55, 0.55]) add(tbox(len, 0.12, 0.08, 1), W2.rackB, 0, y, dz, g);
    for (let i = 0; i < n; i++) for (const y of [0.21, 1.61, 3.01]) { const cx = -len / 2 + (i + 0.5) * len / n; pallet(cx, 0, g, y); if (rb() < 0.88) boxStack(cx, 0, g, y + 0.14, 1.1, 0.9, y > 2 ? 2 : 2); }
    return g;
  };
  rack(0, -5.6, 16.2); rack(0, -11.5, 21.6); rack(-9.2, -1.2, 8.1, Math.PI / 2); rack(9.2, -1.2, 8.1, Math.PI / 2);
  pallet(-3.1, -2.6); boxStack(-3.1, -2.6, world, 0.14, 1.1, 1.0, 3);
  pallet(3.6, -2.2); boxStack(3.6, -2.2, world, 0.14, 1.1, 1.0, 2);
  pallet(-4.6, 1.6); boxStack(-4.6, 1.6, world, 0.14);
  pallet(4.4, 1.2); boxStack(4.4, 1.2, world, 0.14, 1.1, 1.0, 1);
  for (let i = 0; i < 6; i++) { const l = add(tbox(2.4, 0.12, 0.35, 1), W2.frame, -10 + i * 4, 9.5, -4, world, { cast: false }); }
}
// forklift (animated)
const fork = new THREE.Group(); fork.position.set(-6, 0, -8.2); world.add(fork);
{
  add(tbox(1.3, 0.9, 2.1, 1), W2.yellow, 0, 0.75, 0, fork);
  for (const [x, z] of [[-0.6, 0.7], [0.6, 0.7], [-0.6, -0.7], [0.6, -0.7]]) { const w = add(new THREE.CylinderGeometry(0.3, 0.3, 0.22, 16), W2.dark, x, 0.3, z, fork); w.rotation.z = Math.PI / 2; }
  for (const [x, z] of [[-0.55, 0.5], [0.55, 0.5], [-0.55, -0.4], [0.55, -0.4]]) add(tbox(0.07, 1.4, 0.07, 1), W2.dark, x, 1.9, z, fork);
  add(tbox(1.25, 0.08, 1.05, 1), W2.dark, 0, 2.6, 0.05, fork);
  for (const x of [-0.45, 0.45]) add(tbox(0.09, 2.6, 0.09, 1), W2.dark, x, 1.3, 1.15, fork);
  for (const x of [-0.3, 0.3]) add(tbox(0.12, 0.05, 1.1, 1), W2.dark, x, 0.45, 1.7, fork);
  pallet(0, 1.7, fork, 0.48); boxStack(0, 1.7, fork, 0.62, 1.1, 1.0, 1);
}
// ===== B) home table (x=-60) =====
const HOME = [-60, 0, 0], TABLE = 0.79;
{
  const fl = add(uvScale(new THREE.PlaneGeometry(8, 8), 4, 4), W2.floorW, -60, 0, 0, world, { cast: false }); fl.rotation.x = -Math.PI / 2;
  add(tbox(8, 3.2, 0.2, 0.8), W2.tiles, -60, 1.6, -1.4, world);
  add(tbox(0.2, 3.2, 6, 2), W2.plasterW, -63.2, 1.6, 1.4, world);
  add(tbox(1.6, 0.05, 1.0, 1.2), W2.woodTop, -60, TABLE - 0.025, 0, world);
  for (const [x, z] of [[-0.72, -0.42], [0.72, -0.42], [-0.72, 0.42], [0.72, 0.42]]) add(tbox(0.07, TABLE - 0.05, 0.07, 1), W2.wood, -60 + x, (TABLE - 0.05) / 2, z, world);
  add(tbox(1.3, 1.0, 0.06, 1), W2.frame, -59.1, 1.75, -1.28, world); plane(1.15, 0.86, W2.glass, -59.1, 1.75, -1.24, world);
  add(tbox(0.04, 0.86, 0.04, 1), W2.frame, -59.1, 1.75, -1.23, world);
  const mug = add(new THREE.CylinderGeometry(0.05, 0.045, 0.11, 18), W2.mug, -59.55, TABLE + 0.055, -0.22, world);
  const h = add(new THREE.TorusGeometry(0.03, 0.009, 8, 16), W2.mug, -59.495, TABLE + 0.06, -0.22, world); h.rotation.y = 0;
  add(new THREE.CylinderGeometry(0.075, 0.06, 0.12, 14), W2.pot, -60.62, TABLE + 0.06, -0.3, world);
  const pl = add(new THREE.SphereGeometry(0.12, 12, 8), W2.plant, -60.62, TABLE + 0.2, -0.3, world); pl.scale.y = 0.8;
  // keys
  add(new THREE.TorusGeometry(0.018, 0.004, 6, 14), W2.metal, -59.72, TABLE + 0.004, 0.22, world).rotation.x = Math.PI / 2;
  add(tbox(0.05, 0.004, 0.012, 1), W2.metal, -59.68, TABLE + 0.004, 0.235, world).rotation.y = 0.5;
}
// boleto + stamp
const boletoC = (() => { const c = document.createElement('canvas'); c.width = 800; c.height = 1100; const g = c.getContext('2d');
  g.fillStyle = '#fbf8ef'; g.fillRect(0, 0, 800, 1100); g.strokeStyle = '#2b2b33'; g.lineWidth = 6; g.strokeRect(10, 10, 780, 1080);
  g.fillStyle = '#2b2b33'; g.font = '900 70px Inter'; g.fillText('BOLETO', 50, 110); g.font = '800 46px Inter'; g.fillText('ALUGUEL • NOVEMBRO', 50, 175);
  g.fillRect(40, 205, 720, 6);
  const row = (k, v, y) => { g.font = '600 34px Inter'; g.fillStyle = '#5a5a66'; g.fillText(k, 50, y); g.font = '900 50px Inter'; g.fillStyle = '#1e1e26'; g.fillText(v, 50, y + 58); g.fillStyle = '#c8c8d0'; g.fillRect(40, y + 82, 720, 3); };
  row('Locatário', 'Ricardo S. Lima', 270); row('Vencimento', '30/10', 420); row('Valor', 'R$ 1.200,00', 570);
  const r = P.rng(9); g.fillStyle = '#1e1e26'; let x = 50; while (x < 750) { const w = 3 + ((r() * 4) | 0) * 3; g.fillRect(x, 800, w, 170); x += w + 3 + ((r() * 3) | 0) * 3; }
  g.font = '600 30px JetBrains Mono, monospace'; g.fillText('34191.79001 01043.510047 91020.150008', 50, 1030); return c; })();
const boleto = plane(0.27, 0.37, toon({ map: P.tex(boletoC) }), -60.48, TABLE + 0.002, 0.08, world, -Math.PI / 2); boleto.rotation.z = 0.14;
const stampC = (() => { const c = document.createElement('canvas'); c.width = 800; c.height = 260; const g = c.getContext('2d');
  g.strokeStyle = '#d42a2a'; g.lineWidth = 22; g.strokeRect(16, 16, 768, 228); g.fillStyle = '#d42a2a'; g.font = '900 124px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ATRASADO', 400, 136);
  g.globalCompositeOperation = 'destination-out'; const r = P.rng(4); for (let i = 0; i < 260; i++) { g.beginPath(); g.arc(r() * 800, r() * 260, 1 + r() * 4, 0, 7); g.fill(); } return c; })();
const stampMat = new THREE.MeshBasicMaterial({ map: P.tex(stampC), transparent: true, depthWrite: false, fog: false });
const stamp = plane(0.25, 0.082, stampMat, -60.47, TABLE + 0.004, 0.0, world, -Math.PI / 2); stamp.rotation.z = 0.32; stamp.userData.ndSkip = true; stamp.renderOrder = 3;
// ===== C) split studio (x=60) =====
{
  plane(7, 9, W2.green, 56.5, 4.5, -3, world); plane(7, 9, W2.red, 63.5, 4.5, -3, world);
  plane(7, 12, W2.greenF, 56.5, 0.002, 3, world, -Math.PI / 2); plane(7, 12, W2.redF, 63.5, 0.002, 3, world, -Math.PI / 2);
  add(tbox(0.06, 9, 0.05, 1), W2.white, 60, 4.5, -2.97, world); plane(0.06, 12, W2.white, 60, 0.004, 3, world, -Math.PI / 2);
}
// ===== D) finance office (x=120) =====
{
  const fl = add(uvScale(new THREE.PlaneGeometry(12, 10), 4, 3.3), W2.carpet, 120, 0, 1, world, { cast: false }); fl.rotation.x = -Math.PI / 2;
  add(tbox(12, 4, 0.2, 2), W2.officeWall, 120, 2, -3, world);
  add(tbox(0.2, 4, 8, 2), W2.officeWall, 114.5, 2, 1, world);
  add(tbox(1.5, 1.2, 0.06, 1), W2.frame, 122.4, 1.9, -2.88, world); plane(1.36, 1.06, W2.glass, 122.4, 1.9, -2.84, world);
  for (let i = 0; i < 9; i++) add(tbox(1.36, 0.04, 0.02, 1), W2.frame, 122.4, 1.42 + i * 0.12, -2.82, world, { cast: false });
  add(tbox(1.9, 0.06, 0.85, 1), W2.woodTop, 120.9, 0.76, -1.35, world);
  add(tbox(1.9, 0.7, 0.04, 1), W2.wood, 120.9, 0.38, -1.75, world); for (const s of [-1, 1]) add(tbox(0.05, 0.73, 0.8, 1), W2.wood, 120.9 + s * 0.92, 0.37, -1.35, world);
  add(tbox(0.62, 0.4, 0.04, 1), W2.dark, 121.2, 1.1, -1.55, world); add(tbox(0.06, 0.18, 0.06, 1), W2.dark, 121.2, 0.86, -1.55, world);
  const sheet = document.createElement('canvas'); sheet.width = 512; sheet.height = 320; { const g = sheet.getContext('2d'); g.fillStyle = '#f4f7fb'; g.fillRect(0, 0, 512, 320); g.fillStyle = '#2f7d4a'; g.fillRect(0, 0, 512, 36); g.fillStyle = '#fff'; g.font = '800 22px Inter'; g.fillText('FOLHA DE PAGAMENTO', 14, 25);
    g.strokeStyle = '#b8c2cc'; g.lineWidth = 2; for (let y = 60; y < 320; y += 28) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); } for (const x of [180, 340]) { g.beginPath(); g.moveTo(x, 36); g.lineTo(x, 320); g.stroke(); }
    g.fillStyle = '#e0453c'; g.fillRect(0, 144, 512, 28); g.fillStyle = '#333'; g.font = '600 18px Inter'; ['Ana P.', 'Carlos M.', 'Ricardo S.', 'José R.', 'Marta L.', 'Paulo T.', 'Rita C.', 'Sônia B.'].forEach((n, i) => { g.fillStyle = i === 3 ? '#fff' : '#333'; g.fillText(n, 10, 81 + i * 28); g.fillText(i === 3 ? '2x' : '1x', 200, 81 + i * 28); }); }
  plane(0.56, 0.35, new THREE.MeshBasicMaterial({ map: P.tex(sheet), fog: false }), 121.2, 1.1, -1.527, world);
  add(tbox(0.65, 1.35, 0.6, 1), W2.metal, 117.6, 0.675, -2.5, world); for (let i = 0; i < 3; i++) add(tbox(0.5, 0.05, 0.02, 1), W2.dark, 117.6, 0.3 + i * 0.42, -2.19, world);
  for (let i = 0; i < 4; i++) add(tbox(0.32, 0.05, 0.24, 1), i % 2 ? W2.frame : W2.glass, 120.25, 0.815 + i * 0.05, -1.25, world).rotation.y = (i - 2) * 0.08;
  add(tbox(1.25, 0.65, 0.04, 1), toon({ color: '#7a5a20' }), 119.3, 2.25, -2.88, world);
  plane(1.15, 0.55, signMat(P.sign([['30 ANOS DE CASA', 96], ['Célia Moura • Financeiro', 56]], { w: 1024, h: 490, bg: '#e9cf7a', fg: '#3a2a10', border: '#b08a3a' })), 119.3, 2.25, -2.855, world);
  plane(1.5, 0.42, signMat(P.sign([['FINANCEIRO', 120]], { w: 1024, h: 286, bg: '#2f5f8a' })), 116.6, 3.2, -2.885, world);
  const clk = add(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 24), W2.white, 121.0, 2.95, -2.87, world); clk.rotation.x = Math.PI / 2;
  add(tbox(0.02, 0.15, 0.01, 1), W2.dark, 121.0, 3.0, -2.84, world); add(tbox(0.11, 0.02, 0.01, 1), W2.dark, 121.05, 2.95, -2.84, world);
  add(new THREE.CylinderGeometry(0.22, 0.17, 0.42, 14), W2.pot, 124.1, 0.21, -2.2, world);
  for (let i = 0; i < 5; i++) { const l = add(new THREE.SphereGeometry(0.28, 10, 8), W2.plant, 124.1 + Math.cos(i * 1.3) * 0.15, 0.7 + i * 0.12, -2.2 + Math.sin(i * 1.3) * 0.15, world); l.scale.set(0.8, 1.2, 0.8); }
  add(tbox(0.55, 0.5, 0.5, 1), W2.dark, 119.9, 0.45, -0.75, world); // chair
}
// ---------- phone (3D, live screen) ----------
const phone = new THREE.Group(); scene.add(phone);
const phoneC = document.createElement('canvas'); phoneC.width = 600; phoneC.height = 1236;
const phoneT = new THREE.CanvasTexture(phoneC); phoneT.colorSpace = THREE.SRGBColorSpace; phoneT.anisotropy = 8;
{
  const s = new THREE.Shape(), w = 0.08, h = 0.165, r = 0.014;
  s.moveTo(-w + r, -h); s.lineTo(w - r, -h); s.quadraticCurveTo(w, -h, w, -h + r); s.lineTo(w, h - r); s.quadraticCurveTo(w, h, w - r, h); s.lineTo(-w + r, h); s.quadraticCurveTo(-w, h, -w, h - r); s.lineTo(-w, -h + r); s.quadraticCurveTo(-w, -h, -w + r, -h);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.014, bevelEnabled: false }); g.translate(0, 0, -0.014);
  add(g, W2.dark, 0, 0, 0, phone);
  const scr = add(new THREE.PlaneGeometry(0.146, 0.3), new THREE.MeshBasicMaterial({ map: phoneT, fog: false }), 0, 0, 0.0012, phone, { cast: false });
}
let phoneKey = '';

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

function worldState(S, f) {
  fork.position.x = S.forkX ?? -6;
  stamp.visible = S.stamp > 0; if (S.stamp > 0) { const k = S.stamp, sc = 1 + 1.6 * Math.pow(1 - Math.min(1, k), 3); stamp.scale.set(sc, sc, 1); stampMat.opacity = Math.min(1, k * 2.2); }
  phoneState(S.phone);
}

// ---------- phone screen UI (2D canvas) ----------
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
const wrap = (g, text, maxW) => { const out = []; let line = ''; for (const w of text.split(' ')) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; } if (line) out.push(line); return out; };
function drawScreen(st) {
  const g = phoneC.getContext('2d'), W = 600, H = 1236; g.setTransform(1, 0, 0, 1, 0, 0); g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  if (st.kind === 'lock') {
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2c3e7a'); gr.addColorStop(0.55, '#6a4c9c'); gr.addColorStop(1, '#e08a6a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(100 + i * 110, 1000 - (i % 2) * 120, 160, 0, 7); g.fill(); }
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '300 120px Inter'; g.fillText(st.time || '10:12', W / 2, 160); g.font = '600 30px Inter'; g.fillText(st.date || 'terça-feira, 5 de novembro', W / 2, 210);
    st.notifs.forEach((n, i) => {
      const y = 250 + i * 225, k = n.pop ?? 1; g.save(); g.globalAlpha = Math.min(1, k * 1.5); g.translate(W / 2, y + 100); g.scale(0.85 + 0.15 * k, 0.85 + 0.15 * k); g.translate(-W / 2, -(y + 100));
      g.fillStyle = 'rgba(255,255,255,.94)'; rr(g, 30, y, 540, 205, 36); g.fill();
      g.fillStyle = '#18a36a'; g.beginPath(); g.arc(92, y + 62, 34, 0, 7); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '900 44px Inter'; g.fillText('$', 92, y + 78);
      g.textAlign = 'left'; g.fillStyle = '#5b5b66'; g.font = '700 26px Inter'; g.fillText('MEU BANCO', 140, y + 52); g.textAlign = 'right'; g.fillText(n.t, 545, y + 52);
      g.textAlign = 'left'; g.fillStyle = '#16161c'; g.font = '800 40px Inter'; g.fillText('Pix recebido', 140, y + 100);
      g.fillStyle = '#0f8a55'; g.font = '900 62px Inter'; g.fillText('R$ 2.800,00', 60, y + 178); g.restore();
    });
  } else if (st.kind === 'bank') {
    g.fillStyle = '#f3f5f7'; g.fillRect(0, 0, W, H); g.fillStyle = '#0f7a6b'; g.fillRect(0, 0, W, 520);
    g.fillStyle = '#fff'; g.font = '800 38px Inter'; g.fillText('Meu Banco', 40, 100); g.font = '600 32px Inter'; g.fillText('Olá, Ricardo', 40, 190);
    g.font = '600 30px Inter'; g.fillStyle = '#cdeee8'; g.fillText('Saldo disponível', 40, 300);
    const k = st.hl || 0; g.fillStyle = k > 0 ? `rgb(255,${255 - 30 * k},${255 - 200 * k})` : '#fff'; g.font = '900 82px Inter'; g.fillText(st.amt || 'R$ 5.600,00', 40, 405);
    g.fillStyle = '#1e1e26'; g.font = '800 34px Inter'; g.fillText('Últimas movimentações', 40, 610);
    [['10:12', 'Pix recebido'], ['08:12', 'Pix recebido']].forEach(([t, l], i) => { const y = 650 + i * 170; g.fillStyle = '#fff'; rr(g, 30, y, 540, 145, 26); g.fill(); g.fillStyle = '#18a36a'; g.beginPath(); g.arc(90, y + 72, 30, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '900 36px Inter'; g.textAlign = 'center'; g.fillText('↓', 90, y + 85); g.textAlign = 'left';
      g.fillStyle = '#1e1e26'; g.font = '700 32px Inter'; g.fillText(l, 140, y + 60); g.fillStyle = '#777'; g.font = '500 24px Inter'; g.fillText('Distribuidora São Jorge • ' + t, 140, y + 100); g.fillStyle = '#0f8a55'; g.font = '800 30px Inter'; g.textAlign = 'right'; g.fillText('+2.800,00', 560, y + 60); g.textAlign = 'left'; });
  } else if (st.kind === 'chat') {
    g.fillStyle = '#ece5dd'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(0,0,0,.035)'; for (let i = 0; i < 60; i++) { g.beginPath(); g.arc((i * 137) % W, (i * 241) % H, 14, 0, 7); g.fill(); }
    g.fillStyle = '#1f6f5c'; g.fillRect(0, 0, W, 170); g.fillStyle = '#fff'; g.font = '800 38px Inter'; g.fillText('Equipe Estoque 📦', 40, 95); g.font = '500 26px Inter'; g.fillStyle = '#cfe9e1'; g.fillText('32 participantes', 40, 140);
    const msgs = [['Carlos', '#c0392b', 'Bom dia, pessoal! 👷', '09:02'], ['Ana', '#8e44ad', 'Alguém viu a empilhadeira 2?', '09:15']];
    let y = 220; const bubble = (who, col, text, t, big, k = 1) => {
      g.font = big ? '800 40px Inter' : '500 34px Inter'; const lines = wrap(g, text, 450), h = 70 + lines.length * (big ? 52 : 44) + 30;
      g.save(); g.globalAlpha = Math.min(1, k * 1.6); g.translate(40, y + h / 2); g.scale(0.8 + 0.2 * k, 0.8 + 0.2 * k); g.translate(-40, -(y + h / 2));
      g.fillStyle = big ? '#fff6d6' : '#fff'; rr(g, 30, y, 510, h, 24); g.fill(); if (big) { g.strokeStyle = '#e0453c'; g.lineWidth = 6; g.stroke(); }
      g.fillStyle = col; g.font = '800 28px Inter'; g.fillText(who, 54, y + 46); g.fillStyle = '#16161c'; g.font = big ? '800 40px Inter' : '500 34px Inter';
      lines.forEach((l, i) => g.fillText(l, 54, y + 100 + i * (big ? 52 : 44))); g.fillStyle = '#888'; g.font = '500 22px Inter'; g.textAlign = 'right'; g.fillText(t, 525, y + h - 16); g.textAlign = 'left'; g.restore(); y += h + 26; };
    for (const m of msgs) bubble(...m, false);
    if (st.n >= 3) bubble('RH • Distribuidora', '#d35400', '⚠️ Atenção: houve um erro no pagamento de alguns funcionários. Vamos entrar em contato.', '09:30', true, st.pop ?? 1);
  }
}
function phoneState(ph) {
  phone.visible = !!ph; if (!ph) return;
  phone.position.set(...ph.pos); phone.rotation.set(ph.rx || 0, ph.ry || 0, ph.rz || 0, 'YXZ'); phone.scale.setScalar(ph.s || 1);
  const k = JSON.stringify(ph.scr); if (k !== phoneKey) { phoneKey = k; drawScreen(ph.scr); phoneT.needsUpdate = true; }
}
// ---------- 2D overlay: scene texts + subtitles ----------
const oc = document.getElementById('o'), og = oc.getContext('2d');
const EMO = /(\p{Extended_Pictographic}️?)/u;
function outlined(g, text, x, y, { size = 100, fill = '#fff', stroke = '#111', lw = 18, align = 'center' } = {}) {
  g.font = `900 ${size}px Inter, Arial`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  const parts = text.split(EMO).filter(Boolean), wid = parts.map((p) => g.measureText(p).width), tot = wid.reduce((a, b) => a + b, 0);
  let cx = align === 'center' ? x - tot / 2 : x;
  parts.forEach((p, i) => { if (EMO.test(p)) { g.fillText(p, cx, y + size * 0.04); } else { g.strokeStyle = stroke; g.lineWidth = lw; g.strokeText(p, cx, y); g.fillStyle = fill; g.fillText(p, cx, y); } cx += wid[i]; });
  return tot;
}
const M_back = (t, k = 1.7) => { t = Math.min(1, Math.max(0, t)) - 1; return t * t * ((k + 1) * t + k) + 1; };
function overlay(f) {
  og.setTransform(1, 0, 0, 1, 0, 0); og.drawImage(canvas, 0, 0);
  for (const t of TEXTS) {
    if (f < t.a || f > t.b) continue;
    const k = Math.min(1, (f - t.a) / 7), still = t.a === 0 || t.still;
    let s = still ? 1 : (k < 1 ? Math.max(0.05, 1.25 * M_back(k)) / 1.25 * 1.0 : 1);
    if (t.pulse && f >= t.pulse && f < t.pulse + 10) s *= 1 + 0.22 * Math.sin((f - t.pulse) / 10 * Math.PI);
    const wob = (t.wob ?? 1) * Math.sin((f + (t.ph ?? 0)) * 0.12) * 1.2;
    og.save(); og.translate(t.x ?? SAFE.cx, t.y); og.rotate(((t.rot ?? -3) + wob) * Math.PI / 180); og.scale(s, s);
    if (t.box) { og.font = `900 ${t.size}px Inter`; const w = Math.max(...t.lines.map((l) => og.measureText(l).width)) + 70, h = t.lines.length * t.size * 1.12 + 40; og.fillStyle = t.box; og.strokeStyle = '#111'; og.lineWidth = 10; rr(og, -w / 2, -h / 2, w, h, 26); og.fill(); og.stroke(); }
    t.lines.forEach((l, i) => outlined(og, l, 0, (i - (t.lines.length - 1) / 2) * t.size * 1.12, { size: t.size, fill: t.fill || '#ffd23a', lw: t.lw || 20 }));
    og.restore();
  }
  const c = SUBS.find((c) => f >= c.a && f <= c.b);
  if (c) {
    const size = 78; og.font = `900 ${size}px Inter`; const act = c.w.reduce((m, w, i) => f >= w[1] ? i : m, -1); const lines = []; let cur = [];
    for (const w of c.w) { const t = [...cur, w].map((x) => x[0]).join(' '); if (og.measureText(t).width > 780 && cur.length) { lines.push(cur); cur = [w]; } else cur.push(w); }
    lines.push(cur);
    const k = Math.min(1, (f - c.a) / 4), s = 0.86 + 0.14 * (1 - Math.pow(1 - k, 3)), y0 = 1100 - (lines.length - 1) * size * 0.56;
    og.save(); og.translate(SAFE.cx, y0); og.scale(s, s);
    lines.forEach((ln, li) => {
      const sp = og.measureText(' ').width, ws = ln.map((w) => og.measureText(w[0]).width), tot = ws.reduce((a, b) => a + b, 0) + sp * (ln.length - 1);
      let x = -tot / 2; ln.forEach((w, i) => { outlined(og, w[0], x, li * size * 1.12, { size, fill: c.w.indexOf(w) === act ? '#ffe14a' : '#ffffff', lw: 17, align: 'left' }); x += ws[i] + sp; });
    });
    og.restore();
  }
}

function drawActors(list, cam) {
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  list.forEach((a, i) => {
    const c = getCard(i);
    c.draw(a.key, a.draw);
    c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
    const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, Math.atan2(cam.position.x - a.x, cam.position.z - a.z) + (a.yaw || 0), a.roll || 0);
    c.mat.color.set(a.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1;
    c.mesh.castShadow = a.shadow !== false;
    c.mesh.renderOrder = a.order || 2;
    if (a.blob !== false && a.y < DECK + 0.5) { c.blob.visible = true; c.blob.position.set(a.x, (a.ground ?? DECK) + 0.012, a.z); c.blob.scale.set(0.95 * s, 0.6 * s, 1); }
  });
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

window.renderFrame = (f) => {
  const S = shotAt(f), L = lightFor(S, f), C = camAt(f);
  applyLight(L, f);
  camera.position.set(...C.pos); camera.up.set(0, 1, 0); camera.lookAt(...C.look); camera.rotateZ(rx(C.roll || 0));
  camera.fov = C.fov; camera.setViewOffset(W, H, SAFE.dx, SAFE.dy, W, H); camera.updateMatrixWorld(); // frame centre -> centre of the safe area
  const W_ = worldAt(f); worldState(W_, f);
  placeSun(L, new THREE.Vector3(...(C.shadowAt || C.look)));
  drawActors([...actorsAt(f, T), ...fxAt(f, T)], camera);
  sky.position.copy(camera.position);
  // pass A: colour
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  // pass B: normal + depth
  const fog = scene.fog; scene.fog = null; const sm = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false; renderer.shadowMap.autoUpdate = false;
  swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false);
  scene.fog = fog; renderer.shadowMap.enabled = sm; renderer.shadowMap.autoUpdate = true;
  if (window.DEBUG_ND) { const dm = new THREE.MeshBasicMaterial({ map: rtNd.texture }); const ds = fs(dm); renderer.setRenderTarget(null); renderer.render(ds, fsCam); return true; }
  // ink + grade
  const D = dofAt(f);
  inkU.px.value = 2.5; inkU.flash.value = window.DEBUG_E ? -1 : (C.flash || 0); inkU.vig.value = L.vig ?? 0.22;
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  // lens
  dofU.focus.value = D.focus; dofU.cinf.value = D.cinf; dofU.near.value = D.near ?? 1;
  renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  overlay(f);
  if (location.hash === '#safe') { og.save(); og.fillStyle = 'rgba(255,0,0,.28)'; og.fillRect(0, 0, W, SAFE.y0); og.fillRect(0, SAFE.y1, W, H - SAFE.y1); og.fillRect(SAFE.x1, 0, W - SAFE.x1, H); og.restore(); }
  return true;
};
window.TOTAL = TOTAL;
window.ready = true;
