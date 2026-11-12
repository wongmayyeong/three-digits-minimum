import { describe, expect, it } from 'vitest';
import type { RawRecord } from '@/lib/data/fetcher';
import { analyzeLadder, HORIZON_YEARS, RUN_RATE_DAYS, supplyPath } from '@/lib/research/ladder';

const rec = (key: string, body: unknown): RawRecord => ({ key, source: 'defillama', url: 'u', sha256: key, fetchedAt: '2026-11-09T00:00:00Z', body });
const DAY = 86_400;
const endTs = (d: number) => Date.UTC(2026, 10, d) / 1000;
// n days of a constant daily value ending on 2026-11-<endDay>; the last point is treated as partial.
const days = (v: number, n = 400, endDay = 9) => Array.from({ length: n }, (_, i) => [endTs(endDay) - (n - 1 - i) * DAY, v]);
const categories = (spot: number, prediction: number, intents: number, n = 400) =>
  Array.from({ length: n }, (_, i) => [endTs(9) - (n - 1 - i) * DAY, { Dexs: spot, 'Prediction Market': prediction, Bridge: intents }]);

const raws: Record<string, RawRecord> = {
  'coingecko.top': rec('coingecko.top', [
    { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', marketCap: 1.5e12, price: 1 },
    { id: 'ethereum', symbol: 'eth', name: 'Ethereum', marketCap: 2.5e11, price: 1 },
    { id: 'binancecoin', symbol: 'bnb', name: 'BNB', marketCap: 9e10, price: 1 },
    { id: 'solana', symbol: 'sol', name: 'Solana', marketCap: 5e10, price: 1 },
    { id: 'tron', symbol: 'trx', name: 'TRON', marketCap: 3e10, price: 1 },
    { id: 'hyperliquid', symbol: 'hype', name: 'Hyperliquid', marketCap: 1.8e10, price: 1 },
    { id: 'tether', symbol: 'usdt', name: 'Tether', marketCap: 1.7e11, price: 1 },
  ]),
  'coingecko.global': rec('coingecko.global', { totalMarketCapUsd: 2.5e12 }),
  'defillama.holders.hyperliquid': rec('k', { chart: days(1.8e10 / 20 / 365) }), // 20x
  'defillama.holders.tron': rec('k', { chart: days(3e10 / 100 / 365) }), // 100x
  'defillama.holders.solana': rec('k', { chart: days(5e10 / 2000 / 365) }),
  'defillama.holders.ethereum': rec('k', { chart: days(2.5e11 / 4000 / 365) }),
  'defillama.holders.bsc': rec('k', { chart: days(9e10 / 4000 / 365, 120) }), // short history: no trailing year
  // NEAR: $5B cap. Intents $40B a year, 0.04% to buybacks = $16M; burns $4M -> $20M to holders -> 250x.
  'defillama.intents.volume': rec('k', { chart: days(4e10 / 365) }),
  'defillama.intents.dailyRevenue': rec('k', { chart: days((4e10 * 0.0004) / 365) }),
  'defillama.intents.dailyHoldersRevenue': rec('k', { chart: days((4e10 * 0.0004) / 365) }),
  'defillama.revenue.near': rec('k', { chart: days(4e6 / 365) }),
  // Spot DEX $4T a year; prediction markets would inflate an all-category denominator.
  'defillama.dexs.categories': rec('k', { crossChainMembers: ['NEAR Intents'], chart: categories(4e12 / 365, 1e12 / 365, 4e10 / 365) }),
};
const ev: Record<string, number> = { 'MKT-NEAR-PRICE': 4, 'MKT-NEAR-MCAP': 5e9, 'MKT-NEAR-CIRC': 1.25e9 };
const l = analyzeLadder(raws, (id) => ev[id] ?? null);

describe('three-digit price ladder', () => {
  it('projects supply under the current cap and HSP-029', () => {
    expect(supplyPath(1e9, 'cap25')).toBeCloseTo(1e9 * Math.pow(1.025, HORIZON_YEARS), -4);
    expect(supplyPath(1e9, 'hsp029')).toBeLessThan(supplyPath(1e9, 'cap25'));
  });

  it('ends every window on the same complete day', () => {
    expect(l.basis.windowEnd).toBe('2026-11-08');
    expect(l.basis.runRateDays).toBe(RUN_RATE_DAYS);
  });

  it('values NEAR and its peers on the same basis', () => {
    const m = Object.fromEntries(l.multiples.map((x) => [x.key, x.value]));
    expect(m.hyperliquid).toBeCloseTo(20, 6);
    expect(m.tron).toBeCloseTo(100, 6);
    expect(l.inputs.captureToday).toBeCloseTo(20e6, -1);
    expect(m.today).toBeCloseTo(250, 6);
  });

  it('keeps platform benchmarks out of the cash-flow ladder', () => {
    expect(l.multiples.map((x) => x.key)).toEqual(['hyperliquid', 'tron', 'today']);
    expect(l.rungs[0]!.byMultiple.map((b) => b.multipleKey)).not.toContain('solana');
    expect(l.implied[0]!.byMultiple.map((b) => b.multipleKey)).not.toContain('solana');
    expect(l.rungs[0]!.platform.map((p) => p.benchmark)).toContain('Solana');
  });

  it('flags series that do not cover a window instead of using them', () => {
    expect(l.peers.find((p) => p.label === 'BNB')!.multiple365).toBeNull();
    expect(l.exclusions.some((e) => e.startsWith('BNB'))).toBe(true);
  });

  it('uses the spot DEX category only as the denominator', () => {
    expect(l.inputs.spotDexRunRate).toBeCloseTo(4e12, -4);
    expect(l.inputs.allDexRunRate!).toBeGreaterThan(l.inputs.spotDexRunRate!);
    expect(l.inputs.dexShareToday).toBeCloseTo(0.01, 6);
  });

  it('projects each value channel with its own driver, consistently end to end', () => {
    const r100 = l.rungs.find((r) => r.price === 100)!;
    const supply = supplyPath(1.25e9, 'cap25');
    expect(r100.marketCap).toBeCloseTo(supply * 100, -3);
    const t = r100.byMultiple.find((b) => b.multipleKey === 'today')!;
    expect(t.requiredCapture).toBeCloseTo((supply * 100) / 250, -3);
    // Burns are held at today's run rate; only the remainder converts into Intents volume.
    expect(t.requiredIntentsCapture).toBeCloseTo(t.requiredCapture! - 4e6, -3);
    expect(t.requiredVolume).toBeCloseTo(t.requiredIntentsCapture! / 0.0004, -6);
    expect(Math.pow(1 + t.requiredCagr!, HORIZON_YEARS) * 4e10).toBeCloseTo(t.requiredVolume!, -6);
    const h = r100.byMultiple.find((b) => b.multipleKey === 'hyperliquid')!;
    expect(h.requiredVolume!).toBeGreaterThan(t.requiredVolume!);
    expect(r100.rankToday).toBe(3); // behind BTC and ETH; stablecoins excluded
  });

  it('round-trips: the implied price at the required growth equals the rung', () => {
    // Today's multiple, base growth: implied price recomputed from its own formula.
    const base = l.implied.find((g) => g.growthKey === 'base')!.byMultiple.find((b) => b.multipleKey === 'today')!;
    const supply = supplyPath(1.25e9, 'cap25');
    const capture = 4e10 * Math.pow(1.2, HORIZON_YEARS) * 0.0004 + 4e6;
    expect(base.price).toBeCloseTo((capture * 250) / supply, 6);
  });

  it('labels conditions as observed, assumed or unproven', () => {
    const c = l.rungs[0]!.byMultiple[0]!.conditions.map((x) => x.status);
    expect(c).toContain('OBSERVED');
    expect(c).toContain('ASSUMED');
    expect(c).toContain('UNPROVEN');
    expect(l.rungs[0]!.byMultiple[0]!.conditions[0]!.text).toMatch(/designated for buybacks/);
  });

  it('does not call a factor dominant when the spreads are close', () => {
    expect(['valuation', 'growth', 'similar']).toContain(l.swing.dominant);
    if (l.swing.acrossGrowth && l.swing.acrossMultiples && Math.max(l.swing.acrossGrowth, l.swing.acrossMultiples) / Math.min(l.swing.acrossGrowth, l.swing.acrossMultiples) < 1.25) {
      expect(l.swing.dominant).toBe('similar');
    }
    expect(l.swing.sentence.length).toBeGreaterThan(20);
    expect(l.headline.length).toBeGreaterThan(40);
  });
});
