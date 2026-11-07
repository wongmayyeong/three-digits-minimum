import { NextResponse } from 'next/server';
import { loadDebateView } from '@/lib/debate/view';
import { apiError, handler, validPublicId } from '@/lib/security/http';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debates/:id/replay : the immutable ordered scene timeline with stored turns,
 * audio references and the frozen snapshot. Reads the database only: no LLM, no fetch.
 */
export const GET = handler('debates.replay', async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  if (!validPublicId(id, 'd')) return apiError('not_found', 'Debate not found.', 404);
  const v = await loadDebateView(id);
  if (!v) return apiError('not_found', 'Debate not found.', 404);
  if (v.status !== 'COMPLETE') return apiError('not_complete', 'Replay is available once the debate completes.', 409);
  return NextResponse.json({ id: v.id, topicSlug: v.topicSlug, timeline: v.replay, turns: v.turns, verdict: v.verdict, snapshot: v.snapshot }, { headers: { 'cache-control': 'public, max-age=60' } });
});
