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
- **Crypto has two valuation regimes.** Ethereum, BNB and Solana trade at 2,000x to 5,600x the revenue that reaches holders (platform premium); Tron and Hyperliquid at 26x to 90x (cash flow). NEAR sits in between at about 220x its burns plus NEAR Intents buybacks.
- **The ladder.** At today's valuation premium, $25 needs NEAR Intents to win up to 5x its share of DEX volume (about 1% today); $100 needs about 9% of all DEX volume in ten years. Priced like a cash-flow token, $100 needs about 22%.
- **Reverse view.** Growth scenarios times valuation multiples put the ten-year price anywhere from below today's price to three digits. Intents growth moves the outcome slightly more than the valuation multiple does.
- **Checkpoints.** The yearly Intents volume each rung requires, so the thesis can be checked every year instead of argued once.
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

Pages: `/` (the thesis and price ladder), `/research` (every chart with its query and response hash), `/methodology` (ladder formulas, rules, calculator, AI audit, limitations).

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
| Unit and integration tests (real Postgres) | `npm test` | 63 passed |
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
