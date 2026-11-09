<!-- GENERATED FILE. Edit research/THESIS.template.md, then run `npm run research:rebuild`. Every figure is filled from artifacts/research/canonical.json. -->

# Is NEAR Building the Future or Following the Hype?

*Every pivot, tested against the evidence.*

**Track:** NEAR HACKATHON 2026, Investment Thesis. **Data:** refreshed from public sources; flow metrics use the 90 days ending Nov 6, 2026. Numbers that could not be computed read "unavailable" instead of an estimate.

> Educational research, not financial advice. No price prediction. A "following the hype" verdict is an acceptable outcome.

**Current verdict: Mixed evidence** (low confidence)

| Sub-question | Reading | Why |
|---|---|---|
| 1. Did it last? | MIXED | 1 of 2 era products keep at least 25% of their peak monthly activity. |
| 2. Did adoption justify the hype? | BUILDING | Product adoption followed 1 of 2 measurable pivots within two months of mainnet launch. Not measurable, so not counted: Chain Signatures, User-Owned AI. |
| 3. Does it pay $NEAR? | HYPE | Buyback-designated Intents revenue equals 16.8% of the value of realized net new supply; the take rate is rising. |

---

## 1. Claim

NEAR has repositioned itself several times: scalable L1, then Social and the Blockchain Operating System (February 2023), Chain Abstraction and Chain Signatures (March 2024), User-Owned AI (May 2024), and NEAR Intents (November 2024). The investment question is whether those pivots compound into durable usage and token value, or restart each time a new narrative arrives.

**Claim.** $NEAR is an investment in building, not hype, only if (1) each era's product keeps real usage after the narrative moves on, and (2) today's activity returns value to the token at a scale that matters against new supply. Whether adoption followed each announcement (3) raises or lowers confidence. The verdict above applies these rules, published in advance, to the current data.

Why usage and value capture are tested separately: a network can be busy while its token captures little. The chain of value runs activity → fees → NEAR-captured revenue → buybacks or burns → token holders, and each link can leak.

## 2. Evidence for (building)

- Chain Abstraction (Chain Signatures): v1.signer still runs at 48.2% of its 2026-05 peak (2026-10). [ERA-SIGNER-RETENTION]
- Product adoption followed NEAR Intents (beta): intents.near volume activity reached 4.44x its launch-month level two months after mainnet launch (10 November 2024, beta on mainnet). [EVT-INTENTS-PRODUCT-2M]
- NEAR keeps 0.042% of Intents volume, up from 0.026% in the prior 90 days. [INT-TAKE-RATE, INT-TAKE-RATE-PRIOR]

## 3. Evidence against (building)

- Social / BOS: social.near has fallen to 1.02% of its 2023-08 peak (2026-10). [ERA-SOCIAL-RETENTION]
- Product adoption did not follow Blockchain Operating System (BOS): social.near activity was 0.66x its launch-month level two months after mainnet launch (February 2023 (BOS live; SocialDB already on mainnet)); the rule needs 2x. [EVT-BOS-PRODUCT-2M]
- Buyback-designated Intents revenue equals 16.8% of the value of realized net new supply; parity would need 5.96x today's Intents volume. [COV-BUYBACK-REALIZED, SUP-PARITY-MULTIPLE]
- F4 triggered: Base-layer user activity contracts sharply year over year. (-78.7% vs a year earlier).
- F6 triggered: Token-level value capture is under 1% of market cap per year. (0.434% of market cap).

## 4. What would change my mind

Each rule below is evaluated on every rebuild by `src/lib/research/triggers.ts`. TRIGGERED means a condition that weakens the building case currently holds.

| ID | Falsification trigger | Rule | Current reading | Status |
|---|---|---|---|---|
| F1 | Intents volume grows but NEAR-captured revenue per dollar of volume falls. | `INT-VOL-GROWTH > 0 and INT-TAKE-RATE < 0.8 x INT-TAKE-RATE-PRIOR` | volume 81.4%; take rate 0.026% -> 0.042% | **NOT TRIGGERED** |
| F2 | Fee compression: the effective fee rate drops by a quarter or more between consecutive 90-day windows. | `INT-FEE-RATE < 0.75 x INT-FEE-RATE-PRIOR` | 0.138% -> 0.153% | **NOT TRIGGERED** |
| F3 | The volume needed for buyback revenue worth 2% of market cap is more than ten times today's run rate. | `MODEL-VOL-MULTIPLE-2PCT > 10` | 4.84x today's run rate | **NOT TRIGGERED** |
| F4 | Base-layer user activity contracts sharply year over year. | `ACT-DAA-YOY < -25%` | -78.7% vs a year earlier | **TRIGGERED** |
| F5 | DeFi deposits on NEAR halve year over year. | `DEFI-TVL-NEAR-YOY < -50%` | -4.85% vs a year earlier | **NOT TRIGGERED** |
| F6 | Token-level value capture is under 1% of market cap per year. | `VAL-NEAR-VALUE-CAPTURE-ANN / MKT-NEAR-MCAP < 1%` | 0.434% of market cap | **TRIGGERED** |

The verdict would move toward **building** if: an era contract that lost most of its activity recovers above 25% of its peak; buybacks reach half of realized net new supply; the take rate rises for two consecutive windows while volume grows; or bought-back tokens are burned rather than held. It would move toward **hype** if: Intents activity falls below 25% of its peak; the take rate compresses by a quarter; or adoption fails to follow the next major pivot.

---

## Sub-question 1: Did it last?

Each era's representative product, compared with its own peak: monthly transactions for social.near and v1.signer (NearBlocks), and monthly swap volume for Intents (DefiLlama). Only exact data is used. For busy contracts, NearBlocks returns a query-planner estimate instead of a count in older months (its response carries a `cost` field); those months are flagged and excluded, which is why v1.signer starts in April 2026, and why Intents is measured by volume. An era "lasted" if its latest complete month keeps at least 25% of its peak and the peak is at least 3 months old; a more recent peak is not judgeable yet.

| Era | Product and measure | Exact data | Peak month | Latest month | Kept of peak | Lasted? |
|---|---|---|---|---|---|---|
| Social / BOS | `social.near`, transactions per month (NearBlocks) | 2021-02 (31 months were estimates, excluded) | 35,764 (2023-08) | 364 (2026-10) | 1.02% | no |
| Chain Abstraction (Chain Signatures) | `v1.signer`, transactions per month (NearBlocks) | 2026-04 (21 months were estimates, excluded) | 970,819 (2026-05) | 467,548 (2026-10) | 48.2% | yes |
| Intents | `intents.near`, swap volume per month (USD) (DefiLlama) | 2024-12 | $4.80B (2026-09) | $3.99B (2026-10) | 83.0% | not judgeable yet |

Limitations: transactions are not people. Relayers, solvers and Chain Signatures MPC node responses are included. A decline can mean migration to a newer product rather than abandonment, so this measures whether usage stayed, not why it left. The AI era has no single contract to measure and is reported as such.

## Sub-question 2: Did adoption justify the hype?

Adoption is scored on the product, from the date it went live on mainnet, not from the announcement: the product contract's monthly transactions two months after its launch month must reach at least 2x the launch month. Chain Signatures is measured from its mainnet release (8 August 2024), not the March 2024 announcement, when it was on testnet. User-Owned AI has no single product contract, so it is N/A and left out of the count instead of being scored as a failure. Chain-wide active accounts and NEAR's price return minus BTC's are context only: neither can be attributed to one product, and prices can move ahead of adoption.

| Pivot | Announced | Product and mainnet launch | Product activity, launch +2 months (scored) | Adoption followed? | Chain active accounts, +90d (context) | NEAR minus BTC, +90d (context) |
|---|---|---|---|---|---|---|
| [Blockchain Operating System (BOS)](https://near.org/blog/2023-near-in-review) | February 2023 | `social.near` from February 2023 (BOS live; SocialDB already on mainnet) | 0.66x | no | -20.9% | -47.9% |
| [Chain Signatures](https://near.org/blog/chain-signatures-launch-to-enable-transactions-on-any-blockchain-from-a-near-account) | 27 March 2024 (announced; mainnet 8 August 2024) | `v1.signer` from 8 August 2024, mainnet | n/a | N/A, not counted | +52.4% | -12.8% |
| [User-Owned AI](https://near.org/blog/user-owned-ai-is-near) | 22 May 2024 | no single product contract | n/a | N/A, not counted | -23.4% | -33.6% |
| [NEAR Intents (beta)](https://near.org/blog/introducing-near-intents.html) | 10 November 2024 | `intents.near volume` from 10 November 2024, beta on mainnet | 4.44x | yes | -11.3% | -49.0% |

Pivot dates come from NEAR's own announcements (links in the table). BOS is dated to the month (February 2023); its window starts 2023-03-01.

## Sub-question 3: Does it pay $NEAR?

| Measure | Value |
|---|---|
| Buyback-designated Intents revenue per year (90-day run rate, DefiLlama classification) | $20.07M |
| Realized net new supply per year (net of burns) | 2.47% ($119.62M at today's price) |
| Buyback-designated revenue as a share of realized net new supply | 16.8% |
| Supply parity: volume needed for buyback revenue to match net new supply | $286.32B (5.96x today) |
| Burns + buybacks as a share of maximum possible issuance | 17.4% |
| Take rate: NEAR revenue per dollar of Intents volume (prior 90 days) | 0.042% (0.026%) |
| Tokens held by the buyback wallet | 2.21M NEAR |
| Circulating market cap | $4.86B |

A buyback is not a burn: bought tokens are held by the buyback wallet, and total supply only falls if they are burned. Buyback demand does not move price one-for-one.

### What would it take? The buyback demand target model

How much Intents volume would buyback-designated revenue need to reach a chosen share of market cap (y, 2% by default)? This is a demand target, not a supply break-even; supply parity is shown after the scenarios.

```
annual_buyback_demand_usd = V x f x c x b
buyback_demand_to_mcap    = annual_buyback_demand_usd / M
required_annual_volume    = (y x M) / (f x c x b)
volume_multiple_required  = required_annual_volume / V
```

V is the 90-day Intents volume run rate ($48.05B), f the fee rate (0.153%), c NEAR's capture of fees (27.3%), b the buyback share (100.0%, a DefiLlama classification, not a guaranteed policy), and y a hypothetical target (2% of market cap per year).

| Scenario | Annual buyback demand | Buyback / market cap | Volume for 2% of market cap | x today's volume | x scenario's volume | Assumptions |
|---|---|---|---|---|---|---|
| Conservative | $3.76M | 0.077% | $1.24T | 25.8x | 25.8x | Fees compress by half as competitors undercut, NEAR keeps 25% less of fees, half of captured revenue goes to buybacks, and volume does not grow. |
| Base | $20.07M | 0.413% | $232.77B | 4.84x | 4.84x | Measured fee rate, capture and buyback share held constant, and the trailing 90-day volume run rate held flat. |
| Optimistic | $40.15M | 0.826% | $232.77B | 4.84x | 2.42x | Measured fee rate and capture held, all captured revenue goes to buybacks, and volume doubles. |

The optimistic scenario already assumes volume doubles, so its multiple of its own volume is half its multiple of today's volume; both are shown.

**Supply parity, for comparison.** For buyback-designated revenue to equal the dollar value of realized net new supply, Intents would need $286.32B of annual volume, 5.96x today's run rate. Even then total supply keeps growing, because bought tokens are held, not burned.

**Designated versus executed buybacks.** DefiLlama classifies Intents revenue as buybacks ($7.86M designated so far). That is a classification, not verified trades. As an onchain cross-check, the buyback wallet holds 2.21M NEAR, worth 104.3% of the designated amount at today's price.

Required volume multiple under fee compression (rows) and target buyback share of market cap (columns):

| Fee compression \ target y | 0.500% | 1.00% | 2.00% | 5.00% |
|---|---|---|---|---|
| 0.000% | 1.21x | 2.42x | 4.84x | 12.1x |
| 25.0% | 1.61x | 3.23x | 6.46x | 16.1x |
| 50.0% | 2.42x | 4.84x | 9.69x | 24.2x |
| 75.0% | 4.84x | 9.69x | 19.4x | 48.4x |

## Risks this study does not score

**Base-layer active accounts: -78.7% year over year** (56,865 daily active accounts over the last 30 days, against 266,657 a year earlier). This study does not yet separate the causes: activity a year ago that was incentive- or bot-driven, workloads moving into Intents or to other chains through Chain Signatures, or users leaving. Until it does, it weakens the building case (trigger F4).

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
| NEAR Intents Explorer API | Optional, partner JWT; integrator concentration (unavailable (INT-EXPLORER-TOP5-SHARE)) |

Methodology versions: evidence `nebube-evidence-1.1.0`, model `nvabe-1.0.0`, thesis rules `nebube-thesis-1.0.0`. The rule thresholds were fixed while the pipeline was built, after some raw values had been seen; they are not a blind pre-registration. Change them in `src/lib/research/thesis.ts` and rebuild to test their sensitivity.

## Appendix: evidence register

| ID | Metric | Value | Type | Period | Source |
|---|---|---|---|---|---|
| MKT-NEAR-MCAP | NEAR circulating market cap | $4.86B | OBSERVED | point in time | CoinGecko |
| MKT-NEAR-PRICE | NEAR price | $3.71 | OBSERVED | point in time | CoinGecko |
| MKT-NEAR-CIRC | NEAR circulating supply (CoinGecko) | 1.31B NEAR | OBSERVED | point in time | CoinGecko |
| MKT-SOL-MCAP | Solana circulating market cap | $52.70B | OBSERVED | point in time | CoinGecko |
| MKT-SUI-MCAP | Sui circulating market cap | $3.51B | OBSERVED | point in time | CoinGecko |
| MKT-AVAX-MCAP | Avalanche circulating market cap | $3.64B | OBSERVED | point in time | CoinGecko |
| MKT-NEAR-MCAP-1Y | NEAR market cap change, trailing 365 days | 29.4% | DERIVED | Nov 9, 2025 to Nov 8, 2026 | CoinGecko |
| INT-VOL-90D | NEAR Intents swap volume, 90 days | $11.85B | OBSERVED | Aug 9, 2026 to Nov 6, 2026 | DefiLlama |
| INT-VOL-PRIOR-90D | NEAR Intents swap volume, prior 90 days | $6.53B | OBSERVED | May 11, 2026 to Aug 8, 2026 | DefiLlama |
| INT-FEES-90D | NEAR Intents gross fees, 90 days | $18.14M | OBSERVED | Aug 9, 2026 to Nov 6, 2026 | DefiLlama |
| INT-FEES-PRIOR-90D | NEAR Intents gross fees, prior 90 days | $9.00M | OBSERVED | May 11, 2026 to Aug 8, 2026 | DefiLlama |
| INT-REV-90D | NEAR Intents captured revenue, 90 days | $4.95M | OBSERVED | Aug 9, 2026 to Nov 6, 2026 | DefiLlama |
| INT-REV-PRIOR-90D | NEAR Intents captured revenue, prior 90 days | $1.73M | OBSERVED | May 11, 2026 to Aug 8, 2026 | DefiLlama |
| INT-BUYBACK-90D | Revenue DefiLlama classifies as buybacks, 90 days | $4.95M | OBSERVED | Aug 9, 2026 to Nov 6, 2026 | DefiLlama |
| INT-VOL-ANN | NEAR Intents annualized volume (V) | $48.05B | DERIVED | Aug 9, 2026 to Nov 6, 2026 | Computed here |
| INT-VOL-GROWTH | Volume change, last 90 days vs prior 90 days | 81.4% | DERIVED | May 11, 2026 to Nov 6, 2026 | Computed here |
| INT-FEE-RATE | Effective gross fee rate (f) | 0.153% | DERIVED | Aug 9, 2026 to Nov 6, 2026 | Computed here |
| INT-FEE-RATE-PRIOR | Effective gross fee rate, prior 90 days | 0.138% | DERIVED | May 11, 2026 to Aug 8, 2026 | Computed here |
| INT-CAPTURE | Protocol capture of gross fees (c) | 27.3% | DERIVED | Aug 9, 2026 to Nov 6, 2026 | Computed here |
| INT-CAPTURE-PRIOR | Protocol capture of gross fees, prior 90 days | 19.2% | DERIVED | May 11, 2026 to Aug 8, 2026 | Computed here |
| INT-TAKE-RATE | NEAR-captured revenue per dollar of volume (f x c) | 0.042% | DERIVED | Aug 9, 2026 to Nov 6, 2026 | Computed here |
| INT-TAKE-RATE-PRIOR | NEAR-captured revenue per dollar of volume, prior 90 days | 0.026% | DERIVED | May 11, 2026 to Aug 8, 2026 | Computed here |
| INT-BUYBACK-SHARE | Share of captured revenue classified as buybacks (b) | 100.0% | DERIVED | Aug 9, 2026 to Nov 6, 2026 | Computed here |
| INT-REV-ANN | NEAR Intents captured revenue, annualized | $20.07M | DERIVED | Aug 9, 2026 to Nov 6, 2026 | Computed here |
| INT-DEFINITIONS | DefiLlama fee and revenue definitions for NEAR Intents | text | REPORTED | point in time | DefiLlama |
| ONC-BUYBACK-WALLET | NEAR held by buybacks.multisignature.near | 2.21M NEAR | OBSERVED | point in time | NEAR JSON-RPC (FastNEAR) |
| ONC-TOTAL-SUPPLY | NEAR total supply (protocol) | 1.31B NEAR | OBSERVED | point in time | NEAR JSON-RPC (FastNEAR) |
| ONC-MAX-INFLATION | Protocol maximum annual inflation rate | 2.50% | OBSERVED | point in time | NEAR JSON-RPC (FastNEAR) |
| ONC-BUYBACK-PCT-SUPPLY | Buyback wallet holdings as share of total supply | 0.169% | DERIVED | point in time | Computed here |
| ONC-ISSUANCE-USD | Maximum annual issuance at current price | $121.61M | DERIVED | point in time | Computed here |
| ACT-DAA-30D | Daily active accounts, 30-day mean | 56,865 | OBSERVED | Oct 8, 2026 to Nov 6, 2026 | NearBlocks |
| ACT-DAA-30D-1Y-AGO | Daily active accounts, 30-day mean one year earlier | 266,657 | OBSERVED | Oct 8, 2025 to Nov 6, 2025 | NearBlocks |
| ACT-TXN-30D | Daily transactions, 30-day mean | 674,463 | OBSERVED | Oct 8, 2026 to Nov 6, 2026 | NearBlocks |
| ACT-NEW-30D | New accounts per day, 30-day mean | 9,704 | OBSERVED | Oct 8, 2026 to Nov 6, 2026 | NearBlocks |
| ACT-DAA-YOY | Daily active accounts, change vs one year earlier | -78.7% | DERIVED | point in time | Computed here |
| ACT-GAS-FEES-30D | Base-layer transaction fees, 30 days (NearBlocks) | $172.5K | OBSERVED | Oct 8, 2026 to Nov 6, 2026 | NearBlocks |
| ACT-RETENTION | Retained signer cohorts (BigQuery) | unavailable | OBSERVED | point in time | Google BigQuery: crypto_near_mainnet_us |
| DEFI-TVL-NEAR | NEAR chain DeFi TVL | $175.32M | OBSERVED | as of Nov 8, 2026 | DefiLlama |
| DEFI-TVL-NEAR-1Y-AGO | NEAR chain DeFi TVL one year earlier | $184.26M | OBSERVED | as of Nov 8, 2025 | DefiLlama |
| DEFI-TVL-NEAR-YOY | NEAR TVL change vs one year earlier | -4.85% | DERIVED | point in time | Computed here |
| DEFI-RHEA-LEND-TVL | RHEA Lend TVL on NEAR | $149.41M | OBSERVED | as of Nov 8, 2026 | DefiLlama |
| DEFI-RHEA-DEX-TVL | RHEA DEX TVL on NEAR | $23.17M | OBSERVED | as of Nov 8, 2026 | DefiLlama |
| DEFI-STABLES-NEAR | Stablecoin supply on NEAR | $130.49M | OBSERVED | as of Nov 8, 2026 | DefiLlama |
| FEES-NEAR-CHAIN-90D | NEAR base-layer gas fees, 90 days | $367.4K | OBSERVED | Aug 9, 2026 to Nov 6, 2026 | DefiLlama |
| FEES-NEAR-BURN-90D | NEAR gas fees burned, 90 days | $257.1K | OBSERVED | Aug 9, 2026 to Nov 6, 2026 | DefiLlama |
| VAL-NEAR-VALUE-CAPTURE-ANN | Token-level value capture, annualized (burn + Intents buybacks) | $21.12M | DERIVED | point in time | Computed here |
| VAL-NEAR-MCAP-TO-CAPTURE | Market cap / annualized token value capture | 230x | DERIVED | point in time | Computed here |
| PEER-NEAR-FEES-30D | NEAR chain fees, 30 days | $174.4K | OBSERVED | Oct 8, 2026 to Nov 6, 2026 | DefiLlama |
| PEER-NEAR-TVL | NEAR DeFi TVL | $172.96M | OBSERVED | as of Nov 6, 2026 | DefiLlama |
| PEER-NEAR-DEX-30D | NEAR DEX volume, 30 days | $4.38B | OBSERVED | Oct 8, 2026 to Nov 6, 2026 | DefiLlama |
| PEER-NEAR-MCAP-TO-FEES | NEAR market cap / annualized chain fees | 2,292x | DERIVED | point in time | Computed here |
| PEER-NEAR-MCAP-TO-TVL | NEAR market cap / DeFi TVL | 28.1x | DERIVED | point in time | Computed here |
| PEER-SOL-FEES-30D | Solana chain fees, 30 days | $18.81M | OBSERVED | Oct 8, 2026 to Nov 6, 2026 | DefiLlama |
| PEER-SOL-TVL | Solana DeFi TVL | $5.26B | OBSERVED | as of Nov 6, 2026 | DefiLlama |
| PEER-SOL-DEX-30D | Solana DEX volume, 30 days | $56.85B | OBSERVED | Oct 8, 2026 to Nov 6, 2026 | DefiLlama |
| PEER-SOL-MCAP-TO-FEES | Solana market cap / annualized chain fees | 230x | DERIVED | point in time | Computed here |
| PEER-SOL-MCAP-TO-TVL | Solana market cap / DeFi TVL | 10.0x | DERIVED | point in time | Computed here |
| PEER-SUI-FEES-30D | Sui chain fees, 30 days | unavailable | OBSERVED | Oct 8, 2026 to Nov 6, 2026 | DefiLlama |
| PEER-SUI-TVL | Sui DeFi TVL | $438.01M | OBSERVED | as of Nov 6, 2026 | DefiLlama |
| PEER-SUI-DEX-30D | Sui DEX volume, 30 days | $890.60M | OBSERVED | Oct 8, 2026 to Nov 6, 2026 | DefiLlama |
| PEER-SUI-MCAP-TO-FEES | Sui market cap / annualized chain fees | unavailable | DERIVED | point in time | Computed here |
| PEER-SUI-MCAP-TO-TVL | Sui market cap / DeFi TVL | 8.01x | DERIVED | point in time | Computed here |
| PEER-AVAX-FEES-30D | Avalanche chain fees, 30 days | $316.0K | OBSERVED | Oct 8, 2026 to Nov 6, 2026 | DefiLlama |
| PEER-AVAX-TVL | Avalanche DeFi TVL | $569.79M | OBSERVED | as of Nov 6, 2026 | DefiLlama |
| PEER-AVAX-DEX-30D | Avalanche DEX volume, 30 days | $2.67B | OBSERVED | Oct 8, 2026 to Nov 6, 2026 | DefiLlama |
| PEER-AVAX-MCAP-TO-FEES | Avalanche market cap / annualized chain fees | 947x | DERIVED | point in time | Computed here |
| PEER-AVAX-MCAP-TO-TVL | Avalanche market cap / DeFi TVL | 6.39x | DERIVED | point in time | Computed here |
| INT-EXPLORER-TOP5-SHARE | Share of sampled 1Click volume from top 5 referrers | unavailable | OBSERVED | point in time | NEAR Intents Explorer API |
| INT-EXPLORER-MEDIAN-SWAP | Median sampled 1Click swap size | unavailable | OBSERVED | point in time | NEAR Intents Explorer API |
| MODEL-BUYBACK-USD | Annual buyback demand at current run rate | $20.07M | DERIVED | Aug 9, 2026 to Nov 6, 2026 | Buyback target model nvabe-1.0.0 |
| MODEL-BUYBACK-TO-MCAP | Annual buyback demand / market cap | 0.413% | DERIVED | Aug 9, 2026 to Nov 6, 2026 | Buyback target model nvabe-1.0.0 |
| MODEL-BREAKEVEN-VOL-2PCT | Annual volume needed for buybacks = 2% of market cap | $232.77B | DERIVED | Aug 9, 2026 to Nov 6, 2026 | Buyback target model nvabe-1.0.0 |
| MODEL-VOL-MULTIPLE-2PCT | Volume multiple needed for 2% of market cap | 4.84x | DERIVED | Aug 9, 2026 to Nov 6, 2026 | Buyback target model nvabe-1.0.0 |
| MODEL-REQ-TAKE-RATE-2PCT | Required f x c x b at today's volume for 2% of market cap | 0.202% | DERIVED | Aug 9, 2026 to Nov 6, 2026 | Buyback target model nvabe-1.0.0 |
| MODEL-CURRENT-TAKE-RATE | Current f x c x b (volume converted to buyback demand) | 0.042% | DERIVED | Aug 9, 2026 to Nov 6, 2026 | Buyback target model nvabe-1.0.0 |
| ERA-SOCIAL-PEAK | social.near: peak transactions per month (2023-08) | 35,764 | OBSERVED | Feb 1, 2021 to Oct 1, 2026 | NearBlocks |
| ERA-SOCIAL-LATEST | social.near: transactions per month, latest complete month (2026-10) | 364 | OBSERVED | Feb 1, 2021 to Oct 1, 2026 | NearBlocks |
| ERA-SOCIAL-RETENTION | social.near: latest month as a share of its peak | 1.02% | DERIVED | point in time | Computed here |
| ERA-SIGNER-PEAK | v1.signer: peak transactions per month (2026-05) | 970,819 | OBSERVED | Apr 1, 2026 to Oct 1, 2026 | NearBlocks |
| ERA-SIGNER-LATEST | v1.signer: transactions per month, latest complete month (2026-10) | 467,548 | OBSERVED | Apr 1, 2026 to Oct 1, 2026 | NearBlocks |
| ERA-SIGNER-RETENTION | v1.signer: latest month as a share of its peak | 48.2% | DERIVED | point in time | Computed here |
| ERA-INTENTS-PEAK | intents.near: peak swap volume per month (USD) (2026-09) | $4.80B | OBSERVED | Dec 1, 2024 to Oct 1, 2026 | DefiLlama |
| ERA-INTENTS-LATEST | intents.near: swap volume per month (USD), latest complete month (2026-10) | $3.99B | OBSERVED | Dec 1, 2024 to Oct 1, 2026 | DefiLlama |
| ERA-INTENTS-RETENTION | intents.near: latest month as a share of its peak | 83.0% | DERIVED | point in time | Computed here |
| EVT-BOS-REL-90D | Blockchain Operating System (BOS): NEAR minus BTC return, 90 days after February 2023 | -47.9% | DERIVED | Mar 1, 2023 to May 30, 2023 | DefiLlama coins (CoinGecko prices) |
| EVT-BOS-DAA-90D | Blockchain Operating System (BOS): change in daily active accounts, days 60-90 after vs 30 days before | -20.9% | DERIVED | Jan 30, 2023 to May 30, 2023 | NearBlocks |
| EVT-BOS-PRODUCT-2M | Blockchain Operating System (BOS): social.near activity two months after its mainnet launch month vs the launch month | 0.66x | DERIVED | Mar 1, 2023 to May 1, 2023 | NearBlocks |
| EVT-CHAIN-SIGNATURES-REL-90D | Chain Signatures: NEAR minus BTC return, 90 days after 27 March 2024 (announced; mainnet 8 August 2024) | -12.8% | DERIVED | Mar 27, 2024 to Jun 25, 2024 | DefiLlama coins (CoinGecko prices) |
| EVT-CHAIN-SIGNATURES-DAA-90D | Chain Signatures: change in daily active accounts, days 60-90 after vs 30 days before | 52.4% | DERIVED | Feb 26, 2024 to Jun 25, 2024 | NearBlocks |
| EVT-CHAIN-SIGNATURES-PRODUCT-2M | Chain Signatures: v1.signer activity two months after its mainnet launch month vs the launch month | unavailable | DERIVED | point in time | NearBlocks |
| EVT-USER-OWNED-AI-REL-90D | User-Owned AI: NEAR minus BTC return, 90 days after 22 May 2024 | -33.6% | DERIVED | May 22, 2024 to Aug 20, 2024 | DefiLlama coins (CoinGecko prices) |
| EVT-USER-OWNED-AI-DAA-90D | User-Owned AI: change in daily active accounts, days 60-90 after vs 30 days before | -23.4% | DERIVED | Apr 22, 2024 to Aug 20, 2024 | NearBlocks |
| EVT-INTENTS-REL-90D | NEAR Intents (beta): NEAR minus BTC return, 90 days after 10 November 2024 | -49.0% | DERIVED | Nov 10, 2024 to Feb 8, 2025 | DefiLlama coins (CoinGecko prices) |
| EVT-INTENTS-DAA-90D | NEAR Intents (beta): change in daily active accounts, days 60-90 after vs 30 days before | -11.3% | DERIVED | Oct 11, 2024 to Feb 8, 2025 | NearBlocks |
| EVT-INTENTS-PRODUCT-2M | NEAR Intents (beta): intents.near volume activity two months after its mainnet launch month vs the launch month | 4.44x | DERIVED | Dec 1, 2024 to Feb 1, 2025 | DefiLlama |
| SUP-NET-NEW-ANN-PCT | Realized net new NEAR supply, annualized | 2.47% | DERIVED | Aug 8, 2026 to Nov 6, 2026 | NearBlocks |
| SUP-NET-NEW-ANN-USD | Realized net new supply per year at today's price | $119.62M | DERIVED | Aug 8, 2026 to Nov 6, 2026 | Computed here |
| SUP-PARITY-VOL | Annual Intents volume at which buyback-designated revenue equals the value of realized net new supply | $286.32B | DERIVED | point in time | Computed here |
| SUP-PARITY-MULTIPLE | Parity volume as a multiple of today's Intents volume run rate | 5.96x | DERIVED | point in time | Computed here |
| INT-BUYBACK-DESIGNATED-CUM | Buyback-designated Intents revenue since DefiLlama began classifying it (2026-02-23) | $7.86M | DERIVED | Feb 23, 2026 to Nov 6, 2026 | DefiLlama |
| ONC-BUYBACK-WALLET-VS-DESIGNATED | Buyback wallet holdings at today's price vs cumulative buyback-designated revenue | 104.3% | DERIVED | point in time | Computed here |
| COV-BUYBACK-REALIZED | Buyback-designated revenue as a share of realized net new supply | 16.8% | DERIVED | Aug 8, 2026 to Nov 6, 2026 | Computed here |
| COV-CAPTURE-MAX | Burns plus buybacks as a share of maximum issuance | 17.4% | DERIVED | point in time | Computed here |
