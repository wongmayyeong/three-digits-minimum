import { describe, expect, it } from 'vitest';
import type { RawRecord } from '@/lib/data/fetcher';
import { analyzeLadder, HORIZON_YEARS, supplyPath } from '@/lib/research/ladder';

const rec = (key: string, body: unknown): RawRecord => ({ key, source: 'defillama', url: 'u', sha256: key, fetchedAt: '2026-11-08T00:00:00Z', body });
// 400 days of a constant daily value, ending 2026-11-08.
const days = (v: number, n = 400) => { const end = Date.UTC(2026, 10, 8) / 1000; return Array.from({ length: n }, (_, i) => [end - (n - 1 - i) * 86_400, v]); };

const raws: Record<string, RawRecord> = {
  'coingecko.top': rec('coingecko.top', [
    { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', marketCap: 1.5e12, price: 1 },
    { id: 'ethereum', symbol: 'eth', name: 'Ethereum', marketCap: 2.5e11, price: 1 },
    { id: 'solana', symbol: 'sol', name: 'Solana', marketCap: 5e10, price: 1 },
    { id: 'tron', symbol: 'trx', name: 'TRON', marketCap: 3e10, price: 1 },
    { id: 'hyperliquid', symbol: 'hype', name: 'Hyperliquid', marketCap: 1.8e10, price: 1 },
    { id: 'tether', symbol: 'usdt', name: 'Tether', marketCap: 1.7e11, price: 1 },
  ]),
  'coingecko.global': rec('coingecko.global', { totalMarketCapUsd: 2.5e12 }),
  'defillama.holders.hyperliquid': rec('k', { chart: days(1.8e10 / 20 / 365) }), // 20x
  'defillama.holders.tron': rec('k', { chart: days(3e10 / 100 / 365) }), // 100x
  'defillama.holders.solana': rec('k', { chart: days(5e10 / 2000 / 365) }), // 2000x
  'defillama.intents.volume': rec('k', { chart: days(1e8) }),
  'defillama.dexs.total': rec('k', { chart: days(1e10) }),
};
// NEAR: $4, 1.25B supply -> $5B cap; $25M revenue to holders -> 200x; 0.04% take rate; $40B run rate.
const ev: Record<string, number> = { 'MKT-NEAR-PRICE': 4, 'MKT-NEAR-MCAP': 5e9, 'MKT-NEAR-CIRC': 1.25e9, 'VAL-NEAR-VALUE-CAPTURE-ANN': 25e6, 'INT-TAKE-RATE': 0.0004, 'INT-BUYBACK-SHARE': 1, 'INT-VOL-ANN': 4e10 };
const l = analyzeLadder(raws, (id) => ev[id] ?? null);

describe('three-digit price ladder', () => {
  it('projects supply under the current cap and HSP-029', () => {
    expect(supplyPath(1e9, 'cap25')).toBeCloseTo(1e9 * Math.pow(1.025, HORIZON_YEARS), -4);
    expect(supplyPath(1e9, 'hsp029')).toBeLessThan(supplyPath(1e9, 'cap25'));
  });

  it('reads valuation multiples from market cap and a year of holder revenue', () => {
    const m = Object.fromEntries(l.multiples.map((x) => [x.key, x.value]));
    expect(m.hyperliquid).toBeCloseTo(20, 0);
    expect(m.tron).toBeCloseTo(100, 0);
    expect(m.today).toBeCloseTo(200, 6);
  });

  it('computes what each rung requires and is consistent end to end', () => {
    const r100 = l.rungs.find((r) => r.price === 100)!;
    const supply = supplyPath(1.25e9, 'cap25');
    expect(r100.marketCap).toBeCloseTo(supply * 100, -3);
    const t = r100.byMultiple.find((b) => b.multipleKey === 'today')!;
    expect(t.requiredCapture).toBeCloseTo((supply * 100) / 200, -3);
    expect(t.requiredVolume).toBeCloseTo(t.requiredCapture! / 0.0004, -6);
    expect(Math.pow(1 + t.requiredCagr!, HORIZON_YEARS) * 4e10).toBeCloseTo(t.requiredVolume!, -6);
    // Cheaper multiples need more volume.
    const h = r100.byMultiple.find((b) => b.multipleKey === 'hyperliquid')!;
    expect(h.requiredVolume!).toBeGreaterThan(t.requiredVolume!);
    expect(r100.rankToday).toBe(3); // behind BTC and ETH; stablecoins excluded
  });

  it('labels conditions as observed, assumed or unproven', () => {
    const c = l.rungs[0]!.byMultiple[0]!.conditions.map((x) => x.status);
    expect(c).toContain('OBSERVED');
    expect(c).toContain('ASSUMED');
    expect(c).toContain('UNPROVEN');
  });

  it('reverses the ladder: growth and multiple imply a price, including below today', () => {
    const low = l.implied.find((g) => g.growthKey === 'low')!.byMultiple.find((b) => b.multipleKey === 'hyperliquid')!;
    expect(low.price!).toBeLessThan(4);
    const high = l.implied.find((g) => g.growthKey === 'high')!.byMultiple.find((b) => b.multipleKey === 'today')!;
    expect(high.price!).toBeGreaterThan(low.price!);
    expect(l.headline.length).toBeGreaterThan(40);
  });
});
