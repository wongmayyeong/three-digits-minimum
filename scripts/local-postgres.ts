/**
 * Local development only: runs a real PostgreSQL server from the `embedded-postgres`
 * npm binaries, so contributors without Docker or a system Postgres can run the project.
 * Production uses any managed PostgreSQL via DATABASE_URL (see DEPLOY.md).
 *
 *   npm run db:local     # keeps running; Ctrl+C stops it
 */
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), '.data', 'pg');
const port = Number(process.env.LOCAL_PG_PORT ?? 54339);

async function main() {
  const pg = new EmbeddedPostgres({ databaseDir: dir, user: 'thesis', password: 'thesis-local', port, persistent: true });
  if (!existsSync(join(dir, 'PG_VERSION'))) await pg.initialise();
  await pg.start();
  try { await pg.createDatabase('thesis'); } catch { /* already exists */ }
  try { await pg.createDatabase('thesis_test'); } catch { /* already exists */ }
  console.log(`Local PostgreSQL ready on port ${port}.`);
  console.log(`DATABASE_URL=postgresql://thesis:thesis-local@localhost:${port}/thesis`);
  const stop = async () => { await pg.stop(); process.exit(0); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main().catch((e) => { console.error(e); process.exit(1); });
