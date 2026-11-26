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