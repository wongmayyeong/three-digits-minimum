export type ObservationType = 'OBSERVED' | 'DERIVED' | 'REPORTED' | 'ASSUMED';
export type Unit = 'USD' | 'NEAR' | 'count' | 'fraction' | 'ratio' | 'text';

export type EvidenceGroup = 'market' | 'intents' | 'onchain' | 'activity' | 'defi' | 'valuation' | 'peers' | 'model' | 'thesis';

export interface SeriesDef {
  label: string;
  unit: Unit;
  /** 'sum7' = weekly sums, 'mean7' = weekly means, 'level' = sampled level. */
  aggregation: 'sum7' | 'mean7' | 'level' | 'month';
  points: [string, number][];
}

export interface EvidenceDraft {
  evidenceId: string;
  metricKey: string;
  group: EvidenceGroup;
  label: string;
  value: number | null;
  valueText: string | null;
  unit: Unit;
  observationType: ObservationType;
  available: boolean;
  sourceName: string;
  sourceUrl: string;
  observedAt: string | null;
  fetchedAt: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  methodology: string;
  transform: string;
  confidence: 'high' | 'medium' | 'low';
  rawResponseHash: string | null;
  validationNotes: string | null;
  series: SeriesDef | null;
  /** Evidence IDs a DERIVED value was computed from. */
  inputs: string[];
}

export interface SourceStatusEntry {
  key: string;
  source: string;
  sourceName: string;
  status: 'OK' | 'FAILED' | 'UNCONFIGURED' | 'SKIPPED';
  stale: boolean;
  cacheHit: boolean;
  fetchedAt: string | null;
  error: string | null;
  sha256: string | null;
  url: string;
}
