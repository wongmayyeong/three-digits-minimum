import { NextResponse } from 'next/server';
import { previewTopic } from '@/lib/debate/preview';
import { rateLimit, clientKeyFrom } from '@/lib/security/rate-limit';
import { apiError, handler } from '@/lib/security/http';
import { getTopic } from '@/lib/topics/topics';

export const dynamic = 'force-dynamic';

/**
 * GET /api/topics/:slug/evidence-preview[?offline=1]
 * Current evidence availability for a topic. Without `offline`, stale sources are refreshed
 * under their freshness policy (responses are cached server-side; providers are not hammered).
 */
export const GET = handler('evidence-preview', async (req: Request, ctx: { params: Promise<{ slug: string }> }) => {
  const { slug } = await ctx.params;
  if (!getTopic(slug)) return apiError('unknown_topic', 'Unknown topic.', 404);
  const offline = new URL(req.url).searchParams.get('offline') === '1';
  if (!offline) {
    const rl = await rateLimit(`preview:${clientKeyFrom(req.headers)}`, 20, 60_000);
    if (!rl.allowed) return apiError('rate_limited', 'Too many refreshes; try again in a minute.', 429, 60);
  }
  const preview = await previewTopic(slug, { offline });
  return NextResponse.json(preview, { headers: { 'cache-control': 'no-store' } });
});
