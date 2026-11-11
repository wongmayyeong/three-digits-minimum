/**
 * Logo from design/source/logo-three-digits.webp: a round dark badge ("Three Digits, Minimum?") on a
 * white background with ragged edges. Cuts a clean anti-aliased disc just outside the green ring,
 * makes everything outside it transparent, then writes the header mark and app icons.
 *
 *   npx tsx scripts/process-logo.ts
 */
import { join } from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const SRC = join(root, 'design/source/logo-three-digits.webp');

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

// Locate the green ring to centre the disc.
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const o = (y * info.width + x) * 4;
    const r = data[o]!, g = data[o + 1]!, b = data[o + 2]!;
    if (g > 180 && r < 120 && b > 130 && b < 230) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
}
const cx = (minX + maxX) / 2;
const cy = (minY + maxY) / 2;
const ringR = Math.max(maxX - minX, maxY - minY) / 2;
const R = ringR + 6; // just outside the ring, inside the dark badge
console.log(`ring centre (${cx.toFixed(0)}, ${cy.toFixed(0)}), radius ${ringR.toFixed(0)}`);

// Anti-aliased circular alpha; fill the disc's ragged outer area with the badge black.
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const o = (y * info.width + x) * 4;
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
    const a = Math.max(0, Math.min(1, R - d + 0.5));
    if (a <= 0) { data[o + 3] = 0; continue; }
    // Inside the disc but outside the ring, light pixels are leftover white background: paint them black.
    if (d > ringR + 1 && data[o]! + data[o + 1]! + data[o + 2]! > 120) { data[o] = 0; data[o + 1] = 0; data[o + 2] = 0; }
    data[o + 3] = Math.round(255 * a);
  }
}
const side = Math.ceil(R * 2) + 2;
const left = Math.max(0, Math.round(cx - side / 2));
const top = Math.max(0, Math.round(cy - side / 2));
const disc = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .extract({ left, top, width: Math.min(side, info.width - left), height: Math.min(side, info.height - top) })
  .png().toBuffer();

await sharp(disc).resize({ width: 512, height: 512, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9 }).toFile(join(root, 'public/logo-mark.png'));
console.log('public/logo-mark.png 512x512');
for (const [size, out] of [[64, 'src/app/icon.png'], [180, 'src/app/apple-icon.png']] as const) {
  await sharp(disc).resize({ width: size, height: size, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(join(root, out));
  console.log(`${out} ${size}x${size}`);
}
