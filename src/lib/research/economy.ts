/**
 * W3: NEAR economy map (research/three-digits/SCOPE.md section 8). Every product investigated on its own and
 * placed in one column: OBSERVED activity, VERIFIED value capture for $NEAR (section 6 taxonomy), or SPECULATIVE
 * opportunity (no measurable evidence; never given a dollar value).
 *
 * Also answers two hypotheses with data already here:
 * - H1: how concentrated NEAR's value capture and fee base are in one product.
 * - H4: whether value is moving off the NEAR chain into cross-chain flows (L1 activity vs Intents growth).
 */
import type { RawRecord } from '@/lib/data/fetcher';
import { ERA_CONTRACTS } from '@/lib/data/sources';
import { commonEnd, fromUnixPairs, safeDiv, windowAggregate, type DailyPoint } from './series';
import type { TokenomicsResult } from './tokenomics';
import type { ThesisResult } from './thesis';
import type { EvidenceDraft } from './types';

export const ECONOMY_VERSION = 'w3-1.0.0';
export type Column = 'OBSERVED' | 'VERIFIED' | 'SPECULATIVE';
export interface ProductRow {
  key: string; product: string; activity: string; capture: string; captureUsd: number | null; column: Column; speculative: string; sources: string;
}
export interface EconomyResult {
  version: string;
  windowEnd: string | null;
  feesOnNear: { name: string; category: string; fees30d: number; share: number | null }[];
  intentsFeeShare: number | null;
  captureFromIntents: number | null;
  l1: { txnsYoY: number | null; activeYoY: number | null; gasFeesYoY: number | null; txns90: number | null; active90: number | null };
  intentsVolumeYoY: number | null;
  signer: { participants: number | null; threshold: number | null; domains: number | null; latestMonth: string | null; latestTxns: number | null; peakTxns: number | null };
  /** Validator concentration (W7): validators needed to control a third of stake, and the top ten's share. */
  validators: { count: number | null; nakamoto33: number | null; top10Share: number | null };
  products: ProductRow[];
  findings: string[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const fmtUsd = (v: number | null) => (v === null ? 'n/a' : Math.abs(v) >= 1e9 ? `$${(v / 1e9).toFixed(1)}B` : Math.abs(v) >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${(v / 1e3).toFixed(0)}K`);
const fmtPct = (v: number | null, d = 0) => (v === null ? 'n/a' : `${v > 0 ? '+' : ''}${(v * 100).toFixed(d)}%`);
const share = (v: number | null, d = 0) => (v === null ? 'n/a' : `${(v * 100).toFixed(d)}%`);

export function analyzeEconomy(raws: Record<string, RawRecord | null | undefined>, ev: (id: string) => number | null, tok: TokenomicsResult, thesis: ThesisResult): EconomyResult {
  const body = (k: string) => raws[k]?.body as any;
  const series = (k: string) => fromUnixPairs(body(k)?.chart);

  // ---- Fees by protocol on the NEAR chain (DefiLlama fees overview, chain = Near, last 30 days).
  const fp: any[] = Array.isArray(body('defillama.fees.onnear')) ? body('defillama.fees.onnear') : [];
  const total30 = fp.reduce((a, p) => a + (Number(p.fees30d) || 0), 0);
  const feesOnNear = fp.map((p) => ({ name: String(p.name), category: String(p.category), fees30d: Number(p.fees30d) || 0, share: total30 ? (Number(p.fees30d) || 0) / total30 : null }))
    .filter((p) => p.fees30d > 0).sort((a, b) => b.fees30d - a.fees30d);
  const intentsFeeShare = feesOnNear.find((p) => p.name === 'NEAR Intents')?.share ?? null;

  // ---- H1: share of verified capture from Intents (executed buybacks vs burns).
  const exec = tok.buybacks.executedRunRateUsd;
  const burns = tok.taxonomy.find((r) => r.key === 'burns')?.usdPerYear ?? null;
  const captureFromIntents = exec !== null && burns !== null ? safeDiv(exec, exec + burns) : null;

  // ---- H4: L1 activity vs Intents growth, 90 days vs the same 90 days a year earlier.
  const nb: any[] = Array.isArray(body('nearblocks.charts')) ? body('nearblocks.charts') : [];
  const txns: DailyPoint[] = nb.map((r) => [String(r.date), Number(r.txns)] as DailyPoint).filter(([, v]) => Number.isFinite(v)).sort((a, b) => a[0].localeCompare(b[0]));
  const active: DailyPoint[] = nb.map((r) => [String(r.date), Number(r.activeAccounts)] as DailyPoint).filter(([, v]) => Number.isFinite(v)).sort((a, b) => a[0].localeCompare(b[0]));
  const gas = series('defillama.fees.near');
  const iVol = series('defillama.intents.volume');
  const END = commonEnd([txns, active, gas, iVol], 1);
  const yoy = (s: DailyPoint[]) => { if (!END) return null; const a = windowAggregate(s, END, 90).sum, b = windowAggregate(s, addDays(END, -365), 90).sum; return a !== null && b ? a / b - 1 : null; };
  const mean90 = (s: DailyPoint[]) => (END ? windowAggregate(s, END, 90).mean : null);
  const l1 = { txnsYoY: yoy(txns), activeYoY: yoy(active), gasFeesYoY: yoy(gas), txns90: mean90(txns), active90: mean90(active) };
  const intentsVolumeYoY = yoy(iVol);

  // ---- Chain Signatures: MPC network state (RPC) and monthly activity (exact NearBlocks months only).
  const st = body('near-rpc.signer-state');
  const signerEra = thesis.eras.find((e) => e.id === 'signer');
  const signer = { participants: Number.isFinite(st?.participants) ? st.participants : null, threshold: Number.isFinite(st?.threshold) ? st.threshold : null, domains: Number.isFinite(st?.domains) ? st.domains : null,
    latestMonth: signerEra?.latestMonth ?? null, latestTxns: signerEra?.latest ?? null, peakTxns: signerEra?.peak ?? null };

  // ---- Validator concentration (W7).
  const stakes: number[] = Array.isArray(body('near-rpc.validators')?.currentStakeYocto) ? body('near-rpc.validators').currentStakeYocto.map((y: string) => Number(BigInt(y) / 10n ** 18n) / 1e6).sort((a: number, b: number) => b - a) : [];
  const totalStake = stakes.reduce((a, b) => a + b, 0);
  let cum = 0, nakamoto33: number | null = null;
  for (let i = 0; i < stakes.length; i++) { cum += stakes[i]!; if (cum > totalStake / 3) { nakamoto33 = i + 1; break; } }
  const validators = { count: stakes.length || null, nakamoto33, top10Share: totalStake ? stakes.slice(0, 10).reduce((a, b) => a + b, 0) / totalStake : null };

  // ---- Product map.
  const iFees = ev('INT-FEES-90D'), iRev = ev('INT-REV-90D');
  const ann = (x: number | null) => (x === null ? null : (x * 365) / 90);
  const rhea = feesOnNear.filter((p) => /rhea/i.test(p.name)).reduce((a, p) => a + p.fees30d, 0);
  const s = tok.staking;
  const products: ProductRow[] = [
    { key: 'intents', product: 'NEAR Intents and near.com', column: 'VERIFIED',
      activity: `${fmtUsd(ev('INT-VOL-ANN'))} volume a year (run rate), ${fmtPct(intentsVolumeYoY)} year over year; ${fmtUsd(ann(iFees))} fees, ${fmtUsd(ann(iRev))} captured by NEAR; ${share(intentsFeeShare)} of all fees on the NEAR chain`,
      capture: `Executed buybacks ${fmtUsd(exec)} a year (onchain), held in the buyback wallet`, captureUsd: exec,
      speculative: 'Confidential swaps, new chains and distribution partners; integrator and solver concentration is untested without the Intents Explorer API or BigQuery', sources: 'DefiLlama (Dune lineage), FastNEAR' },
    { key: 'l1', product: 'NEAR L1 (gas, accounts, transactions)', column: 'VERIFIED',
      activity: `${Math.round(l1.txns90 ?? 0).toLocaleString('en-US')} transactions and ${Math.round(l1.active90 ?? 0).toLocaleString('en-US')} active accounts a day (90-day mean); transactions ${fmtPct(l1.txnsYoY)}, active accounts ${fmtPct(l1.activeYoY)}, gas fees ${fmtPct(l1.gasFeesYoY)} year over year`,
      capture: `Burns ${fmtUsd(burns)} a year (70% of gas)`, captureUsd: burns,
      speculative: 'Share of automated versus organic activity is untested without BigQuery (H7)', sources: 'NearBlocks, DefiLlama (Allium)' },
    { key: 'staking', product: 'Staking and validators', column: 'OBSERVED',
      activity: `${share(s.stakingRatio)} of supply staked across ${s.validators ?? 'n/a'} validators; nominal yield ${share(s.nominalYield, 1)}`,
      capture: 'None: rewards are new tokens (redistribution from non-stakers)', captureUsd: null,
      speculative: 'HSP-029 would cut issuance from 2.5% to 1.6% if adopted', sources: 'NEAR RPC' },
    { key: 'signer', product: 'Chain Signatures (MPC signing)', column: 'OBSERVED',
      activity: `MPC network of ${signer.participants ?? 'n/a'} participants, ${signer.threshold ?? 'n/a'}-of-n threshold, ${signer.domains ?? 'n/a'} signature domains; v1.signer ${signer.latestTxns === null ? 'n/a' : Math.round(signer.latestTxns).toLocaleString('en-US')} transactions in ${signer.latestMonth ?? 'n/a'} (exact months only)`,
      capture: 'None verified: no burn or buyback is linked to signing fees, and the contract exposes no fee schedule', captureUsd: null,
      speculative: 'Signing for other chains and apps as a paid service; its share of Intents withdrawals (H9) needs receipt-level data', sources: 'NEAR RPC (v1.signer state), NearBlocks' },
    { key: 'apps', product: 'Ecosystem applications (RHEA and others)', column: 'OBSERVED',
      activity: `${fmtUsd(ev('DEFI-TVL-NEAR'))} DeFi TVL (${fmtPct(ev('DEFI-TVL-NEAR-YOY'))} year over year), ${fmtUsd(ev('DEFI-STABLES-NEAR'))} stablecoins; RHEA ${fmtUsd(rhea)} fees in 30 days`,
      capture: 'None: app revenue accrues to the applications, not to $NEAR (gas from their use is in L1 burns)', captureUsd: null,
      speculative: 'A larger on-chain economy is the route to a platform valuation (section 3)', sources: 'DefiLlama' },
    { key: 'ai', product: 'NEAR AI', column: 'SPECULATIVE',
      activity: 'No public usage, revenue or onchain settlement dataset found', capture: 'None', captureUsd: null,
      speculative: 'AI agents that pay with or settle on NEAR; no measurable evidence yet, so no dollar value is assigned', sources: 'Announcements only (REPORTED)' },
    { key: 'treasury', product: 'Treasury and foundation', column: 'OBSERVED',
      activity: 'Holdings and spending are disclosed in foundation reports, not reconciled onchain here', capture: 'None (a cost centre; sales would add supply to the market)', captureUsd: null,
      speculative: 'Not quantified: no verified onchain disclosure in this pipeline', sources: 'Foundation reports (REPORTED)' },
  ];

  const findings = [
    `NEAR Intents is ${share(intentsFeeShare)} of all fees paid on the NEAR chain over the last 30 days; the largest native app family, RHEA, is ${share(total30 ? rhea / total30 : null)}, and NEAR's own gas ${share(feesOnNear.find((p) => p.category === 'Chain')?.share ?? null)}.`,
    `${share(captureFromIntents)} of NEAR's verified value capture comes from one product (Intents buybacks); the rest is gas burns.`,
    `Intents volume ${fmtPct(intentsVolumeYoY)} year over year while NEAR L1 transactions changed ${fmtPct(l1.txnsYoY)}, active accounts ${fmtPct(l1.activeYoY)} and gas fees ${fmtPct(l1.gasFeesYoY)} (DeFi TVL on NEAR ${fmtPct(ev('DEFI-TVL-NEAR-YOY'))}): paid growth is in cross-chain execution, not in activity on the NEAR chain. Part of the L1 decline may be automated or incentive-driven activity ending; classifying it needs BigQuery (H7).`,
  ];
  return { version: ECONOMY_VERSION, windowEnd: END, feesOnNear, intentsFeeShare, captureFromIntents, l1, intentsVolumeYoY, signer, validators, products, findings };
}

export function economyEvidence(e: EconomyResult, fetched: (key: string) => { at: string | null; hash: string | null }): EvidenceDraft[] {
  const out: EvidenceDraft[] = [];
  const item = (o: Partial<EvidenceDraft> & Pick<EvidenceDraft, 'evidenceId' | 'metricKey' | 'label' | 'unit' | 'methodology' | 'transform'>): void => {
    const value = o.value ?? null;
    out.push({
      group: 'activity', valueText: null, observationType: 'DERIVED', sourceName: 'Computed here', sourceUrl: '/methodology#economy', observedAt: null, fetchedAt: null,
      periodStart: null, periodEnd: e.windowEnd, confidence: 'medium', rawResponseHash: null, validationNotes: null, series: null, inputs: [], ...o,
      value: value !== null && Number.isFinite(value) ? value : null, available: value !== null && Number.isFinite(value),
    });
  };
  const f = fetched('defillama.fees.onnear');
  item({ evidenceId: 'ECO-INTENTS-FEE-SHARE', metricKey: 'economy.intents_fee_share', label: 'NEAR Intents share of all fees on the NEAR chain, last 30 days', unit: 'fraction', value: e.intentsFeeShare, observationType: 'DERIVED', sourceName: 'DefiLlama',
    sourceUrl: 'https://defillama.com/fees/chain/near', fetchedAt: f.at, rawResponseHash: f.hash, methodology: `DefiLlama fees overview filtered to the NEAR chain (${e.feesOnNear.length} protocols with fees).`, transform: 'Intents fees / all fees' });
  item({ evidenceId: 'ECO-CAPTURE-FROM-INTENTS', metricKey: 'economy.capture_from_intents', label: 'Share of verified value capture from Intents buybacks (H1)', unit: 'fraction', value: e.captureFromIntents, inputs: ['TOK-EXECUTED-RUNRATE', 'LAD-NEAR-BURN-RUNRATE'],
    methodology: 'Executed buybacks / (executed buybacks + burns), run rates.', transform: 'executed / (executed + burns)' });
  item({ evidenceId: 'ECO-L1-TXNS-YOY', metricKey: 'economy.l1.txns_yoy', label: 'NEAR L1 transactions, 90 days vs a year earlier', unit: 'fraction', value: e.l1.txnsYoY, sourceName: 'NearBlocks', methodology: 'Daily transactions summed over matched 90-day windows.', transform: 'sum90 / sum90 a year earlier - 1' });
  item({ evidenceId: 'ECO-L1-ACTIVE-YOY', metricKey: 'economy.l1.active_yoy', label: 'NEAR L1 daily active accounts, 90 days vs a year earlier', unit: 'fraction', value: e.l1.activeYoY, sourceName: 'NearBlocks', methodology: 'Daily active accounts summed over matched 90-day windows.', transform: 'sum90 / sum90 a year earlier - 1' });
  item({ evidenceId: 'ECO-L1-GAS-YOY', metricKey: 'economy.l1.gas_yoy', label: 'NEAR L1 gas fees, 90 days vs a year earlier', unit: 'fraction', value: e.l1.gasFeesYoY, sourceName: 'DefiLlama', methodology: 'Matched 90-day windows.', transform: 'sum90 / sum90 a year earlier - 1' });
  item({ evidenceId: 'ECO-INTENTS-VOL-YOY', metricKey: 'economy.intents.volume_yoy', label: 'NEAR Intents volume, 90 days vs a year earlier', unit: 'fraction', value: e.intentsVolumeYoY, sourceName: 'DefiLlama', methodology: 'Matched 90-day windows, same end date as the L1 measures (H4).', transform: 'sum90 / sum90 a year earlier - 1' });
  const s = fetched('near-rpc.signer-state');
  item({ evidenceId: 'ECO-SIGNER-PARTICIPANTS', metricKey: 'economy.signer.participants', label: 'Chain Signatures MPC participants (v1.signer)', unit: 'count', value: e.signer.participants, observationType: 'OBSERVED', sourceName: 'NEAR RPC', fetchedAt: s.at, rawResponseHash: s.hash,
    sourceUrl: 'https://nearblocks.io/address/v1.signer', validationNotes: e.signer.threshold !== null ? `Signing threshold ${e.signer.threshold}.` : null, methodology: 'v1.signer state(): participants in the running MPC network.', transform: 'count(participants)' });
  item({ evidenceId: 'RISK-VALIDATOR-NAKAMOTO', metricKey: 'risk.validators.nakamoto33', label: 'Validators needed to control a third of NEAR stake', unit: 'count', value: e.validators.nakamoto33, sourceName: 'NEAR RPC',
    validationNotes: e.validators.top10Share !== null ? `Top ten validators hold ${(e.validators.top10Share * 100).toFixed(1)}% of stake; ${e.validators.count} validators.` : null, methodology: 'Current validators sorted by stake; the smallest number whose combined stake exceeds one third (enough to halt finality).', transform: 'min k: sum(top k) > total / 3' });
  return out;
}

/** Keeps ERA_CONTRACTS referenced for the signer row's provenance. */
export const SIGNER_ACCOUNT = ERA_CONTRACTS.find((c) => c.id === 'signer')?.account ?? 'v1.signer';
