import { db } from '@/lib/storage/db';

/** Appends a progress event. The SSE endpoint tails this log, so events are real job state changes. */
export async function emit(sessionId: string, type: string, payload: Record<string, unknown>) {
  await db().jobEvent.create({ data: { sessionId, type, payload: payload as object } });
}

export interface WireEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  at: string;
}

export async function eventsSince(sessionId: string, afterId: bigint, limit = 200): Promise<WireEvent[]> {
  const rows = await db().jobEvent.findMany({ where: { sessionId, id: { gt: afterId } }, orderBy: { id: 'asc' }, take: limit });
  return rows.map((r) => ({ id: r.id.toString(), type: r.type, payload: r.payload as Record<string, unknown>, at: r.createdAt.toISOString() }));
}
