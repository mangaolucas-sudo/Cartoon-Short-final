import * as K from './engine.js';
export async function boot(ep) {
  await Promise.all([document.fonts.load('80px "Lilita"'), document.fonts.load('40px "Fredoka"')]);
  const S = await import(`${ep}/story.js`);
  const words = await (await fetch(`${ep}/work/words.json`)).json();
  const meta = await (await fetch(`${ep}/work/meta.json`)).json();
  // casa as palavras do roteiro com as palavras temporizadas (mesma tokenização: split em espaços)
  let wi = 0; const shotWords = {}, order = [];
  for (const line of S.SCRIPT) {
    const toks = line.text.split(/\s+/).filter(Boolean);
    if (!shotWords[line.shot]) { shotWords[line.shot] = []; order.push(line.shot); }
    for (const tk of toks) { const w = words[wi++]; if (!w) throw new Error('faltam palavras em words.json perto de: ' + tk); shotWords[line.shot].push({ ...w, tok: tk }); }
  }
  if (wi !== words.length) console.log(`AVISO: roteiro tem ${wi} palavras, words.json tem ${words.length}`);
  const LEAD = S.LEAD ?? 0.08;
  const shots = order.map((id, i) => ({ id, s: i === 0 ? 0 : shotWords[id][0].s - LEAD, words: shotWords[id] }));
  shots.forEach((sh, i) => { sh.e = i + 1 < shots.length ? shots[i + 1].s : meta.duration; });
  const keys = new Set((S.KEYS || []).map(K.norm));
  const chunks = K.buildChunks(words);
  const total = meta.frames;
  const c = document.getElementById('c').getContext('2d');
  window.TOTAL = total; window.SHOTS = shots.map((s) => ({ id: s.id, a: Math.round(s.s * 30), b: Math.round(s.e * 30) - 1 }));
  window.renderFrame = (f) => {
    const g = f / K.FPS;
    const sh = shots.find((s) => g >= s.s && g < s.e) || shots[shots.length - 1];
    const T = {
      t: g - sh.s, g, dur: sh.e - sh.s, id: sh.id, words: sh.words,
      w: (i) => (sh.words[Math.min(i, sh.words.length - 1)]?.s ?? sh.s) - sh.s,
      find: (re, n = 0) => { const m = sh.words.filter((w) => (re instanceof RegExp ? re.test(K.norm(w.tok)) : K.norm(w.tok) === K.norm(re))); const w = m[Math.min(n, m.length - 1)]; return w ? w.s - sh.s : 0; },
      end: (re) => { const m = sh.words.filter((w) => K.norm(w.tok) === K.norm(re)); return m.length ? m[0].e - sh.s : 0; },
    };
    c.save(); c.clearRect(0, 0, K.W, K.H);
    const fn = S.SHOTS[sh.id];
    const cam = (S.CAM && S.CAM[sh.id]) ? S.CAM[sh.id](T) : { z: 1 + 0.035 * K.E.inout(T.t / T.dur), x: K.W / 2, y: K.H * 0.5 };
    let kx = 0, ky = 0, kr = 0;
    for (const q of (window.CUES || [])) { const d = g - q.t, a = { stamp: 14, boom: 22, plof: 8, siren: 6 }[q.sfx]; if (a && d >= 0 && d < 0.24) { const k = (1 - d / 0.24) * a, s = Math.floor(d * 30) % 2 ? -1 : 1; kx += s * k; ky += -s * k * 0.6; kr += s * k * 0.0012; } }
    c.translate(cam.x + kx, cam.y + ky); c.scale(cam.z, cam.z); c.rotate(kr); c.rotate(cam.r || 0); c.translate(-cam.x, -cam.y);
    fn(c, T, K);
    c.restore();
    if (S.OVERLAY) S.OVERLAY(c, T, K);
    if (!S.NO_CAPTION) K.caption(c, chunks, keys, g, S.CAPTION_Y || 1300);
  };
  // resolve as deixas de som para tempos absolutos
  window.CUES = (S.CUES || []).map((q) => {
    const sh = shots.find((x) => x.id === q.shot); if (!sh) return null;
    let t = sh.s;
    if (q.word !== undefined) { const m = sh.words.filter((w) => (q.word instanceof RegExp ? q.word.test(K.norm(w.tok)) : K.norm(w.tok) === K.norm(q.word))); const w = m[Math.min(q.n || 0, m.length - 1)]; t = w ? w.s : sh.s; }
    else if (q.at !== undefined) t = q.at < 0 ? sh.e + q.at : sh.s + q.at;
    return { t: Math.max(0, t + (q.off || 0)), sfx: q.sfx };
  }).filter(Boolean);
  window.COVERS = (S.COVERS || []).length;
  window.renderCover = (i) => { c.save(); c.clearRect(0, 0, K.W, K.H); S.COVERS[i](c, K); c.restore(); };
  window.ready = true;
}
