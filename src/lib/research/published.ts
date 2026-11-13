/**
 * The committed research snapshot (artifacts/research), read at request time so the "Reproduce this research" section
 * quotes the same numbers an offline rebuild produces. The live pages recompute from the newest stored responses in the
 * database, which can be newer than this snapshot.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface PublishedSnapshot {
  windowEnd: string | null;
  methodologyVersion: string | null;
  ladderVersion: string | null;
  responses: number;
  firstFetchedAt: string | null;
  lastFetchedAt: string | null;
  ownMultiple: number | null;
  middleAtOwnMultiple: number | null;
}

interface Canonical {
  methodologyVersion?: string; windowEnd?: string;
  ladder?: { version?: string; multiples?: { key: string; value: number | null }[]; implied?: { growthKey: string; byMultiple: { multipleKey: string; price: number | null }[] }[] };
}

export async function loadPublishedSnapshot(root = process.cwd()): Promise<PublishedSnapshot | null> {
  try {
    const dir = path.join(root, 'artifacts', 'research');
    const c = JSON.parse(await readFile(path.join(dir, 'canonical.json'), 'utf8')) as Canonical;
    const manifest = JSON.parse(await readFile(path.join(dir, 'raw', 'manifest.json'), 'utf8')) as Record<string, { fetchedAt?: string }>;
    const times = Object.values(manifest).map((m) => m.fetchedAt).filter((t): t is string => !!t).sort();
    return {
      windowEnd: c.windowEnd ?? null,
      methodologyVersion: c.methodologyVersion ?? null,
      ladderVersion: c.ladder?.version ?? null,
      responses: Object.keys(manifest).length,
      firstFetchedAt: times[0] ?? null,
      lastFetchedAt: times.at(-1) ?? null,
      ownMultiple: c.ladder?.multiples?.find((m) => m.key === 'today')?.value ?? null,
      middleAtOwnMultiple: c.ladder?.implied?.find((g) => g.growthKey === 'base')?.byMultiple.find((b) => b.multipleKey === 'today')?.price ?? null,
    };
  } catch {
    return null;
  }
}
