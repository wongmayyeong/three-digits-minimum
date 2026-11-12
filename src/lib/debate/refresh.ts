/**
 * Daily research refresh (worker job "refresh", one per UTC day):
 *  1. Fetch public sources past their freshness window, plus any monthly era counts not stored yet.
 *  2. Freeze a dated evidence snapshot (kept forever, so every day's verdict can be re-run).
 *  3. Start a new debate episode only if the verdict changed since the last episode and the
 *     last episode is at least 7 days old (or no episode exists yet and an LLM is configured).
 * No AI is used in steps 1 and 2.
 */
import { resolveLlm } from '@/lib/ai/provider';
import { PROMPT_VERSION } from '@/lib/ai/prompts';
import { voiceStatus } from '@/lib/audio/voices';
import { fetchAll } from '@/lib/data/fetcher';
import { buildBackgroundRequests } from '@/lib/data/sources';
import { fetchBuybackTransfers } from '@/lib/data/fastnear';
import { dbRawStore } from '@/lib/data/stores';
import { log } from '@/lib/log';
import { db } from '@/lib/storage/db';
import { THESIS_TOPIC } from '@/lib/topics/topics';
import { emit } from './events';
import { enqueue } from './jobs';
import { createSnapshot, publicId } from './snapshot';

export const EPISODE_MIN_DAYS = 7;

interface StoredThesis {
  verdict?: string;
  sections?: { id: number; verdict: string }[];
}

export function verdictSignature(t: StoredThesis | null | undefined): string | null {
  if (!t?.verdict) return null;
  return [t.verdict, ...(t.sections ?? []).map((s) => `${s.id}:${s.verdict}`)].join('|');
}

export async function runDailyRefresh(): Promise<{ snapshotId: string; episode: string | null; reason: string }> {
  const eras = buildBackgroundRequests();
  const store = dbRawStore();
  const eraOut = await fetchAll(eras, store, {});
  await fetchBuybackTransfers(store, { offline: false });
  const fetched = eraOut.filter((o) => o.status === 'OK' && !o.cacheHit).length;
  log('info', 'era_months', { total: eras.length, fetched, failed: eraOut.filter((o) => o.status !== 'OK').length });

  const { snapshot, dataset } = await createSnapshot(THESIS_TOPIC.slug, {});
  const sig = verdictSignature(dataset.thesis);

  const last = await db().debateSession.findFirst({
    where: { topicSlug: THESIS_TOPIC.slug, status: { in: ['COMPLETE', 'PENDING', 'FETCHING', 'VALIDATING', 'MODELING', 'BULL_OPEN', 'BEAR_OPEN', 'BULL_REBUTTAL', 'BEAR_REBUTTAL', 'BULL_CLOSE', 'BEAR_CLOSE', 'JUDGING'] }, synthetic: false },
    orderBy: { createdAt: 'desc' },
    include: { snapshot: { select: { sourceStatus: true } } },
  });
  const llm = resolveLlm().status;
  if (!llm.configured || llm.provider === 'fixture') return { snapshotId: snapshot.publicId, episode: null, reason: 'No production language model configured; research refreshed, no debate generated.' };
  if (last && last.status !== 'COMPLETE') return { snapshotId: snapshot.publicId, episode: null, reason: 'An episode is still being generated.' };
  if (last) {
    const lastSig = verdictSignature((last.snapshot?.sourceStatus as { thesis?: StoredThesis } | null)?.thesis);
    const ageDays = (Date.now() - last.createdAt.getTime()) / 86_400_000;
    if (lastSig === sig) return { snapshotId: snapshot.publicId, episode: null, reason: 'Verdict unchanged since the last episode.' };
    if (ageDays < EPISODE_MIN_DAYS) return { snapshotId: snapshot.publicId, episode: null, reason: `Verdict changed, but the last episode is only ${ageDays.toFixed(1)} days old.` };
  }
  const episode = await createEpisode(snapshot.id, last ? 'verdict changed' : 'first episode');
  return { snapshotId: snapshot.publicId, episode, reason: last ? 'Verdict changed; new episode started.' : 'First episode started.' };
}

/** Creates a debate on an existing snapshot (scheduled refresh or the `debate:new` CLI). */
export async function createEpisode(snapshotId: string, why: string, opts: { synthetic?: boolean } = {}): Promise<string> {
  const llm = resolveLlm().status;
  const synthetic = opts.synthetic ?? llm.provider === 'fixture';
  const parent = await db().debateSession.findFirst({ where: { topicSlug: THESIS_TOPIC.slug, status: 'COMPLETE', synthetic }, orderBy: { createdAt: 'desc' } });
  const s = await db().debateSession.create({
    data: {
      publicId: publicId('d'), topicSlug: THESIS_TOPIC.slug, snapshotId, parentId: parent?.id ?? null,
      aiProvider: llm.provider, aiModel: llm.model, promptVersion: PROMPT_VERSION, voiceProvider: voiceStatus().provider,
      synthetic, isPublic: !synthetic, clientKeyHash: 'system',
    },
  });
  await emit(s.id, 'status', { status: 'PENDING', reason: why });
  await enqueue('debate', s.id);
  return s.publicId;
}
