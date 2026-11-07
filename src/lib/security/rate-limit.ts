/**
 * Fixed-window rate limiter stored in PostgreSQL, so limits hold across restarts and
 * across multiple web instances. One atomic statement per check.
 */
import { createHash } from 'node:crypto';
import { db } from '@/lib/storage/db';

export interface RateResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateResult> {
  const rows = await db().$queryRawUnsafe<{ count: number; windowStart: Date }[]>(
    `INSERT INTO "RateLimitBucket" (key, count, "windowStart") VALUES ($1, 1, now())
     ON CONFLICT (key) DO UPDATE SET
       count = CASE WHEN "RateLimitBucket"."windowStart" < now() - ($2 || ' milliseconds')::interval THEN 1 ELSE "RateLimitBucket".count + 1 END,
       "windowStart" = CASE WHEN "RateLimitBucket"."windowStart" < now() - ($2 || ' milliseconds')::interval THEN now() ELSE "RateLimitBucket"."windowStart" END
     RETURNING count, "windowStart"`,
    key, String(windowMs),
  );
  const row = rows[0]!;
  return { allowed: row.count <= limit, remaining: Math.max(0, limit - row.count), resetAt: new Date(row.windowStart.getTime() + windowMs) };
}

/** Hashes the client address with a server secret; raw IPs are never stored. */
export function clientKeyFrom(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = fwd || headers.get('x-real-ip') || 'unknown';
  const salt = process.env.CLIENT_HASH_SALT || 'nebube-dev-salt';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}
