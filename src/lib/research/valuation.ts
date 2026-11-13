/**
 * W5 (valuation) and W6 (opportunity cost), research/three-digits/SCOPE.md sections 4, 5 and 8.
 *
 * W5
 * - Cash-flow multiples month by month over the last year (CoinGecko market cap on the day / DefiLlama holders
 *   revenue, trailing 90 days ending that day). NEAR on two bases: designated buybacks and NEAR delivered to the buyback wallet.
 * - Sensitivity: which input moves NEAR's implied 2036 price most (published low and high cases per input).
 * - Multiple needed per rung: the cash-flow multiple each price would need at each growth scenario, so a reader
 *   sees how much of a rung rests on the multiple alone (SCOPE 5C.5).
 *
 * W6
 * - For every investable alternative, under the valuation method that fits it, what 2.8x, 7x, 14x and 28x in ten
 *   years require (its own dilution included), against what it is growing at today; plus common risk metrics
 *   (volatility, drawdown, correlation with BTC, liquidity, dilution, supply still to unlock).
 *   A side-by-side map, not a ranking of what to buy.
 *
 * Deterministic; every number comes from stored responses or published assumptions.
 */
import type { RawRecord } from '@/lib/data/fetcher';
import { CHAIN_ECONOMY, INVESTABLE } from '@/lib/data/sources';
import { commonEnd, fromUnixPairs, safeDiv, windowAggregate, type DailyPoint } from './series';
import { HORIZON_YEARS, RUNGS, GROWTH_SCENARIOS, type LadderResult } from './ladder';
import { BUYBACKS_START, type TokenomicsResult } from './tokenomics';
import type { EvidenceDraft } from './types';

export const VALUATION_VERSION = 'w5w6-1.0.0';
/** Price multiples tested for every asset (NEAR: about $10, $25, $50 and $100 from today's price). */
export const TARGET_MULTIPLES = [2.8, 7, 14, 28] as const;
/** Sensitivity cases (assumptions, published): each input moved on its own around the base case. */
export const SENSITIVITY = {
  growth: { low: 0.10, high: 0.30 },
  multiple: { low: 0.5, high: 1.5 },
  holderTakeRate: { low: 0.5, high: 1.5 },
  burns: { low: 0, high: 5 },
} as const;
const RUN = 90;

export interface MultiplePoint { month: string; value: number | null }
export interface AssetOpportunity {
  label: string; type: string; marketCap: number | null; price: number | null;
  method: string; driver: string; dilutionPerYear: number | null; dilutionFactor: number | null;
  observedGrowth: number | null; observedBasis: string; observedNote: string | null;
  platform: { stablecoins: number | null; stablecoinsGrowth: number | null; tvl: number | null; tvlGrowth: number | null } | null;
  targets: { k: number; requiredMarketCap: number | null; requiredDriverMultiple: number | null; requiredCagr: number | null; gap: number | null; shareOfCryptoToday: number | null }[];
  risk: { vol1y: number | null; vol3y: number | null; maxDrawdown3y: number | null; fromPeak3y: number | null; corrBtc1y: number | null; corrBtc3y: number | null; liquidity: number | null; fdvToMcap: number | null; days3y: number };
}
export interface ValuationResult {
  version: string;
  windowEnd: string | null;
  multiplesOverTime: { label: string; basis: string; points: MultiplePoint[] }[];
  sensitivity: { base: number | null; rows: { input: string; lowLabel: string; highLabel: string; low: number | null; high: number | null; swing: number | null }[] };
  multipleNeeded: { price: number; byGrowth: { growthKey: string; multiple: number | null }[] }[];
  opportunity: AssetOpportunity[];
  findings: string[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const isoDay = (t: number) => new Date(t * 1000).toISOString().slice(0, 10);
const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const fmtPct = (v: number | null, d = 0) => (v === null ? 'n/a' : `${(v * 100).toFixed(d)}%`);
const fmtX = (v: number | null) => (v === null ? 'n/a' : v >= 10 ? `${v.toFixed(0)}x` : `${v.toFixed(1)}x`);

/** Daily series from CoinGecko-style [unix, value] pairs, one point per day (first wins), newest (partial) day dropped. */
function daily(pairs: unknown): DailyPoint[] {
  const seen = new Set<string>();
  const out: DailyPoint[] = [];
  for (const p of Array.isArray(pairs) ? pairs : []) {
    const d = isoDay(Number((p as number[])[0])); const v = Number((p as number[])[1]);
    if (!Number.isFinite(v) || seen.has(d)) continue;
    seen.add(d); out.push([d, v]);
  }
  return out.sort((a, b) => a[0].localeCompare(b[0])).slice(0, -1);
}

/** Log returns between consecutive calendar days only (a gap breaks the chain; nothing is interpolated). */
export function returns(px: DailyPoint[]): Map<string, number> {
  const m = new Map<string, number>();
  for (let i = 1; i < px.length; i++) if (addDays(px[i - 1]![0], 1) === px[i]![0] && px[i - 1]![1] > 0 && px[i]![1] > 0) m.set(px[i]![0], Math.log(px[i]![1] / px[i - 1]![1]));
  return m;
}
const stdev = (xs: number[]) => { if (xs.length < 30) return null; const m = xs.reduce((a, b) => a + b, 0) / xs.length; return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1)); };
export function corr(a: Map<string, number>, b: Map<string, number>, from: string, to = '9999'): number | null {
  const ks = [...a.keys()].filter((k) => k >= from && k < to && b.has(k));
  if (ks.length < 60) return null;
  const xs = ks.map((k) => a.get(k)!), ys = ks.map((k) => b.get(k)!);
  const mx = xs.reduce((s, v) => s + v, 0) / xs.length, my = ys.reduce((s, v) => s + v, 0) / ys.length;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < xs.length; i++) { sxy += (xs[i]! - mx) * (ys[i]! - my); sxx += (xs[i]! - mx) ** 2; syy += (ys[i]! - my) ** 2; }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
}

export function analyzeValuation(raws: Record<string, RawRecord | null | undefined>, ev: (id: string) => number | null, ladder: LadderResult, tok: TokenomicsResult): ValuationResult {
  const body = (k: string) => raws[k]?.body as any;
  const series = (k: string) => fromUnixPairs(body(k)?.chart);
  const levels = (k: string) => fromUnixPairs(body(k)); // [[unix, value]] bodies (TVL, stablecoins)
  const universe: any[] = Array.isArray(body('coingecko.universe')) ? body('coingecko.universe') : [];
  const totalCrypto = Number.isFinite(body('coingecko.global')?.totalMarketCapUsd) ? body('coingecko.global').totalMarketCapUsd as number : null;
  const hist = (coin: string) => (coin === 'near' ? body('coingecko.near.history') : body(`coingecko.history.${coin}`));
  const mcapSeries = (coin: string) => daily(hist(coin)?.marketCaps);
  const END = ladder.basis.windowEnd;

  // Holders revenue per asset (DefiLlama), NEAR = burns + designated buybacks; NEAR delivered = burns + NEAR delivered to the buyback wallet.
  const burn = series('defillama.revenue.near');
  const iHold = series('defillama.intents.dailyHoldersRevenue');
  const delivMap = new Map(tok.buybacks.deliveredDaily);
  const holders = (label: string, basis: 'designated' | 'delivered' = 'designated'): DailyPoint[] => {
    if (label !== 'NEAR') { const a = INVESTABLE.find((x) => x.label === label); return a?.llama ? series(`defillama.holders.${a.llama}`) : []; }
    const b = new Map(burn);
    // Delivered basis: days with no delivery count as zero, up to the last complete buyback day (unavailable if the reconstruction is).
    const src = basis === 'designated' ? iHold : delivMap.size ? burn.map(([d]) => [d, delivMap.get(d) ?? 0] as DailyPoint).filter(([d]) => tok.buybacks.lastDay === null || d <= tok.buybacks.lastDay) : [];
    return src.filter(([d]) => b.has(d)).map(([d, v]) => [d, v + b.get(d)!] as DailyPoint);
  };

  // ---- W5.1 Multiples month by month: market cap on each month-end / trailing-90-day holders revenue, annualized.
  const monthEnds = (() => {
    if (!END) return [] as string[];
    const out: string[] = [];
    for (let i = 11; i >= 0; i--) { const dt = new Date(Date.UTC(Number(END.slice(0, 4)), Number(END.slice(5, 7)) - 1 - i + 1, 0)); const d = dt.toISOString().slice(0, 10); out.push(d > END ? END : d); }
    return out;
  })();
  const mo = (label: string, coin: string, basis: 'designated' | 'delivered', title: string) => {
    const caps = new Map(mcapSeries(coin));
    const h = holders(label, basis);
    // NEAR: a month counts only when its whole 90-day window follows the start of the flow being valued (audit item 6):
    // earlier windows value a different revenue definition (pre-buyback treasury revenue, or no deliveries yet).
    const flowStart = label !== 'NEAR' ? null : basis === 'designated' ? BUYBACKS_START : tok.buybacks.firstReceipt;
    return { label, basis: title, points: monthEnds.map((d) => {
      if (label === 'NEAR' && (flowStart === null || addDays(d, -(RUN - 1)) < flowStart)) return { month: d.slice(0, 7), value: null };
      const s = windowAggregate(h, d, RUN).sum;
      const cap = caps.get(d) ?? null;
      return { month: d.slice(0, 7), value: s ? safeDiv(cap, (s * 365) / RUN) : null };
    }) };
  };
  const multiplesOverTime = [
    mo('NEAR', 'near', 'designated', 'Burns + designated buybacks (DefiLlama), windows after 23 February 2026 only'),
    mo('NEAR', 'near', 'delivered', 'Burns + NEAR delivered to the buyback wallet (onchain), windows after the first delivery only'),
    ...INVESTABLE.filter((a) => a.llama).map((a) => mo(a.label, a.coin, 'designated', 'DefiLlama holders revenue')),
  ];

  // ---- W5.2 Sensitivity of NEAR's implied 2036 price (cash-flow framework, base: 20% growth, NEAR's own multiple).
  const I = ladder.inputs;
  const mToday = ladder.multiples.find((m) => m.key === 'today')?.value ?? null;
  const implied = (g: number, mult: number | null, take: number | null, burns: number | null, supply: number | null) =>
    I.intentsRunRate !== null && take !== null && burns !== null && mult && supply ? ((I.intentsRunRate * Math.pow(1 + g, HORIZON_YEARS) * take + burns) * mult) / supply : null;
  const base = implied(0.2, mToday, I.holderTakeRate, I.burnRunRate, I.supply2036);
  const row = (input: string, lowLabel: string, highLabel: string, low: number | null, high: number | null) => ({ input, lowLabel, highLabel, low, high, swing: low && high ? high / low : null });
  const S = SENSITIVITY;
  const sensitivity = { base, rows: [
    row('Intents growth, 10 years', `${S.growth.low * 100}% a year`, `${S.growth.high * 100}% a year`, implied(S.growth.low, mToday, I.holderTakeRate, I.burnRunRate, I.supply2036), implied(S.growth.high, mToday, I.holderTakeRate, I.burnRunRate, I.supply2036)),
    row('Valuation multiple', `${S.multiple.low}x today's`, `${S.multiple.high}x today's`, implied(0.2, mToday && mToday * S.multiple.low, I.holderTakeRate, I.burnRunRate, I.supply2036), implied(0.2, mToday && mToday * S.multiple.high, I.holderTakeRate, I.burnRunRate, I.supply2036)),
    row('Buyback revenue per dollar of volume', `${S.holderTakeRate.low}x today's`, `${S.holderTakeRate.high}x today's`, implied(0.2, mToday, I.holderTakeRate && I.holderTakeRate * S.holderTakeRate.low, I.burnRunRate, I.supply2036), implied(0.2, mToday, I.holderTakeRate && I.holderTakeRate * S.holderTakeRate.high, I.burnRunRate, I.supply2036)),
    row('Gas burns', `${S.burns.low}x today's`, `${S.burns.high}x today's`, implied(0.2, mToday, I.holderTakeRate, I.burnRunRate !== null ? I.burnRunRate * S.burns.low : null, I.supply2036), implied(0.2, mToday, I.holderTakeRate, I.burnRunRate !== null ? I.burnRunRate * S.burns.high : null, I.supply2036)),
    row('Supply rule', '2.5% issuance (base)', 'HSP-029', base, implied(0.2, mToday, I.holderTakeRate, I.burnRunRate, I.supply2036Hsp029)),
  ].sort((a, b) => (b.swing ?? 0) - (a.swing ?? 0)) };

  // ---- W5.3 The multiple each rung would need at each growth scenario.
  const multipleNeeded = RUNGS.map((p) => ({ price: p, byGrowth: GROWTH_SCENARIOS.map((g) => {
    const capture = I.intentsRunRate !== null && I.holderTakeRate !== null && I.burnRunRate !== null ? I.intentsRunRate * Math.pow(1 + g.cagr, HORIZON_YEARS) * I.holderTakeRate + I.burnRunRate : null;
    return { growthKey: g.key, multiple: capture && I.supply2036 ? (p * I.supply2036) / capture : null };
  }) }));

  // ---- W6 Opportunity cost.
  const btcRet = (() => { const px = fromUnixPairs(Object.keys(raws).filter((k) => k.startsWith('defillama.coins.bitcoin.')).flatMap((k) => (body(k)?.prices ?? []))); return returns(dedupe(px)); })();
  const HEND = commonEnd(INVESTABLE.filter((a) => a.llama).map((a) => series(`defillama.holders.${a.llama}`)).filter((x) => x.length), 1);
  const iVol = series('defillama.intents.volume');
  const opportunity: AssetOpportunity[] = INVESTABLE.map((a) => {
    const u = universe.find((x) => x.id === a.coin);
    const marketCap = u && Number.isFinite(u.marketCap) ? u.marketCap as number : null;
    const tk = tok.assets.find((x) => x.label === a.label);
    const dil = tk?.ownershipDilution ?? null;
    const dilutionFactor = dil !== null ? Math.pow(1 + dil, HORIZON_YEARS) : null;
    // Platform economy: stablecoins and TVL at END vs a year earlier.
    const ce = CHAIN_ECONOMY.find((c) => c.label === a.label);
    let platform: AssetOpportunity['platform'] = null;
    if (ce && END) {
      const at = (pts: DailyPoint[], d: string) => { const p = [...pts].reverse().find(([x]) => x <= d); return p && p[0] >= addDays(d, -7) ? p[1] : null; };
      const st = levels(`defillama.stablechart.${a.label.toLowerCase()}`), tv = levels(`defillama.chaintvl.${a.label.toLowerCase()}`);
      const st0 = at(st, addDays(END, -365)), st1 = at(st, END), tv0 = at(tv, addDays(END, -365)), tv1 = at(tv, END);
      platform = { stablecoins: st1, stablecoinsGrowth: st0 && st1 ? st1 / st0 - 1 : null, tvl: tv1, tvlGrowth: tv0 && tv1 ? tv1 / tv0 - 1 : null };
    }
    // Observed growth of each asset's valuation driver (same window a year earlier).
    let method = '', driver = '', observedGrowth: number | null = null, observedBasis = '', observedNote: string | null = null;
    if (a.type === 'monetary') {
      method = 'Monetary: market cap relative to total crypto'; driver = 'market cap';
      observedBasis = 'none: a monetary asset has no cash flow or on-chain economy to grow; required market cap is compared with today\'s total crypto market';
    } else if (a.type === 'cash-flow') {
      method = 'Cash flow: market cap / value to holders'; driver = 'holders revenue';
      const h = holders(a.label);
      const now = HEND ? windowAggregate(h, HEND, RUN).sum : null, prev = HEND ? windowAggregate(h, addDays(HEND, -365), RUN).sum : null;
      observedGrowth = now && prev ? now / prev - 1 : null; observedBasis = `holders revenue, ${RUN} days vs the same ${RUN} days a year earlier`;
    } else if (a.type === 'platform') {
      method = 'Platform: market cap / on-chain economy'; driver = 'stablecoins and DeFi TVL on the chain';
      const gs = [platform?.stablecoinsGrowth, platform?.tvlGrowth].filter((x): x is number => x !== null && x !== undefined);
      observedGrowth = gs.length ? gs.reduce((s, v) => s + v, 0) / gs.length : null;
      observedBasis = 'mean of stablecoin and DeFi TVL growth on the chain, last year';
    } else {
      method = 'Both tested: cash flow (Intents buybacks) and platform (on-chain economy)'; driver = 'Intents volume (cash flow); stablecoins and TVL (platform)';
      const now = END ? windowAggregate(iVol, END, RUN).sum : null, prev = END ? windowAggregate(iVol, addDays(END, -365), RUN).sum : null;
      observedGrowth = now && prev ? now / prev - 1 : null; observedBasis = `Intents volume, ${RUN} days vs the same ${RUN} days a year earlier (the cash-flow driver; holders revenue itself only began with buybacks in February 2026)`;
      const sg = (x: number | null) => (x === null ? 'n/a' : `${x > 0 ? '+' : ''}${(x * 100).toFixed(0)}%`);
      observedNote = platform ? `Platform route: stablecoins ${sg(platform.stablecoinsGrowth)}, DeFi TVL ${sg(platform.tvlGrowth)} over the last year.` : null;
    }
    const targets = TARGET_MULTIPLES.map((k) => {
      const requiredMarketCap = marketCap !== null && dilutionFactor !== null ? marketCap * k * dilutionFactor : null;
      // The valuation ratio is held at today's level, so the driver must grow by the same factor as the market cap.
      const requiredDriverMultiple = a.type === 'monetary' || dilutionFactor === null ? null : k * dilutionFactor;
      const requiredCagr = requiredDriverMultiple !== null ? Math.pow(requiredDriverMultiple, 1 / HORIZON_YEARS) - 1 : null;
      return { k, requiredMarketCap, requiredDriverMultiple, requiredCagr, gap: requiredCagr !== null && observedGrowth !== null ? observedGrowth - requiredCagr : null, shareOfCryptoToday: safeDiv(requiredMarketCap, totalCrypto) };
    });
    // Risk on common metrics (DefiLlama daily prices, consecutive days only).
    const px = dedupe(fromUnixPairs(Object.keys(raws).filter((k) => k.startsWith(`defillama.coins.${a.coin}.`)).flatMap((k) => (body(k)?.prices ?? []))));
    const lastPx = px.length ? px[px.length - 1]![0] : null;
    const from1 = lastPx ? addDays(lastPx, -365) : '', from3 = lastPx ? addDays(lastPx, -3 * 365) : '';
    const ret = returns(px);
    const r1 = [...ret.entries()].filter(([d]) => d > from1).map(([, v]) => v), r3 = [...ret.entries()].filter(([d]) => d > from3).map(([, v]) => v);
    const p3 = px.filter(([d]) => d > from3);
    let peak = 0, mdd = 0;
    for (const [, v] of p3) { peak = Math.max(peak, v); mdd = Math.min(mdd, v / peak - 1); }
    const s1 = stdev(r1), s3 = stdev(r3);
    return {
      label: a.label, type: a.type, marketCap, price: u && Number.isFinite(u.price) ? u.price : null, method, driver,
      dilutionPerYear: dil, dilutionFactor, observedGrowth, observedBasis, observedNote, platform, targets,
      risk: {
        vol1y: s1 === null ? null : s1 * Math.sqrt(365), vol3y: s3 === null ? null : s3 * Math.sqrt(365), maxDrawdown3y: p3.length > 300 ? mdd : null,
        fromPeak3y: p3.length > 300 && peak ? p3[p3.length - 1]![1] / peak - 1 : null,
        corrBtc1y: a.coin === 'bitcoin' ? 1 : corr(ret, btcRet, from1), corrBtc3y: a.coin === 'bitcoin' ? 1 : corr(ret, btcRet, from3),
        liquidity: u && Number.isFinite(u.volume24h) && marketCap ? u.volume24h / marketCap : null, fdvToMcap: tk?.fdvToMcap ?? null, days3y: p3.length,
      },
    };
  });

  // ---- Findings, generated from the numbers.
  const near = opportunity.find((o) => o.label === 'NEAR');
  const at7 = (o: AssetOpportunity) => o.targets.find((t) => t.k === 7);
  const gaps = opportunity.filter((o) => at7(o)?.gap !== null && at7(o)?.gap !== undefined).sort((x, y) => at7(y)!.gap! - at7(x)!.gap!);
  const sens = sensitivity.rows[0];
  const mn100 = multipleNeeded.find((m) => m.price === 100);
  const nearDes = multiplesOverTime[0]!.points.filter((p) => p.value !== null), nearExe = multiplesOverTime[1]!.points.filter((p) => p.value !== null);
  const findings = [
    `NEAR's own cash-flow multiple: ${fmtX(nearDes.at(-1)?.value ?? null)} on designated buybacks and ${fmtX(nearExe.at(-1)?.value ?? null)} on NEAR delivered to the buyback wallet (latest month-end). Only windows that fall entirely after each flow began are shown; earlier months valued pre-buyback treasury revenue and are not comparable.`,
    sens ? `The input that moves NEAR's implied 2036 price most is ${sens.input} (${sens.lowLabel}: $${sens.low?.toFixed(2)}; ${sens.highLabel}: $${sens.high?.toFixed(2)}; base $${base?.toFixed(2)}).` : '',
    mn100 ? `At 20% a year growth, $100 would need a cash-flow multiple of ${fmtX(mn100.byGrowth.find((g) => g.growthKey === 'base')?.multiple ?? null)}; at high growth ${fmtX(mn100.byGrowth.find((g) => g.growthKey === 'high')?.multiple ?? null)}. Today: NEAR ${fmtX(mToday)}, Tron ${fmtX(ladder.multiples.find((m) => m.key === 'tron')?.value ?? null)}, Hyperliquid ${fmtX(ladder.multiples.find((m) => m.key === 'hyperliquid')?.value ?? null)}.` : '',
    near && at7(near)?.requiredCagr !== null ? `For 7x in ten years NEAR's driver must grow ${fmtPct(at7(near)!.requiredCagr ?? null, 1)} a year (its own dilution included); Intents volume grew ${fmtPct(near.observedGrowth)} over the last year. Required vs observed, by asset (7x): ${gaps.map((o) => `${o.label} ${fmtPct(at7(o)!.requiredCagr ?? null, 0)} vs ${fmtPct(o.observedGrowth)}`).join('; ')}. One year of observed growth is dominated by the market cycle, and NEAR's driver is a young product growing from a small base while the platforms' drivers are mature chain economies, so the comparison flatters NEAR.` : '',
  ].filter(Boolean);

  return { version: VALUATION_VERSION, windowEnd: END, multiplesOverTime, sensitivity, multipleNeeded, opportunity, findings };
}

export function dedupe(px: DailyPoint[]): DailyPoint[] {
  const m = new Map<string, number>();
  for (const [d, v] of px) if (!m.has(d)) m.set(d, v);
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

/** Evidence items for W5 and W6. */
export function valuationEvidence(v: ValuationResult): EvidenceDraft[] {
  const out: EvidenceDraft[] = [];
  const item = (o: Partial<EvidenceDraft> & Pick<EvidenceDraft, 'evidenceId' | 'metricKey' | 'label' | 'unit' | 'methodology' | 'transform'>): void => {
    const value = o.value ?? null;
    out.push({
      group: 'valuation', valueText: null, observationType: 'DERIVED', sourceName: 'Computed here', sourceUrl: '/methodology#valuation', observedAt: null, fetchedAt: null,
      periodStart: null, periodEnd: v.windowEnd, confidence: 'medium', rawResponseHash: null, validationNotes: null, series: null, inputs: [], ...o,
      value: value !== null && Number.isFinite(value) ? value : null, available: value !== null && Number.isFinite(value),
    });
  };
  for (const m of v.multiplesOverTime) {
    const last = [...m.points].reverse().find((p) => p.value !== null) ?? null;
    const first = m.points.find((p) => p.value !== null) ?? null;
    const id = `VAL-MULT-HIST-${m.label}${m.basis.includes('delivered to the buyback wallet') ? '-DELIVERED' : ''}`;
    item({ evidenceId: id, metricKey: `valuation.multiple_history.${id.toLowerCase()}`, label: `${m.label}: market cap / value to holders, latest month-end (${m.basis})`, unit: 'ratio', value: last?.value ?? null,
      periodStart: first?.month ?? null, periodEnd: last?.month ?? null, validationNotes: first && last ? `First available month ${first.month}: ${first.value?.toFixed(0)}x.` : null,
      series: { label: `${m.label} multiple`, unit: 'ratio', aggregation: 'month', points: m.points.filter((p) => p.value !== null).map((p) => [p.month, p.value!]) },
      methodology: 'CoinGecko market cap on each month-end / holders revenue over the 90 days ending that day, annualized.', transform: 'cap_d / (sum 90d x 365/90)' });
  }
  item({ evidenceId: 'VAL-SENS-BASE', metricKey: 'valuation.sensitivity.base', label: 'NEAR implied 2036 price, base case (20% Intents growth, NEAR\'s own multiple)', unit: 'USD', value: v.sensitivity.base,
    inputs: ['INT-VOL-ANN', 'LAD-HOLDER-TAKE-RATE', 'LAD-NEAR-BURN-RUNRATE', 'LAD-SUPPLY-2036', 'LAD-MULT-TODAY'], methodology: 'Scenario, not a forecast.', transform: '(run rate x 1.2^10 x holder take rate + burns) x multiple / supply 2036' });
  for (const r of v.sensitivity.rows) {
    const k = r.input.toUpperCase().replace(/[^A-Z]+/g, '-').replace(/-$/, '');
    item({ evidenceId: `VAL-SENS-${k}`, metricKey: `valuation.sensitivity.${k.toLowerCase()}`, label: `Sensitivity: ${r.input} (${r.lowLabel} to ${r.highLabel}), high / low implied price`, unit: 'ratio', value: r.swing,
      inputs: ['VAL-SENS-BASE'], validationNotes: `Low $${r.low?.toFixed(2)}, high $${r.high?.toFixed(2)}.`, methodology: 'One input moved at a time; the others stay at the base case. Ranges are published assumptions.', transform: 'price_high / price_low' });
  }
  for (const m of v.multipleNeeded) for (const g of m.byGrowth) {
    item({ evidenceId: `VAL-MULT-NEEDED-${m.price}-${g.growthKey.toUpperCase()}`, metricKey: `valuation.multiple_needed.${m.price}.${g.growthKey}`, label: `Cash-flow multiple $${m.price} would need at ${g.growthKey} Intents growth`, unit: 'ratio', value: g.multiple,
      inputs: ['INT-VOL-ANN', 'LAD-HOLDER-TAKE-RATE', 'LAD-NEAR-BURN-RUNRATE', 'LAD-SUPPLY-2036'], methodology: 'How much of a rung rests on the multiple alone: compare with NEAR\'s and peers\' multiples today.', transform: 'price x supply 2036 / value to holders in 2036' });
  }
  for (const o of v.opportunity) {
    const A = o.label;
    item({ evidenceId: `OPP-${A}-OBSERVED`, metricKey: `opportunity.${A.toLowerCase()}.observed_growth`, label: `${A}: observed growth of its valuation driver, last year`, unit: 'fraction', value: o.observedGrowth, methodology: o.observedBasis, transform: 'value_now / value_year_ago - 1' });
    for (const t of o.targets) {
      item({ evidenceId: `OPP-${A}-${String(t.k).replace('.', '_')}X-CAGR`, metricKey: `opportunity.${A.toLowerCase()}.${t.k}x.cagr`, label: `${A}: driver growth needed every year for ${t.k}x in ten years`, unit: 'fraction', value: t.requiredCagr,
        inputs: [`TOK-${A}-OWNERSHIP-DILUTION`], methodology: `${o.method}. Valuation ratio held at today's level; dilution of ${o.dilutionPerYear === null ? 'n/a' : `${(o.dilutionPerYear * 100).toFixed(2)}%`} a year assumed to persist.`, transform: '(k x (1 + dilution)^10)^(1/10) - 1' });
    }
    item({ evidenceId: `OPP-${A}-VOL-1Y`, metricKey: `opportunity.${A.toLowerCase()}.vol_1y`, label: `${A}: annualized volatility, last year`, unit: 'fraction', value: o.risk.vol1y, sourceName: 'DefiLlama prices', methodology: 'Standard deviation of daily log returns between consecutive days x sqrt(365).', transform: 'stdev x sqrt(365)' });
    item({ evidenceId: `OPP-${A}-VOL-3Y`, metricKey: `opportunity.${A.toLowerCase()}.vol_3y`, label: `${A}: annualized volatility, last three years`, unit: 'fraction', value: o.risk.vol3y, sourceName: 'DefiLlama prices', methodology: 'Same, three years (or since listing).', transform: 'stdev x sqrt(365)' });
    item({ evidenceId: `OPP-${A}-MAXDD-3Y`, metricKey: `opportunity.${A.toLowerCase()}.max_drawdown_3y`, label: `${A}: maximum drawdown, last three years`, unit: 'fraction', value: o.risk.maxDrawdown3y, sourceName: 'DefiLlama prices', methodology: 'Largest fall from a running peak.', transform: 'min(price / running peak - 1)' });
    item({ evidenceId: `OPP-${A}-FROM-PEAK`, metricKey: `opportunity.${A.toLowerCase()}.from_peak_3y`, label: `${A}: price today vs its three-year peak`, unit: 'fraction', value: o.risk.fromPeak3y, sourceName: 'DefiLlama prices', methodology: 'Recovery status.', transform: 'price / peak - 1' });
    item({ evidenceId: `OPP-${A}-CORR-BTC`, metricKey: `opportunity.${A.toLowerCase()}.corr_btc_1y`, label: `${A}: correlation of daily returns with BTC, last year`, unit: 'ratio', value: o.risk.corrBtc1y, sourceName: 'DefiLlama prices', methodology: 'Pearson correlation on days both have consecutive returns.', transform: 'corr(r, r_btc)' });
    item({ evidenceId: `OPP-${A}-LIQUIDITY`, metricKey: `opportunity.${A.toLowerCase()}.liquidity`, label: `${A}: 24-hour trading volume / market cap`, unit: 'fraction', value: o.risk.liquidity, sourceName: 'CoinGecko', methodology: 'One-day snapshot; a rough liquidity measure.', transform: 'volume 24h / market cap' });
  }
  return out;
}
