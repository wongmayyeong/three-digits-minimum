/**
 * W4: token economics (research/three-digits/SCOPE.md, sections 6 and 8).
 *
 * 1. Value-capture taxonomy for NEAR: every flow classified before anything is summed. Only executed buybacks
 *    (reconstructed from the buyback wallet's onchain receipts) and burns count as value capture; designated
 *    buybacks are a label, staking emissions are redistribution, net issuance is dilution.
 * 2. Executed vs designated buybacks: NEAR received by buybacks.multisignature.near, valued at each day's price,
 *    against DefiLlama's buyback designation over the same days.
 * 3. Staking: share of supply staked, nominal yield, and real yield after dilution for stakers and non-stakers.
 * 4. The same comparable measures for every investable alternative: circulating supply growth (CoinGecko market
 *    cap / price, one method for every asset), supply still to unlock (FDV / market cap), and value reaching
 *    holders as a share of market cap (context). The comparable dilution measure is supply growth excluding
 *    one-day reclassification events, minus bought-back tokens that are held yet still counted as circulating
 *    (NEAR). Burns and recognized buybacks already lower circulating supply, so adding them again as a yield would
 *    count them twice.
 *
 * Deterministic: every number comes from stored responses; nothing is estimated to fill a gap.
 */
import type { RawRecord } from '@/lib/data/fetcher';
import { BUYBACK_KEY, type BuybackRecordBody } from '@/lib/data/fastnear';
import { BUYBACK_WALLET, INVESTABLE } from '@/lib/data/sources';
import { commonEnd, fromUnixPairs, safeDiv, windowAggregate, type DailyPoint } from './series';
import type { EvidenceDraft } from './types';

export const TOKENOMICS_VERSION = 'w4-1.0.0';
/** A one-day change in circulating supply larger than this is a reclassification or unlock event, listed separately. */
export const SUPPLY_JUMP = 0.05;
const RUN = 90;
/**
 * The documented buyback route: swaps execute inside NEAR Intents and the NEAR is withdrawn from intents.near.
 * A second sender, the 1Click funds DAO, also transfers large amounts of NEAR into the wallet. Its name points to NEAR
 * Intents' 1Click service, but its transfers are not documented as buybacks, so they are reported separately
 * (broad total) and never used for the headline (SCOPE: never the figure that favours NEAR).
 */
export const BUYBACK_ROUTE = 'intents.near';
export const AFFILIATED_SENDERS = ['1csfundsadmin.sputnik-dao.near'];

export type FlowClass = 'source' | 'label' | 'capture' | 'redistribution' | 'dilution' | 'excluded';
export interface FlowRow { key: string; flow: string; what: string; usdPerYear: number | null; cls: FlowClass; counted: boolean; evidence: string }
export interface AssetEconomics {
  label: string; type: string; marketCap: number | null; fdvToMcap: number | null;
  circGrowth1y: number | null; circStart: string | null; circEnd: string | null; jumps: { day: string; change: number }[];
  circGrowthExEvents: number | null; heldBuybackRate: number | null; dilutionNetOfCapture: number | null;
  holdersRunRate: number | null; holderYield: number | null; holderBasis: string;
}
export interface TokenomicsResult {
  version: string;
  windowEnd: string | null;
  buybacks: {
    daysExpected: number; daysStored: number; daysTruncated: number; firstReceipt: string | null; lastDay: string | null;
    executedNear: number; executedUsd: number | null; otherSendersNear: number; otherSenders: string[];
    affiliatedNear: number; affiliatedUsd: number | null; executedBroadToDesignated: number | null;
    designatedUsd: number | null; executedToDesignated: number | null; walletNear: number | null; walletReconciles: number | null;
    executedRunRateUsd: number | null; designatedRunRateUsd: number | null;
    monthly: { month: string; executedNear: number; executedUsd: number | null; designatedUsd: number | null }[];
    avgPurchasePrice: number | null; pctOfSupplyPerYear: number | null;
  };
  staking: { stakedNear: number | null; totalSupply: number | null; stakingRatio: number | null; grossIssuance: number | null; validatorShare: number | null; nominalYield: number | null; realYieldStaker: number | null; realYieldNonStaker: number | null; validators: number | null };
  taxonomy: FlowRow[];
  verifiedCaptureUsd: number | null;
  netIssuanceUsd: number | null;
  netValueToHoldersUsd: number | null;
  assets: AssetEconomics[];
  findings: string[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const day = (t: number) => new Date(t * 1000).toISOString().slice(0, 10);
const fmtUsd = (v: number | null) => (v === null ? 'n/a' : Math.abs(v) >= 1e9 ? `$${(v / 1e9).toFixed(2)}B` : `$${(v / 1e6).toFixed(1)}M`);
const fmtPct = (v: number | null, d = 1) => (v === null ? 'n/a' : `${(v * 100).toFixed(d)}%`);

export function analyzeTokenomics(raws: Record<string, RawRecord | null | undefined>, ev: (id: string) => number | null): TokenomicsResult {
  const body = (k: string) => raws[k]?.body as any;
  const series = (k: string) => fromUnixPairs(body(k)?.chart);
  const price = ev('MKT-NEAR-PRICE');
  const mcap = ev('MKT-NEAR-MCAP');

  // ---- Daily NEAR price for valuing each purchase on its day.
  // CoinGecko daily price first (complete over the buyback period); DefiLlama coins where CoinGecko has no point.
  const nearPx = new Map<string, number>(Object.keys(raws).filter((k) => k.startsWith('defillama.coins.near.')).flatMap((k) => fromUnixPairs(body(k)?.prices)));
  for (const [t, v] of (body('coingecko.near.history')?.prices ?? []) as [number, number][]) { const d = day(t); if (Number.isFinite(v) && !nearPx.has(d + '#cg')) { nearPx.set(d, v); nearPx.set(d + '#cg', 1); } }

  // ---- Executed buybacks: NEAR transfers into the wallet from intents.near (the swap runs inside Intents and the
  // NEAR is withdrawn to the wallet). Exact yoctoNEAR from FastNEAR. Only complete UTC days are used.
  const rec = body(BUYBACK_KEY) as BuybackRecordBody | undefined;
  const fetchedDay = raws[BUYBACK_KEY]?.fetchedAt?.slice(0, 10) ?? null;
  const yocto = (y: string) => Number(BigInt(y) / 10n ** 18n) / 1e6;
  let executedNear = 0, executedUsd = 0, pricedNear = 0, otherNear = 0, affNear = 0, affUsd = 0, affPriced = 0;
  const others = new Set<string>();
  const byDay = new Map<string, number>();
  let firstReceipt: string | null = null;
  for (const t of rec?.transfers ?? []) {
    const d = new Date(Number(BigInt(t.ts) / 1_000_000n)).toISOString().slice(0, 10);
    if (!t.ok || (fetchedDay && d >= fetchedDay)) continue; // failed receipts and the partial fetch day are left out
    const n = yocto(t.yocto);
    if (AFFILIATED_SENDERS.includes(t.from)) { affNear += n; const px = nearPx.get(d); if (px !== undefined) { affUsd += n * px; affPriced += n; } continue; }
    if (t.from !== BUYBACK_ROUTE) { otherNear += n; others.add(t.from); continue; }
    if (firstReceipt === null || d < (firstReceipt as string)) firstReceipt = d;
    executedNear += n;
    byDay.set(d, (byDay.get(d) ?? 0) + n);
    const px = nearPx.get(d);
    if (px !== undefined) { executedUsd += n * px; pricedNear += n; }
  }
  const lastBuybackDay = fetchedDay ? new Date(Date.parse(`${fetchedDay}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10) : null;
  const expected = rec ? rec.txCount : 0;
  const complete = !!rec && Math.abs(pricedNear - executedNear) < 1e-6;
  const days: string[] = rec ? [...byDay.keys()] : [];
  const truncated = 0;

  // Designated buybacks over the same days (DefiLlama holders revenue), from the first designation.
  const iHold = series('defillama.intents.dailyHoldersRevenue');
  const desigStart = iHold.find(([, v]) => v > 0)?.[0] ?? null;
  const designatedUsd = lastBuybackDay && desigStart ? iHold.filter(([d]) => d >= desigStart && d <= lastBuybackDay).reduce((a, [, v]) => a + v, 0) : null;
  const walletNear = ev('ONC-BUYBACK-WALLET');

  // Run rates over the last 90 complete days common to both series.
  const execSeries: DailyPoint[] = [];
  if (firstReceipt && lastBuybackDay) for (let t = Date.parse(`${firstReceipt}T00:00:00Z`); t <= Date.parse(`${lastBuybackDay}T00:00:00Z`); t += 86_400_000) {
    const d = new Date(t).toISOString().slice(0, 10);
    const v = (byDay.get(d) ?? 0) * (nearPx.get(d) ?? NaN);
    if (Number.isFinite(v)) execSeries.push([d, v]);
  }
  const END = commonEnd([execSeries, iHold], 0);
  const execRun = END && complete ? windowAggregate(execSeries, END, RUN).sum : null;
  const desRun = END ? windowAggregate(iHold, END, RUN).sum : null;
  const executedRunRateUsd = execRun !== null ? (execRun * 365) / RUN : null;
  const designatedRunRateUsd = desRun !== null ? (desRun * 365) / RUN : null;

  const months = [...new Set([...byDay.keys(), ...iHold.filter(([d]) => desigStart && d >= desigStart).map(([d]) => d)].map((d) => d.slice(0, 7)))].sort()
    .filter((m) => !lastBuybackDay || m <= lastBuybackDay.slice(0, 7));
  const monthly = months.map((m) => {
    const dd = [...byDay.entries()].filter(([d]) => d.startsWith(m));
    const n = dd.reduce((a, [, v]) => a + v, 0);
    const usd = dd.every(([d]) => nearPx.has(d)) ? dd.reduce((a, [d, v]) => a + v * nearPx.get(d)!, 0) : null;
    const des = iHold.filter(([d]) => d.startsWith(m) && (!lastBuybackDay || d <= lastBuybackDay)).reduce((a, [, v]) => a + v, 0);
    return { month: m, executedNear: n, executedUsd: usd, designatedUsd: des };
  });

  // ---- Supply and staking.
  const totalSupply = ev('ONC-TOTAL-SUPPLY');
  const netNewPct = ev('SUP-NET-NEW-ANN-PCT');
  const v = body('near-rpc.validators');
  const stakedNear = Array.isArray(v?.currentStakeYocto) ? v.currentStakeYocto.reduce((a: number, s: string) => a + Number(BigInt(s) / 10n ** 18n) / 1e6, 0) : null;
  const pc = body('near-rpc.protocol-config');
  const frac = (x: any) => (Array.isArray(x) && Number(x[1]) ? Number(x[0]) / Number(x[1]) : null);
  const protocolReward = frac(pc?.protocolRewardRate);
  const burnRun = (() => { const b = series('defillama.revenue.near'); const e = commonEnd([b], 1); return e ? windowAggregate(b, e, RUN).sum : null; })();
  const burnRate = burnRun !== null && mcap ? ((burnRun * 365) / RUN) / mcap : null;
  // Gross issuance = net supply growth + burns (both as a share of supply).
  const grossIssuance = netNewPct !== null && burnRate !== null ? netNewPct + burnRate : null;
  const stakingRatio = safeDiv(stakedNear, totalSupply);
  const validatorShare = protocolReward === null ? null : 1 - protocolReward;
  const nominalYield = grossIssuance !== null && validatorShare !== null && stakingRatio ? (grossIssuance * validatorShare) / stakingRatio : null;
  const realYieldStaker = nominalYield !== null && netNewPct !== null ? (1 + nominalYield) / (1 + netNewPct) - 1 : null;
  const realYieldNonStaker = netNewPct !== null ? 1 / (1 + netNewPct) - 1 : null;

  // ---- Taxonomy (annualized, USD). Run rates on the evidence window.
  const intFees = ev('INT-FEES-90D'), gas = ev('FEES-NEAR-CHAIN-90D');
  const ann = (x: number | null) => (x === null ? null : (x * 365) / RUN);
  const burnsUsd = burnRun !== null ? (burnRun * 365) / RUN : null;
  const emissionsUsd = grossIssuance !== null && mcap ? grossIssuance * mcap : null;
  const netIssuanceUsd = ev('SUP-NET-NEW-ANN-USD');
  const taxonomy: FlowRow[] = [
    { key: 'ext-intents', flow: 'NEAR Intents fees', what: 'Gross fees paid by Intents users (protocol and distributor fees)', usdPerYear: ann(intFees), cls: 'source', counted: false, evidence: 'INT-FEES-90D' },
    { key: 'ext-gas', flow: 'NEAR gas fees', what: 'All transaction fees paid on the NEAR chain', usdPerYear: ann(gas), cls: 'source', counted: false, evidence: 'FEES-NEAR-CHAIN-90D' },
    { key: 'designated', flow: 'Intents revenue designated for buybacks', what: 'DefiLlama\'s classification of captured revenue as buybacks', usdPerYear: designatedRunRateUsd, cls: 'label', counted: false, evidence: 'TOK-DESIGNATED-RUNRATE' },
    { key: 'executed', flow: 'Executed buyback purchases', what: `NEAR received by ${BUYBACK_WALLET} from intents.near, valued at each day's price`, usdPerYear: executedRunRateUsd, cls: 'capture', counted: true, evidence: 'TOK-EXECUTED-RUNRATE' },
    { key: 'burns', flow: 'Gas burned', what: '70% of every gas fee, permanently removed', usdPerYear: burnsUsd, cls: 'capture', counted: true, evidence: 'LAD-NEAR-BURN-RUNRATE' },
    { key: 'emissions', flow: 'Staking emissions', what: 'New NEAR minted for validators and delegators', usdPerYear: emissionsUsd, cls: 'redistribution', counted: false, evidence: 'TOK-GROSS-ISSUANCE' },
    { key: 'net-issuance', flow: 'Net issuance', what: 'Emissions minus burns: the dilution every holder faces', usdPerYear: netIssuanceUsd, cls: 'dilution', counted: true, evidence: 'SUP-NET-NEW-ANN-USD' },
    { key: 'apps', flow: 'Ecosystem app revenue (for example RHEA)', what: 'Revenue accruing to applications, not to $NEAR', usdPerYear: null, cls: 'excluded', counted: false, evidence: 'not summed' },
  ];
  const verifiedCaptureUsd = executedRunRateUsd !== null && burnsUsd !== null ? executedRunRateUsd + burnsUsd : null;
  const netValueToHoldersUsd = verifiedCaptureUsd !== null && netIssuanceUsd !== null ? verifiedCaptureUsd - netIssuanceUsd : null;

  // ---- Every investable alternative on the same measures.
  const universe: any[] = Array.isArray(body('coingecko.universe')) ? body('coingecko.universe') : [];
  // Series that exist set the common end; a missing series makes only its own asset unavailable.
  const holderEnds = INVESTABLE.filter((a) => a.llama).map((a) => series(`defillama.holders.${a.llama}`)).filter((x) => x.length);
  const HEND = commonEnd([...holderEnds, series('defillama.revenue.near'), iHold], 1);
  const assets: AssetEconomics[] = INVESTABLE.map((a) => {
    const u = universe.find((x) => x.id === a.coin);
    const hist = a.coin === 'near' ? body('coingecko.near.history') : body(`coingecko.history.${a.coin}`);
    const px = new Map<string, number>((hist?.prices ?? []).map(([t, p]: [number, number]) => [day(t), p]));
    // One point per day (the API repeats today's date for the live point; keep the first), drop the newest (partial).
    const seen = new Set<string>();
    const circ: DailyPoint[] = (hist?.marketCaps ?? []).map(([t, m]: [number, number]) => [day(t), m / (px.get(day(t)) ?? NaN)] as DailyPoint)
      .filter(([d, c]: DailyPoint) => Number.isFinite(c) && c > 0 && !seen.has(d) && (seen.add(d), true)).slice(0, -1);
    const jumps = circ.slice(1).map(([d, c], i) => ({ day: d, change: c / circ[i]![1] - 1 })).filter((j) => Math.abs(j.change) > SUPPLY_JUMP);
    const circGrowth1y = circ.length > 300 ? circ[circ.length - 1]![1] / circ[0]![1] - 1 : null;
    // Flow view: chain daily changes, skipping one-day events (reclassifications such as burns recognized at once).
    const jumpDays = new Set(jumps.map((j) => j.day));
    const circGrowthExEvents = circ.length > 300 ? circ.slice(1).reduce((g, [d, c], i) => (jumpDays.has(d) ? g : g * (c / circ[i]![1])), 1) - 1 : null;
    let holdersRunRate: number | null = null, holderBasis = 'none (monetary asset: no burn or buyback)';
    if (a.coin === 'near') {
      // NEAR on the same DefiLlama basis as its peers (burns + designated buybacks), so the column is comparable.
      const b = HEND ? windowAggregate(series('defillama.revenue.near'), HEND, RUN).sum : null;
      const h = HEND ? windowAggregate(iHold, HEND, RUN).sum : null;
      holdersRunRate = b !== null && h !== null ? ((b + h) * 365) / RUN : null;
      holderBasis = 'DefiLlama holders revenue: gas burned + Intents buybacks (designated)';
    } else if (a.llama) {
      const s = HEND ? windowAggregate(series(`defillama.holders.${a.llama}`), HEND, RUN).sum : null;
      holdersRunRate = s !== null ? (s * 365) / RUN : null;
      holderBasis = 'DefiLlama holders revenue (burns and buybacks)';
    }
    const marketCap = u && Number.isFinite(u.marketCap) ? u.marketCap : null;
    const holderYield = a.llama || a.coin === 'near' ? safeDiv(holdersRunRate, marketCap) : null;
    // NEAR's bought-back tokens sit in the buyback wallet and still count as circulating (CoinGecko circulating = total
    // supply), so executed buybacks are subtracted here. Every other asset's capture is a burn or a recognized burn,
    // which already lowers circulating supply.
    const heldBuybackRate = a.coin === 'near' && executedRunRateUsd !== null && marketCap ? executedRunRateUsd / marketCap : a.coin === 'near' ? null : 0;
    const dilutionNetOfCapture = circGrowthExEvents !== null && heldBuybackRate !== null ? circGrowthExEvents - heldBuybackRate : null;
    return {
      label: a.label, type: a.type, marketCap, fdvToMcap: u && u.fdv && marketCap ? u.fdv / marketCap : null,
      circGrowth1y, circStart: circ[0]?.[0] ?? null, circEnd: circ[circ.length - 1]?.[0] ?? null, jumps,
      circGrowthExEvents, heldBuybackRate, dilutionNetOfCapture, holdersRunRate, holderYield, holderBasis,
    };
  });

  // ---- Findings, generated from the numbers.
  const near = assets.find((x) => x.label === 'NEAR');
  const dRank = [...assets].filter((x) => x.dilutionNetOfCapture !== null).sort((p, q) => p.dilutionNetOfCapture! - q.dilutionNetOfCapture!);
  const findings = [
    `Executed buybacks: ${fmtUsd(executedRunRateUsd)} a year (${RUN}-day run rate) against ${fmtUsd(designatedRunRateUsd)} designated. Since designation began, ${fmtPct(complete ? safeDiv(executedUsd, designatedUsd) : null)} of the designated amount arrived through the documented route (${BUYBACK_ROUTE}); counting ${AFFILIATED_SENDERS.join(', ')} as well, ${fmtPct(complete && Math.abs(affPriced - affNear) < 1e-6 ? safeDiv(executedUsd + affUsd, designatedUsd) : null)}.`,
    `Verified value capture (executed buybacks + burns) is ${fmtUsd(verifiedCaptureUsd)} a year; net issuance is ${fmtUsd(netIssuanceUsd)}. Net, holders are diluted by ${fmtUsd(netValueToHoldersUsd === null ? null : -netValueToHoldersUsd)} a year.`,
    `Staking: ${fmtPct(stakingRatio, 0)} of supply is staked; nominal yield ${fmtPct(nominalYield)}, ${fmtPct(realYieldStaker)} after dilution for stakers and ${fmtPct(realYieldNonStaker)} for non-stakers.`,
    near && near.dilutionNetOfCapture !== null ? `Dilution net of capture over the last year (circulating supply growth excluding one-day events, minus held buybacks): NEAR ${fmtPct(near.dilutionNetOfCapture)}, ${dRank.findIndex((x) => x.label === 'NEAR') + 1} lowest of ${dRank.length}; ${dRank.map((x) => `${x.label} ${fmtPct(x.dilutionNetOfCapture)}`).join(', ')}.` : 'Dilution net of capture unavailable.',
  ];

  return {
    version: TOKENOMICS_VERSION, windowEnd: END,
    buybacks: {
      daysExpected: expected, daysStored: days.length, daysTruncated: truncated, firstReceipt, lastDay: lastBuybackDay,
      executedNear, executedUsd: complete ? executedUsd : null, otherSendersNear: otherNear, otherSenders: [...others].sort(),
      designatedUsd, executedToDesignated: complete ? safeDiv(executedUsd, designatedUsd) : null, walletNear, walletReconciles: safeDiv(walletNear, executedNear + affNear + otherNear),
      affiliatedNear: affNear, affiliatedUsd: complete && Math.abs(affPriced - affNear) < 1e-6 ? affUsd : null,
      executedBroadToDesignated: complete && Math.abs(affPriced - affNear) < 1e-6 ? safeDiv(executedUsd + affUsd, designatedUsd) : null,
      executedRunRateUsd, designatedRunRateUsd, monthly, avgPurchasePrice: complete ? safeDiv(executedUsd, executedNear) : null,
      pctOfSupplyPerYear: executedRunRateUsd !== null && price && totalSupply ? executedRunRateUsd / price / totalSupply : null,
    },
    staking: { stakedNear, totalSupply, stakingRatio, grossIssuance, validatorShare, nominalYield, realYieldStaker, realYieldNonStaker, validators: Number.isFinite(v?.currentCount) ? v.currentCount : null },
    taxonomy, verifiedCaptureUsd, netIssuanceUsd, netValueToHoldersUsd, assets, findings,
  };
}

/** Evidence items for W4, citable by ID. */
export function tokenomicsEvidence(t: TokenomicsResult, fetched: (key: string) => { at: string | null; hash: string | null }): EvidenceDraft[] {
  const out: EvidenceDraft[] = [];
  const item = (o: Partial<EvidenceDraft> & Pick<EvidenceDraft, 'evidenceId' | 'metricKey' | 'label' | 'unit' | 'methodology' | 'transform'>): void => {
    const value = o.value ?? null;
    out.push({
      group: 'supply', valueText: null, observationType: 'DERIVED', sourceName: 'Computed here', sourceUrl: '/methodology#tokenomics', observedAt: null, fetchedAt: null,
      periodStart: null, periodEnd: t.windowEnd, confidence: 'medium', rawResponseHash: null, validationNotes: null, series: null, inputs: [], ...o,
      value: value !== null && Number.isFinite(value) ? value : null, available: value !== null && Number.isFinite(value),
    });
  };
  const b = t.buybacks;
  const cov = `${b.daysStored} of ${b.daysExpected} days stored, ${b.daysTruncated} truncated`;
  item({ evidenceId: 'TOK-EXECUTED-NEAR', metricKey: 'tokenomics.executed_buybacks.near', label: `NEAR bought back and received by ${BUYBACK_WALLET} since ${b.firstReceipt ?? 'n/a'}`, unit: 'NEAR', value: b.executedNear,
    observationType: 'OBSERVED', sourceName: 'NearBlocks', sourceUrl: `https://nearblocks.io/address/${BUYBACK_WALLET}`, periodStart: b.firstReceipt, periodEnd: b.lastDay,
    methodology: `Sum of successful NEAR transfers into the buyback wallet from intents.near (the buyback swaps execute inside NEAR Intents and the NEAR is withdrawn to the wallet). One request per day; ${cov}.`, transform: 'sum(transfer deposits)' });
  item({ evidenceId: 'TOK-EXECUTED-USD', metricKey: 'tokenomics.executed_buybacks.usd', label: 'Executed buybacks valued at each day\'s NEAR price', unit: 'USD', value: b.executedUsd, inputs: ['TOK-EXECUTED-NEAR'],
    periodStart: b.firstReceipt, periodEnd: b.lastDay, methodology: 'Each day\'s NEAR received times that day\'s DefiLlama NEAR price. Unavailable unless every day is stored, none is truncated and every day has a price.', transform: 'sum(NEAR_d x price_d)' });
  item({ evidenceId: 'TOK-DESIGNATED-SINCE', metricKey: 'tokenomics.designated.since_start', label: 'Revenue DefiLlama designates for buybacks, over the same days', unit: 'USD', value: b.designatedUsd, sourceName: 'DefiLlama',
    observationType: 'OBSERVED', fetchedAt: fetched('defillama.intents.dailyHoldersRevenue').at, rawResponseHash: fetched('defillama.intents.dailyHoldersRevenue').hash, periodEnd: b.lastDay,
    methodology: 'Sum of NEAR Intents holders revenue from its first non-zero day to the last stored buyback day.', transform: 'sum(daily holders revenue)' });
  item({ evidenceId: 'TOK-EXECUTED-VS-DESIGNATED', metricKey: 'tokenomics.executed_vs_designated', label: 'Executed buybacks as a share of designated buybacks', unit: 'fraction', value: b.executedToDesignated,
    inputs: ['TOK-EXECUTED-USD', 'TOK-DESIGNATED-SINCE'], methodology: 'Independent check of the DefiLlama designation (Dune lineage) against onchain receipts (NearBlocks). Below 100% can mean lagged execution, retained revenue or a different definition.', transform: 'TOK-EXECUTED-USD / TOK-DESIGNATED-SINCE' });
  item({ evidenceId: 'TOK-AFFILIATED-USD', metricKey: 'tokenomics.affiliated_transfers.usd', label: `NEAR sent to the wallet by ${AFFILIATED_SENDERS.join(', ')}, valued at each day's price`, unit: 'USD', value: b.affiliatedUsd, confidence: 'low',
    methodology: `Not the documented buyback route. The sender's name points to NEAR Intents' 1Click service, so these may be buybacks executed elsewhere; reported separately and never used in the headline. ${b.affiliatedNear.toFixed(0)} NEAR.`, transform: 'sum(NEAR_d x price_d)' });
  item({ evidenceId: 'TOK-EXECUTED-BROAD-VS-DESIGNATED', metricKey: 'tokenomics.executed_broad_vs_designated', label: 'Executed buybacks including the 1Click funds DAO, as a share of designated', unit: 'fraction', value: b.executedBroadToDesignated, confidence: 'low', inputs: ['TOK-EXECUTED-USD', 'TOK-AFFILIATED-USD', 'TOK-DESIGNATED-SINCE'],
    methodology: 'Upper bound of the executed share, if the DAO transfers are buybacks.', transform: '(executed + affiliated) / designated' });
  item({ evidenceId: 'TOK-EXECUTED-RUNRATE', metricKey: 'tokenomics.executed.run_rate', label: `Executed buybacks, ${RUN}-day run rate`, unit: 'USD', value: b.executedRunRateUsd, inputs: ['TOK-EXECUTED-USD'],
    methodology: `Executed purchases over the last ${RUN} complete days common to both series, annualized.`, transform: `sum ${RUN}d x 365/${RUN}` });
  item({ evidenceId: 'TOK-DESIGNATED-RUNRATE', metricKey: 'tokenomics.designated.run_rate', label: `Designated buybacks, ${RUN}-day run rate (same days)`, unit: 'USD', value: b.designatedRunRateUsd, sourceName: 'DefiLlama',
    methodology: 'Same window as the executed run rate.', transform: `sum ${RUN}d x 365/${RUN}` });
  item({ evidenceId: 'TOK-WALLET-RECONCILE', metricKey: 'tokenomics.wallet_reconcile', label: 'Buyback wallet balance / NEAR received', unit: 'fraction', value: b.walletReconciles, inputs: ['ONC-BUYBACK-WALLET', 'TOK-EXECUTED-NEAR'],
    methodology: 'Close to 100% means the wallet has kept what it received (bought-back NEAR is held, not burned or sold).', transform: 'ONC-BUYBACK-WALLET / NEAR received' });
  item({ evidenceId: 'TOK-AVG-PURCHASE-PRICE', metricKey: 'tokenomics.avg_purchase_price', label: 'Average buyback price', unit: 'USD', value: b.avgPurchasePrice, inputs: ['TOK-EXECUTED-USD', 'TOK-EXECUTED-NEAR'],
    methodology: 'Value-weighted average daily price of executed purchases.', transform: 'TOK-EXECUTED-USD / TOK-EXECUTED-NEAR' });
  item({ evidenceId: 'TOK-BUYBACK-PCT-SUPPLY', metricKey: 'tokenomics.buyback_pct_supply', label: 'Executed buybacks per year as a share of total supply', unit: 'fraction', value: b.pctOfSupplyPerYear, inputs: ['TOK-EXECUTED-RUNRATE', 'ONC-TOTAL-SUPPLY'],
    methodology: 'Run rate at today\'s price; compare with net issuance.', transform: 'run rate / price / total supply' });
  const s = t.staking;
  item({ evidenceId: 'TOK-STAKING-RATIO', metricKey: 'tokenomics.staking_ratio', label: 'Share of NEAR supply staked with active validators', unit: 'fraction', value: s.stakingRatio, observationType: 'DERIVED', sourceName: 'NEAR RPC',
    fetchedAt: fetched('near-rpc.validators').at, rawResponseHash: fetched('near-rpc.validators').hash, inputs: ['ONC-TOTAL-SUPPLY'],
    methodology: `Sum of current validators' stake (RPC validators, ${s.validators ?? 'n/a'} validators) / protocol total supply.`, transform: 'sum(stake) / total supply' });
  item({ evidenceId: 'TOK-GROSS-ISSUANCE', metricKey: 'tokenomics.gross_issuance', label: 'Gross issuance, annualized (net supply growth + burns)', unit: 'fraction', value: s.grossIssuance, inputs: ['SUP-NET-NEW-ANN-PCT', 'LAD-NEAR-BURN-RUNRATE'],
    methodology: 'Realized, not the protocol maximum. Burns are added back to net supply growth.', transform: 'net growth + burns / market cap' });
  item({ evidenceId: 'TOK-STAKING-NOMINAL', metricKey: 'tokenomics.staking_yield.nominal', label: 'Nominal staking yield (before validator commission)', unit: 'fraction', value: s.nominalYield, inputs: ['TOK-GROSS-ISSUANCE', 'TOK-STAKING-RATIO'],
    methodology: `Gross issuance x validator share (${s.validatorShare === null ? 'n/a' : `${(s.validatorShare * 100).toFixed(0)}%`}, from protocol_reward_rate) / staking ratio.`, transform: 'issuance x validator share / staking ratio' });
  item({ evidenceId: 'TOK-STAKING-REAL', metricKey: 'tokenomics.staking_yield.real', label: 'Real staking yield after dilution', unit: 'fraction', value: s.realYieldStaker, inputs: ['TOK-STAKING-NOMINAL', 'SUP-NET-NEW-ANN-PCT'],
    methodology: 'Growth of a staker\'s share of supply: staking rewards are mostly redistribution from non-stakers, not new value.', transform: '(1 + nominal) / (1 + net growth) - 1' });
  item({ evidenceId: 'TOK-NONSTAKER-REAL', metricKey: 'tokenomics.nonstaker.real', label: 'Change in a non-staker\'s share of supply per year', unit: 'fraction', value: s.realYieldNonStaker, inputs: ['SUP-NET-NEW-ANN-PCT'],
    methodology: 'Dilution borne by holders who do not stake.', transform: '1 / (1 + net growth) - 1' });
  item({ evidenceId: 'TOK-VERIFIED-CAPTURE', metricKey: 'tokenomics.verified_capture', label: 'Verified value capture per year (executed buybacks + burns)', unit: 'USD', value: t.verifiedCaptureUsd, inputs: ['TOK-EXECUTED-RUNRATE', 'LAD-NEAR-BURN-RUNRATE'],
    methodology: 'Only the flows the taxonomy counts as economic value capture.', transform: 'executed + burns' });
  item({ evidenceId: 'TOK-NET-TO-HOLDERS', metricKey: 'tokenomics.net_to_holders', label: 'Verified value capture minus net issuance, per year', unit: 'USD', value: t.netValueToHoldersUsd, inputs: ['TOK-VERIFIED-CAPTURE', 'SUP-NET-NEW-ANN-USD'],
    methodology: 'Negative means holders are diluted by more than the token captures.', transform: 'TOK-VERIFIED-CAPTURE - SUP-NET-NEW-ANN-USD' });
  for (const a of t.assets) {
    const A = a.label;
    item({ evidenceId: `TOK-${A}-CIRC-GROWTH`, metricKey: `tokenomics.${A.toLowerCase()}.circ_growth`, label: `${A}: circulating supply growth, trailing year`, unit: 'fraction', value: a.circGrowth1y, sourceName: 'CoinGecko',
      periodStart: a.circStart, periodEnd: a.circEnd, validationNotes: a.jumps.length ? `One-day changes above ${SUPPLY_JUMP * 100}%: ${a.jumps.map((j) => `${j.day} ${(j.change * 100).toFixed(1)}%`).join(', ')} (reclassification or unlock events; included as reported).` : null,
      methodology: 'Circulating supply = CoinGecko market cap / price, daily; same method for every asset. Includes unlocks, which a protocol issuance rate leaves out.', transform: 'supply_end / supply_start - 1' });
    item({ evidenceId: `TOK-${A}-FDV-MCAP`, metricKey: `tokenomics.${A.toLowerCase()}.fdv_mcap`, label: `${A}: fully diluted value / market cap (supply still to unlock)`, unit: 'ratio', value: a.fdvToMcap, sourceName: 'CoinGecko', methodology: 'Overhang: tokens that exist or are scheduled but are not yet circulating.', transform: 'FDV / market cap' });
    item({ evidenceId: `TOK-${A}-HOLDER-YIELD`, metricKey: `tokenomics.${A.toLowerCase()}.holder_yield`, label: `${A}: value reaching holders as a share of market cap, ${RUN}-day run rate`, unit: 'fraction', value: a.holderYield, methodology: a.holderBasis, transform: 'holders revenue run rate / market cap' });
    item({ evidenceId: `TOK-${A}-CIRC-GROWTH-EX`, metricKey: `tokenomics.${A.toLowerCase()}.circ_growth_ex_events`, label: `${A}: circulating supply growth excluding one-day events`, unit: 'fraction', value: a.circGrowthExEvents, sourceName: 'CoinGecko',
      inputs: [`TOK-${A}-CIRC-GROWTH`], methodology: `Daily changes chained, skipping days that moved more than ${SUPPLY_JUMP * 100}% (reclassifications, one-off recognitions). The flow of new supply.`, transform: 'product(daily ratio, non-event days) - 1' });
    item({ evidenceId: `TOK-${A}-DILUTION-NET`, metricKey: `tokenomics.${A.toLowerCase()}.dilution_net_of_capture`, label: `${A}: dilution net of capture, per year`, unit: 'fraction', value: a.dilutionNetOfCapture,
      inputs: [`TOK-${A}-CIRC-GROWTH-EX`], methodology: a.label === 'NEAR' ? 'Circulating supply growth minus executed buybacks as a share of market cap: NEAR\'s bought-back tokens are held and still counted as circulating.' : 'Circulating supply growth: this asset\'s burns or recognized buybacks already lower circulating supply, so nothing is subtracted again.', transform: a.label === 'NEAR' ? 'growth ex events - executed buybacks / market cap' : 'growth ex events' });
  }
  return out;
}
