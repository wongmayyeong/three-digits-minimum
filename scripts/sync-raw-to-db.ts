/**
 * Copies every raw response in the research store (artifacts/research/raw) into the database store
 * used by the website, so the site and THESIS.md are built from the same responses.
 *
 *   npx tsx scripts/sync-raw-to-db.ts
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dbRawStore, fileRawStore } from '@/lib/data/stores';

async function main() {
  const RAW = join(process.cwd(), 'artifacts', 'research', 'raw');
  const manifest = JSON.parse(readFileSync(join(RAW, 'manifest.json'), 'utf8')) as Record<string, unknown>;
  const files = fileRawStore(RAW);
  const db = dbRawStore();
  let copied = 0;
  for (const key of Object.keys(manifest)) {
    const r = await files.latest(key);
    if (!r) continue;
    await db.put(r);
    copied++;
  }
  console.log(`copied ${copied} raw responses to the database`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
