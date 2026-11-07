import { NextResponse } from 'next/server';
import { TOPICS } from '@/lib/topics/topics';

export const dynamic = 'force-static';

/** GET /api/topics: the three server-defined debate topics. */
export function GET() {
  return NextResponse.json({
    topics: TOPICS.map((t) => ({
      slug: t.slug, order: t.order, shortLabel: t.shortLabel, title: t.title, question: t.question, framing: t.framing,
      bullHypothesis: t.bullHypothesis, bearHypothesis: t.bearHypothesis, evidenceRequirements: t.evidenceRequirements, usesModel: t.usesModel,
    })),
  });
}
