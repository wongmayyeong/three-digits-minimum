<!-- GENERATED FILE. Edit research/THESIS.template.md, then run `npm run research:rebuild`. Figures are filled from artifacts/research/canonical.json. -->

# THESIS: Is NEAR a credible long-term investment over the next 3 to 5 years?

**Track:** NEAR HACKATHON 2026, Investment Thesis. **Project:** NEBUBE, an evidence-first AI debate arena.
**Data window:** flow metrics use the 90 days ending Nov 4, 2026; peer comparisons use the 30 days ending Nov 4, 2026.
**Status of this document:** every number below is inserted by `npm run research:refresh` from stored provider responses. If a source was unavailable, the number reads "unavailable" instead of an estimate.

> Educational research, not financial advice. This document does not predict prices. "Bear wins" is an acceptable outcome.

---

## 1. Research question and hypotheses

**Question.** Is NEAR a credible, attractive long-term investment over the next 3 to 5 years, judged by whether measurable economic activity accrues to the NEAR token?

**Bull hypothesis.** NEAR Intents is a growing cross-chain settlement layer whose fees partly accrue to NEAR (captured revenue, now used for open-market buybacks). If volume keeps compounding at a stable take rate, token-level value capture becomes material relative to market cap, independent of base-layer user counts.

**Bear hypothesis.** Most Intents fees go to solvers and distributors; what NEAR keeps is small next to its market cap, buybacks are held rather than burned, fee competition will compress the take, and base-layer usage is shrinking. The valuation is not explained by measurable activity.

The arena tests these through three debates: **The Intents Bet** (value accrual from Intents), **Growth or Hype?** (adoption versus valuation) and **The Long Game** (NEAR versus Solana, Sui and Avalanche on matched data).

## 2. Why usage and value capture must be separated

A network can be busy while its token captures little. Swap volume measures activity routed through NEAR Intents, not revenue to NEAR holders. The chain of value runs volume → gross fees → NEAR-captured revenue → buybacks or burns → token holders, and each arrow can leak. NEBUBE measures every link separately, with matched windows, and never treats a buyback as a burn or buyback demand as a price change.

## 3. Metrics, sources and formulas

| Link in the chain | Metric | Current value | Type | Source |
|---|---|---|---|---|
| Activity | Intents volume, 90 days (Aug 7, 2026 to Nov 4, 2026) | $11.71B | OBSERVED | DefiLlama |
| Activity | Prior 90 days | $6.49B | OBSERVED | DefiLlama |
| Activity | Change, window over window | 80.5% | DERIVED | computed |
| Fees | Gross fees, 90 days | $17.84M | OBSERVED | DefiLlama |
| Fees | Effective fee rate f (prior window) | 0.152% (0.139%) | DERIVED | computed |
| Capture | NEAR-captured revenue, 90 days | $4.84M | OBSERVED | DefiLlama |
| Capture | Capture of fees c (prior window) | 27.1% (19.0%) | DERIVED | computed |
| Capture | Take rate f x c (prior window) | 0.041% (0.026%) | DERIVED | computed |
| Buybacks | Revenue classified as buybacks, 90 days | $4.84M | OBSERVED | DefiLlama |
| Buybacks | Buyback share b | 100.0% | DERIVED | computed |
| Buybacks | NEAR held by the buyback wallet | 2.20M NEAR | OBSERVED | NEAR JSON-RPC (FastNEAR) |
| Token | Circulating market cap M | $4.85B | OBSERVED | CoinGecko |
| Token | Protocol maximum inflation | 2.50% | OBSERVED | NEAR JSON-RPC (FastNEAR) |
| Token | Maximum issuance at today's price | $121.27M | DERIVED | computed |
| Token | Burns + buybacks, annualized | $20.65M | DERIVED | computed |
| Adoption | Daily active accounts, 30-day mean | 61,647 | OBSERVED | NearBlocks |
| Adoption | Same, one year earlier | 268,977 | OBSERVED | NearBlocks |
| DeFi | NEAR chain TVL (one year earlier) | $176.34M ($147.92M) | OBSERVED | DefiLlama |
| DeFi | RHEA Lend TVL | $147.40M | OBSERVED | DefiLlama |
| DeFi | Stablecoins on NEAR | $129.70M | OBSERVED | DefiLlama |
| Peers | Market cap / annualized chain fees: NEAR, SOL, SUI, AVAX | 2,242x, 219x, 2,353x, 890x | DERIVED | DefiLlama, CoinGecko |
| Peers | 30-day DEX volume: NEAR, SOL, SUI, AVAX | $4.45B, $57.43B, $892.71M, $2.97B | OBSERVED | DefiLlama |

DefiLlama's own definitions for the NEAR Intents adapter, stored verbatim in each snapshot: Fees: Gross fees charged on NEAR Intents swaps - the protocol fee plus the affiliate (distribution) fee each frontend collects, summed across all integrators. | Revenue: NEAR's net captured revenue, measured as NEAR/wNEAR swept into its revenue wallets (reconciles with revenue.near.org and the on-chain buyback). Split by destination wallet into front-end affiliate revenue and Other. Transfers between those wallets are excluded. | SupplySideRevenue: Gross fees minus NEAR's captured revenue - the affiliate fees kept by solvers and third-party distribution channels (e.g. SwapKit). | HoldersRevenue: Since 2026-02-23, NEAR's captured Intents revenue is used to buy back $NEAR on the open market (not burned), returning value to holders.

Every request URL, retrieval time and response SHA-256 is in `artifacts/research/raw/manifest.json` and `artifacts/research/evidence-manifest.json`. The full evidence register is at the end of this document.

### The break-even demand model

```
annual_buyback_demand_usd = V x f x c x b
buyback_demand_to_mcap    = annual_buyback_demand_usd / M
break_even_annual_volume  = (y x M) / (f x c x b)
volume_multiple_required  = break_even_annual_volume / V
```

V is the 90-day volume run rate, f and c come from the same window and adapter, b is DefiLlama's holders-revenue share (a classification, not a guaranteed policy), and y is always an assumption (2% by default). Missing or non-positive inputs produce N/A; the code never divides by zero. Implementation: `src/lib/research/model.ts`, tests in `tests/unit/model.test.ts`.

## 4. Findings (from observed data only)

- **Activity.** NEAR Intents processed $11.71B in the latest 90 days, 80.5% versus the prior 90 days, an annualized run rate of $47.47B.
- **What NEAR keeps.** The effective fee rate is 0.152%, and NEAR captures 27.1% of fees, so it keeps 0.041% of volume (prior window: 0.026%).
- **Buyback demand versus market cap.** At the current run rate, buyback demand is $19.62M a year, 0.404% of market cap. Reaching a hypothetical 2% would need $234.95B of annual volume, 4.95x the current run rate, or a take rate of 0.205% instead of today's 0.041%.
- **What happens to bought tokens.** The buyback wallet holds 2.20M NEAR (0.168% of total supply). Tokens held there are not burned; supply falls only if they are.
- **Issuance versus value capture.** Maximum issuance at today's price is $121.27M a year, against $20.65M of burns plus buybacks. Realized issuance can be below the maximum.
- **Base-layer usage.** Daily active accounts average 61,647, versus 268,977 a year earlier (-77.1%). Accounts are not people, so part of this may be less automation.
- **DeFi depth.** Chain TVL is $176.34M (19.2% year over year), of which RHEA Lend holds $147.40M.
- **Peers.** NEAR's market cap is 2,242x its annualized chain fees, versus Solana 219x, Sui 2,353x and Avalanche 890x. Chain fees exclude Intents revenue, which is NEAR's distinctive source; counting burns and buybacks, NEAR trades at 235x annual value capture.

## 5. Strongest disconfirming evidence and data limitations

The decisive comparisons are listed in section 6 with their current status. The Bull case is weakest wherever value capture is small relative to market cap or issuance, where bought tokens sit unburned, and where account activity falls. The Bear case is weakest wherever volume grows between consecutive windows at a stable take rate, because that is the one path by which buyback demand becomes material. Read the trigger table rather than this paragraph for which of these currently holds.

Known limitations:

- **No integrator data.** Without the partner-only NEAR Intents Explorer JWT, the concentration of volume by integrator and the share of wash-like or incentive-driven volume are unknown (unavailable (INT-EXPLORER-TOP5-SHARE)).
- **Third-party definitions.** f, c and b follow DefiLlama's adapter, which can be revised. Snapshots store the definitions in force.
- **BigQuery freshness.** NEAR Lake, the upstream of `bigquery-public-data.crypto_near_mainnet_us`, stopped indexing new blocks on 2026-03-24. Retention cohorts (unavailable (ACT-RETENTION)) are therefore not part of live snapshots. SQL is in `research/sql/`.
- **Accounts are not people; volume is not organic demand.**
- **Chain comparability.** Fee multiples ignore value that fees do not capture; TVL definitions vary by chain.
- **Run rates are not forecasts.** Annualizing 90 days assumes the window persists.

## 6. Falsification criteria

Each rule is evaluated by `src/lib/research/triggers.ts` on every rebuild. TRIGGERED means the condition that would weaken the long-term Bull thesis currently holds.

| ID | Falsification trigger | Rule | Current reading | Status |
|---|---|---|---|---|
| F1 | Intents volume grows but NEAR-captured revenue per dollar of volume falls. | `INT-VOL-GROWTH > 0 and INT-TAKE-RATE < 0.8 x INT-TAKE-RATE-PRIOR` | volume 80.5%; take rate 0.026% -> 0.041% | **NOT TRIGGERED** |
| F2 | Fee compression: the effective fee rate drops by a quarter or more between consecutive 90-day windows. | `INT-FEE-RATE < 0.75 x INT-FEE-RATE-PRIOR` | 0.139% -> 0.152% | **NOT TRIGGERED** |
| F3 | The break-even volume for buybacks worth 2% of market cap is more than ten times today's run rate. | `MODEL-VOL-MULTIPLE-2PCT > 10` | 4.95x today's run rate | **NOT TRIGGERED** |
| F4 | Base-layer user activity contracts sharply year over year. | `ACT-DAA-YOY < -25%` | -77.1% vs a year earlier | **TRIGGERED** |
| F5 | DeFi deposits on NEAR halve year over year. | `DEFI-TVL-NEAR-YOY < -50%` | 19.2% vs a year earlier | **NOT TRIGGERED** |
| F6 | Token-level value capture is under 1% of market cap per year. | `VAL-NEAR-VALUE-CAPTURE-ANN / MKT-NEAR-MCAP < 1%` | 0.425% of market cap | **TRIGGERED** |

What would change this document's reading: a take rate rising for two consecutive windows while volume grows; buybacks burned rather than held; daily active accounts stabilizing year over year; partner data showing volume is spread across many integrators.

## 7. Scenarios (no price prediction)

| Scenario | Annual buyback demand | Buyback / market cap | Break-even volume (y = 2%) | Volume multiple | Assumptions |
|---|---|---|---|---|---|
| Conservative | $3.68M | 0.076% | $1.25T | 26.4x | Fees compress by half as competitors undercut, NEAR keeps 25% less of fees, half of captured revenue goes to buybacks, and volume does not grow. |
| Base | $19.62M | 0.404% | $234.95B | 4.95x | Measured fee rate, capture and buyback share held constant, and the trailing 90-day volume run rate held flat. |
| Optimistic | $39.24M | 0.808% | $234.95B | 2.47x | Measured fee rate and capture held, all captured revenue goes to buybacks, and volume doubles. |

Required volume multiple under fee compression (rows) and target buyback share of market cap (columns):

| Fee compression \ target y | 0.500% | 1.00% | 2.00% | 5.00% |
|---|---|---|---|---|
| 0.000% | 1.24x | 2.47x | 4.95x | 12.4x |
| 25.0% | 1.65x | 3.30x | 6.60x | 16.5x |
| 50.0% | 2.47x | 4.95x | 9.90x | 24.7x |
| 75.0% | 4.95x | 9.90x | 19.8x | 49.5x |

These are conditional calculations. A buyback is not a burn, buyback demand does not move price one-for-one, and nothing here predicts NEAR's price.

## 8. Re-running the numbers

```bash
npm install
npm run research:refresh     # fetch live data, rebuild canonical.json, charts, dashboard and this file
npm run research:rebuild     # offline: rebuild from artifacts/research/raw and verify byte-identical output
```

Optional BigQuery queries: `npm run research:bigquery` with `GOOGLE_CLOUD_PROJECT` and credentials (dry-run first, capped by `BIGQUERY_MAX_GB`).

## 9. References and methodology change log

- DefiLlama API: https://api-docs.defillama.com/ (NEAR Intents adapter: https://github.com/DefiLlama/dimension-adapters/tree/master/fees/near-intents)
- CoinGecko API: https://docs.coingecko.com/
- NearBlocks API: https://api.nearblocks.io/api-docs
- NEAR JSON-RPC: https://docs.near.org/api/rpc/introduction
- NEAR BigQuery dataset: https://docs.near.org/data-infrastructure/big-query
- NEAR Intents Explorer API: https://docs.near-intents.org/integration/distribution-channels/1click-api/explorer/introduction
- NEAR tokenomics: https://near.org/blog/evolving-near-tokenomics

Change log:
- `nebube-evidence-1.0.0`, `nvabe-1.0.0`: initial evidence catalog, 90-day matched windows, break-even model, six falsification triggers. Trigger thresholds were written while building the pipeline after some raw values had been seen; they are not a blind pre-registration.

## Appendix: evidence register

| ID | Metric | Value | Type | Period | Source |
|---|---|---|---|---|---|
| MKT-NEAR-MCAP | NEAR circulating market cap | $4.85B | OBSERVED | point in time | CoinGecko |
| MKT-NEAR-PRICE | NEAR price | $3.7 | OBSERVED | point in time | CoinGecko |
| MKT-NEAR-CIRC | NEAR circulating supply (CoinGecko) | 1.31B NEAR | OBSERVED | point in time | CoinGecko |
| MKT-SOL-MCAP | Solana circulating market cap | $53.05B | OBSERVED | point in time | CoinGecko |
| MKT-SUI-MCAP | Sui circulating market cap | $3.60B | OBSERVED | point in time | CoinGecko |
| MKT-AVAX-MCAP | Avalanche circulating market cap | $3.71B | OBSERVED | point in time | CoinGecko |
| MKT-NEAR-MCAP-1Y | NEAR market cap change, trailing 365 days | 81.6% | DERIVED | Nov 7, 2025 to Nov 6, 2026 | CoinGecko |
| INT-VOL-90D | NEAR Intents swap volume, 90 days | $11.71B | OBSERVED | Aug 7, 2026 to Nov 4, 2026 | DefiLlama |
| INT-VOL-PRIOR-90D | NEAR Intents swap volume, prior 90 days | $6.49B | OBSERVED | May 9, 2026 to Aug 6, 2026 | DefiLlama |
| INT-FEES-90D | NEAR Intents gross fees, 90 days | $17.84M | OBSERVED | Aug 7, 2026 to Nov 4, 2026 | DefiLlama |
| INT-FEES-PRIOR-90D | NEAR Intents gross fees, prior 90 days | $8.99M | OBSERVED | May 9, 2026 to Aug 6, 2026 | DefiLlama |
| INT-REV-90D | NEAR Intents captured revenue, 90 days | $4.84M | OBSERVED | Aug 7, 2026 to Nov 4, 2026 | DefiLlama |
| INT-REV-PRIOR-90D | NEAR Intents captured revenue, prior 90 days | $1.71M | OBSERVED | May 9, 2026 to Aug 6, 2026 | DefiLlama |
| INT-BUYBACK-90D | Revenue DefiLlama classifies as buybacks, 90 days | $4.84M | OBSERVED | Aug 7, 2026 to Nov 4, 2026 | DefiLlama |
| INT-VOL-ANN | NEAR Intents annualized volume (V) | $47.47B | DERIVED | Aug 7, 2026 to Nov 4, 2026 | NEBUBE (computed) |
| INT-VOL-GROWTH | Volume change, last 90 days vs prior 90 days | 80.5% | DERIVED | May 9, 2026 to Nov 4, 2026 | NEBUBE (computed) |
| INT-FEE-RATE | Effective gross fee rate (f) | 0.152% | DERIVED | Aug 7, 2026 to Nov 4, 2026 | NEBUBE (computed) |
| INT-FEE-RATE-PRIOR | Effective gross fee rate, prior 90 days | 0.139% | DERIVED | May 9, 2026 to Aug 6, 2026 | NEBUBE (computed) |
| INT-CAPTURE | Protocol capture of gross fees (c) | 27.1% | DERIVED | Aug 7, 2026 to Nov 4, 2026 | NEBUBE (computed) |
| INT-CAPTURE-PRIOR | Protocol capture of gross fees, prior 90 days | 19.0% | DERIVED | May 9, 2026 to Aug 6, 2026 | NEBUBE (computed) |
| INT-TAKE-RATE | NEAR-captured revenue per dollar of volume (f x c) | 0.041% | DERIVED | Aug 7, 2026 to Nov 4, 2026 | NEBUBE (computed) |
| INT-TAKE-RATE-PRIOR | NEAR-captured revenue per dollar of volume, prior 90 days | 0.026% | DERIVED | May 9, 2026 to Aug 6, 2026 | NEBUBE (computed) |
| INT-BUYBACK-SHARE | Share of captured revenue classified as buybacks (b) | 100.0% | DERIVED | Aug 7, 2026 to Nov 4, 2026 | NEBUBE (computed) |
| INT-REV-ANN | NEAR Intents captured revenue, annualized | $19.62M | DERIVED | Aug 7, 2026 to Nov 4, 2026 | NEBUBE (computed) |
| INT-DEFINITIONS | DefiLlama fee and revenue definitions for NEAR Intents | text | REPORTED | point in time | DefiLlama |
| ONC-BUYBACK-WALLET | NEAR held by buybacks.multisignature.near | 2.20M NEAR | OBSERVED | point in time | NEAR JSON-RPC (FastNEAR) |
| ONC-TOTAL-SUPPLY | NEAR total supply (protocol) | 1.31B NEAR | OBSERVED | point in time | NEAR JSON-RPC (FastNEAR) |
| ONC-MAX-INFLATION | Protocol maximum annual inflation rate | 2.50% | OBSERVED | point in time | NEAR JSON-RPC (FastNEAR) |
| ONC-BUYBACK-PCT-SUPPLY | Buyback wallet holdings as share of total supply | 0.168% | DERIVED | point in time | NEBUBE (computed) |
| ONC-ISSUANCE-USD | Maximum annual issuance at current price | $121.27M | DERIVED | point in time | NEBUBE (computed) |
| ACT-DAA-30D | Daily active accounts, 30-day mean | 61,647 | OBSERVED | Oct 6, 2026 to Nov 4, 2026 | NearBlocks |
| ACT-DAA-30D-1Y-AGO | Daily active accounts, 30-day mean one year earlier | 268,977 | OBSERVED | Oct 6, 2025 to Nov 4, 2025 | NearBlocks |
| ACT-TXN-30D | Daily transactions, 30-day mean | 684,948 | OBSERVED | Oct 6, 2026 to Nov 4, 2026 | NearBlocks |
| ACT-NEW-30D | New accounts per day, 30-day mean | 9,737 | OBSERVED | Oct 6, 2026 to Nov 4, 2026 | NearBlocks |
| ACT-DAA-YOY | Daily active accounts, change vs one year earlier | -77.1% | DERIVED | point in time | NEBUBE (computed) |
| ACT-GAS-FEES-30D | Base-layer transaction fees, 30 days (NearBlocks) | $175.8K | OBSERVED | Oct 6, 2026 to Nov 4, 2026 | NearBlocks |
| ACT-RETENTION | Retained signer cohorts (BigQuery) | unavailable | OBSERVED | point in time | Google BigQuery: crypto_near_mainnet_us |
| DEFI-TVL-NEAR | NEAR chain DeFi TVL | $176.34M | OBSERVED | as of Nov 6, 2026 | DefiLlama |
| DEFI-TVL-NEAR-1Y-AGO | NEAR chain DeFi TVL one year earlier | $147.92M | OBSERVED | as of Nov 6, 2025 | DefiLlama |
| DEFI-TVL-NEAR-YOY | NEAR TVL change vs one year earlier | 19.2% | DERIVED | point in time | NEBUBE (computed) |
| DEFI-RHEA-LEND-TVL | RHEA Lend TVL on NEAR | $147.40M | OBSERVED | as of Nov 6, 2026 | DefiLlama |
| DEFI-RHEA-DEX-TVL | RHEA DEX TVL on NEAR | $23.08M | OBSERVED | as of Nov 6, 2026 | DefiLlama |
| DEFI-STABLES-NEAR | Stablecoin supply on NEAR | $129.70M | OBSERVED | as of Nov 6, 2026 | DefiLlama |
| FEES-NEAR-CHAIN-90D | NEAR base-layer gas fees, 90 days | $363.1K | OBSERVED | Aug 7, 2026 to Nov 4, 2026 | DefiLlama |
| FEES-NEAR-BURN-90D | NEAR gas fees burned, 90 days | $254.1K | OBSERVED | Aug 7, 2026 to Nov 4, 2026 | DefiLlama |
| VAL-NEAR-VALUE-CAPTURE-ANN | Token-level value capture, annualized (burn + Intents buybacks) | $20.65M | DERIVED | point in time | NEBUBE (computed) |
| VAL-NEAR-MCAP-TO-CAPTURE | Market cap / annualized token value capture | 235x | DERIVED | point in time | NEBUBE (computed) |
| PEER-NEAR-FEES-30D | NEAR chain fees, 30 days | $178.0K | OBSERVED | Oct 6, 2026 to Nov 4, 2026 | DefiLlama |
| PEER-NEAR-TVL | NEAR DeFi TVL | $180.11M | OBSERVED | as of Nov 4, 2026 | DefiLlama |
| PEER-NEAR-DEX-30D | NEAR DEX volume, 30 days | $4.45B | OBSERVED | Oct 6, 2026 to Nov 4, 2026 | DefiLlama |
| PEER-NEAR-MCAP-TO-FEES | NEAR market cap / annualized chain fees | 2,242x | DERIVED | point in time | NEBUBE (computed) |
| PEER-NEAR-MCAP-TO-TVL | NEAR market cap / DeFi TVL | 27.0x | DERIVED | point in time | NEBUBE (computed) |
| PEER-SOL-FEES-30D | Solana chain fees, 30 days | $19.87M | OBSERVED | Oct 6, 2026 to Nov 4, 2026 | DefiLlama |
| PEER-SOL-TVL | Solana DeFi TVL | $5.39B | OBSERVED | as of Nov 4, 2026 | DefiLlama |
| PEER-SOL-DEX-30D | Solana DEX volume, 30 days | $57.43B | OBSERVED | Oct 6, 2026 to Nov 4, 2026 | DefiLlama |
| PEER-SOL-MCAP-TO-FEES | Solana market cap / annualized chain fees | 219x | DERIVED | point in time | NEBUBE (computed) |
| PEER-SOL-MCAP-TO-TVL | Solana market cap / DeFi TVL | 9.85x | DERIVED | point in time | NEBUBE (computed) |
| PEER-SUI-FEES-30D | Sui chain fees, 30 days | $125.8K | OBSERVED | Oct 6, 2026 to Nov 4, 2026 | DefiLlama |
| PEER-SUI-TVL | Sui DeFi TVL | $455.44M | OBSERVED | as of Nov 4, 2026 | DefiLlama |
| PEER-SUI-DEX-30D | Sui DEX volume, 30 days | $892.71M | OBSERVED | Oct 6, 2026 to Nov 4, 2026 | DefiLlama |
| PEER-SUI-MCAP-TO-FEES | Sui market cap / annualized chain fees | 2,353x | DERIVED | point in time | NEBUBE (computed) |
| PEER-SUI-MCAP-TO-TVL | Sui market cap / DeFi TVL | 7.91x | DERIVED | point in time | NEBUBE (computed) |
| PEER-AVAX-FEES-30D | Avalanche chain fees, 30 days | $342.4K | OBSERVED | Oct 6, 2026 to Nov 4, 2026 | DefiLlama |
| PEER-AVAX-TVL | Avalanche DeFi TVL | $580.98M | OBSERVED | as of Nov 4, 2026 | DefiLlama |
| PEER-AVAX-DEX-30D | Avalanche DEX volume, 30 days | $2.97B | OBSERVED | Oct 6, 2026 to Nov 4, 2026 | DefiLlama |
| PEER-AVAX-MCAP-TO-FEES | Avalanche market cap / annualized chain fees | 890x | DERIVED | point in time | NEBUBE (computed) |
| PEER-AVAX-MCAP-TO-TVL | Avalanche market cap / DeFi TVL | 6.38x | DERIVED | point in time | NEBUBE (computed) |
| INT-EXPLORER-TOP5-SHARE | Share of sampled 1Click volume from top 5 referrers | unavailable | OBSERVED | point in time | NEAR Intents Explorer API |
| INT-EXPLORER-MEDIAN-SWAP | Median sampled 1Click swap size | unavailable | OBSERVED | point in time | NEAR Intents Explorer API |
| MODEL-BUYBACK-USD | Annual buyback demand at current run rate | $19.62M | DERIVED | Aug 7, 2026 to Nov 4, 2026 | NEBUBE model nvabe-1.0.0 |
| MODEL-BUYBACK-TO-MCAP | Annual buyback demand / market cap | 0.404% | DERIVED | Aug 7, 2026 to Nov 4, 2026 | NEBUBE model nvabe-1.0.0 |
| MODEL-BREAKEVEN-VOL-2PCT | Annual volume needed for buybacks = 2% of market cap | $234.95B | DERIVED | Aug 7, 2026 to Nov 4, 2026 | NEBUBE model nvabe-1.0.0 |
| MODEL-VOL-MULTIPLE-2PCT | Volume multiple needed for 2% of market cap | 4.95x | DERIVED | Aug 7, 2026 to Nov 4, 2026 | NEBUBE model nvabe-1.0.0 |
| MODEL-REQ-TAKE-RATE-2PCT | Required f x c x b at today's volume for 2% of market cap | 0.205% | DERIVED | Aug 7, 2026 to Nov 4, 2026 | NEBUBE model nvabe-1.0.0 |
| MODEL-CURRENT-TAKE-RATE | Current f x c x b (volume converted to buyback demand) | 0.041% | DERIVED | Aug 7, 2026 to Nov 4, 2026 | NEBUBE model nvabe-1.0.0 |
