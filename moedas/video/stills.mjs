import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'path';
const [,, id, outDir, ...frames] = process.argv;
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id, browserExecutable});
for (const f of frames) {
  await renderStill({composition, serveUrl, frame: Number(f), output: `${outDir}/${id}_${String(f).padStart(4,'0')}.png`, browserExecutable, logLevel: 'error'});
}
console.log('ok');
