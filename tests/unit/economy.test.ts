import { describe, expect, it } from 'vitest';
import type { RawRecord } from '@/lib/data/fetcher';
import { analyzeEconomy } from '@/lib/research/economy';
import type { ThesisResult } from '@/lib/research/thesis';
import type { TokenomicsResult } from '@/lib/research/tokenomics';

const rec = (key: string, body: unknown): RawRecord => ({ key, source: 'defillama', url: 'u', sha256: key, fetchedAt: '2026-11-11T00:00:00Z', body });
const ts = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 1000;
const days: string[] = []; for (let t = ts('2025-06-01'); t <= ts('2026-11-11'); t += 86_400) days.push(new Date(t * 1000).toISOString().slice(0, 10));
const yearAgo = (d: string) => d < '2025-11-11';

const raws: Record<string, RawRecord> = {
  'defillama.fees.onnear': rec('f', [{ name: 'NEAR Intents', category: 'Bridge', fees30d: 800 }, { name: 'Rhea Dex', category: 'Dexs', fees30d: 150 }, { name: 'Near', category: 'Chain', fees30d: 50 }, { name: 'Dead', category: 'Dexs', fees30d: 0 }]),
  'nearblocks.charts': rec('n', days.map((d) => ({ date: d, txns: yearAgo(d) ? 1000 : 250, activeAccounts: yearAgo(d) ? 100 : 50 }))),
  'defillama.fees.near': rec('g', { chart: days.map((d) => [ts(d), yearAgo(d) ? 10 : 5]) }),
  'defillama.intents.volume': rec('v', { chart: days.map((d) => [ts(d), yearAgo(d) ? 1e6 : 3e6]) }),
  'near-rpc.signer-state': rec('s', { participants: 16, threshold: 11, domains: 8 }),
};
const tok = { buybacks: { executedRunRateUsd: 9e6 }, taxonomy: [{ key: 'burns', usdPerYear: 1e6 }], staking: { stakingRatio: 0.44, validators: 300, nominalYield: 0.056 } } as unknown as TokenomicsResult;
const thesis = { eras: [{ id: 'signer', latestMonth: '2026-10', latest: 1000, peak: 2000 }] } as unknown as ThesisResult;
const e = analyzeEconomy(raws, () => null, tok, thesis);

describe('W3 economy map', () => {
  it('measures the fee base by protocol on the NEAR chain', () => {
    expect(e.intentsFeeShare).toBeCloseTo(0.8, 9);
    expect(e.feesOnNear.map((p) => p.name)).toEqual(['NEAR Intents', 'Rhea Dex', 'Near']);
  });
  it('measures how concentrated verified capture is (H1)', () => {
    expect(e.captureFromIntents).toBeCloseTo(0.9, 9);
  });
  it('compares L1 activity with Intents growth on matched windows (H4)', () => {
    expect(e.l1.txnsYoY).toBeCloseTo(-0.75, 9);
    expect(e.l1.activeYoY).toBeCloseTo(-0.5, 9);
    expect(e.l1.gasFeesYoY).toBeCloseTo(-0.5, 9);
    expect(e.intentsVolumeYoY).toBeCloseTo(2, 9);
  });
  it('places every product in exactly one column and never values speculation', () => {
    expect(e.products.find((p) => p.key === 'ai')!.column).toBe('SPECULATIVE');
    expect(e.products.find((p) => p.key === 'ai')!.captureUsd).toBeNull();
    expect(e.products.filter((p) => p.column === 'VERIFIED').map((p) => p.key)).toEqual(['intents', 'l1']);
    expect(e.signer.participants).toBe(16);
  });
});
