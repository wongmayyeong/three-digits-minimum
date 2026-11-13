/**
 * Executes catalog requests with timeouts, bounded retries with backoff, per-source pacing,
 * response-size limits and content hashing. Storage is pluggable (database in the app,
 * files in the research CLI) so both paths share identical fetch and projection logic.
 */
import { SOURCES, sha256, stableStringify, type HttpRequestDef, type SourceId } from './sources';

export interface RawRecord {
  key: string;
  source: SourceId;
  url: string;
  sha256: string;
  fetchedAt: string;
  body: unknown;
}

export interface FetchOutcome {
  key: string;
  source: SourceId;
  url: string;
  status: 'OK' | 'FAILED' | 'UNCONFIGURED' | 'SKIPPED';
  httpStatus: number | null;
  cacheHit: boolean;
  durationMs: number;
  error: string | null;
  record: RawRecord | null;
  /** True when a failed fetch fell back to an older cached copy (shown as stale). */
  stale: boolean;
}

export interface RawStore {
  latest(key: string): Promise<RawRecord | null>;
  put(record: RawRecord): Promise<void>;
  recordAttempt?(outcome: FetchOutcome): Promise<void>;
}

const UA = 'near-thesis-research/0.1 (evidence-first NEAR research)';
const MAX_BYTES = 25 * 1024 * 1024;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const lastCall = new Map<SourceId, number>();
/** Tests set THESIS_PACING_SCALE=0: providers are unreachable there, so waiting between failed calls proves nothing. */
const PACING_SCALE = Number.isFinite(Number(process.env.THESIS_PACING_SCALE)) && process.env.THESIS_PACING_SCALE !== undefined ? Number(process.env.THESIS_PACING_SCALE) : 1;
const queues = new Map<SourceId, Promise<unknown>>();

/** Serializes requests per source and enforces the source's minimum gap. */
function paced<T>(source: SourceId, fn: () => Promise<T>): Promise<T> {
  const prev = queues.get(source) ?? Promise.resolve();
  const run = prev.catch(() => undefined).then(async () => {
    const gap = SOURCES[source].minGapMs * PACING_SCALE;
    const wait = (lastCall.get(source) ?? 0) + gap - Date.now();
    if (wait > 0) await sleep(wait);
    try { return await fn(); } finally { lastCall.set(source, Date.now()); }
  });
  queues.set(source, run);
  return run;
}

export interface FetchOptions {
  /** Ignore TTL and fetch fresh (rematch). Still paced and rate limited. */
  forceFresh?: boolean;
  /** Never touch the network; use stored copies only (offline reproduction). */
  offline?: boolean;
  timeoutMs?: number;
  retries?: number;
  fetchImpl?: typeof fetch;
}

class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function doFetch(def: HttpRequestDef, opts: FetchOptions): Promise<{ status: number; json: unknown }> {
  const headers = def.headers?.();
  if (headers === null) throw new Error('credential missing');
  const f = opts.fetchImpl ?? fetch;
  const res = await f(def.url, {
    method: def.method ?? 'GET',
    headers: { 'user-agent': UA, accept: 'application/json', ...(def.body ? { 'content-type': 'application/json' } : {}), ...(headers ?? {}) },
    body: def.body ? JSON.stringify(def.body) : undefined,
    signal: AbortSignal.timeout(opts.timeoutMs ?? 30_000),
    cache: 'no-store',
  });
  const len = Number(res.headers.get('content-length') ?? 0);
  if (len > MAX_BYTES) throw new HttpError(res.status, `response too large (${len} bytes)`);
  const text = await res.text();
  if (text.length > MAX_BYTES) throw new HttpError(res.status, 'response too large');
  if (!res.ok) throw new HttpError(res.status, `HTTP ${res.status}: ${text.slice(0, 160).replace(/\s+/g, ' ')}`);
  try {
    return { status: res.status, json: JSON.parse(text) };
  } catch {
    throw new HttpError(res.status, 'response was not valid JSON');
  }
}

export async function fetchOne(def: HttpRequestDef, store: RawStore, opts: FetchOptions = {}): Promise<FetchOutcome> {
  const started = Date.now();
  const base = { key: def.key, source: def.source, url: def.url };
  const finish = async (o: Omit<FetchOutcome, 'durationMs' | 'key' | 'source' | 'url'>): Promise<FetchOutcome> => {
    const outcome: FetchOutcome = { ...base, ...o, durationMs: Date.now() - started };
    await store.recordAttempt?.(outcome).catch(() => undefined);
    return outcome;
  };

  const cached = await store.latest(def.key);
  if (opts.offline) {
    return cached
      ? finish({ status: 'OK', httpStatus: null, cacheHit: true, error: null, record: cached, stale: false })
      : finish({ status: 'SKIPPED', httpStatus: null, cacheHit: false, error: 'offline mode and no stored copy', record: null, stale: false });
  }

  const reason = def.unavailable?.();
  if (reason) return finish({ status: 'UNCONFIGURED', httpStatus: null, cacheHit: false, error: reason, record: null, stale: false });

  if (cached && !opts.forceFresh && Date.now() - Date.parse(cached.fetchedAt) < def.ttlMs) {
    return finish({ status: 'OK', httpStatus: null, cacheHit: true, error: null, record: cached, stale: false });
  }

  const retries = opts.retries ?? 2;
  let lastErr: Error | null = null;
  let lastStatus: number | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { status, json } = await paced(def.source, () => doFetch(def, opts));
      const body = def.project(json);
      const text = stableStringify(body);
      const record: RawRecord = { ...base, sha256: sha256(text), fetchedAt: new Date().toISOString(), body: JSON.parse(text) };
      await store.put(record);
      return finish({ status: 'OK', httpStatus: status, cacheHit: false, error: null, record, stale: false });
    } catch (e) {
      lastErr = e as Error;
      lastStatus = e instanceof HttpError ? e.status : null;
      // Client errors other than rate limiting will not succeed on retry.
      if (lastStatus !== null && lastStatus >= 400 && lastStatus < 500 && lastStatus !== 429) break;
      if (attempt < retries) await sleep((lastStatus === 429 ? 15_000 * (attempt + 1) : 1_500 * 2 ** attempt) * PACING_SCALE);
    }
  }
  const error = lastErr?.message ?? 'unknown error';
  if (cached) {
    return finish({ status: 'FAILED', httpStatus: lastStatus, cacheHit: true, error: `${error} (using stored copy from ${cached.fetchedAt})`, record: cached, stale: true });
  }
  return finish({ status: 'FAILED', httpStatus: lastStatus, cacheHit: false, error, record: null, stale: false });
}

/** Runs requests in parallel across sources; requests to the same source are paced. */
export async function fetchAll(defs: HttpRequestDef[], store: RawStore, opts: FetchOptions = {}, onProgress?: (o: FetchOutcome) => void | Promise<void>): Promise<FetchOutcome[]> {
  return Promise.all(defs.map(async (d) => {
    const o = await fetchOne(d, store, opts);
    await onProgress?.(o);
    return o;
  }));
}
