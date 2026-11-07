/** Local smoke test: creates one debate and waits for the worker to finish it. */
import 'dotenv/config';
import { createDebate } from '@/lib/debate/create';
import { loadDebateView } from '@/lib/debate/view';
import { syncTopics } from '@/lib/topics/sync';

const topic = process.argv[2] ?? 'intents-bet';
await syncTopics();
const { publicId } = await createDebate({ topicSlug: topic, clientKey: `smoke-${Date.now()}`, idempotencyKey: null });
console.log('created', publicId);
const started = Date.now();
for (;;) {
  const v = await loadDebateView(publicId);
  if (!v) throw new Error('missing');
  if (['COMPLETE', 'FAILED', 'PARTIAL'].includes(v.status)) {
    console.log(v.status, v.failureReason ?? '', 'turns', v.turns.length, 'winner', v.verdict?.winner, 'items', v.snapshot?.items.length, `${Math.round((Date.now() - started) / 1000)}s`);
    for (const t of v.turns) console.log(t.phase, t.actor, t.audit.wordCount, 'words', t.claims.map((c) => `${c.id}:${c.status}`).join(' '), 'unverified', t.audit.unverifiedNumbers.join('|'), 'audio', t.audioStatus);
    process.exit(v.status === 'COMPLETE' ? 0 : 1);
  }
  await new Promise((r) => setTimeout(r, 1000));
}
