# Three Digits, Minimum?

*How far can NEAR really go?* An evidence-based NEAR investment thesis for the NEAR HACKATHON 2026 Investment Thesis track.

"Three digits, minimum." is a line attributed to NEAR co-founder Illia Polosukhin and repeated across the NEAR community. We use it as a hook, not a prediction. Instead of forecasting a price, we built a **price ladder**: what NEAR would have to achieve for **$10, $25, $50 and $100 in ten years**, with every condition labelled as **observed** in today's data, **assumed** by the model, or still **unproven**.

**The thesis is the deliverable.** Read [THESIS.md](THESIS.md), open `artifacts/research/dashboard.html`, or rebuild every number yourself:

```bash
npm install
npm run research:rebuild   # offline, no database or API key; verifies byte-identical output
```

The web app presents the same research live, opened by an AI Bull vs Bear debate in which every citation and spoken number is checked by code against a frozen evidence snapshot.

Educational research, not financial advice. Not affiliated with the NEAR Foundation.

## What the research finds

All figures are regenerated from public data on every refresh; see THESIS.md for the current values and sources.

- **$100 means a different rank, not a bigger pump.** With ten more years of issuance, $100 is a market cap of about $168B: the third most valuable crypto asset today, excluding stablecoins.
- **Crypto has two valuation regimes, kept in separate frameworks.** On one basis for every asset (DefiLlama holders revenue, 90-day run rate, same end date), Ethereum, BNB and Solana trade at about 1,600x to 4,300x what reaches holders because they are valued on their on-chain economy; Tron and Hyperliquid at about 20x to 100x (cash flow). NEAR is at about 210x its gas burns plus Intents revenue designated for buybacks (about 520x on the trailing year, which predates buybacks).
- **The ladder.** At NEAR's own multiple, $25 needs Intents volume to grow up to 5x relative to spot DEX volume (about 1.7% today); $100 needs Intents volume equal to about 11% of spot DEX volume in ten years. Priced like Tron, $100 needs about 22%; priced like Hyperliquid, even $10 needs 5x to 10x.
- **Reverse view.** Growth scenarios times cash-flow multiples put the ten-year price anywhere from below today's price to about $75. Intents growth and the valuation multiple matter about equally.
- **Checkpoints.** The yearly Intents volume each rung requires, so the thesis can be checked every year instead of argued once.
- **NEAR's economy is one product.** NEAR Intents is about 86% of the fees DefiLlama attributes to the NEAR chain (cross-chain swap fees, not NEAR L1 gas) and about 93% of the value verifiably captured by $NEAR. NEAR L1 transactions fell about 84% in a year while Intents volume grew about 230%.
- **Buybacks, checked onchain.** DefiLlama labels all NEAR swept into three revenue wallets as buybacks from 23 February 2026. Reading every flow into and out of those wallets (FastNEAR) reproduces its figure to 99% and shows about 67% reaching the buyback wallet; the rest sits in a front-end fund or came from accounts other than Intents. Bought NEAR is held, not burned: net issuance (2.5% of supply a year) is larger than what the buyback wallet absorbs (0.3%).
- **Against cross-chain rivals.** Intents is the largest of the cross-chain swap venues with public volume and has the highest revenue of the protocols compared, but NEAR's market cap is about 220x Intents revenue, against 7.5x to 13.5x for small cross-chain peer tokens (a conditional comparison: NEAR's market cap also prices the L1 and its other products).
- **Against the alternatives.** Under a fixed-valuation model NEAR needs about as much driver growth for the same multiple as the median of BTC, ETH, SOL, SUI, AVAX, TON, APT and HYPE, more than the largest of them, with the highest volatility. Ten hypotheses were tested by published rules (three supported, two mixed, two not supported, three untested), and every correction from two external reviews is in `research/three-digits/AUDIT-LOG.md`.
- **Verdict.** NEAR offers an interesting but highly conditional investment thesis, not a proven path to $100.
- **Comparability fixes.** DefiLlama's "DEX" overview also counts prediction markets, launchpads and bridges, and lists NEAR Intents as a bridge, so shares use its spot "Dexs" category only. All multiples share one metric, window and end date.
- **Data quality caught along the way.** NearBlocks returns query-planner estimates instead of counts for busy contracts in older months (marked by a `cost` field). Every month is checked, and estimates are excluded from scoring.

## How the research works

| Layer | What it does | Code |
|---|---|---|
| Sources | One request catalog; the only place URLs live. Paced, cached, retried; every response stored with its SHA-256. | `src/lib/data/sources.ts`, `fetcher.ts`, `stores.ts` |
| Evidence | Normalized evidence items labelled OBSERVED, DERIVED, REPORTED or ASSUMED, each with source, period, transform and response hash. | `src/lib/research/evidence.ts` |
| Price ladder | Layer A (what each rung takes), Layer B (observed / assumed / unproven), reverse scenario matrix, checkpoints, generated headline. | `src/lib/research/ladder.ts` |
| Supporting evidence | Era durability on exact data only, product adoption from each mainnet launch, token value capture, buyback demand target model, falsification triggers. | `src/lib/research/thesis.ts`, `model.ts`, `triggers.ts` |
| Outputs | `canonical.json` (every number), `evidence-manifest.json`, `charts/`, `dashboard.html`, `THESIS.md` from `research/THESIS.template.md`. | `research/refresh.ts` |

The first exploration of the ladder, with its inputs, is kept in `research/three-digits/`.

## Reproduce

```bash
npm run research:refresh   # fetch live sources, rebuild artifacts/research/* and THESIS.md
npm run research:rebuild   # offline rebuild from artifacts/research/raw; fails if the output differs
npm run research:accept    # after an intentional methodology change, rewrite the committed outputs
npm run research:bigquery  # optional, needs GOOGLE_CLOUD_PROJECT (dry run and byte cap first)
```

Sources: CoinGecko (prices, market caps, rankings, total crypto market cap), DefiLlama (NEAR Intents volume, fees, revenue and buybacks; holder revenue for peer tokens; all-DEX volume; TVL and stablecoins by chain; historical prices), NearBlocks (monthly era transactions, daily activity, supply), NEAR JSON-RPC via FastNEAR (inflation, supply, buyback wallet `buybacks.multisignature.near`). Optional: NEAR Intents Explorer (partner JWT) and BigQuery (`crypto_near_mainnet_us`, SQL in `research/sql/`).

## Run the web app locally

```bash
npm install
npm run db:local           # embedded PostgreSQL on :54339 (keep running)
cp .env.example .env       # set DATABASE_URL and, for debates, OPENAI_API_KEY
npx prisma migrate deploy
npx tsx scripts/sync-raw-to-db.ts   # load the committed research data into the database
npm run worker             # background worker (debates, audio, daily refresh)
npm run dev                # http://localhost:3000
```

Pages: `/` (the verdict, the price ladder, six findings, leads and trails, hypotheses), `/research` (every chart with its query and response hash), `/methodology` (formulas, rules, calculator, the audit and limitations).

Without an LLM key, the thesis, research pages and replays work, and starting a debate is disabled with an explanation. For pipeline testing only, `NEBUBE_FIXTURE_LLM=1` enables a templated synthetic LLM; it is refused in production, and its episodes are labelled SYNTHETIC.

## The debate

Bull argues for three digits; Bear argues the range the evidence actually supports, which can include downside. Both receive the same frozen snapshot and model output, cite evidence by ID, and every claim and spoken number is audited by code before a turn is saved. The Judge scores argument quality, not investment merit; the investment verdict on the page comes from the ladder, never from the debate.

- `src/lib/ai`: provider adapters (OpenAI Responses, OpenAI-compatible chat, local fixture), strict JSON schemas with Zod, prompts, the claim and number audit, deterministic score penalties.
- `src/lib/debate`: snapshot freezing, the durable state machine, a Postgres job queue with leases, the SSE event log, replay timeline, report and rematch delta.
- `src/lib/audio`: ElevenLabs adapter with timestamps, per-role voices, content-hash audio cache.
- `src/components/theatre`: the debate stage, cast and playback.

API: `GET /api/topics`, `GET /api/topics/:slug/evidence-preview`, `POST /api/debates`, `GET /api/debates`, `GET /api/debates/:id`, `/events` (SSE), `/replay`, `/report[?format=md]`, `/delta`, `POST /rematch`, `POST /retry`, `POST /turns/:turnId/audio`, `GET /api/audio/:id`, `GET /api/health`.

## Verification

| Check | Command | Result |
|---|---|---|
| Lint | `npm run lint` | passes |
| Types | `npm run typecheck` | passes |
| Unit and integration tests (real Postgres) | `npm test` | 96 passed |
| End-to-end, desktop and mobile | `npm run test:e2e` | 7 passed |
| Offline rebuild is byte-identical | `npm run research:rebuild` | passes |
| Real OpenAI debate | | not yet run |
| ElevenLabs voices | | adapter tested with a mocked provider |

See `.env.example` for every variable. License: MIT.

## Credits and AI disclosure

- Character sprites (Bull, Bear, owl Judge) and the debate studio background were generated with ChatGPT image generation from the prompts in [design/prompts.md](design/prompts.md), then sliced and processed by `scripts/slice-sprites.ts` and `scripts/process-assets.ts`. The logo mark was supplied by the author and processed by `scripts/process-logo.ts`. Source images are in `design/source/`.
- Code was written with AI assistance (Claude Code).
- Libraries: Next.js, React, Prisma, PostgreSQL, Zod, Motion, Recharts, Tailwind CSS, sharp, Vitest, Playwright and the packages listed in package.json.
- Data: CoinGecko, DefiLlama, NearBlocks, NEAR JSON-RPC (FastNEAR), NEAR announcements and governance. NEAR is a trademark of its owners; this project is independent and not affiliated with the NEAR Foundation.
