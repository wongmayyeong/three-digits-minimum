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

There are two regimes. The largest platforms (Ethereum, BNB, Solana) are not priced on the revenue that reaches holders at all; they carry a **platform premium** for being where money lives. **Cash-flow tokens** (Hyperliquid, Tron) are priced on what they pay holders. A three-digit NEAR has to come from one of the two. The ladder applies each of these multiples to NEAR in ten years. They are assumptions, not forecasts.

## 4. The ladder: what each rung takes

Share of the 2036 DEX market NEAR Intents would need, by rung and valuation. The DEX market is today's {{LAD-DEX-VOL-365D}} a year grown 20% a year (an assumption; it grew {{LAD-DEX-CAGR-2021-2025}} a year from 2021 to 2025). Intents handles {{LAD-INTENTS-DEX-SHARE}} today, at a take rate of {{INT-TAKE-RATE}} of volume.

{{LADDER_TABLE}}

Bands: **keeps share** (at most 1.5x today's share), **up to 5x share**, **5x to 10x share**, **10x+ share**. The Solana column shows how little revenue matters if NEAR earned a platform premium; section 6 shows what that premium would require.

What would have to be true at each rung (today's valuation premium):

{{CONDITIONS_TABLE}}

## 5. Where scenarios land

Implied price in ten years = Intents volume grown from today's {{INT-VOL-ANN}} run rate x take rate x valuation multiple / supply in 2036. Growth rates are scenarios; nothing here is a forecast.

{{IMPLIED_TABLE}}

{{SWING_SENTENCE}}

## 6. The evidence

**Is NEAR Intents on the path?** Annual volume {{INT-VOL-ANN}} (90-day run rate); {{LAD-INTENTS-YOY}} year over year (latest 30 days); {{LAD-INTENTS-DEX-SHARE}} of all DEX volume. The volume Intents would need each year, at today's valuation premium, for each rung:

{{CHECKPOINT_TABLE}}

**Could NEAR earn a platform premium instead?** Platforms are valued relative to the money that lives on them. For a $100 NEAR to look like these chains:

{{PLATFORM_TABLE}}

**Does the token capture value today?**

| Measure | Value |
|---|---|
| Buyback-designated Intents revenue per year (90-day run rate, DefiLlama classification) | {{SUP-BUYBACK-ANN}} |
| Realized net new supply per year (net of burns) | {{SUP-NET-NEW-ANN-PCT}} ({{SUP-NET-NEW-ANN-USD}} at today's price) |
| Buyback-designated revenue as a share of realized net new supply | {{COV-BUYBACK-REALIZED}} |
| Supply parity: volume needed for buyback revenue to match net new supply | {{SUP-PARITY-VOL}} ({{SUP-PARITY-MULTIPLE}} today) |
| Take rate: NEAR revenue per dollar of Intents volume (prior 90 days) | {{INT-TAKE-RATE}} ({{INT-TAKE-RATE-PRIOR}}) |
| Tokens held by the buyback wallet | {{ONC-BUYBACK-WALLET}} |
| Circulating market cap | {{MKT-NEAR-MCAP}} |

A buyback is not a burn: bought tokens are held, and total supply only falls if they are burned. DefiLlama's buyback designation is a classification ({{INT-BUYBACK-DESIGNATED-CUM}} so far); as an onchain cross-check, the buyback wallet holds {{ONC-BUYBACK-WALLET}}, worth {{ONC-BUYBACK-WALLET-VS-DESIGNATED}} of the designated amount at today's price.

**Track record: did NEAR's earlier pivots last?** Each era's representative product against its own peak, exact data only. For busy contracts NearBlocks returns a query-planner estimate instead of a count in older months (its response carries a `cost` field); those months are excluded, which is why v1.signer starts in April 2026 and Intents is measured by DefiLlama volume.

{{ERA_TABLE}}

Product adoption after each mainnet launch (activity two months after launch, 2x needed; chain-wide accounts and price are context only):

{{EVENT_TABLE}}

## 7. What could break it

| Risk | Effect on the ladder |
|---|---|
| Intents growth slows | Every rung depends on compounding volume for ten years |
| Fee competition | Halving the take rate doubles every volume requirement |
| The market prices NEAR on cash flow | At Tron's multiple every rung is about 2.4x harder |
| Supply keeps growing at 2.5% | $100 means a larger market cap |
| Value keeps leaving the NEAR chain | Rules out the platform-premium route (active accounts {{ACT-DAA-YOY}} year over year) |

**NEAR Intents exploit, 1 October 2026.** NEAR Intents paused deposits and withdrawals on 11 networks after an exploit of about $3.8M, caused by a flaw in how its Omni deposit and withdrawal service interacted with the Intents contract; the flaw was reported as patched and the team pledged full compensation. Recovery has not been independently confirmed. Sources: [The Block](https://theblock.co/news/ecosystems/2026-10-01-near-intents-halts-services-after-3-8-million-exploit-promises-full-compensation-417404), [recovery status](https://en.coinotag.com/near-intents-exploit-climbs-to-3-8m-pausing-near-cross-chain-swaps).

Falsification triggers from the underlying research, evaluated on every rebuild:

{{TRIGGER_TABLE}}

## 8. Verdict: dream, possibility, or evidence?

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
