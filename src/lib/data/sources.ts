/**
 * Declarative catalog of every external request NEBUBE makes. Nothing outside this file
 * chooses a URL, so the full set of data dependencies (and the SSRF surface) is auditable
 * in one place. User input never reaches a URL: topics select request keys from this list.
 */
import { createHash } from 'node:crypto';

export type SourceId = 'coingecko' | 'defillama' | 'nearblocks' | 'near-rpc' | 'fastnear' | 'intents-explorer' | 'bigquery';

export interface SourceMeta {
  id: SourceId;
  name: string;
  kind: string;
  baseUrl: string;
  docsUrl: string;
  requiresCredential: boolean;
  /** Minimum gap between requests to this source, honoring published limits. */
  minGapMs: number;
}

export const SOURCES: Record<SourceId, SourceMeta> = {
  coingecko: {
    id: 'coingecko', name: 'CoinGecko', kind: 'market data API', baseUrl: 'https://api.coingecko.com/api/v3',
    docsUrl: 'https://docs.coingecko.com/reference/introduction', requiresCredential: false, minGapMs: 6_500,
  },
  defillama: {
    id: 'defillama', name: 'DefiLlama', kind: 'DeFi analytics API', baseUrl: 'https://api.llama.fi',
    docsUrl: 'https://api-docs.defillama.com/', requiresCredential: false, minGapMs: 300,
  },
  nearblocks: {
    id: 'nearblocks', name: 'NearBlocks', kind: 'NEAR explorer API', baseUrl: 'https://api.nearblocks.io/v1',
    docsUrl: 'https://api.nearblocks.io/api-docs', requiresCredential: false, minGapMs: 6_000,
  },
  'near-rpc': {
    id: 'near-rpc', name: 'NEAR JSON-RPC (FastNEAR)', kind: 'onchain RPC', baseUrl: 'https://free.rpc.fastnear.com',
    docsUrl: 'https://docs.near.org/api/rpc/introduction', requiresCredential: false, minGapMs: 200,
  },
  fastnear: {
    id: 'fastnear', name: 'FastNEAR transactions API', kind: 'NEAR transaction indexer', baseUrl: 'https://tx.main.fastnear.com/v0',
    docsUrl: 'https://github.com/fastnear/explorer-api', requiresCredential: false, minGapMs: 250,
  },
  'intents-explorer': {
    id: 'intents-explorer', name: 'NEAR Intents Explorer API', kind: 'partner API (JWT)', baseUrl: 'https://explorer.near-intents.org/api/v0',
    docsUrl: 'https://docs.near-intents.org/integration/distribution-channels/1click-api/explorer/introduction', requiresCredential: true, minGapMs: 5_500,
  },
  bigquery: {
    id: 'bigquery', name: 'Google BigQuery: crypto_near_mainnet_us', kind: 'public dataset (your GCP billing)', baseUrl: 'bigquery-public-data.crypto_near_mainnet_us',
    docsUrl: 'https://docs.near.org/data-infrastructure/big-query', requiresCredential: true, minGapMs: 0,
  },
};

export interface HttpRequestDef {
  key: string;
  source: SourceId;
  url: string;
  method?: 'GET' | 'POST';
  body?: unknown;
  headers?: () => Record<string, string> | null;
  /** Freshness policy: cached responses younger than this are reused. */
  ttlMs: number;
  /** Keeps only the fields used downstream. The stored hash covers the projected body. */
  project: (json: unknown) => unknown;
  /** Returns a reason string when the request cannot run (e.g. missing credential). */
  unavailable?: () => string | null;
}

const MIN = 60_000;
const HOUR = 60 * MIN;

/* eslint-disable @typescript-eslint/no-explicit-any */
const asArr = (x: unknown): any[] => (Array.isArray(x) ? x : []);
const llamaSummary = (j: any) => ({
  name: j?.name ?? null,
  methodology: j?.methodology ?? null,
  methodologyURL: j?.methodologyURL ?? null,
  chart: asArr(j?.totalDataChart).map((p: any) => [Number(p[0]), Number(p[1])]),
});

function cgHeaders(): Record<string, string> {
  const demo = process.env.COINGECKO_DEMO_API_KEY;
  const pro = process.env.COINGECKO_PRO_API_KEY;
  if (pro) return { 'x-cg-pro-api-key': pro };
  return demo ? { 'x-cg-demo-api-key': demo } : {};
}
function cgBase(): string {
  return process.env.COINGECKO_PRO_API_KEY ? 'https://pro-api.coingecko.com/api/v3' : SOURCES.coingecko.baseUrl;
}

export const PEER_CHAINS = [
  { coin: 'near', label: 'NEAR', llamaFees: 'near', llamaChain: 'Near', llamaDex: 'near' },
  { coin: 'solana', label: 'Solana', llamaFees: 'solana', llamaChain: 'Solana', llamaDex: 'solana' },
  { coin: 'sui', label: 'Sui', llamaFees: 'sui', llamaChain: 'Sui', llamaDex: 'sui' },
  { coin: 'avalanche-2', label: 'Avalanche', llamaFees: 'avalanche', llamaChain: 'Avalanche', llamaDex: 'avalanche' },
] as const;

export const BUYBACK_WALLET = 'buybacks.multisignature.near';

/**
 * Tokens used to show how the market values crypto assets relative to the revenue that reaches holders.
 * Large platforms (platform premium) and cash-flow tokens (priced on what they pay holders).
 */
export const VALUATION_PEERS = [
  { label: 'Ethereum', coin: 'ethereum', llama: 'ethereum', chain: 'Ethereum', regime: 'platform' },
  { label: 'BNB', coin: 'binancecoin', llama: 'bsc', chain: 'BSC', regime: 'platform' },
  { label: 'Solana', coin: 'solana', llama: 'solana', chain: 'Solana', regime: 'platform' },
  { label: 'Tron', coin: 'tron', llama: 'tron', chain: 'Tron', regime: 'cash-flow' },
  { label: 'Hyperliquid', coin: 'hyperliquid', llama: 'hyperliquid', chain: 'Hyperliquid L1', regime: 'cash-flow' },
] as const;
export const PLATFORM_CHAINS: string[] = ['Ethereum', 'BSC', 'Solana', 'Tron', 'Near'];
/**
 * Investable alternatives (SCOPE.md section 3, fixed before results were seen). `llama` is the DefiLlama
 * holders-revenue slug (burns and buybacks); BTC has none by design (monetary asset).
 */
export const INVESTABLE = [
  { label: 'BTC', coin: 'bitcoin', llama: null, type: 'monetary' },
  { label: 'ETH', coin: 'ethereum', llama: 'ethereum', type: 'platform' },
  { label: 'SOL', coin: 'solana', llama: 'solana', type: 'platform' },
  { label: 'SUI', coin: 'sui', llama: 'sui', type: 'platform' },
  { label: 'AVAX', coin: 'avalanche-2', llama: 'avalanche', type: 'platform' },
  { label: 'TON', coin: 'the-open-network', llama: 'ton', type: 'platform' },
  { label: 'APT', coin: 'aptos', llama: 'aptos', type: 'platform' },
  { label: 'HYPE', coin: 'hyperliquid', llama: 'hyperliquid', type: 'cash-flow' },
  { label: 'NEAR', coin: 'near', llama: null, type: 'both' },
] as const;
/** DefiLlama chain names for the platform economy of each investable alternative (BTC has no DeFi economy to value). */
export const CHAIN_ECONOMY = [
  { label: 'ETH', chain: 'Ethereum' }, { label: 'SOL', chain: 'Solana' }, { label: 'SUI', chain: 'Sui' }, { label: 'AVAX', chain: 'Avalanche' },
  { label: 'TON', chain: 'TON' }, { label: 'APT', chain: 'Aptos' }, { label: 'HYPE', chain: 'Hyperliquid L1' }, { label: 'NEAR', chain: 'Near' },
] as const;
/**
 * Cross-chain execution (W2): NEAR Intents and its competitors, from the discovery inventory. `volume` names the
 * DefiLlama overview that tracks the protocol's volume (null: no volume adapter). Roles keep categories apart
 * (SCOPE section 7): only swap venues enter the volume share; aggregators route through them.
 */
export const CROSS_CHAIN = [
  { name: 'NEAR Intents', slug: 'near-intents', role: 'swap venue', volume: 'dexs', coin: null, feeNote: null },
  { name: 'THORChain', slug: 'thorchain-dex', role: 'swap venue', volume: 'dexs', coin: 'thorchain', feeNote: null },
  { name: 'Chainflip', slug: 'chainflip-amm', role: 'swap venue', volume: 'dexs', coin: 'chainflip', feeNote: null },
  { name: 'Maya Protocol', slug: 'maya-protocol', role: 'swap venue', volume: 'dexs', coin: null, feeNote: null },
  { name: 'Unit', slug: 'unit', role: 'bridge', volume: 'dexs', coin: null, feeNote: null },
  { name: 'Relay', slug: 'relay', role: 'bridge and solver', volume: null, coin: null, feeNote: 'DefiLlama counts swap costs in Relay\'s fees, so its fee rate is not comparable.', noHolders: true },
  { name: 'deBridge (DLN)', slug: 'debridge', role: 'bridge and solver', volume: null, coin: 'debridge', feeNote: null },
  { name: 'Mayan', slug: 'mayan-dex-aggregator', role: 'bridge and solver', volume: null, coin: null, feeNote: null, noHolders: true },
  { name: 'Across', slug: 'across', role: 'bridge and solver', volume: null, coin: 'across-protocol', feeNote: null },
  { name: 'Stargate', slug: 'stargate-v2', role: 'bridge', volume: null, coin: 'stargate-finance', feeNote: null, noHolders: true },
  { name: 'Symbiosis', slug: 'symbiosis', role: 'bridge', volume: null, coin: 'symbiosis-finance', feeNote: null },
  { name: 'LI.FI', slug: 'li.fi-bridge-aggregator', role: 'aggregator', volume: 'bridge-aggregators', coin: null, feeNote: null, noHolders: true },
  { name: 'Rango', slug: 'rango', role: 'aggregator', volume: 'bridge-aggregators', coin: null, feeNote: null, noHolders: true },
  { name: 'LayerZero', slug: 'layerzero-v2', role: 'messaging', volume: null, coin: 'layerzero', feeNote: null },
  { name: 'Wormhole', slug: 'wormhole', role: 'messaging', volume: null, coin: 'wormhole', feeNote: null, noHolders: true },
  { name: 'Axelar', slug: 'axelar', role: 'messaging', volume: null, coin: 'axelar', feeNote: null },
] as const;
/** DefiLlama categories inside its DEX overview. Spot = AMMs and order books; cross-chain = where NEAR Intents is listed. */
export const DEX_SPOT_CATEGORY = 'Dexs';
export const DEX_CROSS_CHAIN_CATEGORIES: string[] = ['Bridge', 'Cross Chain Bridge'];

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64');

function rpc(key: string, method: string, params: unknown, project: (r: any) => unknown): HttpRequestDef {
  return {
    key, source: 'near-rpc', url: SOURCES['near-rpc'].baseUrl, method: 'POST', ttlMs: 10 * MIN,
    body: { jsonrpc: '2.0', id: 'nebube', method, params },
    project: (j: any) => {
      if (j?.error) throw new Error(`RPC error: ${JSON.stringify(j.error).slice(0, 200)}`);
      return project(j?.result);
    },
  };
}

export function buildRequestCatalog(): HttpRequestDef[] {
  const L = SOURCES.defillama.baseUrl;
  const reqs: HttpRequestDef[] = [];

  // ---- CoinGecko: market caps, prices and circulating supply for NEAR and matched peers.
  reqs.push({
    key: 'coingecko.markets', source: 'coingecko', ttlMs: 10 * MIN, headers: cgHeaders,
    get url() { return `${cgBase()}/coins/markets?vs_currency=usd&ids=${PEER_CHAINS.map((p) => p.coin).join(',')}`; },
    project: (a) => asArr(a).map((c: any) => ({
      id: String(c.id), symbol: String(c.symbol), marketCap: Number(c.market_cap), price: Number(c.current_price),
      circulating: Number(c.circulating_supply), totalSupply: c.total_supply === null ? null : Number(c.total_supply),
      fdv: c.fully_diluted_valuation === null ? null : Number(c.fully_diluted_valuation), lastUpdated: String(c.last_updated),
    })),
  });
  reqs.push({
    key: 'coingecko.near.history', source: 'coingecko', ttlMs: 6 * HOUR, headers: cgHeaders,
    get url() { return `${cgBase()}/coins/near/market_chart?vs_currency=usd&days=365&interval=daily`; },
    project: (j: any) => ({
      prices: asArr(j?.prices).map((p: any) => [Math.round(Number(p[0]) / 1000), Number(p[1])]),
      marketCaps: asArr(j?.market_caps).map((p: any) => [Math.round(Number(p[0]) / 1000), Math.round(Number(p[1]))]),
    }),
  });

  // ---- DefiLlama: NEAR Intents volume, fees, revenue and holders revenue (same adapter).
  reqs.push({ key: 'defillama.intents.volume', source: 'defillama', ttlMs: HOUR, url: `${L}/summary/dexs/near-intents?dataType=dailyVolume`, project: llamaSummary });
  for (const dt of ['dailyFees', 'dailyRevenue', 'dailyHoldersRevenue'] as const) {
    reqs.push({ key: `defillama.intents.${dt}`, source: 'defillama', ttlMs: HOUR, url: `${L}/summary/fees/near-intents?dataType=${dt}`, project: llamaSummary });
  }

  // ---- DefiLlama: chain fees, TVL and DEX volume for NEAR and peers.
  for (const p of PEER_CHAINS) {
    reqs.push({ key: `defillama.fees.${p.coin}`, source: 'defillama', ttlMs: HOUR, url: `${L}/summary/fees/${p.llamaFees}?dataType=dailyFees`, project: llamaSummary });
    reqs.push({
      key: `defillama.tvl.${p.coin}`, source: 'defillama', ttlMs: HOUR, url: `${L}/v2/historicalChainTvl/${p.llamaChain}`,
      project: (a) => asArr(a).map((d: any) => [Number(d.date), Number(d.tvl)]),
    });
    reqs.push({
      key: `defillama.dexs.${p.coin}`, source: 'defillama', ttlMs: HOUR,
      url: `${L}/overview/dexs/${p.llamaDex}?excludeTotalDataChart=false&excludeTotalDataChartBreakdown=true`,
      project: (j: any) => ({ chart: asArr(j?.totalDataChart).map((x: any) => [Number(x[0]), Number(x[1])]) }),
    });
  }
  reqs.push({ key: 'defillama.revenue.near', source: 'defillama', ttlMs: HOUR, url: `${L}/summary/fees/near?dataType=dailyRevenue`, project: llamaSummary });
  for (const slug of ['rhea-lend', 'rhea-dex']) {
    reqs.push({
      key: `defillama.protocol.${slug}`, source: 'defillama', ttlMs: HOUR, url: `${L}/protocol/${slug}`,
      project: (j: any) => ({
        name: j?.name ?? slug,
        tvl: asArr(j?.chainTvls?.Near?.tvl ?? j?.tvl).map((d: any) => [Number(d.date), Number(d.totalLiquidityUSD)]),
      }),
    });
  }
  reqs.push({
    key: 'defillama.stablecoins.near', source: 'defillama', ttlMs: HOUR, url: 'https://stablecoins.llama.fi/stablecoincharts/Near',
    project: (a) => asArr(a).map((d: any) => [Number(d.date), Number(d?.totalCirculatingUSD?.peggedUSD ?? NaN)]),
  });

  // ---- Three-digit ladder: where NEAR would rank, how the market values other tokens, and the size of the DEX market.
  reqs.push({
    key: 'coingecko.top', source: 'coingecko', ttlMs: HOUR, headers: cgHeaders,
    get url() { return `${cgBase()}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=40&page=1`; },
    project: (a) => asArr(a).map((c: any) => ({ id: String(c.id), symbol: String(c.symbol), name: String(c.name), marketCap: Number(c.market_cap), price: Number(c.current_price) })),
  });
  reqs.push({
    key: 'coingecko.global', source: 'coingecko', ttlMs: HOUR, headers: cgHeaders,
    get url() { return `${cgBase()}/global`; },
    project: (j: any) => ({ totalMarketCapUsd: Number(j?.data?.total_market_cap?.usd), btcDominancePct: Number(j?.data?.market_cap_percentage?.btc) }),
  });
  // Token economics (W4): a year of market caps and prices for every investable alternative (circulating
  // supply = market cap / price, one method for every asset), and holders revenue where it exists.
  for (const a of INVESTABLE.filter((x) => x.coin !== 'near')) {
    reqs.push({
      key: `coingecko.history.${a.coin}`, source: 'coingecko', ttlMs: 6 * HOUR, headers: cgHeaders,
      get url() { return `${cgBase()}/coins/${a.coin}/market_chart?vs_currency=usd&days=365&interval=daily`; },
      project: (j: any) => ({
        prices: asArr(j?.prices).map((p: any) => [Math.round(Number(p[0]) / 1000), Number(p[1])]),
        marketCaps: asArr(j?.market_caps).map((p: any) => [Math.round(Number(p[0]) / 1000), Math.round(Number(p[1]))]),
      }),
    });
  }
  reqs.push({
    key: 'coingecko.universe', source: 'coingecko', ttlMs: HOUR, headers: cgHeaders,
    get url() { return `${cgBase()}/coins/markets?vs_currency=usd&ids=${INVESTABLE.map((a) => a.coin).join(',')}`; },
    project: (a) => asArr(a).map((c: any) => ({
      id: String(c.id), marketCap: Number(c.market_cap), price: Number(c.current_price), circulating: Number(c.circulating_supply),
      totalSupply: c.total_supply === null ? null : Number(c.total_supply), maxSupply: c.max_supply === null ? null : Number(c.max_supply),
      fdv: c.fully_diluted_valuation === null ? null : Number(c.fully_diluted_valuation),
      volume24h: Number(c.total_volume),
    })),
  });
  // W1: market size history: all stablecoins, bridge aggregators, AI-agent payments (x402).
  reqs.push({
    key: 'defillama.stablecoins.all', source: 'defillama', ttlMs: 6 * HOUR, url: 'https://stablecoins.llama.fi/stablecoincharts/all',
    project: (a) => asArr(a).map((d: any) => [Number(d.date), Number(d?.totalCirculating?.peggedUSD ?? NaN)]),
  });
  reqs.push({ key: 'defillama.bridgeaggs.total', source: 'defillama', ttlMs: 6 * HOUR, url: `${L}/overview/bridge-aggregators?excludeTotalDataChart=false&excludeTotalDataChartBreakdown=true`,
    project: (j: any) => ({ chart: asArr(j?.totalDataChart).map((x: any) => [Number(x[0]), Number(x[1])]) }) });
  reqs.push({ key: 'defillama.x402.volume', source: 'defillama', ttlMs: 6 * HOUR, url: `${L}/summary/dexs/x402?dataType=dailyVolume`, project: llamaSummary });
  // W8 H1: fees by protocol on every investable chain (concentration of the fee base in its largest protocol).
  for (const c of CHAIN_ECONOMY.filter((x) => x.label !== 'NEAR')) {
    reqs.push({
      key: `defillama.fees.on.${c.label.toLowerCase()}`, source: 'defillama', ttlMs: 6 * HOUR, url: `${L}/overview/fees/${encodeURIComponent(c.chain)}?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`,
      project: (j: any) => asArr(j?.protocols).map((p: any) => ({ name: String(p.name), parent: p.parentProtocol ? String(p.parentProtocol) : null, category: String(p.category ?? ''), fees30d: Number(p.total30d ?? 0) })).filter((p: any) => p.fees30d > 0),
    });
  }
  // W3: Near Perps (Hyperliquid builder-code front end listed by DefiLlama as an interface).
  for (const dt of ['dailyFees', 'dailyHoldersRevenue'] as const) reqs.push({ key: `defillama.perps.near.${dt}`, source: 'defillama', ttlMs: 6 * HOUR, url: `${L}/summary/fees/near-perps?dataType=${dt}`, project: llamaSummary });
  // W3: fees by protocol on the NEAR chain.
  reqs.push({
    key: 'defillama.fees.onnear', source: 'defillama', ttlMs: 6 * HOUR, url: `${L}/overview/fees/near?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`,
    project: (j: any) => asArr(j?.protocols).map((p: any) => ({ name: String(p.name), category: String(p.category ?? ''), fees30d: Number(p.total30d ?? 0), fees1y: p.total1y === undefined || p.total1y === null ? null : Number(p.total1y) })),
  });
  // W2: cross-chain competitors (volume, fees, revenue, holders revenue) and their tokens.
  for (const c of CROSS_CHAIN) {
    if (c.slug === 'near-intents') continue;
    if (c.volume) reqs.push({ key: `defillama.ccvol.${c.slug}`, source: 'defillama', ttlMs: 6 * HOUR, url: `${L}/summary/${c.volume}/${encodeURIComponent(c.slug)}${c.volume === 'dexs' ? '?dataType=dailyVolume' : ''}`, project: llamaSummary });
    for (const dt of ['dailyFees', 'dailyRevenue', 'dailyHoldersRevenue'] as const) {
      if (dt === 'dailyHoldersRevenue' && 'noHolders' in c) continue; // DefiLlama tracks no holders revenue for it
      reqs.push({ key: `defillama.ccfees.${c.slug}.${dt}`, source: 'defillama', ttlMs: 6 * HOUR, url: `${L}/summary/fees/${encodeURIComponent(c.slug)}?dataType=${dt}`, project: llamaSummary });
    }
  }
  reqs.push({
    key: 'coingecko.crosschain', source: 'coingecko', ttlMs: HOUR, headers: cgHeaders,
    get url() { return `${cgBase()}/coins/markets?vs_currency=usd&ids=${CROSS_CHAIN.map((c) => c.coin).filter(Boolean).join(',')}`; },
    project: (a) => asArr(a).map((c: any) => ({ id: String(c.id), symbol: String(c.symbol), marketCap: Number(c.market_cap), fdv: c.fully_diluted_valuation === null ? null : Number(c.fully_diluted_valuation) })),
  });
  // Platform economy history (W6): stablecoins and DeFi TVL on each investable chain.
  for (const c of CHAIN_ECONOMY) {
    reqs.push({
      key: `defillama.chaintvl.${c.label.toLowerCase()}`, source: 'defillama', ttlMs: 6 * HOUR, url: `${L}/v2/historicalChainTvl/${encodeURIComponent(c.chain)}`,
      project: (a) => asArr(a).map((d: any) => [Number(d.date), Number(d.tvl)]),
    });
    reqs.push({
      key: `defillama.stablechart.${c.label.toLowerCase()}`, source: 'defillama', ttlMs: 6 * HOUR, url: `https://stablecoins.llama.fi/stablecoincharts/${encodeURIComponent(c.chain)}`,
      project: (a) => asArr(a).map((d: any) => [Number(d.date), Number(d?.totalCirculatingUSD?.peggedUSD ?? NaN)]),
    });
  }
  const peerSlugs = new Set<string>(VALUATION_PEERS.map((p) => p.llama));
  for (const a of INVESTABLE) if (a.llama && !peerSlugs.has(a.llama)) peerSlugs.add(a.llama);
  for (const slug of peerSlugs) {
    reqs.push({ key: `defillama.holders.${slug}`, source: 'defillama', ttlMs: 6 * HOUR, url: `${L}/summary/fees/${slug}?dataType=dailyHoldersRevenue`, project: llamaSummary });
  }
  reqs.push({
    key: 'defillama.dexs.total', source: 'defillama', ttlMs: 6 * HOUR, url: `${L}/overview/dexs?excludeTotalDataChart=false&excludeTotalDataChartBreakdown=true`,
    project: (j: any) => ({ chart: asArr(j?.totalDataChart).map((x: any) => [Number(x[0]), Number(x[1])]) }),
  });
  // DefiLlama's "DEX" overview mixes categories (spot DEXs, prediction markets, bridges such as NEAR Intents,
  // launchpads, trading apps). The per-protocol breakdown is summed per day by each protocol's DefiLlama
  // category, so shares use a denominator with a stated definition (amendment 6, section 7).
  reqs.push({
    key: 'defillama.dexs.categories', source: 'defillama', ttlMs: 6 * HOUR, url: `${L}/overview/dexs?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=false`,
    project: (j: any) => {
      const cat = new Map<string, string>();
      for (const p of asArr(j?.protocols)) { const c = String(p?.category ?? 'Unknown'); if (p?.name) cat.set(String(p.name), c); if (p?.displayName) cat.set(String(p.displayName), c); }
      const crossChain = asArr(j?.protocols).filter((p: any) => DEX_CROSS_CHAIN_CATEGORIES.includes(p?.category)).map((p: any) => String(p.name)).sort();
      const chart = asArr(j?.totalDataChartBreakdown).map((row: any) => {
        const sums: Record<string, number> = {};
        for (const [name, v] of Object.entries(row?.[1] ?? {})) { const n = Number(v); if (!Number.isFinite(n)) continue; const c = cat.get(name) ?? 'Unknown'; sums[c] = (sums[c] ?? 0) + n; }
        for (const k of Object.keys(sums)) sums[k] = Math.round(sums[k]!);
        return [Number(row?.[0]), sums];
      });
      // Concentration (W1): trailing-year volume of the largest spot DEX protocols, and the category total.
      const spot = asArr(j?.protocols).filter((p: any) => p?.category === DEX_SPOT_CATEGORY && Number.isFinite(Number(p?.total1y)));
      const spotTop = spot.map((p: any) => ({ name: String(p.name), parent: p.parentProtocol ? String(p.parentProtocol) : null, total1y: Number(p.total1y) })).sort((a: any, b: any) => b.total1y - a.total1y).slice(0, 25);
      return { crossChainMembers: crossChain, chart, spotTop, spotTotal1y: spot.reduce((a: number, p: any) => a + Number(p.total1y), 0) };
    },
  });
  reqs.push({
    key: 'defillama.chains', source: 'defillama', ttlMs: 6 * HOUR, url: `${L}/v2/chains`,
    project: (a) => asArr(a).filter((c: any) => PLATFORM_CHAINS.includes(c?.name)).map((c: any) => ({ name: String(c.name), tvl: Number(c.tvl) })),
  });
  reqs.push({
    key: 'defillama.stablecoinchains', source: 'defillama', ttlMs: 6 * HOUR, url: 'https://stablecoins.llama.fi/stablecoinchains',
    project: (a) => asArr(a).filter((c: any) => PLATFORM_CHAINS.includes(c?.name)).map((c: any) => ({ name: String(c.name), stablecoinsUsd: Number(c?.totalCirculatingUSD?.peggedUSD ?? NaN) })),
  });

  // ---- NearBlocks: daily chain activity.
  reqs.push({
    key: 'nearblocks.charts', source: 'nearblocks', ttlMs: HOUR, url: `${SOURCES.nearblocks.baseUrl}/charts`,
    headers: (): Record<string, string> => (process.env.NEARBLOCKS_API_KEY ? { authorization: `Bearer ${process.env.NEARBLOCKS_API_KEY}` } : {}),
    project: (j: any) => asArr(j?.charts).map((c: any) => ({
      date: String(c.date).slice(0, 10), txns: Number(c.txns), activeAccounts: Number(c.active_accounts),
      newAccounts: Number(c.new_accounts), feeUsd: Number(c.txn_fee_usd), circulatingYocto: String(c.circulating_supply),
      totalSupplyYocto: String(c.total_supply), price: Number(c.near_price),
    })),
  });

  // ---- DefiLlama coins: daily price history for NEAR and BTC (market context for pivot windows).
  // The API returns at most 500 points per request, so history is split into fixed 400-day chunks
  // per coin. Closed chunks never change and are fetched once; the open chunk refreshes every 6 hours.
  reqs.push(...buildPriceRequests());

  // ---- NEAR RPC: supply, inflation parameters and the buyback wallet.
  reqs.push(rpc('near-rpc.block', 'block', { finality: 'final' }, (r) => ({
    height: Number(r.header.height), timestampNs: String(r.header.timestamp_nanosec), totalSupplyYocto: String(r.header.total_supply),
  })));
  reqs.push(rpc('near-rpc.protocol-config', 'EXPERIMENTAL_protocol_config', { finality: 'final' }, (r) => ({
    protocolVersion: r.protocol_version, maxInflationRate: r.max_inflation_rate, protocolRewardRate: r.protocol_reward_rate,
  })));
  // W3: Chain Signatures MPC network (participants, threshold, domains).
  reqs.push(rpc('near-rpc.signer-state', 'query', { request_type: 'call_function', finality: 'final', account_id: 'v1.signer', method_name: 'state', args_base64: b64({}) }, (r) => {
    const st = JSON.parse(Buffer.from(r.result).toString())?.Running ?? {};
    const doms = asArr(st?.domains?.domains);
    return { participants: asArr(st?.parameters?.participants?.participants).length, threshold: Number(st?.parameters?.threshold ?? doms[0]?.reconstruction_threshold ?? NaN), domains: doms.length, blockHeight: Number(r.block_height) };
  }));
  reqs.push(rpc('near-rpc.validators', 'validators', [null], (r) => ({
    epochHeight: Number(r.epoch_height), epochStartHeight: Number(r.epoch_start_height),
    currentStakeYocto: asArr(r.current_validators).map((v: any) => String(v.stake)),
    proposals: asArr(r.current_proposals).length, currentCount: asArr(r.current_validators).length,
  })));
  reqs.push(rpc('near-rpc.buyback-wallet', 'query', { request_type: 'view_account', finality: 'final', account_id: BUYBACK_WALLET }, (r) => ({
    account: BUYBACK_WALLET, amountYocto: String(r.amount), lockedYocto: String(r.locked), blockHeight: Number(r.block_height),
  })));
  reqs.push(rpc('near-rpc.buyback-wnear', 'query', {
    request_type: 'call_function', finality: 'final', account_id: 'wrap.near', method_name: 'ft_balance_of', args_base64: b64({ account_id: BUYBACK_WALLET }),
  }, (r) => ({ account: BUYBACK_WALLET, balance: JSON.parse(Buffer.from(r.result).toString()), blockHeight: Number(r.block_height) })));

  // ---- NEAR Intents Explorer (partner JWT): a sample of recent successful swaps.
  reqs.push({
    key: 'intents-explorer.recent', source: 'intents-explorer', ttlMs: HOUR,
    url: `${SOURCES['intents-explorer'].baseUrl}/transactions?numberOfTransactions=1000&statuses=SUCCESS`,
    headers: () => (process.env.INTENTS_EXPLORER_JWT ? { authorization: `Bearer ${process.env.INTENTS_EXPLORER_JWT}` } : null),
    unavailable: () => (process.env.INTENTS_EXPLORER_JWT ? null : 'INTENTS_EXPLORER_JWT is not configured (partner JWT from partners.near-intents.org).'),
    project: (a) => asArr(a).map((t: any) => ({
      createdAt: String(t.createdAt), amountInUsd: Number(t.amountInUsd), amountOutUsd: Number(t.amountOutUsd),
      referral: t.referral ?? null, appFeeRecipients: asArr(t.appFees).map((f: any) => String(f.recipient)),
      originAsset: String(t.originAsset), destinationAsset: String(t.destinationAsset),
    })),
  });

  return reqs;
}

export function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

/** Stable JSON: object keys sorted, so equal content always hashes equally. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
}

// ---------------------------------------------------------------- era activity (Section 1: Did it last?)

/** Daily price history starts 2022-09-01, before the first pivot measured (BOS, Feb 2023). */
export const PRICE_HISTORY_START_UNIX = Date.UTC(2022, 8, 1) / 1000;

/**
 * Representative contract per strategic era. First-activity months were read from NearBlocks
 * (oldest transaction for each account) and are fixed here so request keys stay stable.
 */
/**
 * One representative product per era. NearBlocks eras count monthly transactions involving the contract;
 * NearBlocks returns a query-planner estimate (marked by a `cost` field) instead of a count for busy
 * contracts in older months, so those months are flagged and never scored. Intents is measured by
 * DefiLlama swap volume, which is exact daily data from its first day of coverage and a better measure of use.
 */
export const ERA_CONTRACTS = [
  { id: 'social', account: 'social.near', era: 'Social / BOS', firstMonth: '2021-02', source: 'nearblocks', metric: 'transactions per month', unit: 'count',
    sourceName: 'NearBlocks', sourceUrl: 'https://nearblocks.io/address/social.near',
    note: 'SocialDB contract behind NEAR Social and BOS components. Newer near.social storage paths are not included.' },
  { id: 'signer', account: 'v1.signer', era: 'Chain Abstraction (Chain Signatures)', firstMonth: '2024-07', source: 'nearblocks', metric: 'transactions per month', unit: 'count',
    sourceName: 'NearBlocks', sourceUrl: 'https://nearblocks.io/address/v1.signer',
    note: 'Chain Signatures MPC contract (created 2024-07-31, mainnet 2024-08-08). Counts include MPC node response transactions, not only user sign requests.' },
  { id: 'intents', account: 'intents.near', era: 'Intents', firstMonth: '2024-12', source: 'defillama-volume', metric: 'swap volume per month (USD)', unit: 'USD',
    sourceName: 'DefiLlama', sourceUrl: 'https://defillama.com/protocol/near-intents',
    note: 'NEAR Intents swap volume from DefiLlama, whose coverage starts on 2024-12-10, a month after the beta launch. Volume is used instead of intents.near transaction counts, which mix relayer and solver batching with use and are NearBlocks estimates before April 2026.' },
] as const;

export type EraId = (typeof ERA_CONTRACTS)[number]['id'];

/** Complete calendar months from `first` up to the month before `now`, as YYYY-MM. */
export function completeMonths(first: string, now = new Date()): string[] {
  const out: string[] = [];
  let [y, m] = first.split('-').map(Number) as [number, number];
  const endY = now.getUTCFullYear();
  const endM = now.getUTCMonth() + 1;
  while (y < endY || (y === endY && m < endM)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return out;
}

function nextMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number) as [number, number];
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
}

/**
 * One request per contract per complete month. Closed months do not change, so they carry
 * a long freshness window and are fetched once. These are "background" requests: the
 * scheduled refresh and the research CLI fetch them; debate snapshots read stored copies.
 */
export function buildEraRequests(now = new Date()): HttpRequestDef[] {
  const reqs: HttpRequestDef[] = [];
  for (const c of ERA_CONTRACTS) {
    if (c.source !== 'nearblocks') continue;
    for (const ym of completeMonths(c.firstMonth, now)) {
      reqs.push({
        key: `nearblocks.era.${c.id}.${ym}`, source: 'nearblocks', ttlMs: 180 * 24 * HOUR,
        url: `${SOURCES.nearblocks.baseUrl}/account/${c.account}/txns-only/count?after_date=${ym}-01&before_date=${nextMonth(ym)}-01`,
        headers: (): Record<string, string> => (process.env.NEARBLOCKS_API_KEY ? { authorization: `Bearer ${process.env.NEARBLOCKS_API_KEY}` } : {}),
        project: (j: any) => {
          const row = asArr(j?.txns)[0];
          const n = Number(row?.count);
          if (!Number.isFinite(n)) throw new Error('NearBlocks count missing');
          // NearBlocks adds a `cost` field when it returns a query-planner estimate instead of an exact count.
          return { account: c.account, month: ym, txns: n, estimated: row != null && typeof row === 'object' && 'cost' in row };
        },
      });
    }
  }
  return reqs;
}

/** The buyback wallet was created on this day (NearBlocks account record); no transfers exist before it. */
export const BUYBACK_WALLET_CREATED = '2026-03-18';

/** Background requests (era months). Fetched by the scheduled refresh and the research CLI. */
export function buildBackgroundRequests(now = new Date()): HttpRequestDef[] {
  return buildEraRequests(now);
}

/** Daily price history for every investable alternative (W6 risk metrics: volatility, drawdown, correlation). */
export const PRICE_COINS = ['near', 'bitcoin', 'ethereum', 'solana', 'sui', 'avalanche-2', 'the-open-network', 'aptos', 'hyperliquid'] as const;
const PRICE_CHUNK_DAYS = 400;

/** Fixed price-history chunks: start dates are deterministic so request keys stay stable. */
export function buildPriceRequests(now = new Date()): HttpRequestDef[] {
  const reqs: HttpRequestDef[] = [];
  const nowSec = Math.floor(now.getTime() / 1000);
  for (let start = PRICE_HISTORY_START_UNIX; start < nowSec; start += PRICE_CHUNK_DAYS * 86_400) {
    const closed = start + PRICE_CHUNK_DAYS * 86_400 < nowSec - 86_400;
    const day = new Date(start * 1000).toISOString().slice(0, 10);
    for (const coin of PRICE_COINS) {
      reqs.push({
        key: `defillama.coins.${coin}.${day}`, source: 'defillama', ttlMs: closed ? 180 * 24 * HOUR : 6 * HOUR,
        url: `https://coins.llama.fi/chart/coingecko:${coin}?start=${start}&span=${PRICE_CHUNK_DAYS}&period=1d`,
        project: (j: any) => ({ coin, prices: asArr(j?.coins?.[`coingecko:${coin}`]?.prices).map((p: any) => [Number(p.timestamp), Number(p.price)]) }),
      });
    }
  }
  return reqs;
}
