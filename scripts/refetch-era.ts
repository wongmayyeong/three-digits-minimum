/**
 * Re-fetches the monthly era counts from NearBlocks into the research raw store, so every month
 * records whether NearBlocks returned an exact count or a query-planner estimate. Then copies the
 * era records into the database store used by the website.
 *
 *   npx tsx scripts/refetch-era.ts            # re-fetch months stored without the estimate flag
 *   npx tsx scripts/refetch-era.ts --db-only  # only copy the file records into the database
 */
import 'dotenv/config';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fetchAll } from '@/lib/data/fetcher';
import { buildEraRequests } from '@/lib/data/sources';
import { dbRawStore, fileRawStore } from '@/lib/data/stores';

const RAW = join(process.cwd(), 'artifacts', 'research', 'raw');

async function main() {
  const dbOnly = process.argv.includes('--db-only');
  const defs = buildEraRequests();
  const keys = new Set(defs.map((d) => d.key));

  // Drop stored era months that lack the flag, and months no longer requested (intents.near counts).
  const manifestPath = join(RAW, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, { file: string }>;
  if (!dbOnly) {
    let dropped = 0;
    for (const [key, m] of Object.entries(manifest)) {
      if (!key.startsWith('nearblocks.era.')) continue;
      const abs = join(RAW, m.file);
      const body = existsSync(abs) ? JSON.parse(readFileSync(abs, 'utf8')) : null;
      if (!keys.has(key) || typeof body?.estimated !== 'boolean') {
        if (existsSync(abs)) rmSync(abs);
        delete manifest[key];
        dropped++;
      }
    }
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 1) + '\n');
    console.log(`dropped ${dropped} era records without the estimate flag`);
  }

  const files = fileRawStore(RAW);
  if (!dbOnly) {
    let n = 0;
    const out = await fetchAll(defs, files, {}, () => { n++; if (n % 10 === 0) console.log(`  ${n}/${defs.length}`); });
    const failed = out.filter((o) => o.status !== 'OK');
    console.log(`fetched ${out.length} era months, ${failed.length} failed`);
    if (failed.length) for (const f of failed) console.log('  failed', f.key, f.error);
  }

  const db = dbRawStore();
  let copied = 0;
  let estimated = 0;
  for (const key of keys) {
    const r = await files.latest(key);
    if (!r) continue;
    await db.put(r);
    copied++;
    if ((r.body as { estimated?: boolean }).estimated) estimated++;
  }
  console.log(`copied ${copied} era records to the database; ${estimated} are NearBlocks estimates`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
