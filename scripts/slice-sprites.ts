/**
 * Slices a generated character sprite sheet (a 3x2 grid of poses) into individual frames,
 * removes a flat background if the sheet is not already transparent, trims every frame to
 * one shared bounding box (so poses do not jump), and writes public/characters/<role>/<pose>.png.
 *
 *   npx tsx scripts/slice-sprites.ts <sheet.png> <bull|bear|judge> [--cols 3 --rows 2]
 *
 * Frame order (row by row): 3x2 sheets: idle, talk, think, surprised, agree, disagree.
 * 4x2 sheets: idle, talk, explain, point, think, surprised, agree, disagree.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

export const POSES = ['idle', 'talk', 'think', 'surprised', 'agree', 'disagree'] as const;
/** 4x2 sheets add two speaking gestures. */
export const POSES8 = ['idle', 'talk', 'explain', 'point', 'think', 'surprised', 'agree', 'disagree'] as const;

async function main() {
  const [sheet, role] = process.argv.slice(2);
  const arg = (k: string, d: number) => Number(process.argv[process.argv.indexOf(k) + 1] ?? d) || d;
  const cols = process.argv.includes('--cols') ? arg('--cols', 3) : 3;
  const rows = process.argv.includes('--rows') ? arg('--rows', 2) : 2;
  if (!sheet || !['bull', 'bear', 'judge'].includes(role ?? '')) {
    console.error('usage: tsx scripts/slice-sprites.ts <sheet.png> <bull|bear|judge>');
    process.exit(2);
  }
  const img = sharp(readFileSync(sheet)).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;

  // Background key: if corners are opaque and similar, treat that colour as background.
  const px = (x: number, y: number) => { const i = (y * W + x) * C; return [data[i]!, data[i + 1]!, data[i + 2]!, data[i + 3]!]; };
  const corners = [px(2, 2), px(W - 3, 2), px(2, H - 3), px(W - 3, H - 3)];
  const opaque = corners.every((c) => c[3]! > 250);
  const ref = corners[0]!;
  const near = (a: number[], b: number[], tol: number) => Math.abs(a[0]! - b[0]!) + Math.abs(a[1]! - b[1]!) + Math.abs(a[2]! - b[2]!) <= tol;
  if (opaque && corners.every((c) => near(c, ref, 40))) {
    for (let i = 0; i < W * H; i++) {
      const o = i * C;
      const r = data[o]!, g = data[o + 1]!, b = data[o + 2]!;
      // Background, plus magenta-tinted fringe pixels where the outline blended into the key colour.
      const magentaTint = r > g + 40 && b > g + 40 && Math.abs(r - b) < 70;
      if (near([r, g, b], ref, 60) || magentaTint) data[o + 3] = 0;
    }
    console.log(`Removed flat background rgb(${ref.slice(0, 3).join(',')}).`);
  }

  const cw = Math.floor(W / cols), ch = Math.floor(H / rows);
  // Shared bounding box across all frames, so the character stays anchored between poses.
  let minX = cw, minY = ch, maxX = 0, maxY = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const a = data[((r * ch + y) * W + (c * cw + x)) * C + 3]!;
      if (a > 16) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
    }
  }
  const pad = 4;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad); maxX = Math.min(cw - 1, maxX + pad); maxY = Math.min(ch - 1, maxY + pad);
  const keyed = sharp(data, { raw: { width: W, height: H, channels: C as 4 } });
  const outDir = join(process.cwd(), 'public', 'characters', role!);
  mkdirSync(outDir, { recursive: true });
  const poses: readonly string[] = cols * rows === 8 ? POSES8 : POSES;
  let n = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const pose = poses[n++];
    if (!pose) break;
    await keyed.clone().extract({ left: c * cw + minX, top: r * ch + minY, width: maxX - minX + 1, height: maxY - minY + 1 })
      .png({ compressionLevel: 9 }).toFile(join(outDir, `${pose}.png`));
    console.log(`wrote public/characters/${role}/${pose}.png (${maxX - minX + 1}x${maxY - minY + 1})`);
  }
  // Record which roles have sprites, so the app switches from the SVG fallback automatically.
  const manifestPath = join(process.cwd(), 'src', 'components', 'characters', 'sprites.json');
  const manifest: Record<string, { width: number; height: number; poses: string[] }> = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
  manifest[role!] = { width: maxX - minX + 1, height: maxY - minY + 1, poses: [...poses] };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
