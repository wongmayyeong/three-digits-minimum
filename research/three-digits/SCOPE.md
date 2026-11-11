# Research scope and methodology, revision 3.1 (approved scope with mandatory amendments)

**Title:** Three Digits, Minimum? **Core question:** How far can NEAR really go, and why might an investor choose it over the alternatives, or not?

**Stance.** An independent investment thesis with NEAR as the subject, not the client. It may conclude that NEAR is attractive, unattractive, or less attractive than an alternative, or identify a negative investment case. No outperformance is assumed and no $100 prediction is made. Educational research, not a recommendation to buy or sell any asset.

**Depth rule.** Scope is set by materiality, not convenience. The full W1 to W9 scope is kept; nothing material is skipped to save tokens or implementation time. A question is closed as "cannot be established" only after the alternative sources and methods listed for it have been tried, and the attempts are documented. Evidence that could change the investment conclusion is researched first and deepest.

**Deliverable rule.** The thesis must contain original, evidence-backed investment findings, not just a large metrics dashboard. Every major finding answers: why NEAR, or why not, compared with the alternatives?

---

## 1. Questions the thesis must answer

1. **Opportunity:** which crypto markets could grow materially in 5 to 10 years, and how large are they on measurable proxies?
2. **Position:** where does NEAR win, and where do competitors clearly outperform it, on comparable metrics?
3. **Economy:** what business activity happens across NEAR's whole ecosystem, how much of it verifiably creates value for $NEAR, and what is only a future possibility?
4. **Token:** how does ecosystem success reach token holders, net of dilution and supply overhang?
5. **Valuation and ladder:** what would $10, $25, $50 and $100 require under each valuation framework, and how much would rest on unpriced opportunities or on the multiple alone?
6. **Opportunity cost:** under the same rules, what must happen for NEAR and for each alternative to deliver a similar multiple, and at what risk?
7. **Why NEAR, or why not:** which assumptions an investor must hold to prefer NEAR, and what evidence would prove them wrong.
8. **Insight:** what does the evidence show that the market or a general NEAR introduction misses?

### Priority findings (researched first)

| | Question | Why it matters |
|---|---|---|
| P1 | NEAR's ecosystem creates value, but how much does $NEAR actually capture? Is its capture mechanism an advantage or a disadvantage against SOL, ETH and HYPE? | Separates "good technology" from "good token" |
| P2 | Is Intents growth changing NEAR's investment profile, for example a weak on-chain economy with growing cross-chain infrastructure revenue, an investment model unlike a traditional L1? | Tests whether NEAR should be valued like an L1 at all |
| P3 | To deliver 7x or 14x, what must happen for NEAR and for each competitor? Which conditions are supported by evidence and which are very hard to achieve? | The opportunity-cost answer investors actually need |

---

## 2. Evidence standards

| Label | Meaning |
|---|---|
| OBSERVED | Read from a primary source or an established aggregator, with URL, retrieval time and response hash |
| DERIVED | Computed here from observed values by a published formula |
| REPORTED | Stated by a third party (project, media, research firm) and not independently verified |
| ASSUMED | A modelling choice, stated and adjustable |
| SPECULATIVE | A possible future opportunity with no measurable evidence yet; never given a dollar value |

**Primary sources first.** Onchain data (NEAR RPC, BigQuery, explorers), contracts and governance, official dashboards. Aggregators (DefiLlama, CoinGecko, Dune, Token Terminal, Artemis) are used with their lineage recorded.

**Independent cross-validation (amendment 3).** Two sources count as independent only if they do not share an upstream: the same Dune query, the same indexer or the same adapter does not count twice. Every source records its lineage (for example, DefiLlama's NEAR Intents adapter uses Dune queries that also underlie NEAR's own revenue dashboard, so the two agreeing is not independent confirmation). Independent checks for headline figures come from different raw data: revenue and buyback wallets read onchain, BigQuery intents.near logs, the buyback wallet's actual purchase transactions.

**Comparability (amendment 6).** Matching dates is necessary but not sufficient. A comparison also requires the same metric definition, the same coverage (which protocols, chains and fee types are included) and the same statistical method (sum, mean, run rate). Defaults: last 90 and 365 complete days ending on the last day common to all series; growth compares the same window a year earlier; run rates are compared only with run rates. A series failing any condition is excluded from that comparison, and the exclusion is shown.

**Conflicting data (amendment 6).** When sources disagree beyond 10%, the cause is investigated (definition, coverage, timing, double counting) and reported. The figure used is the one whose method is best documented, never the one that favours NEAR.

**Missing data (amendment 7).** Nothing is estimated to fill a gap. An unavailable API does not end the investigation: alternative sources and methods are tried and every attempt is recorded with its outcome.

**Exact data only.** Estimates (such as NearBlocks query-planner counts) are flagged and never scored.

**Reproducibility (amendment 8).** Every significant number is regenerated by code from stored responses. After every workstream: tests pass, the offline rebuild is byte-identical, and the work is committed. An unavailable API or paid source never blocks unrelated research.

---

## 3. Comparison universe

Fixed before results are seen. Members are added if discovery shows they are material; none are removed for convenience.

| Role | Members |
|---|---|
| Investable alternatives (opportunity cost) | BTC, ETH, SOL, SUI, AVAX, TON, APT, HYPE, NEAR; plus a cash and stablecoin-yield baseline |
| Smart-contract platforms | Ethereum L1, Solana, Sui, Aptos, Avalanche, TON, Tron, BNB Chain, Hyperliquid L1, NEAR; Base and Arbitrum as Ethereum-ecosystem activity references |
| Cross-chain execution (NEAR Intents' market) | Full inventory from DefiLlama bridge, bridge-aggregator and cross-chain DEX categories, including THORChain, Chainflip, Maya, deBridge (DLN), Relay, Across, LI.FI, Mayan, Wormhole, Axelar, Stargate, Socket |
| Chain abstraction and signing (Chain Signatures' market) | Wormhole, Axelar, LayerZero, Lit Protocol, Particle, Squid; MPC and threshold-signing services with public usage |
| AI agent economy (NEAR AI's market) | Bittensor, Virtuals, ElizaOS ecosystem, Fetch.ai/ASI, Olas, x402 on Base and Solana, and other agent networks with public usage or revenue |

---

## 4. Asset-appropriate valuation (amendment 4)

Risk and return are compared with **common metrics** for every asset. Valuation uses **the method that fits each asset's economics**, so no asset is judged by a formula that does not apply to it.

| Asset type | Members | Valuation method | Not used |
|---|---|---|---|
| Monetary asset | BTC | Monetary metrics: market cap relative to gold and to total crypto, dilution, holder behaviour | Revenue or TVL multiples |
| Platform | ETH, SOL, SUI, APT, AVAX, TON, BNB, NEAR (as an L1) | Platform framework (section 5B) | Treating TVL as cash flow |
| Cash-flow token | HYPE, TRX, and NEAR on its verified value capture | Cash-flow framework (section 5A) | Platform premium |

NEAR is evaluated in **both** the platform and cash-flow frameworks, because which one fits NEAR is itself a finding (priority finding P2).

---

## 5. Two separate valuation frameworks (amendment 2)

The frameworks are never added together, and speculative products are never given a dollar value.

### 5A. Cash-flow framework
- **What counts:** only verified flows that remove $NEAR supply or create $NEAR demand from external activity (section 6): executed buybacks funded by external revenue and protocol burns. Each channel is modelled with its own driver (Intents volume and take rate; L1 fees and burn share).
- **Multiple:** market cap divided by verified value capture, benchmarked against cash-flow tokens on the same basis.
- **Consistency:** the revenue used to compute today's multiple is exactly the revenue projected forward. No mixing of burns into a multiple that is then converted back into Intents volume only.

### 5B. Platform framework
- **What counts:** the economy that lives on the chain: stablecoin supply, DeFi TVL, DEX volume, fees, users where comparable. These are measures of economic relevance, not cash flows.
- **Multiple:** market cap relative to those measures, benchmarked against platforms.
- **Use:** shows what NEAR would need on chain to be valued like each platform.

### 5C. The price ladder in each framework
Per rung ($10, $25, $50, $100 in ten years), under both supply paths:
1. Market cap and rank.
2. **Cash-flow framework:** the verified value capture required at each benchmark multiple; how much each verified channel could provide under sourced scenarios for its own driver; the remaining gap.
3. **Platform framework:** the on-chain economy required at each platform's ratios, against NEAR's today and its trend.
4. **Unpriced opportunities** (AI, Chain Signatures fees, new products): listed as qualitative upside with their evidence status, never converted to dollars.
5. How much of each rung depends on the multiple alone.

No rung is labelled as supported by evidence; each shows what it requires and what is observed.

---

## 6. Value-capture taxonomy (amendment 5)

Every token flow is classified before anything is summed. Only rows marked "economic value capture" can enter the cash-flow framework.

| Flow | What it is | Economic value capture? |
|---|---|---|
| External revenue | Fees paid by users of NEAR products (Intents fees, gas) | Source of value, not yet captured by holders |
| Revenue designated for buybacks | DefiLlama's classification of revenue intended for buybacks | No; a label, not a transaction |
| Executed buyback purchases | Actual onchain purchases of NEAR by the buyback wallet, reconstructed from transactions | Yes, demand funded by external revenue |
| Burns | NEAR permanently removed (share of gas fees) | Yes, supply reduction |
| Staking emissions | New NEAR issued to stakers | No; redistribution from non-stakers via dilution |
| Net issuance | Emissions minus burns | Dilution, subtracted |
| Token demand for use | NEAR needed for gas, storage, collateral, Intents settlement | Demand, measured separately; not revenue |
| Ecosystem app revenue (e.g. RHEA) | Revenue accruing to applications | No; not $NEAR value |

---

## 7. No double counting of volume (amendment from review)

The same funds can pass through Intents, a DEX and a bridge aggregator. Volumes from different categories are never added into one "market total". Where overlaps cannot be removed, each category is shown separately with its own definition, and any share calculation states which denominator it uses.

---

## 8. Workstreams (full scope, ordered by impact on the conclusion)

| Order | Workstream | Feeds priority finding |
|---|---|---|
| 1 | W4 Token economics and value-capture taxonomy | P1 |
| 2 | W5 Valuation in both frameworks, ladder | P1, P2, P3 |
| 3 | W6 Opportunity cost and risk | P3 |
| 4 | W3 NEAR economy map, every product | P1, P2 |
| 5 | W2 Competitive position | P2, P3 |
| 6 | W1 Market opportunity | P3 |
| 7 | W8 Insight search (hypotheses) | all |
| 8 | W7 Risks and red flags | all |
| 9 | W9 Self-challenge | all |

### W1. Market opportunity
Size, growth and cyclicality since 2020 of DEX spot volume, each cross-chain category (kept separate), stablecoin supply and transfers, AI agent payments and onchain users; market concentration and fee trends.

### W2. Competitive position
NEAR against the section 3 members on comparable metrics only. Platforms: fees, revenue, DEX volume, TVL, stablecoins and their growth, developer activity, users where comparable. Cross-chain: volume, fees, revenue, take rate, share within its own category and trend, quoted price competitiveness (public quote APIs or existing measurements, labelled REPORTED), reliability and incidents. Signing infrastructure: integrated chains and apps, signature volume, fees, security record. AI: users, agents, inference or payment volume, revenue where public. Output: where NEAR leads and where it clearly trails, with gap sizes.

### W3. NEAR economy map
Each product investigated independently, with sources tried in order:

| Product | Investigation | Sources, in order |
|---|---|---|
| NEAR L1 | Fees and burn share, transactions, active accounts, organic vs automated activity, relayer share, TVL, stablecoins, app concentration | NEAR RPC, BigQuery, NearBlocks (exact months), Pikespeak, DefiLlama, Dune |
| NEAR Intents and near.com | Volume, fees and revenue by source, take-rate trend, integrator and solver concentration, chain-pair flows, confidential share, NEAR-denominated share | DefiLlama, revenue.near.org, revenue and buyback wallets onchain, BigQuery intents.near logs, Intents Explorer API (if granted), Dune |
| Chain Signatures | Signature requests, requesting applications, fee schedule and destination, integrated chains, share of Intents withdrawals using it | v1.signer contract and receipts (BigQuery, RPC), contract source and docs, NearBlocks exact months |
| NEAR AI | Products, usage, pricing, revenue, onchain settlement, any value reaching $NEAR | near.ai and docs, onchain contracts, public dashboards, GitHub, announcements (REPORTED) |
| Staking and validators | Staking ratio, validator count and concentration, yield before and after HSP-029, validator economics | NEAR RPC (validators, protocol config), staking dashboards |
| Ecosystem applications | Largest apps by TVL, revenue and users; whether any value reaches $NEAR | DefiLlama, app dashboards, onchain data |
| Treasury and foundation | Holdings, spending, grants, sell pressure | Foundation reports (REPORTED), disclosed wallets onchain |

Each product is placed in one column: OBSERVED activity, VERIFIED value capture (section 6), or SPECULATIVE opportunity.

### W4. Token economics
Supply (realized issuance, burns, net dilution, HSP-029 status and effect, unlocks), holder concentration (top holders, exchange balances and flows, foundation and early-investor holdings), the value-capture taxonomy of section 6 with executed buybacks reconstructed from onchain purchases, and real staking yield after dilution for stakers and non-stakers. The same analysis for each investable alternative.

### W5. Valuation and the price ladder
Sections 4 and 5: both frameworks, NEAR's own cash-flow multiple over time since buybacks began, historical multiples for peers since at least 2023 where data allows, and a sensitivity analysis showing which input moves each result most.

### W6. Opportunity cost and risk
For every investable alternative, under its appropriate valuation method: what the same multiple (about 2.8x, 7x, 14x, 28x) requires; observed growth on comparable metrics; the required-versus-observed gap; and common risk metrics (1-year and 3-year volatility, maximum drawdown and recovery, correlation with BTC, liquidity, dilution). Output: a side-by-side map, not a ranking of what to buy.

### W7. Risks and red flags
Security incidents and their handling, centralization (validators, foundation, solvers, MPC nodes), regulatory exposure, dependency on single integrators, governance concentration, and early-warning evidence for each.

### W8. Insight search
Test these hypotheses, plus any discovery surfaces. Any outcome is reportable.

| | Hypothesis | Test |
|---|---|---|
| H1 | NEAR's value capture is far more concentrated in one product than peers' | Share of verified value capture from the largest single source, per asset |
| H2 | NEAR is priced closer to a platform than its on-chain economy justifies | Platform-framework ratios, NEAR vs peers, now and over time |
| H3 | Intents' take rate is above cross-chain peers, so fee pressure matters more than volume | Take rate per protocol on comparable definitions, and its trend |
| H4 | Value is moving off the NEAR chain into cross-chain flows the token only partly captures | NEAR L1 fees, TVL, stablecoins and users vs Intents growth and executed buybacks |
| H5 | NEAR's dilution is a higher return hurdle than peers' | Net supply growth per asset, before and after HSP-029 |
| H6 | NEAR needs more growth than some alternatives to deliver the same multiple | W6 gap per asset |
| H7 | Most of NEAR's reported activity is automated rather than organic | Signer classification (BigQuery), checked against published estimates with different methods |
| H8 | Intents revenue depends on a few integrators or solvers | Concentration from Intents Explorer or BigQuery logs |
| H9 | Chain Signatures underpins Intents' cross-chain withdrawals, so its value is real but invisible in token capture | Share of withdrawals signed via v1.signer |
| H10 | NEAR's price is mostly explained by BTC and the market, not its fundamentals | Regression of NEAR returns on market returns and on Intents growth, before and after buybacks |

### W9. Self-challenge
Before any conclusion is published: comparability (dates, definitions, coverage, method), lineage independence of every cross-check, sampling and survivorship bias, double counting, misleading proxies, alternative explanations for each finding, and the sensitivity of every verdict to its thresholds. Each check and its result is recorded in the methodology.

---

## 9. Sources, lineage and access

| Source | Use | Lineage note | Access |
|---|---|---|---|
| NEAR JSON-RPC | Supply, config, validators, accounts, wallets | Primary | Public |
| BigQuery `crypto_near_mainnet_us` | Signers, receipts, logs, retention, intents.near events | Primary (indexed chain data) | **Your Google Cloud project, with a spending cap** |
| NEAR Intents Explorer API | Integrators, solvers, flows | Primary (operator data) | Partner JWT, rate-limited; apply, do not block on it |
| revenue.near.org | Revenue by source | Shares Dune methodology with DefiLlama's adapter | Public |
| DefiLlama | Fees, revenue, holder revenue, volume, TVL, stablecoins, prices, bridges | Per-adapter; NEAR Intents uses Dune | Public |
| CoinGecko | Prices, market caps, supply, rankings, exchange data | Exchange-sourced | Public |
| Dune | Cross-checks and competitor metrics | Query-specific; record query IDs | Public queries |
| Token Terminal, Artemis | Standardized fundamentals | Their own pipelines | Free tiers only for now |
| NearBlocks, Pikespeak | NEAR explorer data | Independent indexers; exact counts only | Public, rate-limited |
| GitHub API | Developer activity | Primary | Public, rate-limited |
| Docs, governance, research reports (Messari, Blockworks, Electric Capital) | Mechanisms and context | REPORTED | Public |

**Access decisions:** use BigQuery once a GCP project with a spending cap is provided; apply for the Intents Explorer API while researching with public data in parallel; no paid data purchases until free and public sources are shown to be insufficient for a key question.

---

## 10. Verdict structure (rules published before the final numbers)

1. **Where NEAR leads and trails:** NEAR's rank on each comparable metric.
2. **NEAR's economy:** observed activity, verified value capture and speculative opportunities, per product.
3. **How far NEAR can go:** the ladder in each valuation framework, with unpriced opportunities listed separately.
4. **Why an investor might choose NEAR, or not:** for each alternative, the assumptions required to prefer NEAR and the required-versus-observed gap and risk on the same rules. NEAR may be described as more, similarly or less attractive than each peer, or as a negative case.
5. **What would prove it wrong:** measurable triggers in both directions.

Generated by code from the data; no AI writes any number, status or verdict. The debate argues over this research and never decides it.

---

## 11. Sequence

1. Correct the existing methodology: matched windows with definition and coverage checks, consistent revenue basis, platform premium separated into its own framework, value-capture wording, exploit status re-verified with independent sources. Test and commit.
2. Discovery: inventory competitors, data sources and their lineage; confirm access. Commit the inventory.
3. Workstreams in the order of section 8; after each: tests, byte-identical rebuild, commit.
4. W9 self-challenge.
5. Regenerate THESIS.md, the Research, Data & Queries and Methodology pages; review findings with you.
6. Only then: simplify the homepage and adapt the debate to the validated findings.

## 12. Needed from you

- A Google Cloud project ID with a spending cap, and how to authenticate, for BigQuery.
- Whether to apply for the Intents Explorer API key (partners.near-intents.org).
