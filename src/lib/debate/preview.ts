/**
 * Evidence preview for topic pages. Built from the same catalog and builder as snapshots,
 * but not frozen. `offline` uses only stored responses (fast page render); otherwise
 * responses older than their TTL are refreshed (still paced and cached).
 */
import { fetchAll } from '@/lib/data/fetcher';
import { buildEraRequests, buildRequestCatalog } from '@/lib/data/sources';
import { dbRawStore } from '@/lib/data/stores';
import { buildDataset } from '@/lib/research/evidence';
import type { EvidenceDraft, SourceStatusEntry } from '@/lib/research/types';
import { getTopic } from '@/lib/topics/topics';
import { sourceStatusFrom, topicEvidence } from './snapshot';

export interface TopicPreview {
  slug: string;
  generatedAt: string;
  oldestSourceAt: string | null;
  newestSourceAt: string | null;
  windowEnd: string | null;
  items: Pick<EvidenceDraft, 'evidenceId' | 'label' | 'value' | 'valueText' | 'unit' | 'observationType' | 'available' | 'sourceName' | 'sourceUrl' | 'periodStart' | 'periodEnd' | 'validationNotes' | 'series' | 'rawResponseHash' | 'methodology'>[];
  requirements: { label: string; evidenceIds: string[]; available: number; total: number }[];
  sources: SourceStatusEntry[];
  scenarios: ReturnType<typeof buildDataset>['scenarios'] | null;
  modelBase: ReturnType<typeof buildDataset>['modelBase'] | null;
  thesis: ReturnType<typeof buildDataset>['thesis'];
  ladder: ReturnType<typeof buildDataset>['ladder'];
  feeSensitivity: ReturnType<typeof buildDataset>['feeSensitivity'];
  eraMonthsStored: number;
  eraMonthsTotal: number;
}

export async function previewTopic(slug: string, opts: { offline: boolean }): Promise<TopicPreview | null> {
  const topic = getTopic(slug);
  if (!topic) return null;
  const outcomes = await fetchAll(buildRequestCatalog(), { ...dbRawStore(), recordAttempt: opts.offline ? undefined : dbRawStore().recordAttempt }, { offline: opts.offline });
  const era = await fetchAll(buildEraRequests(), { ...dbRawStore(), recordAttempt: undefined }, { offline: true });
  const ds = buildDataset(Object.fromEntries([...outcomes, ...era].map((o) => [o.key, o.record])));
  const items = topicEvidence(ds, topic);
  const times = outcomes.map((o) => o.record?.fetchedAt).filter((t): t is string => !!t).sort();
  return {
    slug,
    generatedAt: new Date().toISOString(),
    oldestSourceAt: times[0] ?? null,
    newestSourceAt: times[times.length - 1] ?? null,
    windowEnd: ds.windowEnd,
    items: items.map((e) => ({ evidenceId: e.evidenceId, label: e.label, value: e.value, valueText: e.valueText, unit: e.unit, observationType: e.observationType, available: e.available, sourceName: e.sourceName, sourceUrl: e.sourceUrl, periodStart: e.periodStart, periodEnd: e.periodEnd, validationNotes: e.validationNotes, series: e.series, rawResponseHash: e.rawResponseHash, methodology: e.methodology })),
    requirements: topic.evidenceRequirements.map((r) => ({ label: r.label, evidenceIds: r.evidenceIds, total: r.evidenceIds.length, available: r.evidenceIds.filter((id) => items.find((i) => i.evidenceId === id)?.available).length })),
    sources: sourceStatusFrom(outcomes),
    scenarios: topic.usesModel ? ds.scenarios : null,
    modelBase: topic.usesModel ? ds.modelBase : null,
    thesis: ds.thesis,
    ladder: ds.ladder,
    feeSensitivity: ds.feeSensitivity,
    eraMonthsStored: era.filter((o) => o.record).length,
    eraMonthsTotal: era.length,
  };
}
