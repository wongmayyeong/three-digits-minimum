/**
 * Optional: runs research/sql/*.sql against bigquery-public-data.crypto_near_mainnet_us.
 * Requires GOOGLE_CLOUD_PROJECT and Application Default Credentials (or GOOGLE_APPLICATION_CREDENTIALS).
 * Every query is dry-run first and refused above BIGQUERY_MAX_GB; the real run passes a byte cap.
 * Results go to artifacts/research/raw/bigquery/ with SHA-256 hashes. Check 01_freshness.sql
 * first: NEAR Lake (the dataset's upstream) stopped indexing new blocks on 2026-03-24.
 *
 *   npm run research:bigquery              # dry run + run
 *   npm run research:bigquery -- --dry-run # cost estimate only
 *
 * Status: written against the documented schema. Not run in this repository's development,
 * because no Google Cloud credentials were available.
 */
import 'dotenv/config';
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MAX_GB = Number(process.env.BIGQUERY_MAX_GB ?? 25);
const DAYS = Number(process.env.BIGQUERY_DAYS ?? 90);

async function main() {
  const dryOnly = process.argv.includes('--dry-run');
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) {
    console.error('Set GOOGLE_CLOUD_PROJECT and Google credentials. See README, "BigQuery".');
    process.exit(2);
  }
  const { BigQuery } = await import('@google-cloud/bigquery');
  const bq = new BigQuery({ projectId });
  const dir = join(process.cwd(), 'research', 'sql');
  const out = join(process.cwd(), 'artifacts', 'research', 'raw', 'bigquery');
  mkdirSync(out, { recursive: true });
  const end = new Date(Date.now() - 86_400_000);
  const start = new Date(end.getTime() - DAYS * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    const query = readFileSync(join(dir, file), 'utf8');
    const usesParams = query.includes('@start_date');
    const params = usesParams ? { start_date: iso(start), end_date: iso(end) } : undefined;
    const types = usesParams ? { start_date: 'DATE', end_date: 'DATE' } : undefined;
    const [dry] = await bq.createQueryJob({ query, params, types, dryRun: true, location: 'US' } as never);
    const bytes = Number((dry.metadata as { statistics: { totalBytesProcessed: string } }).statistics.totalBytesProcessed);
    const gb = bytes / 1e9;
    console.log(`${file}: dry run ${gb.toFixed(2)} GB (about $${((gb / 1000) * 6.25).toFixed(3)} on demand)`);
    if (gb > MAX_GB) {
      console.warn(`  refused: above BIGQUERY_MAX_GB=${MAX_GB}`);
      continue;
    }
    if (dryOnly) continue;
    const [rows] = await bq.query({ query, params, types, location: 'US', maximumBytesBilled: String(Math.ceil(bytes * 1.2)) } as never);
    const text = JSON.stringify(rows);
    writeFileSync(join(out, file.replace('.sql', '.json')), text);
    console.log(`  ${(rows as unknown[]).length} rows, sha256 ${createHash('sha256').update(text).digest('hex').slice(0, 16)}`);
  }
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
