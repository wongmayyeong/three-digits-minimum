import { describe, expect, it } from 'vitest';
import type { RawRecord } from '@/lib/data/fetcher';
import { HORIZON_YEARS, type LadderResult } from '@/lib/research/ladder';
import type { TokenomicsResult } from '@/lib/research/tokenomics';
import { analyzeValuation } from '@/lib/research/valuation';

const rec = (key: string, body: unknown): RawRecord => ({ key, source: 'defillama', url: 'u', sha256: key, fetchedAt: '2026-11-11T00:00:00Z', body });
const DAY = 86_400;
const ts = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 1000;
const days = (from: string, to: string) => { const o: string[] = []; for (let t = ts(from); t <= ts(to); t += DAY) o.push(new Date(t * 1000).toISOString().slice(0, 10)); return o; };
const all = days('2023-06-01', '2026-11-11');
const last = days('2025-11-11', '2026-11-11');

const raws: Record<string, RawRecord> = {
  'coingecko.universe': rec('u', [{ id: 'near', marketCap: 5e9, price: 4, volume24h: 5e8 }, { id: 'hyperliquid', marketCap: 1e10, price: 40, volume24h: 1e8 }, { id: 'bitcoin', marketCap: 1e12, price: 1e5, volume24h: 1e10 }]),
  'coingecko.global': rec('g', { totalMarketCapUsd: 2e12 }),
  // Market caps flat; HYPE holders revenue $1M/day now, $0.5M/day a year earlier (+100% YoY), so a 27.4x multiple.
  'coingecko.history.hyperliquid': rec('h', { prices: last.map((d) => [ts(d), 40]), marketCaps: last.map((d) => [ts(d), 1e10]) }),
  'coingecko.near.history': rec('n', { prices: last.map((d) => [ts(d), 4]), marketCaps: last.map((d) => [ts(d), 5e9]) }),
  'defillama.holders.hyperliquid': rec('hh', { chart: all.map((d) => [ts(d), d >= '2025-11-11' ? 1e6 : 5e5]) }),
  'defillama.revenue.near': rec('b', { chart: all.map((d) => [ts(d), 1e3]) }),
  'defillama.intents.dailyHoldersRevenue': rec('ih', { chart: all.map((d) => [ts(d), 2e4]) }),
  'defillama.intents.volume': rec('iv', { chart: all.map((d) => [ts(d), d >= '2025-11-11' ? 1e8 : 5e7]) }),
  // BTC and NEAR prices: NEAR = 2 x BTC returns pattern, so correlation is 1.
  'defillama.coins.bitcoin.2023-10-06': rec('pb', { prices: all.map((d, i) => [ts(d), 100 * (1 + 0.01 * Math.sin(i))]) }),
  'defillama.coins.near.2023-10-06': rec('pn', { prices: all.map((d, i) => [ts(d), 5 * (1 + 0.01 * Math.sin(i))]) }),
};
const ladder = {
  basis: { windowEnd: '2026-11-10' },
  inputs: { intentsRunRate: 4e10, holderTakeRate: 0.0004, burnRunRate: 1e6, supply2036: 1.6e9, supply2036Hsp029: 1.5e9 },
  multiples: [{ key: 'today', value: 200 }, { key: 'tron', value: 100 }, { key: 'hyperliquid', value: 20 }],
} as unknown as LadderResult;
const tok = {
  buybacks: { executedDaily: [], firstReceipt: null, lastDay: '2026-11-10' },
  assets: [{ label: 'NEAR', dilutionNetOfCapture: 0.02, fdvToMcap: 1 }, { label: 'HYPE', dilutionNetOfCapture: 0, fdvToMcap: 4 }, { label: 'BTC', dilutionNetOfCapture: 0.01, fdvToMcap: 1 }],
} as unknown as TokenomicsResult;
const v = analyzeValuation(raws, () => null, ladder, tok);

describe('W5 valuation and W6 opportunity cost', () => {
  it('computes month-end multiples from market cap and trailing holders revenue', () => {
    const hype = v.multiplesOverTime.find((m) => m.label === 'HYPE')!;
    expect(hype.points.at(-1)!.value).toBeCloseTo(1e10 / 365e6, 6);
  });

  it('ranks sensitivity inputs by how much they move the implied price', () => {
    const base = ((4e10 * 1.2 ** HORIZON_YEARS * 0.0004 + 1e6) * 200) / 1.6e9;
    expect(v.sensitivity.base).toBeCloseTo(base, 9);
    const swings = v.sensitivity.rows.map((r) => r.swing ?? 0);
    expect([...swings].sort((a, b) => b - a)).toEqual(swings);
    expect(v.sensitivity.rows.find((r) => r.input === 'Valuation multiple')!.swing).toBeCloseTo(3, 9);
  });

  it('reverses each rung into the multiple it would need', () => {
    const m = v.multipleNeeded.find((x) => x.price === 100)!.byGrowth.find((g) => g.growthKey === 'base')!.multiple!;
    expect(m).toBeCloseTo((100 * 1.6e9) / (4e10 * 1.2 ** HORIZON_YEARS * 0.0004 + 1e6), 6);
  });

  it('asks every asset for the same multiple under its own method, with its own dilution', () => {
    const hype = v.opportunity.find((o) => o.label === 'HYPE')!;
    expect(hype.targets.find((t) => t.k === 7)!.requiredCagr).toBeCloseTo(7 ** (1 / 10) - 1, 9);
    expect(hype.observedGrowth).toBeCloseTo(1, 6);
    const near = v.opportunity.find((o) => o.label === 'NEAR')!;
    expect(near.targets.find((t) => t.k === 7)!.requiredCagr).toBeCloseTo((7 * 1.02 ** 10) ** (1 / 10) - 1, 9);
    expect(near.observedGrowth).toBeCloseTo(1, 6); // Intents volume doubled
    const btc = v.opportunity.find((o) => o.label === 'BTC')!;
    expect(btc.targets[0]!.requiredCagr).toBeNull();
    expect(btc.targets[0]!.shareOfCryptoToday).toBeCloseTo((1e12 * 2.8 * 1.01 ** 10) / 2e12, 9);
  });

  it('measures risk on consecutive daily returns', () => {
    const near = v.opportunity.find((o) => o.label === 'NEAR')!;
    expect(near.risk.corrBtc1y).toBeCloseTo(1, 6);
    expect(near.risk.vol1y).toBeGreaterThan(0);
    expect(near.risk.liquidity).toBeCloseTo(0.1, 9);
  });
});
