/**
 * Integration tests against a real PostgreSQL database (TEST_DATABASE_URL, default: the
 * local embedded server's nebube_test database). No network: provider responses are
 * seeded from the committed artifacts/research/raw snapshot, and the LLM is the local
 * synthetic fixture.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const TEST_DB = process.env.TEST_DATABASE_URL ?? 'postgresql://nebube:nebube-local@localhost:54339/nebube_test';
process.env.DATABASE_URL = TEST_DB;
process.env.NEBUBE_FIXTURE_LLM = '1';
delete process.env.OPENAI_API_KEY;
delete process.env.LLM_API_KEY;
delete process.env.ELEVENLABS_API_KEY;
delete process.env.INTENTS_EXPLORER_JWT;

type Mods = {
  db: typeof import('@/lib/storage/db').db;
  createDebate: typeof import('@/lib/debate/create').createDebate;
  advance: typeof import('@/lib/debate/engine').advance;
  loadDebateView: typeof import('@/lib/debate/view').loadDebateView;
  buildReport: typeof import('@/lib/debate/report').buildReport;
  snapshotDelta: typeof import('@/lib/debate/delta').snapshotDelta;
  processAudioJob: typeof import('@/lib/audio/service').processAudioJob;
  claimJob: typeof import('@/lib/debate/jobs').claimJob;
  enqueue: typeof import('@/lib/debate/jobs').enqueue;
  createSnapshot: typeof import('@/lib/debate/snapshot').createSnapshot;
};
let m: Mods;

const RAW = join(process.cwd(), 'artifacts', 'research', 'raw');

async function seedRaw(mutate?: (key: string, body: unknown) => unknown) {
  const manifest = JSON.parse(readFileSync(join(RAW, 'manifest.json'), 'utf8')) as Record<string, { key: string; source: string; url: string; file: string }>;
  const { sha256, stableStringify } = await import('@/lib/data/sources');
  for (const e of Object.values(manifest)) {
    let body = JSON.parse(readFileSync(join(RAW, e.file), 'utf8'));
    if (mutate) body = mutate(e.key, body);
    const text = stableStringify(body);
    const hash = sha256(text);
    await m.db().rawResponse.upsert({ where: { sha256: hash }, update: { fetchedAt: new Date() }, create: { sha256: hash, requestKey: e.key, sourceId: e.source, url: e.url, body: JSON.parse(text), fetchedAt: new Date() } });
  }
}

async function runToEnd(publicId: string) {
  const s = await m.db().debateSession.findUniqueOrThrow({ where: { publicId } });
  for (let i = 0; i < 30; i++) {
    const r = await m.advance(s.id);
    if (r.done) return r.status;
  }
  throw new Error('did not finish');
}

beforeAll(async () => {
  if (!existsSync(join(RAW, 'manifest.json'))) throw new Error('Run `npm run research:refresh` once to create artifacts/research/raw.');
  execSync('npx prisma migrate deploy', { env: { ...process.env, DATABASE_URL: TEST_DB }, stdio: 'pipe' });
  m = {
    db: (await import('@/lib/storage/db')).db,
    createDebate: (await import('@/lib/debate/create')).createDebate,
    advance: (await import('@/lib/debate/engine')).advance,
    loadDebateView: (await import('@/lib/debate/view')).loadDebateView,
    buildReport: (await import('@/lib/debate/report')).buildReport,
    snapshotDelta: (await import('@/lib/debate/delta')).snapshotDelta,
    processAudioJob: (await import('@/lib/audio/service')).processAudioJob,
    claimJob: (await import('@/lib/debate/jobs')).claimJob,
    enqueue: (await import('@/lib/debate/jobs')).enqueue,
    createSnapshot: (await import('@/lib/debate/snapshot')).createSnapshot,
  };
  await m.db().$executeRawUnsafe('TRUNCATE "DebateSession", "EvidenceSnapshot", "RawResponse", "DataFetchAttempt", "DataSource", "Job", "AudioAsset", "UsageRecord", "RateLimitBucket" CASCADE');
  await seedRaw();
}, 120_000);

afterAll(async () => {
  await m?.db().$disconnect();
});

describe('debate lifecycle', () => {
  let firstId = '';

  it('runs topic -> research -> 6 turns -> verdict -> replay, citing only snapshot evidence', async () => {
    const r = await m.createDebate({ topicSlug: 'intents-bet', clientKey: 'it-client-1', idempotencyKey: 'it-key-0001' });
    firstId = r.publicId;
    expect(await runToEnd(firstId)).toBe('COMPLETE');
    const v = (await m.loadDebateView(firstId))!;
    expect(v.synthetic).toBe(true);
    expect(v.turns.map((t) => t.phase)).toEqual(['BULL_OPEN', 'BEAR_OPEN', 'BULL_REBUTTAL', 'BEAR_REBUTTAL', 'BULL_CLOSE', 'BEAR_CLOSE', 'JUDGING']);
    const ids = new Set(v.snapshot!.items.map((i) => i.evidenceId));
    for (const t of v.turns) for (const c of t.claims) for (const id of c.evidenceIds) expect(ids.has(id)).toBe(true);
    expect(v.verdict!.scores.bull.total).toBeGreaterThan(0);
    expect(v.replay.map((e) => e.kind)).toEqual(['intro', 'turn', 'turn', 'turn', 'turn', 'turn', 'turn', 'verdict']);
    const report = m.buildReport(v)!;
    expect(report.evidenceRegister.length).toBe(v.snapshot!.items.length);
    expect(report.generatedFrom.contentHash).toBe(v.snapshot!.contentHash);
  });

  it('is idempotent on the client key', async () => {
    const again = await m.createDebate({ topicSlug: 'intents-bet', clientKey: 'it-client-1', idempotencyKey: 'it-key-0001' });
    expect(again).toEqual({ publicId: firstId, reused: true });
  });

  it('rejects unknown topics', async () => {
    await expect(m.createDebate({ topicSlug: 'moon-2030', clientKey: 'x' })).rejects.toThrow(/Unknown topic/);
  });

  it('rematch creates a new snapshot with a correct delta and never alters the original replay', async () => {
    const before = (await m.loadDebateView(firstId))!;
    const beforeJson = JSON.stringify({ items: before.snapshot!.items, turns: before.turns.map((t) => [t.id, t.textHash, t.speechText]), verdict: before.verdict, replay: before.replay });
    const oldMcap = before.snapshot!.items.find((i) => i.evidenceId === 'MKT-NEAR-MCAP')!.value!;
    // New data arrives: NEAR market cap is 10% higher.
    await m.db().rawResponse.deleteMany({});
    await seedRaw((key, body) => key === 'coingecko.markets' ? (body as { id: string; marketCap: number }[]).map((c) => (c.id === 'near' ? { ...c, marketCap: c.marketCap * 1.1 } : c)) : body);
    // Providers are unreachable in tests: the forced-fresh rematch fetch fails and falls back to the stored (seeded) copies, flagged stale.
    const realFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async () => { throw new Error('network disabled in tests'); }) as typeof fetch;
    let re: { publicId: string };
    try {
      re = await m.createDebate({ topicSlug: 'intents-bet', clientKey: 'it-client-2', parentPublicId: firstId });
      expect(await runToEnd(re.publicId)).toBe('COMPLETE');
    } finally {
      globalThis.fetch = realFetch;
    }
    const after = (await m.loadDebateView(firstId))!;
    expect(JSON.stringify({ items: after.snapshot!.items, turns: after.turns.map((t) => [t.id, t.textHash, t.speechText]), verdict: after.verdict, replay: after.replay })).toBe(beforeJson);
    const rem = (await m.loadDebateView(re.publicId))!;
    expect(rem.parentId).toBe(firstId);
    expect(rem.snapshot!.id).not.toBe(before.snapshot!.id);
    const row = m.snapshotDelta(before.snapshot!.items, rem.snapshot!.items).find((r) => r.evidenceId === 'MKT-NEAR-MCAP')!;
    expect(row.kind).toBe('changed');
    expect(row.previous).toBe(oldMcap);
    expect(row.pctChange).toBeCloseTo(0.1, 6);
    expect(rem.snapshot!.sources.find((x) => x.key === 'coingecko.markets')!.stale).toBe(true);
  });
});

describe('audio pipeline', () => {
  it('marks audio unavailable without credentials and never blocks the debate', async () => {
    const t = await m.db().debateTurn.findFirstOrThrow({ where: { audioStatus: 'PENDING' } });
    expect(await m.processAudioJob(t.id)).toBe('unavailable');
    expect((await m.db().debateTurn.findUniqueOrThrow({ where: { id: t.id } })).audioStatus).toBe('UNAVAILABLE');
  });

  it('synthesizes the canonical text once, stores alignment, and reuses the cached asset', async () => {
    vi.stubEnv('ELEVENLABS_API_KEY', 'test-key-not-real');
    vi.stubEnv('ELEVENLABS_VOICE_BULL', 'voiceBull');
    vi.stubEnv('ELEVENLABS_VOICE_BEAR', 'voiceBear');
    vi.stubEnv('ELEVENLABS_VOICE_JUDGE', 'voiceJudge');
    const turn = await m.db().debateTurn.findFirstOrThrow({ where: { actor: 'bull', phase: 'BULL_OPEN' }, orderBy: { createdAt: 'asc' } });
    await m.db().debateTurn.update({ where: { id: turn.id }, data: { audioStatus: 'PENDING' } });
    const sent: string[] = [];
    const realFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      sent.push(body.text);
      const chars = (body.text as string).split('');
      return new Response(JSON.stringify({ audio_base64: Buffer.from('ID3fake-mp3-bytes').toString('base64'), alignment: { characters: chars, character_start_times_seconds: chars.map((_, i) => i * 0.05), character_end_times_seconds: chars.map((_, i) => i * 0.05 + 0.05) } }), { status: 200 });
    }) as typeof fetch;
    try {
      expect(await m.processAudioJob(turn.id)).toBe('ready');
      const stored = await m.db().debateTurn.findUniqueOrThrow({ where: { id: turn.id }, include: { audioAsset: true } });
      expect(sent).toEqual([turn.speechText]);
      expect(stored.audioAsset!.transcriptHash).toBe(turn.textHash);
      expect(stored.audioAsset!.alignmentKind).toBe('character');
      expect(stored.audioAsset!.durationSec).toBeCloseTo(turn.speechText.length * 0.05, 3);
      // Replay or a duplicate job must not call the provider again.
      await m.db().debateTurn.update({ where: { id: turn.id }, data: { audioStatus: 'PENDING' } });
      expect(await m.processAudioJob(turn.id)).toBe('ready');
      expect(sent.length).toBe(1);
      // A different turn with identical text and voice would reuse the same asset (content hash cache).
      expect(await m.db().audioAsset.count({ where: { transcriptHash: turn.textHash } })).toBe(1);
    } finally {
      globalThis.fetch = realFetch;
      vi.unstubAllEnvs();
    }
  });
});

describe('partial outage and secrets', () => {
  it('builds an honest snapshot when a source fails, with no secret material in outputs', async () => {
    await m.db().rawResponse.deleteMany({ where: { requestKey: 'coingecko.markets' } });
    vi.stubEnv('COINGECKO_DEMO_API_KEY', 'cg-secret-should-not-leak');
    const realFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      if (String(url).includes('coingecko')) return new Response('{"error":"down"}', { status: 503 });
      throw new Error(`unexpected network call to ${String(url)}`);
    }) as typeof fetch;
    try {
      const { snapshot, items, outcomes } = await m.createSnapshot('intents-bet');
      expect(outcomes.find((o) => o.key === 'coingecko.markets')!.status).toBe('FAILED');
      const mcap = items.find((i) => i.evidenceId === 'MKT-NEAR-MCAP')!;
      expect(mcap.available).toBe(false);
      expect(mcap.value).toBeNull();
      expect(items.find((i) => i.evidenceId === 'MODEL-BUYBACK-TO-MCAP')!.available).toBe(false);
      expect(items.find((i) => i.evidenceId === 'MODEL-BUYBACK-USD')!.available).toBe(true);
      const stored = JSON.stringify(await m.db().evidenceSnapshot.findUnique({ where: { id: snapshot.id }, include: { items: true } }));
      expect(stored).not.toContain('cg-secret-should-not-leak');
      const attempts = JSON.stringify(await m.db().dataFetchAttempt.findMany({ where: { snapshotId: snapshot.id } }));
      expect(attempts).not.toContain('cg-secret-should-not-leak');
    } finally {
      globalThis.fetch = realFetch;
      vi.unstubAllEnvs();
    }
  }, 120_000);
});

describe('job queue', () => {
  it('claims each job once and lets an expired lease be reclaimed', async () => {
    await m.db().job.deleteMany({});
    await m.enqueue('audio', 'turn-x');
    const a = await m.claimJob('worker-a', ['audio']);
    expect(a?.refId).toBe('turn-x');
    expect(await m.claimJob('worker-b', ['audio'])).toBeNull();
    await m.db().job.update({ where: { id: a!.id }, data: { lockedUntil: new Date(Date.now() - 1000) } });
    const b = await m.claimJob('worker-b', ['audio']);
    expect(b?.id).toBe(a!.id);
    expect(b?.attempts).toBe(2);
  });
});
