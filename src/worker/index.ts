/**
 * Background worker: runs debates and audio synthesis outside the web request lifecycle.
 *
 *   npm run worker
 *
 * Safe to run several copies: jobs are claimed with row locks and leases, and every debate
 * step is committed before the next starts, so a killed worker loses at most one in-flight step.
 */
import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { hostname } from 'node:os';
import { processAudioJob, markAudioFailed } from '@/lib/audio/service';
import { SpeechError } from '@/lib/audio/elevenlabs';
import { advance, failSession } from '@/lib/debate/engine';
import { DebateStepError } from '@/lib/debate/errors';
import { claimJob, completeJob, failJob, renewLease, type ClaimedJob } from '@/lib/debate/jobs';
import { log } from '@/lib/log';
import { db } from '@/lib/storage/db';
import { syncTopics } from '@/lib/topics/sync';
import { runDailyRefresh } from '@/lib/debate/refresh';
import { enqueue } from '@/lib/debate/jobs';

const WORKER_ID = `${hostname()}-${process.pid}-${randomBytes(3).toString('hex')}`;
const CONCURRENCY = Math.max(1, Number(process.env.WORKER_CONCURRENCY ?? 2));
const POLL_MS = 1_000;
const VERSION = process.env.npm_package_version ?? '0.1.0';
let stopping = false;

async function runDebate(job: ClaimedJob) {
  const lease = setInterval(() => { renewLease(job.id, WORKER_ID).catch(() => undefined); }, 20_000);
  try {
    for (let steps = 0; steps < 40 && !stopping; steps++) {
      const { done } = await advance(job.refId);
      if (done) break;
    }
    if (stopping) {
      // Leave the job RUNNING with an expiring lease; another worker resumes it.
      return;
    }
    await completeJob(job.id);
  } catch (e) {
    const err = e as Error;
    const retryable = err instanceof DebateStepError ? err.retryable : true;
    log('error', 'debate_step_failed', { sessionId: job.refId, attempt: job.attempts, retryable, error: err.message });
    const outcome = await failJob(job, err.message, retryable);
    if (outcome === 'failed') await failSession(job.refId, err);
  } finally {
    clearInterval(lease);
  }
}

async function runAudio(job: ClaimedJob) {
  try {
    const r = await processAudioJob(job.refId);
    log('info', 'audio_job', { turnId: job.refId, result: r });
    await completeJob(job.id);
  } catch (e) {
    const err = e as Error;
    const retryable = err instanceof SpeechError ? err.retryable : true;
    log('warn', 'audio_failed', { turnId: job.refId, attempt: job.attempts, retryable, error: err.message });
    const outcome = await failJob(job, err.message, retryable);
    if (outcome === 'failed') await markAudioFailed(job.refId, err.message);
  }
}

async function runRefresh(job: ClaimedJob) {
  const lease = setInterval(() => { renewLease(job.id, WORKER_ID).catch(() => undefined); }, 20_000);
  try {
    const r = await runDailyRefresh();
    log('info', 'daily_refresh', r);
    await completeJob(job.id);
  } catch (e) {
    log('error', 'daily_refresh_failed', { error: (e as Error).message });
    await failJob(job, (e as Error).message, true);
  } finally {
    clearInterval(lease);
  }
}

/** One refresh job per UTC day; the unique (kind, refId) key makes this safe across workers. */
async function scheduleDaily() {
  if (process.env.DISABLE_DAILY_REFRESH === '1') return;
  await enqueue('refresh', new Date().toISOString().slice(0, 10), { maxAttempts: 5 });
}

async function loop(slot: number) {
  while (!stopping) {
    let job: ClaimedJob | null = null;
    try {
      job = await claimJob(WORKER_ID, ['debate', 'audio', 'refresh']);
    } catch (e) {
      log('error', 'claim_failed', { slot, error: (e as Error).message });
    }
    if (!job) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      continue;
    }
    log('info', 'job_claimed', { slot, kind: job.kind, refId: job.refId, attempt: job.attempts });
    if (job.kind === 'debate') await runDebate(job);
    else if (job.kind === 'refresh') await runRefresh(job);
    else await runAudio(job);
  }
}

async function heartbeat() {
  const now = new Date();
  await db().workerHeartbeat.upsert({ where: { workerId: WORKER_ID }, update: { seenAt: now }, create: { workerId: WORKER_ID, startedAt: now, seenAt: now, version: VERSION } });
}

async function main() {
  await syncTopics();
  await heartbeat();
  const hb = setInterval(() => { heartbeat().catch((e) => log('warn', 'heartbeat_failed', { error: (e as Error).message })); }, 10_000);
  await scheduleDaily();
  const daily = setInterval(() => { scheduleDaily().catch(() => undefined); }, 10 * 60_000);
  log('info', 'worker_started', { workerId: WORKER_ID, concurrency: CONCURRENCY });
  const stop = () => { stopping = true; log('info', 'worker_stopping', { workerId: WORKER_ID }); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => loop(i)));
  clearInterval(hb);
  clearInterval(daily);
  await db().workerHeartbeat.delete({ where: { workerId: WORKER_ID } }).catch(() => undefined);
  await db().$disconnect();
  process.exit(0);
}

main().catch((e) => { log('error', 'worker_crashed', { error: (e as Error).message }); process.exit(1); });
