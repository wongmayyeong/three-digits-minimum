import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createDebate, CreateError } from '@/lib/debate/create';
import { listLibrary } from '@/lib/debate/view';
import { clientKeyFrom } from '@/lib/security/rate-limit';
import { apiError, handler } from '@/lib/security/http';
import { TOPIC_SLUGS } from '@/lib/topics/topics';

export const dynamic = 'force-dynamic';

const Body = z.object({ topic: z.enum(TOPIC_SLUGS) }).strict();

/** POST /api/debates { topic } with optional Idempotency-Key header. Returns 202 with the debate id. */
export const POST = handler('debates.create', async (req: Request) => {
  if (!(req.headers.get('content-type') ?? '').includes('application/json')) return apiError('bad_request', 'Expected application/json.', 415);
  let json: unknown;
  try { json = await req.json(); } catch { return apiError('bad_request', 'Invalid JSON body.', 400); }
  const parsed = Body.safeParse(json);
  if (!parsed.success) return apiError('bad_request', 'Body must be {"topic": one of intents-bet, growth-or-hype, long-game}.', 400);
  const idem = req.headers.get('idempotency-key');
  if (idem && !/^[A-Za-z0-9_-]{8,64}$/.test(idem)) return apiError('bad_request', 'Idempotency-Key must be 8-64 URL-safe characters.', 400);
  try {
    const r = await createDebate({ topicSlug: parsed.data.topic, clientKey: clientKeyFrom(req.headers), idempotencyKey: idem });
    return NextResponse.json({ id: r.publicId, reused: r.reused, url: `/debates/${r.publicId}` }, { status: r.reused ? 200 : 202 });
  } catch (e) {
    if (e instanceof CreateError) return apiError(e.code, e.message, e.status, e.retryAfterSec);
    throw e;
  }
});

/** GET /api/debates?topic=&winner=&from=&to=&cursor=&limit= : paginated public replay library. */
export const GET = handler('debates.list', async (req: Request) => {
  const p = new URL(req.url).searchParams;
  const date = (k: string) => {
    const v = p.get(k);
    if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
    return new Date(`${v}T${k === 'to' ? '23:59:59' : '00:00:00'}Z`);
  };
  const cursor = p.get('cursor');
  const r = await listLibrary({
    topic: p.get('topic') ?? undefined, winner: p.get('winner') ?? undefined, from: date('from'), to: date('to'),
    cursor: cursor && /^d_[A-Za-z0-9_-]{8,20}$/.test(cursor) ? cursor : undefined, limit: Number(p.get('limit') ?? 20) || 20,
  });
  return NextResponse.json(r, { headers: { 'cache-control': 'no-store' } });
});
