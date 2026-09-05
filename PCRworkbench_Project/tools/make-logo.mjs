import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcPath = path.join(root, 'src/shared/pcr-agent-logo-src.png');

const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;

for (let i = 0; i < data.length; i += 4) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  if (r < 45 && g < 45 && b < 55 && Math.max(r, g, b) < 60) data[i + 3] = 0;
}

let minX = w, minY = h, maxX = 0, maxY = 0;
const rowFill = new Array(h).fill(0);
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const a = data[(y * w + x) * 4 + 3];
    if (a > 20) {
      rowFill[y]++;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
}

// gap between emblem and wordmark
let gapStart = -1;
let gapEnd = -1;
for (let y = Math.floor(h * 0.4); y < Math.floor(h * 0.9); y++) {
  const empty = rowFill[y] < w * 0.015;
  if (empty && gapStart < 0) gapStart = y;
  if (gapStart >= 0 && !empty) {
    gapEnd = y;
    break;
  }
}
if (gapStart < 0) gapStart = Math.floor((minY + maxY) * 0.58);
if (gapEnd < 0) gapEnd = gapStart + 8;

const pad = 6;
const raw = { width: w, height: h, channels: 4 };

const eL = Math.max(0, minX - pad);
const eT = Math.max(0, minY - pad);
const eR = Math.min(w - 1, maxX + pad);
const eB = Math.max(eT + 8, gapStart - 2);
const markBuf = await sharp(data, { raw })
  .extract({ left: eL, top: eT, width: eR - eL + 1, height: eB - eT + 1 })
  .png()
  .toBuffer();

const tL = Math.max(0, minX - pad);
const tT = Math.max(0, gapEnd - 2);
const tR = Math.min(w - 1, maxX + pad);
const tB = Math.min(h - 1, maxY + pad);
const textBuf = await sharp(data, { raw })
  .extract({ left: tL, top: tT, width: tR - tL + 1, height: Math.max(8, tB - tT + 1) })
  .png()
  .toBuffer();

const mh = 80;
const markResized = await sharp(markBuf).resize({ height: mh, fit: 'inside' }).png().toBuffer();
const markMeta = await sharp(markResized).metadata();
const textTargetH = Math.round(mh * 0.42);
const textResized = await sharp(textBuf).resize({ height: textTargetH, fit: 'inside' }).png().toBuffer();
const textMeta = await sharp(textResized).metadata();

const gap = 14;
const outW = markMeta.width + gap + textMeta.width;
const outH = mh;
const textTop = Math.round((outH - textMeta.height) / 2);

const hPath = path.join(root, 'src/shared/pcr-agent-logo-h.png');
await sharp({
  create: { width: outW, height: outH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([
    { input: markResized, left: 0, top: 0 },
    { input: textResized, left: markMeta.width + gap, top: textTop },
  ])
  .png()
  .toFile(hPath);

await sharp(markBuf).resize({ height: 128, fit: 'inside' }).png().toFile(path.join(root, 'src/shared/pcr-agent-mark.png'));
await sharp(data, { raw })
  .extract({
    left: Math.max(0, minX - pad),
    top: Math.max(0, minY - pad),
    width: Math.min(w - 1, maxX + pad) - Math.max(0, minX - pad) + 1,
    height: Math.min(h - 1, maxY + pad) - Math.max(0, minY - pad) + 1,
  })
  .png()
  .toFile(path.join(root, 'src/shared/pcr-agent-logo.png'));

console.log({
  gapStart,
  gapEnd,
  h: await sharp(hPath).metadata(),
  bytes: fs.statSync(hPath).size,
});
