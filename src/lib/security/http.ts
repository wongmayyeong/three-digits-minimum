import { NextResponse } from 'next/server';
import { log } from '@/lib/log';

export interface ApiErrorBody {
  error: { code: string; message: string; retryAfterSec?: number };
}

export function apiError(code: string, message: string, status: number, retryAfterSec?: number) {
  const res = NextResponse.json<ApiErrorBody>({ error: { code, message, ...(retryAfterSec ? { retryAfterSec } : {}) } }, { status });
  if (retryAfterSec) res.headers.set('retry-after', String(retryAfterSec));
  res.headers.set('cache-control', 'no-store');
  return res;
}

/** Wraps a route handler: unexpected errors become a structured 500 without leaking internals. */
export function handler<A extends unknown[]>(name: string, fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      log('error', 'api_error', { route: name, error: (e as Error).message });
      return apiError('internal', 'Something went wrong on our side. The error has been logged.', 500);
    }
  };
}

/** Public IDs are short opaque tokens; anything else is rejected before touching the database. */
export function validPublicId(id: string, prefix: 'd' | 'snap'): boolean {
  return new RegExp(`^${prefix}_[A-Za-z0-9_-]{8,20}$`).test(id);
}
