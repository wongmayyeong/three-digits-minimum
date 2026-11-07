import { NextResponse } from 'next/server';
import { voiceStatus } from '@/lib/audio/voices';
import { enqueue } from '@/lib/debate/jobs';
import { db } from '@/lib/storage/db';
import { clientKeyFrom, rateLimit } from '@/lib/security/rate-limit';
import { apiError, handler, validPublicId } from '@/lib/security/http';

export const dynamic = 'force-dynamic';

/** POST /api/debates/:id/turns/:turnId/audio : retries synthesis for a turn whose audio failed. */
export const POST = handler('turn.audio.retry', async (req: Request, ctx: { params: Promise<{ id: string; turnId: string }> }) => {
  const { id, turnId } = await ctx.params;
  if (!validPublicId(id, 'd') || !/^[a-z0-9]{20,32}$/.test(turnId)) return apiError('not_found', 'Turn not found.', 404);
  const rl = await rateLimit(`audio-retry:${clientKeyFrom(req.headers)}`, 10, 3_600_000);
  if (!rl.allowed) return apiError('rate_limited', 'Too many audio retries this hour.', 429, 600);
  const turn = await db().debateTurn.findFirst({ where: { id: turnId, session: { publicId: id } }, select: { id: true, audioStatus: true } });
  if (!turn) return apiError('not_found', 'Turn not found.', 404);
  if (turn.audioStatus === 'READY') return NextResponse.json({ status: 'READY' });
  if (!voiceStatus().configured) return apiError('voice_unavailable', voiceStatus().reason ?? 'Voice is not configured.', 503);
  await db().debateTurn.update({ where: { id: turn.id }, data: { audioStatus: 'PENDING', audioError: null } });
  await enqueue('audio', turn.id, { reset: true });
  return NextResponse.json({ status: 'PENDING' }, { status: 202 });
});
