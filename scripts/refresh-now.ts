/** Admin CLI: run the daily research refresh immediately (fetches era months, freezes a snapshot). */
import 'dotenv/config';
import { runDailyRefresh } from '@/lib/debate/refresh';
import { syncTopics } from '@/lib/topics/sync';

await syncTopics();
const r = await runDailyRefresh();
console.log(r);
process.exit(0);
