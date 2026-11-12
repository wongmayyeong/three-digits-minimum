import { describe, expect, it } from 'vitest';
import type { RawRecord } from '@/lib/data/fetcher';
import { BUYBACK_KEY } from '@/lib/data/fastnear';
import { BUYBACK_WALLET } from '@/lib/data/sources';
import { analyzeTokenomics } from '@/lib/research/tokenomics';

const rec = (key: string, body: unknown): RawRecord => ({ key, source: 'defillama', url: 'u', sha256: key, fetchedAt: '2026-11-12T00:00:00Z', body });
const DAY = 86_400;
const ts = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 1000;
const daysBetween = (a: string, b: string) => { const out: string[] = []; for (let t = ts(a); t <= ts(b); t += DAY) out.push(new Date(t * 1000).toISOString().slice(0, 10)); return out; };

// Buyback wallet created 2026-03-18; data through 2026-11-10 (the fixture's "yesterday").
const days = daysBetween('2026-03-18', '2026-11-10');
const raws: Record<string, RawRecord> = {};
const ns = (d: string) => String(BigInt(ts(d) + 3600) * 1_000_000_000n);
const Y = (n: number) => (BigInt(n) * 10n ** 24n).toString();
const transfers = days.flatMap((d, i) => [
  { tx: `${d}a`, height: i * 10, ts: ns(d), from: 'intents.near', yocto: Y(100), ok: true },
  { tx: `${d}b`, height: i * 10 + 1, ts: ns(d), from: 'intents.near', yocto: Y(999), ok: false }, // failed: ignored
  ...(d === '2026-05-01' ? [{ tx: 'x', height: i * 10 + 2, ts: ns(d), from: 'someone.near', yocto: Y(5), ok: true }] : []),
]);
// Fetched on 2026-11-11, so 2026-11-10 is the last complete day; a transfer on the fetch day is left out.
transfers.push({ tx: 'today', height: 1e9, ts: ns('2026-11-11'), from: 'intents.near', yocto: Y(777), ok: true });
raws[BUYBACK_KEY] = { key: BUYBACK_KEY, source: 'fastnear', url: 'u', sha256: 'h', fetchedAt: '2026-11-11T09:00:00Z', body: { account: BUYBACK_WALLET, maxBlockHeight: 1e9, txCount: transfers.length, transfers } };
// NEAR at $2 every day; designated buybacks $250/day from 2026-02-23 (executed is $200/day: 80%).
const allDays = daysBetween('2025-10-01', '2026-11-11');
raws['defillama.coins.near.2025-12-14'] = rec('p', { coin: 'near', prices: allDays.map((d) => [ts(d), 2]) });
raws['defillama.intents.dailyHoldersRevenue'] = rec('h', { chart: allDays.map((d) => [ts(d), d >= '2026-02-23' ? 250 : 0]) });
raws['defillama.revenue.near'] = rec('b', { chart: allDays.map((d) => [ts(d), 10]) });
raws['near-rpc.validators'] = rec('v', { currentStakeYocto: ['500000000000000000000000000000000', '100000000000000000000000000000000'], currentCount: 2 }); // 600M NEAR
raws['near-rpc.protocol-config'] = rec('c', { maxInflationRate: [1, 40], protocolRewardRate: [0, 1] });
raws['coingecko.universe'] = rec('u', [{ id: 'near', marketCap: 2e9, fdv: 2e9 }, { id: 'hyperliquid', marketCap: 1e10, fdv: 4e10 }]);
// NEAR circulating 1.0B -> 1.025B over the year; HYPE flat with one reclassification day.
const hist = (start: number, end: number, jumpDay?: string) => {
  const pts = allDays.slice(-366);
  return { prices: pts.map((d) => [ts(d), 2]), marketCaps: pts.map((d, i) => [ts(d), 2 * (jumpDay ? (d >= jumpDay ? end : start) : start + ((end - start) * i) / (pts.length - 1))]) };
};
raws['coingecko.near.history'] = rec('n', hist(1e9, 1.025e9));
raws['coingecko.history.hyperliquid'] = rec('hy', hist(5e9, 4.5e9, '2026-06-01'));
raws['defillama.holders.hyperliquid'] = rec('hh', { chart: allDays.map((d) => [ts(d), 1e10 * 0.05 / 365]) });

const ev: Record<string, number> = { 'MKT-NEAR-PRICE': 2, 'MKT-NEAR-MCAP': 2e9, 'ONC-TOTAL-SUPPLY': 1.2e9, 'SUP-NET-NEW-ANN-PCT': 0.025, 'SUP-NET-NEW-ANN-USD': 50e6, 'ONC-BUYBACK-WALLET': 100 * days.length + 5, 'INT-FEES-90D': 1e6, 'FEES-NEAR-CHAIN-90D': 2e4 };
const t = analyzeTokenomics(raws, (id) => ev[id] ?? null);

describe('W4 token economics', () => {
  it('reconstructs executed buybacks from successful intents.near transfers only', () => {
    expect(t.buybacks.daysStored).toBe(days.length);
    expect(t.buybacks.executedNear).toBeCloseTo(100 * days.length, 6);
    expect(t.buybacks.otherSendersNear).toBe(5);
    expect(t.buybacks.otherSenders).toEqual(['someone.near']);
    expect(t.buybacks.executedUsd).toBeCloseTo(200 * days.length, 3);
    expect(t.buybacks.avgPurchasePrice).toBeCloseTo(2, 9);
    expect(t.buybacks.walletReconciles).toBeCloseTo(1, 9);
  });

  it('compares executed with designated buybacks over the same days', () => {
    const designatedDays = daysBetween('2026-02-23', '2026-11-10').length;
    expect(t.buybacks.designatedUsd).toBeCloseTo(250 * designatedDays, 3);
    expect(t.buybacks.executedRunRateUsd).toBeCloseTo(200 * 365, 3);
    expect(t.buybacks.designatedRunRateUsd).toBeCloseTo(250 * 365, 3);
  });

  it('refuses an executed total when any purchase day has no price', () => {
    const noDay = (x: { prices: number[][]; marketCaps: number[][] }) => ({ ...x, prices: x.prices.filter(([t]) => new Date(t! * 1000).toISOString().slice(0, 10) !== '2026-06-15') });
    const gap = { ...raws,
      'defillama.coins.near.2025-12-14': rec('p', { coin: 'near', prices: allDays.filter((d) => d !== '2026-06-15').map((d) => [ts(d), 2]) }),
      'coingecko.near.history': rec('n', noDay(hist(1e9, 1.025e9))) };
    const g = analyzeTokenomics(gap, (id) => ev[id] ?? null);
    expect(g.buybacks.executedUsd).toBeNull();
    expect(g.buybacks.executedRunRateUsd).toBeNull();
  });

  it('classifies flows and counts only captured value against dilution', () => {
    const counted = t.taxonomy.filter((r) => r.counted).map((r) => r.key);
    expect(counted).toEqual(['executed', 'burns', 'net-issuance']);
    expect(t.verifiedCaptureUsd).toBeCloseTo(200 * 365 + 10 * 365, 3);
    expect(t.netValueToHoldersUsd).toBeCloseTo(t.verifiedCaptureUsd! - 50e6, 3);
  });

  it('computes staking yield and real yield after dilution', () => {
    expect(t.staking.stakingRatio).toBeCloseTo(0.5, 9); // 600M / 1.2B
    expect(t.staking.validatorShare).toBe(1);
    const gross = 0.025 + (10 * 365) / 2e9;
    expect(t.staking.nominalYield).toBeCloseTo(gross / 0.5, 9);
    expect(t.staking.realYieldStaker).toBeCloseTo((1 + gross / 0.5) / 1.025 - 1, 9);
    expect(t.staking.realYieldNonStaker).toBeCloseTo(1 / 1.025 - 1, 9);
  });

  it('measures every asset with one method and flags supply jumps', () => {
    const near = t.assets.find((a) => a.label === 'NEAR')!;
    expect(near.circGrowth1y).toBeGreaterThan(0.02);
    // NEAR holds its bought-back tokens, so executed buybacks are subtracted from supply growth.
    expect(near.dilutionNetOfCapture).toBeCloseTo(near.circGrowthExEvents! - (200 * 365) / 2e9, 12);
    const hype = t.assets.find((a) => a.label === 'HYPE')!;
    expect(hype.fdvToMcap).toBeCloseTo(4, 9);
    expect(hype.jumps.length).toBe(1);
    expect(hype.circGrowth1y).toBeCloseTo(-0.1, 9);
    // The one-day recognition is excluded from the flow view, and burns are not subtracted again.
    expect(hype.circGrowthExEvents).toBeCloseTo(0, 9);
    expect(hype.dilutionNetOfCapture).toBeCloseTo(0, 9);
    expect(hype.holderYield).toBeCloseTo(0.05, 6);
    const btc = t.assets.find((a) => a.label === 'BTC')!;
    expect(btc.holderYield).toBeNull();
  });
});
