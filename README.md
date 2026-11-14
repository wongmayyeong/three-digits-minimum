# Three Digits, Minimum?

**An interactive, reproducible NEAR investment thesis that tests whether the economic evidence can support a $100 token valuation.**

[Live site](https://threedigits.xyz/) · [Repository](https://github.com/wongmayyeong/three-digits-minimum) · [Demo video on X](https://x.com/noxbuildsdegen/status/2121542034888819149) · [Full thesis](THESIS.md) · [Methodology](docs/METHODOLOGY.md) · [Reproducibility](docs/REPRODUCIBILITY.md)

NEAR HACKATHON 2026 · Investment Thesis track · MIT license

> Independent, educational research. Not financial advice, not a price prediction, not a recommendation to buy or sell NEAR. Not affiliated with the NEAR Foundation.

### At a glance

**Question.** Can NEAR reach $100, and what economic conditions would need to be true to justify that valuation?

**Verdict.** NEAR offers an interesting but highly conditional investment thesis, not a proven path to $100. The evidence does not justify calling $100 a *minimum*.

**Three strongest findings** (committed snapshot, 90 days to 10 Nov 2026):

1. **$100 needs a decade of hypergrowth.** At NEAR's current valuation multiple (212x), $100 in 2036 needs NEAR Intents volume to grow 44.0% a year for ten years; at 20% a year the same model implies about $16.
2. **Protocol growth is not tokenholder value.** Intents volume grew 230.1% year over year, but of the $8.01M of revenue DefiLlama designates for buybacks, 67.0% was traced onchain to the buyback wallet, where it is held, not burned. Net issuance (2.48% of supply a year) exceeds what that wallet absorbs (0.30%).
3. **Measured value is concentrated in one product.** NEAR Intents is 86.2% of the protocol fees DefiLlama attributes to the NEAR chain (cross-chain swap fees, not NEAR L1 gas), while NEAR trades at 223x Intents revenue against 7.55x–13.5x for cross-chain peer tokens.

**Try it:** [threedigits.xyz](https://threedigits.xyz/) · **Watch:** [demo video](https://x.com/noxbuildsdegen/status/2121542034888819149) · **Rebuild:** `npm ci && npm run research:rebuild`

---

## 1. Project overview

"Three digits, minimum." is a line attributed to NEAR co-founder Illia Polosukhin and repeated across the NEAR community. This project treats it as a claim to test, not a premise. It asks one question:

> **Can NEAR reach $100, and what economic conditions would need to be true to justify that valuation?**

Instead of forecasting a price, it builds a **price ladder** for ten years from now ($10, $25, $50 and $100) and computes what NEAR would have to achieve at each rung: market cap, value reaching tokenholders, NEAR Intents volume, growth rate and valuation multiple. Every condition is labelled **observed** in today's data, **assumed** by the model, or **unproven**.

**Who it is for:** investors and analysts evaluating NEAR as a long-term holding, and reviewers who want to check the work rather than trust it.

**How it differs from an analytics dashboard:**

- It starts from an investment claim and works backwards to the conditions it requires, instead of charting metrics.
- It separates protocol revenue, revenue *designated* for buybacks, NEAR *delivered* to the buyback wallet, and verified purchases, and never adds them together.
- It reconstructs NEAR's revenue wallets onchain, independently of the aggregator it checks.
- It argues both sides on the same frozen evidence (Bull vs Bear, scored by an Owl Judge), with every cited number checked by code.
- Every number can be rebuilt offline, byte for byte, from committed raw responses.

**Why the $100 claim is worth testing:** it is widely repeated, it implies a top-three crypto asset by market cap, and it can be decomposed into measurable requirements. A claim that specific can be checked every year.

## 2. Problem statement

1. **Price targets without a framework.** Crypto price targets are usually promoted without stating the adoption, revenue and valuation they assume.
2. **Required growth is rarely quantified.** Investors cannot easily see how much growth a future price needs, or for how long.
3. **Protocol adoption is not tokenholder value.** A product can grow while little of its revenue reaches the token.
4. **Labels are mistaken for transactions.** Revenue "designated for buybacks" is often read as executed buybacks, and held tokens as burned ones.
5. **Inconsistent comparisons.** Assets are compared on different metrics, windows and end dates.
6. **One-sided narratives.** Bull and bear cases are seldom tested against the same evidence.
7. **Unreproducible research.** Most investment research cannot be rebuilt by a reader.

Each of these leads investors to overpay for a narrative or to dismiss a real opportunity. The project addresses them with a fixed method; it does not claim to be the only research that does.

## 3. Solution

An integrated research framework that turns a narrative into:

| Output | Where |
|---|---|
| Testable economic assumptions (Layer A requirements, Layer B labels) | Home page ladder; [THESIS.md §6](THESIS.md#6-the-price-ladder) |
| Interactive valuation scenarios ($10 to $100, three cash-flow multiples) | Home page `#ladder` |
| Onchain evidence (revenue-wallet reconstruction from FastNEAR) | [THESIS.md §4.3](THESIS.md#43-where-the-designated-buybacks-went) |
| Token-value capture analysis (taxonomy, supply, staking) | [THESIS.md §4.2–4.4](THESIS.md#42-revenue-versus-tokenholder-value) |
| Comparable alternatives (cross-chain rivals, BTC, ETH, SOL, SUI, AVAX, TON, APT, HYPE) | [THESIS.md §7](THESIS.md#7-competitive-and-opportunity-cost-analysis) |
| Opposing arguments (Bull vs Bear, Owl Judge) | `/debates/[id]` |
| Reproducible calculations | `npm run research:rebuild` |

**This project does not predict NEAR's future price.** It evaluates what economic conditions would be necessary to support different valuations.

## 4. Research question

> Can NEAR justify $100 per token within a ten-year horizon, and what must happen to its adoption, economic value capture, token supply and valuation for that outcome to be plausible?

- **Why $100:** it is the claim being tested ("three digits"). The lower rungs show where requirements become demanding.
- **Horizon:** ten years from the data date (2036), long enough for a young product to mature.
- **Why "minimum" is stronger than "possible":** a minimum means even conservative assumptions reach $100. The thesis tests the conservative rows, not only the best case.
- **Observed vs assumed vs speculative:** evidence items are typed OBSERVED, DERIVED or REPORTED; scenario inputs (multiples, growth rates, DEX market growth) are ASSUMED; products with no measurable value capture (NEAR AI, Chain Signatures fees) are SPECULATIVE and given no dollar value.

$100 is not presented as a fair value or a target.

## 5. Investment thesis and verdict

Figures below are from the committed research snapshot: 90-day window ending **10 November 2026**, responses retrieved 8–12 November 2026 ([why the live site can differ](docs/LIMITATIONS.md#1-dataset-coverage-and-freshness)).

**Verdict** (fixed prose in [`src/lib/research/verdict.ts`](src/lib/research/verdict.ts), reviewed 14 Nov 2026 against data to 10 Nov 2026):

> NEAR presents a high-risk investment case supported by growing cross-chain activity through NEAR Intents, but its current valuation depends on assumptions that remain difficult to verify. […] NEAR offers an interesting but highly conditional investment thesis, not a proven path to $100.

The investment verdict carries no numeric confidence score. The supporting track-record rules (`three-digits-thesis-1.1.0`) read *Mixed evidence, low confidence*.

| | Strongest evidence |
|---|---|
| **Bull case** | Intents volume grew 230.1% year over year (matched 90-day windows); its revenue is reproduced onchain to 99.1% of DefiLlama's figure; Intents leads the cross-chain swap venues with public volume (58.1%); NEAR is verifiably reaching the buyback wallet ($13.8M a year) |
| **Bear case** | One product is 86.2% of the protocol fees DefiLlama attributes to the NEAR chain (cross-chain swap fees, not L1 gas); NEAR trades at 223x Intents revenue vs 7.55x–13.5x for cross-chain peers; only 67.0% of designated buybacks reached the buyback wallet, and it is held, not burned; net issuance (2.48% a year) exceeds buyback absorption (0.30%); L1 transactions fell 84.0% |
| **Unresolved** | Integrator and solver concentration (H8); automated vs organic L1 activity (H7); Chain Signatures' role in Intents (H9); volume of rivals that publish none (Relay, deBridge, Mayan) |
| **Would change the verdict** | Up: Intents growth above each rung's yearly checkpoint, deliveries reaching the designation, held NEAR burned, stablecoins and DeFi settling on NEAR. Down: fee compression, a re-rating toward cash-flow peers, a widening designated-to-delivered gap, another security incident |

**Technology, protocol, token.** A promising technology and a growing protocol are not the same as an attractively valued token. The evidence supports the first two in part; it does not establish the third. See [THESIS.md §12](THESIS.md#12-verdict-does-the-evidence-justify-calling-100-the-minimum).

## 6. Key findings

Window: 90 days ending 2026-11-10 unless stated. Evidence IDs resolve in [`artifacts/research/canonical.json`](artifacts/research/canonical.json).

| Metric | Value | Period | Source | Type | Interpretation / limitation |
|---|---|---|---|---|---|
| Intents volume, run rate | $49.08B a year | 90 days | DefiLlama `near-intents` | DERIVED | `INT-VOL-ANN`; annualized, not a forecast |
| Intents volume growth | +230.1% / +57.8% | 90 days / 30 days vs a year earlier | DefiLlama | DERIVED | `ECO-INTENTS-VOL-YOY`, `LAD-INTENTS-YOY`; growth depends heavily on the window chosen |
| NEAR L1 transactions | −84.0% | 90 days vs a year earlier | NearBlocks | DERIVED | `ECO-L1-TXNS-YOY`; part may be automated activity ending (H7, untested) |
| Intents share of protocol fees DefiLlama attributes to the NEAR chain | 86.2% | 30 days | DefiLlama fees overview | DERIVED | `ECO-INTENTS-FEE-SHARE`; mostly cross-chain swap fees paid on many chains, **not NEAR L1 gas** (NEAR's own gas is 2.0% of the same total) |
| Captured revenue, reproduced onchain | $7.94M vs DefiLlama $8.01M (99.1%) | 23 Feb–10 Nov 2026 | FastNEAR vs DefiLlama (Dune) | DERIVED | `TOK-REPRODUCTION-RATIO`; independent paths agree |
| Revenue **designated** for buybacks | $8.01M | 23 Feb–10 Nov 2026 | DefiLlama holders revenue | OBSERVED | `TOK-DESIGNATED-SINCE`; a label applied by date, not a transaction |
| NEAR **delivered** to the buyback wallet | 67.0% of designated | same | FastNEAR | DERIVED | `TOK-DELIVERED-ALL-VS-DESIGNATED`; valued at market prices on delivery days |
| **Verified market purchases** | not verified | | | | Swap inputs and prices need the Intents Explorer API; deliveries are verified, purchases are not |
| Kept in the front-end fund | $2.13M | 23 Feb–10 Nov 2026 | FastNEAR | OBSERVED | `TOK-FRONTEND-RETAINED`; captured revenue, not a buyback |
| Burned | 0% of delivered NEAR | snapshot | NEAR RPC | DERIVED | `TOK-WALLET-RECONCILE`: the wallet holds 100.0% of what it received |
| NEAR multiple (market cap / (burns + designated buybacks)) | 212x (309x on burns + delivered NEAR) | 90-day run rate | CoinGecko, DefiLlama | DERIVED | `LAD-MULT-TODAY`; Tron 102x, Hyperliquid 19.5x on the same basis |
| Market cap / Intents revenue | 223x | 90-day run rate | CoinGecko, DefiLlama | DERIVED | `CC-NEAR-CAP-INTENTS-REV`; peers 7.55x–13.5x; NEAR's cap also prices the L1 |
| Growth $100 needs at today's multiple | 44.0% a year for 10 years | to 2036 | model | DERIVED from ASSUMED inputs | `LAD-100-TODAY-CAGR`; holds today's multiple and take rate |
| Implied 2036 price at 20% growth | $16 (today's multiple), $7.85 (Tron's) | to 2036 | model | SPECULATIVE scenario | `LAD-IMPLIED-BASE-TODAY`; illustrative, not a forecast |
| Net issuance vs buyback absorption | 2.48% vs 0.30% of supply a year | 90 days | NearBlocks, FastNEAR | DERIVED | `SUP-NET-NEW-ANN-PCT`, `TOK-BUYBACK-ABSORPTION`; not netted against each other |
| Driver growth for 7x in ten years | NEAR 24.5% vs ETH 22.5%, SOL 23.3%, HYPE 21.8% | 10 years | model | DERIVED | A fixed-valuation comparison, not a probability |

Ten hypotheses were tested by published rules: **3 supported, 2 mixed, 2 not supported, 3 untested** ([THESIS.md §10](THESIS.md#10-ten-testable-hypotheses)).

## 7. How it works

The user journey on [threedigits.xyz](https://threedigits.xyz/):

1. **Open the dashboard** at `/`. The hero states the claim and the data date.
2. **Read the verdict** (`01 · The answer`): fixed verdict prose, four headline figures and "The investment case in four questions".
3. **Explore the Price Ladder** (`02 · The ladder`): choose a rung ($10, $25, $50, $100) and a cash-flow multiple (priced like Hyperliquid, priced like Tron, NEAR's multiple today).
4. **Examine the requirements**: market cap and rank, value to holders needed, Intents volume needed, growth needed, share of 2036 spot DEX volume, and each condition labelled Observed, Assumed or Unproven. Below it, the reverse table shows implied 2036 prices for 10%, 20% and 40% growth.
5. **Compare alternatives** (`03 · What the evidence shows`, `04 · Leads and trails`): cross-chain venues, ETH, SOL and HYPE, dilution and risk.
6. **Review the debate**: "Watch the debate" plays a recorded Bull vs Bear episode with the Owl Judge's scores.
7. **Inspect the evidence**: `/research` (every chart with its query and response hash) and `/methodology` (formulas, rules, calculator, limitations).
8. **Rebuild the research** with the commands in section 10.

### Try it yourself

| Do | See |
|---|---|
| Open https://threedigits.xyz/ and click **Explore the ladder** | The ladder with the $100 rung and "NEAR's multiple today" selected |
| Click **$25**, then **Priced like Tron** | Every requirement card updates; "Growth needed" reads about 35% a year with the live data, and each condition stays labelled Observed, Assumed or Unproven |
| Scroll to "The other direction" | Implied 2036 prices for low, middle and high growth under each multiple |
| Click **Watch the debate** | A full-screen recorded debate; the Bear challenges the $100 minimum claim, the Owl Judge scores both sides |
| Open https://threedigits.xyz/methodology#reproduce | The published snapshot's cutoff, retrieval times, model versions, deployed commit and download links |
| In the methodology **Calculator**, set "Annualized Intents volume (V)" to `100000000000` | The input's label changes from DERIVED to ASSUMED and "Volume multiple required" recomputes (about 2.1x with the live data) |
| Run `npm run research:rebuild` locally | `Reproducibility check: rebuild is byte-identical to the committed canonical.json` |

## 8. Why NEAR?

NEAR is an unusually instructive investment problem, not a convenient chain to build on:

- **One cross-chain product drives the token.** NEAR Intents settles swaps across many chains, yet its cross-chain swap fees are 86.2% of the protocol fees DefiLlama attributes to the NEAR chain, against 2.0% for NEAR's own L1 gas. NEAR may need to be valued like a cross-chain execution business rather than a traditional L1.
- **The Intents–token link is new and checkable.** Since 23 February 2026 Intents revenue is designated for $NEAR buybacks. That creates a measurable path from usage to tokenholders, and a measurable gap between the label and what arrives.
- **L1 activity and Intents diverge.** L1 transactions fell 84% while Intents volume grew 230%, which tests whether NEAR's base layer still matters for its valuation.
- **Supply dynamics are live.** 2.5% maximum issuance, 70% of gas burned, a held (not burned) buyback wallet, and HSP-029 pending validator adoption.
- **Chain abstraction is real but unpriced.** Chain Signatures (`v1.signer`, 16 MPC participants) runs in production, but no signing fee reaches $NEAR; NEAR AI has no public usage dataset. The thesis records both as optionality with no dollar value.
- **Competition is measurable.** THORChain, Chainflip, Maya, Relay, deBridge, LI.FI and others publish comparable DefiLlama data.

**Architecture, plainly.** This is an **offchain research application that reads public NEAR data**. It does not deploy a smart contract, hold funds, sign transactions, execute trades or settle anything on NEAR. NEAR-specific engineering:

- NEAR JSON-RPC calls (via FastNEAR) for supply, protocol config, validators, the buyback wallet's NEAR and wNEAR balances, and the `v1.signer` contract state;
- a transaction-level reconstruction of every NEAR and wNEAR flow into and out of `fefundsadmin.sputnik-dao.near`, `1csfundsadmin.sputnik-dao.near` and `buybacks.multisignature.near` from the FastNEAR transactions API (5,336 flows);
- NearBlocks monthly contract counts with detection of query-planner estimates;
- optional BigQuery SQL on `crypto_near_mainnet_us` and the NEAR Intents Explorer API (not part of the snapshot).

## 9. Methodology and data sources

- **Windows:** flow metrics use the 90 days ending the last complete day common to all series (10 Nov 2026); every multiple uses the same window and end date; trailing-year figures are shown as checks.
- **Collection:** one request catalog ([`src/lib/data/sources.ts`](src/lib/data/sources.ts)), paced and retried; each response is projected, stored with its SHA-256 and listed in a manifest.
- **Normalization:** 539 evidence items, each with value, unit, period, transform, inputs, source URL and response hash ([`src/lib/research/evidence.ts`](src/lib/research/evidence.ts)).
- **Evidence classes:** OBSERVED, DERIVED, REPORTED (in the snapshot) and ASSUMED (scenario inputs), plus SPECULATIVE in the economy map.
- **Missing data:** shown as unavailable with the reason; never estimated or substituted.
- **Onchain reconstruction:** every revenue-wallet flow read from FastNEAR, valued at that day's price, reconciled with DefiLlama over identical dates.
- **Valuation:** two frameworks (cash flow, platform) that are never added together.

| Provider | Integrated for | Credential |
|---|---|---|
| CoinGecko | Prices, market caps, supply, rankings | Optional key |
| DefiLlama | Intents volume, fees, revenue, holders revenue; peers; DEX categories; TVL, stablecoins; prices | None |
| NearBlocks | Daily activity and supply; monthly contract counts | Optional key |
| NEAR JSON-RPC (FastNEAR) | Supply, inflation, validators, buyback wallet, `v1.signer` | None |
| FastNEAR transactions API | Revenue-wallet flows | None |
| NEAR Intents Explorer | Integrator concentration (optional, not in snapshot) | Partner JWT |
| Google BigQuery | Signer and contract SQL (optional, not in snapshot) | GCP project |

Details: [docs/METHODOLOGY.md](docs/METHODOLOGY.md) and [docs/DATA_AND_QUERIES.md](docs/DATA_AND_QUERIES.md).

## 10. Reproducibility

Requirements: Node.js 22 or newer (`engines`; verified on Node 24.11.0, npm 9.9.4), git. No database, API key or network beyond `npm ci` is needed for the offline rebuild.

**A. Offline reproduction from stored snapshots (deterministic):**

```bash
git clone https://github.com/wongmayyeong/three-digits-minimum.git
cd three-digits-minimum
npm ci
npm run research:rebuild
git status --short artifacts THESIS.md
```

Expected (verified from a fresh clone):

```
Reproducibility check: rebuild is byte-identical to the committed canonical.json (sha256 3f16cb62c559b7be).
Wrote canonical.json (539 evidence items, 522 available), 20 chart datasets, dashboard.html and THESIS.md.
Window: 90 days ending 2026-11-10; peer window ends 2026-11-10.
```

and no output from `git status`. If any number changes, the command exits 1 with `Offline rebuild differs from committed output`.

Verify the 262 stored responses against their recorded hashes:

```bash
node -e "const fs=require('fs'),c=require('crypto');const m=JSON.parse(fs.readFileSync('artifacts/research/raw/manifest.json','utf8'));let ok=0,bad=[];for(const e of Object.values(m)){const t=fs.readFileSync('artifacts/research/raw/'+e.file,'utf8');c.createHash('sha256').update(t).digest('hex')===e.sha256?ok++:bad.push(e.file)}console.log(ok+' of '+Object.keys(m).length+' raw files match their manifest SHA-256'+(bad.length?'; mismatched: '+bad.join(', '):''))"
```

Expected: `262 of 262 raw files match their manifest SHA-256`.

**B. Fresh data collection (not deterministic):**

```bash
npm run research:refresh
```

This calls the live public APIs (CoinGecko, DefiLlama, NearBlocks, NEAR RPC, FastNEAR), may hit rate limits, and produces a new snapshot that will differ from the committed one. Integrator concentration and BigQuery analyses need credentials.

**Tests** (verified 14 Nov 2026): `npm test` passes 102 tests in 14 files (the integration test needs PostgreSQL, see [docs/REPRODUCIBILITY.md](docs/REPRODUCIBILITY.md#automated-tests)); `npm run typecheck` passes; `npm run lint` passes on the tracked code.

Full guide, troubleshooting and the web app setup: [docs/REPRODUCIBILITY.md](docs/REPRODUCIBILITY.md).

## 11. Technical implementation

```
Public sources (CoinGecko, DefiLlama, NearBlocks, NEAR RPC, FastNEAR)
  │  src/lib/data/sources.ts · fetcher.ts · fastnear.ts   (one catalog; paced, retried, SHA-256)
  ▼
Raw snapshots   artifacts/research/raw/*.json + manifest.json        (262 responses)
  │  src/lib/research/evidence.ts                                     (normalize, validate, type)
  ▼
Canonical evidence   artifacts/research/canonical.json                (539 items)
  │  ladder.ts · tokenomics.ts · valuation.ts · crosschain.ts · economy.ts
  │  market.ts · hypotheses.ts · triggers.ts · thesis.ts · verdict.ts (deterministic models)
  ▼
Outputs   THESIS.md · evidence-manifest.json · charts/ · dashboard.html   (research/refresh.ts)
  ▼
Web app (Next.js + PostgreSQL)   /  /research  /methodology  /debates/[id]
  └─ Debate: frozen snapshot → LLM turns (strict JSON) → code audit of citations and numbers → Judge
```

| Component | Implementation |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Recharts, Motion ([`src/app`](src/app), [`src/components`](src/components)) |
| Data ingestion | Request catalog, file and database raw stores, FastNEAR reconstruction ([`src/lib/data`](src/lib/data)) |
| Models | Deterministic TypeScript; no AI writes any number, status or verdict ([`src/lib/research`](src/lib/research)) |
| Evidence and citations | Evidence IDs with source, period, transform and response hash; `/research` shows each chart's query |
| Debate | LLM-generated (OpenAI Responses API, model `gpt-6.1-sol` by default, or any OpenAI-compatible endpoint). Bull and Bear receive the same frozen snapshot, no browsing or tools; each turn is schema-validated JSON; [`src/lib/ai/verify.ts`](src/lib/ai/verify.ts) rejects unknown evidence IDs and flags numbers that match no snapshot value; the Judge's scores receive deterministic penalties. The debate never sets the investment verdict |
| Storage and jobs | PostgreSQL via Prisma; a Postgres job queue and a worker for debates, audio and the daily refresh ([`src/worker`](src/worker)) |
| Voices | OpenAI TTS or ElevenLabs reading the stored text; optional |
| Testing | Vitest unit and integration tests; Playwright end-to-end tests ([`tests`](tests)) |
| Deployment | Dockerfile, Railway ([`railway.json`](railway.json)), PostgreSQL; migrations run on start |

## 12. Demo and hackathon scope

**NEAR HACKATHON 2026 · Track: Investment Thesis**

- Website: https://threedigits.xyz/
- Repository: https://github.com/wongmayyeong/three-digits-minimum
- X demo submission: https://x.com/noxbuildsdegen/status/2121542034888819149

**Built for the hackathon.** The repository's first commit is dated 8 November 2026 and every commit falls inside the hackathon window (announcement 19 October to 14 November 2026), so there is no pre-hackathon baseline. The project began as an evidence-first AI debate arena for several NEAR theses (working name NEBUBE, visible only in early commit messages), was narrowed to one thesis, and became Three Digits, Minimum?.

| Status | Scope |
|---|---|
| Working | The full research pipeline and offline rebuild; the home page ladder, findings, hypotheses and verdict; `/research`; `/methodology` with calculator and reproduce section; three recorded debates (OpenAI `gpt-6.1-sol`, 13 Nov 2026; Bear won each, 93–88 and 94–91 twice) |
| Reproducible | Every number in THESIS.md and canonical.json, offline, byte-identical |
| Limited | The hosted site runs without the background worker, so it serves recorded debates and does not refresh data daily; its data was last refreshed 13 Nov 2026 |
| Not in the snapshot | Integrator concentration (Intents Explorer JWT), BigQuery signer analyses (H7–H9) |
| Out of scope | Smart contracts, trading, custody, price prediction, personalized advice |

## 13. Limitations and disclaimer

This is independent investment research, not financial advice. Price scenarios are conditional models, not forecasts or probabilities. Metrics depend on data-provider coverage and definitions (DefiLlama adapters, CoinGecko supply, NearBlocks counts). Transfers into the buyback wallet are verified deliveries; they do not prove executed open-market purchases, and the NEAR is held, not burned.

Full list: [docs/LIMITATIONS.md](docs/LIMITATIONS.md).

---

### Repository map

| Path | Contents |
|---|---|
| [THESIS.md](THESIS.md) | The full investment thesis (generated from [research/THESIS.template.md](research/THESIS.template.md)) |
| [docs/](docs) | [Methodology](docs/METHODOLOGY.md), [Data and queries](docs/DATA_AND_QUERIES.md), [Reproducibility](docs/REPRODUCIBILITY.md), [Limitations](docs/LIMITATIONS.md) |
| [artifacts/research/](artifacts/research) | `canonical.json`, `evidence-manifest.json`, `charts/`, `dashboard.html`, `raw/` |
| [research/](research) | Pipeline entry point, BigQuery CLI and SQL, research scope, audit log and early exploration |
| [src/](src) | Web app, data layer, research models, debate engine |
| [tests/](tests) | Unit, integration and end-to-end tests |

### Credits and AI disclosure

- Code was written with AI assistance (Claude Code). Debate turns are generated by an LLM at runtime and audited by code; no AI writes research numbers or the verdict.
- Character sprites (Bull, Bear, Owl Judge) and the studio background were generated with ChatGPT image generation from the prompts in [design/prompts.md](design/prompts.md), then processed by `scripts/slice-sprites.ts` and `scripts/process-assets.ts`. The logo mark was supplied by the author.
- Libraries: Next.js, React, Prisma, PostgreSQL, Zod, Motion, Recharts, Tailwind CSS, sharp, Vitest, Playwright and the packages in [package.json](package.json).
- Data: CoinGecko, DefiLlama, NearBlocks, NEAR JSON-RPC (FastNEAR), FastNEAR transactions API, NEAR announcements and governance. NEAR is a trademark of its owners.
