/**
 * Turns the generated source images in design/source/ into web assets:
 *  - logo.png  -> public/logo-mark.png (transparent, trimmed), src/app/icon.png, src/app/apple-icon.png
 *  - stage.png -> public/stage/studio.webp
 *  - public/characters/<role>/*.png (from slice-sprites) -> lossless .webp
 *
 *   npx tsx scripts/process-assets.ts
 */
import { readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const root = process.cwd();

async function keyMagenta(file: string) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < info.width * info.height; i++) {
    const o = i * 4;
    const r = data[o]!, g = data[o + 1]!, b = data[o + 2]!;
    // Magenta key plus anti-aliased edge pixels blended with it.
    if (r > g + 60 && b > g + 60 && Math.abs(r - b) < 80) data[o + 3] = 0;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
}

async function main() {
  const logo = await (await keyMagenta(join(root, 'design/source/logo.png'))).png().toBuffer();
  const mark = await sharp(logo).trim({ threshold: 1 }).png().toBuffer();
  await sharp(mark).resize({ width: 512, height: 512, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9 }).toFile(join(root, 'public/logo-mark.png'));
  // App icons: the mark on the product's near-black, rounded square.
  for (const [size, out] of [[64, 'src/app/icon.png'], [180, 'src/app/apple-icon.png']] as const) {
    const inner = Math.round(size * 0.84);
    const radius = Math.round(size * 0.2);
    const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="#060a08"/></svg>`);
    const fg = await sharp(mark).resize({ width: inner, height: inner, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    await sharp(bg).composite([{ input: fg, gravity: 'center' }]).png().toFile(join(root, out));
  }
  console.log('logo: public/logo-mark.png, src/app/icon.png, src/app/apple-icon.png');

  await sharp(join(root, 'design/source/stage.png')).webp({ quality: 88 }).toFile(join(root, 'public/stage/studio.webp'));
  console.log('stage: public/stage/studio.webp');

  for (const role of ['bull', 'bear', 'judge']) {
    const dir = join(root, 'public/characters', role);
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.png'))) {
      await sharp(join(dir, f)).webp({ lossless: true }).toFile(join(dir, f.replace('.png', '.webp')));
      rmSync(join(dir, f));
    }
    console.log(`characters/${role}: webp frames`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
