import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { FetchOutcome, RawRecord, RawStore } from './fetcher';
import { SOURCES } from './sources';
import { db } from '@/lib/storage/db';

/** Database-backed store used by the app and worker. Raw bodies are content-addressed. */
export function dbRawStore(snapshotRef?: { current: string | null }): RawStore {
  return {
    async latest(key) {
      const row = await db().rawResponse.findFirst({ where: { requestKey: key }, orderBy: { fetchedAt: 'desc' } });
      return row
        ? { key, source: row.sourceId as RawRecord['source'], url: row.url, sha256: row.sha256, fetchedAt: row.fetchedAt.toISOString(), body: row.body }
        : null;
    },
    async put(r) {
      await db().rawResponse.upsert({
        where: { sha256: r.sha256 },
        // Same content fetched again: bump fetchedAt so freshness reflects the latest confirmation.
        update: { fetchedAt: new Date(r.fetchedAt) },
        create: { sha256: r.sha256, requestKey: r.key, sourceId: r.source, url: r.url, body: r.body as object, fetchedAt: new Date(r.fetchedAt) },
      });
    },
    async recordAttempt(o: FetchOutcome) {
      const meta = SOURCES[o.source];
      await db().dataSource.upsert({
        where: { id: meta.id },
        update: { name: meta.name, kind: meta.kind, baseUrl: meta.baseUrl, requiresCredential: meta.requiresCredential },
        create: { id: meta.id, name: meta.name, kind: meta.kind, baseUrl: meta.baseUrl, requiresCredential: meta.requiresCredential },
      });
      await db().dataFetchAttempt.create({
        data: {
          sourceId: o.source, requestKey: o.key, url: o.url, status: o.status, httpStatus: o.httpStatus, cacheHit: o.cacheHit,
          durationMs: o.durationMs, error: o.error?.slice(0, 500) ?? null, responseSha256: o.record?.sha256 ?? null,
          bytes: o.record ? JSON.stringify(o.record.body).length : null, snapshotId: snapshotRef?.current ?? null,
        },
      });
    },
  };
}

interface ManifestEntry {
  key: string;
  source: string;
  url: string;
  sha256: string;
  fetchedAt: string;
  file: string;
  lastAttempt?: unknown;
}

/** File-backed store used by `npm run research:refresh`, writing under artifacts/research/raw. */
export function fileRawStore(root: string): RawStore & { manifest(): Record<string, ManifestEntry> } {
  const manifestPath = join(root, 'manifest.json');
  const manifest: Record<string, ManifestEntry> = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
  const save = () => {
    mkdirSync(root, { recursive: true });
    const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
    writeFileSync(manifestPath, JSON.stringify(sorted, null, 1) + '\n');
  };
  return {
    async latest(key) {
      const m = manifest[key];
      if (!m) return null;
      const abs = join(root, m.file);
      if (!existsSync(abs)) return null;
      return { key, source: m.source as RawRecord['source'], url: m.url, sha256: m.sha256, fetchedAt: m.fetchedAt, body: JSON.parse(readFileSync(abs, 'utf8')) };
    },
    async put(r) {
      const file = `${r.key}.json`;
      const abs = join(root, file);
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, JSON.stringify(r.body));
      manifest[r.key] = { key: r.key, source: r.source, url: r.url, sha256: r.sha256, fetchedAt: r.fetchedAt, file };
      save();
    },
    async recordAttempt(o) {
      const m = manifest[o.key];
      if (m && !o.cacheHit) m.lastAttempt = { at: new Date().toISOString(), status: o.status, error: o.error };
      save();
    },
    manifest: () => manifest,
  };
}
