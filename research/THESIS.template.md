<!-- GENERATED FILE. Edit research/THESIS.template.md, then run `npm run research:rebuild`. Every figure is filled from artifacts/research/canonical.json. -->

# Is NEAR Building the Future or Following the Hype?

*Every pivot, tested against the evidence.*

**Track:** NEAR HACKATHON 2026, Investment Thesis. **Data:** refreshed from public sources; flow metrics use the 90 days ending {{WINDOW_END}}. Numbers that could not be computed read "unavailable" instead of an estimate.

> Educational research, not financial advice. No price prediction. A "following the hype" verdict is an acceptable outcome.

**Current verdict: {{THESIS_VERDICT}}** ({{THESIS_CONFIDENCE}} confidence)

{{SECTION_TABLE}}

---

## 1. Claim

NEAR has repositioned itself several times: scalable L1, then Social and the Blockchain Operating System (February 2023), Chain Abstraction and Chain Signatures (March 2024), User-Owned AI (May 2024), and NEAR Intents (November 2024). The investment question is whether those pivots compound into durable usage and token value, or restart each time a new narrative arrives.

**Claim.** $NEAR is an investment in building, not hype, only if (1) each era's product keeps real usage after the narrative moves on, and (2) today's activity returns value to the token at a scale that matters against new supply. Whether adoption followed each announcement (3) raises or lowers confidence. The verdict above applies these rules, published in advance, to the current data.

Why usage and value capture are tested separately: a network can be busy while its token captures little. The chain of value runs activity → fees → NEAR-captured revenue → buybacks or burns → token holders, and each link can leak.

## 2. Evidence for (building)

{{EVIDENCE_FOR}}

## 3. Evidence against (building)

{{EVIDENCE_AGAINST}}

## 4. What would change my mind

Each rule below is evaluated on every rebuild by `src/lib/research/triggers.ts`. TRIGGERED means a condition that weakens the building case currently holds.

{{TRIGGER_TABLE}}

The verdict would move toward **building** if: an era contract that lost most of its activity recovers above 25% of its peak; buybacks reach half of realized net new supply; the take rate rises for two consecutive windows while volume grows; or bought-back tokens are burned rather than held. It would move toward **hype** if: Intents activity falls below 25% of its peak; the take rate compresses by a quarter; or adoption fails to follow the next major pivot.

---

## Sub-question 1: Did it last?

Each era's representative product, compared with its own peak: monthly transactions for social.near and v1.signer (NearBlocks), and monthly swap volume for Intents (DefiLlama). Only exact data is used. For busy contracts, NearBlocks returns a query-planner estimate instead of a count in older months (its response carries a `cost` field); those months are flagged and excluded, which is why v1.signer starts in April 2026, and why Intents is measured by volume. An era "lasted" if its latest complete month keeps at least 25% of its peak and the peak is at least 3 months old; a more recent peak is not judgeable yet.

{{ERA_TABLE}}

Limitations: transactions are not people. Relayers, solvers and Chain Signatures MPC node responses are included. A decline can mean migration to a newer product rather than abandonment, so this measures whether usage stayed, not why it left. The AI era has no single contract to measure and is reported as such.

## Sub-question 2: Did adoption justify the hype?

Adoption is scored on the product, from the date it went live on mainnet, not from the announcement: the product contract's monthly transactions two months after its launch month must reach at least 2x the launch month. Chain Signatures is measured from its mainnet release (8 August 2024), not the March 2024 announcement, when it was on testnet. User-Owned AI has no single product contract, so it is N/A and left out of the count instead of being scored as a failure. Chain-wide active accounts and NEAR's price return minus BTC's are context only: neither can be attributed to one product, and prices can move ahead of adoption.

{{EVENT_TABLE}}

Pivot dates come from NEAR's own announcements (links in the table). BOS is dated to the month (February 2023); its window starts 2023-03-01.

## Sub-question 3: Does it pay $NEAR?

| Measure | Value |
|---|---|
| Buyback-designated Intents revenue per year (90-day run rate, DefiLlama classification) | {{SUP-BUYBACK-ANN}} |
| Realized net new supply per year (net of burns) | {{SUP-NET-NEW-ANN-PCT}} ({{SUP-NET-NEW-ANN-USD}} at today's price) |
| Buyback-designated revenue as a share of realized net new supply | {{COV-BUYBACK-REALIZED}} |
| Supply parity: volume needed for buyback revenue to match net new supply | {{SUP-PARITY-VOL}} ({{SUP-PARITY-MULTIPLE}} today) |
| Burns + buybacks as a share of maximum possible issuance | {{COV-CAPTURE-MAX}} |
| Take rate: NEAR revenue per dollar of Intents volume (prior 90 days) | {{INT-TAKE-RATE}} ({{INT-TAKE-RATE-PRIOR}}) |
| Tokens held by the buyback wallet | {{ONC-BUYBACK-WALLET}} |
| Circulating market cap | {{MKT-NEAR-MCAP}} |

A buyback is not a burn: bought tokens are held by the buyback wallet, and total supply only falls if they are burned. Buyback demand does not move price one-for-one.

### What would it take? The buyback demand target model

How much Intents volume would buyback-designated revenue need to reach a chosen share of market cap (y, 2% by default)? This is a demand target, not a supply break-even; supply parity is shown after the scenarios.

```
annual_buyback_demand_usd = V x f x c x b
buyback_demand_to_mcap    = annual_buyback_demand_usd / M
required_annual_volume    = (y x M) / (f x c x b)
volume_multiple_required  = required_annual_volume / V
```

V is the 90-day Intents volume run rate ({{INT-VOL-ANN}}), f the fee rate ({{INT-FEE-RATE}}), c NEAR's capture of fees ({{INT-CAPTURE}}), b the buyback share ({{INT-BUYBACK-SHARE}}, a DefiLlama classification, not a guaranteed policy), and y a hypothetical target (2% of market cap per year).

{{SCENARIO_TABLE}}

The optimistic scenario already assumes volume doubles, so its multiple of its own volume is half its multiple of today's volume; both are shown.

**Supply parity, for comparison.** For buyback-designated revenue to equal the dollar value of realized net new supply, Intents would need {{SUP-PARITY-VOL}} of annual volume, {{SUP-PARITY-MULTIPLE}} today's run rate. Even then total supply keeps growing, because bought tokens are held, not burned.

**Designated versus executed buybacks.** DefiLlama classifies Intents revenue as buybacks ({{INT-BUYBACK-DESIGNATED-CUM}} designated so far). That is a classification, not verified trades. As an onchain cross-check, the buyback wallet holds {{ONC-BUYBACK-WALLET}}, worth {{ONC-BUYBACK-WALLET-VS-DESIGNATED}} of the designated amount at today's price.

Required volume multiple under fee compression (rows) and target buyback share of market cap (columns):

{{SENSITIVITY_TABLE}}

## Risks this study does not score

**Base-layer active accounts: {{ACT-DAA-YOY}} year over year** ({{ACT-DAA-30D}} daily active accounts over the last 30 days, against {{ACT-DAA-30D-1Y-AGO}} a year earlier). This study does not yet separate the causes: activity a year ago that was incentive- or bot-driven, workloads moving into Intents or to other chains through Chain Signatures, or users leaving. Until it does, it weakens the building case (trigger F4).

**NEAR Intents exploit, 1 October 2026.** NEAR Intents paused deposits and withdrawals on 11 networks after an exploit of about $3.8M, caused by a flaw in how its Omni deposit and withdrawal service interacted with the Intents contract; the flaw was reported as patched and the team pledged full compensation. Recovery of the funds has not been independently confirmed. It is a reliability and trust risk for the product this thesis depends on most, not evidence that the strategy failed. Sources: [The Block](https://theblock.co/news/ecosystems/2026-10-01-near-intents-halts-services-after-3-8-million-exploit-promises-full-compensation-417404), [recovery status](https://en.coinotag.com/near-intents-exploit-climbs-to-3-8m-pausing-near-cross-chain-swaps).

## Data sources, queries and reproduction

```bash
npm install
npm run research:refresh     # fetch live data (about 15 minutes the first time, for monthly era history), rebuild everything
npm run research:rebuild     # offline: rebuild from artifacts/research/raw and verify byte-identical output
```

No database or API key is needed for either command. Outputs: `artifacts/research/canonical.json` (every number), `evidence-manifest.json` (request URL, period, transform and response SHA-256 for each metric), `charts/`, and `dashboard.html` (each chart, its query, and one plain sentence).

| Source | Used for |
|---|---|
| NearBlocks API | Monthly transactions per era contract, daily active accounts, total supply |
| DefiLlama API | NEAR Intents volume, fees, revenue and buybacks; TVL; chain fees; historical prices (coins API) |
| CoinGecko API | Current market caps and price |
| NEAR JSON-RPC | Protocol inflation, total supply, buyback wallet balance |
| NEAR announcements | Pivot dates (linked in Sub-question 2) |
| BigQuery `crypto_near_mainnet_us` | SQL in `research/sql/`, optional, needs your Google Cloud project. Its upstream (NEAR Lake) stopped indexing on 2026-03-24, so live sections use NearBlocks instead. |
| NEAR Intents Explorer API | Optional, partner JWT; integrator concentration ({{INT-EXPLORER-TOP5-SHARE}}) |

Methodology versions: evidence `nebube-evidence-1.1.0`, model `nvabe-1.0.0`, thesis rules `nebube-thesis-1.0.0`. The rule thresholds were fixed while the pipeline was built, after some raw values had been seen; they are not a blind pre-registration. Change them in `src/lib/research/thesis.ts` and rebuild to test their sensitivity.

## Appendix: evidence register

{{EVIDENCE_REGISTER}}
