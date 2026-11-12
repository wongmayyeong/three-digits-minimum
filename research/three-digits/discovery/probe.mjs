/**
 * Discovery probe (SCOPE.md 3.1, sequence item 2): which public data exists for every member of the
 * comparison universe, from which upstream, over which dates. Records every attempt and its outcome,
 * including failures (amendment 7). Re-run:  node research/three-digits/discovery/probe.mjs
 * Writes research/three-digits/discovery/inventory.json; DISCOVERY.md summarizes it.
 */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'inventory.json');
const L = 'https://api.llama.fi';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const attempts = [];

async function get(url, note) {
  await sleep(350);
  const t0 = Date.now();
  try {
    const res = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'research-probe' }, signal: AbortSignal.timeout(45_000) });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* not JSON */ }
    const ok = res.ok && json !== null;
    attempts.push({ url, note, status: res.status, ok, ms: Date.now() - t0, error: ok ? null : text.slice(0, 120).replace(/\s+/g, ' ') });
    return ok ? json : null;
  } catch (e) {
    attempts.push({ url, note, status: null, ok: false, ms: Date.now() - t0, error: String(e).slice(0, 120) });
    return null;
  }
}

/** Daily chart -> coverage and trailing sums ending on the last complete day. */
function cover(chart) {
  const pts = (Array.isArray(chart) ? chart : []).map((p) => [Number(p[0]), Number(p[1])]).filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1])).sort((a, b) => a[0] - b[0]);
  if (pts.length < 2) return null;
  const done = pts.slice(0, -1);
  const day = (t) => new Date(t * 1000).toISOString().slice(0, 10);
  const end = done[done.length - 1][0];
  const sum = (d) => done.filter(([t]) => t > end - d * 86_400).reduce((a, [, v]) => a + v, 0);
  return { first: day(pts[0][0]), last: day(end), days: done.length, sum90: sum(90), sum365: done.length >= 365 ? sum(365) : null };
}

const summary = async (kind, slug, dataType) => {
  const j = await get(`${L}/summary/${kind}/${encodeURIComponent(slug)}${dataType ? `?dataType=${dataType}` : ''}`, `${kind} ${slug} ${dataType ?? ''}`.trim());
  return j ? { name: j.name ?? slug, category: j.category ?? null, methodology: j.methodology ?? null, ...cover(j.totalDataChart) } : null;
};

// ---- Comparison universe (fixed in SCOPE.md section 3 before results were seen).
const ASSETS = [
  { label: 'BTC', coin: 'bitcoin', chain: 'Bitcoin', type: 'monetary' },
  { label: 'ETH', coin: 'ethereum', chain: 'Ethereum', type: 'platform' },
  { label: 'SOL', coin: 'solana', chain: 'Solana', type: 'platform' },
  { label: 'SUI', coin: 'sui', chain: 'Sui', type: 'platform' },
  { label: 'AVAX', coin: 'avalanche-2', chain: 'Avalanche', type: 'platform' },
  { label: 'TON', coin: 'the-open-network', chain: 'TON', type: 'platform' },
  { label: 'APT', coin: 'aptos', chain: 'Aptos', type: 'platform' },
  { label: 'HYPE', coin: 'hyperliquid', chain: 'Hyperliquid L1', type: 'cash-flow' },
  { label: 'NEAR', coin: 'near', chain: 'Near', type: 'both' },
  { label: 'TRX', coin: 'tron', chain: 'Tron', type: 'cash-flow' },
  { label: 'BNB', coin: 'binancecoin', chain: 'BSC', type: 'platform' },
];
const REFERENCE_CHAINS = ['Base', 'Arbitrum'];
const CROSS_CHAIN = [
  { name: 'NEAR Intents', slugs: ['near-intents'] },
  { name: 'THORChain', slugs: ['thorchain-dex', 'thorchain'] },
  { name: 'Chainflip', slugs: ['chainflip-amm', 'chainflip'] },
  { name: 'Maya Protocol', slugs: ['maya-protocol'] },
  { name: 'deBridge (DLN)', slugs: ['debridge', 'dln'] },
  { name: 'Relay', slugs: ['relay', 'relay-protocol', 'relay-bridge'] },
  { name: 'Across', slugs: ['across'] },
  { name: 'LI.FI', slugs: ['li.fi-bridge-aggregator', 'lifi', 'li.fi'] },
  { name: 'Jumper', slugs: ['jumper-bridge-aggregator'] },
  { name: 'Mayan', slugs: ['mayan-bridge', 'mayan-dex-aggregator', 'mayan'] },
  { name: 'Wormhole', slugs: ['wormhole', 'portal'] },
  { name: 'Axelar', slugs: ['axelar', 'axelar-cross-chain'] },
  { name: 'Stargate', slugs: ['stargate-v2', 'stargate'] },
  { name: 'Socket / Bungee', slugs: ['socket-protocol', 'bungee-bridge-aggregator'] },
  { name: 'Symbiosis', slugs: ['symbiosis'] },
  { name: 'Unit', slugs: ['unit'] },
  { name: 'Rango', slugs: ['rango'] },
  { name: 'Garden', slugs: ['garden'] },
];
const SIGNING = [
  { name: 'LayerZero', slugs: ['layerzero-v2', 'layerzero'] },
  { name: 'Wormhole', slugs: ['wormhole'] },
  { name: 'Axelar', slugs: ['axelar'] },
  { name: 'Lit Protocol', slugs: ['lit-protocol'] },
  { name: 'Particle Network', slugs: ['particle-network'] },
  { name: 'Squid', slugs: ['squid'] },
];
const AI = [
  { name: 'Bittensor', slugs: ['bittensor', 'bittensor-dtao'], coin: 'bittensor' },
  { name: 'Virtuals Protocol', slugs: ['virtuals-protocol'], coin: 'virtual-protocol' },
  { name: 'Olas', slugs: ['olas', 'autonolas'], coin: 'autonolas' },
  { name: 'Fetch.ai / ASI', slugs: ['fetch-ai'], coin: 'fetch-ai' },
  { name: 'ElizaOS (ai16z)', slugs: ['elizaos', 'ai16z'], coin: 'ai16z' },
  { name: 'x402', slugs: ['x402'], coin: null },
];

async function firstHit(kind, slugs, dataType) {
  for (const s of slugs) { const r = await summary(kind, s, dataType); if (r && r.days) return { slug: s, ...r }; }
  return null;
}

const inv = { generatedAt: new Date().toISOString(), assets: [], referenceChains: [], crossChain: [], signing: [], ai: [], listings: {} };

// Listings and category structure.
const dexOv = await get(`${L}/overview/dexs?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`, 'DEX overview listing');
const aggOv = await get(`${L}/overview/bridge-aggregators?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`, 'bridge-aggregator overview listing');
const feesOv = await get(`${L}/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`, 'fees overview listing');
await get('https://bridges.llama.fi/bridges?includeChains=false', 'DefiLlama bridges API (bridge volume by protocol)');
const chains = await get(`${L}/v2/chains`, 'chain TVL listing');
const stables = await get('https://stablecoins.llama.fi/stablecoinchains', 'stablecoins by chain');
const cats = {};
for (const p of dexOv?.protocols ?? []) { const c = p.category ?? 'Unknown'; cats[c] = cats[c] ?? { protocols: 0, total1y: 0 }; cats[c].protocols++; cats[c].total1y += p.total1y ?? 0; }
inv.listings.dexOverviewCategories = cats;
inv.listings.bridgeAggregators = (aggOv?.protocols ?? []).map((p) => ({ name: p.name, category: p.category, total1y: p.total1y ?? null, total30d: p.total30d ?? null })).sort((a, b) => (b.total1y ?? 0) - (a.total1y ?? 0));
const listed = (name) => [...(dexOv?.protocols ?? []), ...(aggOv?.protocols ?? [])].filter((p) => (p.name ?? '').toLowerCase().includes(name.toLowerCase())).map((p) => ({ name: p.name, category: p.category, total1y: p.total1y ?? null }));

// CoinGecko market data for the investable alternatives.
const cg = await get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${[...ASSETS.map((a) => a.coin), ...AI.map((a) => a.coin).filter(Boolean)].join(',')}`, 'CoinGecko markets for the universe');
const cgOf = (id) => (cg ?? []).find((c) => c.id === id) ?? null;

for (const a of ASSETS) {
  const c = cgOf(a.coin);
  inv.assets.push({
    ...a,
    coingecko: c ? { price: c.current_price, marketCap: c.market_cap, fdv: c.fully_diluted_valuation, circulating: c.circulating_supply, totalSupply: c.total_supply, maxSupply: c.max_supply } : null,
    fees: await summary('fees', a.chain.toLowerCase().replace(' l1', '').replace(/\s+/g, '-'), 'dailyFees'),
    revenue: await summary('fees', a.chain.toLowerCase().replace(' l1', '').replace(/\s+/g, '-'), 'dailyRevenue'),
    holdersRevenue: await summary('fees', a.chain.toLowerCase().replace(' l1', '').replace(/\s+/g, '-'), 'dailyHoldersRevenue'),
    dexVolume: await summary('dexs', a.chain.toLowerCase().replace(' l1', '').replace(/\s+/g, '-')),
    tvl: (chains ?? []).find((x) => x.name === a.chain)?.tvl ?? null,
    stablecoins: (stables ?? []).find((x) => x.name === a.chain)?.totalCirculatingUSD?.peggedUSD ?? null,
  });
}
for (const ch of REFERENCE_CHAINS) {
  inv.referenceChains.push({ chain: ch, fees: await summary('fees', ch.toLowerCase(), 'dailyFees'), dexVolume: await summary('dexs', ch.toLowerCase()),
    tvl: (chains ?? []).find((x) => x.name === ch)?.tvl ?? null, stablecoins: (stables ?? []).find((x) => x.name === ch)?.totalCirculatingUSD?.peggedUSD ?? null });
}
for (const p of CROSS_CHAIN) {
  inv.crossChain.push({ name: p.name, listedIn: listed(p.name.split(' ')[0]),
    volumeDex: await firstHit('dexs', p.slugs), volumeAggregator: await firstHit('bridge-aggregators', p.slugs),
    fees: await firstHit('fees', p.slugs, 'dailyFees'), revenue: await firstHit('fees', p.slugs, 'dailyRevenue'), holdersRevenue: await firstHit('fees', p.slugs, 'dailyHoldersRevenue') });
}
for (const p of SIGNING) {
  inv.signing.push({ name: p.name, fees: await firstHit('fees', p.slugs, 'dailyFees'), revenue: await firstHit('fees', p.slugs, 'dailyRevenue') });
}
for (const p of AI) {
  const c = p.coin ? cgOf(p.coin) : null;
  inv.ai.push({ name: p.name, marketCap: c?.market_cap ?? null, fees: await firstHit('fees', p.slugs, 'dailyFees'), revenue: await firstHit('fees', p.slugs, 'dailyRevenue'), volume: await firstHit('dexs', p.slugs) });
}
inv.listings.feesOverviewCount = feesOv?.protocols?.length ?? null;
inv.attempts = attempts;
writeFileSync(OUT, JSON.stringify(inv, null, 1));
console.log(`wrote ${OUT}: ${attempts.length} requests, ${attempts.filter((a) => a.ok).length} ok`);
