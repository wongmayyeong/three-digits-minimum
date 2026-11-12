/**
 * Creates immutable evidence snapshots. A snapshot is written once, in a single transaction,
 * and never updated. Debates, replays and reports read only from it.
 */
import { randomBytes } from 'node:crypto';
import { dbRawStore } from '@/lib/data/stores';
import { fetchAll, type FetchOutcome } from '@/lib/data/fetcher';
import { buildBackgroundRequests, buildRequestCatalog, sha256, stableStringify, SOURCES } from '@/lib/data/sources';
import { BUYBACK_KEY, fetchBuybackTransfers } from '@/lib/data/fastnear';
import { buildDataset, type ResearchDataset } from '@/lib/research/evidence';
import type { EvidenceDraft, SourceStatusEntry } from '@/lib/research/types';
import { db } from '@/lib/storage/db';
import { getTopic, type TopicDef } from '@/lib/topics/topics';

export function publicId(prefix: string): string {
  return `${prefix}_${randomBytes(9).toString('base64url')}`;
}

export function topicEvidence(ds: ResearchDataset, topic: TopicDef): EvidenceDraft[] {
  const wanted = new Set(topic.evidenceIds);
  return ds.evidence.filter((e) => wanted.has(e.evidenceId));
}

export function sourceStatusFrom(outcomes: FetchOutcome[]): SourceStatusEntry[] {
  return outcomes.map((o) => ({
    key: o.key, source: o.source, sourceName: SOURCES[o.source].name, status: o.status, stale: o.stale, cacheHit: o.cacheHit,
    fetchedAt: o.record?.fetchedAt ?? null, error: o.error, sha256: o.record?.sha256 ?? null, url: o.url,
  }));
}

export function snapshotContentHash(items: EvidenceDraft[], scenarios: unknown): string {
  return sha256(stableStringify({ items: items.map((i) => ({ ...i, fetchedAt: null })), scenarios }));
}

export interface CreateSnapshotOptions {
  forceFresh?: boolean;
  onFetch?: (o: FetchOutcome) => void | Promise<void>;
}

export async function createSnapshot(topicSlug: string, opts: CreateSnapshotOptions = {}) {
  const topic = getTopic(topicSlug);
  if (!topic) throw new Error(`Unknown topic ${topicSlug}`);
  // The id is chosen before fetching so every fetch attempt is linked to this snapshot.
  const snapshotId = `snp${randomBytes(12).toString('hex')}`;
  const ref = { current: snapshotId as string | null };
  const live = await fetchAll(buildRequestCatalog(), dbRawStore(ref), { forceFresh: opts.forceFresh }, opts.onFetch);
  // Monthly era history is collected by the scheduled refresh; snapshots read the stored months.
  const eraStore = { ...dbRawStore(ref), recordAttempt: undefined };
  const era = await fetchAll(buildBackgroundRequests(), eraStore, { offline: true });
  const outcomes = live;
  const buybacks = await fetchBuybackTransfers(eraStore, { offline: true });
  const raws = { ...Object.fromEntries([...live, ...era].map((o) => [o.key, o.record])), [BUYBACK_KEY]: buybacks };
  const ds = buildDataset(raws);
  const items = topicEvidence(ds, topic);
  const scenarios = topic.usesModel ? ds.scenarios : [];
  const stored = era.filter((o) => o.record).length;
  const status = [...sourceStatusFrom(outcomes), { key: 'nearblocks.era.*', source: 'nearblocks', sourceName: SOURCES.nearblocks.name, status: stored ? 'OK' as const : 'SKIPPED' as const, stale: false, cacheHit: true, fetchedAt: null, error: stored === era.length ? null : `${stored} of ${era.length} monthly era counts stored; the rest are collected by the scheduled refresh.`, sha256: null, url: 'https://api.nearblocks.io/v1/account/{contract}/txns-only/count' }];
  const contentHash = snapshotContentHash(items, scenarios);
  const anyFresh = outcomes.some((o) => o.status === 'OK');

  const snap = await db().$transaction(async (tx) => {
    const s = await tx.evidenceSnapshot.create({
      data: {
        id: snapshotId,
        publicId: publicId('snap'),
        topicSlug,
        mode: 'LIVE',
        cutoffAt: new Date(),
        windowEnd: ds.windowEnd ? new Date(`${ds.windowEnd}T00:00:00Z`) : null,
        methodologyVersion: ds.methodologyVersion,
        contentHash,
        sourceStatus: { entries: status, anyFresh, peerWindowEnd: ds.peerWindowEnd, formulaVersion: ds.formulaVersion,
          feeSensitivity: topic.usesModel ? ds.feeSensitivity : null, allocationMatrix: topic.usesModel ? ds.allocationMatrix : null,
          modelBase: topic.usesModel ? ds.modelBase : null, thesis: ds.thesis } as object,
      },
    });
    await tx.evidenceItem.createMany({
      data: items.map((e, i) => ({
        snapshotId: s.id, evidenceId: e.evidenceId, metricKey: e.metricKey, label: e.label, value: e.value, valueText: e.valueText, unit: e.unit,
        observationType: e.observationType, available: e.available, sourceName: e.sourceName, sourceUrl: e.sourceUrl,
        observedAt: parseDate(e.observedAt), fetchedAt: parseDate(e.fetchedAt), periodStart: parseDate(e.periodStart), periodEnd: parseDate(e.periodEnd),
        methodology: e.methodology, transform: `${e.transform}${e.inputs.length ? ` [inputs: ${e.inputs.join(', ')}]` : ''}`, confidence: e.confidence,
        rawResponseHash: e.rawResponseHash, validationNotes: observedNote(e), series: (e.series ?? undefined) as object | undefined, order: i,
      })),
    });
    if (scenarios.length) {
      await tx.scenarioResult.createMany({
        data: scenarios.map((sc) => ({ snapshotId: s.id, formulaVersion: ds.formulaVersion, scenarioKey: sc.key, label: sc.label,
          inputs: { ...sc.inputs, rationale: sc.rationale, adjustments: sc.adjustments } as object, outputs: sc.outputs as object })),
      });
    }
    return s;
  });
  return { snapshot: snap, items, outcomes, dataset: ds };
}

/** Evidence observedAt may be a block reference ("block 123"); keep those in notes instead of a date column. */
function observedNote(e: EvidenceDraft): string | null {
  const ref = e.observedAt && !parseDate(e.observedAt) ? `Observed at ${e.observedAt}.` : null;
  return [ref, e.validationNotes].filter(Boolean).join(' ') || null;
}

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s.length === 10 ? `${s}T00:00:00Z` : s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function loadSnapshot(snapshotId: string) {
  return db().evidenceSnapshot.findUnique({
    where: { id: snapshotId },
    include: { items: { orderBy: { order: 'asc' } }, scenarios: true },
  });
}

export type LoadedSnapshot = NonNullable<Awaited<ReturnType<typeof loadSnapshot>>>;
