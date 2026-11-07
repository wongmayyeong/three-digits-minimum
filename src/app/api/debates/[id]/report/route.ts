import { NextResponse } from 'next/server';
import { buildReport, reportMarkdown } from '@/lib/debate/report';
import { loadDebateView } from '@/lib/debate/view';
import { apiError, handler, validPublicId } from '@/lib/security/http';

export const dynamic = 'force-dynamic';

/** GET /api/debates/:id/report[?format=md] : machine-readable report, or Markdown for download. */
export const GET = handler('debates.report', async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  if (!validPublicId(id, 'd')) return apiError('not_found', 'Debate not found.', 404);
  const v = await loadDebateView(id);
  if (!v) return apiError('not_found', 'Debate not found.', 404);
  if (v.status !== 'COMPLETE') return apiError('not_complete', 'The report is available once the debate completes.', 409);
  const r = buildReport(v);
  if (!r) return apiError('not_found', 'Report unavailable.', 404);
  if (new URL(req.url).searchParams.get('format') === 'md') {
    return new Response(reportMarkdown(r), { headers: { 'content-type': 'text/markdown; charset=utf-8', 'content-disposition': `attachment; filename="nebube-${id}.md"` } });
  }
  return NextResponse.json(r);
});
