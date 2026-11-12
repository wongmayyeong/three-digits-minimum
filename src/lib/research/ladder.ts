/**
 * "Three digits, minimum?" The price ladder.
 *
 * Two valuation frameworks, never added together (research/three-digits/SCOPE.md, section 5):
 * - Cash-flow framework (5A): market cap / value reaching holders (burns + revenue designated for buybacks),
 *   benchmarked against cash-flow tokens on exactly the same basis. Each NEAR channel is projected with its
 *   own driver: Intents buybacks from Intents volume, burns from L1 gas.
 * - Platform framework (5B): market cap relative to the economy on the chain (stablecoins, DeFi TVL),
 *   benchmarked against platforms. It says what NEAR would need on chain, not what revenue it would need.
 *
 * Comparability (amendment 6): every revenue and volume window ends on the same day (the last complete day
 * common to all series), uses the same DefiLlama metric definition for every asset, and run rates are only
 * compared with run rates. The DEX denominator is DefiLlama's spot DEX category only.
 *
 * Layer B labels every condition OBSERVED, ASSUMED or UNPROVEN. Deterministic: no AI writes any number.
 */
import type { RawRecord } from '@/lib/data/fetcher';
import { DEX_CROSS_CHAIN_CATEGORIES, DEX_SPOT_CATEGORY, PLATFORM_CHAINS, VALUATION_PEERS } from '@/lib/data/sources';
import { commonEnd, fromUnixPairs, safeDiv, windowAggregate, type DailyPoint } from './series';
import type { EvidenceDraft } from './types';

export const LADDER_VERSION = 'three-digits-2.0.0';
export const RUNGS = [10, 25, 50, 100] as const;
export const HORIZON_YEARS = 10;
/** Comparison windows (complete days ending on the common end date). The run rate is the primary basis. */
export const RUN_RATE_DAYS = 90;
export const TRAILING_DAYS = 365;
/** Buybacks of NEAR with Intents revenue began on this date (DefiLlama methodology note, NEAR announcements). */
export const BUYBACKS_START = '2026-02-23';
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
/** Spot DEX market growth to 2036 (assumption); base also anchors the share calculation. */
export const DEX_GROWTH = { low: 0.10, base: 0.20 } as const;
/** L1 burns are held at today's run rate in the cash-flow framework (assumption; NEAR L1 fees are a small channel). */
export const BURN_GROWTH = 0;
/** Spreads within this ratio of each other are reported as similar. */
export const SWING_SIMILAR = 1.25;
/** Today's Intents-to-spot-DEX volume ratio multiplied by this or less counts as "keeps today's share". */
export const SHARE_BANDS = [
  { key: 'holds', max: 1.5, label: 'Keeps about today\'s size relative to spot DEX volume' },
  { key: 'gains', max: 5, label: 'Grows up to 5x relative to spot DEX volume' },
  { key: 'dominant', max: 10, label: 'Grows 5x to 10x relative to spot DEX volume' },
  { key: 'beyond', max: Infinity, label: 'Needs more than 10x its size relative to spot DEX volume' },
] as const;

export type Status = 'OBSERVED' | 'ASSUMED' | 'UNPROVEN';
export interface Condition { text: string; status: Status; detail: string }
/** Cash-flow multiples only. Platform benchmarks live in the platform framework. */
export interface MultipleDef { key: string; label: string; regime: 'cash-flow' | 'today'; value: number | null; value365: number | null; source: string }
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
    burnContribution: number | null;
    requiredIntentsCapture: number | null;
    requiredVolume: number | null;
    volumeMultiple: number | null;
    requiredCagr: number | null;
    dexShare2036: number | null;
    dexShare2036Low: number | null;
    shareMultiple: number | null;
    band: (typeof SHARE_BANDS)[number]['key'] | null;
    conditions: Condition[];
  }[];
  /** Platform framework: the on-chain economy this rung's market cap implies at each platform's ratios. */
  platform: { benchmark: string; stablecoins: number | null; stablecoinsMultiple: number | null; tvl: number | null; tvlMultiple: number | null }[];
}
export interface PeerRow {
  label: string; regime: string; marketCap: number | null;
  holdersRevenueRunRate: number | null; holdersRevenue365: number | null; multiple: number | null; multiple365: number | null;
}
export interface LadderResult {
  version: string;
  asOf: string | null;
  basis: { windowEnd: string | null; runRateDays: number; trailingDays: number; metric: string; buybacksStart: string; trailingNote: string };
  inputs: {
    price: number | null; marketCap: number | null; circulating: number | null; supply2036: number | null; supply2036Hsp029: number | null;
    /** NEAR value reaching holders, run rate: burns + revenue designated for Intents buybacks. */
    captureToday: number | null; capture365: number | null; burnRunRate: number | null; intentsHolderRunRate: number | null;
    /** NEAR-captured revenue per dollar of volume, and the share of it designated for buybacks (same window). */
    takeRate: number | null; buybackShare: number | null; holderTakeRate: number | null;
    intentsRunRate: number | null; intents365: number | null; intentsYoY: number | null;
    spotDexRunRate: number | null; spotDex365: number | null; allDexRunRate: number | null;
    dexShareToday: number | null; dexShareToday365: number | null; crossChainShareToday: number | null; crossChainMembers: string[];
    dex2036Base: number | null; dexCagr2021to2025: number | null; totalCryptoCap: number | null;
  };
  multiples: MultipleDef[];
  peers: PeerRow[];
  platform: { chain: string; marketCap: number | null; stablecoins: number | null; tvl: number | null; capToStablecoins: number | null; capToTvl: number | null }[];
  /** Platform requirement at $100 (kept for summaries; every rung carries its own in `rungs[].platform`). */
  platformRequirement: RungResult['platform'];
  rungs: RungResult[];
  implied: { growthKey: string; byMultiple: { multipleKey: string; price: number | null; multipleOfToday: number | null }[] }[];
  checkpoints: { price: number; multipleKey: string; years: { year: number; volume: number }[] }[];
  swing: { acrossMultiples: number | null; acrossGrowth: number | null; dominant: 'valuation' | 'growth' | 'similar' | null; sentence: string };
  /** Series left out of a comparison and why (amendment 6: exclusions are shown). */
  exclusions: string[];
  headline: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
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
const fmtUsd = (v: number | null) => (v === null ? 'n/a' : v >= 1e12 ? `$${(v / 1e12).toFixed(2)}T` : v >= 1e9 ? `$${(v / 1e9).toFixed(1)}B` : `$${(v / 1e6).toFixed(1)}M`);
const fmtPct = (v: number | null, d = 1) => (v === null ? 'n/a' : `${(v * 100).toFixed(d)}%`);
const fmtX = (v: number | null) => (v === null ? 'n/a' : v >= 10 ? `${v.toFixed(0)}x` : `${v.toFixed(1)}x`);
const annual = (sum: number | null, days: number) => (sum === null ? null : (sum * 365) / days);

export function analyzeLadder(raws: Record<string, RawRecord | null | undefined>, ev: (id: string) => number | null): LadderResult {
  const body = (k: string) => raws[k]?.body as any;
  const series = (k: string) => fromUnixPairs(body(k)?.chart);
  const top: any[] = Array.isArray(body('coingecko.top')) ? body('coingecko.top') : [];
  const totalCryptoCap = Number.isFinite(body('coingecko.global')?.totalMarketCapUsd) ? body('coingecko.global').totalMarketCapUsd as number : null;
  const price = ev('MKT-NEAR-PRICE');
  const marketCap = ev('MKT-NEAR-MCAP');
  const circulating = ev('MKT-NEAR-CIRC') ?? safeDiv(marketCap, price);
  const exclusions: string[] = [];

  // ---- Series, all daily, DefiLlama.
  const iVol = series('defillama.intents.volume');
  const iRev = series('defillama.intents.dailyRevenue');
  const iHold = series('defillama.intents.dailyHoldersRevenue');
  const burn = series('defillama.revenue.near'); // identical to NEAR's holders revenue: the 70% of gas that is burned
  const catRows: [string, Record<string, number>][] = (Array.isArray(body('defillama.dexs.categories')?.chart) ? body('defillama.dexs.categories').chart : [])
    .filter((r: any) => Array.isArray(r) && Number.isFinite(Number(r[0])))
    .map((r: any) => [new Date(Number(r[0]) * 1000).toISOString().slice(0, 10), r[1] ?? {}] as [string, Record<string, number>])
    .sort((a: any, b: any) => a[0].localeCompare(b[0]));
  const catSeries = (cats: string[]): DailyPoint[] => catRows.map(([d, o]) => [d, cats.reduce((a, c) => a + (Number(o[c]) || 0), 0)]);
  const spot = catSeries([DEX_SPOT_CATEGORY]);
  const crossChain = catSeries(DEX_CROSS_CHAIN_CATEGORIES);
  const allDex = catRows.map(([d, o]) => [d, Object.values(o).reduce((a, v) => a + (Number(v) || 0), 0)] as DailyPoint);
  const peerSeries = VALUATION_PEERS.map((p) => ({ p, pts: series(`defillama.holders.${p.llama}`) }));

  // ---- One end date for every comparison: the last complete day common to all series.
  const END = commonEnd([iVol, iRev, iHold, burn, spot, ...peerSeries.map((x) => x.pts)], 1);
  const win = (pts: DailyPoint[], days: number) => (END ? windowAggregate(pts, END, days).sum : null);
  const rr = (pts: DailyPoint[]) => annual(win(pts, RUN_RATE_DAYS), RUN_RATE_DAYS);

  const intentsRunRate = rr(iVol);
  const intents365 = win(iVol, TRAILING_DAYS);
  const vol90 = win(iVol, RUN_RATE_DAYS);
  const takeRate = safeDiv(win(iRev, RUN_RATE_DAYS), vol90);
  const buybackShare = safeDiv(win(iHold, RUN_RATE_DAYS), win(iRev, RUN_RATE_DAYS));
  const holderTakeRate = safeDiv(win(iHold, RUN_RATE_DAYS), vol90);
  const burnRunRate = rr(burn);
  const intentsHolderRunRate = rr(iHold);
  const captureToday = burnRunRate !== null && intentsHolderRunRate !== null ? burnRunRate + intentsHolderRunRate : null;
  const b365 = win(burn, TRAILING_DAYS), h365 = win(iHold, TRAILING_DAYS);
  const capture365 = b365 !== null && h365 !== null ? b365 + h365 : null;

  // Year-over-year momentum: latest 30 days vs the same 30 days a year earlier (same adapter).
  const last30 = win(iVol, 30);
  const yearAgo = END ? new Date(Date.parse(`${END}T00:00:00Z`) - 365 * 86_400_000).toISOString().slice(0, 10) : null;
  const prior30 = yearAgo ? windowAggregate(iVol, yearAgo, 30).sum : null;
  const intentsYoY = last30 !== null && prior30 ? last30 / prior30 - 1 : null;

  // ---- DEX denominators, same end date. Spot DEX category only; cross-chain category shown separately.
  const spotDexRunRate = rr(spot);
  const spotDex365 = win(spot, TRAILING_DAYS);
  const allDexRunRate = rr(allDex);
  const dexShareToday = safeDiv(intentsRunRate, spotDexRunRate);
  const dexShareToday365 = safeDiv(intents365, spotDex365);
  const crossChainShareToday = safeDiv(intentsRunRate, rr(crossChain));
  const crossChainMembers: string[] = Array.isArray(body('defillama.dexs.categories')?.crossChainMembers) ? body('defillama.dexs.categories').crossChainMembers : [];
  const yearSum = (y: string) => spot.filter(([d]) => d.startsWith(y)).reduce((a, [, v]) => a + v, 0);
  const d21 = yearSum('2021'), d25 = yearSum('2025');
  const dexCagr2021to2025 = d21 > 0 && d25 > 0 ? Math.pow(d25 / d21, 1 / 4) - 1 : null;
  const dex2036Base = spotDexRunRate !== null ? spotDexRunRate * Math.pow(1 + DEX_GROWTH.base, HORIZON_YEARS) : null;
  const dex2036Low = spotDexRunRate !== null ? spotDexRunRate * Math.pow(1 + DEX_GROWTH.low, HORIZON_YEARS) : null;
  if (!catRows.length) exclusions.push('Spot DEX category breakdown unavailable: DEX shares not computed.');

  // ---- Peers: market cap / holders revenue, same DefiLlama metric, same window end, run rate and trailing year.
  const coinCap = (id: string) => { const c = top.find((x) => x.id === id); return c && Number.isFinite(c.marketCap) ? (c.marketCap as number) : null; };
  const peers: PeerRow[] = peerSeries.map(({ p, pts }) => {
    const cap = coinCap(p.coin);
    const runRate = rr(pts);
    const t365 = win(pts, TRAILING_DAYS);
    if (END && runRate === null) exclusions.push(`${p.label}: holders revenue does not cover the ${RUN_RATE_DAYS} days ending ${END}; multiple not computed.`);
    if (END && t365 === null) exclusions.push(`${p.label}: holders revenue does not cover the ${TRAILING_DAYS} days ending ${END}; trailing-year multiple not computed.`);
    return { label: p.label, regime: p.regime, marketCap: cap, holdersRevenueRunRate: runRate, holdersRevenue365: t365, multiple: runRate ? safeDiv(cap, runRate) : null, multiple365: t365 ? safeDiv(cap, t365) : null };
  });
  const peer = (label: string) => peers.find((p) => p.label === label);
  const multiples: MultipleDef[] = [
    { key: 'hyperliquid', label: 'Priced like Hyperliquid', regime: 'cash-flow', value: peer('Hyperliquid')?.multiple ?? null, value365: peer('Hyperliquid')?.multiple365 ?? null, source: `Hyperliquid market cap / holders revenue, ${RUN_RATE_DAYS}-day run rate` },
    { key: 'tron', label: 'Priced like Tron', regime: 'cash-flow', value: peer('Tron')?.multiple ?? null, value365: peer('Tron')?.multiple365 ?? null, source: `Tron market cap / holders revenue (TRX burned), ${RUN_RATE_DAYS}-day run rate` },
    { key: 'today', label: 'NEAR\'s multiple today', regime: 'today', value: safeDiv(marketCap, captureToday), value365: safeDiv(marketCap, capture365), source: `NEAR market cap / (gas burned + Intents revenue designated for buybacks), ${RUN_RATE_DAYS}-day run rate` },
  ];
  if (END && END >= BUYBACKS_START) {
    const t0 = new Date(Date.parse(`${END}T00:00:00Z`) - (TRAILING_DAYS - 1) * 86_400_000).toISOString().slice(0, 10);
    if (t0 < BUYBACKS_START) exclusions.push(`NEAR's trailing-year multiple is shown but not used: its ${TRAILING_DAYS}-day window starts ${t0}, before Intents buybacks began on ${BUYBACKS_START}, so it mixes two mechanisms.`);
  }

  // ---- Platform framework: market cap relative to the economy on the chain.
  const chains: any[] = Array.isArray(body('defillama.chains')) ? body('defillama.chains') : [];
  const stables: any[] = Array.isArray(body('defillama.stablecoinchains')) ? body('defillama.stablecoinchains') : [];
  const chainCap: Record<string, number | null> = { Ethereum: coinCap('ethereum'), BSC: coinCap('binancecoin'), Solana: coinCap('solana'), Tron: coinCap('tron'), Near: marketCap };
  const platform = PLATFORM_CHAINS.map((name) => {
    const tvl = chains.find((c) => c.name === name)?.tvl ?? null;
    const st = stables.find((c) => c.name === name)?.stablecoinsUsd ?? null;
    const cap = chainCap[name] ?? null;
    return { chain: name, marketCap: cap, stablecoins: Number.isFinite(st) ? st : null, tvl: Number.isFinite(tvl) ? tvl : null, capToStablecoins: safeDiv(cap, st), capToTvl: safeDiv(cap, tvl) };
  });
  const nearPlat = platform.find((p) => p.chain === 'Near');
  const supply2036 = circulating !== null ? supplyPath(circulating, 'cap25') : null;
  const supply2036Hsp029 = circulating !== null ? supplyPath(circulating, 'hsp029') : null;
  const platformFor = (cap: number | null): RungResult['platform'] => platform.filter((p) => p.chain !== 'Near').map((p) => {
    const st = p.capToStablecoins && cap !== null ? cap / p.capToStablecoins : null;
    const tv = p.capToTvl && cap !== null ? cap / p.capToTvl : null;
    return { benchmark: p.chain, stablecoins: st, stablecoinsMultiple: safeDiv(st, nearPlat?.stablecoins ?? null), tvl: tv, tvlMultiple: safeDiv(tv, nearPlat?.tvl ?? null) };
  });

  // Ranking: assets other than stablecoins, wrapped and tokenized assets.
  const EXCLUDE = /usd|dai|eur|wrapped|staked|bridged|tether gold|pax gold|figure|heloc|wbt|leo token/i;
  const ranked = top.filter((c) => !EXCLUDE.test(`${c.symbol} ${c.name}`)).map((c) => c.marketCap as number).filter(Number.isFinite);
  const burn2036 = burnRunRate !== null ? burnRunRate * Math.pow(1 + BURN_GROWTH, HORIZON_YEARS) : null;

  const rungs: RungResult[] = RUNGS.map((p) => {
    const cap = supply2036 !== null ? supply2036 * p : null;
    return {
      price: p,
      priceMultiple: safeDiv(p, price),
      marketCap: cap,
      marketCapHsp029: supply2036Hsp029 !== null ? supply2036Hsp029 * p : null,
      rankToday: cap !== null && ranked.length ? ranked.filter((c) => c > cap).length + 1 : null,
      shareOfCryptoToday: safeDiv(cap, totalCryptoCap),
      platform: platformFor(cap),
      byMultiple: multiples.map((m) => {
        const requiredCapture = cap !== null && m.value ? cap / m.value : null;
        // Each channel with its own driver: burns held at today's run rate, the rest must come from Intents buybacks.
        const requiredIntentsCapture = requiredCapture !== null && burn2036 !== null ? Math.max(0, requiredCapture - burn2036) : null;
        const requiredVolume = requiredIntentsCapture !== null && holderTakeRate ? requiredIntentsCapture / holderTakeRate : null;
        const volumeMultiple = safeDiv(requiredVolume, intentsRunRate);
        const requiredCagr = volumeMultiple !== null && volumeMultiple > 0 ? Math.pow(volumeMultiple, 1 / HORIZON_YEARS) - 1 : null;
        const dexShare2036 = safeDiv(requiredVolume, dex2036Base);
        const shareMultiple = safeDiv(dexShare2036, dexShareToday);
        const conditions: Condition[] = [
          { text: `$NEAR holders receive ${fmtUsd(captureToday)} a year today: ${fmtUsd(burnRunRate)} of gas burned plus ${fmtUsd(intentsHolderRunRate)} of Intents revenue designated for buybacks`, status: 'OBSERVED', detail: `DefiLlama holders revenue, ${RUN_RATE_DAYS}-day run rate ending ${END ?? 'n/a'}. Designated buybacks are a classification; executed onchain purchases are reconstructed separately.` },
          { text: `The market values that flow at ${fmtX(m.value)} in 2036 (${m.label})`, status: 'ASSUMED', detail: `${m.source}. Multiples move with sentiment; ${m.key === 'today' ? 'this is NEAR\'s own multiple today, assumed to persist' : 'this is another token\'s multiple today on the same basis, applied to NEAR'}.` },
          { text: `Value reaching holders grows to ${fmtUsd(requiredCapture)} a year (${fmtX(safeDiv(requiredCapture, captureToday))} today)`, status: 'UNPROVEN', detail: `Burns are held at today's run rate (${fmtUsd(burn2036)}); the remaining ${fmtUsd(requiredIntentsCapture)} must come from Intents buybacks.` },
          { text: `Intents volume reaches ${fmtUsd(requiredVolume)} a year, ${fmtPct(requiredCagr, 0)} growth a year for ten years`, status: 'UNPROVEN', detail: `Today: ${fmtUsd(intentsRunRate)} run rate; ${fmtPct(intentsYoY, 0)} year over year (latest 30 days vs a year earlier). Momentum is observed; ten years of it is not.` },
          { text: `Intents volume equals ${fmtPct(dexShare2036)} of spot DEX volume in 2036 (today ${fmtPct(dexShareToday, 2)})`, status: 'UNPROVEN', detail: `Spot DEX volume (DefiLlama "Dexs" category) grown ${DEX_GROWTH.base * 100}% a year to ${fmtUsd(dex2036Base)}; 2021 to 2025 it grew ${fmtPct(dexCagr2021to2025, 0)} a year. A scale reference: Intents is a cross-chain category, not a DEX.` },
          { text: `NEAR keeps ${fmtPct(holderTakeRate, 3)} of every dollar of volume for buybacks`, status: 'ASSUMED', detail: `Intents holders revenue / volume, same ${RUN_RATE_DAYS} days. Fee competition halving it doubles every volume requirement.` },
        ];
        return {
          multipleKey: m.key, requiredCapture, captureMultiple: safeDiv(requiredCapture, captureToday), burnContribution: burn2036, requiredIntentsCapture, requiredVolume, volumeMultiple, requiredCagr,
          dexShare2036, dexShare2036Low: safeDiv(requiredVolume, dex2036Low), shareMultiple, band: bandOf(shareMultiple), conditions,
        };
      }),
    };
  });

  // ---- Reverse view (cash-flow framework only): growth scenario x multiple -> implied 2036 price.
  const implied = GROWTH_SCENARIOS.map((g) => ({
    growthKey: g.key,
    byMultiple: multiples.map((m) => {
      const v2036 = intentsRunRate !== null ? intentsRunRate * Math.pow(1 + g.cagr, HORIZON_YEARS) : null;
      const capture = v2036 !== null && holderTakeRate !== null && burn2036 !== null ? v2036 * holderTakeRate + burn2036 : null;
      const px = capture !== null && m.value && supply2036 ? (capture * m.value) / supply2036 : null;
      return { multipleKey: m.key, price: px, multipleOfToday: safeDiv(px, price) };
    }),
  }));
  const base = implied.find((r) => r.growthKey === 'base')!;
  const pricesAcrossM = base.byMultiple.map((x) => x.price).filter((x): x is number => x !== null && x > 0);
  const todayCol = implied.map((r) => r.byMultiple.find((x) => x.multipleKey === 'today')?.price ?? null).filter((x): x is number => x !== null && x > 0);
  const acrossMultiples = pricesAcrossM.length > 1 ? Math.max(...pricesAcrossM) / Math.min(...pricesAcrossM) : null;
  const acrossGrowth = todayCol.length > 1 ? Math.max(...todayCol) / Math.min(...todayCol) : null;
  // Within 25% of each other counts as similar: neither factor is called dominant on a hair.
  const dominant = acrossMultiples === null || acrossGrowth === null ? null
    : Math.max(acrossMultiples, acrossGrowth) / Math.min(acrossMultiples, acrossGrowth) < SWING_SIMILAR ? 'similar' as const
    : acrossMultiples > acrossGrowth ? 'valuation' as const : 'growth' as const;
  const spread = `prices spread ${fmtX(acrossGrowth)} across growth scenarios at NEAR's own multiple, and ${fmtX(acrossMultiples)} across the cash-flow multiples at base growth`;
  const sentence = dominant === 'similar' ? `How fast Intents grows and how the market values NEAR matter about equally: ${spread}.`
    : dominant === 'growth' ? `How fast Intents grows moves the answer more than how the market values NEAR: ${spread}.`
    : dominant === 'valuation' ? `How the market values NEAR moves the answer more than how fast Intents grows: ${spread}.` : '';
  const swing = { acrossMultiples, acrossGrowth, dominant, sentence };

  // ---- Checkpoints: Intents volume needed each year at NEAR's own multiple, for every rung.
  const startYear = END ? Number(END.slice(0, 4)) + 1 : null;
  const checkpoints = rungs.map((r) => {
    const t = r.byMultiple.find((b) => b.multipleKey === 'today')!;
    const years = startYear !== null && t.requiredCagr !== null && intentsRunRate !== null
      ? Array.from({ length: HORIZON_YEARS }, (_, i) => ({ year: startYear + i, volume: intentsRunRate * Math.pow(1 + t.requiredCagr!, i + 1) }))
      : [];
    return { price: r.price, multipleKey: 'today', years };
  });

  // ---- Headline, generated from the numbers (never written by an AI).
  const bandText = (k: string | null) => ({ holds: 'keep about its size relative to spot DEX volume', gains: 'grow up to 5x relative to spot DEX volume', dominant: 'grow 5x to 10x relative to spot DEX volume', beyond: 'grow more than 10x relative to spot DEX volume' } as Record<string, string>)[k ?? ''] ?? 'reach an unknown size';
  const at = (p: number, key: string) => rungs.find((r) => r.price === p)?.byMultiple.find((b) => b.multipleKey === key) ?? null;
  const t25 = at(25, 'today'), t100 = at(100, 'today'), c100 = at(100, 'tron');
  const headline = [
    `At NEAR's own valuation multiple today, $25 in ten years needs NEAR Intents to ${bandText(t25?.band ?? null)}; $100 needs Intents volume equal to ${fmtPct(t100?.dexShare2036 ?? null)} of spot DEX volume (${fmtX(t100?.shareMultiple ?? null)} today's ratio).`,
    `Priced like Tron, a cash-flow token, $100 needs ${fmtPct(c100?.dexShare2036 ?? null)}.`,
    swing.dominant === 'similar' ? 'Intents growth and the valuation multiple matter about equally.' : swing.dominant === 'valuation' ? 'How the market values NEAR moves the answer more than how fast Intents grows.' : swing.dominant === 'growth' ? 'How fast Intents grows moves the answer more than how the market values NEAR.' : '',
  ].filter(Boolean).join(' ');

  return {
    version: LADDER_VERSION,
    asOf: END,
    basis: {
      windowEnd: END, runRateDays: RUN_RATE_DAYS, trailingDays: TRAILING_DAYS, buybacksStart: BUYBACKS_START,
      metric: 'DefiLlama holders revenue (burns and buybacks) for every asset; market caps from CoinGecko at fetch time',
      trailingNote: `The ${RUN_RATE_DAYS}-day run rate is the primary basis because NEAR's buyback mechanism started on ${BUYBACKS_START}; trailing-year multiples are shown for every asset as a check.`,
    },
    inputs: {
      price, marketCap, circulating, supply2036, supply2036Hsp029, captureToday, capture365, burnRunRate, intentsHolderRunRate,
      takeRate, buybackShare, holderTakeRate, intentsRunRate, intents365, intentsYoY, spotDexRunRate, spotDex365, allDexRunRate,
      dexShareToday, dexShareToday365, crossChainShareToday, crossChainMembers, dex2036Base, dexCagr2021to2025, totalCryptoCap,
    },
    multiples, peers, platform, platformRequirement: rungs.find((r) => r.price === 100)?.platform ?? [], rungs, implied, checkpoints, swing, exclusions, headline,
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
  const R = l.basis.runRateDays;
  const cat = fetched('defillama.dexs.categories');
  const llama = (k: string) => ({ sourceName: 'DefiLlama', fetchedAt: fetched(k).at, rawResponseHash: fetched(k).hash, observationType: 'OBSERVED' as const });
  item({ evidenceId: 'LAD-SPOT-DEX-RUNRATE', metricKey: 'ladder.spot_dex_run_rate', label: `Spot DEX volume, ${R}-day run rate (DefiLlama "Dexs" category)`, unit: 'USD', value: l.inputs.spotDexRunRate, ...llama('defillama.dexs.categories'),
    sourceUrl: 'https://defillama.com/dexs', methodology: 'Per-protocol DefiLlama DEX volume summed per day over protocols in the "Dexs" category only. Excludes prediction markets, bridges (including NEAR Intents), launchpads and trading apps that DefiLlama also lists in its DEX overview.', transform: `sum(daily spot volume, ${R} days) x 365 / ${R}` });
  item({ evidenceId: 'LAD-SPOT-DEX-365D', metricKey: 'ladder.spot_dex_365d', label: 'Spot DEX volume, last 365 days', unit: 'USD', value: l.inputs.spotDex365, ...llama('defillama.dexs.categories'),
    sourceUrl: 'https://defillama.com/dexs', methodology: 'Same definition, trailing 365 complete days.', transform: 'sum(daily spot volume, 365 days)' });
  item({ evidenceId: 'LAD-ALL-DEX-RUNRATE', metricKey: 'ladder.all_dex_run_rate', label: `Everything in DefiLlama's DEX overview, ${R}-day run rate`, unit: 'USD', value: l.inputs.allDexRunRate, ...llama('defillama.dexs.categories'),
    sourceUrl: 'https://defillama.com/dexs', methodology: 'All categories, shown only to document the difference from the spot definition. Not used as a denominator.', transform: `sum(all categories, ${R} days) x 365 / ${R}` });
  item({ evidenceId: 'LAD-INTENTS-DEX-SHARE', metricKey: 'ladder.intents_dex_share', label: 'NEAR Intents volume relative to spot DEX volume, run rate', unit: 'fraction', value: l.inputs.dexShareToday,
    inputs: ['LAD-SPOT-DEX-RUNRATE', 'INT-VOL-ANN'], methodology: `Intents ${R}-day run rate / spot DEX ${R}-day run rate, same end date. A scale reference: Intents is a cross-chain category and some of its swaps route through DEXs.`, transform: 'Intents run rate / LAD-SPOT-DEX-RUNRATE' });
  item({ evidenceId: 'LAD-INTENTS-DEX-SHARE-365D', metricKey: 'ladder.intents_dex_share_365d', label: 'NEAR Intents volume relative to spot DEX volume, last 365 days', unit: 'fraction', value: l.inputs.dexShareToday365,
    inputs: ['LAD-SPOT-DEX-365D'], methodology: 'Trailing-year volumes, same end date.', transform: 'Intents 365d / LAD-SPOT-DEX-365D' });
  item({ evidenceId: 'LAD-INTENTS-CROSSCHAIN-SHARE', metricKey: 'ladder.intents_crosschain_share', label: 'NEAR Intents share of the cross-chain protocols in DefiLlama\'s DEX overview', unit: 'fraction', value: l.inputs.crossChainShareToday,
    inputs: ['INT-VOL-ANN'], confidence: 'low', fetchedAt: cat.at, rawResponseHash: cat.hash,
    methodology: `Denominator: DefiLlama categories ${DEX_CROSS_CHAIN_CATEGORIES.join(' and ')} in the DEX overview (${l.inputs.crossChainMembers.length} protocols). Coverage is incomplete: major cross-chain protocols are tracked elsewhere or not at all, so this overstates Intents' share of cross-chain execution.`, transform: 'Intents run rate / cross-chain category run rate' });
  item({ evidenceId: 'LAD-INTENTS-YOY', metricKey: 'ladder.intents_yoy', label: 'NEAR Intents volume, latest 30 days vs the same 30 days a year earlier', unit: 'fraction', value: l.inputs.intentsYoY,
    sourceName: 'DefiLlama', methodology: 'Momentum today. It is observed; it is not assumed to continue.', transform: 'last 30d / same 30d a year earlier - 1' });
  item({ evidenceId: 'LAD-DEX-CAGR-2021-2025', metricKey: 'ladder.dex_cagr_2021_2025', label: 'Spot DEX volume, compound annual growth 2021 to 2025', unit: 'fraction', value: l.inputs.dexCagr2021to2025,
    inputs: ['LAD-SPOT-DEX-365D'], methodology: 'Calendar-year spot DEX volume, 2025 versus 2021, annualized over four years.', transform: '(2025 / 2021)^(1/4) - 1' });
  item({ evidenceId: 'LAD-NEAR-CAPTURE-RUNRATE', metricKey: 'ladder.near_capture_run_rate', label: `NEAR value reaching holders, ${R}-day run rate (gas burned + Intents revenue designated for buybacks)`, unit: 'USD', value: l.inputs.captureToday,
    ...llama('defillama.intents.dailyHoldersRevenue'), sourceUrl: 'https://defillama.com/protocol/near-intents', inputs: ['LAD-NEAR-BURN-RUNRATE', 'LAD-INTENTS-HOLDER-RUNRATE'],
    methodology: 'DefiLlama holders revenue for the NEAR chain (70% of gas, burned) plus NEAR Intents (revenue designated for NEAR buybacks), the same metric used for every peer. Designated, not yet reconciled with executed onchain purchases.', transform: `(burn + Intents holders revenue, ${R} days) x 365 / ${R}` });
  item({ evidenceId: 'LAD-NEAR-BURN-RUNRATE', metricKey: 'ladder.near_burn_run_rate', label: `NEAR gas burned, ${R}-day run rate`, unit: 'USD', value: l.inputs.burnRunRate, ...llama('defillama.revenue.near'),
    sourceUrl: 'https://defillama.com/chain/Near', methodology: '70% of every NEAR gas fee is burned (DefiLlama revenue and holders revenue for the NEAR chain are identical).', transform: `sum ${R} days x 365 / ${R}` });
  item({ evidenceId: 'LAD-INTENTS-HOLDER-RUNRATE', metricKey: 'ladder.intents_holder_run_rate', label: `Intents revenue designated for NEAR buybacks, ${R}-day run rate`, unit: 'USD', value: l.inputs.intentsHolderRunRate, ...llama('defillama.intents.dailyHoldersRevenue'),
    sourceUrl: 'https://defillama.com/protocol/near-intents', methodology: `DefiLlama holders revenue for NEAR Intents; buybacks began ${l.basis.buybacksStart}.`, transform: `sum ${R} days x 365 / ${R}` });
  item({ evidenceId: 'LAD-NEAR-CAPTURE-365D', metricKey: 'ladder.near_capture_365d', label: 'NEAR value reaching holders, last 365 days', unit: 'USD', value: l.inputs.capture365, inputs: ['LAD-NEAR-BURN-RUNRATE', 'LAD-INTENTS-HOLDER-RUNRATE'],
    methodology: `Same channels, trailing year. ${l.basis.trailingNote}`, transform: 'sum 365 days' });
  item({ evidenceId: 'LAD-HOLDER-TAKE-RATE', metricKey: 'ladder.holder_take_rate', label: 'Intents revenue designated for buybacks per dollar of volume', unit: 'fraction', value: l.inputs.holderTakeRate, inputs: ['INT-VOL-ANN', 'LAD-INTENTS-HOLDER-RUNRATE'],
    methodology: `Intents holders revenue / Intents volume, same ${R} days. Equals take rate x buyback share on the same window.`, transform: 'holders revenue / volume' });
  item({ evidenceId: 'LAD-SUPPLY-2036', metricKey: 'ladder.supply_2036', label: 'NEAR supply in ten years at the current 2.5% maximum issuance', unit: 'NEAR', value: l.inputs.supply2036,
    inputs: ['MKT-NEAR-CIRC'], methodology: SUPPLY_RULES.cap25.note, transform: 'circulating x 1.025^10, monthly compounding' });
  item({ evidenceId: 'LAD-SUPPLY-2036-HSP029', metricKey: 'ladder.supply_2036_hsp029', label: 'NEAR supply in ten years if HSP-029 takes effect', unit: 'NEAR', value: l.inputs.supply2036Hsp029,
    inputs: ['MKT-NEAR-CIRC'], methodology: SUPPLY_RULES.hsp029.note, transform: '2.5% for ~3 months, linear to 1.6% over 24 months, then 1.6%' });
  for (const m of l.multiples) {
    item({ evidenceId: `LAD-MULT-${m.key.toUpperCase()}`, metricKey: `ladder.multiple.${m.key}`, label: `Valuation multiple: ${m.label} (market cap / holders revenue, ${R}-day run rate)`, unit: 'ratio', value: m.value,
      sourceName: m.key === 'today' ? 'Computed here' : 'CoinGecko and DefiLlama', methodology: `${m.source}. Used as an assumption for 2036, not a forecast.`, transform: 'market cap / annualized holders revenue' });
    item({ evidenceId: `LAD-MULT-${m.key.toUpperCase()}-365D`, metricKey: `ladder.multiple.${m.key}.365d`, label: `Valuation multiple: ${m.label}, trailing 365 days`, unit: 'ratio', value: m.value365,
      sourceName: m.key === 'today' ? 'Computed here' : 'CoinGecko and DefiLlama', methodology: `Check on the trailing-year basis. ${l.basis.trailingNote}`, transform: 'market cap / holders revenue over 365 days' });
  }
  for (const p of l.peers) {
    item({ evidenceId: `LAD-PEER-${p.label.toUpperCase().replace(/[^A-Z]/g, '')}-MULT`, metricKey: `ladder.peer.${p.label.toLowerCase()}`, label: `${p.label}: market cap / holders revenue, ${R}-day run rate (${p.regime})`, unit: 'ratio', value: p.multiple,
      sourceName: 'CoinGecko and DefiLlama', methodology: 'Context for the two valuation regimes. Platform tokens are valued on their on-chain economy, not on this ratio.', transform: 'market cap / annualized holders revenue' });
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
        inputs: [`${P}-MCAP`, `LAD-MULT-${K}`, 'LAD-NEAR-BURN-RUNRATE', 'LAD-HOLDER-TAKE-RATE'], methodology: 'Market cap / multiple = value to holders needed; minus burns held at today\'s run rate; divided by Intents holders revenue per dollar of volume.', transform: '(MCAP / multiple - burns) / holder take rate' });
      item({ evidenceId: `${P}-${K}-DEX-SHARE`, metricKey: `ladder.${r.price}.${b.multipleKey}.dex_share`, label: `$${r.price}: Intents volume relative to 2036 spot DEX volume (${multLabel(l, b.multipleKey)})`, unit: 'fraction', value: b.dexShare2036,
        inputs: [`${P}-${K}-VOLUME`, 'LAD-SPOT-DEX-RUNRATE'], methodology: `Required volume / spot DEX run rate grown ${DEX_GROWTH.base * 100}% a year for ten years (assumption).`, transform: 'volume / (LAD-SPOT-DEX-RUNRATE x 1.2^10)' });
      item({ evidenceId: `${P}-${K}-CAGR`, metricKey: `ladder.${r.price}.${b.multipleKey}.cagr`, label: `$${r.price}: Intents growth needed every year for ten years (${multLabel(l, b.multipleKey)})`, unit: 'fraction', value: b.requiredCagr,
        inputs: [`${P}-${K}-VOLUME`, 'INT-VOL-ANN'], methodology: 'Required volume / today\'s run rate, annualized over ten years.', transform: '(volume / run rate)^(1/10) - 1' });
    }
    for (const pl of r.platform) {
      const B = pl.benchmark.toUpperCase();
      item({ evidenceId: `${P}-PLAT-${B}-STABLES`, metricKey: `ladder.${r.price}.platform.${pl.benchmark.toLowerCase()}.stablecoins`, label: `$${r.price}: stablecoins on NEAR at ${pl.benchmark}'s market cap to stablecoins ratio`, unit: 'USD', value: pl.stablecoins,
        inputs: [`${P}-MCAP`], methodology: 'Platform framework: rung market cap / benchmark (market cap / stablecoins on chain). Not a cash flow; never added to the cash-flow framework.', transform: 'MCAP / benchmark ratio' });
      item({ evidenceId: `${P}-PLAT-${B}-TVL`, metricKey: `ladder.${r.price}.platform.${pl.benchmark.toLowerCase()}.tvl`, label: `$${r.price}: DeFi TVL on NEAR at ${pl.benchmark}'s market cap to TVL ratio`, unit: 'USD', value: pl.tvl,
        inputs: [`${P}-MCAP`], methodology: 'Platform framework: rung market cap / benchmark (market cap / DeFi TVL). Not a cash flow.', transform: 'MCAP / benchmark ratio' });
      item({ evidenceId: `${P}-PLAT-${B}-STABLES-MULT`, metricKey: `ladder.${r.price}.platform.${pl.benchmark.toLowerCase()}.stablecoins_multiple`, label: `$${r.price}: stablecoins on NEAR needed at ${pl.benchmark}'s ratio, as a multiple of today's`, unit: 'ratio', value: pl.stablecoinsMultiple,
        inputs: [`${P}-PLAT-${B}-STABLES`, 'DEFI-STABLES-NEAR'], methodology: 'Required stablecoins / stablecoins on NEAR today.', transform: 'required / today' });
      item({ evidenceId: `${P}-PLAT-${B}-TVL-MULT`, metricKey: `ladder.${r.price}.platform.${pl.benchmark.toLowerCase()}.tvl_multiple`, label: `$${r.price}: DeFi TVL on NEAR needed at ${pl.benchmark}'s ratio, as a multiple of today's`, unit: 'ratio', value: pl.tvlMultiple,
        inputs: [`${P}-PLAT-${B}-TVL`, 'DEFI-TVL-NEAR'], methodology: 'Required TVL / DeFi TVL on NEAR today.', transform: 'required / today' });
    }
  }
  for (const g of l.implied) for (const b of g.byMultiple) {
    item({ evidenceId: `LAD-IMPLIED-${g.growthKey.toUpperCase()}-${b.multipleKey.toUpperCase()}`, metricKey: `ladder.implied.${g.growthKey}.${b.multipleKey}`, label: `Implied 2036 price: ${g.growthKey} growth, ${multLabel(l, b.multipleKey)}`, unit: 'USD', value: b.price,
      inputs: ['INT-VOL-ANN', 'LAD-HOLDER-TAKE-RATE', 'LAD-NEAR-BURN-RUNRATE', 'LAD-SUPPLY-2036', `LAD-MULT-${b.multipleKey.toUpperCase()}`], methodology: `${GROWTH_SCENARIOS.find((s) => s.key === g.growthKey)?.note} Scenario, not a forecast.`, transform: '(run rate x (1+g)^10 x holder take rate + burns) x multiple / supply 2036' });
  }
  return out;
}

/**
 * Revenue-basis scenarios (audit item 4). The ladder's main tables use DefiLlama's designated buybacks. This repeats
 * the key results on the executed basis (NEAR actually delivered to the buyback wallet), with the multiple, the take
 * rate and the projected flow all on the same basis and the same dates. The two bases are never mixed.
 */
export interface BasisScenario {
  basis: 'designated' | 'executed';
  intentsHolderRunRate: number | null; captureToday: number | null; multipleToday: number | null; holderTakeRate: number | null;
  rungs: { price: number; byMultiple: { multipleKey: string; multiple: number | null; requiredVolume: number | null; dexShare2036: number | null; requiredCagr: number | null }[] }[];
  impliedBase: { multipleKey: string; multiple: number | null; price: number | null }[];
}
export function basisScenarios(l: LadderResult, executedDaily: [string, number][]): BasisScenario[] {
  const I = l.inputs;
  const END = l.basis.windowEnd;
  const execSum = END && executedDaily.length ? windowAggregate(executedDaily, END, RUN_RATE_DAYS).sum : null;
  const execRunRate = execSum === null ? null : (execSum * 365) / RUN_RATE_DAYS;
  const build = (basis: BasisScenario['basis'], holderRunRate: number | null): BasisScenario => {
    const captureToday = holderRunRate !== null && I.burnRunRate !== null ? holderRunRate + I.burnRunRate : null;
    const multipleToday = safeDiv(I.marketCap, captureToday);
    const holderTakeRate = safeDiv(holderRunRate, I.intentsRunRate);
    // Peer multiples are basis-free (market cap / their own holders revenue); NEAR's own multiple follows the basis.
    const mults = l.multiples.map((m) => ({ key: m.key, value: m.key === 'today' ? multipleToday : m.value }));
    const dexBase = I.spotDexRunRate !== null ? I.spotDexRunRate * Math.pow(1 + DEX_GROWTH.base, HORIZON_YEARS) : null;
    const rungs = RUNGS.map((p) => {
      const cap = I.supply2036 !== null ? I.supply2036 * p : null;
      return { price: p, byMultiple: mults.map((m) => {
        const req = cap !== null && m.value ? cap / m.value : null;
        const vol = req !== null && I.burnRunRate !== null && holderTakeRate ? Math.max(0, req - I.burnRunRate) / holderTakeRate : null;
        const vm = safeDiv(vol, I.intentsRunRate);
        return { multipleKey: m.key, multiple: m.value, requiredVolume: vol, dexShare2036: safeDiv(vol, dexBase), requiredCagr: vm !== null && vm > 0 ? Math.pow(vm, 1 / HORIZON_YEARS) - 1 : null };
      }) };
    });
    const v2036 = I.intentsRunRate !== null ? I.intentsRunRate * Math.pow(1.2, HORIZON_YEARS) : null;
    const impliedBase = mults.map((m) => ({ multipleKey: m.key, multiple: m.value,
      price: v2036 !== null && holderTakeRate !== null && I.burnRunRate !== null && m.value && I.supply2036 ? ((v2036 * holderTakeRate + I.burnRunRate) * m.value) / I.supply2036 : null }));
    return { basis, intentsHolderRunRate: holderRunRate, captureToday, multipleToday, holderTakeRate, rungs, impliedBase };
  };
  return [build('designated', I.intentsHolderRunRate), build('executed', execRunRate)];
}

export function basisEvidence(sc: BasisScenario[], periodEnd: string | null): EvidenceDraft[] {
  const out: EvidenceDraft[] = [];
  const push = (id: string, label: string, unit: 'USD' | 'ratio' | 'fraction', value: number | null, methodology: string, transform: string, inputs: string[] = []) => out.push({
    evidenceId: id, metricKey: id.toLowerCase(), group: 'valuation', label, value: value !== null && Number.isFinite(value) ? value : null, valueText: null, unit, observationType: 'DERIVED',
    available: value !== null && Number.isFinite(value), sourceName: 'Computed here', sourceUrl: '/methodology#ladder', observedAt: null, fetchedAt: null, periodStart: null, periodEnd,
    methodology, transform, confidence: 'medium', rawResponseHash: null, validationNotes: null, series: null, inputs,
  });
  for (const s of sc) {
    const B = s.basis.toUpperCase();
    const def = s.basis === 'designated' ? 'DefiLlama designated buybacks (all captured revenue since 23 February 2026)' : 'NEAR delivered to the buyback wallet by 1Click swaps (onchain, FastNEAR)';
    push(`LAD-BASIS-${B}-MULT`, `NEAR's own multiple, ${s.basis} basis (market cap / (burns + ${s.basis} buybacks), 90-day run rate)`, 'ratio', s.multipleToday, `${def}; same 90 days as every other ladder input.`, 'market cap / (burns + buybacks)', s.basis === 'executed' ? ['TOK-EXECUTED-RUNRATE'] : ['LAD-INTENTS-HOLDER-RUNRATE']);
    push(`LAD-BASIS-${B}-TAKE`, `Buyback revenue per dollar of Intents volume, ${s.basis} basis`, 'fraction', s.holderTakeRate, `${def} / Intents volume, same 90 days.`, 'buybacks / volume');
    for (const r of s.rungs) for (const b of r.byMultiple) {
      push(`LAD-BASIS-${B}-${r.price}-${b.multipleKey.toUpperCase()}-SHARE`, `$${r.price}, ${s.basis} basis, ${b.multipleKey === 'today' ? 'NEAR\'s own multiple' : `priced like ${b.multipleKey}`}: Intents volume relative to 2036 spot DEX volume`, 'fraction', b.dexShare2036,
        `Multiple and take rate both on the ${s.basis} basis.`, '(MCAP / multiple - burns) / take rate / 2036 spot DEX', [`LAD-BASIS-${B}-TAKE`]);
    }
    for (const i of s.impliedBase) push(`LAD-BASIS-${B}-IMPLIED-${i.multipleKey.toUpperCase()}`, `Implied 2036 price at 20% growth, ${s.basis} basis, ${i.multipleKey === 'today' ? 'NEAR\'s own multiple' : `priced like ${i.multipleKey}`}`, 'USD', i.price, 'Scenario, not a forecast.', '(run rate x 1.2^10 x take rate + burns) x multiple / supply 2036');
  }
  return out;
}
