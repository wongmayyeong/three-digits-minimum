import { NextResponse } from 'next/server';
import { resolveLlm } from '@/lib/ai/provider';
import { voiceStatus } from '@/lib/audio/voices';
import { storageDriver } from '@/lib/storage/assets';
import { db } from '@/lib/storage/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health : readiness. 200 when the database answers and a worker has checked in
 * within 60 seconds; 503 otherwise. Reports which optional integrations are configured
 * (booleans only, never values).
 */
export async function GET() {
  const checks: Record<string, unknown> = {};
  let ok = true;
  try {
    await db().$queryRawUnsafe('SELECT 1');
    checks.database = 'ok';
  } catch {
    checks.database = 'unreachable';
    ok = false;
  }
  if (checks.database === 'ok') {
    const hb = await db().workerHeartbeat.findFirst({ orderBy: { seenAt: 'desc' } });
    const fresh = hb && Date.now() - hb.seenAt.getTime() < 60_000;
    checks.worker = fresh ? 'ok' : hb ? 'stale' : 'none';
    if (!fresh) ok = false;
    const queued = await db().job.count({ where: { status: { in: ['QUEUED', 'RUNNING'] } } });
    checks.queueDepth = queued;
  }
  const llm = resolveLlm().status;
  const voice = voiceStatus();
  checks.integrations = {
    llm: { configured: llm.configured, provider: llm.provider, model: llm.configured ? llm.model : null },
    voice: { configured: voice.configured, provider: voice.provider },
    intentsExplorer: !!process.env.INTENTS_EXPLORER_JWT,
    coingeckoKey: !!(process.env.COINGECKO_DEMO_API_KEY || process.env.COINGECKO_PRO_API_KEY),
    nearblocksKey: !!process.env.NEARBLOCKS_API_KEY,
    assetStorage: storageDriver(),
  };
  return NextResponse.json({ status: ok ? 'ok' : 'degraded', checks, time: new Date().toISOString() }, { status: ok ? 200 : 503, headers: { 'cache-control': 'no-store' } });
}
