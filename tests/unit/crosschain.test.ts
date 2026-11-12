import { describe, expect, it } from 'vitest';
import type { RawRecord } from '@/lib/data/fetcher';
import { analyzeCrossChain } from '@/lib/research/crosschain';

const rec = (key: string, body: unknown): RawRecord => ({ key, source: 'defillama', url: 'u', sha256: key, fetchedAt: '2026-11-11T00:00:00Z', body });
const ts = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 1000;
const days: string[] = []; for (let t = ts('2025-06-01'); t <= ts('2026-11-11'); t += 86_400) days.push(new Date(t * 1000).toISOString().slice(0, 10));
const flat = (v: number) => ({ chart: days.map((d) => [ts(d), v]) });

// Per day: Intents $100M volume, $40K revenue (4 bp); THORChain $50M, $20K revenue, $1K to holders; deBridge $10K revenue, all to holders.
const raws: Record<string, RawRecord> = {
  'defillama.intents.volume': rec('a', flat(1e8)), 'defillama.intents.dailyFees': rec('b', flat(1.5e5)),
  'defillama.intents.dailyRevenue': rec('c', flat(4e4)), 'defillama.intents.dailyHoldersRevenue': rec('d', flat(4e4)),
  'defillama.ccvol.thorchain-dex': rec('e', flat(5e7)), 'defillama.ccfees.thorchain-dex.dailyFees': rec('f', flat(6e4)),
  'defillama.ccfees.thorchain-dex.dailyRevenue': rec('g', flat(2e4)), 'defillama.ccfees.thorchain-dex.dailyHoldersRevenue': rec('h', flat(1e3)),
  'defillama.ccfees.debridge.dailyFees': rec('i', flat(1e4)), 'defillama.ccfees.debridge.dailyRevenue': rec('j', flat(1e4)), 'defillama.ccfees.debridge.dailyHoldersRevenue': rec('k', flat(1e4)),
  'defillama.ccfees.layerzero-v2.dailyFees': rec('l', flat(1e3)), 'defillama.ccfees.layerzero-v2.dailyRevenue': rec('m', flat(1e3)),
  'coingecko.crosschain': rec('n', [{ id: 'thorchain', symbol: 'rune', marketCap: 365e6 }, { id: 'debridge', symbol: 'dbr', marketCap: 73e6 }, { id: 'layerzero', symbol: 'zro', marketCap: 365e9 }]),
};
const ev: Record<string, number> = { 'MKT-NEAR-MCAP': 5e9, 'MKT-NEAR-CIRC': 1.25e9 };
const c = analyzeCrossChain(raws, (id) => ev[id] ?? null);

describe('W2 cross-chain competition', () => {
  it('measures every protocol on the same definitions and window', () => {
    const i = c.rows.find((r) => r.name === 'NEAR Intents')!;
    expect(i.volumeRunRate).toBeCloseTo(365e8, 0);
    expect(i.takeRate).toBeCloseTo(4e-4, 12);
    expect(i.capToRevenue).toBeCloseTo(5e9 / (4e4 * 365), 6);
    const t = c.rows.find((r) => r.name === 'THORChain')!;
    expect(t.holderShare).toBeCloseTo(0.05, 9);
    expect(t.capToRevenue).toBeCloseTo(50, 6);
    expect(t.capToHolders).toBeCloseTo(1000, 6);
  });
  it('shares volume among swap venues only', () => {
    expect(c.swapVenueShare).toBeCloseTo(1e8 / 1.5e8, 9);
    expect(c.swapVenues).toEqual(['NEAR Intents', 'THORChain']);
  });
  it('uses execution protocols as peers and keeps messaging layers out of the median', () => {
    expect(c.peerSet).toEqual(['THORChain', 'deBridge (DLN)']);
    expect(c.peerMedianCapToRevenue).toBeCloseTo((50 + 20) / 2, 6);
    expect(c.peerMedianCapToHolders).toBeCloseTo((1000 + 20) / 2, 6);
    expect(c.nearImpliedCapAtPeerMultiple).toBeCloseTo(35 * 4e4 * 365, 3);
    expect(c.nearImpliedPriceAtPeerMultiple).toBeCloseTo((35 * 4e4 * 365) / 1.25e9, 9);
  });
});
