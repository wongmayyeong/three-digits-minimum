import { describe, expect, it } from 'vitest';
import type { RawRecord } from '@/lib/data/fetcher';
import { analyzeMarket } from '@/lib/research/market';

const rec = (key: string, body: unknown): RawRecord => ({ key, source: 'defillama', url: 'u', sha256: key, fetchedAt: '2026-11-11T00:00:00Z', body });
const ts = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 1000;
const days: string[] = []; for (let t = ts('2020-01-01'); t <= ts('2026-11-11'); t += 86_400) days.push(new Date(t * 1000).toISOString().slice(0, 10));
// Spot DEX doubles each year from 2021 (1, 2, 4, 8, 16 per day); bridges appear only in 2025.
const perDay = (d: string) => ({ '2020': 0.1, '2021': 1, '2022': 2, '2023': 4, '2024': 8, '2025': 16, '2026': 16 } as Record<string, number>)[d.slice(0, 4)]!;
const raws: Record<string, RawRecord> = {
  'defillama.dexs.categories': rec('c', {
    chart: days.map((d) => [ts(d), { Dexs: perDay(d), Bridge: d >= '2025-01-01' ? 1 : 0, 'Prediction Market': 100 }]),
    spotTop: [{ name: 'A1', parent: 'parent#a', total1y: 40 }, { name: 'A2', parent: 'parent#a', total1y: 10 }, { name: 'B', parent: null, total1y: 20 }],
    spotTotal1y: 100,
  }),
  'defillama.stablecoins.all': rec('s', days.map((d) => [ts(d), perDay(d) * 1e9])),
  'defillama.intents.volume': rec('i', { chart: days.map((d) => [ts(d), d >= '2025-01-01' ? 0.5 : 0]) }),
};
const m = analyzeMarket(raws);

describe('W1 market opportunity', () => {
  it('sizes each market by full calendar year and grows it from 2021', () => {
    const spot = m.series.find((s) => s.key === 'spot')!;
    expect(spot.byYear.find((y) => y.year === '2022')!.value).toBeCloseTo(2 * 365, 6);
    expect(spot.cagrFrom).toBe('2021');
    expect(spot.cagr).toBeCloseTo(1, 2); // doubling, adjusted for leap-year day counts
  });
  it('never counts prediction markets as spot DEX volume', () => {
    expect(m.series.find((s) => s.key === 'spot')!.trailing).toBeLessThan(16 * 366);
  });
  it('withholds growth when early coverage is thin', () => {
    expect(m.series.find((s) => s.key === 'crosschain')!.cagr).toBeNull();
  });
  it('measures Intents within its own category and spot concentration by parent', () => {
    expect(m.intentsShareOfCrossChain).toBeCloseTo(0.5, 6);
    expect(m.spotTop5[0]).toEqual({ name: 'a', share: 0.5 });
    expect(m.spotTop5Share).toBeCloseTo(0.7, 9);
  });
});
