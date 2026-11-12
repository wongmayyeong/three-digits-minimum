/**
 * Builds the evidence register from raw provider responses. Pure and deterministic:
 * the same raw records always produce byte-identical evidence, which is what lets
 * `npm run research:rebuild` reproduce published figures offline.
 *
 * Rules:
 *  - A metric whose inputs are missing or incomplete is emitted with available=false and a
 *    reason. Nothing is estimated to fill a gap.
 *  - Windows are explicit and matched: ratios only combine series over the same dates.
 *  - Untrusted provider text is sanitized and stored as data, never as instructions.
 */
import type { RawRecord } from '@/lib/data/fetcher';
import { BUYBACK_WALLET, PEER_CHAINS, SOURCES, type SourceId } from '@/lib/data/sources';
import { computeModel, FORMULA_VERSION, requiredTakeRate, runScenarios, sensitivity, allocationSensitivity, type ModelInputs, type ScenarioRun, type SensitivityMatrix } from './model';
import { addDays, commonEnd, fromUnixPairs, isoDay, lastDay, pctChange, safeDiv, valueOn, weeklyMeans, weeklySums, windowAggregate, type DailyPoint } from './series';
import type { EvidenceDraft, EvidenceGroup, SeriesDef, Unit } from './types';
import { analyzeThesis, thesisEvidence, type ThesisResult } from './thesis';
import { analyzeLadder, basisEvidence, basisScenarios, ladderEvidence, type BasisScenario, type LadderResult } from './ladder';
import { analyzeTokenomics, tokenomicsEvidence, type TokenomicsResult } from './tokenomics';
import { analyzeValuation, valuationEvidence, type ValuationResult } from './valuation';
import { analyzeEconomy, economyEvidence, type EconomyResult } from './economy';
import { analyzeCrossChain, crossChainEvidence, type CrossChainResult } from './crosschain';
import { analyzeMarket, marketEvidence, type MarketResult } from './market';
import { analyzeHypotheses, hypothesesEvidence, type HypothesesResult } from './hypotheses';

export const METHODOLOGY_VERSION = 'nebube-evidence-1.1.0';

export type RawMap = Record<string, RawRecord | null | undefined>;

export interface ResearchDataset {
  methodologyVersion: string;
  formulaVersion: string;
  windowEnd: string | null;
  peerWindowEnd: string | null;
  evidence: EvidenceDraft[];
  modelBase: ModelInputs;
  scenarios: ScenarioRun[];
  feeSensitivity: SensitivityMatrix;
  allocationMatrix: SensitivityMatrix;
  thesis: ThesisResult;
  ladder: LadderResult;
  tokenomics: TokenomicsResult;
  basis: BasisScenario[];
  valuation: ValuationResult;
  economy: EconomyResult;
  crossChain: CrossChainResult;
  market: MarketResult;
  hypotheses: HypothesesResult;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

const YOCTO = 10n ** 24n;
function yoctoToNear(y: string | null | undefined): number | null {
  if (!y || !/^\d+$/.test(y)) return null;
  const big = BigInt(y);
  return Number(big / YOCTO) + Number(big % YOCTO) / 1e24;
}

/** Strips control characters, markup and excess length from provider-supplied prose. */
export function sanitizeText(s: unknown, max = 600): string | null {
  if (typeof s !== 'string') return null;
  const clean = s.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return clean ? clean.slice(0, max) : null;
}

class Builder {
  items: EvidenceDraft[] = [];
  constructor(private raws: RawMap) {}

  rec(key: string): RawRecord | null {
    return this.raws[key] ?? null;
  }

  sourceFor(key: string): { name: string; source: SourceId | 'derived' } {
    const r = this.rec(key);
    return r ? { name: SOURCES[r.source].name, source: r.source } : { name: 'unavailable', source: 'derived' };
  }

  add(d: Partial<EvidenceDraft> & Pick<EvidenceDraft, 'evidenceId' | 'metricKey' | 'group' | 'label' | 'unit' | 'methodology'>, rawKey?: string): EvidenceDraft {
    const r = rawKey ? this.rec(rawKey) : null;
    const item: EvidenceDraft = {
      value: null,
      valueText: null,
      observationType: 'OBSERVED',
      available: false,
      sourceName: d.sourceName ?? (r ? SOURCES[r.source].name : 'Computed here'),
      sourceUrl: d.sourceUrl ?? (r ? r.url : '/methodology'),
      observedAt: d.observedAt ?? null,
      fetchedAt: d.fetchedAt ?? r?.fetchedAt ?? null,
      periodStart: d.periodStart ?? null,
      periodEnd: d.periodEnd ?? null,
      transform: d.transform ?? 'identity',
      confidence: d.confidence ?? 'high',
      rawResponseHash: d.rawResponseHash ?? r?.sha256 ?? null,
      validationNotes: d.validationNotes ?? null,
      series: d.series ?? null,
      inputs: d.inputs ?? [],
      ...d,
    } as EvidenceDraft;
    if (item.value !== null && !Number.isFinite(item.value)) item.value = null;
    item.available = item.valueText !== null ? (d.available ?? true) : item.value !== null;
    if (!item.available) item.value = null;
    this.items.push(item);
    return item;
  }

  unavailable(d: Pick<EvidenceDraft, 'evidenceId' | 'metricKey' | 'group' | 'label' | 'unit' | 'methodology'> & { reason: string; sourceName?: string; sourceUrl?: string; observationType?: EvidenceDraft['observationType'] }, rawKey?: string) {
    return this.add({ ...d, value: null, available: false, validationNotes: d.reason, confidence: 'low' }, rawKey);
  }

  get(id: string): EvidenceDraft | undefined {
    return this.items.find((i) => i.evidenceId === id);
  }

  val(id: string): number | null {
    const it = this.get(id);
    return it?.available ? it.value : null;
  }

  /** Adds a DERIVED item computed from other evidence items. */
  derive(d: Pick<EvidenceDraft, 'evidenceId' | 'metricKey' | 'group' | 'label' | 'unit' | 'methodology' | 'transform'> & { inputs: string[]; compute: (...v: number[]) => number | null; periodStart?: string | null; periodEnd?: string | null; confidence?: EvidenceDraft['confidence']; validationNotes?: string }) {
    const vals = d.inputs.map((id) => this.val(id));
    const missing = d.inputs.filter((_, i) => vals[i] === null);
    const value = missing.length ? null : d.compute(...(vals as number[]));
    const ok = value !== null && Number.isFinite(value);
    return this.add({
      evidenceId: d.evidenceId, metricKey: d.metricKey, group: d.group, label: d.label, unit: d.unit, methodology: d.methodology,
      transform: d.transform, inputs: d.inputs, value: ok ? value : null, observationType: 'DERIVED', sourceName: 'Computed here',
      sourceUrl: '/methodology', periodStart: d.periodStart ?? null, periodEnd: d.periodEnd ?? null, confidence: d.confidence ?? 'medium',
      validationNotes: ok ? d.validationNotes ?? null : `Not computed: ${missing.length ? `missing ${missing.join(', ')}` : 'non-finite or division by zero'}.`,
      fetchedAt: null, rawResponseHash: null,
    });
  }
}

function seriesOf(label: string, unit: Unit, aggregation: SeriesDef['aggregation'], points: DailyPoint[]): SeriesDef | null {
  return points.length ? { label, unit, aggregation, points: points.map(([d, v]) => [d, Math.round(v * 1e6) / 1e6]) } : null;
}

export function buildDataset(raws: RawMap): ResearchDataset {
  const B = new Builder(raws);
  const llama = (key: string): DailyPoint[] => fromUnixPairs((B.rec(key)?.body as any)?.chart);

  // ------------------------------------------------------------ market (CoinGecko)
  const markets: any[] = Array.isArray(B.rec('coingecko.markets')?.body) ? (B.rec('coingecko.markets')!.body as any[]) : [];
  const coin = (id: string) => markets.find((m) => m.id === id);
  const near = coin('near');
  const cgNote = 'CoinGecko circulating market cap = price x CoinGecko circulating supply. Free-tier data can lag a few minutes.';
  B.add({ evidenceId: 'MKT-NEAR-MCAP', metricKey: 'near.market_cap', group: 'market', label: 'NEAR circulating market cap', unit: 'USD',
    value: near ? near.marketCap : null, observedAt: near?.lastUpdated ?? null, methodology: cgNote, transform: 'coins/markets.market_cap' }, 'coingecko.markets');
  B.add({ evidenceId: 'MKT-NEAR-PRICE', metricKey: 'near.price', group: 'market', label: 'NEAR price', unit: 'USD',
    value: near ? near.price : null, observedAt: near?.lastUpdated ?? null, methodology: 'CoinGecko aggregated spot price.', transform: 'coins/markets.current_price' }, 'coingecko.markets');
  B.add({ evidenceId: 'MKT-NEAR-CIRC', metricKey: 'near.circulating_supply', group: 'market', label: 'NEAR circulating supply (CoinGecko)', unit: 'NEAR',
    value: near ? near.circulating : null, observedAt: near?.lastUpdated ?? null, methodology: 'CoinGecko circulating supply figure; definitions differ by provider.', transform: 'coins/markets.circulating_supply' }, 'coingecko.markets');
  const peerCode: Record<string, string> = { near: 'NEAR', solana: 'SOL', sui: 'SUI', 'avalanche-2': 'AVAX' };
  for (const p of PEER_CHAINS) {
    if (p.coin === 'near') continue;
    const c = coin(p.coin);
    B.add({ evidenceId: `MKT-${peerCode[p.coin]}-MCAP`, metricKey: `${p.coin}.market_cap`, group: 'peers', label: `${p.label} circulating market cap`, unit: 'USD',
      value: c ? c.marketCap : null, observedAt: c?.lastUpdated ?? null, methodology: cgNote, transform: 'coins/markets.market_cap' }, 'coingecko.markets');
  }
  const hist = B.rec('coingecko.near.history')?.body as any;
  const mcapHist = fromUnixPairs(hist?.marketCaps);
  const histEnd = lastDay(mcapHist);
  if (histEnd && mcapHist.length > 300) {
    const yearAgo = addDays(histEnd, -364);
    const then = valueOn(mcapHist, yearAgo) ?? mcapHist[0]![1];
    const now = mcapHist[mcapHist.length - 1]![1];
    const weekly = mcapHist.filter((_, i) => (mcapHist.length - 1 - i) % 7 === 0);
    B.add({ evidenceId: 'MKT-NEAR-MCAP-1Y', metricKey: 'near.market_cap.change_365d', group: 'market', label: 'NEAR market cap change, trailing 365 days', unit: 'fraction',
      value: pctChange(then, now), periodStart: mcapHist[0]![0], periodEnd: histEnd, observationType: 'DERIVED',
      methodology: 'Percent change between the first and last daily market cap in CoinGecko\'s 365-day history.', transform: '(last - first) / first',
      series: seriesOf('NEAR market cap', 'USD', 'level', weekly) }, 'coingecko.near.history');
  } else {
    B.unavailable({ evidenceId: 'MKT-NEAR-MCAP-1Y', metricKey: 'near.market_cap.change_365d', group: 'market', label: 'NEAR market cap change, trailing 365 days', unit: 'fraction',
      methodology: 'CoinGecko 365-day history.', reason: 'CoinGecko market chart unavailable or shorter than 300 days.' }, 'coingecko.near.history');
  }

  // ------------------------------------------------------------ NEAR Intents (DefiLlama)
  const iVol = llama('defillama.intents.volume');
  const iFees = llama('defillama.intents.dailyFees');
  const iRev = llama('defillama.intents.dailyRevenue');
  const iHold = llama('defillama.intents.dailyHoldersRevenue');
  const END = commonEnd([iVol, iFees, iRev, iHold], 1);
  const W = 90;
  const intentsUrl = 'https://defillama.com/protocol/near-intents';
  const methodology = (B.rec('defillama.intents.dailyFees')?.body as any)?.methodology ?? {};
  const llamaDef = (k: string) => sanitizeText(methodology?.[k], 400) ?? 'Not stated by DefiLlama.';

  const sumItem = (id: string, key: string, label: string, series: DailyPoint[], rawKey: string, def: string, end: string | null, days: number, chart?: string) => {
    if (!end) return B.unavailable({ evidenceId: id, metricKey: key, group: 'intents', label, unit: 'USD', methodology: def, reason: 'Series missing; no common window.' }, rawKey);
    const agg = windowAggregate(series, end, days);
    return B.add({ evidenceId: id, metricKey: key, group: 'intents', label, unit: 'USD', value: agg.sum, periodStart: agg.start, periodEnd: agg.end, observedAt: agg.end,
      methodology: def, transform: `sum of daily values over ${days} days ending ${agg.end}`, sourceUrl: intentsUrl,
      validationNotes: agg.sum === null ? `Window incomplete: ${agg.coveredDays}/${days} days present.` : null,
      series: chart ? seriesOf(chart, 'USD', 'sum7', weeklySums(series, end, 52)) : null }, rawKey);
  };

  sumItem('INT-VOL-90D', 'intents.volume.90d', 'NEAR Intents swap volume, 90 days', iVol, 'defillama.intents.volume',
    'DefiLlama near-intents DEX adapter, daily swap volume in USD.', END, W, 'Weekly NEAR Intents volume');
  sumItem('INT-VOL-PRIOR-90D', 'intents.volume.prior_90d', 'NEAR Intents swap volume, prior 90 days', iVol, 'defillama.intents.volume',
    'Same adapter, the 90 days immediately before the current window.', END ? addDays(END, -W) : null, W);
  sumItem('INT-FEES-90D', 'intents.fees.90d', 'NEAR Intents gross fees, 90 days', iFees, 'defillama.intents.dailyFees', `DefiLlama definition: ${llamaDef('Fees')}`, END, W, 'Weekly NEAR Intents gross fees');
  sumItem('INT-FEES-PRIOR-90D', 'intents.fees.prior_90d', 'NEAR Intents gross fees, prior 90 days', iFees, 'defillama.intents.dailyFees', `DefiLlama definition: ${llamaDef('Fees')}`, END ? addDays(END, -W) : null, W);
  sumItem('INT-REV-90D', 'intents.revenue.90d', 'NEAR Intents captured revenue, 90 days', iRev, 'defillama.intents.dailyRevenue', `DefiLlama definition: ${llamaDef('Revenue')}`, END, W, 'Weekly NEAR-captured Intents revenue');
  sumItem('INT-REV-PRIOR-90D', 'intents.revenue.prior_90d', 'NEAR Intents captured revenue, prior 90 days', iRev, 'defillama.intents.dailyRevenue', `DefiLlama definition: ${llamaDef('Revenue')}`, END ? addDays(END, -W) : null, W);
  sumItem('INT-BUYBACK-90D', 'intents.holders_revenue.90d', 'Revenue DefiLlama classifies as buybacks, 90 days', iHold, 'defillama.intents.dailyHoldersRevenue', `DefiLlama definition: ${llamaDef('HoldersRevenue')}`, END, W);

  const winStart = END ? addDays(END, -(W - 1)) : null;
  const prevStart = END ? addDays(END, -(2 * W - 1)) : null;
  const prevEnd = END ? addDays(END, -W) : null;
  B.derive({ evidenceId: 'INT-VOL-ANN', metricKey: 'intents.volume.annualized', group: 'intents', label: 'NEAR Intents annualized volume (V)', unit: 'USD',
    inputs: ['INT-VOL-90D'], compute: (v) => (v * 365) / W, transform: 'INT-VOL-90D x 365 / 90', periodStart: winStart, periodEnd: END,
    methodology: 'Run rate: trailing 90-day volume scaled to a year. Assumes the recent 90 days persist; it is not a forecast.' });
  B.derive({ evidenceId: 'INT-VOL-GROWTH', metricKey: 'intents.volume.growth_90d', group: 'intents', label: 'Volume change, last 90 days vs prior 90 days', unit: 'fraction',
    inputs: ['INT-VOL-PRIOR-90D', 'INT-VOL-90D'], compute: (a, b) => pctChange(a, b), transform: '(INT-VOL-90D - INT-VOL-PRIOR-90D) / INT-VOL-PRIOR-90D',
    periodStart: prevStart, periodEnd: END, methodology: 'Matched consecutive 90-day windows from the same adapter.' });
  B.derive({ evidenceId: 'INT-FEE-RATE', metricKey: 'intents.fee_rate', group: 'intents', label: 'Effective gross fee rate (f)', unit: 'fraction',
    inputs: ['INT-FEES-90D', 'INT-VOL-90D'], compute: (f, v) => safeDiv(f, v), transform: 'INT-FEES-90D / INT-VOL-90D', periodStart: winStart, periodEnd: END,
    methodology: 'Gross fees (protocol + distributor fees) divided by volume over the same 90 days and the same DefiLlama protocol scope.' });
  B.derive({ evidenceId: 'INT-FEE-RATE-PRIOR', metricKey: 'intents.fee_rate.prior', group: 'intents', label: 'Effective gross fee rate, prior 90 days', unit: 'fraction',
    inputs: ['INT-FEES-PRIOR-90D', 'INT-VOL-PRIOR-90D'], compute: (f, v) => safeDiv(f, v), transform: 'INT-FEES-PRIOR-90D / INT-VOL-PRIOR-90D', periodStart: prevStart, periodEnd: prevEnd,
    methodology: 'Same definition, prior window. Compare with INT-FEE-RATE to see fee compression or expansion.' });
  B.derive({ evidenceId: 'INT-CAPTURE', metricKey: 'intents.capture_rate', group: 'intents', label: 'Protocol capture of gross fees (c)', unit: 'fraction',
    inputs: ['INT-REV-90D', 'INT-FEES-90D'], compute: (r, f) => safeDiv(r, f), transform: 'INT-REV-90D / INT-FEES-90D', periodStart: winStart, periodEnd: END,
    methodology: 'NEAR-captured revenue (swept to NEAR revenue wallets) divided by gross fees. The remainder goes to solvers and distribution partners.' });
  B.derive({ evidenceId: 'INT-CAPTURE-PRIOR', metricKey: 'intents.capture_rate.prior', group: 'intents', label: 'Protocol capture of gross fees, prior 90 days', unit: 'fraction',
    inputs: ['INT-REV-PRIOR-90D', 'INT-FEES-PRIOR-90D'], compute: (r, f) => safeDiv(r, f), transform: 'INT-REV-PRIOR-90D / INT-FEES-PRIOR-90D', periodStart: prevStart, periodEnd: prevEnd,
    methodology: 'Same definition as INT-CAPTURE, prior window.' });
  B.derive({ evidenceId: 'INT-TAKE-RATE', metricKey: 'intents.take_rate', group: 'intents', label: 'NEAR-captured revenue per dollar of volume (f x c)', unit: 'fraction',
    inputs: ['INT-REV-90D', 'INT-VOL-90D'], compute: (r, v) => safeDiv(r, v), transform: 'INT-REV-90D / INT-VOL-90D', periodStart: winStart, periodEnd: END,
    methodology: 'Captured revenue divided by volume over the same window: how much of each swapped dollar NEAR keeps.' });
  B.derive({ evidenceId: 'INT-TAKE-RATE-PRIOR', metricKey: 'intents.take_rate.prior', group: 'intents', label: 'NEAR-captured revenue per dollar of volume, prior 90 days', unit: 'fraction',
    inputs: ['INT-REV-PRIOR-90D', 'INT-VOL-PRIOR-90D'], compute: (r, v) => safeDiv(r, v), transform: 'INT-REV-PRIOR-90D / INT-VOL-PRIOR-90D', periodStart: prevStart, periodEnd: prevEnd,
    methodology: 'Same definition, prior window. A falling take rate while volume grows means value capture lags activity.' });
  B.derive({ evidenceId: 'INT-BUYBACK-SHARE', metricKey: 'intents.buyback_share', group: 'intents', label: 'Share of captured revenue classified as buybacks (b)', unit: 'fraction',
    inputs: ['INT-BUYBACK-90D', 'INT-REV-90D'], compute: (h, r) => safeDiv(h, r), transform: 'INT-BUYBACK-90D / INT-REV-90D', periodStart: winStart, periodEnd: END,
    confidence: 'low', validationNotes: 'Depends on DefiLlama\'s classification of revenue as holders revenue; not an onchain-verified allocation policy and not guaranteed to continue.',
    methodology: 'DefiLlama holders revenue divided by captured revenue over the same window.' });
  B.derive({ evidenceId: 'INT-REV-ANN', metricKey: 'intents.revenue.annualized', group: 'intents', label: 'NEAR Intents captured revenue, annualized', unit: 'USD',
    inputs: ['INT-REV-90D'], compute: (r) => (r * 365) / W, transform: 'INT-REV-90D x 365 / 90', periodStart: winStart, periodEnd: END,
    methodology: 'Run rate of NEAR-captured revenue. Not a forecast.' });
  B.add({ evidenceId: 'INT-DEFINITIONS', metricKey: 'intents.definitions', group: 'intents', label: 'DefiLlama fee and revenue definitions for NEAR Intents', unit: 'text', observationType: 'REPORTED',
    valueText: ['Fees', 'Revenue', 'SupplySideRevenue', 'HoldersRevenue'].map((k) => `${k}: ${llamaDef(k)}`).join(' | '), available: !!B.rec('defillama.intents.dailyFees'),
    methodology: 'Adapter methodology text published by DefiLlama, stored verbatim after sanitization. Treated as a third-party claim.', transform: 'methodology fields',
    sourceUrl: 'https://github.com/DefiLlama/dimension-adapters/tree/master/fees/near-intents', confidence: 'medium' }, 'defillama.intents.dailyFees');

  // ------------------------------------------------------------ onchain (NEAR RPC)
  const wallet = B.rec('near-rpc.buyback-wallet')?.body as any;
  const wnear = B.rec('near-rpc.buyback-wnear')?.body as any;
  const walletNear = wallet ? yoctoToNear(wallet.amountYocto) : null;
  const wnearNear = wnear ? yoctoToNear(String(wnear.balance)) : null;
  B.add({ evidenceId: 'ONC-BUYBACK-WALLET', metricKey: 'onchain.buyback_wallet.near', group: 'onchain', label: `NEAR held by ${BUYBACK_WALLET}`, unit: 'NEAR',
    value: walletNear !== null ? walletNear + (wnearNear ?? 0) : null, observedAt: wallet ? `block ${wallet.blockHeight}` : null,
    methodology: 'Native NEAR balance plus wNEAR balance of the buyback multisig, read at final block. Tokens held here are acquired, not burned; total supply is unchanged unless they are burned.',
    transform: 'view_account.amount + wrap.near ft_balance_of, yocto / 1e24', sourceUrl: `https://nearblocks.io/address/${BUYBACK_WALLET}`,
    validationNotes: wnearNear === null ? 'wNEAR balance read failed; native balance only.' : null }, 'near-rpc.buyback-wallet');
  const block = B.rec('near-rpc.block')?.body as any;
  B.add({ evidenceId: 'ONC-TOTAL-SUPPLY', metricKey: 'onchain.total_supply', group: 'onchain', label: 'NEAR total supply (protocol)', unit: 'NEAR',
    value: block ? yoctoToNear(block.totalSupplyYocto) : null, observedAt: block ? `block ${block.height}` : null,
    methodology: 'total_supply from the final block header.', transform: 'header.total_supply / 1e24', sourceUrl: 'https://nearblocks.io/' }, 'near-rpc.block');
  const cfg = B.rec('near-rpc.protocol-config')?.body as any;
  const rate = Array.isArray(cfg?.maxInflationRate) && cfg.maxInflationRate.length === 2 ? Number(cfg.maxInflationRate[0]) / Number(cfg.maxInflationRate[1]) : null;
  B.add({ evidenceId: 'ONC-MAX-INFLATION', metricKey: 'onchain.max_inflation_rate', group: 'onchain', label: 'Protocol maximum annual inflation rate', unit: 'fraction',
    value: rate, observedAt: cfg ? `protocol ${cfg.protocolVersion}` : null,
    methodology: 'max_inflation_rate from EXPERIMENTAL_protocol_config. Realized issuance can be lower (it depends on validator uptime).', transform: 'numerator / denominator',
    sourceUrl: 'https://docs.near.org/api/rpc/protocol' }, 'near-rpc.protocol-config');
  B.derive({ evidenceId: 'ONC-BUYBACK-PCT-SUPPLY', metricKey: 'onchain.buyback_wallet.share_supply', group: 'onchain', label: 'Buyback wallet holdings as share of total supply', unit: 'fraction',
    inputs: ['ONC-BUYBACK-WALLET', 'ONC-TOTAL-SUPPLY'], compute: (a, b) => safeDiv(a, b), transform: 'ONC-BUYBACK-WALLET / ONC-TOTAL-SUPPLY',
    methodology: 'Both values read from the same RPC at nearly the same block.' });
  B.derive({ evidenceId: 'ONC-ISSUANCE-USD', metricKey: 'onchain.max_issuance_usd', group: 'onchain', label: 'Maximum annual issuance at current price', unit: 'USD',
    inputs: ['ONC-MAX-INFLATION', 'ONC-TOTAL-SUPPLY', 'MKT-NEAR-PRICE'], compute: (r, s, p) => r * s * p, transform: 'ONC-MAX-INFLATION x ONC-TOTAL-SUPPLY x MKT-NEAR-PRICE',
    confidence: 'low', methodology: 'Upper bound on new tokens per year valued at today\'s price, for comparison with buyback demand. Not a measure of sell pressure.' });

  // ------------------------------------------------------------ activity (NearBlocks)
  const nb: any[] = Array.isArray(B.rec('nearblocks.charts')?.body) ? (B.rec('nearblocks.charts')!.body as any[]) : [];
  const nbSeries = (f: string): DailyPoint[] => nb.filter((r) => Number.isFinite(r[f])).map((r) => [r.date, r[f]] as DailyPoint).sort((a, b) => a[0].localeCompare(b[0]));
  const daa = nbSeries('activeAccounts');
  const txns = nbSeries('txns');
  const newAcc = nbSeries('newAccounts');
  const nbFees = nbSeries('feeUsd');
  const NB_END = commonEnd([daa], 1);
  const nbUrl = 'https://nearblocks.io/charts';
  const meanItem = (id: string, key: string, label: string, s: DailyPoint[], end: string | null, days: number, unit: Unit, def: string, chart?: string) => {
    if (!end) return B.unavailable({ evidenceId: id, metricKey: key, group: 'activity', label, unit, methodology: def, reason: 'NearBlocks charts unavailable.' }, 'nearblocks.charts');
    const agg = windowAggregate(s, end, days);
    return B.add({ evidenceId: id, metricKey: key, group: 'activity', label, unit, value: agg.mean, periodStart: agg.start, periodEnd: agg.end, observedAt: agg.end,
      methodology: def, transform: `mean of daily values over ${days} days ending ${agg.end}`, sourceUrl: nbUrl,
      validationNotes: agg.mean === null ? `Window incomplete: ${agg.coveredDays}/${days} days.` : null,
      series: chart ? seriesOf(chart, unit, 'mean7', weeklyMeans(s, end, 52)) : null }, 'nearblocks.charts');
  };
  const acctNote = 'Accounts are not people: one person or bot can control many accounts, and relayers can sign for many users.';
  meanItem('ACT-DAA-30D', 'activity.daily_active_accounts.30d', 'Daily active accounts, 30-day mean', daa, NB_END, 30, 'count', `NearBlocks active_accounts (accounts that signed a transaction that day). ${acctNote}`, 'Daily active accounts (weekly mean)');
  meanItem('ACT-DAA-30D-1Y-AGO', 'activity.daily_active_accounts.30d.year_ago', 'Daily active accounts, 30-day mean one year earlier', daa, NB_END ? addDays(NB_END, -365) : null, 30, 'count', 'Same definition, window ending 365 days earlier.');
  meanItem('ACT-TXN-30D', 'activity.daily_transactions.30d', 'Daily transactions, 30-day mean', txns, NB_END, 30, 'count', 'NearBlocks txns per day. Transaction counts include automated and relayed activity.', 'Daily transactions (weekly mean)');
  meanItem('ACT-NEW-30D', 'activity.new_accounts.30d', 'New accounts per day, 30-day mean', newAcc, NB_END, 30, 'count', `NearBlocks new_accounts. ${acctNote}`);
  B.derive({ evidenceId: 'ACT-DAA-YOY', metricKey: 'activity.daily_active_accounts.yoy', group: 'activity', label: 'Daily active accounts, change vs one year earlier', unit: 'fraction',
    inputs: ['ACT-DAA-30D-1Y-AGO', 'ACT-DAA-30D'], compute: (a, b) => pctChange(a, b), transform: '(ACT-DAA-30D - ACT-DAA-30D-1Y-AGO) / ACT-DAA-30D-1Y-AGO',
    methodology: 'Matched 30-day windows one year apart, same source and definition.' });
  if (NB_END) {
    const agg = windowAggregate(nbFees, NB_END, 30);
    B.add({ evidenceId: 'ACT-GAS-FEES-30D', metricKey: 'activity.gas_fees_usd.30d', group: 'activity', label: 'Base-layer transaction fees, 30 days (NearBlocks)', unit: 'USD', value: agg.sum,
      periodStart: agg.start, periodEnd: agg.end, observedAt: agg.end, methodology: 'NearBlocks txn_fee_usd summed over 30 days. Cross-check for DefiLlama chain fees.',
      transform: 'sum over 30 days', sourceUrl: nbUrl }, 'nearblocks.charts');
  }
  B.unavailable({ evidenceId: 'ACT-RETENTION', metricKey: 'activity.signer_retention', group: 'activity', label: 'Retained signer cohorts (BigQuery)', unit: 'fraction',
    sourceName: SOURCES.bigquery.name, sourceUrl: SOURCES.bigquery.docsUrl, observationType: 'OBSERVED',
    methodology: 'Monthly cohorts of new signers from bigquery-public-data.crypto_near_mainnet_us.transactions (research/sql/05_new_signer_retention.sql). New means no transaction in a lookback period before the window (365 days by default, or full history), and cohorts are followed only for fully observed months.',
    reason: 'Not available in live snapshots. Requires Google Cloud credentials and a freshness check, because NEAR Lake (the dataset\'s upstream) stopped indexing on 2026-03-24.' });

  // ------------------------------------------------------------ DeFi on NEAR (DefiLlama)
  const tvlNear = fromUnixPairs(B.rec('defillama.tvl.near')?.body);
  const tvlEnd = lastDay(tvlNear);
  B.add({ evidenceId: 'DEFI-TVL-NEAR', metricKey: 'defi.tvl.near', group: 'defi', label: 'NEAR chain DeFi TVL', unit: 'USD', value: tvlEnd ? valueOn(tvlNear, tvlEnd) : null,
    observedAt: tvlEnd, periodEnd: tvlEnd, methodology: 'DefiLlama chain TVL (excludes double-counted liquid staking and borrowed assets by default).', transform: 'latest daily value',
    sourceUrl: 'https://defillama.com/chain/Near', series: tvlEnd ? seriesOf('NEAR chain TVL', 'USD', 'level', weeklyMeans(tvlNear, tvlEnd, 52)) : null }, 'defillama.tvl.near');
  B.add({ evidenceId: 'DEFI-TVL-NEAR-1Y-AGO', metricKey: 'defi.tvl.near.year_ago', group: 'defi', label: 'NEAR chain DeFi TVL one year earlier', unit: 'USD',
    value: tvlEnd ? valueOn(tvlNear, addDays(tvlEnd, -365)) : null, observedAt: tvlEnd ? addDays(tvlEnd, -365) : null, periodEnd: tvlEnd ? addDays(tvlEnd, -365) : null,
    methodology: 'Same series, 365 days earlier.', transform: 'daily value at end - 365d', sourceUrl: 'https://defillama.com/chain/Near' }, 'defillama.tvl.near');
  B.derive({ evidenceId: 'DEFI-TVL-NEAR-YOY', metricKey: 'defi.tvl.near.yoy', group: 'defi', label: 'NEAR TVL change vs one year earlier', unit: 'fraction',
    inputs: ['DEFI-TVL-NEAR-1Y-AGO', 'DEFI-TVL-NEAR'], compute: (a, b) => pctChange(a, b), transform: '(DEFI-TVL-NEAR - DEFI-TVL-NEAR-1Y-AGO) / DEFI-TVL-NEAR-1Y-AGO',
    methodology: 'USD TVL moves with token prices as well as deposits; part of any change is price, not usage.' });
  for (const [slug, id, label] of [['rhea-lend', 'DEFI-RHEA-LEND-TVL', 'RHEA Lend TVL on NEAR'], ['rhea-dex', 'DEFI-RHEA-DEX-TVL', 'RHEA DEX TVL on NEAR']] as const) {
    const body = B.rec(`defillama.protocol.${slug}`)?.body as any;
    const s = fromUnixPairs(body?.tvl);
    const e = lastDay(s);
    B.add({ evidenceId: id, metricKey: `defi.tvl.${slug}`, group: 'defi', label, unit: 'USD', value: e ? valueOn(s, e) : null, observedAt: e, periodEnd: e,
      methodology: 'DefiLlama protocol TVL, NEAR chain only. Incentive programs can inflate deposits.', transform: 'latest daily value',
      sourceUrl: `https://defillama.com/protocol/${slug}` }, `defillama.protocol.${slug}`);
  }
  const stables = fromUnixPairs(B.rec('defillama.stablecoins.near')?.body);
  const stEnd = lastDay(stables);
  B.add({ evidenceId: 'DEFI-STABLES-NEAR', metricKey: 'defi.stablecoins.near', group: 'defi', label: 'Stablecoin supply on NEAR', unit: 'USD', value: stEnd ? valueOn(stables, stEnd) : null,
    observedAt: stEnd, periodEnd: stEnd, methodology: 'DefiLlama stablecoins: USD-pegged circulating supply on NEAR.', transform: 'latest daily value',
    sourceUrl: 'https://defillama.com/stablecoins/Near' }, 'defillama.stablecoins.near');

  // ------------------------------------------------------------ chain fees and peers (matched 30-day window)
  const peerFees = PEER_CHAINS.map((p) => llama(`defillama.fees.${p.coin}`));
  const PEER_END = commonEnd(peerFees, 1);
  const nearFees = peerFees[0] ?? [];
  if (END) {
    const agg = windowAggregate(nearFees, END, W);
    B.add({ evidenceId: 'FEES-NEAR-CHAIN-90D', metricKey: 'chain.fees.near.90d', group: 'valuation', label: 'NEAR base-layer gas fees, 90 days', unit: 'USD', value: agg.sum,
      periodStart: agg.start, periodEnd: agg.end, observedAt: agg.end, methodology: sanitizeText((B.rec('defillama.fees.near')?.body as any)?.methodology?.Fees) ?? 'DefiLlama chain fees.',
      transform: 'sum over 90 days (same window as Intents)', sourceUrl: 'https://defillama.com/chain/Near',
      series: seriesOf('Weekly NEAR gas fees', 'USD', 'sum7', weeklySums(nearFees, END, 52)) }, 'defillama.fees.near');
    const nearRev = llama('defillama.revenue.near');
    const ragg = windowAggregate(nearRev, END, W);
    B.add({ evidenceId: 'FEES-NEAR-BURN-90D', metricKey: 'chain.revenue.near.90d', group: 'valuation', label: 'NEAR gas fees burned, 90 days', unit: 'USD', value: ragg.sum,
      periodStart: ragg.start, periodEnd: ragg.end, observedAt: ragg.end, methodology: sanitizeText((B.rec('defillama.revenue.near')?.body as any)?.methodology?.Revenue) ?? 'DefiLlama chain revenue (burned fees).',
      transform: 'sum over 90 days', sourceUrl: 'https://defillama.com/chain/Near' }, 'defillama.revenue.near');
  }
  B.derive({ evidenceId: 'VAL-NEAR-VALUE-CAPTURE-ANN', metricKey: 'valuation.near.value_capture.annualized', group: 'valuation', label: 'Token-level value capture, annualized (burn + Intents buybacks)', unit: 'USD',
    inputs: ['FEES-NEAR-BURN-90D', 'INT-BUYBACK-90D'], compute: (a, b) => ((a + b) * 365) / W, transform: '(FEES-NEAR-BURN-90D + INT-BUYBACK-90D) x 365 / 90',
    methodology: 'Dollars per year that currently flow to burns or buybacks. Burns reduce supply; buybacks acquire tokens that may be held, so the two are not equivalent.' });
  B.derive({ evidenceId: 'VAL-NEAR-MCAP-TO-CAPTURE', metricKey: 'valuation.near.mcap_to_value_capture', group: 'valuation', label: 'Market cap / annualized token value capture', unit: 'ratio',
    inputs: ['MKT-NEAR-MCAP', 'VAL-NEAR-VALUE-CAPTURE-ANN'], compute: (m, v) => safeDiv(m, v), transform: 'MKT-NEAR-MCAP / VAL-NEAR-VALUE-CAPTURE-ANN',
    methodology: 'A price-to-earnings style multiple on burns plus buybacks. Not comparable with peers that only burn.' });

  for (const [i, p] of PEER_CHAINS.entries()) {
    const code = peerCode[p.coin]!;
    const fees = peerFees[i] ?? [];
    const rawKey = `defillama.fees.${p.coin}`;
    if (PEER_END) {
      const agg = windowAggregate(fees, PEER_END, 30);
      B.add({ evidenceId: `PEER-${code}-FEES-30D`, metricKey: `peers.${p.coin}.fees.30d`, group: 'peers', label: `${p.label} chain fees, 30 days`, unit: 'USD', value: agg.sum,
        periodStart: agg.start, periodEnd: agg.end, observedAt: agg.end, methodology: `DefiLlama chain fees adapter: ${sanitizeText((B.rec(rawKey)?.body as any)?.methodology?.Fees, 200) ?? 'transaction fees'}`,
        transform: 'sum over the matched 30-day peer window', sourceUrl: `https://defillama.com/chain/${p.llamaChain}` }, rawKey);
    } else {
      B.unavailable({ evidenceId: `PEER-${code}-FEES-30D`, metricKey: `peers.${p.coin}.fees.30d`, group: 'peers', label: `${p.label} chain fees, 30 days`, unit: 'USD',
        methodology: 'DefiLlama chain fees.', reason: 'At least one peer fee series is missing, so no matched window exists.' }, rawKey);
    }
    const tvl = fromUnixPairs(B.rec(`defillama.tvl.${p.coin}`)?.body);
    const tvlAt = PEER_END ? valueOn(tvl, PEER_END) : null;
    B.add({ evidenceId: `PEER-${code}-TVL`, metricKey: `peers.${p.coin}.tvl`, group: 'peers', label: `${p.label} DeFi TVL`, unit: 'USD', value: tvlAt, observedAt: PEER_END, periodEnd: PEER_END,
      methodology: 'DefiLlama chain TVL on the peer window end date.', transform: 'daily value at peer window end', sourceUrl: `https://defillama.com/chain/${p.llamaChain}` }, `defillama.tvl.${p.coin}`);
    const dex = fromUnixPairs((B.rec(`defillama.dexs.${p.coin}`)?.body as any)?.chart);
    const dagg = PEER_END ? windowAggregate(dex, PEER_END, 30) : null;
    B.add({ evidenceId: `PEER-${code}-DEX-30D`, metricKey: `peers.${p.coin}.dex_volume.30d`, group: 'peers', label: `${p.label} DEX volume, 30 days`, unit: 'USD', value: dagg?.sum ?? null,
      periodStart: dagg?.start ?? null, periodEnd: dagg?.end ?? null, observedAt: dagg?.end ?? null, sourceUrl: `https://defillama.com/dexs/chain/${p.llamaDex}`,
      methodology: p.coin === 'near' ? 'DefiLlama DEX volume attributed to NEAR. It includes NEAR Intents swaps settled on NEAR, so it overlaps with Intents volume.' : 'DefiLlama DEX volume attributed to the chain.',
      transform: 'sum over the matched 30-day peer window', validationNotes: dagg && dagg.sum === null ? `Window incomplete: ${dagg.coveredDays}/30 days.` : null }, `defillama.dexs.${p.coin}`);
    B.derive({ evidenceId: `PEER-${code}-MCAP-TO-FEES`, metricKey: `peers.${p.coin}.mcap_to_fees`, group: 'peers', label: `${p.label} market cap / annualized chain fees`, unit: 'ratio',
      inputs: [`MKT-${code}-MCAP`, `PEER-${code}-FEES-30D`], compute: (m, f) => safeDiv(m, (f * 365) / 30), transform: `MKT-${code}-MCAP / (PEER-${code}-FEES-30D x 365 / 30)`,
      methodology: 'Chain fees only (no app revenue) so all four chains use one definition. Base-layer tokens may carry value that fees do not explain.' });
    B.derive({ evidenceId: `PEER-${code}-MCAP-TO-TVL`, metricKey: `peers.${p.coin}.mcap_to_tvl`, group: 'peers', label: `${p.label} market cap / DeFi TVL`, unit: 'ratio',
      inputs: [`MKT-${code}-MCAP`, `PEER-${code}-TVL`], compute: (m, t) => safeDiv(m, t), transform: `MKT-${code}-MCAP / PEER-${code}-TVL`,
      methodology: 'Market cap at fetch time over TVL at the peer window end. TVL definitions vary by chain adapter.' });
  }

  // ------------------------------------------------------------ Intents Explorer sample (optional)
  const ex = B.rec('intents-explorer.recent')?.body;
  if (Array.isArray(ex) && ex.length) {
    const txs = (ex as any[]).filter((t) => Number.isFinite(t.amountInUsd) && t.amountInUsd > 0);
    const total = txs.reduce((a, t) => a + t.amountInUsd, 0);
    const byRef = new Map<string, number>();
    for (const t of txs) byRef.set(t.referral ?? '(none)', (byRef.get(t.referral ?? '(none)') ?? 0) + t.amountInUsd);
    const top = [...byRef.values()].sort((a, b) => b - a).slice(0, 5).reduce((a, x) => a + x, 0);
    const times = txs.map((t) => Date.parse(t.createdAt)).filter(Number.isFinite).sort((a, b) => a - b);
    const sizes = txs.map((t) => t.amountInUsd).sort((a, b) => a - b);
    const median = sizes.length ? sizes[Math.floor(sizes.length / 2)]! : null;
    const common = { group: 'intents' as EvidenceGroup, periodStart: times.length ? new Date(times[0]!).toISOString() : null, periodEnd: times.length ? new Date(times[times.length - 1]!).toISOString() : null };
    B.add({ ...common, evidenceId: 'INT-EXPLORER-TOP5-SHARE', metricKey: 'intents.explorer.top5_referral_share', label: 'Share of sampled 1Click volume from top 5 referrers', unit: 'fraction',
      value: safeDiv(top, total), methodology: `Sample of the ${txs.length} most recent successful 1Click swaps from the Explorer API. 1Click is one distribution channel, not all of NEAR Intents.`,
      transform: 'sum(top 5 referral amountInUsd) / sum(amountInUsd)', confidence: 'medium' }, 'intents-explorer.recent');
    B.add({ ...common, evidenceId: 'INT-EXPLORER-MEDIAN-SWAP', metricKey: 'intents.explorer.median_swap_usd', label: 'Median sampled 1Click swap size', unit: 'USD', value: median,
      methodology: 'Median amountInUsd in the same sample.', transform: 'median(amountInUsd)', confidence: 'medium' }, 'intents-explorer.recent');
  } else {
    for (const [id, label, unit] of [['INT-EXPLORER-TOP5-SHARE', 'Share of sampled 1Click volume from top 5 referrers', 'fraction'], ['INT-EXPLORER-MEDIAN-SWAP', 'Median sampled 1Click swap size', 'USD']] as const) {
      B.unavailable({ evidenceId: id, metricKey: `intents.explorer.${id}`, group: 'intents', label, unit, sourceName: SOURCES['intents-explorer'].name, sourceUrl: SOURCES['intents-explorer'].docsUrl,
        methodology: 'Recent successful 1Click swaps from the NEAR Intents Explorer API.', reason: 'Requires a partner JWT (INTENTS_EXPLORER_JWT). Integrator concentration and organic-vs-wash volume remain unknown without it.' }, 'intents-explorer.recent');
    }
  }

  // ------------------------------------------------------------ model
  const inp = (id: string, kind: 'OBSERVED' | 'DERIVED', note?: string) => ({ value: B.val(id), kind, evidenceIds: [id], note });
  const modelBase: ModelInputs = {
    M: inp('MKT-NEAR-MCAP', 'OBSERVED'),
    V: inp('INT-VOL-ANN', 'DERIVED', '90-day run rate'),
    f: inp('INT-FEE-RATE', 'DERIVED'),
    c: inp('INT-CAPTURE', 'DERIVED'),
    b: inp('INT-BUYBACK-SHARE', 'DERIVED', 'DefiLlama classification, not a guaranteed policy'),
    y: { value: 0.02, kind: 'ASSUMED', evidenceIds: [], note: 'Hypothetical 2% of market cap per year' },
  };
  const base = computeModel(modelBase);
  const scenarios = runScenarios(modelBase);
  const modelInputsIds = ['MKT-NEAR-MCAP', 'INT-VOL-ANN', 'INT-FEE-RATE', 'INT-CAPTURE', 'INT-BUYBACK-SHARE'];
  const modelItem = (id: string, key: string, label: string, unit: Unit, value: number | null, transform: string, methodology: string) =>
    B.add({ evidenceId: id, metricKey: key, group: 'model', label, unit, value, observationType: 'DERIVED', sourceName: `Buyback target model ${FORMULA_VERSION}`, sourceUrl: '/methodology#model',
      inputs: modelInputsIds, transform, methodology, periodStart: winStart, periodEnd: END, confidence: 'medium', fetchedAt: null, rawResponseHash: null,
      validationNotes: value === null ? 'N/A: one or more model inputs missing or non-positive.' : null });
  modelItem('MODEL-BUYBACK-USD', 'model.annual_buyback_demand_usd', 'Annual buyback demand at current run rate', 'USD', base.annualBuybackDemandUsd, 'V x f x c x b',
    'Measured run rate times measured fee, capture and buyback shares. Holds all four constant.');
  modelItem('MODEL-BUYBACK-TO-MCAP', 'model.buyback_demand_to_mcap', 'Annual buyback demand / market cap', 'fraction', base.buybackDemandToMcap, '(V x f x c x b) / M',
    'Buyback demand relative to market cap. A buyback is not a burn and does not mechanically raise price by this amount.');
  modelItem('MODEL-BREAKEVEN-VOL-2PCT', 'model.break_even_volume.y2', 'Annual volume needed for buybacks = 2% of market cap', 'USD', base.breakEvenAnnualVolumeUsd, '(y x M) / (f x c x b), y = 0.02 (assumed)',
    'Volume at which buyback demand would equal a hypothetical 2% of market cap per year, with fee, capture and buyback shares at measured values.');
  modelItem('MODEL-VOL-MULTIPLE-2PCT', 'model.volume_multiple.y2', 'Volume multiple needed for 2% of market cap', 'ratio', base.volumeMultipleRequired, 'required volume / V',
    'How many times today\'s run rate the volume would need to be.');
  modelItem('MODEL-REQ-TAKE-RATE-2PCT', 'model.required_take_rate.y2', 'Required f x c x b at today\'s volume for 2% of market cap', 'fraction', requiredTakeRate(modelBase.V.value, modelBase.M.value, 0.02),
    '(y x M) / V, y = 0.02 (assumed)', 'Reverse calculation: the share of every dollar of volume that would have to become buybacks. Compare with MODEL-CURRENT-TAKE-RATE.');
  modelItem('MODEL-CURRENT-TAKE-RATE', 'model.current_take_rate', 'Current f x c x b (volume converted to buyback demand)', 'fraction', base.volumeToBuybackRate, 'f x c x b', 'Measured share of each volume dollar that becomes buyback demand.');

  // ------------------------------------------------------------ thesis sections (eras, pivots, realized supply)
  const thesis = analyzeThesis(raws, (id) => B.val(id));
  B.items.push(...thesisEvidence(thesis, (key) => { const r = B.rec(key); return { at: r?.fetchedAt ?? null, hash: r?.sha256 ?? null, url: r?.url ?? '' }; }));

  // ------------------------------------------------------------ three-digit price ladder
  const ladder = analyzeLadder(raws, (id) => B.val(id));
  B.items.push(...ladderEvidence(ladder, (key) => { const r = B.rec(key); return { at: r?.fetchedAt ?? null, hash: r?.sha256 ?? null, url: r?.url ?? '' }; }));

  // ------------------------------------------------------------ W4 token economics
  // One documented cutoff for every 90-day valuation input and delivery observation (the ladder's window end).
  const tokenomics = analyzeTokenomics(raws, (id) => B.val(id), ladder.basis.windowEnd);
  B.items.push(...tokenomicsEvidence(tokenomics, (key) => { const r = B.rec(key); return { at: r?.fetchedAt ?? null, hash: r?.sha256 ?? null }; }));
  const basis = basisScenarios(ladder, tokenomics.buybacks.deliveredDaily);
  B.items.push(...basisEvidence(basis, ladder.basis.windowEnd));

  // ------------------------------------------------------------ W5 valuation, W6 opportunity cost
  const valuation = analyzeValuation(raws, (id) => B.val(id), ladder, tokenomics);
  B.items.push(...valuationEvidence(valuation));

  // ------------------------------------------------------------ W3 economy map
  const economy = analyzeEconomy(raws, (id) => B.val(id), tokenomics, thesis);
  B.items.push(...economyEvidence(economy, (key) => { const r = B.rec(key); return { at: r?.fetchedAt ?? null, hash: r?.sha256 ?? null }; }));

  // ------------------------------------------------------------ W2 cross-chain competition
  const crossChain = analyzeCrossChain(raws, (id) => B.val(id));
  B.items.push(...crossChainEvidence(crossChain));

  // ------------------------------------------------------------ W1 market opportunity
  const market = analyzeMarket(raws);
  B.items.push(...marketEvidence(market));

  // ------------------------------------------------------------ W8 hypotheses
  const hypotheses = analyzeHypotheses(raws, { ladder, tok: tokenomics, val: valuation, eco: economy, cc: crossChain });
  B.items.push(...hypothesesEvidence(hypotheses));

  return {
    methodologyVersion: METHODOLOGY_VERSION,
    formulaVersion: FORMULA_VERSION,
    windowEnd: END,
    peerWindowEnd: PEER_END,
    evidence: B.items,
    modelBase,
    scenarios,
    feeSensitivity: sensitivity(modelBase),
    allocationMatrix: allocationSensitivity(modelBase),
    thesis,
    ladder,
    tokenomics,
    basis,
    valuation,
    economy,
    crossChain,
    market,
    hypotheses,
  };
}

/** Day the snapshot's data was cut off: the latest observation used, for display. */
export function datasetCutoff(ds: ResearchDataset, fetchedAt: Date): string {
  return ds.windowEnd ?? isoDay(fetchedAt);
}
