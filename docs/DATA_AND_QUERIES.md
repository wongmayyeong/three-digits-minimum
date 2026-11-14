# Data and queries

This document lets a technical reviewer trace every number in [THESIS.md](../THESIS.md) to the request that produced it. Method: [METHODOLOGY.md](METHODOLOGY.md). Rebuild steps: [REPRODUCIBILITY.md](REPRODUCIBILITY.md). Coverage gaps: [LIMITATIONS.md](LIMITATIONS.md).

**Snapshot at a glance**

| Item | Value |
|---|---|
| Stored responses | 262 (`artifacts/research/raw/*.json`), listed in `raw/manifest.json` |
| Retrieved | 2026-11-08 19:52 UTC to 2026-11-12 15:56 UTC |
| Flow window | 90 days ending 2026-11-10 |
| Evidence items | 539 (522 available) in `canonical.json` |
| `canonical.json` SHA-256 | `3f16cb62c559b7be478b5fe862c30cd6593b6dde73f5ade16b00757cea579cc7` |
| `raw/manifest.json` SHA-256 | `03383741f299892d58aa39591915d7dbc4458a92c9bad5d4f284952036750983` |

Responses by source: DefiLlama 143, NearBlocks 98, CoinGecko 14, NEAR RPC 6, FastNEAR 1 (the revenue-wallet reconstruction).

---

## 1. Data providers

| Provider | Base URL | Documentation | Credential | Used in snapshot |
|---|---|---|---|---|
| CoinGecko | `https://api.coingecko.com/api/v3` | https://docs.coingecko.com/reference/introduction | Optional demo or pro key | Yes |
| DefiLlama | `https://api.llama.fi`, `https://stablecoins.llama.fi`, `https://coins.llama.fi` | https://api-docs.defillama.com/ | None | Yes |
| NearBlocks | `https://api.nearblocks.io/v1` | https://api.nearblocks.io/api-docs | Optional key | Yes |
| NEAR JSON-RPC (FastNEAR) | `https://free.rpc.fastnear.com` | https://docs.near.org/api/rpc/introduction | None | Yes |
| FastNEAR transactions API | `https://tx.main.fastnear.com/v0` | https://github.com/fastnear/explorer-api | None | Yes |
| NEAR Intents Explorer | `https://explorer.near-intents.org/api/v0` | https://docs.near-intents.org/integration/distribution-channels/1click-api/explorer/introduction | Partner JWT | **No** (no JWT configured) |
| Google BigQuery | `bigquery-public-data.crypto_near_mainnet_us` | https://docs.near.org/data-infrastructure/big-query | GCP project | **No** (never run) |

All URLs are defined in one file, [`src/lib/data/sources.ts`](../src/lib/data/sources.ts), plus the FastNEAR collector in [`src/lib/data/fastnear.ts`](../src/lib/data/fastnear.ts). No API key appears in any stored URL.

## 2. Endpoints used

| Request key (pattern) | Endpoint | Count | Fields kept |
|---|---|---|---|
| `coingecko.markets`, `coingecko.universe`, `coingecko.crosschain` | `GET /coins/markets?vs_currency=usd&ids=…` | 3 | price, market cap, circulating and total supply, FDV |
| `coingecko.top` | `GET /coins/markets?vs_currency=usd&order=market_cap_desc&per_page=40&page=1` | 1 | top-40 market caps (rank) |
| `coingecko.global` | `GET /global` | 1 | total crypto market cap |
| `coingecko.near.history`, `coingecko.history.<coin>` | `GET /coins/<id>/market_chart?vs_currency=usd&days=365&interval=daily` | 9 | daily price and market cap |
| `defillama.intents.volume` | `GET /summary/dexs/near-intents?dataType=dailyVolume` | 1 | daily Intents volume |
| `defillama.intents.<dataType>` | `GET /summary/fees/near-intents?dataType=dailyFees \| dailyRevenue \| dailyHoldersRevenue` | 3 | daily fees, captured revenue, designated buybacks |
| `defillama.revenue.near`, `defillama.fees.<chain>` | `GET /summary/fees/<chain>?dataType=…` | 5 | NEAR burns; chain fees |
| `defillama.holders.<chain>` | `GET /summary/fees/<chain>?dataType=dailyHoldersRevenue` | 9 | holders revenue for every multiple |
| `defillama.dexs.categories`, `defillama.dexs.total` | `GET /overview/dexs?…` | 2 | per-protocol daily volume by category; all-DEX volume |
| `defillama.dexs.<chain>` | `GET /overview/dexs/<chain>?…` | 4 | DEX volume by chain |
| `defillama.fees.onnear`, `defillama.fees.on.<chain>` | `GET /overview/fees/<chain>?…` | 8 | fees by protocol on each chain (H1) |
| `defillama.ccfees.<slug>.<dataType>`, `defillama.ccvol.<slug>` | `GET /summary/fees/<slug>`, `/summary/dexs/<slug>`, `/summary/bridge-aggregators/<slug>` | 45 | cross-chain fees, revenue, holders revenue, volume |
| `defillama.chains`, `defillama.chaintvl.<chain>` | `GET /v2/chains`, `/v2/historicalChainTvl/<chain>` | 9 | TVL |
| `defillama.stablecoinchains`, `defillama.stablechart.<chain>` | `stablecoins.llama.fi/stablecoinchains`, `/stablecoincharts/<chain>` | 11 | stablecoins by chain |
| `defillama.coins.<coin>.<chunk>` | `coins.llama.fi/chart/coingecko:<id>?start=…&span=400&period=1d` | 36 | daily prices in 400-day chunks |
| `defillama.protocol.rhea-*`, `defillama.perps.near.*`, `defillama.x402.volume`, `defillama.bridgeaggs.total` | various | 6 | ecosystem apps, Near Perps, x402, bridge aggregators |
| `nearblocks.charts` | `GET /charts` | 1 | daily transactions, active accounts, fees, supply |
| `nearblocks.era.<id>.<month>` | `GET /account/<account>/txns-only/count?after_date=…&before_date=…` | 97 | monthly transaction counts for `social.near`, `v1.signer`, `intents.near` |
| `near-rpc.block` | `POST block {finality: final}` | 1 | height, total supply |
| `near-rpc.protocol-config` | `POST EXPERIMENTAL_protocol_config` | 1 | max inflation, protocol reward rate |
| `near-rpc.validators` | `POST validators [null]` | 1 | current validators' stake |
| `near-rpc.signer-state` | `POST query call_function v1.signer state` | 1 | MPC participants, threshold, domains |
| `near-rpc.buyback-wallet` | `POST query view_account buybacks.multisignature.near` | 1 | NEAR balance |
| `near-rpc.buyback-wnear` | `POST query call_function wrap.near ft_balance_of` | 1 | wNEAR balance |
| `fastnear.revenue-wallets` | `POST /v0/account`, `POST /v0/transactions` | 1 record | every NEAR and wNEAR flow of the three revenue wallets |
| `intents-explorer.recent` | `GET /transactions?numberOfTransactions=1000&statuses=SUCCESS` | 0 | skipped: no JWT |

The exact URL of every stored response is in [`artifacts/research/raw/manifest.json`](../artifacts/research/raw/manifest.json).

## 3. Metric traceability

| Metric | Source | Query / script | Window | Output | Caveat |
|---|---|---|---|---|---|
| NEAR price, market cap, circulating supply | CoinGecko | `coingecko.markets` → `evidence.ts` | Retrieval time (12 Nov 2026) | `MKT-NEAR-PRICE`, `MKT-NEAR-MCAP`, `MKT-NEAR-CIRC` | Point-in-time, not on the window end date |
| Intents volume run rate | DefiLlama | `defillama.intents.volume` → `ladder.ts` | 90 days to 10 Nov | `INT-VOL-ANN` | Adapter coverage defines the series |
| Intents growth | DefiLlama | same | 90d and 30d vs a year earlier; 90d vs prior 90d | `ECO-INTENTS-VOL-YOY`, `LAD-INTENTS-YOY`, `INT-VOL-GROWTH` | Results depend on the window |
| Captured revenue, designated buybacks | DefiLlama | `defillama.intents.dailyRevenue`, `…dailyHoldersRevenue` | 90 days; since 23 Feb 2026 | `LAD-INTENTS-HOLDER-RUNRATE`, `TOK-DESIGNATED-SINCE` | Holders revenue is a relabel by date (Dune lineage) |
| Burns | DefiLlama | `defillama.revenue.near` | 90 days | `LAD-NEAR-BURN-RUNRATE` | 70% of gas |
| NEAR multiple | CoinGecko, DefiLlama | `ladder.ts` | 90-day run rate | `LAD-MULT-TODAY`, `LAD-MULT-TODAY-365D` | Trailing figure predates buybacks |
| Peer multiples | CoinGecko, DefiLlama | `coingecko.top`, `defillama.holders.<chain>` | 90-day run rate, same end | `LAD-PEER-*-MULT` | Same metric for every asset |
| Spot DEX volume | DefiLlama | `defillama.dexs.categories` (category `Dexs` summed per day) | 90 days; calendar years | `LAD-SPOT-DEX-RUNRATE`, `LAD-DEX-CAGR-2021-2025` | Scale reference, not a market |
| Revenue-wallet flows | FastNEAR | `fastnear.ts` → `tokenomics.ts` | 23 Feb–10 Nov 2026 | `TOK-*` | Deliveries verified, purchases not |
| Buyback wallet balance | NEAR RPC | `near-rpc.buyback-wallet`, `near-rpc.buyback-wnear` | Retrieval time | `ONC-BUYBACK-WALLET`, `TOK-WALLET-RECONCILE` | |
| Net issuance | NearBlocks | `nearblocks.charts` (total supply) | 90 days | `SUP-NET-NEW-ANN-PCT` | Realized, net of burns |
| Staking ratio, validators | NEAR RPC | `near-rpc.validators`, `near-rpc.block` | Current epoch | `TOK-STAKING-RATIO`, `RISK-VALIDATOR-NAKAMOTO` | One epoch |
| L1 activity | NearBlocks, DefiLlama | `nearblocks.charts`, `defillama.fees.near` | 90d vs a year earlier | `ECO-L1-TXNS-YOY`, `ECO-L1-ACTIVE-YOY`, `ECO-L1-GAS-YOY` | Automated activity not separated (H7) |
| Fees on NEAR by protocol | DefiLlama | `defillama.fees.onnear` | 30 days | `ECO-INTENTS-FEE-SHARE` | Share of protocol fees DefiLlama attributes to the NEAR chain; Intents fees are cross-chain swap fees paid on many chains, not NEAR L1 gas |
| NEAR DeFi TVL and growth | DefiLlama | `defillama.tvl.near` → `evidence.ts`; `defillama.chaintvl.near` → `valuation.ts` | Latest day (2026-11-12) vs a year earlier; window end (2026-11-10) vs a year earlier | `DEFI-TVL-NEAR`, `DEFI-TVL-NEAR-YOY` (+41.4%); opportunity table (+27.1%) | Same endpoint fetched twice; single-day comparisons on a noisy series ([METHODOLOGY.md §3](METHODOLOGY.md#3-time-window-alignment)) |
| Cross-chain comparison | DefiLlama, CoinGecko | `defillama.ccfees.*`, `defillama.ccvol.*`, `coingecko.crosschain` → `crosschain.ts` | 90 days | `CC-*` | Several rivals publish no volume |
| Era durability | NearBlocks, DefiLlama | `nearblocks.era.*` → `thesis.ts` | Calendar months | `ERA-*` | Estimated months excluded |
| Chain Signatures | NEAR RPC | `near-rpc.signer-state` | Retrieval time | `ECO-SIGNER-PARTICIPANTS` | No fee data |
| Opportunity and risk | CoinGecko, DefiLlama | `coingecko.history.*`, `defillama.coins.*`, `defillama.chaintvl.*`, `defillama.stablechart.*` → `valuation.ts` | 1 and 3 years | `OPP-*`, risk table | One-year growth is cyclical |

For any evidence ID, [`artifacts/research/evidence-manifest.json`](../artifacts/research/evidence-manifest.json) gives the value, unit, type, period, transform, inputs, methodology note and the request (key, URL, retrieval time, SHA-256) it came from.

## 4. Relevant wallets and contracts

| Account | Role in the research |
|---|---|
| `intents.near` | NEAR Intents contract; the sender of 1Click swap outputs into the revenue wallets (`BUYBACK_ROUTE`) |
| `fefundsadmin.sputnik-dao.near` | Front-end fund (captured revenue retained) |
| `1csfundsadmin.sputnik-dao.near` | 1Click fund (captured revenue, some later moved to the buyback wallet) |
| `buybacks.multisignature.near` | Buyback wallet (NEAR held) |
| `wrap.near` | wNEAR token contract; `ft_transfer` / `ft_transfer_call` receipts are read; wrapping is excluded |
| `v1.signer` | Chain Signatures MPC contract; state read over RPC; monthly transaction counts |
| `social.near` | BOS-era representative contract (era durability) |

No contract is deployed by this project.

## 5. Onchain reconstruction: selection, classification and accounting

**Collection** ([`fastnear.ts`](../src/lib/data/fastnear.ts)): for each revenue wallet, page `POST /v0/account` with `resume_token` until exhausted, and fail if the unique hashes are fewer than the reported `txs_count`. Then fetch receipts with `POST /v0/transactions` in batches of 20. Representative excerpt:

```ts
// Native NEAR transfers (gas refunds and wrapping excluded).
const dep = a?.Transfer?.deposit;
if (typeof dep === 'string' && /^\d+$/.test(dep) && dep !== '0' && from !== 'system' && from !== 'wrap.near' && to !== 'wrap.near') {
  if (isW(to)) flows.push({ wallet: to, dir: 'in', counterparty: from, kind: 'near', yocto: dep, ts, tx: hash, ok: succeeded(r) });
  if (isW(from)) flows.push({ wallet: from, dir: 'out', counterparty: to, kind: 'near', yocto: dep, ts, tx: hash, ok: succeeded(r) });
}
// wNEAR transfers.
if (to === 'wrap.near' && (fc?.method_name === 'ft_transfer' || fc?.method_name === 'ft_transfer_call')) { /* receiver_id and amount from the call args */ }
```

The stored record (`fastnear.revenue-wallets`) holds 5,336 flows with exact yoctoNEAR amounts, timestamps, transaction hashes and success flags.

**Accounting** ([`tokenomics.ts`](../src/lib/research/tokenomics.ts)): see [METHODOLOGY.md §6](METHODOLOGY.md#6-onchain-wallet-reconstruction-methodology) for the classification table and identities. Attribution rules:

- only successful receipts, on or after 23 February 2026, up to the earlier of the window end and the day before retrieval;
- an inflow from outside the three wallets is captured revenue; from `intents.near` it is attributed to Intents, from anyone else it is listed by sender (`auroraliqsupport.near`, `clingy.near` in this snapshot);
- hops between the three wallets are not new revenue; a 1Click fund → buyback wallet move is shown as a memo and attributed to Intents pro rata to the fund's provenance;
- every flow is valued at that day's price; a missing price makes the result unavailable.

**Result in this snapshot:** reproduced captured revenue $7.94M against DefiLlama's $8.01M over 2026-02-23 to 2026-11-10 (99.1%); delivered share 67.0%; front-end fund $2.13M; non-Intents inflows $440.0K; wallet holds 100.0% of what it received.

## 6. NearBlocks estimate detection

For busy contracts in older months, NearBlocks' count endpoint returns a query-planner estimate, marked by a `cost` field in the response. Every era month is checked; estimated months are excluded from scoring and charts (31 months for `social.near`, 21 for `v1.signer` in this snapshot). Intents era activity is therefore measured with DefiLlama volume rather than `intents.near` transaction counts.

## 7. Units and transformations

- Money: USD at the provider's price; onchain amounts converted from yoctoNEAR (10^24) at the day's price.
- Rates: fractions in `canonical.json`, formatted as percentages in documents.
- Run rates: 90-day sums × 365 / 90.
- Daily series: provider timestamps converted to UTC dates; the newest, possibly partial, day is dropped.
- Each evidence item's `transform` field states its formula, for example `(INT-VOL-90D - INT-VOL-PRIOR-90D) / INT-VOL-PRIOR-90D`.

## 8. Output artifacts

| Artifact | Contents |
|---|---|
| `artifacts/research/raw/*.json` | Projected provider responses, one per request (sorted keys) |
| `artifacts/research/raw/manifest.json` | Per request: key, source, URL, retrieval time, SHA-256, file |
| `artifacts/research/canonical.json` | Every evidence item, model base and scenarios, triggers, thesis rules, ladder |
| `artifacts/research/evidence-manifest.json` | Per evidence item: value, type, period, transform, inputs, request and hash |
| `artifacts/research/charts/*.json` | 20 chart datasets |
| `artifacts/research/dashboard.html` | Static dashboard: chart, query and one sentence each |
| `THESIS.md` | Generated from `research/THESIS.template.md` |

Provenance check: a raw file's SHA-256 equals its manifest entry (command in [REPRODUCIBILITY.md](REPRODUCIBILITY.md#verify-source-hashes)).

## 9. Queries that are written but not executed

The BigQuery SQL in [`research/sql/`](../research/sql) (`01_freshness.sql` to `05_new_signer_retention.sql`) targets `bigquery-public-data.crypto_near_mainnet_us` and is run by `npm run research:bigquery` (dry run first, refused above `BIGQUERY_MAX_GB`). **These queries have not been executed for this research**: no Google Cloud credentials were available. They are illustrative of how H7–H9 would be tested, not validated results. The CLI's own header notes that the dataset's upstream (NEAR Lake) stopped indexing new blocks on 2026-03-24, so `01_freshness.sql` should be checked first. Example:

```sql
-- research/sql/04_intents_contract.sql (not executed)
SELECT block_date, COUNT(*) AS function_calls, COUNT(DISTINCT receipt_predecessor_account_id) AS distinct_callers
FROM `bigquery-public-data.crypto_near_mainnet_us.receipt_actions`
WHERE block_date BETWEEN @start_date AND @end_date
  AND action_kind = 'FUNCTION_CALL'
  AND receipt_receiver_account_id = 'intents.near'
GROUP BY block_date ORDER BY block_date;
```

The NEAR Intents Explorer request (`intents-explorer.recent`) is implemented but skipped without a partner JWT, so `INT-EXPLORER-TOP5-SHARE` is unavailable.

## 10. Data-access limitations

- Free-tier rate limits: CoinGecko and NearBlocks are paced at about one request every 6 seconds; a first full refresh, including era history, takes about 15 minutes.
- Relay, deBridge, Mayan, Across and Stargate volume needs paid APIs and is left out rather than estimated.
- Aggregator histories can be revised; the committed raw responses freeze what this snapshot used.
- DefiLlama's Intents figures and NEAR's own revenue dashboard share Dune queries, so they are not independent of each other; the FastNEAR reconstruction is the independent check.
- Credentials (`COINGECKO_*_API_KEY`, `NEARBLOCKS_API_KEY`, `INTENTS_EXPLORER_JWT`, `GOOGLE_*`) are read from environment variables only; none are stored in the repository or in stored URLs.
