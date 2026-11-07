import { eventsSince } from '@/lib/debate/events';
import { apiError, validPublicId } from '@/lib/security/http';
import { db } from '@/lib/storage/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TERMINAL = new Set(['COMPLETE', 'FAILED', 'PARTIAL']);

/**
 * GET /api/debates/:id/events : Server-Sent Events of real job state changes, tailed from
 * the JobEvent log. Resumable with Last-Event-ID. Clients fall back to polling GET /api/debates/:id.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!validPublicId(id, 'd')) return apiError('not_found', 'Debate not found.', 404);
  const session = await db().debateSession.findUnique({ where: { publicId: id }, select: { id: true } });
  if (!session) return apiError('not_found', 'Debate not found.', 404);

  const lastHeader = req.headers.get('last-event-id') ?? new URL(req.url).searchParams.get('after');
  let cursor = BigInt(/^\d+$/.test(lastHeader ?? '') ? lastHeader! : '0');
  const encoder = new TextEncoder();
  const started = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (s: string) => { if (!closed) controller.enqueue(encoder.encode(s)); };
      req.signal.addEventListener('abort', () => { closed = true; });
      send('retry: 3000\n\n');
      let idle = 0;
      while (!closed && Date.now() - started < 5 * 60_000) {
        const events = await eventsSince(session.id, cursor);
        for (const e of events) {
          send(`id: ${e.id}\nevent: ${e.type}\ndata: ${JSON.stringify({ ...e.payload, at: e.at })}\n\n`);
          cursor = BigInt(e.id);
        }
        if (events.length) idle = 0;
        else if (++idle % 15 === 0) send(': keepalive\n\n');
        const s = await db().debateSession.findUnique({ where: { id: session.id }, select: { status: true } });
        if (s && TERMINAL.has(s.status) && !events.length) {
          // Audio jobs may still finish after COMPLETE; keep streaming them briefly.
          const pending = await db().debateTurn.count({ where: { sessionId: session.id, audioStatus: 'PENDING' } });
          if (!pending) { send('event: end\ndata: {}\n\n'); break; }
        }
        await new Promise((r) => setTimeout(r, 700));
      }
      closed = true;
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store, no-transform', connection: 'keep-alive', 'x-accel-buffering': 'no' },
  });
}
