// 2D overlays drawn over the rendered frame: scene headlines, split labels, synced captions.
const W = 1080, H = 1920, INK = '#120d16';
const back = (t, s = 1.7) => { t = Math.max(0, Math.min(1, t)) - 1; return t * t * ((s + 1) * t + s) + 1; };
const fitFont = (g, text, weight, size, maxW) => { let s = size; do { g.font = `${weight} ${s}px Inter, "Noto Color Emoji", sans-serif`; if (g.measureText(text).width <= maxW) break; s -= 2; } while (s > 20); return s; };
const outlined = (g, text, x, y, fill, stroke = INK, lw = 14) => {
  g.lineJoin = 'round'; g.miterLimit = 2; g.lineWidth = lw; g.strokeStyle = stroke; g.strokeText(text, x, y);
  g.fillStyle = fill; g.fillText(text, x, y);
};
// headline: big bold block, pops in (scale overshoot), centered at (x, y)
const headline = (g, it, f) => {
  const k = it.t0 != null ? back((f - it.t0) / 7) : 1; if (k <= 0) return;
  const maxW = it.maxW || 900;
  g.save(); g.translate(it.x ?? W / 2, it.y); g.scale(k, k); g.rotate((it.rot || 0) * Math.PI / 180);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  let y = -((it.lines.length - 1) * (it.size || 84) * 1.12) / 2;
  for (const ln of it.lines) {
    const s = fitFont(g, ln, 900, it.size || 84, maxW - 40);
    if (it.box) { // solid colour box behind the line
      const w = g.measureText(ln).width + 56, h = s * 1.3;
      g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowOffsetY = 8; g.shadowBlur = 0;
      g.beginPath(); g.roundRect(-w / 2, y - h / 2, w, h, 18); g.fillStyle = it.box; g.fill(); g.restore();
      g.lineWidth = 7; g.strokeStyle = INK; g.beginPath(); g.roundRect(-w / 2, y - h / 2, w, h, 18); g.stroke();
      g.fillStyle = it.color || '#fff'; g.fillText(ln, 0, y + s * 0.04);
    } else {
      g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowOffsetY = 7; outlined(g, ln, 0, y, it.color || '#fff', INK, s * 0.2); g.restore();
      outlined(g, ln, 0, y, it.color || '#fff', INK, s * 0.2);
    }
    y += s * 1.12;
  }
  g.restore();
};
// captions: centred block, active word in yellow, 1-2 lines, never near the edges
const caption = (g, it, f) => {
  const size = 74, maxW = 860, words = it.words;
  g.font = `800 ${size}px Inter, sans-serif`; g.textBaseline = 'middle';
  const sp = g.measureText(' ').width + 12, lines = [[]]; let lw = 0;
  for (const w of words) { const ww = g.measureText(w[0]).width; if (lines[lines.length - 1].length && lw + sp + ww > maxW) { lines.push([]); lw = 0; } lines[lines.length - 1].push([w[0], w[1], ww]); lw += (lw ? sp : 0) + ww; }
  const lh = size * 1.18, y0 = it.y - (lines.length - 1) * lh / 2;
  const k = Math.min(1, (f - it.a) / 4), sc = 0.9 + 0.1 * k;
  g.save(); g.translate(W / 2, it.y); g.scale(sc, sc); g.translate(-W / 2, -it.y);
  lines.forEach((ln, li) => {
    const tw = ln.reduce((s, w) => s + w[2], 0) + sp * (ln.length - 1); let x = W / 2 - tw / 2; const y = y0 + li * lh;
    for (const [t, a, ww] of ln) {
      const active = f >= a - 1; g.textAlign = 'left';
      g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowOffsetY = 6; outlined(g, t, x, y, '#fff', INK, 15); g.restore();
      outlined(g, t, x, y, active ? '#ffd23f' : '#ffffff', INK, 15);
      x += ww + sp;
    }
  });
  g.restore();
};
export const drawOverlay = (g, items, f) => {
  for (const it of items) {
    if (it.type === 'head') headline(g, it, f);
    else if (it.type === 'cap') caption(g, it, f);
    else if (it.type === 'divider') { // split-screen divider
      g.save(); g.fillStyle = INK; if (it.dir === 'v') g.fillRect(W / 2 - 7, 0, 14, H); else g.fillRect(0, H / 2 - 7, W, 14);
      g.fillStyle = '#fff'; if (it.dir === 'v') g.fillRect(W / 2 - 3, 0, 6, H); else g.fillRect(0, H / 2 - 3, W, 6); g.restore();
    }
  }
};
