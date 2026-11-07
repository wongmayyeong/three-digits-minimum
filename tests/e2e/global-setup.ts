/** Compiles every route once on the dev server so first-visit compilation reloads cannot race the tests. */
export default async function globalSetup() {
  const base = 'http://localhost:3100';
  const routes = ['/', '/topics/intents-bet', '/topics/growth-or-hype', '/topics/long-game', '/library', '/methodology', '/research', '/debates/d_warmupwarmup', '/debates/d_warmupwarmup/report', '/api/topics/intents-bet/evidence-preview?offline=1', '/api/health'];
  for (const r of routes) {
    for (let i = 0; i < 3; i++) {
      try { await fetch(base + r, { signal: AbortSignal.timeout(120_000) }); break; } catch { await new Promise((res) => setTimeout(res, 2000)); }
    }
  }
}
