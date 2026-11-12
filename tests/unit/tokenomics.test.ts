import { describe, expect, it } from 'vitest';
import type { RawRecord } from '@/lib/data/fetcher';
import { BUYBACK_KEY, BUYBACK_WALLET_ID, FRONTEND_FUND, ONECLICK_FUND, REVENUE_WALLETS, type WalletFlow } from '@/lib/data/fastnear';
import { analyzeTokenomics } from '@/lib/research/tokenomics';

const rec = (key: string, body: unknown): RawRecord => ({ key, source: 'defillama', url: 'u', sha256: key, fetchedAt: '2026-11-12T00:00:00Z', body });
const DAY = 86_400;
const ts = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 1000;
const daysBetween = (a: string, b: string) => { const out: string[] = []; for (let t = ts(a); t <= ts(b); t += DAY) out.push(new Date(t * 1000).toISOString().slice(0, 10)); return out; };
const ns = (d: string) => String(BigInt(ts(d) + 3600) * 1_000_000_000n);
const Y = (n: number) => (BigInt(n) * 10n ** 24n).toString();
const flow = (wallet: string, dir: 'in' | 'out', counterparty: string, n: number, d: string, ok = true, tx = `${wallet}${dir}${counterparty}${d}${n}`): WalletFlow => ({ wallet, dir, counterparty, kind: 'near', yocto: Y(n), ts: ns(d), tx, ok });

// Flows from 2026-03-18 to 2026-11-10 (the fixture's last complete day). NEAR at $2.
const days = daysBetween('2026-03-18', '2026-11-10');
const oneClickDays = daysBetween('2026-03-18', '2026-05-31');
const flows: WalletFlow[] = [
  ...days.flatMap((d) => [
    flow(BUYBACK_WALLET_ID, 'in', 'intents.near', 100, d), // delivered by 1Click swaps
    flow(BUYBACK_WALLET_ID, 'in', 'intents.near', 999, d, false), // failed receipt: ignored
    flow(FRONTEND_FUND, 'in', 'intents.near', 20, d), // revenue kept in the front-end fund
  ]),
  ...oneClickDays.map((d) => flow(ONECLICK_FUND, 'in', 'intents.near', 10, d)), // revenue swept to the 1Click fund
  flow(ONECLICK_FUND, 'out', BUYBACK_WALLET_ID, 500, '2026-09-01'), flow(BUYBACK_WALLET_ID, 'in', ONECLICK_FUND, 500, '2026-09-01'), // later move
  flow(FRONTEND_FUND, 'in', 'auroraliqsupport.near', 50, '2026-03-20'), // not from Intents
  flow(BUYBACK_WALLET_ID, 'in', 'someone.near', 5, '2026-05-01'),
  flow(BUYBACK_WALLET_ID, 'in', 'intents.near', 777, '2026-11-11'), // fetch day: left out
];
const raws: Record<string, RawRecord> = {};
raws[BUYBACK_KEY] = { key: BUYBACK_KEY, source: 'fastnear', url: 'u', sha256: 'h', fetchedAt: '2026-11-11T09:00:00Z', body: { wallets: [...REVENUE_WALLETS], maxBlockHeight: {}, txCount: { a: 1 }, flows } };
const allDays = daysBetween('2025-10-01', '2026-11-11');
raws['defillama.coins.near.2025-12-14'] = rec('p', { coin: 'near', prices: allDays.map((d) => [ts(d), 2]) });
// DefiLlama: revenue and designated buybacks $260/day from 2026-02-23.
raws['defillama.intents.dailyHoldersRevenue'] = rec('h', { chart: allDays.map((d) => [ts(d), d >= '2026-02-23' ? 260 : 0]) });
raws['defillama.intents.dailyRevenue'] = rec('r', { chart: allDays.map((d) => [ts(d), 260]) });
raws['defillama.revenue.near'] = rec('b', { chart: allDays.map((d) => [ts(d), 10]) });
raws['near-rpc.validators'] = rec('v', { currentStakeYocto: ['500000000000000000000000000000000', '100000000000000000000000000000000'], currentCount: 2 }); // 600M NEAR
raws['near-rpc.protocol-config'] = rec('c', { maxInflationRate: [1, 40], protocolRewardRate: [0, 1] });
raws['coingecko.universe'] = rec('u', [{ id: 'near', marketCap: 2e9, fdv: 2e9 }, { id: 'hyperliquid', marketCap: 1e10, fdv: 4e10 }]);
const hist = (start: number, end: number, jumpDay?: string) => {
  const pts = allDays.slice(-366);
  return { prices: pts.map((d) => [ts(d), 2]), marketCaps: pts.map((d, i) => [ts(d), 2 * (jumpDay ? (d >= jumpDay ? end : start) : start + ((end - start) * i) / (pts.length - 1))]) };
};
raws['coingecko.near.history'] = rec('n', hist(1e9, 1.025e9));
raws['coingecko.history.hyperliquid'] = rec('hy', hist(5e9, 4.5e9, '2026-06-01'));
raws['defillama.holders.hyperliquid'] = rec('hh', { chart: allDays.map((d) => [ts(d), 1e10 * 0.05 / 365]) });

const ev: Record<string, number> = { 'MKT-NEAR-PRICE': 2, 'MKT-NEAR-MCAP': 2e9, 'ONC-TOTAL-SUPPLY': 1.2e9, 'SUP-NET-NEW-ANN-PCT': 0.025, 'SUP-NET-NEW-ANN-USD': 50e6, 'ONC-BUYBACK-WALLET': 100 * days.length + 505, 'INT-FEES-90D': 1e6, 'FEES-NEAR-CHAIN-90D': 2e4 };
const t = analyzeTokenomics(raws, (id) => ev[id] ?? null);
const b = t.buybacks;

describe('W4 token economics', () => {
  it('separates NEAR delivered to the buyback wallet from moves and from other senders', () => {
    expect(b.deliveredNear).toBeCloseTo(100 * days.length, 6);
    expect(b.deliveredUsd).toBeCloseTo(200 * days.length, 3);
    expect(b.affiliatedNear).toBeCloseTo(500, 9);
    expect(b.otherSenders).toEqual(['someone.near']);
    expect(b.avgPriceOnDelivery).toBeCloseTo(2, 9);
    expect(b.walletReconciles).toBeCloseTo(1, 9);
  });

  it('reproduces captured revenue as every first inflow into a revenue wallet, counted once', () => {
    expect(b.frontendUsd).toBeCloseTo(40 * days.length, 3);
    expect(b.oneClickInUsd).toBeCloseTo(20 * oneClickDays.length, 3);
    expect(b.nonIntentsUsd).toBeCloseTo(100 + 10, 3);
    // The later 1Click-fund move is not captured revenue again.
    expect(b.capturedUsd).toBeCloseTo(b.deliveredUsd! + b.oneClickInUsd! + b.frontendUsd! + b.nonIntentsUsd!, 3);
    expect(b.frontendBalanceNear).toBeCloseTo(20 * days.length + 50, 6);
    expect(b.oneClickBalanceNear).toBeCloseTo(10 * oneClickDays.length - 500, 6);
  });

  it('compares with DefiLlama over identical dates', () => {
    const window = daysBetween('2026-02-23', '2026-11-10').length;
    expect(b.designatedUsd).toBeCloseTo(260 * window, 3);
    expect(b.llamaRevenueUsd).toBeCloseTo(260 * window, 3);
    expect(b.reproductionRatio).toBeCloseTo(b.capturedUsd! / (260 * window), 9);
    expect(b.deliveredRunRateUsd).toBeCloseTo(200 * 365, 3);
    expect(b.designatedRunRateUsd).toBeCloseTo(260 * 365, 3);
    // The moved NEAR is valued when it was captured: share moved x captured value.
    const moved = Math.min(1, 500 / (10 * oneClickDays.length));
    expect(b.deliveredAllToDesignated).toBeCloseTo((b.deliveredUsd! + b.oneClickInUsd! * moved) / b.designatedUsd!, 9);
  });

  it('refuses dollar totals when any day lacks a price', () => {
    const noDay = (x: { prices: number[][]; marketCaps: number[][] }) => ({ ...x, prices: x.prices.filter(([q]) => new Date(q! * 1000).toISOString().slice(0, 10) !== '2026-06-15') });
    const gap = { ...raws,
      'defillama.coins.near.2025-12-14': rec('p', { coin: 'near', prices: allDays.filter((d) => d !== '2026-06-15').map((d) => [ts(d), 2]) }),
      'coingecko.near.history': rec('n', noDay(hist(1e9, 1.025e9))) };
    const g = analyzeTokenomics(gap, (id) => ev[id] ?? null);
    expect(g.buybacks.deliveredUsd).toBeNull();
    expect(g.buybacks.deliveredRunRateUsd).toBeNull();
  });

  it('never nets flows with different economic effects into one dollar figure', () => {
    expect('netValueToHoldersUsd' in t).toBe(false);
    expect(t.taxonomy.filter((r) => r.counted).map((r) => r.key)).toEqual(['delivered', 'burns']);
    // Burns are reported inside net issuance; buybacks as supply absorbed into a held wallet.
    expect(t.supply.netIssuance).toBe(0.025);
    expect(t.supply.buybackAbsorption).toBeCloseTo((200 * 365) / 2 / 1.2e9, 12);
    expect(t.verifiedCaptureUsd).toBeCloseTo(200 * 365 + 10 * 365, 3);
  });

  it('computes staking yield and real yield after dilution', () => {
    expect(t.staking.stakingRatio).toBeCloseTo(0.5, 9);
    expect(t.staking.validatorShare).toBe(1);
    const gross = 0.025 + (10 * 365) / 2e9;
    expect(t.staking.nominalYield).toBeCloseTo(gross / 0.5, 9);
    expect(t.staking.realYieldStaker).toBeCloseTo((1 + gross / 0.5) / 1.025 - 1, 9);
    expect(t.staking.realYieldNonStaker).toBeCloseTo(1 / 1.025 - 1, 9);
  });

  it('measures every asset with one method, keeping raw supply changes beside adjusted ones', () => {
    const near = t.assets.find((a) => a.label === 'NEAR')!;
    expect(near.circGrowth1y).toBeGreaterThan(0.02);
    // Held buybacks do not reduce ownership dilution; they are reported as treasury absorption.
    expect(near.ownershipDilution).toBeCloseTo(near.circGrowthExEvents!, 12);
    expect(near.treasuryAbsorption).toBeCloseTo((200 * 365) / 2e9, 12);
    const hype = t.assets.find((a) => a.label === 'HYPE')!;
    expect(hype.jumps.length).toBe(1);
    expect(hype.circGrowth1y).toBeCloseTo(-0.1, 9); // raw, event included
    expect(hype.circGrowthExEvents).toBeCloseTo(0, 9); // adjusted
    expect(hype.ownershipDilution).toBeCloseTo(0, 9);
    expect(hype.treasuryAbsorption).toBeNull();
    expect(t.assets.find((a) => a.label === 'BTC')!.holderYield).toBeNull();
  });
});
