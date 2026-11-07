import { NextResponse } from 'next/server';
import { resumeSession } from '@/lib/debate/engine';
import { db } from '@/lib/storage/db';
import { clientKeyFrom, rateLimit } from '@/lib/security/rate-limit';
import { apiError, handler, validPublicId } from '@/lib/security/http';

export const dynamic = 'force-dynamic';

/** POST /api/debates/:id/retry : resumes a FAILED or PARTIAL debate from the failed step. */
export const POST = handler('debates.retry', async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  if (!validPublicId(id, 'd')) return apiError('not_found', 'Debate not found.', 404);
  const rl = await rateLimit(`retry:${clientKeyFrom(req.headers)}`, 6, 3_600_000);
  if (!rl.allowed) return apiError('rate_limited', 'Too many retries this hour.', 429, 600);
  const s = await db().debateSession.findUnique({ where: { publicId: id }, select: { id: true, status: true } });
  if (!s) return apiError('not_found', 'Debate not found.', 404);
  const ok = await resumeSession(s.id);
  if (!ok) return apiError('not_retryable', `This debate is ${s.status.toLowerCase()} and cannot be retried.`, 409);
  return NextResponse.json({ id, resumed: true });
});
