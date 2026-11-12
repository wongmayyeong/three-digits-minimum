/**
 * Executed buybacks, reconstructed onchain from FastNEAR's transaction API (an independent indexer of NEAR
 * blocks). Lists every transaction touching the buyback wallet, then reads each one's receipts and keeps the
 * NEAR transfers into the wallet with exact yoctoNEAR amounts.
 *
 * The result is stored as one raw record (`fastnear.buybacks`) with its SHA-256, like every other source, so the
 * offline rebuild reproduces it without the network. Paging is anchored at a fixed block height
 * (max_block_height = the newest transaction seen at fetch time), so a run is internally consistent.
 */
import { BUYBACK_WALLET, sha256, stableStringify } from './sources';
import type { RawRecord, RawStore } from './fetcher';

export const FASTNEAR_TX = 'https://tx.main.fastnear.com/v0';
export const BUYBACK_KEY = 'fastnear.buybacks';
const BATCH = 20; // FastNEAR's per-request limit for transaction details
const GAP_MS = 250;

export interface BuybackTransfer { tx: string; height: number; ts: string; from: string; yocto: string; ok: boolean }
export interface BuybackRecordBody { account: string; maxBlockHeight: number; txCount: number; transfers: BuybackTransfer[] }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* eslint-disable @typescript-eslint/no-explicit-any */
async function post(path: string, body: unknown, attempt = 0): Promise<any> {
  await sleep(GAP_MS);
  const res = await fetch(`${FASTNEAR_TX}/${path}`, {
    method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json', 'user-agent': 'nebube-research' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(45_000),
  });
  if ((res.status === 429 || res.status >= 500) && attempt < 4) { await sleep(3_000 * (attempt + 1)); return post(path, body, attempt + 1); }
  if (!res.ok) throw new Error(`FastNEAR ${path} HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
  return res.json();
}

/** Fetches (online) or reads (offline) the buyback transfer record. Never substitutes a value. */
export async function fetchBuybackTransfers(store: RawStore, opts: { offline: boolean }): Promise<RawRecord | null> {
  const cached = await store.latest(BUYBACK_KEY);
  if (opts.offline) return cached;
  try {
    // 1. Every transaction where the wallet is a receiver, newest first, anchored at a fixed height.
    const txs: { hash: string; height: number }[] = [];
    let resume: string | null = null;
    let maxHeight: number | null = null;
    let total = 0;
    for (let page = 0; page < 200; page++) {
      const j: any = await post('account', { account_id: BUYBACK_WALLET, is_receiver: true, ...(maxHeight ? { max_block_height: maxHeight } : {}), ...(resume ? { resume_token: resume } : {}) });
      const rows: any[] = Array.isArray(j?.account_txs) ? j.account_txs : [];
      if (maxHeight === null) { maxHeight = rows[0]?.tx_block_height ?? null; total = Number(j?.txs_count ?? 0); }
      for (const r of rows) txs.push({ hash: String(r.transaction_hash), height: Number(r.tx_block_height) });
      resume = j?.resume_token ?? null;
      if (!resume || !rows.length) break;
    }
    const unique = [...new Map(txs.map((t) => [t.hash, t])).values()];
    if (total && unique.length < total) throw new Error(`listed ${unique.length} of ${total} transactions`);
    // 2. Receipts of each transaction: keep NEAR transfers into the wallet.
    const transfers: BuybackTransfer[] = [];
    for (let i = 0; i < unique.length; i += BATCH) {
      const j: any = await post('transactions', { tx_hashes: unique.slice(i, i + BATCH).map((t) => t.hash) });
      for (const t of Array.isArray(j?.transactions) ? j.transactions : []) {
        const hash = String(t?.transaction?.hash ?? '');
        const height = Number(t?.execution_outcome?.block_height ?? unique.find((u) => u.hash === hash)?.height ?? 0);
        const ts = String(t?.execution_outcome?.block_timestamp ?? '');
        for (const r of Array.isArray(t?.receipts) ? t.receipts : []) {
          const rc = r?.receipt;
          if (rc?.receiver_id !== BUYBACK_WALLET) continue;
          const status = r?.execution_outcome?.outcome?.status ?? {};
          const ok = 'SuccessValue' in status || 'SuccessReceiptId' in status;
          for (const a of rc?.receipt?.Action?.actions ?? []) {
            const dep = a?.Transfer?.deposit;
            if (typeof dep === 'string' && /^\d+$/.test(dep)) transfers.push({ tx: hash, height, ts: String(r?.execution_outcome?.block_timestamp ?? ts), from: String(rc.predecessor_id), yocto: dep, ok });
          }
        }
      }
    }
    transfers.sort((a, b) => a.height - b.height || a.tx.localeCompare(b.tx));
    const body: BuybackRecordBody = { account: BUYBACK_WALLET, maxBlockHeight: maxHeight ?? 0, txCount: unique.length, transfers };
    const text = stableStringify(body);
    const record: RawRecord = { key: BUYBACK_KEY, source: 'fastnear', url: `${FASTNEAR_TX}/account`, sha256: sha256(text), fetchedAt: new Date().toISOString(), body: JSON.parse(text) };
    await store.put(record);
    return record;
  } catch (e) {
    console.warn(`  FAILED       ${BUYBACK_KEY}  (${(e as Error).message}${cached ? `; using stored copy from ${cached.fetchedAt}` : ''})`);
    return cached;
  }
}
