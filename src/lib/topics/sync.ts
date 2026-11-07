import { db } from '@/lib/storage/db';
import { TOPICS } from './topics';

/** Upserts the code-defined topics into the Topic table (the code is the source of truth). */
export async function syncTopics() {
  for (const t of TOPICS) {
    const data = { order: t.order, title: t.title, shortLabel: t.shortLabel, question: t.question, bullHypothesis: t.bullHypothesis, bearHypothesis: t.bearHypothesis, evidenceRequirements: t.evidenceRequirements as object };
    await db().topic.upsert({ where: { slug: t.slug }, update: data, create: { slug: t.slug, ...data } });
  }
}
