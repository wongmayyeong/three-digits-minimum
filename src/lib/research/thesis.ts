/**
 * "Is NEAR Building the Future or Following the Hype?"
 *
 * Deterministic analysis for the thesis' three sub-questions and the verdict. Every rule and
 * threshold below is fixed in code and published on the Methodology page; the verdict is
 * computed, never written by an AI.
 *
 *   1. Did it last?                    Era contracts' activity relative to their own peak.
 *   2. Did adoption justify the hype?  Adoption 90 days after each pivot (price is context only).
 *   3. Does it pay $NEAR?              Buybacks versus realized net new supply, and take-rate trend.
 */
import type { RawRecord } from '@/lib/data/fetcher';
import { ERA_CONTRACTS, SOURCES, type EraId } from '@/lib/data/sources';
import { addDays, DAY_MS, fromUnixPairs, isoDay, pctChange, safeDiv, valueOn, windowAggregate, type DailyPoint } from './series';
import type { EvidenceDraft } from './types';
import { formatValue } from '@/lib/format';

export const THESIS_VERSION = 'nebube-thesis-1.0.0';

export const THESIS_TITLE = 'Is NEAR Building the Future or Following the Hype?';
export const THESIS_SUBTITLE = 'Every pivot, tested against the evidence.';

/** Strategic pivots with dates verified on near.org (see source). Month-level dates anchor on the 1st of the next month. */
export const PIVOTS = [
  { id: 'bos', label: 'Blockchain Operating System (BOS)', date: '2023-03-01', precision: 'month', shown: 'February 2023', era: 'social' as EraId | null,
    source: 'https://near.org/blog/2023-near-in-review', note: 'NEAR\'s 2023 review says BOS launched in February 2023 and debuted at ETHDenver. Month-level date; event window anchored on 2023-03-01.' },
  { id: 'chain-signatures', label: 'Chain Signatures launch', date: '2024-03-27', precision: 'day', shown: '27 March 2024', era: 'signer' as EraId | null,
    source: 'https://near.org/blog/chain-signatures-launch-to-enable-transactions-on-any-blockchain-from-a-near-account', note: 'Announced at BUIDL Asia, Seoul.' },
  { id: 'user-owned-ai', label: 'User-Owned AI', date: '2024-05-22', precision: 'day', shown: '22 May 2024', era: null,
    source: 'https://near.org/blog/user-owned-ai-is-near', note: 'NEAR positions itself as the home for User-Owned AI. No onchain product contract is measured for this era.' },
  { id: 'intents', label: 'NEAR Intents (beta)', date: '2024-11-10', precision: 'day', shown: '10 November 2024', era: 'intents' as EraId | null,
    source: 'https://near.org/blog/introducing-near-intents.html', note: 'Beta launch on near.org/intents; full launch announced for Q1 2025.' },
] as const;

// ------------------------------------------------------------ rule thresholds (published)

export const RULES = {
  /** An era "lasted" if its latest complete month keeps at least this share of its peak month. */
  eraRetentionLasting: 0.25,
  /** Era retention is judged only once the peak is at least this many months in the past. */
  eraMinMonthsSincePeak: 3,
  /** Adoption followed a pivot if chain daily active accounts (days +60..+90 mean) beat the 30 days before, or the era product's activity at least doubled from its launch month (first month at or after the pivot) to two months later. */
  eraGrowthMultiple: 2,
  /** Section 3: buybacks absorbing at least this share of net new supply counts as paying the token; below the lower bound counts as not paying. */
  coveragePaying: 0.5,
  coverageNotPaying: 0.25,
} as const;

export type SectionVerdict = 'BUILDING' | 'HYPE' | 'MIXED' | 'INSUFFICIENT';
export type FinalVerdict = 'BUILDING' | 'FOLLOWING THE HYPE' | 'BUILDING, NOT YET PAYING' | 'PAYING, NOT LASTING' | 'MIXED' | 'INSUFFICIENT EVIDENCE';

export interface EraResult {
  id: EraId;
  account: string;
  era: string;
  note: string;
  months: [string, number][];
  missingMonths: string[];
  firstMonth: string;
  peakMonth: string | null;
  peak: number | null;
  latestMonth: string | null;
  latest: number | null;
  retention: number | null;
  monthsSincePeak: number | null;
  month1: number | null;
  month3: number | null;
  month6: number | null;
  lasted: boolean | null;
}

export interface EventResult {
  id: string;
  label: string;
  date: string;
  shown: string;
  source: string;
  note: string;
  nearReturn30: number | null;
  nearReturn90: number | null;
  btcReturn90: number | null;
  relativeReturn90: number | null;
  daaBefore: number | null;
  daaAfter: number | null;
  daaChange: number | null;
  eraGrowth: number | null;
  adoptionFollowed: boolean | null;
}

export interface SupplyResult {
  start: string | null;
  end: string | null;
  netNewNear90d: number | null;
  netNewAnnualPct: number | null;
  netNewAnnualUsd: number | null;
  buybackAnnualUsd: number | null;
  buybackCoverage: number | null;
  maxIssuanceCoverage: number | null;
  takeRate: number | null;
  takeRatePrior: number | null;
}

export interface ThesisResult {
  version: string;
  eras: EraResult[];
  events: EventResult[];
  supply: SupplyResult;
  sections: { id: 1 | 2 | 3; title: string; verdict: SectionVerdict; reason: string }[];
  verdict: FinalVerdict;
  confidence: 'low' | 'moderate';
  verdictReason: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

const monthsBetween = (a: string, b: string) => {
  const [ay, am] = a.split('-').map(Number) as [number, number];
  const [by, bm] = b.split('-').map(Number) as [number, number];
  return (by - ay) * 12 + (bm - am);
};

export function eraResults(raws: Record<string, RawRecord | null | undefined>, now = new Date()): EraResult[] {
  return ERA_CONTRACTS.map((c) => {
    const keys = Object.keys(raws).filter((k) => k.startsWith(`nearblocks.era.${c.id}.`)).sort();
    const months: [string, number][] = [];
    const missing: string[] = [];
    for (const k of keys) {
      const r = raws[k];
      const ym = k.slice(`nearblocks.era.${c.id}.`.length);
      const n = (r?.body as any)?.txns;
      if (typeof n === 'number' && Number.isFinite(n)) months.push([ym, n]);
      else missing.push(ym);
    }
    const enough = months.length >= 3 && missing.length <= Math.max(1, Math.floor(months.length * 0.1));
    let peakMonth: string | null = null;
    let peak: number | null = null;
    for (const [m, v] of months) if (peak === null || v > peak) { peak = v; peakMonth = m; }
    const last = months[months.length - 1] ?? null;
    const at = (i: number) => months[i]?.[1] ?? null;
    const monthsSincePeak = peakMonth && last ? monthsBetween(peakMonth, last[0]) : null;
    const retention = enough && peak ? safeDiv(last![1], peak) : null;
    const judged = retention !== null && monthsSincePeak !== null && monthsSincePeak >= RULES.eraMinMonthsSincePeak;
    void now;
    return {
      id: c.id, account: c.account, era: c.era, note: c.note, months, missingMonths: missing, firstMonth: c.firstMonth,
      peakMonth: enough ? peakMonth : null, peak: enough ? peak : null, latestMonth: enough ? last?.[0] ?? null : null, latest: enough ? last?.[1] ?? null : null,
      retention, monthsSincePeak: enough ? monthsSincePeak : null, month1: at(0), month3: at(2), month6: at(5),
      lasted: judged ? (retention as number) >= RULES.eraRetentionLasting : null,
    };
  });
}

function priceOn(series: DailyPoint[], day: string): number | null {
  for (let i = 0; i < 4; i++) {
    const v = valueOn(series, addDays(day, i));
    if (v !== null) return v;
  }
  return null;
}

export function eventResults(raws: Record<string, RawRecord | null | undefined>, eras: EraResult[]): EventResult[] {
  const chunks = (coin: string): DailyPoint[] => {
    const all = Object.keys(raws).filter((k) => k.startsWith(`defillama.coins.${coin}.`)).flatMap((k) => fromUnixPairs((raws[k]?.body as any)?.prices));
    return [...new Map(all.map((p) => [p[0], p])).values()].sort((a, b) => a[0].localeCompare(b[0]));
  };
  const near = chunks('near');
  const btc = chunks('bitcoin');
  const nb: any[] = Array.isArray(raws['nearblocks.charts']?.body) ? (raws['nearblocks.charts']!.body as any[]) : [];
  const daa: DailyPoint[] = nb.filter((r) => Number.isFinite(r.activeAccounts)).map((r) => [r.date, r.activeAccounts] as DailyPoint).sort((a, b) => a[0].localeCompare(b[0]));
  const today = isoDay(Date.now());
  return PIVOTS.map((p) => {
    const ret = (s: DailyPoint[], days: number) => {
      if (addDays(p.date, days) > today) return null;
      return pctChange(priceOn(s, p.date), priceOn(s, addDays(p.date, days)));
    };
    const nearReturn90 = ret(near, 90);
    const btcReturn90 = ret(btc, 90);
    const before = windowAggregate(daa, addDays(p.date, -1), 30).mean;
    const after = addDays(p.date, 90) <= today ? windowAggregate(daa, addDays(p.date, 90), 31).mean : null;
    const daaChange = pctChange(before, after);
    // Product growth from the pivot's own launch: the first month with data at or after the pivot month, versus two months later.
    const era = p.era ? eras.find((e) => e.id === p.era) : null;
    const pivotMonth = p.date.slice(0, 7);
    const i0 = era ? era.months.findIndex(([m]) => m >= pivotMonth) : -1;
    const m0 = i0 >= 0 ? era!.months[i0]![1] : null;
    const m2 = i0 >= 0 ? era!.months[i0 + 2]?.[1] ?? null : null;
    const eraGrowth = m0 && m2 !== null ? safeDiv(m2, m0) : null;
    const signals = [daaChange === null ? null : daaChange > 0, eraGrowth === null ? null : eraGrowth >= RULES.eraGrowthMultiple].filter((x): x is boolean => x !== null);
    return {
      id: p.id, label: p.label, date: p.date, shown: p.shown, source: p.source, note: p.note,
      nearReturn30: ret(near, 30), nearReturn90, btcReturn90,
      relativeReturn90: nearReturn90 !== null && btcReturn90 !== null ? nearReturn90 - btcReturn90 : null,
      daaBefore: before, daaAfter: after, daaChange, eraGrowth,
      adoptionFollowed: signals.length ? signals.some(Boolean) : null,
    };
  });
}

export function supplyResult(raws: Record<string, RawRecord | null | undefined>, ev: (id: string) => number | null): SupplyResult {
  const nb: any[] = Array.isArray(raws['nearblocks.charts']?.body) ? (raws['nearblocks.charts']!.body as any[]) : [];
  const YOCTO = 10n ** 24n;
  const toNear = (y: string) => (/^\d+$/.test(y) ? Number(BigInt(y) / YOCTO) + Number(BigInt(y) % YOCTO) / 1e24 : null);
  const supply: DailyPoint[] = nb.map((r) => [r.date, toNear(String(r.totalSupplyYocto ?? ''))] as [string, number | null]).filter((x): x is DailyPoint => x[1] !== null).sort((a, b) => a[0].localeCompare(b[0]));
  const end = supply.length > 1 ? supply[supply.length - 2]![0] : null; // latest day can be partial
  const start = end ? addDays(end, -90) : null;
  const sEnd = end ? valueOn(supply, end) : null;
  const sStart = start ? valueOn(supply, start) : null;
  const net = sEnd !== null && sStart !== null ? sEnd - sStart : null;
  const price = ev('MKT-NEAR-PRICE');
  const netAnnUsd = net !== null && price !== null ? (net * 365) / 90 * price : null;
  const buyback = ev('INT-BUYBACK-90D');
  const buybackAnn = buyback !== null ? (buyback * 365) / 90 : null;
  return {
    start, end, netNewNear90d: net,
    netNewAnnualPct: net !== null && sStart ? ((net * 365) / 90) / sStart : null,
    netNewAnnualUsd: netAnnUsd,
    buybackAnnualUsd: buybackAnn,
    buybackCoverage: netAnnUsd !== null && netAnnUsd > 0 ? safeDiv(buybackAnn, netAnnUsd) : null,
    maxIssuanceCoverage: safeDiv(ev('VAL-NEAR-VALUE-CAPTURE-ANN'), ev('ONC-ISSUANCE-USD')),
    takeRate: ev('INT-TAKE-RATE'),
    takeRatePrior: ev('INT-TAKE-RATE-PRIOR'),
  };
}

export function decide(eras: EraResult[], events: EventResult[], supply: SupplyResult): Pick<ThesisResult, 'sections' | 'verdict' | 'confidence' | 'verdictReason'> {
  const judged = eras.filter((e) => e.lasted !== null);
  const lasting = judged.filter((e) => e.lasted).length;
  let s1: SectionVerdict = 'INSUFFICIENT';
  if (judged.length >= 2) s1 = lasting / judged.length >= 2 / 3 ? 'BUILDING' : lasting / judged.length <= 1 / 3 ? 'HYPE' : 'MIXED';
  const s1Reason = judged.length >= 2
    ? `${lasting} of ${judged.length} era products keep at least ${RULES.eraRetentionLasting * 100}% of their peak monthly activity.`
    : 'Fewer than two era products have enough monthly history to judge.';

  const ev = events.filter((e) => e.adoptionFollowed !== null);
  const followed = ev.filter((e) => e.adoptionFollowed).length;
  let s2: SectionVerdict = 'INSUFFICIENT';
  if (ev.length >= 2) s2 = followed / ev.length >= 0.5 ? 'BUILDING' : 'HYPE';
  const s2Reason = ev.length >= 2 ? `Measurable adoption followed ${followed} of ${ev.length} pivots within 90 days.` : 'Fewer than two pivots have a complete 90-day window.';

  let s3: SectionVerdict = 'INSUFFICIENT';
  const cov = supply.buybackCoverage;
  if (cov !== null) s3 = cov >= RULES.coveragePaying ? 'BUILDING' : cov < RULES.coverageNotPaying ? 'HYPE' : 'MIXED';
  const trend = supply.takeRate !== null && supply.takeRatePrior !== null ? (supply.takeRate > supply.takeRatePrior ? 'rising' : 'falling') : 'unknown';
  const s3Reason = cov !== null ? `Intents buybacks absorb ${(cov * 100).toFixed(1)}% of realized net new supply; the take rate is ${trend}.` : 'Realized supply change or buyback data unavailable.';

  let verdict: FinalVerdict;
  if (s1 === 'INSUFFICIENT' || s3 === 'INSUFFICIENT') verdict = 'INSUFFICIENT EVIDENCE';
  else if (s1 === 'BUILDING' && s3 === 'BUILDING') verdict = 'BUILDING';
  else if (s1 === 'HYPE' && s3 === 'HYPE') verdict = 'FOLLOWING THE HYPE';
  else if (s1 === 'BUILDING' && s3 !== 'BUILDING') verdict = 'BUILDING, NOT YET PAYING';
  else if (s3 === 'BUILDING' && s1 !== 'BUILDING') verdict = 'PAYING, NOT LASTING';
  else verdict = 'MIXED';
  const direction = verdict === 'BUILDING' || verdict === 'BUILDING, NOT YET PAYING' ? 'BUILDING' : verdict === 'FOLLOWING THE HYPE' ? 'HYPE' : null;
  const confidence: 'low' | 'moderate' = direction && s2 === direction ? 'moderate' : 'low';
  return {
    sections: [
      { id: 1, title: 'Did it last?', verdict: s1, reason: s1Reason },
      { id: 2, title: 'Did adoption justify the hype?', verdict: s2, reason: s2Reason },
      { id: 3, title: 'Does it pay $NEAR?', verdict: s3, reason: s3Reason },
    ],
    verdict,
    confidence,
    verdictReason: `Sections 1 and 3 decide the verdict; Section 2 sets confidence. ${s1Reason} ${s3Reason} ${s2Reason}`,
  };
}

/** Evidence items for the thesis sections, so debates and the report can cite them by ID. */
export function thesisEvidence(t: Omit<ThesisResult, 'version'>, fetchedAt: (key: string) => { at: string | null; hash: string | null; url: string }): EvidenceDraft[] {
  const out: EvidenceDraft[] = [];
  const base = (o: Partial<EvidenceDraft> & Pick<EvidenceDraft, 'evidenceId' | 'metricKey' | 'label' | 'unit' | 'methodology'>): EvidenceDraft => {
    const value = o.value ?? null;
    return {
      group: 'thesis' as EvidenceDraft['group'], value: value !== null && Number.isFinite(value) ? value : null, valueText: null, observationType: 'DERIVED', available: value !== null && Number.isFinite(value),
      sourceName: 'Computed here', sourceUrl: '/methodology#thesis', observedAt: null, fetchedAt: null, periodStart: null, periodEnd: null,
      transform: 'see methodology', confidence: 'medium', rawResponseHash: null, validationNotes: null, series: null, inputs: [], ...o,
    } as EvidenceDraft;
  };
  for (const e of t.eras) {
    const code = e.id.toUpperCase();
    const meta = fetchedAt(`nearblocks.era.${e.id}.${e.latestMonth ?? ''}`);
    const common = { sourceName: SOURCES.nearblocks.name, sourceUrl: `https://nearblocks.io/address/${e.account}`, periodStart: e.months[0] ? `${e.months[0][0]}-01` : null, periodEnd: e.latestMonth ? `${e.latestMonth}-01` : null, observationType: 'OBSERVED' as const, fetchedAt: meta.at, rawResponseHash: meta.hash };
    const why = e.months.length < 3 ? 'Monthly history not collected yet (run the scheduled refresh or npm run research:refresh).' : e.missingMonths.length ? `Missing months: ${e.missingMonths.join(', ')}.` : null;
    out.push(base({ ...common, evidenceId: `ERA-${code}-PEAK`, metricKey: `era.${e.id}.peak`, label: `${e.account}: peak monthly transactions (${e.peakMonth ?? 'n/a'})`, unit: 'count', value: e.peak,
      methodology: `NearBlocks transaction count involving ${e.account}, per calendar month. ${e.note}`, transform: 'max over complete months', validationNotes: why }));
    out.push(base({ ...common, evidenceId: `ERA-${code}-LATEST`, metricKey: `era.${e.id}.latest`, label: `${e.account}: transactions in the latest complete month (${e.latestMonth ?? 'n/a'})`, unit: 'count', value: e.latest,
      methodology: `Same count for the most recent complete month. ${e.note}`, transform: 'last complete month', validationNotes: why,
      series: e.months.length >= 3 ? { label: `${e.account} monthly transactions`, unit: 'count', aggregation: 'month', points: e.months.map(([m, v]) => [`${m}-01`, v]) } as unknown as EvidenceDraft['series'] : null }));
    out.push(base({ evidenceId: `ERA-${code}-RETENTION`, metricKey: `era.${e.id}.retention`, label: `${e.account}: latest month as a share of its peak`, unit: 'fraction', value: e.retention,
      inputs: [`ERA-${code}-LATEST`, `ERA-${code}-PEAK`], transform: `ERA-${code}-LATEST / ERA-${code}-PEAK`,
      methodology: `Retention against the era's own peak. "Lasted" if at least ${RULES.eraRetentionLasting * 100}% and the peak is ${RULES.eraMinMonthsSincePeak}+ months old. Transactions are not people; relayers and node traffic are included.`, validationNotes: why }));
  }
  for (const v of t.events) {
    const code = v.id.toUpperCase();
    out.push(base({ evidenceId: `EVT-${code}-REL-90D`, metricKey: `event.${v.id}.relative_return_90d`, label: `${v.label}: NEAR minus BTC return, 90 days after ${v.shown}`, unit: 'fraction', value: v.relativeReturn90,
      periodStart: v.date, periodEnd: addDays(v.date, 90), sourceName: 'DefiLlama coins (CoinGecko prices)', sourceUrl: v.source,
      methodology: 'Market context only, not scored: price can move ahead of adoption for good reasons. Returns from daily closes at the pivot date and 90 days later.', transform: 'NEAR return - BTC return' }));
    out.push(base({ evidenceId: `EVT-${code}-DAA-90D`, metricKey: `event.${v.id}.daa_change_90d`, label: `${v.label}: change in daily active accounts, days 60-90 after vs 30 days before`, unit: 'fraction', value: v.daaChange,
      periodStart: addDays(v.date, -30), periodEnd: addDays(v.date, 90), sourceName: SOURCES.nearblocks.name, sourceUrl: 'https://nearblocks.io/charts',
      methodology: 'Mean NearBlocks active_accounts over days +60..+90 against the 30 days before the pivot. Accounts are not people.', transform: 'pct change of 30-day means' }));
  }
  const s = t.supply;
  const nbMeta = fetchedAt('nearblocks.charts');
  out.push(base({ evidenceId: 'SUP-NET-NEW-ANN-PCT', metricKey: 'supply.net_new.annual_pct', label: 'Realized net new NEAR supply, annualized', unit: 'fraction', value: s.netNewAnnualPct, observationType: 'DERIVED',
    sourceName: SOURCES.nearblocks.name, sourceUrl: 'https://nearblocks.io/charts', periodStart: s.start, periodEnd: s.end, fetchedAt: nbMeta.at, rawResponseHash: nbMeta.hash,
    methodology: 'Change in NearBlocks total_supply over 90 days, annualized. Net of burns; bought-back tokens that are held stay in supply.', transform: '(supply_end - supply_start) x 365/90 / supply_start' }));
  out.push(base({ evidenceId: 'SUP-NET-NEW-ANN-USD', metricKey: 'supply.net_new.annual_usd', label: 'Realized net new supply per year at today\'s price', unit: 'USD', value: s.netNewAnnualUsd,
    periodStart: s.start, periodEnd: s.end, inputs: ['MKT-NEAR-PRICE'], methodology: 'Annualized net new tokens valued at the current price.', transform: 'net new NEAR x 365/90 x price' }));
  out.push(base({ evidenceId: 'COV-BUYBACK-REALIZED', metricKey: 'coverage.buyback_vs_net_new_supply', label: 'Buybacks as a share of realized net new supply', unit: 'fraction', value: s.buybackCoverage,
    periodStart: s.start, periodEnd: s.end, inputs: ['INT-BUYBACK-90D', 'SUP-NET-NEW-ANN-USD'],
    methodology: `Annualized Intents buybacks divided by the dollar value of annualized net new supply. Paying the token if at least ${RULES.coveragePaying * 100}%; not paying below ${RULES.coverageNotPaying * 100}%. Buybacks are held, not burned.`, transform: '(INT-BUYBACK-90D x 365/90) / SUP-NET-NEW-ANN-USD' }));
  out.push(base({ evidenceId: 'COV-CAPTURE-MAX', metricKey: 'coverage.capture_vs_max_issuance', label: 'Burns plus buybacks as a share of maximum issuance', unit: 'fraction', value: s.maxIssuanceCoverage,
    inputs: ['VAL-NEAR-VALUE-CAPTURE-ANN', 'ONC-ISSUANCE-USD'], confidence: 'low',
    methodology: 'Upper-bound denominator (protocol maximum inflation), so this understates coverage. Shown next to the realized measure for comparison.', transform: 'VAL-NEAR-VALUE-CAPTURE-ANN / ONC-ISSUANCE-USD' }));
  return out;
}

export function analyzeThesis(raws: Record<string, RawRecord | null | undefined>, ev: (id: string) => number | null): ThesisResult {
  const eras = eraResults(raws);
  const events = eventResults(raws, eras);
  const supply = supplyResult(raws, ev);
  return { version: THESIS_VERSION, eras, events, supply, ...decide(eras, events, supply) };
}

export const _test = { monthsBetween, DAY_MS };

/**
 * Evidence for and against "building", generated from the rule outcomes so the written thesis
 * can never drift from the data. Each line cites the evidence it rests on.
 */
export function evidenceForAgainst(t: ThesisResult, triggers: { id: string; statement: string; status: string; observed: string }[]): { forBuilding: string[]; againstBuilding: string[] } {
  const pct = (v: number | null) => (v === null ? 'n/a' : formatValue(Math.abs(v), 'fraction'));
  const forB: string[] = [];
  const against: string[] = [];
  for (const e of t.eras) {
    if (e.lasted === true) forB.push(`${e.era}: ${e.account} still runs at ${pct(e.retention)} of its ${e.peakMonth} peak (${e.latestMonth}). [ERA-${e.id.toUpperCase()}-RETENTION]`);
    if (e.lasted === false) against.push(`${e.era}: ${e.account} has fallen to ${pct(e.retention)} of its ${e.peakMonth} peak (${e.latestMonth}). [ERA-${e.id.toUpperCase()}-RETENTION]`);
  }
  for (const v of t.events) {
    if (v.adoptionFollowed === true) forB.push(`Adoption followed ${v.label} (${v.shown}): active accounts ${v.daaChange === null ? 'n/a' : `${v.daaChange >= 0 ? '+' : ''}${pct(v.daaChange)}`} at +90 days${v.eraGrowth !== null ? `, product activity ${v.eraGrowth.toFixed(1)}x two months after launch` : ''}. [EVT-${v.id.toUpperCase()}-DAA-90D]`);
    if (v.adoptionFollowed === false) against.push(`Adoption did not follow ${v.label} (${v.shown}): active accounts ${v.daaChange === null ? 'n/a' : `${v.daaChange >= 0 ? '+' : ''}${pct(v.daaChange)}`} at +90 days. [EVT-${v.id.toUpperCase()}-DAA-90D]`);
  }
  const s = t.supply;
  if (s.takeRate !== null && s.takeRatePrior !== null) {
    (s.takeRate > s.takeRatePrior ? forB : against).push(`NEAR keeps ${pct(s.takeRate)} of Intents volume, ${s.takeRate > s.takeRatePrior ? 'up' : 'down'} from ${pct(s.takeRatePrior)} in the prior 90 days. [INT-TAKE-RATE, INT-TAKE-RATE-PRIOR]`);
  }
  if (s.buybackCoverage !== null) {
    (s.buybackCoverage >= RULES.coveragePaying ? forB : against).push(`Intents buybacks absorb ${pct(s.buybackCoverage)} of realized net new supply. [COV-BUYBACK-REALIZED]`);
  }
  for (const tr of triggers) {
    if (tr.status === 'TRIGGERED') against.push(`${tr.id} triggered: ${tr.statement} (${tr.observed}).`);
  }
  return { forBuilding: forB, againstBuilding: against };
}
