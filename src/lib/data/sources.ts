/**
 * Declarative catalog of every external request NEBUBE makes. Nothing outside this file
 * chooses a URL, so the full set of data dependencies (and the SSRF surface) is auditable
 * in one place. User input never reaches a URL: topics select request keys from this list.
 */
import { createHash } from 'node:crypto';

export type SourceId = 'coingecko' | 'defillama' | 'nearblocks' | 'near-rpc' | 'intents-explorer' | 'bigquery';

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
    docsUrl: 'https://docs.coingecko.com/reference/introduction', requiresCredential: false, minGapMs: 2_500,
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

  // ---- NearBlocks: daily chain activity.
  reqs.push({
    key: 'nearblocks.charts', source: 'nearblocks', ttlMs: HOUR, url: `${SOURCES.nearblocks.baseUrl}/charts`,
    headers: (): Record<string, string> => (process.env.NEARBLOCKS_API_KEY ? { authorization: `Bearer ${process.env.NEARBLOCKS_API_KEY}` } : {}),
    project: (j: any) => asArr(j?.charts).map((c: any) => ({
      date: String(c.date).slice(0, 10), txns: Number(c.txns), activeAccounts: Number(c.active_accounts),
      newAccounts: Number(c.new_accounts), feeUsd: Number(c.txn_fee_usd), circulatingYocto: String(c.circulating_supply),
    })),
  });

  // ---- NEAR RPC: supply, inflation parameters and the buyback wallet.
  reqs.push(rpc('near-rpc.block', 'block', { finality: 'final' }, (r) => ({
    height: Number(r.header.height), timestampNs: String(r.header.timestamp_nanosec), totalSupplyYocto: String(r.header.total_supply),
  })));
  reqs.push(rpc('near-rpc.protocol-config', 'EXPERIMENTAL_protocol_config', { finality: 'final' }, (r) => ({
    protocolVersion: r.protocol_version, maxInflationRate: r.max_inflation_rate, protocolRewardRate: r.protocol_reward_rate,
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
