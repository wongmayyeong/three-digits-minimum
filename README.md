# Is NEAR Building the Future or Following the Hype?

*Every pivot, tested against the evidence.* A reproducible NEAR investment thesis for the NEAR HACKATHON 2026 Investment Thesis track. **The thesis is the deliverable:** read [THESIS.md](THESIS.md), open `artifacts/research/dashboard.html`, or rebuild every number with `npm run research:rebuild` (no database or API keys needed). The web app presents the same research live, opened by an AI Bull vs Bear debate whose every citation and spoken number is checked against a frozen evidence snapshot.

Educational research, not financial advice. Not affiliated with the NEAR Foundation.

## Quick start (local)

```bash
npm install
npm run db:local          # embedded PostgreSQL on :54339 (keep running)
cp .env.example .env      # set DATABASE_URL (printed above) and, for debates, OPENAI_API_KEY
npx prisma migrate deploy
npm run worker            # background worker (debates, audio)
npm run dev               # http://localhost:3000
```

Without an LLM key, browsing, research pages and replays work, and "Start debate" is disabled with an explanation. For pipeline testing only, `NEBUBE_FIXTURE_LLM=1` enables a templated synthetic "LLM". It is refused in production, and its debates are labelled SYNTHETIC and hidden from the public library.

## Reproducible research

```bash
npm run research:refresh   # fetch live sources, rebuild artifacts/research/* and THESIS.md
npm run research:rebuild   # offline rebuild from committed raw responses; verifies byte-identical output
npm run research:bigquery  # optional, needs GOOGLE_CLOUD_PROJECT (dry-run + byte cap)
```

Outputs: `artifacts/research/raw` (projected responses + manifest with URLs, times, SHA-256), `canonical.json`, `evidence-manifest.json`, `charts/*.json`, `dashboard.html`, and `THESIS.md`.

## Architecture

- `src/lib/data`: request catalog (the only place URLs live), a paced, cached and retried fetcher, and raw stores (DB or files).
- `src/lib/research`: matched-window series math, the evidence builder (OBSERVED/DERIVED/REPORTED/ASSUMED), the break-even model, falsification triggers.
- `src/lib/ai`: provider adapters (OpenAI Responses, OpenAI-compatible chat, local fixture), strict JSON schemas plus Zod, prompts, the claim/number audit, and deterministic score penalties.
- `src/lib/debate`: snapshot freezing, the durable state machine (`PENDING → FETCHING → … → JUDGING → COMPLETE | PARTIAL | FAILED`), the Postgres job queue with leases, the SSE event log, replay timeline, report, rematch delta.
- `src/lib/audio`: ElevenLabs with-timestamps adapter, per-role voices, content-hash audio cache (DB or S3 storage).
- `src/worker`: background worker. `src/app`: pages and API routes. `prisma/`: schema and migrations.

API: `GET /api/topics`, `GET /api/topics/:slug/evidence-preview`, `POST /api/debates`, `GET /api/debates`, `GET /api/debates/:id`, `/events` (SSE), `/replay`, `/report[?format=md]`, `/delta`, `POST /rematch`, `POST /retry`, `POST /turns/:turnId/audio`, `GET /api/audio/:id`, `GET /api/health`.

## Data sources (verified 2026-11-07)

DefiLlama (NEAR Intents volume, fees, revenue, holders revenue; chain fees, TVL, DEX volume; RHEA; stablecoins), CoinGecko (market caps), NearBlocks (daily activity), NEAR RPC via FastNEAR (supply, inflation config, buyback wallet `buybacks.multisignature.near`). Optional: NEAR Intents Explorer (partner JWT) and BigQuery (`crypto_near_mainnet_us`; NEAR Lake upstream stopped indexing on 2026-03-24).

## Verification status

| Check | Result |
|---|---|
| `npm run lint` | passes |
| `npm run typecheck` | passes |
| `npm test` (unit + integration on real Postgres) | 49 passed |
| `npm run build` | passes |
| `npm run test:e2e` (desktop + mobile, fixture LLM, live sources) | 6 passed |
| `research:refresh` live / `research:rebuild` offline byte-identical | passed |
| Real OpenAI debate run | **not run: no OPENAI_API_KEY available** |
| ElevenLabs voices | **not run: no key**; adapter tested with a mocked provider |

See `.env.example` for every variable. License: MIT.

## Credits and AI disclosure

- Character sprites (Bull, Bear, owl Judge) and the debate studio background were generated with ChatGPT image generation from the prompts in [design/prompts.md](design/prompts.md), then sliced and processed by `scripts/slice-sprites.ts` and `scripts/process-assets.ts`. The logo mark was supplied by the author and processed by `scripts/process-logo.ts`. Source images are in `design/source/`.
- Code was written with AI assistance (Claude Code).
- Libraries: Next.js, React, Prisma, PostgreSQL, Zod, Motion, Recharts, Tailwind CSS, sharp, Vitest, Playwright and the packages listed in package.json.
- Data: DefiLlama, CoinGecko, NearBlocks, NEAR JSON-RPC (FastNEAR), NEAR announcements. NEAR is a trademark of its owners; this project is independent and not affiliated with the NEAR Foundation.
