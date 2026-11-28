import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import path from 'path';
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
for (const id of process.argv.slice(2)) {
  const composition = await selectComposition({serveUrl, id, browserExecutable});
  let last = -1;
  await renderMedia({composition, serveUrl, codec: 'h264', crf: 18, pixelFormat: 'yuv420p', muted: true,
    outputLocation: `out/${id}_video.mp4`, browserExecutable, concurrency: 4, logLevel: 'error',
    onProgress: ({progress}) => { const p = Math.floor(progress * 10); if (p !== last) { last = p; console.log(id, p * 10 + '%'); } }});
}
console.log('done');
