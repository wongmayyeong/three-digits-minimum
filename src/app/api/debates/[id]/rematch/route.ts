import { NextResponse } from 'next/server';
import { createDebate, CreateError } from '@/lib/debate/create';
import { db } from '@/lib/storage/db';
import { clientKeyFrom } from '@/lib/security/rate-limit';
import { apiError, handler, validPublicId } from '@/lib/security/http';

export const dynamic = 'force-dynamic';

/**
 * POST /api/debates/:id/rematch : starts a new, independent debate on the same topic with a
 * freshly fetched snapshot. The original debate and its snapshot are never modified.
 */
export const POST = handler('debates.rematch', async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  if (!validPublicId(id, 'd')) return apiError('not_found', 'Debate not found.', 404);
  const parent = await db().debateSession.findUnique({ where: { publicId: id }, select: { topicSlug: true } });
  if (!parent) return apiError('not_found', 'Debate not found.', 404);
  const idem = req.headers.get('idempotency-key');
  try {
    const r = await createDebate({ topicSlug: parent.topicSlug, clientKey: clientKeyFrom(req.headers), idempotencyKey: idem && /^[A-Za-z0-9_-]{8,64}$/.test(idem) ? idem : null, parentPublicId: id });
    return NextResponse.json({ id: r.publicId, reused: r.reused, url: `/debates/${r.publicId}` }, { status: r.reused ? 200 : 202 });
  } catch (e) {
    if (e instanceof CreateError) return apiError(e.code, e.message, e.status, e.retryAfterSec);
    throw e;
  }
});
