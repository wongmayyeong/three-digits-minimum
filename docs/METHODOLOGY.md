# Methodology

How the *Three Digits, Minimum?* research is designed, measured and decided. Every formula on this page matches the implementation in [`src/lib/research/`](../src/lib/research) and [`src/lib/data/`](../src/lib/data); file references point to the code that implements each step. Results are in [THESIS.md](../THESIS.md); sources and queries in [DATA_AND_QUERIES.md](DATA_AND_QUERIES.md); how to rebuild in [REPRODUCIBILITY.md](REPRODUCIBILITY.md); known weaknesses in [LIMITATIONS.md](LIMITATIONS.md).

Model versions in the committed snapshot: ladder `three-digits-2.0.1`, evidence `three-digits-evidence-1.1.0`, tokenomics `w4-2.0.0`, buyback model `nvabe-1.0.0`, evidence rules `three-digits-thesis-1.1.0`.

---

## 1. Research design and scope

**Question.** Can NEAR justify $100 per token within ten years, and what must happen to adoption, value capture, supply and valuation for that to be plausible?

**Design.** A conditional, requirements-based analysis, not a forecast:

1. **Layer A (requirements).** For each rung ($10, $25, $50, $100 in 2036), compute the market cap, value attributed to holders, NEAR Intents volume and growth rate it implies under each valuation multiple.
2. **Layer B (evidence status).** Label every condition OBSERVED (in today's data), ASSUMED (a modelling choice) or UNPROVEN (would have to happen; no evidence yet).
3. **Reverse view.** Under fixed growth scenarios and multiples, compute the implied 2036 price.
4. **Supporting workstreams.** Token economics (W4), economy map (W3), cross-chain competition (W2), market sizing (W1), valuation and opportunity cost (W5, W6), hypotheses (W8) and self-challenge (W9), as scoped in [research/three-digits/SCOPE.md](../research/three-digits/SCOPE.md).

**Scope.** NEAR as the subject, not the client: the thesis may conclude that NEAR is unattractive. No outperformance is assumed. The project is offchain research reading public data; it does not trade, custody or deploy contracts.

**Determinism.** All numbers, statuses, headlines, leads and trails are computed by code from stored responses. The only fixed prose is the investment verdict paragraph ([`verdict.ts`](../src/lib/research/verdict.ts)), written by the author and dated.

## 2. Data collection methodology

- **One request catalog.** [`src/lib/data/sources.ts`](../src/lib/data/sources.ts) is the only place URLs are defined. Each request has a key, a source, a time-to-live and a projection that keeps only the fields used.
- **Fetching.** [`fetcher.ts`](../src/lib/data/fetcher.ts) paces requests per source (minimum gaps: CoinGecko 6.5 s, NearBlocks 6 s, DefiLlama 0.3 s, NEAR RPC 0.2 s, FastNEAR 0.25 s), retries on HTTP 429 and 5xx, and records the outcome.
- **Storage.** Each projected response is serialized with sorted keys, hashed with SHA-256 and stored with its URL and retrieval time ([`stores.ts`](../src/lib/data/stores.ts)): as files in `artifacts/research/raw/` plus `manifest.json` for the research CLI, or in PostgreSQL for the web app.
- **Onchain reconstruction.** [`fastnear.ts`](../src/lib/data/fastnear.ts) lists every transaction touching the three revenue wallets and reads each transaction's receipts (section 6).
- **Era history.** Monthly NearBlocks counts for closed months are fetched once and reused; open data refreshes on every run.

## 3. Time-window alignment

- **Common end date.** All flow series that are compared end on the same day: the last day present in every series, minus one day to drop a possibly partial day (`commonEnd`, [`series.ts`](../src/lib/research/series.ts)). In the snapshot this is **10 November 2026**.
- **Complete windows only.** A window sum is computed only if every day in the window is present; otherwise the value is unavailable (`windowAggregate`).
- **Run rate.** `run_rate = sum over the 90 days ending on the end date × 365 / 90`. The 90-day run rate is the primary basis because NEAR's buyback designation began on 23 February 2026; trailing-365-day figures are shown as checks, and NEAR's trailing multiple is shown but not used because its window starts before buybacks began.
- **Year-over-year.** Three growth measures exist and are always labelled:

| Evidence ID | Definition | Snapshot value |
|---|---|---|
| `ECO-INTENTS-VOL-YOY` | Intents volume, 90 days ending on the end date vs the same 90 days a year earlier | +230.1% |
| `LAD-INTENTS-YOY` | Intents volume, latest 30 days vs the same 30 days a year earlier | +57.8% |
| `INT-VOL-GROWTH` | Intents volume, last 90 days vs the prior 90 days | +84.1% |

L1 activity uses matched 90-day windows a year apart (`ECO-L1-TXNS-YOY`, `ECO-L1-ACTIVE-YOY`).

NEAR DeFi TVL growth is computed in two places from the same DefiLlama series (`/v2/historicalChainTvl/Near`), each a single-day comparison:

| Where | Definition | Snapshot value |
|---|---|---|
| `DEFI-TVL-NEAR-YOY` (economy map, trigger F5; `evidence.ts`) | Latest daily value at retrieval (2026-11-12, an incomplete day, $165.0M) vs 2025-11-12 ($116.7M) | +41.4% |
| Opportunity table, NEAR platform route (`valuation.ts`) | Flow-window end 2026-11-10 ($170.3M) vs 2025-11-10 ($134.0M) | +27.1% |

The gap comes from the end dates, not from an arithmetic error: DefiLlama's daily NEAR TVL moved between $117M and $195M within 8–13 November 2025. The first measure also uses an incomplete latest day, which departs from the common-end-date rule above; see [LIMITATIONS.md §13](LIMITATIONS.md#13-historical-trend-extrapolation).

- **Point-in-time values.** Price, market cap and circulating supply come from CoinGecko at retrieval time (12 November 2026 in the snapshot), not on the window end date. This is a known mismatch of up to two days (see [LIMITATIONS.md](LIMITATIONS.md#1-dataset-coverage-and-freshness)).

## 4. Source selection and hierarchy

1. **Onchain primary data** where it is free and complete: NEAR JSON-RPC (supply, inflation, validators, wallet balances, contract state) and the FastNEAR transactions API (revenue-wallet flows).
2. **Established aggregators** for cross-protocol series with consistent definitions: DefiLlama (volume, fees, revenue, holders revenue, TVL, stablecoins, DEX categories, prices), CoinGecko (market data), NearBlocks (chain activity, supply).
3. **Third-party reports** only where no data source exists (the October 2026 Intents exploit, governance dates), typed REPORTED.

Comparisons use the same provider and metric definition for every asset (for example, DefiLlama holders revenue for every multiple). Where two sources measure the same thing through independent paths, they are cross-checked: DefiLlama's Intents revenue (Dune lineage) against the FastNEAR reconstruction.

## 5. Metric definitions

| Term | Definition | Implementation |
|---|---|---|
| Intents volume | DefiLlama `near-intents` daily volume | `defillama.intents.volume` |
| Protocol fees | Gross fees paid by Intents users (protocol and distributor fees), DefiLlama | `defillama.intents.dailyFees` |
| Gross fee rate (f) | Intents fees ÷ volume, same 90 days | `INT-FEE-RATE` |
| Protocol revenue (captured revenue) | NEAR and wNEAR swept into the three revenue wallets (DefiLlama "revenue") | `defillama.intents.dailyRevenue` |
| Designated buybacks | DefiLlama "holders revenue" for Intents: all captured revenue from 23 Feb 2026. A classification, not a transaction and not verified tokenholder income | `defillama.intents.dailyHoldersRevenue` |
| Buyback revenue per dollar of volume | Designated buybacks ÷ volume, same 90 days | `LAD-HOLDER-TAKE-RATE` |
| Burns | DefiLlama NEAR chain revenue: 70% of gas, burned | `defillama.revenue.near` |
| Value attributed to holders (designated basis) | Burns + designated buybacks, 90-day run rate; on the delivered basis, burns + delivered NEAR | `LAD-NEAR-CAPTURE-RUNRATE` |
| Delivered | NEAR received by `buybacks.multisignature.near` from `intents.near` or the 1Click fund, valued at the day's price | `TOK-DELIVERED-*` |
| Verified capture | Delivered (run rate) + burns | `TOK-VERIFIED-CAPTURE` |
| Verified executed purchases | Open-market purchases with known swap inputs and prices | Not measured: needs the Intents Explorer API |
| Intents share of NEAR-chain fees | Intents fees ÷ all protocol fees DefiLlama attributes to the NEAR chain, 30 days. Mostly cross-chain swap fees paid on many chains, not NEAR L1 gas | `ECO-INTENTS-FEE-SHARE` |
| Net issuance | Annualized realized change in total supply (NearBlocks), net of burns | `SUP-NET-NEW-ANN-PCT` |
| Spot DEX volume | DefiLlama DEX overview, "Dexs" category only, summed per day | `LAD-SPOT-DEX-RUNRATE` |
| Cash-flow multiple | Market cap ÷ value attributed to holders (90-day run rate) | `LAD-MULT-*` |

## 6. Onchain wallet reconstruction methodology

Implemented in [`src/lib/data/fastnear.ts`](../src/lib/data/fastnear.ts) (collection) and [`src/lib/research/tokenomics.ts`](../src/lib/research/tokenomics.ts) (accounting).

**Wallets.** The three wallets DefiLlama's NEAR Intents adapter treats as captured revenue (its Dune query 6740088):

| Wallet | Role |
|---|---|
| `fefundsadmin.sputnik-dao.near` | Front-end fund |
| `1csfundsadmin.sputnik-dao.near` | 1Click fund |
| `buybacks.multisignature.near` | Buyback wallet |

**Selection.** For each wallet, page through every transaction the FastNEAR `account` endpoint lists (failing if fewer are listed than the reported count), then fetch each transaction's receipts in batches of 20. Keep:

- native NEAR `Transfer` actions into or out of a wallet, excluding gas refunds from `system` and wrapping or unwrapping through `wrap.near`;
- `ft_transfer` and `ft_transfer_call` receipts on `wrap.near` whose sender or `receiver_id` is a wallet (wNEAR).

Each flow records wallet, direction, counterparty, kind (NEAR or wNEAR), exact yoctoNEAR amount, timestamp, transaction hash and whether the receipt succeeded. A flow seen from two wallets' listings is counted once. Only successful receipts are used, and the partial retrieval day is excluded.

**Classification** (inflows on or after 23 February 2026):

| Flow | Counted as |
|---|---|
| Inflow to any wallet from an account outside the three | Captured revenue (DefiLlama's definition) |
| ...from `intents.near` | Captured from Intents |
| ...from any other account | Captured, not shown to come from Intents (`TOK-NON-INTENTS-INFLOWS`) |
| `intents.near` → buyback wallet | Delivered directly (1Click swap output) |
| 1Click fund → buyback wallet | Delivered via the 1Click fund (memo column; already captured earlier) |
| `intents.near` → front-end fund | Captured revenue retained, not a buyback |
| `intents.near` → 1Click fund | Captured into the 1Click fund |

**Valuation.** Each flow is valued at that day's NEAR price (CoinGecko daily, DefiLlama coins where CoinGecko has no point). If any needed day lacks a price, the result is unavailable.

**Accounting identity.** Over identical dates, DefiLlama's designated amount ≈ delivered directly + into the 1Click fund + into the front-end fund + from non-Intents accounts. The reproduction ratio is `captured (FastNEAR) ÷ DefiLlama revenue` over the same dates (`TOK-REPRODUCTION-RATIO`).

**Delivered share.**

```
delivered_share = (delivered directly + 1Click fund allocation that later moved to the buyback wallet) ÷ designated
```

The 1Click fund's allocation is valued when the fund received it, not when it moved. Because NEAR is fungible, the moved amount is attributed to Intents pro rata to the fund's provenance (`TOK_ONECLICK_PROVENANCE`: the share of everything the fund ever received that came from `intents.near`).

**What it proves and what it does not.** It proves NEAR arrived in the buyback wallet, in what amount and when, and that the wallet still holds it (`TOK-WALLET-RECONCILE` = wallet balance ÷ NEAR received). It does not prove an open-market purchase or its price: the swap input of a 1Click delivery is not visible onchain without the Intents Explorer API.

## 7. Revenue and token-value capture definitions

Every flow is classified before anything is summed ([`tokenomics.ts`](../src/lib/research/tokenomics.ts)):

| Flow | Classification |
|---|---|
| Intents fees, NEAR gas fees | Source of value, not captured |
| Revenue designated as buybacks | Label, not a transaction |
| Captured revenue kept in the front-end fund | Label, not a transaction |
| NEAR delivered to the buyback wallet | Value capture |
| Gas burned (70% of gas) | Value capture |
| Staking emissions | Redistribution (new tokens) |
| Net issuance | Dilution |
| Ecosystem app revenue (RHEA and others) | Not $NEAR value |

**No double counting.** Burns are inside net issuance, so they are never added back as a separate holder yield. Held buybacks are never subtracted from dilution. Dollar flows and supply effects are never netted into one figure; supply effects are reported as shares of supply, side by side. An earlier "verified capture minus net issuance" figure that counted burns twice was removed and covered by a regression test ([AUDIT-LOG.md](../research/three-digits/AUDIT-LOG.md), item 1).

## 8. Supply and dilution modeling

**Supply path to 2036** (`supplyPath`, [`ladder.ts`](../src/lib/research/ladder.ts)), compounded monthly for 120 months from today's circulating supply:

```
current rule:  r(t) = 2.5%
HSP-029:       r(t) = 2.5%                              for t ≤ 0.25 years
               r(t) = 2.5% − 0.9% × (t − 0.25) / 2       for 0.25 < t < 2.25
               r(t) = 1.6%                              for t ≥ 2.25
supply(m) = supply(m−1) × (1 + r(m/12))^(1/12)
```

The current rule is the base case; HSP-029 is shown alongside because it needs validator adoption.

**Staking and dilution** ([`tokenomics.ts`](../src/lib/research/tokenomics.ts)):

```
staking_ratio      = Σ current validators' stake ÷ total supply                      (NEAR RPC)
gross_issuance     = net supply growth + burns (as shares of supply)
nominal_yield      = gross_issuance × (1 − protocol_reward_rate) ÷ staking_ratio
real_yield_staker  = (1 + nominal_yield) ÷ (1 + net supply growth) − 1
real_yield_holder  = 1 ÷ (1 + net supply growth) − 1
circulating_growth = (CoinGecko market cap ÷ price), last day vs a year earlier      (every asset)
ownership_dilution = circulating growth chaining daily changes, excluding one-day changes above 5%
treasury_absorption (NEAR only) = NEAR delivered to the buyback wallet per year ÷ total supply
```

One-day changes above 5% are listed as reclassification or unlock events; the as-reported growth is shown beside the adjusted figure.

## 9. Market capitalization and valuation modeling

**Cash-flow multiples** (same metric, window and end date for every asset):

```
multiple(asset) = CoinGecko market cap ÷ (DefiLlama holders revenue, 90-day run rate)
multiple(NEAR)  = market cap ÷ (burns run rate + designated buybacks run rate)        designated basis
multiple(NEAR)  = market cap ÷ (burns run rate + delivered run rate)                  delivered basis
```

The three multiples applied to NEAR in 2036 are Hyperliquid's, Tron's and NEAR's own today. Each is an ASSUMED valuation scenario: current market pricing, not an independently established fair value, and not an economic law.

**Layer A, per rung p and multiple M** ([`ladder.ts`](../src/lib/research/ladder.ts)):

```
market_cap_2036  = p × supply_2036
value_needed     = market_cap_2036 ÷ M
intents_needed   = max(0, value_needed − burns_2036)          burns held at today's run rate
volume_needed    = intents_needed ÷ buyback_revenue_per_dollar
volume_multiple  = volume_needed ÷ intents_run_rate
growth_needed    = volume_multiple^(1/10) − 1
dex_2036         = spot_dex_run_rate × (1 + 20%)^10            (10% as a low case)
dex_share_2036   = volume_needed ÷ dex_2036
share_multiple   = dex_share_2036 ÷ (intents_run_rate ÷ spot_dex_run_rate)
band             = keeps today's size (≤1.5x) | up to 5x | 5x to 10x | more than 10x
rank_today       = 1 + number of today's top-40 assets (excluding stablecoins, wrapped and tokenized assets) with a larger market cap
```

**Reverse view and checkpoints:**

```
implied_price(g, M) = (intents_run_rate × (1 + g)^10 × buyback_revenue_per_dollar + burns) × M ÷ supply_2036
checkpoint(year i)  = intents_run_rate × (1 + growth_needed)^i                at NEAR's own multiple
multiple_needed(p, g) = p × supply_2036 ÷ (intents_run_rate × (1 + g)^10 × buyback_revenue_per_dollar + burns)
```

with g ∈ {10%, 20%, 40%}. The swing sentence compares the spread of implied prices across growth scenarios (at NEAR's multiple) with the spread across multiples (at 20% growth); spreads within 1.25x of each other are reported as similar.

**Platform framework** (never added to the cash-flow results):

```
stablecoins_needed(p, chain) = market_cap_2036 ÷ (chain market cap ÷ chain stablecoins)
tvl_needed(p, chain)         = market_cap_2036 ÷ (chain market cap ÷ chain DeFi TVL)
```

for Ethereum, BNB Chain, Solana and Tron, compared with NEAR's stablecoins and TVL today.

**Sensitivity** ([`valuation.ts`](../src/lib/research/valuation.ts)): from the base case (20% growth, NEAR's own multiple, today's take rate and burns), each input is moved alone: growth 10% to 30%, multiple 0.5x to 1.5x today's, buyback revenue per dollar 0.5x to 1.5x, supply rule 2.5% vs HSP-029, burns 0x to 5x.

**Buyback demand model** (`nvabe-1.0.0`, [`model.ts`](../src/lib/research/model.ts)), used by the calculator and trigger F3:

```
annual_buyback_demand  = V × f × c × b
buyback_demand_to_mcap = annual_buyback_demand ÷ M
required_annual_volume = (y × M) ÷ (f × c × b)
volume_multiple        = required_annual_volume ÷ V
```

V = Intents run rate, f = fees ÷ volume, c = captured revenue ÷ fees, b = holders revenue ÷ captured revenue, M = market cap, y = target buyback share of market cap (ASSUMED).

## 10. Peer selection and comparability

| Comparison | Peers | Rule |
|---|---|---|
| Cash-flow multiples | Hyperliquid, Tron | Assets valued on holder cash flow, with DefiLlama holders revenue covering the window |
| Platform ratios | Ethereum, BNB Chain, Solana, Tron | Largest chains with stablecoin and TVL data |
| Opportunity cost | BTC, ETH, SOL, SUI, AVAX, TON, APT, HYPE | Fixed in SCOPE.md before results |
| Cross-chain competition | THORChain, Chainflip, Maya, Unit, Relay, deBridge, Mayan, Across, Stargate, Symbiosis, LI.FI, Rango, LayerZero, Wormhole, Axelar | Every protocol in the discovery inventory with DefiLlama data |

Rules: categories are never added together; only swap venues with public volume enter the volume share; aggregators and messaging layers are listed separately and kept out of the execution median; the token median is shown with and without tokens under $25M market cap, as a range rather than a benchmark. The peer set is fixed in advance to avoid survivorship bias.

## 11. Growth rate and CAGR calculations

```
CAGR(required)        = (target ÷ today)^(1/10) − 1
DEX CAGR 2021–2025    = (spot volume 2025 ÷ spot volume 2021)^(1/4) − 1
opportunity CAGR(k)   = (k × (1 + ownership_dilution)^10)^(1/10) − 1        for k ∈ {2.8, 7, 14, 28}
```

The opportunity model holds each asset's valuation ratio fixed and lets its dilution persist, so the same price multiple k needs the driver to grow by k times the dilution factor. It is a mechanical comparison: the same required CAGR does not have the same probability for a young product and a mature chain economy.

The opportunity model and the ladder answer different questions and give slightly different numbers for NEAR: the ladder's $100 rung (28.5x today's price) needs 44.0% a year because it subtracts burns and projects supply monthly; the opportunity model's 28x target needs 43.0% because it compounds ownership dilution directly.

Market growth series ([`market.ts`](../src/lib/research/market.ts)) count calendar years only with at least 360 days of data, report growth only across at least two years, and only when the first year is at least 5% of the last.

## 12. Hypothesis testing methodology

Ten hypotheses were written in [SCOPE.md](../research/three-digits/SCOPE.md) before the data was read, each with a decision rule ([`hypotheses.ts`](../src/lib/research/hypotheses.ts)). Outcomes: SUPPORTED, NOT SUPPORTED, MIXED, or UNTESTED when the data needed is unavailable. Claims were narrowed after external review to what each test measures (H1 fee concentration, H2 an observed valuation gap, H4 diverging trends, H5 ownership dilution, H6 a model result, H10 BTC dependence only). Every rule is printed beside its result in [THESIS.md §10](../THESIS.md#10-ten-testable-hypotheses).

Disclosure: the thresholds were written while building the pipeline, after some raw values had been seen. They are published so anyone can change them and rebuild; they are not a blind pre-registration.

**Falsification triggers** ([`triggers.ts`](../src/lib/research/triggers.ts)) are evaluated on every rebuild:

| ID | Rule |
|---|---|
| F1 | `INT-VOL-GROWTH > 0 and INT-TAKE-RATE < 0.8 × INT-TAKE-RATE-PRIOR` |
| F2 | `INT-FEE-RATE < 0.75 × INT-FEE-RATE-PRIOR` |
| F3 | `MODEL-VOL-MULTIPLE-2PCT > 10` |
| F4 | `ACT-DAA-YOY < −25%` |
| F5 | `DEFI-TVL-NEAR-YOY < −50%` |
| F6 | `VAL-NEAR-VALUE-CAPTURE-ANN ÷ MKT-NEAR-MCAP < 1%` |

## 13. Verdict methodology

- **Investment verdict.** Fixed prose in [`verdict.ts`](../src/lib/research/verdict.ts), written by the author after two external review passes, with a review stamp (`VERDICT_REVIEW`: reviewed 2026-11-14 against data to 2026-11-10). If stored data moves past that window, the site flags the prose as due for review. It has no numeric confidence score.
- **Generated lines.** The short answer, ladder headline, leads, trails and neutral traits are generated by rules from the data (for example, a "lead" for the largest cross-chain venue requires a share above 50%; a "trail" for the delivered gap requires delivery below 90% of the designation), so a refresh cannot leave a claim the numbers no longer support.
- **Supporting evidence rules** (`three-digits-thesis-1.1.0`, [`thesis.ts`](../src/lib/research/thesis.ts)): era durability (an era lasted if its latest month keeps ≥25% of its peak, judged once the peak is 3+ months old), adoption after mainnet launch (≥2x two months after launch), and token payment (Intents buybacks ÷ dollar value of net new supply: ≥50% building, <25% hype). Sections 1 and 3 decide the reading; section 2 sets confidence. The snapshot reads *Mixed evidence, low confidence*.
- **The debate does not decide.** The Owl Judge scores argument quality; the investment verdict never comes from the debate.

## 14. Evidence classifications

| Label | Meaning | Count in snapshot |
|---|---|---|
| OBSERVED | Read from a source, with URL, retrieval time and response hash | 61 |
| DERIVED | Computed here from observed values by a published formula | 477 |
| REPORTED | Stated by a third party, not independently verified | 1 (plus the exploit narrative in THESIS.md) |
| ASSUMED | A scenario choice (multiples, growth, DEX growth, take rate held, supply rule) | Constants in `ladder.ts`, labelled in every condition |
| SPECULATIVE | An opportunity with no measurable evidence; given no dollar value | Economy-map column (NEAR AI) |

Each evidence item stores: ID, label, value or text, unit, type, availability, source name and URL, observed and fetched times, period, transform, inputs, methodology note, validation notes, confidence and the SHA-256 of the raw response.

## 15. Handling missing, delayed or conflicting information

- **Missing:** marked unavailable with the reason; never estimated, interpolated or replaced by a fixture (the synthetic LLM fixture is refused in production and labels its output SYNTHETIC).
- **Incomplete windows:** a window with any missing day yields no value.
- **Estimated counts:** NearBlocks returns query-planner estimates (marked by a `cost` field) for busy contracts in older months; every month is checked and estimates are excluded.
- **Delayed data:** the common end date drops the newest, possibly partial, day.
- **Necessary sources:** the rebuild fails (exit 1) and writes nothing if CoinGecko markets, Intents volume, fees, revenue or NearBlocks charts have neither a fresh nor a stored response.
- **Conflicts:** where two sources disagree, both are shown with their definitions (for example, designated versus delivered buybacks), rather than one being chosen silently.
- **Mutable providers:** aggregators revise history; the committed raw responses freeze what was used.

## 16. Assumptions, sensitivity and uncertainty

| Assumption | Value | Where it matters |
|---|---|---|
| Horizon | 10 years | Every rung |
| Issuance | 2.5% a year (HSP-029 shown alongside) | Supply in 2036 |
| Cash-flow multiple in 2036 | Hyperliquid's, Tron's or NEAR's own today | Value needed per rung |
| Buyback revenue per dollar of volume | Held at today's 90-day value | Volume needed; halving it doubles every requirement |
| Burns | Held at today's run rate | Small channel |
| Spot DEX growth | 20% a year (10% low) | Scale reference only |
| Intents growth scenarios | 10%, 20%, 40% a year | Reverse view; "middle" is not an expected outcome |
| Bands | 1.5x, 5x, 10x of today's DEX ratio | Difficulty labels; our judgment |

Uncertainty is shown through scenarios and one-at-a-time sensitivity, not probabilities. No confidence intervals are computed, because the dominant uncertainties (future multiples, decade-long growth) are not statistical. Every assumption lives in code and can be changed and rebuilt.
