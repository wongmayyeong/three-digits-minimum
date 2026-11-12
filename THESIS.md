<!-- GENERATED FILE. Edit research/THESIS.template.md, then run `npm run research:rebuild`. Every figure is filled from artifacts/research/canonical.json. -->

# Three Digits, Minimum?

*How far can NEAR really go? An evidence-based NEAR price ladder.*

**Track:** NEAR HACKATHON 2026, Investment Thesis. **Data:** refreshed from public sources; flow metrics use the 90 days ending Nov 10, 2026. Numbers that could not be computed read "unavailable" instead of an estimate.

> Educational research, not financial advice. Not a price prediction. "Three digits, minimum." is a line attributed to NEAR co-founder Illia Polosukhin and repeated across the NEAR community; we use it as a hook and test it against data.

**The short answer.** At NEAR's own valuation multiple today, $25 in ten years needs NEAR Intents to grow up to 5x relative to spot DEX volume; $100 needs Intents volume equal to 10.6% of spot DEX volume (6.2x today's ratio). Priced like Tron, a cash-flow token, $100 needs 21.9%. Intents growth and the valuation multiple matter about equally. NEAR's market cap is 223x the revenue of its main product, NEAR Intents; small cross-chain peer tokens trade at 7.55x to 13.5x their revenue, though NEAR's market cap also prices the L1 and its other products. 67.1% of the revenue designated as buybacks has reached the buyback wallet, and net issuance (2.48% of supply a year) is larger than what buybacks absorb (0.303%).

---

## 1. The claim, and how we test it

"Three digits, minimum" means a NEAR price of $100 or more. We do not try to predict whether it happens. We build a **price ladder** for ten years from now: $10, $25, $50 and $100. For each rung we compute what NEAR would have to achieve (Layer A) and label every condition as **observed** in today's data, **assumed** by the model, or **unproven** (Layer B). Then we turn it around: under low, base and high growth and several valuation multiples seen in the market today, where does the price land?

NEAR's economic engine today is NEAR Intents, a cross-chain swap service. Part of every swap fee is captured by NEAR and, since February 2026, used to buy back $NEAR. The chain of value runs: Intents volume → fees → NEAR-captured revenue → buybacks (and gas burns) → token holders.

## 2. The dream: what $100 would mean

| | Today | At $100 in ten years |
|---|---|---|
| Price | $3.51 | $100 (28.5x) |
| Market cap (2.5% issuance) | $4.60B | $167.88B |
| Market cap if HSP-029 takes effect | | $155.36B |
| Rank among crypto assets (stablecoins excluded) | | #3 against today's market |
| Share of all crypto ($2.47T today) | 0.186% | 6.80% |
| Versus Solana / Ethereum today | | 3.42x / 0.67x |

$100 is not a bigger pump; it is a different rank in crypto. Supply keeps growing, so $100 in ten years means a larger market cap than $100 today. HSP-029, approved by House of Stake on 2 November 2026, would cut maximum issuance from 2.5% to 1.6% over 24 months after a ~90-day buffer; it needs validator adoption and can be vetoed until 16 November, so the ladder uses today's 2.5% rule and shows HSP-029 alongside.

## 3. How the market values crypto assets

| Token | Framework | Market cap | To holders a year (90-day run rate) | Multiple | Multiple, trailing year |
|---|---|---|---|---|---|
| Ethereum | Platform (on-chain economy) | $250.54B | $62.51M | 4,008x | 5,220x |
| BNB | Platform (on-chain economy) | $88.60B | $20.49M | 4,325x | 5,548x |
| Solana | Platform (on-chain economy) | $49.06B | $30.07M | 1,632x | 1,934x |
| Tron | Cash flow | $30.11B | $293.79M | 102x | 90.3x |
| Hyperliquid | Cash flow | $17.10B | $876.57M | 19.5x | 25.1x |
| **NEAR** (gas burned + Intents revenue designated for buybacks) | Both tested here | $4.60B | $21.66M | 212x | 521x |

Every row uses the same metric (DefiLlama holders revenue: burns and buybacks), the same 90-day run rate and the same end date (Nov 10, 2026). The 90-day run rate is the primary basis because NEAR's buyback mechanism started on 2026-02-23; trailing-year multiples are shown for every asset as a check. NEAR's trailing-year multiple is shown but not used: its 365-day window starts 2025-11-11, before Intents buybacks began on 2026-02-23, so it mixes two mechanisms.

There are two regimes, and they are kept in **two separate frameworks that are never added together**. **Cash-flow tokens** (Hyperliquid, Tron) are priced on what they pay holders; the ladder in sections 4 and 5 applies their multiples, and NEAR's own, to NEAR in ten years. **Platforms** (Ethereum, BNB, Solana) trade at thousands of times the value reaching holders because they are valued on the economy that lives on the chain; section 6 shows what that economy would have to be on NEAR. Multiples are assumptions, not forecasts.

## 4. The ladder: what each rung takes

Cash-flow framework. Each NEAR channel has its own driver: gas burns are held at today's run rate ($1.06M a year), and the rest must come from Intents buybacks at today's 0.042% of volume. Each cell is the Intents volume a rung needs, as a fraction of 2036 **spot** DEX volume: DefiLlama's "Dexs" category only, today $2.88T a year (run rate), grown 20% a year (an assumption; it grew 26.3% a year from 2021 to 2025). DefiLlama's full DEX overview ($3.33T) also counts prediction markets, launchpads and bridges, including NEAR Intents itself, so it is not used. Intents equals 1.71% of spot DEX volume today on the run rate (1.13% over the last 365 days). This is a scale reference, not a market share: Intents is a cross-chain category, and some of its swaps also route through DEXs.

| Rung (ten years) | Priced like Hyperliquid (19.5x) | Priced like Tron (102x) | NEAR's multiple today (212x) |
|---|---|---|---|
| **$100** (28.5x, $167.88B, #3) | 115.1% (more than 10x) | 21.9% (more than 10x) | 10.6% (5x to 10x) |
| **$50** (14.2x, $83.94B, #4) | 57.6% (more than 10x) | 10.9% (5x to 10x) | 5.27% (up to 5x) |
| **$25** (7.12x, $41.97B, #6) | 28.8% (more than 10x) | 5.46% (up to 5x) | 2.63% (up to 5x) |
| **$10** (2.85x, $16.79B, #9) | 11.5% (5x to 10x) | 2.18% (keeps today's size) | 1.04% (keeps today's size) |

Bands, by how many times today's ratio to spot DEX volume Intents would need: **keeps today's size** (at most 1.5x), **up to 5x**, **5x to 10x**, **more than 10x**.

What would have to be true at each rung (NEAR's own multiple today):

| Rung | Value to holders needed | Intents volume needed | Growth needed, 10 years | NEAR keeps its multiple | Buyback revenue per dollar holds |
|---|---|---|---|---|---|
| $10 | $79.04M/yr, 3.65x today (unproven) | $185.83B/yr (unproven) | 14.2% a year (unproven; today 57.8% YoY, observed) | assumed | assumed |
| $25 | $197.60M/yr, 9.12x today (unproven) | $468.39B/yr (unproven) | 25.3% a year (unproven; today 57.8% YoY, observed) | assumed | assumed |
| $50 | $395.19M/yr, 18.2x today (unproven) | $939.30B/yr (unproven) | 34.3% a year (unproven; today 57.8% YoY, observed) | assumed | assumed |
| $100 | $790.38M/yr, 36.5x today (unproven) | $1.88T/yr (unproven) | 44.0% a year (unproven; today 57.8% YoY, observed) | assumed | assumed |

## 5. Where scenarios land

Implied price in ten years = (Intents volume grown from today's $49.08B run rate x buyback revenue per dollar of volume + burns at today's run rate) x cash-flow multiple / supply in 2036. Growth rates are scenarios; nothing here is a forecast.

| Intents growth to 2036 | Priced like Hyperliquid | Priced like Tron | NEAR's multiple today |
|---|---|---|---|
| Low, 10.0% a year | $0.63 (0.18x) | $3.33 (0.95x) | $6.89 (1.96x) |
| Base, 20.0% a year | $1.49 (0.43x) | $7.85 (2.24x) | $16 (4.63x) |
| High, 40.0% a year | $6.93 (1.97x) | $36 (10.4x) | $75 (21.5x) |

How fast Intents grows and how the market values NEAR matter about equally: prices spread 11x across growth scenarios at NEAR's own multiple, and 11x across the cash-flow multiples at base growth.

## 6. The evidence

**Is NEAR Intents on the path?** Annual volume $49.08B (90-day run rate); 57.8% year over year (latest 30 days); 1.71% of spot DEX volume. Within the cross-chain protocols DefiLlama lists in its DEX overview it is 64.7%, but that list misses most cross-chain competitors, so it overstates Intents' position; the full cross-chain comparison is a separate workstream. The volume Intents would need each year, at NEAR's own multiple today, for each rung:

| Rung | 2027 | 2028 | 2029 | 2030 | 2031 | 2032 | 2033 | 2034 | 2035 | 2036 |
|---|---|---|---|---|---|---|---|---|---|---|
| $100 | $70.67B | $101.76B | $146.53B | $211.01B | $303.84B | $437.53B | $630.03B | $907.22B | $1.31T | $1.88T |
| $50 | $65.93B | $88.57B | $118.98B | $159.83B | $214.70B | $288.43B | $387.46B | $520.50B | $699.22B | $939.30B |
| $25 | $61.50B | $77.06B | $96.56B | $121.00B | $151.61B | $189.98B | $238.06B | $298.30B | $373.79B | $468.39B |
| $10 | $56.07B | $64.05B | $73.17B | $83.59B | $95.50B | $109.10B | $124.64B | $142.39B | $162.67B | $185.83B |

**Could NEAR be valued as a platform instead?** A separate framework, never added to the cash-flow ladder. Platforms are valued relative to the money that lives on them. For each rung to look like these chains, this much would need to live on NEAR (in brackets: times NEAR today):

| Valued like | On NEAR | Market cap ratio | $10 | $25 | $50 | $100 |
|---|---|---|---|---|---|---|
| Ethereum | Stablecoins | 1.89x | $8.87B (67.8x) | $22.16B (169x) | $44.33B (339x) | $88.65B (678x) |
| Ethereum | DeFi TVL | 6.10x | $2.75B (16.7x) | $6.88B (41.7x) | $13.77B (83.4x) | $27.53B (167x) |
| BNB Chain | Stablecoins | 6.61x | $2.54B (19.4x) | $6.35B (48.5x) | $12.70B (97.1x) | $25.40B (194x) |
| BNB Chain | DeFi TVL | 17.7x | $949.57M (5.75x) | $2.37B (14.4x) | $4.75B (28.8x) | $9.50B (57.5x) |
| Solana | Stablecoins | 3.54x | $4.74B (36.2x) | $11.84B (90.5x) | $23.68B (181x) | $47.36B (362x) |
| Solana | DeFi TVL | 9.73x | $1.72B (10.4x) | $4.31B (26.1x) | $8.62B (52.2x) | $17.25B (104x) |
| Tron | Stablecoins | 0.32x | $52.14B (399x) | $130.36B (996x) | $260.72B (1,993x) | $521.44B (3,985x) |
| Tron | DeFi TVL | 6.15x | $2.73B (16.5x) | $6.83B (41.4x) | $13.66B (82.7x) | $27.31B (165x) |
| NEAR today | | | Stablecoins $130.85M; DeFi TVL $165.03M | | | |

**Does the token capture value? (token economics)**

Every flow is classified before anything is added up, and flows with different economic effects are never netted into one dollar figure. Four things are kept apart: **captured revenue** (NEAR swept into NEAR's revenue wallets), **designated buybacks** (DefiLlama's label for that revenue from 23 February 2026), **NEAR delivered to the buyback wallet** (verified onchain), and **supply effects** (issuance, burns, held buybacks). Staking rewards are new tokens, a redistribution from non-stakers.

| Flow | What it is | Per year | Classification |
|---|---|---|---|
| NEAR Intents fees | Gross fees paid by Intents users (protocol and distributor fees) | $76.07M | Source of value, not captured |
| NEAR gas fees | All transaction fees paid on the NEAR chain | $1.52M | Source of value, not captured |
| Revenue DefiLlama designates as buybacks | All NEAR captured into the three revenue wallets since 23 February 2026, relabelled as buybacks | $20.75M | Label, not a transaction |
| NEAR delivered to the buyback wallet | 1Click swap output withdrawn from intents.near to buybacks.multisignature.near, valued at each day's price (swap inputs not visible onchain) | $13.93M | **Value capture** |
| Captured revenue kept in the front-end fund | NEAR swept to fefundsadmin.sputnik-dao.near; not moved to the buyback wallet | $2.14M since 2026-02-23 | Label, not a transaction |
| Gas burned | 70% of every gas fee, permanently removed | $1.06M | **Value capture** |
| Staking emissions | New NEAR minted for validators and delegators | $114.93M | Redistribution (new tokens) |
| Net issuance | Emissions minus burns: the dilution every holder faces (burns are already inside this figure) | $113.26M | **Dilution** (subtracted) |
| Ecosystem app revenue (for example RHEA) | Revenue accruing to applications, not to $NEAR | not summed | Not $NEAR value |

Effects on supply, each as a share of total supply per year. Burns are already inside net issuance, and bought NEAR is held rather than burned, so these are shown side by side, not subtracted from each other:

| Effect on supply, per year | Share of total supply | What it does |
|---|---|---|
| Gross issuance (staking emissions) | 2.50% | New tokens to stakers |
| Burns | 0.023% | Removed permanently; already inside net issuance |
| **Net issuance** | **2.48%** | Realized change in total supply |
| NEAR delivered to the buyback wallet | 0.303% | Held, not burned: absorbed from the market, still in supply |

- Captured revenue reproduced onchain from the three revenue wallets matches DefiLlama to 99.1% over the same dates (FastNEAR vs Dune, independent paths). DefiLlama labels all of it as buybacks from 2026-02-23.
- Of the $8.1M designated since then, $4.9M (60.2%) reached the buyback wallet directly from 1Click swaps and $1.2M more was moved there from the 1Click fund (counting the moved NEAR at its value when captured, 67.1% of the designation reached the buyback wallet). $2.1M of Intents revenue stayed in the front-end fund, and $0.4M came from accounts other than intents.near (auroraliqsupport.near, clingy.near).
- Run rate on identical dates: $13.9M a year delivered to the buyback wallet against $20.8M designated. The swap inputs are not visible onchain without the Intents Explorer API, so delivery is verified, not the purchase price.
- Supply view, per year as a share of total supply: gross issuance 2.50%, burns 0.023% (inside net issuance), net issuance 2.48%; buybacks absorb 0.30% into a held wallet without removing it. These are different effects and are not netted into one dollar figure.
- Staking: 44% of supply is staked; nominal yield 5.6%, 3.1% after dilution for stakers and -2.4% for non-stakers.
- Dilution net of capture over the last year (circulating supply growth excluding one-day events, minus held buybacks): NEAR 2.2%, 5 lowest of 9; HYPE 0.2%, ETH 0.8%, BTC 0.9%, SOL 1.5%, NEAR 2.2%, AVAX 4.4%, SUI 12.5%, TON 14.8%, APT 22.6%. As-reported supply changes, including one-day events, are shown alongside.

**Where the designated buybacks went.** DefiLlama's NEAR Intents adapter (dimension-adapters, fees/near-intents) measures captured revenue as NEAR and wNEAR swept into three wallets from any outside account: the front-end fund (`fefundsadmin.sputnik-dao.near`), the 1Click fund (`1csfundsadmin.sputnik-dao.near`) and the buyback wallet (`buybacks.multisignature.near`), and from 23 February 2026 labels all of it as holders revenue. Every NEAR and wNEAR flow into and out of those three wallets was read independently from FastNEAR and valued at each day's price. Reproduced captured revenue $7.99M vs DefiLlama revenue $8.06M over 2026-02-23 to 2026-11-11 (99.1%). The first five columns after the designation add up to the captured revenue (each inflow counted once, when it first reached a revenue wallet). The memo column is a later move of already-captured NEAR from the 1Click fund to the buyback wallet, valued at the price on the day it moved.

The transaction path into the buyback wallet: a 1Click swap delivers wNEAR to a one-time account inside NEAR Intents, which withdraws it as NEAR to the buyback wallet. Delivery and amounts are verified onchain; what was sold and at what price is not visible without the Intents Explorer API, so these are verified deliveries of NEAR acquired through Intents, not fully audited open-market purchases. The buyback wallet still holds 99.6% of everything it received: bought NEAR is held, not burned.

| Month | Designated by DefiLlama | Into the buyback wallet (1Click swaps) | Into the 1Click fund | Into the front-end fund | From accounts other than intents.near | Memo: moved 1Click fund to buyback wallet |
|---|---|---|---|---|---|---|
| 2026-02 | $196.8K | $0 (0 NEAR) | $64.4K | $0 | $137.2K | $0 |
| 2026-03 | $563.5K | $0 (0 NEAR) | $284.9K | $0 | $283.1K | $0 |
| 2026-04 | $258.7K | $47.5K (34.6K NEAR) | $199.5K | $11.1K | $0.05 | $0 |
| 2026-05 | $619.6K | $415.2K (227.9K NEAR) | $0 | $189.3K | $0 | $0 |
| 2026-06 | $619.5K | $491.7K (223.9K NEAR) | $0 | $152.1K | $29 | $0 |
| 2026-07 | $504.9K | $341.4K (180.5K NEAR) | $0 | $150.2K | $877 | $14.0K |
| 2026-08 | $723.3K | $488.9K (277.7K NEAR) | $0 | $222.4K | $908 | $1.93 |
| 2026-09 | $1.84M | $1.23M (396.8K NEAR) | $990 | $509.8K | $15.9K | $1.17M |
| 2026-10 | $2.19M | $1.45M (297.3K NEAR) | $0 | $756.8K | $0 | $0 |
| 2026-11 | $544.2K | $396.8K (104.4K NEAR) | $0 | $150.6K | $1,924 | $0 |
| **Total** | **$8.06M** | **$4.86M** | **$549.9K** | **$2.14M** | **$440.0K** | $1.18M |

**Staking.** 44.4% of supply is staked. Realized gross issuance is 2.50% a year and all of it goes to stakers (the protocol treasury share is zero), so the nominal staking yield is 5.62% before validator commission. After dilution a staker's share of supply grows 3.07% a year, while a non-staker's share changes by -2.42%. Staking protects a holder from dilution; it does not create value.

**The same measures for every alternative.** Circulating supply growth is CoinGecko market cap divided by price, one method for every asset, so it includes unlocks. One-day changes above 5% are reclassifications or one-off recognitions (for example, Hyperliquid's Assistance Fund tokens being recognized as burned), so the comparable column chains daily changes without them. That can also drop a genuine one-day unlock (Solana's 12 March jump is one candidate), so the as-reported column stays next to it. Burns and recognized buybacks already lower circulating supply, so they are not added back as a yield; only NEAR's bought-back tokens, which are held and still counted as circulating, are subtracted. The result, dilution net of capture, is the share of the network a holder who does nothing loses each year to new supply. Holder yield is shown for context only. Price is excluded: this is token economics, not a return forecast.

| Asset | Valued as | Market cap | Supply still to unlock (FDV / cap) | Circulating supply growth, 1 year (as reported) | Excluding one-day events | Held buybacks subtracted | **Dilution net of capture** | Holder yield (context) |
|---|---|---|---|---|---|---|---|---|
| HYPE | cash-flow | $17.13B | 3.97x | -11.6% (3 events: 2025-12-24 -12.2%, 2026-05-27 -6.69%, 2026-10-29 +7.62%) | +0.242% | 0 | **+0.242%** | 5.12% |
| ETH | platform | $249.35B | 1.00x | +0.817% | +0.817% | 0 | **+0.817%** | 0.025% |
| BTC | monetary | $1.47T | 1.00x | +0.924% | +0.924% | 0 | **+0.924%** | none |
| SOL | platform | $48.96B | 1.08x | +6.74% (1 event: 2026-03-12 +5.18%) | +1.49% | 0 | **+1.49%** | 0.061% |
| **NEAR** | both | $4.57B | 1.00x | +2.47% | +2.47% | 0.305% | **+2.16%** | 0.474% |
| AVAX | platform | $3.79B | 1.06x | +4.38% | +4.38% | 0 | **+4.38%** | 0.096% |
| SUI | platform | $3.36B | 2.42x | +12.5% | +12.5% | 0 | **+12.5%** | n/a |
| TON | platform | $3.52B | 1.85x | +14.8% | +14.8% | 0 | **+14.8%** | 0.013% |
| APT | platform | $489.31M | 1.37x | +22.6% | +22.6% | 0 | **+22.6%** | 0.287% |

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

## 7. The markets NEAR sells into

Each market is shown on its own definition and never added to another (the same funds can pass through a DEX, a bridge and an aggregator). Calendar years count only with at least 360 days of data; growth is reported from 2021, only across at least two years, and only when the first year is at least 5% of the last, because early coverage is thin.

| Market | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | Last 12 months | Growth a year | Note |
|---|---|---|---|---|---|---|---|---|---|
| Spot DEX volume (DefiLlama "Dexs" category) | $72.17B | $1.84T | $1.38T | $892.57B | $2.51T | $4.70T | $2.90T | 26.3% (2021 to 2025) | NEAR Intents' scale reference; includes cross-chain swap networks filed as DEXs (THORChain, Chainflip). |
| Cross-chain swap volume (DefiLlama bridge categories in its DEX overview) | $0 | $0 | $0 | $4.06M | $1.19B | $10.49B | $42.28B | n/a | NEAR Intents' own category; coverage is thin before 2025 and misses protocols without a volume adapter. |
| Bridge-aggregator volume | N/A | N/A | N/A | N/A | $1.28B | $20.02B | $31.91B | n/a | Routes through bridges and swap venues (including Intents); overlaps the rows above, never added to them. |
| Stablecoin supply, year end (USD-pegged) | $27.02B | $162.21B | $137.77B | $130.29B | $204.24B | $304.04B | $289.90B | 17.0% (2021 to 2025) | The money on chain that cross-chain execution moves. |
| AI-agent payments (x402) | N/A | N/A | N/A | N/A | N/A | N/A | $43.58M | n/a | The one public AI-agent payment series; starts in 2025. |

- Spot DEX volume: $2.90T over the last year, -38% against calendar 2025; 26% a year from 2021 to 2025, with a worst year -52% below the previous peak: large and cyclical.
- Cross-chain swap volume in DefiLlama's bridge categories: $42B over the last year, of which NEAR Intents is 78%; bridge aggregators routed $32B (overlapping, not added).
- Stablecoin supply $290B (17% a year since 2021); AI-agent payments via x402 $44M over the last year, a market too small and too new to size NEAR AI's opportunity.
- The five largest spot DEX protocol families handle 52% of spot volume (uniswap 23%, pancakeswap 13%, pump 7%, aero-protocol 5%, HumidiFi 3%).

## 8. NEAR's economy, product by product

Every product is investigated on its own and placed in one column: **observed** activity, **verified** value capture for $NEAR (executed buybacks or burns), or **speculative** opportunity (no measurable evidence yet, so no dollar value is assigned).

| Product | Activity (observed) | Value capture for $NEAR | Column | Possible upside (not valued) | Sources |
|---|---|---|---|---|---|
| NEAR Intents and near.com | $49.1B volume a year (run rate), +230% year over year; $76.1M fees, $20.6M captured by NEAR; 86% of all fees on the NEAR chain | Executed buybacks $13.9M a year (onchain), held in the buyback wallet | **Verified capture** | Confidential swaps, new chains and distribution partners; integrator and solver concentration is untested without the Intents Explorer API or BigQuery | DefiLlama (Dune lineage), FastNEAR |
| NEAR L1 (gas, accounts, transactions) | 741,872 transactions and 71,745 active accounts a day (90-day mean); transactions -84%, active accounts -75%, gas fees -52% year over year | Burns $1.1M a year (70% of gas) | **Verified capture** | Share of automated versus organic activity is untested without BigQuery (H7) | NearBlocks, DefiLlama (Allium) |
| Staking and validators | 44% of supply staked across 354 validators; nominal yield 5.6% | None: rewards are new tokens (redistribution from non-stakers) | Observed | HSP-029 would cut issuance from 2.5% to 1.6% if adopted | NEAR RPC |
| Chain Signatures (MPC signing) | MPC network of 16 participants, 11-of-n threshold, 8 signature domains; v1.signer 467,548 transactions in 2026-10 (exact months only) | None verified: no burn or buyback is linked to signing fees, and the contract exposes no fee schedule | Observed | Signing for other chains and apps as a paid service; its share of Intents withdrawals (H9) needs receipt-level data | NEAR RPC (v1.signer state), NearBlocks |
| Ecosystem applications (RHEA and others) | $165.0M DeFi TVL (+41% year over year), $131.2M stablecoins; RHEA $787K fees in 30 days | None: app revenue accrues to the applications, not to $NEAR (gas from their use is in L1 burns) | Observed | A larger on-chain economy is the route to a platform valuation (section 3) | DefiLlama |
| NEAR AI | No public usage, revenue or onchain settlement dataset found | None | *Speculative* | AI agents that pay with or settle on NEAR; no measurable evidence yet, so no dollar value is assigned | Announcements only (REPORTED) |
| Treasury and foundation | Holdings and spending are disclosed in foundation reports, not reconciled onchain here | None (a cost centre; sales would add supply to the market) | Observed | Not quantified: no verified onchain disclosure in this pipeline | Foundation reports (REPORTED) |

Fees paid on the NEAR chain by protocol, last 30 days (DefiLlama):

| Protocol | Category | Fees, 30 days | Share |
|---|---|---|---|
| NEAR Intents | Bridge | $5.78M | 86.2% |
| Rhea Dex | Dexs | $504.8K | 7.53% |
| Rhea Lend | Lending | $268.8K | 4.01% |
| Near | Chain | $134.2K | 2.00% |
| RHEA LST | Liquid Staking | $12.6K | 0.188% |
| RHEA Cross Chain | Cross Chain Bridge | $981 | 0.015% |
| KAIO | RWA | $442 | 0.007% |
| Veax CLMM | Dexs | $6.46 | 0.000% |

- NEAR Intents is 86% of all fees paid on the NEAR chain over the last 30 days; the largest native app family, RHEA, is 12%, and NEAR's own gas 2%.
- 93% of NEAR's verified value capture comes from one product (Intents buybacks); the rest is gas burns.
- Intents volume +230% year over year while NEAR L1 transactions changed -84%, active accounts -75% and gas fees -52% (DeFi TVL on NEAR +41%): paid growth is in cross-chain execution, not in activity on the NEAR chain. Part of the L1 decline may be automated or incentive-driven activity ending; classifying it needs BigQuery (H7).

This is the central fact for valuing NEAR (priority finding P2): almost all of NEAR's economic activity and almost all of its value capture is one cross-chain product. The NEAR chain itself carries little paid activity. NEAR therefore behaves less like a traditional L1, valued on the economy that lives on it, and more like the token of a cross-chain execution business, valued on what that business returns to holders.

## 9. Competition: NEAR Intents against cross-chain rivals

If NEAR's value is mostly one cross-chain business, the relevant comparison is that business against its competitors, on the same DefiLlama definitions and the same 90 days. Volume is only available where DefiLlama has a volume adapter; Relay, deBridge, Mayan, Across and Stargate are compared on revenue (their volume would need a paid API, so it is left out rather than estimated). Categories are not added together: only swap venues enter the volume share, and aggregators, which route through those venues and through Intents itself, are listed separately.

| Protocol | Role | Volume a year (run rate) | Volume growth, year | Fees a year | Protocol revenue a year | Revenue per $ of volume | To token holders a year | Token | Market cap | Market cap / revenue | Market cap / holders revenue |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **NEAR Intents** | swap venue | $49.08B | +230.1% | $76.07M | $20.59M | 4.20 bp | $20.59M | NEAR | $4.60B | 223x | 223x |
| THORChain | swap venue | $25.18B | +68.1% | $32.74M | $8.87M | 3.52 bp | $453.6K | RUNE | $195.32M | 22.0x | 431x |
| Chainflip | swap venue | $7.88B | +20.7% | $24.72M | $4.54M | 5.76 bp | $4.54M | FLIP | $34.30M | 7.55x | 7.55x |
| Maya Protocol | swap venue | $2.35B | n/a | $2.95M | $295.2K | 1.26 bp | $295.2K | none | N/A | N/A | N/A |
| Unit | bridge | $23.99B | n/a | $6.09M | $6.09M | 2.54 bp | $0 | none | N/A | N/A | N/A |
| Relay | bridge and solver | not tracked | n/a | $1.07B (includes swap costs) | $17.61M | n/a | not tracked | none | N/A | N/A | N/A |
| deBridge (DLN) | bridge and solver | not tracked | n/a | $6.39M | $6.39M | n/a | $5.07M | DBR | $86.11M | 13.5x | 17.0x |
| Mayan | bridge and solver | not tracked | n/a | $7.81M | $7.81M | n/a | not tracked | none | N/A | N/A | N/A |
| Across | bridge and solver | not tracked | n/a | $1.18M | $0 | n/a | $0 | ACX | $30.85M | N/A | N/A |
| Stargate | bridge | not tracked | n/a | $4.06M | $4.06M | n/a | not tracked | STG | $12.36M | 3.04x | N/A |
| Symbiosis | bridge | not tracked | n/a | $2.17M | $1.17M | n/a | $0 | SIS | $1.55M | 1.33x | N/A |
| LI.FI | aggregator | $16.23B | +149.1% | $17.68M | $3.02M | 1.86 bp | not tracked | none | N/A | N/A | N/A |
| Rango | aggregator | $3.79B | -24.8% | N/A | N/A | n/a | not tracked | none | N/A | N/A | N/A |
| LayerZero | messaging | not tracked | n/a | $3.57M | $775.0K | n/a | $775.0K | ZRO | $616.59M | 796x | 796x |
| Wormhole | messaging | not tracked | n/a | $201.4K | $0 | n/a | not tracked | W | $67.48M | N/A | N/A |
| Axelar | messaging | not tracked | n/a | $55.0K | $0 | n/a | $0 | AXL | $44.30M | N/A | N/A |

- Coverage first: only 4 cross-chain swap venues have public volume data (NEAR Intents, THORChain, Chainflip, Maya Protocol); among them NEAR Intents handles 58% of volume (run rate). Relay, deBridge, Mayan, Across and Stargate have no free volume data, so this is a share of measured venues, not of cross-chain execution.
- By protocol revenue as each DefiLlama adapter defines it (definitions differ: some count only protocol take, others include integrator fees), the largest are NEAR Intents $20.6M, Relay $17.6M, THORChain $8.9M, Mayan $7.8M a year (run rate).
- Cross-chain execution tokens trade at a median 7.5x their protocol revenue (RUNE 22x, FLIP 7.5x, DBR 13x, STG 3.0x, SIS 1.3x); without tokens under $25M market cap the median is 13x (RUNE, FLIP, DBR). The peer set is small and thinly traded, so it is a range, not a benchmark. NEAR trades at 223x Intents revenue.
- Conditional, not a fair value: if NEAR were valued only on Intents revenue at the peer range, Intents would account for $155.5M to $277.3M of market cap against $4.6B today. NEAR's market cap also prices the L1, staking, Chain Signatures and other products; this comparison does not value them.
- On revenue that reaches token holders the gap is smaller: the peer median is 17x (RUNE 431x, FLIP 7.5x, DBR 17x), because some protocols, THORChain above all, pass little revenue to their token. Messaging layers are valued differently again (ZRO 796x).

Two readings follow, and the data cannot choose between them. Either the market prices NEAR for more than Intents (the L1, Chain Signatures, NEAR AI, optionality), which the economy map in section 7 does not find in today's activity or value capture. Or NEAR carries a premium over every cross-chain competitor that its cash flow does not yet justify. Either way, Intents' revenue alone does not explain NEAR's market cap.

## 10. Valuation: how NEAR is priced, and what moves it

**NEAR's own multiple over time.** Market cap on each month-end divided by the value reaching holders over the 90 days ending that day, annualized. NEAR is shown on two bases: DefiLlama's buyback designation, and NEAR delivered to the buyback wallet (section 6). For NEAR, only months whose 90-day window falls entirely after the flow began are shown: earlier windows value pre-buyback treasury revenue, a different definition.

| Asset (basis) | 2026-01 | 2026-03 | 2026-05 | 2026-07 | 2026-09 | 2026-11 |
|---|---|---|---|---|---|---|
| **NEAR** (Burns + designated buybacks (DefiLlama), windows after 23 February 2026 only) | N/A | N/A | 468x | 294x | 495x | 219x |
| **NEAR** (Burns + NEAR delivered to the buyback wallet (onchain), windows after the first delivery only) | N/A | N/A | N/A | 402x | 724x | 319x |
| ETH (DefiLlama holders revenue) | 6,402x | 7,537x | 3,859x | 5,775x | 8,744x | 4,168x |
| SOL (DefiLlama holders revenue) | 1,994x | 1,810x | 2,260x | 2,219x | 2,622x | 1,702x |
| SUI (DefiLlama holders revenue) | 4,599x | 4,140x | 6,189x | N/A | N/A | N/A |
| AVAX (DefiLlama holders revenue) | 977x | 1,373x | 2,661x | 2,674x | 2,516x | 1,056x |
| TON (DefiLlama holders revenue) | 2,390x | 2,404x | 5,095x | 6,454x | 8,560x | 6,569x |
| APT (DefiLlama holders revenue) | N/A | N/A | N/A | 263x | 539x | 369x |
| HYPE (DefiLlama holders revenue) | 9.64x | 13.1x | 27.5x | 21.4x | 27.8x | 20.5x |

**What moves NEAR's 2036 price most.** Base case: Intents grows 20% a year, NEAR keeps its own multiple, today's buyback revenue per dollar of volume and today's burns. Each input is moved on its own; the ranges are published assumptions.

| Input (base case: $16 in 2036) | Low case | Price | High case | Price | High / low |
|---|---|---|---|---|---|
| Intents growth, 10 years | 10% a year | $6.89 | 30% a year | $36 | 5.23x |
| Valuation multiple | 0.5x today's | $8.13 | 1.5x today's | $24 | 3.00x |
| Buyback revenue per dollar of volume | 0.5x today's | $8.2 | 1.5x today's | $24 | 2.97x |
| Supply rule | 2.5% issuance (base) | $16 | HSP-029 | $18 | 1.08x |
| Gas burns | 0x today's | $16 | 5x today's | $17 | 1.04x |

**Designated versus executed basis.** The ladder's main tables use DefiLlama's designated buybacks. The same results on the executed basis (NEAR actually delivered to the buyback wallet), with the multiple, the take rate and the projected flow all on that basis and the same 90 days. NEAR's own multiple changes with the basis; peer multiples do not.

| Basis | NEAR multiple today | Buyback revenue per $ of volume | Implied 2036 price, Priced like Hyperliquid | Implied 2036 price, Priced like Tron | Implied 2036 price, NEAR's own multiple | $25 (NEAR's own multiple) | $100 (NEAR's own multiple) | $100 (priced like Tron) |
|---|---|---|---|---|---|---|---|---|
| Designated (DefiLlama) | 212x | 0.042% | $1.49 | $7.85 | $16 | 2.63% of spot DEX | 10.6% | 21.9% |
| Executed (delivered onchain) | 309x | 0.028% | $1.01 | $5.29 | $16 | 2.69% of spot DEX | 10.8% | 32.6% |

**How much of each rung rests on the multiple alone.** The cash-flow multiple each rung would need under each growth scenario. Compare with NEAR's 212x today, Tron's 102x and Hyperliquid's 19.5x (cash-flow tokens), and the platforms' thousands (section 3). Where the multiple needed is in platform territory, the rung depends on NEAR being re-rated as a platform, not on its cash flow.

| Rung | Low growth (10% a year) | Base growth (20% a year) | High growth (40% a year) |
|---|---|---|---|
| $10 | 308x | 131x | 28.1x |
| $25 | 770x | 326x | 70.3x |
| $50 | 1,541x | 653x | 141x |
| $100 | 3,082x | 1,306x | 281x |

## 11. NEAR against the alternatives (opportunity cost)

Every investable alternative under the valuation method that fits it (section 3): BTC as a monetary asset, platforms on their on-chain economy, Hyperliquid on cash flow, NEAR on both. For the same price multiple in ten years, the asset's valuation driver has to grow by the same factor, plus enough to offset its own dilution (assumed to persist). Observed growth is the same driver over the last year. This is a side-by-side map, not a recommendation.

| Asset | Valued on | Dilution a year | Driver growth needed for 2.8x / 7x / 14x / 28x, a year for ten years | Observed growth, last year | Note |
|---|---|---|---|---|---|
| BTC | market cap | 0.924% | market cap 183.3% / 458.1% / 916.3% / 1832.6% of today's total crypto | n/a | none: a monetary asset has no cash flow or on-chain economy to grow; required market cap is compared with today's total crypto market |
| ETH | stablecoins and DeFi TVL on the chain | 0.817% | 11.8% / 22.5% / 31.3% / 40.7% | -31.1% | Stablecoins -18.6%, DeFi TVL -43.5% |
| SOL | stablecoins and DeFi TVL on the chain | 1.49% | 12.5% / 23.3% / 32.1% / 41.6% | -24.4% | Stablecoins +2.45%, DeFi TVL -51.2% |
| SUI | stablecoins and DeFi TVL on the chain | 12.5% | 24.7% / 36.6% / 46.4% / 57.0% | -43.5% | Stablecoins -18.9%, DeFi TVL -68.2% |
| AVAX | stablecoins and DeFi TVL on the chain | 4.38% | 15.7% / 26.8% / 35.9% / 45.7% | -54.0% | Stablecoins -49.7%, DeFi TVL -58.3% |
| TON | stablecoins and DeFi TVL on the chain | 14.8% | 27.3% / 39.5% / 49.5% / 60.2% | -45.5% | Stablecoins -30.6%, DeFi TVL -60.4% |
| APT | stablecoins and DeFi TVL on the chain | 22.6% | 35.9% / 49.0% / 59.7% / 71.1% | -47.2% | Stablecoins -0.955%, DeFi TVL -93.4% |
| HYPE | holders revenue | 0.242% | 11.1% / 21.8% / 30.5% / 39.9% | -24.5% | Stablecoins +32.8%, DeFi TVL +11.1% |
| **NEAR** | Intents volume (cash flow); stablecoins and TVL (platform) | 2.16% | 13.2% / 24.1% / 33.0% / 42.6% | +230.1% | Platform route: stablecoins -23%, DeFi TVL +27% over the last year. |

- NEAR's own cash-flow multiple: 219x on designated buybacks and 319x on executed buybacks (latest month-end). Only windows that fall entirely after each flow began are shown; earlier months valued pre-buyback treasury revenue and are not comparable.
- The input that moves NEAR's implied 2036 price most is Intents growth, 10 years (10% a year: $6.89; 30% a year: $36.05; base $16.27).
- At base growth, $100 would need a cash-flow multiple of 1306x; at high growth 281x. Today: NEAR 212x, Tron 102x, Hyperliquid 20x.
- For 7x in ten years NEAR's driver must grow 24.1% a year (its own dilution included); Intents volume grew 230% over the last year. Required vs observed, by asset (7x): NEAR 24% vs 230%; HYPE 22% vs -24%; SOL 23% vs -24%; ETH 22% vs -31%; SUI 37% vs -44%; AVAX 27% vs -54%; TON 39% vs -46%; APT 49% vs -47%. One year of observed growth is dominated by the market cycle, and NEAR's driver is a young product growing from a small base while the platforms' drivers are mature chain economies, so the comparison flatters NEAR.

**Risk on common measures.** DefiLlama daily prices; volatility and correlation use returns between consecutive days only; liquidity is a one-day snapshot of trading volume over market cap.

| Asset | Volatility, 1 year | Volatility, 3 years | Max drawdown, 3 years | Price vs 3-year peak | Correlation with BTC, 1 year | Volume / market cap, 24h | Supply still to unlock |
|---|---|---|---|---|---|---|---|
| BTC | 39.8% | 47.8% | -53.1% | -40.7% | 1.00 | 1.53% | 1.00x |
| ETH | 58.0% | 71.0% | -67.5% | -57.4% | 0.87 | 3.36% | 1.00x |
| SOL | 63.6% | 86.7% | -75.8% | -67.6% | 0.75 | 3.91% | 1.08x |
| SUI | 91.4% | 115.2% | -87.7% | -84.5% | 0.61 | 7.47% | 2.42x |
| AVAX | 74.0% | 93.8% | -90.2% | -85.9% | 0.56 | 6.06% | 1.06x |
| TON | 82.6% | 81.9% | -87.5% | -85.7% | 0.40 | 4.08% | 1.85x |
| APT | 96.2% | 98.4% | -97.1% | -96.9% | 0.45 | 5.08% | 1.37x |
| HYPE | 88.1% | 114.6% | -64.3% | -25.9% | 0.39 | 4.71% | 3.97x |
| **NEAR** | 115.7% | 113.4% | -89.2% | -59.5% | 0.45 | 10.6% | 1.00x |

What this does not show: one year of observed growth is dominated by the market cycle (most chains' stablecoins and DeFi TVL fell, and TVL is measured in dollars, so it also falls with prices). NEAR's cash-flow driver is a young product growing from a small base, while the platforms' drivers are mature chain economies. NEAR's platform route, its own on-chain economy, is listed in the table's note column.

## 12. Hypotheses tested

Each hypothesis was written before the data was read (research/three-digits/SCOPE.md), with the rule that decides it. Any outcome is reported, including those that favour NEAR.

| | Hypothesis | Rule | Reading | Outcome |
|---|---|---|---|---|
| H1 | NEAR's fee base is far more concentrated in one product than peers' (restated from "value capture": comparable value-capture data by product does not exist for peers) | Protocol fees on each chain (DefiLlama, 30 days). SUPPORTED if the largest protocol's share of NEAR's fees is at least 50% and at least 1.5x the peer median; NOT SUPPORTED if at or below the peer median; otherwise MIXED. | Intents: 86% of fees paid on NEAR; peer median largest-protocol share 39% (TON 90%, NEAR 86%, APT 49%, HYPE 48%, SOL 39%, SUI 25%, AVAX 17%, ETH 13%). Separately, and not compared with peers: 93% of NEAR's verified value capture comes from Intents. | **SUPPORTED** |
| H2 | NEAR's market cap is high relative to its on-chain economy compared with platforms (an observed valuation gap, not a judgement that it is unjustified) | SUPPORTED if NEAR's market cap to stablecoins and to DeFi TVL both exceed every platform benchmark; NOT SUPPORTED if both are at or below the benchmark median; otherwise MIXED. | NEAR market cap is 35x its stablecoins and 28x its DeFi TVL; benchmarks: Ethereum 1.9x / 6.1x, BNB Chain 6.6x / 18x, Solana 3.5x / 9.7x, Tron 0.3x / 6.1x. | **SUPPORTED** |
| H3 | Intents' take rate is above cross-chain peers, so fee pressure matters more than volume | SUPPORTED if Intents' protocol revenue per dollar of volume is above every peer with public volume; NOT SUPPORTED if at or below the peer median; otherwise MIXED. | Intents 4.20 bp; peers THORChain 3.52 bp, Chainflip 5.76 bp, Maya Protocol 1.26 bp, Unit 2.54 bp, LI.FI 1.86 bp (median 2.54 bp). | **MIXED** |
| H4 | Cross-chain activity and NEAR L1 activity are moving in opposite directions (diverging trends; migration of value is not proven) | SUPPORTED if Intents volume grew while L1 transactions and active accounts both fell (matched 90-day windows); NOT SUPPORTED if L1 activity grew faster than Intents; otherwise MIXED. Divergence does not show that value moved from one to the other. | Intents volume 230%; L1 transactions -84%, active accounts -75%, gas fees -52%. Part of the L1 decline may be automated activity ending (H7), and the two trends may have separate causes. | **SUPPORTED** |
| H5 | NEAR's dilution is a higher return hurdle than peers' | Tested twice: on dilution net of capture (one-day events excluded, held buybacks subtracted) and on raw circulating supply growth. Each: SUPPORTED if NEAR is more than 0.5 points above the peer median, NOT SUPPORTED if more than 0.5 points below, otherwise MIXED. If the two disagree, MIXED. | Raw: NEAR 2.5% vs peer median 5.6% (NOT SUPPORTED). Adjusted: NEAR 2.2% a year; peer median 2.9% (BTC 0.9%, ETH 0.8%, SOL 1.5%, SUI 12.5%, AVAX 4.4%, TON 14.8%, APT 22.6%, HYPE 0.2%).  The median is pulled up by small, high-dilution chains: against the four largest alternatives (BTC, ETH, SOL, HYPE) NEAR's dilution is higher than 4 of 4. HSP-029 would lower NEAR's issuance if adopted. | **NOT SUPPORTED** |
| H6 | NEAR needs more growth than some alternatives to deliver the same multiple | Required driver growth for 7x in ten years (own dilution included). SUPPORTED if NEAR's is more than 1 point above the peer median; NOT SUPPORTED if more than 1 point below; otherwise MIXED. | NEAR 24.1% a year; peer median 26.8% (ETH 22.5%, SOL 23.3%, SUI 36.6%, AVAX 26.8%, TON 39.5%, APT 49.0%, HYPE 21.8%).  Against the largest alternatives with a growth driver (ETH, SOL, HYPE, AVAX) NEAR needs more growth than 3 of 4. Observed growth is compared in section 11. | **NOT SUPPORTED** |
| H7 | Most of NEAR's reported activity is automated rather than organic | Signer classification over the last year. | Not tested: needs receipt-level signer data (BigQuery crypto_near_mainnet_us, research/sql/). L1 transactions fell 84% in a year, which is consistent with automated activity ending but does not prove it. | **UNTESTED** |
| H8 | Intents revenue depends on a few integrators or solvers | Share of volume from the top five integrators and solvers. | Not tested: needs Intents Explorer API (partner JWT) or intents.near event logs (BigQuery). | **UNTESTED** |
| H9 | Chain Signatures underpins Intents' cross-chain withdrawals, so its value is real but invisible in token capture | Share of Intents withdrawals signed via v1.signer. | Not tested at receipt level. v1.signer runs a 16-participant MPC network with 467,548 transactions in 2026-10, and no signing fee reaches $NEAR. | **UNTESTED** |
| H10 | NEAR's price is mostly explained by BTC and the market, not its fundamentals | Share of NEAR's daily return variance explained by BTC over the last year (R-squared). SUPPORTED if at least 50%; NOT SUPPORTED if below 25%; otherwise MIXED. | Correlation with BTC 0.45 (R-squared 21%); 0.62 in the 180 days before buybacks began and 0.42 since. ETH's correlation with BTC is 0.87. Daily returns cannot be regressed on Intents growth, which changes slowly; this tests market dependence only. | **NOT SUPPORTED** |

## 13. What could break it, and other risks

| Risk | Effect | Reading today |
|---|---|---|
| Intents growth slows | Every rung depends on compounding volume for ten years | 57.8% year over year (latest 30 days); $25 at NEAR's own multiple needs 25.3% a year |
| Fee competition | Halving buyback revenue per dollar of volume doubles every volume requirement | Intents 0.042% of volume as protocol revenue; Maya and LI.FI earn far less per dollar |
| The market re-rates NEAR toward its peers | At Tron's multiple every rung needs 2.07x the value to holders; at the cross-chain peer median, Intents revenue supports $155.45M of market cap | NEAR 212x; cross-chain peers 7.55x |
| Buybacks fall short of the designation | Every capture figure built on DefiLlama's designation overstates what reaches the buyback wallet | 67.1% of designated revenue reached the buyback wallet; the front-end fund kept $2.14M |
| Supply keeps growing at 2.5% | $100 means a larger market cap | Net issuance 2.48% of supply a year; buybacks absorb 0.303% into a held wallet; HSP-029 approved, pending validator adoption |
| NEAR L1 activity keeps falling | Weakens the platform route | L1 transactions -84.0%, active accounts -75.3% year over year |
| Validator concentration | A third of stake can halt finality | 9 validators hold a third of stake |
| Chain Signatures operators | Signing depends on a small operator set | 16 MPC participants (threshold in the evidence register) |
| Integrator and solver concentration | A few partners could carry most of Intents' volume | Not measured (H8) |
| Regulation | Cross-chain swap services and confidential transfers draw regulatory attention | Not assessed: no source in this pipeline measures it |

**NEAR Intents exploit, 1 October 2026.** An attacker created about $3.8M of unbacked balances (USDT on BNB Chain) through a flaw in the Intents contract's deposit notification function, then withdrew real tokens. Intents paused within about half an hour and halted deposits and withdrawals on 11 networks. Early reports blamed the interaction with the Omni bridge; the team's post-mortem (16 October) places the flaw in the Intents contract itself. The attacker returned the funds on 2 October. The post-mortem says all affected users were compensated, a second flaw in the same function was found by a white-hat on 7 October ($300,000 bounty), the function was removed, and a check of user balances against contract holdings now pauses the contract automatically. These are press and team reports, not verified onchain here. Sources: [Decrypt](https://decrypt.co/380014/near-intents-recovers-3-8-million-after-48-hour-ultimatum), [post-mortem summary (TechFlow)](https://www.techflowpost.com/en-US/newsletter/140312), [The Block](https://theblock.co/news/ecosystems/2026-10-01-near-intents-halts-services-after-3-8-million-exploit-promises-full-compensation-417404).

Falsification triggers from the underlying research, evaluated on every rebuild:

| ID | Falsification trigger | Rule | Current reading | Status |
|---|---|---|---|---|
| F1 | Intents volume grows but NEAR-captured revenue per dollar of volume falls. | `INT-VOL-GROWTH > 0 and INT-TAKE-RATE < 0.8 x INT-TAKE-RATE-PRIOR` | volume 84.1%; take rate 0.027% -> 0.042% | **NOT TRIGGERED** |
| F2 | Fee compression: the effective fee rate drops by a quarter or more between consecutive 90-day windows. | `INT-FEE-RATE < 0.75 x INT-FEE-RATE-PRIOR` | 0.135% -> 0.155% | **NOT TRIGGERED** |
| F3 | The volume needed for buyback revenue worth 2% of market cap is more than ten times today's run rate. | `MODEL-VOL-MULTIPLE-2PCT > 10` | 4.47x today's run rate | **NOT TRIGGERED** |
| F4 | Base-layer user activity contracts sharply year over year. | `ACT-DAA-YOY < -25%` | -76.3% vs a year earlier | **TRIGGERED** |
| F5 | DeFi deposits on NEAR halve year over year. | `DEFI-TVL-NEAR-YOY < -50%` | 41.4% vs a year earlier | **NOT TRIGGERED** |
| F6 | Token-level value capture is under 1% of market cap per year. | `VAL-NEAR-VALUE-CAPTURE-ANN / MKT-NEAR-MCAP < 1%` | 0.471% of market cap | **TRIGGERED** |

## 14. Self-challenge

Before any conclusion, each finding was checked against the ways it could be wrong (SCOPE.md W9).

| Check | What was tested | Result |
|---|---|---|
| Comparability | Same metric definition, coverage, window and method for every compared series | All multiples now use one metric (DefiLlama holders revenue), one 90-day run rate and one end date; the original thesis mixed a 90-day NEAR figure with one-year peer figures (corrected: NEAR 212x on the run rate, 521x on the trailing year) |
| Denominators | Shares stated with their denominator | DefiLlama's DEX overview counts prediction markets, launchpads and bridges (including Intents); shares use the spot category only, and Intents' ratio to it is a scale reference, not a market share |
| Lineage independence | Cross-checks must not share an upstream | DefiLlama's Intents figures and NEAR's revenue dashboard share Dune queries; the buyback check reads FastNEAR transaction data, an independent path: it reproduces DefiLlama's captured revenue to 99.1% and shows 67.1% of the designation reaching the buyback wallet |
| Double counting | No flow counted twice | A first dilution comparison subtracted supply growth and added burns again; replaced by dilution net of capture. Volumes from different categories are never added |
| Sampling and survivorship | Peer sets fixed before results | The comparison universe was fixed in SCOPE.md; cross-chain peers are every protocol in the discovery inventory with data; messaging layers are kept out of the execution median, which makes the comparison stricter for NEAR, not easier |
| Misleading proxies | Each proxy's limits stated | TVL is in dollars and falls with prices; one year of observed growth is dominated by the market cycle; NEAR's cash-flow driver is a young product growing from a small base |
| Alternative explanations | Other causes for each finding | The L1 activity decline may be automated or incentive-driven activity ending (H7 untested); the gap between designated buybacks and the buyback wallet is explained by revenue kept in the front-end fund and inflows from accounts other than Intents, both counted by DefiLlama's method; the front-end fund's NEAR may still be used for buybacks later |
| Threshold sensitivity | Would a verdict flip with a different threshold? | H5 and H6 depend on including small, high-dilution chains in the peer median; against the largest alternatives NEAR's dilution and required growth are higher. The ladder's bands are our judgment and published |
| Coverage gaps | What could not be measured | Relay, deBridge, Mayan, Across and Stargate volume (paid API); integrator and solver concentration (H8); automated activity (H7); Chain Signatures' role in withdrawals (H9); NEAR AI usage; foundation holdings |

## 15. Verdict: how far can NEAR go, and why choose it or not?

At NEAR's own valuation multiple today, $25 in ten years needs NEAR Intents to grow up to 5x relative to spot DEX volume; $100 needs Intents volume equal to 10.6% of spot DEX volume (6.2x today's ratio). Priced like Tron, a cash-flow token, $100 needs 21.9%. Intents growth and the valuation multiple matter about equally.

**Where NEAR leads and where it trails** (each line is generated by a rule from the data):

Leads:

- Largest of the 4 cross-chain swap venues with public volume data (58.1% of their volume; several competitors have no public volume).
- Highest protocol revenue among the cross-chain protocols compared, on DefiLlama's adapter definitions, which are not identical across protocols.
- No supply left to unlock (fully diluted value equals market cap).
- Dilution net of capture below the median of the alternatives (2.16% a year).

Trails:

- Observed valuation gap to its on-chain economy: market cap is many times its stablecoins and DeFi TVL, against single digits for the largest platforms.
- Market cap is 223x Intents revenue, against 7.55x to 13.5x for small cross-chain peer tokens (NEAR's market cap also prices products those peers do not have).
- NEAR L1 activity is falling (transactions -84.0% year over year).
- Most volatile asset in the comparison (115.7% annualized over the last year).
- Net issuance (2.48% of supply a year) is larger than what buybacks absorb into a held wallet (0.303%).
- Of the revenue DefiLlama designates as buybacks, 67.1% reached the buyback wallet; the rest sits in the front-end fund or came from accounts other than Intents.
- Fee base concentrated in one product, more than almost every peer chain.

Neither lead nor trail by itself:

- Highest daily trading volume relative to market cap (10.6%): deep liquidity, or speculative turnover.
- Daily returns are less correlated with BTC than ETH's or SOL's (R-squared 20.5%): diversification, or idiosyncratic risk.

**NEAR's economy.** Almost all of it is one product: NEAR Intents is 86.2% of the fees paid on NEAR and 92.9% of the value verifiably captured by $NEAR ($14.99M a year: executed buybacks plus burns). Chain Signatures, NEAR AI and ecosystem apps capture nothing for $NEAR that can be verified today; they are listed as possible upside and given no dollar value.

**How far NEAR can go.** In the cash-flow framework, $100 in ten years needs a 1,306x multiple at 20% a year Intents growth, or 281x at 40%; cash-flow tokens trade at 19.5x to 102x and small cross-chain peer tokens at 7.55x to 13.5x revenue (NEAR's market cap also prices products those peers do not have). In the platform framework, $100 needs $47.36B of stablecoins on NEAR at Solana's ratio, 362x today's. The frameworks are never added together. Three digits rests on either decade-long hypergrowth of one product at a multiple the market pays no cash-flow peer today, or on NEAR becoming a platform whose economy does not exist yet.

**Why an investor might choose NEAR, or not.** To prefer NEAR over the alternatives an investor has to believe, in order of how much each moves the outcome: that Intents keeps compounding for a decade (the sensitivity analysis ranks growth first); that the market keeps paying NEAR's own multiple (212x) rather than a cash-flow (102x) one; that revenue per dollar of volume survives competition; and that captured revenue keeps reaching the buyback wallet (on the executed basis NEAR's own multiple is 309x, not 212x). In NEAR's favour and against it: the lead and trail lines above. On these rules NEAR is a concentrated, high-volatility bet on one cross-chain product. For the same multiple it needs no more growth than the median alternative; section 12 compares it with the largest ones.

**What would prove this wrong.** Upward: Intents sustaining growth above each rung's checkpoint, executed buybacks reaching the designated amount, buyback revenue per dollar of volume holding as volume grows, or stablecoins and DeFi settling on NEAR itself. Downward: Intents growth falling below the $10 path, fee compression, a re-rating toward cross-chain or cash-flow multiples, or a second security incident. The checkpoints (section 6) and triggers (section 13) are re-evaluated on every rebuild.

No AI writes this verdict. Every number comes from code; the rules, bands and assumptions are published so anyone can change them in `src/lib/research/` and rebuild.

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
| MKT-NEAR-MCAP | NEAR circulating market cap | $4.60B | OBSERVED | point in time | CoinGecko |
| MKT-NEAR-PRICE | NEAR price | $3.51 | OBSERVED | point in time | CoinGecko |
| MKT-NEAR-CIRC | NEAR circulating supply (CoinGecko) | 1.31B NEAR | OBSERVED | point in time | CoinGecko |
| MKT-SOL-MCAP | Solana circulating market cap | $49.07B | OBSERVED | point in time | CoinGecko |
| MKT-SUI-MCAP | Sui circulating market cap | $3.37B | OBSERVED | point in time | CoinGecko |
| MKT-AVAX-MCAP | Avalanche circulating market cap | $3.85B | OBSERVED | point in time | CoinGecko |
| MKT-NEAR-MCAP-1Y | NEAR market cap change, trailing 365 days | 41.9% | DERIVED | Nov 13, 2025 to Nov 12, 2026 | CoinGecko |
| INT-VOL-90D | NEAR Intents swap volume, 90 days | $12.10B | OBSERVED | Aug 13, 2026 to Nov 10, 2026 | DefiLlama |
| INT-VOL-PRIOR-90D | NEAR Intents swap volume, prior 90 days | $6.57B | OBSERVED | May 15, 2026 to Aug 12, 2026 | DefiLlama |
| INT-FEES-90D | NEAR Intents gross fees, 90 days | $18.76M | OBSERVED | Aug 13, 2026 to Nov 10, 2026 | DefiLlama |
| INT-FEES-PRIOR-90D | NEAR Intents gross fees, prior 90 days | $8.90M | OBSERVED | May 15, 2026 to Aug 12, 2026 | DefiLlama |
| INT-REV-90D | NEAR Intents captured revenue, 90 days | $5.08M | OBSERVED | Aug 13, 2026 to Nov 10, 2026 | DefiLlama |
| INT-REV-PRIOR-90D | NEAR Intents captured revenue, prior 90 days | $1.74M | OBSERVED | May 15, 2026 to Aug 12, 2026 | DefiLlama |
| INT-BUYBACK-90D | Revenue DefiLlama classifies as buybacks, 90 days | $5.08M | OBSERVED | Aug 13, 2026 to Nov 10, 2026 | DefiLlama |
| INT-VOL-ANN | NEAR Intents annualized volume (V) | $49.08B | DERIVED | Aug 13, 2026 to Nov 10, 2026 | Computed here |
| INT-VOL-GROWTH | Volume change, last 90 days vs prior 90 days | 84.1% | DERIVED | May 15, 2026 to Nov 10, 2026 | Computed here |
| INT-FEE-RATE | Effective gross fee rate (f) | 0.155% | DERIVED | Aug 13, 2026 to Nov 10, 2026 | Computed here |
| INT-FEE-RATE-PRIOR | Effective gross fee rate, prior 90 days | 0.135% | DERIVED | May 15, 2026 to Aug 12, 2026 | Computed here |
| INT-CAPTURE | Protocol capture of gross fees (c) | 27.1% | DERIVED | Aug 13, 2026 to Nov 10, 2026 | Computed here |
| INT-CAPTURE-PRIOR | Protocol capture of gross fees, prior 90 days | 19.6% | DERIVED | May 15, 2026 to Aug 12, 2026 | Computed here |
| INT-TAKE-RATE | NEAR-captured revenue per dollar of volume (f x c) | 0.042% | DERIVED | Aug 13, 2026 to Nov 10, 2026 | Computed here |
| INT-TAKE-RATE-PRIOR | NEAR-captured revenue per dollar of volume, prior 90 days | 0.027% | DERIVED | May 15, 2026 to Aug 12, 2026 | Computed here |
| INT-BUYBACK-SHARE | Share of captured revenue classified as buybacks (b) | 100.0% | DERIVED | Aug 13, 2026 to Nov 10, 2026 | Computed here |
| INT-REV-ANN | NEAR Intents captured revenue, annualized | $20.59M | DERIVED | Aug 13, 2026 to Nov 10, 2026 | Computed here |
| INT-DEFINITIONS | DefiLlama fee and revenue definitions for NEAR Intents | text | REPORTED | point in time | DefiLlama |
| ONC-BUYBACK-WALLET | NEAR held by buybacks.multisignature.near | 2.25M NEAR | OBSERVED | point in time | NEAR JSON-RPC (FastNEAR) |
| ONC-TOTAL-SUPPLY | NEAR total supply (protocol) | 1.31B NEAR | OBSERVED | point in time | NEAR JSON-RPC (FastNEAR) |
| ONC-MAX-INFLATION | Protocol maximum annual inflation rate | 2.50% | OBSERVED | point in time | NEAR JSON-RPC (FastNEAR) |
| ONC-BUYBACK-PCT-SUPPLY | Buyback wallet holdings as share of total supply | 0.172% | DERIVED | point in time | Computed here |
| ONC-ISSUANCE-USD | Maximum annual issuance at current price | $115.08M | DERIVED | point in time | Computed here |
| ACT-DAA-30D | Daily active accounts, 30-day mean | 62,311 | OBSERVED | Oct 12, 2026 to Nov 10, 2026 | NearBlocks |
| ACT-DAA-30D-1Y-AGO | Daily active accounts, 30-day mean one year earlier | 262,727 | OBSERVED | Oct 12, 2025 to Nov 10, 2025 | NearBlocks |
| ACT-TXN-30D | Daily transactions, 30-day mean | 657,884 | OBSERVED | Oct 12, 2026 to Nov 10, 2026 | NearBlocks |
| ACT-NEW-30D | New accounts per day, 30-day mean | 9,597 | OBSERVED | Oct 12, 2026 to Nov 10, 2026 | NearBlocks |
| ACT-DAA-YOY | Daily active accounts, change vs one year earlier | -76.3% | DERIVED | point in time | Computed here |
| ACT-GAS-FEES-30D | Base-layer transaction fees, 30 days (NearBlocks) | $137.5K | OBSERVED | Oct 12, 2026 to Nov 10, 2026 | NearBlocks |
| ACT-RETENTION | Retained signer cohorts (BigQuery) | unavailable | OBSERVED | point in time | Google BigQuery: crypto_near_mainnet_us |
| DEFI-TVL-NEAR | NEAR chain DeFi TVL | $165.03M | OBSERVED | as of Nov 12, 2026 | DefiLlama |
| DEFI-TVL-NEAR-1Y-AGO | NEAR chain DeFi TVL one year earlier | $116.70M | OBSERVED | as of Nov 12, 2025 | DefiLlama |
| DEFI-TVL-NEAR-YOY | NEAR TVL change vs one year earlier | 41.4% | DERIVED | point in time | Computed here |
| DEFI-RHEA-LEND-TVL | RHEA Lend TVL on NEAR | $143.06M | OBSERVED | as of Nov 12, 2026 | DefiLlama |
| DEFI-RHEA-DEX-TVL | RHEA DEX TVL on NEAR | $22.34M | OBSERVED | as of Nov 12, 2026 | DefiLlama |
| DEFI-STABLES-NEAR | Stablecoin supply on NEAR | $131.24M | OBSERVED | as of Nov 12, 2026 | DefiLlama |
| FEES-NEAR-CHAIN-90D | NEAR base-layer gas fees, 90 days | $374.3K | OBSERVED | Aug 13, 2026 to Nov 10, 2026 | DefiLlama |
| FEES-NEAR-BURN-90D | NEAR gas fees burned, 90 days | $262.0K | OBSERVED | Aug 13, 2026 to Nov 10, 2026 | DefiLlama |
| VAL-NEAR-VALUE-CAPTURE-ANN | Token-level value capture, annualized (burn + Intents buybacks) | $21.66M | DERIVED | point in time | Computed here |
| VAL-NEAR-MCAP-TO-CAPTURE | Market cap / annualized token value capture | 212x | DERIVED | point in time | Computed here |
| PEER-NEAR-FEES-30D | NEAR chain fees, 30 days | $136.7K | OBSERVED | Oct 12, 2026 to Nov 10, 2026 | DefiLlama |
| PEER-NEAR-TVL | NEAR DeFi TVL | $170.29M | OBSERVED | as of Nov 10, 2026 | DefiLlama |
| PEER-NEAR-DEX-30D | NEAR DEX volume, 30 days | $4.05B | OBSERVED | Oct 12, 2026 to Nov 10, 2026 | DefiLlama |
| PEER-NEAR-MCAP-TO-FEES | NEAR market cap / annualized chain fees | 2,765x | DERIVED | point in time | Computed here |
| PEER-NEAR-MCAP-TO-TVL | NEAR market cap / DeFi TVL | 27.0x | DERIVED | point in time | Computed here |
| PEER-SOL-FEES-30D | Solana chain fees, 30 days | $17.22M | OBSERVED | Oct 12, 2026 to Nov 10, 2026 | DefiLlama |
| PEER-SOL-TVL | Solana DeFi TVL | $5.05B | OBSERVED | as of Nov 10, 2026 | DefiLlama |
| PEER-SOL-DEX-30D | Solana DEX volume, 30 days | $54.45B | OBSERVED | Oct 12, 2026 to Nov 10, 2026 | DefiLlama |
| PEER-SOL-MCAP-TO-FEES | Solana market cap / annualized chain fees | 234x | DERIVED | point in time | Computed here |
| PEER-SOL-MCAP-TO-TVL | Solana market cap / DeFi TVL | 9.71x | DERIVED | point in time | Computed here |
| PEER-SUI-FEES-30D | Sui chain fees, 30 days | unavailable | OBSERVED | Oct 12, 2026 to Nov 10, 2026 | DefiLlama |
| PEER-SUI-TVL | Sui DeFi TVL | $436.06M | OBSERVED | as of Nov 10, 2026 | DefiLlama |
| PEER-SUI-DEX-30D | Sui DEX volume, 30 days | $789.73M | OBSERVED | Oct 12, 2026 to Nov 10, 2026 | DefiLlama |
| PEER-SUI-MCAP-TO-FEES | Sui market cap / annualized chain fees | unavailable | DERIVED | point in time | Computed here |
| PEER-SUI-MCAP-TO-TVL | Sui market cap / DeFi TVL | 7.73x | DERIVED | point in time | Computed here |
| PEER-AVAX-FEES-30D | Avalanche chain fees, 30 days | $336.0K | OBSERVED | Oct 12, 2026 to Nov 10, 2026 | DefiLlama |
| PEER-AVAX-TVL | Avalanche DeFi TVL | $618.78M | OBSERVED | as of Nov 10, 2026 | DefiLlama |
| PEER-AVAX-DEX-30D | Avalanche DEX volume, 30 days | $2.58B | OBSERVED | Oct 12, 2026 to Nov 10, 2026 | DefiLlama |
| PEER-AVAX-MCAP-TO-FEES | Avalanche market cap / annualized chain fees | 941x | DERIVED | point in time | Computed here |
| PEER-AVAX-MCAP-TO-TVL | Avalanche market cap / DeFi TVL | 6.22x | DERIVED | point in time | Computed here |
| INT-EXPLORER-TOP5-SHARE | Share of sampled 1Click volume from top 5 referrers | unavailable | OBSERVED | point in time | NEAR Intents Explorer API |
| INT-EXPLORER-MEDIAN-SWAP | Median sampled 1Click swap size | unavailable | OBSERVED | point in time | NEAR Intents Explorer API |
| MODEL-BUYBACK-USD | Annual buyback demand at current run rate | $20.59M | DERIVED | Aug 13, 2026 to Nov 10, 2026 | Buyback target model nvabe-1.0.0 |
| MODEL-BUYBACK-TO-MCAP | Annual buyback demand / market cap | 0.448% | DERIVED | Aug 13, 2026 to Nov 10, 2026 | Buyback target model nvabe-1.0.0 |
| MODEL-BREAKEVEN-VOL-2PCT | Annual volume needed for buybacks = 2% of market cap | $219.24B | DERIVED | Aug 13, 2026 to Nov 10, 2026 | Buyback target model nvabe-1.0.0 |
| MODEL-VOL-MULTIPLE-2PCT | Volume multiple needed for 2% of market cap | 4.47x | DERIVED | Aug 13, 2026 to Nov 10, 2026 | Buyback target model nvabe-1.0.0 |
| MODEL-REQ-TAKE-RATE-2PCT | Required f x c x b at today's volume for 2% of market cap | 0.187% | DERIVED | Aug 13, 2026 to Nov 10, 2026 | Buyback target model nvabe-1.0.0 |
| MODEL-CURRENT-TAKE-RATE | Current f x c x b (volume converted to buyback demand) | 0.042% | DERIVED | Aug 13, 2026 to Nov 10, 2026 | Buyback target model nvabe-1.0.0 |
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
| SUP-NET-NEW-ANN-PCT | Realized net new NEAR supply, annualized | 2.48% | DERIVED | Aug 12, 2026 to Nov 10, 2026 | NearBlocks |
| SUP-NET-NEW-ANN-USD | Realized net new supply per year at today's price | $113.26M | DERIVED | Aug 12, 2026 to Nov 10, 2026 | Computed here |
| SUP-PARITY-VOL | Annual Intents volume at which buyback-designated revenue equals the value of realized net new supply | $269.92B | DERIVED | point in time | Computed here |
| SUP-PARITY-MULTIPLE | Parity volume as a multiple of today's Intents volume run rate | 5.50x | DERIVED | point in time | Computed here |
| INT-BUYBACK-DESIGNATED-CUM | Buyback-designated Intents revenue since DefiLlama began classifying it (2026-02-23) | $8.06M | DERIVED | Feb 23, 2026 to Nov 10, 2026 | DefiLlama |
| ONC-BUYBACK-WALLET-VS-DESIGNATED | Buyback wallet holdings at today's price vs cumulative buyback-designated revenue | 98.1% | DERIVED | point in time | Computed here |
| COV-BUYBACK-REALIZED | Buyback-designated revenue as a share of realized net new supply | 18.2% | DERIVED | Aug 12, 2026 to Nov 10, 2026 | Computed here |
| COV-CAPTURE-MAX | Burns plus buybacks as a share of maximum issuance | 18.8% | DERIVED | point in time | Computed here |
| LAD-SPOT-DEX-RUNRATE | Spot DEX volume, 90-day run rate (DefiLlama "Dexs" category) | $2.88T | OBSERVED | as of Nov 10, 2026 | DefiLlama |
| LAD-SPOT-DEX-365D | Spot DEX volume, last 365 days | $2.90T | OBSERVED | as of Nov 10, 2026 | DefiLlama |
| LAD-ALL-DEX-RUNRATE | Everything in DefiLlama's DEX overview, 90-day run rate | $3.33T | OBSERVED | as of Nov 10, 2026 | DefiLlama |
| LAD-INTENTS-DEX-SHARE | NEAR Intents volume relative to spot DEX volume, run rate | 1.71% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-INTENTS-DEX-SHARE-365D | NEAR Intents volume relative to spot DEX volume, last 365 days | 1.13% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-INTENTS-CROSSCHAIN-SHARE | NEAR Intents share of the cross-chain protocols in DefiLlama's DEX overview | 64.7% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-INTENTS-YOY | NEAR Intents volume, latest 30 days vs the same 30 days a year earlier | 57.8% | DERIVED | as of Nov 10, 2026 | DefiLlama |
| LAD-DEX-CAGR-2021-2025 | Spot DEX volume, compound annual growth 2021 to 2025 | 26.3% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-NEAR-CAPTURE-RUNRATE | NEAR value reaching holders, 90-day run rate (gas burned + Intents revenue designated for buybacks) | $21.66M | OBSERVED | as of Nov 10, 2026 | DefiLlama |
| LAD-NEAR-BURN-RUNRATE | NEAR gas burned, 90-day run rate | $1.06M | OBSERVED | as of Nov 10, 2026 | DefiLlama |
| LAD-INTENTS-HOLDER-RUNRATE | Intents revenue designated for NEAR buybacks, 90-day run rate | $20.59M | OBSERVED | as of Nov 10, 2026 | DefiLlama |
| LAD-NEAR-CAPTURE-365D | NEAR value reaching holders, last 365 days | $8.83M | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-HOLDER-TAKE-RATE | Intents revenue designated for buybacks per dollar of volume | 0.042% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-SUPPLY-2036 | NEAR supply in ten years at the current 2.5% maximum issuance | 1.68B NEAR | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-SUPPLY-2036-HSP029 | NEAR supply in ten years if HSP-029 takes effect | 1.55B NEAR | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-MULT-HYPERLIQUID | Valuation multiple: Priced like Hyperliquid (market cap / holders revenue, 90-day run rate) | 19.5x | DERIVED | as of Nov 10, 2026 | CoinGecko and DefiLlama |
| LAD-MULT-HYPERLIQUID-365D | Valuation multiple: Priced like Hyperliquid, trailing 365 days | 25.1x | DERIVED | as of Nov 10, 2026 | CoinGecko and DefiLlama |
| LAD-MULT-TRON | Valuation multiple: Priced like Tron (market cap / holders revenue, 90-day run rate) | 102x | DERIVED | as of Nov 10, 2026 | CoinGecko and DefiLlama |
| LAD-MULT-TRON-365D | Valuation multiple: Priced like Tron, trailing 365 days | 90.3x | DERIVED | as of Nov 10, 2026 | CoinGecko and DefiLlama |
| LAD-MULT-TODAY | Valuation multiple: NEAR's multiple today (market cap / holders revenue, 90-day run rate) | 212x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-MULT-TODAY-365D | Valuation multiple: NEAR's multiple today, trailing 365 days | 521x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-PEER-ETHEREUM-MULT | Ethereum: market cap / holders revenue, 90-day run rate (platform) | 4,008x | DERIVED | as of Nov 10, 2026 | CoinGecko and DefiLlama |
| LAD-PEER-BNB-MULT | BNB: market cap / holders revenue, 90-day run rate (platform) | 4,325x | DERIVED | as of Nov 10, 2026 | CoinGecko and DefiLlama |
| LAD-PEER-SOLANA-MULT | Solana: market cap / holders revenue, 90-day run rate (platform) | 1,632x | DERIVED | as of Nov 10, 2026 | CoinGecko and DefiLlama |
| LAD-PEER-TRON-MULT | Tron: market cap / holders revenue, 90-day run rate (cash-flow) | 102x | DERIVED | as of Nov 10, 2026 | CoinGecko and DefiLlama |
| LAD-PEER-HYPERLIQUID-MULT | Hyperliquid: market cap / holders revenue, 90-day run rate (cash-flow) | 19.5x | DERIVED | as of Nov 10, 2026 | CoinGecko and DefiLlama |
| LAD-10-MCAP | Market cap at $10 in ten years (2.5% issuance) | $16.79B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-10-RANK | $10: rank among today's crypto assets at that market cap (stablecoins excluded) | 9 | DERIVED | as of Nov 10, 2026 | CoinGecko |
| LAD-10-HYPERLIQUID-VOLUME | $10: Intents annual volume needed (Priced like Hyperliquid) | $2.05T | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-10-HYPERLIQUID-DEX-SHARE | $10: Intents volume relative to 2036 spot DEX volume (Priced like Hyperliquid) | 11.5% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-10-HYPERLIQUID-CAGR | $10: Intents growth needed every year for ten years (Priced like Hyperliquid) | 45.2% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-10-TRON-VOLUME | $10: Intents annual volume needed (Priced like Tron) | $387.92B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-10-TRON-DEX-SHARE | $10: Intents volume relative to 2036 spot DEX volume (Priced like Tron) | 2.18% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-10-TRON-CAGR | $10: Intents growth needed every year for ten years (Priced like Tron) | 23.0% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-10-TODAY-VOLUME | $10: Intents annual volume needed (NEAR's multiple today) | $185.83B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-10-TODAY-DEX-SHARE | $10: Intents volume relative to 2036 spot DEX volume (NEAR's multiple today) | 1.04% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-10-TODAY-CAGR | $10: Intents growth needed every year for ten years (NEAR's multiple today) | 14.2% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-10-PLAT-ETHEREUM-STABLES | $10: stablecoins on NEAR at Ethereum's market cap to stablecoins ratio | $8.87B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-10-PLAT-ETHEREUM-TVL | $10: DeFi TVL on NEAR at Ethereum's market cap to TVL ratio | $2.75B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-10-PLAT-ETHEREUM-STABLES-MULT | $10: stablecoins on NEAR needed at Ethereum's ratio, as a multiple of today's | 67.8x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-10-PLAT-ETHEREUM-TVL-MULT | $10: DeFi TVL on NEAR needed at Ethereum's ratio, as a multiple of today's | 16.7x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-10-PLAT-BSC-STABLES | $10: stablecoins on NEAR at BSC's market cap to stablecoins ratio | $2.54B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-10-PLAT-BSC-TVL | $10: DeFi TVL on NEAR at BSC's market cap to TVL ratio | $949.57M | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-10-PLAT-BSC-STABLES-MULT | $10: stablecoins on NEAR needed at BSC's ratio, as a multiple of today's | 19.4x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-10-PLAT-BSC-TVL-MULT | $10: DeFi TVL on NEAR needed at BSC's ratio, as a multiple of today's | 5.75x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-10-PLAT-SOLANA-STABLES | $10: stablecoins on NEAR at Solana's market cap to stablecoins ratio | $4.74B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-10-PLAT-SOLANA-TVL | $10: DeFi TVL on NEAR at Solana's market cap to TVL ratio | $1.72B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-10-PLAT-SOLANA-STABLES-MULT | $10: stablecoins on NEAR needed at Solana's ratio, as a multiple of today's | 36.2x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-10-PLAT-SOLANA-TVL-MULT | $10: DeFi TVL on NEAR needed at Solana's ratio, as a multiple of today's | 10.4x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-10-PLAT-TRON-STABLES | $10: stablecoins on NEAR at Tron's market cap to stablecoins ratio | $52.14B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-10-PLAT-TRON-TVL | $10: DeFi TVL on NEAR at Tron's market cap to TVL ratio | $2.73B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-10-PLAT-TRON-STABLES-MULT | $10: stablecoins on NEAR needed at Tron's ratio, as a multiple of today's | 399x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-10-PLAT-TRON-TVL-MULT | $10: DeFi TVL on NEAR needed at Tron's ratio, as a multiple of today's | 16.5x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-25-MCAP | Market cap at $25 in ten years (2.5% issuance) | $41.97B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-25-RANK | $25: rank among today's crypto assets at that market cap (stablecoins excluded) | 6 | DERIVED | as of Nov 10, 2026 | CoinGecko |
| LAD-25-HYPERLIQUID-VOLUME | $25: Intents annual volume needed (Priced like Hyperliquid) | $5.13T | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-25-HYPERLIQUID-DEX-SHARE | $25: Intents volume relative to 2036 spot DEX volume (Priced like Hyperliquid) | 28.8% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-25-HYPERLIQUID-CAGR | $25: Intents growth needed every year for ten years (Priced like Hyperliquid) | 59.2% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-25-TRON-VOLUME | $25: Intents annual volume needed (Priced like Tron) | $973.59B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-25-TRON-DEX-SHARE | $25: Intents volume relative to 2036 spot DEX volume (Priced like Tron) | 5.46% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-25-TRON-CAGR | $25: Intents growth needed every year for ten years (Priced like Tron) | 34.8% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-25-TODAY-VOLUME | $25: Intents annual volume needed (NEAR's multiple today) | $468.39B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-25-TODAY-DEX-SHARE | $25: Intents volume relative to 2036 spot DEX volume (NEAR's multiple today) | 2.63% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-25-TODAY-CAGR | $25: Intents growth needed every year for ten years (NEAR's multiple today) | 25.3% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-25-PLAT-ETHEREUM-STABLES | $25: stablecoins on NEAR at Ethereum's market cap to stablecoins ratio | $22.16B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-25-PLAT-ETHEREUM-TVL | $25: DeFi TVL on NEAR at Ethereum's market cap to TVL ratio | $6.88B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-25-PLAT-ETHEREUM-STABLES-MULT | $25: stablecoins on NEAR needed at Ethereum's ratio, as a multiple of today's | 169x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-25-PLAT-ETHEREUM-TVL-MULT | $25: DeFi TVL on NEAR needed at Ethereum's ratio, as a multiple of today's | 41.7x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-25-PLAT-BSC-STABLES | $25: stablecoins on NEAR at BSC's market cap to stablecoins ratio | $6.35B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-25-PLAT-BSC-TVL | $25: DeFi TVL on NEAR at BSC's market cap to TVL ratio | $2.37B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-25-PLAT-BSC-STABLES-MULT | $25: stablecoins on NEAR needed at BSC's ratio, as a multiple of today's | 48.5x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-25-PLAT-BSC-TVL-MULT | $25: DeFi TVL on NEAR needed at BSC's ratio, as a multiple of today's | 14.4x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-25-PLAT-SOLANA-STABLES | $25: stablecoins on NEAR at Solana's market cap to stablecoins ratio | $11.84B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-25-PLAT-SOLANA-TVL | $25: DeFi TVL on NEAR at Solana's market cap to TVL ratio | $4.31B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-25-PLAT-SOLANA-STABLES-MULT | $25: stablecoins on NEAR needed at Solana's ratio, as a multiple of today's | 90.5x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-25-PLAT-SOLANA-TVL-MULT | $25: DeFi TVL on NEAR needed at Solana's ratio, as a multiple of today's | 26.1x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-25-PLAT-TRON-STABLES | $25: stablecoins on NEAR at Tron's market cap to stablecoins ratio | $130.36B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-25-PLAT-TRON-TVL | $25: DeFi TVL on NEAR at Tron's market cap to TVL ratio | $6.83B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-25-PLAT-TRON-STABLES-MULT | $25: stablecoins on NEAR needed at Tron's ratio, as a multiple of today's | 996x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-25-PLAT-TRON-TVL-MULT | $25: DeFi TVL on NEAR needed at Tron's ratio, as a multiple of today's | 41.4x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-50-MCAP | Market cap at $50 in ten years (2.5% issuance) | $83.94B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-50-RANK | $50: rank among today's crypto assets at that market cap (stablecoins excluded) | 4 | DERIVED | as of Nov 10, 2026 | CoinGecko |
| LAD-50-HYPERLIQUID-VOLUME | $50: Intents annual volume needed (Priced like Hyperliquid) | $10.26T | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-50-HYPERLIQUID-DEX-SHARE | $50: Intents volume relative to 2036 spot DEX volume (Priced like Hyperliquid) | 57.6% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-50-HYPERLIQUID-CAGR | $50: Intents growth needed every year for ten years (Priced like Hyperliquid) | 70.6% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-50-TRON-VOLUME | $50: Intents annual volume needed (Priced like Tron) | $1.95T | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-50-TRON-DEX-SHARE | $50: Intents volume relative to 2036 spot DEX volume (Priced like Tron) | 10.9% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-50-TRON-CAGR | $50: Intents growth needed every year for ten years (Priced like Tron) | 44.5% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-50-TODAY-VOLUME | $50: Intents annual volume needed (NEAR's multiple today) | $939.30B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-50-TODAY-DEX-SHARE | $50: Intents volume relative to 2036 spot DEX volume (NEAR's multiple today) | 5.27% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-50-TODAY-CAGR | $50: Intents growth needed every year for ten years (NEAR's multiple today) | 34.3% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-50-PLAT-ETHEREUM-STABLES | $50: stablecoins on NEAR at Ethereum's market cap to stablecoins ratio | $44.33B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-50-PLAT-ETHEREUM-TVL | $50: DeFi TVL on NEAR at Ethereum's market cap to TVL ratio | $13.77B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-50-PLAT-ETHEREUM-STABLES-MULT | $50: stablecoins on NEAR needed at Ethereum's ratio, as a multiple of today's | 339x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-50-PLAT-ETHEREUM-TVL-MULT | $50: DeFi TVL on NEAR needed at Ethereum's ratio, as a multiple of today's | 83.4x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-50-PLAT-BSC-STABLES | $50: stablecoins on NEAR at BSC's market cap to stablecoins ratio | $12.70B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-50-PLAT-BSC-TVL | $50: DeFi TVL on NEAR at BSC's market cap to TVL ratio | $4.75B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-50-PLAT-BSC-STABLES-MULT | $50: stablecoins on NEAR needed at BSC's ratio, as a multiple of today's | 97.1x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-50-PLAT-BSC-TVL-MULT | $50: DeFi TVL on NEAR needed at BSC's ratio, as a multiple of today's | 28.8x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-50-PLAT-SOLANA-STABLES | $50: stablecoins on NEAR at Solana's market cap to stablecoins ratio | $23.68B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-50-PLAT-SOLANA-TVL | $50: DeFi TVL on NEAR at Solana's market cap to TVL ratio | $8.62B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-50-PLAT-SOLANA-STABLES-MULT | $50: stablecoins on NEAR needed at Solana's ratio, as a multiple of today's | 181x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-50-PLAT-SOLANA-TVL-MULT | $50: DeFi TVL on NEAR needed at Solana's ratio, as a multiple of today's | 52.2x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-50-PLAT-TRON-STABLES | $50: stablecoins on NEAR at Tron's market cap to stablecoins ratio | $260.72B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-50-PLAT-TRON-TVL | $50: DeFi TVL on NEAR at Tron's market cap to TVL ratio | $13.66B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-50-PLAT-TRON-STABLES-MULT | $50: stablecoins on NEAR needed at Tron's ratio, as a multiple of today's | 1,993x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-50-PLAT-TRON-TVL-MULT | $50: DeFi TVL on NEAR needed at Tron's ratio, as a multiple of today's | 82.7x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-100-MCAP | Market cap at $100 in ten years (2.5% issuance) | $167.88B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-100-RANK | $100: rank among today's crypto assets at that market cap (stablecoins excluded) | 3 | DERIVED | as of Nov 10, 2026 | CoinGecko |
| LAD-100-HYPERLIQUID-VOLUME | $100: Intents annual volume needed (Priced like Hyperliquid) | $20.51T | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-100-HYPERLIQUID-DEX-SHARE | $100: Intents volume relative to 2036 spot DEX volume (Priced like Hyperliquid) | 115.1% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-100-HYPERLIQUID-CAGR | $100: Intents growth needed every year for ten years (Priced like Hyperliquid) | 82.9% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-100-TRON-VOLUME | $100: Intents annual volume needed (Priced like Tron) | $3.90T | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-100-TRON-DEX-SHARE | $100: Intents volume relative to 2036 spot DEX volume (Priced like Tron) | 21.9% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-100-TRON-CAGR | $100: Intents growth needed every year for ten years (Priced like Tron) | 54.9% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-100-TODAY-VOLUME | $100: Intents annual volume needed (NEAR's multiple today) | $1.88T | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-100-TODAY-DEX-SHARE | $100: Intents volume relative to 2036 spot DEX volume (NEAR's multiple today) | 10.6% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-100-TODAY-CAGR | $100: Intents growth needed every year for ten years (NEAR's multiple today) | 44.0% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-100-PLAT-ETHEREUM-STABLES | $100: stablecoins on NEAR at Ethereum's market cap to stablecoins ratio | $88.65B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-100-PLAT-ETHEREUM-TVL | $100: DeFi TVL on NEAR at Ethereum's market cap to TVL ratio | $27.53B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-100-PLAT-ETHEREUM-STABLES-MULT | $100: stablecoins on NEAR needed at Ethereum's ratio, as a multiple of today's | 678x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-100-PLAT-ETHEREUM-TVL-MULT | $100: DeFi TVL on NEAR needed at Ethereum's ratio, as a multiple of today's | 167x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-100-PLAT-BSC-STABLES | $100: stablecoins on NEAR at BSC's market cap to stablecoins ratio | $25.40B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-100-PLAT-BSC-TVL | $100: DeFi TVL on NEAR at BSC's market cap to TVL ratio | $9.50B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-100-PLAT-BSC-STABLES-MULT | $100: stablecoins on NEAR needed at BSC's ratio, as a multiple of today's | 194x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-100-PLAT-BSC-TVL-MULT | $100: DeFi TVL on NEAR needed at BSC's ratio, as a multiple of today's | 57.5x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-100-PLAT-SOLANA-STABLES | $100: stablecoins on NEAR at Solana's market cap to stablecoins ratio | $47.36B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-100-PLAT-SOLANA-TVL | $100: DeFi TVL on NEAR at Solana's market cap to TVL ratio | $17.25B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-100-PLAT-SOLANA-STABLES-MULT | $100: stablecoins on NEAR needed at Solana's ratio, as a multiple of today's | 362x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-100-PLAT-SOLANA-TVL-MULT | $100: DeFi TVL on NEAR needed at Solana's ratio, as a multiple of today's | 104x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-100-PLAT-TRON-STABLES | $100: stablecoins on NEAR at Tron's market cap to stablecoins ratio | $521.44B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-100-PLAT-TRON-TVL | $100: DeFi TVL on NEAR at Tron's market cap to TVL ratio | $27.31B | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-100-PLAT-TRON-STABLES-MULT | $100: stablecoins on NEAR needed at Tron's ratio, as a multiple of today's | 3,985x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-100-PLAT-TRON-TVL-MULT | $100: DeFi TVL on NEAR needed at Tron's ratio, as a multiple of today's | 165x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-IMPLIED-LOW-HYPERLIQUID | Implied 2036 price: low growth, Priced like Hyperliquid | $0.63 | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-IMPLIED-LOW-TRON | Implied 2036 price: low growth, Priced like Tron | $3.33 | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-IMPLIED-LOW-TODAY | Implied 2036 price: low growth, NEAR's multiple today | $6.89 | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-IMPLIED-BASE-HYPERLIQUID | Implied 2036 price: base growth, Priced like Hyperliquid | $1.49 | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-IMPLIED-BASE-TRON | Implied 2036 price: base growth, Priced like Tron | $7.85 | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-IMPLIED-BASE-TODAY | Implied 2036 price: base growth, NEAR's multiple today | $16 | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-IMPLIED-HIGH-HYPERLIQUID | Implied 2036 price: high growth, Priced like Hyperliquid | $6.93 | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-IMPLIED-HIGH-TRON | Implied 2036 price: high growth, Priced like Tron | $36 | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-IMPLIED-HIGH-TODAY | Implied 2036 price: high growth, NEAR's multiple today | $75 | DERIVED | as of Nov 10, 2026 | Computed here |
| TOK-CAPTURED-REPRODUCED | Captured revenue reproduced onchain since 2026-02-23 (inflows to the three revenue wallets) | $7.99M | OBSERVED | Feb 23, 2026 to Nov 11, 2026 | FastNEAR transactions API |
| TOK-REPRODUCTION-RATIO | Reproduced captured revenue / DefiLlama revenue, same dates | 99.1% | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-NON-INTENTS-INFLOWS | Captured "revenue" from accounts other than intents.near since buybacks began | $440.0K | OBSERVED | as of Nov 11, 2026 | FastNEAR transactions API |
| TOK-FRONTEND-RETAINED | Intents revenue swept to the front-end fund since buybacks began (not moved to the buyback wallet) | $2.14M | OBSERVED | as of Nov 11, 2026 | FastNEAR transactions API |
| TOK-EXECUTED-NEAR | NEAR delivered to buybacks.multisignature.near by 1Click swaps since 2026-04-23 | 1.74M NEAR | OBSERVED | Apr 23, 2026 to Nov 11, 2026 | FastNEAR transactions API |
| TOK-EXECUTED-USD | NEAR delivered to the buyback wallet, valued at each day's price | $4.86M | DERIVED | Apr 23, 2026 to Nov 11, 2026 | Computed here |
| TOK-DESIGNATED-SINCE | Revenue DefiLlama designates as buybacks, 2026-02-23 to 2026-11-11 | $8.06M | OBSERVED | Feb 23, 2026 to Nov 11, 2026 | DefiLlama |
| TOK-EXECUTED-VS-DESIGNATED | Delivered directly to the buyback wallet, as a share of designated buybacks (same dates) | 60.2% | DERIVED | Feb 23, 2026 to Nov 11, 2026 | Computed here |
| TOK-AFFILIATED-USD | NEAR moved to the buyback wallet from 1csfundsadmin.sputnik-dao.near, valued at each day's price | $1.18M | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-EXECUTED-BROAD-VS-DESIGNATED | All NEAR that reached the buyback wallet (direct and via the 1Click fund), as a share of designated | 67.1% | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-EXECUTED-RUNRATE | Executed buybacks, 90-day run rate | $13.93M | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-DESIGNATED-RUNRATE | Designated buybacks, 90-day run rate (same days) | $20.75M | DERIVED | as of Nov 11, 2026 | DefiLlama |
| TOK-WALLET-RECONCILE | Buyback wallet balance / NEAR received | 99.6% | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-AVG-PURCHASE-PRICE | Average buyback price | $2.79 | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-BUYBACK-PCT-SUPPLY | Executed buybacks per year as a share of total supply | 0.303% | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-STAKING-RATIO | Share of NEAR supply staked with active validators | 44.4% | DERIVED | as of Nov 11, 2026 | NEAR RPC |
| TOK-GROSS-ISSUANCE | Gross issuance, annualized (net supply growth + burns) | 2.50% | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-STAKING-NOMINAL | Nominal staking yield (before validator commission) | 5.62% | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-STAKING-REAL | Real staking yield after dilution | 3.07% | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-NONSTAKER-REAL | Change in a non-staker's share of supply per year | -2.42% | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-VERIFIED-CAPTURE | Verified value capture per year (NEAR delivered to the buyback wallet + burns) | $14.99M | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-BUYBACK-ABSORPTION | NEAR delivered to the buyback wallet per year, as a share of total supply | 0.303% | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-BTC-CIRC-GROWTH | BTC: circulating supply growth, trailing year | 0.924% | DERIVED | Nov 13, 2025 to Nov 11, 2026 | CoinGecko |
| TOK-BTC-FDV-MCAP | BTC: fully diluted value / market cap (supply still to unlock) | 1.00x | DERIVED | as of Nov 11, 2026 | CoinGecko |
| TOK-BTC-HOLDER-YIELD | BTC: value reaching holders as a share of market cap, 90-day run rate | unavailable | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-BTC-CIRC-GROWTH-EX | BTC: circulating supply growth excluding one-day events | 0.924% | DERIVED | as of Nov 11, 2026 | CoinGecko |
| TOK-BTC-DILUTION-NET | BTC: dilution net of capture, per year | 0.924% | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-ETH-CIRC-GROWTH | ETH: circulating supply growth, trailing year | 0.817% | DERIVED | Nov 13, 2025 to Nov 11, 2026 | CoinGecko |
| TOK-ETH-FDV-MCAP | ETH: fully diluted value / market cap (supply still to unlock) | 1.00x | DERIVED | as of Nov 11, 2026 | CoinGecko |
| TOK-ETH-HOLDER-YIELD | ETH: value reaching holders as a share of market cap, 90-day run rate | 0.025% | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-ETH-CIRC-GROWTH-EX | ETH: circulating supply growth excluding one-day events | 0.817% | DERIVED | as of Nov 11, 2026 | CoinGecko |
| TOK-ETH-DILUTION-NET | ETH: dilution net of capture, per year | 0.817% | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-SOL-CIRC-GROWTH | SOL: circulating supply growth, trailing year | 6.74% | DERIVED | Nov 13, 2025 to Nov 11, 2026 | CoinGecko |
| TOK-SOL-FDV-MCAP | SOL: fully diluted value / market cap (supply still to unlock) | 1.08x | DERIVED | as of Nov 11, 2026 | CoinGecko |
| TOK-SOL-HOLDER-YIELD | SOL: value reaching holders as a share of market cap, 90-day run rate | 0.061% | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-SOL-CIRC-GROWTH-EX | SOL: circulating supply growth excluding one-day events | 1.49% | DERIVED | as of Nov 11, 2026 | CoinGecko |
| TOK-SOL-DILUTION-NET | SOL: dilution net of capture, per year | 1.49% | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-SUI-CIRC-GROWTH | SUI: circulating supply growth, trailing year | 12.5% | DERIVED | Nov 13, 2025 to Nov 11, 2026 | CoinGecko |
| TOK-SUI-FDV-MCAP | SUI: fully diluted value / market cap (supply still to unlock) | 2.42x | DERIVED | as of Nov 11, 2026 | CoinGecko |
| TOK-SUI-HOLDER-YIELD | SUI: value reaching holders as a share of market cap, 90-day run rate | unavailable | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-SUI-CIRC-GROWTH-EX | SUI: circulating supply growth excluding one-day events | 12.5% | DERIVED | as of Nov 11, 2026 | CoinGecko |
| TOK-SUI-DILUTION-NET | SUI: dilution net of capture, per year | 12.5% | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-AVAX-CIRC-GROWTH | AVAX: circulating supply growth, trailing year | 4.38% | DERIVED | Nov 13, 2025 to Nov 11, 2026 | CoinGecko |
| TOK-AVAX-FDV-MCAP | AVAX: fully diluted value / market cap (supply still to unlock) | 1.06x | DERIVED | as of Nov 11, 2026 | CoinGecko |
| TOK-AVAX-HOLDER-YIELD | AVAX: value reaching holders as a share of market cap, 90-day run rate | 0.096% | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-AVAX-CIRC-GROWTH-EX | AVAX: circulating supply growth excluding one-day events | 4.38% | DERIVED | as of Nov 11, 2026 | CoinGecko |
| TOK-AVAX-DILUTION-NET | AVAX: dilution net of capture, per year | 4.38% | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-TON-CIRC-GROWTH | TON: circulating supply growth, trailing year | 14.8% | DERIVED | Nov 13, 2025 to Nov 11, 2026 | CoinGecko |
| TOK-TON-FDV-MCAP | TON: fully diluted value / market cap (supply still to unlock) | 1.85x | DERIVED | as of Nov 11, 2026 | CoinGecko |
| TOK-TON-HOLDER-YIELD | TON: value reaching holders as a share of market cap, 90-day run rate | 0.013% | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-TON-CIRC-GROWTH-EX | TON: circulating supply growth excluding one-day events | 14.8% | DERIVED | as of Nov 11, 2026 | CoinGecko |
| TOK-TON-DILUTION-NET | TON: dilution net of capture, per year | 14.8% | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-APT-CIRC-GROWTH | APT: circulating supply growth, trailing year | 22.6% | DERIVED | Nov 13, 2025 to Nov 11, 2026 | CoinGecko |
| TOK-APT-FDV-MCAP | APT: fully diluted value / market cap (supply still to unlock) | 1.37x | DERIVED | as of Nov 11, 2026 | CoinGecko |
| TOK-APT-HOLDER-YIELD | APT: value reaching holders as a share of market cap, 90-day run rate | 0.287% | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-APT-CIRC-GROWTH-EX | APT: circulating supply growth excluding one-day events | 22.6% | DERIVED | as of Nov 11, 2026 | CoinGecko |
| TOK-APT-DILUTION-NET | APT: dilution net of capture, per year | 22.6% | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-HYPE-CIRC-GROWTH | HYPE: circulating supply growth, trailing year | -11.6% | DERIVED | Nov 13, 2025 to Nov 11, 2026 | CoinGecko |
| TOK-HYPE-FDV-MCAP | HYPE: fully diluted value / market cap (supply still to unlock) | 3.97x | DERIVED | as of Nov 11, 2026 | CoinGecko |
| TOK-HYPE-HOLDER-YIELD | HYPE: value reaching holders as a share of market cap, 90-day run rate | 5.12% | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-HYPE-CIRC-GROWTH-EX | HYPE: circulating supply growth excluding one-day events | 0.242% | DERIVED | as of Nov 11, 2026 | CoinGecko |
| TOK-HYPE-DILUTION-NET | HYPE: dilution net of capture, per year | 0.242% | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-NEAR-CIRC-GROWTH | NEAR: circulating supply growth, trailing year | 2.47% | DERIVED | Nov 13, 2025 to Nov 11, 2026 | CoinGecko |
| TOK-NEAR-FDV-MCAP | NEAR: fully diluted value / market cap (supply still to unlock) | 1.00x | DERIVED | as of Nov 11, 2026 | CoinGecko |
| TOK-NEAR-HOLDER-YIELD | NEAR: value reaching holders as a share of market cap, 90-day run rate | 0.474% | DERIVED | as of Nov 11, 2026 | Computed here |
| TOK-NEAR-CIRC-GROWTH-EX | NEAR: circulating supply growth excluding one-day events | 2.47% | DERIVED | as of Nov 11, 2026 | CoinGecko |
| TOK-NEAR-DILUTION-NET | NEAR: dilution net of capture, per year | 2.16% | DERIVED | as of Nov 11, 2026 | Computed here |
| LAD-BASIS-DESIGNATED-MULT | NEAR's own multiple, designated basis (market cap / (burns + designated buybacks), 90-day run rate) | 212x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-DESIGNATED-TAKE | Buyback revenue per dollar of Intents volume, designated basis | 0.042% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-DESIGNATED-10-HYPERLIQUID-SHARE | $10, designated basis, priced like hyperliquid: Intents volume relative to 2036 spot DEX volume | 11.5% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-DESIGNATED-10-TRON-SHARE | $10, designated basis, priced like tron: Intents volume relative to 2036 spot DEX volume | 2.18% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-DESIGNATED-10-TODAY-SHARE | $10, designated basis, NEAR's own multiple: Intents volume relative to 2036 spot DEX volume | 1.04% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-DESIGNATED-25-HYPERLIQUID-SHARE | $25, designated basis, priced like hyperliquid: Intents volume relative to 2036 spot DEX volume | 28.8% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-DESIGNATED-25-TRON-SHARE | $25, designated basis, priced like tron: Intents volume relative to 2036 spot DEX volume | 5.46% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-DESIGNATED-25-TODAY-SHARE | $25, designated basis, NEAR's own multiple: Intents volume relative to 2036 spot DEX volume | 2.63% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-DESIGNATED-50-HYPERLIQUID-SHARE | $50, designated basis, priced like hyperliquid: Intents volume relative to 2036 spot DEX volume | 57.6% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-DESIGNATED-50-TRON-SHARE | $50, designated basis, priced like tron: Intents volume relative to 2036 spot DEX volume | 10.9% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-DESIGNATED-50-TODAY-SHARE | $50, designated basis, NEAR's own multiple: Intents volume relative to 2036 spot DEX volume | 5.27% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-DESIGNATED-100-HYPERLIQUID-SHARE | $100, designated basis, priced like hyperliquid: Intents volume relative to 2036 spot DEX volume | 115.1% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-DESIGNATED-100-TRON-SHARE | $100, designated basis, priced like tron: Intents volume relative to 2036 spot DEX volume | 21.9% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-DESIGNATED-100-TODAY-SHARE | $100, designated basis, NEAR's own multiple: Intents volume relative to 2036 spot DEX volume | 10.6% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-DESIGNATED-IMPLIED-HYPERLIQUID | Implied 2036 price at 20% growth, designated basis, priced like hyperliquid | $1.49 | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-DESIGNATED-IMPLIED-TRON | Implied 2036 price at 20% growth, designated basis, priced like tron | $7.85 | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-DESIGNATED-IMPLIED-TODAY | Implied 2036 price at 20% growth, designated basis, NEAR's own multiple | $16 | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-EXECUTED-MULT | NEAR's own multiple, executed basis (market cap / (burns + executed buybacks), 90-day run rate) | 309x | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-EXECUTED-TAKE | Buyback revenue per dollar of Intents volume, executed basis | 0.028% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-EXECUTED-10-HYPERLIQUID-SHARE | $10, executed basis, priced like hyperliquid: Intents volume relative to 2036 spot DEX volume | 17.1% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-EXECUTED-10-TRON-SHARE | $10, executed basis, priced like tron: Intents volume relative to 2036 spot DEX volume | 3.25% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-EXECUTED-10-TODAY-SHARE | $10, executed basis, NEAR's own multiple: Intents volume relative to 2036 spot DEX volume | 1.06% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-EXECUTED-25-HYPERLIQUID-SHARE | $25, executed basis, priced like hyperliquid: Intents volume relative to 2036 spot DEX volume | 42.9% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-EXECUTED-25-TRON-SHARE | $25, executed basis, priced like tron: Intents volume relative to 2036 spot DEX volume | 8.14% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-EXECUTED-25-TODAY-SHARE | $25, executed basis, NEAR's own multiple: Intents volume relative to 2036 spot DEX volume | 2.69% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-EXECUTED-50-HYPERLIQUID-SHARE | $50, executed basis, priced like hyperliquid: Intents volume relative to 2036 spot DEX volume | 85.8% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-EXECUTED-50-TRON-SHARE | $50, executed basis, priced like tron: Intents volume relative to 2036 spot DEX volume | 16.3% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-EXECUTED-50-TODAY-SHARE | $50, executed basis, NEAR's own multiple: Intents volume relative to 2036 spot DEX volume | 5.39% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-EXECUTED-100-HYPERLIQUID-SHARE | $100, executed basis, priced like hyperliquid: Intents volume relative to 2036 spot DEX volume | 171.6% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-EXECUTED-100-TRON-SHARE | $100, executed basis, priced like tron: Intents volume relative to 2036 spot DEX volume | 32.6% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-EXECUTED-100-TODAY-SHARE | $100, executed basis, NEAR's own multiple: Intents volume relative to 2036 spot DEX volume | 10.8% | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-EXECUTED-IMPLIED-HYPERLIQUID | Implied 2036 price at 20% growth, executed basis, priced like hyperliquid | $1.01 | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-EXECUTED-IMPLIED-TRON | Implied 2036 price at 20% growth, executed basis, priced like tron | $5.29 | DERIVED | as of Nov 10, 2026 | Computed here |
| LAD-BASIS-EXECUTED-IMPLIED-TODAY | Implied 2036 price at 20% growth, executed basis, NEAR's own multiple | $16 | DERIVED | as of Nov 10, 2026 | Computed here |
| VAL-MULT-HIST-NEAR | NEAR: market cap / value to holders, latest month-end (Burns + designated buybacks (DefiLlama), windows after 23 February 2026 only) | 219x | DERIVED | May 1, 2026 to Nov 1, 2026 | Computed here |
| VAL-MULT-HIST-NEAR-EXEC | NEAR: market cap / value to holders, latest month-end (Burns + NEAR delivered to the buyback wallet (onchain), windows after the first delivery only) | 319x | DERIVED | Jul 1, 2026 to Nov 1, 2026 | Computed here |
| VAL-MULT-HIST-ETH | ETH: market cap / value to holders, latest month-end (DefiLlama holders revenue) | 4,168x | DERIVED | Dec 1, 2025 to Nov 1, 2026 | Computed here |
| VAL-MULT-HIST-SOL | SOL: market cap / value to holders, latest month-end (DefiLlama holders revenue) | 1,702x | DERIVED | Dec 1, 2025 to Nov 1, 2026 | Computed here |
| VAL-MULT-HIST-SUI | SUI: market cap / value to holders, latest month-end (DefiLlama holders revenue) | 7,378x | DERIVED | Dec 1, 2025 to Oct 1, 2026 | Computed here |
| VAL-MULT-HIST-AVAX | AVAX: market cap / value to holders, latest month-end (DefiLlama holders revenue) | 1,056x | DERIVED | Dec 1, 2025 to Nov 1, 2026 | Computed here |
| VAL-MULT-HIST-TON | TON: market cap / value to holders, latest month-end (DefiLlama holders revenue) | 6,569x | DERIVED | Dec 1, 2025 to Nov 1, 2026 | Computed here |
| VAL-MULT-HIST-APT | APT: market cap / value to holders, latest month-end (DefiLlama holders revenue) | 369x | DERIVED | Jul 1, 2026 to Nov 1, 2026 | Computed here |
| VAL-MULT-HIST-HYPE | HYPE: market cap / value to holders, latest month-end (DefiLlama holders revenue) | 20.5x | DERIVED | Dec 1, 2025 to Nov 1, 2026 | Computed here |
| VAL-SENS-BASE | NEAR implied 2036 price, base case (20% Intents growth, NEAR's own multiple) | $16 | DERIVED | as of Nov 10, 2026 | Computed here |
| VAL-SENS-INTENTS-GROWTH-YEARS | Sensitivity: Intents growth, 10 years (10% a year to 30% a year), high / low implied price | 5.23x | DERIVED | as of Nov 10, 2026 | Computed here |
| VAL-SENS-VALUATION-MULTIPLE | Sensitivity: Valuation multiple (0.5x today's to 1.5x today's), high / low implied price | 3.00x | DERIVED | as of Nov 10, 2026 | Computed here |
| VAL-SENS-BUYBACK-REVENUE-PER-DOLLAR-OF-VOLUME | Sensitivity: Buyback revenue per dollar of volume (0.5x today's to 1.5x today's), high / low implied price | 2.97x | DERIVED | as of Nov 10, 2026 | Computed here |
| VAL-SENS-SUPPLY-RULE | Sensitivity: Supply rule (2.5% issuance (base) to HSP-029), high / low implied price | 1.08x | DERIVED | as of Nov 10, 2026 | Computed here |
| VAL-SENS-GAS-BURNS | Sensitivity: Gas burns (0x today's to 5x today's), high / low implied price | 1.04x | DERIVED | as of Nov 10, 2026 | Computed here |
| VAL-MULT-NEEDED-10-LOW | Cash-flow multiple $10 would need at low Intents growth | 308x | DERIVED | as of Nov 10, 2026 | Computed here |
| VAL-MULT-NEEDED-10-BASE | Cash-flow multiple $10 would need at base Intents growth | 131x | DERIVED | as of Nov 10, 2026 | Computed here |
| VAL-MULT-NEEDED-10-HIGH | Cash-flow multiple $10 would need at high Intents growth | 28.1x | DERIVED | as of Nov 10, 2026 | Computed here |
| VAL-MULT-NEEDED-25-LOW | Cash-flow multiple $25 would need at low Intents growth | 770x | DERIVED | as of Nov 10, 2026 | Computed here |
| VAL-MULT-NEEDED-25-BASE | Cash-flow multiple $25 would need at base Intents growth | 326x | DERIVED | as of Nov 10, 2026 | Computed here |
| VAL-MULT-NEEDED-25-HIGH | Cash-flow multiple $25 would need at high Intents growth | 70.3x | DERIVED | as of Nov 10, 2026 | Computed here |
| VAL-MULT-NEEDED-50-LOW | Cash-flow multiple $50 would need at low Intents growth | 1,541x | DERIVED | as of Nov 10, 2026 | Computed here |
| VAL-MULT-NEEDED-50-BASE | Cash-flow multiple $50 would need at base Intents growth | 653x | DERIVED | as of Nov 10, 2026 | Computed here |
| VAL-MULT-NEEDED-50-HIGH | Cash-flow multiple $50 would need at high Intents growth | 141x | DERIVED | as of Nov 10, 2026 | Computed here |
| VAL-MULT-NEEDED-100-LOW | Cash-flow multiple $100 would need at low Intents growth | 3,082x | DERIVED | as of Nov 10, 2026 | Computed here |
| VAL-MULT-NEEDED-100-BASE | Cash-flow multiple $100 would need at base Intents growth | 1,306x | DERIVED | as of Nov 10, 2026 | Computed here |
| VAL-MULT-NEEDED-100-HIGH | Cash-flow multiple $100 would need at high Intents growth | 281x | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-BTC-OBSERVED | BTC: observed growth of its valuation driver, last year | unavailable | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-BTC-2_8X-CAGR | BTC: driver growth needed every year for 2.8x in ten years | unavailable | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-BTC-7X-CAGR | BTC: driver growth needed every year for 7x in ten years | unavailable | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-BTC-14X-CAGR | BTC: driver growth needed every year for 14x in ten years | unavailable | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-BTC-28X-CAGR | BTC: driver growth needed every year for 28x in ten years | unavailable | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-BTC-VOL-1Y | BTC: annualized volatility, last year | 39.8% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-BTC-VOL-3Y | BTC: annualized volatility, last three years | 47.8% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-BTC-MAXDD-3Y | BTC: maximum drawdown, last three years | -53.1% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-BTC-FROM-PEAK | BTC: price today vs its three-year peak | -40.7% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-BTC-CORR-BTC | BTC: correlation of daily returns with BTC, last year | 1.00x | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-BTC-LIQUIDITY | BTC: 24-hour trading volume / market cap | 1.53% | DERIVED | as of Nov 10, 2026 | CoinGecko |
| OPP-ETH-OBSERVED | ETH: observed growth of its valuation driver, last year | -31.1% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-ETH-2_8X-CAGR | ETH: driver growth needed every year for 2.8x in ten years | 11.8% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-ETH-7X-CAGR | ETH: driver growth needed every year for 7x in ten years | 22.5% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-ETH-14X-CAGR | ETH: driver growth needed every year for 14x in ten years | 31.3% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-ETH-28X-CAGR | ETH: driver growth needed every year for 28x in ten years | 40.7% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-ETH-VOL-1Y | ETH: annualized volatility, last year | 58.0% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-ETH-VOL-3Y | ETH: annualized volatility, last three years | 71.0% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-ETH-MAXDD-3Y | ETH: maximum drawdown, last three years | -67.5% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-ETH-FROM-PEAK | ETH: price today vs its three-year peak | -57.4% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-ETH-CORR-BTC | ETH: correlation of daily returns with BTC, last year | 0.87x | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-ETH-LIQUIDITY | ETH: 24-hour trading volume / market cap | 3.36% | DERIVED | as of Nov 10, 2026 | CoinGecko |
| OPP-SOL-OBSERVED | SOL: observed growth of its valuation driver, last year | -24.4% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-SOL-2_8X-CAGR | SOL: driver growth needed every year for 2.8x in ten years | 12.5% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-SOL-7X-CAGR | SOL: driver growth needed every year for 7x in ten years | 23.3% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-SOL-14X-CAGR | SOL: driver growth needed every year for 14x in ten years | 32.1% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-SOL-28X-CAGR | SOL: driver growth needed every year for 28x in ten years | 41.6% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-SOL-VOL-1Y | SOL: annualized volatility, last year | 63.6% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-SOL-VOL-3Y | SOL: annualized volatility, last three years | 86.7% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-SOL-MAXDD-3Y | SOL: maximum drawdown, last three years | -75.8% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-SOL-FROM-PEAK | SOL: price today vs its three-year peak | -67.6% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-SOL-CORR-BTC | SOL: correlation of daily returns with BTC, last year | 0.75x | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-SOL-LIQUIDITY | SOL: 24-hour trading volume / market cap | 3.91% | DERIVED | as of Nov 10, 2026 | CoinGecko |
| OPP-SUI-OBSERVED | SUI: observed growth of its valuation driver, last year | -43.5% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-SUI-2_8X-CAGR | SUI: driver growth needed every year for 2.8x in ten years | 24.7% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-SUI-7X-CAGR | SUI: driver growth needed every year for 7x in ten years | 36.6% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-SUI-14X-CAGR | SUI: driver growth needed every year for 14x in ten years | 46.4% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-SUI-28X-CAGR | SUI: driver growth needed every year for 28x in ten years | 57.0% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-SUI-VOL-1Y | SUI: annualized volatility, last year | 91.4% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-SUI-VOL-3Y | SUI: annualized volatility, last three years | 115.2% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-SUI-MAXDD-3Y | SUI: maximum drawdown, last three years | -87.7% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-SUI-FROM-PEAK | SUI: price today vs its three-year peak | -84.5% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-SUI-CORR-BTC | SUI: correlation of daily returns with BTC, last year | 0.61x | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-SUI-LIQUIDITY | SUI: 24-hour trading volume / market cap | 7.47% | DERIVED | as of Nov 10, 2026 | CoinGecko |
| OPP-AVAX-OBSERVED | AVAX: observed growth of its valuation driver, last year | -54.0% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-AVAX-2_8X-CAGR | AVAX: driver growth needed every year for 2.8x in ten years | 15.7% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-AVAX-7X-CAGR | AVAX: driver growth needed every year for 7x in ten years | 26.8% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-AVAX-14X-CAGR | AVAX: driver growth needed every year for 14x in ten years | 35.9% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-AVAX-28X-CAGR | AVAX: driver growth needed every year for 28x in ten years | 45.7% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-AVAX-VOL-1Y | AVAX: annualized volatility, last year | 74.0% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-AVAX-VOL-3Y | AVAX: annualized volatility, last three years | 93.8% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-AVAX-MAXDD-3Y | AVAX: maximum drawdown, last three years | -90.2% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-AVAX-FROM-PEAK | AVAX: price today vs its three-year peak | -85.9% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-AVAX-CORR-BTC | AVAX: correlation of daily returns with BTC, last year | 0.56x | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-AVAX-LIQUIDITY | AVAX: 24-hour trading volume / market cap | 6.06% | DERIVED | as of Nov 10, 2026 | CoinGecko |
| OPP-TON-OBSERVED | TON: observed growth of its valuation driver, last year | -45.5% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-TON-2_8X-CAGR | TON: driver growth needed every year for 2.8x in ten years | 27.3% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-TON-7X-CAGR | TON: driver growth needed every year for 7x in ten years | 39.5% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-TON-14X-CAGR | TON: driver growth needed every year for 14x in ten years | 49.5% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-TON-28X-CAGR | TON: driver growth needed every year for 28x in ten years | 60.2% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-TON-VOL-1Y | TON: annualized volatility, last year | 82.6% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-TON-VOL-3Y | TON: annualized volatility, last three years | 81.9% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-TON-MAXDD-3Y | TON: maximum drawdown, last three years | -87.5% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-TON-FROM-PEAK | TON: price today vs its three-year peak | -85.7% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-TON-CORR-BTC | TON: correlation of daily returns with BTC, last year | 0.40x | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-TON-LIQUIDITY | TON: 24-hour trading volume / market cap | 4.08% | DERIVED | as of Nov 10, 2026 | CoinGecko |
| OPP-APT-OBSERVED | APT: observed growth of its valuation driver, last year | -47.2% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-APT-2_8X-CAGR | APT: driver growth needed every year for 2.8x in ten years | 35.9% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-APT-7X-CAGR | APT: driver growth needed every year for 7x in ten years | 49.0% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-APT-14X-CAGR | APT: driver growth needed every year for 14x in ten years | 59.7% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-APT-28X-CAGR | APT: driver growth needed every year for 28x in ten years | 71.1% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-APT-VOL-1Y | APT: annualized volatility, last year | 96.2% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-APT-VOL-3Y | APT: annualized volatility, last three years | 98.4% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-APT-MAXDD-3Y | APT: maximum drawdown, last three years | -97.1% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-APT-FROM-PEAK | APT: price today vs its three-year peak | -96.9% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-APT-CORR-BTC | APT: correlation of daily returns with BTC, last year | 0.45x | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-APT-LIQUIDITY | APT: 24-hour trading volume / market cap | 5.08% | DERIVED | as of Nov 10, 2026 | CoinGecko |
| OPP-HYPE-OBSERVED | HYPE: observed growth of its valuation driver, last year | -24.5% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-HYPE-2_8X-CAGR | HYPE: driver growth needed every year for 2.8x in ten years | 11.1% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-HYPE-7X-CAGR | HYPE: driver growth needed every year for 7x in ten years | 21.8% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-HYPE-14X-CAGR | HYPE: driver growth needed every year for 14x in ten years | 30.5% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-HYPE-28X-CAGR | HYPE: driver growth needed every year for 28x in ten years | 39.9% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-HYPE-VOL-1Y | HYPE: annualized volatility, last year | 88.1% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-HYPE-VOL-3Y | HYPE: annualized volatility, last three years | 114.6% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-HYPE-MAXDD-3Y | HYPE: maximum drawdown, last three years | -64.3% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-HYPE-FROM-PEAK | HYPE: price today vs its three-year peak | -25.9% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-HYPE-CORR-BTC | HYPE: correlation of daily returns with BTC, last year | 0.39x | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-HYPE-LIQUIDITY | HYPE: 24-hour trading volume / market cap | 4.71% | DERIVED | as of Nov 10, 2026 | CoinGecko |
| OPP-NEAR-OBSERVED | NEAR: observed growth of its valuation driver, last year | 230.1% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-NEAR-2_8X-CAGR | NEAR: driver growth needed every year for 2.8x in ten years | 13.2% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-NEAR-7X-CAGR | NEAR: driver growth needed every year for 7x in ten years | 24.1% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-NEAR-14X-CAGR | NEAR: driver growth needed every year for 14x in ten years | 33.0% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-NEAR-28X-CAGR | NEAR: driver growth needed every year for 28x in ten years | 42.6% | DERIVED | as of Nov 10, 2026 | Computed here |
| OPP-NEAR-VOL-1Y | NEAR: annualized volatility, last year | 115.7% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-NEAR-VOL-3Y | NEAR: annualized volatility, last three years | 113.4% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-NEAR-MAXDD-3Y | NEAR: maximum drawdown, last three years | -89.2% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-NEAR-FROM-PEAK | NEAR: price today vs its three-year peak | -59.5% | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-NEAR-CORR-BTC | NEAR: correlation of daily returns with BTC, last year | 0.45x | DERIVED | as of Nov 10, 2026 | DefiLlama prices |
| OPP-NEAR-LIQUIDITY | NEAR: 24-hour trading volume / market cap | 10.6% | DERIVED | as of Nov 10, 2026 | CoinGecko |
| ECO-INTENTS-FEE-SHARE | NEAR Intents share of all fees on the NEAR chain, last 30 days | 86.2% | DERIVED | as of Nov 10, 2026 | DefiLlama |
| ECO-CAPTURE-FROM-INTENTS | Share of verified value capture from Intents buybacks (H1) | 92.9% | DERIVED | as of Nov 10, 2026 | Computed here |
| ECO-L1-TXNS-YOY | NEAR L1 transactions, 90 days vs a year earlier | -84.0% | DERIVED | as of Nov 10, 2026 | NearBlocks |
| ECO-L1-ACTIVE-YOY | NEAR L1 daily active accounts, 90 days vs a year earlier | -75.3% | DERIVED | as of Nov 10, 2026 | NearBlocks |
| ECO-L1-GAS-YOY | NEAR L1 gas fees, 90 days vs a year earlier | -52.0% | DERIVED | as of Nov 10, 2026 | DefiLlama |
| ECO-INTENTS-VOL-YOY | NEAR Intents volume, 90 days vs a year earlier | 230.1% | DERIVED | as of Nov 10, 2026 | DefiLlama |
| ECO-SIGNER-PARTICIPANTS | Chain Signatures MPC participants (v1.signer) | 16 | OBSERVED | as of Nov 10, 2026 | NEAR RPC |
| RISK-VALIDATOR-NAKAMOTO | Validators needed to control a third of NEAR stake | 9 | DERIVED | as of Nov 10, 2026 | NEAR RPC |
| CC-INTENTS-VENUE-SHARE | NEAR Intents share of volume among cross-chain swap venues with public volume | 58.1% | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-PEER-MEDIAN-CAP-REV | Median market cap / protocol revenue, cross-chain execution tokens | 7.55x | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-PEER-MEDIAN-CAP-REV-LIQUID | Median market cap / protocol revenue, cross-chain execution tokens of at least $25M | 13.5x | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-PEER-MEDIAN-CAP-HOLDERS | Median market cap / holders revenue, cross-chain execution tokens | 17.0x | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-NEAR-CAP-INTENTS-REV | NEAR market cap / Intents protocol revenue | 223x | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-NEAR-IMPLIED-CAP | Conditional: market cap attributable to Intents revenue alone at the cross-chain peer median multiple | $155.45M | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-NEAR-IMPLIED-PRICE | Conditional: per-token value of Intents revenue alone at the peer median multiple (not a fair value of NEAR) | $0.12 | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-NEAR-INTENTS-REVENUE | NEAR Intents: protocol revenue, 90-day run rate | $20.59M | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-NEAR-INTENTS-VOLUME | NEAR Intents: volume, 90-day run rate | $49.08B | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-NEAR-INTENTS-TAKE-RATE | NEAR Intents: protocol revenue per dollar of volume | 0.042% | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-THORCHAIN-REVENUE | THORChain: protocol revenue, 90-day run rate | $8.87M | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-THORCHAIN-VOLUME | THORChain: volume, 90-day run rate | $25.18B | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-THORCHAIN-TAKE-RATE | THORChain: protocol revenue per dollar of volume | 0.035% | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-CHAINFLIP-REVENUE | Chainflip: protocol revenue, 90-day run rate | $4.54M | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-CHAINFLIP-VOLUME | Chainflip: volume, 90-day run rate | $7.88B | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-CHAINFLIP-TAKE-RATE | Chainflip: protocol revenue per dollar of volume | 0.058% | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-MAYA-PROTOCOL-REVENUE | Maya Protocol: protocol revenue, 90-day run rate | $295.2K | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-MAYA-PROTOCOL-VOLUME | Maya Protocol: volume, 90-day run rate | $2.35B | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-MAYA-PROTOCOL-TAKE-RATE | Maya Protocol: protocol revenue per dollar of volume | 0.013% | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-UNIT-REVENUE | Unit: protocol revenue, 90-day run rate | $6.09M | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-UNIT-VOLUME | Unit: volume, 90-day run rate | $23.99B | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-UNIT-TAKE-RATE | Unit: protocol revenue per dollar of volume | 0.025% | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-RELAY-REVENUE | Relay: protocol revenue, 90-day run rate | $17.61M | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-DEBRIDGE-DLN-REVENUE | deBridge (DLN): protocol revenue, 90-day run rate | $6.39M | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-MAYAN-REVENUE | Mayan: protocol revenue, 90-day run rate | $7.81M | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-ACROSS-REVENUE | Across: protocol revenue, 90-day run rate | $0 | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-STARGATE-REVENUE | Stargate: protocol revenue, 90-day run rate | $4.06M | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-SYMBIOSIS-REVENUE | Symbiosis: protocol revenue, 90-day run rate | $1.17M | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-LI-FI-REVENUE | LI.FI: protocol revenue, 90-day run rate | $3.02M | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-LI-FI-VOLUME | LI.FI: volume, 90-day run rate | $16.23B | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-LI-FI-TAKE-RATE | LI.FI: protocol revenue per dollar of volume | 0.019% | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-RANGO-REVENUE | Rango: protocol revenue, 90-day run rate | unavailable | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-RANGO-VOLUME | Rango: volume, 90-day run rate | $3.79B | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-LAYERZERO-REVENUE | LayerZero: protocol revenue, 90-day run rate | $775.0K | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-WORMHOLE-REVENUE | Wormhole: protocol revenue, 90-day run rate | $0 | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| CC-AXELAR-REVENUE | Axelar: protocol revenue, 90-day run rate | $0 | DERIVED | as of Nov 10, 2026 | DefiLlama and CoinGecko |
| MKT-SPOT-TRAILING | Spot DEX volume (DefiLlama "Dexs" category), last 365 days | $2.90T | DERIVED | as of Nov 10, 2026 | DefiLlama |
| MKT-SPOT-CAGR | Spot DEX volume (DefiLlama "Dexs" category), compound annual growth 2021 to 2025 | 26.3% | DERIVED | as of Nov 10, 2026 | DefiLlama |
| MKT-CROSSCHAIN-TRAILING | Cross-chain swap volume (DefiLlama bridge categories in its DEX overview), last 365 days | $42.28B | DERIVED | as of Nov 10, 2026 | DefiLlama |
| MKT-CROSSCHAIN-CAGR | Cross-chain swap volume (DefiLlama bridge categories in its DEX overview), compound annual growth n/a to 2025 | unavailable | DERIVED | as of Nov 10, 2026 | DefiLlama |
| MKT-AGGREGATORS-TRAILING | Bridge-aggregator volume, last 365 days | $31.91B | DERIVED | as of Nov 10, 2026 | DefiLlama |
| MKT-AGGREGATORS-CAGR | Bridge-aggregator volume, compound annual growth n/a to 2025 | unavailable | DERIVED | as of Nov 10, 2026 | DefiLlama |
| MKT-STABLECOINS-TRAILING | Stablecoin supply, year end (USD-pegged), latest | $289.90B | DERIVED | as of Nov 10, 2026 | DefiLlama |
| MKT-STABLECOINS-CAGR | Stablecoin supply, year end (USD-pegged), compound annual growth 2021 to 2025 | 17.0% | DERIVED | as of Nov 10, 2026 | DefiLlama |
| MKT-X402-TRAILING | AI-agent payments (x402), last 365 days | $43.58M | DERIVED | as of Nov 10, 2026 | DefiLlama |
| MKT-X402-CAGR | AI-agent payments (x402), compound annual growth n/a to 2025 | unavailable | DERIVED | as of Nov 10, 2026 | DefiLlama |
| MKT-SPOT-TOP5 | Share of spot DEX volume handled by the five largest protocol families, last year | 52.1% | DERIVED | as of Nov 10, 2026 | DefiLlama |
| HYP-H1 | H1: NEAR's fee base is far more concentrated in one product than peers' (restated from "value capture": comparable value-capture data by product does not exist for peers) | text | DERIVED | point in time | Computed here |
| HYP-H2 | H2: NEAR's market cap is high relative to its on-chain economy compared with platforms (an observed valuation gap, not a judgement that it is unjustified) | text | DERIVED | point in time | Computed here |
| HYP-H3 | H3: Intents' take rate is above cross-chain peers, so fee pressure matters more than volume | text | DERIVED | point in time | Computed here |
| HYP-H4 | H4: Cross-chain activity and NEAR L1 activity are moving in opposite directions (diverging trends; migration of value is not proven) | text | DERIVED | point in time | Computed here |
| HYP-H5 | H5: NEAR's dilution is a higher return hurdle than peers' | text | DERIVED | point in time | Computed here |
| HYP-H6 | H6: NEAR needs more growth than some alternatives to deliver the same multiple | text | DERIVED | point in time | Computed here |
| HYP-H7 | H7: Most of NEAR's reported activity is automated rather than organic | text | DERIVED | point in time | Computed here |
| HYP-H8 | H8: Intents revenue depends on a few integrators or solvers | text | DERIVED | point in time | Computed here |
| HYP-H9 | H9: Chain Signatures underpins Intents' cross-chain withdrawals, so its value is real but invisible in token capture | text | DERIVED | point in time | Computed here |
| HYP-H10 | H10: NEAR's price is mostly explained by BTC and the market, not its fundamentals | text | DERIVED | point in time | Computed here |
