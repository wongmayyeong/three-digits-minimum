/**
 * Logo from design/source/logo.webp (glowing Bull / Bear on black): converts brightness to
 * alpha ("unscreen"), so the glow composites cleanly on any dark background, then writes the
 * header mark and app icons.
 */
import { join } from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const { data, info } = await sharp(join(root, 'design/source/logo.webp')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < info.width * info.height; i++) {
  const o = i * 4;
  const r = data[o]!, g = data[o + 1]!, b = data[o + 2]!;
  const a = Math.max(r, g, b);
  if (a < 10) { data[o + 3] = 0; continue; }
  data[o] = Math.min(255, Math.round((r * 255) / a));
  data[o + 1] = Math.min(255, Math.round((g * 255) / a));
  data[o + 2] = Math.min(255, Math.round((b * 255) / a));
  data[o + 3] = a;
}
const keyed = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
const trimmed = await sharp(keyed).trim({ threshold: 4 }).png().toBuffer();
const meta = await sharp(trimmed).metadata();
await sharp(trimmed).resize({ width: 640 }).png({ compressionLevel: 9 }).toFile(join(root, 'public/logo-mark.png'));
console.log(`logo-mark.png ${meta.width}x${meta.height} -> 640 wide`);
for (const [size, out] of [[64, 'src/app/icon.png'], [180, 'src/app/apple-icon.png']] as const) {
  const radius = Math.round(size * 0.2);
  const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="#060a08"/></svg>`);
  const fg = await sharp(trimmed).resize({ width: Math.round(size * 0.9), height: Math.round(size * 0.9), fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  await sharp(bg).composite([{ input: fg, gravity: 'center' }]).png().toFile(join(root, out));
}
console.log('icons written');
