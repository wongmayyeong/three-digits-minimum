/**
 * Builds the immutable replay timeline once a debate completes. Replay reads only these
 * rows plus the stored turns and audio: it never calls the LLM and never re-fetches data.
 */
import { db } from '@/lib/storage/db';
import { getTopic } from '@/lib/topics/topics';

export async function buildReplayTimeline(sessionId: string) {
  const existing = await db().replayEvent.count({ where: { sessionId } });
  if (existing > 0) return;
  const session = await db().debateSession.findUniqueOrThrow({ where: { id: sessionId } });
  const topic = getTopic(session.topicSlug)!;
  const snap = await db().evidenceSnapshot.findUniqueOrThrow({ where: { id: session.snapshotId! }, include: { items: { orderBy: { order: 'asc' } } } });
  const turns = await db().debateTurn.findMany({ where: { sessionId }, orderBy: { seq: 'asc' } });

  const requirementIds = topic.evidenceRequirements.flatMap((r) => r.evidenceIds);
  const reveal = requirementIds.filter((id) => snap.items.some((i) => i.evidenceId === id && i.available)).slice(0, 6);

  const events: { kind: string; payload: object }[] = [
    { kind: 'intro', payload: { snapshotId: snap.publicId, cutoffAt: snap.cutoffAt.toISOString(), windowEnd: snap.windowEnd?.toISOString() ?? null, revealEvidenceIds: reveal, contentHash: snap.contentHash } },
    ...turns.filter((t) => t.actor !== 'judge').map((t) => ({ kind: 'turn', payload: { turnId: t.id, phase: t.phase, actor: t.actor, chartCue: t.chartCue, textHash: t.textHash } })),
    ...turns.filter((t) => t.actor === 'judge').map((t) => ({ kind: 'verdict', payload: { turnId: t.id, phase: t.phase, actor: t.actor, textHash: t.textHash } })),
  ];
  await db().replayEvent.createMany({ data: events.map((e, seq) => ({ sessionId, seq, kind: e.kind, payload: e.payload })), skipDuplicates: true });
}
