# Three Digits, Minimum? Research summary for review

> **Superseded in part.** After this summary was reviewed, a correction pass changed the buyback accounting, the revenue basis of the multiples, H1/H2/H4/H5 wording and the verdict lines. See `AUDIT-LOG.md` for every change and `THESIS.md` for current figures. In particular, the "-$98.3M net value to holders" figure in section 3.4 was removed, and the 60% and 75% executed shares are replaced by the reconciliation in the audit log (67.1% of designated revenue reached the buyback wallet, valued at capture).

A summary of everything done under the approved scope (`research/three-digits/SCOPE.md`, revision 3.1), written for an independent reviewer. The full generated thesis is `THESIS.md`; every number there and here comes from code run on stored API responses (`artifacts/research/raw/`, each with a SHA-256), and `npm run research:rebuild` reproduces it byte for byte offline.

**Data snapshot:** flow windows end 10 November 2026 (90-day run rates unless stated). NEAR price $3.51, market cap $4.60B.

**What I would like the reviewer to check:** the methodology choices flagged in section 4, the findings in section 3 (especially 3.4 and 3.5, which carry the verdict), and whether any conclusion favours or penalises NEAR more than the data supports.

---

## 1. What was done

| Step | Commit | What |
|---|---|---|
| Methodology fixes | `b53b700` | One basis for every valuation multiple; spot-only DEX denominator; platform framework separated from the cash-flow ladder; burns kept apart from Intents; swing wording; exploit status re-verified |
| Discovery | `c5798a3` | Inventory of data, coverage and lineage for the whole comparison universe (`research/three-digits/DISCOVERY.md`) |
| W4 Token economics | `e1021c0` | Value-capture taxonomy; executed buybacks reconstructed onchain; staking yields; dilution for all alternatives |
| W5 Valuation, W6 Opportunity cost | `3394b84` | Multiples over time; sensitivity; multiple needed per rung; required vs observed growth for every alternative; risk metrics |
| W3 Economy map | `8dda750` | Every NEAR product in one column: observed, verified capture, or speculative |
| W2 Competition | `ac4da69` | NEAR Intents vs 15 cross-chain protocols on one definition |
| W1 Market opportunity | `d4405db` | Size, growth and cyclicality of the markets NEAR sells into |
| W8, W7, W9, verdict | `430616e` | Ten hypotheses tested by published rules; risks; self-challenge; rule-generated verdict |

Code: `src/lib/research/` (`ladder.ts`, `tokenomics.ts`, `valuation.ts`, `economy.ts`, `crosschain.ts`, `market.ts`, `hypotheses.ts`), sources in `src/lib/data/sources.ts` and `fastnear.ts`, generator `research/refresh.ts`, template `research/THESIS.template.md`. 90 unit and integration tests pass.

---

## 2. Methodology corrections to the earlier thesis

These changed numbers that were already published on the site.

1. **Inconsistent revenue basis.** NEAR's multiple (about 220x) used a 90-day run rate; peers used 365 days. Now every asset uses DefiLlama holders revenue (burns and buybacks), the same 90-day run rate and the same end date. NEAR: **212x** run rate, **521x** trailing year. The trailing year is shown but not used for NEAR because its window starts before buybacks began (23 February 2026). Peers on the same basis: Hyperliquid 19.5x, Tron 102x, Solana about 1,600x, Ethereum about 4,000x, BNB about 4,300x.
2. **Mismatched DEX denominator.** DefiLlama's "DEX" overview includes prediction markets (about $175B a year), launchpads, trading apps and bridges, and files NEAR Intents itself as a Bridge. The ladder now divides by the spot "Dexs" category only: $2.88T a year (run rate) vs $3.33T for the whole overview. Intents equals **1.71%** of spot DEX volume on the run rate, 1.13% on the trailing year. This is presented as a scale reference, not a market share.
3. **Platform premium in the main matrix.** Solana's multiple was a column of the cash-flow ladder and implied-price matrix. It is removed; the platform framework is separate and shows, per rung, the stablecoins and DeFi TVL NEAR would need at Ethereum, BNB, Solana and Tron ratios. The frameworks are never added together.
4. **Burns converted into Intents volume.** Required value to holders was converted entirely into Intents volume. Now burns are held at today's run rate ($1.06M a year) and only the remainder is converted, at Intents' buyback revenue per dollar of volume (0.042%).
5. **Swing wording.** The headline said growth moves the outcome more than valuation; the spreads were 11.0x vs 10.9x. Spreads within 1.25x are now reported as "about equal".
6. **Exploit status.** The site said the 1 October 2026 exploit was an Omni-interaction flaw with recovery unconfirmed. Re-verified (Decrypt, TechFlow/ChainCatcher summaries of the post-mortem, Crypto Briefing): the attacker returned about $3.8M on 2 October; the post-mortem (16 October) places the flaw in the Intents contract's deposit notification function, reports users compensated, a second flaw found on 7 October ($300,000 bounty), the function removed and an automatic balance invariant added. The official post-mortem itself (an X post) could not be fetched, so it is cited through summaries and labelled REPORTED.

---

## 3. Findings

### 3.1 Markets (W1)

| Market | 2021 | 2025 | Last 12 months | Growth |
|---|---|---|---|---|
| Spot DEX volume (DefiLlama "Dexs") | $1.84T | $4.70T | $2.90T | 26% a year 2021 to 2025 |
| Cross-chain swap volume (DefiLlama bridge categories) | ~0 | $10.5B | $42.3B | not computed (thin early coverage) |
| Bridge aggregators | n/a | $20.0B | $31.9B | not computed |
| Stablecoin supply (year end) | $162B | $304B | $290B | 17% a year 2021 to 2025 |
| AI-agent payments (x402) | n/a | n/a | $44M | starts 2025 |

- Spot DEX volume is cyclical: the last 12 months are 38% below calendar 2025; the worst year since 2021 was 52% below the previous peak.
- Intents is 78% of DefiLlama's cross-chain swap categories, a share overstated by coverage (many competitors have no volume adapter).
- The five largest spot DEX families handle 52% of spot volume.
- x402 is too small and new to size NEAR AI's market.

### 3.2 Discovery: data coverage

- DefiLlama's bridges API (bridge volume by protocol) now requires a paid plan (HTTP 402). Per the scope, no data was bought.
- Relay, deBridge, Mayan, Across and Stargate have fee adapters but no volume adapter; they are compared on revenue only.
- Relay's DefiLlama "fees" include swap costs and are not comparable; its revenue ($17.6M a year) is close to Intents' ($20.6M).
- THORChain and Chainflip are filed under spot "Dexs", so they sit inside the spot denominator.
- NearBlocks' free tier could not page the buyback wallet's history (rate limit, and date filters appear to be exclusive); FastNEAR's transaction API was used instead.
- Lineage: DefiLlama's NEAR Intents adapter and NEAR's revenue dashboard share Dune queries, so they are not independent of each other. The executed-buyback check (FastNEAR) is independent of both.

### 3.3 NEAR's economy (W3)

| Product | Observed activity | Verified capture for $NEAR | Column |
|---|---|---|---|
| NEAR Intents | $49.1B volume a year, +230% year over year (90d vs same 90d a year earlier); $76.1M fees, $20.6M captured | Executed buybacks $13.9M a year | Verified |
| NEAR L1 | ~742K transactions, ~72K active accounts a day; transactions -84%, active accounts -75%, gas fees -52% year over year | Burns $1.06M a year | Verified |
| Staking | 44% of supply staked, 354 validators | None (redistribution) | Observed |
| Chain Signatures | MPC network of 16 participants, threshold 11, 8 domains; ~468K v1.signer transactions in October | None verifiable | Observed |
| Ecosystem apps (RHEA etc.) | $165M DeFi TVL (+41% year over year), $131M stablecoins | None (app revenue) | Observed |
| NEAR AI | No public usage or revenue dataset found | None | Speculative |
| Treasury | Reported only | None | Observed |

- **Fees on the NEAR chain, last 30 days:** NEAR Intents 86%, RHEA family 12%, NEAR gas 2%.
- **93% of verified value capture** comes from Intents buybacks.
- Caveat: the L1 decline may partly be automated or incentive-driven activity ending; this cannot be classified without BigQuery (H7).

**Interpretation (P2):** NEAR behaves less like an L1 valued on its on-chain economy and more like the token of a single cross-chain execution business.

### 3.4 Token economics (W4)

**Executed vs designated buybacks.** Every transfer into `buybacks.multisignature.near` was read from FastNEAR (3,344 transfers) and valued at each day's price (CoinGecko daily, DefiLlama as fallback; DefiLlama misses 21 days in 2026).

| Measure | Value |
|---|---|
| NEAR bought via the documented route (`intents.near` withdrawals), since 23 April 2026 | 1.74M NEAR, $4.86M, average $2.79 |
| Designated by DefiLlama over the same period (from 23 February 2026) | $8.06M |
| Executed / designated, documented route | **60%** |
| Plus `1csfundsadmin.sputnik-dao.near` (name suggests NEAR Intents' 1Click service; not documented as a buyback route) | $1.18M; **75%** combined |
| Run rate, executed vs designated (same 90 days) | $13.9M vs $20.8M a year |
| Wallet balance / NEAR received | 99.6% (held, not burned) |

No execution appears in February or March, although designation began on 23 February. Monthly execution has run at about 66% to 79% of the designation since May.

**Value-capture taxonomy (per year):**

| Flow | Per year | Classification |
|---|---|---|
| Intents fees | $76.1M | Source, not captured |
| NEAR gas fees | $1.5M | Source, not captured |
| Designated buybacks | $20.8M | Label, not a transaction |
| Executed buybacks | $13.9M | Value capture |
| Gas burned | $1.1M | Value capture |
| Staking emissions | $114.9M | Redistribution |
| Net issuance | $113.3M | Dilution |
| **Verified capture minus net issuance** | **-$98.3M** | Net value to holders |

**Staking:** 44.4% staked; realized gross issuance 2.50%, all to stakers (protocol_reward_rate = 0); nominal yield 5.6% before commission; a staker's share of supply grows 3.1% a year, a non-staker's changes by -2.4%.

**Dilution across alternatives** (CoinGecko circulating supply = market cap / price, one method for all; one-day changes above 5% treated as reclassification events; held buybacks subtracted only for NEAR, whose bought tokens still count as circulating; burns not added back, to avoid double counting):

| Asset | Dilution net of capture | FDV / market cap |
|---|---|---|
| HYPE | +0.2% (as reported -11.6%, three one-day events incl. Assistance Fund recognition) | 3.97x |
| ETH | +0.8% | 1.00x |
| BTC | +0.9% | 1.00x |
| SOL | +1.5% (as reported +6.7%, one +5.2% event on 12 March) | 1.08x |
| **NEAR** | **+2.2%** | 1.00x |
| AVAX | +4.4% | 1.06x |
| SUI | +12.5% | 2.42x |
| TON | +14.8% | 1.85x |
| APT | +22.6% | 1.37x |

### 3.5 Valuation (W5)

**NEAR's own multiple over time:** about 1,160x in December 2025 (before buybacks) to 219x (designated basis) or 319x (executed basis) at the latest month-end.

**Sensitivity of NEAR's implied 2036 price** (base: 20% a year Intents growth, NEAR's own multiple, today's buyback revenue per dollar and burns; base $16.27):

| Input | Low / high | High / low |
|---|---|---|
| Intents growth | 10% / 30% a year: $6.89 / $36.05 | 5.2x |
| Valuation multiple | 0.5x / 1.5x today's | 3.0x |
| Buyback revenue per $ of volume | 0.5x / 1.5x | 3.0x |
| Supply rule | 2.5% / HSP-029 | 1.08x |
| Gas burns | 0x / 5x | 1.04x |

**Cash-flow multiple each rung would need:**

| Rung | Low growth (10%) | Base (20%) | High (40%) |
|---|---|---|---|
| $10 | 308x | 131x | 28x |
| $25 | 770x | 326x | 70x |
| $50 | 1,541x | 653x | 141x |
| $100 | 3,082x | 1,306x | 281x |

Cash-flow tokens trade at 19.5x (Hyperliquid) to 102x (Tron). $100 at base growth needs a platform-level multiple; at high growth it still needs 281x.

**Platform framework:** $100 would need $47.4B of stablecoins on NEAR at Solana's ratio (362x today's $131M), or $88.7B at Ethereum's.

### 3.6 Competition (W2)

| Protocol | Volume a year | Revenue a year | Revenue per $ volume | Token | Market cap / revenue | Market cap / holders revenue |
|---|---|---|---|---|---|---|
| **NEAR Intents** | $49.1B (+230%) | $20.6M | 4.20 bp | NEAR | 223x | 223x |
| THORChain | $25.2B (+68%) | $8.9M | 3.52 bp | RUNE | 22x | 431x |
| Chainflip | $7.9B (+21%) | $4.5M | 5.76 bp | FLIP | 7.5x | 7.5x |
| Maya | $2.3B | $0.3M | 1.26 bp | none | | |
| Unit | $24.0B | $6.1M | 2.54 bp | none | | |
| Relay | not tracked | $17.6M | | none | | |
| deBridge | not tracked | $6.4M | | DBR | 13.5x | 17x |
| Mayan | not tracked | $7.8M | | none | | |
| Stargate | not tracked | $4.1M | | STG | 3.0x | |
| LI.FI (aggregator) | $16.2B (+149%) | $3.0M | 1.86 bp | none | | |
| LayerZero (messaging) | | $0.8M | | ZRO | 796x | 796x |

- Intents handles 58% of volume among cross-chain swap venues with public volume (overstated: protocols without volume adapters are missing).
- Intents has the highest revenue of the 15 protocols compared; Relay is close.
- **Cross-chain execution tokens trade at a median 7.5x revenue (17x holders revenue); NEAR at 223x Intents revenue.** At the peer median, Intents revenue supports about $155M of market cap, about $0.12 a token, against $4.6B.
- Messaging layers are kept out of the execution median (ZRO 796x), which makes the comparison stricter for NEAR.

### 3.7 Opportunity cost and risk (W6)

Driver growth needed every year for ten years (each asset's own dilution included, valuation ratio held at today's level), vs observed growth over the last year:

| Asset | Valued on | 2.8x / 7x / 14x / 28x | Observed, last year |
|---|---|---|---|
| BTC | market cap vs total crypto | needs 183% / 458% / 916% / 1,833% of today's total crypto | n/a |
| ETH | stablecoins and TVL | 11.8% / 22.5% / 31.3% / 40.7% | -31% |
| SOL | stablecoins and TVL | 12.5% / 23.3% / 32.1% / 41.6% | -24% |
| SUI | stablecoins and TVL | 24.7% / 36.6% / 46.4% / 57.0% | -44% |
| AVAX | stablecoins and TVL | 15.7% / 26.8% / 35.9% / 45.7% | -54% |
| TON | stablecoins and TVL | 27.3% / 39.5% / 49.5% / 60.2% | -46% |
| APT | stablecoins and TVL | 35.9% / 49.0% / 59.7% / 71.1% | -47% |
| HYPE | holders revenue | 11.1% / 21.8% / 30.5% / 39.9% | -24% |
| **NEAR** | Intents volume (cash flow) | 13.2% / 24.1% / 33.0% / 42.6% | +230% (platform route: stablecoins -23%, TVL +27%) |

Caveats stated in the thesis: one year of observed growth is dominated by the market cycle; TVL is in dollars; NEAR's driver is a young product from a small base while platforms' drivers are mature economies, so the comparison flatters NEAR.

| Asset | Vol 1y | Vol 3y | Max drawdown 3y | vs 3y peak | Corr. BTC 1y | Volume / cap |
|---|---|---|---|---|---|---|
| BTC | 40% | 48% | -53% | -41% | 1.00 | 1.5% |
| ETH | 58% | 71% | -68% | -57% | 0.87 | 3.4% |
| SOL | 64% | 87% | -76% | -68% | 0.75 | 3.9% |
| HYPE | 88% | 115% | -64% | -26% | 0.39 | 4.7% |
| **NEAR** | **116%** | 113% | -89% | -60% | 0.45 | 10.6% |

(SUI, AVAX, TON and APT in THESIS.md: volatility 74% to 96%, drawdowns -88% to -97%.)

### 3.8 Hypotheses (W8)

| | Hypothesis | Outcome | Reading |
|---|---|---|---|
| H1 | Value capture far more concentrated in one product than peers | **SUPPORTED** | Intents 86% of NEAR's fees vs peer median 39% for the largest protocol (TON 90%, APT 49%, HYPE 48%, SOL 39%, SUI 25%, AVAX 17%, ETH 13%) |
| H2 | Priced closer to a platform than its on-chain economy justifies | **SUPPORTED** | Market cap 35x stablecoins and 28x TVL vs Ethereum 1.9x / 6.1x, Solana 3.5x / 9.7x, BNB 6.6x / 18x, Tron 0.3x / 6.1x |
| H3 | Intents' take rate above cross-chain peers | **MIXED** | 4.20 bp vs median 2.54 bp; Chainflip higher (5.76 bp) |
| H4 | Value moving off the NEAR chain into cross-chain flows | **SUPPORTED** | Intents +230%; L1 transactions -84%, active accounts -75% (H7 caveat) |
| H5 | NEAR's dilution a higher hurdle than peers' | **NOT SUPPORTED** | 2.2% vs peer median 2.9%; but higher than BTC, ETH, SOL and HYPE |
| H6 | NEAR needs more growth than alternatives for the same multiple | **NOT SUPPORTED** | 24.1% vs median 26.8% for 7x; but more than ETH, SOL, HYPE |
| H7 | Most activity automated | UNTESTED | Needs BigQuery |
| H8 | Intents revenue depends on a few integrators or solvers | UNTESTED | Needs Intents Explorer API or BigQuery |
| H9 | Chain Signatures underpins Intents withdrawals | UNTESTED | Needs receipt-level data |
| H10 | NEAR's price mostly explained by BTC | **NOT SUPPORTED** | Correlation 0.45 (R-squared 21%); 0.62 before buybacks, 0.42 since; ETH 0.87 |

### 3.9 Risks (W7)

- Validator concentration: 9 validators hold a third of stake (Nakamoto coefficient); top ten hold 36%.
- Chain Signatures: 16 MPC participants, threshold 11.
- Buyback shortfall (40% of the designation not executed through the documented route).
- Re-rating toward cash-flow or cross-chain multiples.
- Integrator and solver concentration: not measured. Regulation: not assessed.

### 3.10 Verdict (generated by rules)

**Leads:** largest cross-chain swap venue with public volume (58%); highest revenue among cross-chain protocols; no supply left to unlock; dilution below the median alternative; most traded relative to size; less tied to BTC than ETH or SOL.

**Trails:** valued far above its on-chain economy; 223x Intents revenue vs 7.5x for cross-chain peers; L1 transactions -84%; most volatile asset compared (116%); diluted by $98M a year more than it captures; 60% of designated buybacks executed; value capture concentrated in one product.

**How far:** $100 in ten years needs either decade-long hypergrowth of one product at a multiple no cash-flow peer gets today, or NEAR becoming a platform whose on-chain economy does not exist yet.

**Summary rule output:** NEAR is a concentrated, high-volatility bet on one cross-chain product; for the same multiple it needs no more growth than the median alternative, but more than the largest ones.

---

## 4. Choices a reviewer should challenge

1. **Run rate vs trailing year.** The 90-day run rate is the primary basis because buybacks began in February 2026. It flatters a fast-growing product. All trailing-year values are shown alongside.
2. **Dilution net of capture.** Circulating supply growth excluding one-day events, minus held buybacks for NEAR only. Excluding one-day events can drop genuine unlocks (SOL's 12 March jump is a candidate); the as-reported column is next to it.
3. **Observed growth windows.** One year, matched 90-day windows; strongly cyclical. For platforms, observed growth is the mean of stablecoin and TVL growth.
4. **Peer set for the cross-chain multiple.** Execution protocols with a token: RUNE, FLIP, DBR, STG, SIS (small and illiquid tokens included). Messaging layers excluded. On holders revenue the median is 17x.
5. **NEAR's market cap includes the L1.** The 223x compares all of NEAR with Intents revenue only. The economy map finds little verified value elsewhere, but optionality is not priced.
6. **Executed buyback attribution.** Only `intents.near` withdrawals count as executed; the 1Click funds DAO is reported separately (75% if included).
7. **Thresholds.** H5 and H6 rules use the median of all alternatives, which includes high-dilution small caps. The readings add the large-cap comparison.
8. **Ten-year horizon and assumptions.** DEX market +20% a year, burns flat, buyback revenue per dollar flat, multiples persist. All published and adjustable in `src/lib/research/`.

## 5. Known gaps

- **H7–H9 untested:** need a Google Cloud project for BigQuery; H8 alternatively needs the Intents Explorer API.
- **Missing volume data:** Relay, deBridge, Mayan, Across and Stargate volume (paid API).
- **Not measured:** NEAR AI usage, foundation and treasury holdings, regulation.
- **Post-mortem source:** the official exploit post-mortem was read through summaries only.
- **Website not yet updated:** the homepage still shows the earlier layout. Simplifying it and adapting the debate come after this review.
