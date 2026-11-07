import { NextResponse } from 'next/server';
import { loadDebateView } from '@/lib/debate/view';
import { apiError, handler, validPublicId } from '@/lib/security/http';

export const dynamic = 'force-dynamic';

/** GET /api/debates/:id : state, turns, verdict and the frozen evidence snapshot. */
export const GET = handler('debates.get', async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  if (!validPublicId(id, 'd')) return apiError('not_found', 'Debate not found.', 404);
  const view = await loadDebateView(id);
  if (!view) return apiError('not_found', 'Debate not found.', 404);
  return NextResponse.json(view, { headers: { 'cache-control': 'no-store' } });
});
