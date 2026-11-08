/**
 * Admin CLI: refresh sources, freeze a snapshot and start a new debate episode now.
 * The worker must be running to generate it.
 *
 *   npm run debate:new
 */
import 'dotenv/config';
import { resolveLlm } from '@/lib/ai/provider';
import { createEpisode } from '@/lib/debate/refresh';
import { createSnapshot } from '@/lib/debate/snapshot';
import { syncTopics } from '@/lib/topics/sync';
import { THESIS_TOPIC } from '@/lib/topics/topics';

const llm = resolveLlm().status;
if (!llm.configured) {
  console.error(llm.reason);
  process.exit(2);
}
await syncTopics();
console.log('Freezing a fresh evidence snapshot...');
const { snapshot, dataset } = await createSnapshot(THESIS_TOPIC.slug, {});
console.log(`Snapshot ${snapshot.publicId}: verdict ${dataset.thesis.verdict} (${dataset.thesis.confidence} confidence).`);
const id = await createEpisode(snapshot.id, 'manual');
console.log(`Episode ${id} queued${llm.provider === 'fixture' ? ' (SYNTHETIC fixture, not AI)' : ` with ${llm.model}`}. Watch it at /debates/${id}`);
process.exit(0);
