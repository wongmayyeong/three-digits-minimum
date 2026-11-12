/**
 * W1: market opportunity (SCOPE.md section 8). Size, growth and cyclicality since 2020 of the markets NEAR's
 * products sell into, each category kept separate (section 7): spot DEX volume, cross-chain swap volume
 * (DefiLlama's bridge categories), bridge aggregators, stablecoin supply, and AI-agent payments (x402).
 * Plus concentration of spot DEX volume. Users are not measured: no free cross-chain user dataset exists.
 */
import type { RawRecord } from '@/lib/data/fetcher';
import { DEX_CROSS_CHAIN_CATEGORIES, DEX_SPOT_CATEGORY } from '@/lib/data/sources';
import { fromUnixPairs, safeDiv, type DailyPoint } from './series';
import type { EvidenceDraft } from './types';

export const MARKET_VERSION = 'w1-1.0.0';
export const MARKET_YEARS = ['2020', '2021', '2022', '2023', '2024', '2025'] as const;

export interface MarketSeries { key: string; label: string; unit: 'volume' | 'level'; byYear: { year: string; value: number | null }[]; trailing: number | null; cagr: number | null; cagrFrom: string | null; peakYear: string | null; worstFromPeak: number | null; note: string }
export interface MarketResult {
  version: string; asOf: string | null;
  series: MarketSeries[];
  spotTop5Share: number | null; spotTop5: { name: string; share: number }[];
  intentsShareOfCrossChain: number | null;
  findings: string[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const fmtUsd = (v: number | null) => (v === null ? 'n/a' : v >= 1e12 ? `$${(v / 1e12).toFixed(2)}T` : v >= 1e9 ? `$${(v / 1e9).toFixed(0)}B` : `$${(v / 1e6).toFixed(0)}M`);
const fmtPct = (v: number | null) => (v === null ? 'n/a' : `${(v * 100).toFixed(0)}%`);

/** Growth needs a credible first year: from `from` onward, and only when that year is at least 5% of the last (thin early coverage otherwise). */
function build(key: string, label: string, pts: DailyPoint[], unit: 'volume' | 'level', note: string, from = '2021'): MarketSeries {
  const sorted = [...pts].sort((a, b) => a[0].localeCompare(b[0]));
  const done = sorted.slice(0, -1);
  const last = done.length ? done[done.length - 1]![0] : null;
  const yearValue = (y: string) => {
    const inYear = done.filter(([d]) => d.startsWith(y));
    if (!inYear.length) return null;
    if (unit === 'level') return inYear[inYear.length - 1]![1]; // year-end level
    const full = inYear.length >= 360; // a volume year counts only with (almost) every day present
    return full ? inYear.reduce((a, [, v]) => a + v, 0) : null;
  };
  const byYear = MARKET_YEARS.map((y) => ({ year: y, value: yearValue(y) }));
  const trailing = last ? (unit === 'level' ? done[done.length - 1]![1] : (() => { const from = new Date(Date.parse(`${last}T00:00:00Z`) - 364 * 86_400_000).toISOString().slice(0, 10); const w = done.filter(([d]) => d >= from); return w.length >= 360 ? w.reduce((a, [, v]) => a + v, 0) : null; })()) : null;
  const avail = byYear.filter((y) => y.value !== null && y.value > 0);
  const grow = avail.filter((y) => y.year >= from);
  const first = grow[0] ?? null, end = grow[grow.length - 1] ?? null;
  const n = first && end ? Number(end.year) - Number(first.year) : 0;
  const credible = first && end && n >= 2 && first.value! >= 0.05 * end.value!; // two years apart at least
  const cagr = credible && n > 0 ? Math.pow(end!.value! / first!.value!, 1 / n) - 1 : null;
  let peak = 0, peakYear: string | null = null, worst = 0;
  for (const y of avail) { if (y.value! > peak) { peak = y.value!; peakYear = y.year; } worst = Math.min(worst, y.value! / peak - 1); }
  return { key, label, unit, byYear, trailing, cagr, cagrFrom: credible ? first!.year : null, peakYear, worstFromPeak: avail.length > 1 ? worst : null, note };
}

export function analyzeMarket(raws: Record<string, RawRecord | null | undefined>): MarketResult {
  const body = (k: string) => raws[k]?.body as any;
  const cat = body('defillama.dexs.categories');
  const rows: [string, Record<string, number>][] = (Array.isArray(cat?.chart) ? cat.chart : []).map((r: any) => [new Date(Number(r[0]) * 1000).toISOString().slice(0, 10), r[1] ?? {}]);
  const catSeries = (cats: string[]): DailyPoint[] => rows.map(([d, o]) => [d, cats.reduce((a, c) => a + (Number(o[c]) || 0), 0)]);
  const stables = fromUnixPairs(body('defillama.stablecoins.all'));
  const series = [
    build('spot', 'Spot DEX volume (DefiLlama "Dexs" category)', catSeries([DEX_SPOT_CATEGORY]), 'volume', 'NEAR Intents\' scale reference; includes cross-chain swap networks filed as DEXs (THORChain, Chainflip).'),
    build('crosschain', 'Cross-chain swap volume (DefiLlama bridge categories in its DEX overview)', catSeries(DEX_CROSS_CHAIN_CATEGORIES), 'volume', 'NEAR Intents\' own category; coverage is thin before 2025 and misses protocols without a volume adapter.'),
    build('aggregators', 'Bridge-aggregator volume', fromUnixPairs(body('defillama.bridgeaggs.total')?.chart), 'volume', 'Routes through bridges and swap venues (including Intents); overlaps the rows above, never added to them.'),
    build('stablecoins', 'Stablecoin supply, year end (USD-pegged)', stables, 'level', 'The money on chain that cross-chain execution moves.'),
    build('x402', 'AI-agent payments (x402)', fromUnixPairs(body('defillama.x402.volume')?.chart), 'volume', 'The one public AI-agent payment series; starts in 2025.'),
  ];
  // Concentration: top five parent protocols' share of spot DEX volume, trailing year.
  const top: any[] = Array.isArray(cat?.spotTop) ? cat.spotTop : [];
  const total = Number(cat?.spotTotal1y) || 0;
  const byParent = new Map<string, number>();
  for (const p of top) { const k = String(p.parent ?? p.name).replace(/^parent#/, ''); byParent.set(k, (byParent.get(k) ?? 0) + Number(p.total1y)); }
  const ranked = [...byParent.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const spotTop5 = total ? ranked.map(([name, v]) => ({ name, share: v / total })) : [];
  const spotTop5Share = total ? ranked.reduce((a, [, v]) => a + v, 0) / total : null;
  const cc = series[1]!, iv = fromUnixPairs(body('defillama.intents.volume')?.chart);
  const lastDay = iv.length > 1 ? iv[iv.length - 2]![0] : null;
  const intents365 = lastDay ? iv.filter(([d]) => d > new Date(Date.parse(`${lastDay}T00:00:00Z`) - 365 * 86_400_000).toISOString().slice(0, 10) && d <= lastDay).reduce((a, [, v]) => a + v, 0) : null;
  const intentsShareOfCrossChain = safeDiv(intents365, cc.trailing);
  const S = (k: string) => series.find((x) => x.key === k)!;
  const findings = [
    `Spot DEX volume: ${fmtUsd(S('spot').trailing)} over the last year, ${fmtPct(safeDiv(S('spot').trailing, S('spot').byYear.find((y) => y.year === '2025')?.value ?? null) === null ? null : safeDiv(S('spot').trailing, S('spot').byYear.find((y) => y.year === '2025')!.value)! - 1)} against calendar 2025; ${S('spot').cagr === null ? 'n/a' : fmtPct(S('spot').cagr)} a year from ${S('spot').cagrFrom} to 2025, with a worst year ${fmtPct(S('spot').worstFromPeak)} below the previous peak: large and cyclical.`,
    `Cross-chain swap volume in DefiLlama's bridge categories: ${fmtUsd(cc.trailing)} over the last year, of which NEAR Intents is ${fmtPct(intentsShareOfCrossChain)}; bridge aggregators routed ${fmtUsd(S('aggregators').trailing)} (overlapping, not added).`,
    `Stablecoin supply ${fmtUsd(S('stablecoins').trailing)} (${S('stablecoins').cagr === null ? 'n/a' : fmtPct(S('stablecoins').cagr)} a year since ${S('stablecoins').cagrFrom}); AI-agent payments via x402 ${fmtUsd(S('x402').trailing)} over the last year, a market too small and too new to size NEAR AI's opportunity.`,
    `The five largest spot DEX protocol families handle ${fmtPct(spotTop5Share)} of spot volume (${spotTop5.map((p) => `${p.name} ${fmtPct(p.share)}`).join(', ')}).`,
  ];
  return { version: MARKET_VERSION, asOf: lastDay, series, spotTop5Share, spotTop5, intentsShareOfCrossChain, findings };
}

export function marketEvidence(m: MarketResult): EvidenceDraft[] {
  const out: EvidenceDraft[] = [];
  for (const s of m.series) {
    const base = { group: 'peers' as const, valueText: null, observationType: 'DERIVED' as const, sourceName: 'DefiLlama', sourceUrl: '/methodology#market', observedAt: null, fetchedAt: null, periodStart: null, periodEnd: m.asOf, confidence: 'medium' as const, rawResponseHash: null, validationNotes: s.note, series: null, inputs: [] };
    const push = (id: string, label: string, unit: 'USD' | 'fraction', value: number | null, methodology: string, transform: string) => out.push({ ...base, evidenceId: id, metricKey: id.toLowerCase(), label, unit, value: value !== null && Number.isFinite(value) ? value : null, available: value !== null && Number.isFinite(value), methodology, transform });
    const K = s.key.toUpperCase();
    push(`MKT-${K}-TRAILING`, `${s.label}, ${s.unit === 'level' ? 'latest' : 'last 365 days'}`, 'USD', s.trailing, s.unit === 'level' ? 'Latest level.' : 'Sum of the last 365 complete days (unavailable if days are missing).', s.unit === 'level' ? 'level' : 'sum 365d');
    push(`MKT-${K}-CAGR`, `${s.label}, compound annual growth ${s.cagrFrom ?? 'n/a'} to 2025`, 'fraction', s.cagr, 'Full calendar years only (at least 360 days of data).', '(end / start)^(1/years) - 1');
  }
  out.push({ group: 'peers', valueText: null, observationType: 'DERIVED', sourceName: 'DefiLlama', sourceUrl: '/methodology#market', observedAt: null, fetchedAt: null, periodStart: null, periodEnd: m.asOf, confidence: 'medium', rawResponseHash: null,
    validationNotes: m.spotTop5.map((p) => `${p.name} ${(p.share * 100).toFixed(1)}%`).join(', ') || null, series: null, inputs: [],
    evidenceId: 'MKT-SPOT-TOP5', metricKey: 'market.spot_top5_share', label: 'Share of spot DEX volume handled by the five largest protocol families, last year', unit: 'fraction',
    value: m.spotTop5Share, available: m.spotTop5Share !== null, methodology: 'DefiLlama trailing-year volume by protocol, grouped by parent protocol.', transform: 'top 5 / total' });
  return out;
}
