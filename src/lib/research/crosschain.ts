/**
 * W2: competitive position in cross-chain execution, NEAR Intents' market (SCOPE.md sections 3, 7 and 8).
 *
 * Every protocol on the same DefiLlama definitions and the same 90-day window: volume (where tracked), fees,
 * revenue, holders revenue, take rate, growth, and how the market values its token relative to revenue.
 * Volumes from different categories are never added: the share uses cross-chain swap venues only, and
 * aggregators (which route through those venues, including Intents) are listed separately.
 */
import type { RawRecord } from '@/lib/data/fetcher';
import { CROSS_CHAIN } from '@/lib/data/sources';
import { commonEnd, fromUnixPairs, safeDiv, windowAggregate, type DailyPoint } from './series';
import type { EvidenceDraft } from './types';

export const CROSSCHAIN_VERSION = 'w2-1.0.0';
const RUN = 90;

export interface ProtocolRow {
  name: string; role: string; token: string | null;
  volumeRunRate: number | null; volumeYoY: number | null; feesRunRate: number | null; revenueRunRate: number | null; revenueYoY: number | null; holdersRunRate: number | null;
  feeRate: number | null; takeRate: number | null; holderShare: number | null;
  marketCap: number | null; capToRevenue: number | null; capToHolders: number | null; notes: string[];
}
export interface CrossChainResult {
  version: string; windowEnd: string | null;
  rows: ProtocolRow[];
  swapVenueShare: number | null; swapVenues: string[];
  peerMedianCapToRevenue: number | null; peerMedianCapToHolders: number | null; peerSet: string[]; nearCapToIntentsRevenue: number | null;
  nearImpliedCapAtPeerMultiple: number | null; nearImpliedPriceAtPeerMultiple: number | null;
  findings: string[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const fmtUsd = (v: number | null) => (v === null ? 'n/a' : Math.abs(v) >= 1e9 ? `$${(v / 1e9).toFixed(1)}B` : `$${(v / 1e6).toFixed(1)}M`);
const fmtX = (v: number | null) => (v === null ? 'n/a' : v >= 10 ? `${v.toFixed(0)}x` : `${v.toFixed(1)}x`);
const fmtPct = (v: number | null, d = 0) => (v === null ? 'n/a' : `${(v * 100).toFixed(d)}%`);
const median = (xs: number[]) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2; };

export function analyzeCrossChain(raws: Record<string, RawRecord | null | undefined>, ev: (id: string) => number | null): CrossChainResult {
  const body = (k: string) => raws[k]?.body as any;
  const series = (k: string) => fromUnixPairs(body(k)?.chart);
  const tokens: any[] = Array.isArray(body('coingecko.crosschain')) ? body('coingecko.crosschain') : [];
  const volKey = (p: (typeof CROSS_CHAIN)[number]) => (p.slug === 'near-intents' ? 'defillama.intents.volume' : p.volume ? `defillama.ccvol.${p.slug}` : null);
  const feeKey = (p: (typeof CROSS_CHAIN)[number], dt: string) => (p.slug === 'near-intents' ? `defillama.intents.${dt}` : `defillama.ccfees.${p.slug}.${dt}`);

  // One end date: the last complete day common to every series that exists.
  const all: DailyPoint[][] = [];
  for (const p of CROSS_CHAIN) { const v = volKey(p); if (v && series(v).length) all.push(series(v)); for (const dt of ['dailyFees', 'dailyRevenue']) { const s = series(feeKey(p, dt)); if (s.length) all.push(s); } }
  const END = commonEnd(all, 1);
  const rr = (s: DailyPoint[]) => { if (!END || !s.length) return null; const x = windowAggregate(s, END, RUN).sum; return x === null ? null : (x * 365) / RUN; };
  const yoy = (s: DailyPoint[]) => { if (!END || !s.length) return null; const a = windowAggregate(s, END, RUN).sum, b = windowAggregate(s, addDays(END, -365), RUN).sum; return a !== null && b ? a / b - 1 : null; };

  const nearCap = ev('MKT-NEAR-MCAP');
  const rows: ProtocolRow[] = CROSS_CHAIN.map((p) => {
    const notes: string[] = [];
    const vk = volKey(p);
    const vol = vk ? series(vk) : [];
    const fees = series(feeKey(p, 'dailyFees')), rev = series(feeKey(p, 'dailyRevenue')), hold = series(feeKey(p, 'dailyHoldersRevenue'));
    const volumeRunRate = rr(vol), feesRunRate = rr(fees), revenueRunRate = rr(rev), holdersRunRate = hold.length ? rr(hold) : null;
    if (!vk) notes.push('No volume adapter on DefiLlama; compared on revenue only.');
    if (p.feeNote) notes.push(p.feeNote);
    const t = p.coin ? tokens.find((x) => x.id === p.coin) : null;
    const marketCap = p.slug === 'near-intents' ? nearCap : t && Number.isFinite(t.marketCap) ? t.marketCap as number : null;
    if (p.slug === 'near-intents') notes.push('Market cap is all of NEAR (the token also carries the L1), so the multiple overstates what the market pays for Intents alone only if the rest of NEAR is worth something on its own.');
    return {
      name: p.name, role: p.role, token: p.slug === 'near-intents' ? 'NEAR' : t ? String(t.symbol).toUpperCase() : null,
      volumeRunRate, volumeYoY: yoy(vol), feesRunRate, revenueRunRate, revenueYoY: yoy(rev), holdersRunRate,
      feeRate: p.feeNote ? null : safeDiv(feesRunRate, volumeRunRate), takeRate: safeDiv(revenueRunRate, volumeRunRate), holderShare: safeDiv(holdersRunRate, revenueRunRate),
      marketCap, capToRevenue: revenueRunRate ? safeDiv(marketCap, revenueRunRate) : null, capToHolders: holdersRunRate ? safeDiv(marketCap, holdersRunRate) : null, notes,
    };
  });

  // Share among cross-chain swap venues with public volume (aggregators excluded: they route through these venues).
  const venues = rows.filter((r) => r.role === 'swap venue' && r.volumeRunRate !== null);
  const venueTotal = venues.reduce((a, r) => a + r.volumeRunRate!, 0);
  const intents = rows.find((r) => r.name === 'NEAR Intents');
  const swapVenueShare = intents?.volumeRunRate && venueTotal ? intents.volumeRunRate / venueTotal : null;

  // How the market values cross-chain tokens on revenue, and NEAR on Intents revenue.
  // Peers: execution protocols with a token (swap venues, bridges, solvers). Messaging layers are shown, not used.
  const EXECUTION = ['swap venue', 'bridge', 'bridge and solver'];
  const peers = rows.filter((r) => r.name !== 'NEAR Intents' && EXECUTION.includes(r.role) && r.capToRevenue !== null && r.revenueRunRate !== null && r.revenueRunRate > 0);
  const peerMedianCapToRevenue = median(peers.map((r) => r.capToRevenue!));
  const peerMedianCapToHolders = median(peers.filter((r) => r.capToHolders !== null && r.holdersRunRate! > 0).map((r) => r.capToHolders!));
  const messaging = rows.filter((r) => r.role === 'messaging' && r.capToRevenue !== null);
  const nearCapToIntentsRevenue = intents?.capToRevenue ?? null;
  const nearImpliedCapAtPeerMultiple = peerMedianCapToRevenue !== null && intents?.revenueRunRate ? peerMedianCapToRevenue * intents.revenueRunRate : null;
  const circ = ev('MKT-NEAR-CIRC');
  const nearImpliedPriceAtPeerMultiple = nearImpliedCapAtPeerMultiple !== null && circ ? nearImpliedCapAtPeerMultiple / circ : null;

  const byRev = [...rows].filter((r) => r.revenueRunRate !== null).sort((a, b) => b.revenueRunRate! - a.revenueRunRate!);
  const findings = [
    `Among cross-chain swap venues with public volume (${venues.map((v) => v.name).join(', ')}), NEAR Intents handles ${fmtPct(swapVenueShare)} of volume (run rate). Aggregators and bridges without a volume adapter (Relay, deBridge, Across, Mayan, Stargate) are not in this denominator, so it overstates Intents' share of all cross-chain execution.`,
    `By revenue, the largest cross-chain protocols are ${byRev.slice(0, 4).map((r) => `${r.name} ${fmtUsd(r.revenueRunRate)}`).join(', ')} a year (run rate).`,
    `Cross-chain execution tokens trade at a median ${fmtX(peerMedianCapToRevenue)} their protocol revenue (${peers.map((r) => `${r.token} ${fmtX(r.capToRevenue)}`).join(', ')}). NEAR trades at ${fmtX(nearCapToIntentsRevenue)} Intents revenue. At the peer median, Intents revenue would support ${fmtUsd(nearImpliedCapAtPeerMultiple)} of market cap, about $${nearImpliedPriceAtPeerMultiple?.toFixed(2) ?? 'n/a'} a token, against ${fmtUsd(nearCap)} today: the rest of NEAR's valuation rests on the L1, its other products, or a premium the cross-chain market does not pay its own leaders.`,
    `On revenue that reaches token holders the gap is smaller: the peer median is ${fmtX(peerMedianCapToHolders)} (${peers.filter((r) => r.capToHolders !== null).map((r) => `${r.token} ${fmtX(r.capToHolders)}`).join(', ')}), because some protocols, THORChain above all, pass little revenue to their token; NEAR designates all of Intents' captured revenue for buybacks (about 60% executed onchain so far, section 6). Messaging layers are valued differently again (${messaging.map((r) => `${r.token} ${fmtX(r.capToRevenue)}`).join(', ')}).`,
  ];
  return { version: CROSSCHAIN_VERSION, windowEnd: END, rows, swapVenueShare, swapVenues: venues.map((v) => v.name), peerMedianCapToRevenue, peerMedianCapToHolders, peerSet: peers.map((r) => r.name), nearCapToIntentsRevenue, nearImpliedCapAtPeerMultiple, nearImpliedPriceAtPeerMultiple, findings };
}

export function crossChainEvidence(c: CrossChainResult): EvidenceDraft[] {
  const out: EvidenceDraft[] = [];
  const item = (o: Partial<EvidenceDraft> & Pick<EvidenceDraft, 'evidenceId' | 'metricKey' | 'label' | 'unit' | 'methodology' | 'transform'>): void => {
    const value = o.value ?? null;
    out.push({
      group: 'peers', valueText: null, observationType: 'DERIVED', sourceName: 'DefiLlama and CoinGecko', sourceUrl: '/methodology#competition', observedAt: null, fetchedAt: null,
      periodStart: null, periodEnd: c.windowEnd, confidence: 'medium', rawResponseHash: null, validationNotes: null, series: null, inputs: [], ...o,
      value: value !== null && Number.isFinite(value) ? value : null, available: value !== null && Number.isFinite(value),
    });
  };
  item({ evidenceId: 'CC-INTENTS-VENUE-SHARE', metricKey: 'crosschain.intents_venue_share', label: 'NEAR Intents share of volume among cross-chain swap venues with public volume', unit: 'fraction', value: c.swapVenueShare, confidence: 'low',
    validationNotes: `Venues: ${c.swapVenues.join(', ')}.`, methodology: 'Run-rate volume, same window. Aggregators excluded (they route through these venues); protocols without a volume adapter are missing, so this overstates the share.', transform: 'Intents / sum(venues)' });
  item({ evidenceId: 'CC-PEER-MEDIAN-CAP-REV', metricKey: 'crosschain.peer_median_cap_to_revenue', label: 'Median market cap / protocol revenue, cross-chain execution tokens', unit: 'ratio', value: c.peerMedianCapToRevenue, validationNotes: `Peers: ${c.peerSet.join(', ')}.`, methodology: 'CoinGecko market cap / DefiLlama revenue (90-day run rate) for swap venues, bridges and solvers with a token. Messaging layers excluded.', transform: 'median(cap / revenue)' });
  item({ evidenceId: 'CC-PEER-MEDIAN-CAP-HOLDERS', metricKey: 'crosschain.peer_median_cap_to_holders', label: 'Median market cap / holders revenue, cross-chain execution tokens', unit: 'ratio', value: c.peerMedianCapToHolders, methodology: 'Same peers, on revenue that reaches token holders.', transform: 'median(cap / holders revenue)' });
  item({ evidenceId: 'CC-NEAR-CAP-INTENTS-REV', metricKey: 'crosschain.near_cap_to_intents_revenue', label: 'NEAR market cap / Intents protocol revenue', unit: 'ratio', value: c.nearCapToIntentsRevenue, methodology: 'Same definition as the peers.', transform: 'NEAR cap / Intents revenue run rate' });
  item({ evidenceId: 'CC-NEAR-IMPLIED-CAP', metricKey: 'crosschain.near_implied_cap', label: 'Market cap Intents revenue would support at the cross-chain peer median multiple', unit: 'USD', value: c.nearImpliedCapAtPeerMultiple, inputs: ['CC-PEER-MEDIAN-CAP-REV'], methodology: 'What the cross-chain market pays for revenue like Intents\'. Not a target: it leaves out everything else NEAR is.', transform: 'median multiple x Intents revenue' });
  item({ evidenceId: 'CC-NEAR-IMPLIED-PRICE', metricKey: 'crosschain.near_implied_price', label: 'NEAR price at the cross-chain peer median multiple on Intents revenue', unit: 'USD', value: c.nearImpliedPriceAtPeerMultiple, inputs: ['CC-NEAR-IMPLIED-CAP', 'MKT-NEAR-CIRC'], methodology: 'Implied market cap / circulating supply.', transform: 'cap / circulating' });
  for (const r of c.rows) {
    const k = r.name.toUpperCase().replace(/[^A-Z]+/g, '-').replace(/^-|-$/g, '');
    item({ evidenceId: `CC-${k}-REVENUE`, metricKey: `crosschain.${k.toLowerCase()}.revenue`, label: `${r.name}: protocol revenue, 90-day run rate`, unit: 'USD', value: r.revenueRunRate, methodology: 'DefiLlama revenue definition for the protocol.', transform: 'sum 90d x 365/90', validationNotes: r.notes.join(' ') || null });
    if (r.volumeRunRate !== null) item({ evidenceId: `CC-${k}-VOLUME`, metricKey: `crosschain.${k.toLowerCase()}.volume`, label: `${r.name}: volume, 90-day run rate`, unit: 'USD', value: r.volumeRunRate, methodology: 'DefiLlama volume.', transform: 'sum 90d x 365/90' });
    if (r.takeRate !== null) item({ evidenceId: `CC-${k}-TAKE-RATE`, metricKey: `crosschain.${k.toLowerCase()}.take_rate`, label: `${r.name}: protocol revenue per dollar of volume`, unit: 'fraction', value: r.takeRate, methodology: 'Revenue / volume, same window (H3).', transform: 'revenue / volume' });
  }
  return out;
}
