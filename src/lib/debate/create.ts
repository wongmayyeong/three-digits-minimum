/**
 * Starts debates and rematches. Validates the topic against the server list, enforces
 * per-client and global limits, and is idempotent on the client-supplied key.
 */
import { resolveLlm } from '@/lib/ai/provider';
import { PROMPT_VERSION } from '@/lib/ai/prompts';
import { voiceStatus } from '@/lib/audio/voices';
import { rateLimit } from '@/lib/security/rate-limit';
import { db } from '@/lib/storage/db';
import { getTopic } from '@/lib/topics/topics';
import { emit } from './events';
import { enqueue } from './jobs';
import { publicId } from './snapshot';
import { dailyBudgetUsd, spentTodayUsd } from './budget';

export class CreateError extends Error {
  constructor(public code: 'unknown_topic' | 'ai_unavailable' | 'rate_limited' | 'daily_cap' | 'budget' | 'not_found' | 'not_complete', message: string, public status: number, public retryAfterSec?: number) {
    super(message);
  }
}

const num = (k: string, d: number) => {
  const v = Number(process.env[k]);
  return Number.isFinite(v) && v > 0 ? v : d;
};

export async function createDebate(args: { topicSlug: string; clientKey: string; idempotencyKey?: string | null; parentPublicId?: string | null }) {
  const topic = getTopic(args.topicSlug);
  if (!topic) throw new CreateError('unknown_topic', 'Unknown topic.', 400);

  if (args.idempotencyKey) {
    const existing = await db().debateSession.findUnique({ where: { idempotencyKey: args.idempotencyKey } });
    if (existing) return { publicId: existing.publicId, reused: true };
  }

  const llm = resolveLlm();
  if (!llm.status.configured) throw new CreateError('ai_unavailable', 'AI debates are unavailable on this deployment: no language model is configured. Existing replays still work.', 503);

  let parent = null;
  if (args.parentPublicId) {
    parent = await db().debateSession.findUnique({ where: { publicId: args.parentPublicId } });
    if (!parent) throw new CreateError('not_found', 'Debate not found.', 404);
    if (parent.status !== 'COMPLETE') throw new CreateError('not_complete', 'A rematch can start only after the original debate completes.', 409);
  }

  // A client that double-clicks gets its in-flight debate back instead of a second one.
  const recent = await db().debateSession.findFirst({
    where: { clientKeyHash: args.clientKey, topicSlug: topic.slug, parentId: parent?.id ?? null, createdAt: { gte: new Date(Date.now() - 120_000) }, status: { notIn: ['COMPLETE', 'FAILED', 'PARTIAL'] } },
    orderBy: { createdAt: 'desc' },
  });
  if (recent) return { publicId: recent.publicId, reused: true };

  const perHour = await rateLimit(`debate:hour:${args.clientKey}`, num('RATE_LIMIT_DEBATES_PER_HOUR', 4), 3_600_000);
  if (!perHour.allowed) throw new CreateError('rate_limited', 'You have started the maximum number of debates for this hour.', 429, Math.ceil((perHour.resetAt.getTime() - Date.now()) / 1000));
  const startOfDay = new Date(); startOfDay.setUTCHours(0, 0, 0, 0);
  const today = await db().debateSession.count({ where: { createdAt: { gte: startOfDay }, synthetic: false } });
  if (today >= num('MAX_DEBATES_PER_DAY', 60)) throw new CreateError('daily_cap', 'The arena has reached today\'s debate limit. Replays remain available; new debates resume at 00:00 UTC.', 429);
  if ((await spentTodayUsd()) >= dailyBudgetUsd()) throw new CreateError('budget', 'Today\'s AI budget is spent. Replays remain available; new debates resume at 00:00 UTC.', 429);

  const synthetic = llm.status.provider === 'fixture';
  const session = await db().debateSession.create({
    data: {
      publicId: publicId('d'),
      topicSlug: topic.slug,
      parentId: parent?.id ?? null,
      aiProvider: llm.status.provider,
      aiModel: llm.status.model,
      promptVersion: PROMPT_VERSION,
      voiceProvider: voiceStatus().provider,
      synthetic,
      isPublic: !synthetic,
      idempotencyKey: args.idempotencyKey ?? null,
      clientKeyHash: args.clientKey,
    },
  });
  await emit(session.id, 'status', { status: 'PENDING' });
  await enqueue('debate', session.id);
  return { publicId: session.publicId, reused: false };
}
