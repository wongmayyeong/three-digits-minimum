import { NextResponse } from 'next/server';
import { snapshotDelta } from '@/lib/debate/delta';
import { loadDebateView } from '@/lib/debate/view';
import { apiError, handler, validPublicId } from '@/lib/security/http';

export const dynamic = 'force-dynamic';

/** GET /api/debates/:id/delta : what changed between this rematch's snapshot and its parent's. */
export const GET = handler('debates.delta', async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  if (!validPublicId(id, 'd')) return apiError('not_found', 'Debate not found.', 404);
  const v = await loadDebateView(id);
  if (!v) return apiError('not_found', 'Debate not found.', 404);
  if (!v.parentId) return apiError('not_rematch', 'This debate is not a rematch.', 404);
  const parent = await loadDebateView(v.parentId);
  if (!parent?.snapshot || !v.snapshot) return apiError('not_ready', 'The new snapshot is not ready yet.', 409);
  return NextResponse.json({ previous: { debateId: parent.id, snapshotId: parent.snapshot.id, cutoffAt: parent.snapshot.cutoffAt }, current: { debateId: v.id, snapshotId: v.snapshot.id, cutoffAt: v.snapshot.cutoffAt }, rows: snapshotDelta(parent.snapshot.items, v.snapshot.items) });
});
