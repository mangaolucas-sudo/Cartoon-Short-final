import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import * as Q from './paint2.js';
import { TOTAL, shotAt, camAt, dofAt, lightFor, actorsAt, worldAt, fxAt } from './story.js';

const W = 1920, H = 1080;
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, W / H, 0.08, 2500);
const rx = (a) => a * Math.PI / 180;

// ---------- materials ----------
const grad = (() => { const d = new Uint8Array([90, 90, 90, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 2, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toon = (opts) => new THREE.MeshToonMaterial({ gradientMap: grad, ...opts });
const texM = (c, rx_ = 1, ry_ = 1, color = '#ffffff') => toon({ map: P.tex(c, rx_, ry_), color });
const M = {
  dirt: texM(Q.redDirt(21), 300, 300), road: texM(Q.redDirt(31), 1, 1, '#f0d8c0'),
  wheatTop: texM(Q.wheat(22), 1, 1), wheatSide: texM(Q.wheatSide(23), 1, 1),
  tin: texM(Q.corrugated(24), 1, 1), tinRust: texM(Q.corrugated(34, [24, 30, 52]), 1, 1),
  board: texM(Q.weatherboard(25), 1, 1), boardB: texM(Q.weatherboard(35, [60, 20, 80]), 1, 1),
  bark: texM(Q.bark(26), 1, 1), panel: texM(Q.woodPanel(27), 1, 1), carpet: texM(Q.carpet(28), 1, 1), carpetR: texM(Q.carpet(38, '#7a2a2a'), 1, 1),
  tent: texM(Q.canvasTent(29), 1, 1), bags: texM(Q.sandbag(30), 1, 1), plank: texM(P.planks(1), 1, 1), plaster: texM(P.plaster(8, 60), 1, 1),
  post: toon({ color: '#7a5a3a' }), wire: toon({ color: '#5a5a5a' }), leaf: toon({ color: '#7d9a5a' }), leafD: toon({ color: '#647f48' }),
  scrub: toon({ color: '#9aa66a' }), rock: toon({ color: '#a86a4a' }), mesa: toon({ color: '#b0705a' }), mesaFar: toon({ color: '#a8849a' }),
  mound: toon({ color: '#b86a3e' }), truck: toon({ color: '#3e5a3a' }), truckD: toon({ color: '#2c3e2a' }), tyre: toon({ color: '#222222' }),
  hub: toon({ color: '#8a8a7a' }), gun: toon({ color: '#2e2f30' }), gunL: toon({ color: '#4a4c4e' }), wood: toon({ color: '#7a5434' }),
  glass: toon({ color: '#9ec4dc' }), lamp: toon({ color: '#f4e8b0' }), green: toon({ color: '#3d6b4a' }), greenD: toon({ color: '#2e5238' }),
  desk: toon({ color: '#5a3820' }), paperM: toon({ color: '#f4efe0' }), crate: texM(P.planks(5), 1, 1, '#d8b888'), mud: toon({ color: '#7a4a30' }),
  windowL: new THREE.MeshBasicMaterial({ color: '#cfe8ff' }), tank: texM(Q.corrugated(44, [200, 6, 70]), 1, 1), red: toon({ color: '#b8282b' }), gold: toon({ color: '#d9a845' }),
};
for (const k of ['wheatTop', 'wheatSide', 'tin', 'tinRust', 'board', 'boardB', 'bark', 'panel', 'carpet', 'carpetR', 'tent', 'bags', 'plank', 'plaster', 'crate', 'tank', 'road']) M[k].map.wrapS = M[k].map.wrapT = THREE.RepeatWrapping;

// ---------- ink / normal-depth contract ----------
const ndMat = new THREE.ShaderMaterial({
  vertexShader: `varying vec3 vN; varying float vD; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `varying vec3 vN; varying float vD; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n*.5+.5, vD); }`,
  side: THREE.DoubleSide,
});
const cardNd = () => new THREE.ShaderMaterial({
  uniforms: { map: { value: null } },
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
const tbox = (w, h, d, t = 2) => {
  const g = box(w, h, d), uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / t, uv.getY(i) * dims[f][1] / t); }
  return g;
};
const cyl = (r0, r1, h, n = 12) => new THREE.CylinderGeometry(r0, r1, h, n);
const canvasMat = (c, basic = false) => { const t = P.tex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return basic ? new THREE.MeshBasicMaterial({ map: t }) : toon({ map: t }); };
const signMesh = (lines, w, h, x, y, z, ry = 0, parent = scene, o = {}) => { const m = add(box(w, h, 0.06), [M.wood, M.wood, M.wood, M.wood, canvasMat(Q.sign(lines, { w: 512, h: Math.round(512 * h / w), ...o })), M.wood], x, y, z, parent); m.rotation.y = ry; return m; };
const dynBoard = (w, h, pw, ph) => { const c = document.createElement('canvas'); c.width = pw; c.height = ph; const t = P.tex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return { c, g: c.getContext('2d'), t, mat: toon({ map: t }), key: '' }; };

// ---------- sky ----------
const skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() }, sunSize: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(2000, 32, 16), new THREE.ShaderMaterial({
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
// ground
const ground = add(new THREE.PlaneGeometry(3000, 3000), M.dirt, 0, 0, 0, world, { cast: false }); ground.rotation.x = -Math.PI / 2;
// road (dirt track) along x at z=26
const road = add(new THREE.PlaneGeometry(700, 5.5), M.road, 50, 0.02, 26, world, { cast: false }); road.rotation.x = -Math.PI / 2; M.road.map.repeat.set(120, 1);
// water shader (dam + puddles)
const waterU = { t: { value: 0 }, deep: { value: new THREE.Color('#3a6f86') }, shal: { value: new THREE.Color('#6aa8b8') }, glint: { value: new THREE.Color('#e9f6ff') } };
const waterMat = new THREE.ShaderMaterial({
  uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...waterU }, fog: true,
  vertexShader: `#include <fog_pars_vertex>
    varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
    #include <fog_vertex>
    }`,
  fragmentShader: `#include <fog_pars_fragment>
    uniform float t; uniform vec3 deep, shal, glint; varying vec3 vW;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
    void main(){ vec2 p = vW.xz*.3 + vec2(t*.05, -t*.08);
      float n = noise(p) * .6 + noise(p*2.3 + 7.) * .4;
      vec3 c = mix(deep, shal, .35 + .45*n);
      float streak = smoothstep(.74, .8, noise(vW.xz*vec2(.6,.25) + vec2(t*.2, 0.)));
      c = mix(c, glint, streak*.7);
      gl_FragColor = vec4(c,1.);
      #include <fog_fragment>
    }`,
});
const DAM = [92, 0, 62];
const dam = add(new THREE.CircleGeometry(13, 48), waterMat, DAM[0], 0.06, DAM[2], world, { cast: false }); dam.rotation.x = -Math.PI / 2; dam.userData.nd = waterNd; dam.receiveShadow = false;
const bank = add(new THREE.TorusGeometry(13.8, 1.4, 8, 48), M.mud, DAM[0], 0, DAM[2], world, { cast: false }); bank.rotation.x = -Math.PI / 2; bank.scale.z = 0.35;
{ const r = P.rng(5); for (let i = 0; i < 30; i++) { const a = r() * 6.28, d = 12.5 + r() * 1.2; const rd = add(cyl(0.03, 0.05, 1 + r() * 0.8, 4), M.leafD, DAM[0] + Math.cos(a) * d, 0.5, DAM[2] + Math.sin(a) * d, world); rd.rotation.z = (r() - 0.5) * 0.4; } }
// puddles for the rain
const puddles = new THREE.Group(); world.add(puddles);
{ const r = P.rng(8); for (let i = 0; i < 40; i++) { const pd = add(new THREE.CircleGeometry(1 + r() * 2.5, 20), waterMat, (r() - 0.3) * 160, 0.03 + i * 0.0004, 30 + r() * 60, puddles, { cast: false }); pd.rotation.x = -Math.PI / 2; pd.scale.y = 0.6; pd.userData.nd = waterNd; } }

// wheat fields (boxes whose height grows), north of the fence (z < -10)
const FIELDS = [[-64, -3, -70, -12], [3, 74, -70, -12], [-64, 74, -150, -76], [-150, -70, -120, -12], [80, 170, -120, -12]];
const wheat = [];
for (const [x0, x1, z0, z1] of FIELDS) {
  const w = x1 - x0, d = z1 - z0, g = box(w, 1, d);
  const uv = g.attributes.uv; const dims = [[d, 1], [d, 1], [w, d], [w, d], [w, 1], [w, 1]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / 3, uv.getY(i) * dims[f][1] / (f === 2 || f === 3 ? 3 : 1)); }
  g.translate(0, 0.5, 0);
  const m = add(g, [M.wheatSide, M.wheatSide, M.wheatTop, M.wheatSide, M.wheatSide, M.wheatSide], (x0 + x1) / 2, 0, (z0 + z1) / 2, world, { cast: false });
  wheat.push(m);
}
// fence along z=-10 (posts + 3 wires). Segment x in [12,15] can break (rabbit hole)
const fence = new THREE.Group(); world.add(fence);
const fencePosts = [];
const fenceLine = (x0, x1, z, parent, tag) => {
  const posts = [];
  for (let x = x0; x <= x1; x += 3) { const p = add(tbox(0.12, 1.4, 0.12, 1), M.post, x, 0.7, z, parent); p.userData.base = p.position.clone(); posts.push(p); }
  const wires = [];
  for (let i = 0; i < posts.length - 1; i++) for (const h of [0.45, 0.85, 1.25]) { const wm = add(box(3, 0.025, 0.025), M.wire, posts[i].position.x + 1.5, h, z, parent, { cast: false }); wm.userData.base = wm.position.clone(); wm.userData.seg = i; wm.userData.h = h; wires.push(wm); }
  return { posts, wires };
};
const F1 = fenceLine(-63, 75, -10, fence);
// gate gap sign later; break segment index
const BREAK_SEG = F1.posts.findIndex((p) => Math.abs(p.position.x - 12) < 0.1);
// road-side fence at z=31 (the truck crashes into it)
const fence2 = new THREE.Group(); world.add(fence2);
const F2 = fenceLine(-60, 180, 31, fence2);
// farmhouse
const house = new THREE.Group(); house.position.set(-30, 0, 16); world.add(house);
add(tbox(10, 3.2, 7, 2), M.board, 0, 1.6 + 0.4, 0, house);
add(tbox(10.4, 0.4, 7.4, 2), M.plank, 0, 0.2, 0, house);
for (const s of [-1, 1]) { const rf = add(tbox(11.4, 0.12, 4.4, 2), M.tinRust, 0, 4.25, s * 1.9, house); rf.rotation.x = s * 0.42; }
add(box(10.2, 1.2, 0.1), M.board, 0, 4.0, 0, house);
// veranda
add(tbox(10, 0.15, 2.6, 2), M.plank, 0, 0.45, 4.8, house);
const vr = add(tbox(10.8, 0.1, 3.2, 2), M.tin, 0, 3.2, 4.9, house); vr.rotation.x = 0.16;
for (let x = -4.6; x <= 4.7; x += 2.3) add(tbox(0.14, 2.8, 0.14, 1), M.post, x, 1.85, 6.0, house);
add(box(1.0, 2.0, 0.08), M.desk, 1.5, 1.4, 3.53, house);
for (const x of [-2.8, 3.6]) { add(box(1.2, 1.0, 0.06), M.glass, x, 2.1, 3.53, house); add(box(1.4, 0.1, 0.1), M.wood, x, 1.55, 3.58, house); }
// price board on the veranda (dynamic)
const priceB = dynBoard(1.8, 1.2, 640, 427);
const priceM = add(box(1.8, 1.2, 0.06), [M.wood, M.wood, M.wood, M.wood, priceB.mat, M.wood], -1.15, 1.6, 3.6, house);
// water tank + windmill
const tankG = new THREE.Group(); tankG.position.set(-22, 0, 12); world.add(tankG);
add(cyl(1.6, 1.6, 0.8, 20), M.wood, 0, 0.4, 0, tankG);
add(new THREE.CylinderGeometry(1.5, 1.5, 2.4, 24), M.tank, 0, 2.0, 0, tankG);
add(new THREE.ConeGeometry(1.6, 0.6, 24), M.tin, 0, 3.5, 0, tankG);
const mill = new THREE.Group(); mill.position.set(-42, 0, 7); world.add(mill);
for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = add(box(0.1, 9.2, 0.1), M.gunL, sx * 0.75, 4.5, sz * 0.75, mill); l.rotation.z = -sx * 0.075; l.rotation.x = sz * 0.075; }
for (let y = 1.5; y < 9; y += 2.2) { const k = 0.75 * (1 - y / 9 * 0.92); for (const s of [-1, 1]) { add(box(k * 2, 0.05, 0.05), M.gunL, 0, y, s * k, mill); add(box(0.05, 0.05, k * 2), M.gunL, s * k, y, 0, mill); } }
const rotor = new THREE.Group(); rotor.position.set(0, 9.4, 0.4); mill.add(rotor);
for (let i = 0; i < 16; i++) { const b = add(box(0.32, 1.5, 0.03), M.tin, 0, 0, 0, rotor); const a = i / 16 * Math.PI * 2; b.position.set(Math.cos(a) * 1.0, Math.sin(a) * 1.0, 0); b.rotation.z = a - Math.PI / 2; b.rotation.y = 0.3; }
add(cyl(0.16, 0.16, 0.4, 10), M.gunL, 0, 9.4, 0, mill).rotation.x = Math.PI / 2;
const tail = add(box(0.03, 0.9, 1.6), M.red, 0, 9.4, -1.6, mill);
// mailbox by the road
const mailbox = new THREE.Group(); mailbox.position.set(-6, 0, 23.2); world.add(mailbox);
add(tbox(0.1, 1.1, 0.1, 1), M.post, 0, 0.55, 0, mailbox);
add(cyl(0.22, 0.22, 0.6, 14), M.tin, 0, 1.25, 0, mailbox).rotation.x = Math.PI / 2;
const mbFlap = add(box(0.46, 0.46, 0.03), M.tin, 0, 1.25, 0.31, mailbox);
// signs
signMesh(['CAMPION'], 2.2, 0.7, 2, 1.9, 23.0, 0.25, world, { size: 120 });
add(tbox(0.12, 2.0, 0.12, 1), M.post, 1.2, 1.0, 23.1, world); add(tbox(0.12, 2.0, 0.12, 1), M.post, 2.85, 1.0, 22.7, world);
const restSign = signMesh(['ABERTO', 'TRIGO À VONTADE'], 2.4, 1.2, 0, 1.45, -9.85, 0, world, { bg: '#f6efe0', fg: '#b8282b', size: 0 });
restSign.visible = false;
const rulerSign = signMesh(['2 m'], 0.7, 0.4, 0, 2.0, 0, 0, world, { size: 120 }); rulerSign.visible = false;
const ruler = add(tbox(0.12, 2.0, 0.12, 1), M.post, 0, 1.0, 0, world); ruler.visible = false;
const speedSign = signMesh(['50 km/h'], 1.3, 1.3, 0, 2.1, 0, 0, world, { bg: '#ffffff', fg: '#1a1a1a', border: '#c0353a', size: 120 }); speedSign.visible = false;
const speedPost = add(tbox(0.1, 1.6, 0.1, 1), M.gunL, 0, 0.8, 0, world); speedPost.visible = false;
// gum trees
const gum = (x, z, h = 9, s = 1) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); world.add(g);
  const t = add(cyl(0.22, 0.4, h, 8), M.bark, 0, h / 2, 0, g); t.rotation.z = 0.06;
  for (const [a, l] of [[0.6, 3], [-0.7, 2.6], [2.4, 2.4]]) { const b = add(cyl(0.08, 0.14, l, 6), M.bark, Math.cos(a) * 0.6, h * 0.75, Math.sin(a) * 0.6, g); b.rotation.z = Math.cos(a) * 0.7; b.rotation.x = Math.sin(a) * 0.7; }
  const r = P.rng(Math.round(x * 13 + z * 7));
  for (let i = 0; i < 5; i++) { const c = add(new THREE.SphereGeometry(1, 10, 8), i % 2 ? M.leaf : M.leafD, (r() - 0.5) * 4, h + (r() - 0.3) * 1.6, (r() - 0.5) * 4, g); c.scale.set(1.8 + r() * 1.2, 0.9 + r() * 0.5, 1.8 + r()); }
  return g;
};
const avoid = (x, z) => (z < -6 && z > -160 && x > -160 && x < 180) || Math.abs(z - 26) < 6 || (Math.abs(x + 25) < 18 && Math.abs(z - 15) < 12) || Math.hypot(x - DAM[0], z - DAM[2]) < 20 || (Math.abs(x - 112) < 14 && Math.abs(z - 8) < 12) || (Math.abs(x - 20) < 28 && z > 35 && z < 125);
{ const r = P.rng(44); let n = 0; for (let i = 0; i < 600 && n < 90; i++) { const x = (r() - 0.5) * 520, z = (r() - 0.5) * 520; if (avoid(x, z)) continue; gum(x, z, 7 + r() * 5, 0.8 + r() * 0.4); n++; } }
// low scrub bushes
{ const r = P.rng(45); for (let i = 0; i < 260; i++) { const x = (r() - 0.5) * 420, z = (r() - 0.5) * 420; if (avoid(x, z)) continue; const b = add(new THREE.SphereGeometry(0.5 + r() * 0.6, 8, 6), i % 3 ? M.scrub : M.leafD, x, 0.2, z, world); b.scale.y = 0.6; } }
// rocks + termite mound (leader's lookout)
const LOOK = [24, 0, 92];
const mound = add(new THREE.ConeGeometry(1.6, 3.2, 9), M.mound, LOOK[0], 1.6, LOOK[2], world);
for (let i = 0; i < 6; i++) { const r = add(new THREE.DodecahedronGeometry(0.6 + i * 0.12, 0), M.rock, LOOK[0] + Math.cos(i) * 3, 0.3, LOOK[2] + Math.sin(i * 1.7) * 3, world); r.scale.y = 0.6; }
// distant mesas
{ const r = P.rng(46); for (let i = 0; i < 18; i++) { const a = r() * Math.PI * 2, d = 600 + r() * 300, hh = 30 + r() * 50, rr = 60 + r() * 90; add(cyl(rr * 0.75, rr, hh, 9), i % 2 ? M.mesa : M.mesaFar, Math.cos(a) * d, hh / 2 - 2, Math.sin(a) * d, world, { cast: false }); } }
// camp (tent, crates, tally board)
const CAMP = [112, 0, 8];
const camp = new THREE.Group(); camp.position.set(...CAMP); world.add(camp);
{ const sh = new THREE.Shape(); sh.moveTo(-2.4, 0); sh.lineTo(0, 2.6); sh.lineTo(2.4, 0); sh.lineTo(-2.4, 0);
  const tg = new THREE.ExtrudeGeometry(sh, { depth: 4.5, bevelEnabled: false }); tg.translate(0, 0, -2.25); add(tg, [M.tent, M.tent], 0, 0, 0, camp).rotation.y = Math.PI / 2; }
const crates = [];
for (let i = 0; i < 6; i++) { const c = add(tbox(0.9, 0.55, 0.6, 1), M.crate, 3.4 + (i % 3) * 0.95, 0.28 + Math.floor(i / 3) * 0.56, 2.2, camp); crates.push(c); }
const crateLabel = signMesh(['BALAS', '10.000'], 2.7, 0.8, 4.35, 0.62, 2.53, 0, camp, { bg: '#d8b888', fg: '#2a1e16', border: '#d8b888', plank: false });
const table = add(tbox(1.8, 0.08, 0.9, 1), M.wood, -3.2, 0.85, 2.6, camp); for (const [a, b] of [[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]]) add(box(0.06, 0.85, 0.06), M.wood, -3.2 + a, 0.42, 2.6 + b, camp);
const tallyB = dynBoard(2.0, 1.3, 768, 500);
const tallyM = add(box(2.0, 1.3, 0.06), [M.wood, M.wood, M.wood, M.wood, tallyB.mat, M.wood], 0.6, 1.6, 3.6, camp);
for (const s of [-1, 1]) { const l = add(box(0.06, 2.4, 0.06), M.wood, 0.6 + s * 0.8, 1.15, 3.55, camp); l.rotation.z = s * 0.1; }
// sandbag wall at the dam (ambush)
const bags = new THREE.Group(); bags.position.set(DAM[0] - 16, 0, DAM[2] - 12); world.add(bags);
for (let i = 0; i < 5; i++) { const b = add(tbox(1.6, 0.9, 0.7, 1.6), M.bags, (i - 2) * 1.5, 0.45, Math.abs(i - 2) * 0.35, bags); b.rotation.y = (i - 2) * -0.22; }

// ---------- vehicles & guns ----------
const lewis = (parent) => {
  const g = new THREE.Group(); parent.add(g);
  const piv = new THREE.Group(); g.add(piv);
  add(cyl(0.085, 0.085, 1.0, 14), M.gun, 0.55, 0, 0, piv).rotation.z = Math.PI / 2;
  for (let i = 0; i < 6; i++) add(cyl(0.092, 0.092, 0.02, 14), M.gunL, 0.2 + i * 0.14, 0, 0, piv).rotation.z = Math.PI / 2;
  add(cyl(0.025, 0.025, 0.25, 8), M.gun, 1.15, 0, 0, piv).rotation.z = Math.PI / 2;
  add(box(0.36, 0.14, 0.12), M.gunL, -0.08, 0, 0, piv);
  add(cyl(0.2, 0.2, 0.07, 24), M.gun, -0.02, 0.11, 0, piv);
  add(cyl(0.05, 0.05, 0.08, 10), M.gunL, -0.02, 0.16, 0, piv);
  const st = add(box(0.5, 0.1, 0.06), M.wood, -0.45, -0.06, 0, piv); st.rotation.z = 0.12;
  add(box(0.06, 0.16, 0.05), M.wood, -0.14, -0.12, 0, piv);
  const legs = [];
  for (const a of [0, 2.1, 4.2]) { const l = add(cyl(0.02, 0.02, 1.0, 6), M.gunL, 0, 0, 0, g); l.position.set(Math.cos(a) * 0.28, -0.42, Math.sin(a) * 0.28); l.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); legs.push(l); }
  g.userData.piv = piv; g.userData.legs = legs; return g;
};
const guns = [lewis(world), lewis(world)];
for (const g of guns) g.visible = false;
const truck = new THREE.Group(); world.add(truck); truck.visible = false;
const truckBody = new THREE.Group(); truck.add(truckBody);
add(box(4.8, 0.22, 1.5), M.truckD, 0, 0.75, 0, truckBody);
add(tbox(1.5, 0.7, 1.2, 1), M.truck, 1.75, 1.2, 0, truckBody); // hood
add(box(0.08, 0.75, 1.0), M.gunL, 2.52, 1.2, 0, truckBody); // grille
for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.13, 10, 8), M.lamp, 2.55, 1.45, s * 0.5, truckBody);
add(box(1.2, 0.9, 1.7), M.truck, 0.45, 1.3, 0, truckBody); // cab lower
add(box(1.3, 0.08, 1.8), M.truck, 0.4, 2.45, 0, truckBody); // cab roof
for (const [x, z] of [[-0.2, -0.85], [-0.2, 0.85], [1.0, -0.85], [1.0, 0.85]]) add(box(0.08, 0.9, 0.08), M.truck, x, 2.0, z, truckBody);
add(box(0.06, 0.9, 1.6), M.glass, 1.02, 2.0, 0, truckBody).material = new THREE.MeshToonMaterial({ gradientMap: grad, color: '#bcd8e8', transparent: true, opacity: 0.35 });
add(tbox(2.5, 0.12, 1.9, 1), M.plank, -1.35, 0.92, 0, truckBody); // bed
for (const s of [-1, 1]) add(tbox(2.5, 0.35, 0.08, 1), M.plank, -1.35, 1.15, s * 0.92, truckBody);
add(tbox(0.08, 0.35, 1.9, 1), M.plank, -2.6, 1.15, 0, truckBody);
for (const [x, s] of [[1.7, -1], [1.7, 1], [-1.6, -1], [-1.6, 1]]) { const f = add(new THREE.CylinderGeometry(0.55, 0.55, 0.36, 16, 1, false, 0, Math.PI), M.truckD, x, 0.62, s * 0.86, truckBody); f.rotation.x = Math.PI / 2; f.rotation.z = Math.PI / 2; }
const wheels = [];
for (const [x, s] of [[1.7, -1], [1.7, 1], [-1.6, -1], [-1.6, 1]]) { const w = new THREE.Group(); w.position.set(x, 0.46, s * 0.88); truck.add(w); add(cyl(0.46, 0.46, 0.26, 18), M.tyre, 0, 0, 0, w).rotation.x = Math.PI / 2; add(cyl(0.2, 0.2, 0.28, 8), M.hub, 0, 0, 0, w).rotation.x = Math.PI / 2; wheels.push(w); }
const tGun = lewis(truckBody); tGun.position.set(-1.4, 1.72, 0);
// steering wheel (the emu gets tangled in it)
const steer = add(new THREE.TorusGeometry(0.2, 0.025, 6, 18), M.gun, 0.85, 1.85, 0.35, truckBody); steer.rotation.y = Math.PI / 2; steer.rotation.x = 0.5;

// ---------- interior sets ----------
// office (Canberra) at x=1000
const OFF = [1000, 0, 0];
const office = new THREE.Group(); office.position.set(...OFF); scene.add(office);
add(tbox(14, 0.1, 12, 2), M.plank, 0, -0.05, 0, office, { cast: false });
add(tbox(14, 1.2, 0.2, 2), M.panel, 0, 0.6, -5, office); add(tbox(14, 3.6, 0.2, 2), M.plaster, 0, 3.0, -5, office);
for (const s of [-1, 1]) { add(tbox(0.2, 1.2, 12, 2), M.panel, s * 7, 0.6, 1, office); add(tbox(0.2, 3.6, 12, 2), M.plaster, s * 7, 3.0, 1, office); }
const offWin = add(box(2.2, 2.0, 0.05), M.windowL, 3.2, 2.6, -4.88, office, { cast: false });
for (const [x, y, w, h] of [[3.2, 2.6, 2.4, 0.12], [3.2, 2.6, 0.12, 2.2], [3.2, 1.55, 2.6, 0.15], [3.2, 3.65, 2.6, 0.15], [2.0, 2.6, 0.12, 2.2], [4.4, 2.6, 0.12, 2.2]]) add(box(w, h, 0.1), M.wood, x, y, -4.85, office);
const auMap = (() => { const c = document.createElement('canvas'); c.width = 768; c.height = 560; const g = c.getContext('2d'); g.fillStyle = '#e8dcb8'; g.fillRect(0, 0, 768, 560); g.fillStyle = '#9ac0d8'; g.fillRect(20, 20, 728, 520);
  const pts = [[0.12, 0.45], [0.2, 0.3], [0.33, 0.25], [0.42, 0.15], [0.5, 0.2], [0.55, 0.12], [0.62, 0.18], [0.66, 0.08], [0.72, 0.25], [0.8, 0.38], [0.86, 0.55], [0.82, 0.72], [0.72, 0.84], [0.62, 0.82], [0.55, 0.7], [0.45, 0.68], [0.35, 0.72], [0.22, 0.78], [0.12, 0.7], [0.1, 0.55]];
  g.beginPath(); pts.forEach(([x, y], i) => { const X = 40 + x * 690, Y = 30 + y * 470; i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); g.fillStyle = '#d9a05a'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#5a3a24'; g.stroke();
  g.fillStyle = '#b8282b'; g.beginPath(); g.arc(40 + 0.16 * 690, 30 + 0.62 * 470, 12, 0, 7); g.fill(); g.font = '900 30px Arial Black'; g.fillStyle = '#2a1e16'; g.fillText('CAMPION', 40 + 0.07 * 690, 30 + 0.57 * 470);
  g.beginPath(); g.arc(40 + 0.78 * 690, 30 + 0.74 * 470, 10, 0, 7); g.fill(); g.fillText('CANBERRA', 40 + 0.58 * 690, 30 + 0.8 * 470);
  g.font = '900 54px Arial Black'; g.fillText('AUSTRÁLIA', 250, 300); return c; })();
add(box(3.0, 2.2, 0.06), [M.wood, M.wood, M.wood, M.wood, canvasMat(auMap), M.wood], -2.6, 2.7, -4.86, office);
// bookshelf
add(tbox(2.2, 3.2, 0.5, 1), M.desk, -6.6, 1.6, -2.5, office).rotation.y = Math.PI / 2;
{ const r = P.rng(9); for (let row = 0; row < 4; row++) for (let i = 0; i < 9; i++) add(box(0.36, 0.5 + r() * 0.15, 0.18), toon({ color: ['#8a2a2a', '#2a4a6a', '#3a5a2a', '#6a4a2a', '#5a2a5a'][(i + row) % 5] }), -6.45, 0.55 + row * 0.75, -3.4 + i * 0.2, office); }
// desk
const desk = add(tbox(3.2, 0.12, 1.4, 1), M.desk, 0, 0.95, -2.2, office);
add(tbox(3.1, 0.9, 1.3, 1), M.desk, 0, 0.45, -2.2, office);
add(box(0.6, 0.02, 0.8), M.paperM, -0.6, 1.02, -2.0, office);
const stampTool = add(cyl(0.08, 0.12, 0.25, 12), M.wood, 0.9, 1.16, -2.0, office);
const deskPaper = add(box(0.5, 0.02, 0.7), M.paperM, 0.3, 1.02, -1.75, office);
const approved = add(new THREE.PlaneGeometry(0.42, 0.18), canvasMat(Q.sign(['APROVADO'], { w: 512, h: 220, bg: '#f4efe0', fg: '#c0353a', border: '#c0353a', plank: false }), true), 0.3, 1.035, -1.7, office, { cast: false });
approved.rotation.x = -Math.PI / 2; approved.rotation.z = 0.15; approved.visible = false;
add(new THREE.SphereGeometry(0.16, 12, 8), M.lamp, -1.2, 1.4, -2.5, office); add(cyl(0.02, 0.06, 0.4, 6), M.gold, -1.2, 1.2, -2.5, office);
// parliament at x=1100
const PAR = [1100, 0, 0];
const parl = new THREE.Group(); parl.position.set(...PAR); scene.add(parl);
add(tbox(24, 0.1, 22, 2), M.carpet, 0, -0.05, 0, parl, { cast: false });
add(tbox(24, 6, 0.3, 3), M.panel, 0, 3, -10, parl); for (const s of [-1, 1]) add(tbox(0.3, 6, 22, 3), M.panel, s * 12, 3, 0, parl);
for (const s of [-1, 1]) for (let row = 0; row < 4; row++) {
  const z = s * (2.6 + row * 1.3), y = row * 0.45;
  add(tbox(18, 0.4 + y, 1.2, 2), M.greenD, 0, (0.4 + y) / 2, z, parl);
  add(tbox(18, 0.5, 0.25, 2), M.green, 0, 0.4 + y + 0.6, z + s * 0.55, parl);
  add(tbox(18, 0.25, 0.9, 2), M.green, 0, 0.4 + y + 0.12, z, parl);
}
add(tbox(3, 0.9, 1.4, 1), M.desk, -7, 0.45, 0, parl); add(tbox(1.6, 3.2, 1.2, 1), M.desk, -10.5, 1.6, 0, parl);
// studio (graphics) at x=1200: curved backdrop with a dynamic colour
const STU = [1200, 0, 0];
const studio = new THREE.Group(); studio.position.set(...STU); scene.add(studio);
const backMat = new THREE.MeshBasicMaterial({ color: '#e9c46a' }); const floorMat = toon({ color: '#e9c46a' });
const back = add(new THREE.CylinderGeometry(14, 14, 16, 48, 1, true, -Math.PI * 0.4, Math.PI * 0.8), backMat, 0, 6, 6, studio, { cast: false }); back.material.side = THREE.BackSide; back.rotation.y = Math.PI;
add(new THREE.PlaneGeometry(40, 40), floorMat, 0, 0.02, 0, studio, { cast: false }).rotation.x = -Math.PI / 2;
const studioRays = add(new THREE.CircleGeometry(30, 24), new THREE.MeshBasicMaterial({ map: P.tex((() => { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); for (let i = 0; i < 24; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,0)'; g.beginPath(); g.moveTo(256, 256); g.arc(256, 256, 400, i / 24 * 6.283, (i + 1) / 24 * 6.283); g.fill(); } return c; })()), transparent: true, depthWrite: false }), 0, 6, -7.8, studio, { cast: false });
studioRays.userData.ndSkip = true;

// clouds: painted billboards
const clouds = [];
{ const r = P.rng(90);
  for (let i = 0; i < 16; i++) {
    const c = document.createElement('canvas'); c.width = 600; c.height = 400; const pen = new T.Pen(c.getContext('2d')); pen.ol = 0;
    pen.g.translate(300, 200); pen.g.scale(1.4, 1.2); pen.g.translate(-300, -200); T.fxCloud(pen, i + 1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.667), new THREE.MeshBasicMaterial({ map: P.tex(c), transparent: true, fog: false, depthWrite: false }));
    const a = r() * Math.PI * 2, d = 900 + r() * 300; m.position.set(Math.cos(a) * d, 140 + r() * 180, Math.sin(a) * d); m.scale.setScalar(220 + r() * 160);
    m.userData.ndSkip = true; m.renderOrder = -1; scene.add(m); clouds.push(m);
  } }

// ---------- cards (texture cache shared between meshes) ----------
const cardGeo = new THREE.PlaneGeometry(1, 1); cardGeo.translate(0, 0.475, 0);
const blobTex = P.tex(P.radial('20,14,30', 0.6));
const texCache = new Map();
const getTex = (a) => {
  const dw = a.dw || (a.kind === 'person' ? 600 : 1000), dh = dw * (a.h || 2.25) / (a.w || (a.kind === 'person' ? 1.35 : 2.25)), res = a.res || (a.kind === 'person' ? 1.6 : 0.5);
  const k = a.key + '|' + res;
  let e = texCache.get(k);
  if (e) { texCache.delete(k); texCache.set(k, e); return e.t; }
  const c = document.createElement('canvas'); c.width = Math.round(dw * res); c.height = Math.round(dh * res);
  const g = c.getContext('2d'); g.setTransform(res, 0, 0, res, 0, 0); a.draw(new T.Pen(g));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  texCache.set(k, { t }); if (texCache.size > 500) { const old = texCache.keys().next().value; texCache.get(old).t.dispose(); texCache.delete(old); }
  return t;
};
class Card {
  constructor() {
    this.matF = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, fog: true });
    this.matN = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, fog: false });
    this.mesh = new THREE.Mesh(cardGeo, this.matF); this.mesh.userData.nd = cardNd(); this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaTest: 0.5 });
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, fog: true }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.userData.ndSkip = true; this.blob.renderOrder = 1;
    scene.add(this.mesh); scene.add(this.blob); this.mesh.visible = this.blob.visible = false;
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
  sat: { value: 1.08 }, lift: { value: new THREE.Color(0, 0, 0) }, gain: { value: new THREE.Color(1, 1, 1) }, vig: { value: 0.22 }, flash: { value: 0 }, fade: { value: 0 } };
const inkScene = fs(new THREE.ShaderMaterial({ uniforms: inkU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D col, nd; uniform vec2 res; uniform float px, sat, vig, flash, fade; uniform vec3 fogCol, lift, gain; varying vec2 vUv;
  float edgeAt(vec2 uv, float r){
    vec4 c = texture2D(nd, uv); if (dot(c.rgb,c.rgb) < .01) return 0.; float d = c.a; vec3 n = c.rgb*2.-1.;
    float e = 0.; float rr = r * clamp(7./d, .62, 1.25);
    for (int i=0;i<16;i++){ float a = float(i)*.785398 + (i>7 ? .39 : 0.); float k = i>7 ? .5 : 1.;
      vec2 o = vec2(cos(a), sin(a))*rr*k/res; vec4 s = texture2D(nd, uv+o);
      float ds = s.a; bool card = dot(s.rgb,s.rgb) < .01;
      if (card && ds > 0.) continue;
      if (card) ds = 1e4;
      vec3 ns = s.rgb*2.-1.;
      float th = .006 / max(abs(n.z), .12); e = max(e, smoothstep(th, th*3.3, (ds - d)/d));
      if (!card && abs(ds-d)/d < .06) e = max(e, smoothstep(.88, .72, dot(n, ns)) * .9);
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
    vec2 q = vUv-.5; c *= 1. - vig*dot(q*vec2(1.,.6), q*vec2(1.,.6))*2.4;
    c = mix(c, vec3(1.), max(flash, 0.));
    c = mix(c, vec3(0.), fade);
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
dofScene.children[0].material.toneMapped = false;

// ---------- per-frame state ----------
const tmpV = new THREE.Vector3();
function applyLight(L) {
  hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.hemi;
  sun.color.set(L.sun); sun.intensity = L.sunI;
  scene.fog.color.set(L.fog); scene.fog.near = L.fogNear; scene.fog.far = L.fogFar;
  skyU.top.value.set(L.skyTop); skyU.hor.value.set(L.skyHor); skyU.sunCol.value.set(L.sunDisc || '#000'); skyU.sunSize.value = L.sunSize || 0;
  inkU.sat.value = L.sat; inkU.gain.value.set(L.gain || '#ffffff'); inkU.lift.value.set(L.lift || '#000000');
  waterU.deep.value.set(L.waterDeep || '#3a6f86'); waterU.shal.value.set(L.waterShal || '#6aa8b8'); waterU.glint.value.set(L.glint || '#e9f6ff');
}
function placeSun(L, focus) {
  const az = rx(L.az), el = rx(L.el); tmpV.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  skyU.sunDir.value.copy(tmpV);
  sun.position.copy(focus).addScaledVector(tmpV, 80); sun.target.position.copy(focus);
  const ext = L.shadowExt || 30, sc = sun.shadow.camera; sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 220; sc.updateProjectionMatrix();
}
const drawPrice = (k) => { const g = priceB.g, w = 640, h = 427; Q.chalk(g, w, h, (g) => {
  g.font = '900 46px Arial Black'; g.textAlign = 'center'; g.fillText('PREÇO DO TRIGO', w / 2, 80);
  g.lineWidth = 10; g.beginPath(); g.moveTo(60, 380); g.lineTo(600, 380); g.moveTo(60, 380); g.lineTo(60, 110); g.stroke();
  const pts = [[80, 150], [180, 140], [260, 160]]; const fall = Math.max(0, k); pts.push([260 + 300 * Math.min(1, fall), 160 + 200 * Math.min(1, fall) * (0.9 + 0.1 * Math.sin(fall * 20))]);
  g.strokeStyle = '#ff8a7a'; g.lineWidth = 14; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
  if (fall > 0.9) { const [x, y] = pts[3]; g.fillStyle = '#ff8a7a'; g.beginPath(); g.moveTo(x + 20, y + 22); g.lineTo(x - 30, y + 10); g.lineTo(x + 10, y - 30); g.fill(); }
}); priceB.t.needsUpdate = true; };
const drawTally = (s) => { const g = tallyB.g, w = 768, h = 500; const [mode, a, b] = s.split(':'); Q.chalk(g, w, h, (g) => {
  g.textAlign = 'center'; g.lineWidth = 9;
  if (mode === 'marks') { // tally marks: a = count
    const n = +a; g.font = '900 52px Arial Black'; g.fillText('EMUS', w / 2, 90);
    for (let i = 0; i < n; i++) { const grp = Math.floor(i / 5), k = i % 5, x = 110 + grp * 150 + k * 26, y = 160; if (k === 4) { g.beginPath(); g.moveTo(x - 118, y + 140); g.lineTo(x + 8, y + 10); g.stroke(); } else { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 150); g.stroke(); } }
  } else if (mode === 'ammo') { g.font = '900 56px Arial Black'; g.fillText('BALAS: ' + a, w / 2, 150); g.fillText('EMUS: ' + b, w / 2, 300); if (b.includes('?')) { g.font = '900 120px Arial Black'; g.fillText('?', w / 2 + 250, 330); } }
  else if (mode === 'final') { g.font = '900 64px Arial Black'; g.fillText('986 EMUS', w / 2, 140); g.fillText('9.860 BALAS', w / 2, 250); if (+a > 0) { g.fillStyle = '#ffd23a'; g.fillText('= 10 POR EMU', w / 2, 390); } }
  else if (mode === 'score') { g.font = '900 60px Arial Black'; g.fillText('PLACAR', w / 2, 110); g.font = '900 96px Arial Black'; g.fillText('EMUS ' + a, w / 2, 250); g.fillText('EXÉRCITO ' + b, w / 2, 380); }
}); tallyB.t.needsUpdate = true; };

function worldState(S, f) {
  for (const m of wheat) { m.scale.y = Math.max(0.02, S.wheat ?? 1); }
  M.wheatTop.color.set(S.green ? '#9fc05a' : '#ffffff'); M.wheatSide.color.set(S.green ? '#a9c860' : '#ffffff');
  // fence break: wires of BREAK_SEG sag/vanish, the post leans
  const br = S.fenceBreak || 0;
  for (const w of F1.wires) { w.position.copy(w.userData.base); w.rotation.set(0, 0, 0); w.visible = true;
    if (w.userData.seg === BREAK_SEG && br > 0) { w.position.y = w.userData.h * (1 - br) + 0.05 * br; w.rotation.z = br * (w.userData.h - 0.8) * 0.6; w.position.z += br * 0.4; w.visible = !(br > 0.7 && w.userData.h > 0.6); } }
  const bp = F1.posts[BREAK_SEG + 1]; bp.position.copy(bp.userData.base); bp.rotation.set(br * 0.5, 0, br * 0.35);
  // road fence crash (posts near x=60 knocked)
  const cr = S.crash || 0;
  F2.posts.forEach((p) => { p.position.copy(p.userData.base); p.rotation.set(0, 0, 0); const d = p.position.x - 61; if (cr > 0 && Math.abs(d) < 5) { const k = Math.min(1, cr * 1.6 - Math.abs(d) * 0.08); if (k > 0) { p.rotation.x = k * 1.1; p.rotation.z = -Math.sign(d) * k * 0.3; p.position.z += k * 0.6; } } });
  F2.wires.forEach((w) => { w.position.copy(w.userData.base); w.rotation.set(0, 0, 0); const d = w.position.x - 61; if (cr > 0 && Math.abs(d) < 6) { const k = Math.min(1, cr * 1.4); w.position.z += k * (1.2 - Math.abs(d) * 0.15); w.position.y -= k * 0.2; w.rotation.y = -Math.sign(d) * k * 0.3; } });
  fence.scale.y = S.fenceTall ? 1.7 : 1;
  rotor.rotation.z = f * (S.mill ?? 0.05);
  tail.rotation.y = Math.sin(f * 0.01) * 0.2;
  puddles.visible = !!S.wet;
  restSign.visible = !!S.rest; if (S.rest) { restSign.position.set(0, 1.45, -9.85); }
  ruler.visible = rulerSign.visible = !!S.ruler; if (S.ruler) { ruler.position.set(S.ruler[0], 1.0, S.ruler[2]); rulerSign.position.set(S.ruler[0], 2.0, S.ruler[2] + 0.08); }
  speedSign.visible = speedPost.visible = !!S.speed; if (S.speed) { speedPost.position.set(S.speed[0], 0.8, S.speed[2]); speedSign.position.set(S.speed[0], 2.1, S.speed[2] + 0.06); }
  mbFlap.rotation.x = -(S.mailOpen || 0) * 1.4; mbFlap.position.y = 1.25 - (S.mailOpen || 0) * 0.2; mbFlap.position.z = 0.31 + (S.mailOpen || 0) * 0.15;
  // guns
  guns.forEach((g, i) => { const s = S.guns && S.guns[i]; g.visible = !!s; if (!s) return; g.position.set(s.x, (s.y ?? 0) + 0.85, s.z); g.rotation.y = s.yaw || 0; g.userData.piv.rotation.z = s.pitch || 0; g.userData.piv.position.x = -(s.recoil || 0) * 0.05; });
  // truck
  const tr = S.truck; truck.visible = !!tr;
  if (tr) {
    truck.position.set(tr.x, 0, tr.z); truck.rotation.set(0, tr.yaw || 0, 0);
    truckBody.position.y = tr.bounce || 0; truckBody.rotation.set(tr.roll || 0, 0, tr.pitch || 0);
    for (const w of wheels) w.rotation.z = -(tr.dist || 0) / 0.46;
    tGun.userData.piv.rotation.z = tr.gunPitch || 0; tGun.rotation.y = tr.gunYaw || 0; tGun.userData.piv.position.x = -(tr.recoil || 0) * 0.05;
    for (const l of tGun.userData.legs) l.visible = false;
  }
  approved.visible = !!S.approved; stampTool.position.y = 1.16 + (S.stampUp || 0) * 0.3;
  backMat.color.set(S.backdrop || '#e9c46a'); floorMat.color.set(S.backdrop || '#e9c46a').multiplyScalar(1.05); studioRays.rotation.z = f * 0.004;
  crateLabel.visible = S.crateLabel !== false;
  if (S.price !== undefined) { const k = 'p' + S.price.toFixed(2); if (priceB.key !== k) { priceB.key = k; drawPrice(S.price); } }
  if (S.tally && tallyB.key !== S.tally) { tallyB.key = S.tally; drawTally(S.tally); }
  waterU.t.value = f / 30;
}

const camRight = new THREE.Vector3();
function drawActors(list, cam) {
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  camRight.setFromMatrixColumn(cam.matrixWorld, 0);
  list.forEach((a, i) => {
    const c = getCard(i), t = getTex(a);
    const mat = a.fog === false ? c.matN : c.matF; c.mesh.material = mat;
    if (mat.map !== t) { mat.map = t; mat.needsUpdate = true; }
    c.mesh.userData.nd.uniforms.map.value = t; c.mesh.customDepthMaterial.map = t; c.mesh.customDepthMaterial.needsUpdate = true;
    c.mesh.userData.ndSkip = a.nd === false;
    c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
    const w = (a.w || (a.kind === 'person' ? 1.35 : 2.25)) * (a.s || 1), h = (a.h || 2.25) * (a.s || 1);
    let flip = a.flip ? -1 : 1;
    if (a.vx !== undefined) { const d = camRight.x * a.vx + camRight.z * (a.vz || 0); if (d < 0) flip *= -1; }
    c.mesh.scale.set(w * flip, h * (a.sy || 1), 1);
    if (a.face) c.mesh.quaternion.copy(cam.quaternion);
    else c.mesh.rotation.set(0, Math.atan2(cam.position.x - a.x, cam.position.z - a.z) + (a.yaw || 0), a.roll || 0);
    mat.color.set(a.tint || '#ffffff'); mat.opacity = a.alpha ?? 1;
    c.mesh.castShadow = a.shadow !== false;
    c.mesh.renderOrder = a.order || 2;
    const gy = a.ground ?? 0;
    if (a.blob !== false && a.y < gy + 0.6) { c.blob.visible = true; c.blob.position.set(a.x, gy + 0.03, a.z); c.blob.scale.set(w * 0.75, w * 0.45, 1); }
  });
}

const swapForNd = (on) => {
  scene.traverse((o) => {
    if (!o.isMesh) return;
    if (on) {
      o.userData.mat0 = o.material;
      if (o.userData.ndSkip || o === sky || o.userData.sky) { o.userData.vis0 = o.visible; o.visible = false; return; }
      o.material = o.userData.nd || ndMat;
    } else {
      o.material = o.userData.mat0; if (o.userData.vis0 !== undefined) { o.visible = o.userData.vis0; delete o.userData.vis0; }
    }
  });
};

window.renderFrame = (f) => {
  const S = shotAt(f), L = lightFor(S, f), C = camAt(f);
  applyLight(L);
  camera.position.set(...C.pos); camera.up.set(0, 1, 0); camera.lookAt(...C.look); camera.rotateZ(rx(C.roll || 0));
  camera.fov = C.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const W_ = worldAt(f); worldState(W_, f);
  placeSun(L, new THREE.Vector3(...(C.shadowAt || C.look)));
  drawActors([...actorsAt(f, T), ...fxAt(f, T)], camera);
  sky.position.copy(camera.position);
  for (const c of clouds) c.quaternion.copy(camera.quaternion);
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  const fog = scene.fog; scene.fog = null; const sm = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false; renderer.shadowMap.autoUpdate = false;
  swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false);
  scene.fog = fog; renderer.shadowMap.enabled = sm; renderer.shadowMap.autoUpdate = true;
  if (window.DEBUG_ND) { const dm = new THREE.MeshBasicMaterial({ map: rtNd.texture }); const ds = fs(dm); renderer.setRenderTarget(null); renderer.render(ds, fsCam); return true; }
  const D = dofAt(f);
  inkU.px.value = 2.6; inkU.flash.value = window.DEBUG_E ? -1 : (C.flash || 0); inkU.vig.value = L.vig ?? 0.22; inkU.fade.value = C.fade || 0;
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  dofU.focus.value = D.focus; dofU.cinf.value = D.cinf; dofU.near.value = D.near ?? 1;
  renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
window.TOTAL = TOTAL;
window.ready = true;
