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
import { BUYBACK_KEY, BUYBACK_WALLET_ID, FRONTEND_FUND, ONECLICK_FUND, type RevenueWalletsBody } from '@/lib/data/fastnear';
import { INVESTABLE } from '@/lib/data/sources';
import { commonEnd, fromUnixPairs, safeDiv, windowAggregate, type DailyPoint } from './series';
import type { EvidenceDraft } from './types';

export const TOKENOMICS_VERSION = 'w4-2.0.0';
/** DefiLlama's NEAR Intents adapter relabels captured revenue as buybacks from this date. */
export const BUYBACKS_START = '2026-02-23';
/** A one-day change in circulating supply larger than this is a reclassification or unlock event, listed separately. */
export const SUPPLY_JUMP = 0.05;
const RUN = 90;
/**
 * Revenue wallets (DefiLlama's adapter, Dune query 6740088): captured revenue is NEAR swept into the front-end fund,
 * the 1Click fund and the buyback wallet from outside those three wallets. Buybacks are verified as NEAR that reaches
 * the buyback wallet: directly from intents.near (1Click swap output), or moved from the 1Click fund. NEAR that stays in
 * the front-end fund is captured revenue retained, not a buyback. Inflows from accounts other than intents.near are
 * counted by DefiLlama as revenue but are not shown to come from Intents.
 */
export const BUYBACK_ROUTE = 'intents.near';
export const AFFILIATED_SENDERS = [ONECLICK_FUND];

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
    windowStart: string; firstReceipt: string | null; lastDay: string | null; txCount: number;
    /** Captured revenue reproduced from the three wallets' inflows (DefiLlama's definition), same dates as DefiLlama. */
    capturedUsd: number | null; capturedFromIntentsUsd: number | null; nonIntentsUsd: number | null; nonIntentsSources: { source: string; usd: number }[];
    llamaRevenueUsd: number | null; reproductionRatio: number | null;
    /** Into the buyback wallet: directly from intents.near (strict), and moved from the 1Click fund. */
    executedNear: number; executedUsd: number | null; affiliatedNear: number; affiliatedUsd: number | null;
    otherSendersNear: number; otherSenders: string[];
    /** Captured revenue kept in the front-end fund (not moved to the buyback wallet). */
    frontendUsd: number | null; frontendBalanceNear: number | null; oneClickBalanceNear: number | null;
    designatedUsd: number | null; executedToDesignated: number | null; executedBroadToDesignated: number | null;
    walletNear: number | null; walletReconciles: number | null;
    executedRunRateUsd: number | null; designatedRunRateUsd: number | null;
    monthly: { month: string; executedNear: number; executedUsd: number | null; viaOneClickUsd: number | null; oneClickInUsd: number | null; frontendUsd: number | null; nonIntentsUsd: number | null; designatedUsd: number | null }[];
    oneClickInUsd: number | null;
    avgPurchasePrice: number | null; pctOfSupplyPerYear: number | null;
    /** Executed purchases in USD per day (documented route), for valuation over time. */
    executedDaily: [string, number][];
  };
  staking: { stakedNear: number | null; totalSupply: number | null; stakingRatio: number | null; grossIssuance: number | null; validatorShare: number | null; nominalYield: number | null; realYieldStaker: number | null; realYieldNonStaker: number | null; validators: number | null };
  taxonomy: FlowRow[];
  verifiedCaptureUsd: number | null;
  netIssuanceUsd: number | null;
  /** Supply view, each flow as a share of total supply per year, never netted against dollar flows. */
  supply: { grossIssuance: number | null; burns: number | null; netIssuance: number | null; buybackAbsorption: number | null };
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

  // ---- Revenue wallets: every NEAR and wNEAR flow into or out of the three wallets (FastNEAR, exact yoctoNEAR).
  const rec = body(BUYBACK_KEY) as RevenueWalletsBody | undefined;
  const fetchedDay = raws[BUYBACK_KEY]?.fetchedAt?.slice(0, 10) ?? null;
  const lastBuybackDay = fetchedDay ? new Date(Date.parse(`${fetchedDay}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10) : null;
  const yocto = (y: string) => Number(BigInt(y) / 10n ** 18n) / 1e6;
  const wallets = new Set<string>(rec?.wallets ?? []);
  const flows = (rec?.flows ?? []).filter((f) => f.ok).map((f) => ({ ...f, d: new Date(Number(BigInt(f.ts) / 1_000_000n)).toISOString().slice(0, 10), n: yocto(f.yocto) }))
    .filter((f) => !lastBuybackDay || f.d <= lastBuybackDay); // the partial fetch day is left out
  const usdOf = (d: string, n: number) => { const px = nearPx.get(d); return px === undefined ? NaN : n * px; };
  const inWindow = (d: string) => d >= BUYBACKS_START;
  let executedNear = 0, executedUsd = 0, affNear = 0, affUsd = 0, otherNear = 0, frontendUsd = 0, oneClickInUsd = 0, oneClickInNear = 0, capturedUsd = 0, capturedIntents = 0;
  const others = new Set<string>();
  const nonIntents = new Map<string, number>();
  const byDay = new Map<string, number>();
  const mo = new Map<string, { executedNear: number; executedUsd: number; viaOneClickUsd: number; frontendUsd: number; nonIntentsUsd: number; oneClickInUsd: number }>();
  const m = (d: string) => { const k = d.slice(0, 7); const o = mo.get(k) ?? { executedNear: 0, executedUsd: 0, viaOneClickUsd: 0, frontendUsd: 0, nonIntentsUsd: 0, oneClickInUsd: 0 }; mo.set(k, o); return o; };
  let firstReceipt: string | null = null;
  let feBal = 0, ocBal = 0;
  for (const f of flows) {
    const sign = f.dir === 'in' ? 1 : -1;
    if (f.wallet === FRONTEND_FUND) feBal += sign * f.n;
    if (f.wallet === ONECLICK_FUND) ocBal += sign * f.n;
    if (f.dir !== 'in' || !inWindow(f.d)) continue;
    const usd = usdOf(f.d, f.n);
    const external = !wallets.has(f.counterparty);
    if (external) {
      capturedUsd += usd;
      if (f.counterparty === BUYBACK_ROUTE) capturedIntents += usd;
      else { nonIntents.set(f.counterparty, (nonIntents.get(f.counterparty) ?? 0) + usd); m(f.d).nonIntentsUsd += usd; }
    }
    if (f.wallet === BUYBACK_WALLET_ID) {
      if (f.counterparty === BUYBACK_ROUTE) {
        if (firstReceipt === null || f.d < (firstReceipt as string)) firstReceipt = f.d;
        executedNear += f.n; executedUsd += usd; byDay.set(f.d, (byDay.get(f.d) ?? 0) + f.n);
        m(f.d).executedNear += f.n; m(f.d).executedUsd += usd;
      } else if (AFFILIATED_SENDERS.includes(f.counterparty)) { affNear += f.n; affUsd += usd; m(f.d).viaOneClickUsd += usd; }
      else { otherNear += f.n; others.add(f.counterparty); }
    } else if (f.wallet === FRONTEND_FUND && f.counterparty === BUYBACK_ROUTE) { frontendUsd += usd; m(f.d).frontendUsd += usd; }
    else if (f.wallet === ONECLICK_FUND && f.counterparty === BUYBACK_ROUTE) { oneClickInUsd += usd; oneClickInNear += f.n; m(f.d).oneClickInUsd += usd; }
  }
  const priced = Number.isFinite(executedUsd) && Number.isFinite(affUsd) && Number.isFinite(capturedUsd);
  const complete = !!rec && priced;

  // DefiLlama over identical dates: holders revenue (designated) and revenue (captured).
  const iHold = series('defillama.intents.dailyHoldersRevenue');
  const iRevAll = series('defillama.intents.dailyRevenue');
  const sumRange = (s: DailyPoint[]) => (lastBuybackDay ? s.filter(([d]) => d >= BUYBACKS_START && d <= lastBuybackDay).reduce((a, [, v]) => a + v, 0) : null);
  const designatedUsd = sumRange(iHold);
  const llamaRevenueUsd = sumRange(iRevAll);
  const walletNear = ev('ONC-BUYBACK-WALLET');

  // Run rates over the last 90 days common to the executed series and the designation (identical dates).
  const execSeries: DailyPoint[] = [];
  if (firstReceipt && lastBuybackDay) for (let t = Date.parse(`${firstReceipt}T00:00:00Z`); t <= Date.parse(`${lastBuybackDay}T00:00:00Z`); t += 86_400_000) {
    const d = new Date(t).toISOString().slice(0, 10);
    const v = usdOf(d, byDay.get(d) ?? 0);
    if (Number.isFinite(v)) execSeries.push([d, v]);
  }
  const END = commonEnd([execSeries, iHold], 0);
  const execRun = END && complete ? windowAggregate(execSeries, END, RUN).sum : null;
  const desRun = END ? windowAggregate(iHold, END, RUN).sum : null;
  const executedRunRateUsd = execRun !== null ? (execRun * 365) / RUN : null;
  const designatedRunRateUsd = desRun !== null ? (desRun * 365) / RUN : null;
  const monthly = [...new Set([...mo.keys(), ...iHold.filter(([d]) => d >= BUYBACKS_START && (!lastBuybackDay || d <= lastBuybackDay)).map(([d]) => d.slice(0, 7))])].sort().map((k) => {
    const o = mo.get(k) ?? { executedNear: 0, executedUsd: 0, viaOneClickUsd: 0, frontendUsd: 0, nonIntentsUsd: 0, oneClickInUsd: 0 };
    const fin = (x: number) => (Number.isFinite(x) ? x : null);
    return { month: k, executedNear: o.executedNear, executedUsd: fin(o.executedUsd), viaOneClickUsd: fin(o.viaOneClickUsd), oneClickInUsd: fin(o.oneClickInUsd), frontendUsd: fin(o.frontendUsd), nonIntentsUsd: fin(o.nonIntentsUsd),
      designatedUsd: iHold.filter(([d]) => d.startsWith(k) && d >= BUYBACKS_START && (!lastBuybackDay || d <= lastBuybackDay)).reduce((a, [, v]) => a + v, 0) };
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
    { key: 'designated', flow: 'Revenue DefiLlama designates as buybacks', what: 'All NEAR captured into the three revenue wallets since 23 February 2026, relabelled as buybacks', usdPerYear: designatedRunRateUsd, cls: 'label', counted: false, evidence: 'TOK-DESIGNATED-RUNRATE' },
    { key: 'executed', flow: 'NEAR delivered to the buyback wallet', what: `1Click swap output withdrawn from intents.near to ${BUYBACK_WALLET_ID}, valued at each day's price (swap inputs not visible onchain)`, usdPerYear: executedRunRateUsd, cls: 'capture', counted: true, evidence: 'TOK-EXECUTED-RUNRATE' },
    { key: 'frontend', flow: 'Captured revenue kept in the front-end fund', what: `NEAR swept to ${FRONTEND_FUND}; not moved to the buyback wallet`, usdPerYear: null, cls: 'label', counted: false, evidence: 'TOK-FRONTEND-RETAINED' },
    { key: 'burns', flow: 'Gas burned', what: '70% of every gas fee, permanently removed', usdPerYear: burnsUsd, cls: 'capture', counted: true, evidence: 'LAD-NEAR-BURN-RUNRATE' },
    { key: 'emissions', flow: 'Staking emissions', what: 'New NEAR minted for validators and delegators', usdPerYear: emissionsUsd, cls: 'redistribution', counted: false, evidence: 'TOK-GROSS-ISSUANCE' },
    { key: 'net-issuance', flow: 'Net issuance', what: 'Emissions minus burns: the dilution every holder faces (burns are already inside this figure)', usdPerYear: netIssuanceUsd, cls: 'dilution', counted: false, evidence: 'SUP-NET-NEW-ANN-USD' },
    { key: 'apps', flow: 'Ecosystem app revenue (for example RHEA)', what: 'Revenue accruing to applications, not to $NEAR', usdPerYear: null, cls: 'excluded', counted: false, evidence: 'not summed' },
  ];
  const verifiedCaptureUsd = executedRunRateUsd !== null && burnsUsd !== null ? executedRunRateUsd + burnsUsd : null;
  // Supply view: each flow as a share of total supply per year. Burns are inside net issuance; bought NEAR is held, so it
  // absorbs supply from the market without removing it. Nothing is netted across these different effects.
  const supply = { grossIssuance, burns: burnRate, netIssuance: netNewPct,
    buybackAbsorption: executedRunRateUsd !== null && price && totalSupply ? executedRunRateUsd / price / totalSupply : null };

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
  const nonIntentsUsd = [...nonIntents.values()].reduce((a, v) => a + v, 0);
  const findings = [
    `Captured revenue reproduced onchain from the three revenue wallets matches DefiLlama to ${fmtPct(complete ? safeDiv(capturedUsd, llamaRevenueUsd) : null)} over the same dates (FastNEAR vs Dune, independent paths). DefiLlama labels all of it as buybacks from ${BUYBACKS_START}.`,
    `Of the ${fmtUsd(designatedUsd)} designated since then, ${fmtUsd(complete ? executedUsd : null)} (${fmtPct(complete ? safeDiv(executedUsd, designatedUsd) : null)}) reached the buyback wallet directly from 1Click swaps and ${fmtUsd(complete ? affUsd : null)} more was moved there from the 1Click fund (counting the moved NEAR at its value when captured, ${fmtPct(complete ? safeDiv(executedUsd + oneClickInUsd * Math.min(1, oneClickInNear ? affNear / oneClickInNear : 0), designatedUsd) : null)} of the designation reached the buyback wallet). ${fmtUsd(complete ? frontendUsd : null)} of Intents revenue stayed in the front-end fund, and ${fmtUsd(complete ? nonIntentsUsd : null)} came from accounts other than intents.near (${[...nonIntents.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k).join(', ')}).`,
    `Run rate on identical dates: ${fmtUsd(executedRunRateUsd)} a year delivered to the buyback wallet against ${fmtUsd(designatedRunRateUsd)} designated. The swap inputs are not visible onchain without the Intents Explorer API, so delivery is verified, not the purchase price.`,
    `Supply view, per year as a share of total supply: gross issuance ${fmtPct(grossIssuance, 2)}, burns ${fmtPct(burnRate, 3)} (inside net issuance), net issuance ${fmtPct(netNewPct, 2)}; buybacks absorb ${fmtPct(supply.buybackAbsorption, 2)} into a held wallet without removing it. These are different effects and are not netted into one dollar figure.`,
    `Staking: ${fmtPct(stakingRatio, 0)} of supply is staked; nominal yield ${fmtPct(nominalYield)}, ${fmtPct(realYieldStaker)} after dilution for stakers and ${fmtPct(realYieldNonStaker)} for non-stakers.`,
    near && near.dilutionNetOfCapture !== null ? `Dilution net of capture over the last year (circulating supply growth excluding one-day events, minus held buybacks): NEAR ${fmtPct(near.dilutionNetOfCapture)}, ${dRank.findIndex((x) => x.label === 'NEAR') + 1} lowest of ${dRank.length}; ${dRank.map((x) => `${x.label} ${fmtPct(x.dilutionNetOfCapture)}`).join(', ')}. As-reported supply changes, including one-day events, are shown alongside.` : 'Dilution net of capture unavailable.',
  ];

  return {
    version: TOKENOMICS_VERSION, windowEnd: END,
    buybacks: {
      windowStart: BUYBACKS_START, firstReceipt, lastDay: lastBuybackDay, txCount: rec ? Object.values(rec.txCount).reduce((a, v) => a + v, 0) : 0,
      capturedUsd: complete ? capturedUsd : null, capturedFromIntentsUsd: complete ? capturedIntents : null, nonIntentsUsd: complete ? nonIntentsUsd : null,
      nonIntentsSources: [...nonIntents.entries()].map(([source, usd]) => ({ source, usd })).sort((a, b) => b.usd - a.usd),
      llamaRevenueUsd, reproductionRatio: complete ? safeDiv(capturedUsd, llamaRevenueUsd) : null,
      executedNear, executedUsd: complete ? executedUsd : null, affiliatedNear: affNear, affiliatedUsd: complete ? affUsd : null,
      otherSendersNear: otherNear, otherSenders: [...others].sort(),
      frontendUsd: complete ? frontendUsd : null, oneClickInUsd: complete ? oneClickInUsd : null, frontendBalanceNear: rec ? feBal : null, oneClickBalanceNear: rec ? ocBal : null,
      designatedUsd, executedToDesignated: complete ? safeDiv(executedUsd, designatedUsd) : null, // Revenue that reached the buyback wallet, valued when it was captured: direct deliveries, plus the share of the
      // 1Click fund's captured NEAR that was later moved to the wallet.
      executedBroadToDesignated: complete ? safeDiv(executedUsd + oneClickInUsd * Math.min(1, oneClickInNear ? affNear / oneClickInNear : 0), designatedUsd) : null,
      walletNear, walletReconciles: safeDiv(walletNear, executedNear + affNear + otherNear),
      executedRunRateUsd, designatedRunRateUsd, monthly, avgPurchasePrice: complete ? safeDiv(executedUsd, executedNear) : null,
      pctOfSupplyPerYear: supply.buybackAbsorption,
      executedDaily: complete ? execSeries.map(([d, v]) => [d, Math.round(v * 100) / 100] as [string, number]) : [],
    },
    staking: { stakedNear, totalSupply, stakingRatio, grossIssuance, validatorShare, nominalYield, realYieldStaker, realYieldNonStaker, validators: Number.isFinite(v?.currentCount) ? v.currentCount : null },
    taxonomy, verifiedCaptureUsd, netIssuanceUsd, supply, assets, findings,
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
  const fastnear = { sourceName: 'FastNEAR transactions API', sourceUrl: `https://nearblocks.io/address/${BUYBACK_WALLET_ID}`, fetchedAt: fetched(BUYBACK_KEY).at, rawResponseHash: fetched(BUYBACK_KEY).hash };
  item({ evidenceId: 'TOK-CAPTURED-REPRODUCED', metricKey: 'tokenomics.captured.reproduced', label: `Captured revenue reproduced onchain since ${b.windowStart} (inflows to the three revenue wallets)`, unit: 'USD', value: b.capturedUsd, observationType: 'OBSERVED', ...fastnear,
    periodStart: b.windowStart, periodEnd: b.lastDay, methodology: `NEAR and wNEAR moved into ${FRONTEND_FUND}, ${ONECLICK_FUND} or ${BUYBACK_WALLET_ID} from any account outside those three (DefiLlama's own definition), valued at each day's price.`, transform: 'sum(inflow_d x price_d)' });
  item({ evidenceId: 'TOK-REPRODUCTION-RATIO', metricKey: 'tokenomics.captured.reproduction_ratio', label: 'Reproduced captured revenue / DefiLlama revenue, same dates', unit: 'fraction', value: b.reproductionRatio, inputs: ['TOK-CAPTURED-REPRODUCED'],
    methodology: 'Independent check of DefiLlama\'s adapter (Dune) with FastNEAR transaction data; close to 100% means the adapter measures what it says.', transform: 'reproduced / DefiLlama revenue' });
  item({ evidenceId: 'TOK-NON-INTENTS-INFLOWS', metricKey: 'tokenomics.captured.non_intents', label: 'Captured "revenue" from accounts other than intents.near since buybacks began', unit: 'USD', value: b.nonIntentsUsd, ...fastnear, observationType: 'OBSERVED',
    validationNotes: b.nonIntentsSources.map((x) => `${x.source} $${(x.usd / 1e3).toFixed(0)}K`).join(', ') || null, methodology: 'Counted as revenue (and as buybacks) by DefiLlama\'s method, but not shown to come from Intents.', transform: 'sum' });
  item({ evidenceId: 'TOK-FRONTEND-RETAINED', metricKey: 'tokenomics.frontend.retained', label: 'Intents revenue swept to the front-end fund since buybacks began (not moved to the buyback wallet)', unit: 'USD', value: b.frontendUsd, ...fastnear, observationType: 'OBSERVED',
    validationNotes: b.frontendBalanceNear !== null ? `Front-end fund NEAR from all reconstructed flows: ${b.frontendBalanceNear.toFixed(0)}.` : null, methodology: `Inflows to ${FRONTEND_FUND} from intents.near. DefiLlama counts these as buybacks; they are held in a DAO fund, not in the buyback wallet.`, transform: 'sum(inflow_d x price_d)' });
  item({ evidenceId: 'TOK-EXECUTED-NEAR', metricKey: 'tokenomics.executed_buybacks.near', label: `NEAR delivered to ${BUYBACK_WALLET_ID} by 1Click swaps since ${b.firstReceipt ?? 'n/a'}`, unit: 'NEAR', value: b.executedNear,
    observationType: 'OBSERVED', ...fastnear, periodStart: b.firstReceipt, periodEnd: b.lastDay,
    methodology: 'NEAR withdrawn from intents.near to the buyback wallet: the output of 1Click swaps routed to the wallet through one-time intermediate accounts. Delivery is verified onchain; the swap inputs and prices are not visible without the Intents Explorer API.', transform: 'sum(transfers)' });
  item({ evidenceId: 'TOK-EXECUTED-USD', metricKey: 'tokenomics.executed_buybacks.usd', label: 'NEAR delivered to the buyback wallet, valued at each day\'s price', unit: 'USD', value: b.executedUsd, inputs: ['TOK-EXECUTED-NEAR'],
    periodStart: b.firstReceipt, periodEnd: b.lastDay, methodology: 'Each day\'s NEAR times that day\'s price (CoinGecko daily, DefiLlama fallback). Unavailable if any day lacks a price.', transform: 'sum(NEAR_d x price_d)' });
  item({ evidenceId: 'TOK-DESIGNATED-SINCE', metricKey: 'tokenomics.designated.since_start', label: `Revenue DefiLlama designates as buybacks, ${b.windowStart} to ${b.lastDay ?? 'n/a'}`, unit: 'USD', value: b.designatedUsd, sourceName: 'DefiLlama',
    observationType: 'OBSERVED', fetchedAt: fetched('defillama.intents.dailyHoldersRevenue').at, rawResponseHash: fetched('defillama.intents.dailyHoldersRevenue').hash, periodStart: b.windowStart, periodEnd: b.lastDay,
    methodology: 'Sum of NEAR Intents holders revenue over exactly the same dates as the onchain measures.', transform: 'sum(daily holders revenue)' });
  item({ evidenceId: 'TOK-EXECUTED-VS-DESIGNATED', metricKey: 'tokenomics.executed_vs_designated', label: 'Delivered directly to the buyback wallet, as a share of designated buybacks (same dates)', unit: 'fraction', value: b.executedToDesignated,
    inputs: ['TOK-EXECUTED-USD', 'TOK-DESIGNATED-SINCE'], periodStart: b.windowStart, periodEnd: b.lastDay, methodology: 'The rest of the designation is NEAR moved later from the 1Click fund, NEAR kept in the front-end fund, and inflows from other accounts (see the reconciliation table).', transform: 'TOK-EXECUTED-USD / TOK-DESIGNATED-SINCE' });
  item({ evidenceId: 'TOK-AFFILIATED-USD', metricKey: 'tokenomics.affiliated_transfers.usd', label: `NEAR moved to the buyback wallet from ${ONECLICK_FUND}, valued at each day's price`, unit: 'USD', value: b.affiliatedUsd, confidence: 'medium',
    methodology: `Captured revenue swept to the 1Click fund (from intents.near) and later moved to the buyback wallet. DefiLlama counts it once, when it reached the fund. ${b.affiliatedNear.toFixed(0)} NEAR.`, transform: 'sum(NEAR_d x price_d)' });
  item({ evidenceId: 'TOK-EXECUTED-BROAD-VS-DESIGNATED', metricKey: 'tokenomics.executed_broad_vs_designated', label: 'All NEAR that reached the buyback wallet (direct and via the 1Click fund), as a share of designated', unit: 'fraction', value: b.executedBroadToDesignated, inputs: ['TOK-EXECUTED-USD', 'TOK-AFFILIATED-USD', 'TOK-DESIGNATED-SINCE'],
    methodology: 'Designated revenue that ended up in the buyback wallet, same dates, each part valued when it was captured: direct deliveries plus the share of the 1Click fund\'s captured NEAR later moved to the wallet.', transform: '(direct + 1Click fund inflows x share moved) / designated' });
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
  item({ evidenceId: 'TOK-VERIFIED-CAPTURE', metricKey: 'tokenomics.verified_capture', label: 'Verified value capture per year (NEAR delivered to the buyback wallet + burns)', unit: 'USD', value: t.verifiedCaptureUsd, inputs: ['TOK-EXECUTED-RUNRATE', 'LAD-NEAR-BURN-RUNRATE'],
    methodology: 'A gross measure of what reaches $NEAR. It is not netted against issuance: burns are already inside net issuance, and held buybacks absorb rather than remove supply.', transform: 'delivered + burns' });
  item({ evidenceId: 'TOK-BUYBACK-ABSORPTION', metricKey: 'tokenomics.supply.buyback_absorption', label: 'NEAR delivered to the buyback wallet per year, as a share of total supply', unit: 'fraction', value: t.supply.buybackAbsorption, inputs: ['TOK-EXECUTED-RUNRATE', 'ONC-TOTAL-SUPPLY'],
    methodology: 'Held, not burned: it absorbs supply from the market without removing it. Compare with net issuance (SUP-NET-NEW-ANN-PCT), which already includes burns; the two are not netted.', transform: 'run rate / price / total supply' });
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
