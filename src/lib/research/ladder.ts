/**
 * "Three digits, minimum?" The price ladder.
 *
 * Layer A (what it takes): for each price rung ($10, $25, $50, $100) in ten years, the market cap, the
 * revenue that would have to reach $NEAR holders under several valuation multiples observed in the
 * market today, and the NEAR Intents volume and DEX market share that revenue implies.
 * Layer B (what we can prove): every condition is labelled OBSERVED (in today's data), ASSUMED (a
 * modelling choice) or UNPROVEN (would have to happen and has no evidence yet).
 * Reverse view: growth scenarios x valuation multiples -> the 2036 price each combination implies,
 * including outcomes below today's price.
 *
 * Deterministic: no AI writes any number or status. Every input is an evidence item or a raw response.
 */
import type { RawRecord } from '@/lib/data/fetcher';
import { PLATFORM_CHAINS, VALUATION_PEERS } from '@/lib/data/sources';
import { fromUnixPairs, safeDiv } from './series';
import type { EvidenceDraft } from './types';

export const LADDER_VERSION = 'three-digits-1.0.0';
export const RUNGS = [10, 25, 50, 100] as const;
export const HORIZON_YEARS = 10;
/** Supply rules: today's protocol cap, and HSP-029 (approved by House of Stake, not yet in effect). */
export const SUPPLY_RULES = {
  cap25: { label: 'Current rule: 2.5% maximum issuance', note: 'Protocol maximum inflation today; realized issuance has been close to the cap.' },
  hsp029: { label: 'HSP-029: 2.5% falling to 1.6%', note: 'Approved by House of Stake on 2026-11-02; linear cut over 24 months after a ~90-day buffer; needs validator adoption and can be vetoed until 2026-11-16.' },
} as const;
/** Intents volume growth scenarios to 2036 (assumptions, labelled as such everywhere). */
export const GROWTH_SCENARIOS = [
  { key: 'low', label: 'Low', cagr: 0.10, note: 'Intents grows 10% a year and loses share of a growing DEX market.' },
  { key: 'base', label: 'Base', cagr: 0.20, note: 'Intents grows 20% a year, in line with the base-case DEX market.' },
  { key: 'high', label: 'High', cagr: 0.40, note: 'Intents grows 40% a year and keeps winning share for ten years.' },
] as const;
/** DEX market growth to 2036 (assumption); base also anchors the share calculation. */
export const DEX_GROWTH = { low: 0.10, base: 0.20 } as const;
/** Today's NEAR share of DEX volume multiplied by this or less counts as "keeps today's share". */
export const SHARE_BANDS = [
  { key: 'holds', max: 1.5, label: 'Keeps about today\'s share of DEX volume' },
  { key: 'gains', max: 5, label: 'Wins up to 5x today\'s share' },
  { key: 'dominant', max: 10, label: 'Wins 5x to 10x today\'s share' },
  { key: 'beyond', max: Infinity, label: 'Needs more than 10x today\'s share' },
] as const;

export type Status = 'OBSERVED' | 'ASSUMED' | 'UNPROVEN';
export interface Condition { text: string; status: Status; detail: string }
export interface MultipleDef { key: string; label: string; regime: 'cash-flow' | 'today' | 'platform'; value: number | null; source: string }
export interface RungResult {
  price: number;
  priceMultiple: number | null;
  marketCap: number | null;
  marketCapHsp029: number | null;
  rankToday: number | null;
  shareOfCryptoToday: number | null;
  byMultiple: {
    multipleKey: string;
    requiredCapture: number | null;
    captureMultiple: number | null;
    requiredVolume: number | null;
    volumeMultiple: number | null;
    requiredCagr: number | null;
    dexShare2036: number | null;
    dexShare2036Low: number | null;
    shareMultiple: number | null;
    band: (typeof SHARE_BANDS)[number]['key'] | null;
    conditions: Condition[];
  }[];
}
export interface LadderResult {
  version: string;
  asOf: string | null;
  inputs: {
    price: number | null; marketCap: number | null; circulating: number | null; supply2036: number | null; supply2036Hsp029: number | null;
    captureToday: number | null; takeRate: number | null; buybackShare: number | null; intentsRunRate: number | null; intents365: number | null;
    intentsYoY: number | null; dex365: number | null; dexShareToday: number | null; dex2036Base: number | null; dexCagr2021to2025: number | null;
    totalCryptoCap: number | null;
  };
  multiples: MultipleDef[];
  peers: { label: string; regime: string; marketCap: number | null; holdersRevenue365: number | null; multiple: number | null }[];
  platform: { chain: string; marketCap: number | null; stablecoins: number | null; tvl: number | null; capToStablecoins: number | null; capToTvl: number | null }[];
  platformRequirement: { benchmark: string; stablecoins: number | null; stablecoinsMultiple: number | null; tvl: number | null; tvlMultiple: number | null }[];
  rungs: RungResult[];
  implied: { growthKey: string; byMultiple: { multipleKey: string; price: number | null; multipleOfToday: number | null }[] }[];
  checkpoints: { price: number; multipleKey: string; years: { year: number; volume: number }[] }[];
  swing: { acrossMultiples: number | null; acrossGrowth: number | null; dominant: 'valuation' | 'growth' | null };
  headline: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const DAY = 86_400;
const sumWindow = (pts: [string, number][], endIso: string, days: number) => {
  const end = Date.parse(`${endIso}T00:00:00Z`) / 1000;
  return pts.filter(([d]) => { const t = Date.parse(`${d}T00:00:00Z`) / 1000; return t > end - days * DAY && t <= end; }).reduce((a, [, v]) => a + v, 0);
};

export function supplyPath(circulating: number, rule: 'cap25' | 'hsp029', years = HORIZON_YEARS): number {
  let s = circulating;
  for (let m = 1; m <= years * 12; m++) {
    const t = m / 12;
    let r = 0.025;
    if (rule === 'hsp029') r = t <= 0.25 ? 0.025 : t >= 2.25 ? 0.016 : 0.025 - (0.009 * (t - 0.25)) / 2;
    s *= Math.pow(1 + r, 1 / 12);
  }
  return s;
}

const bandOf = (x: number | null) => (x === null ? null : SHARE_BANDS.find((b) => x <= b.max)!.key);
const fmtUsd = (v: number | null) => (v === null ? 'n/a' : v >= 1e12 ? `$${(v / 1e12).toFixed(2)}T` : v >= 1e9 ? `$${(v / 1e9).toFixed(1)}B` : `$${(v / 1e6).toFixed(0)}M`);
const fmtPct = (v: number | null, d = 1) => (v === null ? 'n/a' : `${(v * 100).toFixed(d)}%`);
const fmtX = (v: number | null) => (v === null ? 'n/a' : v >= 10 ? `${v.toFixed(0)}x` : `${v.toFixed(1)}x`);

export function analyzeLadder(raws: Record<string, RawRecord | null | undefined>, ev: (id: string) => number | null): LadderResult {
  const body = (k: string) => raws[k]?.body as any;
  const top: any[] = Array.isArray(body('coingecko.top')) ? body('coingecko.top') : [];
  const totalCryptoCap = Number.isFinite(body('coingecko.global')?.totalMarketCapUsd) ? body('coingecko.global').totalMarketCapUsd as number : null;
  const price = ev('MKT-NEAR-PRICE');
  const marketCap = ev('MKT-NEAR-MCAP');
  const circulating = ev('MKT-NEAR-CIRC') ?? safeDiv(marketCap, price);
  const captureToday = ev('VAL-NEAR-VALUE-CAPTURE-ANN');
  const takeRate = ev('INT-TAKE-RATE');
  const buybackShare = ev('INT-BUYBACK-SHARE') ?? 1;
  const intentsRunRate = ev('INT-VOL-ANN');

  // Intents last 365 days and year-over-year growth of the latest complete 30 days (DefiLlama daily volume).
  const iv = fromUnixPairs(body('defillama.intents.volume')?.chart).sort((a, b) => a[0].localeCompare(b[0]));
  const ivEnd = iv.length > 1 ? iv[iv.length - 2]![0] : null; // the newest day can be partial
  const intents365 = ivEnd ? sumWindow(iv, ivEnd, 365) : null;
  const last30 = ivEnd ? sumWindow(iv, ivEnd, 30) : null;
  const yearAgoEnd = ivEnd ? new Date(Date.parse(`${ivEnd}T00:00:00Z`) - 365 * DAY * 1000).toISOString().slice(0, 10) : null;
  const prior30 = yearAgoEnd ? sumWindow(iv, yearAgoEnd, 30) : null;
  const intentsYoY = last30 !== null && prior30 ? last30 / prior30 - 1 : null;

  // DEX market: last 365 days and 2021 -> 2025 growth.
  const dex = fromUnixPairs(body('defillama.dexs.total')?.chart).sort((a, b) => a[0].localeCompare(b[0]));
  const dexEnd = dex.length > 1 ? dex[dex.length - 2]![0] : null;
  const dex365 = dexEnd ? sumWindow(dex, dexEnd, 365) : null;
  const yearSum = (y: string) => dex.filter(([d]) => d.startsWith(y)).reduce((a, [, v]) => a + v, 0);
  const d21 = yearSum('2021'), d25 = yearSum('2025');
  const dexCagr2021to2025 = d21 > 0 && d25 > 0 ? Math.pow(d25 / d21, 1 / 4) - 1 : null;
  const dexShareToday = safeDiv(intents365, dex365);
  const dex2036Base = dex365 !== null ? dex365 * Math.pow(1 + DEX_GROWTH.base, HORIZON_YEARS) : null;
  const dex2036Low = dex365 !== null ? dex365 * Math.pow(1 + DEX_GROWTH.low, HORIZON_YEARS) : null;

  // Valuation peers: market cap / revenue reaching holders over the last 365 days.
  const coinCap = (id: string) => { const c = top.find((x) => x.id === id); return c && Number.isFinite(c.marketCap) ? (c.marketCap as number) : null; };
  const peers = VALUATION_PEERS.map((p) => {
    const pts = fromUnixPairs(body(`defillama.holders.${p.llama}`)?.chart).sort((a, b) => a[0].localeCompare(b[0]));
    const end = pts.length > 1 ? pts[pts.length - 2]![0] : null;
    const rev = end && pts.length > 300 ? sumWindow(pts, end, 365) : null;
    const cap = coinCap(p.coin);
    return { label: p.label, regime: p.regime, marketCap: cap, holdersRevenue365: rev, multiple: rev ? safeDiv(cap, rev) : null };
  });
  const peerMult = (label: string) => peers.find((p) => p.label === label)?.multiple ?? null;
  const multiples: MultipleDef[] = [
    { key: 'hyperliquid', label: 'Priced like Hyperliquid', regime: 'cash-flow', value: peerMult('Hyperliquid'), source: 'Hyperliquid market cap / holders revenue, last 365 days' },
    { key: 'tron', label: 'Priced like Tron', regime: 'cash-flow', value: peerMult('Tron'), source: 'Tron market cap / holders revenue, last 365 days' },
    { key: 'today', label: 'Today\'s NEAR premium', regime: 'today', value: safeDiv(marketCap, captureToday), source: 'NEAR market cap / annualized burn + Intents buybacks (90-day run rate)' },
    { key: 'solana', label: 'Platform premium (Solana)', regime: 'platform', value: peerMult('Solana'), source: 'Solana market cap / holders revenue, last 365 days' },
  ];

  // Platform comparison: market cap relative to the economy on the chain.
  const chains: any[] = Array.isArray(body('defillama.chains')) ? body('defillama.chains') : [];
  const stables: any[] = Array.isArray(body('defillama.stablecoinchains')) ? body('defillama.stablecoinchains') : [];
  const chainCap: Record<string, number | null> = { Ethereum: coinCap('ethereum'), BSC: coinCap('binancecoin'), Solana: coinCap('solana'), Tron: coinCap('tron'), Near: marketCap };
  const platform = PLATFORM_CHAINS.map((name) => {
    const tvl = chains.find((c) => c.name === name)?.tvl ?? null;
    const st = stables.find((c) => c.name === name)?.stablecoinsUsd ?? null;
    const cap = chainCap[name] ?? null;
    return { chain: name, marketCap: cap, stablecoins: Number.isFinite(st) ? st : null, tvl: Number.isFinite(tvl) ? tvl : null, capToStablecoins: safeDiv(cap, st), capToTvl: safeDiv(cap, tvl) };
  });
  const supply2036 = circulating !== null ? supplyPath(circulating, 'cap25') : null;
  const supply2036Hsp029 = circulating !== null ? supplyPath(circulating, 'hsp029') : null;
  const nearPlat = platform.find((p) => p.chain === 'Near');
  const cap100 = supply2036 !== null ? supply2036 * 100 : null;
  const platformRequirement = platform.filter((p) => p.chain !== 'Near').map((p) => {
    const st = p.capToStablecoins && cap100 !== null ? cap100 / p.capToStablecoins : null;
    const tv = p.capToTvl && cap100 !== null ? cap100 / p.capToTvl : null;
    return { benchmark: p.chain, stablecoins: st, stablecoinsMultiple: safeDiv(st, nearPlat?.stablecoins ?? null), tvl: tv, tvlMultiple: safeDiv(tv, nearPlat?.tvl ?? null) };
  });

  // Ranking: assets other than stablecoins, wrapped and tokenized assets.
  const EXCLUDE = /usd|dai|eur|wrapped|staked|bridged|tether gold|pax gold|figure|heloc|wbt|leo token/i;
  const ranked = top.filter((c) => !EXCLUDE.test(`${c.symbol} ${c.name}`)).map((c) => c.marketCap as number).filter(Number.isFinite);

  const rungs: RungResult[] = RUNGS.map((p) => {
    const cap = supply2036 !== null ? supply2036 * p : null;
    return {
      price: p,
      priceMultiple: safeDiv(p, price),
      marketCap: cap,
      marketCapHsp029: supply2036Hsp029 !== null ? supply2036Hsp029 * p : null,
      rankToday: cap !== null && ranked.length ? ranked.filter((c) => c > cap).length + 1 : null,
      shareOfCryptoToday: safeDiv(cap, totalCryptoCap),
      byMultiple: multiples.map((m) => {
        const requiredCapture = cap !== null && m.value ? cap / m.value : null;
        const requiredVolume = requiredCapture !== null && takeRate ? requiredCapture / (takeRate * buybackShare) : null;
        const volumeMultiple = safeDiv(requiredVolume, intentsRunRate);
        const requiredCagr = volumeMultiple !== null && volumeMultiple > 0 ? Math.pow(volumeMultiple, 1 / HORIZON_YEARS) - 1 : null;
        const dexShare2036 = safeDiv(requiredVolume, dex2036Base);
        const shareMultiple = safeDiv(dexShare2036, dexShareToday);
        const conditions: Condition[] = [
          { text: `NEAR Intents already returns ${fmtUsd(captureToday)} a year to $NEAR (burns plus buybacks)`, status: 'OBSERVED', detail: 'VAL-NEAR-VALUE-CAPTURE-ANN, 90-day run rate.' },
          { text: `The market values that revenue at ${fmtX(m.value)} in 2036 (${m.label})`, status: 'ASSUMED', detail: `${m.source}. Multiples move with sentiment; ${m.key === 'today' ? 'this is NEAR\'s own multiple today, assumed to persist' : 'this is another token\'s multiple today, applied to NEAR'}.` },
          { text: `Revenue to holders grows to ${fmtUsd(requiredCapture)} a year (${fmtX(safeDiv(requiredCapture, captureToday))} today)`, status: 'UNPROVEN', detail: 'Requires the volume and fee conditions below.' },
          { text: `Intents volume reaches ${fmtUsd(requiredVolume)} a year, ${fmtPct(requiredCagr, 0)} growth a year for ten years`, status: 'UNPROVEN', detail: `Today: ${fmtUsd(intentsRunRate)} run rate; ${fmtPct(intentsYoY, 0)} year over year (latest 30 days vs a year earlier). Momentum is observed; ten years of it is not.` },
          { text: `Intents handles ${fmtPct(dexShare2036)} of all DEX volume in 2036 (today ${fmtPct(dexShareToday, 2)})`, status: 'UNPROVEN', detail: `Assumes the DEX market grows ${DEX_GROWTH.base * 100}% a year to ${fmtUsd(dex2036Base)} (2021 to 2025: ${fmtPct(dexCagr2021to2025, 0)} a year).` },
          { text: `NEAR keeps ${fmtPct(takeRate, 3)} of every dollar of volume`, status: 'ASSUMED', detail: 'INT-TAKE-RATE, 90 days. Fee competition halving it doubles every volume requirement.' },
        ];
        if (m.regime === 'platform') {
          const req = platformRequirement.find((r) => r.benchmark === 'Solana');
          conditions.push({ text: `NEAR becomes a top platform: about ${fmtUsd(req ? (req.stablecoins ?? 0) * (p / 100) : null)} of stablecoins and ${fmtUsd(req ? (req.tvl ?? 0) * (p / 100) : null)} of TVL on NEAR`, status: 'UNPROVEN', detail: `Platform premiums follow the economy on the chain; NEAR today: ${fmtUsd(nearPlat?.stablecoins ?? null)} stablecoins, ${fmtUsd(nearPlat?.tvl ?? null)} TVL.` });
        }
        return {
          multipleKey: m.key, requiredCapture, captureMultiple: safeDiv(requiredCapture, captureToday), requiredVolume, volumeMultiple, requiredCagr,
          dexShare2036, dexShare2036Low: safeDiv(requiredVolume, dex2036Low), shareMultiple, band: bandOf(shareMultiple), conditions,
        };
      }),
    };
  });

  // Reverse view: growth scenario x multiple -> implied 2036 price.
  const implied = GROWTH_SCENARIOS.map((g) => ({
    growthKey: g.key,
    byMultiple: multiples.map((m) => {
      const v2036 = intentsRunRate !== null ? intentsRunRate * Math.pow(1 + g.cagr, HORIZON_YEARS) : null;
      const capture = v2036 !== null && takeRate ? v2036 * takeRate * buybackShare : null;
      const px = capture !== null && m.value && supply2036 ? (capture * m.value) / supply2036 : null;
      return { multipleKey: m.key, price: px, multipleOfToday: safeDiv(px, price) };
    }),
  }));
  const base = implied.find((r) => r.growthKey === 'base')!;
  const pricesAcrossM = base.byMultiple.filter((x) => x.multipleKey !== 'solana').map((x) => x.price).filter((x): x is number => x !== null && x > 0);
  const todayCol = implied.map((r) => r.byMultiple.find((x) => x.multipleKey === 'today')?.price ?? null).filter((x): x is number => x !== null && x > 0);
  const acrossMultiples = pricesAcrossM.length > 1 ? Math.max(...pricesAcrossM) / Math.min(...pricesAcrossM) : null;
  const acrossGrowth = todayCol.length > 1 ? Math.max(...todayCol) / Math.min(...todayCol) : null;
  const swing = { acrossMultiples, acrossGrowth, dominant: acrossMultiples !== null && acrossGrowth !== null ? (acrossMultiples >= acrossGrowth ? 'valuation' as const : 'growth' as const) : null };

  // Checkpoints: Intents volume needed each year at today's premium, for every rung.
  const startYear = ivEnd ? Number(ivEnd.slice(0, 4)) + 1 : null;
  const checkpoints = rungs.map((r) => {
    const t = r.byMultiple.find((b) => b.multipleKey === 'today')!;
    const years = startYear !== null && t.requiredCagr !== null && intentsRunRate !== null
      ? Array.from({ length: HORIZON_YEARS }, (_, i) => ({ year: startYear + i, volume: intentsRunRate * Math.pow(1 + t.requiredCagr!, i + 1) }))
      : [];
    return { price: r.price, multipleKey: 'today', years };
  });

  // Headline, generated from the numbers (never written by an AI).
  const bandText = (k: string | null) => ({ holds: 'keep about today\'s share of DEX volume', gains: 'win up to 5x today\'s share of DEX volume', dominant: 'win 5x to 10x today\'s share of DEX volume', beyond: 'win more than 10x today\'s share of DEX volume' } as Record<string, string>)[k ?? ''] ?? 'reach an unknown share';
  const at = (p: number, key: string) => rungs.find((r) => r.price === p)?.byMultiple.find((b) => b.multipleKey === key) ?? null;
  const t25 = at(25, 'today'), t100 = at(100, 'today'), c100 = at(100, 'tron');
  const headline = [
    `At today's valuation premium, $25 in ten years needs NEAR Intents to ${bandText(t25?.band ?? null)}; $100 needs ${fmtPct(t100?.dexShare2036 ?? null)} of all DEX volume (${fmtX(t100?.shareMultiple ?? null)} today's share).`,
    `If NEAR is priced like a cash-flow token instead, $100 needs ${fmtPct(c100?.dexShare2036 ?? null)}.`,
    swing.dominant === 'valuation' ? 'How the market values NEAR moves the answer more than how fast Intents grows.' : swing.dominant === 'growth' ? 'How fast Intents grows moves the answer more than how the market values NEAR.' : '',
  ].filter(Boolean).join(' ');

  return {
    version: LADDER_VERSION,
    asOf: ivEnd,
    inputs: { price, marketCap, circulating, supply2036, supply2036Hsp029, captureToday, takeRate, buybackShare, intentsRunRate, intents365, intentsYoY, dex365, dexShareToday, dex2036Base, dexCagr2021to2025, totalCryptoCap },
    multiples, peers, platform, platformRequirement, rungs, implied, checkpoints, swing, headline,
  };
}

const multLabel = (l: LadderResult, key: string) => l.multiples.find((m) => m.key === key)?.label ?? key;

/** Evidence items for the ladder, so debates and the report can cite every rung by ID. */
export function ladderEvidence(l: LadderResult, fetched: (key: string) => { at: string | null; hash: string | null; url: string }): EvidenceDraft[] {
  const out: EvidenceDraft[] = [];
  const item = (o: Partial<EvidenceDraft> & Pick<EvidenceDraft, 'evidenceId' | 'metricKey' | 'label' | 'unit' | 'methodology' | 'transform'>): void => {
    const value = o.value ?? null;
    out.push({
      group: 'valuation', valueText: null, observationType: 'DERIVED', sourceName: 'Computed here', sourceUrl: '/methodology#ladder', observedAt: null, fetchedAt: null,
      periodStart: null, periodEnd: l.asOf, confidence: 'medium', rawResponseHash: null, validationNotes: null, series: null, inputs: [], ...o,
      value: value !== null && Number.isFinite(value) ? value : null, available: value !== null && Number.isFinite(value),
    });
  };
  const dexMeta = fetched('defillama.dexs.total');
  item({ evidenceId: 'LAD-DEX-VOL-365D', metricKey: 'ladder.dex_volume_365d', label: 'All DEX volume, last 365 days (DefiLlama)', unit: 'USD', value: l.inputs.dex365, observationType: 'OBSERVED',
    sourceName: 'DefiLlama', sourceUrl: 'https://defillama.com/dexs', fetchedAt: dexMeta.at, rawResponseHash: dexMeta.hash,
    methodology: 'Sum of DefiLlama\'s total DEX volume over the last 365 complete days. Includes some prediction-market venues DefiLlama lists as DEXs.', transform: 'sum(daily volume)' });
  item({ evidenceId: 'LAD-INTENTS-DEX-SHARE', metricKey: 'ladder.intents_dex_share', label: 'NEAR Intents share of all DEX volume, last 365 days', unit: 'fraction', value: l.inputs.dexShareToday,
    inputs: ['LAD-DEX-VOL-365D'], methodology: 'NEAR Intents volume over the same 365 days divided by all DEX volume.', transform: 'Intents 365d volume / LAD-DEX-VOL-365D' });
  item({ evidenceId: 'LAD-INTENTS-YOY', metricKey: 'ladder.intents_yoy', label: 'NEAR Intents volume, latest 30 days vs the same 30 days a year earlier', unit: 'fraction', value: l.inputs.intentsYoY,
    sourceName: 'DefiLlama', methodology: 'Momentum today. It is observed; it is not assumed to continue.', transform: 'last 30d / same 30d a year earlier - 1' });
  item({ evidenceId: 'LAD-DEX-CAGR-2021-2025', metricKey: 'ladder.dex_cagr_2021_2025', label: 'All DEX volume, compound annual growth 2021 to 2025', unit: 'fraction', value: l.inputs.dexCagr2021to2025,
    inputs: ['LAD-DEX-VOL-365D'], methodology: 'Calendar-year DEX volume, 2025 versus 2021, annualized over four years.', transform: '(2025 / 2021)^(1/4) - 1' });
  item({ evidenceId: 'LAD-SUPPLY-2036', metricKey: 'ladder.supply_2036', label: 'NEAR supply in ten years at the current 2.5% maximum issuance', unit: 'NEAR', value: l.inputs.supply2036,
    inputs: ['MKT-NEAR-CIRC'], methodology: SUPPLY_RULES.cap25.note, transform: 'circulating x 1.025^10, monthly compounding' });
  item({ evidenceId: 'LAD-SUPPLY-2036-HSP029', metricKey: 'ladder.supply_2036_hsp029', label: 'NEAR supply in ten years if HSP-029 takes effect', unit: 'NEAR', value: l.inputs.supply2036Hsp029,
    inputs: ['MKT-NEAR-CIRC'], methodology: SUPPLY_RULES.hsp029.note, transform: '2.5% for ~3 months, linear to 1.6% over 24 months, then 1.6%' });
  for (const m of l.multiples) {
    item({ evidenceId: `LAD-MULT-${m.key.toUpperCase()}`, metricKey: `ladder.multiple.${m.key}`, label: `Valuation multiple: ${m.label} (market cap / holder revenue)`, unit: 'ratio', value: m.value,
      sourceName: m.key === 'today' ? 'Computed here' : 'CoinGecko and DefiLlama', methodology: `${m.source}. Used as an assumption for 2036, not a forecast.`, transform: 'market cap / annual holder revenue' });
  }
  for (const r of l.rungs) {
    const P = `LAD-${r.price}`;
    item({ evidenceId: `${P}-MCAP`, metricKey: `ladder.${r.price}.market_cap`, label: `Market cap at $${r.price} in ten years (2.5% issuance)`, unit: 'USD', value: r.marketCap,
      inputs: ['LAD-SUPPLY-2036'], methodology: 'Price x projected supply.', transform: `LAD-SUPPLY-2036 x ${r.price}` });
    item({ evidenceId: `${P}-RANK`, metricKey: `ladder.${r.price}.rank`, label: `$${r.price}: rank among today's crypto assets at that market cap (stablecoins excluded)`, unit: 'count', value: r.rankToday,
      inputs: [`${P}-MCAP`], sourceName: 'CoinGecko', methodology: 'Position against today\'s largest 40 assets by market cap; stablecoins and wrapped or tokenized assets excluded.', transform: 'count of larger assets + 1' });
    for (const b of r.byMultiple) {
      const K = b.multipleKey.toUpperCase();
      item({ evidenceId: `${P}-${K}-VOLUME`, metricKey: `ladder.${r.price}.${b.multipleKey}.volume`, label: `$${r.price}: Intents annual volume needed (${multLabel(l, b.multipleKey)})`, unit: 'USD', value: b.requiredVolume,
        inputs: [`${P}-MCAP`, `LAD-MULT-${K}`, 'INT-TAKE-RATE', 'INT-BUYBACK-SHARE'], methodology: 'Market cap / multiple = holder revenue needed; divided by today\'s take rate and buyback share.', transform: 'MCAP / multiple / (take rate x buyback share)' });
      item({ evidenceId: `${P}-${K}-DEX-SHARE`, metricKey: `ladder.${r.price}.${b.multipleKey}.dex_share`, label: `$${r.price}: share of the 2036 DEX market Intents would need (${multLabel(l, b.multipleKey)})`, unit: 'fraction', value: b.dexShare2036,
        inputs: [`${P}-${K}-VOLUME`, 'LAD-DEX-VOL-365D'], methodology: `Required volume / DEX market grown ${DEX_GROWTH.base * 100}% a year for ten years (assumption).`, transform: 'volume / (LAD-DEX-VOL-365D x 1.2^10)' });
      item({ evidenceId: `${P}-${K}-CAGR`, metricKey: `ladder.${r.price}.${b.multipleKey}.cagr`, label: `$${r.price}: Intents growth needed every year for ten years (${multLabel(l, b.multipleKey)})`, unit: 'fraction', value: b.requiredCagr,
        inputs: [`${P}-${K}-VOLUME`, 'INT-VOL-ANN'], methodology: 'Required volume / today\'s run rate, annualized over ten years.', transform: '(volume / INT-VOL-ANN)^(1/10) - 1' });
    }
  }
  for (const g of l.implied) for (const b of g.byMultiple) {
    item({ evidenceId: `LAD-IMPLIED-${g.growthKey.toUpperCase()}-${b.multipleKey.toUpperCase()}`, metricKey: `ladder.implied.${g.growthKey}.${b.multipleKey}`, label: `Implied 2036 price: ${g.growthKey} growth, ${multLabel(l, b.multipleKey)}`, unit: 'USD', value: b.price,
      inputs: ['INT-VOL-ANN', 'INT-TAKE-RATE', 'LAD-SUPPLY-2036', `LAD-MULT-${b.multipleKey.toUpperCase()}`], methodology: `${GROWTH_SCENARIOS.find((s) => s.key === g.growthKey)?.note} Scenario, not a forecast.`, transform: 'run rate x (1+g)^10 x take rate x multiple / supply 2036' });
  }
  return out;
}
