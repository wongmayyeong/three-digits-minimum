/**
 * PostgreSQL-backed job queue. Jobs are claimed with `FOR UPDATE SKIP LOCKED` and held under
 * a renewable lease. If a worker dies, its lease expires and another worker resumes the job.
 * Because debate steps are idempotent and committed one at a time, a resumed job continues
 * from the last completed step rather than starting over.
 */
import { db } from '@/lib/storage/db';

export type JobKind = 'debate' | 'audio' | 'refresh';

export interface ClaimedJob {
  id: string;
  kind: JobKind;
  refId: string;
  attempts: number;
  maxAttempts: number;
}

export const LEASE_MS = 60_000;

export async function enqueue(kind: JobKind, refId: string, opts: { reset?: boolean; maxAttempts?: number } = {}) {
  await db().job.upsert({
    where: { kind_refId: { kind, refId } },
    update: opts.reset ? { status: 'QUEUED', attempts: 0, runAfter: new Date(), lockedBy: null, lockedUntil: null, lastError: null } : {},
    create: { kind, refId, maxAttempts: opts.maxAttempts ?? (kind === 'audio' ? 3 : 4) },
  });
}

export async function claimJob(workerId: string, kinds: JobKind[]): Promise<ClaimedJob | null> {
  const rows = await db().$queryRawUnsafe<ClaimedJob[]>(
    `UPDATE "Job" SET status = 'RUNNING', "lockedBy" = $1, "lockedUntil" = now() + ($2 || ' milliseconds')::interval,
            attempts = attempts + 1, "updatedAt" = now()
      WHERE id = (
        SELECT id FROM "Job"
         WHERE kind = ANY($3::text[])
           AND ((status = 'QUEUED' AND "runAfter" <= now()) OR (status = 'RUNNING' AND "lockedUntil" < now()))
         ORDER BY CASE kind WHEN 'debate' THEN 0 WHEN 'audio' THEN 1 ELSE 2 END, "createdAt"
         FOR UPDATE SKIP LOCKED
         LIMIT 1)
      RETURNING id, kind, "refId", attempts, "maxAttempts"`,
    workerId, String(LEASE_MS), kinds,
  );
  return rows[0] ?? null;
}

export async function renewLease(jobId: string, workerId: string): Promise<boolean> {
  const n = await db().$executeRawUnsafe(
    `UPDATE "Job" SET "lockedUntil" = now() + ($3 || ' milliseconds')::interval WHERE id = $1 AND "lockedBy" = $2 AND status = 'RUNNING'`,
    jobId, workerId, String(LEASE_MS),
  );
  return n > 0;
}

export async function completeJob(jobId: string) {
  await db().job.update({ where: { id: jobId }, data: { status: 'DONE', lockedBy: null, lockedUntil: null } });
}

/** Schedules a retry with exponential backoff, or marks the job failed when attempts are exhausted. */
export async function failJob(job: ClaimedJob, error: string, retryable: boolean): Promise<'retry' | 'failed'> {
  if (retryable && job.attempts < job.maxAttempts) {
    const delay = Math.min(120_000, 5_000 * 2 ** (job.attempts - 1));
    await db().job.update({ where: { id: job.id }, data: { status: 'QUEUED', runAfter: new Date(Date.now() + delay), lockedBy: null, lockedUntil: null, lastError: error.slice(0, 500) } });
    return 'retry';
  }
  await db().job.update({ where: { id: job.id }, data: { status: 'FAILED', lockedBy: null, lockedUntil: null, lastError: error.slice(0, 500) } });
  return 'failed';
}
