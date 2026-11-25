// uso: node render.mjs <ep dir relativo a bento-contae, ex: producao/ep02> <saída> <quadros "a-b" | "1,2,3" | all> [passo]
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const [,, ep, outdir, spec = 'all', step = '1'] = process.argv;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
fs.mkdirSync(outdir, { recursive: true });
const types = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.woff2': 'font/woff2' };
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(p).pipe(s); }).listen(0);
await new Promise((r) => srv.on('listening', r));
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
pg.on('console', (m) => console.log('PAGE', m.text())); pg.on('pageerror', (e) => console.log('ERR', e.message));
await pg.goto(`http://localhost:${srv.address().port}/engine2d/index.html?ep=/${ep}`);
await pg.waitForFunction(() => window.ready || window.err, null, { timeout: 60000 });
if (await pg.evaluate(() => window.err)) { console.log('erro na página'); process.exit(1); }
const total = await pg.evaluate(() => window.TOTAL);
let frames = [];
const sp = spec === 'all' ? `0-${total - 1}` : spec;
for (const part of sp.split(',')) { if (part.includes('-')) { const [a, z] = part.split('-').map(Number); for (let f = a; f <= z; f += +step) frames.push(f); } else frames.push(+part); }
fs.writeFileSync(path.join(outdir, 'shots.json'), JSON.stringify(await pg.evaluate(() => window.SHOTS)));
fs.writeFileSync(path.join(root, ep, 'work', 'cues.json'), JSON.stringify(await pg.evaluate(() => ({ cues: window.CUES, shots: window.SHOTS })), null, 1));
const t0 = Date.now();
for (const f of frames) {
  const d = await pg.evaluate((f) => { window.renderFrame(f); return document.getElementById('c').toDataURL('image/jpeg', 0.93); }, f);
  fs.writeFileSync(path.join(outdir, `f${String(f).padStart(4, '0')}.jpg`), Buffer.from(d.split(',')[1], 'base64'));
}
console.log(`ok ${frames.length} quadros de ${total}, ${((Date.now() - t0) / frames.length).toFixed(0)} ms/quadro`);
await b.close(); srv.close();
