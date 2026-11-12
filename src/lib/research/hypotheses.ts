/**
 * W8: insight search. Hypotheses H1 to H10 (SCOPE.md section 8), each tested by a rule published here before
 * the result is read, with one of four outcomes: SUPPORTED, NOT SUPPORTED, MIXED, or UNTESTED (the data needed is
 * not available; what would test it is stated). Any outcome is reportable.
 */
import type { RawRecord } from '@/lib/data/fetcher';
import { CHAIN_ECONOMY } from '@/lib/data/sources';
import { fromUnixPairs } from './series';
import type { CrossChainResult } from './crosschain';
import type { EconomyResult } from './economy';
import type { LadderResult } from './ladder';
import type { TokenomicsResult } from './tokenomics';
import { corr, dedupe, returns, type ValuationResult } from './valuation';
import type { EvidenceDraft } from './types';

export const HYPOTHESES_VERSION = 'w8-1.0.0';
export type Outcome = 'SUPPORTED' | 'NOT SUPPORTED' | 'MIXED' | 'UNTESTED';
export interface HypothesisResult { id: string; claim: string; rule: string; reading: string; outcome: Outcome; value: number | null; needs: string | null }
export interface HypothesesResult { version: string; results: HypothesisResult[]; feeConcentration: { chain: string; top: string; share: number }[] }

/* eslint-disable @typescript-eslint/no-explicit-any */
const pct = (v: number | null | undefined, d = 0) => (v === null || v === undefined ? 'n/a' : `${(v * 100).toFixed(d)}%`);
const x = (v: number | null | undefined) => (v === null || v === undefined ? 'n/a' : v >= 10 ? `${v.toFixed(0)}x` : `${v.toFixed(1)}x`);
const median = (xs: number[]) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2; };
const BUYBACKS_START = '2026-02-23';

export function analyzeHypotheses(raws: Record<string, RawRecord | null | undefined>, d: { ladder: LadderResult; tok: TokenomicsResult; val: ValuationResult; eco: EconomyResult; cc: CrossChainResult }): HypothesesResult {
  const body = (k: string) => raws[k]?.body as any;
  const out: HypothesisResult[] = [];

  // H1: share of each chain's fees taken by its largest protocol family (DefiLlama fees overview, 30 days).
  const feeConcentration: HypothesesResult['feeConcentration'] = [];
  for (const c of CHAIN_ECONOMY.filter((y) => y.label !== 'NEAR')) {
    const a: any[] = Array.isArray(body(`defillama.fees.on.${c.label.toLowerCase()}`)) ? body(`defillama.fees.on.${c.label.toLowerCase()}`) : [];
    const by = new Map<string, number>();
    for (const p of a) by.set(String(p.parent ?? p.name).replace(/^parent#/, ''), (by.get(String(p.parent ?? p.name).replace(/^parent#/, '')) ?? 0) + Number(p.fees30d));
    const total = [...by.values()].reduce((s, v) => s + v, 0);
    const top = [...by.entries()].sort((p, q) => q[1] - p[1])[0];
    if (top && total) feeConcentration.push({ chain: c.label, top: top[0], share: top[1] / total });
  }
  const nearTop = d.eco.intentsFeeShare;
  if (nearTop !== null) feeConcentration.push({ chain: 'NEAR', top: 'NEAR Intents', share: nearTop });
  feeConcentration.sort((p, q) => q.share - p.share);
  const peerMed = median(feeConcentration.filter((f) => f.chain !== 'NEAR').map((f) => f.share));
  out.push({ id: 'H1', claim: 'The fees DefiLlama attributes to the NEAR chain are far more concentrated in one product than peers\' (restated from "value capture": comparable value-capture data by product does not exist for peers)',
    rule: 'Denominator: fees DefiLlama attributes to each chain (every protocol it lists on that chain, 30 days). For NEAR this includes NEAR Intents\' cross-chain swap fees, which are paid on many chains and are not NEAR L1 gas; peers\' totals are built the same way, so the attribution method is comparable but the economic meaning differs by chain. SUPPORTED if the largest protocol\'s share of NEAR\'s fees is at least 50% and at least 1.5x the peer median; NOT SUPPORTED if at or below the peer median; otherwise MIXED.',
    reading: `Intents: ${pct(nearTop)} of fees DefiLlama attributes to NEAR; peer median largest-protocol share ${pct(peerMed)} (${feeConcentration.map((f) => `${f.chain} ${pct(f.share)}`).join(', ')}). Separately, and not compared with peers: ${pct(d.eco.captureFromIntents)} of NEAR's verified value capture comes from Intents.`,
    outcome: nearTop === null || peerMed === null ? 'UNTESTED' : nearTop >= 0.5 && nearTop >= 1.5 * peerMed ? 'SUPPORTED' : nearTop <= peerMed ? 'NOT SUPPORTED' : 'MIXED', value: nearTop, needs: null });

  // H2: priced closer to a platform than its on-chain economy justifies.
  const plat = d.ladder.platform;
  const near = plat.find((p) => p.chain === 'Near');
  const bench = plat.filter((p) => p.chain !== 'Near');
  const maxSt = Math.max(...bench.map((p) => p.capToStablecoins ?? -1)), maxTv = Math.max(...bench.map((p) => p.capToTvl ?? -1));
  const medSt = median(bench.map((p) => p.capToStablecoins).filter((v): v is number => v !== null)), medTv = median(bench.map((p) => p.capToTvl).filter((v): v is number => v !== null));
  const nSt = near?.capToStablecoins ?? null, nTv = near?.capToTvl ?? null;
  out.push({ id: 'H2', claim: 'NEAR\'s market cap is high relative to its on-chain economy compared with platforms (an observed valuation gap, not a judgement that it is unjustified)',
    rule: 'SUPPORTED if NEAR\'s market cap to stablecoins and to DeFi TVL both exceed every platform benchmark; NOT SUPPORTED if both are at or below the benchmark median; otherwise MIXED.',
    reading: `NEAR market cap is ${x(nSt)} its stablecoins and ${x(nTv)} its DeFi TVL; benchmarks: ${bench.map((p) => `${p.chain === 'BSC' ? 'BNB Chain' : p.chain} ${x(p.capToStablecoins)} / ${x(p.capToTvl)}`).join(', ')}.`,
    outcome: nSt === null || nTv === null ? 'UNTESTED' : nSt > maxSt && nTv > maxTv ? 'SUPPORTED' : medSt !== null && medTv !== null && nSt <= medSt && nTv <= medTv ? 'NOT SUPPORTED' : 'MIXED', value: nSt, needs: null });

  // H3: Intents' take rate is above cross-chain peers.
  const takes = d.cc.rows.filter((r) => r.name !== 'NEAR Intents' && r.takeRate !== null && r.takeRate > 0);
  const it = d.cc.rows.find((r) => r.name === 'NEAR Intents')?.takeRate ?? null;
  const medTake = median(takes.map((r) => r.takeRate!)), maxTake = takes.length ? Math.max(...takes.map((r) => r.takeRate!)) : null;
  out.push({ id: 'H3', claim: 'Intents\' take rate is above cross-chain peers, so fee pressure matters more than volume',
    rule: 'SUPPORTED if Intents\' protocol revenue per dollar of volume is above every peer with public volume; NOT SUPPORTED if at or below the peer median; otherwise MIXED.',
    reading: `Intents ${it === null ? 'n/a' : `${(it * 1e4).toFixed(2)} bp`}; peers ${takes.map((r) => `${r.name} ${(r.takeRate! * 1e4).toFixed(2)} bp`).join(', ')} (median ${medTake === null ? 'n/a' : `${(medTake * 1e4).toFixed(2)} bp`}).`,
    outcome: it === null || medTake === null || maxTake === null ? 'UNTESTED' : it > maxTake ? 'SUPPORTED' : it <= medTake ? 'NOT SUPPORTED' : 'MIXED', value: it, needs: null });

  // H4: value moving off the NEAR chain into cross-chain flows.
  const l1 = d.eco.l1, iy = d.eco.intentsVolumeYoY;
  out.push({ id: 'H4', claim: 'Cross-chain activity and NEAR L1 activity are moving in opposite directions (diverging trends; migration of value is not proven)',
    rule: 'SUPPORTED if Intents volume grew while L1 transactions and active accounts both fell (matched 90-day windows); NOT SUPPORTED if L1 activity grew faster than Intents; otherwise MIXED. Divergence does not show that value moved from one to the other.',
    reading: `Intents volume ${pct(iy)}; L1 transactions ${pct(l1.txnsYoY)}, active accounts ${pct(l1.activeYoY)}, gas fees ${pct(l1.gasFeesYoY)}. Part of the L1 decline may be automated activity ending (H7), and the two trends may have separate causes.`,
    outcome: iy === null || l1.txnsYoY === null || l1.activeYoY === null ? 'UNTESTED' : iy > 0 && l1.txnsYoY < 0 && l1.activeYoY < 0 ? 'SUPPORTED' : (l1.txnsYoY > iy && l1.activeYoY > iy) ? 'NOT SUPPORTED' : 'MIXED', value: iy, needs: null });

  // H5: NEAR's dilution is a higher hurdle than peers'.
  const dil = d.tok.assets.filter((a) => a.ownershipDilution !== null);
  const nd = dil.find((a) => a.label === 'NEAR')?.ownershipDilution ?? null;
  const md = median(dil.filter((a) => a.label !== 'NEAR').map((a) => a.ownershipDilution!));
  // Raw view (audit item 10): circulating supply growth as reported, one-day events included, nothing subtracted.
  const raw = d.tok.assets.filter((a) => a.circGrowth1y !== null);
  const nr0 = raw.find((a) => a.label === 'NEAR')?.circGrowth1y ?? null;
  const mr0 = median(raw.filter((a) => a.label !== 'NEAR').map((a) => a.circGrowth1y!));
  const verdict5 = (n: number | null, m: number | null): Outcome => (n === null || m === null ? 'UNTESTED' : n - m > 0.005 ? 'SUPPORTED' : m - n > 0.005 ? 'NOT SUPPORTED' : 'MIXED');
  const o5a = verdict5(nd, md), o5b = verdict5(nr0, mr0);
  out.push({ id: 'H5', claim: 'NEAR\'s dilution is a higher return hurdle than peers\'',
    rule: 'Tested twice on ownership dilution (how much a passive holder\'s share of supply shrinks): circulating supply growth excluding one-day events, and as reported. Held buybacks are not subtracted: they change free float, not ownership. Each: SUPPORTED if NEAR is more than 0.5 points above the peer median, NOT SUPPORTED if more than 0.5 points below, otherwise MIXED. If the two disagree, MIXED.',
    reading: `Raw: NEAR ${pct(nr0, 1)} vs peer median ${pct(mr0, 1)} (${o5b}). Excluding one-day events: NEAR ${pct(nd, 1)} a year; peer median ${pct(md, 1)} (${dil.filter((a) => a.label !== 'NEAR').map((a) => `${a.label} ${pct(a.ownershipDilution, 1)}`).join(', ')}). ${(() => { const big = [...dil].filter((a) => a.label !== 'NEAR' && a.marketCap !== null).sort((p, q) => q.marketCap! - p.marketCap!).slice(0, 4); const above = big.filter((a) => nd !== null && nd > a.ownershipDilution!).length; return big.length ? ` The median is pulled up by small, high-dilution chains: against the four largest alternatives (${big.map((a) => a.label).join(', ')}) NEAR's ownership dilution is higher than ${above} of ${big.length}.` : ''; })()} HSP-029 would lower NEAR's issuance if adopted.`,
    outcome: o5a === o5b ? o5a : o5a === 'UNTESTED' ? o5b : o5b === 'UNTESTED' ? o5a : 'MIXED', value: nd, needs: null });

  // H6: NEAR needs more growth than alternatives for the same multiple.
  const req = d.val.opportunity.map((o) => ({ label: o.label, r: o.targets.find((t) => t.k === 7)?.requiredCagr ?? null })).filter((o) => o.r !== null);
  const nr = req.find((o) => o.label === 'NEAR')?.r ?? null, mr = median(req.filter((o) => o.label !== 'NEAR').map((o) => o.r!));
  out.push({ id: 'H6', claim: 'Under a fixed-valuation model, NEAR needs more driver growth than the alternatives for the same price multiple (a model result, not evidence about which asset is more likely to deliver it)',
    rule: 'Required driver growth for 7x in ten years with each asset\'s valuation ratio held at today\'s level and its ownership dilution persisting. SUPPORTED if NEAR\'s is more than 1 point above the peer median; NOT SUPPORTED if more than 1 point below; otherwise MIXED.',
    reading: `NEAR ${pct(nr, 1)} a year; peer median ${pct(mr, 1)} (${req.filter((o) => o.label !== 'NEAR').map((o) => `${o.label} ${pct(o.r, 1)}`).join(', ')}). ${(() => { const big = d.val.opportunity.filter((o) => o.label !== 'NEAR' && o.marketCap !== null && o.targets.find((t) => t.k === 7)?.requiredCagr != null).sort((p, q) => q.marketCap! - p.marketCap!).slice(0, 4); const above = big.filter((o) => nr !== null && nr > o.targets.find((t) => t.k === 7)!.requiredCagr!).length; return big.length ? ` Against the largest alternatives with a growth driver (${big.map((o) => o.label).join(', ')}) NEAR needs more growth than ${above} of ${big.length}.` : ''; })()} Observed growth is compared in section 11.`,
    outcome: nr === null || mr === null ? 'UNTESTED' : nr - mr > 0.01 ? 'SUPPORTED' : mr - nr > 0.01 ? 'NOT SUPPORTED' : 'MIXED', value: nr, needs: null });

  // H7 to H9: need receipt-level chain data.
  out.push({ id: 'H7', claim: 'Most of NEAR\'s reported activity is automated rather than organic', rule: 'Signer classification over the last year.', reading: 'Not tested: needs receipt-level signer data (BigQuery crypto_near_mainnet_us, research/sql/). L1 transactions fell 84% in a year, which is consistent with automated activity ending but does not prove it.', outcome: 'UNTESTED', value: null, needs: 'Google Cloud project for BigQuery' });
  out.push({ id: 'H8', claim: 'Intents revenue depends on a few integrators or solvers', rule: 'Share of volume from the top five integrators and solvers.', reading: 'Not tested: needs Intents Explorer API (partner JWT) or intents.near event logs (BigQuery).', outcome: 'UNTESTED', value: null, needs: 'Intents Explorer API or BigQuery' });
  out.push({ id: 'H9', claim: 'Chain Signatures underpins Intents\' cross-chain withdrawals, so its value is real but invisible in token capture', rule: 'Share of Intents withdrawals signed via v1.signer.', reading: `Not tested at receipt level. v1.signer runs a ${d.eco.signer.participants ?? 'n/a'}-participant MPC network with ${d.eco.signer.latestTxns === null ? 'n/a' : Math.round(d.eco.signer.latestTxns).toLocaleString('en-US')} transactions in ${d.eco.signer.latestMonth ?? 'n/a'}, and no signing fee reaches $NEAR.`, outcome: 'UNTESTED', value: null, needs: 'BigQuery receipts' });

  // H10: NEAR's price is mostly explained by BTC.
  const px = (coin: string) => dedupe(fromUnixPairs(Object.keys(raws).filter((k) => k.startsWith(`defillama.coins.${coin}.`)).flatMap((k) => (body(k)?.prices ?? []))));
  const rn = returns(px('near')), rb = returns(px('bitcoin'));
  const lastDay = [...rn.keys()].sort().at(-1) ?? null;
  const yearAgo = lastDay ? new Date(Date.parse(`${lastDay}T00:00:00Z`) - 365 * 86_400_000).toISOString().slice(0, 10) : '';
  const c1 = lastDay ? corr(rn, rb, yearAgo) : null;
  const pre = corr(rn, rb, new Date(Date.parse(`${BUYBACKS_START}T00:00:00Z`) - 180 * 86_400_000).toISOString().slice(0, 10), BUYBACKS_START), post = corr(rn, rb, BUYBACKS_START);
  const r2 = c1 === null ? null : c1 * c1;
  out.push({ id: 'H10', claim: 'BTC\'s daily returns explain most of NEAR\'s daily return variance (narrowed: this tests BTC dependence only, not what drives the rest)',
    rule: 'Share of NEAR\'s daily return variance explained by BTC over the last year (R-squared, single-factor). SUPPORTED if at least 50%; NOT SUPPORTED if below 25%; otherwise MIXED.',
    reading: `Correlation with BTC ${c1 === null ? 'n/a' : c1.toFixed(2)} (R-squared ${pct(r2)}); ${pre === null ? 'n/a' : pre.toFixed(2)} in the 180 days before buybacks began and ${post === null ? 'n/a' : post.toFixed(2)} since. ETH's correlation with BTC is ${d.val.opportunity.find((o) => o.label === 'ETH')?.risk.corrBtc1y?.toFixed(2) ?? 'n/a'}. The unexplained part is not attributed to fundamentals: it can be NEAR-specific news, other market factors or noise.`,
    outcome: r2 === null ? 'UNTESTED' : r2 >= 0.5 ? 'SUPPORTED' : r2 < 0.25 ? 'NOT SUPPORTED' : 'MIXED', value: r2, needs: null });

  return { version: HYPOTHESES_VERSION, results: out, feeConcentration };
}

export function hypothesesEvidence(h: HypothesesResult): EvidenceDraft[] {
  return h.results.map((r) => ({
    evidenceId: `HYP-${r.id}`, metricKey: `hypothesis.${r.id.toLowerCase()}`, group: 'thesis', label: `${r.id}: ${r.claim}`, value: r.value !== null && Number.isFinite(r.value) ? r.value : null,
    valueText: r.outcome, unit: 'text', observationType: 'DERIVED', available: true, sourceName: 'Computed here', sourceUrl: '/methodology#hypotheses', observedAt: null, fetchedAt: null,
    periodStart: null, periodEnd: null, methodology: `${r.rule} Reading: ${r.reading}`, transform: 'published rule', confidence: r.outcome === 'UNTESTED' ? 'low' : 'medium', rawResponseHash: null,
    validationNotes: r.needs ? `Needs: ${r.needs}.` : null, series: null, inputs: [],
  }));
}
