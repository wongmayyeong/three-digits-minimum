# Limitations

What this research does not know, and why it matters. Each item states what is known, what remains uncertain, why the uncertainty matters to an investor, and what evidence would resolve it. Figures are from the committed snapshot (90-day window ending 10 November 2026) unless stated. See also [THESIS.md](../THESIS.md), [METHODOLOGY.md](METHODOLOGY.md), [DATA_AND_QUERIES.md](DATA_AND_QUERIES.md) and [REPRODUCIBILITY.md](REPRODUCIBILITY.md).

---

## 1. Dataset coverage and freshness

- **Known.** The committed snapshot holds 262 responses retrieved 8–12 November 2026; flow metrics end on 10 November 2026. Price and market cap are CoinGecko values at retrieval (12 November, $3.51), up to two days after the flow window ends.
- **Uncertain.** How far the numbers have moved since. The live site recomputes from responses stored later (newest 13 November 2026, 04:13 UTC) with the same window end, so it shows slightly different figures, for example price $3.34, NEAR's multiple 202x instead of 212x, $100 growth requirement 44.7% instead of 44.0%, implied 2036 price at 20% growth $15 instead of $16, delivered share 67.1% instead of 67.0%. The hackathon demo video was recorded from the live site and shows those live figures (44.7%, about $15, 67.1%); +230.1% and −84.0% are the same in both. The hosted site runs without the background worker, so it does not refresh daily.
- **Why it matters.** Multiples and requirements move with price. A 5% price move changes every requirement on the ladder.
- **Resolves it.** `npm run research:refresh` for a current snapshot; the committed snapshot remains the reproducible reference. The site's `/methodology#reproduce` section shows both dates side by side.

## 2. External API reliability

- **Known.** All data comes from free public APIs (CoinGecko, DefiLlama, NearBlocks, NEAR RPC via FastNEAR, the FastNEAR transactions API). Failures are recorded, never filled; necessary sources stop the rebuild.
- **Uncertain.** Whether providers keep their endpoints, definitions and free tiers. DefiLlama adapters change; NearBlocks returned query-planner estimates for busy contracts in older months.
- **Why it matters.** A definition change can move a figure without any change in NEAR itself.
- **Resolves it.** The committed raw responses freeze what was used; comparing a fresh refresh with the snapshot shows provider revisions.

## 3. Source independence and correlated providers

- **Known.** DefiLlama's NEAR Intents revenue and NEAR's own revenue dashboard share Dune queries, so they are one lineage. CoinGecko and DefiLlama prices can share upstream exchanges.
- **Uncertain.** Whether Intents *volume* (DefiLlama adapter) is complete and correctly deduplicated; it was not independently reconstructed.
- **Why it matters.** Every ladder requirement is denominated in Intents volume and revenue per dollar of volume.
- **Resolves it.** The captured *revenue* was independently reconstructed from FastNEAR to 99.1% of DefiLlama's figure. Volume could be checked with the Intents Explorer API or `intents.near` event logs.

## 4. Missing onchain attribution

- **Known.** Inflows to the revenue wallets are attributed by sender: `intents.near`, the 1Click fund, or other accounts ($440.0K from `auroraliqsupport.near` and `clingy.near`).
- **Uncertain.** Why non-Intents accounts sent NEAR to revenue wallets; NEAR is fungible, so the 1Click fund's later transfers can only be attributed pro rata (100.0% of what the fund ever received came from `intents.near`).
- **Why it matters.** It decides how much of the designated amount is Intents revenue reaching holders.
- **Resolves it.** Disclosure from the wallet operators, or account-level documentation of those transfers.

## 5. Buyback classification uncertainty

- **Known.** DefiLlama labels *all* captured revenue from 23 February 2026 as holders revenue ("buybacks"). This is a relabel by date in its adapter, not an observed purchase.
- **Uncertain.** Whether the $2.13M kept in the front-end fund will later be used for buybacks, and whether the allocation policy persists; governance can change it.
- **Why it matters.** The ladder's main tables use the designated basis (212x); on what was actually delivered NEAR's multiple is 309x.
- **Resolves it.** Future deliveries from the front-end fund, or a published, enforced allocation rule.

## 6. Wallet transfers versus executed trades

- **Known.** NEAR delivered to `buybacks.multisignature.near` is verified onchain: amounts, dates and the path (a 1Click swap output withdrawn from `intents.near`).
- **Uncertain.** What was sold to acquire that NEAR and at what price; the swap input is not visible onchain without the Intents Explorer API. Deliveries are valued at the day's market price, not a verified purchase price.
- **Why it matters.** "Buyback" implies open-market demand for NEAR. That is consistent with the evidence but not proven by it.
- **Resolves it.** Intents Explorer data for the 1Click swaps that fund the wallet.

## 7. Funds held versus token burns

- **Known.** The buyback wallet still holds 100.0% of the NEAR it received. Held NEAR still exists and still counts in supply; it absorbs 0.30% of supply a year from free float against 2.48% net issuance.
- **Uncertain.** Whether held NEAR will be burned, distributed, staked or sold later.
- **Why it matters.** Holding is not a supply reduction. A future sale would reverse the absorption.
- **Resolves it.** Onchain burns from the wallet, or a binding policy on its use.

## 8. Protocol revenue versus tokenholder economics

- **Known.** Intents generates $76.1M of fees a year and $20.6M of captured revenue (run rates); $13.8M a year of NEAR is delivered to the buyback wallet. Verified capture including burns is $14.9M a year, 0.47% of market cap (trigger F6).
- **Uncertain.** How much of future protocol growth will reach $NEAR; fees go mostly to solvers and distributors, and the share NEAR keeps is a policy choice.
- **Why it matters.** A growing protocol does not guarantee a growing token. This is the central distinction of the thesis.
- **Resolves it.** Several quarters of delivered value tracking volume growth.

## 9. Inflation and supply-model assumptions

- **Known.** The base case compounds 2.5% maximum issuance monthly for ten years; realized gross issuance was 2.50% in the window. HSP-029 (2.5% falling to 1.6%) was approved by House of Stake on 2 November 2026.
- **Uncertain.** Whether validators adopt HSP-029 (veto window to 16 November 2026), and whether issuance rules change again within ten years. Foundation and treasury holdings are not reconciled onchain.
- **Why it matters.** HSP-029 would lower the $100 market cap from $167.88B to $155.36B, a small effect next to growth and the multiple (1.08x in the sensitivity table).
- **Resolves it.** Protocol adoption of HSP-029; onchain treasury reconciliation.

## 10. Peer comparison limitations

- **Known.** Peers are fixed in advance and compared on one metric, window and end date. Cross-chain peer tokens trade at 7.55x to 13.5x revenue.
- **Uncertain.** Relay, deBridge, Mayan, Across and Stargate publish no free volume, so Intents' 58.1% share is of *measured* venues only. DefiLlama revenue definitions differ across adapters. The cross-chain token set is small and thinly traded. NEAR's market cap prices the L1 and other products the peers do not have.
- **Why it matters.** "Market leader" and "expensive versus peers" both depend on the peer set.
- **Resolves it.** Paid volume data for the missing rivals; a segment valuation of NEAR's other products.

## 11. Valuation multiple selection

- **Known.** Three cash-flow multiples are applied to 2036: Hyperliquid's (19.5x), Tron's (102x) and NEAR's own today (212x). Platform ratios are a separate framework.
- **Uncertain.** What multiple the market will pay in 2036. NEAR's own multiple is current pricing assumed to persist, not a fair value; Hyperliquid and Tron are different businesses used as reference scenarios.
- **Why it matters.** The multiple moves the answer about as much as growth: at 20% growth the implied price spans $1.49 to $16 across the three multiples.
- **Resolves it.** Nothing resolves it in advance; the ladder shows every multiple so readers can pick their own.

## 12. Long-term projection uncertainty

- **Known.** Requirements are computed for a single horizon (2036) with constant take rate, burns and spot DEX growth (20% a year).
- **Uncertain.** Practically everything about 2036: market structure, regulation, technology, competition.
- **Why it matters.** Ten-year compounding magnifies small input changes; the requirements are scenarios, not forecasts or probabilities.
- **Resolves it.** Yearly checkpoints (THESIS.md §6.3) turn the decade into testable annual steps.

## 13. Historical trend extrapolation

- **Known.** Intents growth reads +230.1% (90 days vs a year earlier), +57.8% (30 days vs a year earlier) or +84.1% (90 days vs the prior 90 days), depending on the window. The weekly chart on `/research` shows the latest week roughly flat against the same week a year earlier.
- **Uncertain.** Which, if any, is a sustainable rate. Intents is young and growing from a small base; one year of data is dominated by the market cycle.
- **Why it matters.** Extrapolating any one of these windows would overstate or understate the case.
- **Also:** NEAR DeFi TVL growth reads +41.4% in the economy map and +27.1% in the opportunity table. Both use the same DefiLlama series; the first compares the latest, incomplete day at retrieval (12 Nov 2026) with 12 Nov 2025, the second the window end (10 Nov 2026) with 10 Nov 2025. The series swung between $117M and $195M within a week around the year-earlier dates, so any single-day comparison is fragile. Using the incomplete latest day also departs from the project's common-end-date rule. Neither figure feeds the ladder or the verdict; the +41.4% feeds trigger F5 (DeFi TVL halving), which is not triggered on either figure.
- **Resolves it.** More years of data; for TVL, a multi-day average on matched end dates. The thesis compares requirements with momentum but never extrapolates momentum.

## 14. Unverified hypotheses

- **Known.** Three of ten hypotheses are untested: H7 (automated vs organic L1 activity), H8 (integrator and solver concentration), H9 (Chain Signatures' role in Intents withdrawals).
- **Uncertain.** Whether the 84% L1 decline is organic users leaving or automated activity ending; whether a few partners carry most Intents volume.
- **Why it matters.** H8 is a concentration risk inside the one product that carries the thesis. The BigQuery SQL in `research/sql/` was written but never executed (no credentials), and its source dataset stopped indexing new blocks on 2026-03-24 according to the CLI's notes.
- **Resolves it.** An Intents Explorer partner JWT; a current receipt-level NEAR dataset.

The hypothesis thresholds were written while building the pipeline, after some raw values had been seen; they are published, not blind pre-registrations.

## 15. Debate-model limitations

- **Known.** Bull and Bear turns are generated by an LLM (OpenAI `gpt-6.1-sol` in the three recorded episodes of 13 November 2026). Code checks every cited evidence ID and every spoken number against the frozen snapshot (3.5% tolerance) and applies score penalties.
- **Uncertain.** Whether the arguments are *right*. The audit catches wrong numbers and invalid citations; it cannot prove reasoning. The Owl Judge is also an LLM, scoring argument quality, not investment merit.
- **Why it matters.** The debate is a way into the research, not evidence. Bear winning all three recorded episodes says nothing about NEAR's price.
- **Resolves it.** Nothing needs resolving for the research: the investment verdict never comes from the debate.

## 16. Incomplete or experimental features

- The hosted site has no background worker: it serves recorded debates, does not process new ones, and does not refresh daily; `/api/health` reports `degraded` for that reason.
- Voices (OpenAI TTS or ElevenLabs) read stored text; the ElevenLabs adapter is tested with a mocked provider.
- Integrator concentration (`INT-EXPLORER-TOP5-SHARE`) is unavailable without a partner JWT.
- Regulation, NEAR AI usage and foundation holdings are not measured by any source in the pipeline.
- The end-to-end test suite was not re-run for the latest documentation pass.

## 17. No investment recommendation or guaranteed outcome

This repository is independent, educational research. It is not financial advice, a recommendation to buy, sell or hold NEAR or any other asset, a price target or a probability of any outcome. Scenario prices are conditional on stated assumptions. The verdict is the author's judgment on the evidence available at the data date and will age as the data changes. Readers should do their own research and consider their own circumstances.
