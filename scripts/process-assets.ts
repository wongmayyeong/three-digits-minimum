/**
 * Turns the generated source images in design/source/ into web assets:
 *  - stage.png -> public/stage/studio.webp
 *  - public/characters/<role>/*.png (from slice-sprites) -> lossless .webp
 * The logo mark and app icons come from scripts/process-logo.ts.
 *
 *   npx tsx scripts/process-assets.ts
 */
import { readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const root = process.cwd();

async function main() {
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
