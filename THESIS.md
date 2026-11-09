<!-- GENERATED FILE. Edit research/THESIS.template.md, then run `npm run research:rebuild`. Every figure is filled from artifacts/research/canonical.json. -->

# Three Digits, Minimum?

*How far can NEAR really go? An evidence-based NEAR price ladder.*

**Track:** NEAR HACKATHON 2026, Investment Thesis. **Data:** refreshed from public sources; flow metrics use the 90 days ending Nov 7, 2026. Numbers that could not be computed read "unavailable" instead of an estimate.

> Educational research, not financial advice. Not a price prediction. "Three digits, minimum." is a line attributed to NEAR co-founder Illia Polosukhin and repeated across the NEAR community; we use it as a hook and test it against data.

**The short answer.** At today's valuation premium, $25 in ten years needs NEAR Intents to win up to 5x today's share of DEX volume; $100 needs 9.1% of all DEX volume (9.0x today's share). If NEAR is priced like a cash-flow token instead, $100 needs 22.2%. How fast Intents grows moves the answer more than how the market values NEAR.

---

## 1. The claim, and how we test it

"Three digits, minimum" means a NEAR price of $100 or more. We do not try to predict whether it happens. We build a **price ladder** for ten years from now: $10, $25, $50 and $100. For each rung we compute what NEAR would have to achieve (Layer A) and label every condition as **observed** in today's data, **assumed** by the model, or **unproven** (Layer B). Then we turn it around: under low, base and high growth and several valuation multiples seen in the market today, where does the price land?

NEAR's economic engine today is NEAR Intents, a cross-chain swap service. Part of every swap fee is captured by NEAR and, since February 2026, used to buy back $NEAR. The chain of value runs: Intents volume → fees → NEAR-captured revenue → buybacks (and gas burns) → token holders.

## 2. The dream: what $100 would mean

| | Today | At $100 in ten years |
|---|---|---|
| Price | $3.56 | $100 (28.1x) |
| Market cap (2.5% issuance) | $4.67B | $167.85B |
| Market cap if HSP-029 takes effect | | $155.33B |
| Rank among crypto assets (stablecoins excluded) | | #3 against today's market |
| Share of all crypto ($2.50T today) | 0.187% | 6.73% |
| Versus Solana / Ethereum today | | 3.28x / 0.65x |

$100 is not a bigger pump; it is a different rank in crypto. Supply keeps growing, so $100 in ten years means a larger market cap than $100 today. HSP-029, approved by House of Stake on 2 November 2026, would cut maximum issuance from 2.5% to 1.6% over 24 months after a ~90-day buffer; it needs validator adoption and can be vetoed until 16 November, so the ladder uses today's 2.5% rule and shows HSP-029 alongside.

## 3. How the market values crypto assets

| Token | How it is valued | Market cap | Revenue to holders, 1 year | Market cap / revenue |
|---|---|---|---|---|
| Ethereum | Platform premium | $259.50B | $48.10M | 5,395x |
| BNB | Platform premium | $90.27B | $16.00M | 5,643x |
| Solana | Platform premium | $51.24B | $25.59M | 2,002x |
| Tron | Cash flow | $30.16B | $333.75M | 90.4x |
| Hyperliquid | Cash flow | $17.68B | $680.35M | 26.0x |
| **NEAR** (burn + Intents buybacks, 90-day run rate) | In between | $4.67B | $21.23M | 220x |

There are two regimes. The largest platforms (Ethereum, BNB, Solana) are not priced on the revenue that reaches holders at all; they carry a **platform premium** for being where money lives. **Cash-flow tokens** (Hyperliquid, Tron) are priced on what they pay holders. A three-digit NEAR has to come from one of the two. The ladder applies each of these multiples to NEAR in ten years. They are assumptions, not forecasts.

## 4. The ladder: what each rung takes

Share of the 2036 DEX market NEAR Intents would need, by rung and valuation. The DEX market is today's $3.24T a year grown 20% a year (an assumption; it grew 27.5% a year from 2021 to 2025). Intents handles 1.01% today, at a take rate of 0.042% of volume.

| Rung (ten years) | Priced like Hyperliquid (26.0x) | Priced like Tron (90.4x) | Today's NEAR premium (220x) | Platform premium (Solana) (2,002x) |
|---|---|---|---|---|
| **$100** (28.1x, $167.85B, #3) | 77.1% (10x+ share) | 22.2% (10x+ share) | 9.10% (5x to 10x share) | 1.00% (keeps share) |
| **$50** (14.0x, $83.93B, #4) | 38.6% (10x+ share) | 11.1% (10x+ share) | 4.55% (up to 5x share) | 0.500% (keeps share) |
| **$25** (7.02x, $41.96B, #6) | 19.3% (10x+ share) | 5.54% (5x to 10x share) | 2.28% (up to 5x share) | 0.250% (keeps share) |
| **$10** (2.81x, $16.79B, #9) | 7.71% (5x to 10x share) | 2.22% (up to 5x share) | 0.910% (keeps share) | 0.100% (keeps share) |

Bands: **keeps share** (at most 1.5x today's share), **up to 5x share**, **5x to 10x share**, **10x+ share**. The Solana column shows how little revenue matters if NEAR earned a platform premium; section 6 shows what that premium would require.

What would have to be true at each rung (today's valuation premium):

| Rung | Revenue to holders needed | Intents volume needed | Growth needed, 10 years | Valuation premium persists | Fee rate holds |
|---|---|---|---|---|---|
| $10 | $76.29M/yr, 3.59x today (unproven) | $182.75B/yr (unproven) | 14.2% a year (unproven; today 72.8% YoY, observed) | assumed | assumed |
| $25 | $190.72M/yr, 8.98x today (unproven) | $456.88B/yr (unproven) | 25.2% a year (unproven; today 72.8% YoY, observed) | assumed | assumed |
| $50 | $381.43M/yr, 18.0x today (unproven) | $913.77B/yr (unproven) | 34.2% a year (unproven; today 72.8% YoY, observed) | assumed | assumed |
| $100 | $762.87M/yr, 35.9x today (unproven) | $1.83T/yr (unproven) | 43.8% a year (unproven; today 72.8% YoY, observed) | assumed | assumed |

## 5. Where scenarios land

Implied price in ten years = Intents volume grown from today's $48.35B run rate x take rate x valuation multiple / supply in 2036. Growth rates are scenarios; nothing here is a forecast.

| Intents growth to 2036 | Priced like Hyperliquid | Priced like Tron | Today's NEAR premium | Platform premium (Solana) |
|---|---|---|---|---|
| Low, 10.0% a year | $0.81 (0.23x) | $2.82 (0.79x) | $6.86 (1.93x) | $62 (17.5x) |
| Base, 20.0% a year | $1.93 (0.54x) | $6.73 (1.89x) | $16 (4.60x) | $149 (41.9x) |
| High, 40.0% a year | $9.04 (2.54x) | $31 (8.83x) | $77 (21.5x) | $696 (196x) |

Growth moves the outcome more than valuation does: prices spread 11.2x across growth scenarios at today's premium, and 8.47x across cash-flow and today's multiples at base growth.

## 6. The evidence

**Is NEAR Intents on the path?** Annual volume $48.35B (90-day run rate); 72.8% year over year (latest 30 days); 1.01% of all DEX volume. The volume Intents would need each year, at today's valuation premium, for each rung:

| Rung | 2027 | 2028 | 2029 | 2030 | 2031 | 2032 | 2033 | 2034 | 2035 | 2036 |
|---|---|---|---|---|---|---|---|---|---|---|
| $100 | $69.53B | $99.98B | $143.76B | $206.72B | $297.26B | $427.45B | $614.65B | $883.84B | $1.27T | $1.83T |
| $50 | $64.87B | $87.03B | $116.77B | $156.67B | $210.19B | $282.01B | $378.36B | $507.63B | $681.07B | $913.77B |
| $25 | $60.53B | $75.77B | $94.85B | $118.73B | $148.63B | $186.06B | $232.91B | $291.56B | $364.98B | $456.88B |
| $10 | $55.23B | $63.08B | $72.05B | $82.30B | $94.00B | $107.37B | $122.64B | $140.08B | $160.00B | $182.75B |

**Could NEAR earn a platform premium instead?** Platforms are valued relative to the money that lives on them. For a $100 NEAR to look like these chains:

| Valued like | Stablecoins on NEAR needed | vs today | DeFi TVL needed | vs today |
|---|---|---|---|---|
| Ethereum | $86.97B | 667x | $26.90B | 162x |
| BNB Chain | $25.52B | 196x | $9.41B | 56.6x |
| Solana | $48.37B | 371x | $16.59B | 99.9x |
| Tron | $520.89B | 3,992x | $27.55B | 166x |

**Does the token capture value today?**

| Measure | Value |
|---|---|
| Buyback-designated Intents revenue per year (90-day run rate, DefiLlama classification) | $20.18M |
| Realized net new supply per year (net of burns) | 2.47% ($114.71M at today's price) |
| Buyback-designated revenue as a share of realized net new supply | 17.6% |
| Supply parity: volume needed for buyback revenue to match net new supply | $274.81B (5.68x today) |
| Take rate: NEAR revenue per dollar of Intents volume (prior 90 days) | 0.042% (0.027%) |
| Tokens held by the buyback wallet | 2.22M NEAR |
| Circulating market cap | $4.67B |

A buyback is not a burn: bought tokens are held, and total supply only falls if they are burned. DefiLlama's buyback designation is a classification ($7.89M so far); as an onchain cross-check, the buyback wallet holds 2.22M NEAR, worth 100.3% of the designated amount at today's price.

**Track record: did NEAR's earlier pivots last?** Each era's representative product against its own peak, exact data only. For busy contracts NearBlocks returns a query-planner estimate instead of a count in older months (its response carries a `cost` field); those months are excluded, which is why v1.signer starts in April 2026 and Intents is measured by DefiLlama volume.

| Era | Product and measure | Exact data | Peak month | Latest month | Kept of peak | Lasted? |
|---|---|---|---|---|---|---|
| Social / BOS | `social.near`, transactions per month (NearBlocks) | 2021-02 (31 months were estimates, excluded) | 35,764 (2023-08) | 364 (2026-10) | 1.02% | no |
| Chain Abstraction (Chain Signatures) | `v1.signer`, transactions per month (NearBlocks) | 2026-04 (21 months were estimates, excluded) | 970,819 (2026-05) | 467,548 (2026-10) | 48.2% | yes |
| Intents | `intents.near`, swap volume per month (USD) (DefiLlama) | 2024-12 | $4.80B (2026-09) | $3.99B (2026-10) | 83.0% | not judgeable yet |

Product adoption after each mainnet launch (activity two months after launch, 2x needed; chain-wide accounts and price are context only):

| Pivot | Announced | Product and mainnet launch | Product activity, launch +2 months (scored) | Adoption followed? | Chain active accounts, +90d (context) | NEAR minus BTC, +90d (context) |
|---|---|---|---|---|---|---|
| [Blockchain Operating System (BOS)](https://near.org/blog/2023-near-in-review) | February 2023 | `social.near` from February 2023 (BOS live; SocialDB already on mainnet) | 0.66x | no | -20.9% | -47.9% |
| [Chain Signatures](https://near.org/blog/chain-signatures-launch-to-enable-transactions-on-any-blockchain-from-a-near-account) | 27 March 2024 (announced; mainnet 8 August 2024) | `v1.signer` from 8 August 2024, mainnet | n/a | N/A, not counted | +52.4% | -12.8% |
| [User-Owned AI](https://near.org/blog/user-owned-ai-is-near) | 22 May 2024 | no single product contract | n/a | N/A, not counted | -23.4% | -33.6% |
| [NEAR Intents (beta)](https://near.org/blog/introducing-near-intents.html) | 10 November 2024 | `intents.near volume` from 10 November 2024, beta on mainnet | 4.44x | yes | -11.3% | -49.0% |

## 7. What could break it

| Risk | Effect on the ladder |
|---|---|
| Intents growth slows | Every rung depends on compounding volume for ten years |
| Fee competition | Halving the take rate doubles every volume requirement |
| The market prices NEAR on cash flow | At Tron's multiple every rung is about 2.4x harder |
| Supply keeps growing at 2.5% | $100 means a larger market cap |
| Value keeps leaving the NEAR chain | Rules out the platform-premium route (active accounts -78.7% year over year) |

**NEAR Intents exploit, 1 October 2026.** NEAR Intents paused deposits and withdrawals on 11 networks after an exploit of about $3.8M, caused by a flaw in how its Omni deposit and withdrawal service interacted with the Intents contract; the flaw was reported as patched and the team pledged full compensation. Recovery has not been independently confirmed. Sources: [The Block](https://theblock.co/news/ecosystems/2026-10-01-near-intents-halts-services-after-3-8-million-exploit-promises-full-compensation-417404), [recovery status](https://en.coinotag.com/near-intents-exploit-climbs-to-3-8m-pausing-near-cross-chain-swaps).

Falsification triggers from the underlying research, evaluated on every rebuild:

| ID | Falsification trigger | Rule | Current reading | Status |
|---|---|---|---|---|
| F1 | Intents volume grows but NEAR-captured revenue per dollar of volume falls. | `INT-VOL-GROWTH > 0 and INT-TAKE-RATE < 0.8 x INT-TAKE-RATE-PRIOR` | volume 83.0%; take rate 0.027% -> 0.042% | **NOT TRIGGERED** |
| F2 | Fee compression: the effective fee rate drops by a quarter or more between consecutive 90-day windows. | `INT-FEE-RATE < 0.75 x INT-FEE-RATE-PRIOR` | 0.137% -> 0.153% | **NOT TRIGGERED** |
| F3 | The volume needed for buyback revenue worth 2% of market cap is more than ten times today's run rate. | `MODEL-VOL-MULTIPLE-2PCT > 10` | 4.63x today's run rate | **NOT TRIGGERED** |
| F4 | Base-layer user activity contracts sharply year over year. | `ACT-DAA-YOY < -25%` | -78.7% vs a year earlier | **TRIGGERED** |
| F5 | DeFi deposits on NEAR halve year over year. | `DEFI-TVL-NEAR-YOY < -50%` | 28.4% vs a year earlier | **NOT TRIGGERED** |
| F6 | Token-level value capture is under 1% of market cap per year. | `VAL-NEAR-VALUE-CAPTURE-ANN / MKT-NEAR-MCAP < 1%` | 0.454% of market cap | **TRIGGERED** |

## 8. Verdict: dream, possibility, or evidence?

At today's valuation premium, $25 in ten years needs NEAR Intents to win up to 5x today's share of DEX volume; $100 needs 9.1% of all DEX volume (9.0x today's share). If NEAR is priced like a cash-flow token instead, $100 needs 22.2%. How fast Intents grows moves the answer more than how the market values NEAR.

- **What we know:** NEAR Intents is real, growing (72.8% year over year) and already returns $21.23M a year to $NEAR; NEAR is valued at 220x that revenue.
- **What we assume:** how the market will value NEAR in ten years, how fast the DEX market grows, and that the take rate and supply rules hold.
- **What would change the view:** Intents falling behind its checkpoints, fee compression, a re-rating toward cash-flow multiples; or, upward, money and users settling on NEAR itself, which would open the platform-premium route.

No AI writes this verdict. The bands and assumptions are ours, published so anyone can change them in `src/lib/research/ladder.ts` and rebuild.

## Data sources, queries and reproduction

```bash
npm install
npm run research:refresh     # fetch live data, rebuild everything
npm run research:rebuild     # offline: rebuild from artifacts/research/raw and verify byte-identical output
```

No database or API key is needed for either command. Outputs: `artifacts/research/canonical.json` (every number, including the ladder), `evidence-manifest.json` (request URL, period, transform and response SHA-256 for each metric), `charts/`, and `dashboard.html`.

| Source | Used for |
|---|---|
| CoinGecko API | Prices, market caps, rankings, total crypto market cap |
| DefiLlama API | NEAR Intents volume, fees, revenue and buybacks; holder revenue for peer tokens; all-DEX volume; TVL and stablecoins by chain; historical prices |
| NearBlocks API | Monthly era transactions (exact months only), daily active accounts, total supply |
| NEAR JSON-RPC | Protocol inflation, total supply, buyback wallet balance |
| NEAR announcements and governance | Pivot dates, HSP-029 |
| BigQuery `crypto_near_mainnet_us` | SQL in `research/sql/`, optional, needs your Google Cloud project |
| NEAR Intents Explorer API | Optional, partner JWT; integrator concentration (unavailable (INT-EXPLORER-TOP5-SHARE)) |

Methodology versions: ladder `three-digits-1.0.0`, evidence `nebube-evidence-1.1.0`, model `nvabe-1.0.0`, evidence rules `nebube-thesis-1.1.0`.

## Appendix: evidence register

| ID | Metric | Value | Type | Period | Source |
|---|---|---|---|---|---|
| MKT-NEAR-MCAP | NEAR circulating market cap | $4.67B | OBSERVED | point in time | CoinGecko |
| MKT-NEAR-PRICE | NEAR price | $3.56 | OBSERVED | point in time | CoinGecko |
| MKT-NEAR-CIRC | NEAR circulating supply (CoinGecko) | 1.31B NEAR | OBSERVED | point in time | CoinGecko |
| MKT-SOL-MCAP | Solana circulating market cap | $51.24B | OBSERVED | point in time | CoinGecko |
| MKT-SUI-MCAP | Sui circulating market cap | $3.50B | OBSERVED | point in time | CoinGecko |
| MKT-AVAX-MCAP | Avalanche circulating market cap | $3.78B | OBSERVED | point in time | CoinGecko |
| MKT-NEAR-MCAP-1Y | NEAR market cap change, trailing 365 days | 19.6% | DERIVED | Nov 10, 2025 to Nov 9, 2026 | CoinGecko |
| INT-VOL-90D | NEAR Intents swap volume, 90 days | $11.92B | OBSERVED | Aug 10, 2026 to Nov 7, 2026 | DefiLlama |
| INT-VOL-PRIOR-90D | NEAR Intents swap volume, prior 90 days | $6.51B | OBSERVED | May 12, 2026 to Aug 9, 2026 | DefiLlama |
| INT-FEES-90D | NEAR Intents gross fees, 90 days | $18.28M | OBSERVED | Aug 10, 2026 to Nov 7, 2026 | DefiLlama |
| INT-FEES-PRIOR-90D | NEAR Intents gross fees, prior 90 days | $8.93M | OBSERVED | May 12, 2026 to Aug 9, 2026 | DefiLlama |
| INT-REV-90D | NEAR Intents captured revenue, 90 days | $4.98M | OBSERVED | Aug 10, 2026 to Nov 7, 2026 | DefiLlama |
| INT-REV-PRIOR-90D | NEAR Intents captured revenue, prior 90 days | $1.73M | OBSERVED | May 12, 2026 to Aug 9, 2026 | DefiLlama |
| INT-BUYBACK-90D | Revenue DefiLlama classifies as buybacks, 90 days | $4.98M | OBSERVED | Aug 10, 2026 to Nov 7, 2026 | DefiLlama |
| INT-VOL-ANN | NEAR Intents annualized volume (V) | $48.35B | DERIVED | Aug 10, 2026 to Nov 7, 2026 | Computed here |
| INT-VOL-GROWTH | Volume change, last 90 days vs prior 90 days | 83.0% | DERIVED | May 12, 2026 to Nov 7, 2026 | Computed here |
| INT-FEE-RATE | Effective gross fee rate (f) | 0.153% | DERIVED | Aug 10, 2026 to Nov 7, 2026 | Computed here |
| INT-FEE-RATE-PRIOR | Effective gross fee rate, prior 90 days | 0.137% | DERIVED | May 12, 2026 to Aug 9, 2026 | Computed here |
| INT-CAPTURE | Protocol capture of gross fees (c) | 27.2% | DERIVED | Aug 10, 2026 to Nov 7, 2026 | Computed here |
| INT-CAPTURE-PRIOR | Protocol capture of gross fees, prior 90 days | 19.4% | DERIVED | May 12, 2026 to Aug 9, 2026 | Computed here |
| INT-TAKE-RATE | NEAR-captured revenue per dollar of volume (f x c) | 0.042% | DERIVED | Aug 10, 2026 to Nov 7, 2026 | Computed here |
| INT-TAKE-RATE-PRIOR | NEAR-captured revenue per dollar of volume, prior 90 days | 0.027% | DERIVED | May 12, 2026 to Aug 9, 2026 | Computed here |
| INT-BUYBACK-SHARE | Share of captured revenue classified as buybacks (b) | 100.0% | DERIVED | Aug 10, 2026 to Nov 7, 2026 | Computed here |
| INT-REV-ANN | NEAR Intents captured revenue, annualized | $20.18M | DERIVED | Aug 10, 2026 to Nov 7, 2026 | Computed here |
| INT-DEFINITIONS | DefiLlama fee and revenue definitions for NEAR Intents | text | REPORTED | point in time | DefiLlama |
| ONC-BUYBACK-WALLET | NEAR held by buybacks.multisignature.near | 2.22M NEAR | OBSERVED | point in time | NEAR JSON-RPC (FastNEAR) |
| ONC-TOTAL-SUPPLY | NEAR total supply (protocol) | 1.31B NEAR | OBSERVED | point in time | NEAR JSON-RPC (FastNEAR) |
| ONC-MAX-INFLATION | Protocol maximum annual inflation rate | 2.50% | OBSERVED | point in time | NEAR JSON-RPC (FastNEAR) |
| ONC-BUYBACK-PCT-SUPPLY | Buyback wallet holdings as share of total supply | 0.170% | DERIVED | point in time | Computed here |
| ONC-ISSUANCE-USD | Maximum annual issuance at current price | $116.70M | DERIVED | point in time | Computed here |
| ACT-DAA-30D | Daily active accounts, 30-day mean | 56,686 | OBSERVED | Oct 9, 2026 to Nov 7, 2026 | NearBlocks |
| ACT-DAA-30D-1Y-AGO | Daily active accounts, 30-day mean one year earlier | 265,569 | OBSERVED | Oct 9, 2025 to Nov 7, 2025 | NearBlocks |
| ACT-TXN-30D | Daily transactions, 30-day mean | 663,382 | OBSERVED | Oct 9, 2026 to Nov 7, 2026 | NearBlocks |
| ACT-NEW-30D | New accounts per day, 30-day mean | 9,507 | OBSERVED | Oct 9, 2026 to Nov 7, 2026 | NearBlocks |
| ACT-DAA-YOY | Daily active accounts, change vs one year earlier | -78.7% | DERIVED | point in time | Computed here |
| ACT-GAS-FEES-30D | Base-layer transaction fees, 30 days (NearBlocks) | $167.2K | OBSERVED | Oct 9, 2026 to Nov 7, 2026 | NearBlocks |
| ACT-RETENTION | Retained signer cohorts (BigQuery) | unavailable | OBSERVED | point in time | Google BigQuery: crypto_near_mainnet_us |
| DEFI-TVL-NEAR | NEAR chain DeFi TVL | $166.20M | OBSERVED | as of Nov 9, 2026 | DefiLlama |
| DEFI-TVL-NEAR-1Y-AGO | NEAR chain DeFi TVL one year earlier | $129.46M | OBSERVED | as of Nov 9, 2025 | DefiLlama |
| DEFI-TVL-NEAR-YOY | NEAR TVL change vs one year earlier | 28.4% | DERIVED | point in time | Computed here |
| DEFI-RHEA-LEND-TVL | RHEA Lend TVL on NEAR | $144.40M | OBSERVED | as of Nov 9, 2026 | DefiLlama |
| DEFI-RHEA-DEX-TVL | RHEA DEX TVL on NEAR | $22.70M | OBSERVED | as of Nov 9, 2026 | DefiLlama |
| DEFI-STABLES-NEAR | Stablecoin supply on NEAR | $130.42M | OBSERVED | as of Nov 9, 2026 | DefiLlama |
| FEES-NEAR-CHAIN-90D | NEAR base-layer gas fees, 90 days | $368.8K | OBSERVED | Aug 10, 2026 to Nov 7, 2026 | DefiLlama |
| FEES-NEAR-BURN-90D | NEAR gas fees burned, 90 days | $258.2K | OBSERVED | Aug 10, 2026 to Nov 7, 2026 | DefiLlama |
| VAL-NEAR-VALUE-CAPTURE-ANN | Token-level value capture, annualized (burn + Intents buybacks) | $21.23M | DERIVED | point in time | Computed here |
| VAL-NEAR-MCAP-TO-CAPTURE | Market cap / annualized token value capture | 220x | DERIVED | point in time | Computed here |
| PEER-NEAR-FEES-30D | NEAR chain fees, 30 days | $170.4K | OBSERVED | Oct 9, 2026 to Nov 7, 2026 | DefiLlama |
| PEER-NEAR-TVL | NEAR DeFi TVL | $176.43M | OBSERVED | as of Nov 7, 2026 | DefiLlama |
| PEER-NEAR-DEX-30D | NEAR DEX volume, 30 days | $4.19B | OBSERVED | Oct 9, 2026 to Nov 7, 2026 | DefiLlama |
| PEER-NEAR-MCAP-TO-FEES | NEAR market cap / annualized chain fees | 2,253x | DERIVED | point in time | Computed here |
| PEER-NEAR-MCAP-TO-TVL | NEAR market cap / DeFi TVL | 26.5x | DERIVED | point in time | Computed here |
| PEER-SOL-FEES-30D | Solana chain fees, 30 days | $18.26M | OBSERVED | Oct 9, 2026 to Nov 7, 2026 | DefiLlama |
| PEER-SOL-TVL | Solana DeFi TVL | $5.23B | OBSERVED | as of Nov 7, 2026 | DefiLlama |
| PEER-SOL-DEX-30D | Solana DEX volume, 30 days | $55.12B | OBSERVED | Oct 9, 2026 to Nov 7, 2026 | DefiLlama |
| PEER-SOL-MCAP-TO-FEES | Solana market cap / annualized chain fees | 231x | DERIVED | point in time | Computed here |
| PEER-SOL-MCAP-TO-TVL | Solana market cap / DeFi TVL | 9.80x | DERIVED | point in time | Computed here |
| PEER-SUI-FEES-30D | Sui chain fees, 30 days | unavailable | OBSERVED | Oct 9, 2026 to Nov 7, 2026 | DefiLlama |
| PEER-SUI-TVL | Sui DeFi TVL | $440.98M | OBSERVED | as of Nov 7, 2026 | DefiLlama |
| PEER-SUI-DEX-30D | Sui DEX volume, 30 days | $830.19M | OBSERVED | Oct 9, 2026 to Nov 7, 2026 | DefiLlama |
| PEER-SUI-MCAP-TO-FEES | Sui market cap / annualized chain fees | unavailable | DERIVED | point in time | Computed here |
| PEER-SUI-MCAP-TO-TVL | Sui market cap / DeFi TVL | 7.93x | DERIVED | point in time | Computed here |
| PEER-AVAX-FEES-30D | Avalanche chain fees, 30 days | $301.5K | OBSERVED | Oct 9, 2026 to Nov 7, 2026 | DefiLlama |
| PEER-AVAX-TVL | Avalanche DeFi TVL | $612.06M | OBSERVED | as of Nov 7, 2026 | DefiLlama |
| PEER-AVAX-DEX-30D | Avalanche DEX volume, 30 days | $2.56B | OBSERVED | Oct 9, 2026 to Nov 7, 2026 | DefiLlama |
| PEER-AVAX-MCAP-TO-FEES | Avalanche market cap / annualized chain fees | 1,029x | DERIVED | point in time | Computed here |
| PEER-AVAX-MCAP-TO-TVL | Avalanche market cap / DeFi TVL | 6.17x | DERIVED | point in time | Computed here |
| INT-EXPLORER-TOP5-SHARE | Share of sampled 1Click volume from top 5 referrers | unavailable | OBSERVED | point in time | NEAR Intents Explorer API |
| INT-EXPLORER-MEDIAN-SWAP | Median sampled 1Click swap size | unavailable | OBSERVED | point in time | NEAR Intents Explorer API |
| MODEL-BUYBACK-USD | Annual buyback demand at current run rate | $20.18M | DERIVED | Aug 10, 2026 to Nov 7, 2026 | Buyback target model nvabe-1.0.0 |
| MODEL-BUYBACK-TO-MCAP | Annual buyback demand / market cap | 0.432% | DERIVED | Aug 10, 2026 to Nov 7, 2026 | Buyback target model nvabe-1.0.0 |
| MODEL-BREAKEVEN-VOL-2PCT | Annual volume needed for buybacks = 2% of market cap | $223.81B | DERIVED | Aug 10, 2026 to Nov 7, 2026 | Buyback target model nvabe-1.0.0 |
| MODEL-VOL-MULTIPLE-2PCT | Volume multiple needed for 2% of market cap | 4.63x | DERIVED | Aug 10, 2026 to Nov 7, 2026 | Buyback target model nvabe-1.0.0 |
| MODEL-REQ-TAKE-RATE-2PCT | Required f x c x b at today's volume for 2% of market cap | 0.193% | DERIVED | Aug 10, 2026 to Nov 7, 2026 | Buyback target model nvabe-1.0.0 |
| MODEL-CURRENT-TAKE-RATE | Current f x c x b (volume converted to buyback demand) | 0.042% | DERIVED | Aug 10, 2026 to Nov 7, 2026 | Buyback target model nvabe-1.0.0 |
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
| SUP-NET-NEW-ANN-PCT | Realized net new NEAR supply, annualized | 2.47% | DERIVED | Aug 9, 2026 to Nov 7, 2026 | NearBlocks |
| SUP-NET-NEW-ANN-USD | Realized net new supply per year at today's price | $114.71M | DERIVED | Aug 9, 2026 to Nov 7, 2026 | Computed here |
| SUP-PARITY-VOL | Annual Intents volume at which buyback-designated revenue equals the value of realized net new supply | $274.81B | DERIVED | point in time | Computed here |
| SUP-PARITY-MULTIPLE | Parity volume as a multiple of today's Intents volume run rate | 5.68x | DERIVED | point in time | Computed here |
| INT-BUYBACK-DESIGNATED-CUM | Buyback-designated Intents revenue since DefiLlama began classifying it (2026-02-23) | $7.89M | DERIVED | Feb 23, 2026 to Nov 7, 2026 | DefiLlama |
| ONC-BUYBACK-WALLET-VS-DESIGNATED | Buyback wallet holdings at today's price vs cumulative buyback-designated revenue | 100.3% | DERIVED | point in time | Computed here |
| COV-BUYBACK-REALIZED | Buyback-designated revenue as a share of realized net new supply | 17.6% | DERIVED | Aug 9, 2026 to Nov 7, 2026 | Computed here |
| COV-CAPTURE-MAX | Burns plus buybacks as a share of maximum issuance | 18.2% | DERIVED | point in time | Computed here |
| LAD-DEX-VOL-365D | All DEX volume, last 365 days (DefiLlama) | $3.24T | OBSERVED | as of Nov 7, 2026 | DefiLlama |
| LAD-INTENTS-DEX-SHARE | NEAR Intents share of all DEX volume, last 365 days | 1.01% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-INTENTS-YOY | NEAR Intents volume, latest 30 days vs the same 30 days a year earlier | 72.8% | DERIVED | as of Nov 7, 2026 | DefiLlama |
| LAD-DEX-CAGR-2021-2025 | All DEX volume, compound annual growth 2021 to 2025 | 27.5% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-SUPPLY-2036 | NEAR supply in ten years at the current 2.5% maximum issuance | 1.68B NEAR | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-SUPPLY-2036-HSP029 | NEAR supply in ten years if HSP-029 takes effect | 1.55B NEAR | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-MULT-HYPERLIQUID | Valuation multiple: Priced like Hyperliquid (market cap / holder revenue) | 26.0x | DERIVED | as of Nov 7, 2026 | CoinGecko and DefiLlama |
| LAD-MULT-TRON | Valuation multiple: Priced like Tron (market cap / holder revenue) | 90.4x | DERIVED | as of Nov 7, 2026 | CoinGecko and DefiLlama |
| LAD-MULT-TODAY | Valuation multiple: Today's NEAR premium (market cap / holder revenue) | 220x | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-MULT-SOLANA | Valuation multiple: Platform premium (Solana) (market cap / holder revenue) | 2,002x | DERIVED | as of Nov 7, 2026 | CoinGecko and DefiLlama |
| LAD-10-MCAP | Market cap at $10 in ten years (2.5% issuance) | $16.79B | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-10-RANK | $10: rank among today's crypto assets at that market cap (stablecoins excluded) | 9 | DERIVED | as of Nov 7, 2026 | CoinGecko |
| LAD-10-HYPERLIQUID-VOLUME | $10: Intents annual volume needed (Priced like Hyperliquid) | $1.55T | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-10-HYPERLIQUID-DEX-SHARE | $10: share of the 2036 DEX market Intents would need (Priced like Hyperliquid) | 7.71% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-10-HYPERLIQUID-CAGR | $10: Intents growth needed every year for ten years (Priced like Hyperliquid) | 41.4% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-10-TRON-VOLUME | $10: Intents annual volume needed (Priced like Tron) | $444.94B | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-10-TRON-DEX-SHARE | $10: share of the 2036 DEX market Intents would need (Priced like Tron) | 2.22% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-10-TRON-CAGR | $10: Intents growth needed every year for ten years (Priced like Tron) | 24.9% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-10-TODAY-VOLUME | $10: Intents annual volume needed (Today's NEAR premium) | $182.75B | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-10-TODAY-DEX-SHARE | $10: share of the 2036 DEX market Intents would need (Today's NEAR premium) | 0.910% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-10-TODAY-CAGR | $10: Intents growth needed every year for ten years (Today's NEAR premium) | 14.2% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-10-SOLANA-VOLUME | $10: Intents annual volume needed (Platform premium (Solana)) | $20.08B | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-10-SOLANA-DEX-SHARE | $10: share of the 2036 DEX market Intents would need (Platform premium (Solana)) | 0.100% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-10-SOLANA-CAGR | $10: Intents growth needed every year for ten years (Platform premium (Solana)) | -8.41% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-25-MCAP | Market cap at $25 in ten years (2.5% issuance) | $41.96B | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-25-RANK | $25: rank among today's crypto assets at that market cap (stablecoins excluded) | 6 | DERIVED | as of Nov 7, 2026 | CoinGecko |
| LAD-25-HYPERLIQUID-VOLUME | $25: Intents annual volume needed (Priced like Hyperliquid) | $3.87T | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-25-HYPERLIQUID-DEX-SHARE | $25: share of the 2036 DEX market Intents would need (Priced like Hyperliquid) | 19.3% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-25-HYPERLIQUID-CAGR | $25: Intents growth needed every year for ten years (Priced like Hyperliquid) | 55.0% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-25-TRON-VOLUME | $25: Intents annual volume needed (Priced like Tron) | $1.11T | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-25-TRON-DEX-SHARE | $25: share of the 2036 DEX market Intents would need (Priced like Tron) | 5.54% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-25-TRON-CAGR | $25: Intents growth needed every year for ten years (Priced like Tron) | 36.8% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-25-TODAY-VOLUME | $25: Intents annual volume needed (Today's NEAR premium) | $456.88B | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-25-TODAY-DEX-SHARE | $25: share of the 2036 DEX market Intents would need (Today's NEAR premium) | 2.28% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-25-TODAY-CAGR | $25: Intents growth needed every year for ten years (Today's NEAR premium) | 25.2% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-25-SOLANA-VOLUME | $25: Intents annual volume needed (Platform premium (Solana)) | $50.21B | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-25-SOLANA-DEX-SHARE | $25: share of the 2036 DEX market Intents would need (Platform premium (Solana)) | 0.250% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-25-SOLANA-CAGR | $25: Intents growth needed every year for ten years (Platform premium (Solana)) | 0.378% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-50-MCAP | Market cap at $50 in ten years (2.5% issuance) | $83.93B | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-50-RANK | $50: rank among today's crypto assets at that market cap (stablecoins excluded) | 4 | DERIVED | as of Nov 7, 2026 | CoinGecko |
| LAD-50-HYPERLIQUID-VOLUME | $50: Intents annual volume needed (Priced like Hyperliquid) | $7.74T | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-50-HYPERLIQUID-DEX-SHARE | $50: share of the 2036 DEX market Intents would need (Priced like Hyperliquid) | 38.6% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-50-HYPERLIQUID-CAGR | $50: Intents growth needed every year for ten years (Priced like Hyperliquid) | 66.1% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-50-TRON-VOLUME | $50: Intents annual volume needed (Priced like Tron) | $2.22T | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-50-TRON-DEX-SHARE | $50: share of the 2036 DEX market Intents would need (Priced like Tron) | 11.1% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-50-TRON-CAGR | $50: Intents growth needed every year for ten years (Priced like Tron) | 46.7% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-50-TODAY-VOLUME | $50: Intents annual volume needed (Today's NEAR premium) | $913.77B | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-50-TODAY-DEX-SHARE | $50: share of the 2036 DEX market Intents would need (Today's NEAR premium) | 4.55% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-50-TODAY-CAGR | $50: Intents growth needed every year for ten years (Today's NEAR premium) | 34.2% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-50-SOLANA-VOLUME | $50: Intents annual volume needed (Platform premium (Solana)) | $100.42B | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-50-SOLANA-DEX-SHARE | $50: share of the 2036 DEX market Intents would need (Platform premium (Solana)) | 0.500% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-50-SOLANA-CAGR | $50: Intents growth needed every year for ten years (Platform premium (Solana)) | 7.58% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-100-MCAP | Market cap at $100 in ten years (2.5% issuance) | $167.85B | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-100-RANK | $100: rank among today's crypto assets at that market cap (stablecoins excluded) | 3 | DERIVED | as of Nov 7, 2026 | CoinGecko |
| LAD-100-HYPERLIQUID-VOLUME | $100: Intents annual volume needed (Priced like Hyperliquid) | $15.48T | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-100-HYPERLIQUID-DEX-SHARE | $100: share of the 2036 DEX market Intents would need (Priced like Hyperliquid) | 77.1% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-100-HYPERLIQUID-CAGR | $100: Intents growth needed every year for ten years (Priced like Hyperliquid) | 78.0% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-100-TRON-VOLUME | $100: Intents annual volume needed (Priced like Tron) | $4.45T | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-100-TRON-DEX-SHARE | $100: share of the 2036 DEX market Intents would need (Priced like Tron) | 22.2% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-100-TRON-CAGR | $100: Intents growth needed every year for ten years (Priced like Tron) | 57.2% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-100-TODAY-VOLUME | $100: Intents annual volume needed (Today's NEAR premium) | $1.83T | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-100-TODAY-DEX-SHARE | $100: share of the 2036 DEX market Intents would need (Today's NEAR premium) | 9.10% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-100-TODAY-CAGR | $100: Intents growth needed every year for ten years (Today's NEAR premium) | 43.8% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-100-SOLANA-VOLUME | $100: Intents annual volume needed (Platform premium (Solana)) | $200.85B | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-100-SOLANA-DEX-SHARE | $100: share of the 2036 DEX market Intents would need (Platform premium (Solana)) | 1.00% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-100-SOLANA-CAGR | $100: Intents growth needed every year for ten years (Platform premium (Solana)) | 15.3% | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-IMPLIED-LOW-HYPERLIQUID | Implied 2036 price: low growth, Priced like Hyperliquid | $0.81 | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-IMPLIED-LOW-TRON | Implied 2036 price: low growth, Priced like Tron | $2.82 | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-IMPLIED-LOW-TODAY | Implied 2036 price: low growth, Today's NEAR premium | $6.86 | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-IMPLIED-LOW-SOLANA | Implied 2036 price: low growth, Platform premium (Solana) | $62 | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-IMPLIED-BASE-HYPERLIQUID | Implied 2036 price: base growth, Priced like Hyperliquid | $1.93 | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-IMPLIED-BASE-TRON | Implied 2036 price: base growth, Priced like Tron | $6.73 | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-IMPLIED-BASE-TODAY | Implied 2036 price: base growth, Today's NEAR premium | $16 | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-IMPLIED-BASE-SOLANA | Implied 2036 price: base growth, Platform premium (Solana) | $149 | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-IMPLIED-HIGH-HYPERLIQUID | Implied 2036 price: high growth, Priced like Hyperliquid | $9.04 | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-IMPLIED-HIGH-TRON | Implied 2036 price: high growth, Priced like Tron | $31 | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-IMPLIED-HIGH-TODAY | Implied 2036 price: high growth, Today's NEAR premium | $77 | DERIVED | as of Nov 7, 2026 | Computed here |
| LAD-IMPLIED-HIGH-SOLANA | Implied 2036 price: high growth, Platform premium (Solana) | $696 | DERIVED | as of Nov 7, 2026 | Computed here |
