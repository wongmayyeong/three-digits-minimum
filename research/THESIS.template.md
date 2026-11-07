<!-- GENERATED FILE. Edit research/THESIS.template.md, then run `npm run research:rebuild`. Figures are filled from artifacts/research/canonical.json. -->

# THESIS: Is NEAR a credible long-term investment over the next 3 to 5 years?

**Track:** NEAR HACKATHON 2026, Investment Thesis. **Project:** NEBUBE, an evidence-first AI debate arena.
**Data window:** flow metrics use the 90 days ending {{WINDOW_END}}; peer comparisons use the 30 days ending {{PEER_WINDOW_END}}.
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
| Activity | Intents volume, 90 days ({{INT-VOL-90D.period}}) | {{INT-VOL-90D}} | {{INT-VOL-90D.type}} | {{INT-VOL-90D.source}} |
| Activity | Prior 90 days | {{INT-VOL-PRIOR-90D}} | {{INT-VOL-PRIOR-90D.type}} | {{INT-VOL-PRIOR-90D.source}} |
| Activity | Change, window over window | {{INT-VOL-GROWTH}} | {{INT-VOL-GROWTH.type}} | computed |
| Fees | Gross fees, 90 days | {{INT-FEES-90D}} | {{INT-FEES-90D.type}} | {{INT-FEES-90D.source}} |
| Fees | Effective fee rate f (prior window) | {{INT-FEE-RATE}} ({{INT-FEE-RATE-PRIOR}}) | DERIVED | computed |
| Capture | NEAR-captured revenue, 90 days | {{INT-REV-90D}} | {{INT-REV-90D.type}} | {{INT-REV-90D.source}} |
| Capture | Capture of fees c (prior window) | {{INT-CAPTURE}} ({{INT-CAPTURE-PRIOR}}) | DERIVED | computed |
| Capture | Take rate f x c (prior window) | {{INT-TAKE-RATE}} ({{INT-TAKE-RATE-PRIOR}}) | DERIVED | computed |
| Buybacks | Revenue classified as buybacks, 90 days | {{INT-BUYBACK-90D}} | {{INT-BUYBACK-90D.type}} | {{INT-BUYBACK-90D.source}} |
| Buybacks | Buyback share b | {{INT-BUYBACK-SHARE}} | DERIVED | computed |
| Buybacks | NEAR held by the buyback wallet | {{ONC-BUYBACK-WALLET}} | {{ONC-BUYBACK-WALLET.type}} | {{ONC-BUYBACK-WALLET.source}} |
| Token | Circulating market cap M | {{MKT-NEAR-MCAP}} | {{MKT-NEAR-MCAP.type}} | {{MKT-NEAR-MCAP.source}} |
| Token | Protocol maximum inflation | {{ONC-MAX-INFLATION}} | {{ONC-MAX-INFLATION.type}} | {{ONC-MAX-INFLATION.source}} |
| Token | Maximum issuance at today's price | {{ONC-ISSUANCE-USD}} | DERIVED | computed |
| Token | Burns + buybacks, annualized | {{VAL-NEAR-VALUE-CAPTURE-ANN}} | DERIVED | computed |
| Adoption | Daily active accounts, 30-day mean | {{ACT-DAA-30D}} | {{ACT-DAA-30D.type}} | {{ACT-DAA-30D.source}} |
| Adoption | Same, one year earlier | {{ACT-DAA-30D-1Y-AGO}} | {{ACT-DAA-30D-1Y-AGO.type}} | {{ACT-DAA-30D-1Y-AGO.source}} |
| DeFi | NEAR chain TVL (one year earlier) | {{DEFI-TVL-NEAR}} ({{DEFI-TVL-NEAR-1Y-AGO}}) | OBSERVED | DefiLlama |
| DeFi | RHEA Lend TVL | {{DEFI-RHEA-LEND-TVL}} | OBSERVED | DefiLlama |
| DeFi | Stablecoins on NEAR | {{DEFI-STABLES-NEAR}} | OBSERVED | DefiLlama |
| Peers | Market cap / annualized chain fees: NEAR, SOL, SUI, AVAX | {{PEER-NEAR-MCAP-TO-FEES}}, {{PEER-SOL-MCAP-TO-FEES}}, {{PEER-SUI-MCAP-TO-FEES}}, {{PEER-AVAX-MCAP-TO-FEES}} | DERIVED | DefiLlama, CoinGecko |
| Peers | 30-day DEX volume: NEAR, SOL, SUI, AVAX | {{PEER-NEAR-DEX-30D}}, {{PEER-SOL-DEX-30D}}, {{PEER-SUI-DEX-30D}}, {{PEER-AVAX-DEX-30D}} | OBSERVED | DefiLlama |

DefiLlama's own definitions for the NEAR Intents adapter, stored verbatim in each snapshot: {{INT-DEFINITIONS}}

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

- **Activity.** NEAR Intents processed {{INT-VOL-90D}} in the latest 90 days, a change of {{INT-VOL-GROWTH}} versus the prior 90 days, an annualized run rate of {{INT-VOL-ANN}}.
- **What NEAR keeps.** The effective fee rate is {{INT-FEE-RATE}}, and NEAR captures {{INT-CAPTURE}} of fees, so it keeps {{INT-TAKE-RATE}} of volume (prior window: {{INT-TAKE-RATE-PRIOR}}).
- **Buyback demand versus market cap.** At the current run rate, buyback demand is {{MODEL-BUYBACK-USD}} a year, {{MODEL-BUYBACK-TO-MCAP}} of market cap. Reaching a hypothetical 2% would need {{MODEL-BREAKEVEN-VOL-2PCT}} of annual volume, {{MODEL-VOL-MULTIPLE-2PCT}} the current run rate, or a take rate of {{MODEL-REQ-TAKE-RATE-2PCT}} instead of today's {{MODEL-CURRENT-TAKE-RATE}}.
- **What happens to bought tokens.** The buyback wallet holds {{ONC-BUYBACK-WALLET}} ({{ONC-BUYBACK-PCT-SUPPLY}} of total supply). Tokens held there are not burned; supply falls only if they are.
- **Issuance versus value capture.** Maximum issuance at today's price is {{ONC-ISSUANCE-USD}} a year, against {{VAL-NEAR-VALUE-CAPTURE-ANN}} of burns plus buybacks. Realized issuance can be below the maximum.
- **Base-layer usage.** Daily active accounts average {{ACT-DAA-30D}}, versus {{ACT-DAA-30D-1Y-AGO}} a year earlier ({{ACT-DAA-YOY}}). Accounts are not people, so part of this may be less automation.
- **DeFi depth.** Chain TVL is {{DEFI-TVL-NEAR}} ({{DEFI-TVL-NEAR-YOY}} year over year), of which RHEA Lend holds {{DEFI-RHEA-LEND-TVL}}.
- **Peers.** NEAR's market cap is {{PEER-NEAR-MCAP-TO-FEES}} its annualized chain fees, versus Solana {{PEER-SOL-MCAP-TO-FEES}}, Sui {{PEER-SUI-MCAP-TO-FEES}} and Avalanche {{PEER-AVAX-MCAP-TO-FEES}}. Chain fees exclude Intents revenue, which is NEAR's distinctive source; counting burns and buybacks, NEAR trades at {{VAL-NEAR-MCAP-TO-CAPTURE}} annual value capture.

## 5. Strongest disconfirming evidence and data limitations

The decisive comparisons are listed in section 6 with their current status. The Bull case is weakest wherever value capture is small relative to market cap or issuance, where bought tokens sit unburned, and where account activity falls. The Bear case is weakest wherever volume grows between consecutive windows at a stable take rate, because that is the one path by which buyback demand becomes material. Read the trigger table rather than this paragraph for which of these currently holds.

Known limitations:

- **No integrator data.** Without the partner-only NEAR Intents Explorer JWT, the concentration of volume by integrator and the share of wash-like or incentive-driven volume are unknown ({{INT-EXPLORER-TOP5-SHARE}}).
- **Third-party definitions.** f, c and b follow DefiLlama's adapter, which can be revised. Snapshots store the definitions in force.
- **BigQuery freshness.** NEAR Lake, the upstream of `bigquery-public-data.crypto_near_mainnet_us`, stopped indexing new blocks on 2026-03-24. Retention cohorts ({{ACT-RETENTION}}) are therefore not part of live snapshots. SQL is in `research/sql/`.
- **Accounts are not people; volume is not organic demand.**
- **Chain comparability.** Fee multiples ignore value that fees do not capture; TVL definitions vary by chain.
- **Run rates are not forecasts.** Annualizing 90 days assumes the window persists.

## 6. Falsification criteria

Each rule is evaluated by `src/lib/research/triggers.ts` on every rebuild. TRIGGERED means the condition that would weaken the long-term Bull thesis currently holds.

{{TRIGGER_TABLE}}

What would change this document's reading: a take rate rising for two consecutive windows while volume grows; buybacks burned rather than held; daily active accounts stabilizing year over year; partner data showing volume is spread across many integrators.

## 7. Scenarios (no price prediction)

{{SCENARIO_TABLE}}

Required volume multiple under fee compression (rows) and target buyback share of market cap (columns):

{{SENSITIVITY_TABLE}}

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

{{EVIDENCE_REGISTER}}
