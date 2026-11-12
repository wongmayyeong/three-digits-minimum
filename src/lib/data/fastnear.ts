/**
 * NEAR's revenue wallets, reconstructed onchain from FastNEAR's transaction API (an independent indexer of NEAR
 * blocks): every NEAR and wNEAR movement into or out of the three wallets DefiLlama's NEAR Intents adapter treats
 * as captured revenue (its Dune query 6740088): the front-end fund, the 1Click fund and the buyback wallet.
 *
 * For each wallet: list every transaction involving it, read each transaction's receipts, and keep
 * - native NEAR transfers into or out of the wallet (gas refunds from "system" and wrapping via wrap.near excluded);
 * - wNEAR ft_transfer / ft_transfer_call receipts on wrap.near whose sender or receiver is the wallet.
 *
 * Stored as one raw record (`fastnear.revenue-wallets`) with its SHA-256, so the offline rebuild reproduces it.
 */
import { sha256, stableStringify } from './sources';
import type { RawRecord, RawStore } from './fetcher';

export const FASTNEAR_TX = 'https://tx.main.fastnear.com/v0';
export const BUYBACK_KEY = 'fastnear.revenue-wallets';
export const FRONTEND_FUND = 'fefundsadmin.sputnik-dao.near';
export const ONECLICK_FUND = '1csfundsadmin.sputnik-dao.near';
export const BUYBACK_WALLET_ID = 'buybacks.multisignature.near';
export const REVENUE_WALLETS = [FRONTEND_FUND, ONECLICK_FUND, BUYBACK_WALLET_ID] as const;
const BATCH = 20; // FastNEAR's per-request limit for transaction details
const GAP_MS = 250;

export interface WalletFlow { wallet: string; dir: 'in' | 'out'; counterparty: string; kind: 'near' | 'wnear'; yocto: string; ts: string; tx: string; ok: boolean }
export interface RevenueWalletsBody { wallets: string[]; maxBlockHeight: Record<string, number>; txCount: Record<string, number>; flows: WalletFlow[] }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* eslint-disable @typescript-eslint/no-explicit-any */
async function post(path: string, body: unknown, attempt = 0): Promise<any> {
  await sleep(GAP_MS);
  const res = await fetch(`${FASTNEAR_TX}/${path}`, {
    method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json', 'user-agent': 'nebube-research' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(60_000),
  });
  if ((res.status === 429 || res.status >= 500) && attempt < 4) { await sleep(3_000 * (attempt + 1)); return post(path, body, attempt + 1); }
  if (!res.ok) throw new Error(`FastNEAR ${path} HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
  return res.json();
}

async function listTxs(account: string): Promise<{ hashes: string[]; maxHeight: number; total: number }> {
  const out: string[] = [];
  let resume: string | null = null, maxHeight: number | null = null, total = 0;
  for (let page = 0; page < 500; page++) {
    const j: any = await post('account', { account_id: account, ...(maxHeight ? { max_block_height: maxHeight } : {}), ...(resume ? { resume_token: resume } : {}) });
    const rows: any[] = Array.isArray(j?.account_txs) ? j.account_txs : [];
    if (maxHeight === null) { maxHeight = rows[0]?.tx_block_height ?? 0; total = Number(j?.txs_count ?? 0); }
    for (const r of rows) out.push(String(r.transaction_hash));
    resume = j?.resume_token ?? null;
    if (!resume || !rows.length) break;
  }
  const unique = [...new Set(out)];
  if (total && unique.length < total) throw new Error(`${account}: listed ${unique.length} of ${total} transactions`);
  return { hashes: unique, maxHeight: maxHeight ?? 0, total };
}

const succeeded = (r: any) => { const st = r?.execution_outcome?.outcome?.status ?? {}; return 'SuccessValue' in st || 'SuccessReceiptId' in st; };

/** Fetches (online) or reads (offline) the revenue-wallet flows. Never substitutes a value. */
export async function fetchBuybackTransfers(store: RawStore, opts: { offline: boolean }): Promise<RawRecord | null> {
  const cached = await store.latest(BUYBACK_KEY);
  if (opts.offline) return cached;
  try {
    const flows: WalletFlow[] = [];
    const maxBlockHeight: Record<string, number> = {}, txCount: Record<string, number> = {};
    const seen = new Set<string>();
    const all: string[] = [];
    for (const w of REVENUE_WALLETS) {
      const l = await listTxs(w);
      maxBlockHeight[w] = l.maxHeight; txCount[w] = l.total;
      for (const h of l.hashes) if (!seen.has(h)) { seen.add(h); all.push(h); }
    }
    const isW = (a: string) => (REVENUE_WALLETS as readonly string[]).includes(a);
    for (let i = 0; i < all.length; i += BATCH) {
      const j: any = await post('transactions', { tx_hashes: all.slice(i, i + BATCH) });
      for (const t of Array.isArray(j?.transactions) ? j.transactions : []) {
        const hash = String(t?.transaction?.hash ?? '');
        for (const r of Array.isArray(t?.receipts) ? t.receipts : []) {
          const rc = r?.receipt; const from = String(rc?.predecessor_id ?? ''), to = String(rc?.receiver_id ?? '');
          const ts = String(r?.execution_outcome?.block_timestamp ?? t?.execution_outcome?.block_timestamp ?? '');
          for (const a of rc?.receipt?.Action?.actions ?? []) {
            // Native NEAR transfers (gas refunds and wrapping excluded).
            const dep = a?.Transfer?.deposit;
            if (typeof dep === 'string' && /^\d+$/.test(dep) && dep !== '0' && from !== 'system' && from !== 'wrap.near' && to !== 'wrap.near') {
              if (isW(to)) flows.push({ wallet: to, dir: 'in', counterparty: from, kind: 'near', yocto: dep, ts, tx: hash, ok: succeeded(r) });
              if (isW(from)) flows.push({ wallet: from, dir: 'out', counterparty: to, kind: 'near', yocto: dep, ts, tx: hash, ok: succeeded(r) });
            }
            // wNEAR transfers.
            const fc = a?.FunctionCall;
            if (to === 'wrap.near' && (fc?.method_name === 'ft_transfer' || fc?.method_name === 'ft_transfer_call')) {
              let args: any = null; try { args = JSON.parse(Buffer.from(String(fc.args), 'base64').toString()); } catch { args = null; }
              const recv = String(args?.receiver_id ?? ''), amt = String(args?.amount ?? '');
              if (/^\d+$/.test(amt) && amt !== '0') {
                if (isW(recv)) flows.push({ wallet: recv, dir: 'in', counterparty: from, kind: 'wnear', yocto: amt, ts, tx: hash, ok: succeeded(r) });
                if (isW(from)) flows.push({ wallet: from, dir: 'out', counterparty: recv, kind: 'wnear', yocto: amt, ts, tx: hash, ok: succeeded(r) });
              }
            }
          }
        }
      }
    }
    // A flow seen from two wallets' listings is one flow.
    const key = (f: WalletFlow) => `${f.tx}|${f.wallet}|${f.dir}|${f.counterparty}|${f.kind}|${f.yocto}|${f.ts}`;
    const uniq = [...new Map(flows.map((f) => [key(f), f])).values()].sort((a, b) => a.ts.localeCompare(b.ts) || key(a).localeCompare(key(b)));
    const body: RevenueWalletsBody = { wallets: [...REVENUE_WALLETS], maxBlockHeight, txCount, flows: uniq };
    const text = stableStringify(body);
    const record: RawRecord = { key: BUYBACK_KEY, source: 'fastnear', url: `${FASTNEAR_TX}/account`, sha256: sha256(text), fetchedAt: new Date().toISOString(), body: JSON.parse(text) };
    await store.put(record);
    return record;
  } catch (e) {
    console.warn(`  FAILED       ${BUYBACK_KEY}  (${(e as Error).message}${cached ? `; using stored copy from ${cached.fetchedAt}` : ''})`);
    return cached;
  }
}
