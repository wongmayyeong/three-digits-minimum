/**
 * Fetches background requests (era months, buyback days) into artifacts/research/raw without
 * refreshing anything else. Closed periods are cached, so re-runs only fetch what is missing.
 *
 *   npx tsx scripts/fetch-background.ts            all background requests
 *   npx tsx scripts/fetch-background.ts buyback    only keys containing "buyback"
 */
import 'dotenv/config';
import { join } from 'node:path';
import { fetchAll } from '@/lib/data/fetcher';
import { buildBackgroundRequests } from '@/lib/data/sources';
import { fileRawStore } from '@/lib/data/stores';

const filter = process.argv[2] ?? '';
const defs = buildBackgroundRequests().filter((d) => d.key.includes(filter));
const store = fileRawStore(join(process.cwd(), 'artifacts', 'research', 'raw'));
let done = 0;
const outcomes = await fetchAll(defs, store, {}, (o) => {
  done++;
  if (!o.cacheHit || o.status !== 'OK') console.log(`${String(done).padStart(4)}/${defs.length} ${o.status.padEnd(7)} ${o.key}${o.error ? `  (${o.error})` : ''}`);
});
const failed = outcomes.filter((o) => o.status !== 'OK');
console.log(`done: ${outcomes.length - failed.length}/${outcomes.length} available, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
