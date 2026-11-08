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

Monthly transactions involving each era's representative contract (NearBlocks), compared with that contract's own peak. An era "lasted" if its latest complete month keeps at least 25% of its peak and the peak is at least 3 months old.

{{ERA_TABLE}}

Limitations: transactions are not people. Relayers, solvers and Chain Signatures MPC node responses are included. A decline can mean migration to a newer product rather than abandonment, so this measures whether usage stayed, not why it left. The AI era has no single contract to measure and is reported as such.

## Sub-question 2: Did adoption justify the hype?

For each pivot, chain-wide daily active accounts in days 60 to 90 after the announcement versus the 30 days before, and the era product's activity two months after its launch month versus the launch month. NEAR's price return minus BTC's is shown as market context only and is not scored, because prices can move ahead of adoption for good reasons.

{{EVENT_TABLE}}

Pivot dates come from NEAR's own announcements (links in the table). BOS is dated to the month (February 2023); its window starts 2023-03-01.

## Sub-question 3: Does it pay $NEAR?

| Measure | Value |
|---|---|
| Intents buybacks per year (90-day run rate) | {{SUP-BUYBACK-ANN}} |
| Realized net new supply per year (net of burns) | {{SUP-NET-NEW-ANN-PCT}} ({{SUP-NET-NEW-ANN-USD}} at today's price) |
| Buybacks as a share of realized net new supply | {{COV-BUYBACK-REALIZED}} |
| Burns + buybacks as a share of maximum possible issuance | {{COV-CAPTURE-MAX}} |
| Take rate: NEAR revenue per dollar of Intents volume (prior 90 days) | {{INT-TAKE-RATE}} ({{INT-TAKE-RATE-PRIOR}}) |
| Tokens held by the buyback wallet | {{ONC-BUYBACK-WALLET}} |
| Circulating market cap | {{MKT-NEAR-MCAP}} |

A buyback is not a burn: bought tokens are held by the buyback wallet, and total supply only falls if they are burned. Buyback demand does not move price one-for-one.

### What would it take? The break-even demand model

```
annual_buyback_demand_usd = V x f x c x b
buyback_demand_to_mcap    = annual_buyback_demand_usd / M
break_even_annual_volume  = (y x M) / (f x c x b)
volume_multiple_required  = break_even_annual_volume / V
```

V is the 90-day Intents volume run rate ({{INT-VOL-ANN}}), f the fee rate ({{INT-FEE-RATE}}), c NEAR's capture of fees ({{INT-CAPTURE}}), b the buyback share ({{INT-BUYBACK-SHARE}}, a DefiLlama classification, not a guaranteed policy), and y a hypothetical target (2% of market cap per year).

{{SCENARIO_TABLE}}

Required volume multiple under fee compression (rows) and target buyback share of market cap (columns):

{{SENSITIVITY_TABLE}}

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
