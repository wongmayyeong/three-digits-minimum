import { describe, expect, it } from 'vitest';
import { completeMonths } from '@/lib/data/sources';
import type { RawRecord } from '@/lib/data/fetcher';
import { decide, eraResults, evidenceForAgainst, RULES, type EraResult, type EventResult, type SupplyResult } from '@/lib/research/thesis';

const era = (id: 'social' | 'signer' | 'intents', retention: number | null, lasted: boolean | null): EraResult => ({
  id, account: id, era: id, note: '', months: [], missingMonths: [], firstMonth: '2024-01', peakMonth: '2024-06', peak: 100, latestMonth: '2026-10', latest: retention === null ? null : retention * 100,
  retention, monthsSincePeak: 28, month1: 10, month3: 30, month6: 60, lasted,
});
const event = (followed: boolean | null): EventResult => ({ id: 'x', label: 'x', date: '2024-01-01', shown: 'x', source: 'https://near.org', note: '', nearReturn30: null, nearReturn90: null, btcReturn90: null, relativeReturn90: null, daaBefore: null, daaAfter: null, daaChange: followed === null ? null : followed ? 0.1 : -0.1, eraGrowth: null, adoptionFollowed: followed });
const supply = (coverage: number | null, takeRate = 0.0004, prior = 0.0003): SupplyResult => ({ start: null, end: null, netNewNear90d: null, netNewAnnualPct: null, netNewAnnualUsd: null, buybackAnnualUsd: null, buybackCoverage: coverage, maxIssuanceCoverage: null, takeRate, takeRatePrior: prior });

describe('verdict rules', () => {
  it('requires both lasting products and value to the token for "building"', () => {
    const d = decide([era('social', 0.5, true), era('signer', 0.6, true), era('intents', 0.9, true)], [event(true), event(true)], supply(0.6));
    expect(d.verdict).toBe('BUILDING');
    expect(d.confidence).toBe('moderate');
  });

  it('separates "building but not paying" from "hype"', () => {
    expect(decide([era('social', 0.5, true), era('signer', 0.6, true)], [event(true), event(true)], supply(0.1)).verdict).toBe('BUILDING, NOT YET PAYING');
    expect(decide([era('social', 0.05, false), era('signer', 0.1, false), era('intents', 0.2, false)], [event(false), event(false)], supply(0.1)).verdict).toBe('FOLLOWING THE HYPE');
  });

  it('section 2 only changes confidence, never the verdict', () => {
    const eras = [era('social', 0.5, true), era('signer', 0.6, true)];
    const a = decide(eras, [event(true), event(true)], supply(0.6));
    const b = decide(eras, [event(false), event(false)], supply(0.6));
    expect(a.verdict).toBe(b.verdict);
    expect(a.confidence).toBe('moderate');
    expect(b.confidence).toBe('low');
  });

  it('returns insufficient evidence instead of guessing when a core section lacks data', () => {
    expect(decide([era('social', null, null)], [event(true), event(true)], supply(0.6)).verdict).toBe('INSUFFICIENT EVIDENCE');
    expect(decide([era('social', 0.5, true), era('signer', 0.6, true)], [], supply(null)).verdict).toBe('INSUFFICIENT EVIDENCE');
  });

  it('coverage thresholds map to building / mixed / hype', () => {
    const e = [era('social', 0.5, true), era('signer', 0.6, true)];
    expect(decide(e, [], supply(RULES.coveragePaying)).sections[2]!.verdict).toBe('BUILDING');
    expect(decide(e, [], supply(0.3)).sections[2]!.verdict).toBe('MIXED');
    expect(decide(e, [], supply(0.1)).sections[2]!.verdict).toBe('HYPE');
  });
});

describe('era history', () => {
  const rec = (key: string, txns: number | null): RawRecord => ({ key, source: 'nearblocks', url: 'u', sha256: key, fetchedAt: '2026-11-01T00:00:00Z', body: txns === null ? {} : { txns } });

  it('measures retention against the era\'s own peak and judges only after the peak ages', () => {
    const raws: Record<string, RawRecord> = {};
    const series = [10, 50, 200, 120, 80, 40];
    series.forEach((v, i) => { const k = `nearblocks.era.social.2025-0${i + 1}`; raws[k] = rec(k, v); });
    const r = eraResults(raws).find((e) => e.id === 'social')!;
    expect(r.peak).toBe(200);
    expect(r.peakMonth).toBe('2025-03');
    expect(r.retention).toBeCloseTo(0.2);
    expect(r.monthsSincePeak).toBe(3);
    expect(r.lasted).toBe(false);
    expect(eraResults(raws).find((e) => e.id === 'signer')!.retention).toBeNull();
  });

  it('lists complete months only', () => {
    expect(completeMonths('2026-09', new Date('2026-11-08T00:00:00Z'))).toEqual(['2026-09', '2026-10']);
  });

  it('writes evidence lines that cite their evidence IDs', () => {
    const t = { version: 'v', eras: [era('intents', 0.9, true), era('social', 0.05, false)], events: [event(true)], supply: supply(0.1), ...decide([era('intents', 0.9, true), era('social', 0.05, false)], [event(true)], supply(0.1)) };
    const fa = evidenceForAgainst(t, [{ id: 'F4', statement: 'Accounts fall', status: 'TRIGGERED', observed: '-77%' }]);
    expect(fa.forBuilding.some((l) => l.includes('[ERA-INTENTS-RETENTION]'))).toBe(true);
    expect(fa.againstBuilding.some((l) => l.includes('[ERA-SOCIAL-RETENTION]'))).toBe(true);
    expect(fa.againstBuilding.some((l) => l.startsWith('F4 triggered'))).toBe(true);
  });
});
