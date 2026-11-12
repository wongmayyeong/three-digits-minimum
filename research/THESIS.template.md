<!-- GENERATED FILE. Edit research/THESIS.template.md, then run `npm run research:rebuild`. Every figure is filled from artifacts/research/canonical.json. -->

# Three Digits, Minimum?

*How far can NEAR really go? An evidence-based NEAR price ladder.*

**Track:** NEAR HACKATHON 2026, Investment Thesis. **Data:** refreshed from public sources; flow metrics use the 90 days ending {{WINDOW_END}}. Numbers that could not be computed read "unavailable" instead of an estimate.

> Educational research, not financial advice. Not a price prediction. "Three digits, minimum." is a line attributed to NEAR co-founder Illia Polosukhin and repeated across the NEAR community; we use it as a hook and test it against data.

**The short answer.** {{LADDER_HEADLINE}}

---

## 1. The claim, and how we test it

"Three digits, minimum" means a NEAR price of $100 or more. We do not try to predict whether it happens. We build a **price ladder** for ten years from now: $10, $25, $50 and $100. For each rung we compute what NEAR would have to achieve (Layer A) and label every condition as **observed** in today's data, **assumed** by the model, or **unproven** (Layer B). Then we turn it around: under low, base and high growth and several valuation multiples seen in the market today, where does the price land?

NEAR's economic engine today is NEAR Intents, a cross-chain swap service. Part of every swap fee is captured by NEAR and, since February 2026, used to buy back $NEAR. The chain of value runs: Intents volume → fees → NEAR-captured revenue → buybacks (and gas burns) → token holders.

## 2. The dream: what $100 would mean

{{DREAM_TABLE}}

$100 is not a bigger pump; it is a different rank in crypto. Supply keeps growing, so $100 in ten years means a larger market cap than $100 today. HSP-029, approved by House of Stake on 2 November 2026, would cut maximum issuance from 2.5% to 1.6% over 24 months after a ~90-day buffer; it needs validator adoption and can be vetoed until 16 November, so the ladder uses today's 2.5% rule and shows HSP-029 alongside.

## 3. How the market values crypto assets

{{REGIMES_TABLE}}

Every row uses the same metric (DefiLlama holders revenue: burns and buybacks), the same {{LADDER_RUN_RATE_DAYS}}-day run rate and the same end date ({{LADDER_WINDOW_END}}). {{LADDER_BASIS_NOTE}}

There are two regimes, and they are kept in **two separate frameworks that are never added together**. **Cash-flow tokens** (Hyperliquid, Tron) are priced on what they pay holders; the ladder in sections 4 and 5 applies their multiples, and NEAR's own, to NEAR in ten years. **Platforms** (Ethereum, BNB, Solana) trade at thousands of times the value reaching holders because they are valued on the economy that lives on the chain; section 6 shows what that economy would have to be on NEAR. Multiples are assumptions, not forecasts.

## 4. The ladder: what each rung takes

Cash-flow framework. Each NEAR channel has its own driver: gas burns are held at today's run rate ({{LAD-NEAR-BURN-RUNRATE}} a year), and the rest must come from Intents buybacks at today's {{LAD-HOLDER-TAKE-RATE}} of volume. Each cell is the Intents volume a rung needs, as a fraction of 2036 **spot** DEX volume: DefiLlama's "Dexs" category only, today {{LAD-SPOT-DEX-RUNRATE}} a year (run rate), grown 20% a year (an assumption; it grew {{LAD-DEX-CAGR-2021-2025}} a year from 2021 to 2025). DefiLlama's full DEX overview ({{LAD-ALL-DEX-RUNRATE}}) also counts prediction markets, launchpads and bridges, including NEAR Intents itself, so it is not used. Intents equals {{LAD-INTENTS-DEX-SHARE}} of spot DEX volume today on the run rate ({{LAD-INTENTS-DEX-SHARE-365D}} over the last 365 days). This is a scale reference, not a market share: Intents is a cross-chain category, and some of its swaps also route through DEXs.

{{LADDER_TABLE}}

Bands, by how many times today's ratio to spot DEX volume Intents would need: **keeps today's size** (at most 1.5x), **up to 5x**, **5x to 10x**, **more than 10x**.

What would have to be true at each rung (NEAR's own multiple today):

{{CONDITIONS_TABLE}}

## 5. Where scenarios land

Implied price in ten years = (Intents volume grown from today's {{INT-VOL-ANN}} run rate x buyback revenue per dollar of volume + burns at today's run rate) x cash-flow multiple / supply in 2036. Growth rates are scenarios; nothing here is a forecast.

{{IMPLIED_TABLE}}

{{SWING_SENTENCE}}

## 6. The evidence

**Is NEAR Intents on the path?** Annual volume {{INT-VOL-ANN}} (90-day run rate); {{LAD-INTENTS-YOY}} year over year (latest 30 days); {{LAD-INTENTS-DEX-SHARE}} of spot DEX volume. Within the cross-chain protocols DefiLlama lists in its DEX overview it is {{LAD-INTENTS-CROSSCHAIN-SHARE}}, but that list misses most cross-chain competitors, so it overstates Intents' position; the full cross-chain comparison is a separate workstream. The volume Intents would need each year, at NEAR's own multiple today, for each rung:

{{CHECKPOINT_TABLE}}

**Could NEAR be valued as a platform instead?** A separate framework, never added to the cash-flow ladder. Platforms are valued relative to the money that lives on them. For each rung to look like these chains, this much would need to live on NEAR (in brackets: times NEAR today):

{{PLATFORM_TABLE}}

**Does the token capture value? (token economics)**

Every flow is classified before anything is added up. Only executed buybacks and burns count as value captured by $NEAR; revenue *designated* for buybacks is a label until the purchase happens onchain, staking rewards are paid in new tokens (redistribution from non-stakers), and net issuance is dilution.

{{TOK_TAXONOMY_TABLE}}

{{TOK_FINDINGS}}

**Executed versus designated buybacks.** The buyback swaps execute inside NEAR Intents, and the NEAR is withdrawn to `buybacks.multisignature.near`. Reading every transfer into that wallet (FastNEAR transaction API, exact yoctoNEAR; NearBlocks' free tier could not page the history) and valuing each day's NEAR at that day's price gives an independent check of DefiLlama's designation, which shares its Dune lineage with NEAR's own revenue dashboard. Since the first purchase on {{TOK_FIRST_RECEIPT}}: {{TOK-EXECUTED-NEAR}} bought ({{TOK-EXECUTED-USD}}, average price {{TOK-AVG-PURCHASE-PRICE}}) against {{TOK-DESIGNATED-SINCE}} designated, so {{TOK-EXECUTED-VS-DESIGNATED}} has arrived through the documented route. A second sender, the DAO `1csfundsadmin.sputnik-dao.near`, whose name points to NEAR Intents' 1Click service, sent {{TOK-AFFILIATED-USD}} of NEAR, mostly in one transfer in September; it is not documented as a buyback route, so it is shown separately: counting it, {{TOK-EXECUTED-BROAD-VS-DESIGNATED}} has been executed. Either way, executed purchases trail the designation, and no executions appear before April although designation began in February. The wallet still holds {{TOK-WALLET-RECONCILE}} of everything it received: bought NEAR is held, not burned, so total supply does not fall.

{{TOK_BUYBACK_TABLE}}

**Staking.** {{TOK-STAKING-RATIO}} of supply is staked. Realized gross issuance is {{TOK-GROSS-ISSUANCE}} a year and all of it goes to stakers (the protocol treasury share is zero), so the nominal staking yield is {{TOK-STAKING-NOMINAL}} before validator commission. After dilution a staker's share of supply grows {{TOK-STAKING-REAL}} a year, while a non-staker's share changes by {{TOK-NONSTAKER-REAL}}. Staking protects a holder from dilution; it does not create value.

**The same measures for every alternative.** Circulating supply growth is CoinGecko market cap divided by price, one method for every asset, so it includes unlocks. One-day changes above 5% are reclassifications or one-off recognitions (for example, Hyperliquid's Assistance Fund tokens being recognized as burned), so the comparable column chains daily changes without them. That can also drop a genuine one-day unlock (Solana's 12 March jump is one candidate), so the as-reported column stays next to it. Burns and recognized buybacks already lower circulating supply, so they are not added back as a yield; only NEAR's bought-back tokens, which are held and still counted as circulating, are subtracted. The result, dilution net of capture, is the share of the network a holder who does nothing loses each year to new supply. Holder yield is shown for context only. Price is excluded: this is token economics, not a return forecast.

{{TOK_ASSETS_TABLE}}

**Track record: did NEAR's earlier pivots last?** Each era's representative product against its own peak, exact data only. For busy contracts NearBlocks returns a query-planner estimate instead of a count in older months (its response carries a `cost` field); those months are excluded, which is why v1.signer starts in April 2026 and Intents is measured by DefiLlama volume.

{{ERA_TABLE}}

Product adoption after each mainnet launch (activity two months after launch, 2x needed; chain-wide accounts and price are context only):

{{EVENT_TABLE}}

## 7. The markets NEAR sells into

Each market is shown on its own definition and never added to another (the same funds can pass through a DEX, a bridge and an aggregator). Calendar years count only with at least 360 days of data; growth is reported from 2021, only across at least two years, and only when the first year is at least 5% of the last, because early coverage is thin.

{{MKT_TABLE}}

{{MKT_FINDINGS}}

## 8. NEAR's economy, product by product

Every product is investigated on its own and placed in one column: **observed** activity, **verified** value capture for $NEAR (executed buybacks or burns), or **speculative** opportunity (no measurable evidence yet, so no dollar value is assigned).

{{ECO_PRODUCT_TABLE}}

Fees paid on the NEAR chain by protocol, last 30 days (DefiLlama):

{{ECO_FEES_TABLE}}

{{ECO_FINDINGS}}

This is the central fact for valuing NEAR (priority finding P2): almost all of NEAR's economic activity and almost all of its value capture is one cross-chain product. The NEAR chain itself carries little paid activity. NEAR therefore behaves less like a traditional L1, valued on the economy that lives on it, and more like the token of a cross-chain execution business, valued on what that business returns to holders.

## 9. Competition: NEAR Intents against cross-chain rivals

If NEAR's value is mostly one cross-chain business, the relevant comparison is that business against its competitors, on the same DefiLlama definitions and the same 90 days. Volume is only available where DefiLlama has a volume adapter; Relay, deBridge, Mayan, Across and Stargate are compared on revenue (their volume would need a paid API, so it is left out rather than estimated). Categories are not added together: only swap venues enter the volume share, and aggregators, which route through those venues and through Intents itself, are listed separately.

{{CC_TABLE}}

{{CC_FINDINGS}}

Two readings follow, and the data cannot choose between them. Either the market prices NEAR for more than Intents (the L1, Chain Signatures, NEAR AI, optionality), which the economy map in section 7 does not find in today's activity or value capture. Or NEAR carries a premium over every cross-chain competitor that its cash flow does not yet justify. Either way, Intents' revenue alone does not explain NEAR's market cap.

## 10. Valuation: how NEAR is priced, and what moves it

**NEAR's own multiple over time.** Market cap on each month-end divided by the value reaching holders over the 90 days ending that day, annualized. NEAR is shown on two bases: DefiLlama's buyback designation, and the purchases actually executed onchain (section 6).

{{VAL_HISTORY_TABLE}}

**What moves NEAR's 2036 price most.** Base case: Intents grows 20% a year, NEAR keeps its own multiple, today's buyback revenue per dollar of volume and today's burns. Each input is moved on its own; the ranges are published assumptions.

{{VAL_SENSITIVITY_TABLE}}

**How much of each rung rests on the multiple alone.** The cash-flow multiple each rung would need under each growth scenario. Compare with NEAR's {{LAD-MULT-TODAY}} today, Tron's {{LAD-MULT-TRON}} and Hyperliquid's {{LAD-MULT-HYPERLIQUID}} (cash-flow tokens), and the platforms' thousands (section 3). Where the multiple needed is in platform territory, the rung depends on NEAR being re-rated as a platform, not on its cash flow.

{{VAL_NEEDED_TABLE}}

## 11. NEAR against the alternatives (opportunity cost)

Every investable alternative under the valuation method that fits it (section 3): BTC as a monetary asset, platforms on their on-chain economy, Hyperliquid on cash flow, NEAR on both. For the same price multiple in ten years, the asset's valuation driver has to grow by the same factor, plus enough to offset its own dilution (assumed to persist). Observed growth is the same driver over the last year. This is a side-by-side map, not a recommendation.

{{OPP_TABLE}}

{{VAL_FINDINGS}}

**Risk on common measures.** DefiLlama daily prices; volatility and correlation use returns between consecutive days only; liquidity is a one-day snapshot of trading volume over market cap.

{{RISK_TABLE}}

What this does not show: one year of observed growth is dominated by the market cycle (most chains' stablecoins and DeFi TVL fell, and TVL is measured in dollars, so it also falls with prices). NEAR's cash-flow driver is a young product growing from a small base, while the platforms' drivers are mature chain economies. NEAR's platform route, its own on-chain economy, is listed in the table's note column.

## 12. What could break it

| Risk | Effect on the ladder |
|---|---|
| Intents growth slows | Every rung depends on compounding volume for ten years |
| Fee competition | Halving the take rate doubles every volume requirement |
| The market prices NEAR like other cash-flow tokens | At Tron's multiple every rung needs {{LADDER_TRON_HARDER}} the value to holders |
| Supply keeps growing at 2.5% | $100 means a larger market cap |
| Value keeps leaving the NEAR chain | Rules out the platform-premium route (active accounts {{ACT-DAA-YOY}} year over year) |

**NEAR Intents exploit, 1 October 2026.** An attacker created about $3.8M of unbacked balances (USDT on BNB Chain) through a flaw in the Intents contract's deposit notification function, then withdrew real tokens. Intents paused within about half an hour and halted deposits and withdrawals on 11 networks. Early reports blamed the interaction with the Omni bridge; the team's post-mortem (16 October) places the flaw in the Intents contract itself. The attacker returned the funds on 2 October. The post-mortem says all affected users were compensated, a second flaw in the same function was found by a white-hat on 7 October ($300,000 bounty), the function was removed, and a check of user balances against contract holdings now pauses the contract automatically. These are press and team reports, not verified onchain here. Sources: [Decrypt](https://decrypt.co/380014/near-intents-recovers-3-8-million-after-48-hour-ultimatum), [post-mortem summary (TechFlow)](https://www.techflowpost.com/en-US/newsletter/140312), [The Block](https://theblock.co/news/ecosystems/2026-10-01-near-intents-halts-services-after-3-8-million-exploit-promises-full-compensation-417404).

Falsification triggers from the underlying research, evaluated on every rebuild:

{{TRIGGER_TABLE}}

## 13. Verdict: dream, possibility, or evidence?

{{LADDER_HEADLINE}}

- **What we know:** NEAR Intents is real, growing ({{LAD-INTENTS-YOY}} year over year) and already returns {{VAL-NEAR-VALUE-CAPTURE-ANN}} a year to $NEAR; NEAR is valued at {{LAD-MULT-TODAY}} that revenue.
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
| NEAR Intents Explorer API | Optional, partner JWT; integrator concentration ({{INT-EXPLORER-TOP5-SHARE}}) |

Methodology versions: ladder `three-digits-1.0.0`, evidence `nebube-evidence-1.1.0`, model `nvabe-1.0.0`, evidence rules `nebube-thesis-1.1.0`.

## Appendix: evidence register

{{EVIDENCE_REGISTER}}
